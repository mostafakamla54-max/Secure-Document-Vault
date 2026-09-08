import React from 'react';
import { Typography, TextField, Button, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PinIcon from '@mui/icons-material/Pin';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { loginUser, login2faUser, clearError } from '../../store/slices/authSlice';
import AnimatedBackground from '../common/AnimatedBackground';

function LoginPage() {
  const [form, setForm] = React.useState({ username: '', password: '' });
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState('credentials');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, pending2fa } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (result.type === 'auth/login/fulfilled') {
      if (result.payload.requires_2fa) {
        setStep('otp');
      } else {
        navigate('/');
      }
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login2faUser(code));
    if (result.type === 'auth/login2fa/fulfilled') {
      navigate('/');
    }
  };

  const handleBack = () => {
    if (step === 'otp' && pending2fa) {
      dispatch(clearError());
      setStep('credentials');
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

        <h1 className="lux-title">{step === 'otp' ? '🔐 رمز التحقق' : '🌟 مرحباً بعودتك!'}</h1>
        <p className="lux-subtitle">
          {step === 'otp'
            ? 'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة (2FA)'
            : 'سجّل دخولك لعالمك الآمن'}
        </p>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {typeof error === 'string' ? error : 'بيانات الدخول غير صحيحة'}
          </Alert>
        )}

        {step === 'otp' ? (
          <form onSubmit={handleOtpSubmit}>
            <div className="auth-field">
              <label>🔢 رمز التحقق 2FA</label>
              <TextField
                name="code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  dispatch(clearError());
                }}
                fullWidth
                required
                autoFocus
                inputMode="numeric"
                variant="outlined"
                placeholder="000000"
                autoComplete="one-time-code"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PinIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || code.length < 6}
              className="lux-btn"
              sx={{ mt: 1, py: 1.5, fontSize: 17 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '🛡️ تحقق ودخول'}
            </Button>

            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#cbb26a' }}>
              {pending2fa ? (
                <span onClick={handleBack} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  ↩️ العودة إلى الدخول
                </span>
              ) : (
                <Link to="/login" className="lux-link">
                  ↩️ العودة إلى الدخول
                </Link>
              )}
            </Typography>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>📧 البريد الإلكتروني</label>
              <TextField
                name="username"
                value={form.username}
                onChange={handleChange}
                fullWidth
                required
                type="email"
                variant="outlined"
                placeholder="أدخل بريدك الإلكتروني"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
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
        )}

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