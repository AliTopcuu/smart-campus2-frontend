import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const createAppTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: mode,
      primary: { 
        main: isDark ? '#2563eb' : '#2563eb',
      },
      secondary: { 
        main: isDark ? '#4f46e5' : '#9333ea',
      },
      background: {
        default: isDark ? '#111827' : '#f5f7fb',
        paper: isDark ? '#1f2937' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f3f4f6' : '#111827',
        secondary: isDark ? 'rgba(209, 213, 219, 0.8)' : 'rgba(17, 24, 39, 0.7)',
      },
      divider: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(0, 0, 0, 0.12)',
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            ...(isDark && {
              backgroundImage: 'none',
              backgroundColor: '#1f2937',
              border: '1px solid rgba(75, 85, 99, 0.3)',
            }),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...(isDark && {
              backgroundColor: '#1f2937',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...(isDark && {
              backgroundColor: '#1f2937',
              borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
              boxShadow: 'none',
            }),
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...(isDark && {
              backgroundColor: '#111827',
              borderRight: '1px solid rgba(75, 85, 99, 0.3)',
            }),
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            ...(isDark && {
              '&:hover': {
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.3)',
                },
              },
            }),
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            ...(isDark && {
              '& .MuiOutlinedInput-root': {
                backgroundColor: alpha('#1f2937', 0.8),
                color: '#f3f4f6',
                '& fieldset': {
                  borderColor: 'rgba(75, 85, 99, 0.5)',
                },
                '&:hover': {
                  backgroundColor: '#1f2937',
                  '& fieldset': {
                    borderColor: 'rgba(37, 99, 235, 0.5)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: '#1f2937',
                  '& fieldset': {
                    borderColor: '#2563eb',
                  },
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(209, 213, 219, 0.7)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#2563eb',
              },
            }),
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            ...(isDark && {
              '& .MuiOutlinedInput-root': {
                backgroundColor: alpha('#1f2937', 0.8),
                color: '#f3f4f6',
                '& fieldset': {
                  borderColor: 'rgba(75, 85, 99, 0.5)',
                },
                '&:hover': {
                  backgroundColor: '#1f2937',
                  '& fieldset': {
                    borderColor: 'rgba(37, 99, 235, 0.5)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: '#1f2937',
                  '& fieldset': {
                    borderColor: '#2563eb',
                  },
                },
              },
              '& .MuiSelect-icon': {
                color: 'rgba(209, 213, 219, 0.7)',
              },
            }),
          },
        },
      },
    },
  });
};

export const getTheme = (mode) => createAppTheme(mode);
