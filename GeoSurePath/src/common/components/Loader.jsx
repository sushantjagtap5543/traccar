import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import LogoImage from '../../login/LogoImage';

const Loader = () => {
  useEffect(() => {
    const loader = document.getElementById('preloader');
    if (loader) loader.style.display = 'none';
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: (theme) => theme.zIndex.drawer + 100,
      }}
    >
      <LogoImage />
      <CircularProgress sx={{ mt: 4 }} color="primary" />
    </Box>
  );
};

export default Loader;
