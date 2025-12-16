import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { excuseService } from '@/services/excuseService';
import { enrollmentService } from '@/services/enrollmentService';
import { useToast } from '@/hooks/useToast';

export const ExcuseRequestsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'faculty' || user?.role === 'admin';

  // Öğrenci için state'ler
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [document, setDocument] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Öğretmen için state'ler
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Öğrenci için kursları yükle
  useEffect(() => {
    if (isStudent) {
      loadMyCourses();
      loadMyRequests();
    }
  }, [isStudent]);

  // Öğretmen için bekleyen talepleri yükle
  useEffect(() => {
    if (isInstructor) {
      loadPendingRequests();
    }
  }, [isInstructor]);

  // Tarih değiştiğinde session'ları yükle
  useEffect(() => {
    if (isStudent && selectedSectionId && selectedDate) {
      loadSessions();
    } else {
      setSessions([]);
      setSelectedSessionId('');
    }
  }, [selectedSectionId, selectedDate, isStudent]);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      const courses = await enrollmentService.myCourses();
      setMyCourses(courses);
    } catch (error) {
      toast.error('Dersler yüklenirken bir hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionList = await excuseService.getSessions(Number(selectedSectionId), selectedDate);
      setSessions(sessionList);
      if (sessionList.length === 1) {
        setSelectedSessionId(String(sessionList[0].id));
      }
    } catch (error) {
      toast.error('Yoklama oturumları yüklenirken bir hata oluştu');
      console.error(error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const requests = await excuseService.getMyRequests();
      setMyRequests(requests);
    } catch (error) {
      toast.error('Mazeret talepleri yüklenirken bir hata oluştu');
      console.error(error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const requests = await excuseService.getPendingRequests();
      setPendingRequests(requests);
    } catch (error) {
      toast.error('Bekleyen mazeret talepleri yüklenirken bir hata oluştu');
      console.error(error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocument(file);
      // Preview için
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedSessionId || !reason.trim()) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    try {
      setSubmitting(true);
      await excuseService.submit({
        sessionId: Number(selectedSessionId), // Backend'e number olarak gönder
        reason: reason.trim(),
        document: document
      });
      toast.success('Mazeret talebiniz başarıyla gönderildi');
      // Formu temizle
      setSelectedSectionId('');
      setSelectedDate('');
      setSelectedSessionId('');
      setReason('');
      setDocument(null);
      setDocumentPreview(null);
      // Talepleri yenile
      loadMyRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mazeret talebi gönderilirken bir hata oluştu');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewClick = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      if (reviewAction === 'approve') {
        await excuseService.approve(selectedRequest.id, reviewNotes);
        toast.success('Mazeret talebi onaylandı');
      } else {
        await excuseService.reject(selectedRequest.id, reviewNotes);
        toast.success('Mazeret talebi reddedildi');
      }
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      loadPendingRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem sırasında bir hata oluştu');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'pending':
        return 'Beklemede';
      default:
        return status;
    }
  };

  // Öğrenci görünümü
  if (isStudent) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Mazeret Talepleri
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Yeni Mazeret Talebi
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Ders Seçin</InputLabel>
                    <Select
                      value={selectedSectionId || ''}
                      label="Ders Seçin"
                      onChange={(e) => {
                        setSelectedSectionId(e.target.value);
                        setSelectedDate('');
                        setSelectedSessionId('');
                      }}
                      disabled={loading}
                    >
                      {myCourses.map((course) => {
                        const sectionIdValue = String(course.sectionId || course.enrollmentId); // String'e çevir
                        return (
                          <MenuItem key={course.enrollmentId} value={sectionIdValue}>
                            {course.course.code} - {course.course.name} (Şube {course.section.sectionNumber})
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {selectedSectionId && (
                    <TextField
                      label="Tarih"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      inputProps={{
                        max: new Date().toISOString().split('T')[0], // Bugünden önceki tarihler
                      }}
                      helperText="Yoklama yapılan günün tarihini seçin"
                    />
                  )}

                  {selectedDate && sessions.length > 0 && (
                    <FormControl fullWidth>
                      <InputLabel>Yoklama Oturumu</InputLabel>
                      <Select
                        value={selectedSessionId || ''}
                        label="Yoklama Oturumu"
                        onChange={(e) => setSelectedSessionId(String(e.target.value))}
                        disabled={loading}
                      >
                        {sessions.map((session) => (
                          <MenuItem key={session.id} value={String(session.id)}>
                            {session.startTime} - {session.endTime || 'Bitiş yok'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {selectedDate && sessions.length === 0 && !loading && (
                    <Alert severity="info">
                      Bu tarih için yoklama oturumu bulunamadı.
                    </Alert>
                  )}

                  {selectedSessionId && (
                    <>
                      <TextField
                        label="Açıklama"
                        multiline
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        fullWidth
                        required
                        helperText="Mazeret nedeninizi detaylı olarak açıklayın"
                      />

                      <Button variant="outlined" component="label" fullWidth>
                        Belge Yükle (Opsiyonel)
                        <input
                          type="file"
                          hidden
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleDocumentChange}
                        />
                      </Button>

                      {document && (
                        <Alert severity="info">
                          Seçilen dosya: {document.name}
                        </Alert>
                      )}

                      {documentPreview && (
                        <Box>
                          <Typography variant="body2" mb={1}>
                            Belge Önizleme:
                          </Typography>
                          <img
                            src={documentPreview}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                          />
                        </Box>
                      )}

                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting || !reason.trim()}
                        fullWidth
                      >
                        {submitting ? <CircularProgress size={24} /> : 'Gönder'}
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Mazeret Taleplerim
                </Typography>
                {myRequests.length === 0 ? (
                  <Alert severity="info">Henüz mazeret talebiniz bulunmamaktadır.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ders</TableCell>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Durum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.session.sectionName}</TableCell>
                          <TableCell>
                            {new Date(request.session.date).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(request.status)}
                              color={getStatusColor(request.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Öğretmen görünümü
  if (isInstructor) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Mazeret Talepleri
        </Typography>
        {loadingRequests ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : pendingRequests.length === 0 ? (
          <Alert severity="info">Bekleyen mazeret talebi bulunmamaktadır.</Alert>
        ) : (
          <Grid container spacing={2}>
            {pendingRequests.map((request) => (
              <Grid item xs={12} key={request.id}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                          {request.session.sectionName}
                        </Typography>
                        <Chip
                          label={getStatusText(request.status)}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </Box>
                      <Divider />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Öğrenci
                          </Typography>
                          <Typography variant="body1">
                            {request.student.fullName}
                            {request.student.studentNumber && ` (${request.student.studentNumber})`}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Tarih
                          </Typography>
                          <Typography variant="body1">
                            {new Date(request.session.date).toLocaleDateString('tr-TR')}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Açıklama
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            <Typography variant="body1" whiteSpace="pre-wrap">
                              {request.reason}
                            </Typography>
                          </Paper>
                        </Grid>
                        {request.documentUrl && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                              Belge
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              href={request.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Belgeyi Görüntüle
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleReviewClick(request, 'approve')}
                        >
                          Onayla
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleReviewClick(request, 'reject')}
                        >
                          Reddet
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Onay/Reddet Dialog */}
        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {reviewAction === 'approve' ? 'Mazeret Talebini Onayla' : 'Mazeret Talebini Reddet'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Notlar (Opsiyonel)"
              multiline
              rows={4}
              fullWidth
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Onay veya red nedeni hakkında notlar ekleyebilirsiniz..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleReviewSubmit}
              variant="contained"
              color={reviewAction === 'approve' ? 'success' : 'error'}
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} />
              ) : reviewAction === 'approve' ? (
                'Onayla'
              ) : (
                'Reddet'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Alert severity="warning">
      Bu sayfaya erişim yetkiniz bulunmamaktadır.
    </Alert>
  );
};
