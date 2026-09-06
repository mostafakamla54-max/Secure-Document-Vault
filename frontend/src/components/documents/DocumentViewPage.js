import React from 'react';
import {
  Paper, Typography, Button, Box, Chip, CircularProgress, Divider, Grid, Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import { documentService } from '../../services/documentService';
import Layout from '../common/Layout';
import DocumentAiPanel from './DocumentAiPanel';
import EncryptedContentModal from './EncryptedContentModal';

function DocumentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [content, setContent] = React.useState(null);
  const [contentType, setContentType] = React.useState(null);
  const [error, setError] = React.useState('');
  const [showEnc, setShowEnc] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const response = await documentService.get(id);
        setDoc(response.data);
        const ext = (response.data.original_extension || '').toLowerCase();
        const mime = (response.data.mime_type || '').toLowerCase();
        if (ext === 'link') { setContentType('link'); return; }
        try {
          const blobRes = await documentService.download(id);
          const blob = blobRes.data;
          setContent(window.URL.createObjectURL(blob));
          if (mime.startsWith('image/')) setContentType('image');
          else if (mime === 'application/pdf') setContentType('pdf');
          else if (mime.startsWith('text/') || ['txt', 'csv', 'json'].includes(ext)) setContentType('text');
          else if (mime.startsWith('audio/')) setContentType('audio');
          else if (mime.startsWith('video/')) setContentType('video');
          else setContentType('file');
        } catch { setContentType('file'); }
      } catch (err) { setError('\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0648\u062B\u064A\u0642\u0629'); }
      finally { setLoading(false); }
    };
    load();
    return () => { if (content) window.URL.revokeObjectURL(content); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownload = async () => {
    try {
      const response = await documentService.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_filename || doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { setError('\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641'); }
  };

  if (loading) {
    return (<Layout><Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress sx={{ color: '#4a90d9' }} /></Box></Layout>);
  }
  if (!doc) {
    return (<Layout><Alert severity="error">{'\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0648\u062B\u064A\u0642\u0629'}</Alert><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/documents')} sx={{ mt: 2 }}>{'\u0639\u0648\u062F\u0629'}</Button></Layout>);
  }

  const renderPreview = () => {
    if (contentType === 'link') {
      const url = doc.original_filename || doc.description || doc.title;
      return (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Chip label={'\u0631\u0627\u0628\u0637 \u0645\u0634\u0641\u0631 \u0648\u0645\u062D\u0641\u0648\u0638'} sx={{ color: '#ffd700', borderColor: '#ffd700', mb: 2 }} variant="outlined" />
          <Box><LinkIcon sx={{ color: '#00b894', fontSize: 64, mb: 1 }} /></Box>
          <Typography variant="h6">{doc.title}</Typography>
          <Typography variant="body2" sx={{ color: '#00b894', wordBreak: 'break-all', mb: 3 }}>{url}</Typography>
          <Button variant="contained" className="btn-primary" href={url.startsWith('http') ? url : 'https://' + url} target="_blank" rel="noopener noreferrer" startIcon={<LinkIcon />}>{'\u0641\u062A\u062D \u0627\u0644\u0631\u0627\u0628\u0637'}</Button>
        </Box>
      );
    }
    if (contentType === 'image' && content) return <Box sx={{ mt: 3, textAlign: 'center' }}><img src={content} alt={doc.title} style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 12, boxShadow: '0 0 30px rgba(0,210,255,0.2)' }} /></Box>;
    if (contentType === 'pdf' && content) return <Box sx={{ mt: 3 }}><iframe src={content} title={doc.title} style={{ width: '100%', height: 600, borderRadius: 12, border: 'none' }} /></Box>;
    if (contentType === 'text' && content) return <Box sx={{ mt: 3 }}><iframe src={content} title={doc.title} style={{ width: '100%', height: 400, borderRadius: 12, background: 'rgba(0,0,0,0.4)' }} /></Box>;
    if (contentType === 'audio' && content) return <Box sx={{ mt: 3, textAlign: 'center' }}><audio controls src={content} style={{ width: '100%' }} /></Box>;
    if (contentType === 'video' && content) return <Box sx={{ mt: 3, textAlign: 'center' }}><video controls src={content} style={{ maxWidth: '100%', maxHeight: 450, borderRadius: 12 }} /></Box>;
    return null;
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/documents')} sx={{ color: '#4a90d9', fontWeight: 700 }}>{'\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0648\u062B\u0627\u0626\u0642'}</Button>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<LockIcon />} onClick={() => setShowEnc(true)} sx={{ color: '#b7791f', borderColor: '#f1c40f', fontWeight: 700 }}>{'\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0634\u0641\u0631'}</Button>
          <Button variant="contained" className="btn-primary" startIcon={<DownloadIcon />} onClick={handleDownload}>{'\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0623\u0635\u0644\u064A'}</Button>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      <Paper sx={{ p: 4, background: '#ffffff', border: '1px solid #edf2f7', borderRadius: 4, boxShadow: '0 4px 20px rgba(74,144,217,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="h4" className="page-title">{doc.title}</Typography>
          <Chip label={'\u0645\u0634\u0641\u0631 \u0628\u0640 AES-256-GCM'} sx={{ color: '#ffd700', borderColor: '#ffd700' }} variant="outlined" />
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <DetailItem label={'\u0627\u0644\u062A\u0635\u0646\u064A\u0641'} value={doc.category} />
          <DetailItem label={'\u0627\u0644\u0623\u0647\u0645\u064A\u0629'} value={doc.importance} />
          <DetailItem label={'\u0627\u0644\u062D\u062C\u0645'} value={doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' \u0643\u064A\u0644\u0648\u0628\u0627\u064A\u062A' : '-'} />
          <DetailItem label={'\u0639\u062F\u062F \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A'} value={doc.view_count} />
          <DetailItem label={'\u0639\u062F\u062F \u0627\u0644\u062A\u0646\u0632\u064A\u0644\u0627\u062A'} value={doc.download_count} />
          <DetailItem label={'\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621'} value={new Date(doc.created_at).toLocaleString('ar')} />
        </Grid>
        {doc.description && (<><Divider sx={{ my: 3 }} /><Typography variant="body1"><strong>{'\u0627\u0644\u0648\u0635\u0641:'}</strong> {doc.description}</Typography></>)}

        {renderPreview()}
        <DocumentAiPanel docId={doc.id} />

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block', textAlign: 'center' }}>{'\u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0645\u0634\u0641\u0631\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u062A\u0641\u0643 \u062A\u0644\u0642\u0627\u0626\u064A\u0627 \u0639\u0646\u062F \u0627\u0644\u0639\u0631\u0636 \u0641\u0642\u0637'}</Typography>
      </Paper>
      <EncryptedContentModal docId={doc.id} open={showEnc} onClose={() => setShowEnc(false)} />
    </Layout>
  );
}

function DetailItem({ label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Chip label={value} size="small" sx={{ mt: 0.5, color: '#2d3748', background: '#f0f8ff', border: '1px solid #cfe5ff', fontWeight: 700 }} />
    </Grid>
  );
}

export default DocumentViewPage;
