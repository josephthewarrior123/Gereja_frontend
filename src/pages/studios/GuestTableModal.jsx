// GuestTableModal.jsx
import {
    Dialog,
    Box,
    IconButton,
    Typography,
    TextField,
    MenuItem
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import GuestTable from './GuestTable';
import { CustomButton, CustomSelect } from '../../reusables';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const GuestTableModal = ({ 
    open, 
    onClose, 
    guests,
    handleGiftToggle,
    openEditDialog,
    setGuestToDelete,
    setOpenDeleteDialog,
    openDirectCheckInModal,
    id,
    coupleName,
    filterType,
    setFilterType,
    typeOptions
}) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(5);
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Reset semua state filter ketika modal ditutup
    const handleClose = () => {
        setSearchKeyword('');
        setFilterStatus('all');
        setPage(0);
        setLimit(5);
        setSortColumn('name');
        setSortDirection('asc');
        onClose();
    };

    // Status options for filtering
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'ACCEPTED', label: 'Accepted' },
        { value: 'checked-in', label: 'Checked In' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'PENDING', label: 'Pending' }
    ];

    // Filter guests based on search, status, and type
    const filteredGuestsModal = guests.filter(guest => {
        if (!guest) return false;
        
        const matchesStatus = filterStatus === 'all' || guest.status === filterStatus;
        const matchesType = filterType === 'all' || (guest.type || 'regular') === filterType;
        const matchesSearch = guest.name && guest.name.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchesStatus && matchesType && matchesSearch;
    });

    // Hitung statistik untuk Excel
    const calculateStatistics = (guestsList) => {
        const totalGuests = guestsList.length;
        const checkedInGuests = guestsList.filter(g => g && g.status === 'checked-in').length;
        const acceptedGuests = guestsList.filter(g => g && g.status === 'ACCEPTED').length;
        const rejectedGuests = guestsList.filter(g => g && g.status === 'REJECTED').length;
        const pendingGuests = guestsList.filter(g => g && g.status === 'PENDING').length;
        const vipGuests = guestsList.filter(g => g && (g.type || 'regular') === 'vip').length;
        const regularGuests = guestsList.filter(g => g && (g.type || 'regular') === 'regular').length;
        const giftedGuests = guestsList.filter(g => g && g.gift).length;
        
        // Hitung total pax
        const totalPax = guestsList.reduce((sum, guest) => {
            return sum + (guest.pax ? parseInt(guest.pax) : 1);
        }, 0);

        // Hitung pax per status
        const checkedInPax = guestsList
            .filter(g => g && g.status === 'checked-in')
            .reduce((sum, guest) => sum + (guest.pax ? parseInt(guest.pax) : 1), 0);
        
        const acceptedPax = guestsList
            .filter(g => g && g.status === 'ACCEPTED')
            .reduce((sum, guest) => sum + (guest.pax ? parseInt(guest.pax) : 1), 0);
        
        const rejectedPax = guestsList
            .filter(g => g && g.status === 'REJECTED')
            .reduce((sum, guest) => sum + (guest.pax ? parseInt(guest.pax) : 1), 0);

        return {
            totalGuests,
            checkedInGuests,
            acceptedGuests,
            rejectedGuests,
            pendingGuests,
            vipGuests,
            regularGuests,
            giftedGuests,
            totalPax,
            checkedInPax,
            acceptedPax,
            rejectedPax
        };
    };

    // Enhanced download function dengan statistik
    const handleEnhancedDownloadExcel = (coupleId, coupleName, guestsToExport) => {
        try {
            const baseUrl = prompt(
                'Enter the base URL for invitation links:\n\nContoh: https://your-wedding-site.com/invitation?code=',
                'https://wedding-template1-topaz.vercel.app/intro?to='
            );
            
            if (baseUrl === null) return;

            if (guestsToExport.length === 0) {
                alert('No data to export');
                return;
            }

            // Hitung statistik
            const stats = calculateStatistics(guestsToExport);

            // Data tamu
            const guestData = guestsToExport.map(guest => ({
                'Guest Name': guest.name,
                'Code': guest.code,
                'Type': guest.type || 'regular',
                'Status': guest.status,
                'Pax': guest.pax || 1,
                'Gift': guest.gift ? 'Yes' : 'No',
                'Invitation Link': `${baseUrl}${coupleId}_${guest.code}`
            }));

            // Data statistik
            const statsData = [
                ['STATISTICS REPORT', ''],
                ['Generated Date', dayjs().format('YYYY-MM-DD HH:mm:ss')],
                ['Couple Name', coupleName],
                ['Total Guests', stats.totalGuests],
                ['Checked In Guests', stats.checkedInGuests],
                ['Accepted Guests', stats.acceptedGuests],
                ['Rejected Guests', stats.rejectedGuests],
                ['Pending Guests', stats.pendingGuests],
                ['VIP Guests', stats.vipGuests],
                ['Regular Guests', stats.regularGuests],
                ['Guests with Gift', stats.giftedGuests],
                [''],
                ['PAX SUMMARY', ''],
                ['Total Pax', stats.totalPax],
                ['Checked In Pax', stats.checkedInPax],
                ['Accepted Pax', stats.acceptedPax],
                ['Rejected Pax', stats.rejectedPax],
                [''],
                ['FILTER INFORMATION', ''],
                ['Current Status Filter', filterStatus === 'all' ? 'All Status' : statusOptions.find(opt => opt.value === filterStatus)?.label],
                ['Current Type Filter', filterType === 'all' ? 'All Types' : typeOptions.find(opt => opt.value === filterType)?.label],
                ['Search Keyword', searchKeyword || '-'],
                ['Total Filtered Guests', guestsToExport.length]
            ];

            // Buat workbook dengan multiple sheets
            const wb = XLSX.utils.book_new();
            
            // Sheet untuk data tamu
            const wsGuests = XLSX.utils.json_to_sheet(guestData);
            XLSX.utils.book_append_sheet(wb, wsGuests, 'Guests');
            
            // Sheet untuk statistik
            const wsStats = XLSX.utils.aoa_to_sheet(statsData);
            
            // Tambahkan merges untuk header (perbaikan error disini)
            if (!wsStats['!merges']) {
                wsStats['!merges'] = [];
            }
            
            // Tambahkan merge cells untuk header
            wsStats['!merges'].push(
                {s: {r: 0, c: 0}, e: {r: 0, c: 1}}, // STATISTICS REPORT
                {s: {r: 12, c: 0}, e: {r: 12, c: 1}}, // PAX SUMMARY
                {s: {r: 18, c: 0}, e: {r: 18, c: 1}}  // FILTER INFORMATION
            );

            XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');

            const fileName = `${coupleName.replace(/\s+/g, '_')}_Guests_Report_${dayjs().format('YYYY-MM-DD')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            alert('Excel file downloaded successfully with statistics!');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Failed to export Excel file');
        }
    };

    // Sort guests
    const sortedGuests = [...filteredGuestsModal].sort((a, b) => {
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

    // Paginate guests
    const paginatedGuests = sortedGuests.slice(page * limit, page * limit + limit);

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

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="xl"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    height: '90vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Guest List - {coupleName}</Typography>
                <IconButton onClick={handleClose}>
                    <Icon icon="mdi:close" />
                </IconButton>
            </Box>
            
            {/* Filter Section */}
            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center', 
                borderBottom: 1, 
                borderColor: 'divider', 
                flexWrap: 'wrap' 
            }}>
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
                            fontSize: "0.875rem",
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

                {/* Status Filter */}
                <CustomSelect
                    size="small"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{
                        minWidth: 180,
                        height: 40,
                        mt: '-6px',
                        "& .MuiOutlinedInput-root": {
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            paddingRight: "8px",
                        },
                        "& .MuiSelect-select": {
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            paddingY: 0,
                            paddingX: 1.5,
                            fontSize: "0.875rem",
                        },
                    }}
                >
                    {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </CustomSelect>

                {/* Type Filter */}
                <CustomSelect
                    size="small"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{
                        minWidth: 180,
                        height: 40,
                        mt: '-6px',
                        "& .MuiOutlinedInput-root": {
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            paddingRight: "8px",
                        },
                        "& .MuiSelect-select": {
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            paddingY: 0,
                            paddingX: 1.5,
                            fontSize: "0.875rem",
                        },
                    }}
                >
                    {typeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </CustomSelect>

                {/* Download Button */}
                <CustomButton
                    variant="outlined"
                    startIcon={<Icon icon="mdi:file-excel" />}
                    onClick={() => handleEnhancedDownloadExcel(id, coupleName, filteredGuestsModal)}
                    sx={{ 
                        height: 40,
                        minWidth: 'auto',
                        px: 2,
                        fontSize: '0.875rem',
                        ml: 'auto'
                    }}
                >
                    Download Report
                </CustomButton>
            </Box>

            {/* Table Container */}
            <Box sx={{ p: 2, height: 'calc(100% - 120px)', overflow: 'auto' }}>
                <GuestTable 
                    dataSource={paginatedGuests}
                    page={page}
                    limit={limit}
                    totalRecords={filteredGuestsModal.length}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    handleSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    handleGiftToggle={handleGiftToggle}
                    openEditDialog={openEditDialog}
                    setGuestToDelete={setGuestToDelete}
                    setOpenDeleteDialog={setOpenDeleteDialog}
                    openDirectCheckInModal={openDirectCheckInModal}
                />
            </Box>
        </Dialog>
    );
};

export default GuestTableModal;