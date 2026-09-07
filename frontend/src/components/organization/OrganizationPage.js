import React from 'react';
import {
  Box, Paper, Typography, TextField, Button, Chip, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert,
  Stack, Card, CardContent, Grid, Divider,
} from '@mui/material';
import { useSelector } from 'react-redux';
import Layout from '../common/Layout';
import { orgService } from '../../services/orgService';
import { documentService } from '../../services/documentService';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'المالك' },
  { value: 'admin', label: 'مشرف' },
  { value: 'member', label: 'عضو' },
];

function OrganizationPage() {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = React.useState(true);
  const [banner, setBanner] = React.useState(null);
  const [org, setOrg] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [orgDocs, setOrgDocs] = React.useState([]);
  const [myDocs, setMyDocs] = React.useState([]);

  const [createName, setCreateName] = React.useState('');
  const [createDesc, setCreateDesc] = React.useState('');
  const [addUsername, setAddUsername] = React.useState('');
  const [addRole, setAddRole] = React.useState('member');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [selectedDoc, setSelectedDoc] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const response = await orgService.myOrg();
        setOrg(response.data);
        const membersRes = await orgService.members();
        setMembers(membersRes.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setOrg(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
    if (!org) return;
    const loadDocs = async () => {
      try {
        const [shared, own] = await Promise.all([
          orgService.orgDocuments(),
          documentService.list(),
        ]);
        setOrgDocs(shared.data || []);
        setMyDocs((own.data.results || own.data || []).filter((d) => !d.is_deleted));
      } catch (err) {
        // error
      }
    };
    loadDocs();
  }, [org]);

  const reloadOrg = async () => {
    const [orgRes, membersRes, sharedRes, ownRes] = await Promise.all([
      orgService.myOrg(),
      orgService.members(),
      orgService.orgDocuments(),
      documentService.list(),
    ]);
    setOrg(orgRes.data);
    setMembers(membersRes.data);
    setOrgDocs(sharedRes.data || []);
    setMyDocs((ownRes.data.results || ownRes.data || []).filter((d) => !d.is_deleted));
  };

  const flash = (msg, severity = 'success') => {
    setBanner({ msg, severity });
    window.setTimeout(() => setBanner(null), 4000);
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      const response = await orgService.create({ name: createName, description: createDesc });
      setOrg(response.data);
      flash('تم إنشاء المؤسسة بنجاح');
      setCreateName('');
      setCreateDesc('');
      const membersRes = await orgService.members();
      setMembers(membersRes.data);
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر إنشاء المؤسسة', 'error');
    }
  };

  const handleUpdateSettings = async (field, value) => {
    try {
      const response = await orgService.updateOrg({ [field]: value });
      setOrg(response.data);
      flash('تم تحديث الإعدادات');
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر التحديث', 'error');
    }
  };

  const handleAddMember = async () => {
    if (!addUsername.trim()) return;
    try {
      await orgService.addMember({ username: addUsername, role: addRole });
      flash('تمت إضافة العضو');
      setAddUsername('');
      await reloadOrg();
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر إضافة العضو', 'error');
    }
  };

  const handleUpdateMember = async (member, role) => {
    try {
      await orgService.updateMember(member.user, { role });
      flash('تم تحديث الدور');
      await reloadOrg();
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر تحديث الدور', 'error');
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      await orgService.removeMember(member.user);
      flash('تمت إزالة العضو');
      await reloadOrg();
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر إزالة العضو', 'error');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await orgService.invite({ email: inviteEmail, role: 'member' });
      flash('تم إرسال الدعوة');
      setInviteEmail('');
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر إرسال الدعوة', 'error');
    }
  };

  const handleShare = async () => {
    if (!selectedDoc) return;
    try {
      await orgService.shareDocument(selectedDoc);
      flash('تمت مشاركة الوثيقة مع المؤسسة');
      setSelectedDoc('');
      await reloadOrg();
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر المشاركة', 'error');
    }
  };

  const handleUnshare = async (docId) => {
    try {
      await orgService.unshareDocument(docId);
      flash('تمت إزالة الوثيقة من المؤسسة');
      await reloadOrg();
    } catch (err) {
      flash(err.response?.data?.detail || 'تعذر الإزالة', 'error');
    }
  };

  const canManage = org && ['owner', 'admin'].includes(org.my_role);

  if (loading) {
    return (
      <Layout>
        <CircularProgress sx={{ mt: 8, ml: '50%' }} />
      </Layout>
    );
  }

  if (!org) {
    return (
      <Layout>
        <Typography variant="h4" sx={{ mb: 3 }}>المؤسسات</Typography>
        {banner && (
          <Alert severity={banner.severity} sx={{ mb: 2 }} onClose={() => setBanner(null)}>
            {banner.msg}
          </Alert>
        )}
        <Card sx={{ maxWidth: 520, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>إنشاء مؤسسة جديدة</Typography>
          <TextField
            fullWidth label="اسم المؤسسة" sx={{ mb: 2 }}
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <TextField
            fullWidth label="الوصف" multiline rows={2} sx={{ mb: 2 }}
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleCreate}>
            إنشاء المؤسسة
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" sx={{ mb: 3 }}>المؤسسات</Typography>

      {banner && (
        <Alert severity={banner.severity} sx={{ mb: 2 }} onClose={() => setBanner(null)}>
          {banner.msg}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h5">{org.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                @{org.slug} · {org.members_count} عضو · منذ {new Date(org.created_at).toLocaleDateString('ar-EG')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={ROLE_OPTIONS.find((r) => r.value === org.my_role)?.label || org.my_role}
                  color={
                    org.my_role === 'owner' ? 'primary'
                    : org.my_role === 'admin' ? 'secondary' : 'default'
                  }
                  size="small"
                />
              </Box>
              {org.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {org.description}
                </Typography>
              )}
              {org.my_role === 'restricted' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  فعّل التحقق بخطوتين (2FA) لاستخدام ميزات المؤسسة.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>إعدادات المؤسسة</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(org.require_2fa)}
                    disabled={!canManage}
                    onChange={(e) => handleUpdateSettings('require_2fa', e.target.checked)}
                  />
                }
                label="إلزام الأعضاء بتفعيل التحقق بخطوتين"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(org.allow_member_upload)}
                    disabled={!canManage}
                    onChange={(e) => handleUpdateSettings('allow_member_upload', e.target.checked)}
                  />
                }
                label="السماح للأعضاء بمشاركة الوثائق"
              />
            </CardContent>
          </Card>

          {canManage && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>إضافة عضو / دعوة</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    size="small" label="اسم المستخدم" sx={{ flex: 1 }}
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                  />
                  <FormControl size="small" sx={{ width: 120 }}>
                    <InputLabel>الدور</InputLabel>
                    <Select
                      value={addRole}
                      label="الدور"
                      onChange={(e) => setAddRole(e.target.value)}
                    >
                      <MenuItem value="member">عضو</MenuItem>
                      <MenuItem value="admin">مشرف</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={handleAddMember}>إضافة</Button>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small" label="البريد الإلكتروني للدعوة" sx={{ flex: 1 }}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button variant="outlined" onClick={handleInvite}>دعوة</Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>الأعضاء ({members.length})</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>الاسم</TableCell>
                      <TableCell>البريد</TableCell>
                      <TableCell>الدور</TableCell>
                      {canManage && <TableCell>إجراءات</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.user}>
                        <TableCell>
                          {m.first_name || m.last_name
                            ? `${m.first_name} ${m.last_name}`.trim()
                            : m.username}
                        </TableCell>
                        <TableCell>{m.email}</TableCell>
                        <TableCell>
                          {canManage && m.role !== 'owner' ? (
                            <Select
                              size="small" value={m.role}
                              onChange={(e) => handleUpdateMember(m, e.target.value)}
                            >
                              {ROLE_OPTIONS.filter((r) => r.value !== 'owner').map((r) => (
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Chip
                              size="small"
                              label={ROLE_OPTIONS.find((r) => r.value === m.role)?.label || m.role}
                              color={m.role === 'owner' ? 'primary' : m.role === 'admin' ? 'secondary' : 'default'}
                            />
                          )}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            {m.role !== 'owner' && m.username !== user?.username && (
                              <Button size="small" color="error" onClick={() => handleRemoveMember(m)}>
                                إزالة
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>وثائق المؤسسة ({orgDocs.length})</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>وثيقة من وثائقك</InputLabel>
                  <Select
                    value={selectedDoc}
                    label="وثيقة من وثائقك"
                    onChange={(e) => setSelectedDoc(e.target.value)}
                  >
                    {myDocs.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleShare} disabled={!selectedDoc}>
                  مشاركة مع المؤسسة
                </Button>
              </Stack>
              {orgDocs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  لا توجد وثائق مشتركة مع المؤسسة بعد.
                </Typography>
              ) : (
                orgDocs.map((d) => (
                  <Paper key={d.id} sx={{ p: 1.5, mb: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body1">{d.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          صاحب الوثيقة: {d.owner} · {new Date(d.created_at).toLocaleDateString('ar-EG')}
                        </Typography>
                      </Box>
                      {(canManage || d.owner === user?.username) && (
                        <Button size="small" color="error" onClick={() => handleUnshare(d.id)}>
                          إزالة
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        جميع وثائق المؤسسة مشفرة بتشفير AES-256-GCM وتُقيّد بصلاحيات الأدوار.
      </Typography>
    </Layout>
  );
}

export default OrganizationPage;