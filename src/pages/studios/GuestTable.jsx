// GuestTable.jsx
import {
    Box,
    Chip,
    IconButton,
    Tooltip,
    Checkbox
} from '@mui/material';
import { Icon } from '@iconify/react';
import CustomDatatable from '../../reusables/CustomDataTable';

const GuestTable = ({
    dataSource,
    columns,
    page,
    limit,
    totalRecords,
    handlePageChange,
    handleLimitChange,
    handleSort,
    sortColumn,
    sortDirection,
    handleGiftToggle,
    openEditDialog,
    setGuestToDelete,
    setOpenDeleteDialog,
    openDirectCheckInModal
}) => {
    // Table columns configuration
    const tableColumns = [
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Guest Name',
            sortable: true,
            width: '20%',
            render: (value) => value || '-'
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
            key: 'type',
            dataIndex: 'type',
            title: 'Type',
            sortable: true,
            width: '10%',
            render: (value) => (
                <Chip 
                    label={value || 'regular'}
                    size="small"
                    color={
                        (value || 'regular') === 'vip' ? 'warning' : 'default'
                    }
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
            ) : '-'
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
            render: (value, row) => (
                <Tooltip title={row.gift ? "Unmark Gift" : "Mark Gift"}>
                    <Checkbox
                        checked={row.gift || false}
                        onChange={() => handleGiftToggle(row)}
                        icon={<Icon icon="mdi:gift-outline" />}
                        checkedIcon={<Icon icon="mdi:gift" />}
                        color="success"
                    />
                </Tooltip>
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
        {
            key: 'directCheckIn',
            dataIndex: 'id',
            title: 'Check-In',
            sortable: false,
            width: '10%',
            render: (value, row) => (
                <Tooltip title={row.status === 'checked-in' ? "Already checked in" : "Direct Check-In"}>
                    <span>
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
        <CustomDatatable
            dataSource={dataSource}
            columns={tableColumns}
            page={page}
            limit={limit}
            totalRecords={totalRecords}
            handlePageChange={handlePageChange}
            handleLimitChange={handleLimitChange}
            handleSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
        />
    );
};

export default GuestTable;