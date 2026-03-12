import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, Stack, TextField, InputAdornment, Button, Grid,
    Menu, MenuItem, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, Alert, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import AddCardIcon from '@mui/icons-material/AddCard';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PageLayout from '../common/components/PageLayout';

const SummaryCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</Typography>
                    <Typography variant="h5" fontWeight="900" sx={{ color: '#0F2D5C' }}>{value}</Typography>
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

const BillingPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Manual Payment State
    const [manualOpen, setManualOpen] = useState(false);
    const [manualLoading, setManualLoading] = useState(false);
    const [manualError, setManualError] = useState('');
    const [manualSuccess, setManualSuccess] = useState('');
    const [manualData, setManualData] = useState({
        email: '',
        planId: '1month',
        amount: '',
        transactionId: '',
        months: '12'
    });

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || window.location.origin;

    const fetchBilling = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/billing/overview`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data);
            }
        } catch (err) {
            console.error('Failed to fetch billing data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBilling();
    }, [API_BASE]);

    const handleRecordManual = async () => {
        if (!manualData.email || !manualData.amount) {
            setManualError('Email and Amount are required.');
            return;
        }
        setManualLoading(true);
        setManualError('');
        try {
            const response = await fetch(`${API_BASE}/api/admin/billing/record-manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manualData),
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok) {
                setManualSuccess('Payment recorded successfully!');
                setTimeout(() => {
                    setManualOpen(false);
                    setManualSuccess('');
                    setManualData({ email: '', planId: '1month', amount: '', transactionId: '', months: '12' });
                    fetchBilling();
                }, 1500);
            } else {
                setManualError(result.error || 'Failed to record payment');
            }
        } catch (err) {
            setManualError('Network error occurred.');
        } finally {
            setManualLoading(false);
        }
    };

    const metrics = useMemo(() => {
        const active = subscriptions.filter(s => s.status === 'active');
        const totalRevenue = subscriptions.reduce((acc, s) => acc + (parseFloat(s.amount_paid) || 0), 0);
        const mrr = active.reduce((acc, s) => {
            const amount = parseFloat(s.amount_paid);
            if (isNaN(amount) || amount <= 0) return acc; // Exclude free/inbuilt from MRR
            
            const monthlyValue = s.plan_id === '1month' ? amount :
                s.plan_id === '6month' ? (amount / 6) :
                    (amount / 12);
            return acc + monthlyValue;
        }, 0);

        const expiringIn7Days = active.filter(s => {
            const diff = new Date(s.expiry_date) - new Date();
            const days = diff / (1000 * 60 * 60 * 24);
            return days > 0 && days <= 7;
        }).length;

        return {
            totalActive: active.length,
            revenue: totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
            mrr: mrr.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
            expiring: expiringIn7Days
        };
    }, [subscriptions]);

    const filtered = subscriptions.filter(s => {
        const matchesSearch = (s.user_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (s.user_email?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (s.razorpay_payment_id?.toLowerCase() || '').includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExportCSV = () => {
        if (filtered.length === 0) return;
        const headers = ["Subscriber", "Email", "Plan", "Status", "Devices", "Amount Paid", "Transaction ID", "Expiry"];
        const rows = filtered.map(s => [
            `"${s.user_name || ''}"`,
            `"${s.user_email || ''}"`,
            `"${s.plan_id.toUpperCase()}"`,
            `"${s.status.toUpperCase()}"`,
            s.device_limit,
            `"INR ${parseFloat(s.amount_paid || 0).toFixed(2)}"`,
            `"${s.razorpay_payment_id || 'N/A'}"`,
            `"${new Date(s.expiry_date).toLocaleDateString()}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = (data) => {
        const doc = new jsPDF();
        const total = (data.amount_paid !== null && data.amount_paid !== undefined) 
            ? parseFloat(data.amount_paid) 
            : (data.plan_id === '1month' ? 236 : (data.plan_id === 'enterprise' ? 5310 : 1770));
        const base = Math.round(total / 1.18);
        const gst = total - base;

        doc.setFontSize(22);
        doc.setTextColor(11, 122, 117);
        doc.text('GeoSurePath', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('ADMINISTRATIVE INVOICE RECORD', 14, 28);
        doc.text(`DateGenerated: ${new Date().toLocaleDateString()}`, 140, 20);

        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text(`Subscriber: ${data.user_name}`, 14, 40);
        doc.text(`Email: ${data.user_email}`, 14, 46);
        doc.text(`Payment ID: ${data.razorpay_payment_id}`, 14, 52);

        doc.autoTable({
            startY: 60,
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
        doc.save(`Invoice_ADMIN_${data.razorpay_payment_id}.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'cancelled': return 'warning';
            case 'expired': return 'error';
            default: return 'default';
        }
    };

    return (
        <PageLayout breadcrumbs={['Admin', 'Billing Overview']}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box mb={4} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="900" sx={{ color: '#0F2D5C' }}>Fleet Billing Hub</Typography>
                        <Typography color="textSecondary">Production-grade oversight for enterprise GPS revenue cycles.</Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            startIcon={<TrendingUpIcon />}
                            variant="outlined"
                            onClick={handleExportCSV}
                            sx={{ borderColor: '#0B7A75', color: '#0B7A75', '&:hover': { borderColor: '#08635F' }, textTransform: 'none', fontWeight: 'bold' }}
                        >
                            Export Report
                        </Button>
                        <Button
                            startIcon={<AddCardIcon />}
                            variant="contained"
                            onClick={() => setManualOpen(true)}
                            sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, textTransform: 'none', fontWeight: 'bold' }}
                        >
                            Record Manual Payment
                        </Button>
                    </Stack>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Active Subs" value={metrics.totalActive} icon={<PeopleIcon />} color="#0F2D5C" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Revenue" value={metrics.revenue} icon={<TrendingUpIcon />} color="#2e7d32" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="MRR (EST)" value={metrics.mrr} icon={<SpeedIcon />} color="#0288d1" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Expiring Soon" value={metrics.expiring} icon={<TimerIcon />} color="#ed6c02" />
                    </Grid>
                </Grid>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                placeholder="Search by subscriber or transaction ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: { xs: '100%', md: 400 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                <Chip
                                    label="ALL"
                                    size="small"
                                    onClick={() => setStatusFilter('all')}
                                    variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'all' ? 'primary' : 'default'}
                                />
                                <Chip
                                    label="ACTIVE"
                                    size="small"
                                    onClick={() => setStatusFilter('active')}
                                    variant={statusFilter === 'active' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'active' ? 'success' : 'default'}
                                />
                                <Chip
                                    label="CANCELLED"
                                    size="small"
                                    onClick={() => setStatusFilter('cancelled')}
                                    variant={statusFilter === 'cancelled' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'cancelled' ? 'warning' : 'default'}
                                />
                                <Chip
                                    label="EXPIRED"
                                    size="small"
                                    onClick={() => setStatusFilter('expired')}
                                    variant={statusFilter === 'expired' ? 'filled' : 'outlined'}
                                    color={statusFilter === 'expired' ? 'error' : 'default'}
                                />
                            </Stack>
                        </Box>

                        <TableContainer component={Paper} elevation={0} sx={{ borderTop: '1px solid #f0f0f0' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#fbfbfb' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>SUBSCRIBER</TableCell>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>PLAN TIER</TableCell>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>DEVICES</TableCell>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>AMOUNT</TableCell>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>TRANSACTION</TableCell>
                                        <TableCell sx={{ fontWeight: '900', color: '#5A6A80' }}>EXPIRY</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: '900', color: '#5A6A80' }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((sub) => (
                                        <TableRow key={sub.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color: '#0F2D5C' }}>{sub.user_name}</Typography>
                                                <Typography variant="caption" color="textSecondary">{sub.user_email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={sub.plan_id.toUpperCase()}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 'bold', fontSize: 10, borderColor: '#0F2D5C', color: '#0F2D5C' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getStatusColor(sub.status) + '.main' }} />
                                                    <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>{sub.status}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{sub.device_limit}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="900">
                                                    ₹{( (sub.amount_paid !== null && sub.amount_paid !== undefined) ? parseFloat(sub.amount_paid) : (sub.plan_id === '1month' ? 236 : (sub.plan_id === '6month' ? 1121 : (sub.plan_id === 'enterprise' ? 5310 : 1770)))).toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.7 }}>{sub.razorpay_payment_id || 'N/A'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{new Date(sub.expiry_date).toLocaleDateString()}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDownloadPDF(sub)}
                                                    disabled={!sub.razorpay_payment_id}
                                                    sx={{ color: '#0B7A75' }}
                                                >
                                                    <ReceiptIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 12 }}>
                                                <Typography variant="h6" color="textSecondary" sx={{ opacity: 0.5 }}>No matching subscription records detected.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Manual Payment Dialog */}
                <Dialog open={manualOpen} onClose={() => !manualLoading && setManualOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#0F2D5C' }}>Record Manual Payment</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            {manualError && <Alert severity="error">{manualError}</Alert>}
                            {manualSuccess && <Alert severity="success">{manualSuccess}</Alert>}
                            
                            <TextField 
                                label="Subscriber Email" 
                                fullWidth 
                                variant="outlined" 
                                size="small"
                                value={manualData.email}
                                onChange={(e) => setManualData({...manualData, email: e.target.value})}
                                placeholder="customer@example.com"
                            />
                            
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Plan Tier</InputLabel>
                                        <Select
                                            value={manualData.planId}
                                            label="Plan Tier"
                                            onChange={(e) => setManualData({...manualData, planId: e.target.value})}
                                        >
                                            <MenuItem value="1month">Basic (1M)</MenuItem>
                                            <MenuItem value="6month">Pro (6M)</MenuItem>
                                            <MenuItem value="12month">Business (12M)</MenuItem>
                                            <MenuItem value="enterprise">Enterprise (12M+)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField 
                                        label="Duration (Months)" 
                                        type="number"
                                        fullWidth 
                                        size="small"
                                        value={manualData.months}
                                        onChange={(e) => setManualData({...manualData, months: e.target.value})}
                                    />
                                </Grid>
                            </Grid>

                            <TextField 
                                label="Amount (incl. GST)" 
                                type="number"
                                fullWidth 
                                size="small"
                                value={manualData.amount}
                                onChange={(e) => setManualData({...manualData, amount: e.target.value})}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />

                            <TextField 
                                label="Notes / Transaction ID" 
                                fullWidth 
                                size="small"
                                value={manualData.transactionId}
                                onChange={(e) => setManualData({...manualData, transactionId: e.target.value})}
                                placeholder="CASH / NEFT-12345"
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setManualOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            disabled={manualLoading}
                            onClick={handleRecordManual}
                            sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, fontWeight: 'bold', minWidth: 120 }}
                        >
                            {manualLoading ? <CircularProgress size={20} color="inherit" /> : 'Record Payment'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </PageLayout>
    );
};

export default BillingPage;
