import React, { useState, useEffect } from 'react';
import {
  Typography, Grid, Card, CardContent, Switch, FormControlLabel,
  TextField, Divider, Button, Accordion, AccordionSummary, AccordionDetails,
  Snackbar, Alert, Box, Chip, Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SecurityIcon from '@mui/icons-material/Security';
import RouteIcon from '@mui/icons-material/Route';
import SpeedIcon from '@mui/icons-material/Speed';
import { makeStyles } from 'tss-react/mui';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useDispatch } from 'react-redux';
import { errorsActions } from '../store';

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(3),
    maxWidth: 960,
    margin: '0 auto',
  },
  card: {
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    marginBottom: theme.spacing(3),
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  accordionRoot: {
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '12px !important',
    marginBottom: theme.spacing(1.5),
    '&:before': { display: 'none' },
  },
  saveButton: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(1.5, 5),
    borderRadius: 8,
    fontWeight: 'bold',
  },
}));

const DEFAULT_ALERTS = {
  // Vehicle Behavior
  overSpeed: { enabled: false, threshold: 80 },
  harshBraking: { enabled: false, threshold: 0 },
  harshAcceleration: { enabled: false, threshold: 0 },
  sharpTurning: { enabled: false, threshold: 0 },
  excessIdle: { enabled: false, threshold: 5 }, // minutes
  engineOn: { enabled: false },
  engineOff: { enabled: false },
  // Security
  deviceDisconnected: { enabled: false },
  gpsLost: { enabled: false },
  powerCut: { enabled: false },
  batteryLow: { enabled: false, threshold: 20 }, // percent
  ignitionTampering: { enabled: false },
  towAlert: { enabled: false },
  unexpectedStop: { enabled: false },
  // Operational
  routeCompleted: { enabled: false },
  routeDelay: { enabled: false, threshold: 10 }, // minutes
  routeStart: { enabled: false },
  routeViolation: { enabled: false },
};

const AlertToggleRow = ({ label, alertKey, alerts, setAlerts, thresholdLabel, thresholdUnit }) => {
  const alert = alerts[alertKey] || {};
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" py={1}>
      <FormControlLabel
        control={
          <Switch
            checked={!!alert.enabled}
            onChange={(e) => setAlerts((prev) => ({ ...prev, [alertKey]: { ...prev[alertKey], enabled: e.target.checked } }))}
            color="primary"
          />
        }
        label={<Typography variant="body2">{label}</Typography>}
      />
      {thresholdLabel && (
        <TextField
          size="small"
          label={thresholdLabel}
          type="number"
          value={alert.threshold ?? ''}
          onChange={(e) => setAlerts((prev) => ({ ...prev, [alertKey]: { ...prev[alertKey], threshold: Number(e.target.value) } }))}
          InputProps={{ endAdornment: thresholdUnit && <Typography variant="caption" color="textSecondary">{thresholdUnit}</Typography> }}
          sx={{ width: 170 }}
          disabled={!alert.enabled}
        />
      )}
    </Stack>
  );
};

