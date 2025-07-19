import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    List,
    ListItem,
    ListItemText,
    Button
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ref, onValue, remove } from 'firebase/database'; // Tambahkan remove di sini
import { db } from '../../config/firebaseConfig';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CreateCoupleDialog from './CreateCoupleDialog';

export default function CoupleListPage() {
    const [couples, setCouples] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCouple, setSelectedCouple] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

    const getData = async () => {
        try {
            loading.start();
            const couplesRef = ref(db, 'couples');
            onValue(couplesRef, (snapshot) => {
                const data = snapshot.val();
                const loadedCouples = [];

                for (const coupleId in data) {
                    const couple = data[coupleId];
                    const guestCount = couple.guests ? Object.keys(couple.guests).length : 0;
                    
                    loadedCouples.push({
                        id: coupleId,
                        name: couple.name,
                        guestCount
                    });
                }

                setCouples(loadedCouples);
            });
        } catch (error) {
            console.error('Error fetching couples:', error);
            message('Failed to fetch couples', 'error');
        } finally {
            loading.stop();
        }
    };

    const openDeleteDialog = (couple) => {
        setSelectedCouple(couple);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setSelectedCouple(null);
    };

    const handleDeleteCouple = async () => {
        try {
            loading.start();
            // Hapus data dari Firebase
            await remove(ref(db, `couples/${selectedCouple.id}`));
            message('Couple deleted successfully', 'success');
            getData(); // Refresh data setelah delete
        } catch (error) {
            console.error('Error deleting couple:', error);
            message('Failed to delete couple', 'error');
        } finally {
            loading.stop();
            closeDeleteDialog();
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 640);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        getData();
    }, []);

    if (isMobile) {
        return (
            <Box className="flex justify-center items-center h-screen">
                <Typography variant="h5" fontWeight="bold">
                    Please open in your PC
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Couples List</Typography>
                    <Button
                        variant="contained"
                        startIcon={<Icon icon="mdi:plus" />}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        New Couple
                    </Button>
                </Box>

                <List sx={{ bgcolor: 'background.paper' }}>
                    {couples.map((couple) => (
                        <ListItem
                            key={couple.id}
                            secondaryAction={
                                <IconButton 
                                    edge="end" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteDialog(couple);
                                    }}
                                >
                                    <Icon icon="mdi:delete" />
                                </IconButton>
                            }
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                            <ListItemText
                                primary={couple.name}
                                secondary={`${couple.guestCount} guests`}
                            />
                            <Button
                                variant="outlined"
                                color="primary"
                                sx={{ mr: 2 }}
                                onClick={() => navigate(`/couples/${couple.id}`)}
                            >
                                View Guests
                            </Button>
                        </ListItem>
                    ))}
                </List>
            </Box>

            <CreateCoupleDialog
                open={isDialogOpen}
                onClose={(refresh) => {
                    setIsDialogOpen(false);
                    if (refresh) getData();
                }}
            />

            <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Confirm Delete</Typography>
                        <IconButton onClick={closeDeleteDialog}>
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography>
                            Are you sure you want to delete <b>{selectedCouple?.name}</b> and all their guests?
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                            <Button variant="outlined" onClick={closeDeleteDialog}>
                                Cancel
                            </Button>
                            <Button 
                                variant="contained" 
                                color="error" 
                                onClick={handleDeleteCouple}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}