import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import {
  Box, Typography, Button, TextField, Paper, Avatar, Chip, Divider,
  CircularProgress, Alert, Snackbar, Grid, Card, CardContent,
} from '@mui/material';
import {
  Save, Lock, CalendarToday, CheckCircleOutlined,
  AttachMoney, EventNote, ArrowForward,
} from '@mui/icons-material';

const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER = '#e2cfc4';
const BG = '#f5ede6';

const roleColor = { Admin: '#6b3f1f', Barber: '#4e7c59', Receptionist: '#3a6186', Customer: '#b07d3a' };

// ── Stat card for customer metrics ───────────────────────────
function MetricCard({ icon, label, value, sub, color }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2, flexShrink: 0,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b1f0a', lineHeight: 1.2 }}>{value}</Typography>
          <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.85rem' }}>{label}</Typography>
          {sub && <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{sub}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Appointment row in booking history ───────────────────────
function AppointmentRow({ appt }) {
  const statusColor = {
    Confirmed: '#4e7c59', Pending: '#b07d3a', Completed: '#3a6186',
    Cancelled: '#b03a3a', 'In Progress': '#7c4e7c',
  }[appt.status] || '#888';

  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
      flexWrap: 'wrap', gap: 1,
    }}>
      <Box>
        <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.9rem' }}>
          {appt.service?.name || 'Service'}
        </Typography>
        <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
          {appt.barber?.name && `with ${appt.barber.name} · `}{appt.date}{appt.timeSlot && ` at ${appt.timeSlot}`}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '0.88rem' }}>${appt.totalAmount}</Typography>
        <Chip label={appt.status} size="small" sx={{
          background: `${statusColor}18`, color: statusColor,
          border: `1px solid ${statusColor}44`, fontSize: '0.68rem', height: 22, fontWeight: 600,
        }} />
      </Box>
    </Box>
  );
}

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rc = roleColor[user?.role] || BROWN;

  // ── Profile form state ────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [saving, setSaving]         = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [snack, setSnack]           = useState({ open: false, message: '', severity: 'success' });

  // ── Customer dashboard data ───────────────────────────────
  const isCustomer = user?.role === 'Customer';
  const [dashData, setDashData]     = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  useEffect(() => {
    if (!isCustomer) return;
    setDashLoading(true);
    axiosInstance.get('/dashboard/customer')
      .then(r => setDashData(r.data.data))
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, [isCustomer]);

  // ── Save profile ──────────────────────────────────────────
  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.put('/auth/profile', profileForm);
      if (res.data.success) {
        const updated = { ...user, ...profileForm };
        localStorage.setItem('user', JSON.stringify(updated));
        setSnack({ open: true, message: 'Profile updated successfully', severity: 'success' });
      }
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnack({ open: true, message: 'Passwords do not match', severity: 'error' }); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setSnack({ open: true, message: 'Password must be at least 6 characters', severity: 'error' }); return;
    }
    setChangingPwd(true);
    try {
      await axiosInstance.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSnack({ open: true, message: 'Password changed successfully', severity: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Password change failed', severity: 'error' });
    } finally {
      setChangingPwd(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Box>
      <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a', mb: 3 }}>
        My Profile
      </Typography>

      {/* ═══════════════════════════════════════════════════
          WEEK 6 — Customer metric blocks (only for Customer)
      ═══════════════════════════════════════════════════ */}
      {isCustomer && (
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.95rem', mb: 2 }}>
            Your Booking Overview
          </Typography>

          {dashLoading ? (
            <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: BROWN }} /></Box>
          ) : (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  icon={<CalendarToday fontSize="small" />}
                  label="Upcoming Appointments"
                  value={dashData?.upcomingAppointments?.length ?? 0}
                  sub="Scheduled services"
                  color={BROWN}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  icon={<CheckCircleOutlined fontSize="small" />}
                  label="Completed Sessions"
                  value={dashData?.totalAppointments ?? 0}
                  sub="All time"
                  color="#4e7c59"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  icon={<AttachMoney fontSize="small" />}
                  label="Total Spent"
                  value={`$${dashData?.totalSpent?.toFixed(0) ?? 0}`}
                  sub="Across all visits"
                  color="#3a6186"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  icon={<EventNote fontSize="small" />}
                  label="Favourite Services"
                  value={dashData?.favoriteServices?.length ?? 0}
                  sub="Most booked"
                  color="#b07d3a"
                />
              </Grid>
            </Grid>
          )}

          {/* Upcoming appointments — real-time statuses */}
          {dashData?.upcomingAppointments?.length > 0 && (
            <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', mb: 3 }}>
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.9rem' }}>
                  Upcoming Appointments
                </Typography>
                <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/appointments')}
                  sx={{ color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.78rem' }}>
                  View all
                </Button>
              </Box>
              <Box sx={{ px: 3, py: 1 }}>
                {dashData.upcomingAppointments.map(a => <AppointmentRow key={a._id} appt={a} />)}
              </Box>
            </Paper>
          )}

          {/* Booking history log */}
          {dashData?.pastAppointments?.length > 0 && (
            <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', mb: 3 }}>
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.9rem' }}>
                  Booking History
                </Typography>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                  Summary log of your past visits
                </Typography>
              </Box>
              <Box sx={{ px: 3, py: 1 }}>
                {dashData.pastAppointments.slice(0, 5).map(a => <AppointmentRow key={a._id} appt={a} />)}
              </Box>
            </Paper>
          )}

          <Divider sx={{ borderColor: BORDER, mb: 4 }} />
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════
          WEEK 6 — Profile update form (hooks into API)
      ═══════════════════════════════════════════════════ */}
      <Grid container spacing={3}>

        {/* Left: Profile info form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', p: 3 }}>

            {/* Avatar + name header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 54, height: 54, bgcolor: rc, fontSize: '1.15rem', fontWeight: 700 }}>
                {initials}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#3b1f0a' }}>{user?.name}</Typography>
                <Chip label={user?.role} size="small"
                  sx={{ bgcolor: `${rc}18`, color: rc, fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
              </Box>
            </Box>

            <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.88rem', mb: 2 }}>
              Account Information
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Name — editable, hits PUT /auth/profile */}
              <TextField
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                fullWidth
                sx={fieldStyles}
              />
              {/* Email — read-only from backend, never editable */}
              <TextField
                label="Email Address"
                value={user?.email || ''}
                disabled
                fullWidth
                helperText="Email cannot be changed"
                sx={{ '& .MuiInputBase-root': { bgcolor: '#fafafa' } }}
              />
              {/* Phone — editable */}
              <TextField
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                fullWidth
                sx={fieldStyles}
              />
              {/* Bio — only for Barbers */}
              {user?.role === 'Barber' && (
                <TextField
                  label="Bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  multiline rows={3} fullWidth
                  sx={fieldStyles}
                />
              )}
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save />}
                onClick={handleProfileUpdate}
                disabled={saving}
                sx={{
                  mt: 1, alignSelf: 'flex-start', bgcolor: BROWN,
                  '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none', px: 3,
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right: Change password form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Lock sx={{ color: LIGHT_BROWN, fontSize: 20 }} />
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#3b1f0a' }}>Change Password</Typography>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                  Hooks into PUT /auth/change-password
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                fullWidth sx={fieldStyles}
              />
              <TextField
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                helperText="Minimum 6 characters"
                fullWidth sx={fieldStyles}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                error={passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword}
                helperText={
                  passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword
                    ? 'Passwords do not match' : ''
                }
                fullWidth sx={fieldStyles}
              />
              <Button
                variant="contained"
                startIcon={changingPwd ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Lock />}
                onClick={handlePasswordChange}
                disabled={changingPwd || !passwordForm.currentPassword || !passwordForm.newPassword}
                sx={{
                  mt: 1, alignSelf: 'flex-start', bgcolor: BROWN,
                  '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none', px: 3,
                }}
              >
                {changingPwd ? 'Updating…' : 'Change Password'}
              </Button>
            </Box>
          </Paper>

          {/* Account info card */}
          <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', p: 3, mt: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#3b1f0a', mb: 2 }}>
              Account Details
            </Typography>
            {[
              ['User ID',  user?.id],
              ['Role',     user?.role],
              ['Email',    user?.email],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' } }}>
                <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#3b1f0a', fontFamily: label === 'User ID' ? 'monospace' : 'inherit', fontSize: label === 'User ID' ? '0.78rem' : 'inherit' }}>
                  {val}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#d9c4b5' },
    '&:hover fieldset': { borderColor: '#a0785a' },
    '&.Mui-focused fieldset': { borderColor: '#6b3f1f' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6b3f1f' },
};

export default Profile;
