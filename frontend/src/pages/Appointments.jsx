import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, TablePagination, CircularProgress, Alert, Snackbar, Tooltip, Card,
  CardContent, Grid,
} from '@mui/material';
import {
  Add, Visibility, Cancel as CancelIcon, Replay,
  CalendarToday, PendingActions, CheckCircleOutlined, PeopleAlt,
} from '@mui/icons-material';

const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER = '#e2cfc4';
const BG = '#f5ede6';

const statusColors = {
  Pending: '#b07d3a', Confirmed: '#4e7c59',
  'In Progress': '#7c4e7c', Completed: '#3a6186', Cancelled: '#b03a3a',
};
const statuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

// Stat card used in the master grid header
function StatCard({ icon, label, value, color }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', flex: '1 1 130px' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#3b1f0a', lineHeight: 1.1 }}>{value}</Typography>
          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminOrRecep = ['Admin', 'Receptionist'].includes(user?.role);
  const isBarber       = user?.role === 'Barber';
  const isCustomer     = user?.role === 'Customer';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(0);
  const [total, setTotal]               = useState(0);
  const rowsPerPage                     = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter]     = useState('');
  const [barberFilter, setBarberFilter] = useState('');
  const [barbers, setBarbers]           = useState([]);

  // Inline status update (Week 8 core)
  const [inlineUpdating, setInlineUpdating] = useState(null); // appointment._id being updated

  // Dialogs
  const [selected, setSelected]         = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reschedDialog, setReschedDialog] = useState(false);
  const [reschedDate, setReschedDate]   = useState('');
  const [reschedSlot, setReschedSlot]   = useState('');
  const [slots, setSlots]               = useState([]);
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch barbers for filter dropdown ─────────────────────
  useEffect(() => {
    if (isAdminOrRecep) {
      axiosInstance.get('/users/barbers').then(r => setBarbers(r.data.data || [])).catch(() => {});
    }
  }, [isAdminOrRecep]);

  // ── Fetch appointments ─────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/appointments';
      const params = { page: page + 1, limit: rowsPerPage };
      if (isBarber)   url = '/appointments/barber';
      else if (isCustomer) url = '/appointments/my';
      if (statusFilter) params.status = statusFilter;
      if (dateFilter)   params.date   = dateFilter;
      if (barberFilter && isAdminOrRecep) params.barber = barberFilter;

      const res = await axiosInstance.get(url, { params });
      setAppointments(res.data.data || []);
      setTotal(res.data.pagination?.total || res.data.data?.length || 0);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, dateFilter, barberFilter, isBarber, isCustomer, isAdminOrRecep]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Quick inline status update (Week 8) ───────────────────
  const handleQuickStatus = async (apptId, status) => {
    setInlineUpdating(apptId);
    try {
      await axiosInstance.put(`/appointments/${apptId}/status`, { status });
      setSnack({ open: true, message: `Status → ${status}`, severity: 'success' });
      fetchAppointments();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed', severity: 'error' });
    } finally {
      setInlineUpdating(null);
    }
  };

  // ── Cancel ────────────────────────────────────────────────
  const handleCancel = async () => {
    try {
      await axiosInstance.put(`/appointments/${selected._id}/cancel`, { reason: cancelReason });
      setSnack({ open: true, message: 'Appointment cancelled', severity: 'success' });
      setCancelDialog(false);
      fetchAppointments();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed', severity: 'error' });
    }
  };

  // ── Reschedule ────────────────────────────────────────────
  const handleReschedule = async () => {
    try {
      await axiosInstance.put(`/appointments/${selected._id}/reschedule`, { date: reschedDate, timeSlot: reschedSlot });
      setSnack({ open: true, message: 'Appointment rescheduled', severity: 'success' });
      setReschedDialog(false);
      fetchAppointments();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed', severity: 'error' });
    }
  };

  const fetchSlots = async (barberId, date) => {
    if (!barberId || !date) return;
    try {
      const res = await axiosInstance.get('/appointments/available-slots', { params: { barberId, date } });
      setSlots(res.data.data || []);
    } catch { setSlots([]); }
  };

  // ── Summary stats for master grid ─────────────────────────
  const pending    = appointments.filter(a => a.status === 'Pending').length;
  const confirmed  = appointments.filter(a => a.status === 'Confirmed').length;
  const completed  = appointments.filter(a => a.status === 'Completed').length;

  return (
    <Box>
      {/* ── Page header ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>
          Appointment Administration
        </Typography>
        {isCustomer && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/appointments/book')}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Book Appointment
          </Button>
        )}
      </Box>

      {/* ── Week 8: Reservation summary stat cards ────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <StatCard icon={<CalendarToday fontSize="small" />}    label="Total Loaded"  value={appointments.length} color={BROWN} />
        <StatCard icon={<PendingActions fontSize="small" />}   label="Pending"       value={pending}             color="#b07d3a" />
        <StatCard icon={<PeopleAlt fontSize="small" />}        label="Confirmed"     value={confirmed}           color="#4e7c59" />
        <StatCard icon={<CheckCircleOutlined fontSize="small" />} label="Completed"  value={completed}           color="#3a6186" />
      </Box>

      {/* ── Filters ───────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, border: `1px solid ${BORDER}`, boxShadow: 'none', borderRadius: 2, bgcolor: '#fffaf7' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map(s => <MenuItem key={s} value={s}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors[s] }} />
                  {s}
                </Box>
              </MenuItem>)}
            </Select>
          </FormControl>

          {/* Date filter */}
          <TextField size="small" type="date" label="Date" value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

          {/* Barber filter — Admin/Receptionist only */}
          {isAdminOrRecep && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Barber</InputLabel>
              <Select value={barberFilter} label="Barber" onChange={(e) => { setBarberFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Barbers</MenuItem>
                {barbers.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          {/* Clear */}
          {(statusFilter || dateFilter || barberFilter) && (
            <Button size="small" onClick={() => { setStatusFilter(''); setDateFilter(''); setBarberFilter(''); setPage(0); }}
              sx={{ color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.8rem' }}>
              Clear filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* ── Reservation Master Grid (Week 8) ─────────────── */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: BG }}>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Barber</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              {/* Quick status adjustment column — Week 8 deliverable */}
              <TableCell sx={{ fontWeight: 600 }}>
                Status
                {isAdminOrRecep && (
                  <Typography component="span" variant="caption" sx={{ color: LIGHT_BROWN, ml: 0.5, fontWeight: 400 }}>
                    (click to change)
                  </Typography>
                )}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress sx={{ color: BROWN }} /></TableCell></TableRow>
            ) : appointments.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: LIGHT_BROWN }}>No appointments found</TableCell></TableRow>
            ) : appointments.map(a => {
              const sc = statusColors[a.status] || '#888';
              const canChangeStatus = (isAdminOrRecep || isBarber) && a.status !== 'Cancelled' && a.status !== 'Completed';

              return (
                <TableRow key={a._id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#3b1f0a' }}>{a.customer?.name || 'N/A'}</Typography>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{a.customer?.phone || ''}</Typography>
                  </TableCell>
                  <TableCell>{a.barber?.name || (isBarber ? user?.name : 'N/A')}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.88rem' }}>{a.service?.name || 'N/A'}</Typography>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{a.service?.duration} min</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.date}</Typography>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{a.timeSlot}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BROWN }}>${a.totalAmount}</TableCell>

                  {/* ── Inline quick-status dropdown (Week 8) ── */}
                  <TableCell>
                    {canChangeStatus ? (
                      <Select
                        size="small"
                        value={a.status}
                        disabled={inlineUpdating === a._id}
                        onChange={(e) => handleQuickStatus(a._id, e.target.value)}
                        sx={{
                          fontSize: '0.78rem', fontWeight: 600,
                          color: sc, borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: `${sc}55` },
                          '& .MuiSelect-icon': { color: sc },
                          minWidth: 130,
                        }}
                        renderValue={(val) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            {inlineUpdating === a._id
                              ? <CircularProgress size={12} sx={{ color: sc }} />
                              : <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: sc, flexShrink: 0 }} />
                            }
                            {val}
                          </Box>
                        )}
                      >
                        {statuses.map(s => (
                          <MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors[s] }} />
                              {s}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Chip label={a.status} size="small"
                        sx={{ bgcolor: `${sc}18`, color: sc, fontWeight: 600, fontSize: '0.72rem' }} />
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Tooltip title="View details"><span>
                      <IconButton size="small" onClick={() => { setSelected(a); setDetailDialog(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </span></Tooltip>
                    {(isCustomer || isAdminOrRecep) && a.status !== 'Cancelled' && a.status !== 'Completed' && (
                      <>
                        <Tooltip title="Cancel"><span>
                          <IconButton size="small" onClick={() => { setSelected(a); setCancelReason(''); setCancelDialog(true); }}>
                            <CancelIcon fontSize="small" color="error" />
                          </IconButton>
                        </span></Tooltip>
                        <Tooltip title="Reschedule"><span>
                          <IconButton size="small" onClick={() => { setSelected(a); setReschedDate(''); setReschedSlot(''); setSlots([]); setReschedDialog(true); }}>
                            <Replay fontSize="small" />
                          </IconButton>
                        </span></Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {isAdminOrRecep && (
          <TablePagination component="div" count={total} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={() => {}} />
        )}
      </TableContainer>

      {/* ── Detail Dialog ─────────────────────────────────── */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Appointment Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              {[
                ['Customer',  `${selected.customer?.name} (${selected.customer?.email})`],
                ['Barber',    selected.barber?.name],
                ['Service',   `${selected.service?.name} — $${selected.totalAmount}`],
                ['Date',      `${selected.date} at ${selected.timeSlot}`],
                ['Duration',  `${selected.service?.duration} min`],
                ['Status',    selected.status],
              ].map(([l, v]) => (
                <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: `1px solid ${BORDER}` }}>
                  <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>{l}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
                </Box>
              ))}
              {selected.notes && <Typography variant="body2"><strong>Notes:</strong> {selected.notes}</Typography>}
              {selected.cancellationReason && <Typography variant="body2" sx={{ color: '#b03a3a' }}><strong>Cancellation:</strong> {selected.cancellationReason}</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)} sx={{ color: LIGHT_BROWN }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel Dialog ─────────────────────────────────── */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Cancel Appointment</DialogTitle>
        <DialogContent>
          <TextField label="Reason (optional)" value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)} multiline rows={2} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)} sx={{ color: LIGHT_BROWN }}>Back</Button>
          <Button onClick={handleCancel} variant="contained" color="error" sx={{ textTransform: 'none' }}>
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reschedule Dialog ─────────────────────────────── */}
      <Dialog open={reschedDialog} onClose={() => setReschedDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField type="date" label="New Date" value={reschedDate}
              onChange={(e) => { setReschedDate(e.target.value); if (selected?.barber?._id) fetchSlots(selected.barber._id, e.target.value); }}
              InputLabelProps={{ shrink: true }} fullWidth />
            <FormControl fullWidth disabled={!reschedDate}>
              <InputLabel>Time Slot</InputLabel>
              <Select value={reschedSlot} label="Time Slot" onChange={(e) => setReschedSlot(e.target.value)}>
                {slots.filter(s => s.available).map(s => <MenuItem key={s.time} value={s.time}>{s.time}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReschedDialog(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleReschedule} variant="contained" disabled={!reschedDate || !reschedSlot}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Appointments;
