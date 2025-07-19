import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, FormControl, InputLabel, Typography, IconButton, Stack, Alert } from '@mui/material';
import { Icon } from '@iconify/react';
import StudioSeatDao from '../../daos/StudioSeatDao';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import InvitationDAO from '../../daos/InvitationDAO';
import { CustomButton } from '../../reusables';


export default function ManageSeatModal({ open, onClose, studioId, refreshSeats, selectedShowId }) {
    const [seats, setSeats] = useState([]);
    // const [editSeatId, setEditSeatId] = useState(null);
    // const [seatData, setSeatData] = useState({
    //     name: '',
    //     type: '',
    // });
    const [messageText, setMessageText] = useState('');
    const [messageType, setMessageType] = useState('');
    const [seatConfigurations, setSeatConfigurations] = useState([]);
    const message = useAlert();
    const loading = useLoading();
    const [invitedGuests, setInvitedGuests] = useState(0);

    useEffect(() => {
        if (open && studioId) {
            setSeats([]);
            // setEditSeatId(null);
            // setSeatData({ name: '', type: '' });
            setMessageText('');
            setMessageType('');
            fetchSeats();
            fetchSeatConfigurations();
        }
    }, [open, studioId]);

    useEffect(() => {
        if (messageText) {
            const timer = setTimeout(() => {
                setMessageText('');
                setMessageType('');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [messageText]);

    const fetchSeats = async () => {
        try {
            loading.start();
            const response = await StudioSeatDao.getBySeatStudioId(studioId);
            setSeats(response);
        } catch (error) {
            console.error('Error fetching seats:', error);
            setMessageText(error?.message || 'Failed to fetch seats.');
            setMessageType('error');
        } finally {
            loading.stop();
        }
    };
    const fetchInvitedGuests = async () => {
        try {
            loading.start();
            const response = await InvitationDAO.getAll({
                studio_id: studioId,
                show_id: selectedShowId,
                status: 'INVITED,ACCEPTED',
            });
    
            const totalInvited = response.data.reduce((sum, item) => sum + item.quantity, 0);
            setInvitedGuests(totalInvited);
        } catch (error) {
            console.error('Error fetching invited guests:', error);
            setMessageText(error?.message || 'Failed to fetch invited guests.');
            setMessageType('error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => {
        if (open && studioId && selectedShowId) {
            fetchInvitedGuests();
        }
    }, [open, studioId, selectedShowId]);    

    const fetchSeatConfigurations = async () => {
        try {
            loading.start();
            const response = await StudioSeatDao.getBySeatStudioId(studioId);
            const configurations = transformSeatsToConfigurations(response);
            setSeatConfigurations(configurations);
        } catch (error) {
            console.error('Error fetching seat configurations:', error);
            setMessageText(error?.message || 'Failed to fetch seat configurations.');
            setMessageType('error');
        } finally {
            loading.stop();
        }
    };

    const transformSeatsToConfigurations = (seats) => {
        const configurations = [];
        const rowMap = new Map();

        seats.forEach(seat => {
            const row = seat.name.charAt(0);
            if (!rowMap.has(row)) {
                rowMap.set(row, {
                    rows: [row],
                    type: seat.type,
                    seatsPerRow: 1,
                });
            } else {
                const config = rowMap.get(row);
                config.seatsPerRow += 1;
            }
        });

        rowMap.forEach(config => {
            configurations.push(config);
        });

        return configurations;
    };

    // const handleEditClick = (seat) => {
    //     setEditSeatId(seat.id);
    //     setSeatData({
    //         name: seat.name,
    //         type: seat.type,
    //     });
    // };

    // const handleSave = async () => {
    //     try {
    //         loading.start();
    //         const seatToEdit = seats.find(seat => seat.id === editSeatId);

    //         if (seatData.type === 'VIP' && seatToEdit.type === 'NORMAL') {
    //             const invitationsUsingNormalSeat = await InvitationDAO.getAll({
    //                 studio_id: studioId,
    //                 show_id: selectedShowId,
    //                 type: 'NORMAL',
    //                 status: 'INVITED,ACCEPTED,CHECKED_IN',
    //             });

    //             if (invitationsUsingNormalSeat.data.length > 0) {
    //                 setMessageText('There are invitations using Normal seats. Please move them before changing the seat type.');
    //                 setMessageType('error');
    //                 return;
    //             }

    //             const currentSeats = await StudioSeatDao.getBySeatStudioId(studioId);
    //             const currentVipSeats = currentSeats.filter(seat => seat.type === 'VIP').length;

    //             if (currentVipSeats >= 2) {
    //                 setMessageText('Maximum VIP seats reached. Cannot change this seat to VIP.');
    //                 setMessageType('error');
    //                 return;
    //             }
    //         }

    //         const body = {
    //             name: seatData.name,
    //             type: seatData.type,
    //         };

    //         await StudioSeatDao.UpdateStudioSeat(editSeatId, body);
    //         setMessageText('Seat updated successfully!');
    //         setMessageType('success');
    //         fetchSeats();
    //         setEditSeatId(null);
    //     } catch (error) {
    //         console.error('Error updating seat:', error);
    //         setMessageText(error?.message || 'Failed to update seat.');
    //         setMessageType('error');
    //     } finally {
    //         loading.stop();
    //     }
    // };

   const handleSaveConfiguration = async () => {
    try {
        loading.start();

        // Hitung total kursi yang akan disimpan
        const totalSeats = seatConfigurations.reduce((sum, config) => sum + (config.rows.length * config.seatsPerRow), 0);

        // Jika total kursi kurang dari tamu yang diundang, tampilkan pesan error
        if (totalSeats < invitedGuests) {
            setMessageText(`Cannot reduce seats below ${invitedGuests} as there are invited or accepted guests.`);
            setMessageType('error');
            return;
        }

        const body = {
            studioId: parseInt(studioId),
            seats: seatConfigurations,
        };

        await StudioSeatDao.editSeatConfiguration(body);
        setMessageText('Seat configuration updated successfully!');
        setMessageType('success');
        fetchSeats();
    } catch (error) {
        console.error('Error updating seat configuration:', error);
        setMessageText(error?.message || 'Failed to update seat configuration.');
        setMessageType('error');
    } finally {
        loading.stop();
    }
};

    const addSeatConfiguration = () => {
        setSeatConfigurations([...seatConfigurations, { rows: [], type: 'VIP', seatsPerRow: 5 }]);
    };

    const removeSeatConfiguration = (index) => {
        const newConfigurations = seatConfigurations.filter((_, i) => i !== index);
        setSeatConfigurations(newConfigurations);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Manage Studio Seats</DialogTitle>
            <DialogContent>
                {messageText && (
                    <Alert severity={messageType} sx={{ mb: 2 }}>
                        {messageText}
                    </Alert>
                )}

                {/* Form untuk Edit Seat Configuration */}
                <div className="flex flex-col gap-4 mt-6">
                    <div className="typography-3">Edit Seat Configurations</div>

                    {(seatConfigurations || []).map((config, index) => (
                        <div key={index} className="border p-4 rounded-lg flex flex-col gap-2">
                            <div className="flex justify-between items-center mb-4">
                                <Typography variant="body1" fontWeight="bold">
                                    Configuration {index + 1}
                                </Typography>
                                <IconButton
                                    onClick={() => removeSeatConfiguration(index)}
                                    disabled={seatConfigurations.length === 1}
                                >
                                    <Icon icon="mdi:trash-can-outline" />
                                </IconButton>
                            </div>

                            {/* Input untuk Baris */}
                            <TextField
                                label="Rows"
                                value={config.rows.join(', ')}
                                onChange={(e) => {
                                    const rows = e.target.value
                                        .split(',')
                                        .map(row => row.trim());
                                    const newConfigurations = [...seatConfigurations];
                                    newConfigurations[index].rows = rows;
                                    setSeatConfigurations(newConfigurations);
                                }}
                                placeholder="Enter rows (e.g., A, B, C)"
                                fullWidth
                            />

                            {/* Input untuk Tipe Bangku */}
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={config.type}
                                    onChange={(e) => {
                                        const newConfigurations = [...seatConfigurations];
                                        newConfigurations[index].type = e.target.value;
                                        setSeatConfigurations(newConfigurations);
                                    }}
                                    label="Type"
                                >
                                    <MenuItem value="VIP">VIP</MenuItem>
                                    <MenuItem value="NORMAL">NORMAL</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Input untuk Jumlah Bangku per Baris */}
                            <TextField
                                label="Seats per Row"
                                value={config.seatsPerRow}
                                onChange={(e) => {
                                    const newConfigurations = [...seatConfigurations];
                                    newConfigurations[index].seatsPerRow = parseInt(e.target.value);
                                    setSeatConfigurations(newConfigurations);
                                }}
                                type="number"
                                fullWidth
                            />
                        </div>
                    ))}

                    {/* Tombol untuk Menambah Konfigurasi */}
                    <CustomButton
                        color="secondary"
                        onClick={addSeatConfiguration}
                        startIcon={<Icon icon="mdi:plus" />}
                    >
                        Add Seat Configuration
                    </CustomButton>
                </div>

                {/* List of Seats */}
                {/* {seats.map(seat => (
                    <Stack key={seat.id} direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        {editSeatId === seat.id ? (
                            <>
                                <TextField
                                    label="Name"
                                    value={seatData.name}
                                    onChange={(e) => setSeatData({ ...seatData, name: e.target.value })}
                                    size="small"
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={seatData.type}
                                        onChange={(e) => setSeatData({ ...seatData, type: e.target.value })}
                                        label="Type"
                                    >
                                        <MenuItem value="VIP">VIP</MenuItem>
                                        <MenuItem value="NORMAL">NORMAL</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button onClick={handleSave} color="primary">Save</Button>
                                <Button onClick={() => setEditSeatId(null)}>Cancel</Button>
                            </>
                        ) : (
                            <>
                                <Typography>{seat.name} - {seat.type}</Typography>
                                <IconButton onClick={() => handleEditClick(seat)}>
                                    <Icon icon="mdi:pencil-outline" />
                                </IconButton>
                            </>
                        )}
                    </Stack>
                ))} */}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button onClick={handleSaveConfiguration} color="primary">Save Configuration</Button>
            </DialogActions>
        </Dialog>
    );
}