import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, TextField, Typography, Snackbar, IconButton, Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import LogoImage from './LogoImage';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch, useEffectAsync } from '../reactHelper';
import { sessionActions } from '../store';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.spacing(3),
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    gap: theme.spacing(2),
  },
}));

const RegisterPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const server = useSelector((state) => state.session.server);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [vehicles, setVehicles] = useState([{ name: '', number: '', imei: '' }]);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { name: '', number: '', imei: '' }]);
  };

  const handleVehicleChange = (index, field, value) => {
    const newVehicles = [...vehicles];
    newVehicles[index][field] = value;
    setVehicles(newVehicles);
  };

  const handleRemoveVehicle = (index) => {
    const newVehicles = [...vehicles];
    newVehicles.splice(index, 1);
    setVehicles(newVehicles);
  };

  const handleSendOtp = () => {
    if (mobile.length >= 10) {
      setOtpSent(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Enter valid mobile number for OTP');
    }
  };

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (otp !== '1234') {
      setErrorMessage('Invalid OTP. Use 1234 for testing.');
      return;
    }

    const IndianPlateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i;
    for (const v of vehicles) {
       if (!IndianPlateRegex.test(v.number)) {
         setErrorMessage(`Invalid Indian Vehicle Number format for ${v.number}. Eg: MH12AB1234`);
         return;
       }
    }

    const name = `${firstName} ${lastName}`.trim();

    let user;
    try {
      const userRes = await fetchOrThrow('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: mobile }),
      });
      user = await userRes.json();
    } catch (err) {
      setErrorMessage('Failed to register user. Email might exist.');
      return;
    }

    let sessionUser;
    try {
      const loginRes = await fetchOrThrow('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password }).toString(),
      });
      sessionUser = await loginRes.json();
      dispatch(sessionActions.updateUser(sessionUser));
    } catch (err) {
      console.warn('Auto-login failed, skipping device creation context', err);
    }

    if (sessionUser) {
      for (const v of vehicles) {
        try {
          const deviceRes = await fetchOrThrow('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: v.name,
              uniqueId: v.imei,
              phone: mobile,
              category: 'car',
              attributes: { vehicleNumber: v.number }
            })
          });
          const device = await deviceRes.json();

          fetchOrThrow('/api/commands/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               deviceId: device.id,
               type: 'custom',
               attributes: { data: 'SERVER,0,3.108.114.12,5023,0#' }
            })
          }).catch(err => console.log('Mock/Real backend command routing not supported yet', err));
        } catch (err) {
           console.warn(`Device linking failed for ${v.name}`, err);
           setErrorMessage(`Failed to bind device ${v.name}. Proceeding with others...`);
        }
      }
    }

    setSnackbarOpen(true);
    setTimeout(() => {
        window.location.replace('/');
    }, 1500);
  });

  return (
    <LoginLayout>
      <div className={classes.container}>
        <div className={classes.header}>
          <div className={classes.titleWrapper}>
            {!server?.newServer && (
              <IconButton color="primary" onClick={() => navigate('/login')}>
                <BackIcon />
              </IconButton>
            )}
            <Typography className={classes.title} color="primary">
              Register & Setup
            </Typography>
          </div>
          <Button variant="outlined" onClick={() => navigate('/login')} size="small">
            Login
          </Button>
        </div>

        <LogoImage color={theme.palette.primary.main} />

        {errorMessage && (
          <Typography color="error" variant="body2">{errorMessage}</Typography>
        )}

        <Box className={classes.row}>
          <TextField required label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth autoFocus />
          <TextField required label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
        </Box>

        <TextField required type="email" label="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} />
        
        <Box className={classes.row}>
          <TextField required label="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} fullWidth />
          <Button variant="contained" onClick={handleSendOtp} disabled={otpSent || mobile.length < 10}>
            {otpSent ? 'Sent' : 'Get OTP'}
          </Button>
        </Box>

        {otpSent && (
          <TextField required label="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
        )}

        <Typography variant="subtitle2" sx={{ mt: 2 }}>Vehicle Information</Typography>
        {vehicles.map((v, index) => (
           <Box key={index} sx={{ border: '1px solid #ddd', padding: 2, borderRadius: 1, mb: 2 }}>
              <Box className={classes.row} sx={{ mb: 2 }}>
                <TextField required label="Vehicle Model (e.g. Swift)" value={v.name} onChange={(e) => handleVehicleChange(index, 'name', e.target.value)} fullWidth />
                <TextField required label="Vehicle Number" placeholder="MH12AB1234" value={v.number} onChange={(e) => handleVehicleChange(index, 'number', e.target.value.toUpperCase())} fullWidth />
              </Box>
              <Box className={classes.row} sx={{ alignItems: 'center' }}>
                 <TextField required label="Device IMEI" value={v.imei} onChange={(e) => handleVehicleChange(index, 'imei', e.target.value)} fullWidth />
                 {vehicles.length > 1 && (
                    <Button variant="text" color="error" onClick={() => handleRemoveVehicle(index)}>Remove</Button>
                 )}
              </Box>
           </Box>
        ))}

        <Button variant="outlined" onClick={handleAddVehicle} sx={{ mb: 2 }}>
          + Add another vehicle
        </Button>

        <TextField required label="Create Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmit}
          type="submit"
          disabled={!firstName || !email || !mobile || !otpSent || !otp || !password || vehicles.some(v => !v.name || !v.number || !v.imei)}
          fullWidth
        >
          Register & Bind GPS
        </Button>
      </div>
      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={snackBarDurationShortMs}
        message="Registration Successful! Welcome to GeoSurePath."
      />
    </LoginLayout>
  );
};

export default RegisterPage;
