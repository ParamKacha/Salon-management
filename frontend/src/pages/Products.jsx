import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, CircularProgress, Alert, Snackbar, Grid, Card, CardContent,
  Drawer, Divider, Rating, TablePagination, Badge, Tooltip,
} from '@mui/material';
import {
  Edit, Delete, Add, Star, ShoppingCart, Remove, AddCircle,
  DeleteForever, Close, ShoppingBag,
} from '@mui/icons-material';

const BROWN      = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER     = '#e2cfc4';
const BG         = '#f5ede6';
const TAX_RATE   = 0.18;   // 18% GST

const prodCategories = ['Hair Care', 'Skin Care', 'Beard Care', 'Styling', 'Tools', 'Accessories', 'Other'];
const sortOptions = [
  { label: 'Newest',             value: '' },
  { label: 'Price: Low → High',  value: 'price_asc' },
  { label: 'Price: High → Low',  value: 'price_desc' },
  { label: 'Name',               value: 'name' },
  { label: 'Rating',             value: 'rating' },
];

const emptyProduct = {
  name: '', description: '', category: 'Hair Care',
  price: '', brand: '', stockQuantity: 0, image: '', isActive: true,
};

function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // ── Products state ────────────────────────────────────────
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(0);
  const [total, setTotal]               = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort]                 = useState('');
  const [search, setSearch]             = useState('');
  const [viewMode, setViewMode]         = useState('card');

  // ── Cart state (Week 10 — React useState, no Redux) ───────
  // cart = [{ product, qty }]
  const [cart, setCart]                 = useState([]);
  const [cartOpen, setCartOpen]         = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [checkingOut, setCheckingOut]   = useState(false);

  // ── Admin dialog state ────────────────────────────────────
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyProduct);
  const [saving, setSaving]             = useState(false);
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch ─────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 12 };
      if (categoryFilter) params.category = categoryFilter;
      if (sort)           params.sort     = sort;
      if (search)         params.search   = search;
      const res = await axiosInstance.get('/products', { params });
      setProducts(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setSnack({ open: true, message: 'Failed to load products', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, sort, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Cart helpers (Week 10) ────────────────────────────────
  const cartTotal   = cart.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const cartTax     = cartTotal * TAX_RATE;
  const cartGrand   = cartTotal + cartTax;
  const cartCount   = cart.reduce((s, { qty }) => s + qty, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product._id === product._id);
      if (existing) return prev.map(i => i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    setSnack({ open: true, message: `${product.name} added to cart`, severity: 'success' });
  };

  const changeQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.product._id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.product._id !== id));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const items = cart.map(i => ({
        product: i.product._id,
        quantity: i.qty,
      }));
      await axiosInstance.post('/orders', { items, paymentMethod: 'Cash' });
      setCart([]);
      setCheckoutDone(true);
      setSnack({ open: true, message: 'Order placed successfully! Track it in Orders.', severity: 'success' });
      fetchProducts();
      setTimeout(() => {
        setCartOpen(false);
        setCheckoutDone(false);
      }, 2200);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to place order', severity: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Admin CRUD ────────────────────────────────────────────
  const handleOpenDialog = (prod = null) => {
    setEditing(prod);
    setForm(prod ? { ...prod } : emptyProduct);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) };
      if (editing) {
        await axiosInstance.put(`/products/${editing._id}`, payload);
        setSnack({ open: true, message: 'Product updated', severity: 'success' });
      } else {
        await axiosInstance.post('/products', payload);
        setSnack({ open: true, message: 'Product created', severity: 'success' });
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axiosInstance.delete(`/products/${id}`);
      setSnack({ open: true, message: 'Product deleted', severity: 'success' });
      fetchProducts();
    } catch {
      setSnack({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  // ── Product card ──────────────────────────────────────────
  const ProductCard = ({ prod }) => {
    const inCart = cart.find(i => i.product._id === prod._id);
    const outOfStock = prod.stockQuantity <= 0;
    return (
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card sx={{
          borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none',
          height: '100%', display: 'flex', flexDirection: 'column',
          transition: 'all 0.15s',
          '&:hover': { borderColor: BROWN, boxShadow: '0 2px 12px rgba(107,63,31,0.1)' },
        }}>
          {/* Product image placeholder */}
          <Box sx={{ height: 140, bgcolor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.5 }}>
            <ShoppingBag sx={{ color: `${BROWN}50`, fontSize: 36 }} />
            <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{prod.brand || prod.category}</Typography>
          </Box>

          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.9rem', lineHeight: 1.3 }}>{prod.name}</Typography>
            {prod.brand && <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{prod.brand}</Typography>}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating value={prod.rating} readOnly size="small" />
              <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>({prod.numReviews})</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1 }}>
              <Typography sx={{ fontWeight: 700, color: BROWN, fontSize: '1.05rem' }}>${prod.price}</Typography>
              <Chip label={prod.category} size="small"
                sx={{ bgcolor: `${BROWN}18`, color: BROWN, fontSize: '0.62rem', fontWeight: 600 }} />
            </Box>

            <Typography variant="caption" sx={{ color: outOfStock ? '#b03a3a' : '#4e7c59' }}>
              {outOfStock ? 'Out of stock' : `${prod.stockQuantity} in stock`}
            </Typography>

            {/* Add to cart button (Week 10) */}
            {!isAdmin && (
              <Button
                size="small" fullWidth variant={inCart ? 'outlined' : 'contained'}
                disabled={outOfStock}
                onClick={() => addToCart(prod)}
                sx={{
                  mt: 1, textTransform: 'none', fontSize: '0.78rem',
                  bgcolor: inCart ? 'transparent' : BROWN,
                  borderColor: BROWN, color: inCart ? BROWN : '#fff',
                  '&:hover': { bgcolor: inCart ? `${BROWN}10` : '#4e2e13' },
                }}
              >
                {outOfStock ? 'Out of stock' : inCart ? `In cart (${inCart.qty})` : 'Add to cart'}
              </Button>
            )}

            {isAdmin && (
              <Box sx={{ pt: 1, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <IconButton size="small" onClick={() => handleOpenDialog(prod)}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(prod._id)} color="error"><Delete fontSize="small" /></IconButton>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      {/* ── Page header ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a' }}>Product Store</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button variant={viewMode === 'card' ? 'contained' : 'outlined'} size="small" onClick={() => setViewMode('card')}
            sx={{ textTransform: 'none', borderColor: BROWN, color: viewMode === 'card' ? '#fff' : BROWN, bgcolor: viewMode === 'card' ? BROWN : 'transparent' }}>
            Grid
          </Button>
          <Button variant={viewMode === 'table' ? 'contained' : 'outlined'} size="small" onClick={() => setViewMode('table')}
            sx={{ textTransform: 'none', borderColor: BROWN, color: viewMode === 'table' ? '#fff' : BROWN, bgcolor: viewMode === 'table' ? BROWN : 'transparent' }}>
            List
          </Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
              sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none' }}>
              Add Product
            </Button>
          )}
          {/* Cart button (Week 10) */}
          {!isAdmin && (
            <Tooltip title="View cart">
              <IconButton onClick={() => setCartOpen(true)}
                sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, px: 1.5, bgcolor: '#fff', '&:hover': { bgcolor: BG } }}>
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCart sx={{ color: BROWN }} />
                </Badge>
                {cartCount > 0 && (
                  <Typography sx={{ ml: 0.8, fontWeight: 700, color: BROWN, fontSize: '0.82rem' }}>
                    ${cartTotal.toFixed(2)}
                  </Typography>
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Filters ───────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search products…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {prodCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sort} label="Sort By" onChange={(e) => { setSort(e.target.value); setPage(0); }}>
            {sortOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* ── Products grid / list ─────────────────────────── */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>
      ) : viewMode === 'card' ? (
        <>
          <Grid container spacing={2}>
            {products.map(prod => <ProductCard key={prod._id} prod={prod} />)}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={12} onRowsPerPageChange={() => {}} />
          </Box>
        </>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: BG }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                {!isAdmin && <TableCell sx={{ fontWeight: 600 }}>Cart</TableCell>}
                {isAdmin  && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map(prod => (
                <TableRow key={prod._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{prod.name}</TableCell>
                  <TableCell>{prod.brand || '—'}</TableCell>
                  <TableCell><Chip label={prod.category} size="small" sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BROWN }}>${prod.price}</TableCell>
                  <TableCell>
                    <Chip label={prod.stockQuantity > 0 ? prod.stockQuantity : 'Out'} size="small"
                      color={prod.stockQuantity > 0 ? 'success' : 'error'} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ fontSize: 14, color: '#f5a623' }} />
                      <Typography variant="caption">{prod.rating?.toFixed(1)}</Typography>
                    </Box>
                  </TableCell>
                  {!isAdmin && (
                    <TableCell>
                      <Button size="small" variant="outlined" disabled={prod.stockQuantity <= 0}
                        onClick={() => addToCart(prod)}
                        sx={{ textTransform: 'none', fontSize: '0.72rem', color: BROWN, borderColor: BROWN }}>
                        Add to Cart
                      </Button>
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(prod)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(prod._id)} color="error"><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component="div" count={total} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={12} onRowsPerPageChange={() => {}} />
        </TableContainer>
      )}

      {/* ══════════════════════════════════════════════════════
          WEEK 10: Cart Drawer + Checkout Summary
          - Uses React useState only (no Redux)
          - Auto-computes subtotal, 18% tax, grand total
      ══════════════════════════════════════════════════════ */}
      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 0, display: 'flex', flexDirection: 'column' } }}>

        {/* Drawer header */}
        <Box sx={{ px: 3, py: 2, bgcolor: BROWN, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart sx={{ color: '#fff', fontSize: 22 }} />
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
              Cart ({cartCount} item{cartCount !== 1 ? 's' : ''})
            </Typography>
          </Box>
          <IconButton onClick={() => setCartOpen(false)} sx={{ color: '#fff' }}><Close /></IconButton>
        </Box>

        {/* Cart items */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
          {checkoutDone ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2rem', mb: 1 }}>✅</Typography>
              <Typography sx={{ fontWeight: 700, color: '#4e7c59', fontSize: '1.1rem' }}>Order Placed!</Typography>
              <Typography variant="body2" sx={{ color: LIGHT_BROWN, mt: 0.5 }}>Thank you for your purchase.</Typography>
            </Box>
          ) : cart.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ShoppingCart sx={{ color: '#d9c4b5', fontSize: 48, mb: 2 }} />
              <Typography sx={{ color: LIGHT_BROWN }}>Your cart is empty</Typography>
              <Button onClick={() => setCartOpen(false)} sx={{ mt: 2, color: BROWN, textTransform: 'none' }}>
                Continue Shopping
              </Button>
            </Box>
          ) : (
            cart.map(({ product, qty }) => (
              <Box key={product._id} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: `1px solid ${BORDER}` }}>
                <Box sx={{ width: 48, height: 48, bgcolor: BG, borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag sx={{ color: `${BROWN}60`, fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.88rem' }}>{product.name}</Typography>
                  <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>${product.price} each</Typography>
                  {/* Quantity controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <IconButton size="small" onClick={() => changeQty(product._id, -1)} sx={{ p: 0.3 }}>
                      <Remove sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.9rem' }}>{qty}</Typography>
                    <IconButton size="small" onClick={() => changeQty(product._id, 1)} sx={{ p: 0.3 }}>
                      <AddCircle sx={{ fontSize: 16, color: BROWN }} />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: BROWN }}>${(product.price * qty).toFixed(2)}</Typography>
                  <IconButton size="small" onClick={() => removeFromCart(product._id)} sx={{ color: '#b03a3a', p: 0.3, mt: 0.5 }}>
                    <DeleteForever sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* ── Checkout summary (auto-computed subtotals) ─────── */}
        {cart.length > 0 && !checkoutDone && (
          <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${BORDER}`, bgcolor: '#fffaf7' }}>
            <Typography sx={{ fontWeight: 600, color: '#3b1f0a', mb: 1.5, fontSize: '0.9rem' }}>
              Order Summary
            </Typography>

            {/* Subtotal */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>
                Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>${cartTotal.toFixed(2)}</Typography>
            </Box>

            {/* Tax — auto-computed at 18% */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="body2" sx={{ color: LIGHT_BROWN }}>Tax (18% GST)</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>${cartTax.toFixed(2)}</Typography>
            </Box>

            <Divider sx={{ borderColor: BORDER, my: 1 }} />

            {/* Grand total */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Total</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: BROWN }}>${cartGrand.toFixed(2)}</Typography>
            </Box>

            {/* Per-item breakdown */}
            <Box sx={{ bgcolor: BG, borderRadius: 2, p: 1.5, mb: 2 }}>
              <Typography variant="caption" sx={{ color: LIGHT_BROWN, display: 'block', mb: 0.5, fontWeight: 600 }}>
                Item breakdown
              </Typography>
              {cart.map(({ product, qty }) => (
                <Box key={product._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#3b1f0a' }}>{product.name} × {qty}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: BROWN }}>${(product.price * qty).toFixed(2)}</Typography>
                </Box>
              ))}
            </Box>

            <Button fullWidth variant="contained" onClick={handleCheckout} disabled={checkingOut}
              sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none', fontWeight: 700, py: 1.2 }}>
              {checkingOut ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : `Place Order — $${cartGrand.toFixed(2)}`}
            </Button>
            <Button fullWidth onClick={() => setCartOpen(false)}
              sx={{ mt: 1, color: LIGHT_BROWN, textTransform: 'none', fontSize: '0.85rem' }}>
              Continue Shopping
            </Button>
          </Box>
        )}
      </Drawer>

      {/* ── Admin dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: BROWN, fontWeight: 700 }}>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {prodCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Price ($)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required sx={{ flex: 1 }} />
              <TextField label="Stock Qty" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <TextField label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} fullWidth />
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

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Products;
