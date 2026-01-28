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
    useTheme,
    Divider,
    Chip
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

// Helper function untuk format currency
const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toLocaleString('id-ID');
};

// Helper function untuk compress image
const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log(`📸 Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image load error'));
        };
        reader.onerror = () => reject(new Error('FileReader error'));
    });
};

export default function CustomerEditPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [tabValue, setTabValue] = useState(0);
    const [customer, setCustomer] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [documentFiles, setDocumentFiles] = useState({});
    const [previewUrls, setPreviewUrls] = useState({});
    const [documentPreviewUrls, setDocumentPreviewUrls] = useState({});
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [showDocumentDialog, setShowDocumentDialog] = useState(false);
    const [photoToView, setPhotoToView] = useState(null);
    const [documentToView, setDocumentToView] = useState(null);
    const [compressing, setCompressing] = useState(false);
    
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
        dueDate: '',
        carPrice: ''
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
                    dueDate: response.customer.carData?.dueDate || '',
                    carPrice: response.customer.carData?.carPrice?.toString() || ''
                });
                
                // Set existing photo URLs as previews
                const existingPreviews = {};
                Object.entries(response.customer.carPhotos || {}).forEach(([side, url]) => {
                    if (url) existingPreviews[side] = url;
                });
                setPreviewUrls(existingPreviews);
                
                // Set existing document URLs as previews
                const existingDocPreviews = {};
                Object.entries(response.customer.documentPhotos || {}).forEach(([type, url]) => {
                    if (url) existingDocPreviews[type] = url;
                });
                setDocumentPreviewUrls(existingDocPreviews);
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

    const handleCurrencyChange = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            carPrice: numericValue
        }));
    };

    const handleFileUpload = async (side, file) => {
        if (file) {
            try {
                setCompressing(true);
                
                let processedFile = file;
                if (file.type.startsWith('image/') && file.size > 500 * 1024) {
                    console.log(`🔧 Compressing ${file.name}...`);
                    processedFile = await compressImage(file);
                }
                
                setUploadedFiles(prev => ({
                    ...prev,
                    [side]: processedFile
                }));
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPreviewUrls(prev => ({
                        ...prev,
                        [side]: e.target.result
                    }));
                };
                reader.readAsDataURL(processedFile);
            } catch (error) {
                console.error('Compression error:', error);
                message('Failed to process image', 'error');
            } finally {
                setCompressing(false);
            }
        }
    };

    const handleDocumentUpload = async (type, file) => {
        if (file) {
            try {
                setCompressing(true);
                
                let processedFile = file;
                if (file.type.startsWith('image/') && file.size > 500 * 1024) {
                    console.log(`🔧 Compressing document ${file.name}...`);
                    processedFile = await compressImage(file);
                }
                
                setDocumentFiles(prev => ({
                    ...prev,
                    [type]: processedFile
                }));
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    setDocumentPreviewUrls(prev => ({
                        ...prev,
                        [type]: e.target.result
                    }));
                };
                reader.readAsDataURL(processedFile);
            } catch (error) {
                console.error('Document compression error:', error);
                message('Failed to process document', 'error');
            } finally {
                setCompressing(false);
            }
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

    const removeDocumentFile = (type) => {
        setDocumentFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[type];
            return newFiles;
        });
        setDocumentPreviewUrls(prev => {
            const newUrls = { ...prev };
            delete newUrls[type];
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
                    dueDate: formData.dueDate,
                    carPrice: formData.carPrice ? parseFloat(formData.carPrice) : 0
                }
            };
            
            console.log('📝 Updating customer with data:', updateData);
            
            const response = await CustomerDAO.updateCustomer(id, updateData);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update customer');
            }
            
            console.log('✅ Customer data updated successfully');
            
            // Upload new documents if any
            const hasNewDocuments = Object.keys(documentFiles).length > 0;
            if (hasNewDocuments) {
                console.log('📄 Uploading new documents...');
                const formDataObj = new FormData();
                Object.entries(documentFiles).forEach(([type, file]) => {
                    if (file) {
                        formDataObj.append(type, file);
                    }
                });
                
                try {
                    await CustomerDAO.uploadDocuments(id, formDataObj);
                    console.log('✅ Documents uploaded successfully');
                } catch (docError) {
                    console.warn('⚠️ Document upload failed:', docError);
                    message('Customer updated but failed to upload some documents. You can try again later.', 'warning');
                }
            }
            
            // Upload new photos if any
            const hasNewPhotos = Object.keys(uploadedFiles).length > 0;
            if (hasNewPhotos) {
                console.log('📸 Uploading new photos...');
                const formDataObj = new FormData();
                Object.entries(uploadedFiles).forEach(([side, file]) => {
                    if (file) {
                        formDataObj.append(side, file);
                    }
                });
                
                try {
                    await CustomerDAO.uploadCarPhotos(id, formDataObj);
                    console.log('✅ Photos uploaded successfully');
                } catch (photoError) {
                    console.warn('⚠️ Photo upload failed:', photoError);
                    message('Customer updated but failed to upload some photos. You can try again later.', 'warning');
                }
            }
            
            message('Customer updated successfully!', 'success');
            navigate(`/customers/${id}`);
            
        } catch (error) {
            console.error('❌ Error updating customer:', error);
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

    const viewDocument = (type) => {
        if (documentPreviewUrls[type]) {
            setDocumentToView(documentPreviewUrls[type]);
            setShowDocumentDialog(true);
        }
    };

    if (loading) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Typography>Loading customer data...</Typography>
            </Container>
        );
    }

    const carPhotoSides = [
        { key: 'leftSide', label: 'Left Side' },
        { key: 'rightSide', label: 'Right Side' },
        { key: 'front', label: 'Front' },
        { key: 'back', label: 'Back' }
    ];

    const documentTypes = [
        { key: 'stnk', label: 'STNK', description: 'Vehicle Registration' },
        { key: 'sim', label: 'SIM', description: 'Driver License' },
        { key: 'ktp', label: 'KTP', description: 'ID Card' }
    ];

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
                            disabled={saving || compressing}
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
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                >
                    <Tab label="Customer Info" />
                    <Tab label="Car Details" />
                    <Tab label="Documents" />
                    <Tab label="Photos" />
                </Tabs>
            </Box>

            {compressing && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Compressing files...
                </Alert>
            )}

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
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Vehicle Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        
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
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Price (IDR)"
                                name="carPrice"
                                value={formatCurrency(formData.carPrice)}
                                onChange={handleCurrencyChange}
                                placeholder="150,000,000"
                                helperText="Vehicle price in Indonesian Rupiah"
                                size={isMobile ? "medium" : "small"}
                                InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                            <Typography variant="subtitle1" gutterBottom>
                                Vehicle Documents
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Upload document files here. Documents are optional. Accepts images and PDF files up to 5MB each.
                            </Alert>
                        </Grid>
                        
                        {documentTypes.map(({ key, label, description }) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <Card>
                                    <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            {label}
                                        </Typography>
                                        
                                        {documentPreviewUrls[key] ? (
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component={documentPreviewUrls[key].includes('pdf') ? 'iframe' : 'img'}
                                                    src={documentPreviewUrls[key]}
                                                    alt={`${label} document`}
                                                    sx={{
                                                        height: isMobile ? 120 : 140,
                                                        width: '100%',
                                                        objectFit: documentPreviewUrls[key].includes('pdf') ? 'contain' : 'cover',
                                                        borderRadius: 1,
                                                        cursor: 'pointer',
                                                        border: '1px solid #e0e0e0'
                                                    }}
                                                    onClick={() => viewDocument(key)}
                                                />
                                                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeDocumentFile(key);
                                                        }}
                                                        sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                                                    >
                                                        <Icon icon="mdi:close" width={16} />
                                                    </IconButton>
                                                </Box>
                                                <Chip 
                                                    label="Uploaded" 
                                                    size="small" 
                                                    color="success" 
                                                    variant="filled"
                                                    sx={{ position: 'absolute', top: 4, left: 4 }}
                                                />
                                            </Box>
                                        ) : (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    height: isMobile ? 120 : 140,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    '&:hover': { borderColor: '#1976d2' }
                                                }}
                                                onClick={() => document.getElementById(`doc-${key}`).click()}
                                            >
                                                <input
                                                    id={`doc-${key}`}
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleDocumentUpload(key, e.target.files[0])}
                                                />
                                                <Icon icon="mdi:file-upload" width={isMobile ? 32 : 40} color="#9e9e9e" />
                                            </Paper>
                                        )}
                                        
                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                            {description}
                                        </Typography>
                                        
                                        <Button
                                            size="small"
                                            fullWidth
                                            sx={{ mt: 1 }}
                                            onClick={() => document.getElementById(`doc-${key}`).click()}
                                        >
                                            {documentPreviewUrls[key] ? 'Replace File' : 'Upload File'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Car Photos
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Upload or replace car photos here. Photos are optional. Images larger than 500KB will be automatically compressed.
                            </Alert>
                        </Grid>
                        
                        {carPhotoSides.map(({ key, label }) => (
                            <Grid item xs={12} sm={6} md={3} key={key}>
                                <Card>
                                    <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            {label}
                                        </Typography>
                                        
                                        {previewUrls[key] ? (
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component="img"
                                                    image={previewUrls[key]}
                                                    alt={`Car ${label}`}
                                                    sx={{
                                                        height: isMobile ? 100 : 120,
                                                        objectFit: 'cover',
                                                        borderRadius: 1,
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => viewPhoto(key)}
                                                />
                                                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(key);
                                                        }}
                                                        sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                                                    >
                                                        <Icon icon="mdi:close" width={16} />
                                                    </IconButton>
                                                </Box>
                                                <Chip 
                                                    label="Uploaded" 
                                                    size="small" 
                                                    color="success" 
                                                    variant="filled"
                                                    sx={{ position: 'absolute', top: 4, left: 4 }}
                                                />
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
                                                onClick={() => document.getElementById(`file-${key}`).click()}
                                            >
                                                <input
                                                    id={`file-${key}`}
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload(key, e.target.files[0])}
                                                />
                                                <Icon icon="mdi:camera-plus" width={isMobile ? 32 : 40} color="#9e9e9e" />
                                            </Paper>
                                        )}
                                        
                                        <Button
                                            size="small"
                                            fullWidth
                                            sx={{ mt: 1 }}
                                            onClick={() => document.getElementById(`file-${key}`).click()}
                                        >
                                            {previewUrls[key] ? 'Replace Photo' : 'Upload Photo'}
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

            {/* Document Preview Dialog */}
            <Dialog 
                open={showDocumentDialog} 
                onClose={() => setShowDocumentDialog(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant={isMobile ? "h6" : "h5"}>Document Preview</Typography>
                        <IconButton onClick={() => setShowDocumentDialog(false)} size="small">
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: { xs: 1, sm: 3 }, height: '70vh' }}>
                    {documentToView && (
                        documentToView.includes('pdf') ? (
                            <iframe
                                src={documentToView}
                                title="Document Preview"
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    border: 'none' 
                                }}
                            />
                        ) : (
                            <img
                                src={documentToView}
                                alt="Document Preview"
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '100%', 
                                    objectFit: 'contain' 
                                }}
                            />
                        )
                    )}
                </DialogContent>
                <DialogActions sx={{ 
                    justifyContent: 'center', 
                    pb: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' }
                }}>
                    <Button
                        variant="contained"
                        onClick={() => setShowDocumentDialog(false)}
                        fullWidth={isMobile}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}