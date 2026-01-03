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
    Divider
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CreateCustomerDialog from './CreateCustomerDialog';
import ViewCustomerDialog from './ViewCustomerDialog';

export default function CustomerListPage() {
    const { user } = useUser();
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
                customer.phone.toLowerCase().includes(query) ||
                customer.carBrand.toLowerCase().includes(query) ||
                customer.plateNumber.toLowerCase().includes(query)
            );
            setFilteredCustomers(filtered);
        }
        setPage(0);
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
                getData();
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
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
            case 'Active': return 'success';
            case 'Expired': return 'error';
            default: return 'default';
        }
    };

    // Initial data fetch
    useEffect(() => {
        getData();
        getStats();
    }, [user]);

    // Stats Card Component
    const StatsCard = ({ icon, title, value, color }) => (
        <Card sx={{ bgcolor: color, color: 'white', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {title}
                        </Typography>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Icon icon={icon} width={isMobile ? 32 : 40} style={{ opacity: 0.8 }} />
                </Box>
            </CardContent>
        </Card>
    );

    // Mobile Customer Item
    const MobileCustomerItem = ({ customer }) => {
        return (
            <Card
                sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'visible'
                }}
            >
                {/* Status Badge */}
                <Chip
                    label={customer.status}
                    color={getStatusColor(customer.status)}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        fontWeight: 600
                    }}
                />
    
                <CardContent sx={{ pb: 1.5 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                width: 44,
                                height: 44,
                                bgcolor: '#1976d2',
                                fontWeight: 'bold'
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
    
                    {/* Info */}
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:car" width={18} />
                            <Typography variant="body2">
                                {customer.carBrand}
                            </Typography>
                        </Box>
    
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:card-text-outline" width={18} />
                            <Chip
                                label={customer.plateNumber}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
    
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:calendar" width={18} />
                            <Typography variant="body2" color="text.secondary">
                                Due {formatDate(customer.dueDate)}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
    
                <Divider />
    
                {/* Actions */}
                <Box
                    sx={{
                        px: 1.5,
                        py: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openViewDialog(customer)}
                        >
                            <Icon icon="mdi:eye" width={20} />
                        </IconButton>
    
                        <IconButton
                            size="small"
                            color="warning"
                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                        >
                            <Icon icon="mdi:pencil" width={20} />
                        </IconButton>
    
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(customer)}
                        >
                            <Icon icon="mdi:delete" width={20} />
                        </IconButton>
                    </Box>
    
                    {customer.hasPhotos && (
                        <Tooltip title="Has photos">
                            <Icon icon="mdi:camera" width={22} color="#4caf50" />
                        </Tooltip>
                    )}
                </Box>
            </Card>
        );
    };

    // Desktop Table Columns
    const columns = [
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Customer Name',
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
            key: 'carBrand',
            dataIndex: 'carBrand',
            title: 'Car Brand',
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
            render: (value) => formatDate(value)
        },
        {
            key: 'status',
            dataIndex: 'status',
            title: 'Status',
            render: (value) => {
                const color = getStatusColor(value);
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
            key: 'actions',
            dataIndex: 'actions',
            title: 'Actions',
            render: (_, row) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={() => openViewDialog(row)}
                            color="primary"
                        >
                            <Icon icon="mdi:eye" width={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/customers/edit/${row.id}`)}
                            color="warning"
                        >
                            <Icon icon="mdi:pencil" width={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(row)}
                            color="error"
                        >
                            <Icon icon="mdi:delete" width={18} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header with stats */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 3,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 }
                    }}>
                        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                            Customer Management
                        </Typography>
                        {/* Tombol New Customer hanya muncul di desktop */}
                        {!isMobile && (
                            <Button
                                variant="contained"
                                startIcon={<Icon icon="mdi:plus" />}
                                onClick={() => setIsCreateDialogOpen(true)}
                                sx={{ borderRadius: 2 }}
                            >
                                New Customer
                            </Button>
                        )}
                    </Box>

                    {/* Stats Cards */}
                    {stats && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:account-group"
                                    title="Total Customers"
                                    value={stats.totalCustomers}
                                    color="#1976d2"
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:counter"
                                    title="Current Counter"
                                    value={stats.currentCounter}
                                    color="#2e7d32"
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={3}>
                                <StatsCard 
                                    icon="mdi:id-card"
                                    title="Next ID"
                                    value={stats.nextCustomerId}
                                    color="#ed6c02"
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={3}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                        <TextField
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ 
                                width: '100%',
                                maxWidth: 600,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                            size={isMobile ? "medium" : "small"}
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

                {/* Data Display - Different for mobile and desktop */}
                {isMobile ? (
                    // Mobile View
                    <Box>
                        {filteredCustomers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((customer) => (
                                <MobileCustomerItem key={customer.id} customer={customer} />
                            ))}
                        
                        {filteredCustomers.length === 0 && (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Icon icon="mdi:account-search" width={60} color="#9e9e9e" />
                                <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                                    No customers found
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {searchQuery ? 'Try a different search' : 'Create your first customer'}
                                </Typography>
                            </Paper>
                        )}
                        
                        <TablePagination
                            component="div"
                            count={filteredCustomers.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25]}
                        />
                    </Box>
                ) : (
                    // Desktop View
                    <Paper sx={{ 
                        bgcolor: 'background.paper', 
                        borderRadius: 2, 
                        overflow: 'hidden',
                        boxShadow: 1
                    }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {columns.map((column) => (
                                            <TableCell key={column.key}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {column.title}
                                                </Typography>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCustomers
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((customer) => (
                                            <TableRow 
                                                key={customer.id}
                                                hover
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => openViewDialog(customer)}
                                            >
                                                {columns.map((column) => (
                                                    <TableCell key={column.key}>
                                                        {column.render ? 
                                                            column.render(customer[column.dataIndex], customer) : 
                                                            customer[column.dataIndex]
                                                        }
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {filteredCustomers.length === 0 && (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Icon icon="mdi:account-search" width={60} color="#9e9e9e" />
                                <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                                    No customers found
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {searchQuery ? 'Try a different search' : 'Create your first customer'}
                                </Typography>
                            </Box>
                        )}
                        
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredCustomers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                )}

                {/* Floating Action Button untuk mobile saja */}
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