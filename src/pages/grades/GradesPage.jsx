import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/FileDownloadRounded';
import ShowChartIcon from '@mui/icons-material/ShowChartRounded';
import { jsPDF } from 'jspdf';
import { gradeService } from '@/services/gradeService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';

export const GradesPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-grades', selectedYear, selectedSemester],
    queryFn: () => gradeService.myGrades({
      year: selectedYear || undefined,
      semester: selectedSemester || undefined
    }),
    staleTime: 0, // Always refetch when component mounts
    cacheTime: 0, // Don't cache data
  });

  // Get all grades for filter options (always fetch, regardless of filters)
  const { data: allGradesData } = useQuery({
    queryKey: ['my-grades-all'],
    queryFn: () => gradeService.myGrades({}), // Fetch all without filters
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: transcriptData } = useQuery({
    queryKey: ['transcript'],
    queryFn: () => gradeService.transcript(),
    enabled: false, // Only fetch when needed
  });

  const handleDownloadTranscript = async () => {
    try {
      setIsDownloading(true);
      
      // Fetch transcript data
      let transcript;
      try {
        transcript = await gradeService.transcript();
      } catch (transcriptError) {
        console.error('Error fetching transcript:', transcriptError);
        if (transcriptError?.response?.status === 401) {
          toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
          // Optionally redirect to login
          // window.location.href = '/login';
          setIsDownloading(false);
          return;
        }
        throw transcriptError;
      }
      
      if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
        toast.info('Transkript için henüz tamamlanmış ders bulunmuyor.');
        setIsDownloading(false);
        return;
      }
      
      // Fetch CGPA separately without filters (to get true cumulative GPA)
      let safeCgpaForPdf = null;
      try {
        const allGradesResponse = await gradeService.myGrades({}); // No filters
        safeCgpaForPdf = (allGradesResponse?.cgpa !== undefined && 
                          allGradesResponse?.cgpa !== null && 
                          !isNaN(allGradesResponse?.cgpa)) 
                          ? allGradesResponse.cgpa 
                          : null;
        console.log('CGPA for PDF:', safeCgpaForPdf);
      } catch (cgpaError) {
        console.warn('Could not fetch CGPA for PDF:', cgpaError);
        // Fallback to current data's CGPA if available
        const { cgpa } = allGradesData || {};
        safeCgpaForPdf = (cgpa !== undefined && cgpa !== null && !isNaN(cgpa)) ? cgpa : null;
      }
      
      // Ensure gradePoint is calculated for each course in transcript
      const transcriptWithGradePoints = transcript.map(course => {
        if (!course) return course;
        // Convert gradePoint to number if it's a string
        let gradePoint = course.gradePoint;
        if (typeof gradePoint === 'string') {
          gradePoint = parseFloat(gradePoint);
          if (isNaN(gradePoint)) {
            gradePoint = null;
          }
        }
        
        // If gradePoint is null but letterGrade exists, calculate it
        if ((gradePoint === null || gradePoint === undefined) && course.letterGrade) {
          // Calculate grade point from letter grade
          const gradePoints = {
            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
          };
          const normalizedGrade = String(course.letterGrade).trim().toUpperCase();
          gradePoint = gradePoints[normalizedGrade] !== undefined ? gradePoints[normalizedGrade] : 0.0;
        }
        
        // Ensure gradePoint is a number
        if (gradePoint !== null && gradePoint !== undefined) {
          gradePoint = parseFloat(gradePoint);
          if (isNaN(gradePoint)) {
            gradePoint = 0.0;
          }
        }
        
        return {
          ...course,
          gradePoint: gradePoint
        };
      });

      // Create PDF
      console.log('Creating PDF, jsPDF:', jsPDF);
      if (!jsPDF) {
        throw new Error('PDF kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.');
      }
      
      let doc;
      try {
        // jspdf 3.x uses named export
        doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        console.log('PDF document created successfully');
      } catch (pdfError) {
        console.error('jsPDF constructor error:', pdfError);
        // Try alternative import if needed
        try {
          const jsPDFModule = await import('jspdf');
          doc = new jsPDFModule.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          console.log('PDF document created with alternative import');
        } catch (altError) {
          console.error('Alternative jsPDF import also failed:', altError);
          throw new Error(`PDF oluşturulamadı: ${altError?.message || pdfError?.message || 'Bilinmeyen hata'}`);
        }
      }
      
      // Check if doc.internal exists (jspdf 3.x compatibility)
      if (!doc) {
        throw new Error('PDF dokümanı oluşturulamadı. Lütfen sayfayı yenileyin.');
      }
      
      if (!doc.internal) {
        console.warn('doc.internal is missing, but continuing...');
      }
      
      // Get page dimensions safely
      let pageWidth, pageHeight;
      try {
        if (doc.internal && doc.internal.pageSize) {
          pageWidth = doc.internal.pageSize.getWidth();
          pageHeight = doc.internal.pageSize.getHeight();
        } else {
          // Fallback for jspdf 3.x
          pageWidth = 210; // A4 width in mm
          pageHeight = 297; // A4 height in mm
        }
      } catch (sizeError) {
        console.warn('Could not get page size, using defaults:', sizeError);
        pageWidth = 210;
        pageHeight = 297;
      }
      let yPos = 25;

      // Helper function to handle Turkish characters
      const addText = (text, x, y, options = {}) => {
        // Replace Turkish characters with ASCII equivalents for better compatibility
        const turkishMap = {
          'İ': 'I', 'ı': 'i', 'Ğ': 'G', 'ğ': 'g',
          'Ü': 'U', 'ü': 'u', 'Ş': 'S', 'ş': 's',
          'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c'
        };
        const normalizedText = text.split('').map(char => turkishMap[char] || char).join('');
        doc.text(normalizedText, x, y, options);
      };

      // Header with better styling
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      addText('AKADEMIK TRANSKRIPT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;

      // Draw a line under header
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Student Info Box
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      if (user) {
        const studentNumber = user.studentNumber || user.Student?.studentNumber || 'N/A';
        addText(`Ogrenci Adi: ${user.fullName || 'N/A'}`, 20, yPos);
        yPos += 6;
        addText(`Ogrenci No: ${studentNumber}`, 20, yPos);
        yPos += 6;
        addText(`E-posta: ${user.email || 'N/A'}`, 20, yPos);
        yPos += 6;
      }
      addText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
      yPos += 10;

      // GPA Info Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      addText('Genel Not Ortalamasi (CGPA):', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(safeCgpaForPdf !== null ? safeCgpaForPdf.toFixed(2) : 'N/A', 100, yPos);
      yPos += 12;

      // Table Header with better styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const tableHeaders = ['Ders Kodu', 'Ders Adi', 'Kredi', 'Vize', 'Final', 'Harf', 'Puan'];
      const colWidths = [28, 70, 12, 15, 15, 12, 15];
      let xPos = 20;
      
      // Draw table header background
      doc.setFillColor(230, 230, 230);
      doc.rect(20, yPos - 6, pageWidth - 40, 8, 'F');
      
      // Draw header border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(20, yPos - 6, pageWidth - 40, 8);
      
      tableHeaders.forEach((header, index) => {
        addText(header, xPos + 2, yPos);
        xPos += colWidths[index];
      });
      yPos += 10;

      // Table Data
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Group by semester/year
      const groupedBySemester = {};
      transcriptWithGradePoints.forEach((course) => {
        if (!course) return;
        const key = `${course.year || 'N/A'}-${course.semester || 'N/A'}`;
        if (!groupedBySemester[key]) {
          groupedBySemester[key] = [];
        }
        groupedBySemester[key].push(course);
      });

      // Sort semesters
      const sortedSemesters = Object.keys(groupedBySemester).sort().reverse();
      
      // If no semesters, show all courses without grouping
      if (sortedSemesters.length === 0) {
        sortedSemesters.push('All');
        groupedBySemester['All'] = transcriptWithGradePoints;
      }

      sortedSemesters.forEach((semesterKey) => {
        const courses = groupedBySemester[semesterKey];
        if (!courses || courses.length === 0) return;
        
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        // Semester header (only if not 'All')
        if (semesterKey !== 'All') {
          const [year, semester] = semesterKey.split('-');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          addText(`${year} - ${semester} Donemi`, 20, yPos);
          yPos += 8;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        courses.forEach((course, courseIndex) => {
          // Check if we need a new page
          if (yPos > pageHeight - 25) {
            doc.addPage();
            yPos = 20;
            // Redraw table header on new page
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setFillColor(230, 230, 230);
            doc.rect(20, yPos - 6, pageWidth - 40, 8, 'F');
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.rect(20, yPos - 6, pageWidth - 40, 8);
            let headerXPos = 20;
            tableHeaders.forEach((header, index) => {
              addText(header, headerXPos + 2, yPos);
              headerXPos += colWidths[index];
            });
            yPos += 10;
          }

          xPos = 20;
          const rowData = [
            course.courseCode || '-',
            course.courseName || '-',
            course.credits !== null && course.credits !== undefined ? course.credits.toString() : '-',
            course.midtermGrade !== null && course.midtermGrade !== undefined ? parseFloat(course.midtermGrade).toFixed(2) : '-',
            course.finalGrade !== null && course.finalGrade !== undefined ? parseFloat(course.finalGrade).toFixed(2) : '-',
            course.letterGrade || '-',
            course.gradePoint !== null && course.gradePoint !== undefined && !isNaN(course.gradePoint) 
              ? (typeof course.gradePoint === 'number' 
                  ? course.gradePoint.toFixed(2)
                  : parseFloat(course.gradePoint || 0).toFixed(2))
              : '-'
          ];

          rowData.forEach((cell, index) => {
            // Truncate long course names
            let cellText = cell;
            if (index === 1 && cellText.length > 30) {
              cellText = cellText.substring(0, 27) + '...';
            }
            // Use addText for Turkish character support
            if (index === 1) {
              addText(cellText, xPos + 2, yPos);
            } else {
              doc.text(cellText, xPos + 2, yPos);
            }
            xPos += colWidths[index];
          });
          
          // Draw row border AFTER text (below the row)
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
          
          yPos += 7;
        });
        
        yPos += 5; // Space between semesters
      });

      // Footer - Get total pages safely
      let totalPages = 1;
      try {
        // jspdf 3.x uses different API for pages
        if (doc.internal && doc.internal.pages) {
          totalPages = doc.internal.pages.length - 1;
        } else if (doc.getNumberOfPages) {
          totalPages = doc.getNumberOfPages();
        }
      } catch (e) {
        console.warn('Could not get total pages, using default:', e);
        totalPages = 1;
      }

      // Add page numbers
      for (let i = 1; i <= totalPages; i++) {
        try {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(
            `Sayfa ${i} / ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        } catch (e) {
          console.warn(`Could not set page ${i}:`, e);
        }
      }

      // Save PDF
      try {
        const studentNumber = user?.studentNumber || user?.Student?.studentNumber || 'student';
        const fileName = `transcript_${studentNumber}_${new Date().getTime()}.pdf`;
        console.log('Saving PDF with filename:', fileName);
        doc.save(fileName);
        console.log('PDF saved successfully');
        toast.success('Transkript başarıyla indirildi');
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        console.error('Save error details:', {
          message: saveError?.message,
          stack: saveError?.stack,
          name: saveError?.name
        });
        throw new Error(`PDF kaydedilemedi: ${saveError?.message || 'Bilinmeyen hata'}. Lütfen tarayıcı konsolunu kontrol edin.`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      
      let errorMessage = 'Transkript indirilirken hata oluştu';
      
      // Handle specific error cases
      if (error?.response?.status === 401) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen sayfayı yenileyip tekrar deneyin.';
        toast.error(errorMessage);
        // Optionally redirect to login after a delay
        setTimeout(() => {
          // window.location.href = '/login';
        }, 2000);
      } else if (error?.response?.status === 403) {
        errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
        toast.error(errorMessage);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        toast.error(`PDF indirme hatası: ${errorMessage}`);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        toast.error(`PDF indirme hatası: ${errorMessage}`);
      } else if (error?.message) {
        errorMessage = error.message;
        toast.error(`PDF indirme hatası: ${errorMessage}`);
      } else {
        toast.error(`PDF indirme hatası: ${errorMessage}`);
      }
      
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Notlarınız yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Notlar alınırken bir hata oluştu. Lütfen tekrar deneyin.';
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        {errorMessage}
      </Alert>
    );
  }

  // Ensure data exists and has expected structure
  const { grades = [], gpa, gpaTrend } = data || {};
  
  // IMPORTANT: CGPA should always come from allGradesData (all semesters, no filters)
  // This ensures CGPA doesn't change when filters are applied
  const cgpaFromAll = allGradesData?.cgpa;
  const cgpa = cgpaFromAll !== undefined ? cgpaFromAll : (data?.cgpa);
  
  // Safety check - ensure all values are valid
  const safeGpa = (gpa !== undefined && gpa !== null && !isNaN(gpa)) ? gpa : null;
  const safeCgpa = (cgpa !== undefined && cgpa !== null && !isNaN(cgpa)) ? cgpa : null;
  const safeGpaTrend = (gpaTrend !== undefined && gpaTrend !== null && !isNaN(gpaTrend)) ? gpaTrend : null;
  
  // Get unique years and semesters from all grades (for filter options)
  const allGrades = allGradesData?.grades || [];
  const allYears = [...new Set(allGrades.map(g => g.year).filter(Boolean))].sort((a, b) => b - a);
  const allSemesters = [...new Set(allGrades.map(g => g.semester).filter(Boolean))].sort();

  return (
    <Box>
      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ minWidth: 100 }}>
              Filtrele:
            </Typography>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="year-filter-label">Yıl</InputLabel>
              <Select
                labelId="year-filter-label"
                id="year-filter"
                value={selectedYear}
                label="Yıl"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="">Tüm Yıllar</MenuItem>
                {allYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="semester-filter-label">Dönem</InputLabel>
              <Select
                labelId="semester-filter-label"
                id="semester-filter"
                value={selectedSemester}
                label="Dönem"
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <MenuItem value="">Tüm Dönemler</MenuItem>
                {allSemesters.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(selectedYear || selectedSemester) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedYear('');
                  setSelectedSemester('');
                }}
              >
                Filtreleri Temizle
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              GPA
            </Typography>
            <Typography variant="h4">
              {safeGpa !== null ? safeGpa.toFixed(2) : 'N/A'}
            </Typography>
            <Typography color="text.secondary">Bu dönem ortalaması</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              CGPA
            </Typography>
            <Typography variant="h4">
              {safeCgpa !== null ? safeCgpa.toFixed(2) : 'N/A'}
            </Typography>
            <Typography color="text.secondary">Genel ortalama</Typography>
          </CardContent>
        </Card>
        {safeGpaTrend !== null && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ShowChartIcon color="primary" fontSize="large" />
                <div>
                  <Typography variant="subtitle2" color="text.secondary">
                    Trend
                  </Typography>
                  <Typography
                    variant="h6"
                    color={safeGpaTrend >= 0 ? 'success.main' : 'error.main'}
                  >
                    {safeGpaTrend >= 0 ? '+' : ''}
                    {safeGpaTrend.toFixed(2)} {safeGpaTrend >= 0 ? '↑' : '↓'}
                  </Typography>
                </div>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" mb={2}>
            <Typography variant="h6">Ders Notları</Typography>
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
              onClick={handleDownloadTranscript}
              disabled={isDownloading}
            >
              {isDownloading ? 'İndiriliyor...' : 'Transkripti İndir (PDF)'}
            </Button>
          </Stack>
          {grades.length === 0 ? (
            <Alert severity="info">Henüz notunuz bulunmuyor.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Kod</TableCell>
                  <TableCell>Ders</TableCell>
                  <TableCell align="center">Kredi</TableCell>
                  <TableCell align="center">Vize</TableCell>
                  <TableCell align="center">Final</TableCell>
                  <TableCell align="center">Harf</TableCell>
                  <TableCell align="center">Puan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.enrollmentId || grade.id}>
                    <TableCell>{grade.courseCode || grade.code}</TableCell>
                    <TableCell>{grade.courseName || grade.name}</TableCell>
                    <TableCell align="center">
                      {grade.credits !== undefined && grade.credits !== null
                        ? grade.credits
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {grade.midtermGrade !== undefined && grade.midtermGrade !== null
                        ? grade.midtermGrade
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {grade.finalGrade !== undefined && grade.finalGrade !== null
                        ? grade.finalGrade
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {grade.letterGrade || grade.letter || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {grade.gradePoint !== undefined && grade.gradePoint !== null
                        ? (typeof grade.gradePoint === 'number' 
                            ? grade.gradePoint.toFixed(2)
                            : parseFloat(grade.gradePoint || 0).toFixed(2))
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

