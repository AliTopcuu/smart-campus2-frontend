import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useState, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { navItems } from '@/components/navigation/navConfig';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { appConfig } from '@/config/appConfig';
import { API_BASE_URL } from '@/utils/constant';

const drawerWidth = 250;

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width:900px)');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          {appConfig.appName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hoş geldin, {user?.fullName}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {navItems
          .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
          .map((item) => {
            const Icon = item.icon;
            const selected = location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  if (!isDesktop) {
                    setMobileOpen(false);
                  }
                }}
              >
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
      </List>
      <Box p={3}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={() => logout()}
        >
          Çıkış yap
        </Button>
      </Box>
    </Box>
  );

  // Mutlak URL'i oluşturma mantığı - avatarUrl veya profilePictureUrl kontrolü
  const headerAvatarSrc = useMemo(() => {
    const avatarUrl = user?.avatarUrl || user?.profilePictureUrl;
    if (!avatarUrl) return undefined;
    
    // Eğer URL zaten tam URL ise (http:// veya https:// ile başlıyorsa) direkt kullan
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      // Cache'i bypass etmek için timestamp ekle (sadece avatarUrl değiştiğinde güncellenir)
      return `${avatarUrl}?t=${Date.now()}`;
    }
    
    // Relative URL ise API_BASE_URL ekle
    return `${API_BASE_URL}${avatarUrl}?t=${Date.now()}`;
  }, [user?.avatarUrl, user?.profilePictureUrl]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 'none',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isDesktop && (
              <IconButton onClick={handleDrawerToggle} edge="start">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={600}>
              {navItems.find((item) => location.pathname.startsWith(item.path))?.label ??
                'Smart Campus'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={mode === 'dark' ? 'Açık Moda Geç' : 'Koyu Moda Geç'}>
              <IconButton
                onClick={toggleMode}
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Box textAlign="right">
              <Typography variant="subtitle2">{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role?.toUpperCase()}
              </Typography>
            </Box>
            <Avatar 
              key={user?.avatarUrl || user?.profilePictureUrl || 'default'}
              src={headerAvatarSrc}
            >
              {user?.fullName?.[0] ?? '?'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

