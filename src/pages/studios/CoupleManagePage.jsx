// CoupleManagePage.jsx
import { Icon } from '@iconify/react';
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  Chip,
  LinearProgress,
  TextField,
  MenuItem
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
import * as XLSX from 'xlsx';
import InvitationLinkGenerator from './InvitationLinkGenerator';
import DirectCheckInModal from './DirectCheckInModal';
import GuestTableModal from './GuestTableModal';
import StatisticCard from './StatisticCard';
import GuestDetailsModal from './GuestDetailsModal';

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
  const [newGuestType, setNewGuestType] = useState('regular');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openDirectCheckIn, setOpenDirectCheckIn] = useState(false);
  const [selectedGuestForCheckIn, setSelectedGuestForCheckIn] = useState(null);
  const [openTableModal, setOpenTableModal] = useState(false);
  const [checkInRateFilter, setCheckInRateFilter] = useState('all');
  
  // State untuk modal detail
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFilterFn, setModalFilterFn] = useState(() => () => true);
  
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

  const createCleanId = (str) => {
    const alphanumericOnly = str
      .toLowerCase()
      .replace(/&/g, 'dan')
      .replace(/[^a-z0-9]/g, '');
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    
    return `${alphanumericOnly}${randomSuffix}`;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'checked-in', label: 'Checked In' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PENDING', label: 'Pending' }
  ];

  // Options untuk filter tipe tamu
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'regular', label: 'Regular' },
    { value: 'vip', label: 'VIP' }
  ];

  // Options untuk filter check-in rate
  const checkInRateOptions = [
    { value: 'all', label: 'All Guests' },
    { value: 'vip', label: 'VIP Guests' },
    { value: 'regular', label: 'Regular Guests' }
  ];

  // Fungsi untuk menghitung total pax dari sekelompok tamu
  const calculateTotalPax = (guests) => {
    return guests.reduce((total, guest) => {
      return total + (parseInt(guest.pax) || 1);
    }, 0);
  };

  // Fungsi untuk membuka modal detail
  const openDetails = (title, filterFn) => {
    setModalTitle(title);
    setModalFilterFn(() => filterFn);
    setOpenDetailsModal(true);
  };

  const handleDownloadExcel = (coupleId, coupleName, guestsToExport) => {
    try {
      const baseUrl = prompt(
        'Enter the base URL for invitation links:\n\nContoh: https://your-wedding-site.com/invitation?code=',
        'https://wedding-template1-topaz.vercel.app/intro?to='
      );
      
      if (baseUrl === null) return;

      const dataToExport = guestsToExport.map(guest => ({
        'Guest Name': guest.name,
        'Code': guest.code,
        'Type': guest.type || 'regular',
        'Status': guest.status,
        'Pax': guest.pax || '-',
        'Gift': guest.gift ? 'Yes' : 'No',
        'Invitation Link': `${baseUrl}${coupleId}_${guest.code}`
      }));

      if (dataToExport.length === 0) {
        message('No data to export', 'warning');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Guests');
      
      const fileName = `${coupleName}_Guests_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message('Excel file downloaded successfully', 'success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      message('Failed to export Excel file', 'error');
    }
  };

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
              ...(guest || {}),
              type: guest.type || 'regular'
            }))
            .filter(guest => guest !== null) : [];
          
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
    if (!guest) return false;
    
    const matchesStatus = filterStatus === 'all' || guest.status === filterStatus;
    const matchesType = filterType === 'all' || (guest.type || 'regular') === filterType;
    const matchesSearch = guest.name && guest.name.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const sortedGuests = [...filteredGuests].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortColumn === 'name') {
      return (a.name || '').localeCompare(b.name || '') * modifier;
    } else if (sortColumn === 'status') {
      return (a.status || '').localeCompare(b.status || '') * modifier;
    } else if (sortColumn === 'type') {
      return ((a.type || 'regular').localeCompare(b.type || 'regular')) * modifier;
    } else if (sortColumn === 'pax') {
      return ((a.pax || 0) - (b.pax || 0)) * modifier;
    } else if (sortColumn === 'addedAt') {
      const dateA = a.addedAt ? new Date(a.addedAt) : new Date(0);
      const dateB = b.addedAt ? new Date(b.addedAt) : new Date(0);
      return (dateA - dateB) * modifier;
    }
    
    return 0;
  });

  const paginatedGuests = sortedGuests.slice(page * limit, page * limit + limit);

  // Hitung statistik lengkap
  const totalGuests = couple.guests ? couple.guests.length : 0;
  const checkedInGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'checked-in') : [];
  const acceptedGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'ACCEPTED') : [];
  const rejectedGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'REJECTED') : [];
  const pendingGuests = couple.guests ? couple.guests.filter(g => g && g.status === 'PENDING') : [];
  const giftedGuests = couple.guests ? couple.guests.filter(g => g && g.gift) : [];
  const vipGuests = couple.guests ? couple.guests.filter(g => g && (g.type || 'regular') === 'vip') : [];
  const regularGuests = couple.guests ? couple.guests.filter(g => g && (g.type || 'regular') === 'regular') : [];

  // Hitung total pax untuk setiap kategori
  const totalPax = calculateTotalPax(couple.guests);
  const checkedInPax = calculateTotalPax(checkedInGuests);
  const acceptedPax = calculateTotalPax(acceptedGuests);
  const rejectedPax = calculateTotalPax(rejectedGuests);
  const pendingPax = calculateTotalPax(pendingGuests);
  const vipPax = calculateTotalPax(vipGuests);
  const regularPax = calculateTotalPax(regularGuests);

  // Hitung jumlah tamu (bukan pax)
  const checkedInCount = checkedInGuests.length;
  const acceptedCount = acceptedGuests.length;
  const rejectedCount = rejectedGuests.length;
  const pendingCount = pendingGuests.length;
  const giftedCount = giftedGuests.length;
  const vipCount = vipGuests.length;
  const regularCount = regularGuests.length;

  // Hitung check-in rate berdasarkan filter
  const calculateCheckInRate = () => {
    let totalFilteredGuests = 0;
    let checkedInFilteredGuests = 0;

    if (checkInRateFilter === 'all') {
      totalFilteredGuests = totalGuests;
      checkedInFilteredGuests = checkedInCount;
    } else if (checkInRateFilter === 'vip') {
      totalFilteredGuests = vipCount;
      checkedInFilteredGuests = couple.guests.filter(g => g && 
        (g.type || 'regular') === 'vip' && 
        g.status === 'checked-in').length;
    } else if (checkInRateFilter === 'regular') {
      totalFilteredGuests = regularCount;
      checkedInFilteredGuests = couple.guests.filter(g => g && 
        (g.type || 'regular') === 'regular' && 
        g.status === 'checked-in').length;
    }

    return totalFilteredGuests > 0 ? (checkedInFilteredGuests / totalFilteredGuests) * 100 : 0;
  };

  const checkInPercentage = calculateCheckInRate();

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
        type: newGuestType,
        status: 'PENDING',
        addedAt: new Date().toISOString(),
        ...(newGuestPax && { pax: newGuestPax })
      };
  
      await update(ref(db, `couples/${id}/guests/${newGuestId}`), newGuest);
      message('Guest added successfully', 'success');
      setNewGuestName('');
      setNewGuestPax('');
      setNewGuestType('regular');
      setOpenAddGuestDialog(false);
    } catch (error) {
      console.error('Error adding guest:', error);
      message('Failed to add guest', 'error');
    } finally {
      loading.stop();
    }
  };

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
        type: newGuestType,
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

  const handleDirectCheckIn = async (guest, paxCount) => {
    try {
      loading.start();
      
      await update(ref(db, `couples/${id}/guests/${guest.id}`), {
        ...guest,
        status: 'checked-in',
        pax: paxCount || guest.pax || 1,
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

  const openDirectCheckInModal = (guest) => {
    setSelectedGuestForCheckIn(guest);
    setOpenDirectCheckIn(true);
  };

  const openEditDialog = (guest) => {
    setCurrentGuest(guest);
    setNewGuestName(guest.name);
    setNewGuestPax(guest.pax || '');
    setNewGuestType(guest.type || 'regular');
    setOpenEditGuestDialog(true);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(0);
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
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <InvitationLinkGenerator 
              couple={{ id, guests: couple.guests, name: couple.name }} 
              disabled={couple.guests.length === 0}
            />
            <CustomButton
              variant="contained"
              startIcon={<Icon icon="mdi:plus" />}
              onClick={() => setOpenAddGuestDialog(true)}
              sx={{ 
                height: '40px',
                minWidth: 'auto',
                px: 2,
                fontSize: '0.875rem'
              }}
            >
              Add Guest
            </CustomButton>
          </Box>
        </Box>

        {/* Statistics Section - MENGGUNAKAN KOMPONEN STATISTICCARD YANG BARU */}
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* Total Guests Card */}
          <StatisticCard
            title="Total Guests"
            value={totalGuests}
            subtitle={`${totalPax} Pax`}
            onClick={() => openDetails('All Guests', () => true)}
          />

          {/* Checked In Guests Card */}
          <StatisticCard
            title="Checked In"
            value={checkedInCount}
            subtitle={`${checkedInPax} Pax`}
            color="success.main"
            onClick={() => openDetails('Checked In Guests', guest => guest.status === 'checked-in')}
          />

          {/* Accepted Guests Card */}
          <StatisticCard
            title="Accepted"
            value={acceptedCount}
            subtitle={`${acceptedPax} Pax`}
            color="primary.main"
            onClick={() => openDetails('Accepted Guests', guest => guest.status === 'ACCEPTED')}
          />

          {/* Pending Guests Card */}
          <StatisticCard
            title="Pending"
            value={pendingCount}
            subtitle={`${pendingPax} Pax`}
            color="warning.main"
            onClick={() => openDetails('Pending Guests', guest => guest.status === 'PENDING')}
          />

          {/* Rejected Guests Card */}
          <StatisticCard
            title="Rejected"
            value={rejectedCount}
            subtitle={`${rejectedPax} Pax`}
            color="error.main"
            onClick={() => openDetails('Rejected Guests', guest => guest.status === 'REJECTED')}
          />

          {/* VIP Guests Card */}
          <StatisticCard
            title="VIP Guests"
            value={vipCount}
            subtitle={`${vipPax} Pax`}
            color="warning.main"
            onClick={() => openDetails('VIP Guests', guest => (guest.type || 'regular') === 'vip')}
          />

          {/* Regular Guests Card */}
          <StatisticCard
            title="Regular Guests"
            value={regularCount}
            subtitle={`${regularPax} Pax`}
            color="info.main"
            onClick={() => openDetails('Regular Guests', guest => (guest.type || 'regular') === 'regular')}
          />

          {/* Gifted Guests Card */}
          <StatisticCard
            title="Gift Received"
            value={giftedCount}
            color="success.main"
            onClick={() => openDetails('Guests Who Gave Gifts', guest => guest.gift)}
          />
        </Box>

        {/* Check In Progress dengan Filter */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Check In Rate
            </Typography>
            <CustomSelect
              size="small"
              value={checkInRateFilter}
              onChange={(e) => setCheckInRateFilter(e.target.value)}
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
              {checkInRateOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CustomSelect>
          </Box>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {checkInRateFilter === 'all' && `Checked in: ${checkedInCount} / ${totalGuests} guests`}
            {checkInRateFilter === 'vip' && `Checked in: ${couple.guests.filter(g => g && (g.type || 'regular') === 'vip' && g.status === 'checked-in').length} / ${vipCount} VIP guests`}
            {checkInRateFilter === 'regular' && `Checked in: ${couple.guests.filter(g => g && (g.type || 'regular') === 'regular' && g.status === 'checked-in').length} / ${regularCount} regular guests`}
          </Typography>
        </Box>

        {/* Button to Open Table Modal */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CustomButton
            variant="contained"
            startIcon={<Icon icon="mdi:table" />}
            onClick={() => setOpenTableModal(true)}
            sx={{ px: 4, py: 1.5 }}
          >
            View Guest List
          </CustomButton>
        </Box>
      </CustomColumn>

      {/* Guest Details Modal */}
      <GuestDetailsModal
        open={openDetailsModal}
        onClose={() => setOpenDetailsModal(false)}
        title={modalTitle}
        guests={couple.guests}
        filterFn={modalFilterFn}
      />

      {/* Guest Table Modal */}
      <GuestTableModal
        open={openTableModal}
        onClose={() => setOpenTableModal(false)}
        guests={couple.guests}
        handleGiftToggle={handleGiftToggle}
        openEditDialog={openEditDialog}
        setGuestToDelete={setGuestToDelete}
        setOpenDeleteDialog={setOpenDeleteDialog}
        openDirectCheckInModal={openDirectCheckInModal}
        handleDownloadExcel={handleDownloadExcel}
        id={id}
        coupleName={couple.name}
        filterType={filterType}
        setFilterType={setFilterType}
        typeOptions={typeOptions}
      />

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
            select
            label="Guest Type"
            value={newGuestType}
            onChange={(e) => setNewGuestType(e.target.value)}
            margin="normal"
          >
            <MenuItem value="regular">Regular</MenuItem>
            <MenuItem value="vip">VIP</MenuItem>
          </TextField>
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
            select
            label="Guest Type"
            value={newGuestType}
            onChange={(e) => setNewGuestType(e.target.value)}
            margin="normal"
          >
            <MenuItem value="regular">Regular</MenuItem>
            <MenuItem value="vip">VIP</MenuItem>
          </TextField>
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