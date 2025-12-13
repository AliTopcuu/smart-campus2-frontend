import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const mockPending = [
  { id: 'req-1', student: 'Ayşe Yılmaz', date: '2025-03-02', reason: 'Sağlık raporu' },
  { id: 'req-2', student: 'Mehmet Demir', date: '2025-03-04', reason: 'Aile ziyareti' },
];

export const ExcuseRequestsPage = () => {
  const [reason, setReason] = useState('');
  const [fileName, setFileName] = useState(null);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Mazeret Talepleri
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Mazeret Talep Formu
              </Typography>
              <Stack spacing={2}>
                <TextField label="Ders" placeholder="CENG204" fullWidth />
                <TextField
                  label="Tarih"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Açıklama"
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <Button variant="outlined" component="label">
                  Belge Yükle
                  <input
                    type="file"
                    hidden
                    onChange={(event) =>
                      setFileName(event.target.files?.[0]?.name ?? null)
                    }
                  />
                </Button>
                {fileName && (
                  <Alert severity="info">Yüklenen dosya: {fileName}</Alert>
                )}
                <Button variant="contained">Gönder</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Bekleyen Talepler
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Öğrenci</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Gerekçe</TableCell>
                    <TableCell align="right">İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPending.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.student}</TableCell>
                      <TableCell>{req.date}</TableCell>
                      <TableCell>{req.reason}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1}>
                          <Button size="small" color="success">
                            Onayla
                          </Button>
                          <Button size="small" color="error">
                            Reddet
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

