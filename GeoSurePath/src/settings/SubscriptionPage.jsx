import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Container, Typography, Grid, Card, CardContent, Button,
    Stack, Chip, Divider, LinearProgress, CircularProgress,
    Snackbar, Alert, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import UpgradeIcon from '@mui/icons-material/Upgrade';

const SubscriptionPage = () => {
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const user = useSelector((state) => state.session.user);

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || '';

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/payments/subscription/${user.id}`);
            if (res.ok) {
                setSub(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId) => {
        try {
            const orderRes = await fetch(`${API_BASE}/api/payments/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, userId: user.id })
            });
            const order = await orderRes.json();

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
                amount: order.amount,
                currency: "INR",
                name: "GeoSurePath",
                description: `${planId} Plan Subscription`,
                order_id: order.id,
                handler: async (response) => {
                    const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            userId: user.id,
                            planId: planId
                        })
                    });
                    if (verifyRes.ok) {
                        setSnackbar({ open: true, message: 'Payment Successful! Your plan is active.', severity: 'success' });
                        fetchSubscription();
                    }
                },
                prefill: {
                    email: user.email,
                },
                theme: { color: "#0b7a75" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setSnackbar({ open: true, message: 'Payment failed to initialize', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    const currentPlan = sub?.plan_id || 'free';
    const deviceCount = sub?.device_count || 0;
    const deviceLimit = sub?.device_limit || 2;

    const plans = [
        { id: '1month', name: 'Standard (1 Mo)', price: '₹200', limit: 5, features: ['5 Devices', '365 Day History', 'Email Alerts'] },
        { id: '6month', name: 'Premium (6 Mo)', price: '₹950', limit: 20, features: ['20 Devices', '365 Day History', 'SMS & WhatsApp Alerts', 'Geofence Reports'] },
        { id: '12month', name: 'Enterprise (1 Yr)', price: '₹1500', limit: 100, features: ['100 Devices', '1 Year History', 'White-label Support', 'API Access', 'Dedicated Manager'] },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box mb={6}>
                <Typography variant="h3" fontWeight="900" gutterBottom>Subscription & Usage</Typography>
                <Typography color="textSecondary">Manage your plan, track vehicle limits, and renew your service.</Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', borderRadius: 4, bgcolor: '#0f2d5c', color: 'white' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="overline" sx={{ opacity: 0.8 }}>Current Status</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3 }}>
                                <Typography variant="h4" fontWeight="bold">{currentPlan.toUpperCase()}</Typography>
                                {sub?.status === 'active' && <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#0b7a75', color: 'white', fontWeight: 'bold' }} />}
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">Resource Usage</Typography>
                                    <Typography variant="body2" fontWeight="bold">{deviceCount} / {deviceLimit}</Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, (deviceCount / deviceLimit) * 100)}
                                    sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#0b7a75' } }}
                                />
                            </Box>

                            <Box sx={{ mb: 4, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 1 }}>LIFE LEFT</Typography>
                                <Stack direction="row" alignItems="baseline" spacing={1}>
                                    <Typography variant="h3" fontWeight="900" sx={{ color: '#0b7a75' }}>{sub?.days_remaining || 0}</Typography>
                                    <Typography variant="body2">Days Remaining</Typography>
                                </Stack>
                                {sub?.expiry_date && <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.6 }}>Expires on: {new Date(sub.expiry_date).toLocaleDateString()}</Typography>}
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                disabled={!sub?.razorpay_payment_id}
                                startIcon={<ReceiptIcon />}
                                onClick={() => window.open(`${API_BASE}/api/payments/invoice/${sub.razorpay_payment_id}`, '_blank')}
                                sx={{ bgcolor: 'white', color: '#0f2d5c', '&:hover': { bgcolor: '#f0f0f0' }, fontWeight: 'bold', mb: 2 }}
                            >
                                Download Invoice
                            </Button>

                            {sub?.status === 'active' && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    color="inherit"
                                    onClick={async () => {
                                        if (window.confirm('Are you sure you want to cancel your active plan?')) {
                                            const res = await fetch(`${API_BASE}/api/payments/cancel`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ userId: user.id })
                                            });
                                            if (res.ok) {
                                                setSnackbar({ open: true, message: 'Subscription cancelled. It will remain active until expiry.', severity: 'info' });
                                                fetchSubscription();
                                            }
                                        }
                                    }}
                                    sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { borderColor: 'white' } }}
                                >
                                    Cancel Plan
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        {plans.map((p) => (
                            <Grid item xs={12} sm={4} key={p.id}>
                                <Card sx={{
                                    height: '100%',
                                    borderRadius: 3,
                                    border: currentPlan === p.id ? '2px solid #0b7a75' : '1px solid #e0e0e0',
                                    position: 'relative'
                                }}>
                                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                        <Typography variant="h6" fontWeight="bold">{p.name}</Typography>
                                        <Typography variant="h4" fontWeight="900" sx={{ mt: 2 }}>{p.price}</Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>+ 18% GST / Renewal</Typography>
                                        <List dense sx={{ mb: 2 }}>
                                            {p.features.map((f) => (
                                                <ListItem key={f} sx={{ px: 0 }}>
                                                    <ListItemIcon sx={{ minWidth: 24 }}><CheckCircleIcon sx={{ fontSize: 16, color: '#0b7a75' }} /></ListItemIcon>
                                                    <ListItemText primary={<Typography variant="caption">{f}</Typography>} />
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Button
                                            variant={currentPlan === p.id ? "outlined" : "contained"}
                                            fullWidth
                                            onClick={() => handleUpgrade(p.id)}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                        >
                                            {currentPlan === p.id ? 'Renew Now' : 'Select Plan'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
};

export default SubscriptionPage;
