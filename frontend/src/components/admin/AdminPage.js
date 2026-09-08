import React from 'react';
import {
  Paper, Typography, Button, Box, Grid, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import api from '../../services/api';
import { actionLabel, objectLabel, severityLabel, severityChip, fmtTime } from '../../utils/auditLabels';

const L = {
  title: '\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u062F\u064A\u0631',
  stats: '\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A',
  users: '\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646',
  docs: '\u0627\u0644\u0648\u062B\u0627\u0626\u0642',
  audit: '\u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642',
  decrypt: '\u0641\u0643 \u0627\u0644\u062A\u0634\u0641\u064A\u0631',
  view: '\u0639\u0631\u0636',
  decryptBtn: '\u0641\u0643 \u0627\u0644\u062A\u0634\u0641\u064A\u0631',
  close: '\u0625\u063A\u0644\u0627\u0642',
  noContent: '(\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u062D\u062A\u0648\u0649)',
  decrypted: '\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0641\u0643\u0643',
  encrypted: '\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0634\u0641\u0631',
};

function AdminPage() {
  const [stats, setStats] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [docs, setDocs] = React.useState([]);
  const [audit, setAudit] = React.useState([]);
  const [tab, setTab] = React.useState('stats');
  const [loading, setLoading] = React.useState(true);
  const [decDoc, setDecDoc] = React.useState(null);
  const [decResult, setDecResult] = React.useState(null);
  const [err, setErr] = React.useState('');

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, d, a] = await Promise.all([
        api.get('/documents/admin/stats/'),
        api.get('/documents/admin/users/'),
        api.get('/documents/admin/documents/'),
        api.get('/documents/admin/audit/'),
      ]);
      setStats(s.data); setUsers(u.data); setDocs(d.data); setAudit(a.data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  const toggleActive = async (u) => {
    try {
      await api.patch('/documents/admin/users/' + u.id + '/', { is_active: !u.is_active });
      loadAll();
    } catch (e) { setErr(String(e)); }
  };

  const openDecrypt = (doc) => { setDecDoc(doc); setDecResult(null); setErr(''); };
  const doDecrypt = async () => {
    try {
      const r = await api.post('/documents/admin/documents/' + decDoc.id + '/decrypt/');
      setDecResult(r.data);
    } catch (e) { setErr(String(e)); }
  };

  const tabs = [
    { key: 'stats', label: L.stats },
    { key: 'users', label: L.users },
    { key: 'docs', label: L.docs },
    { key: 'audit', label: L.audit },
  ];

  return (
    <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #edf2f7', boxShadow: '0 4px 20px rgba(74,144,217,0.1)' }}>
      <Typography variant="h4" className="page-title" sx={{ mb: 3 }}>{L.title}</Typography>

      {err && <Typography color="error" sx={{ mb: 2 }}>{err}</Typography>}

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'contained' : 'outlined'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </Box>

      {loading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#4a90d9' }} /></Box>}

      {!loading && tab === 'stats' && stats && (
        <Grid container spacing={2}>
          {[
            ['\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646', stats.total_users],
            ['\u0627\u0644\u0648\u062B\u0627\u0626\u0642', stats.total_docs],
            ['\u0646\u0634\u0637\u0629', stats.active_docs],
            ['\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A', stats.total_views],
            ['\u0627\u0644\u062A\u0646\u0632\u064A\u0644\u0627\u062A', stats.total_downloads],
            ['\u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642', stats.audit_logs],
          ].map((x) => (
            <Grid item xs={6} sm={4} key={x[0]}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, background: 'linear-gradient(135deg,#f0f8ff,#e8f4ff)' }}>
                <Typography variant="h4" sx={{ color: '#4a90d9', fontWeight: 800 }}>{x[1]}</Typography>
                <Typography color="text.secondary">{x[0]}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && tab === 'users' && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645</TableCell>
                <TableCell>\u0627\u0644\u0628\u0631\u064A\u062F</TableCell>
                <TableCell>\u0648\u062B\u0627\u0626\u0642</TableCell>
                <TableCell>\u0635\u0644\u0627\u062D\u064A\u0627\u062A</TableCell>
                <TableCell>\u0627\u0644\u062D\u0627\u0644\u0629</TableCell>
                <TableCell>\u0625\u062C\u0631\u0627\u0621</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: u.is_superuser ? '#7c6df0' : '#4a90d9', fontSize: 13 }}>{u.username ? u.username[0] : 'U'}</Avatar>
                      {u.username}
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.docs}</TableCell>
                  <TableCell>
                    {u.is_superuser && <Chip label="\u0633\u0648\u0628\u0631" size="small" color="secondary" sx={{ mr: 0.5 }} />}
                    {u.is_staff && <Chip label="\u0645\u0648\u0638\u0641" size="small" color="primary" />}
                  </TableCell>
                  <TableCell>
                    <Chip label={u.is_active ? '\u0646\u0634\u0637' : '\u0645\u0639\u0637\u0644'} size="small" color={u.is_active ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => toggleActive(u)}>
                      {u.is_active ? '\u062A\u0639\u0637\u064A\u0644' : '\u062A\u0641\u0639\u064A\u0644'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && tab === 'docs' && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>\u0627\u0644\u0639\u0646\u0648\u0627\u0646</TableCell>
                <TableCell>\u0627\u0644\u0645\u0627\u0644\u0643</TableCell>
                <TableCell>\u0627\u0644\u062A\u0635\u0646\u064A\u0641</TableCell>
                <TableCell>\u0639/\u062A</TableCell>
                <TableCell>\u0641\u0643 \u0627\u0644\u062A\u0634\u0641\u064A\u0631</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id} sx={d.is_deleted ? { opacity: 0.5 } : {}}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.user}</TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell>{d.view_count}/{d.download_count}</TableCell>
                  <TableCell><Button size="small" onClick={() => openDecrypt(d)}>{L.view}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && tab === 'audit' && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>\u0627\u0644\u0648\u0642\u062A</TableCell>
                <TableCell>\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645</TableCell>
                <TableCell>\u0627\u0644\u0625\u062C\u0631\u0627\u0621</TableCell>
                <TableCell>\u0627\u0644\u0646\u0648\u0639</TableCell>
                <TableCell>\u0627\u0644\u062E\u0637\u0648\u0631\u0629</TableCell>
                <TableCell>\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644</TableCell>
                <TableCell>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audit.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{fmtTime(l.created_at)}</TableCell>
                  <TableCell>{l.actor}</TableCell>
                  <TableCell><Chip label={actionLabel(l.action)} size="small" /></TableCell>
                  <TableCell><Chip label={objectLabel(l.object_type)} size="small" /></TableCell>
                  <TableCell>{severityChip(l.severity)}</TableCell>
                  <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.detail}</TableCell>
                  <TableCell>{l.ip_address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(decDoc)} onClose={() => setDecDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle>{L.decrypt}: {decDoc ? decDoc.title : ''}</DialogTitle>
        <DialogContent>
          <Button variant="contained" onClick={doDecrypt} sx={{ mb: 2 }}>{L.decryptBtn}</Button>
          {decResult && (
            <Box>
              <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.decrypted}</Typography>
              <Paper sx={{ p: 2, background: '#0b1220', color: '#d1fae5', borderRadius: 2, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', mb: 2 }}>
                {decResult.content || L.noContent}
              </Paper>
              <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.encrypted}</Typography>
              <Paper sx={{ p: 2, background: '#0b1220', color: '#93c5fd', borderRadius: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {decResult.encrypted_preview || L.noContent}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDecDoc(null)}>{L.close}</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}

export default AdminPage;
