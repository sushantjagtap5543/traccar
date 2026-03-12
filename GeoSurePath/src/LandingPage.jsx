import React from 'react';
import {
    Box, Container, Typography, Button, AppBar, Toolbar, Stack,
    Grid, Card, CardContent, Divider, useMediaQuery, useTheme
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MapIcon from '@mui/icons-material/Map';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import NavigationIcon from '@mui/icons-material/Navigation';
import { pricingConfig } from './config/pricing';

const useStyles = makeStyles()((theme) => ({
    root: {
        backgroundColor: '#F4F7FC',
        minHeight: '100vh',
        color: '#0F1F3D',
    },
    appBar: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #D0DAE8',
        color: '#0F2D5C',
    },
    hero: {
        paddingTop: theme.spacing(15),
        paddingBottom: theme.spacing(10),
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%)',
    },
    navLink: {
        fontWeight: 500,
        cursor: 'pointer',
        '&:hover': { color: '#0B7A75' }
    },
    heroBadge: {
        backgroundColor: '#E0F2F1',
        color: '#0B7A75',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
        display: 'inline-block'
    },
    featureCard: {
        border: '1px solid #D0DAE8',
        borderRadius: 12,
        transition: 'transform 0.3s, box-shadow 0.3s',
        height: '100%',
        '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 24px rgba(15,45,92,0.1)',
        }
    },
    pricingCard: {
        borderRadius: 16,
        border: '1px solid #D0DAE8',
        padding: theme.spacing(4),
        textAlign: 'center',
        position: 'relative'
    },
    popularCard: {
        border: '2px solid #0F2D5C',
        boxShadow: '0 8px 32px rgba(15,45,92,0.12)',
    },
    footer: {
        backgroundColor: '#FFFFFF',
        padding: theme.spacing(8, 0),
        borderTop: '1px solid #D0DAE8',
    }
}));

