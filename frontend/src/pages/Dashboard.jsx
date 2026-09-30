import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import {
  Box,
  Button,
  Typography,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ContentCut,
  CalendarToday,
  CheckCircleOutlined,
  PeopleAlt,
  AttachMoney,
  PendingActions,
  ArrowForward,
  TimerOff,
  EventNote,
} from '@mui/icons-material';

const BROWN       = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const WHITE       = '#ffffff';
const BORDER      = '#e2cfc4';
const BG          = '#f5ede6';

const roleColors = {
  Admin: '#6b3f1f',
  Barber: '#4e7c59',
  Receptionist: '#3a6186',
  Customer: '#b07d3a',
};

function StatCard({ icon, label, value, color }) {
  return (
    <Box
      sx={{
        flex: '1 1 160px',
        minWidth: 0,
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b1f0a', lineHeight: 1.2 }}>
          {value ?? '—'}
        </Typography>
        <Typography variant="caption" sx={{ color: LIGHT_BROWN, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function AppointmentRow({ appt }) {
  const statusColors = {
    Confirmed: '#4e7c59',
    Pending: '#b07d3a',
    Completed: '#3a6186',
    Cancelled: '#b03a3a',
    'In Progress': '#7c4e7c',
  };
  const color = statusColors[appt.status] || '#888';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: `1px solid ${BORDER}`,
        '&:last-child': { borderBottom: 'none' },
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#3b1f0a' }}>
          {appt.service?.name || 'Service'}
        </Typography>
        <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
          {appt.customer?.name ? `Customer: ${appt.customer.name}` : appt.barber?.name ? `With ${appt.barber.name}` : ''}
          {appt.date && ` · ${appt.date}`}
          {appt.timeSlot && ` at ${appt.timeSlot}`}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '0.9rem' }}>
          ${appt.totalAmount}
        </Typography>
        <Chip
          label={appt.status}
          size="small"
          sx={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}44`,
            fontSize: '0.7rem',
            height: 22,
            fontWeight: 600,
          }}
        />
      </Box>
    </Box>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <Box
      sx={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: LIGHT_BROWN, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ px: 3, py: 1 }}>{children}</Box>
    </Box>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/analytics/overview')
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <StatCard icon={<PeopleAlt fontSize="small" />}          label="Total Customers"    value={stats?.totalCustomers}                      color={BROWN} />
        <StatCard icon={<ContentCut fontSize="small" />}         label="Staff Members"      value={stats?.totalStaff}                          color="#4e7c59" />
        <StatCard icon={<CalendarToday fontSize="small" />}      label="Today's Appts"      value={stats?.todayAppointments}                   color="#3a6186" />
        <StatCard icon={<PendingActions fontSize="small" />}     label="Pending Appts"      value={stats?.pendingAppointments}                 color="#b07d3a" />
        <StatCard icon={<CheckCircleOutlined fontSize="small" />} label="Total Appts"       value={stats?.totalAppointments}                   color="#7c4e7c" />
        <StatCard icon={<AttachMoney fontSize="small" />}        label="Total Revenue"      value={`$${stats?.totalRevenue?.toFixed(0) || 0}`} color="#2e7d6e" />
      </Box>

      {/* Quick shortcuts */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('/appointments')} sx={{ textTransform: 'none', color: BROWN, borderColor: BROWN }}>
          Manage Appointments
        </Button>
        <Button variant="outlined" onClick={() => navigate('/staff')} sx={{ textTransform: 'none', color: BROWN, borderColor: BROWN }}>
          Manage Staff
        </Button>
        <Button variant="outlined" onClick={() => navigate('/analytics')} sx={{ textTransform: 'none', color: BROWN, borderColor: BROWN }}>
          View Analytics
        </Button>
      </Box>
    </Box>
  );
}

// ── BARBER ────────────────────────────────────────────────────
function BarberDashboard() {
  const [data, setData] = useState(null);
  const [allAppts, setAllAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      axiosInstance.get('/dashboard/barber'),
      axiosInstance.get('/appointments/barber'),
    ]).then(([dashRes, apptRes]) => {
      if (dashRes.status === 'fulfilled') setData(dashRes.value.data.data);
      if (apptRes.status === 'fulfilled') setAllAppts(apptRes.value.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  const e = data?.monthlyEarnings;
  const recentAppts = allAppts.slice(0, 6);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 4 Stat Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <StatCard icon={<CalendarToday fontSize="small" />}       label="Today's Appts"       value={data?.todayAppointments?.length || 0}   color={BROWN} />
        <StatCard icon={<CheckCircleOutlined fontSize="small" />}  label="Total Completed"    value={data?.totalCompleted || 0}              color="#4e7c59" />
        <StatCard icon={<AttachMoney fontSize="small" />}         label="Monthly Earnings"    value={`$${e?.totalEarnings?.toFixed(0) || 0}`} color="#3a6186" />
        <StatCard icon={<ContentCut fontSize="small" />}          label="Commission Rate"     value={`${data?.commissionRate || 30}%`}        color="#b07d3a" />
      </Box>

      {/* Quick Action Navigation */}
      <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', bgcolor: '#fffaf7', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#3b1f0a', mr: 1 }}>
          Quick Links:
        </Typography>
        <Button size="small" variant="outlined" onClick={() => navigate('/appointments')}
          sx={{ textTransform: 'none', color: BROWN, borderColor: BROWN, fontSize: '0.8rem' }}>
          All My Appointments
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/wages')}
          sx={{ textTransform: 'none', color: BROWN, borderColor: BROWN, fontSize: '0.8rem' }}>
          My Earnings & Tips
        </Button>
        <Button size="small" variant="contained" startIcon={<TimerOff sx={{ fontSize: 16 }} />} onClick={() => navigate('/staff/time-off')}
          sx={{ textTransform: 'none', bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, fontSize: '0.8rem' }}>
          Request Time Off
        </Button>
      </Paper>

      {/* Today's Schedule */}
      <SectionCard
        title="Today's Schedule"
        action={
          <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} onClick={() => navigate('/appointments')}
            sx={{ color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.78rem' }}>
            View all
          </Button>
        }
      >
        {data?.todayAppointments?.length > 0 ? (
          data.todayAppointments.map((a) => <AppointmentRow key={a._id} appt={a} />)
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>
              No appointments scheduled for today — you're all clear!
            </Typography>
          </Box>
        )}
      </SectionCard>

      {/* Assigned / Recent Appointments */}
      <SectionCard
        title="Your Appointments"
        action={
          <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} onClick={() => navigate('/appointments')}
            sx={{ color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.78rem' }}>
            View all ({allAppts.length})
          </Button>
        }
      >
        {recentAppts.length > 0 ? (
          recentAppts.map((a) => <AppointmentRow key={a._id} appt={a} />)
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>
              No appointment records found yet.
            </Typography>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}

// ── RECEPTIONIST ──────────────────────────────────────────────
function ReceptionistDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/dashboard/receptionist')
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <StatCard icon={<CalendarToday fontSize="small" />}  label="Today's Appts"  value={data?.todayCount}               color={BROWN} />
        <StatCard icon={<PendingActions fontSize="small" />} label="Pending"         value={data?.pendingCount}             color="#b07d3a" />
        <StatCard icon={<PeopleAlt fontSize="small" />}      label="Active Barbers"  value={data?.availableBarbers?.length} color="#4e7c59" />
      </Box>

      {data?.todayAppointments?.length > 0 ? (
        <SectionCard title="Today's Appointments">
          {data.todayAppointments.map((a) => <AppointmentRow key={a._id} appt={a} />)}
        </SectionCard>
      ) : (
        <SectionCard title="Today's Appointments">
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>No appointments scheduled for today.</Typography>
          </Box>
        </SectionCard>
      )}

      {data?.pendingAppointments?.length > 0 && (
        <SectionCard title="Pending Approvals">
          {data.pendingAppointments.map((a) => <AppointmentRow key={a._id} appt={a} />)}
        </SectionCard>
      )}
    </Box>
  );
}

// ── CUSTOMER ──────────────────────────────────────────────────
function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/dashboard/customer')
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <StatCard icon={<CalendarToday fontSize="small" />}       label="Upcoming Appts"  value={data?.upcomingAppointments?.length || 0} color={BROWN} />
        <StatCard icon={<CheckCircleOutlined fontSize="small" />}  label="Completed"       value={data?.totalAppointments || 0}           color="#4e7c59" />
        <StatCard icon={<AttachMoney fontSize="small" />}          label="Total Spent"     value={`$${data?.totalSpent?.toFixed(0) || 0}`} color="#3a6186" />
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={() => navigate('/appointments/book')}
          sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
          Book New Appointment
        </Button>
        <Button variant="outlined" onClick={() => navigate('/products')}
          sx={{ color: BROWN, borderColor: BROWN, textTransform: 'none' }}>
          Visit Store
        </Button>
      </Box>

      {data?.upcomingAppointments?.length > 0 ? (
        <SectionCard title="Upcoming Appointments">
          {data.upcomingAppointments.map((a) => <AppointmentRow key={a._id} appt={a} />)}
        </SectionCard>
      ) : (
        <SectionCard title="Upcoming Appointments">
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>No upcoming appointments booked.</Typography>
          </Box>
        </SectionCard>
      )}

      {data?.pastAppointments?.length > 0 && (
        <SectionCard title="Past Appointments">
          {data.pastAppointments.slice(0, 5).map((a) => <AppointmentRow key={a._id} appt={a} />)}
        </SectionCard>
      )}
    </Box>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const roleColor = roleColors[user?.role] || BROWN;

  const renderDashboard = () => {
    switch (user?.role) {
      case 'Admin':        return <AdminDashboard />;
      case 'Barber':       return <BarberDashboard />;
      case 'Receptionist': return <ReceptionistDashboard />;
      case 'Customer':     return <CustomerDashboard />;
      default:             return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b1f0a' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip
            label={user?.role}
            size="small"
            sx={{
              background: `${roleColor}18`,
              color: roleColor,
              border: `1px solid ${roleColor}44`,
              fontSize: '0.72rem',
              height: 22,
              fontWeight: 600,
            }}
          />
          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: BORDER, mb: 3 }} />

      {renderDashboard()}
    </Box>
  );
}

export default Dashboard;
