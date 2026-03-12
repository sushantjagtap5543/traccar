import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, TextField,
  Link, Grid, Stack, Checkbox, FormControlLabel,
  InputAdornment, IconButton, useTheme, useMediaQuery,
  Snackbar, Alert
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MapIcon from '@mui/icons-material/Map';
import NavigationIcon from '@mui/icons-material/Navigation';
import CloseIcon from '@mui/icons-material/Close';

import { sessionActions } from '../store';
import { useTranslation } from '../common/components/LocalizationProvider';
import { generateLoginToken } from '../common/components/NativeInterface';
import fetchOrThrow from '../common/util/fetchOrThrow';
import usePersistedState from '../common/util/usePersistedState';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
  },
  leftPanel: {
    flex: '0 0 55%',
    backgroundColor: '#0F2D5C',
    color: 'white',
    padding: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  rightPanel: {
    flex: '1',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  mapGrid: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 600,
    height: 600,
    opacity: 0.1,
    background: 'radial-gradient(circle, #0B7A75 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    transform: 'rotate(-15deg)',
  }
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);

  const handleLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(`${apiUrl}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: query
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem('postLogin') || '/';
        window.sessionStorage.removeItem('postLogin');
        navigate(target, { replace: true });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (e) {
      setFailed(true);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={classes.root}>
      {/* Left Panel */}
      <Box className={classes.leftPanel}>
        <Box sx={{ mb: 4 }}>
          <img src="/logo.png" alt="GeoSurePath Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        </Box>

        <Box>
          <Typography variant="h2" fontWeight="800" sx={{ mb: 2, lineHeight: 1.2 }}>
            Your Fleet,<br />Under Control.
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 6, maxWidth: 450, fontWeight: 400 }}>
            Monitor, track, and manage all your vehicles from one professional dashboard.
          </Typography>

          <Stack spacing={3}>
            {[
              'Live GPS positions updated every 5 seconds',
              'Instant geofence and speed alerts',
              'Full trip history and driver reports'
            ].map((text, i) => (
              <Stack direction="row" spacing={2} key={i} alignItems="center">
                <CheckCircleIcon sx={{ color: '#0B7A75' }} />
                <Typography variant="body1">{text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          © 2026 GeoSurePath Global. Security is our priority.
        </Typography>

        <Box className={classes.mapGrid} />
      </Box>

      {/* Right Panel */}
      <Box className={classes.rightPanel}>
        <Container maxWidth="xs" sx={{ p: 0 }}>
          <Box sx={{ mb: 4 }}>
            <img src="/logo.png" alt="GeoSurePath Logo" style={{ height: 36, marginBottom: 16 }} />
            <Typography variant="h4" fontWeight="bold" color="#0F2D5C">Welcome Back</Typography>
            <Typography variant="body2" color="textSecondary">Sign in to your GeoSurePath account</Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin}>
            <Stack spacing={3}>
              <TextField
                required
                fullWidth
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                error={failed}
              />
              <TextField
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                error={failed}
                helperText={failed ? "Invalid email or password" : ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel control={<Checkbox size="small" />} label={<Typography variant="caption">Remember me</Typography>} />
                <Link onClick={() => navigate('/reset-password')} sx={{ cursor: 'pointer', fontSize: 12, fontWeight: 'bold', color: '#0B7A75' }} underline="none">Forgot password?</Link>
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ bgcolor: '#0B7A75', '&:hover': { bgcolor: '#08635F' }, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 4 }}>OR</Divider>

          <Box textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Don't have an account? {' '}
              <Link
                onClick={() => navigate('/register')}
                sx={{ cursor: 'pointer', fontWeight: 'bold', color: '#0B7A75' }}
                underline="none"
              >
                Start your free trial →
              </Link>
            </Typography>
          </Box>

          <Box mt={8} textAlign="center">
            <Stack direction="row" spacing={2} justifyContent="center">
              <Link variant="caption" color="textSecondary" href="#">Privacy Policy</Link>
              <Link variant="caption" color="textSecondary" href="#">Terms of Service</Link>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;
