import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h3" fontWeight={700}>
        404
      </Typography>
      <Typography color="text.secondary">
        Aradığınız sayfa bulunamadı.
      </Typography>
      <Button component={RouterLink} to="/dashboard" variant="contained">
        Ana sayfaya dön
      </Button>
    </Box>
  );
};

