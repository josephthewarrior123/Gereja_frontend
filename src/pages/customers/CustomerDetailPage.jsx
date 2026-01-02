import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Paper,
    Chip,
    Avatar,
    Divider,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Alert
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    );
}

export default function CustomerDetailPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.getCustomerById(id);
            
            if (response.success) {
                setCustomer(response.customer);
            } else {
                message(response.error || 'Customer not found', 'error');
                navigate('/customers');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            message('Failed to fetch customer', 'error');
            navigate('/customers');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.deleteCustomer(id);
            
            if (response.success) {
                message('Customer deleted successfully', 'success');
                navigate('/customers');
            } else {
                message(response.error || 'Failed to delete customer', 'error');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            message('Failed to delete customer', 'error');
        } finally {
            loadingProvider.stop();
            setShowDeleteDialog(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const viewPhoto = (side, url) => {
        setSelectedPhoto({ side, url });
        setShowPhotoDialog(true);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Not available';
        const date = new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatus = () => {
        if (!customer?.carData?.dueDate) return { label: 'Unknown', color: 'default' };
        
        const dueDate = new Date(customer.carData.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) return { label: 'Expired', color: 'error' };
        if (daysUntilDue <= 30) return { label: 'Expiring Soon', color: 'warning' };
        return { label: 'Active', color: 'success' };
    };

    if (loading) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Typography>Loading customer data...</Typography>
            </Container>
        );
    }

    if (!customer) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Typography>Customer not found</Typography>
            </Container>
        );
    }

    const status = getStatus();

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: '#1976d2', fontSize: 24 }}>
                            {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                {customer.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                    label={status.label} 
                                    color={status.color}
                                    size="small"
                                />
                                <Typography variant="body2" color="textSecondary">
                                    ID: {customer.id}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Icon icon="mdi:arrow-left" />}
                            onClick={() => navigate('/customers')}
                        >
                            Back to List
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Icon icon="mdi:delete" />}
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Icon icon="mdi:pencil" />}
                            onClick={() => navigate(`/customers/edit/${id}`)}
                        >
                            Edit Customer
                        </Button>
                    </Box>
                </Box>

                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Overview" />
                    <Tab label="Car Details" />
                    <Tab label="Photos" />
                    <Tab label="Activity" />
                </Tabs>
            </Box>

            <Paper sx={{ p: 4 }}>
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Icon icon="mdi:account" width={20} />
                                        Customer Information
                                    </Typography>
                                    <DetailItem label="Email" value={customer.email} />
                                    <DetailItem label="Phone" value={customer.phone || 'Not provided'} />
                                    <DetailItem label="Address" value={customer.address || 'Not provided'} />
                                    <DetailItem label="Notes" value={customer.notes || 'No notes'} />
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Icon icon="mdi:calendar" width={20} />
                                        Timeline
                                    </Typography>
                                    <DetailItem label="Created" value={formatDate(customer.createdAt)} />
                                    <DetailItem label="Last Updated" value={formatDate(customer.updatedAt)} />
                                    <DetailItem label="Created By" value={customer.createdBy} />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Icon icon="mdi:car" width={20} />
                                        Vehicle Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <DetailItem label="Car Owner" value={customer.carData?.ownerName || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailItem label="Car Brand" value={customer.carData?.carBrand || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailItem label="Car Model" value={customer.carData?.carModel || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailItem label="Plate Number" value={customer.carData?.plateNumber || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailItem label="Chassis Number" value={customer.carData?.chassisNumber || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailItem label="Engine Number" value={customer.carData?.engineNumber || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <DetailItem 
                                                label="Insurance Due Date" 
                                                value={customer.carData?.dueDate ? formatDate(customer.carData.dueDate) : 'Not set'} 
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {Object.values(customer.carPhotos || {}).some(url => url) ? (
                        <Grid container spacing={3}>
                            {Object.entries(customer.carPhotos || {}).map(([side, url]) => (
                                url && (
                                    <Grid item xs={12} sm={6} md={3} key={side}>
                                        <Card>
                                            <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                                </Typography>
                                                <CardMedia
                                                    component="img"
                                                    image={url}
                                                    alt={`Car ${side}`}
                                                    sx={{
                                                        height: 150,
                                                        objectFit: 'cover',
                                                        borderRadius: 1,
                                                        cursor: 'pointer',
                                                        '&:hover': { opacity: 0.9 }
                                                    }}
                                                    onClick={() => viewPhoto(side, url)}
                                                />
                                                <Button
                                                    size="small"
                                                    fullWidth
                                                    sx={{ mt: 1 }}
                                                    startIcon={<Icon icon="mdi:eye" />}
                                                    onClick={() => viewPhoto(side, url)}
                                                >
                                                    View Full Size
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )
                            ))}
                        </Grid>
                    ) : (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                No car photos uploaded yet. You can upload photos by editing this customer.
                            </Typography>
                        </Alert>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Customer Activity
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Activity history will appear here as the customer interacts with the system.
                            </Typography>
                        </CardContent>
                    </Card>
                </TabPanel>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Typography variant="h6">Confirm Delete</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        Are you sure you want to delete customer <strong>{customer.name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error">
                        This action cannot be undone. All customer data and photos will be permanently deleted.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        startIcon={<Icon icon="mdi:delete" />}
                    >
                        Delete Customer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Photo Preview Dialog */}
            <Dialog 
                open={showPhotoDialog} 
                onClose={() => setShowPhotoDialog(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedPhoto && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">
                                    {selectedPhoto.side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                </Typography>
                                <IconButton onClick={() => setShowPhotoDialog(false)} size="small">
                                    <Icon icon="mdi:close" />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ textAlign: 'center', p: 3 }}>
                            <img
                                src={selectedPhoto.url}
                                alt={`Car ${selectedPhoto.side}`}
                                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                            />
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Icon icon="mdi:download" />}
                                href={selectedPhoto.url}
                                target="_blank"
                            >
                                Download
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => setShowPhotoDialog(false)}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
}

function DetailItem({ label, value }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" display="block">
                {label}
            </Typography>
            <Typography variant="body1">
                {value}
            </Typography>
        </Box>
    );
}