import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, CircularProgress, Alert, Snackbar, Grid, Card, CardContent, Divider,
} from '@mui/material';
import { Edit, Delete, Add, FilterList, Sort } from '@mui/icons-material';

const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BG = '#f5ede6';
const BORDER = '#e2cfc4';

const CATEGORIES = ['Haircut', 'Beard Styling', 'Hair Coloring', 'Facial', 'Spa', 'Massage', 'Manicure', 'Pedicure', 'Other'];
const EMPTY = { name: '', description: '', category: 'Haircut', price: '', duration: 30, isActive: true };

// Duration filter options → maps to minDuration/maxDuration params
const DURATION_OPTIONS = [
  { label: 'Any Duration', min: '', max: '' },
  { label: 'Under 30 min',  min: '',  max: '29' },
  { label: '30 – 60 min',   min: '30', max: '60' },
  { label: '60+ min',       min: '61', max: '' },
];

// Sort options applied client-side on fetched data
const SORT_OPTIONS = [
  { label: 'Default',           fn: () => 0 },
  { label: 'Price: Low → High', fn: (a, b) => a.price - b.price },
  { label: 'Price: High → Low', fn: (a, b) => b.price - a.price },
  { label: 'Duration: Short → Long', fn: (a, b) => a.duration - b.duration },
  { label: 'Duration: Long → Short', fn: (a, b) => b.duration - a.duration },
];

