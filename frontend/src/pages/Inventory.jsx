import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, CircularProgress, Alert, Snackbar, LinearProgress, Tooltip,
} from '@mui/material';
import { Edit, Delete, Add, Warning, WarningAmber, Inventory as InventoryIcon } from '@mui/icons-material';

const BROWN      = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER     = '#e2cfc4';
const BG         = '#f5ede6';
const LOW_RED    = '#b03a3a';
const LOW_BG     = '#fff5f5';
const LOW_BORDER = '#f5c6c6';

const invCategories = ['Shampoo', 'Hair Wax', 'Hair Color', 'Face Cream', 'Gel', 'Oil', 'Razor', 'Towel', 'Cape', 'Scissors', 'Other'];
const units         = ['pieces', 'bottles', 'tubes', 'packets', 'liters', 'kg'];

const emptyItem = {
  itemName: '', category: 'Shampoo', currentStock: 0, minimumStock: 10,
  unit: 'pieces', costPerUnit: 0,
  supplier: { name: '', contact: '', email: '' },
};

// ── Stock level progress bar ──────────────────────────────────
function StockBar({ current, minimum }) {
  const pct = minimum > 0 ? Math.min((current / (minimum * 2)) * 100, 100) : 100;
  const isLow = current <= minimum;
  return (
    <Box sx={{ minWidth: 80 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: isLow ? '#f5c6c6' : '#e2cfc4',
          '& .MuiLinearProgress-bar': {
            bgcolor: isLow ? LOW_RED : '#4e7c59',
            borderRadius: 3,
          },
        }}
      />
      <Typography variant="caption" sx={{ color: isLow ? LOW_RED : LIGHT_BROWN, fontWeight: isLow ? 700 : 400 }}>
        {current} / min {minimum}
      </Typography>
    </Box>
  );
}

