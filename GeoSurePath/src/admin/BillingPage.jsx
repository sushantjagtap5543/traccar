import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, Stack, TextField, InputAdornment, Button, Grid,
    Menu, MenuItem, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
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
    const [anchorEl, setAnchorEl] = useState(null);

    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || `http://${window.location.hostname}:8083`;

    useEffect(() => {
        const fetchBilling = async () => {
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
        fetchBilling();
    }, [API_BASE]);

    const metrics = useMemo(() => {
        const active = subscriptions.filter(s => s.status === 'active');
        const totalRevenue = subscriptions.reduce((acc, s) => acc + (parseFloat(s.amount_paid) || 0), 0);
        const mrr = active.reduce((acc, s) => {
            const monthlyValue = s.plan_id === '1month' ? (parseFloat(s.amount_paid) || 236) :
                s.plan_id === '6month' ? ((parseFloat(s.amount_paid) || 1121) / 6) :
                    ((parseFloat(s.amount_paid) || 1770) / 12);
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
                <Box mb={4} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="900" sx={{ color: '#0F2D5C' }}>Fleet Billing Hub</Typography>
                        <Typography color="textSecondary">Production-grade oversight for enterprise GPS revenue cycles.</Typography>
                    </Box>
                    <Button
                        startIcon={<TrendingUpIcon />}
                        variant="contained"
                        sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, textTransform: 'none', fontWeight: 'bold' }}
                    >
                        Export Revenue Report
                    </Button>
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
                        <Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Search by subscriber or transaction ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: 400 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Stack direction="row" spacing={1}>
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
                                                    ₹{(parseFloat(sub.amount_paid) || (sub.plan_id === '1month' ? 236 : (sub.plan_id === '6month' ? 1121 : 1770))).toLocaleString('en-IN')}
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
                                                    onClick={() => window.open(`${API_BASE}/api/payments/invoice/${sub.razorpay_payment_id}`, '_blank')}
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
            </Container>
        </PageLayout>
    );
};

export default BillingPage;
