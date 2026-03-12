import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Typography, Grid, Card, CardContent, CircularProgress,
  Button, Box, Divider, Snackbar, Alert, LinearProgress, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';

import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import HubIcon from '@mui/icons-material/Hub';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BackupIcon from '@mui/icons-material/Backup';
import TimerIcon from '@mui/icons-material/Timer';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SecurityIcon from '@mui/icons-material/Security';

import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

import PageLayout from '../common/components/PageLayout';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(4),
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    marginBottom: theme.spacing(4),
  },
  statCard: {
    height: '100%',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  diagnosticCard: {
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
  },
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginTop: theme.spacing(2),
  },
}));

const AdminDashboardPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const user = useSelector((state) => state.session.user);

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [traccarStatus, setTraccarStatus] = useState(null);
  const [tableStats, setTableStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [networkHistory, setNetworkHistory] = useState([]);
  const [totpDialog, setTotpDialog] = useState({ open: false, qrCode: '', secret: '' });
  const API_BASE = import.meta.env.VITE_ADMIN_API_URL || window.location.origin;

  // Access Control & Session Expiry
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/health`, { credentials: 'include' })
      .then(r => { 
        if (!r.ok) {
          sessionStorage.removeItem('adminSessionActive');
          navigate('/admin'); 
        }
      })
      .catch(() => {
        sessionStorage.removeItem('adminSessionActive');
        navigate('/admin');
      });
  }, [API_BASE, navigate]);

    // Inactivity Logout (30 mins)
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        sessionStorage.removeItem('adminSessionActive');
        navigate('/admin');
      }, 1800000); // 30 minutes
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const fetchOptions = { credentials: 'include' };
      const [healthRes, logsRes, traccarRes, tablesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/health`, fetchOptions),
        fetch(`${API_BASE}/api/admin/logs`, fetchOptions),
        fetch(`${API_BASE}/api/admin/traccar/status`, fetchOptions),
        fetch(`${API_BASE}/api/admin/db/tables`, fetchOptions)
      ]);

      if (healthRes.ok) {
        const hData = await healthRes.json();
        setStats(hData);
        setNetworkHistory(prev => {
          const newPoint = {
            time: new Date().toLocaleTimeString().split(' ')[0],
            rx: Math.round(hData.network?.rx || 0),
            tx: Math.round(hData.network?.tx || 0)
          };
          const updated = [...prev, newPoint].slice(-10);
          return updated;
        });
      }
      if (logsRes.ok) {
        const logData = await logsRes.json();
        setLogs(logData.logs || []);
      }
      if (traccarRes.ok) setTraccarStatus(await traccarRes.json());
      if (tablesRes.ok) {
        const tableData = await tablesRes.json();
        setTableStats(tableData.tables || []);
      }

      if (healthRes.status === 403) throw new Error('Unauthorized: Invalid Admin API Key');
    } catch (error) {
      console.error('Failed to fetch stats', error);
      if (error.message.includes('Unauthorized')) {
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setActionLoading('totp');
    try {
      const response = await fetch(`${API_BASE}/api/admin/auth/totp-setup`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTotpDialog({ open: true, qrCode: data.qrCode, secret: data.secret });
      } else {
        throw new Error('Failed to start 2FA setup');
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async (service) => {
    if (!window.confirm(`Restart ${service}? This may impact active users.`)) return;
    setActionLoading(service);
    try {
      const response = await fetch(`${API_BASE}/api/admin/restart/${service}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        setSnackbar({ open: true, message: `${service} restart signal sent.`, severity: 'success' });
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Command failed');
      }
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } finally {
      setActionLoading(null);
      fetchStats();
    }
  };

  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      const response = await fetch(`${API_BASE}/api/admin/backup`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Database backup initiated.', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Backup failed.', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateWebhook = async (e) => {
    e.preventDefault();
    setActionLoading('webhook');
    try {
      const response = await fetch(`${API_BASE}/api/admin/alerts/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl })
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Emergency webhook updated.', severity: 'success' });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const getHealthColor = (percent) => {
    if (percent > 90) return '#f44336';
    if (percent > 70) return '#ff9800';
    return '#4caf50';
  };

  if (loading && !stats) {
    return (
      <PageLayout breadcrumbs={['GeoSurePath Admin', 'DevOps Dashboard']}>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout breadcrumbs={['GeoSurePath Admin', 'DevOps Dashboard']}>
      <div className={classes.container}>
        <div className={classes.header}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            Infrastructure Health Hub
          </Typography>
          <Typography color="textSecondary">Premium DevOps monitoring for GeoSurePath Enterprise.</Typography>
        </div>

        <Grid container spacing={3}>
          {/* CPU & RAM Radial Gauges */}
          <Grid item xs={12} md={6}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Engine performance</Typography>
                <Grid container spacing={4} justifyContent="center" textAlign="center">
                  <Grid item xs={6}>
                    <Box sx={{ height: 160, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={12} data={[{ name: 'CPU', value: stats?.cpu || 0, fill: getHealthColor(stats?.cpu) }]}>
                          <RadialBar background dataKey="value" cornerRadius={6} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <Typography variant="h5" fontWeight="900" color="primary">{Math.round(stats?.cpu || 0)}%</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" fontWeight="bold" sx={{ mt: 1, display: 'block' }}>PROCESSOR LOAD</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ height: 160, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={12} data={[{ name: 'RAM', value: stats?.ram?.percent || 0, fill: getHealthColor(stats?.ram?.percent) }]}>
                          <RadialBar background dataKey="value" cornerRadius={6} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <Typography variant="h5" fontWeight="900" color="primary">{Math.round(stats?.ram?.percent || 0)}%</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" fontWeight="bold" sx={{ mt: 1, display: 'block' }}>MEMORY FOOTPRINT</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Infrastructure Sentinel & Status badges */}
          <Grid item xs={12} md={6}>
            <Card className={classes.statCard}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">Infrastructure Sentinel</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimerIcon fontSize="small" />
                    <Typography variant="caption" fontWeight="bold" color="textSecondary">
                      UP: {stats?.uptime?.process?.formatted || '-'}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack spacing={1.5}>
                  {[
                    { name: 'Telemetry Engine', status: traccarStatus?.status === 'REACHABLE' ? 'ONLINE' : 'ERROR', detail: traccarStatus?.version || 'v5.12' },
                    { name: 'SQL Storage', status: stats?.database?.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE', detail: stats?.database?.storage || '0MB' },
                    { name: 'Cache Layer', status: stats?.cache?.status || 'ONLINE', detail: 'Redis v7.2' }
                  ].map((svc) => (
                    <Box key={svc.name} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">{svc.name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="textSecondary">{svc.detail}</Typography>
                        <Box sx={{ px: 1, py: 0.3, borderRadius: 10, fontSize: 9, fontWeight: '900', bgcolor: svc.status === 'ONLINE' ? '#2e7d32' : '#d32f2f', color: 'white' }}>
                          {svc.status}
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<SecurityIcon />}
                    onClick={handleSetup2FA}
                    sx={{ mt: 1, fontSize: 10, fontWeight: 'bold' }}
                  >
                    Setup Administrative 2FA
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Network Traffic Chart */}
          <Grid item xs={12} md={8}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Network Telemetry (KB/s)</Typography>
                <Box sx={{ height: 250, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={networkHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rx" stroke="#0b7a75" strokeWidth={3} dot={false} name="Incoming" />
                      <Line type="monotone" dataKey="tx" stroke="#0f2d5c" strokeWidth={3} dot={false} name="Outgoing" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Log Terminal */}
          <Grid item xs={12} md={8}>
            <Card className={classes.diagnosticCard} variant="outlined" sx={{ bgcolor: '#0d1117', color: '#e6edf3', border: 'none' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#7d8590' }} gutterBottom>Infrastructure Logs (Combined)</Typography>
                <Box sx={{
                  height: 300,
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  bgcolor: '#010409',
                  p: 2,
                  borderRadius: 1,
                  '&::-webkit-scrollbar': { width: 8 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#30363d', borderRadius: 4 }
                }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: 4, opacity: 1 - (i * 0.01) }}>
                      <span style={{ color: '#7ee787' }}>[GS-INFRA]</span> {log}
                    </div>
                  ))}
                  {logs.length === 0 && <Typography variant="caption">Listening for telemetry logs...</Typography>}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Database & Disk Statistics */}
          <Grid item xs={12} md={4}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Storage Analytics</Typography>

                <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>DB TABLES</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {tableStats.slice(0, 4).map((table) => (
                    <Box key={table.table_name} sx={{ display: 'flex', justifyContent: 'space-between', p: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption">{table.table_name}</Typography>
                      <Typography variant="caption" fontWeight="bold">{table.row_count}</Typography>
                    </Box>
                  ))}
                </Stack>

                <Typography variant="subtitle2" sx={{ mt: 3, fontWeight: 'bold', color: 'primary.main' }}>DISK VOLUME</Typography>
                <Box sx={{ mt: 1 }}>
                  {stats?.disk?.map((d, i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">{d.mount}</Typography>
                        <Typography variant="caption" fontWeight="bold">{d.use}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={d.use} sx={{ height: 6, borderRadius: 3, bgcolor: '#eee' }} />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Alert Configuration */}
          <Grid item xs={12} md={4}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Emergency Alerts</Typography>
                <Typography variant="caption" color="textSecondary" display="block" mb={2}>
                  Dispatch notifications to Slack/Discord when infra limits exceeded.
                </Typography>
                <Box component="form" onSubmit={handleUpdateWebhook}>
                  <Stack spacing={2}>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <input
                        type="url"
                        placeholder="https://hooks.slack.com/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 12, padding: '4px 0' }}
                        required
                      />
                    </Box>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={actionLoading === 'webhook'}
                      sx={{ bgcolor: 'info.main' }}
                    >
                      {actionLoading === 'webhook' ? <CircularProgress size={16} /> : 'Save Webhook'}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recovery Actions Overlay */}
          <Grid item xs={12} md={8}>
            <Card className={classes.diagnosticCard} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">Enterprise Recovery Actions</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ReceiptIcon />}
                      size="small"
                      onClick={() => navigate('/admin/billing')}
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                    >
                      Billing Oversight
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SettingsApplicationsIcon />}
                      size="small"
                      onClick={() => navigate('/admin/config')}
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                    >
                      Central Config
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<BackupIcon />}
                      size="small"
                      onClick={handleBackup}
                      disabled={actionLoading === 'backup'}
                      sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
                    >
                      {actionLoading === 'backup' ? <CircularProgress size={16} color="inherit" /> : 'Backup SQL Engine'}
                    </Button>
                  </Stack>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {['traccar', 'database', 'cache', 'backend'].map((svc) => (
                    <Grid item xs={12} sm={3} key={svc}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleRestart(svc)}
                        disabled={actionLoading === svc}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: '900', border: '2px solid', '&:hover': { border: '2px solid' } }}
                      >
                        {actionLoading === svc ? <CircularProgress size={20} /> : `RESTART ${svc.toUpperCase()}`}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog open={totpDialog.open} onClose={() => setTotpDialog({ ...totpDialog, open: false })}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Administrative 2FA Setup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) to enable multi-factor login protection.
            </Typography>
            <Box sx={{ textAlign: 'center', my: 3, p: 2, bgcolor: 'white', borderRadius: 2 }}>
              {totpDialog.qrCode && <img src={totpDialog.qrCode} alt="2FA QR Code" style={{ width: 200, height: 200 }} />}
            </Box>
            <Typography variant="caption" display="block" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              SECRET CODE: {totpDialog.secret}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTotpDialog({ ...totpDialog, open: false })} variant="contained">I have scanned it</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </PageLayout>
  );
};

export default AdminDashboardPage;
