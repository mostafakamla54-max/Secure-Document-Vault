import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import App from './App';
import './styles/global.css';

const buildTheme = (mode, lang) => {
  const dark = mode === 'dark';
  return createTheme({
    direction: lang === 'ar' ? 'rtl' : 'ltr',
    palette: {
      mode,
      primary: { main: '#4a90d9', light: '#7c6df0' },
      secondary: { main: '#48c9b0' },
      error: { main: '#e74c3c' },
      success: { main: '#2ecc71' },
      warning: { main: '#f1c40f' },
      info: { main: '#00b894' },
      background: {
        default: dark ? '#0f172a' : '#f0f8ff',
        paper: dark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: dark ? '#e2e8f0' : '#2d3748',
        secondary: dark ? '#94a3b8' : '#718096',
      },
      divider: dark ? '#334155' : '#edf2f7',
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: ['Cairo', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'].join(','),
      fontSize: 15,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 50, textTransform: 'none', fontWeight: 700 },
          containedPrimary: {
            background: dark ? 'linear-gradient(135deg, #4a90d9, #7c6df0)' : 'linear-gradient(135deg, #4a90d9, #7c6df0)',
            boxShadow: '0 4px 15px rgba(74,144,217,0.35)',
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
};

function ThemedApp() {
  const mode = useSelector((state) => state.auth.themeMode);
  const lang = useSelector((state) => state.auth.lang);
  const theme = React.useMemo(() => buildTheme(mode, lang), [mode, lang]);
  React.useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.classList.toggle('dark', mode === 'dark');
  }, [lang, mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemedApp />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
