import { useState, useEffect, memo } from 'react';
import axiosInstance from '../utils/axios';
import {
  Box, Typography, Grid, Card, CardContent, Paper,
  CircularProgress, Chip, Tab, Tabs,
} from '@mui/material';
import {
  PeopleAlt, ContentCut, CalendarToday, AttachMoney, TrendingUp,
} from '@mui/icons-material';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts';

const BROWN       = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER      = '#e2cfc4';
const BG          = '#f5ede6';

// ── Reusable stat card ────────────────────────────────────────
const StatCard = memo(function StatCard({ icon, label, value, color }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b1f0a', lineHeight: 1.2 }}>{value ?? '—'}</Typography>
          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

// ── Chart panel wrapper ───────────────────────────────────────
function ChartPanel({ title, subtitle, children, height = 300 }) {
  return (
    <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.92rem' }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ p: 2, width: '100%', height, boxSizing: 'border-box' }}>
        {children}
      </Box>
    </Paper>
  );
}

// ── Custom tooltip for Recharts ───────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 2, p: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
      <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.82rem', mb: 0.5 }}>{label}</Typography>
      {payload.map((entry, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{entry.name}:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b1f0a' }}>
            {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('revenue')
              ? `$${entry.value.toFixed(0)}`
              : entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function Analytics() {
  const [overview, setOverview]         = useState(null);
  const [revenue, setRevenue]           = useState(null);
  const [userGrowth, setUserGrowth]     = useState(null);
  const [servicePop, setServicePop]     = useState([]);
  const [staffPerf, setStaffPerf]       = useState([]);
  const [monthlyAppts, setMonthlyAppts] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ovRes, revRes, ugRes, spRes, spfRes, maRes] = await Promise.allSettled([
          axiosInstance.get('/analytics/overview'),
          axiosInstance.get('/analytics/revenue'),
          axiosInstance.get('/analytics/user-growth'),
          axiosInstance.get('/analytics/service-popularity'),
          axiosInstance.get('/analytics/staff-performance'),
          axiosInstance.get('/analytics/monthly-appointments'),
        ]);

        if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data.data);
        if (revRes.status === 'fulfilled') setRevenue(revRes.value.data.data);
        if (ugRes.status === 'fulfilled') setUserGrowth(ugRes.value.data.data);
        if (spRes.status === 'fulfilled') {
          const raw = spRes.value.data.data;
          setServicePop(Array.isArray(raw?.serviceStats) ? raw.serviceStats : Array.isArray(raw) ? raw : []);
        }
        if (spfRes.status === 'fulfilled') {
          setStaffPerf(Array.isArray(spfRes.value.data.data) ? spfRes.value.data.data : []);
        }
        if (maRes.status === 'fulfilled') {
          setMonthlyAppts(Array.isArray(maRes.value.data.data) ? maRes.value.data.data : []);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <CircularProgress sx={{ color: BROWN }} />
      <Typography sx={{ mt: 2, color: LIGHT_BROWN }}>Loading analytics…</Typography>
    </Box>
  );

  // ── Transform API data for Recharts ────────────────────────
  // Revenue area chart data
  const revenueChartData = (revenue?.monthlyData || []).map(m => ({
    month: m.month,
    'Appointment Revenue': m.appointmentRevenue || 0,
    'Order Revenue':       m.orderRevenue       || 0,
    'Total Revenue':       m.totalRevenue       || 0,
  }));

  // User growth line chart data
  const userGrowthData = (userGrowth?.monthlyData || []).map(m => ({
    month: m.month,
    Customers: m.customers || 0,
    Barbers:   m.barbers   || 0,
    Total:     m.total     || 0,
  }));

  // Monthly appointments bar data
  const apptChartData = (monthlyAppts || []).map(m => ({
    month:     m.month     || 'Unknown',
    Total:     m.total     || 0,
    Completed: m.completed || 0,
    Cancelled: m.cancelled || 0,
    Pending:   m.pending   || 0,
  }));

  // Staff performance multi-axis bar chart (Week 11)
  const staffChartData = (Array.isArray(staffPerf) ? staffPerf : []).slice(0, 8).map(s => ({
    name:         s.barberName?.split(' ')[0] || s._id?.name?.split(' ')[0] || 'Staff',
    'Completed':  s.completedAppointments || 0,
    'Revenue ($)': Math.round(s.totalRevenue || 0),
    'Commission Rate (%)': s.commissionRate || 0,
  }));

  // Service popularity horizontal bar
  const safeServiceList = Array.isArray(servicePop) ? servicePop : [];
  const serviceData = safeServiceList.slice(0, 8).map(s => ({
    name:     s.serviceName || s._id?.name || 'Unknown',
    Bookings: s.bookings || s.count || 0,
    Revenue:  Math.round(s.totalRevenue || 0),
  }));

  const axisStyle = { fontSize: 11, fill: LIGHT_BROWN };

  return (
    <Box>
      <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a', mb: 3 }}>
        Analytics Dashboard
      </Typography>

      {/* ── Overview stat cards ─────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <PeopleAlt />,    label: 'Total Customers',       value: overview?.totalCustomers,                      color: BROWN },
          { icon: <ContentCut />,   label: 'Staff Members',         value: overview?.totalStaff,                          color: '#4e7c59' },
          { icon: <CalendarToday />,label: "Today's Appointments",  value: overview?.todayAppointments,                   color: '#3a6186' },
          { icon: <TrendingUp />,   label: 'Total Appointments',    value: overview?.totalAppointments,                   color: '#7c4e7c' },
          { icon: <AttachMoney />,  label: 'Total Revenue',         value: `$${overview?.totalRevenue?.toFixed(0) || 0}`, color: '#2e7d6e' },
          { icon: <CalendarToday />,label: 'Pending',               value: overview?.pendingAppointments,                 color: '#b07d3a' },
        ].map(({ icon, label, value, color }) => (
          <Grid item xs={12} sm={6} md={4} key={label}>
            <StatCard icon={icon} label={label} value={value} color={color} />
          </Grid>
        ))}
      </Grid>

      {/* ── Chart tabs ──────────────────────────────────────── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 3,
        '& .MuiTab-root':      { textTransform: 'none', color: LIGHT_BROWN, fontSize: '0.88rem' },
        '& .Mui-selected':     { color: BROWN, fontWeight: 700 },
        '& .MuiTabs-indicator':{ bgcolor: BROWN },
      }}>
        <Tab label="Revenue & Sales" />
        <Tab label="User Growth" />
        <Tab label="Appointments" />
        <Tab label="Staff Performance" />
        <Tab label="Services" />
      </Tabs>

      {/* ════════════════════════════════════════════════════════
          TAB 0 — Revenue & Sales (Area chart — Week 11)
      ════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ChartPanel title="Monthly Revenue — Sales Over Time" subtitle={`Year ${revenue?.year || new Date().getFullYear()}`} height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BROWN}    stopOpacity={0.25} />
                      <stop offset="95%" stopColor={BROWN}    stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-appt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4e7c59" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4e7c59" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-order" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3a6186" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3a6186" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" tick={axisStyle} />
                  <YAxis tick={axisStyle} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Total Revenue"       stroke={BROWN}    fill="url(#grad-total)" strokeWidth={2.5} dot={{ r: 3, fill: BROWN }} />
                  <Area type="monotone" dataKey="Appointment Revenue" stroke="#4e7c59" fill="url(#grad-appt)"  strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="Order Revenue"       stroke="#3a6186" fill="url(#grad-order)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>
          </Grid>

          {/* Conversion trend line */}
          <Grid item xs={12} md={6}>
            <ChartPanel title="Customer Conversion Trend" subtitle="New customers registered per month" height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" tick={axisStyle} />
                  <YAxis tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Customers" stroke={BROWN}    strokeWidth={2.5} dot={{ r: 4, fill: BROWN }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Barbers"   stroke="#4e7c59" strokeWidth={2}   dot={{ r: 3, fill: '#4e7c59' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </Grid>

          {/* Revenue summary table */}
          <Grid item xs={12} md={6}>
            <ChartPanel title="Revenue Ledger" subtitle="Monthly breakdown" height={260}>
              <Box sx={{ overflowY: 'auto', height: '100%', pr: 1 }}>
                {(revenue?.monthlyData || []).map((m, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.9, borderBottom: `1px solid ${BORDER}` }}>
                    <Typography sx={{ fontSize: '0.83rem', color: '#3b1f0a', fontWeight: 500 }}>{m.month}</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: LIGHT_BROWN }}>Appts: ${m.appointmentRevenue?.toFixed(0) || 0}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BROWN }}>Total: ${m.totalRevenue?.toFixed(0) || 0}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </ChartPanel>
          </Grid>
        </Grid>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 1 — User Growth (Line chart)
      ════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ChartPanel title="User Population Growth" subtitle="Monthly registrations by role" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" tick={axisStyle} />
                  <YAxis tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Total"     stroke={BROWN}    strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="Customers" stroke="#3a6186" strokeWidth={2}   dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Barbers"   stroke="#4e7c59" strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="5 2" />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: BROWN }}>{userGrowth?.totalUsers || 0}</Typography>
              <Typography sx={{ color: LIGHT_BROWN, fontSize: '0.88rem' }}>Total Users</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#3a6186' }}>{userGrowth?.totalCustomers || 0}</Typography>
              <Typography sx={{ color: LIGHT_BROWN, fontSize: '0.88rem' }}>Customers</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#4e7c59' }}>{(userGrowth?.totalUsers || 0) - (userGrowth?.totalCustomers || 0)}</Typography>
              <Typography sx={{ color: LIGHT_BROWN, fontSize: '0.88rem' }}>Staff</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 2 — Appointments (Bar chart)
      ════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <ChartPanel title="Monthly Appointment Volume" subtitle="Completed / Cancelled / Pending breakdown" height={360}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={apptChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Completed" fill="#4e7c59" radius={[3, 3, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Pending"   fill="#b07d3a" radius={[3, 3, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Cancelled" fill="#b03a3a" radius={[3, 3, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 3 — Staff Performance multi-axis bar chart (Week 11)
      ════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ChartPanel
              title="Employee Performance — Multi-axis Bar Chart"
              subtitle="Completed appointments (left axis) vs Revenue generated (right axis)"
              height={360}>
              {staffChartData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography sx={{ color: LIGHT_BROWN }}>No staff performance data for the current period</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={staffChartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} />
                    <YAxis yAxisId="left"  tick={axisStyle} />
                    <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left"  dataKey="Completed"  fill={BROWN}    radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar yAxisId="right" dataKey="Revenue ($)" fill="#3a6186" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </Grid>

          {/* Staff performance summary cards */}
          {(Array.isArray(staffPerf) ? staffPerf : []).slice(0, 4).map((s, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
                <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.9rem', mb: 1 }}>
                  {s.barberName || s._id?.name || 'Staff'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Completed</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: BROWN }}>{s.completedAppointments || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Revenue</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#3a6186' }}>${(s.totalRevenue || 0).toFixed(0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Commission</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#4e7c59' }}>{s.commissionRate || 0}%</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 4 — Service Popularity (Horizontal bar)
      ════════════════════════════════════════════════════════ */}
      {tab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <ChartPanel title="Service Popularity by Bookings" subtitle="Top services" height={340}>
              {serviceData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography sx={{ color: LIGHT_BROWN }}>No service booking data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceData} layout="vertical" margin={{ top: 0, right: 24, left: 70, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                    <XAxis type="number" tick={axisStyle} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#3b1f0a' }} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Bookings" fill={BROWN}    radius={[0, 4, 4, 0]} maxBarSize={22} />
                    <Bar dataKey="Revenue"  fill="#4e7c59" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.92rem' }}>Service Ledger</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {serviceData.length === 0 ? (
                  <Typography sx={{ color: LIGHT_BROWN, py: 2, textAlign: 'center' }}>No services found</Typography>
                ) : (
                  serviceData.map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.9, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: BROWN }}>#{i + 1}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', color: '#3b1f0a' }}>{s.name}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BROWN }}>{s.Bookings} bookings</Typography>
                        <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>${s.Revenue} revenue</Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Analytics;
