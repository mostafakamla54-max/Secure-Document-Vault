import React from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  IconButton, Chip, CircularProgress, Button,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Layout from '../common/Layout';
import { authService } from '../../services/authService';
import { setNotifications, markAllRead } from '../../store/slices/notificationSlice';

function typeIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('share') || t.includes('شارك')) return <SendIcon />;
  if (t.includes('view') || t.includes('عرض')) return <VisibilityIcon />;
  if (t.includes('upload') || t.includes('رفع')) return <UploadFileIcon />;
  if (t.includes('expire') || t.includes('انتهاء')) return <LockIcon />;
  return <NotificationsIcon />;
}

function typeColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('share') || t.includes('شارك')) return '#7c6df0';
  if (t.includes('view') || t.includes('عرض')) return '#4a90d9';
  if (t.includes('upload') || t.includes('رفع')) return '#2ecc71';
  if (t.includes('expire') || t.includes('انتهاء')) return '#e74c3c';
  return '#48c9b0';
}

function NotificationPage() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    try {
      const res = await authService.getNotifications();
      dispatch(setNotifications(res.data));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
    setLoading(true);
    // reset loading state
    setLoading(false);
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" className="page-title">🔔 الإشعارات</Typography>
        <Button variant="contained" className="btn-primary" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'center' }}>
          تحديد الكل كمقروء
        </Button>
      </Box>

      {unreadCount > 0 && (
        <Chip label={`${unreadCount} إشعار غير مقروء`} sx={{ color: '#4a90d9', bgcolor: '#ebf4ff', fontWeight: 700, mb: 2 }} />
      )}

      <Paper sx={{ borderRadius: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress sx={{ color: '#4a90d9' }} /></Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 6 }}>
            <NotificationsIcon sx={{ fontSize: 70, color: '#a0aec0' }} />
            <Typography sx={{ color: '#718096', mt: 1 }}>لا توجد إشعارات حالياً</Typography>
          </Box>
        ) : (
          <List>
            {items.map((n, i) => (
              <ListItem
                key={n.id || i}
                divider={i < items.length - 1}
                secondaryAction={
                  <IconButton edge="end" sx={{ color: '#e74c3c' }}>
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{
                  bgcolor: n.is_read ? 'transparent' : '#f0f8ff',
                  '&:hover': { bgcolor: '#fff0f6' },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: typeColor(n.type), color: '#fff' }}>
                    {typeIcon(n.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: n.is_read ? 500 : 800, color: '#2d3748' }}>{n.title || n.message || 'إشعار جديد'}</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: '#a0aec0' }}>{n.created_at ? new Date(n.created_at).toLocaleString('ar') : ''}</Typography>}
                />
                {!n.is_read && <Chip size="small" label="جديد" sx={{ color: '#fff', bgcolor: '#4a90d9', fontSize: 11 }} />}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Layout>
  );
}

export default NotificationPage;
