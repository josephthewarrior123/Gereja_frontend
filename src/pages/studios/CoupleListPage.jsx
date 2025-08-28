import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    Button
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import CreateCoupleDialog from './CreateCoupleDialog';
import CustomDatatable from '../../reusables/CustomDataTable';

export default function CoupleListPage() {
    const { user } = useUser();
    const [allCouples, setAllCouples] = useState([]);
    const [filteredCouples, setFilteredCouples] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCouple, setSelectedCouple] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(5);
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

    // UPDATE fungsi getData dengan null checks:
const getData = async () => {
    try {
        loading.start();
        const couplesRef = ref(db, 'couples');
        onValue(couplesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedCouples = [];

            for (const coupleId in data) {
                const couple = data[coupleId];
                // Tambahkan null checks untuk semua property
                if (couple) {
                    const guestCount = couple.guests ? Object.keys(couple.guests).length : 0;
                    
                    loadedCouples.push({
                        id: coupleId,
                        name: couple.name || 'Unnamed Couple', // Fallback untuk undefined name
                        guestCount,
                        assignedAdmins: couple.assigned_admins || {}
                    });
                }
            }

            setAllCouples(loadedCouples);
            
            // Filter berdasarkan role user
            if (user?.role === 'admin') {
                const assignedCouples = loadedCouples.filter(couple => 
                    couple && couple.assignedAdmins && couple.assignedAdmins[user.id]
                );
                setFilteredCouples(assignedCouples);
            } else {
                // Superadmin bisa melihat semua
                setFilteredCouples(loadedCouples.filter(couple => couple !== null)); // Filter out null
            }
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
            const coupleId = selectedCouple.id;

            // Hapus couple dari database
            await remove(ref(db, `couples/${coupleId}`));
            
            message('Couple deleted successfully', 'success');
            getData();
        } catch (error) {
            console.error('Error deleting couple:', error);
            message('Failed to delete couple', 'error');
        } finally {
            loading.stop();
            closeDeleteDialog();
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(0);
    };

    const handleSort = (columnKey) => {
        const isAsc = sortColumn === columnKey && sortDirection === 'asc';
        setSortDirection(isAsc ? 'desc' : 'asc');
        setSortColumn(columnKey);
    };

    const handleRowClick = (row) => {
        navigate(`/couples/${row.id}`);
    };

    const getRowStyle = (row) => {
        return {
            cursor: 'pointer'
        };
    };

    // Sort data berdasarkan kolom dan arah yang dipilih
    // GANTI fungsi sortedData dengan ini:
const sortedData = [...filteredCouples].sort((a, b) => {
    if (sortColumn === 'name') {
        const nameA = a.name || ''; // Fallback untuk undefined
        const nameB = b.name || ''; // Fallback untuk undefined
        return sortDirection === 'asc' 
            ? nameA.localeCompare(nameB) 
            : nameB.localeCompare(nameA);
    } else if (sortColumn === 'guestCount') {
        const countA = a.guestCount || 0; // Fallback untuk undefined
        const countB = b.guestCount || 0; // Fallback untuk undefined
        return sortDirection === 'asc' 
            ? countA - countB 
            : countB - countA;
    }
    return 0;
});

    // Pagination
    const paginatedData = sortedData.slice(page * limit, page * limit + limit);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 640);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        getData();
    }, [user]); // Re-fetch ketika user berubah

    const columns = [
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Couple Name',
            width: '40%',
            sortable: true,
            render: (value) => value || 'Unnamed Couple' // Tambahkan fallback
        },
        {
            key: 'guestCount',
            dataIndex: 'guestCount',
            title: 'Guest Count',
            width: '20%',
            sortable: true,
            render: (value) => `${value || 0} guests` // Tambahkan fallback
        },
        {
            key: 'assignedAdmins',
            dataIndex: 'assignedAdmins',
            title: 'Assigned Admins',
            width: '30%',
            render: (value, row) => (
                user?.role === 'superadmin' ? (
                    Object.keys(value).length > 0
                        ? `Assigned to ${Object.keys(value).length} admin(s)`
                        : 'Not assigned to any admin'
                ) : null
            )
        },
        {
            key: 'actions',
            dataIndex: 'actions',
            title: 'Actions',
            width: '10%',
            render: (_, row) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/couples/${row.id}`);
                        }}
                    >
                        View
                    </Button>
                    {user?.role === 'superadmin' && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(row);
                            }}
                            color="error"
                        >
                            <Icon icon="mdi:delete" />
                        </IconButton>
                    )}
                </Box>
            )
        }
    ];

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
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    alignItems: 'center', 
                    mb: 3 
                }}>
                    {user?.role === 'superadmin' && (
                        <Button
                            variant="contained"
                            startIcon={<Icon icon="mdi:plus" />}
                            onClick={() => setIsDialogOpen(true)}
                        >
                            New Couple
                        </Button>
                    )}
                </Box>

                <CustomDatatable
                    dataSource={paginatedData}
                    columns={columns}
                    page={page}
                    limit={limit}
                    totalRecords={filteredCouples.length}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    handleSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onRowClick={handleRowClick}
                    getRowStyle={getRowStyle}
                />
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