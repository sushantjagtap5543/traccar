import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, Stack, TextField, InputAdornment, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';
import PageLayout from '../common/components/PageLayout';

const BillingPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    const filtered = subscriptions.filter(s =>
        (s.user_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (s.user_email?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (s.razorpay_payment_id?.toLowerCase() || '').includes(search.toLowerCase())
    );

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
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="bold">Fleet Billing Overview</Typography>
                    <Typography color="textSecondary">Monitor all subscriptions, revenue cycles, and user payment statuses.</Typography>
                </Box>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="Search by user or payment ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: 350 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button startIcon={<FilterListIcon />} variant="outlined" size="small">Filter</Button>
                        </Box>

                        <TableContainer component={Paper} elevation={0} sx={{ borderTop: '1px solid #eee' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        <TableCell><b>User</b></TableCell>
                                        <TableCell><b>Plan</b></TableCell>
                                        <TableCell><b>Status</b></TableCell>
                                        <TableCell><b>Devices</b></TableCell>
                                        <TableCell><b>Amount</b></TableCell>
                                        <TableCell><b>Payment ID</b></TableCell>
                                        <TableCell><b>Expiry Date</b></TableCell>
                                        <TableCell align="right"><b>Actions</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((sub) => (
                                        <TableRow key={sub.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{sub.user_name}</Typography>
                                                <Typography variant="caption" color="textSecondary">{sub.user_email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={sub.plan_id.toUpperCase()} size="small" variant="outlined" color="primary" sx={{ fontWeight: 'bold' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={sub.status} size="small" color={getStatusColor(sub.status)} />
                                            </TableCell>
                                            <TableCell>{sub.device_limit}</TableCell>
                                            <TableCell>
                                                <b>₹{sub.plan_id === '1month' ? 236 : (sub.plan_id === '6month' ? 1121 : 1770)}</b>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{sub.razorpay_payment_id || 'N/A'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(sub.expiry_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => window.open(`${API_BASE}/api/payments/invoice/${sub.razorpay_payment_id}`, '_blank')}
                                                    disabled={!sub.razorpay_payment_id}
                                                >
                                                    <ReceiptIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                                <Typography color="textSecondary">No subscription records found.</Typography>
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
