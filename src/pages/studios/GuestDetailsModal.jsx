// GuestDetailsModal.jsx
import {
    Dialog,
    Box,
    IconButton,
    Typography,
    Chip,
    TextField,
    MenuItem
  } from '@mui/material';
  import { Icon } from '@iconify/react';
  import { useState } from 'react';
  import CustomDatatable from '../../reusables/CustomDataTable';
  import { CustomSelect, CustomButton } from '../../reusables';
  
  const GuestDetailsModal = ({
    open,
    onClose,
    title,
    guests,
    filterFn
  }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(5);
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
  
    // Status options for filtering
    const statusOptions = [
      { value: 'all', label: 'All Status' },
      { value: 'ACCEPTED', label: 'Accepted' },
      { value: 'checked-in', label: 'Checked In' },
      { value: 'REJECTED', label: 'Rejected' },
      { value: 'PENDING', label: 'Pending' }
    ];
  
    // Type options for filtering
    const typeOptions = [
      { value: 'all', label: 'All Types' },
      { value: 'regular', label: 'Regular' },
      { value: 'vip', label: 'VIP' }
    ];
  
    // Filter guests
    const filteredGuests = guests.filter(guest => {
      if (!guest || !filterFn(guest)) return false;
  
      const matchesStatus =
        filterStatus === 'all' || guest.status === filterStatus;
      const matchesType =
        filterType === 'all' || (guest.type || 'regular') === filterType;
      const matchesSearch =
        guest.name &&
        guest.name.toLowerCase().includes(searchKeyword.toLowerCase());
  
      return matchesStatus && matchesType && matchesSearch;
    });
  
    // Sort guests
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
      }
  
      return 0;
    });
  
    // Pagination
    const paginatedGuests = sortedGuests.slice(page * limit, page * limit + limit);
  
    // Sorting
    const handleSort = (column) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    };
  
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '80vh',
            maxHeight: '80vh'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6">
            {title} ({filteredGuests.length})
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon="mdi:close" />
          </IconButton>
        </Box>
  
        {/* Filter Section */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            flexWrap: 'wrap'
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
              mt: '-7px',
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
              mt: '-7px',
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
        </Box>
  
        {/* Table */}
        <Box sx={{ p: 2, height: 'calc(100% - 180px)', overflow: 'auto' }}>
          <CustomDatatable
            dataSource={paginatedGuests}
            columns={[
              {
                key: 'name',
                dataIndex: 'name',
                title: 'Guest Name',
                sortable: true,
                width: '25%',
                render: (value) => value || '-'
              },
              {
                key: 'code',
                dataIndex: 'code',
                title: 'Code',
                width: '15%',
                render: (value) => (
                  <Chip label={value} size="small" variant="outlined" />
                )
              },
              {
                key: 'type',
                dataIndex: 'type',
                title: 'Type',
                sortable: true,
                width: '15%',
                render: (value) => (
                  <Chip
                    label={value || 'regular'}
                    size="small"
                    color={(value || 'regular') === 'vip' ? 'warning' : 'default'}
                    variant="outlined"
                  />
                )
              },
              {
                key: 'status',
                dataIndex: 'status',
                title: 'Status',
                sortable: true,
                width: '20%',
                render: (value) =>
                  value ? (
                    <Chip
                      label={value}
                      size="small"
                      color={
                        value === 'checked-in'
                          ? 'success'
                          : value === 'ACCEPTED'
                          ? 'primary'
                          : 'error'
                      }
                    />
                  ) : (
                    '-'
                  )
              },
              {
                key: 'pax',
                dataIndex: 'pax',
                title: 'Pax',
                sortable: true,
                width: '15%',
                render: (value) =>
                  value ? (
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
                  ) : (
                    '-'
                  )
              }
            ]}
            page={page}
            limit={limit}
            totalRecords={filteredGuests.length}
            handlePageChange={(newPage) => setPage(newPage)}
            handleLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(0);
            }}
            handleSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ height: '100%' }}
          />
        </Box>
      </Dialog>
    );
  };
  
  export default GuestDetailsModal;