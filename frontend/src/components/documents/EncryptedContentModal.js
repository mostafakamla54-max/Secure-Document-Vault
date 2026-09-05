import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, CircularProgress, Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import { documentService } from '../../services/documentService';

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      return true;
    } finally {
      ta.remove();
    }
  }
}

const L = {
  title: 'النص المشفر',
  titleLabel: 'العنوان',
  dateLabel: 'التاريخ',
  typeLabel: 'النوع',
  algorithmLabel: 'نوع التشفير',
  ciphertextLabel: 'النص المشفر (AES-256-GCM)',
  copy: 'نسخ النص المشفر',
  decrypt: 'فك التشفير',
  ai: 'تحليل بالذكاء الاصطناعي',
  close: 'العودة إلى الملفات',
  downloading: 'التحليل جارٍ...',
  bytes: 'حجم النص الأصلي',
  encryptedBytes: 'حجم النص المشفر',
  decrypted: 'النص الأصلي بعد فك التشفير',
  binaryInfo: 'عند فك التشفير',
  checksumOk: 'التحقق من السلامة (SHA-256)',
  checksumMatch: 'مطابق',
  checksumFailed: 'غير مطابق',
  memory: 'الذاكرة المفتاحية',
  keyBits: '256-بت',
  separated: 'لا يُخزَّن النص الأصلي أبداً — يُحفظ مشفراً فقط',
  logNote: 'كل عملية فك تشفير تُسجَّل في سجل التدقيق',
  link: 'رابط مشفر',
  text: 'نص',
  binary: 'ملف ثنائي',
  decryptSuccess: 'تم فك التشفير بنجاح من الخادم',
};

