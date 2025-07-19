import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Paper,
    Avatar,
    Box,
    useTheme,
    Slide,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { Icon } from '@iconify/react';
import InviteSeatDAO from '../../daos/InviteSeatDao'; // Sesuaikan path-nya
import StudioSeatDao from '../../daos/StudioSeatDao'; // Import StudioSeatDao
import { useLoading } from '../../hooks/LoadingProvider.jsx'; // Import useLoading

// Animasi untuk modal
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const DetailModal = ({ open, onClose, detail }) => {
    const theme = useTheme();
    const [seatData, setSeatData] = useState([]); // State untuk menyimpan data seat (array)
    const loading = useLoading(); // Gunakan useLoading

    // Ambil data seat berdasarkan invitationId saat modal dibuka atau detail berubah
    useEffect(() => {
        if (open && detail && detail.invitationId) { // Pastikan modal terbuka dan detail ada
            console.log("Detail Modal - Invitation ID:", detail.invitationId); // Debug
            const fetchSeatData = async () => {
                try {
                    loading.start(); // Mulai loading hanya di awal
                    console.log("Fetching seat data for invitationId:", detail.invitationId); // Debug
                    const inviteSeatsResponse = await InviteSeatDAO.getByInvitationId(detail.invitationId);
                    console.log("Invite seats response:", inviteSeatsResponse); // Debug

                    // Ambil name dari studio_seats untuk setiap seat_id
                    const seatsWithNames = await Promise.all(
                        inviteSeatsResponse.map(async (inviteSeat) => {
                            const studioSeatResponse = await StudioSeatDao.getBySeatId(inviteSeat.seat_id); // Ambil data studio_seats berdasarkan seat_id
                            return {
                                ...inviteSeat,
                                name: studioSeatResponse.name || `Seat ${inviteSeat.seat_id}`, // Gunakan name jika ada, jika tidak, gunakan seat_id
                            };
                        })
                    );

                    console.log("Seats with names:", seatsWithNames); // Debug
                    setSeatData(seatsWithNames); // Simpan data ke state
                } catch (error) {
                    console.error('Error fetching seat data:', error);
                    setSeatData([]); // Reset state jika error
                } finally {
                    loading.stop(); // Berhenti loading setelah selesai
                }
            };
            fetchSeatData();
        }
    }, [open, detail]); // Hanya jalankan saat `open` atau `detail` berubah

    if (!detail) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    color: theme.palette.text.primary,
                    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.2)',
                },
            }}
        >
            <DialogTitle
                sx={{
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#FFFFFF',
                    borderBottom: `1px solid rgba(0, 0, 0, 0.1)`,
                }}
            >
                <Icon icon="mdi:account" style={{ fontSize: '28px', color: theme.palette.primary.main }} />
                <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    Guest Details - {detail.premierName || 'Premier'}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ padding: '24px' }}>
                <Paper
                    elevation={0}
                    sx={{
                        padding: '24px',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                        boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.1)',
                        marginTop: '20px',
                    }}
                >
                    {/* Avatar Section */}
                    <Box display="flex" justifyContent="center" mb={3}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.primary.contrastText,
                                fontSize: '40px',
                                boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            {detail.name?.charAt(0).toUpperCase() || 'G'}
                        </Avatar>
                    </Box>

                    {/* Guest Name */}
                    <Typography
                        variant="h5"
                        align="center"
                        sx={{ marginBottom: '24px', fontWeight: 'bold', color: theme.palette.text.primary }}
                    >
                        {detail.name || 'Guest'}
                    </Typography>

                    {/* Details */}
                    <List>
                        <ListItem sx={{ paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Icon icon="mdi:email" style={{ fontSize: '24px', color: theme.palette.primary.main }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        <strong>Email:</strong> {detail.email || 'N/A'}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        <ListItem sx={{ paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Icon icon="mdi:phone" style={{ fontSize: '24px', color: theme.palette.primary.main }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        <strong>Phone:</strong> {detail.phone_number || 'N/A'}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        <ListItem sx={{ paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Icon icon="mdi:account-badge-outline" style={{ fontSize: '24px', color: theme.palette.primary.main }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        <strong>Type:</strong> {detail.type || 'N/A'}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        <ListItem sx={{ paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Icon
                                    icon="mdi:information"
                                    style={{ fontSize: '24px', color: theme.palette.primary.main }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box>
                                        <strong>Status:</strong>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, marginLeft: '8px', display: 'inline' }}>
                                            {detail.status || 'N/A'}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>

                        {/* Tambahan: Tampilkan semua seat */}
                        {seatData.length > 0 && (
                          <ListItem sx={{ paddingLeft: 0, display: 'flex', alignItems: 'center' }}>
                          {/* Ikon */}
                          <ListItemIcon sx={{ minWidth: '40px' }}>
                              <Icon icon="mdi:seat" style={{ fontSize: '24px', color: theme.palette.primary.main }} />
                          </ListItemIcon>
                      
                          {/* Teks "Seats:" dan daftar kursi dalam satu baris */}
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              {/* Teks "Seats:" */}
                              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                  <strong>Seats:</strong>
                              </Typography>
                      
                              {/* Daftar kursi (A1, A2, A4) */}
                              {seatData.map((seat, index) => (
                                  <Typography
                                      key={index}
                                      variant="body1"
                                      sx={{ color: theme.palette.text.secondary }}
                                  >
                                      {seat.name}
                                  </Typography>
                              ))}
                          </Box>
                      </ListItem>
                        )}
                    </List>
                </Paper>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px', borderTop: `1px solid rgba(0, 0, 0, 0.1)` }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        padding: '8px 24px',
                        '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                        },
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetailModal;