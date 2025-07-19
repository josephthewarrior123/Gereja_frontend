import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
    LinearProgress,
    TextField,
    MenuItem,
    Stack,
    Tooltip
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { CustomButton, CustomSelect } from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CoupleManagePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();
    
    const [couple, setCouple] = useState({
        name: '',
        guests: []
    });
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [guestToDelete, setGuestToDelete] = useState(null);
    const [openAddGuestDialog, setOpenAddGuestDialog] = useState(false);
    const [openEditGuestDialog, setOpenEditGuestDialog] = useState(false);
    const [currentGuest, setCurrentGuest] = useState(null);
    const [newGuestName, setNewGuestName] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchKeyword, setSearchKeyword] = useState('');

    // Status options for filtering
    const statusOptions = [
        { value: 'ALL', label: 'All Status' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'ACCEPTED', label: 'Accepted' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    // Fetch couple data from Firebase
    const fetchCoupleData = async () => {
        try {
            loading.start();
            const coupleRef = ref(db, `couples/${id}`);
            onValue(coupleRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const guests = data.guests ? Object.entries(data.guests).map(([id, guest]) => ({ 
                        id, 
                        ...guest 
                    })) : [];
                    setCouple({
                        name: data.name,
                        guests: guests
                    });
                }
            });
        } catch (error) {
            console.error('Error fetching couple data:', error);
            message('Failed to fetch couple data', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => {
        if (id) {
            fetchCoupleData();
        }
    }, [id]);

    // Filter guests based on status and search keyword
    const filteredGuests = couple.guests.filter(guest => {
        const matchesStatus = filterStatus === 'ALL' || guest.status === filterStatus;
        const matchesSearch = guest.name.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Calculate statistics
    const totalGuests = couple.guests.length;
    const acceptedGuests = couple.guests.filter(g => g.status === 'ACCEPTED').length;
    const pendingGuests = couple.guests.filter(g => g.status === 'PENDING').length;
    const rejectedGuests = couple.guests.filter(g => g.status === 'REJECTED').length;

    const acceptancePercentage = totalGuests > 0 ? (acceptedGuests / totalGuests) * 100 : 0;

    // Handle guest deletion
    const handleDeleteGuest = async (guestId) => {
        try {
            loading.start();
            await remove(ref(db, `couples/${id}/guests/${guestId}`));
            message('Guest removed successfully', 'success');
            fetchCoupleData();
        } catch (error) {
            console.error('Error deleting guest:', error);
            message('Failed to delete guest', 'error');
        } finally {
            loading.stop();
        }
    };

    // Handle adding new guest
    const handleAddGuest = async () => {
        if (!newGuestName.trim()) {
            message('Please enter a guest name', 'error');
            return;
        }

        try {
            loading.start();
            const newGuestId = `guest_${Date.now()}`;
            const newGuest = {
                name: newGuestName.trim(),
                code: `G${Math.floor(1000 + Math.random() * 9000)}`,
                status: 'PENDING',
                addedAt: new Date().toISOString()
            };

            await update(ref(db, `couples/${id}/guests/${newGuestId}`), newGuest);
            message('Guest added successfully', 'success');
            setNewGuestName('');
            setOpenAddGuestDialog(false);
        } catch (error) {
            console.error('Error adding guest:', error);
            message('Failed to add guest', 'error');
        } finally {
            loading.stop();
        }
    };

    // Handle editing guest
    const handleEditGuest = async () => {
        if (!newGuestName.trim()) {
            message('Please enter a guest name', 'error');
            return;
        }

        try {
            loading.start();
            await update(ref(db, `couples/${id}/guests/${currentGuest.id}`), {
                ...currentGuest,
                name: newGuestName.trim()
            });
            message('Guest updated successfully', 'success');
            setOpenEditGuestDialog(false);
        } catch (error) {
            console.error('Error updating guest:', error);
            message('Failed to update guest', 'error');
        } finally {
            loading.stop();
        }
    };

    const openEditDialog = (guest) => {
        setCurrentGuest(guest);
        setNewGuestName(guest.name);
        setOpenEditGuestDialog(true);
    };

    return (
        <>
            <CustomColumn className={'gap-y-8 max-h-full'}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/couples')}>
                        <Icon icon="heroicons:arrow-left" />
                    </IconButton>
                    <Typography variant="h4" fontWeight="bold">
                        {couple.name}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Icon icon="mdi:plus" />}
                        onClick={() => setOpenAddGuestDialog(true)}
                        sx={{ ml: 'auto' }}
                    >
                        Add Guest
                    </Button>
                </Box>

                {/* Statistics Section */}
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {/* Total Guests Card */}
                    <Box sx={{ 
                        p: 3, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        flex: 1,
                        minWidth: 200
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Total Guests
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {totalGuests}
                        </Typography>
                    </Box>

                    {/* Accepted Guests Card */}
                    <Box sx={{ 
                        p: 3, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        flex: 1,
                        minWidth: 200
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Accepted
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                            {acceptedGuests}
                        </Typography>
                    </Box>

                    {/* Pending Guests Card */}
                    <Box sx={{ 
                        p: 3, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        flex: 1,
                        minWidth: 200
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Pending
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                            {pendingGuests}
                        </Typography>
                    </Box>

                    {/* Rejected Guests Card */}
                    <Box sx={{ 
                        p: 3, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        flex: 1,
                        minWidth: 200
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Rejected
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="error.main">
                            {rejectedGuests}
                        </Typography>
                    </Box>
                </Box>

                {/* Acceptance Progress */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Acceptance Rate
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress
                            variant="determinate"
                            value={acceptancePercentage}
                            sx={{ 
                                height: 10,
                                borderRadius: 5,
                                flex: 1,
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#4CAF50'
                                }
                            }}
                        />
                        <Typography variant="body1" fontWeight="bold">
                            {Math.round(acceptancePercentage)}%
                        </Typography>
                    </Box>
                </Box>

                {/* Filter Section */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search guests..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <Icon icon="mdi:magnify" style={{ marginRight: 8 }} />
                            )
                        }}
                    />
                    <CustomSelect
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        sx={{ minWidth: 180 }}
                    >
                        {statusOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </CustomSelect>
                </Box>

                {/* Guests List */}
                <Box sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    overflow: 'hidden',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <List sx={{ overflowY: 'auto', flex: 1 }}>
                        {filteredGuests.map(guest => (
                            <ListItem
                                key={guest.id}
                                divider
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                                secondaryAction={
                                    <Box>
                                        <Tooltip title="Edit">
                                            <IconButton 
                                                edge="end" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditDialog(guest);
                                                }}
                                                sx={{ mr: 1 }}
                                            >
                                                <Icon icon="mdi:pencil" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                                edge="end" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setGuestToDelete(guest);
                                                    setOpenDeleteDialog(true);
                                                }}
                                            >
                                                <Icon icon="mdi:delete" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={guest.name}
                                    secondary={
                                        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                                            <Chip 
                                                label={guest.code} 
                                                size="small" 
                                                variant="outlined"
                                            />
                                            <Chip 
                                                label={guest.status}
                                                size="small"
                                                color={
                                                    guest.status === 'ACCEPTED' ? 'success' :
                                                    guest.status === 'PENDING' ? 'warning' : 'error'
                                                }
                                            />
                                            {guest.addedAt && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Added: {dayjs(guest.addedAt).format('DD MMM YYYY')}
                                                </Typography>
                                            )}
                                        </Stack>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </CustomColumn>

            {/* Add Guest Dialog */}
            <Dialog open={openAddGuestDialog} onClose={() => setOpenAddGuestDialog(false)}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Add New Guest
                    </Typography>
                    <TextField
                        fullWidth
                        label="Guest Name"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        margin="normal"
                        autoFocus
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setOpenAddGuestDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleAddGuest}
                        >
                            Add Guest
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* Edit Guest Dialog */}
            <Dialog open={openEditGuestDialog} onClose={() => setOpenEditGuestDialog(false)}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Edit Guest
                    </Typography>
                    <TextField
                        fullWidth
                        label="Guest Name"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        margin="normal"
                        autoFocus
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setOpenEditGuestDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleEditGuest}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Confirm Delete
                    </Typography>
                    <Typography>
                        Are you sure you want to remove <b>{guestToDelete?.name}</b> from the guest list?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setOpenDeleteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={() => {
                                handleDeleteGuest(guestToDelete?.id);
                                setOpenDeleteDialog(false);
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}