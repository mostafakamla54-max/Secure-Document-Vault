import React from 'react';
import { Box, Grid, Paper, Typography, Chip, CircularProgress, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { fetchDocuments } from '../../store/slices/documentSlice';

function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.documents);
  const user = useSelector((state) => state.auth.user);

  React.useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const total = items.length;
  const favorites = items.filter((d) => d.is_favorite).length;
  const archived = items.filter((d) => d.is_archived).length;
  const highImportance = items.filter((d) => d.importance === 'critical').length;

  const stats = [
    { label: 'إجمالي الوثائق', value: total, color: '#00d4ff' },
    { label: 'المفضلة', value: favorites, color: '#f0d060' },
    { label: 'المؤرشفة', value: archived, color: '#a78bfa' },
    { label: 'حرجة', value: highImportance, color: '#ff8c00' },
  ];

  return (
    <Layout>
      <Box className="dash-lux" sx={{ position: 'relative', zIndex: 1, minHeight: '72vh' }}>

      <Box className="dash-fade" sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" className="dash-title" sx={{ mb: 3, fontWeight: 800 }}>
          مرحباً، {user?.first_name || 'مستخدم'} 👋
        </Typography>
        {loading ? (
          <CircularProgress className="dash-spin" />
        ) : (
          <Grid container spacing={3}>
            {stats.map((stat, i) => (
              <Grid item xs={12} md={6} lg={4} xl={3} key={stat.label} className="dash-fade" sx={{ animationDelay: `${0.08 + i * 0.08}s` }}>
                <Paper className="dash-card" sx={{ p: 3, textAlign: 'center', borderTop: `4px solid ${stat.color}` }}>
                  <Typography variant="h3" className="dash-stat" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                  <Typography variant="body2" className="dash-label">{stat.label}</Typography>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12} className="dash-fade" sx={{ animationDelay: '0.45s' }}>
              <Paper className="dash-card" sx={{ p: 3 }}>
                <Typography variant="h6" className="dash-title-sm" sx={{ mb: 2, fontWeight: 800 }}>الوثائق الحديثة</Typography>
                {items.slice(0, 5).map((doc) => (
                  <Box key={doc.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                    <Typography className="dash-doc">{doc.title}</Typography>
                    <Chip label={doc.category} size="small" className="dash-chip" />
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} className="dash-fade" sx={{ textAlign: 'center', animationDelay: '0.55s' }}>
              <Box>
                <Button className="dash-btn-primary" variant="contained" size="large" startIcon={<UploadFileIcon />} onClick={() => navigate('/documents')}>
                  رفع ملف جديد
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
    </Layout>
  );
}

export default DashboardPage;