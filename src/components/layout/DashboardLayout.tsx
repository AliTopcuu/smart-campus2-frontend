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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { navItems } from '@/components/navigation/navConfig';
import { useAuth } from '@/context/AuthContext';
import { appConfig } from '@/config/appConfig';

const drawerWidth = 250;

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width:900px)');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'grey.50' }}>
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
            <Box textAlign="right">
              <Typography variant="subtitle2">{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role?.toUpperCase()}
              </Typography>
            </Box>
            <Avatar src={user?.avatarUrl}>{user?.fullName?.[0] ?? '?'}</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
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