function Services() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // ── Fetch state ────────────────────────────────────────────
  const [services, setServices]         = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── Filter state ───────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [durationIdx, setDurationIdx]   = useState(0);  // index into DURATION_OPTIONS
  const [sortIdx, setSortIdx]           = useState(0);  // index into SORT_OPTIONS

  // ── View / dialog state ────────────────────────────────────
  const [viewMode, setViewMode]         = useState('card');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch from backend with active filters ─────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const dur = DURATION_OPTIONS[durationIdx];
      const params = {};
      if (search)        params.search      = search;
      if (categoryFilter) params.category   = categoryFilter;
      if (minPrice)      params.minPrice    = minPrice;
      if (maxPrice)      params.maxPrice    = maxPrice;
      if (dur.min)       params.minDuration = dur.min;
      if (dur.max)       params.maxDuration = dur.max;

      const res = await axiosInstance.get('/services', { params });
      setServices(res.data.data);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to load services', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, minPrice, maxPrice, durationIdx]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Sort the fetched list client-side ──────────────────────
  const sorted = [...services].sort(SORT_OPTIONS[sortIdx].fn);

  // ── Group sorted list by category ─────────────────────────
  const grouped = sorted.reduce((acc, svc) => {
    const key = svc.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(svc);
    return acc;
  }, {});

  // ── CRUD handlers ──────────────────────────────────────────
  const handleOpenDialog = (svc = null) => {
    setEditing(svc);
    setForm(svc ? { ...svc } : EMPTY);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), duration: Number(form.duration) };
      if (editing) {
        await axiosInstance.put(`/services/${editing._id}`, payload);
        setSnack({ open: true, message: 'Service updated', severity: 'success' });
      } else {
        await axiosInstance.post('/services', payload);
        setSnack({ open: true, message: 'Service created', severity: 'success' });
      }
      setDialogOpen(false);
      fetchServices();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Operation failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await axiosInstance.delete(`/services/${id}`);
      setSnack({ open: true, message: 'Service deleted', severity: 'success' });
      fetchServices();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  // ── Single service card ────────────────────────────────────
  const ServiceCard = ({ svc }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{
        borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none',
        '&:hover': { borderColor: BROWN, boxShadow: '0 2px 12px rgba(107,63,31,0.1)' },
        transition: 'all 0.2s',
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.95rem', flex: 1, pr: 1 }}>
              {svc.name}
            </Typography>
            <Chip label={`${svc.duration} min`} size="small"
              sx={{ bgcolor: `${BROWN}10`, color: LIGHT_BROWN, fontSize: '0.68rem', fontWeight: 600 }} />
          </Box>
          {svc.description && (
            <Typography variant="body2" sx={{ color: LIGHT_BROWN, mb: 1.5, fontSize: '0.82rem', lineHeight: 1.4 }}>
              {svc.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '1.1rem' }}>
              ${svc.price}
            </Typography>
            <Chip
              label={svc.isActive ? 'Active' : 'Inactive'}
              size="small"
              color={svc.isActive ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontSize: '0.68rem', height: 20 }}
            />
          </Box>
          {isAdmin && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <IconButton size="small" onClick={() => handleOpenDialog(svc)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(svc._id)} color="error"><Delete fontSize="small" /></IconButton>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  // ── Grouped cards view ─────────────────────────────────────
  const renderGroupedCards = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.keys(grouped).length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: LIGHT_BROWN, py: 4 }}>No services found</Typography>
      ) : (
        Object.entries(grouped).map(([category, svcs]) => (
          <Box key={category}>
            {/* Category heading */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '1rem' }}>
                {category}
              </Typography>
              <Chip label={`${svcs.length} service${svcs.length > 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: `${BROWN}15`, color: BROWN, fontSize: '0.7rem', fontWeight: 600 }} />
              <Box sx={{ flex: 1, height: '1px', bgcolor: BORDER }} />
            </Box>
            <Grid container spacing={2}>
              {svcs.map((svc) => <ServiceCard key={svc._id} svc={svc} />)}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );

  // ── Table view ─────────────────────────────────────────────
  const renderTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: BG }}>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            {isAdmin && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} sx={{ textAlign: 'center', color: LIGHT_BROWN, py: 4 }}>
                No services found
              </TableCell>
            </TableRow>
          ) : sorted.map((svc) => (
            <TableRow key={svc._id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{svc.name}</TableCell>
              <TableCell>
                <Chip label={svc.category} size="small"
                  sx={{ bgcolor: `${BROWN}18`, color: BROWN, fontSize: '0.7rem' }} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: BROWN }}>${svc.price}</TableCell>
              <TableCell>{svc.duration} min</TableCell>
              <TableCell>
                <Chip label={svc.isActive ? 'Active' : 'Inactive'} size="small"
                  color={svc.isActive ? 'success' : 'default'} variant="outlined" />
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(svc)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(svc._id)} color="error"><Delete fontSize="small" /></IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* ── Page header ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>Services</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* View toggle */}
          <Button size="small" onClick={() => setViewMode('card')}
            variant={viewMode === 'card' ? 'contained' : 'outlined'}
            sx={{ textTransform: 'none', borderColor: BROWN, color: viewMode === 'card' ? '#fff' : BROWN, bgcolor: viewMode === 'card' ? BROWN : 'transparent', '&:hover': { bgcolor: viewMode === 'card' ? '#4e2e13' : `${BROWN}10` } }}>
            Cards
          </Button>
          <Button size="small" onClick={() => setViewMode('table')}
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            sx={{ textTransform: 'none', borderColor: BROWN, color: viewMode === 'table' ? '#fff' : BROWN, bgcolor: viewMode === 'table' ? BROWN : 'transparent', '&:hover': { bgcolor: viewMode === 'table' ? '#4e2e13' : `${BROWN}10` } }}>
            Table
          </Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
              sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
              Add Service
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Filters row ─────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, border: `1px solid ${BORDER}`, boxShadow: 'none', borderRadius: 2, bgcolor: '#fffaf7' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FilterList sx={{ color: LIGHT_BROWN, fontSize: 18 }} />
          <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.88rem' }}>Filters</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <TextField size="small" placeholder="Search services…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

          {/* Category */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Min price */}
          <TextField size="small" label="Min Price ($)" type="number" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            inputProps={{ min: 0 }} />

          {/* Max price */}
          <TextField size="small" label="Max Price ($)" type="number" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            inputProps={{ min: 0 }} />

          {/* Duration */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Duration</InputLabel>
            <Select value={durationIdx} label="Duration" onChange={(e) => setDurationIdx(e.target.value)}>
              {DURATION_OPTIONS.map((opt, i) => <MenuItem key={i} value={i}>{opt.label}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortIdx} label="Sort By" onChange={(e) => setSortIdx(e.target.value)}>
              {SORT_OPTIONS.map((opt, i) => <MenuItem key={i} value={i}>{opt.label}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Clear filters */}
          {(search || categoryFilter || minPrice || maxPrice || durationIdx !== 0 || sortIdx !== 0) && (
            <Button size="small" onClick={() => { setSearch(''); setCategoryFilter(''); setMinPrice(''); setMaxPrice(''); setDurationIdx(0); setSortIdx(0); }}
              sx={{ color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.8rem' }}>
              Clear all
            </Button>
          )}
        </Box>

        {/* Active filter summary */}
        {(minPrice || maxPrice || durationIdx !== 0) && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(minPrice || maxPrice) && (
              <Chip size="small" label={`Price: ${minPrice || '0'} – ${maxPrice || '∞'}`}
                onDelete={() => { setMinPrice(''); setMaxPrice(''); }}
                sx={{ bgcolor: `${BROWN}15`, color: BROWN, fontSize: '0.72rem' }} />
            )}
            {durationIdx !== 0 && (
              <Chip size="small" label={DURATION_OPTIONS[durationIdx].label}
                onDelete={() => setDurationIdx(0)}
                sx={{ bgcolor: `${BROWN}15`, color: BROWN, fontSize: '0.72rem' }} />
            )}
          </Box>
        )}
      </Paper>

      {/* ── Results count ────────────────────────────────── */}
      {!loading && (
        <Typography variant="body2" sx={{ color: LIGHT_BROWN, mb: 2 }}>
          {sorted.length} service{sorted.length !== 1 ? 's' : ''} found
          {categoryFilter && ` in ${categoryFilter}`}
        </Typography>
      )}

      {/* ── Content ──────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>
      ) : viewMode === 'card' ? renderGroupedCards() : renderTable()}

      {/* ── Add/Edit Dialog ──────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Price ($)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required fullWidth />
            <TextField label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required fullWidth />
            {editing && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.isActive ? 'true' : 'false'} label="Status" onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editing ? 'Update' : 'Create'}
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

export default Services;
