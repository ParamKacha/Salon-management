import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, TablePagination, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';

const roleColors = { Admin: '#6b3f1f', Barber: '#4e7c59', Receptionist: '#3a6186', Customer: '#b07d3a' };

const emptyUser = { name: '', email: '', password: '', role: 'Customer', phone: '', isActive: true };

function Users() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await axiosInstance.get('/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to load users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleOpenDialog = (user = null) => {
    setEditingUser(user);
    setForm(user ? { name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '', isActive: user.isActive } : emptyUser);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { ...form };
        delete payload.password;
        await axiosInstance.put(`/users/${editingUser._id}`, payload);
        setSnack({ open: true, message: 'User updated', severity: 'success' });
      } else {
        await axiosInstance.post('/auth/register', form);
        setSnack({ open: true, message: 'User created successfully', severity: 'success' });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Operation failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      setSnack({ open: true, message: 'User deleted', severity: 'success' });
      fetchUsers();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>Users</Typography>
        {authUser?.role === 'Admin' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Add User
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} label="Role" onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {['Admin', 'Barber', 'Receptionist', 'Customer'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2cfc4', boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5ede6' }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              {authUser?.role === 'Admin' && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: LIGHT_BROWN }}>No users found</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u._id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.role} size="small"
                    sx={{ bgcolor: `${roleColors[u.role] || '#888'}18`, color: roleColors[u.role] || '#888', fontWeight: 600, fontSize: '0.72rem' }} />
                </TableCell>
                <TableCell>{u.phone || '—'}</TableCell>
                <TableCell>
                  <Chip label={u.isActive ? 'Active' : 'Inactive'} size="small"
                    color={u.isActive ? 'success' : 'default'} variant="outlined" sx={{ fontSize: '0.72rem' }} />
                </TableCell>
                {authUser?.role === 'Admin' && (
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(u)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(u._id)} color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 20, 50, 100]} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
            {!editingUser && (
              <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required fullWidth helperText="Min 6 characters" />
            )}
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {['Customer', 'Barber', 'Receptionist', 'Admin'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.isActive ? 'true' : 'false'} label="Status" onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Users;
