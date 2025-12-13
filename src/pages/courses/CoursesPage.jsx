import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { courseService } from '@/services/courseService';
import { sectionService } from '@/services/sectionService';
import { departmentService } from '@/services/departmentService';
import { useAuth } from '@/context/AuthContext';

export const CoursesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') ?? '';
  const departmentQuery = searchParams.get('department') ?? '';
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localDepartment, setLocalDepartment] = useState(departmentQuery);
  const isFaculty = user?.role === 'faculty';

  // Get departments from API
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  });

  // Create department options from API data
  const departmentOptions = useMemo(() => {
    return [
      { value: '', label: 'Tümü' },
      ...departments.map(dept => ({
        value: dept.id.toString(),
        label: `${dept.name} (${dept.code})`
      }))
    ];
  }, [departments]);

  const queryParams = useMemo(
    () => {
      const params = {
        search: searchQuery || undefined,
      };
      
      // Use department ID directly (now we use ID as value)
      if (departmentQuery) {
        const departmentId = parseInt(departmentQuery, 10);
        if (!isNaN(departmentId)) {
          params.department = departmentId;
        }
      }
      
      return params;
    },
    [searchQuery, departmentQuery]
  );

  // For faculty, get courses from their sections. For others, get all courses.
  const { data: sectionsData, isLoading: sectionsLoading, refetch: refetchSections } = useQuery({
    queryKey: ['my-sections'],
    queryFn: () => sectionService.mySections(),
    enabled: isFaculty,
  });

  const { data: coursesData, isLoading: coursesLoading, isError, refetch: refetchCourses, isFetching } = useQuery({
    queryKey: ['courses', queryParams],
    queryFn: () => courseService.list(queryParams),
    keepPreviousData: true,
    enabled: !isFaculty, // No need to wait for departments anymore since we use ID directly
  });

  // Process data: For faculty, get unique courses from their sections
  const processedData = useMemo(() => {
    if (isFaculty && sectionsData) {
      // Extract unique courses from sections
      const coursesMap = new Map();
      sectionsData.forEach((section) => {
        if (section.course && !coursesMap.has(section.course.id)) {
          coursesMap.set(section.course.id, {
            ...section.course,
            sections: [section], // Include section info for detail page
          });
        } else if (section.course && coursesMap.has(section.course.id)) {
          // If course already exists, add section to it
          const existingCourse = coursesMap.get(section.course.id);
          existingCourse.sections = existingCourse.sections || [];
          existingCourse.sections.push(section);
        }
      });
      let courses = Array.from(coursesMap.values());
      
      // Apply search filter if any
      if (localSearch.trim()) {
        const searchLower = localSearch.trim().toLowerCase();
        courses = courses.filter(
          (course) =>
            course.name?.toLowerCase().includes(searchLower) ||
            course.code?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply department filter if any
      if (departmentQuery) {
        const departmentId = parseInt(departmentQuery, 10);
        if (!isNaN(departmentId)) {
          courses = courses.filter((course) => {
            const courseDeptId = typeof course.department === 'object' 
              ? course.department?.id 
              : course.departmentId || course.department;
            return courseDeptId === departmentId;
          });
        }
      }
      
      return courses;
    }
    return coursesData || [];
  }, [isFaculty, sectionsData, coursesData, localSearch, departmentQuery]);

  const data = processedData;
  const isLoading = isFaculty ? sectionsLoading : coursesLoading;

  const handleFilterSubmit = () => {
    const nextParams = new URLSearchParams();
    if (localSearch.trim()) nextParams.set('search', localSearch.trim());
    if (localDepartment) nextParams.set('department', localDepartment);
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setLocalSearch('');
    setLocalDepartment('');
    setSearchParams({});
  };

  const handleSearchInput = (event) => {
    setLocalSearch(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setLocalDepartment(event.target.value);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
          <Typography mt={2}>Dersler yükleniyor...</Typography>
        </Stack>
      );
    }

    if ((!isFaculty && isError) || !data) {
      return (
        <Alert
          severity="error"
          action={<Button onClick={() => isFaculty ? refetchSections() : refetchCourses()}>Tekrar dene</Button>}
        >
          Dersler alınırken bir hata oluştu. Lütfen tekrar deneyin.
        </Alert>
      );
    }

    if (data.length === 0) {
      return <Alert severity="info">Filtrelere uygun ders bulunamadı.</Alert>;
    }

    return (
      <Grid container spacing={2}>
        {data.map((course) => (
          <Grid item xs={12} md={6} lg={4} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="subtitle2" color="text.secondary">
                    {course.code}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeof course.department === 'object' 
                      ? course.department?.name || course.department?.code || course.departmentId
                      : course.department || course.departmentId || '-'}
                  </Typography>
                </Stack>
                <Typography variant="h6" mt={1}>
                  {course.name}
                </Typography>
                <Typography color="text.secondary" mt={1}>
                  {course.credits} Kredi • {course.ects} ECTS
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  to={`/courses/${course.id}`}
                  variant="outlined"
                  size="small"
                >
                  Detay
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        {isFaculty ? 'Derslerim' : 'Ders Kataloğu'}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Ders adı veya kodu"
              value={localSearch}
              onChange={handleSearchInput}
              fullWidth
            />
            <TextField
              select
              label="Bölüm"
              value={localDepartment}
              onChange={handleDepartmentChange}
              fullWidth
            >
              {departmentOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleFilterSubmit}
                disabled={isFetching}
              >
                Filtrele
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
              >
                Sıfırla
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      {renderContent()}
    </Box>
  );
};

