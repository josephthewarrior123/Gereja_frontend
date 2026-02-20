import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    Button,
    Chip,
    Avatar,
    Tooltip,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Grid,
    useMediaQuery,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Divider,
    MenuItem,
    Stack,
    Menu,
    ListItemIcon,
    ListItemText,
    CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CreateCustomerDialog from './CreateCustomerDialog';
import ViewCustomerDialog from './ViewCustomerDialog';
import {
    CustomButton,
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomIcon,
    CustomRow,
    CustomSelect,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

export default function CustomerListPage() {
    const { user } = useUser();
    const [allCustomers, setAllCustomers] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
    });
    const [summaries, setSummaries] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("ALL");

    // Status Menu State
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const [statusCustomer, setStatusCustomer] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // TAMBAHAN: State buat mobile search input
    const [mobileSearchInput, setMobileSearchInput] = useState('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

    // TAMBAHAN: Sync mobile search input kalo keyword berubah dari luar
    useEffect(() => {
        setMobileSearchInput(dataSourceOptions.keyword);
    }, [dataSourceOptions.keyword]);

    // Fetch customers data
    const fetchCustomers = async () => {
        try {
            loading.start();

            const response = await CustomerDAO.getAllCustomers();

            if (response.success) {
                const customers = response.customers.map(customer => ({
                    id: customer.id,
                    name: customer.name || 'No Name',
                    phone: customer.phone || 'No Phone',
                    address: customer.address || 'No Address',
                    carData: customer.carData || {},
                    carPhotos: customer.carPhotos || {},
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt,
                    carBrand: customer.carData?.carBrand || 'No Brand',
                    plateNumber: customer.carData?.plateNumber || 'No Plate',
                    dueDate: customer.carData?.dueDate || null,
                    hasPhotos: customer.carPhotos?.front && customer.carPhotos?.back,
                    status: customer.status === 'Cancelled' ? 'Cancelled' :
                        (customer.carData?.dueDate ?
                            (new Date(customer.carData.dueDate) > new Date() ? 'Active' : 'Expired') :
                            'Unknown')
                }));

                setAllCustomers(customers);

                // Filter by status
                let filteredData = [...customers];

                if (selectedStatus !== "ALL") {
                    filteredData = filteredData.filter(customer => customer.status === selectedStatus);
                }

                // Filter by keyword
                if (dataSourceOptions.keyword) {
                    const keyword = dataSourceOptions.keyword.toLowerCase();
                    filteredData = filteredData.filter(customer =>
                        customer.name.toLowerCase().includes(keyword) ||
                        customer.phone.toLowerCase().includes(keyword) ||
                        customer.carBrand.toLowerCase().includes(keyword) ||
                        customer.plateNumber.toLowerCase().includes(keyword)
                    );
                }

                // Sorting
                if (dataSourceOptions.sortColumn) {
                    filteredData.sort((a, b) => {
                        let aVal = a[dataSourceOptions.sortColumn] || '';
                        let bVal = b[dataSourceOptions.sortColumn] || '';

                        if (dataSourceOptions.sortDirection === 'asc') {
                            return aVal > bVal ? 1 : -1;
                        } else {
                            return aVal < bVal ? 1 : -1;
                        }
                    });
                }

                // Pagination
                const startIndex = dataSourceOptions.page * dataSourceOptions.limit;
                const endIndex = startIndex + dataSourceOptions.limit;
                const paginatedData = filteredData.slice(startIndex, endIndex);

                setDataSource(paginatedData);
                setDataSourceOptions((prevOptions) => ({
                    ...prevOptions,
                    total: filteredData.length,
                }));
            } else {
                message(response.error || 'Failed to fetch customers', 'error');
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            message('Failed to fetch customers', 'error');
        } finally {
            loading.stop();
        }
    };

    // Fetch customer statistics
    const getStats = async () => {
        try {
            const response = await CustomerDAO.getCustomerStats();
            if (response.success) {
                const stats = response.stats;
                const activeCount = allCustomers.filter(c => c.status === 'Active').length;
                const expiredCount = allCustomers.filter(c => c.status === 'Expired').length;

                const summaryData = [
                    {
                        status: "ALL",
                        total: stats?.totalCustomers || 0,
                    },
                    {
                        status: "Active",
                        total: activeCount,
                    },
                    {
                        status: "Expired",
                        total: expiredCount,
                    },
                    {
                        status: "Cancelled",
                        total: allCustomers.filter(c => c.status === 'Cancelled').length,
                    },
                ];

                setSummaries(summaryData);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const statusOrder = {
        "ALL": 0,
        "Active": 1,
        "Expired": 2,
        "Cancelled": 3
    };

    const statusLabels = {
        "ALL": "All",
        "Active": "Active",
        "Expired": "Expired",
        "Cancelled": "Cancelled"
    };

    const sortedSummaries = [...summaries].sort((a, b) => {
        return statusOrder[a.status] - statusOrder[b.status];
    });

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            page: 0,
        }));
    };

    // Open delete confirmation dialog
    const openDeleteDialog = (customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    };

    // Open view customer dialog
    const openViewDialog = (customer) => {
        setSelectedCustomer(customer);
        setIsViewDialogOpen(true);
    };

    // Close dialogs
    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setSelectedCustomer(null);
    };

    const closeViewDialog = () => {
        setIsViewDialogOpen(false);
        setSelectedCustomer(null);
    };

    // Handle delete customer
    const handleDeleteCustomer = async () => {
        try {
            loading.start();
            const response = await CustomerDAO.deleteCustomer(selectedCustomer.id);

            if (response.success) {
                message('Customer deleted successfully', 'success');
                fetchCustomers();
                getStats();
            } else {
                message(response.error || 'Failed to delete customer', 'error');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            message('Failed to delete customer', 'error');
        } finally {
            loading.stop();
            closeDeleteDialog();
        }
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setDataSourceOptions({ ...dataSourceOptions, page: newPage });
    };

    const handleLimitChange = (newLimit) => {
        setDataSourceOptions({ ...dataSourceOptions, limit: newLimit, page: 0 });
    };

    const handleFilterChange = (field, value) => {
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            [field]: value,
            page: 0,
        }));
    };

    const handleSort = (columnKey) => {
        setDataSourceOptions({
            ...dataSourceOptions,
            sortColumn: columnKey,
            sortDirection:
                dataSourceOptions.sortColumn === columnKey
                    ? dataSourceOptions.sortDirection === 'asc'
                        ? 'desc'
                        : 'asc'
                    : 'asc',
        });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Status Menu Handlers
    const handleStatusClick = (event, customer) => {
        event.stopPropagation();
        setStatusMenuAnchor(event.currentTarget);
        setStatusCustomer(customer);
    };

    const handleStatusClose = () => {
        setStatusMenuAnchor(null);
        setStatusCustomer(null);
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!statusCustomer) return;
        try {
            setUpdatingStatus(true);
            loading.start();

            const response = await CustomerDAO.updateCustomer(statusCustomer.id, {
                status: newStatus === 'Reset' ? null : newStatus
            });

            if (response.success) {
                message('Status updated successfully', 'success');
                fetchCustomers();
                getStats();
            } else {
                throw new Error(response.error || 'Failed to update status');
            }
        } catch (error) {
            message(error.message || 'Failed to update status', 'error');
        } finally {
            loading.stop();
            setUpdatingStatus(false);
            handleStatusClose();
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#2E7D32';
            case 'Expired': return '#D32F2F';
            case 'Cancelled': return '#616161'; // Grey for cancelled
            default: return '#9E9E9E';
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchCustomers();
    }, [
        dataSourceOptions.page,
        dataSourceOptions.limit,
        dataSourceOptions.sortColumn,
        dataSourceOptions.sortDirection,
        dataSourceOptions.keyword,
        selectedStatus,
    ]);

    useEffect(() => {
        getStats();
    }, [allCustomers]);

    // Desktop Table Columns
    const columns = [
        {
            title: 'Customer Name',
            dataIndex: 'name',
            key: 'name',
            sortable: true,
            render: (value, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                        {value?.charAt(0)?.toUpperCase() || 'C'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {value || 'No Name'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.phone || 'No Phone'}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            title: 'Car Brand',
            dataIndex: 'carBrand',
            key: 'carBrand',
            sortable: true,
            render: (value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon="mdi:car" width={18} />
                    <Typography variant="body2">{value}</Typography>
                </Box>
            )
        },
        {
            title: 'Plate Number',
            dataIndex: 'plateNumber',
            key: 'plateNumber',
            sortable: false,
            render: (value) => (
                <Chip
                    label={value}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            )
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            sortable: false,
            render: (value) => formatDate(value)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sortable: true,
            render: (value, row) => (
                <Chip
                    label={value || '-'}
                    size="small"
                    onClick={(e) => handleStatusClick(e, row)}
                    sx={{
                        fontWeight: 'bold',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(value),
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: 0.9,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }
                    }}
                />
            )
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            sortable: false,
            render: (_, row) => (
                <Stack direction={'row'} spacing={1}>
                    <IconButton
                        size={'small'}
                        onClick={() => navigate(`/customers/${row.id}`)}
                        sx={{ borderRadius: 0.8 }}
                    >
                        <Icon icon={'mdi:eye-outline'} />
                    </IconButton>
                    <IconButton
                        size={'small'}
                        onClick={() => navigate(`/customers/edit/${row.id}`)}
                        sx={{ borderRadius: 0.8 }}
                    >
                        <Icon icon={'mdi:pencil-outline'} />
                    </IconButton>
                    <IconButton
                        size={'small'}
                        onClick={() => openDeleteDialog(row)}
                        sx={{ borderRadius: 0.8 }}
                    >
                        <Icon icon={'mdi:trash-can-outline'} />
                    </IconButton>
                </Stack>
            )
        }
    ];

    // Mobile View
    const renderMobileView = () => {
        const mobileLimit = 5;
        const startIndex = dataSourceOptions.page * mobileLimit;
        const endIndex = startIndex + mobileLimit;

        let filteredData = [...allCustomers];
        if (selectedStatus !== "ALL") {
            filteredData = filteredData.filter(customer => customer.status === selectedStatus);
        }
        if (dataSourceOptions.keyword) {
            const keyword = dataSourceOptions.keyword.toLowerCase();
            filteredData = filteredData.filter(customer =>
                customer.name.toLowerCase().includes(keyword) ||
                customer.phone.toLowerCase().includes(keyword) ||
                customer.carBrand.toLowerCase().includes(keyword) ||
                customer.plateNumber.toLowerCase().includes(keyword)
            );
        }

        const paginatedData = filteredData.slice(startIndex, endIndex);
        const totalRecords = filteredData.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                {/* Search Bar */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search customers..."
                        value={mobileSearchInput}
                        onChange={(e) => setMobileSearchInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleFilterChange('keyword', mobileSearchInput);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon icon="mdi:magnify" color="#94A3B8" />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '12px',
                                bgcolor: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' }
                            }
                        }}
                    />
                </Box>

                {/* New Customer Button */}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => { setIsCreateDialogOpen(true); setSelectedCustomer(null); }}
                    startIcon={<Icon icon="heroicons:plus" />}
                    sx={{
                        bgcolor: '#1E3A8A',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: '16px',
                        mb: 3,
                        boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.3)',
                        '&:hover': { bgcolor: '#1e40af' }
                    }}
                >
                    New Customer
                </Button>

                {/* Status Filters */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {sortedSummaries.map((summary) => (
                        <Chip
                            key={summary.status}
                            label={`${statusLabels[summary.status]} (${summary.total})`}
                            onClick={() => handleStatusChange(summary.status)}
                            sx={{
                                border: '1px solid',
                                borderColor: selectedStatus === summary.status ? '#1E3A8A' : '#E2E8F0',
                                backgroundColor: selectedStatus === summary.status ? '#1E3A8A' : '#fff',
                                color: selectedStatus === summary.status ? '#fff' : '#64748B',
                                fontWeight: 600,
                                px: 1,
                                height: 38,
                                borderRadius: '20px',
                                '&:active': { transform: 'scale(0.95)' }
                            }}
                        />
                    ))}
                </Box>

                {/* List Content */}
                {paginatedData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:account-off-outline" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>No customers found</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginatedData.map((customer) => (
                            <Card key={customer.id} sx={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
                                <CardContent sx={{ p: '20px !important' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}>
                                            {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.25 }}>
                                                {customer.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Icon icon="mdi:phone" width={14} /> {customer.phone}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={customer.status.toUpperCase()}
                                            size="small"
                                            sx={{
                                                bgcolor: customer.status === 'Active' ? '#D1FAE5' : customer.status === 'Expired' ? '#FEE2E2' : '#F1F5F9',
                                                color: customer.status === 'Active' ? '#065F46' : customer.status === 'Expired' ? '#991B1B' : '#475569',
                                                fontWeight: 800, fontSize: '0.65rem', borderRadius: '8px'
                                            }}
                                        />
                                    </Stack>

                                    <Divider sx={{ mb: 2.5, borderStyle: 'dashed' }} />

                                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>VEHICLE</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.5 }}>{customer.carBrand}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B' }}>{customer.plateNumber}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>DUE DATE</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.5 }}>{formatDate(customer.dueDate)}</Typography>
                                            <Typography variant="caption" sx={{ color: customer.status === 'Active' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                                                {customer.status === 'Active' ? 'Insurance Active' : customer.status === 'Expired' ? 'Expired' : 'Terminated'}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1, borderTop: '1px solid #F8FAFC' }}>
                                        <IconButton size="small" onClick={() => navigate(`/customers/${customer.id}`)} sx={{ color: '#64748B' }}><Icon icon="mdi:eye-outline" width={22} /></IconButton>
                                        <IconButton size="small" onClick={() => navigate(`/customers/edit/${customer.id}`)} sx={{ color: '#64748B' }}><Icon icon="mdi:pencil-outline" width={22} /></IconButton>
                                        <IconButton size="small" onClick={() => openDeleteDialog(customer)} sx={{ color: '#64748B' }}><Icon icon="mdi:trash-can-outline" width={22} /></IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Pagination */}
                {totalRecords > 0 && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0', pb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Showing <b>{startIndex + 1}-{Math.min(endIndex, totalRecords)}</b> of <b>{totalRecords}</b>
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Page <b>{dataSourceOptions.page + 1}</b> of <b>{Math.ceil(totalRecords / mobileLimit)}</b>
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions(prev => ({ ...prev, page: prev.page - 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#E2E8F0', color: '#64748B' }}
                            >
                                Prev
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                disabled={endIndex >= totalRecords}
                                onClick={() => setDataSourceOptions(prev => ({ ...prev, page: prev.page + 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#1E3A8A', color: '#1E3A8A' }}
                            >
                                Next
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        );
    };

    // Desktop View
    const renderDesktopView = () => {
        return (
            <CustomColumn className={'gap-y-8 max-h-full'}>
                <CustomRow className={'gap-x-4'}>
                    <CustomTextInput
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleFilterChange('keyword', e.target.value);
                            }
                        }}
                        placeholder={'Search customers...'}
                        searchIcon={true}
                    />
                    <CustomRow className={'justify-center gap-x-4'}>
                        <CustomButton
                            startIcon={
                                <CustomIcon
                                    icon={'heroicons:plus'}
                                    sx={{ py: 6 }}
                                />
                            }
                            onClick={() => {
                                setIsCreateDialogOpen(true);
                                setSelectedCustomer(null);
                            }}
                            color="secondary"
                        >
                            New Customer
                        </CustomButton>
                    </CustomRow>
                </CustomRow>

                <CustomRow className={'lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start'}>
                    {sortedSummaries.map((summary) => (
                        <div
                            key={summary.status}
                            onClick={() => handleStatusChange(summary.status)}
                            className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedStatus === summary.status
                                ? "border-2 border-blue-500"
                                : "border border-transparent"
                                }`}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                            }}
                        >
                            <CustomDashboardStatsCard
                                value={summary?.total}
                                label={statusLabels[summary.status] || summary.status}
                                className="w-full h-full"
                            />
                        </div>
                    ))}
                </CustomRow>

                <CustomDatatable
                    dataSource={dataSource}
                    columns={columns}
                    page={dataSourceOptions.page}
                    limit={dataSourceOptions.limit}
                    totalRecords={dataSourceOptions.total}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    handleSort={handleSort}
                    sortColumn={dataSourceOptions.sortColumn}
                    sortDirection={dataSourceOptions.sortDirection}
                />
            </CustomColumn>
        );
    };

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* Create Customer Dialog */}
            <CreateCustomerDialog
                open={isCreateDialogOpen}
                onClose={(refresh) => {
                    setIsCreateDialogOpen(false);
                    if (refresh) {
                        fetchCustomers();
                        getStats();
                    }
                }}
            />

            {/* View Customer Dialog */}
            <ViewCustomerDialog
                open={isViewDialogOpen}
                customer={selectedCustomer}
                onClose={closeViewDialog}
                onEdit={() => {
                    closeViewDialog();
                    navigate(`/customers/edit/${selectedCustomer.id}`);
                }}
                onDelete={() => {
                    closeViewDialog();
                    openDeleteDialog(selectedCustomer);
                }}
            />



            {/* Status Change Menu */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={handleStatusClose}
                PaperProps={{
                    sx: {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        minWidth: 150
                    }
                }}
            >
                <MenuItem
                    onClick={() => handleStatusUpdate('Reset')}
                    disabled={updatingStatus}
                >
                    <ListItemIcon>
                        <Icon icon="mdi:check-circle" color="#2E7D32" width={20} />
                    </ListItemIcon>
                    <ListItemText primary="Set Active / Reset" secondary="Uses Due Date" secondaryTypographyProps={{ fontSize: 10 }} />
                </MenuItem>
                <MenuItem
                    onClick={() => handleStatusUpdate('Cancelled')}
                    disabled={updatingStatus}
                >
                    <ListItemIcon>
                        <Icon icon="mdi:cancel" color="#616161" width={20} />
                    </ListItemIcon>
                    <ListItemText primary="Set Cancelled" />
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={closeDeleteDialog}
                maxWidth="xs"
                fullWidth
                fullScreen={isMobile}
            >
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                            Confirm Delete
                        </Typography>
                        <IconButton onClick={closeDeleteDialog} size="small">
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Are you sure you want to delete customer <b>{selectedCustomer?.name}</b>?
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            This action cannot be undone. All customer data including car photos will be permanently deleted.
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            flexDirection: { xs: 'column', sm: 'row' }
                        }}>
                            <Button
                                variant="outlined"
                                onClick={closeDeleteDialog}
                                fullWidth={isMobile}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteCustomer}
                                startIcon={<Icon icon="mdi:delete" />}
                                fullWidth={isMobile}
                            >
                                Delete Customer
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}