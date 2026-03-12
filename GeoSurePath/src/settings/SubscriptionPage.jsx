import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Container, Typography, Grid, Card, CardContent, Button,
    Stack, Chip, Divider, LinearProgress, CircularProgress,
    Snackbar, Alert, List, ListItem, ListItemIcon, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import HistoryIcon from '@mui/icons-material/History';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SubscriptionPage = () => {
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState(null);
    const [history, setHistory] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const user = useSelector((state) => state.session.user);

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || '';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, historyRes] = await Promise.all([
                fetch(`${API_BASE}/api/payments/subscription/${user.id}`),
                fetch(`${API_BASE}/api/payments/history/${user.id}`)
            ]);

            if (subRes.ok) setSub(await subRes.json());
            if (historyRes.ok) setHistory(await historyRes.json());
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
                        fetchData();
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

    const handleDownloadPDF = (data) => {
        const doc = new jsPDF();
        const total = parseFloat(data.amount_paid) || (data.plan_id === '1month' ? 236 : (data.plan_id === 'enterprise' ? 5310 : 1770));
        const base = Math.round(total / 1.18);
        const gst = total - base;

        // Branding
        doc.setFontSize(22);
        doc.setTextColor(11, 122, 117);
        doc.text('GeoSurePath', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('INVOICE / RECEIPT', 14, 28);
        doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, 160, 20);
        doc.text(`Payment ID: ${data.razorpay_payment_id}`, 14, 40);

        doc.autoTable({
            startY: 50,
            head: [['Description', 'Qty', 'Amount']],
            body: [
                [`GPS Fleet Subscription - ${data.plan_id.toUpperCase()}`, '1', `INR ${base.toFixed(2)}`],
                ['Integrated GST (18%)', '1', `INR ${gst.toFixed(2)}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 45, 92] }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`Total Paid: INR ${total.toFixed(2)}`, 140, finalY);

        doc.setFontSize(8);
        doc.text('This is a computer generated receipt. Valid for tax purposes.', 14, finalY + 20);

        doc.save(`Invoice_${data.razorpay_payment_id}.pdf`);
    };

    if (loading && !sub) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    const currentPlan = sub?.plan_id || 'free';
    const deviceCount = sub?.device_count || 0;
    const deviceLimit = sub?.device_limit || 2;

    const plans = [
        { id: '1month', name: 'Standard (Monthly)', price: '₹200', limit: 25, features: ['25 Devices', '365 Day History', 'SMS & WhatsApp Alerts', 'Geofence Reports'] },
        { id: '12month', name: 'Standard (Annual)', price: '₹1500', limit: 25, features: ['25 Devices', '365 Day History', 'SMS & WhatsApp Alerts', 'Geofence Reports', '2 Months FREE!'] },
        { id: 'enterprise', name: 'Enterprise (Annual)', price: '₹4500', limit: 100, features: ['100 Devices', 'White-label Support', 'API Access', 'Dedicated Manager', 'Custom Reports'] },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box mb={6}>
                <Typography variant="h3" fontWeight="900" gutterBottom sx={{ color: '#0F2D5C' }}>Subscription & Billing</Typography>
                <Typography color="textSecondary">Manage your fleet plan, download receipts, and track your operational limits.</Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Active Plan Card */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', borderRadius: 4, bgcolor: '#0f2d5c', color: 'white', boxShadow: '0 8px 32px rgba(15,45,92,0.15)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 'bold' }}>CURRENT STATUS</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3, mt: 1 }}>
                                <Typography variant="h4" fontWeight="bold">{currentPlan.toUpperCase()}</Typography>
                                {sub?.status === 'active' && <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#0b7a75', color: 'white', fontWeight: 'bold', fontSize: 10 }} />}
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography variant="caption" fontWeight="bold">DEVICE QUOTA</Typography>
                                    <Typography variant="caption" fontWeight="bold">{deviceCount} / {deviceLimit}</Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, (deviceCount / deviceLimit) * 100)}
                                    sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#0b7a75', borderRadius: 5 } }}
                                />
                            </Box>

                            <Box sx={{ mb: 4, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 1, fontWeight: 'bold' }}>SERVICE CONTINUITY</Typography>
                                <Stack direction="row" alignItems="baseline" spacing={1}>
                                    <Typography variant="h3" fontWeight="900" sx={{ color: '#0b7a75' }}>{sub?.days_remaining || 0}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: '500' }}>Days Left</Typography>
                                </Stack>
                                {sub?.expiry_date && <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.6 }}>Expires on: {new Date(sub.expiry_date).toLocaleDateString()}</Typography>}
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                disabled={!sub?.razorpay_payment_id}
                                startIcon={<ReceiptIcon />}
                                onClick={() => handleDownloadPDF(sub)}
                                sx={{ bgcolor: 'white', color: '#0f2d5c', '&:hover': { bgcolor: '#f0f0f0' }, fontWeight: 'bold', mb: 2, borderRadius: 2 }}
                            >
                                Download PDF Invoice
                            </Button>

                            {sub?.status === 'active' && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    color="inherit"
                                    onClick={async () => {
                                        if (window.confirm('Cancel active plan? It will remain active until expiry.')) {
                                            const res = await fetch(`${API_BASE}/api/payments/cancel`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ userId: user.id })
                                            });
                                            if (res.ok) {
                                                setSnackbar({ open: true, message: 'Cancellation confirmed.', severity: 'info' });
                                                fetchData();
                                            }
                                        }
                                    }}
                                    sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }, borderRadius: 2 }}
                                >
                                    Cancel Renewal
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Plan Selection */}
                <Grid item xs={12} md={8}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UpgradeIcon color="primary" /> Available Upgrades
                    </Typography>
                    <Grid container spacing={2}>
                        {plans.map((p) => (
                            <Grid item xs={12} sm={4} key={p.id}>
                                <Card sx={{
                                    height: '100%',
                                    borderRadius: 3,
                                    border: currentPlan === p.id ? '2px solid #0b7a75' : '1px solid #e0e0e0',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}>
                                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" color="#0F2D5C">{p.name}</Typography>
                                        <Typography variant="h4" fontWeight="900" sx={{ mt: 2, color: '#0F2D5C' }}>{p.price}</Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block', fontWeight: 'bold' }}>+ 18% GST / Renewal</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <List dense sx={{ mb: 2, minHeight: 120 }}>
                                            {p.features.map((f) => (
                                                <ListItem key={f} sx={{ px: 0 }}>
                                                    <ListItemIcon sx={{ minWidth: 24 }}><CheckCircleIcon sx={{ fontSize: 16, color: '#0b7a75' }} /></ListItemIcon>
                                                    <ListItemText primary={<Typography variant="caption" sx={{ fontWeight: '500' }}>{f}</Typography>} />
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Button
                                            variant={currentPlan === p.id ? "outlined" : "contained"}
                                            fullWidth
                                            onClick={() => handleUpgrade(p.id)}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 'bold',
                                                bgcolor: currentPlan === p.id ? 'transparent' : '#0B7A75',
                                                '&:hover': { bgcolor: currentPlan === p.id ? 'rgba(11,122,117,0.05)' : '#08635F' }
                                            }}
                                        >
                                            {currentPlan === p.id ? 'Renew Now' : 'Upgrade Plan'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Billing History Section */}
                    <Box sx={{ mt: 6 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon color="primary" /> Billing History
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Plan</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Chip label={item.plan_id.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: 9 }} />
                                            </TableCell>
                                            <TableCell fontWeight="bold">
                                                ₹{(parseFloat(item.amount_paid) || (item.plan_id === '1month' ? 236 : (item.plan_id === '6month' ? 1121 : 1770))).toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight="bold" sx={{ color: item.status === 'active' ? 'success.main' : 'text.secondary' }}>
                                                    {item.status.toUpperCase()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    disabled={!item.razorpay_payment_id}
                                                    onClick={() => handleDownloadPDF(item)}
                                                >
                                                    <ReceiptIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {history.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Typography variant="caption" color="textSecondary">No transaction history found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default SubscriptionPage;
