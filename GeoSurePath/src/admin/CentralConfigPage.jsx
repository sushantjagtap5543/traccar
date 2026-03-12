import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Grid, Card, CardContent, TextField,
    Button, Stack, Switch, FormControlLabel, Divider, CircularProgress,
    Snackbar, Alert, Tab, Tabs
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import SmsIcon from '@mui/icons-material/Sms';
import SettingsIcon from '@mui/icons-material/Settings';

const CentralConfigPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState(0);
    const [config, setConfig] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || `http://${window.location.hostname}:8083`;

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/config`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load configuration', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
                credentials: 'include'
            });
            if (response.ok) {
                setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Central Config Panel</Typography>
                    <Typography variant="body2" color="textSecondary">Manage platform secrets, API keys, and global parameters</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 2, px: 4 }}
                >
                    Save All Changes
                </Button>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                    <Tab icon={<SecurityIcon />} label="Security & API" />
                    <Tab icon={<SmsIcon />} label="SMS & Notify" />
                    <Tab icon={<PaymentIcon />} label="Payments" />
                    <Tab icon={<SettingsIcon />} label="Global" />
                </Tabs>
            </Box>

            {tab === 0 && (
                <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>Administrative Secrets</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="JWT Secret Key"
                                    type="password"
                                    value={config.jwt_secret || ''}
                                    onChange={(e) => handleChange('jwt_secret', e.target.value)}
                                    helperText="Rotating this will logout all users"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Traccar Admin Password"
                                    type="password"
                                    value={config.traccar_admin_password || ''}
                                    onChange={(e) => handleChange('traccar_admin_password', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Master API Key"
                                    value={config.admin_api_key || ''}
                                    onChange={(e) => handleChange('admin_api_key', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {tab === 1 && (
                <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>Gateway Configuration</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Twilio SID"
                                    value={config.twilio_sid || ''}
                                    onChange={(e) => handleChange('twilio_sid', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Twilio Auth Token"
                                    type="password"
                                    value={config.twilio_auth_token || ''}
                                    onChange={(e) => handleChange('twilio_auth_token', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Twilio Number"
                                    value={config.twilio_number || ''}
                                    onChange={(e) => handleChange('twilio_number', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {tab === 2 && (
                <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>Razorpay Integration</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Razorpay Key ID"
                                    value={config.razorpay_key_id || ''}
                                    onChange={(e) => handleChange('razorpay_key_id', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Razorpay Secret"
                                    type="password"
                                    value={config.razorpay_secret || ''}
                                    onChange={(e) => handleChange('razorpay_secret', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {tab === 3 && (
                <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }} elevation={0}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>System Parameters</Typography>
                        <Stack spacing={3}>
                            <FormControlLabel
                                control={<Switch checked={config.maintenance_mode === 'true'} onChange={(e) => handleChange('maintenance_mode', String(e.target.checked))} />}
                                label="Maintenance Mode (Block non-admin logins)"
                            />
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="CPU Alert Threshold (%)"
                                        type="number"
                                        value={config.alert_threshold_cpu || '90'}
                                        onChange={(e) => handleChange('alert_threshold_cpu', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="RAM Alert Threshold (%)"
                                        type="number"
                                        value={config.alert_threshold_ram || '90'}
                                        onChange={(e) => handleChange('alert_threshold_ram', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CentralConfigPage;
