// CoupleManagePage.jsx
import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    Chip,
    Button,
    LinearProgress,
    TextField,
    MenuItem,
    Stack,
    Tooltip,
    Grid,
    Checkbox
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { CustomButton, CustomSelect } from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';
import CustomDatatable from '../../reusables/CustomDataTable';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import * as XLSX from 'xlsx';
import InvitationLinkGenerator from './InvitationLinkGenerator';
import DirectCheckInModal from './DirectCheckInModal'; // Import komponen modal baru

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
    const [newGuestPax, setNewGuestPax] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [openDirectCheckIn, setOpenDirectCheckIn] = useState(false); // State untuk modal direct check-in
    const [selectedGuestForCheckIn, setSelectedGuestForCheckIn] = useState(null); // State untuk tamu yang akan di-check-in
    
    // Table state
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    
    const isGuestNameExists = (name) => {
        return couple.guests.some(
            guest => guest && guest.name && guest.name.toLowerCase() === name.toLowerCase()
        );
    };

    // Fungsi untuk membuat ID alfanumerik bersih
    const createCleanId = (str) => {
        const alphanumericOnly = str
            .toLowerCase()
            .replace(/&/g, 'dan')
            .replace(/[^a-z0-9]/g, ''); // Hanya menyisakan huruf dan angka
        
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Angka acak 4 digit
        
        return `${alphanumericOnly}${randomSuffix}`;
    };

    // Status options for filtering - UPDATE STATUS OPTIONS
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'ACCEPTED', label: 'Accepted' },
        { value: 'checked-in', label: 'Checked In' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    const handleDownloadExcel = () => {
        try {
            // Tanyakan user mau pake base URL apa
            const baseUrl = prompt(
                'Enter the base URL for invitation links:\n\nContoh: https://your-wedding-site.com/invitation?code=',
                'https://wedding-template1-topaz.vercel.app/intro?to='
            );
            
            if (baseUrl === null) return; // User cancel
    
            // Data yang akan di-export
            const dataToExport = filteredGuests.map(guest => ({
                'Guest Name': guest.name,
                'Code': guest.code,
                'Status': guest.status,
                'Pax': guest.pax || '-',
                'Gift': guest.gift ? 'Yes' : 'No',
                'Invitation Link': `${baseUrl}${id}_${guest.code}`
            }));
    
            if (dataToExport.length === 0) {
                message('No data to export', 'warning');
                return;
            }
    
            // Buat worksheet
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            
            // Buat workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Guests');
            
            // Download file
            const fileName = `${couple.name}_Guests_${dayjs().format('YYYY-MM-DD')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            message('Excel file downloaded successfully', 'success');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            message('Failed to export Excel file', 'error');
        }
    };

    // Fetch couple data from Firebase
    const fetchCoupleData = async () => {
        try {
            loading.start();
            const coupleRef = ref(db, `couples/${id}`);
            onValue(coupleRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const guests = data.guests ? Object.entries(data.guests)
                        .map(([id, guest]) => ({ 
                            id, 
                            ...(guest || {}) // Tambahkan fallback untuk guest yang null
                        }))
                        .filter(guest => guest !== null) : []; // Filter out null guests
                    
                    setCouple({
                        name: data.name || '',
                        guests: guests
                    });
                } else {
                    setCouple({
                        name: '',
                        guests: []
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

    const filteredGuests = couple.guests.filter(guest => {
        if (!guest) return false; // Tambahkan check untuk guest yang undefined
        
        const matchesStatus = filterStatus === 'all' || guest.status === filterStatus;
        const matchesSearch = guest.name && guest.name.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchesStatus && matchesSearch;
    });

   // GANTI fungsi sortedGuests dengan ini:
const sortedGuests = [...filteredGuests].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortColumn === 'name') {
        return (a.name || '').localeCompare(b.name || '') * modifier;
    } else if (sortColumn === 'status') {
        return (a.status || '').localeCompare(b.status || '') * modifier;
    } else if (sortColumn === 'pax') {
        return ((a.pax || 0) - (b.pax || 0)) * modifier;
    } else if (sortColumn === 'addedAt') {
        const dateA = a.addedAt ? new Date(a.addedAt) : new Date(0);
        const dateB = b.addedAt ? new Date(b.addedAt) : new Date(0);
        return (dateA - dateB) * modifier;
    }
    
    return 0;
});

    // Paginate guests
    const paginatedGuests = sortedGuests.slice(page * limit, page * limit + limit);

    // Calculate statistics - UPDATE CALCULATION
    const totalGuests = couple.guests ? couple.guests.length : 0;
const checkedInGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'checked-in').length : 0;
const acceptedGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'ACCEPTED').length : 0;
const rejectedGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'REJECTED').length : 0;
const giftedGuests = couple.guests ? couple.guests.filter(g => g && g.gift).length : 0;

    const checkInPercentage = totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0;

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

    // Handle adding new guest - UPDATE DEFAULT STATUS
    const handleAddGuest = async () => {
        const trimmedName = newGuestName.trim();
        
        if (!trimmedName) {
          message('Please enter a guest name', 'error');
          return;
        }
      
        if (isGuestNameExists(trimmedName)) {
          message('Guest with this name already exists', 'error');
          return;
        }
      
        try {
          loading.start();
          const newGuestId = createCleanId(trimmedName);
          const newGuest = {
            name: trimmedName,
            code: `G${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'PENDING', // DEFAULT STATUS JADI ACCEPTED
            addedAt: new Date().toISOString(),
            ...(newGuestPax && { pax: newGuestPax })
          };
      
          await update(ref(db, `couples/${id}/guests/${newGuestId}`), newGuest);
          message('Guest added successfully', 'success');
          setNewGuestName('');
          setNewGuestPax('');
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
                name: newGuestName.trim(),
                ...(newGuestPax && { pax: newGuestPax })
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

    // Handle gift status toggle
    const handleGiftToggle = async (guest) => {
        try {
            loading.start();
            await update(ref(db, `couples/${id}/guests/${guest.id}`), {
                ...guest,
                gift: !guest.gift,
                giftUpdatedAt: new Date().toISOString()
            });
            message(`Gift status ${!guest.gift ? 'marked' : 'unmarked'} successfully`, 'success');
            fetchCoupleData();
        } catch (error) {
            console.error('Error updating gift status:', error);
            message('Failed to update gift status', 'error');
        } finally {
            loading.stop();
        }
    };

    // Handle direct check-in untuk tamu yang sudah ada
    const handleDirectCheckIn = async (guest, paxCount) => {
        try {
            loading.start();
            
            // Update status tamu menjadi checked-in dan update pax jika diberikan
            await update(ref(db, `couples/${id}/guests/${guest.id}`), {
                ...guest,
                status: 'checked-in',
                pax: paxCount || guest.pax || 1, // Gunakan paxCount jika diberikan, jika tidak gunakan yang ada atau default 1
                checkedInAt: new Date().toISOString()
            });
            
            message(`${guest.name} checked in successfully`, 'success');
            setOpenDirectCheckIn(false);
            fetchCoupleData();
        } catch (error) {
            console.error('Error with direct check-in:', error);
            message('Failed to process direct check-in', 'error');
        } finally {
            loading.stop();
        }
    };

    // Fungsi untuk membuka modal direct check-in untuk tamu tertentu
    const openDirectCheckInModal = (guest) => {
        setSelectedGuestForCheckIn(guest);
        setOpenDirectCheckIn(true);
    };

    const openEditDialog = (guest) => {
        setCurrentGuest(guest);
        setNewGuestName(guest.name);
        setNewGuestPax(guest.pax || '');
        setOpenEditGuestDialog(true);
    };

    // Handle table sorting
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Handle limit change
    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(0);
    };


    // Table columns configuration
   // Table columns configuration - TAMBAHKAN KOLOM BARU SETELAH ACTIONS
const columns = [
    {
        key: 'name',
        dataIndex: 'name',
        title: 'Guest Name',
        sortable: true,
        width: '20%',
        render: (value) => value || '-' // Tambahkan fallback
    },
    {
        key: 'code',
        dataIndex: 'code',
        title: 'Code',
        sortable: false,
        width: '15%',
        render: (value) => (
            <Chip 
                label={value} 
                size="small" 
                variant="outlined"
            />
        )
    },
    {
        key: 'status',
        dataIndex: 'status',
        title: 'Status',
        sortable: true,
        width: '15%',
        render: (value) => value ? (
            <Chip 
                label={value}
                size="small"
                color={
                    value === 'checked-in' ? 'success' :
                    value === 'ACCEPTED' ? 'primary' :
                    'error'
                }
            />
        ) : '-' // Tambahkan fallback
    },
    {
        key: 'pax',
        dataIndex: 'pax',
        title: 'Pax',
        sortable: true,
        width: '10%',
        render: (value) => value ? (
            <Chip 
                label={`${value} Pax`}
                size="small"
                variant="outlined"
                sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    borderColor: '#2196f3',
                    fontWeight: 'bold'
                }}
            />
        ) : '-'
    },
    {
        key: 'gift',
        dataIndex: 'gift',
        title: 'Gift',
        sortable: true,
        width: '10%',
        render: (value) => value ? (
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
        )
    },
    {
        key: 'actions',
        dataIndex: 'id',
        title: 'Actions',
        sortable: false,
        width: '20%',
        render: (value, row) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={row.gift ? "Unmark Gift" : "Mark Gift"}>
                    <Checkbox
                        checked={row.gift || false}
                        onChange={() => handleGiftToggle(row)}
                        icon={<Icon icon="mdi:gift-outline" />}
                        checkedIcon={<Icon icon="mdi:gift" />}
                        color="success"
                        sx={{ mr: 1 }}
                    />
                </Tooltip>
                <Tooltip title="Edit">
                    <IconButton 
                        edge="end" 
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(row);
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
                            setGuestToDelete(row);
                            setOpenDeleteDialog(true);
                        }}
                    >
                        <Icon icon="mdi:delete" />
                    </IconButton>
                </Tooltip>
            </Box>
        )
    },
    // KOLOM BARU: DIRECT CHECK-IN
    {
        key: 'directCheckIn',
        dataIndex: 'id',
        title: 'Check-In',
        sortable: false,
        width: '10%',
        render: (value, row) => (
            <Tooltip title={row.status === 'checked-in' ? "Already checked in" : "Direct Check-In"}>
                <span> {/* Wrapper untuk handle disabled state */}
                    <IconButton 
                        edge="end" 
                        onClick={(e) => {
                            if (row.status !== 'checked-in') {
                                e.stopPropagation();
                                openDirectCheckInModal(row);
                            }
                        }}
                        sx={{ 
                            color: row.status === 'checked-in' ? 'text.disabled' : 'success.main',
                            '&:hover': {
                                backgroundColor: row.status === 'checked-in' ? 'transparent' : 'rgba(76, 175, 80, 0.1)'
                            }
                        }}
                        disabled={row.status === 'checked-in'}
                    >
                        <Icon icon={row.status === 'checked-in' ? "mdi:check-circle" : "mdi:login"} />
                    </IconButton>
                </span>
            </Tooltip>
        )
    }
];

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
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <InvitationLinkGenerator 
                        couple={{ id, guests: couple.guests, name: couple.name }} 
                        disabled={couple.guests.length === 0}
                    />
                        <CustomButton
                            variant="contained"
                            startIcon={<Icon icon="mdi:plus" />}
                            onClick={() => setOpenAddGuestDialog(true)}
                        >
                            Add Guest
                        </CustomButton>
                    </Box>
                </Box>

                {/* Statistics Section - UPDATE CARDS */}
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

                    {/* Checked In Guests Card */}
                    <Box sx={{ 
                        p: 3, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        flex: 1,
                        minWidth: 200
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Checked In
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                            {checkedInGuests}
                        </Typography>
                    </Box>

                    {/* Accepted Guests Card - UBAH DARI PENDING KE ACCEPTED */}
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
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                            {acceptedGuests}
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

                    {/* Gifted Guests Card */}
                    <Box sx={{ 
                        p: 3, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        flex: 1,
                        minWidth: 200
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Gift Received
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                            {giftedGuests}
                        </Typography>
                    </Box>
                </Box>

                {/* Check In Progress */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Check In Rate
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress
                            variant="determinate"
                            value={checkInPercentage}
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
                            {Math.round(checkInPercentage)}%
                        </Typography>
                    </Box>
                </Box>

                {/* Filter Section */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        gap: 2,
                        width: "100%",
                    }}
                >
                    {/* Search Field */}
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Search guests..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        sx={{
                            width: "100%",
                            maxWidth: 300,
                            "& .MuiOutlinedInput-root": {
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                                    <Icon icon="mdi:magnify" style={{ fontSize: 20 }} />
                                </Box>
                            ),
                        }}
                    />

                    {/* Filter + Export */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <CustomSelect
                            size="small"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            sx={{
                                minWidth: 180,
                                height: 40,
                                "& .MuiOutlinedInput-root": {
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                },
                                "& .MuiSelect-select": {
                                    display: "flex",
                                    alignItems: "center",
                                    height: "100%",
                                    paddingY: 0,
                                },
                            }}
                        >
                            {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </CustomSelect>

                        <CustomButton
                            variant="outlined"
                            startIcon={<Icon icon="mdi:file-excel" />}
                            onClick={handleDownloadExcel}
                            sx={{ height: 40, top: '4px' }}
                        >
                           download guests
                        </CustomButton>
                    </Box>
                </Box>

                {/* Guests Table */}
                <CustomDatatable
                    dataSource={paginatedGuests}
                    columns={columns}
                    page={page}
                    limit={limit}
                    totalRecords={filteredGuests.length}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    handleSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                />
            </CustomColumn>

            {/* Direct Check-In Modal */}
            <DirectCheckInModal
                open={openDirectCheckIn}
                onClose={() => {
                    setOpenDirectCheckIn(false);
                    setSelectedGuestForCheckIn(null);
                }}
                onCheckIn={(paxCount) => handleDirectCheckIn(selectedGuestForCheckIn, paxCount)}
                guest={selectedGuestForCheckIn}
            />

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
                        error={newGuestName.trim() && isGuestNameExists(newGuestName.trim())}
                        helperText={
                            newGuestName.trim() && isGuestNameExists(newGuestName.trim())
                            ? 'Guest with this name already exists'
                            : ''
                        }
                    />
                    <TextField
                        fullWidth
                        label="Pax (Jumlah Tamu)"
                        type="number"
                        value={newGuestPax}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (value >= 1 && value <= 10)) {
                                setNewGuestPax(value);
                            }
                        }}
                        margin="normal"
                        inputProps={{ min: 1, max: 10 }}
                        helperText="Kosongkan jika tidak ada"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <CustomButton 
                            variant="outlined" 
                            onClick={() => setOpenAddGuestDialog(false)}
                        >
                            Cancel
                        </CustomButton>
                        <CustomButton 
                            variant="contained" 
                            color="primary" 
                            onClick={handleAddGuest}
                            disabled={!newGuestName.trim() || isGuestNameExists(newGuestName.trim())}
                        >
                            Add Guest
                        </CustomButton>
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
                    <TextField
                        fullWidth
                        label="Pax (Jumlah Tamu)"
                        type="number"
                        value={newGuestPax}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (value >= 1 && value <= 10)) {
                                setNewGuestPax(value);
                            }
                        }}
                        margin="normal"
                        inputProps={{ min: 1, max: 10 }}
                        helperText="Kosongkan jika tidak ada"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <CustomButton 
                            variant="outlined" 
                            onClick={() => setOpenEditGuestDialog(false)}
                        >
                            Cancel
                        </CustomButton>
                        <CustomButton 
                            variant="contained" 
                            color="primary" 
                            onClick={handleEditGuest}
                        >
                            Save Changes
                        </CustomButton>
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
                        <CustomButton 
                            variant="outlined" 
                            onClick={() => setOpenDeleteDialog(false)}
                        >
                            Cancel
                        </CustomButton>
                        <CustomButton 
                            variant="contained" 
                            color="error" 
                            onClick={() => {
                                handleDeleteGuest(guestToDelete?.id);
                                setOpenDeleteDialog(false);
                            }}
                        >
                            Delete
                        </CustomButton>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}