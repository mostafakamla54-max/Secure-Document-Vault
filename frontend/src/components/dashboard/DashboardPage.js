import React from 'react';
import { Box, Grid, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../common/Layout';
import { fetchDocuments } from '../../store/slices/documentSlice';

function DashboardPage() {
  const dispatch = useDispatch();
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
    { label: 'إجمالي الوثائق', value: total, color: '#0b5c8f' },
    { label: 'المفضلة', value: favorites, color: '#b3402a' },
    { label: 'المؤرشفة', value: archived, color: '#8a6d3b' },
    { label: 'حرجة', value: highImportance, color: '#b3402a' },
  ];

  return (
    <Layout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        مرحباً، {user?.first_name || 'مستخدم'} 👋
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Paper sx={{ p: 3, textAlign: 'center', borderTop: `4px solid ${stat.color}` }}>
                <Typography variant="h3" color={stat.color}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>الوثائق الحديثة</Typography>
              {items.slice(0, 5).map((doc) => (
                <Box key={doc.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography>{doc.title}</Typography>
                  <Chip label={doc.category} size="small" />
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Layout>
  );
}

export default DashboardPage;
