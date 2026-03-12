import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, Button, Stack, Switch, FormControlLabel, TextField,
    Grid, CircularProgress, Alert, Snackbar, Tooltip, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';
import PageLayout from '../common/components/PageLayout';

const BackupManagerPage = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [settings, setSettings] = useState({
        backup_enabled: 'true',
        backup_time: '00:00',
        backup_retention_days: '15',
        google_drive_enabled: 'false'
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || window.location.origin;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [backupRes, configRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/backups`, { credentials: 'include' }),
                fetch(`${API_BASE}/api/admin/config`, { credentials: 'include' })
            ]);
            if (backupRes.ok) setBackups(await backupRes.json());
            if (configRes.ok) setSettings(prev => ({ ...prev, ...(await configRes.json()) }));
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load backup data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [API_BASE]);

    const handleRunBackup = async () => {
        setRunning(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/backups/run`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                setSnackbar({ open: true, message: 'Manual backup task started in background', severity: 'success' });
            } else {
                throw new Error('Failed to start backup');
            }
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        } finally {
            setRunning(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
                credentials: 'include'
            });
            if (res.ok) {
                setSnackbar({ open: true, message: 'Backup policy updated', severity: 'success' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
        }
    };

    const handleDownload = (id, filename) => {
        window.open(`${API_BASE}/api/admin/backups/download/${id}`, '_blank');
    };

    const formatSize = (bytes) => {
        if (!bytes || bytes === '0') return 'N/A';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = parseInt(bytes);
        let unitIndex = 0;
        while (size > 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    return (
        <PageLayout breadcrumbs={['Admin', 'Backup Manager']}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box mb={4} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#0F2D5C' }}>Backup Manager</Typography>
                        <Typography color="textSecondary">Automated system lifecycle & disaster recovery orchestration.</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                        onClick={handleRunBackup}
                        disabled={running}
                        sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, px: 4, borderRadius: 2 }}
                    >
                        Run Manual Backup
                    </Button>
                </Box>

                <Grid container spacing={4}>
                    {/* Policy Settings */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="#0F2D5C" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BackupIcon /> Backup Policy
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={3}>
                                    <FormControlLabel
                                        control={<Switch checked={settings.backup_enabled === 'true'} onChange={(e) => setSettings({ ...settings, backup_enabled: String(e.target.checked) })} />}
                                        label="Enable Automated Daily Backups"
                                    />
                                    <TextField
                                        label="Scheduled Backup Time (24h)"
                                        type="time"
                                        value={settings.backup_time}
                                        onChange={(e) => setSettings({ ...settings, backup_time: e.target.value })}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Retention Period (Days)"
                                        type="number"
                                        value={settings.backup_retention_days}
                                        onChange={(e) => setSettings({ ...settings, backup_retention_days: e.target.value })}
                                        fullWidth
                                    />
                                    <FormControlLabel
                                        control={<Switch checked={settings.google_drive_enabled === 'true'} onChange={(e) => setSettings({ ...settings, google_drive_enabled: String(e.target.checked) })} />}
                                        label="Cloud Backup (Google Drive)"
                                    />
                                    <Button variant="outlined" onClick={handleSaveSettings} fullWidth sx={{ borderRadius: 2 }}>
                                        Save Policy Changes
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Backup History */}
                    <Grid item xs={12} md={8}>
                        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#fbfbfb' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>TIMESTAMP</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>FILE STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>SIZE</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>STORAGE</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {backups.map((bk) => (
                                        <TableRow key={bk.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{new Date(bk.created_at).toLocaleString()}</Typography>
                                                <Typography variant="caption" color="textSecondary">{bk.filename}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={bk.status.toUpperCase()}
                                                    size="small"
                                                    color={bk.status === 'success' ? 'success' : 'error'}
                                                    sx={{ fontWeight: 'bold', fontSize: 10 }}
                                                />
                                            </TableCell>
                                            <TableCell>{formatSize(bk.size)}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Tooltip title="Local Storage">
                                                        <StorageIcon fontSize="small" color={bk.storage_type === 'local' || bk.storage_type === 'both' ? 'primary' : 'disabled'} />
                                                    </Tooltip>
                                                    <Tooltip title="Google Drive Cloud">
                                                        <CloudUploadIcon fontSize="small" color={bk.storage_type === 'cloud' || bk.storage_type === 'both' ? 'secondary' : 'disabled'} />
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleDownload(bk.id, bk.filename)} disabled={bk.status !== 'success'}>
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {backups.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <Typography color="textSecondary">No backup records detected.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
                </Snackbar>
            </Container>
        </PageLayout>
    );
};

export default BackupManagerPage;
