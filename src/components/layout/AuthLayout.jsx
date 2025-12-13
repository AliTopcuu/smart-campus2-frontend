import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { appConfig } from '@/config/appConfig';

export const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ borderRadius: 3, p: 4 }}>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700}>
                {title}
              </Typography>
              <Typography color="text.secondary">
                {subtitle ?? appConfig.appName}
              </Typography>
            </Box>
            {children}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

