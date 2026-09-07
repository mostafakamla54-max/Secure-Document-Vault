import React from 'react';
import {
  Box, Toolbar, Typography, IconButton, Badge, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Tooltip, InputBase, Paper, Popper, ClickAwayListener, Divider,
} from '@mui/material';
import styled from '@emotion/styled';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ShareIcon from '@mui/icons-material/Share';
import HistoryIcon from '@mui/icons-material/History';
import BusinessIcon from '@mui/icons-material/Business';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LanguageIcon from '@mui/icons-material/Language';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, toggleTheme, toggleLang } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

const drawerWidth = 250;

const sparkles = [
  { icon: '⭐', top: 6, left: 14, d: '0s' },
  { icon: '✨', top: 16, left: 78, d: '1.2s' },
  { icon: '🌠', top: 78, left: 30, d: '2.1s' },
  { icon: '🌟', top: 88, left: 85, d: '0.8s' },
  { icon: '💫', top: 40, left: 4, d: '1.7s' },
  { icon: '⭐', top: 60, left: 96, d: '2.6s' },
];

const SearchBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  background: '#fff',
  borderRadius: 50,
  padding: '6px 14px',
  boxShadow: '0 1px 3px rgba(74,144,217,0.15), 0 2px 10px rgba(74,144,217,0.08)',
  width: 240,
  border: '1px solid #edf2f7',
});

