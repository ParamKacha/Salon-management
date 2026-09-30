import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import {
  Box, Typography, Button, Stepper, Step, StepLabel, Paper, Grid, Card,
  CardContent, Chip, CircularProgress, Alert, Snackbar, Tooltip,
} from '@mui/material';
import { CheckCircle, AccessTime, Block } from '@mui/icons-material';

const BROWN = '#6b3f1f';
const LIGHT_BROWN = '#a0785a';
const BORDER = '#e2cfc4';

const steps = ['Select Service', 'Choose Barber', 'Pick Date & Time', 'Confirm'];

function BookAppointment() {
  const navigate = useNavigate();

  const [activeStep, setActiveStep]       = useState(0);
  const [services, setServices]           = useState([]);
  const [barbers, setBarbers]             = useState([]);
  const [slots, setSlots]                 = useState([]);       // { time, available }[]
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber]   = useState(null);
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedSlot, setSelectedSlot]   = useState('');
  const [loading, setLoading]             = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [snack, setSnack]                 = useState({ open: false, message: '', severity: 'success' });

  // ── Load services + barbers on mount ──────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [svcRes, barRes] = await Promise.all([
          axiosInstance.get('/services'),
          axiosInstance.get('/users/barbers'),
        ]);
        setServices(svcRes.data.data);
        setBarbers(barRes.data.data);
      } catch {
        setSnack({ open: true, message: 'Failed to load data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Fetch ALL slots (available + booked) when barber/date changes ──
  useEffect(() => {
    if (selectedBarber && selectedDate) {
      setSlotsLoading(true);
      setSelectedSlot('');
      axiosInstance.get('/appointments/available-slots', {
        params: { barberId: selectedBarber._id, date: selectedDate },
      }).then(res => {
        setSlots(res.data.data || []);
      }).catch(() => {
        setSlots([]);
      }).finally(() => {
        setSlotsLoading(false);
      });
    } else {
      setSlots([]);
    }
  }, [selectedBarber, selectedDate]);

  // ── Step validation ────────────────────────────────────────
  const handleNext = () => {
    if (activeStep === 0 && !selectedService) { setSnack({ open: true, message: 'Please select a service', severity: 'error' }); return; }
    if (activeStep === 1 && !selectedBarber)  { setSnack({ open: true, message: 'Please select a barber', severity: 'error' }); return; }
    if (activeStep === 2 && !selectedDate)    { setSnack({ open: true, message: 'Please pick a date', severity: 'error' }); return; }
    if (activeStep === 2 && !selectedSlot)    { setSnack({ open: true, message: 'Please select a time slot', severity: 'error' }); return; }
    setActiveStep(prev => prev + 1);
  };

  // ── Submit booking ─────────────────────────────────────────
  const handleBook = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.post('/appointments', {
        service: selectedService._id,
        barber:  selectedBarber._id,
        date:    selectedDate,
        timeSlot: selectedSlot,
      });
      setSnack({ open: true, message: 'Appointment booked successfully!', severity: 'success' });
      setTimeout(() => navigate('/appointments'), 1500);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Booking failed', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BROWN }} /></Box>;

  // ── Group services by category for Step 0 ─────────────────
  const grouped = services.reduce((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {});

  const availableCount = slots.filter(s => s.available).length;
  const bookedCount    = slots.filter(s => !s.available).length;

  return (
    <Box>
      <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b1f0a', mb: 3 }}>
        Book an Appointment
      </Typography>

      {/* ── Stepper ─────────────────────────────────────── */}
      <Stepper activeStep={activeStep} sx={{
        mb: 4,
        '& .MuiStepLabel-label.Mui-active':     { color: BROWN, fontWeight: 600 },
        '& .MuiStepIcon-root.Mui-active':        { color: BROWN },
        '& .MuiStepIcon-root.Mui-completed':     { color: BROWN },
      }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {/* ═══════════════════════════════════════════════════
          STEP 0 — Select Service (grouped by category)
      ═══════════════════════════════════════════════════ */}
      {activeStep === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(grouped).map(([category, svcs]) => (
            <Box key={category}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.95rem' }}>
                  {category}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: BORDER }} />
              </Box>
              <Grid container spacing={2}>
                {svcs.map(svc => (
                  <Grid item xs={12} sm={6} md={4} key={svc._id}>
                    <Card
                      onClick={() => setSelectedService(svc)}
                      sx={{
                        borderRadius: 2, cursor: 'pointer', boxShadow: 'none',
                        border: selectedService?._id === svc._id ? `2px solid ${BROWN}` : `1px solid ${BORDER}`,
                        bgcolor: selectedService?._id === svc._id ? '#fdf6f0' : '#fff',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: BROWN },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#3b1f0a', fontSize: '0.9rem' }}>{svc.name}</Typography>
                          {selectedService?._id === svc._id && <CheckCircle sx={{ color: BROWN, fontSize: 18 }} />}
                        </Box>
                        {svc.description && (
                          <Typography variant="body2" sx={{ color: LIGHT_BROWN, mb: 1.5, fontSize: '0.8rem' }}>
                            {svc.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 700, color: BROWN }}>${svc.price}</Typography>
                          <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>{svc.duration} min</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 1 — Choose Barber
      ═══════════════════════════════════════════════════ */}
      {activeStep === 1 && (
        <Grid container spacing={2}>
          {barbers.map(b => (
            <Grid item xs={12} sm={6} md={4} key={b._id}>
              <Card
                onClick={() => setSelectedBarber(b)}
                sx={{
                  borderRadius: 2, cursor: 'pointer', boxShadow: 'none',
                  border: selectedBarber?._id === b._id ? `2px solid ${BROWN}` : `1px solid ${BORDER}`,
                  bgcolor: selectedBarber?._id === b._id ? '#fdf6f0' : '#fff',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: BROWN },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, color: '#3b1f0a' }}>{b.name}</Typography>
                    {selectedBarber?._id === b._id && <CheckCircle sx={{ color: BROWN, fontSize: 18 }} />}
                  </Box>
                  <Typography variant="body2" sx={{ color: LIGHT_BROWN, fontSize: '0.82rem' }}>
                    {b.specializations?.join(', ') || 'General Barber'}
                  </Typography>
                  {b.experience > 0 && (
                    <Typography variant="caption" sx={{ color: LIGHT_BROWN, display: 'block', mt: 0.5 }}>
                      {b.experience} yr{b.experience > 1 ? 's' : ''} experience
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 2 — Pick Date & Time (interactive slot grid)
      ═══════════════════════════════════════════════════ */}
      {activeStep === 2 && (
        <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', maxWidth: 560 }}>

          {/* Date picker */}
          <Typography sx={{ mb: 1.5, fontWeight: 600, color: '#3b1f0a' }}>Select Date</Typography>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 8,
              border: `1px solid ${BORDER}`, fontSize: '1rem',
              marginBottom: 24, boxSizing: 'border-box', outline: 'none',
            }}
          />

          {/* Slot grid — shown once a date is picked */}
          {selectedDate && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 600, color: '#3b1f0a' }}>
                  Time Slots
                  {selectedBarber && (
                    <Typography component="span" variant="caption" sx={{ color: LIGHT_BROWN, ml: 1 }}>
                      — {selectedBarber.name}
                    </Typography>
                  )}
                </Typography>
                {/* Legend */}
                {slots.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: BROWN }} />
                      <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Available ({availableCount})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#d9d0c8' }} />
                      <Typography variant="caption" sx={{ color: LIGHT_BROWN }}>Booked ({bookedCount})</Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {slotsLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={28} sx={{ color: BROWN }} />
                  <Typography variant="caption" sx={{ display: 'block', color: LIGHT_BROWN, mt: 1 }}>
                    Checking availability…
                  </Typography>
                </Box>
              ) : slots.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Block sx={{ color: '#d9d0c8', fontSize: 36, mb: 1 }} />
                  <Typography sx={{ color: LIGHT_BROWN, fontSize: '0.9rem' }}>
                    No slots available — barber may be off on this day.
                  </Typography>
                </Box>
              ) : (
                /* ── Interactive slot grid ──────────────────────
                   Available  → brown, clickable, highlights on select
                   Booked     → grey, disabled, shows "Booked" tooltip   */
                <Grid container spacing={1}>
                  {slots.map(slot => {
                    const isBooked   = !slot.available;
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <Grid item xs={3} sm={3} key={slot.time}>
                        <Tooltip title={isBooked ? 'Already booked' : isSelected ? 'Selected' : 'Click to select'} arrow>
                          <Box
                            onClick={() => !isBooked && setSelectedSlot(slot.time)}
                            sx={{
                              py: 1,
                              px: 0.5,
                              borderRadius: 1.5,
                              textAlign: 'center',
                              fontSize: '0.82rem',
                              fontWeight: isSelected ? 700 : 500,
                              userSelect: 'none',
                              transition: 'all 0.15s',
                              cursor: isBooked ? 'not-allowed' : 'pointer',

                              // ── Available slot ──────────────
                              ...(isBooked ? {
                                bgcolor: '#f0ece8',
                                color: '#c2b8b0',
                                border: '1px solid #e5ddd7',
                              } : isSelected ? {
                                bgcolor: BROWN,
                                color: '#fff',
                                border: `2px solid ${BROWN}`,
                                boxShadow: '0 2px 8px rgba(107,63,31,0.25)',
                              } : {
                                bgcolor: '#fff',
                                color: '#3b1f0a',
                                border: `1px solid ${BORDER}`,
                                '&:hover': {
                                  borderColor: BROWN,
                                  bgcolor: '#fdf6f0',
                                  color: BROWN,
                                },
                              }),
                            }}
                          >
                            {slot.time}
                            {isBooked && (
                              <Typography
                                variant="caption"
                                sx={{ display: 'block', fontSize: '0.6rem', color: '#c2b8b0', lineHeight: 1, mt: 0.3 }}
                              >
                                Booked
                              </Typography>
                            )}
                          </Box>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {selectedSlot && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fdf6f0', borderRadius: 2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: BROWN, fontSize: 18 }} />
                  <Typography sx={{ color: BROWN, fontWeight: 600, fontSize: '0.88rem' }}>
                    Selected: {selectedSlot}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 3 — Confirm
      ═══════════════════════════════════════════════════ */}
      {activeStep === 3 && (
        <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER}`, boxShadow: 'none', maxWidth: 480 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#3b1f0a', mb: 2.5 }}>
            Confirm Appointment
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              ['Service',  selectedService?.name],
              ['Category', selectedService?.category],
              ['Barber',   selectedBarber?.name],
              ['Date',     selectedDate],
              ['Time',     selectedSlot],
              ['Duration', `${selectedService?.duration} min`],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: LIGHT_BROWN, fontSize: '0.9rem' }}>{label}</Typography>
                <Typography sx={{ fontWeight: 600, color: '#3b1f0a', fontSize: '0.9rem' }}>{val}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${BORDER}` }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Total</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: BROWN }}>${selectedService?.price}</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── Navigation buttons ───────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep(prev => prev - 1)}
          sx={{ color: LIGHT_BROWN, textTransform: 'none' }}
        >
          Back
        </Button>
        {activeStep < 3 ? (
          <Button variant="contained" onClick={handleNext}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none', px: 3 }}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleBook} disabled={submitting}
            sx={{ bgcolor: BROWN, '&:hover': { bgcolor: '#4e2e13' }, textTransform: 'none', px: 3 }}>
            {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirm Booking'}
          </Button>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default BookAppointment;
