import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const AdminAlertConsumer = () => {
    const [alert, setAlert] = useState(null);
    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || window.location.origin;

    useEffect(() => {
        // Connect to Admin API Socket.IO (Fix for Phase 2 Item 4)
        const socket = io(API_BASE, {
            withCredentials: true,
            path: '/socket.io'
        });

        socket.on('connect', () => {
            console.log('Admin Socket.IO connected');
        });

        socket.on('new_alert', (data) => {
            setAlert({
                severity: 'warning',
                title: 'Network/Storage Alert',
                message: data.message
            });
        });

        socket.on('urgent_alert', (data) => {
            setAlert({
                severity: 'error',
                title: 'URGENT: Infrastructure Alert',
                message: data.message
            });
        });

        socket.on('disconnect', () => {
            console.log('Admin Socket.IO disconnected');
        });

        return () => socket.disconnect();
    }, [API_BASE]);

    const handleClose = () => setAlert(null);

    if (!alert) return null;

    return (
        <Snackbar 
            open={!!alert} 
            autoHideDuration={8000} 
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert onClose={handleClose} severity={alert.severity} sx={{ width: '100%', boxShadow: 3 }}>
                <AlertTitle>{alert.title}</AlertTitle>
                {alert.message}
            </Alert>
        </Snackbar>
    );
};

export default AdminAlertConsumer;
