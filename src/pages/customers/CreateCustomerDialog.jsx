import React, { useState } from 'react';
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
    Alert,
    useMediaQuery,
    useTheme,
    MobileStepper
} from '@mui/material';
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
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        setUploadedFiles(prev => ({
            ...prev,
            [side]: file
        }));
    };

    const validateStep = () => {
        const newErrors = {};
        
        if (activeStep === 0) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
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
            
            const customerResponse = await CustomerDAO.createCustomer(formData);
            
            if (!customerResponse.success) {
                throw new Error(customerResponse.error || 'Failed to create customer');
            }
            
            const customerId = customerResponse.customer.id;
            
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
            onClose(true);
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
                        <Grid item xs={12}>
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
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                );
                
            case 1:
                return (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
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
                        <Grid item xs={12}>
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
                                            minHeight: 120,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
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
                                            <Typography variant="caption" color="success.main" sx={{ mt: 1 }}>
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
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                        Create New Customer
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <Icon icon="mdi:close" />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                {isMobile ? (
                    <MobileStepper
                        variant="dots"
                        steps={steps.length}
                        position="static"
                        activeStep={activeStep}
                        sx={{ mb: 3, justifyContent: 'center', bgcolor: 'transparent' }}
                        nextButton={null}
                        backButton={null}
                    />
                ) : (
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                )}
                
                {renderStepContent()}
            </DialogContent>
            
            <DialogActions sx={{ 
                px: { xs: 2, sm: 3 }, 
                pb: { xs: 2, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
            }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<Icon icon="mdi:chevron-left" />}
                    fullWidth={isMobile}
                >
                    Back
                </Button>
                
                <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
                
                {activeStep === steps.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={<Icon icon="mdi:check" />}
                        disabled={loading}
                        fullWidth={isMobile}
                    >
                        Create Customer
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<Icon icon="mdi:chevron-right" />}
                        fullWidth={isMobile}
                    >
                        Next
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}