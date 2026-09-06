import React from 'react';
import {
  Paper, Typography, Button, Box, List, ListItem, ListItemText, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, Alert, CircularProgress, IconButton,
  Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShareIcon from '@mui/icons-material/Share';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../common/Layout';
import { fetchShares, createShare, revokeShare } from '../../store/slices/sharingSlice';
import { fetchDocuments } from '../../store/slices/documentSlice';
import { sharingService } from '../../services/sharingService';

const PERMISSION_LABELS = { view: 'عرض', edit: 'تحرير', comment: 'تعليق', full: 'صلاحية كاملة' };

function SharePage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.sharing);
  const documents = useSelector((state) => state.documents.items);
  const [open, setOpen] = React.useState(false);
  const [received, setReceived] = React.useState([]);
  const [form, setForm] = React.useState({ document_id: '', email: '', permission: 'view', message: '' });
  const [msg, setMsg] = React.useState('');
  const [msgType, setMsgType] = React.useState('success');
  const [copiedId, setCopiedId] = React.useState(null);

  React.useEffect(() => {
    dispatch(fetchShares());
    dispatch(fetchDocuments());
    sharingService.received().then((res) => setReceived(res.data)).catch(() => {});
  }, [dispatch]);

  const handleCreate = async () => {
    const result = await dispatch(createShare(form));
    if (result.type === 'sharing/create/fulfilled') {
      setMsg('✅ تم إنشاء المشاركة بنجاح');
      setMsgType('success');
      setOpen(false);
      setForm({ document_id: '', email: '', permission: 'view', message: '' });
    } else {
      setMsg('⚠️ تعذر إنشاء المشاركة');
      setMsgType('error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleRevoke = async (id) => {
    await dispatch(revokeShare(id));
    setMsg('🗑️ تم إلغاء المشاركة');
    setMsgType('info');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleCopy = async (share) => {
    try {
      await navigator.clipboard.writeText(share.access_url);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setMsg('تعذر نسخ الرابط');
      setMsgType('error');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" className="page-title">🔗 المشاركة الآمنة</Typography>
        <Button variant="contained" className="btn-primary btn-pulse" startIcon={<ShareIcon />} onClick={() => setOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'center' }}>مشاركة وثيقة</Button>
      </Box>

      {msg && <Alert severity={msgType} sx={{ mb: 2, borderRadius: 3 }}>{msg}</Alert>}

      <Paper sx={{ p: 3, mb: 3, background: '#fff', borderRadius: 3, boxShadow: '0 2px 12px rgba(74,144,217,0.08)', border: '1px solid #edf2f7' }}>
        <Typography variant="h6" sx={{ color: '#4a90d9', fontWeight: 700, mb: 2 }}>المشاركات التي أنشأتها</Typography>
        <List sx={{ p: 0 }}>
          {items.map((share) => (
            <ListItem key={share.id} divider sx={{ flexWrap: 'wrap', py: 1.5 }}>
              <ListItemText
                primary={<Typography sx={{ color: '#2d3748', fontWeight: 600 }}>📄 {share.document?.title}</Typography>}
                secondary={
                  <>
                    <Chip size="small" label={PERMISSION_LABELS[share.permission]} sx={{ mr: 1, mt: 0.5, color: '#4a90d9', fontWeight: 700 }} variant="outlined" />
                    <Chip size="small" label={share.is_active ? '🟢 نشطة' : '⛔ ملغاة'} sx={{ mr: 1, mt: 0.5, color: share.is_active ? '#2ecc71' : '#e74c3c', fontWeight: 700 }} variant="outlined" />
                    <Chip size="small" label={`👁️ ${share.view_count}`} sx={{ mr: 1, mt: 0.5, color: '#7c6df0', fontWeight: 700 }} variant="outlined" />
                    {share.expires_at && <Chip size="small" label={`⏳ ${new Date(share.expires_at).toLocaleDateString('ar')}`} sx={{ mt: 0.5, color: '#ff9a56', fontWeight: 700 }} variant="outlined" />}
                  </>
                }
              />
              {share.access_url && share.is_active && (
                <>
                  <IconButton onClick={() => handleCopy(share)} title="نسخ الرابط" sx={{ color: '#4a90d9' }}>
                    {copiedId === share.id ? <CheckCircleIcon sx={{ color: '#2ecc71' }} /> : <ContentCopyIcon />}
                  </IconButton>
                  <Button size="small" color="error" onClick={() => handleRevoke(share.id)} startIcon={<DeleteOutlineIcon />}>إلغاء</Button>
                </>
              )}
            </ListItem>
          ))}
          {!loading && items.length === 0 && (
            <ListItem><Typography sx={{ color: '#a0aec0' }}>لا توجد مشاركات بعد — اضغط "مشاركة وثيقة" للبدء</Typography></ListItem>
          )}
        </List>
      </Paper>

      <Paper sx={{ p: 3, background: '#fff', borderRadius: 3, boxShadow: '0 2px 12px rgba(74,144,217,0.08)', border: '1px solid #edf2f7' }}>
        <Typography variant="h6" sx={{ color: '#4a90d9', fontWeight: 700, mb: 2 }}>وثائق مشتركة معي</Typography>
        <List sx={{ p: 0 }}>
          {received.map((share) => (
            <ListItem key={share.id} divider>
              <ListItemText
                primary={<Typography sx={{ color: '#2d3748', fontWeight: 600 }}>📄 {share.document?.title}</Typography>}
                secondary={`شاركها: ${share.shared_by} — ${PERMISSION_LABELS[share.permission]}`}
              />
              <Chip size="small" label="نشطة" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
            </ListItem>
          ))}
          {received.length === 0 && (
            <ListItem><Typography sx={{ color: '#a0aec0' }}>لا توجد وثائق مشتركة معك حالياً</Typography></ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: '#fff', color: '#4a90d9', fontWeight: 700, pb: 0 }}>مشاركة وثيقة جديدة</DialogTitle>
        <DialogContent sx={{ background: '#fff', pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>الوثيقة</InputLabel>
            <Select value={form.document_id} label="الوثيقة" onChange={(e) => setForm({ ...form, document_id: e.target.value })}>
              {documents.map((doc) => <MenuItem key={doc.id} value={doc.id}>{doc.title}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="البريد الإلكتروني (اختياري)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth type="email" sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>الصلاحية</InputLabel>
            <Select value={form.permission} label="الصلاحية" onChange={(e) => setForm({ ...form, permission: e.target.value })}>
              <MenuItem value="view">عرض</MenuItem>
              <MenuItem value="edit">تحرير</MenuItem>
              <MenuItem value="comment">تعليق</MenuItem>
              <MenuItem value="full">صلاحية كاملة</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: '#718096' }}>💡 اترك البريد فارغاً لإنشاء رابط عام قابل للمشاركة.</Typography>
        </DialogContent>
        <DialogActions sx={{ background: '#fff' }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#718096' }}>إلغاء</Button>
          <Button variant="contained" className="btn-primary" onClick={handleCreate} disabled={!form.document_id}>مشاركة</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default SharePage;
