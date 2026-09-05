import React from 'react';
import {
  Box, Typography, Button, Avatar, Paper, Grid, Chip, CircularProgress,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import ShareIcon from '@mui/icons-material/Share';
import VerifiedIcon from '@mui/icons-material/Verified';
import SecurityIcon from '@mui/icons-material/Security';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../common/Layout';
import { fetchProfile } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [passOpen, setPassOpen] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [editForm, setEditForm] = React.useState({ first_name: '', last_name: '', phone: '' });
  const [passForm, setPassForm] = React.useState({ old_password: '', new_password: '', confirm: '' });
  const [twofa, setTwofa] = React.useState({ status: null, loading: true });
  const [twofaSetup, setTwofaSetup] = React.useState(null);
  const [twofaCode, setTwofaCode] = React.useState('');
  const [twofaDialog, setTwofaDialog] = React.useState(null);

  React.useEffect(() => {
    authService.get2faStatus().then((res) => {
      setTwofa({ status: res.data?.data || res.data, loading: false });
    }).catch(() => setTwofa((p) => ({ ...p, loading: false })));
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        if (!user) await dispatch(fetchProfile());
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress sx={{ color: '#4a90d9' }} /></Box></Layout>;

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'مستخدم';
  const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();

  const saveEdit = async () => {
    try {
      const res = await authService.updateProfile(editForm);
      await dispatch(fetchProfile());
      setEditOpen(false);
      setMsg('✅ تم تحديث الملف الشخصي بنجاح');
    } catch (e) {
      setMsg('⚠️ تعذر تحديث الملف');
    }
  };

  const savePass = async () => {
    if (passForm.new_password !== passForm.confirm) {
      setMsg('❌ كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      await authService.changePassword({ old_password: passForm.old_password, new_password: passForm.new_password });
      setPassOpen(false);
      setMsg('🔑 تم تغيير كلمة المرور بنجاح');
      setPassForm({ old_password: '', new_password: '', confirm: '' });
    } catch (e) {
      setMsg('⚠️ تعذر تغيير كلمة المرور');
    }
  };

  const openEdit = () => {
    setEditForm({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
    setEditOpen(true);
  };

  const start2faSetup = async () => {
    try {
      const res = await authService.setup2fa();
      const d = res.data?.data || res.data;
      setTwofaSetup(d);
      setTwofaCode('');
      setTwofaDialog('setup');
    } catch {
      setMsg('⚠️ تعذر تجهيز المصادقة الثنائية');
    }
  };

  const submit2fa = async () => {
    try {
      if (twofaDialog === 'enable' || twofaDialog === 'setup') {
        await authService.enable2fa(twofaCode);
        setMsg('✅ تم تفعيل المصادقة الثنائية بنجاح');
      } else if (twofaDialog === 'disable') {
        await authService.disable2fa(twofaCode);
        setMsg('🗑️ تم تعطيل المصادقة الثنائية');
      }
      const res = await authService.get2faStatus();
      setTwofa({ status: res.data?.data || res.data, loading: false });
      setTwofaDialog(null);
      setTwofaCode('');
    } catch {
      setMsg('⚠️ الرمز غير صحيح أو انتهت صلاحيته');
    }
  };

  return (
    <Layout>
      <Typography variant="h4" className="page-title" sx={{ mb: 3 }}>👤 ملفي الشخصي</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
            <Avatar sx={{ width: 110, height: 110, bgcolor: 'linear-gradient(135deg,#4a90d9,#7c6df0)', fontSize: 42, fontWeight: 800, margin: '0 auto 16px', boxShadow: '0 8px 25px rgba(74,144,217,0.4)' }}>
              {initials}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2d3748' }}>{fullName}</Typography>
            <Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>@{user?.username}</Typography>
            {user?.email_verified ? (
              <Chip icon={<VerifiedIcon />} label="بريد موثّق" sx={{ color: '#27ae60', bgcolor: '#e8f8f0', fontWeight: 700 }} />
            ) : (
              <Chip label="بريد غير موثّق" sx={{ color: '#b7791f', bgcolor: '#fffbeb', fontWeight: 700 }} />
            )}
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" className="btn-primary" startIcon={<EditIcon />} fullWidth sx={{ mb: 1.5 }} onClick={openEdit}>تعديل الملف الشخصي</Button>
              <Button variant="contained" className="btn-nery" startIcon={<LockResetIcon />} fullWidth sx={{ mb: 1.5 }} onClick={() => setPassOpen(true)}>تغيير كلمة المرور</Button>
              <Button variant="outlined" onClick={() => navigate('/documents')} fullWidth sx={{ color: '#4a90d9', borderColor: '#4a90d9' }}>عرض وثائقي</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 4, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#4a90d9', mb: 3 }}>🔍 معلومات الحساب</Typography>
            <Grid container spacing={2}>
              <InfoItem icon={<EmailIcon />} label="البريد الإلكتروني" value={user?.email || '-'} />
              <InfoItem icon={<PhoneIcon />} label="رقم الهاتف" value={user?.phone || 'غير محدد'} />
              <InfoItem icon={<CalendarTodayIcon />} label="تاريخ التسجيل" value={user?.date_joined ? new Date(user.date_joined).toLocaleDateString('ar') : '-'} />
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#ebf4ff', border: '1px solid #cfe5ff' }}>
                <DescriptionIcon sx={{ color: '#4a90d9', fontSize: 40 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748' }}>{user?.document_count ?? '∞'}</Typography>
                <Typography sx={{ color: '#718096' }}>المستندات</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#f0ecff', border: '1px solid #dcd3ff' }}>
                <ShareIcon sx={{ color: '#7c6df0', fontSize: 40 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748' }}>{user?.share_count ?? 0}</Typography>
                <Typography sx={{ color: '#718096' }}>المشاركات</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#e8f8f0', border: '1px solid #c6ecd8' }}>
                <VerifiedIcon sx={{ color: '#2ecc71', fontSize: 40 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748' }}>{user?.is_superuser ? 'مدير' : 'مستخدم'}</Typography>
                <Typography sx={{ color: '#718096' }}>الصلاحية</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, borderRadius: 4, mb: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#4a90d9' }}>🛡️ الأمان والمصادقة الثنائية (2FA)</Typography>
          {!twofa.loading && (
            twofa.status?.enabled ? (
              <Button variant="outlined" color="error" onClick={() => { setTwofaDialog('disable'); setTwofaCode(''); }}>
                تعطيل 2FA
              </Button>
            ) : (
              <Button variant="contained" className="btn-primary" startIcon={<SecurityIcon />} onClick={start2faSetup}>
                تفعيل 2FA
              </Button>
            )
          )}
        </Box>
        <Typography variant="body2" sx={{ color: '#718096' }}>
          {twofa.loading ? 'جاري التحقق من الحالة...' : (
            twofa.status?.enabled
              ? '✅ المصادقة الثنائية مفعّلة. حسابك محمي برمز إضافي عند تسجيل الدخول.'
              : '🔒 لم يتم تفعيل المصادقة الثنائية بعد. فعّلها لإضافة طبقة حماية إضافية لحسابك.'
          )}
        </Typography>
        {twofa.status?.enabled && (
          <Chip icon={<VerifiedIcon />} label="2FA مفعّل" sx={{ mt: 2, color: '#27ae60', bgcolor: '#e8f8f0', fontWeight: 700 }} />
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#4a90d9', fontWeight: 700 }}>✏️ تعديل الملف الشخصي</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="الاسم الأول" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="الاسم الأخير" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="رقم الهاتف" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#718096' }}>إلغاء</Button>
          <Button variant="contained" className="btn-primary" onClick={saveEdit}>حفظ</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passOpen} onClose={() => setPassOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#4a90d9', fontWeight: 700 }}>🔑 تغيير كلمة المرور</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="كلمة المرور الحالية" type="password" value={passForm.old_password} onChange={(e) => setPassForm({ ...passForm, old_password: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="كلمة المرور الجديدة" type="password" value={passForm.new_password} onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="تأكيد كلمة المرور الجديدة" type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPassOpen(false)} sx={{ color: '#718096' }}>إلغاء</Button>
          <Button variant="contained" className="btn-success" onClick={savePass}>تأكيد التغيير</Button>
        </DialogActions>
      </Dialog>

      {twofaDialog === 'setup' && twofaSetup && (
        <Dialog open onClose={() => setTwofaDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#4a90d9', fontWeight: 700 }}>🛡️ تفعيل المصادقة الثنائية</DialogTitle>
          <DialogContent sx={{ pt: 2, textAlign: 'center' }}>
            <Typography sx={{ color: '#718096', mb: 2 }}>
              امسح رمز QR باستخدام تطبيق Google Authenticator أو أي تطبيق متوافق، ثم أدخل الرمز.
            </Typography>
            <Box sx={{ mb: 2 }}>
              <QRCodeSVG value={twofaSetup.provisioning_uri} size={180} level="M" />
            </Box>
            <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block', wordBreak: 'break-all', mb: 2 }}>
              المفتاح السري: <strong>{twofaSetup.secret}</strong>
            </Typography>
            <TextField
              label="رمز التحقق (6 أرقام)"
              value={twofaCode}
              onChange={(e) => setTwofaCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
              sx={{ maxWidth: 220 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
            <Button onClick={() => setTwofaDialog(null)} sx={{ color: '#718096' }}>إلغاء</Button>
            <Button variant="contained" className="btn-primary" onClick={submit2fa} disabled={twofaCode.length < 6}>
              <QrCode2Icon sx={{ mr: 0.5 }} /> تفعيل 2FA
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {twofaDialog === 'enable' && twofaSetup && (
        <Dialog open onClose={() => setTwofaDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: '#4a90d9', fontWeight: 700 }}>تأكيد تفعيل 2FA</DialogTitle>
          <DialogContent sx={{ pt: 2, textAlign: 'center' }}>
            <TextField
              label="رمز التحقق (6 أرقام)"
              value={twofaCode}
              onChange={(e) => setTwofaCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
              sx={{ maxWidth: 220 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setTwofaDialog(null)} sx={{ color: '#718096' }}>إلغاء</Button>
            <Button variant="contained" className="btn-success" onClick={submit2fa} disabled={twofaCode.length < 6}>تفعيل</Button>
          </DialogActions>
        </Dialog>
      )}

      {twofaDialog === 'disable' && (
        <Dialog open onClose={() => setTwofaDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: '#e74c3c', fontWeight: 700 }}>تعطيل 2FA</DialogTitle>
          <DialogContent sx={{ pt: 2, textAlign: 'center' }}>
            <Typography sx={{ color: '#718096', mb: 2 }}>أدخل رمز التحقق الحالي لتأكيد التعطيل.</Typography>
            <TextField
              label="رمز التحقق (6 أرقام)"
              value={twofaCode}
              onChange={(e) => setTwofaCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
              sx={{ maxWidth: 220 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setTwofaDialog(null)} sx={{ color: '#718096' }}>إلغاء</Button>
            <Button variant="contained" color="error" onClick={submit2fa} disabled={twofaCode.length < 6}>تعطيل</Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar open={Boolean(msg)} autoHideDuration={3000} onClose={() => setMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" sx={{ borderRadius: 3, fontWeight: 700 }}>{msg}</Alert>
      </Snackbar>
    </Layout>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#f0f8ff', borderRadius: 3 }}>
        <Box sx={{ color: '#4a90d9' }}>{icon}</Box>
        <Box>
          <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>{label}</Typography>
          <Typography sx={{ fontWeight: 700, color: '#2d3748', wordBreak: 'break-all' }}>{value}</Typography>
        </Box>
      </Box>
    </Grid>
  );
}

export default ProfilePage;
