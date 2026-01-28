import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
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

const steps = ['Customer Info', 'Car Details', 'Documents', 'Upload Photos'];

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// Helper function untuk retry upload
const uploadWithRetry = async (customerId, formData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📤 Upload attempt ${attempt}/${maxRetries}`);
            
            await delay(attempt * 1000);
            
            const response = await CustomerDAO.uploadCarPhotos(customerId, formData);
            
            if (response.success) {
                console.log('✅ Upload successful on attempt', attempt);
                return { success: true, data: response };
            }
            
            console.warn(`⚠️ Upload failed on attempt ${attempt}:`, response.error);
            
            if (attempt === maxRetries) {
                return { success: false, error: response.error };
            }
            
        } catch (error) {
            console.error(`❌ Upload error on attempt ${attempt}:`, error);
            
            if (attempt < maxRetries && (
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('CORS') ||
                error.message?.includes('Network')
            )) {
                console.log(`🔄 Retrying upload... (${attempt}/${maxRetries})`);
                continue;
            }
            
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'Max retries reached' };
};

// Helper function untuk upload dokumen
const uploadDocumentsWithRetry = async (customerId, documentFiles, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📄 Document upload attempt ${attempt}/${maxRetries}`);
            
            await delay(attempt * 1000);
            
            const formData = new FormData();
            let totalSize = 0;
            
            Object.entries(documentFiles).forEach(([type, file]) => {
                if (file) {
                    totalSize += file.size;
                    console.log(`📎 Adding document: ${type} - ${file.name} (${(file.size / 1024).toFixed(2)}KB, ${file.type})`);
                    formData.append(type, file, file.name);
                }
            });
            
            console.log(`📦 Total document upload size: ${(totalSize / 1024).toFixed(2)}KB`);
            
            if (totalSize > 40 * 1024 * 1024) {
                return { success: false, error: 'Total file size too large. Please use smaller files.' };
            }
            
            const response = await CustomerDAO.uploadDocuments(customerId, formData);
            
            if (response.success) {
                console.log('✅ Document upload successful on attempt', attempt);
                return { success: true, data: response };
            }
            
            console.warn(`⚠️ Document upload failed on attempt ${attempt}:`, response.error);
            
            if (attempt === maxRetries) {
                return { success: false, error: response.error };
            }
            
        } catch (error) {
            console.error(`❌ Document upload error on attempt ${attempt}:`, error);
            
            if (attempt < maxRetries && (
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('CORS') ||
                error.message?.includes('Network')
            )) {
                console.log(`🔄 Retrying document upload... (${attempt}/${maxRetries})`);
                continue;
            }
            
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
    const [documentFiles, setDocumentFiles] = useState({
        stnk: null,
        sim: null,
        ktp: null
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
        dueDate: '',
        carPrice: ''
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

    const handleDocumentUpload = async (type, file) => {
        if (!file) {
            setDocumentFiles(prev => ({
                ...prev,
                [type]: null
            }));
            return;
        }

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
        } catch (error) {
            console.error('Document compression error:', error);
            message('Failed to process document', 'error');
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
                dueDate: formData.dueDate || null,
                carPrice: formData.carPrice ? parseFloat(formData.carPrice) : 0
            };
            
            console.log('🆕 Creating customer with data:', customerData);
            
            const customerResponse = await CustomerDAO.createCustomer(customerData);
            
            if (!customerResponse.success) {
                throw new Error(customerResponse.error || 'Failed to create customer');
            }
            
            const customerId = customerResponse.customer.id;
            console.log('✅ Customer created with ID:', customerId);
            
            // Upload documents jika ada
            const hasDocuments = Object.values(documentFiles).some(file => file !== null);
            let documentUploadResult = null;
            
            if (hasDocuments) {
                console.log('📄 Preparing to upload documents for customer:', customerId);
                console.log('⏳ Waiting 2 seconds before uploading documents...');
                await delay(2000);
                
                documentUploadResult = await uploadDocumentsWithRetry(customerId, documentFiles);
                
                if (!documentUploadResult.success) {
                    console.warn('⚠️ Document upload failed after retries:', documentUploadResult.error);
                    message('Customer created! But failed to upload documents. You can upload them later from customer details.', 'warning');
                } else {
                    console.log('✅ Documents uploaded successfully');
                }
            } else {
                console.log('📄 No documents to upload');
            }
            
            // Upload car photos jika ada
            const hasPhotos = Object.values(uploadedFiles).some(file => file !== null);
            
            if (hasPhotos) {
                console.log('📸 Preparing to upload photos for customer:', customerId);
                console.log('⏳ Waiting 2 seconds before uploading photos...');
                await delay(2000);
                
                const formDataObj = new FormData();
                let totalSize = 0;
                
                Object.entries(uploadedFiles).forEach(([side, file]) => {
                    if (file) {
                        totalSize += file.size;
                        console.log(`📎 Adding photo: ${side} - ${file.name} (${(file.size / 1024).toFixed(2)}KB, ${file.type})`);
                        formDataObj.append(side, file, file.name);
                    }
                });
                
                console.log(`📦 Total upload size: ${(totalSize / 1024).toFixed(2)}KB`);
                
                if (totalSize > 40 * 1024 * 1024) {
                    message('Total file size too large. Please use smaller images.', 'error');
                    return;
                }
                
                const uploadResult = await uploadWithRetry(customerId, formDataObj);
                
                if (!uploadResult.success) {
                    console.warn('⚠️ Photo upload failed after retries:', uploadResult.error);
                    if (!hasDocuments || documentUploadResult?.success) {
                        message('Customer created! But failed to upload photos. You can upload them later from customer details.', 'warning');
                    }
                } else {
                    console.log('✅ Photos uploaded successfully');
                }
            } else {
                console.log('📷 No photos to upload');
            }
            
            let successMessage = 'Customer created successfully!';
            if (hasPhotos && hasDocuments) {
                successMessage = 'Customer created with photos and documents successfully!';
            } else if (hasPhotos) {
                successMessage = 'Customer created with photos successfully!';
            } else if (hasDocuments) {
                successMessage = 'Customer created with documents successfully!';
            }
            
            message(successMessage, 'success');
            onClose(true);
            resetForm();
            
        } catch (error) {
            console.error('❌ Error creating customer:', error);
            
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
            dueDate: '',
            carPrice: ''
        });
        setUploadedFiles({
            leftSide: null,
            rightSide: null,
            front: null,
            back: null
        });
        setDocumentFiles({
            stnk: null,
            sim: null,
            ktp: null
        });
        setActiveStep(0);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose(false);
    };

    const formatCurrency = (value) => {
        if (!value) return '';
        const num = parseFloat(value.replace(/\D/g, ''));
        return isNaN(num) ? '' : num.toLocaleString('id-ID');
    };

    const handleCurrencyChange = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            carPrice: numericValue
        }));
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                            size={isMobile ? "small" : "medium"}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Email (Optional)"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="customer@example.com"
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="08123456789"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            multiline
                            rows={2}
                            placeholder="Customer address"
                            size={isMobile ? "small" : "medium"}
                        />
                        <TextField
                            fullWidth
                            label="Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            placeholder="Additional notes or comments"
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>
                );
                
            case 1:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Car Information
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Car Owner Name"
                                name="carOwnerName"
                                value={formData.carOwnerName}
                                onChange={handleChange}
                                placeholder="Defaults to customer name"
                                helperText="Leave empty to use customer name"
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Car Brand"
                                name="carBrand"
                                value={formData.carBrand}
                                onChange={handleChange}
                                placeholder="Toyota, Honda, etc."
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Car Model"
                                name="carModel"
                                value={formData.carModel}
                                onChange={handleChange}
                                placeholder="Avanza, Civic, etc."
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Plate Number"
                                name="plateNumber"
                                value={formData.plateNumber}
                                onChange={handleChange}
                                placeholder="B 1234 ABC"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Chassis Number"
                                name="chassisNumber"
                                value={formData.chassisNumber}
                                onChange={handleChange}
                                placeholder="Chassis number"
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Engine Number"
                                name="engineNumber"
                                value={formData.engineNumber}
                                onChange={handleChange}
                                placeholder="Engine number"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Car Price (IDR)"
                                name="carPrice"
                                value={formatCurrency(formData.carPrice)}
                                onChange={handleCurrencyChange}
                                placeholder="150,000,000"
                                helperText="Vehicle price in Indonesian Rupiah"
                                size={isMobile ? "small" : "medium"}
                                InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Insurance Due Date"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                helperText="Insurance expiration date"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>
                        <Alert severity="info" sx={{ mt: 1 }}>
                            All car information fields are optional. You can add or update them later.
                        </Alert>
                    </Box>
                );
                
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Upload Documents (Optional)
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Upload documents as images or PDF files. Each file max 5MB.
                        </Typography>
                        
                        {compressing && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Compressing files...
                            </Alert>
                        )}
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
                            {[
                                { key: 'stnk', label: 'STNK', description: 'Vehicle Registration' },
                                { key: 'sim', label: 'SIM', description: 'Driver License' },
                                { key: 'ktp', label: 'KTP', description: 'ID Card' }
                            ].map(({ key, label, description }) => (
                                <Paper
                                    key={key}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        minHeight: 140,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: documentFiles[key] ? '#e3f2fd' : 'inherit',
                                        borderColor: documentFiles[key] ? '#2196f3' : 'inherit',
                                        borderStyle: documentFiles[key] ? 'solid' : 'dashed',
                                        borderWidth: documentFiles[key] ? 2 : 1,
                                        '&:hover': { 
                                            borderColor: '#1976d2',
                                            backgroundColor: documentFiles[key] ? '#e3f2fd' : '#f5f5f5'
                                        }
                                    }}
                                    onClick={() => document.getElementById(`doc-${key}`).click()}
                                >
                                    <input
                                        id={`doc-${key}`}
                                        type="file"
                                        accept="image/*,.pdf"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                handleDocumentUpload(key, file);
                                            }
                                        }}
                                    />
                                    {documentFiles[key] ? (
                                        <>
                                            <Icon 
                                                icon={documentFiles[key].type === 'application/pdf' ? "mdi:file-pdf-box" : "mdi:file-check"} 
                                                width={40} 
                                                color={documentFiles[key].type === 'application/pdf' ? "#f44336" : "#4caf50"} 
                                            />
                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                                                {label}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                {documentFiles[key].name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                {(documentFiles[key].size / 1024).toFixed(2)}KB
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            <Icon 
                                                icon="mdi:file-upload" 
                                                width={40} 
                                                color="#9e9e9e" 
                                            />
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {label}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                {description}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                Click to upload
                                            </Typography>
                                        </>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                        
                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="body2">
                                <strong>Note:</strong> Documents are optional. You can upload files later from the customer details page. Accepts images and PDF files up to 5MB each.
                            </Typography>
                        </Alert>
                    </Box>
                );
                
            case 3:
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
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                            {[
                                { key: 'leftSide', label: 'Left Side' },
                                { key: 'rightSide', label: 'Right Side' },
                                { key: 'front', label: 'Front' },
                                { key: 'back', label: 'Back' }
                            ].map(({ key, label }) => (
                                <Paper
                                    key={key}
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
                            ))}
                        </Box>
                        
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
                            {steps[activeStep]}
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