import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  TextField, MenuItem, Select, InputLabel, FormControl, Chip, Alert,
  CircularProgress, Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { sharingService } from '../../services/sharingService';

const PERMISSION_LABELS = { view: 'عرض فقط', edit: 'تحرير', comment: 'تعليق', full: 'صلاحية كاملة' };
const QUICK_SHARE = [
  { key: 'whatsapp', label: 'واتساب', color: '#25D366', Icon: WhatsAppIcon },
  { key: 'telegram', label: 'تيليجرام', color: '#229ED9', Icon: TelegramIcon },
  { key: 'email', label: 'بريد', color: '#4a90d9', Icon: EmailIcon },
  { key: 'facebook', label: 'فيسبوك', color: '#1877F2', Icon: FacebookIcon },
  { key: 'instagram', label: 'انستغرام', color: '#E1306C', Icon: CameraAltIcon },
];

function buildShareUrl(url) {
  return { whatsapp: `https://wa.me/?text=${encodeURIComponent(url)}`, telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}`, email: `mailto:?subject=وثيقة مشتركة&body=${encodeURIComponent(url)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, instagram: `https://www.instagram.com/` };
}

function ShareModal({ open, onClose, document: doc }) {
  const [form, setForm] = React.useState({ email: '', permission: 'view', expires_at: '' });
  const [share, setShare] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setShare(null);
      setForm({ email: '', permission: 'view', expires_at: '' });
      setCopied(false);
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = { document_id: doc.id, permission: form.permission };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString();
      const res = await sharingService.create(payload);
      setShare(res.data);
      setSuccess('✅ تم إنشاء رابط المشاركة بنجاح');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر إنشاء رابط المشاركة');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(share.access_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('تعذر نسخ الرابط');
    }
  };

  const handleRevoke = async () => {
    try {
      await sharingService.revoke(share.id);
      setShare({ ...share, is_active: false });
      setSuccess('🗑️ تم إلغاء المشاركة');
    } catch (err) {
      setError('تعذر إلغاء المشاركة');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ background: '#fff', color: '#4a90d9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon /> مشاركة الوثيقة
      </DialogTitle>
      <DialogContent sx={{ background: '#fff' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#2d3748' }}>{doc?.title}</Typography>
          <Chip size="small" label="🔒 مشفرة بـ AES-256-GCM" sx={{ mt: 0.5, color: '#b7791f', borderColor: '#f1c40f', background: '#fffbeb', fontSize: 11, fontWeight: 700 }} variant="outlined" />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

        {!share ? (
          <>
            <TextField
              label="البريد الإلكتروني (اختياري — اتركه فارغاً لرابط عام)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
              type="email"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>الصلاحية</InputLabel>
                <Select value={form.permission} label="الصلاحية" onChange={(e) => setForm({ ...form, permission: e.target.value })}>
                  {Object.entries(PERMISSION_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="تنتهي في (اختياري)"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Button variant="contained" className="btn-primary" onClick={handleCreate} disabled={loading} fullWidth>
              {loading ? <CircularProgress size={20} color="inherit" /> : '🔗 إنشاء رابط المشاركة'}
            </Button>
          </>
        ) : (
          <>
            <Box sx={{ p: 2, borderRadius: 3, background: '#f0f8ff', border: '1px solid #cfe5ff', mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 700 }}>رابط المشاركة</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField value={share.is_active ? share.access_url : 'تم الإلغاء'} fullWidth size="small" disabled />
                {share.is_active && (
                  <Button onClick={handleCopy} startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />} sx={{ color: '#4a90d9', fontWeight: 700 }} variant="outlined">
                    {copied ? 'تم النسخ!' : 'نسخ'}
                  </Button>
                )}
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: '#2d3748', fontWeight: 700 }}>مشاركة سريعة:</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2, flexWrap: 'wrap' }}>
              {QUICK_SHARE.filter((q) => share.is_active).map((q) => {
                const url = buildShareUrl(share.access_url)[q.key];
                return (
                  <Button key={q.key} size="small" variant="outlined" href={url} target="_blank" rel="noopener noreferrer"
                    sx={{ color: q.color, borderColor: q.color, '&:hover': { background: `${q.color}18`, borderColor: q.color }, fontWeight: 700 }}>
                    <q.Icon sx={{ mr: 0.5, fontSize: 18 }} /> {q.label}
                  </Button>
                );
              })}
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip icon={<LockIcon />} label={`الصلاحية: ${PERMISSION_LABELS[share.permission]}`} sx={{ color: '#4a90d9', fontWeight: 700 }} variant="outlined" />
              <Chip label={share.is_active ? '🟢 نشطة' : '⛔ ملغاة'} sx={{ color: share.is_active ? '#2ecc71' : '#e74c3c', fontWeight: 700 }} variant="outlined" />
              <Chip label={`👁️ مشاهدات: ${share.view_count}`} sx={{ color: '#7c6df0', fontWeight: 700 }} variant="outlined" />
              {share.expires_at && <Chip label={`⏳ تنتهي: ${new Date(share.expires_at).toLocaleString('ar')}`} sx={{ color: '#ff9a56', fontWeight: 700 }} variant="outlined" />}
            </Box>

            {share.is_active && (
              <Button color="error" onClick={handleRevoke} startIcon={<DeleteOutlineIcon />} fullWidth sx={{ fontWeight: 700 }} variant="outlined">
                إلغاء المشاركة
              </Button>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ background: '#fff' }}>
        <Button onClick={onClose} sx={{ color: '#718096' }}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShareModal;
