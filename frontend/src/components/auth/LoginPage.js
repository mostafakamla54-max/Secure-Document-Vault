import React from 'react';
import { Typography, TextField, Button, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { loginUser, clearError } from '../../store/slices/authSlice';
import AnimatedBackground from '../common/AnimatedBackground';

function LoginPage() {
  const [form, setForm] = React.useState({ username: '', password: '' });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (result.type === 'auth/login/fulfilled') {
      navigate('/');
    }
  };

  return (
    <div className="auth-page lux-auth-page">
      <AnimatedBackground variant="gold" />
      <div className="lux-card">
        <div className="lux-brand">
          <div className="lux-brand-icon">🛡️</div>
          <div className="lux-brand-title">SECURE VAULT AI PRO</div>
          <div className="lux-brand-sub">✨ Your Digital Fortress ✨</div>
        </div>

        <h1 className="lux-title">🌟 مرحباً بعودتك!</h1>
        <p className="lux-subtitle">سجّل دخولك لعالمك الآمن</p>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {typeof error === 'string' ? error : 'بيانات الدخول غير صحيحة'}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>👤 اسم المستخدم</label>
            <TextField
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              placeholder="أدخل اسم المستخدم"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <div className="auth-field">
            <label>🔑 كلمة المرور</label>
            <TextField
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              placeholder="أدخل كلمة المرور"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <div className="lux-row">
            <label>
              <input type="checkbox" /> ☑️ تذكرني
            </label>
            <span className="lux-forgot">🔗 نسيت كلمة المرور؟</span>
          </div>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            className="lux-btn"
            sx={{ mt: 1, py: 1.5, fontSize: 17 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '🚀 تسجيل الدخول'}
          </Button>
        </form>

        <div className="lux-divider">أو المتابعة عبر</div>

        <div className="lux-social">
          <Button disabled startIcon={<GoogleIcon />}>Google</Button>
          <Button disabled startIcon={<GitHubIcon />}>GitHub</Button>
        </div>

        <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: '#cbb26a' }}>
          ليس لديك حساب؟{' '}
          <Link to="/register" className="lux-link">
            ✨ إنشاء حساب
          </Link>
        </Typography>

        <p className="lux-security">🔒 جميع البيانات مشفرة بـ AES-256-GCM</p>
      </div>
    </div>
  );
}

export default LoginPage;