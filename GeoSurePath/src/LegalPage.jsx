import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper, Divider, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const LegalPage = () => {
    const { type } = useParams();
    const navigate = useNavigate();

    const content = {
        privacy: {
            title: 'Privacy Policy',
            updated: 'March 12, 2026',
            body: [
                'At GeoSurePath, we take your telemetry privacy seriously. This policy describes how we collect, use, and handle your data when you use our GPS tracking services.',
                '1. Data Collection: We collect location data, device telemetry, and account information necessary to provide real-time tracking services.',
                '2. Data Usage: Your data is used exclusively for providing tracking services, generating reports, and improving platform performance.',
                '3. Security: We use industry-standard AES-256 encryption for at-rest data and TLS for all data in transit.',
                '4. Third Parties: We do not sell your data. We only share data with essential service providers like Razorpay (for payments) and Twilio (for alerts).'
            ]
        },
        terms: {
            title: 'Terms of Service',
            updated: 'March 12, 2026',
            body: [
                'By using GeoSurePath, you agree to the following terms and conditions.',
                '1. Acceptable Use: You agree to use our tracking services only for lawful purposes in accordance with local regulations.',
                '2. Subscriptions: Access to premium features and device limits are determined by your active subscription plan.',
                '3. Liability: GeoSurePath is not liable for data loss due to hardware failure or network outages.',
                '4. Termination: We reserve the right to suspend accounts that violate these terms or fail to maintain active subscriptions.'
            ]
        }
    };

    const current = content[type] || content.privacy;

    return (
        <Box sx={{ bgcolor: '#F4F7FC', minHeight: '100vh', py: 8 }}>
            <Container maxWidth="md">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/welcome')}
                    sx={{ mb: 4, color: '#0F2D5C' }}
                >
                    Back to Home
                </Button>
                <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: 4, boxShadow: '0 8px 32px rgba(15,45,92,0.05)' }}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>{current.title}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 4 }}>
                        Last Updated: {current.updated}
                    </Typography>
                    <Divider sx={{ mb: 4 }} />
                    <Stack spacing={4}>
                        {current.body.map((text, i) => (
                            <Typography key={i} variant="body1" lineHeight={1.8} color="#2C3E50">
                                {text}
                            </Typography>
                        ))}
                    </Stack>
                    <Divider sx={{ my: 6 }} />
                    <Typography variant="body2" color="textSecondary">
                        Questions? Contact our legal team at legal@geosurepath.com
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
};

export default LegalPage;
