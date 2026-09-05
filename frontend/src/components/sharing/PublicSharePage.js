import React from 'react';
import { Box, Typography, Paper, Chip, Button, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import { sharingService } from '../../services/sharingService';
import AnimatedBackground from '../common/AnimatedBackground';

const PERMISSION_LABELS = { view: 'عرض فقط', edit: 'تحرير', comment: 'تعليق', full: 'صلاحية كاملة' };

function PublicSharePage() {
  const { token } = useParams();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await sharingService.getPublic(token);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'هذه المشاركة غير متاحة أو انتهت صلاحيتها');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleDownload = async () => {
    try {
      const res = await sharingService.getPublicDownload(token);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.title || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('تعذر تحميل الملف');
    }
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <Box sx={{ width: '100%', maxWidth: 560 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
            <CircularProgress sx={{ color: '#4a90d9' }} />
          </Box>
        ) : error ? (
          <div className="auth-card fade-up">
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: 48 }}>🔒</Typography>
            </Box>
            <Typography variant="h5" sx={{ textAlign: 'center', color: '#2d3748', fontWeight: 700, mb: 2 }}>عذراً</Typography>
            <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
          </div>
        ) : (
          <div className="auth-card fade-up">
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <DescriptionIcon sx={{ fontSize: 52, color: '#4a90d9' }} />
            </Box>
            <Typography variant="h5" sx={{ textAlign: 'center', color: '#2d3748', fontWeight: 700 }}>{data.title}</Typography>
            {data.description && (
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#718096', mt: 1 }}>{data.description}</Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Chip icon={<LockIcon />} label="مشفرة بـ AES-256-GCM" sx={{ color: '#b7791f', borderColor: '#f1c40f', background: '#fffbeb', fontWeight: 700 }} variant="outlined" />
              <Chip label={`شاركها: ${data.shared_by}`} sx={{ color: '#7c6df0', fontWeight: 700 }} variant="outlined" />
              <Chip label={`الصلاحية: ${PERMISSION_LABELS[data.permission] || data.permission}`} sx={{ color: '#4a90d9', fontWeight: 700 }} variant="outlined" />
            </Box>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button variant="contained" className="btn-primary" onClick={handleDownload} startIcon={<DownloadIcon />}>
                تحميل الملف
              </Button>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: '#a0aec0' }}>
              🔐 يُفك تشفير المحتوى لحظة العرض أو التحميل فقط
            </Typography>
          </div>
        )}
      </Box>
    </div>
  );
}

export default PublicSharePage;
