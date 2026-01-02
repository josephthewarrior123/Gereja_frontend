import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    Grid,
    TextField,
    Paper,
    Alert,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';

const steps = ['Customer Information', 'Car Details', 'Upload Photos', 'Review & Submit'];

export default function CustomerCreatePage() {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({
        leftSide: null,
        rightSide: null,
        front: null,
        back: null
    });
    const [previewUrls, setPreviewUrls] = useState({});
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [createdCustomer, setCreatedCustomer] = useState(null);
    
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
        // Customer Info
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        
        // Car Details
        carOwnerName: '',
        carBrand: '',
        carModel: '',
        plateNumber: '',
        chassisNumber: '',
        engineNumber: '',
        dueDate: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user types
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
            
            // Create preview URL
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
        setUploadedFiles(prev => ({
            ...prev,
            [side]: null
        }));
        setPreviewUrls(prev => {
            const newUrls = { ...prev };
            delete newUrls[side];
            return newUrls;
        });
    };

    const validateStep = () => {
        const newErrors = {};
        
        switch (activeStep) {
            case 0:
                if (!formData.name.trim()) newErrors.name = 'Name is required';
                if (!formData.email.trim()) newErrors.email = 'Email is required';
                if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
                    newErrors.email = 'Email is invalid';
                }
                break;
            case 1:
                if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
                if (!formData.carBrand.trim()) newErrors.carBrand = 'Car brand is required';
                break;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            loadingProvider.start();
            setLoading(true);
            
            // Step 1: Create customer
            const customerResponse = await CustomerDAO.createCustomer(formData);
            
            if (!customerResponse.success) {
                throw new Error(customerResponse.error || 'Failed to create customer');
            }
            
            const customerId = customerResponse.customer.id;
            setCreatedCustomer(customerResponse.customer);
            
            // Step 2: Upload photos if any
            const hasPhotos = Object.values(uploadedFiles).some(file => file !== null);
            
            if (hasPhotos) {
                const formDataObj = new FormData();
                Object.entries(uploadedFiles).forEach(([side, file]) => {
                    if (file) {
                        formDataObj.append(side, file);
                    }
                });
                
                await CustomerDAO.uploadCarPhotos(customerId, formDataObj);
            }
            
            setShowSuccessDialog(true);
            
        } catch (error) {
            console.error('Error creating customer:', error);
            message(error.error || 'Failed to create customer', 'error');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const handleSuccessClose = (action) => {
        setShowSuccessDialog(false);
        if (action === 'view') {
            navigate(`/customers/${createdCustomer.id}`);
        } else if (action === 'list') {
            navigate('/customers');
        } else {
            // Reset form for new entry
            setActiveStep(0);
            setFormData({
                name: '',
                email: '',
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
            setUploadedFiles({
                leftSide: null,
                rightSide: null,
                front: null,
                back: null
            });
            setPreviewUrls({});
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Customer Information
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Enter the customer's personal details.
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Full Name *"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                                size="medium"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email Address *"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={errors.email}
                                required
                                size="medium"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                size="medium"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                size="medium"
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
                                rows={3}
                                size="medium"
                            />
                        </Grid>
                    </Grid>
                );
                
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Car Information
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Enter the vehicle details for insurance purposes.
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Owner Name"
                                name="carOwnerName"
                                value={formData.carOwnerName}
                                onChange={handleChange}
                                size="medium"
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
                                size="medium"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Model"
                                name="carModel"
                                value={formData.carModel}
                                onChange={handleChange}
                                size="medium"
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
                                size="medium"
                                placeholder="B 1234 ABC"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Chassis Number"
                                name="chassisNumber"
                                value={formData.chassisNumber}
                                onChange={handleChange}
                                size="medium"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Engine Number"
                                name="engineNumber"
                                value={formData.engineNumber}
                                onChange={handleChange}
                                size="medium"
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
                                size="medium"
                            />
                        </Grid>
                    </Grid>
                );
                
            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Upload Car Photos
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Upload 4 photos of the car for documentation. This step is optional and can be done later.
                            </Typography>
                        </Grid>
                        
                        {['leftSide', 'rightSide', 'front', 'back'].map((side) => (
                            <Grid item xs={12} sm={6} key={side}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: uploadedFiles[side] ? '#f0f9ff' : 'inherit',
                                        border: '2px dashed',
                                        borderColor: uploadedFiles[side] ? '#1976d2' : '#e0e0e0',
                                        '&:hover': { borderColor: '#1976d2', backgroundColor: '#f5f5f5' }
                                    }}
                                    onClick={() => !uploadedFiles[side] && document.getElementById(`file-${side}`).click()}
                                >
                                    <input
                                        id={`file-${side}`}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleFileUpload(side, e.target.files[0])}
                                    />
                                    
                                    {previewUrls[side] ? (
                                        <Box sx={{ position: 'relative' }}>
                                            <Box
                                                component="img"
                                                src={previewUrls[side]}
                                                alt={`Car ${side}`}
                                                sx={{
                                                    width: '100%',
                                                    height: 150,
                                                    objectFit: 'cover',
                                                    borderRadius: 1,
                                                    mb: 1
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(side);
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    backgroundColor: 'rgba(255,255,255,0.8)'
                                                }}
                                            >
                                                <Icon icon="mdi:close" />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box sx={{ py: 4 }}>
                                            <Icon icon="mdi:camera-plus" width={48} color="#9e9e9e" />
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Click to upload
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                        {uploadedFiles[side]?.name || 'No file selected'}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                        
                        <Grid item xs={12}>
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Note:</strong> Photos can also be uploaded later from the customer details page. 
                                    Maximum file size is 10MB per photo.
                                </Typography>
                            </Alert>
                        </Grid>
                    </Grid>
                );
                
            case 3:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Review Information
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Please review all information before submitting.
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Customer Details
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Name" value={formData.name} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Email" value={formData.email} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Phone" value={formData.phone || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Address" value={formData.address || 'Not provided'} />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Car Details
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Car Owner" value={formData.carOwnerName || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Car Brand" value={formData.carBrand} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Car Model" value={formData.carModel || 'Not provided'} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <DetailRow label="Plate Number" value={formData.plateNumber} />
                                        </Grid>
                                        {formData.dueDate && (
                                            <Grid item xs={12}>
                                                <DetailRow label="Due Date" value={new Date(formData.dueDate).toLocaleDateString('id-ID')} />
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Photos Uploaded ({Object.values(uploadedFiles).filter(f => f).length}/4)
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {Object.entries(uploadedFiles).map(([side, file]) => (
                                            file && (
                                                <Grid item xs={12} sm={6} md={3} key={side}>
                                                    <Paper sx={{ p: 1, textAlign: 'center' }}>
                                                        <Typography variant="caption" display="block">
                                                            {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                                        </Typography>
                                                        <Typography variant="caption" color="success.main">
                                                            ✓ Uploaded
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            )
                                        ))}
                                        {Object.values(uploadedFiles).filter(f => f).length === 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                                    No photos uploaded
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                );
                
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Create New Customer
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Icon icon="mdi:arrow-left" />}
                        onClick={() => navigate('/customers')}
                    >
                        Back to List
                    </Button>
                </Box>
                
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Form Content */}
            <Paper sx={{ p: 4, mb: 3 }}>
                {renderStepContent()}
            </Paper>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<Icon icon="mdi:chevron-left" />}
                >
                    Back
                </Button>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {activeStep === steps.length - 1 ? (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => setActiveStep(0)}
                                startIcon={<Icon icon="mdi:refresh" />}
                            >
                                Start Over
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading}
                                startIcon={<Icon icon="mdi:check" />}
                                size="large"
                            >
                                {loading ? 'Creating...' : 'Create Customer'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={<Icon icon="mdi:chevron-right" />}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="mdi:check-circle" color="#4caf50" width={24} />
                        <Typography variant="h6">Customer Created Successfully!</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        Customer <strong>{createdCustomer?.name}</strong> has been created successfully.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Customer ID: <strong>{createdCustomer?.id}</strong>
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => handleSuccessClose('another')}
                    >
                        Create Another
                    </Button>
                    <Button
                        onClick={() => handleSuccessClose('list')}
                        variant="outlined"
                    >
                        Back to List
                    </Button>
                    <Button
                        onClick={() => handleSuccessClose('view')}
                        variant="contained"
                        startIcon={<Icon icon="mdi:eye" />}
                    >
                        View Customer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

function DetailRow({ label, value }) {
    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
                {label}
            </Typography>
            <Typography variant="body1">
                {value}
            </Typography>
        </Box>
    );
}