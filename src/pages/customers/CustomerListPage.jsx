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
    Fab,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CreateCustomerDialog from './CreateCustomerDialog';
import CustomDatatable from '../../reusables/CustomDataTable';
import ViewCustomerDialog from './ViewCustomerDialog';

export default function CustomerListPage() {
    const { user } = useUser();
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState(null);
    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

    // Fetch customers data
    const getData = async () => {
        try {
            loading.start();
            const response = await CustomerDAO.getAllCustomers();
            
            if (response.success) {
                const customers = response.customers.map(customer => ({
                    id: customer.id,
                    name: customer.name || 'No Name',
                    email: customer.email || 'No Email',
                    phone: customer.phone || 'No Phone',
                    address: customer.address || 'No Address',
                    carData: customer.carData || {},
                    carPhotos: customer.carPhotos || {},
                    createdBy: customer.createdBy,
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt,
                    // Additional fields for display
                    carBrand: customer.carData?.carBrand || 'No Brand',
                    plateNumber: customer.carData?.plateNumber || 'No Plate',
                    dueDate: customer.carData?.dueDate || null,
                    hasPhotos: customer.carPhotos?.front && customer.carPhotos?.back,
                    status: customer.carData?.dueDate ? 
                        (new Date(customer.carData.dueDate) > new Date() ? 'Active' : 'Expired') : 
                        'Unknown'
                }));
                
                setAllCustomers(customers);
                setFilteredCustomers(customers);
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
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Search customers
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredCustomers(allCustomers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = allCustomers.filter(customer => 
                customer.name.toLowerCase().includes(query) ||
                customer.email.toLowerCase().includes(query) ||
                customer.phone.toLowerCase().includes(query) ||
                customer.carBrand.toLowerCase().includes(query) ||
                customer.plateNumber.toLowerCase().includes(query)
            );
            setFilteredCustomers(filtered);
        }
    }, [searchQuery, allCustomers]);

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
                getData(); // Refresh data
                getStats(); // Refresh stats
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

    // Pagination handlers
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(0);
    };

    // Sort handler
    const handleSort = (columnKey) => {
        const isAsc = sortColumn === columnKey && sortDirection === 'asc';
        setSortDirection(isAsc ? 'desc' : 'asc');
        setSortColumn(columnKey);
    };

    // Row click handler
    const handleRowClick = (row) => {
        openViewDialog(row);
    };

    // Row style
    const getRowStyle = (row) => {
        return {
            cursor: 'pointer',
            backgroundColor: row.status === 'Expired' ? '#fff8f8' : 'inherit'
        };
    };

    // Sort data
    const sortedData = [...filteredCustomers].sort((a, b) => {
        let valueA, valueB;
        
        switch (sortColumn) {
            case 'name':
                valueA = a.name || '';
                valueB = b.name || '';
                break;
            case 'carBrand':
                valueA = a.carBrand || '';
                valueB = b.carBrand || '';
                break;
            case 'plateNumber':
                valueA = a.plateNumber || '';
                valueB = b.plateNumber || '';
                break;
            case 'dueDate':
                valueA = a.dueDate || '';
                valueB = b.dueDate || '';
                break;
            case 'status':
                valueA = a.status || '';
                valueB = b.status || '';
                break;
            default:
                return 0;
        }
        
        return sortDirection === 'asc' 
            ? String(valueA).localeCompare(String(valueB))
            : String(valueB).localeCompare(String(valueA));
    });

    // Pagination
    const paginatedData = sortedData.slice(page * limit, page * limit + limit);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 640);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial data fetch
    useEffect(() => {
        getData();
        getStats();
    }, [user]);

    // Columns configuration
    const columns = [
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Customer Name',
            width: '20%',
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
                            {row.email || 'No Email'}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            key: 'phone',
            dataIndex: 'phone',
            title: 'Phone',
            width: '15%',
            render: (value) => value || 'No Phone'
        },
        {
            key: 'carBrand',
            dataIndex: 'carBrand',
            title: 'Car Brand',
            width: '15%',
            sortable: true,
            render: (value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon="mdi:car" width={18} />
                    <Typography variant="body2">{value}</Typography>
                </Box>
            )
        },
        {
            key: 'plateNumber',
            dataIndex: 'plateNumber',
            title: 'Plate Number',
            width: '15%',
            sortable: true,
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
            key: 'dueDate',
            dataIndex: 'dueDate',
            title: 'Due Date',
            width: '15%',
            sortable: true,
            render: (value) => {
                if (!value) return 'No Date';
                const date = new Date(value);
                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        },
        {
            key: 'status',
            dataIndex: 'status',
            title: 'Status',
            width: '10%',
            sortable: true,
            render: (value) => {
                const color = value === 'Active' ? 'success' : value === 'Expired' ? 'error' : 'default';
                return (
                    <Chip 
                        label={value} 
                        size="small" 
                        color={color}
                        variant={color === 'default' ? 'outlined' : 'filled'}
                    />
                );
            }
        },
        {
            key: 'hasPhotos',
            dataIndex: 'hasPhotos',
            title: 'Photos',
            width: '5%',
            render: (value) => (
                value ? (
                    <Tooltip title="Has car photos">
                        <Icon icon="mdi:camera" color="#4caf50" width={20} />
                    </Tooltip>
                ) : (
                    <Tooltip title="No photos">
                        <Icon icon="mdi:camera-off" color="#9e9e9e" width={20} />
                    </Tooltip>
                )
            )
        },
        {
            key: 'actions',
            dataIndex: 'actions',
            title: 'Actions',
            width: '10%',
            render: (_, row) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                openViewDialog(row);
                            }}
                            color="primary"
                        >
                            <Icon icon="mdi:eye" width={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customers/edit/${row.id}`);
                            }}
                            color="warning"
                        >
                            <Icon icon="mdi:pencil" width={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(row);
                            }}
                            color="error"
                        >
                            <Icon icon="mdi:delete" width={18} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    // Stats Card Component
    const StatsCard = ({ icon, title, value, color }) => (
        <Card sx={{ bgcolor: color, color: 'white' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {title}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Icon icon={icon} width={40} style={{ opacity: 0.8 }} />
                </Box>
            </CardContent>
        </Card>
    );

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
                {/* Header with stats */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" fontWeight="bold">
                            Customer Management
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Icon icon="mdi:plus" />}
                            onClick={() => setIsCreateDialogOpen(true)}
                            sx={{ borderRadius: 2 }}
                        >
                            New Customer
                        </Button>
                    </Box>

                    {/* Stats Cards */}
                    {stats && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:account-group"
                                    title="Total Customers"
                                    value={stats.totalCustomers}
                                    color="#1976d2"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:counter"
                                    title="Current Counter"
                                    value={stats.currentCounter}
                                    color="#2e7d32"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:id-card"
                                    title="Next ID"
                                    value={stats.nextCustomerId}
                                    color="#ed6c02"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:car"
                                    title="Car Customers"
                                    value={allCustomers.length}
                                    color="#9c27b0"
                                />
                            </Grid>
                        </Grid>
                    )}

                    {/* Search Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <TextField
                            placeholder="Search customers by name, email, phone, car brand, or plate number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ 
                                width: '100%',
                                maxWidth: 600,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Icon icon="mdi:magnify" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <Icon icon="mdi:close" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Typography variant="body2" color="textSecondary">
                            {filteredCustomers.length} customer(s) found
                        </Typography>
                    </Box>
                </Box>

                {/* Data Table */}
                <Box sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    boxShadow: 1
                }}>
                    <CustomDatatable
                        dataSource={paginatedData}
                        columns={columns}
                        page={page}
                        limit={limit}
                        totalRecords={filteredCustomers.length}
                        handlePageChange={handlePageChange}
                        handleLimitChange={handleLimitChange}
                        handleSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onRowClick={handleRowClick}
                        getRowStyle={getRowStyle}
                    />
                </Box>

                {/* Floating Action Button for mobile */}
                {isMobile && (
                    <Fab
                        color="primary"
                        sx={{ position: 'fixed', bottom: 16, right: 16 }}
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Icon icon="mdi:plus" />
                    </Fab>
                )}
            </Box>

            {/* Create Customer Dialog */}
            <CreateCustomerDialog
                open={isCreateDialogOpen}
                onClose={(refresh) => {
                    setIsCreateDialogOpen(false);
                    if (refresh) {
                        getData();
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
            <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button variant="outlined" onClick={closeDeleteDialog}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteCustomer}
                                startIcon={<Icon icon="mdi:delete" />}
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