const AlertConfigPage = () => {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();

  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load persisted alert config from server attributes
  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = import.meta.env.VITE_ADMIN_API_URL || '';
        const res = await fetch(`${apiUrl}/api/alerts/client-config`, { credentials: 'include' });
        if (res.ok) {
          const config = await res.json();
          setAlerts({ ...DEFAULT_ALERTS, ...config });
        }
      } catch (_) { }
    };
    load();
  }, []);
  const handleSave = async () => {
    try {
      const apiUrl = import.meta.env.VITE_ADMIN_API_URL || '';
      const res = await fetch(`${apiUrl}/api/alerts/client-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alerts),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to save');
      setSnackbar({ open: true, message: 'Alert configuration saved successfully!', severity: 'success' });
    } catch (error) {
      dispatch(errorsActions.push(error.message));
      setSnackbar({ open: true, message: 'Failed to save configuration.', severity: 'error' });
    }
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'Alert Configuration']}>
      <div className={classes.container}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold">Alert Configuration</Typography>
          <Typography color="textSecondary">Configure all alerts for vehicle behavior, security events, and operational notifications.</Typography>
        </Box>

        {/* VEHICLE BEHAVIOR */}
        <Card className={classes.card}>
          <CardContent>
            <div className={classes.categoryHeader}>
              <DirectionsCarIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">Vehicle Behavior Alerts</Typography>
              <Chip label="Real-time" size="small" color="primary" variant="outlined" />
            </div>
            <Divider sx={{ mb: 2 }} />
            <AlertToggleRow label="Overspeed Alert" alertKey="overSpeed" alerts={alerts} setAlerts={setAlerts} thresholdLabel="Max Speed" thresholdUnit="km/h" />
            <AlertToggleRow label="Harsh Braking Detected" alertKey="harshBraking" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Harsh Acceleration Detected" alertKey="harshAcceleration" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Sharp Turning / Cornering" alertKey="sharpTurning" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Excess Idle Time" alertKey="excessIdle" alerts={alerts} setAlerts={setAlerts} thresholdLabel="Idle Limit" thresholdUnit="min" />
            <AlertToggleRow label="Engine ON Alert" alertKey="engineOn" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Engine OFF Alert" alertKey="engineOff" alerts={alerts} setAlerts={setAlerts} />
          </CardContent>
        </Card>

        {/* SECURITY ALERTS */}
        <Card className={classes.card}>
          <CardContent>
            <div className={classes.categoryHeader}>
              <SecurityIcon color="error" />
              <Typography variant="h6" fontWeight="bold">Security Alerts</Typography>
              <Chip label="Critical" size="small" color="error" variant="outlined" />
            </div>
            <Divider sx={{ mb: 2 }} />
            <AlertToggleRow label="Device Disconnected" alertKey="deviceDisconnected" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="GPS Signal Lost" alertKey="gpsLost" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Power Cut Alert" alertKey="powerCut" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Battery Low Alert" alertKey="batteryLow" alerts={alerts} setAlerts={setAlerts} thresholdLabel="Low Threshold" thresholdUnit="%" />
            <AlertToggleRow label="Ignition Tampering Detected" alertKey="ignitionTampering" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Tow Alert" alertKey="towAlert" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Vehicle Stopped Unexpectedly" alertKey="unexpectedStop" alerts={alerts} setAlerts={setAlerts} />
          </CardContent>
        </Card>

        {/* OPERATIONAL ALERTS */}
        <Card className={classes.card}>
          <CardContent>
            <div className={classes.categoryHeader}>
              <RouteIcon color="success" />
              <Typography variant="h6" fontWeight="bold">Operational / Route Alerts</Typography>
              <Chip label="Logistics" size="small" color="success" variant="outlined" />
            </div>
            <Divider sx={{ mb: 2 }} />
            <AlertToggleRow label="Route Completed" alertKey="routeCompleted" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Route Delay" alertKey="routeDelay" alerts={alerts} setAlerts={setAlerts} thresholdLabel="Delay Limit" thresholdUnit="min" />
            <AlertToggleRow label="Route Started" alertKey="routeStart" alerts={alerts} setAlerts={setAlerts} />
            <AlertToggleRow label="Route Violation / Deviation" alertKey="routeViolation" alerts={alerts} setAlerts={setAlerts} />
          </CardContent>
        </Card>

        {/* SPEED LIMITS */}
        <Accordion className={classes.accordionRoot}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SpeedIcon color="action" />
              <Typography fontWeight="bold">Global Speed Limit Defaults</Typography>
              <Chip label="Advanced" size="small" variant="outlined" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Set global speed defaults. These are reflected in all overspeed calculations across the entire fleet.
            </Typography>
            <Grid container spacing={3} mt={1}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Default Speed Limit"
                  type="number"
                  value={alerts.defaultSpeedLimit || 80}
                  onChange={(e) => setAlerts(prev => ({ ...prev, defaultSpeedLimit: Number(e.target.value) }))}
                  InputProps={{ endAdornment: <Typography variant="caption" color="textSecondary">km/h</Typography> }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Urban Zone Speed Limit"
                  type="number"
                  value={alerts.urbanSpeedLimit || 50}
                  onChange={(e) => setAlerts(prev => ({ ...prev, urbanSpeedLimit: Number(e.target.value) }))}
                  InputProps={{ endAdornment: <Typography variant="caption" color="textSecondary">km/h</Typography> }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Highway Speed Limit"
                  type="number"
                  value={alerts.highwaySpeedLimit || 120}
                  onChange={(e) => setAlerts(prev => ({ ...prev, highwaySpeedLimit: Number(e.target.value) }))}
                  InputProps={{ endAdornment: <Typography variant="caption" color="textSecondary">km/h</Typography> }}
                  size="small"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Button
          variant="contained"
          color="primary"
          className={classes.saveButton}
          onClick={handleSave}
        >
          Save All Alert Settings
        </Button>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </div>
    </PageLayout>
  );
};

export default AlertConfigPage;
