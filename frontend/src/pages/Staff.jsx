import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, CircularProgress, Alert, Snackbar, Tab, Tabs, Grid, Avatar,
  Card, CardContent, Divider, Tooltip,
} from '@mui/material';
import {
  Edit, Delete, Add, Visibility, FilterList, AccessTime,
  Work, Star, Clear,
} from '@mui/icons-material';

const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER = '#e2cfc4';
const BG = '#f5ede6';

// All known skill / specialization tags
const ALL_SKILLS = [
  'Haircut', 'Beard Styling', 'Hair Coloring', 'Facial',
  'Spa', 'Massage', 'Manicure', 'Pedicure',
];

const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

function Staff() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminOrRecep = ['Admin', 'Receptionist'].includes(user?.role);
  const isBarber = user?.role === 'Barber';
  const isTimeOffRoute = location.pathname.includes('time-off') || isBarber;

  const [tab, setTab]                   = useState(isTimeOffRoute ? 1 : 0);
  const [staff, setStaff]               = useState([]);
  const [timeOffs, setTimeOffs]         = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── Week 7: filter state ──────────────────────────────────
  const [nameFilter, setNameFilter]     = useState('');
  const [skillFilter, setSkillFilter]   = useState([]);   // multi-select skill tags
  const [statusFilter, setStatusFilter] = useState('');   // Active / Inactive / ''

  // ── Dialog state ──────────────────────────────────────────
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editDialog, setEditDialog]     = useState(false);
  const [editForm, setEditForm]         = useState({});
  const [timeOffDialog, setTimeOffDialog] = useState(false);
  const [timeOffForm, setTimeOffForm]   = useState({ startDate: '', endDate: '', reason: '' });
  const [approveTarget, setApproveTarget] = useState(null);
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch ─────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    if (!isAdminOrRecep) return;
    try {
      const res = await axiosInstance.get('/staff');
      setStaff(res.data.data || []);
    } catch {
      setSnack({ open: true, message: 'Failed to load staff', severity: 'error' });
    }
  }, [isAdminOrRecep]);

  const fetchTimeOffs = useCallback(async () => {
    try {
      const url = isBarber ? '/staff/my-time-off' : '/staff/time-off';
      const res = await axiosInstance.get(url);
      setTimeOffs(res.data.data || []);
    } catch {
      setSnack({ open: true, message: 'Failed to load time offs', severity: 'error' });
    }
  }, [isBarber]);

  useEffect(() => {
    setLoading(true);
    const promises = [fetchTimeOffs()];
    if (isAdminOrRecep) {
      promises.push(fetchStaff());
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [fetchStaff, fetchTimeOffs, isAdminOrRecep]);

  // ── Client-side filtering (Week 7) ────────────────────────
  const filteredStaff = staff.filter(s => {
    const matchName   = !nameFilter || s.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchSkill  = skillFilter.length === 0 ||
                        skillFilter.every(sk => s.specializations?.includes(sk));
    const matchStatus = !statusFilter ||
                        (statusFilter === 'Active' ? s.isActive : !s.isActive);
    return matchName && matchSkill && matchStatus;
  });

  const toggleSkill = (sk) => {
    setSkillFilter(prev =>
      prev.includes(sk) ? prev.filter(s => s !== sk) : [...prev, sk]
    );
  };

  const clearFilters = () => {
    setNameFilter(''); setSkillFilter([]); setStatusFilter('');
  };

  const hasFilters = nameFilter || skillFilter.length > 0 || statusFilter;

  // ── CRUD ──────────────────────────────────────────────────
  const handleViewDetail = async (s) => {
    try {
      const res = await axiosInstance.get(`/staff/${s._id}`);
      setSelectedStaff(res.data.data);
      setDetailDialog(true);
    } catch { setSnack({ open: true, message: 'Failed to load details', severity: 'error' }); }
  };

  const handleEdit = (s) => {
    setEditForm({
      name: s.name, phone: s.phone || '',
      specializations: s.specializations?.join(', ') || '',
      experience: s.experience || 0,
      workingHours: s.workingHours || { start: '09:00', end: '18:00' },
      workingDays: s.workingDays || [],
      commissionRate: s.commissionRate || 0, isActive: s.isActive,
    });
    setSelectedStaff(s);
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        ...editForm,
        specializations: editForm.specializations.split(',').map(s => s.trim()).filter(Boolean),
        experience: Number(editForm.experience),
        commissionRate: Number(editForm.commissionRate),
      };
      await axiosInstance.put(`/staff/${selectedStaff._id}`, payload);
      setSnack({ open: true, message: 'Staff updated', severity: 'success' });
      setEditDialog(false);
      fetchStaff();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await axiosInstance.delete(`/staff/${id}`);
      setSnack({ open: true, message: 'Staff deleted', severity: 'success' });
      fetchStaff();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  const handleRequestTimeOff = async () => {
    try {
      await axiosInstance.post('/staff/time-off', timeOffForm);
      setSnack({ open: true, message: 'Time off requested', severity: 'success' });
      setTimeOffDialog(false);
      setTimeOffForm({ startDate: '', endDate: '', reason: '' });
      fetchTimeOffs();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed', severity: 'error' });
    }
  };

  const handleApproveTimeOff = async (target, status) => {
    try {
      await axiosInstance.put(`/staff/time-off/${target._id}`, { status });
      setSnack({ open: true, message: `Time off ${status.toLowerCase()}`, severity: 'success' });
      fetchTimeOffs();
    } catch {
      setSnack({ open: true, message: 'Failed to update', severity: 'error' });
    }
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>
          {isBarber ? 'My Time Off' : 'Staff Management'}
        </Typography>
        {isBarber && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setTimeOffDialog(true)}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Request Time Off
          </Button>
        )}
      </Box>

      {isAdminOrRecep && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          mb: 3,
          '& .MuiTab-root':     { textTransform: 'none', color: LIGHT_BROWN },
          '& .Mui-selected':    { color: BROWN, fontWeight: 700 },
          '& .MuiTabs-indicator': { bgcolor: BROWN },
        }}>
          <Tab label="Personnel Directory" />
          <Tab label="Time Off Records" />
        </Tabs>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 0 — Personnel Directory (Admin/Receptionist)
      ════════════════════════════════════════════════════ */}
      {isAdminOrRecep && tab === 0 && (
        <>
          {/* ── Week 7: Filter Panel ──────────────────────── */}
          <Paper sx={{ p: 2.5, mb: 3, border: `1px solid ${BORDER}`, boxShadow: 'none', borderRadius: 2, bgcolor: '#fffaf7' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterList sx={{ color: LIGHT_BROWN, fontSize: 18 }} />
              <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.88rem' }}>
                Filter Stylists
              </Typography>
              {hasFilters && (
                <Button size="small" startIcon={<Clear sx={{ fontSize: 14 }} />} onClick={clearFilters}
                  sx={{ ml: 'auto', color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.78rem' }}>
                  Clear all
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
              {/* Name search */}
              <TextField size="small" placeholder="Search by name…" value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

              {/* Status filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Skill tag pills — Week 7 requirement */}
            <Box>
              <Typography variant="caption" sx={{ color: LIGHT_BROWN, mb: 1, display: 'block' }}>
                Filter by skill tag (select multiple):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {ALL_SKILLS.map(sk => {
                  const active = skillFilter.includes(sk);
                  return (
                    <Chip
                      key={sk}
                      label={sk}
                      onClick={() => toggleSkill(sk)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: active ? BROWN : `${BROWN}12`,
                        color: active ? '#fff' : BROWN,
                        border: `1px solid ${active ? BROWN : `${BROWN}44`}`,
                        fontWeight: active ? 600 : 400,
                        fontSize: '0.75rem',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: active ? '#4e2e13' : `${BROWN}22` },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {skillFilter.length > 0 && (
              <Typography variant="caption" sx={{ color: LIGHT_BROWN, mt: 1, display: 'block' }}>
                Showing stylists with ALL of: {skillFilter.join(', ')}
              </Typography>
            )}
          </Paper>

          {/* Results count */}
          <Typography variant="body2" sx={{ color: LIGHT_BROWN, mb: 2 }}>
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} found
          </Typography>

          {/* ── Personnel Table — Week 7 detailed rows ─────── */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: BG }}>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Skill Sets</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Active Work Hours</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Working Days</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Exp.</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', color: LIGHT_BROWN, py: 4 }}>
                      No staff match the selected filters
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.map(s => (
                  <TableRow key={s._id} hover>
                    {/* Employee name + avatar */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: `${BROWN}22`, color: BROWN, fontSize: '0.85rem', fontWeight: 700 }}>
                          {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.88rem' }}>{s.name}</Typography>
                          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{s.phone || s.email || ''}</Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Skill sets — chip tags (Week 7) */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      {s.specializations?.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                          {s.specializations.map(sk => (
                            <Chip key={sk} label={sk} size="small"
                              sx={{
                                bgcolor: skillFilter.includes(sk) ? `${BROWN}22` : `${BROWN}10`,
                                color: BROWN, fontSize: '0.65rem', height: 20,
                                fontWeight: skillFilter.includes(sk) ? 700 : 400,
                                border: skillFilter.includes(sk) ? `1px solid ${BROWN}55` : '1px solid transparent',
                              }} />
                          ))}
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>—</Typography>}
                    </TableCell>

                    {/* Active work hours (Week 7) */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <AccessTime sx={{ color: LIGHT_BROWN, fontSize: 16 }} />
                        <Typography sx={{ fontSize: '0.85rem', color: '#3b1f0a' }}>
                          {s.workingHours?.start || '—'} – {s.workingHours?.end || '—'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Working days (Week 7 schedule) */}
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                        {s.workingDays?.length > 0
                          ? s.workingDays.map(d => (
                            <Chip key={d} label={DAY_SHORT[d] || d.slice(0, 3)} size="small"
                              sx={{ fontSize: '0.62rem', height: 18, bgcolor: `${BROWN}10`, color: BROWN }} />
                          ))
                          : <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>—</Typography>
                        }
                      </Box>
                    </TableCell>

                    {/* Experience */}
                    <TableCell>
                      <Tooltip title={`${s.experience || 0} years experience`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ color: '#b07d3a', fontSize: 14 }} />
                          <Typography sx={{ fontSize: '0.85rem' }}>{s.experience || 0}y</Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip label={s.isActive ? 'Active' : 'Inactive'} size="small"
                        color={s.isActive ? 'success' : 'default'} variant="outlined"
                        sx={{ fontSize: '0.7rem' }} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Tooltip title="View biography sheet"><span>
                        <IconButton size="small" onClick={() => handleViewDetail(s)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </span></Tooltip>
                      {isAdminOrRecep && (
                        <>
                          <Tooltip title="Edit"><span>
                            <IconButton size="small" onClick={() => handleEdit(s)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </span></Tooltip>
                          <Tooltip title="Delete"><span>
                            <IconButton size="small" onClick={() => handleDelete(s._id)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </span></Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 1 — Time Off Records (scheduled time-off)
      ════════════════════════════════════════════════════ */}
      {(isBarber || tab === 1) && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: BG }}>
                <TableCell sx={{ fontWeight: 600 }}>Barber</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                {isAdminOrRecep && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeOffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdminOrRecep ? 6 : 5} sx={{ textAlign: 'center', color: LIGHT_BROWN, py: 4 }}>
                    No time off records found
                  </TableCell>
                </TableRow>
              ) : timeOffs.map(t => (
                <TableRow key={t._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{t.barber?.name || 'You'}</TableCell>
                  <TableCell>{t.startDate}</TableCell>
                  <TableCell>{t.endDate}</TableCell>
                  <TableCell sx={{ color: LIGHT_BROWN }}>{t.reason || '—'}</TableCell>
                  <TableCell>
                    <Chip label={t.status} size="small"
                      color={t.status === 'Approved' ? 'success' : t.status === 'Rejected' ? 'error' : 'warning'}
                      variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  {isAdminOrRecep && (
                    <TableCell>
                      {t.status === 'Pending' ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" color="success" onClick={() => handleApproveTimeOff(t, 'Approved')}
                            sx={{ textTransform: 'none', fontSize: '0.78rem' }}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleApproveTimeOff(t, 'Rejected')}
                            sx={{ textTransform: 'none', fontSize: '0.78rem' }}>Reject</Button>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>—</Typography>}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Biography Sheet Dialog (Week 7) ─────────────── */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Work />  Employee Biography Sheet
        </DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Box sx={{ mt: 1 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: `${BROWN}22`, color: BROWN, fontWeight: 700, fontSize: '1.1rem' }}>
                  {selectedStaff.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#3b1f0a' }}>{selectedStaff.name}</Typography>
                  <Chip label={selectedStaff.role} size="small"
                    sx={{ bgcolor: `${BROWN}18`, color: BROWN, fontWeight: 600, fontSize: '0.7rem' }} />
                </Box>
              </Box>

              <Divider sx={{ borderColor: BORDER, mb: 2 }} />

              {/* Skill sets */}
              <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.85rem', mb: 1 }}>Skill Sets</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2.5 }}>
                {selectedStaff.specializations?.length > 0
                  ? selectedStaff.specializations.map(sk => (
                    <Chip key={sk} label={sk} size="small"
                      sx={{ bgcolor: `${BROWN}15`, color: BROWN, fontSize: '0.72rem' }} />
                  ))
                  : <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>No specializations listed</Typography>
                }
              </Box>

              {/* Bio */}
              {selectedStaff.bio && (
                <>
                  <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.85rem', mb: 0.5 }}>Bio</Typography>
                  <Typography variant="body2" sx={{ color: LIGHT_BROWN, mb: 2.5, lineHeight: 1.6 }}>
                    {selectedStaff.bio}
                  </Typography>
                </>
              )}

              {/* Details grid */}
              {[
                ['Email',          selectedStaff.email],
                ['Phone',          selectedStaff.phone || '—'],
                ['Experience',     `${selectedStaff.experience || 0} years`],
                ['Commission',     `${selectedStaff.commissionRate || 0}%`],
                ['Work Hours',     `${selectedStaff.workingHours?.start || '—'} – ${selectedStaff.workingHours?.end || '—'}`],
                ['Working Days',   selectedStaff.workingDays?.join(', ') || '—'],
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${BORDER}` }}>
                  <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#3b1f0a' }}>{val}</Typography>
                </Box>
              ))}

              {/* Stats */}
              {selectedStaff.stats && (
                <Box sx={{ mt: 2, p: 2, bgcolor: BG, borderRadius: 2, display: 'flex', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '1.3rem' }}>
                      {selectedStaff.stats.completedAppointments}
                    </Typography>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Completed</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: '#4e7c59', fontSize: '1.3rem' }}>
                      {selectedStaff.stats.upcomingAppointments}
                    </Typography>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Upcoming</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)} sx={{ color: LIGHT_BROWN }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ──────────────────────────────────── */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Edit Staff</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
            <TextField label="Phone" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} fullWidth />
            <TextField label="Specializations (comma separated)" value={editForm.specializations || ''} onChange={(e) => setEditForm({ ...editForm, specializations: e.target.value })} fullWidth />
            <TextField label="Experience (years)" type="number" value={editForm.experience || 0} onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })} fullWidth />
            <TextField label="Commission Rate (%)" type="number" value={editForm.commissionRate || 0} onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Start Time" type="time" value={editForm.workingHours?.start || '09:00'}
                onChange={(e) => setEditForm({ ...editForm, workingHours: { ...editForm.workingHours, start: e.target.value } })}
                InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
              <TextField label="End Time" type="time" value={editForm.workingHours?.end || '18:00'}
                onChange={(e) => setEditForm({ ...editForm, workingHours: { ...editForm.workingHours, end: e.target.value } })}
                InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={editForm.isActive ? 'true' : 'false'} label="Status"
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained"
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── Time Off Request Dialog ──────────────────────── */}
      <Dialog open={timeOffDialog} onClose={() => setTimeOffDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Request Time Off</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField type="date" label="Start Date" value={timeOffForm.startDate}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }} fullWidth />
            <TextField type="date" label="End Date" value={timeOffForm.endDate}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Reason" value={timeOffForm.reason}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
              multiline rows={2} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeOffDialog(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleRequestTimeOff} variant="contained"
            disabled={!timeOffForm.startDate || !timeOffForm.endDate}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Staff;
