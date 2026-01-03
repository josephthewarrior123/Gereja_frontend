import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    TextField,
    Paper,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme
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

export default function CustomerEditPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [tabValue, setTabValue] = useState(0);
    const [customer, setCustomer] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [previewUrls, setPreviewUrls] = useState({});
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [photoToView, setPhotoToView] = useState(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        notes: '',
        carOwnerName: '',
        carBrand: '',
        carModel: '',
        plateNumber: '',
        chassisNumber: '',
        engineNumber: '',
        dueDate: ''
    });

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.getCustomerById(id);
            
            if (response.success) {
                setCustomer(response.customer);
                setFormData({
                    name: response.customer.name || '',
                    phone: response.customer.phone || '',
                    address: response.customer.address || '',
                    notes: response.customer.notes || '',
                    carOwnerName: response.customer.carData?.ownerName || '',
                    carBrand: response.customer.carData?.carBrand || '',
                    carModel: response.customer.carData?.carModel || '',
                    plateNumber: response.customer.carData?.plateNumber || '',
                    chassisNumber: response.customer.carData?.chassisNumber || '',
                    engineNumber: response.customer.carData?.engineNumber || '',
                    dueDate: response.customer.carData?.dueDate || ''
                });
                
                // Set existing photo URLs as previews
                const existingPreviews = {};
                Object.entries(response.customer.carPhotos || {}).forEach(([side, url]) => {
                    if (url) existingPreviews[side] = url;
                });
                setPreviewUrls(existingPreviews);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileUpload = (side, file) => {
        if (file) {
            setUploadedFiles(prev => ({
                ...prev,
                [side]: file
            }));
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrls(prev => ({
                    ...prev,
                    [side]: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = (side) => {
        setUploadedFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[side];
            return newFiles;
        });
        setPreviewUrls(prev => {
            const newUrls = { ...prev };
            delete newUrls[side];
            return newUrls;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
        if (!formData.carBrand.trim()) newErrors.carBrand = 'Car brand is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        try {
            setSaving(true);
            loadingProvider.start();
            
            // Update customer data
            const updateData = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                notes: formData.notes,
                carData: {
                    ownerName: formData.carOwnerName,
                    carBrand: formData.carBrand,
                    carModel: formData.carModel,
                    plateNumber: formData.plateNumber,
                    chassisNumber: formData.chassisNumber,
                    engineNumber: formData.engineNumber,
                    dueDate: formData.dueDate
                }
            };
            
            const response = await CustomerDAO.updateCustomer(id, updateData);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update customer');
            }
            
            // Upload new photos if any
            const hasNewPhotos = Object.keys(uploadedFiles).length > 0;
            if (hasNewPhotos) {
                const formDataObj = new FormData();
                Object.entries(uploadedFiles).forEach(([side, file]) => {
                    if (file) {
                        formDataObj.append(side, file);
                    }
                });
                
                await CustomerDAO.uploadCarPhotos(id, formDataObj);
            }
            
            message('Customer updated successfully!', 'success');
            navigate(`/customers/${id}`);
            
        } catch (error) {
            console.error('Error updating customer:', error);
            message(error.error || 'Failed to update customer', 'error');
        } finally {
            loadingProvider.stop();
            setSaving(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const viewPhoto = (side) => {
        if (previewUrls[side]) {
            setPhotoToView(previewUrls[side]);
            setShowPhotoDialog(true);
        }
    };

    if (loading) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Typography>Loading customer data...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                }}>
                    <Box>
                        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                            Edit Customer
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Customer ID: {id}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                            variant="outlined"
                            startIcon={<Icon icon="mdi:arrow-left" />}
                            onClick={() => navigate(`/customers/${id}`)}
                            fullWidth={isMobile}
                        >
                            View Details
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            startIcon={<Icon icon="mdi:content-save" />}
                            fullWidth={isMobile}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>

                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    sx={{ mb: 2 }}
                    variant={isMobile ? "fullWidth" : "standard"}
                >
                    <Tab label="Customer Info" />
                    <Tab label="Car Details" />
                    <Tab label="Photos" />
                </Tabs>
            </Box>

            <Paper sx={{ p: { xs: 2, sm: 4 } }}>
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Full Name *"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Additional Notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                multiline
                                rows={isMobile ? 4 : 3}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Owner Name"
                                name="carOwnerName"
                                value={formData.carOwnerName}
                                onChange={handleChange}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Brand *"
                                name="carBrand"
                                value={formData.carBrand}
                                onChange={handleChange}
                                error={!!errors.carBrand}
                                helperText={errors.carBrand}
                                required
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Model"
                                name="carModel"
                                value={formData.carModel}
                                onChange={handleChange}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Plate Number *"
                                name="plateNumber"
                                value={formData.plateNumber}
                                onChange={handleChange}
                                error={!!errors.plateNumber}
                                helperText={errors.plateNumber}
                                required
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Chassis Number"
                                name="chassisNumber"
                                value={formData.chassisNumber}
                                onChange={handleChange}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Engine Number"
                                name="engineNumber"
                                value={formData.engineNumber}
                                onChange={handleChange}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Insurance Due Date"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                size={isMobile ? "medium" : "small"}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Upload or replace car photos. New photos will replace existing ones.
                            </Alert>
                        </Grid>
                        
                        {['leftSide', 'rightSide', 'front', 'back'].map((side) => (
                            <Grid item xs={12} sm={6} md={3} key={side}>
                                <Card>
                                    <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                        </Typography>
                                        
                                        {previewUrls[side] ? (
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component="img"
                                                    image={previewUrls[side]}
                                                    alt={`Car ${side}`}
                                                    sx={{
                                                        height: isMobile ? 100 : 120,
                                                        objectFit: 'cover',
                                                        borderRadius: 1,
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => viewPhoto(side)}
                                                />
                                                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(side);
                                                        }}
                                                        sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                                                    >
                                                        <Icon icon="mdi:close" width={16} />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    height: isMobile ? 100 : 120,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    '&:hover': { borderColor: '#1976d2' }
                                                }}
                                                onClick={() => document.getElementById(`file-${side}`).click()}
                                            >
                                                <input
                                                    id={`file-${side}`}
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload(side, e.target.files[0])}
                                                />
                                                <Icon icon="mdi:camera-plus" width={isMobile ? 32 : 40} color="#9e9e9e" />
                                            </Paper>
                                        )}
                                        
                                        <Button
                                            size="small"
                                            fullWidth
                                            sx={{ mt: 1 }}
                                            onClick={() => document.getElementById(`file-${side}`).click()}
                                        >
                                            {previewUrls[side] ? 'Replace Photo' : 'Upload Photo'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Photo Preview Dialog */}
            <Dialog 
                open={showPhotoDialog} 
                onClose={() => setShowPhotoDialog(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant={isMobile ? "h6" : "h5"}>Photo Preview</Typography>
                        <IconButton onClick={() => setShowPhotoDialog(false)} size="small">
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: { xs: 1, sm: 3 } }}>
                    {photoToView && (
                        <img
                            src={photoToView}
                            alt="Car Preview"
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: isMobile ? '70vh' : '60vh', 
                                objectFit: 'contain' 
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ 
                    justifyContent: 'center', 
                    pb: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' }
                }}>
                    <Button
                        variant="contained"
                        onClick={() => setShowPhotoDialog(false)}
                        fullWidth={isMobile}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}