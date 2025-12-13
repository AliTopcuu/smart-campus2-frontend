import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAuth } from '@/context/AuthContext';

const overviewCards = [
  { title: 'Kimlik Yönetimi', description: 'Kullanıcı rollerini yönetin, yeni kullanıcılar oluşturun.' },
  { title: 'Akademik Durum', description: 'Ders kayıtlarınızı ve danışman geri bildirimlerini görüntüleyin.' },
  { title: 'Yoklama & GPS', description: 'Ders bazında yoklamalarınızı takip edin.' },
];

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Hoş geldin, {user?.fullName} 👋
        </Typography>
        <Typography color="text.secondary">
          Bu sayfa Part 1 kapsamındaki kimlik doğrulama ve kullanıcı yönetimi özelliklerinin bir önizlemesini sunar.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {overviewCards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Typography color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

