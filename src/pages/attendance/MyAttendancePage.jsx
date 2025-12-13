import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const mockAttendance = [
  { id: 'CENG101', course: 'Intro to Computer Engineering', total: 20, attended: 17, excused: 1 },
  { id: 'MATH105', course: 'Calculus I', total: 18, attended: 12, excused: 0 },
  { id: 'PHYS101', course: 'Physics I', total: 19, attended: 11, excused: 2 },
];

const getStatus = (attended, total) => {
  const percentage = Math.round((attended / total) * 100);
  if (percentage >= 80) return { label: `OK (${percentage}%)`, color: 'success' };
  if (percentage >= 70) return { label: `Warning (${percentage}%)`, color: 'warning' };
  return { label: `Critical (${percentage}%)`, color: 'error' };
};

export const MyAttendancePage = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Durumum
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Ders</TableCell>
            <TableCell align="center">Toplam Oturum</TableCell>
            <TableCell align="center">Katıldığım</TableCell>
            <TableCell align="center">Mazeret</TableCell>
            <TableCell align="center">Durum</TableCell>
            <TableCell align="right">İşlem</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockAttendance.map((item) => {
            const status = getStatus(item.attended + item.excused, item.total);
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography fontWeight={600}>{item.id}</Typography>
                  <Typography color="text.secondary">{item.course}</Typography>
                </TableCell>
                <TableCell align="center">{item.total}</TableCell>
                <TableCell align="center">{item.attended}</TableCell>
                <TableCell align="center">{item.excused}</TableCell>
                <TableCell align="center">
                  <Chip label={status.label} color={status.color} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedCourse(item.id)}
                  >
                    Mazeret Talep Et
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={Boolean(selectedCourse)} onClose={() => setSelectedCourse(null)}>
        <DialogTitle>Mazeret Talebi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedCourse} dersindeki devamsızlığınız için mazeret belirtin.
          </DialogContentText>
          <Stack spacing={2} mt={2}>
            <TextField label="Tarih" type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Açıklama" multiline rows={3} />
            <Button variant="outlined" component="label">
              Belge Yükle
              <input type="file" hidden />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCourse(null)}>İptal</Button>
          <Button variant="contained" onClick={() => setSelectedCourse(null)}>
            Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

