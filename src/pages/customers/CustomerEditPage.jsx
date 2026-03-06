import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
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
    Stack
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import FormInput from '../../reusables/form/FormInput';
import FormFileUpload from '../../reusables/form/FormFileUpload';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
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
            <Container sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Loading customer data...</Typography>
            </Container>
        );
    }

    const carPhotoSides = [
        { key: 'leftSide', label: 'Left Side', icon: 'mdi:car-side' },
        { key: 'rightSide', label: 'Right Side', icon: 'mdi:car-side' },
        { key: 'front', label: 'Front', icon: 'mdi:car-front' },
        { key: 'back', label: 'Back', icon: 'mdi:car-back' }
    ];

    const documentTypes = [
        { key: 'stnk', label: 'STNK', description: 'Vehicle Registration', icon: 'mdi:card-account-details' },
        { key: 'sim', label: 'SIM', description: 'Driver License', icon: 'mdi:card-account-details-outline' },
        { key: 'ktp', label: 'KTP', description: 'ID Card', icon: 'mdi:badge-account-horizontal' }
    ];

    return (
        <Box sx={{
            bgcolor: '#F8FAFC',
            minHeight: '100vh',
            pb: 6
        }}>
            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
                {/* Header Section - Improved spacing and hierarchy */}
                <Box sx={{ mb: 5 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                        spacing={3}
                        sx={{ mb: 4 }}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1E293B',
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.125rem' }
                                }}
                            >
                                Edit Customer
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#64748B',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}
                            >
                                Customer ID: <Box component="span" sx={{ color: '#475569' }}>{id}</Box>
                            </Typography>
                        </Box>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<Icon icon="mdi:arrow-left" />}
                                onClick={() => navigate(`/customers/${id}`)}
                                sx={{
                                    borderColor: '#E2E8F0',
                                    color: '#475569',
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1.25,
                                    textTransform: 'none',
                                    fontSize: '0.9375rem',
                                    borderRadius: 2,
                                    '&:hover': {
                                        borderColor: '#CBD5E1',
                                        bgcolor: '#F8FAFC'
                                    }
                                }}
                            >
                                View Details
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving || compressing}
                                startIcon={<Icon icon="mdi:content-save" />}
                                sx={{
                                    bgcolor: '#1E40AF',
                                    color: '#fff',
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1.25,
                                    textTransform: 'none',
                                    fontSize: '0.9375rem',
                                    borderRadius: 2,
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                                    '&:hover': {
                                        bgcolor: '#1E3A8A',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
                                    },
                                    '&:disabled': {
                                        bgcolor: '#94A3B8',
                                        color: '#fff'
                                    }
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Improved Tabs */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: '1px solid #E2E8F0',
                            bgcolor: '#fff',
                            overflow: 'hidden'
                        }}
                    >
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant={isMobile ? "scrollable" : "fullWidth"}
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.9375rem',
                                    color: '#64748B',
                                    py: 2.5,
                                    minHeight: 64,
                                    '&.Mui-selected': {
                                        color: '#1E40AF'
                                    }
                                },
                                '& .MuiTabs-indicator': {
                                    height: 3,
                                    bgcolor: '#1E40AF',
                                    borderRadius: '3px 3px 0 0'
                                }
                            }}
                        >
                            <Tab label="Customer Info" />
                            <Tab label="Car Details" />
                            <Tab label="Documents" />
                            <Tab label="Photos" />
                        </Tabs>
                    </Paper>
                </Box>

                {/* Compression Alert */}
                {compressing && (
                    <Alert
                        severity="info"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid #BFDBFE',
                            bgcolor: '#EFF6FF'
                        }}
                    >
                        Compressing files...
                    </Alert>
                )}

                {/* Main Content Paper - Enhanced design */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 3,
                        border: '1px solid #E2E8F0',
                        bgcolor: '#fff',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {/* Tab Panel 1: Customer Info */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid size={12}>
                                <FormInput
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    required
                                    icon="lucide:user"
                                    placeholder="John Doe"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormInput
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    icon="lucide:phone"
                                    placeholder="+62 812 3456 7890"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormInput
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    icon="lucide:map-pin"
                                    placeholder="1234 Main St"
                                />
                            </Grid>
                            <Grid size={12}>
                                <FormInput
                                    label="Additional Notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    icon="lucide:file-text"
                                    placeholder="Add any additional details..."
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab Panel 2: Car Details */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Car Owner Name"
                                    name="carOwnerName"
                                    value={formData.carOwnerName}
                                    onChange={handleChange}
                                    icon="lucide:user"
                                    placeholder="Owner Name"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Car Brand"
                                    name="carBrand"
                                    value={formData.carBrand}
                                    onChange={handleChange}
                                    error={errors.carBrand}
                                    required
                                    icon="lucide:car"
                                    placeholder="Toyota"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Car Model"
                                    name="carModel"
                                    value={formData.carModel}
                                    onChange={handleChange}
                                    icon="lucide:car"
                                    placeholder="Avanza"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Plate Number"
                                    name="plateNumber"
                                    value={formData.plateNumber}
                                    onChange={handleChange}
                                    error={errors.plateNumber}
                                    required
                                    icon="lucide:hash"
                                    placeholder="B 1234 ABC"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Chassis Number"
                                    name="chassisNumber"
                                    value={formData.chassisNumber}
                                    onChange={handleChange}
                                    icon="lucide:barcode"
                                    placeholder="MH..."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Engine Number"
                                    name="engineNumber"
                                    value={formData.engineNumber}
                                    onChange={handleChange}
                                    icon="lucide:settings"
                                    placeholder="ENG..."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Car Price"
                                    name="carPrice"
                                    value={formatCurrency(formData.carPrice)}
                                    onChange={handleCurrencyChange}
                                    icon="lucide:dollar-sign"
                                    placeholder="150,000,000"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    Vehicle price in Indonesian Rupiah
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormInput
                                    label="Insurance Due Date"
                                    name="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    icon="lucide:calendar"
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab Panel 3: Documents */}
                    <TabPanel value={tabValue} index={2}>
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1E293B',
                                    mb: 2,
                                    fontSize: '1.125rem'
                                }}
                            >
                                Vehicle Documents
                            </Typography>
                            <Alert
                                severity="info"
                                icon={<Icon icon="mdi:information-outline" />}
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid #BFDBFE',
                                    bgcolor: '#EFF6FF',
                                    '& .MuiAlert-message': {
                                        color: '#1E40AF',
                                        fontWeight: 500,
                                        fontSize: '0.875rem'
                                    }
                                }}
                            >
                                Upload document files here. Documents are optional. Accepts images and PDF files up to 5MB each.
                            </Alert>
                        </Box>

                        <Grid container spacing={3}>
                            {documentTypes.map(({ key, label, description, icon }) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid #E2E8F0',
                                            borderRadius: 3,
                                            height: '100%',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                                                borderColor: '#CBD5E1'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Stack spacing={2}>
                                                <Box>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: '#1E293B',
                                                            mb: 0.5,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {label}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: '#64748B',
                                                            fontSize: '0.8125rem',
                                                            display: 'block',
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {description}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    {documentPreviewUrls[key] ? (
                                                        <Stack spacing={2}>
                                                            <Box sx={{ position: 'relative' }}>
                                                                <CardMedia
                                                                    component={documentPreviewUrls[key].includes('pdf') ? 'iframe' : 'img'}
                                                                    src={documentPreviewUrls[key]}
                                                                    alt={`${label} document`}
                                                                    sx={{
                                                                        height: 128,
                                                                        width: '100%',
                                                                        objectFit: documentPreviewUrls[key].includes('pdf') ? 'contain' : 'cover',
                                                                        borderRadius: 2,
                                                                        cursor: 'pointer',
                                                                        border: '2px solid #E2E8F0',
                                                                        '&:hover': { borderColor: '#1E40AF' }
                                                                    }}
                                                                    onClick={() => viewDocument(key)}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeDocumentFile(key);
                                                                    }}
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: 8,
                                                                        right: 8,
                                                                        bgcolor: 'rgba(255,255,255,0.9)',
                                                                        '&:hover': { bgcolor: '#FEE2E2', color: '#DC2626' }
                                                                    }}
                                                                >
                                                                    <Icon icon="mdi:close" width={18} />
                                                                </IconButton>
                                                            </Box>
                                                            <Button
                                                                fullWidth
                                                                variant="outlined"
                                                                startIcon={<Icon icon="mdi:upload" />}
                                                                onClick={() => document.getElementById(`doc-${key}`).click()}
                                                                sx={{ textTransform: 'none', borderRadius: 2 }}
                                                            >
                                                                Replace File
                                                            </Button>
                                                        </Stack>
                                                    ) : (
                                                        <FormFileUpload
                                                            label={`Upload ${label}`}
                                                            icon={icon}
                                                            onClick={() => document.getElementById(`doc-${key}`).click()}
                                                            file={null}
                                                        />
                                                    )}

                                                    <input
                                                        id={`doc-${key}`}
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleDocumentUpload(key, e.target.files[0])}
                                                    />
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </TabPanel>

                    {/* Tab Panel 4: Photos */}
                    <TabPanel value={tabValue} index={3}>
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1E293B',
                                    mb: 2,
                                    fontSize: '1.125rem'
                                }}
                            >
                                Car Photos
                            </Typography>
                            <Alert
                                severity="info"
                                icon={<Icon icon="mdi:information-outline" />}
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid #BFDBFE',
                                    bgcolor: '#EFF6FF',
                                    '& .MuiAlert-message': {
                                        color: '#1E40AF',
                                        fontWeight: 500,
                                        fontSize: '0.875rem'
                                    }
                                }}
                            >
                                Upload or replace car photos here. Photos are optional. Images larger than 500KB will be automatically compressed.
                            </Alert>
                        </Box>

                        <Grid container spacing={3}>
                            {carPhotoSides.map(({ key, label, icon }) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid #E2E8F0',
                                            borderRadius: 3,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="subtitle1" fontWeight={700} color="#1E293B" textAlign="center" mb={2}>
                                                {label}
                                            </Typography>

                                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                {previewUrls[key] ? (
                                                    <Stack spacing={2}>
                                                        <Box sx={{ position: 'relative' }}>
                                                            <CardMedia
                                                                component="img"
                                                                image={previewUrls[key]}
                                                                alt={`Car ${label}`}
                                                                sx={{
                                                                    height: 128,
                                                                    objectFit: 'cover',
                                                                    borderRadius: 2,
                                                                    cursor: 'pointer',
                                                                    border: '2px solid #E2E8F0',
                                                                    '&:hover': { borderColor: '#1E40AF' }
                                                                }}
                                                                onClick={() => viewPhoto(key)}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeFile(key);
                                                                }}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: 8,
                                                                    right: 8,
                                                                    bgcolor: 'rgba(255,255,255,0.9)',
                                                                    '&:hover': { bgcolor: '#FEE2E2', color: '#DC2626' }
                                                                }}
                                                            >
                                                                <Icon icon="mdi:close" width={18} />
                                                            </IconButton>
                                                        </Box>
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            startIcon={<Icon icon="mdi:camera" />}
                                                            onClick={() => document.getElementById(`file-${key}`).click()}
                                                            sx={{ textTransform: 'none', borderRadius: 2 }}
                                                        >
                                                            Replace Photo
                                                        </Button>
                                                    </Stack>
                                                ) : (
                                                    <FormFileUpload
                                                        label={`Upload ${label}`}
                                                        icon="mdi:camera-plus"
                                                        onClick={() => document.getElementById(`file-${key}`).click()}
                                                        file={null}
                                                    />
                                                )}

                                                <input
                                                    id={`file-${key}`}
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload(key, e.target.files[0])}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </TabPanel>
                </Paper>

                {/* Photo Preview Dialog - Enhanced */}
                <Dialog
                    open={showPhotoDialog}
                    onClose={() => setShowPhotoDialog(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 3,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    <DialogTitle sx={{
                        p: 3,
                        borderBottom: '1px solid #E2E8F0'
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1E293B'
                                }}
                            >
                                Photo Preview
                            </Typography>
                            <IconButton
                                onClick={() => setShowPhotoDialog(false)}
                                sx={{
                                    color: '#64748B',
                                    '&:hover': {
                                        bgcolor: '#F1F5F9'
                                    }
                                }}
                            >
                                <Icon icon="mdi:close" />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent sx={{
                        textAlign: 'center',
                        p: 4,
                        bgcolor: '#F8FAFC'
                    }}>
                        {photoToView && (
                            <img
                                src={photoToView}
                                alt="Car Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: isMobile ? '70vh' : '60vh',
                                    objectFit: 'contain',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                        )}
                    </DialogContent>
                    <DialogActions sx={{
                        p: 3,
                        borderTop: '1px solid #E2E8F0',
                        justifyContent: 'center'
                    }}>
                        <Button
                            variant="contained"
                            onClick={() => setShowPhotoDialog(false)}
                            sx={{
                                minWidth: 120,
                                bgcolor: '#1E40AF',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                py: 1.25,
                                '&:hover': {
                                    bgcolor: '#1E3A8A'
                                }
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Document Preview Dialog - Enhanced */}
                <Dialog
                    open={showDocumentDialog}
                    onClose={() => setShowDocumentDialog(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 3,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    <DialogTitle sx={{
                        p: 3,
                        borderBottom: '1px solid #E2E8F0'
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1E293B'
                                }}
                            >
                                Document Preview
                            </Typography>
                            <IconButton
                                onClick={() => setShowDocumentDialog(false)}
                                sx={{
                                    color: '#64748B',
                                    '&:hover': {
                                        bgcolor: '#F1F5F9'
                                    }
                                }}
                            >
                                <Icon icon="mdi:close" />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent sx={{
                        textAlign: 'center',
                        p: 4,
                        height: '70vh',
                        bgcolor: '#F8FAFC'
                    }}>
                        {documentToView && (
                            documentToView.includes('pdf') ? (
                                <iframe
                                    src={documentToView}
                                    title="Document Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        borderRadius: '12px'
                                    }}
                                />
                            ) : (
                                <img
                                    src={documentToView}
                                    alt="Document Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                            )
                        )}
                    </DialogContent>
                    <DialogActions sx={{
                        p: 3,
                        borderTop: '1px solid #E2E8F0',
                        justifyContent: 'center'
                    }}>
                        <Button
                            variant="contained"
                            onClick={() => setShowDocumentDialog(false)}
                            sx={{
                                minWidth: 120,
                                bgcolor: '#1E40AF',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                py: 1.25,
                                '&:hover': {
                                    bgcolor: '#1E3A8A'
                                }
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}