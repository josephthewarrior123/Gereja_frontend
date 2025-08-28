// DirectCheckInModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    Chip
} from '@mui/material';
import { Icon } from '@iconify/react';

const DirectCheckInModal = ({ open, onClose, onCheckIn, guest }) => {
    const [paxCount, setPaxCount] = useState(1);

    // Reset pax count ketika guest berubah atau modal dibuka
    useEffect(() => {
        if (guest) {
            setPaxCount(guest.pax || 1);
        } else {
            setPaxCount(1);
        }
    }, [guest, open]);

    const handleSubmit = () => {
        if (paxCount >= 1) {
            onCheckIn(paxCount);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:login" />
                    <Typography variant="h6">
                        {guest ? `Check-In: ${guest.name}` : 'Direct Check-In'}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                {/* Detail Guest Information */}
                {guest && (
                    <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            Detail Tamu:
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {guest.name || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>Code:</strong> {guest.code || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>Status:</strong> {' '}
                                    <Chip 
                                        label={guest.status || 'PENDING'} 
                                        size="small"
                                        color={
                                            guest.status === 'checked-in' ? 'success' :
                                            guest.status === 'ACCEPTED' ? 'primary' :
                                            'default'
                                        }
                                    />
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>Gift:</strong> {' '}
                                    {guest.gift ? (
                                        <Chip 
                                            icon={<Icon icon="mdi:gift" />}
                                            label="Yes"
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Chip 
                                            label="No"
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {guest 
                        ? `Masukkan jumlah tamu yang dibawa oleh ${guest.name} untuk check-in.`
                        : 'Masukkan jumlah tamu yang akan check-in langsung tanpa undangan.'
                    }
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Jumlah Tamu (Pax)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={paxCount}
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= 20) {
                            setPaxCount(value);
                        } else if (e.target.value === '') {
                            setPaxCount(1);
                        }
                    }}
                    inputProps={{ 
                        min: 1, 
                        max: 20,
                        step: 1
                    }}
                    helperText="Masukkan jumlah tamu (1-20 orang)"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Batal
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    startIcon={<Icon icon="mdi:login" />}
                >
                    Check-In
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DirectCheckInModal;