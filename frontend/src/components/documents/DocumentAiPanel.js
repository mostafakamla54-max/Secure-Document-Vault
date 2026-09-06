import React from 'react';
import { Paper, Typography, Button, Box, Chip, CircularProgress, Alert, Divider, LinearProgress } from '@mui/material';
import api from '../../services/api';

function DocumentAiPanel({ docId }) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await api.post('/documents/ai/analyze/' + docId + '/');
      setResult(r.data);
    } catch (e) {
      setError('\u062A\u0639\u0630\u0631 \u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0630\u0643\u064A');
    } finally {
      setLoading(false);
    }
  };

  const L = {
    title: '\u062A\u062D\u0644\u064A\u0644 \u0630\u0643\u064A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A',
    local: '\u0628\u062F\u064A\u0644 \u0645\u062D\u0644\u064A',
    provider: '\u0645\u0632\u0648\u062F',
    analyze: '\u062D\u0644\u0644 \u0627\u0644\u0645\u0633\u062A\u0646\u062F',
    reanalyze: '\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0644\u064A\u0644',
    summary: '\u0627\u0644\u0645\u0644\u062E\u0635',
    keywords: '\u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0641\u062A\u0627\u062D\u064A\u0629',
    sensitive: '\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0633\u0629',
    noSensitive: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u062D\u0633\u0627\u0633\u0629 \u0645\u0643\u062A\u0634\u0641\u0629',
    category: '\u0627\u0642\u062A\u0631\u0627\u062D \u0627\u0644\u062A\u0635\u0646\u064A\u0641',
    risk: '\u0645\u0624\u0634\u0631 \u0627\u0644\u0645\u062E\u0627\u0637\u0631',
    riskLow: '\u0645\u0646\u062E\u0641\u0636\u0629',
    riskMed: '\u0645\u062A\u0648\u0633\u0637\u0629',
    riskHigh: '\u0645\u0631\u062A\u0641\u0639\u0629',
    stats: '\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0646\u062F',
    lang: '\u0627\u0644\u0644\u063A\u0629',
    langAr: '\u0639\u0631\u0628\u064A\u0629',
    langEn: '\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629',
    langMix: '\u062E\u0644\u064A\u0637',
    words: '\u0643\u0644\u0645\u0629',
    topTerms: '\u0623\u0647\u0645 \u0627\u0644\u0645\u0635\u0637\u0644\u062D\u0627\u062A',
    entities: '\u0627\u0644\u0643\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0633\u0629',
  };

  return (
    <Paper sx={{ mt: 3, p: 3, borderRadius: 4, border: '1px solid #edf2f7', background: 'linear-gradient(135deg,#f8fbff,#f3e8ff)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#4a3f9e' }}>{L.title}</Typography>
        {result && result.provider && (
          <Chip label={result.provider === 'local' ? L.local : (L.provider + ': ' + result.provider)} size="small" color="secondary" />
        )}
      </Box>
      <Button variant="contained" disabled={loading} onClick={analyze} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
        {result ? L.reanalyze : L.analyze}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{error}</Alert>}

      {result && (
        <Box sx={{ mt: 3 }}>
          {typeof result.risk_score === 'number' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.risk}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={result.risk_score}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: result.risk_score >= 60 ? '#e53e3e' : result.risk_score >= 30 ? '#dd6b20' : '#38a169',
                    },
                  }}
                />
                <Typography variant="body1" sx={{ fontWeight: 800, minWidth: 60 }}>
                  {result.risk_score}/100
                </Typography>
                <Chip
                  label={result.risk_level === 'low' ? L.riskLow : result.risk_level === 'high' ? L.riskHigh : L.riskMed}
                  size="small"
                  color={result.risk_level === 'high' ? 'error' : result.risk_level === 'medium' ? 'warning' : 'success'}
                />
              </Box>
              {typeof result.word_count === 'number' && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip size="small" label={`${L.stats}: ${result.word_count} ${L.words} / ${result.char_count} \u062D\u0631\u0641`} sx={{ background: '#fff' }} />
                  <Chip size="small" label={`${L.lang}: ${result.language === 'arabic' ? L.langAr : result.language === 'english' ? L.langEn : L.langMix}`} sx={{ background: '#fff' }} />
                </Box>
              )}
            </Box>
          )}

          <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.summary}</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{result.summary}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.keywords}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {(result.keywords || []).map((k, i) => <Chip key={i} label={k} size="small" sx={{ background: '#fff', fontWeight: 600 }} />)}
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.sensitive} ({result.sensitive_count || 0})</Typography>
          {(!result.sensitive_data || result.sensitive_data.length === 0) ? (
            <Typography variant="body2" sx={{ color: '#00b894', fontWeight: 600 }}>{L.noSensitive}</Typography>
          ) : (
            (result.sensitive_data || []).map((s, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', my: 0.5 }}>
                <Chip label={s.type_ar || s.type_en || s.type} size="small" color="warning" />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#718096' }}>{s.match || s.value}</Typography>
              </Box>
            ))
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.topTerms}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {(result.top_terms || []).map((t, i) => (
              <Chip
                key={i}
                label={`${t.term} (${t.count})`}
                size="small"
                sx={{ background: i < 3 ? '#ede9fe' : '#fff', fontWeight: 600, fontFamily: 'monospace' }}
              />
            ))}
          </Box>

          {(result.entity_breakdown || []).length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.entities}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {(result.entity_breakdown || []).map((e, i) => (
                  <Chip
                    key={i}
                    label={`${e.type_ar} \u00D7 ${e.count}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" sx={{ color: '#a0aec0' }}>{L.category}</Typography>
          <Typography variant="body2"><Chip label={result.category_suggestion} size="small" color="primary" /></Typography>
        </Box>
      )}
    </Paper>
  );
}

export default DocumentAiPanel;
