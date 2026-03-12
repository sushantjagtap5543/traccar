import React, { useState } from 'react';
import {
    Box, Container, Typography, Button, TextField,
    Card, CardContent, InputAdornment, IconButton,
    Alert, CircularProgress, Stack
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles()((theme) => ({
    root: {
        backgroundColor: '#0A1628',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: 420,
        borderRadius: 12,
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        overflow: 'visible',
        position: 'relative'
    },
    badge: {
        backgroundColor: '#FFF8E1',
        color: '#B45300',
        padding: '4px 12px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: theme.spacing(3)
    }
}));

const AdminLoginPage = () => {
    const { classes } = useStyles();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: Credentials, 2: 2FA (TOTP mockup)

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || `http://${window.location.hostname}:8083`;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                setStep(2); // Proceed to mock 2FA
            } else {
                throw new Error(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        const code = e.target.querySelector('input').value;
        setError(null);
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/auth/verify-totp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: code, email })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                navigate('/admin/dashboard');
            } else {
                throw new Error(data.error || 'Invalid 2FA code');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className={classes.root}>
            <Card className={classes.card}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: '50%',
                        bgcolor: '#E0F2F1', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '-10px auto 16px'
                    }}>
                        <LockIcon sx={{ color: '#0B7A75' }} />
                    </Box>

                    <Typography variant="h5" fontWeight="900" color="#0F2D5C" mb={1}>
                        GeoSurePath Admin
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box className={classes.badge}>
                            <ShieldIcon sx={{ fontSize: 14 }} />
                            AUTHORISED PERSONNEL ONLY
                        </Box>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {step === 1 ? (
                        <Box component="form" onSubmit={handleLogin}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    label="Admin Email"
                                    variant="outlined"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Security Password"
                                    type={showPassword ? 'text' : 'password'}
                                    variant="outlined"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={loading}
                                    sx={{ bgcolor: '#0F2D5C', py: 1.5, fontWeight: 'bold' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In Securely'}
                                </Button>
                            </Stack>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handle2FA}>
                            <Typography variant="body2" color="textSecondary" mb={3}>
                                2FA verification is required for all admin sessions. Enter the 6-digit code from your authenticator app.
                            </Typography>
                            <TextField
                                fullWidth
                                label="Verification Code"
                                variant="outlined"
                                placeholder="000 000"
                                required
                                sx={{ mb: 3 }}
                                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontWeight: 'bold', fontSize: 20 } }}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                type="submit"
                                disabled={loading}
                                sx={{ bgcolor: '#0B7A75', py: 1.5, fontWeight: 'bold' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Continue'}
                            </Button>
                        </Box>
                    )}

                    <Typography variant="caption" color="textSecondary" display="block" mt={4}>
                        Session timeout: 30 minutes of inactivity
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminLoginPage;
