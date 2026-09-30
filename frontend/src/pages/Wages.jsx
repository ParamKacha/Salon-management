import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Snackbar,
  Tab, Tabs, Card, CardContent, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Tooltip,
} from '@mui/material';
import { AttachMoney, ContentCut, TrendingUp, Add, CheckCircle } from '@mui/icons-material';

const BROWN       = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER      = '#e2cfc4';
const BG          = '#f5ede6';

function StatCard({ icon, label, value, color }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', flex: '1 1 150px' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a', lineHeight: 1.2 }}>{value ?? '—'}</Typography>
          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function Wages() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'Admin';
  const isBarber = user?.role === 'Barber';

  const [tab, setTab]                       = useState(0);
  const [wages, setWages]                   = useState([]);
  const [completedAppts, setCompletedAppts] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [page, setPage]                     = useState(0);
  const [total, setTotal]                   = useState(0);

  // Admin Create / Pay Out Wage Dialog
  const [createDialog, setCreateDialog]     = useState(false);
  const [barbers, setBarbers]               = useState([]);
  const [services, setServices]             = useState([]);
  const [form, setForm]                     = useState({
    barber: '', service: '', appointment: '', date: new Date().toISOString().split('T')[0],
    serviceAmount: '', tips: 0,
  });
  const [saving, setSaving]                 = useState(false);
  const [snack, setSnack]                   = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isBarber) {
        const [earningsRes, monthlyRes, apptsRes] = await Promise.allSettled([
          axiosInstance.get('/wages/my-earnings'),
          axiosInstance.get('/wages/monthly-summary'),
          axiosInstance.get('/appointments/barber', { params: { status: 'Completed' } }),
        ]);
        if (earningsRes.status === 'fulfilled') {
          setWages(earningsRes.value.data.data || []);
        }
        if (monthlyRes.status === 'fulfilled') {
          setMonthlySummary(monthlyRes.value.data.data || []);
        }
        if (apptsRes.status === 'fulfilled') {
          setCompletedAppts(apptsRes.value.data.data || []);
        }
      } else if (isAdmin) {
        const [wagesRes, monthlyRes, barbersRes, servicesRes, apptsRes] = await Promise.allSettled([
          axiosInstance.get('/wages', { params: { page: page + 1, limit: 100 } }),
          axiosInstance.get('/wages/monthly-summary'),
          axiosInstance.get('/users/barbers'),
          axiosInstance.get('/services'),
          axiosInstance.get('/appointments', { params: { status: 'Completed', limit: 100 } }),
        ]);
        if (wagesRes.status === 'fulfilled') {
          setWages(wagesRes.value.data.data || []);
          setTotal(wagesRes.value.data.pagination?.total || 0);
        }
        if (monthlyRes.status === 'fulfilled') {
          setMonthlySummary(monthlyRes.value.data.data || []);
        }
        if (barbersRes.status === 'fulfilled') {
          setBarbers(barbersRes.value.data.data || []);
        }
        if (servicesRes.status === 'fulfilled') {
          setServices(servicesRes.value.data.data || []);
        }
        if (apptsRes.status === 'fulfilled') {
          setCompletedAppts(apptsRes.value.data.data || []);
        }
      }
    } catch (err) {
      setSnack({ open: true, message: 'Failed to load wage data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isBarber, isAdmin, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const defaultCommissionRate = user?.commissionRate || 30;

  // ── Auto-merge Completed Appointments into Wages ───────────
  const mergedWages = useMemo(() => {
    // 1. Check which appointments are already logged in wages
    const unrecordedAppts = completedAppts.filter((appt) => {
      return !wages.some((w) => {
        if (w.appointment && String(w.appointment) === String(appt._id)) return true;
        const sameDate = w.date === appt.date;
        const sameService = w.service?._id && appt.service?._id && String(w.service._id) === String(appt.service._id);
        const sameBarber = !w.barber?._id || !appt.barber?._id || String(w.barber._id) === String(appt.barber._id);
        return sameDate && sameService && sameBarber;
      });
    });

    // 2. Convert unrecorded completed appointments into wage entries
    const virtualWages = unrecordedAppts.map((appt) => {
      const commRate = appt.barber?.commissionRate || defaultCommissionRate;
      const amt = Number(appt.totalAmount || appt.service?.price || 0);
      const earned = (amt * commRate) / 100;
      return {
        _id: `auto-${appt._id}`,
        isAutoGenerated: true,
        appointmentObj: appt,
        barber: appt.barber || { name: user?.name, commissionRate: commRate },
        service: appt.service || { name: 'Service', price: amt },
        date: appt.date,
        serviceAmount: amt,
        commissionRate: commRate,
        commissionEarned: earned,
        tips: 0,
        totalEarning: earned,
        status: 'Pending',
      };
    });

    // 3. Combine and sort by date descending (newest first)
    const combined = [...wages, ...virtualWages];
    return combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [wages, completedAppts, defaultCommissionRate, user?.name]);

  // Derived totals
  const totalEarnings = mergedWages.reduce((s, w) => s + (Number(w.totalEarning) || 0), 0);
  const totalCommission = mergedWages.reduce((s, w) => s + (Number(w.commissionEarned) || 0), 0);
  const totalPaid = mergedWages.filter(w => w.status === 'Paid').reduce((s, w) => s + (Number(w.totalEarning) || 0), 0);
  const totalServices = mergedWages.length;

  // ── Quick Admin Pay Out for unrecorded appointment ─────────
  const handleAdminPayOutAppointment = async (item) => {
    setSaving(true);
    try {
      const appt = item.appointmentObj;
      const barberId = appt.barber?._id || appt.barber || item.barber?._id;
      const serviceId = appt.service?._id || appt.service || item.service?._id;

      const res = await axiosInstance.post('/wages', {
        barber: barberId,
        appointment: appt._id,
        service: serviceId,
        date: appt.date,
        serviceAmount: Number(appt.totalAmount || appt.service?.price || 0),
        tips: 0,
      });

      // Mark status as Paid
      if (res.data?.data?._id) {
        await axiosInstance.put(`/wages/${res.data.data._id}/status`, { status: 'Paid' });
      }

      setSnack({ open: true, message: 'Wage recorded and marked as Paid!', severity: 'success' });
      fetchData();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to record wage', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (wageId, newStatus) => {
    try {
      await axiosInstance.put(`/wages/${wageId}/status`, { status: newStatus });
      setSnack({ open: true, message: `Status updated to ${newStatus}`, severity: 'success' });
      fetchData();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' });
    }
  };

  const handleCreateWage = async () => {
    if (!form.barber || !form.service || !form.serviceAmount) {
      setSnack({ open: true, message: 'Please fill in required fields', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.post('/wages', {
        ...form,
        serviceAmount: Number(form.serviceAmount),
        tips: Number(form.tips || 0),
      });
      // Optionally mark paid
      if (res.data?.data?._id) {
        await axiosInstance.put(`/wages/${res.data.data._id}/status`, { status: 'Paid' });
      }
      setSnack({ open: true, message: 'Wage recorded and marked Paid!', severity: 'success' });
      setCreateDialog(false);
      setForm({ barber: '', service: '', appointment: '', date: new Date().toISOString().split('T')[0], serviceAmount: '', tips: 0 });
      fetchData();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to create wage', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  return (
    <Box>
      {/* ── Page Header ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>
          {isBarber ? 'My Earnings & Commission' : 'Wages & Payroll Management'}
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Record Wage Payout
          </Button>
        )}
      </Box>

      {/* ── Live Metric Cards ────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <StatCard icon={<AttachMoney />} label="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} color="#3a6186" />
        <StatCard icon={<TrendingUp />} label="Total Commission" value={`$${totalCommission.toFixed(2)}`} color="#4e7c59" />
        <StatCard icon={<CheckCircle />} label="Paid Out" value={`$${totalPaid.toFixed(2)}`} color="#2e7d6e" />
        <StatCard icon={<ContentCut />} label="Services Done" value={totalServices} color={BROWN} />
      </Box>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 2,
        '& .MuiTab-root':      { textTransform: 'none', color: LIGHT_BROWN },
        '& .Mui-selected':     { color: BROWN, fontWeight: 700 },
        '& .MuiTabs-indicator':{ bgcolor: BROWN },
      }}>
        <Tab label={`All Earnings & Wages (${mergedWages.length})`} />
        <Tab label="Monthly Summary" />
      </Tabs>

      {/* ══════════════════════════════════════════════════════
          TAB 0 — Live Merged Wages & Completed Appointments
      ══════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: BG }}>
                {isAdmin && <TableCell sx={{ fontWeight: 600 }}>Barber</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Service Amt</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Commission</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tips</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Payout</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {mergedWages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 9} align="center" sx={{ py: 4, color: LIGHT_BROWN }}>
                    No wage or completed appointment records found
                  </TableCell>
                </TableRow>
              ) : mergedWages.map((w) => (
                <TableRow key={w._id} hover sx={{ bgcolor: w.isAutoGenerated ? '#fffdfa' : 'inherit' }}>
                  {isAdmin && (
                    <TableCell sx={{ fontWeight: 600 }}>
                      {w.barber?.name || 'N/A'}
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 500 }}>
                    {w.service?.name || 'Service'}
                    {w.isAutoGenerated && (
                      <Chip label="Live Appointment" size="small"
                        sx={{ ml: 1, fontSize: '0.62rem', height: 18, bgcolor: `${BROWN}12`, color: BROWN }} />
                    )}
                  </TableCell>
                  <TableCell>{w.date}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>${Number(w.serviceAmount).toFixed(2)}</TableCell>
                  <TableCell>{w.commissionRate}%</TableCell>
                  <TableCell sx={{ color: '#4e7c59', fontWeight: 700 }}>
                    ${Number(w.commissionEarned).toFixed(2)}
                  </TableCell>
                  <TableCell>${Number(w.tips || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BROWN }}>
                    ${Number(w.totalEarning).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip label={w.status} size="small"
                      color={w.status === 'Paid' ? 'success' : w.status === 'Hold' ? 'error' : 'warning'}
                      variant={w.status === 'Paid' ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.72rem', fontWeight: 600 }} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {w.isAutoGenerated ? (
                        <Button size="small" variant="contained" onClick={() => handleAdminPayOutAppointment(w)}
                          disabled={saving}
                          sx={{ bgcolor: '#4e7c59', '&:hover': { bgcolor: '#385c40' }, textTransform: 'none', fontSize: '0.72rem', py: 0.3, px: 1 }}>
                          Mark Paid
                        </Button>
                      ) : (
                        <Select size="small" value={w.status} onChange={(e) => handleStatusChange(w._id, e.target.value)}
                          sx={{ fontSize: '0.75rem', height: 26 }}>
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Paid">Paid</MenuItem>
                          <MenuItem value="Hold">Hold</MenuItem>
                        </Select>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ p: 2, bgcolor: '#fffaf7', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.9rem' }}>
              Total Earnings from {mergedWages.length} Services:
            </Typography>
            <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '1.05rem' }}>
              ${totalEarnings.toFixed(2)}
            </Typography>
          </Box>
        </TableContainer>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 1 — Monthly Summary
      ══════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: BG }}>
                <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Service Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Commission</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Earnings</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Services</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlySummary.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: LIGHT_BROWN }}>No summary data available</TableCell></TableRow>
              ) : monthlySummary.map((m, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{months[(m._id?.month || 1) - 1]} {m._id?.year || ''}</TableCell>
                  <TableCell>${(m.totalServiceAmount || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ color: '#4e7c59', fontWeight: 600 }}>${(m.totalCommission || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BROWN }}>${(m.totalEarnings || 0).toFixed(2)}</TableCell>
                  <TableCell>{m.totalServices || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {monthlySummary.length > 0 && (
            <Box sx={{ p: 2, bgcolor: '#fffaf7', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700, color: '#3b1f0a' }}>All-Time Recorded Payouts Total: </Typography>
              <Typography sx={{ fontWeight: 700, color: BROWN }}>
                ${monthlySummary.reduce((s, m) => s + (m.totalEarnings || 0), 0).toFixed(2)}
              </Typography>
            </Box>
          )}
        </TableContainer>
      )}

      {/* ── Admin Create Wage Dialog ──────────────────────── */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Record Wage Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Barber</InputLabel>
              <Select value={form.barber} label="Barber" onChange={(e) => setForm({ ...form, barber: e.target.value })}>
                {barbers.map(b => <MenuItem key={b._id} value={b._id}>{b.name} ({b.commissionRate || 30}%)</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select value={form.service} label="Service" onChange={(e) => {
                const s = services.find(x => x._id === e.target.value);
                setForm({ ...form, service: e.target.value, serviceAmount: s?.price || form.serviceAmount });
              }}>
                {services.map(s => <MenuItem key={s._id} value={s._id}>{s.name} (${s.price})</MenuItem>)}
              </Select>
            </FormControl>

            <TextField size="small" type="date" label="Date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />

            <TextField size="small" type="number" label="Service Amount ($)" value={form.serviceAmount}
              onChange={(e) => setForm({ ...form, serviceAmount: e.target.value })} fullWidth />

            <TextField size="small" type="number" label="Tips ($)" value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleCreateWage} variant="contained" disabled={saving}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Record & Pay Out'}
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

export default Wages;
