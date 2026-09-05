import React from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
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
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-card fade-up">
        <div className="auth-logo float">🔐</div>
        <h1 className="auth-title">Secure Vault</h1>
        <p className="auth-subtitle">مرحباً بعودتك! سجّل دخولك للمتابعة</p>

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
                    <PersonIcon sx={{ color: '#4a90d9' }} />
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
                    <LockIcon sx={{ color: '#7c6df0' }} />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            className="btn-primary btn-pulse"
            sx={{ mt: 1, py: 1.5, fontSize: 17 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '🚀 تسجيل الدخول'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: '#718096' }}>
          ليس لديك حساب؟{' '}
          <Link to="/register" style={{ color: '#4a90d9', fontWeight: 800 }}>
            إنشاء حساب
          </Link>
        </Typography>

        <p className="auth-security">🔒 جميع البيانات مشفرة بـ AES-256-GCM</p>
      </div>
    </div>
  );
}

export default LoginPage;
