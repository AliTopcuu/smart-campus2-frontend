import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingScreen = ({ message = 'Yükleniyor...', fullscreen = true }: LoadingScreenProps) => {
  return (
    <Box
      sx={{
        minHeight: fullscreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: fullscreen ? 0 : 4,
      }}
    >
      <CircularProgress color="primary" />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
};

