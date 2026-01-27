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
    Stack
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
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

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
                    status: customer.carData?.dueDate ? 
                        (new Date(customer.carData.dueDate) > new Date() ? 'Active' : 'Expired') : 
                        'Unknown'
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
                const unknownCount = allCustomers.filter(c => c.status === 'Unknown').length;

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
                        status: "Unknown",
                        total: unknownCount,
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
        "Unknown": 3
    };
    
    const statusLabels = {
        "ALL": "All",
        "Active": "Active",
        "Expired": "Expired",
        "Unknown": "Unknown"
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

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#2E7D32';
            case 'Expired': return '#D32F2F';
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
            render: (value) => (
                <Chip
                    label={value || '-'}
                    size="small"
                    sx={{
                        fontWeight: 'bold',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(value),
                        color: '#FFFFFF',
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
                        onClick={() => openViewDialog(row)}
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
        // Gunakan limit 5 khusus untuk mobile
        const mobileLimit = 5;
        const startIndex = dataSourceOptions.page * mobileLimit;
        const endIndex = startIndex + mobileLimit;
        
        // Filter by status
        let filteredData = [...allCustomers];
        
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

        // Pagination dengan limit 5
        const paginatedData = filteredData.slice(startIndex, endIndex);
        const totalRecords = filteredData.length;

        return (
            <Box sx={{ p: 2 }}>
                {/* Search and Filter Section */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search customers..."
                        value={dataSourceOptions.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon icon="mdi:magnify" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    {/* Add Customer Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Box
                            onClick={() => {
                                setIsCreateDialogOpen(true);
                                setSelectedCustomer(null);
                            }}
                            sx={{
                                width: '56px',
                                height: '56px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#1976d2',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                                transition: 'all 0.2s',
                                '&:active': {
                                    transform: 'scale(0.95)',
                                },
                            }}
                        >
                            <Icon icon="heroicons:plus" style={{ fontSize: '24px', color: '#fff' }} />
                        </Box>
                    </Box>
                    
                    {/* Status Filter Chips */}
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                        {sortedSummaries.map((summary) => (
                            <Chip
                                key={summary.status}
                                label={`${statusLabels[summary.status]} (${summary.total})`}
                                onClick={() => handleStatusChange(summary.status)}
                                sx={{
                                    backgroundColor: selectedStatus === summary.status ? '#1976d2' : '#f5f5f5',
                                    color: selectedStatus === summary.status ? '#fff' : '#666',
                                    fontWeight: selectedStatus === summary.status ? 'bold' : 'normal',
                                    transition: 'all 0.2s',
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Customer List */}
                {paginatedData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Icon icon="mdi:account-search" width={60} color="#9e9e9e" />
                        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                            No customers found
                        </Typography>
                        {filteredData.length > 0 && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                Try going to the next page
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Box>
                        {paginatedData.map((customer) => (
                            <Card 
                                key={customer.id} 
                                sx={{ 
                                    mb: 2, 
                                    borderRadius: 2,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <CardContent>
                                    {/* Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                            <Avatar
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    bgcolor: '#1976d2',
                                                }}
                                            >
                                                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                            </Avatar>
                                            <Box>
                                                <Typography fontWeight={600}>
                                                    {customer.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {customer.phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={customer.status}
                                            size="small"
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: getStatusColor(customer.status),
                                                color: '#fff',
                                            }}
                                        />
                                    </Box>

                                    {/* Details */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Brand:</strong> {customer.carBrand}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Plate:</strong> {customer.plateNumber}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Due Date:</strong> {formatDate(customer.dueDate)}
                                        </Typography>
                                    </Box>

                                    {/* Action Buttons */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => openViewDialog(customer)}
                                            sx={{ color: '#1976d2' }}
                                        >
                                            <Icon icon="mdi:eye-outline" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                                            sx={{ color: '#ed6c02' }}
                                        >
                                            <Icon icon="mdi:pencil-outline" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => openDeleteDialog(customer)}
                                            sx={{ color: '#d32f2f' }}
                                        >
                                            <Icon icon="mdi:trash-can-outline" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* Pagination - Show 5 per page */}
                {totalRecords > 0 && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mt: 3,
                        pt: 2,
                        borderTop: '1px solid #e0e0e0',
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {startIndex + 1} - {Math.min(endIndex, totalRecords)} of {totalRecords}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                                Page {dataSourceOptions.page + 1} of {Math.ceil(totalRecords / mobileLimit)}
                            </Typography>
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions(prev => ({ ...prev, page: prev.page - 1 }))}
                                variant="outlined"
                                startIcon={<Icon icon="mdi:chevron-left" />}
                            >
                                Prev
                            </Button>
                            <Button
                                size="small"
                                disabled={endIndex >= totalRecords}
                                onClick={() => setDataSourceOptions(prev => ({ ...prev, page: prev.page + 1 }))}
                                variant="contained"
                                endIcon={<Icon icon="mdi:chevron-right" />}
                            >
                                Next
                            </Button>
                        </Box>
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
                            className={`cursor-pointer rounded-lg transition-all duration-200 ${
                                selectedStatus === summary.status
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
                    if (selectedCustomer) {
                        navigate(`/customers/edit/${selectedCustomer.id}`);
                    }
                }}
                onDelete={() => {
                    closeViewDialog();
                    if (selectedCustomer) {
                        openDeleteDialog(selectedCustomer);
                    }
                }}
            />

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