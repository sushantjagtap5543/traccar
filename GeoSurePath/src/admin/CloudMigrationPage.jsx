import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, TextField,
    Button, Stack, Grid, CircularProgress, Alert, Snackbar,
    Divider, Stepper, Step, StepLabel, Paper, LinearProgress,
    List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import TerminalIcon from '@mui/icons-material/Terminal';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LaunchIcon from '@mui/icons-material/Launch';
import PageLayout from '../common/components/PageLayout';

const steps = ['Server Config', 'Sanity Check', 'Full Snapshot', 'Data Transfer', 'Restore & Health'];

const MigrationPage = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [logs, setLogs] = useState('');
    const [config, setConfig] = useState({
        host: '',
        port: '22',
        username: 'ubuntu',
        password: '',
        privateKey: '',
        targetDir: '/opt/geosurepath_migrated'
    });
    const [jobId, setJobId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || window.location.origin;

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/migrations`, { credentials: 'include' });
            if (res.ok) setHistory(await res.json());
        } catch (err) {
            console.error('Failed to load history');
        }
    };

    useEffect(() => {
        fetchHistory();
        let interval;
        if (jobId) {
            interval = setInterval(async () => {
                const res = await fetch(`${API_BASE}/api/admin/migrations`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const currentJob = data.find(j => j.id === jobId);
                    if (currentJob) {
                        setLogs(currentJob.logs || '');
                        if (currentJob.status === 'completed') {
                            setActiveStep(4);
                            setJobId(null);
                            setSnackbar({ open: true, message: 'Migration completed successfully!', severity: 'success' });
                        } else if (currentJob.status === 'failed') {
                            setJobId(null);
                            setSnackbar({ open: true, message: 'Migration failed. Check logs.', severity: 'error' });
                        }
                        
                        // Map progress to steps
                        if (currentJob.progress < 20) setActiveStep(1);
                        else if (currentJob.progress < 40) setActiveStep(2);
                        else if (currentJob.progress < 70) setActiveStep(3);
                        else if (currentJob.progress < 100) setActiveStep(4);
                    }
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [jobId]);

    const handleInitiate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/migrations/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setJobId(data.jobId);
                setSnackbar({ open: true, message: 'Migration sequence initiated.', severity: 'info' });
            } else {
                throw new Error('Failed to start migration');
            }
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout breadcrumbs={['Admin', 'Cloud Migration Manager']}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#0F2D5C' }}>Cloud Migration Manager</Typography>
                    <Typography color="textSecondary">Orchestrate zero-downtime server transfers across AWS, Hetzner, Oracle, and Google Cloud.</Typography>
                </Box>

                <Grid container spacing={4}>
                    {/* Config Panel */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" gutterBottom color="#0F2D5C" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LaunchIcon /> Destination Server Config
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={2.5}>
                                    <TextField label="Server IP / Hostname" fullWidth value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} />
                                    <Stack direction="row" spacing={2}>
                                        <TextField label="SSH Port" sx={{ width: 120 }} value={config.port} onChange={(e) => setConfig({ ...config, port: e.target.value })} />
                                        <TextField label="Username" fullWidth value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} />
                                    </Stack>
                                    <TextField label="Password (Optional)" type="password" fullWidth value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} />
                                    <TextField label="SSH Private Key" multiline rows={4} fullWidth placeholder="Paste your private key here..." value={config.privateKey} onChange={(e) => setConfig({ ...config, privateKey: e.target.value })} />
                                    <TextField label="Target Directory" fullWidth value={config.targetDir} onChange={(e) => setConfig({ ...config, targetDir: e.target.value })} />
                                    
                                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                        Ensure the target server has <b>Docker & Docker Compose</b> installed and root/sudo permissions for the specified user.
                                    </Alert>
                                    
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        disabled={loading || jobId}
                                        onClick={handleInitiate}
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudSyncIcon />}
                                        sx={{ bgcolor: '#0F2D5C', py: 1.5, borderRadius: 2 }}
                                    >
                                        Initiate Live Migration
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Progress & Logs Panel */}
                    <Grid item xs={12} md={6}>
                        <Stack spacing={3}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                                <CardContent>
                                    <Stepper activeStep={activeStep} alternativeLabel>
                                        {steps.map((label) => (
                                            <Step key={label}>
                                                <StepLabel>{label}</StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                    {jobId && (
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="caption" color="textSecondary">Migration Progress</Typography>
                                            <LinearProgress sx={{ height: 8, borderRadius: 4, mt: 1 }} />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            <Paper sx={{ bgcolor: '#1e1e1e', color: '#00ff00', p: 3, borderRadius: 3, height: 400, overflow: 'auto', fontFamily: 'monospace', fontSize: '13px' }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TerminalIcon /> Real-time Migration Logs
                                </Typography>
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                                {logs ? logs.split('\n').map((line, i) => (
                                    <div key={i} style={{ marginBottom: 4 }}>{line}</div>
                                )) : (
                                    <Typography color="rgba(255,255,255,0.3)">Waiting for process initiation...</Typography>
                                )}
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Migration History */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Migration History Audit</Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>DESTINATION</TableCell>
                                                <TableCell>STATUS</TableCell>
                                                <TableCell>COMPLETED AT</TableCell>
                                                <TableCell>RESOURCES</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {history.map((h) => (
                                                <TableRow key={h.id}>
                                                    <TableCell>{h.destination_ip}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={h.status.toUpperCase()} 
                                                            size="small" 
                                                            color={h.status === 'completed' ? 'success' : h.status === 'failed' ? 'error' : 'warning'} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>{h.completed_at ? new Date(h.completed_at).toLocaleString() : 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1}>
                                                            <Tooltip title="DB Dump Included"><StorageIcon fontSize="sm" color="primary" /></Tooltip>
                                                            <Tooltip title="Verified Architecture"><VerifiedUserIcon fontSize="sm" color="success" /></Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
            </Container>
        </PageLayout>
    );
};

export default MigrationPage;