function Layout({ children }) {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [searchAnchor, setSearchAnchor] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const unread = useSelector((state) => state.notifications.unreadCount);
  const user = useSelector((state) => state.auth.user);
  const themeMode = useSelector((state) => state.auth.themeMode);
  const lang = useSelector((state) => state.auth.lang);
  const allDocs = useSelector((state) => state.documents.items);

  const t = (ar, en) => (lang === 'ar' ? ar : en);

  const searchResults = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (allDocs || [])
      .filter((d) =>
        (d.title || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [search, allDocs]);

  const isAdmin = user && (user.is_superuser || user.is_staff);

  const menuItems = [
    { text: t('\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645', 'Dashboard'), icon: <DashboardIcon />, path: '/' },
    { text: t('\u0627\u0644\u0648\u062B\u0627\u0626\u0642', 'Documents'), icon: <DescriptionIcon />, path: '/documents' },
    { text: t('\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629', 'Sharing'), icon: <ShareIcon />, path: '/sharing' },
    { text: t('\u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642', 'Audit'), icon: <HistoryIcon />, path: '/audit' },
    { text: t('\u0627\u0644\u0645\u0624\u0633\u0633\u0629', 'Organization'), icon: <BusinessIcon />, path: '/organization' },
    { text: t('\u0645\u0644\u0641\u064A \u0627\u0644\u0634\u062E\u0635\u064A', 'Profile'), icon: <PersonIcon />, path: '/profile' },
    ...(isAdmin ? [{ text: t('\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u062F\u064A\u0631', 'Admin'), icon: <AdminPanelSettingsIcon />, path: '/admin' }] : []),
  ];

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await authService.logout({ refresh });
      }
    } catch (err) {
      // ignore
    }
    dispatch(logout());
    navigate('/login');
  };

  const go = (path) => {
    navigate(path);
    setOpen(false);
    setAnchorEl(null);
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') {
      navigate('/documents' + (search.trim() ? '?search=' + encodeURIComponent(search.trim()) : ''));
      setSearchAnchor(null);
    }
  };

  const pickResult = (doc) => {
    navigate('/documents/' + doc.id);
    setSearch('');
    setSearchAnchor(null);
  };

  const initials = (user && (user.first_name?.[0] || user.username?.[0])) || 'U';

  const menuList = menuItems.map((item) => {
    const selected = location.pathname === item.path || (item.path === '/documents' && location.pathname.startsWith('/documents'));
    return (
      <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton selected={selected} onClick={() => go(item.path)} sx={{ borderRadius: 3, '&.Mui-selected': { background: 'linear-gradient(135deg, #4a90d9, #7c6df0)', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' }, boxShadow: '0 4px 12px rgba(74,144,217,0.35)' }, '&:hover': { background: '#f0f8ff' }, color: '#2d3748' }}>
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontWeight: 700 } }} />
        </ListItemButton>
      </ListItem>
    );
  });

  return (
    <Box className="layout-app lux-inner" sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #ffffff, #e0f2ff 20%, #f3e8ff 50%, #e0fff4 80%, #fff0f6 100%)', backgroundSize: '300% 300%', animation: 'gradient-move 18s ease infinite', position: 'relative' }}>
      <Box className="dash-bg" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true" />
      <Box className="dash-bg-orbs" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true" />
      <Box className="dash-particles" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true" />
      <Box className="dash-waves" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true" />
      <Box className="dash-sparkles" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
        {sparkles.map((s, i) => (
          <Box key={i} sx={{ position: 'absolute', top: `${s.top}%`, left: `${s.left}%`, animationDelay: s.d }} className="dash-spark">
            {s.icon}
          </Box>
        ))}
      </Box>
      <Box className="lux-topbar" position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #edf2f7', boxShadow: '0 2px 12px rgba(74,144,217,0.08)' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(!open)} aria-label="menu" sx={{ mr: 2, display: { md: 'none' }, color: '#4a90d9' }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800, color: '#4a90d9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }} onClick={() => go('/')}>
            {'\u062E\u0632\u0646\u0629 \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0622\u0645\u0646\u0629'}
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 2 }}>
            <ClickAwayListener onClickAway={() => setSearchAnchor(null)}>
              <Box>
                <SearchBox className="lux-search">
                  <SearchIcon sx={{ color: '#a0aec0', mr: 1 }} />
                  <InputBase placeholder={t('\u0628\u062D\u062B \u0633\u0631\u064A\u0639 \u0641\u064A \u0627\u0644\u0648\u062B\u0627\u0626\u0642...', 'Quick document search...')} value={search} onChange={(e) => { setSearch(e.target.value); setSearchAnchor(e.currentTarget.closest('div')); }} onKeyDown={handleSearchKey} onClick={(e) => setSearchAnchor(e.currentTarget.closest('div'))} sx={{ fontSize: 14, color: '#2d3748', flex: 1 }} />
                </SearchBox>
                <Popper open={Boolean(searchAnchor) && searchResults.length > 0} anchorEl={searchAnchor} placement="bottom-start" style={{ zIndex: 1400 }}>
                  <Paper sx={{ mt: 1, width: 340, borderRadius: 3, border: '1px solid #edf2f7', boxShadow: '0 8px 30px rgba(74,144,217,0.2)', overflow: 'hidden' }}>
                    {searchResults.map((d, i) => (
                      <React.Fragment key={d.id}>
                        <ListItemButton onClick={() => pickResult(d)} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 34 }}><DescriptionIcon sx={{ color: '#4a90d9', fontSize: 20 }} /></ListItemIcon>
                          <ListItemText primary={<Typography sx={{ color: '#2d3748', fontWeight: 600, fontSize: 14 }}>{d.title}</Typography>} secondary={<Typography variant="caption" sx={{ color: '#a0aec0' }}>{d.category || '\u0639\u0627\u0645'} \u2022 {'\u0645\u0634\u0641\u0631'}</Typography>} />
                        </ListItemButton>
                        {i < searchResults.length - 1 && <Divider sx={{ m: 0 }} />}
                      </React.Fragment>
                    ))}
                  </Paper>
                </Popper>
              </Box>
            </ClickAwayListener>
          </Box>

          <Tooltip title={t('\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639', 'Toggle theme')}>
            <IconButton onClick={() => dispatch(toggleTheme())} sx={{ color: themeMode === 'dark' ? '#ffd700' : '#7c6df0' }}>
              {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t('\u0627\u0644\u0644\u063A\u0629 / Language', 'Language')}>
            <IconButton onClick={() => dispatch(toggleLang())} className="lux-lang-toggle" sx={{ color: '#4a90d9', fontWeight: 700 }}>
              <LanguageIcon /> <Box component="span" sx={{ fontSize: 12, ml: 0.3 }}>{lang === 'ar' ? 'EN' : '\u0639'}</Box>
            </IconButton>
          </Tooltip>

          <Tooltip title={t('\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A', 'Notifications')}>
            <IconButton onClick={() => navigate('/notification')} sx={{ color: '#718096' }}>
              <Badge badgeContent={unread} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={t('\u062D\u0633\u0627\u0628\u064A', 'My account')}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#4a90d9', color: '#fff', fontWeight: 700, fontSize: 15 }}>{initials}</Avatar>
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} sx={{ '& .MuiPaper-root': { borderRadius: 3, boxShadow: '0 8px 30px rgba(74,144,217,0.2)' } }}>
            <MenuItem onClick={() => go('/profile')}><PersonIcon sx={{ mr: 1, color: '#4a90d9' }} /> {t('\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A', 'Profile')}</MenuItem>
            {isAdmin && <MenuItem onClick={() => go('/admin')}><AdminPanelSettingsIcon sx={{ mr: 1, color: '#7c6df0' }} /> {t('\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u062F\u064A\u0631', 'Admin')}</MenuItem>}
            <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1, color: '#e74c3c' }} /> {t('\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C', 'Logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </Box>

      <Drawer variant="permanent" className="layout-sidebar" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', mt: 8, display: { xs: 'none', md: 'block' }, background: 'rgba(255,255,255,0.9)', borderRight: '1px solid #edf2f7', backdropFilter: 'blur(10px)' } }} open>
        <List sx={{ px: 1.5, pt: 2 }}>
          {menuList}
        </List>
      </Drawer>

      <Drawer variant="temporary" className="layout-sidebar" open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', background: 'rgba(255,255,255,0.96)', borderRight: '1px solid #edf2f7', backdropFilter: 'blur(12px)' } }}>
        <List sx={{ px: 1.5, pt: 8 }}>
          {menuList}
        </List>
      </Drawer>

      <Box component="main" className="layout-main" sx={{ flexGrow: 1, p: 3, mt: 8, position: 'relative', zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

export default Layout;
