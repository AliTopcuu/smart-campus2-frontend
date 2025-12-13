import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdfRounded';
import { useToast } from '@/hooks/useToast';

const mockStudents = [
  { id: 'stu-1', name: 'Ayşe Yılmaz', attended: 15, total: 18, flagged: false },
  { id: 'stu-2', name: 'Mehmet Demir', attended: 11, total: 18, flagged: true },
  { id: 'stu-3', name: 'Selin Kaya', attended: 17, total: 18, flagged: false },
];

export const AttendanceReportPage = () => {
  const { sectionId } = useParams();
  const toast = useToast();
  const [section, setSection] = useState(sectionId ?? 'SEC-01');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleExport = () => {
    toast.info('Rapor PDF olarak indiriliyor (mock)');
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Raporları
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Section"
              value={section}
              onChange={(event) => setSection(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="SEC-01">CENG204 - Section 01</MenuItem>
              <MenuItem value="SEC-02">CENG204 - Section 02</MenuItem>
            </TextField>
            <TextField
              label="Başlangıç"
              type="date"
              value={dateFrom}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <TextField
              label="Bitiş"
              type="date"
              value={dateTo}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <Button
              variant="outlined"
              onClick={handleExport}
              startIcon={<PictureAsPdfIcon />}
            >
              PDF Dışa Aktar
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Öğrenci</TableCell>
                <TableCell align="center">Katıldığı</TableCell>
                <TableCell align="center">Toplam</TableCell>
                <TableCell align="center">Yüzde</TableCell>
                <TableCell align="center">Durum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockStudents.map((student) => {
                const percentage = Math.round((student.attended / student.total) * 100);
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="center">{student.attended}</TableCell>
                    <TableCell align="center">{student.total}</TableCell>
                    <TableCell align="center">{percentage}%</TableCell>
                    <TableCell align="center">
                      {student.flagged ? (
                        <Typography color="error">Flagged</Typography>
                      ) : (
                        <Typography color="success.main">OK</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

