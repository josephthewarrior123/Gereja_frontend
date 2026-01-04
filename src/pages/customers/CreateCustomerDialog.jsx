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

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ⭐ TAMBAHAN: Helper function untuk compress image
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

                // Calculate new dimensions
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
                            // Create new file from blob
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

// Helper function untuk retry upload
const uploadWithRetry = async (customerId, formData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📤 Upload attempt ${attempt}/${maxRetries}`);
            
            // Tambah delay sebelum upload (semakin lama di retry selanjutnya)
            await delay(attempt * 1000);
            
            const response = await CustomerDAO.uploadCarPhotos(customerId, formData);
            
            if (response.success) {
                console.log('✅ Upload successful on attempt', attempt);
                return { success: true, data: response };
            }
            
            console.warn(`⚠️ Upload failed on attempt ${attempt}:`, response.error);
            
            // Jika sudah attempt terakhir, throw error
            if (attempt === maxRetries) {
                return { success: false, error: response.error };
            }
            
        } catch (error) {
            console.error(`❌ Upload error on attempt ${attempt}:`, error);
            
            // Jika CORS error atau network error, retry
            if (attempt < maxRetries && (
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('CORS') ||
                error.message?.includes('Network')
            )) {
                console.log(`🔄 Retrying upload... (${attempt}/${maxRetries})`);
                continue;
            }
            
            // Jika sudah attempt terakhir atau error lain, return gagal
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'Max retries reached' };
};

export default function CreateCustomerDialog({ open, onClose }) {
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({
        leftSide: null,
        rightSide: null,
        front: null,
        back: null
    });
    const [compressing, setCompressing] = useState(false);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
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

    // ⭐ UPDATED: Handle file upload dengan compression
    const handleFileUpload = async (side, file) => {
        if (!file) {
            setUploadedFiles(prev => ({
                ...prev,
                [side]: null
            }));
            return;
        }

        try {
            setCompressing(true);
            
            // Compress image jika lebih dari 500KB
            let processedFile = file;
            if (file.size > 500 * 1024) {
                console.log(`🔧 Compressing ${file.name}...`);
                processedFile = await compressImage(file);
            }
            
            setUploadedFiles(prev => ({
                ...prev,
                [side]: processedFile
            }));
        } catch (error) {
            console.error('Compression error:', error);
            message('Failed to process image', 'error');
        } finally {
            setCompressing(false);
        }
    };

    const validateStep = () => {
        const newErrors = {};
        
        if (activeStep === 0) {
            if (!formData.name.trim()) {
                newErrors.name = 'Customer name is required';
            }
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
            
            // 1. Prepare data for API
            const customerData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : '',
                phone: formData.phone ? formData.phone.trim() : '',
                address: formData.address ? formData.address.trim() : '',
                notes: formData.notes ? formData.notes.trim() : '',
                carOwnerName: formData.carOwnerName ? formData.carOwnerName.trim() : formData.name.trim(),
                carBrand: formData.carBrand ? formData.carBrand.trim() : '',
                carModel: formData.carModel ? formData.carModel.trim() : '',
                plateNumber: formData.plateNumber ? formData.plateNumber.trim() : '',
                chassisNumber: formData.chassisNumber ? formData.chassisNumber.trim() : '',
                engineNumber: formData.engineNumber ? formData.engineNumber.trim() : '',
                dueDate: formData.dueDate || null
            };
            
            console.log('🆕 Creating customer with data:', customerData);
            
            // 2. Create customer first
            const customerResponse = await CustomerDAO.createCustomer(customerData);
            
            if (!customerResponse.success) {
                throw new Error(customerResponse.error || 'Failed to create customer');
            }
            
            const customerId = customerResponse.customer.id;
            console.log('✅ Customer created with ID:', customerId);
            
            // 3. Check if there are any photos to upload
            const hasPhotos = Object.values(uploadedFiles).some(file => file !== null);
            
            if (hasPhotos) {
                console.log('📸 Preparing to upload photos for customer:', customerId);
                
                // ⏰ TAMBAHKAN DELAY 2 DETIK sebelum upload
                console.log('⏳ Waiting 2 seconds before uploading photos...');
                await delay(2000);
                
                const formDataObj = new FormData();
                
                // Calculate total size
                let totalSize = 0;
                const filesInfo = [];
                
                Object.entries(uploadedFiles).forEach(([side, file]) => {
                    if (file) {
                        totalSize += file.size;
                        filesInfo.push({
                            side,
                            name: file.name,
                            size: (file.size / 1024).toFixed(2) + 'KB',
                            type: file.type
                        });
                        console.log(`📎 Adding photo: ${side} - ${file.name} (${(file.size / 1024).toFixed(2)}KB, ${file.type})`);
                        formDataObj.append(side, file, file.name);
                    }
                });
                
                console.log(`📦 Total upload size: ${(totalSize / 1024).toFixed(2)}KB`);
                console.log(`📋 Files summary:`, filesInfo);
                
                // Check if total size exceeds limit
                if (totalSize > 40 * 1024 * 1024) { // 40MB limit
                    message('Total file size too large. Please use smaller images.', 'error');
                    return;
                }
                
                // 🔄 Upload dengan retry mechanism
                const uploadResult = await uploadWithRetry(customerId, formDataObj);
                
                if (!uploadResult.success) {
                    console.warn('⚠️ Photo upload failed after retries:', uploadResult.error);
                    message('Customer created! But failed to upload photos. You can upload them later from customer details.', 'warning');
                } else {
                    console.log('✅ Photos uploaded successfully');
                    message('Customer created with photos successfully!', 'success');
                }
                
            } else {
                console.log('📷 No photos to upload');
                message('Customer created successfully!', 'success');
            }
            
            // 4. Close dialog and reset form
            onClose(true);
            resetForm();
            
        } catch (error) {
            console.error('❌ Error creating customer:', error);
            
            // Show appropriate error message
            if (error.message === 'TOKEN_EXPIRED') {
                message('Session expired. Please login again.', 'error');
            } else if (error.error) {
                message(error.error, 'error');
            } else {
                message(error.message || 'Failed to create customer. Please try again.', 'error');
            }
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
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email (Optional)"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="customer@example.com"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="08123456789"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                multiline
                                rows={2}
                                placeholder="Customer address"
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
                                placeholder="Additional notes or comments"
                            />
                        </Grid>
                    </Grid>
                );
                
            case 1:
                return (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
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
                                placeholder="Defaults to customer name"
                                helperText="Leave empty to use customer name"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Car Brand"
                                name="carBrand"
                                value={formData.carBrand}
                                onChange={handleChange}
                                placeholder="Toyota, Honda, etc."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Car Model"
                                name="carModel"
                                value={formData.carModel}
                                onChange={handleChange}
                                placeholder="Avanza, Civic, etc."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Plate Number"
                                name="plateNumber"
                                value={formData.plateNumber}
                                onChange={handleChange}
                                placeholder="B 1234 ABC"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Chassis Number"
                                name="chassisNumber"
                                value={formData.chassisNumber}
                                onChange={handleChange}
                                placeholder="Chassis number"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Engine Number"
                                name="engineNumber"
                                value={formData.engineNumber}
                                onChange={handleChange}
                                placeholder="Engine number"
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
                                helperText="Insurance expiration date"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mt: 1 }}>
                                All car information fields are optional. You can add or update them later.
                            </Alert>
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
                        
                        {compressing && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Compressing images...
                            </Alert>
                        )}
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {[
                                { key: 'leftSide', label: 'Left Side' },
                                { key: 'rightSide', label: 'Right Side' },
                                { key: 'front', label: 'Front' },
                                { key: 'back', label: 'Back' }
                            ].map(({ key, label }) => (
                                <Grid item xs={12} sm={6} key={key}>
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
                                            backgroundColor: uploadedFiles[key] ? '#e8f5e8' : 'inherit',
                                            borderColor: uploadedFiles[key] ? '#4caf50' : 'inherit',
                                            borderStyle: uploadedFiles[key] ? 'solid' : 'dashed',
                                            borderWidth: uploadedFiles[key] ? 2 : 1,
                                            '&:hover': { 
                                                borderColor: '#1976d2',
                                                backgroundColor: uploadedFiles[key] ? '#e8f5e8' : '#f5f5f5'
                                            }
                                        }}
                                        onClick={() => document.getElementById(`file-${key}`).click()}
                                    >
                                        <input
                                            id={`file-${key}`}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    handleFileUpload(key, file);
                                                }
                                            }}
                                        />
                                        {uploadedFiles[key] ? (
                                            <>
                                                <Icon 
                                                    icon="mdi:check-circle" 
                                                    width={40} 
                                                    color="#4caf50" 
                                                />
                                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                                                    {label}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                    {(uploadedFiles[key].size / 1024).toFixed(2)}KB
                                                </Typography>
                                            </>
                                        ) : (
                                            <>
                                                <Icon 
                                                    icon="mdi:camera-plus" 
                                                    width={40} 
                                                    color="#9e9e9e" 
                                                />
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {label}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                    Click to upload
                                                </Typography>
                                            </>
                                        )}
                                    </Paper>
                                    
                                    {uploadedFiles[key] && (
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<Icon icon="mdi:delete" width={16} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileUpload(key, null);
                                            }}
                                            sx={{ mt: 0.5 }}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                        
                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="body2">
                                <strong>Note:</strong> Images larger than 500KB will be automatically compressed. Photos are optional and can also be uploaded later from the customer details page.
                            </Typography>
                        </Alert>
                    </Box>
                );
                
            default:
                return null;
        }
    };

    const getStepLabel = (index) => {
        if (isMobile) {
            return `${index + 1}. ${steps[index]}`;
        }
        return steps[index];
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
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" align="center" gutterBottom>
                            Step {activeStep + 1} of {steps.length}
                        </Typography>
                        <Typography variant="body1" align="center" fontWeight="medium">
                            {getStepLabel(activeStep)}
                        </Typography>
                        <MobileStepper
                            variant="dots"
                            steps={steps.length}
                            position="static"
                            activeStep={activeStep}
                            sx={{ mt: 2, justifyContent: 'center', bgcolor: 'transparent' }}
                            nextButton={null}
                            backButton={null}
                        />
                    </Box>
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
                    variant="outlined"
                >
                    Back
                </Button>
                
                <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
                
                {activeStep === steps.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={<Icon icon="mdi:check" />}
                        fullWidth={isMobile}
                        color="primary"
                        size={isMobile ? "medium" : "large"}
                        disabled={compressing}
                    >
                        {compressing ? 'Processing...' : 'Create Customer'}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<Icon icon="mdi:chevron-right" />}
                        fullWidth={isMobile}
                        color="primary"
                    >
                        Next
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}