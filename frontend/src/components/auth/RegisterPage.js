import React from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { registerUser } from '../../store/slices/authSlice';
import AnimatedBackground from '../common/AnimatedBackground';

function RegisterPage() {
  const [form, setForm] = React.useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password_confirm: '',
  });
  const [errors, setErrors] = React.useState({});
  const [generalError, setGeneralError] = React.useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
    setGeneralError('');
  };

  const extractErrors = (payload) => {
    const fieldErrors = {};
    if (!payload) return { fieldErrors, general: '' };
    const flat = (obj, prefix = '') => {
      Object.entries(obj).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          fieldErrors[prefix + k] = Array.isArray(v[0]) ? v[0][0] : v[0];
        } else if (typeof v === 'object' && v !== null) {
          flat(v, prefix + k + '.');
        } else if (typeof v === 'string') {
          fieldErrors[prefix + k] = v;
        }
      });
    };
    flat(payload);
    // ترجمة رسائل الأخطاء الإنكليزية/غير الواضحة إلى عربية واضحة
    const translate = (msg) => {
      if (!msg) return msg;
      const m = String(msg);
      if (m.includes('with this username already exists') || m.includes('اسم المستخدم موجود')) return 'اسم المستخدم موجود مسبقاً، اختر اسماً آخر';
      if (m.includes('with this email already exists') || m.includes('البريد الإلكتروني مستخدم')) return 'البريد الإلكتروني مستخدم، استخدم بريداً آخر';
      if ((m.includes('must include') || (m.includes('invalid') && m.includes('@')) || m.toLowerCase().includes('valid email'))) return 'يرجى إدخال بريد إلكتروني صحيح';
      if (m.includes('may not be blank') || m.includes('required')) return 'هذا الحقل مطلوب';
      if (m.includes('may not be null')) return 'هذا الحقل مطلوب';
      if (m.toLowerCase().includes('password') && m.toLowerCase().includes('weak')) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      if (m.includes('do not match') || m.includes('غير متطابقتين')) return 'كلمات المرور غير متطابقة';
      return m;
    };
    Object.keys(fieldErrors).forEach((k) => { fieldErrors[k] = translate(fieldErrors[k]); });
    const general = translate(
      fieldErrors.non_field_errors ||
      (Object.keys(fieldErrors).length ? '' : (typeof payload === 'string' ? payload : 'تعذر إنشاء الحساب، حاول مجدداً'))
    );
    return { fieldErrors, general };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: 'كلمات المرور غير متطابقة' });
      return;
    }
    const email = form.email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors({ email: 'البريد الإلكتروني مطلوب' });
      return;
    }
    if (!emailPattern.test(email)) {
      setErrors({ email: 'يرجى إدخال بريد إلكتروني صحيح' });
      return;
    }
    setErrors({});
    setGeneralError('');
    const result = await dispatch(registerUser(form));
    if (result.type === 'auth/register/fulfilled') {
      navigate('/');
    } else {
      const { fieldErrors, general } = extractErrors(result.payload?.errors || result.payload);
      setErrors(fieldErrors);
      setGeneralError(general);
    }
  };

  const TextFieldProps = (name, label, icon, extra = {}) => ({
    name,
    label,
    value: form[name],
    onChange: handleChange,
    fullWidth: true,
    variant: 'outlined',
    error: !!errors[name],
    helperText: errors[name],
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    InputProps: {
      startAdornment: (
        <InputAdornment position="start">{icon}</InputAdornment>
      ),
    },
    ...extra,
  });

  return (
    <div className="auth-page lux-auth-page">
      <AnimatedBackground variant="gold" />
      <Box sx={{ width: '100%', maxWidth: 560 }}>
        <div className="lux-card">
          <div className="lux-brand">
            <div className="lux-brand-icon">🛡️</div>
            <div className="lux-brand-title">SECURE VAULT AI PRO</div>
            <div className="lux-brand-sub">✨ Your Digital Fortress ✨</div>
          </div>

          <h1 className="lux-title">🌟 انطلق في رحلتك الآمنة!</h1>
          <p className="lux-subtitle">أنشئ حسابك وابدأ حماية بياناتك</p>

          {generalError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{generalError}</Alert>}
          {!generalError && Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
              <div style={{ fontWeight: 700 }}>يرجى مراجعة الحقول التالية:</div>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: 18 }}>
                {Object.entries(errors).map(([k, v]) => (
                  <li key={k} style={{ fontSize: 13 }}>
                    {typeof v === 'string' ? v : JSON.stringify(v)}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>👤 اسم المستخدم</label>
              <TextField {...TextFieldProps('username', 'اسم المستخدم', <PersonIcon />)} />
            </div>

            <div className="auth-field">
              <label>📧 البريد الإلكتروني</label>
              <TextField {...TextFieldProps('email', 'البريد الإلكتروني', <EmailIcon />, { type: 'email' })} />
            </div>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <Box sx={{ flex: 1 }}>
                <div className="auth-field">
                  <label>👤 الاسم الأول</label>
                  <TextField {...TextFieldProps('first_name', 'الاسم الأول', <BadgeIcon />)} />
                </div>
              </Box>
              <Box sx={{ flex: 1 }}>
                <div className="auth-field">
                  <label>👤 الاسم الأخير</label>
                  <TextField {...TextFieldProps('last_name', 'الاسم الأخير', <BadgeIcon />)} />
                </div>
              </Box>
            </Box>

            <div className="auth-field">
              <label>🔑 كلمة المرور</label>
              <TextField {...TextFieldProps('password', 'كلمة المرور', <LockIcon />, { type: 'password' })} />
            </div>

            <div className="auth-field">
              <label>✅ تأكيد كلمة المرور</label>
              <TextField {...TextFieldProps('password_confirm', 'تأكيد كلمة المرور', <VerifiedUserIcon />, { type: 'password' })} />
            </div>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              className="lux-btn"
              sx={{ mt: 1, py: 1.5, fontSize: 17 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '🚀 إنشاء الحساب'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: '#cbb26a' }}>
            لديك حساب؟{' '}
            <Link to="/login" className="lux-link">
              ✨ سجّل الدخول
            </Link>
          </Typography>

          <p className="lux-security">🔒 جميع البيانات مشفرة بـ AES-256-GCM</p>
        </div>
      </Box>
    </div>
  );
}

export default RegisterPage;