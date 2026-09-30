import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Button, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
  LogoutOutlined, Dashboard, CalendarMonth, ContentCut, People, Person,
  Inventory2, ShoppingCart, AttachMoney, BarChart, Store, MenuOpen, Menu as MenuIcon,
  Receipt, TimerOff, CheckCircle, LocalOffer, AccountCircle,
} from '@mui/icons-material';
import logo from '../assets/logo.png';

const DRAWER_WIDTH = 240;
const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BG = '#f5ede6';
const WHITE = '#ffffff';
const BORDER = '#e2cfc4';
const DARK_BG = '#3b1f0a';
const HOVER_BG = '#4e2e14';

const roleColors = {
  Admin: '#6b3f1f',
  Barber: '#4e7c59',
  Receptionist: '#3a6186',
  Customer: '#b07d3a',
};

const navItems = {
  Admin: [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'Appointments', icon: <CalendarMonth />, path: '/appointments' },
    { label: 'Services', icon: <ContentCut />, path: '/services' },
    { label: 'Staff', icon: <People />, path: '/staff' },
    { label: 'Users', icon: <Person />, path: '/users' },
    { label: 'Products', icon: <Store />, path: '/products' },
    { label: 'Orders', icon: <ShoppingCart />, path: '/orders' },
    { label: 'Inventory', icon: <Inventory2 />, path: '/inventory' },
    { label: 'Wages', icon: <AttachMoney />, path: '/wages' },
    { label: 'Analytics', icon: <BarChart />, path: '/analytics' },
  ],
  Barber: [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'My Appointments', icon: <CalendarMonth />, path: '/appointments' },
    { label: 'My Earnings', icon: <AttachMoney />, path: '/wages' },
    { label: 'Time Off', icon: <TimerOff />, path: '/staff/time-off' },
    { label: 'Services', icon: <ContentCut />, path: '/services' },
  ],
  Receptionist: [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'Appointments', icon: <CalendarMonth />, path: '/appointments' },
    { label: 'Services', icon: <ContentCut />, path: '/services' },
    { label: 'Staff', icon: <People />, path: '/staff' },
    { label: 'Users', icon: <Person />, path: '/users' },
  ],
  Customer: [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'My Appointments', icon: <CalendarMonth />, path: '/appointments' },
    { label: 'Book Appointment', icon: <CheckCircle />, path: '/appointments/book' },
    { label: 'Services', icon: <ContentCut />, path: '/services' },
    { label: 'Products', icon: <Store />, path: '/products' },
    { label: 'My Orders', icon: <ShoppingCart />, path: '/orders' },
  ],
};

function Layout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleColor = roleColors[user?.role] || BROWN;
  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const sidebar = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: DARK_BG, color: '#fff' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src={logo} alt="Luxe Salon" style={{ height: 36, objectFit: 'contain' }} />
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2cfc4' }}>Luxe Salon</Typography>
      </Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Avatar sx={{ width: 34, height: 34, background: roleColor, fontSize: '0.78rem', fontWeight: 700 }}>
          {getInitials(user?.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>{user?.name}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: roleColor, fontWeight: 500 }}>{user?.role}</Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, py: 1, overflow: 'auto' }}>
        {items.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.3,
                  py: 1,
                  bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', minWidth: 36, fontSize: 20 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding sx={{ px: 1 }}>
          <ListItemButton
            onClick={() => navigate('/profile')}
            sx={{ borderRadius: 1.5, py: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.55)', minWidth: 36 }}>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText primary="Profile" sx={{ '& .MuiListItemText-primary': { fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' } }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Button
          onClick={handleLogout}
          startIcon={<LogoutOutlined />}
          fullWidth
          sx={{
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'none',
            fontSize: '0.85rem',
            justifyContent: 'flex-start',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: BG }}>
      {/* Mobile hamburger */}
      <IconButton
        onClick={() => setMobileOpen(!mobileOpen)}
        sx={{
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1300,
          display: { md: 'none' },
          color: BROWN,
          bgcolor: 'rgba(255,255,255,0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          border: `1px solid ${BORDER}`,
          '&:hover': { bgcolor: '#fff' },
        }}
      >
        {mobileOpen ? <MenuOpen /> : <MenuIcon />}
      </IconButton>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {sidebar}
        </Drawer>
        {/* Desktop sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
          open
        >
          {sidebar}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top navbar */}
        <Box
          sx={{
            background: WHITE,
            borderBottom: `1px solid ${BORDER}`,
            px: { xs: 2, sm: 4 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.88rem', lineHeight: 1.2 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                {user?.email}
              </Typography>
            </Box>
            <Avatar sx={{ width: 34, height: 34, background: roleColor, fontSize: '0.78rem', fontWeight: 700 }}>
              {getInitials(user?.name)}
            </Avatar>
          </Box>
        </Box>

        {/* Page content via Outlet */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
