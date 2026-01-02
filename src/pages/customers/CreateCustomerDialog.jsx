import { Icon } from '@iconify/react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Paper,
    IconButton,
    Alert
} from '@mui/material';
import { useState } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';

const steps = ['Customer Info', 'Car Details', 'Upload Photos'];

export default function CreateCustomerDialog({ open, onClose }) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({
        leftSide: null,
        rightSide: null,
        front: null,
        back: null
    });
    
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
        setUploadedFiles(prev => ({
            ...prev,
            [side]: file
        }));
    };

    const validateStep = () => {
        const newErrors = {};
        
        if (activeStep === 0) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email is invalid';
            }
        }
        
        if (activeStep === 1) {
            if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
            if (!formData.carBrand.trim()) newErrors.carBrand = 'Car brand is required';
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
            
            // Step 1: Create customer
            const customerResponse = await CustomerDAO.createCustomer(formData);
            
            if (!customerResponse.success) {
                throw new Error(customerResponse.error || 'Failed to create customer');
            }
            
            const customerId = customerResponse.customer.id;
            
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
            
            message('Customer created successfully!', 'success');
            onClose(true); // Refresh data
            resetForm();
            
        } catch (error) {
            console.error('Error creating customer:', error);
            message(error.error || 'Failed to create customer', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    const resetForm = () => {
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
        setActiveStep(0);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose(false);
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Customer Name *"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email *"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={errors.email}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                );
                
            case 1:
                return (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Car Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Car Owner Name"
                                name="carOwnerName"
                                value={formData.carOwnerName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Car Brand *"
                                name="carBrand"
                                value={formData.carBrand}
                                onChange={handleChange}
                                error={!!errors.carBrand}
                                helperText={errors.carBrand}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Car Model"
                                name="carModel"
                                value={formData.carModel}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Plate Number *"
                                name="plateNumber"
                                value={formData.plateNumber}
                                onChange={handleChange}
                                error={!!errors.plateNumber}
                                helperText={errors.plateNumber}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Chassis Number"
                                name="chassisNumber"
                                value={formData.chassisNumber}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Engine Number"
                                name="engineNumber"
                                value={formData.engineNumber}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Due Date"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                );
                
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Upload Car Photos (Optional)
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Upload 4 photos: left side, right side, front, and back of the car.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {['leftSide', 'rightSide', 'front', 'back'].map((side) => (
                                <Grid item xs={12} sm={6} key={side}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            backgroundColor: uploadedFiles[side] ? '#e8f5e8' : 'inherit',
                                            borderColor: uploadedFiles[side] ? '#4caf50' : 'inherit',
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
                                        <Icon 
                                            icon="mdi:camera" 
                                            width={40} 
                                            color={uploadedFiles[side] ? '#4caf50' : '#9e9e9e'} 
                                        />
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                        </Typography>
                                        {uploadedFiles[side] && (
                                            <Typography variant="caption" color="success.main">
                                                ✓ {uploadedFiles[side].name}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Photos can also be uploaded later from the customer details page.
                        </Alert>
                    </Box>
                );
                
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Create New Customer</Typography>
                    <IconButton onClick={handleClose} size="small">
                        <Icon icon="mdi:close" />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                
                {renderStepContent()}
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<Icon icon="mdi:chevron-left" />}
                >
                    Back
                </Button>
                
                <Box sx={{ flex: 1 }} />
                
                {activeStep === steps.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={<Icon icon="mdi:check" />}
                        disabled={loading}
                    >
                        Create Customer
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<Icon icon="mdi:chevron-right" />}
                    >
                        Next
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}