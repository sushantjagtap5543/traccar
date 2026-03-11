import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Drawer, Typography, TextField, Button, Box, Switch, FormControlLabel, IconButton, Divider, Snackbar, Alert, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from 'tss-react/mui';
import { geofencesActions, errorsActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  drawerPaper: {
    width: 320,
    boxSizing: 'border-box',
    padding: theme.spacing(3),
    boxShadow: theme.shadows[5],
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  formControl: {
    marginBottom: theme.spacing(3),
  },
  saveButton: {
    marginTop: theme.spacing(3),
  },
}));

const MapGeofenceDrawer = ({ open, geofenceId, onClose }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  
  const geofence = useSelector((state) => state.geofences.items[geofenceId]);
  
  const [name, setName] = useState('');
  const [speedLimit, setSpeedLimit] = useState('');
  const [entryAlert, setEntryAlert] = useState(false);
  const [exitAlert, setExitAlert] = useState(false);
  const [routeRestriction, setRouteRestriction] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (geofence) {
      setName(geofence.name || '');
      setSpeedLimit(geofence.attributes.speedLimit || '');
      setEntryAlert(geofence.attributes.entryAlert === true);
      setExitAlert(geofence.attributes.exitAlert === true);
      setRouteRestriction(geofence.attributes.routeRestriction || '');
    }
  }, [geofence]);

  const handleSave = async () => {
    if (!geofence) return;

    const updatedItem = {
      ...geofence,
      name,
      attributes: {
        ...geofence.attributes,
        speedLimit: speedLimit ? Number(speedLimit) : undefined,
        entryAlert,
        exitAlert,
        routeRestriction: routeRestriction || undefined,
      },
    };

    try {
      await fetchOrThrow(`/api/geofences/${geofence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      const response = await fetchOrThrow('/api/geofences');
      dispatch(geofencesActions.refresh(await response.json()));
      setSnackbar({ open: true, message: 'Geofence properties saved.', severity: 'success' });
      onClose();
    } catch (error) {
      dispatch(errorsActions.push(error.message));
      setSnackbar({ open: true, message: 'Failed to save geofence properties.', severity: 'error' });
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawerPaper }}
      variant="persistent"
    >
      <div className={classes.header}>
        <Typography variant="h6">Geofence Configuration</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </div>
      <Divider sx={{ mb: 3 }} />

      <Box className={classes.formControl}>
        <TextField
          label="Geofence Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          variant="outlined"
          placeholder="e.g. Warehouse A"
        />
      </Box>

      <Typography variant="subtitle2" color="textSecondary" gutterBottom>Alerts & Safety</Typography>
      <Box className={classes.formControl}>
        <TextField
          label="Speed Limit (km/h) for this zone"
          type="number"
          value={speedLimit}
          onChange={(e) => setSpeedLimit(e.target.value)}
          fullWidth
          variant="outlined"
          InputProps={{ inputProps: { min: 0 } }}
        />
      </Box>

      <Box className={classes.formControl}>
         <FormControlLabel
            control={<Switch checked={entryAlert} onChange={(e) => setEntryAlert(e.target.checked)} color="primary" />}
            label="Enable Entry Alert"
         />
         <FormControlLabel
            control={<Switch checked={exitAlert} onChange={(e) => setExitAlert(e.target.checked)} color="primary" />}
            label="Enable Exit Alert"
         />
      </Box>

      <Typography variant="subtitle2" color="textSecondary" gutterBottom>Route Restrictions</Typography>
      <Box className={classes.formControl}>
         <TextField
          label="Assign Route ID to zone"
          value={routeRestriction}
          onChange={(e) => setRouteRestriction(e.target.value)}
          fullWidth
          variant="outlined"
          placeholder="Route ID (optional)"
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        className={classes.saveButton}
        onClick={handleSave}
      >
        Save Properties
      </Button>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Drawer>
  );
};

export default MapGeofenceDrawer;
