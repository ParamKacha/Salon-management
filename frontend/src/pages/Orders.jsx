import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel, Chip,
  TablePagination, CircularProgress, Alert, Snackbar, Tabs, Tab, TextField,
  Tooltip, Card, CardContent, Divider,
} from '@mui/material';
import {
  Visibility, Cancel as CancelIcon, ShoppingBag, AttachMoney,
  LocalShipping, CheckCircle, PendingActions,
} from '@mui/icons-material';

const BROWN       = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER      = '#e2cfc4';
const BG          = '#f5ede6';

const statusColors = {
  Pending:    '#b07d3a',
  Processing: '#3a6186',
  Shipped:    '#7c4e7c',
  Delivered:  '#4e7c59',
  Cancelled:  '#b03a3a',
};

const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function StatCard({ icon, label, value, color }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', flex: '1 1 140px' }}>
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

function Orders() {
  const { user } = useAuth();
  const isAdmin    = user?.role === 'Admin';
  const isCustomer = user?.role === 'Customer';
  const canAccess  = isAdmin || isCustomer;

  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(0);
  const [total, setTotal]                 = useState(0);
  const [statusFilter, setStatusFilter]   = useState('');
  const [detailDialog, setDetailDialog]   = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelDialog, setCancelDialog]   = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [createDialog, setCreateDialog]   = useState(false);
  const [cartItems, setCartItems]         = useState([{ product: '', quantity: 1 }]);
  const [products, setProducts]           = useState([]);
  const [saving, setSaving]               = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [snack, setSnack]                 = useState({ open: false, message: '', severity: 'success' });

  const fetchOrders = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = isCustomer ? '/orders/my' : '/orders';
      const params = { page: page + 1, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await axiosInstance.get(url, { params });
      setOrders(res.data.data || []);
      setTotal(res.data.pagination?.total || (res.data.data ? res.data.data.length : 0));
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to load orders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [canAccess, isCustomer, page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/products', { params: { limit: 100 } });
      setProducts(res.data.data || []);
    } catch {}
  };

  const openCreateDialog = () => {
    fetchProducts();
    setCartItems([{ product: '', quantity: 1 }]);
    setCreateDialog(true);
  };

  const handleCreateOrder = async () => {
    const validItems = cartItems.filter(i => i.product && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setSnack({ open: true, message: 'Please select at least one product with valid quantity', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const items = validItems.map(i => ({ product: i.product, quantity: Number(i.quantity) }));
      await axiosInstance.post('/orders', { items, paymentMethod: 'Cash' });
      setSnack({ open: true, message: 'Order placed successfully!', severity: 'success' });
      setCreateDialog(false);
      fetchOrders();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to place order', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdating(orderId);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'Delivered') {
        payload.paymentStatus = 'Completed';
      }
      await axiosInstance.put(`/orders/${orderId}/status`, payload);
      setSnack({ open: true, message: `Order marked as ${newStatus}`, severity: 'success' });
      fetchOrders();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Status update failed', severity: 'error' });
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setSaving(true);
    try {
      await axiosInstance.put(`/orders/${orderToCancel._id}/cancel`);
      setSnack({ open: true, message: 'Order cancelled and stock restored', severity: 'success' });
      setCancelDialog(false);
      setOrderToCancel(null);
      fetchOrders();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to cancel', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const orderTotal = (order) => {
    if (order.totalAmount) return order.totalAmount;
    return order.items?.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0) || 0;
  };

  // Stats calculation
  const pendingCount   = orders.filter(o => o.status === 'Pending').length;
  const processingCount= orders.filter(o => o.status === 'Processing').length;
  const shippedCount   = orders.filter(o => o.status === 'Shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const totalRevenue   = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + orderTotal(o), 0);

  if (!canAccess) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a', mb: 2 }}>Orders</Typography>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Orders are only accessible for <strong>Customers</strong> (to track their purchases) and <strong>Administrators</strong> (to fulfill orders).
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Page Header ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>
          {isAdmin ? 'Order Fulfillment & Store Management' : 'My Orders & Purchases'}
        </Typography>
        {isCustomer && (
          <Button variant="contained" startIcon={<ShoppingBag />} onClick={openCreateDialog}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            New Order
          </Button>
        )}
      </Box>

      {/* ── Summary Stat Cards ───────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <StatCard icon={<ShoppingBag />} label="Total Orders" value={orders.length} color={BROWN} />
        <StatCard icon={<PendingActions />} label="Pending / Processing" value={pendingCount + processingCount} color="#b07d3a" />
        <StatCard icon={<LocalShipping />} label="Shipped" value={shippedCount} color="#7c4e7c" />
        <StatCard icon={<CheckCircle />} label="Delivered" value={deliveredCount} color="#4e7c59" />
        {isAdmin && <StatCard icon={<AttachMoney />} label="Total Order Sales" value={`$${totalRevenue.toFixed(2)}`} color="#2e7d6e" />}
      </Box>

      {/* ── Status Filter ────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select value={statusFilter} label="Filter by Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
            <MenuItem value="">All Statuses</MenuItem>
            {orderStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* ── Orders Table ─────────────────────────────────── */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: BG }}>
              {isAdmin && <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>}
              <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 8 : 7} align="center" sx={{ py: 4 }}><CircularProgress sx={{ color: BROWN }} /></TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} align="center" sx={{ py: 4, color: LIGHT_BROWN }}>
                  No orders found
                </TableCell>
              </TableRow>
            ) : orders.map((o) => (
              <TableRow key={o._id} hover>
                {isAdmin && (
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#3b1f0a' }}>
                      {o.customer?.name || 'Customer'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                      {o.customer?.phone || o.customer?.email || ''}
                    </Typography>
                  </TableCell>
                )}
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  #{o._id.slice(-6).toUpperCase()}
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    {o.items?.map(i => `${i.name || i.product?.name || 'Item'} × ${i.quantity}`).join(', ')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                    {o.items?.length} product(s)
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: BROWN }}>
                  ${orderTotal(o).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Chip label={`${o.paymentMethod || 'Cash'} · ${o.paymentStatus || 'Pending'}`} size="small" variant="outlined"
                    sx={{ fontSize: '0.7rem', borderColor: BORDER }} />
                </TableCell>
                <TableCell>
                  {isAdmin && o.status !== 'Cancelled' && o.status !== 'Delivered' ? (
                    <Select size="small" value={o.status}
                      disabled={statusUpdating === o._id}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      sx={{ fontSize: '0.75rem', height: 28, minWidth: 110, bgcolor: `${statusColors[o.status] || '#888'}12` }}>
                      {orderStatuses.map(s => (
                        <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s}</MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <Chip label={o.status} size="small"
                      sx={{ bgcolor: `${statusColors[o.status] || '#888'}18`, color: statusColors[o.status] || '#888', fontWeight: 700, fontSize: '0.72rem' }} />
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem' }}>
                  {o.createdAt ? o.createdAt.split('T')[0] : '—'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Tooltip title="View Order Details">
                      <IconButton size="small" onClick={() => { setSelectedOrder(o); setDetailDialog(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!['Cancelled', 'Delivered'].includes(o.status) && (
                      <Tooltip title="Cancel Order">
                        <IconButton size="small" color="error" onClick={() => { setOrderToCancel(o); setCancelDialog(true); }}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={20} rowsPerPageOptions={[10, 20, 50]} onRowsPerPageChange={() => {}} />
      </TableContainer>

      {/* ── Order Detail Dialog ───────────────────────────── */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Order #{selectedOrder?._id?.slice(-6).toUpperCase()}</span>
          {selectedOrder && (
            <Chip label={selectedOrder.status} size="small"
              sx={{ bgcolor: `${statusColors[selectedOrder.status] || '#888'}18`, color: statusColors[selectedOrder.status] || '#888', fontWeight: 700 }} />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                  <strong>Customer:</strong> {selectedOrder.customer?.name || 'Customer'}
                </Typography>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                  <strong>Phone:</strong> {selectedOrder.customer?.phone || '—'}
                </Typography>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                  <strong>Date:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'}
                </Typography>
                <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                  <strong>Payment:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                </Typography>
              </Box>

              <Divider sx={{ borderColor: BORDER }} />

              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#3b1f0a' }}>
                Items Ordered
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedOrder.items?.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: `1px solid ${BORDER}` }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {item.name || item.product?.name || 'Product'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>
                        ${item.price} × {item.quantity}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '0.9rem' }}>
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ bgcolor: BG, p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>${(selectedOrder.subtotal || 0).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>Tax (8%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>${(selectedOrder.tax || 0).toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ borderColor: BORDER, my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 700, color: '#3b1f0a' }}>Grand Total</Typography>
                  <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '1.1rem' }}>
                    ${orderTotal(selectedOrder).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)} sx={{ color: LIGHT_BROWN }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel Order Dialog ───────────────────────────── */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: '#b03a3a', fontWeight: 700 }}>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Are you sure you want to cancel Order #{orderToCancel?._id?.slice(-6).toUpperCase()}? Product stock will be automatically restored.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)} sx={{ color: LIGHT_BROWN }}>Keep Order</Button>
          <Button onClick={handleCancelOrder} variant="contained" color="error" disabled={saving} sx={{ textTransform: 'none' }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Customer Create Order Dialog ──────────────────── */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>Create New Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {cartItems.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Product</InputLabel>
                  <Select value={item.product} label="Product" onChange={(e) => {
                    const newItems = [...cartItems];
                    newItems[idx].product = e.target.value;
                    setCartItems(newItems);
                  }}>
                    {products.map(p => (
                      <MenuItem key={p._id} value={p._id} disabled={p.stockQuantity <= 0}>
                        {p.name} — ${p.price} ({p.stockQuantity} in stock)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Qty" type="number" value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...cartItems];
                    newItems[idx].quantity = Math.max(1, Number(e.target.value));
                    setCartItems(newItems);
                  }} sx={{ width: 80 }} inputProps={{ min: 1 }} />
                <Button size="small" color="error" onClick={() => {
                  if (cartItems.length > 1) setCartItems(cartItems.filter((_, i) => i !== idx));
                }}>×</Button>
              </Box>
            ))}
            <Button size="small" onClick={() => setCartItems([...cartItems, { product: '', quantity: 1 }])}
              sx={{ color: BROWN, textTransform: 'none', alignSelf: 'flex-start' }}>+ Add Item</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} sx={{ color: LIGHT_BROWN }}>Cancel</Button>
          <Button onClick={handleCreateOrder} variant="contained" disabled={saving || cartItems.every(i => !i.product)}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Place Order'}
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

export default Orders;