export default function EncryptedContentModal({ docId, open, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const [decrypting, setDecrypting] = React.useState(false);
  const [decrypted, setDecrypted] = React.useState(null);
  const [decryptError, setDecryptError] = React.useState('');

  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState(null);
  const [aiError, setAiError] = React.useState('');

  React.useEffect(() => {
    if (!open || !docId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    setDecrypted(null);
    setDecryptError('');
    setAiResult(null);
    setAiError('');
    documentService
      .getEncrypted(docId)
      .then((res) => { if (!cancelled) { setData(res.data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('تعذر جلب النص المشفر'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [open, docId]);

  const handleCopy = async () => {
    if (!data) return;
    const ok = await copyToClipboard(data.ciphertext_hex);
    setCopied(ok);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDecrypt = async () => {
    if (!docId) return;
    setDecrypting(true);
    setDecryptError('');
    setDecrypted(null);
    try {
      const res = await documentService.decryptText(docId);
      setDecrypted(res.data);
    } catch {
      setDecryptError('تعذر فك التشفير — أنت لست مالك الوثيقة');
    } finally {
      setDecrypting(false);
    }
  };

  const handleAi = async () => {
    if (!docId) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const res = await documentService.analyze(docId);
      setAiResult(res.data);
    } catch {
      setAiError('تعذر إجراء التحليل الذكي');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const resp = await documentService.download(docId);
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', (decrypted && decrypted.filename) || data?.filename || docId);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setDecryptError('تعذر تحميل الملف');
    }
  };

  const typeLabel = () => {
    if (data?.is_link) return L.link;
    if (data?.content_type?.startsWith('text/') || ['txt', 'csv', 'json'].includes(data?.content_type)) return L.text;
    return L.binary;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="enc-dialog-title">
      <DialogTitle sx={{ background: 'linear-gradient(135deg,#1a237e,#3f51b5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>🔐 {L.title}</Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip size="small" label="AES-256-GCM" sx={{ color: '#ffd700', borderColor: '#ffd700', background: 'rgba(255,255,255,0.08)' }} variant="outlined" />
          <Chip size="small" label={L.keyBits} sx={{ color: '#ffd700', borderColor: '#ffd700', background: 'rgba(255,255,255,0.08)' }} variant="outlined" />
        </Box>
      </DialogTitle>
      <DialogContent className="lux-dlg" sx={{ background: '#fff', pt: 3, pb: 2 }}>
        {loading && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#4a90d9' }} />
            <Typography sx={{ mt: 2, color: '#718096' }}>جاري تحميل النص المشفر...</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

        {!loading && data && (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <InfoBox label={L.titleLabel} value={data.title} />
              <InfoBox
                label={L.dateLabel}
                value={data.created_at ? new Date(data.created_at).toLocaleString('ar') : '-'}
              />
              <InfoBox label={L.typeLabel} value={typeLabel()} />
              <InfoBox label={L.encryptedBytes} value={`${data.ciphertext_bytes} B`} />
              <InfoBox label={L.bytes} value={data.plaintext_bytes ? `${data.plaintext_bytes} B` : '-'} />
            </Box>

            <Typography variant="overline" sx={{ color: '#a0aec0', fontWeight: 700 }}>
              {L.ciphertextLabel}
            </Typography>
            <Box
              className="lux-code"
              sx={{
                fontFamily: 'Consolas,monospace', fontSize: 12, color: '#0d47a1', background: '#f0f8ff',
                border: '1px solid #cfe5ff', borderRadius: 3, p: 2, mt: 0.5, maxHeight: 220, overflow: 'auto',
                wordBreak: 'break-all', userSelect: 'text', whiteSpace: 'pre-wrap', direction: 'ltr', textAlign: 'left',
              }}
            >
              {data.ciphertext_hex}
            </Box>
            <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block', mt: 1, direction: 'ltr', textAlign: 'left' }}>
              nonce ({data.nonce_bytes} B): {data.nonce_hex}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained" className="btn-primary" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                {copied ? '✓ تم النسخ' : L.copy}
              </Button>
              <Button
                variant="outlined"
                sx={{ color: '#2ecc71', borderColor: '#2ecc71', fontWeight: 700 }}
                startIcon={decrypting ? <CircularProgress size={18} color="inherit" /> : <LockOpenIcon />}
                onClick={handleDecrypt}
                disabled={decrypting}
              >
                {L.decrypt}
              </Button>
              <Button
                variant="outlined"
                sx={{ color: '#7c6df0', borderColor: '#7c6df0', fontWeight: 700 }}
                startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                onClick={handleAi}
                disabled={aiLoading}
              >
                {aiLoading ? L.downloading : L.ai}
              </Button>
            </Box>

            {decryptError && <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{decryptError}</Alert>}

            {decrypted && (
              <Box className="lux-dec" sx={{ mt: 3, p: 2, borderRadius: 3, border: '1px solid #d2f5e2', background: '#f2fdf7' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="overline" sx={{ color: '#00b894', fontWeight: 700 }}>{L.decrypted}</Typography>
                  <Chip
                    size="small"
                    label={decrypted.checksum_match ? `${L.checksumOk}: ${L.checksumMatch}` : `${L.checksumOk}: ${L.checksumFailed}`}
                    sx={{ color: decrypted.checksum_match ? '#00b894' : '#e74c3c', fontWeight: 700, borderColor: decrypted.checksum_match ? '#00b894' : '#e74c3c' }}
                    variant="outlined"
                  />
                </Box>

                {decrypted.is_text ? (
                  <Box
                    className="lux-code"
                    sx={{
                      fontFamily: 'Consolas,monospace', fontSize: 13, color: '#155724', background: '#fff', border: '1px solid #d2f5e2',
                      borderRadius: 2, p: 2, mt: 1, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}
                  >
                    {decrypted.decrypted}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ mt: 1, color: '#2d3748' }}>
                    {L.decryptSuccess} — {L.binaryInfo}: {decrypted.bytes} بايت ({decrypted.mime_type})
                    <Button size="small" sx={{ ml: 1, color: '#00b894', fontWeight: 700 }} startIcon={<DownloadIcon />} onClick={handleDownload}>
                      تحميل الملف الأصلي
                    </Button>
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 1 }}>🔒 {L.logNote}</Typography>
              </Box>
            )}

            {aiError && <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{aiError}</Alert>}

            {aiResult && (
              <Box className="lux-ai" sx={{ mt: 3, p: 2, borderRadius: 3, border: '1px solid #e9d5ff', background: 'linear-gradient(135deg,#faf5ff,#f3e8ff)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="overline" sx={{ color: '#4a3f9e', fontWeight: 800 }}>🤖 تحليل الذكاء الاصطناعي</Typography>
                  {aiResult.provider && <Chip size="small" label={aiResult.provider === 'local' ? 'بديل محلي' : `مزود: ${aiResult.provider}`} sx={{ color: '#7c6df0', fontWeight: 700 }} variant="outlined" />}
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>الملخص:</strong> {aiResult.summary}</Typography>
                {aiResult.keywords?.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', my: 1 }}>
                    {aiResult.keywords.map((k, i) => <Chip key={i} label={k} size="small" sx={{ background: '#fff', fontWeight: 600 }} />)}
                  </Box>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>البيانات الحساسة ({aiResult.sensitive_count || 0}):</strong>{' '}
                  {!aiResult.sensitive_data || aiResult.sensitive_data.length === 0
                    ? <Chip size="small" label="لا توجد بيانات حساسة مكتشفة" sx={{ color: '#00b894', fontWeight: 700 }} />
                    : (aiResult.sensitive_data || []).map((s, i) => (
                      <Chip key={i} size="small" label={`${s.type_ar || s.type_en || s.type}: ${s.match || s.value}`} sx={{ m: 0.3, background: '#fff', fontWeight: 600 }} />
                    ))}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>التصنيف المقترح:</strong> <Chip size="small" label={aiResult.category_suggestion} color="primary" /></Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions className="lux-dlg" sx={{ background: '#fff', justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Typography variant="caption" sx={{ color: '#a0aec0', maxWidth: '60%' }}>
          🛡️ {L.separated} — {data ? `${L.encryptedBytes}: ${data.ciphertext_bytes} بايت · ${L.keyBits}` : ''}
        </Typography>
        <Button onClick={onClose} variant="contained" className="btn-primary">📁 {L.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoBox({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>{label}</Typography>
      <Chip className="lux-chip" label={value} size="small" sx={{ mt: 0.5, color: '#2d3748', background: '#f0f8ff', border: '1px solid #cfe5ff', fontWeight: 700 }} />
    </Box>
  );
}