function Inventory() {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyItem);
  const [restockDialog, setRestockDialog] = useState(false);
  const [restockItem, setRestockItem]   = useState(null);
  const [restockQty, setRestockQty]     = useState(1);
  const [saving, setSaving]             = useState(false);
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)        params.search    = search;
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockOnly)  params.isLowStock = 'true';
      const res = await axiosInstance.get('/inventory', { params });
      setItems(res.data.data);
    } catch {
      setSnack({ open: true, message: 'Failed to load inventory', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, lowStockOnly]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Derived: low-stock items ─────────────────────────────
  const lowStockItems = items.filter(i => i.isLowStock);
  const totalValue    = items.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);

  // ── CRUD ─────────────────────────────────────────────────
  const handleOpenDialog = (item = null) => {
    setEditing(item);
    setForm(item ? {
      itemName: item.itemName, category: item.category, currentStock: item.currentStock,
      minimumStock: item.minimumStock, unit: item.unit, costPerUnit: item.costPerUnit,
      supplier: item.supplier || { name: '', contact: '', email: '' },
    } : emptyItem);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, currentStock: Number(form.currentStock), minimumStock: Number(form.minimumStock), costPerUnit: Number(form.costPerUnit) };
      if (editing) {
        await axiosInstance.put(`/inventory/${editing._id}`, payload);
        setSnack({ open: true, message: 'Item updated', severity: 'success' });
      } else {
        await axiosInstance.post('/inventory', payload);
        setSnack({ open: true, message: 'Item created', severity: 'success' });
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axiosInstance.delete(`/inventory/${id}`);
      setSnack({ open: true, message: 'Item deleted', severity: 'success' });
      fetchItems();
    } catch {
      setSnack({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  const handleRestock = async () => {
    try {
      await axiosInstance.put(`/inventory/${restockItem._id}/restock`, { quantity: restockQty });
      setSnack({ open: true, message: 'Item restocked', severity: 'success' });
      setRestockDialog(false);
      fetchItems();
    } catch {
      setSnack({ open: true, message: 'Restock failed', severity: 'error' });
    }
  };

  return (
    <Box>
      {/* ── Page header ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>Inventory</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={lowStockOnly ? 'contained' : 'outlined'} size="small"
            startIcon={<Warning />} onClick={() => setLowStockOnly(!lowStockOnly)}
            sx={{
              textTransform: 'none', borderColor: LOW_RED,
              color: lowStockOnly ? '#fff' : LOW_RED,
              bgcolor: lowStockOnly ? LOW_RED : 'transparent',
              '&:hover': { bgcolor: lowStockOnly ? '#8f2e2e' : '#fff0f0' },
            }}>
            Low Stock {lowStockItems.length > 0 && `(${lowStockItems.length})`}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Add Item
          </Button>
        </Box>
      </Box>

      {/* ── Week 9: Ledger summary cards ─────────────────── */}
      {!loading && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {[
            { label: 'Total Items',    value: items.length,          color: BROWN,     icon: <InventoryIcon fontSize="small" /> },
            { label: 'Low Stock',      value: lowStockItems.length,  color: LOW_RED,   icon: <WarningAmber fontSize="small" /> },
            { label: 'Inventory Value', value: `$${totalValue.toFixed(0)}`, color: '#3a6186', icon: null },
          ].map(({ label, value, color, icon }) => (
            <Box key={label} sx={{
              flex: '1 1 140px', border: `1px solid ${label === 'Low Stock' && lowStockItems.length > 0 ? LOW_BORDER : BORDER}`,
              borderRadius: 2, p: 2, bgcolor: label === 'Low Stock' && lowStockItems.length > 0 ? LOW_BG : '#fff',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              {icon && <Box sx={{ color, width: 32, height: 32, bgcolor: `${color}15`, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#3b1f0a', lineHeight: 1.1 }}>{value}</Typography>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Week 9: Warning banner when low-stock items exist ─ */}
      {!loading && lowStockItems.length > 0 && !lowStockOnly && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="error" size="small" onClick={() => setLowStockOnly(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>
              View {lowStockItems.length} items
            </Button>
          }>
          <strong>Low Stock Alert:</strong> {lowStockItems.map(i => i.itemName).join(', ')} {lowStockItems.length === 1 ? 'is' : 'are'} below minimum threshold.
        </Alert>
      )}

      {/* ── Filters ───────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search items…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {invCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        {(search || categoryFilter) && (
          <Button size="small" onClick={() => { setSearch(''); setCategoryFilter(''); }}
            sx={{ color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.8rem' }}>
            Clear
          </Button>
        )}
      </Box>

      {/* ── Product Ledger Table (Week 9) ─────────────────── */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: BG }}>
              <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              {/* Stock level column with progress bar — Week 9 */}
              <TableCell sx={{ fontWeight: 600 }}>Qty on Hand</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Stock Level</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cost/Unit</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
              {/* Status column — red warning highlight (Week 9) */}
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress sx={{ color: BROWN }} /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: LIGHT_BROWN }}>No items found</TableCell></TableRow>
            ) : items.map(item => {
              const isLow = item.isLowStock;
              return (
                /* ── Week 9: Red row highlight when below threshold ── */
                <TableRow key={item._id} hover
                  sx={{
                    bgcolor: isLow ? LOW_BG : 'inherit',
                    '& td': { borderLeft: isLow ? `3px solid ${LOW_RED}` : '3px solid transparent' },
                    '& td:first-of-type': { borderLeft: isLow ? `4px solid ${LOW_RED}` : '4px solid transparent' },
                  }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isLow && <Tooltip title="Below minimum stock threshold"><WarningAmber sx={{ color: LOW_RED, fontSize: 16 }} /></Tooltip>}
                      <Typography sx={{ fontWeight: 600, color: isLow ? LOW_RED : '#3b1f0a', fontSize: '0.88rem' }}>
                        {item.itemName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category} size="small"
                      sx={{ fontSize: '0.68rem', bgcolor: `${BROWN}10`, color: BROWN }} />
                  </TableCell>

                  {/* Qty on hand — red if low (Week 9) */}
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isLow ? LOW_RED : '#3b1f0a' }}>
                      {item.currentStock}
                    </Typography>
                  </TableCell>

                  {/* Progress bar visual (Week 9) */}
                  <TableCell sx={{ minWidth: 120 }}>
                    <StockBar current={item.currentStock} minimum={item.minimumStock} />
                  </TableCell>

                  <TableCell sx={{ color: LIGHT_BROWN, fontSize: '0.85rem' }}>{item.unit}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BROWN }}>${item.costPerUnit}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.82rem', color: '#3b1f0a' }}>{item.supplier?.name || '—'}</Typography>
                    {item.supplier?.contact && (
                      <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{item.supplier.contact}</Typography>
                    )}
                  </TableCell>

                  {/* Status chip — red "Low Stock" badge (Week 9) */}
                  <TableCell>
                    {isLow ? (
                      <Chip label="⚠ Low Stock" size="small"
                        sx={{ bgcolor: '#ffe0e0', color: LOW_RED, border: `1px solid ${LOW_BORDER}`, fontWeight: 700, fontSize: '0.7rem' }} />
                    ) : (
                      <Chip label="In Stock" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    )}
                  </TableCell>

                  <TableCell>
                    <Button size="small" variant="outlined"
                      onClick={() => { setRestockItem(item); setRestockQty(1); setRestockDialog(true); }}
                      sx={{ mr: 0.5, textTransform: 'none', fontSize: '0.72rem', color: BROWN, borderColor: BROWN }}>
                      Restock
                    </Button>
                    <IconButton size="small" onClick={() => handleOpenDialog(item)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item._id)} color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Add / Edit Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Item Name" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required fullWidth />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {invCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Current Stock" type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="Min Stock (threshold)" type="number" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} sx={{ flex: 1 }} helperText="Low-stock alert triggers below this" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Unit</InputLabel>
                <Select value={form.unit} label="Unit" onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Cost per Unit ($)" type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: LIGHT_BROWN, mt: 0.5 }}>Supplier Registry</Typography>
            <TextField label="Supplier Name" value={form.supplier.name} onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, name: e.target.value } })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Contact" value={form.supplier.contact} onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, contact: e.target.value } })} sx={{ flex: 1 }} />
              <TextField label="Email" value={form.supplier.email} onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, email: e.target.value } })} sx={{ flex: 1 }} />
            </Box>
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

      {/* ── Restock Dialog ────────────────────────────────── */}
      <Dialog open={restockDialog} onClose={() => setRestockDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Restock — {restockItem?.itemName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: LIGHT_BROWN, mb: 2 }}>
              Current: <strong>{restockItem?.currentStock}</strong> {restockItem?.unit} · Min threshold: <strong>{restockItem?.minimumStock}</strong>
            </Typography>
            <TextField label="Quantity to add" type="number" value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))} fullWidth inputProps={{ min: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestockDialog(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleRestock} variant="contained" disabled={!restockQty || restockQty < 1}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            Add Stock
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

export default Inventory;