const LandingPage = () => {
    const { classes } = useStyles();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box className={classes.root}>
            {/* Navigation Bar */}
            <AppBar position="fixed" elevation={0} className={classes.appBar}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ p: 0.5, borderRadius: 1 }}>
                                <img src="/logo.png" alt="GeoSurePath Logo" style={{ height: 32 }} />
                            </Box>
                        </Stack>

                        {!isMobile && (
                            <Stack direction="row" spacing={4}>
                                <Typography className={classes.navLink}>Features</Typography>
                                <Typography className={classes.navLink}>Pricing</Typography>
                                <Typography className={classes.navLink}>Use Cases</Typography>
                                <Typography className={classes.navLink}>Resources</Typography>
                            </Stack>
                        )}

                        <Stack direction="row" spacing={2}>
                            <Button sx={{ color: '#0F2D5C', fontWeight: 'bold' }}>Sign In</Button>
                            <Button
                                variant="contained"
                                sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, textTransform: 'none', fontWeight: 'bold', borderRadius: 2 }}
                            >
                                Start Free Trial
                            </Button>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box className={classes.hero}>
                <Container maxWidth="lg">
                    <Grid container spacing={8} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box className={classes.heroBadge}>GPS FLEET INTELLIGENCE</Box>
                            <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 56 }, fontWeight: 800, color: '#0F2D5C', lineHeight: 1.2, mb: 2 }}>
                                Track Every Asset. <br />
                                <span style={{ color: '#0B7A75' }}>Know Every Move.</span>
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#5A6A80', mb: 4, fontWeight: 400, maxWidth: 500 }}>
                                Real-time GPS tracking for fleets, logistics, and field operations. Set up in under 5 minutes.
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, py: 1.5, px: 4, fontWeight: 'bold', borderRadius: 2 }}
                                >
                                    Start Free 14-Day Trial
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<PlayArrowIcon />}
                                    sx={{ borderColor: '#D0DAE8', color: '#0F2D5C', py: 1.5, px: 4, fontWeight: 'bold', borderRadius: 2 }}
                                >
                                    Watch Demo
                                </Button>
                            </Stack>
                            <Stack direction="row" spacing={4} sx={{ opacity: 0.7 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#0B7A75' }} />
                                    <Typography variant="caption" fontWeight="bold">10,000+ Vehicles Tracked</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#0B7A75' }} />
                                    <Typography variant="caption" fontWeight="bold">SOC 2 Compliant</Typography>
                                </Stack>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                position: 'relative',
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 24px 72px rgba(15,45,92,0.15)',
                                border: '8px solid #FFFFFF'
                            }}>
                                <img
                                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
                                    alt="Dashboard Mockup"
                                    style={{ width: '100%', display: 'block' }}
                                />
                                <Box sx={{
                                    position: 'absolute', bottom: 20, left: 20, right: 20,
                                    bgcolor: 'rgba(255,255,255,0.95)', p: 2, borderRadius: 2,
                                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <NavigationIcon sx={{ color: 'white', fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" fontWeight="bold" display="block">Vehicle #402 (Active)</Typography>
                                            <Typography variant="caption" color="textSecondary">Speed: 64 km/h • Route: Highway 101</Typography>
                                        </Box>
                                    </Stack>
                                    <Box sx={{ px: 1, py: 0.5, bgcolor: '#E0F2F1', borderRadius: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="#0B7A75">ON TRACK</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Social Proof */}
            <Box sx={{ py: 6, opacity: 0.5, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ mb: 3 }}>TRUSTED BY LOGISTICS TEAMS ACROSS 30 COUNTRIES</Typography>
                <Stack direction="row" spacing={6} justifyContent="center" flexWrap="wrap">
                    {['LOGISTICOS', 'FASTMOV', 'GLOBALHUB', 'SHIPPERA', 'ROADWAY'].map(logo => (
                        <Typography key={logo} variant="h6" fontWeight="bold">{logo}</Typography>
                    ))}
                </Stack>
            </Box>

            {/* Features Grid */}
            <Box sx={{ py: 10, bgcolor: '#FFFFFF' }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 800, mb: 1, color: '#0F2D5C' }}>Powerful Tracking Features</Typography>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#5A6A80', mb: 8, fontWeight: 400 }}>Built for precision and performance.</Typography>

                    <Grid container spacing={4}>
                        {[
                            { title: 'Live Map Tracking', desc: 'See all vehicles updated every 5 seconds with precise telemetry.', icon: <MapIcon sx={{ fontSize: 40 }} /> },
                            { title: 'Geofence Alerts', desc: 'Instant notifications when assets enter or exit designated zones.', icon: <NotificationsActiveIcon sx={{ fontSize: 40 }} /> },
                            { title: 'Trip History', desc: 'Full route playback with detailed speed and stop analytics.', icon: <HistoryIcon sx={{ fontSize: 40 }} /> },
                            { title: 'Driver Behaviour', desc: 'Monitor speed, harsh braking, and idle time to improve safety.', icon: <SpeedIcon sx={{ fontSize: 40 }} /> },
                            { title: 'Fleet Reports', desc: 'Automated daily, weekly, and monthly PDF reports in your inbox.', icon: <AssessmentIcon sx={{ fontSize: 40 }} /> },
                            { title: 'Infra Health', desc: 'Enterprise admin dashboard for monitoring CPU, DB, and uptime.', icon: <MonitorHeartIcon sx={{ fontSize: 40 }} /> }
                        ].map((f, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Card className={classes.featureCard} elevation={0}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box sx={{ color: '#0B7A75', mb: 2 }}>{f.icon}</Box>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>{f.title}</Typography>
                                        <Typography variant="body2" color="#5A6A80" lineHeight={1.6}>{f.desc}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* How it Works */}
            <Box sx={{ py: 12, bgcolor: '#F4F7FC' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 800, mb: 8, color: '#0F2D5C' }}>Get Started in 3 Steps</Typography>
                    <Grid container spacing={4} sx={{ position: 'relative' }}>
                        {[
                            { step: '1', title: 'Add your device', sub: 'Takes under 2 minutes' },
                            { step: '2', title: 'See it live', sub: 'Instant map updates' },
                            { step: '3', title: 'Set alerts', sub: 'Receive notifications' }
                        ].map((s, i) => (
                            <Grid item xs={12} md={4} key={i} sx={{ textAlign: 'center' }}>
                                <Box sx={{
                                    width: 60, height: 60, borderRadius: '50%', bgcolor: '#0F2D5C',
                                    color: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, fontWeight: 'bold'
                                }}>
                                    {s.step}
                                </Box>
                                <Typography variant="h6" fontWeight="bold">{s.title}</Typography>
                                <Typography variant="body2" color="textSecondary">{s.sub}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Pricing Section */}
            <Box sx={{ py: 12, bgcolor: '#FFFFFF' }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 800, mb: 1, color: '#0F2D5C' }}>Simple, Transparent Pricing</Typography>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#5A6A80', mb: 8, fontWeight: 400 }}>2 months free with annual billing.</Typography>

                    <Grid container spacing={4} justifyContent="center">
                        {pricingConfig.map((p, i) => (
                            <Grid item xs={12} md={4} key={i}>
                                <Box className={`${classes.pricingCard} ${p.popular ? classes.popularCard : ''}`}>
                                    {p.popular && (
                                        <Box sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', bgcolor: '#0F2D5C', color: 'white', px: 2, py: 0.5, borderRadius: 10, fontSize: 10, fontWeight: 'bold' }}>
                                            MOST POPULAR
                                        </Box>
                                    )}
                                    <Typography variant="h6" fontWeight="bold">{p.name}</Typography>
                                    <Typography variant="h3" fontWeight="900" sx={{ my: 3, color: '#0F2D5C' }}>{p.price}</Typography>
                                    <Stack spacing={2} sx={{ mb: 4, textAlign: 'left' }}>
                                        {p.features.map(f => (
                                            <Stack direction="row" spacing={1} key={f}>
                                                <CheckCircleIcon sx={{ color: '#0B7A75', fontSize: 20 }} />
                                                <Typography variant="body2">{f}</Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                    <Button
                                        fullWidth
                                        variant={p.popular ? 'contained' : 'outlined'}
                                        sx={{ py: 1.5, fontWeight: 'bold', bgcolor: p.popular ? '#0F2D5C' : 'transparent', color: p.popular ? 'white' : '#0F2D5C' }}
                                    >
                                        Choose {p.name}
                                    </Button>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Footer */}
            <Box className={classes.footer}>
                <Container maxWidth="lg">
                    <Grid container spacing={8}>
                        <Grid item xs={12} md={4}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                <Box sx={{ bgcolor: '#0B7A75', p: 0.5, borderRadius: 1 }}>
                                    <NavigationIcon sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                                <Typography variant="h6" fontWeight="bold" color="#0F2D5C">GeoSurePath</Typography>
                            </Stack>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                                Industry-leading GPS intelligence for modern fleet operations. Real-time insights, automated reports, and infrastructure health monitoring.
                            </Typography>
                        </Grid>
                        {['Product', 'Company', 'Resources', 'Legal'].map(section => (
                            <Grid item xs={6} md={2} key={section}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 3 }}>{section}</Typography>
                                <Stack spacing={2}>
                                    <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer' }}>Item One</Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer' }}>Item Two</Typography>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                    <Divider sx={{ my: 6, borderColor: '#D0DAE8' }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="textSecondary">© 2026 GeoSurePath Global. All rights reserved.</Typography>
                        <Stack direction="row" spacing={3}>
                            <Typography variant="caption" color="textSecondary">Privacy Policy</Typography>
                            <Typography variant="caption" color="textSecondary">Terms of Service</Typography>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
