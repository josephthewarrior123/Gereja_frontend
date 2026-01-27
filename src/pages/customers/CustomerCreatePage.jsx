import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField,
    Paper,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    MobileStepper,
    MenuItem,
    IconButton
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
            
            const customerResponse = await CustomerDAO.createCustomer(formData);
            
            if (!customerResponse.success) {
                throw new Error(customerResponse.error || 'Failed to create customer');
            }
            
            const customerId = customerResponse.customer.id;
            setCreatedCustomer(customerResponse.customer);
            
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
            setActiveStep(0);
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
            setPreviewUrls({});
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <div className="flex flex-col gap-4">
                        <div className={`${isMobile ? 'typography-2' : 'typography-3'} font-bold mb-2`}>
                            Customer Information
                        </div>
                        <Typography variant="body2" color="textSecondary" className="mb-4">
                            Enter the customer's personal details.
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Full Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            size={isMobile ? "small" : "medium"}
                        />
                        
                        <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>
                        
                        <TextField
                            fullWidth
                            label="Additional Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            multiline
                            rows={isMobile ? 3 : 3}
                            size={isMobile ? "small" : "medium"}
                        />
                    </div>
                );
                
            case 1:
                return (
                    <div className="flex flex-col gap-4">
                        <div className={`${isMobile ? 'typography-2' : 'typography-3'} font-bold mb-2`}>
                            Car Information
                        </div>
                        <Typography variant="body2" color="textSecondary" className="mb-4">
                            Enter the vehicle details for insurance purposes.
                        </Typography>
                        
                        <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                            <TextField
                                fullWidth
                                label="Car Owner Name"
                                name="carOwnerName"
                                value={formData.carOwnerName}
                                onChange={handleChange}
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Car Brand *"
                                name="carBrand"
                                value={formData.carBrand}
                                onChange={handleChange}
                                error={!!errors.carBrand}
                                helperText={errors.carBrand}
                                required
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>
                        
                        <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                            <TextField
                                fullWidth
                                label="Car Model"
                                name="carModel"
                                value={formData.carModel}
                                onChange={handleChange}
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Plate Number *"
                                name="plateNumber"
                                value={formData.plateNumber}
                                onChange={handleChange}
                                error={!!errors.plateNumber}
                                helperText={errors.plateNumber}
                                required
                                size={isMobile ? "small" : "medium"}
                                placeholder="B 1234 ABC"
                            />
                        </div>
                        
                        <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                            <TextField
                                fullWidth
                                label="Chassis Number"
                                name="chassisNumber"
                                value={formData.chassisNumber}
                                onChange={handleChange}
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                fullWidth
                                label="Engine Number"
                                name="engineNumber"
                                value={formData.engineNumber}
                                onChange={handleChange}
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>
                        
                        <TextField
                            fullWidth
                            label="Insurance Due Date"
                            name="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            size={isMobile ? "small" : "medium"}
                        />
                    </div>
                );
                
            case 2:
                return (
                    <div className="flex flex-col gap-4">
                        <div className={`${isMobile ? 'typography-2' : 'typography-3'} font-bold mb-2`}>
                            Upload Car Photos
                        </div>
                        <Typography variant="body2" color="textSecondary" className="mb-4">
                            Upload 4 photos of the car for documentation. This step is optional and can be done later.
                        </Typography>
                        
                        <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                            {['leftSide', 'rightSide', 'front', 'back'].map((side) => (
                                <Paper
                                    key={side}
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: uploadedFiles[side] ? '#f0f9ff' : 'inherit',
                                        border: '2px dashed',
                                        borderColor: uploadedFiles[side] ? '#1976d2' : '#e0e0e0',
                                        '&:hover': { borderColor: '#1976d2', backgroundColor: '#f5f5f5' },
                                        minHeight: isMobile ? '180px' : '200px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
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
                                                    height: 120,
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
                                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255,255,255,1)'
                                                    }
                                                }}
                                            >
                                                <Icon icon="mdi:close" />
                                            </IconButton>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                {uploadedFiles[side]?.name}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Icon icon="mdi:camera-plus" width={48} color="#9e9e9e" />
                                            <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
                                                {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                                Click to upload
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            ))}
                        </div>
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Note:</strong> Photos can also be uploaded later from the customer details page. 
                                Maximum file size is 10MB per photo.
                            </Typography>
                        </Alert>
                    </div>
                );
                
            case 3:
                return (
                    <div className="flex flex-col gap-4">
                        <div className={`${isMobile ? 'typography-2' : 'typography-3'} font-bold mb-2`}>
                            Review Information
                        </div>
                        <Typography variant="body2" color="textSecondary" className="mb-4">
                            Please review all information before submitting.
                        </Typography>
                        
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Customer Details
                            </Typography>
                            <div className="flex flex-col gap-3 mt-3">
                                <DetailRow label="Name" value={formData.name} />
                                <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                                    <DetailRow label="Phone" value={formData.phone || 'Not provided'} />
                                    <DetailRow label="Address" value={formData.address || 'Not provided'} />
                                </div>
                                <DetailRow label="Notes" value={formData.notes || 'No notes'} />
                            </div>
                        </Paper>
                        
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Car Details
                            </Typography>
                            <div className="flex flex-col gap-3 mt-3">
                                <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                                    <DetailRow label="Car Owner" value={formData.carOwnerName || 'Not provided'} />
                                    <DetailRow label="Car Brand" value={formData.carBrand} />
                                </div>
                                <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                                    <DetailRow label="Car Model" value={formData.carModel || 'Not provided'} />
                                    <DetailRow label="Plate Number" value={formData.plateNumber} />
                                </div>
                                {formData.dueDate && (
                                    <DetailRow label="Due Date" value={new Date(formData.dueDate).toLocaleDateString('id-ID')} />
                                )}
                            </div>
                        </Paper>
                        
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Photos Uploaded ({Object.values(uploadedFiles).filter(f => f).length}/4)
                            </Typography>
                            <div className={isMobile ? "flex flex-col gap-2 mt-3" : "grid grid-cols-4 gap-2 mt-3"}>
                                {Object.entries(uploadedFiles).map(([side, file]) => (
                                    file && (
                                        <Paper key={side} sx={{ p: 2, textAlign: 'center', bgcolor: '#f0f9ff' }}>
                                            <Typography variant="caption" display="block" fontWeight={500}>
                                                {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                            </Typography>
                                            <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                                                <Icon icon="mdi:check-circle" width={14} />
                                                Uploaded
                                            </Typography>
                                        </Paper>
                                    )
                                ))}
                                {Object.values(uploadedFiles).filter(f => f).length === 0 && (
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2, gridColumn: '1 / -1' }}>
                                        No photos uploaded
                                    </Typography>
                                )}
                            </div>
                        </Paper>
                    </div>
                );
                
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
            {/* Header */}
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
                        Create New Customer
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Icon icon="mdi:arrow-left" />}
                        onClick={() => navigate('/customers')}
                        fullWidth={isMobile}
                    >
                        Back to List
                    </Button>
                </Box>
                
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
            </Box>

            {/* Form Content */}
            <Paper sx={{ p: { xs: 3, sm: 4 }, mb: 3 }}>
                {renderStepContent()}
            </Paper>

            {/* Navigation Buttons */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: { xs: 2, sm: 0 } 
            }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<Icon icon="mdi:chevron-left" />}
                    fullWidth={isMobile}
                    size={isMobile ? "medium" : "large"}
                >
                    Back
                </Button>
                
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    width: { xs: '100%', sm: 'auto' } 
                }}>
                    {activeStep === steps.length - 1 ? (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => setActiveStep(0)}
                                startIcon={<Icon icon="mdi:refresh" />}
                                fullWidth={isMobile}
                                size={isMobile ? "medium" : "large"}
                            >
                                Start Over
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading}
                                startIcon={<Icon icon="mdi:check" />}
                                size={isMobile ? "medium" : "large"}
                                fullWidth={isMobile}
                            >
                                {loading ? 'Creating...' : 'Create Customer'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={<Icon icon="mdi:chevron-right" />}
                            fullWidth={isMobile}
                            size={isMobile ? "medium" : "large"}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="mdi:check-circle" color="#4caf50" width={28} />
                        <Typography variant={isMobile ? "h6" : "h5"}>Customer Created Successfully!</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="body1" paragraph>
                        Customer <strong>{createdCustomer?.name}</strong> has been created successfully.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Customer ID: <strong>{createdCustomer?.id}</strong>
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ 
                    px: { xs: 2, sm: 3 }, 
                    pb: { xs: 2, sm: 2 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                }}>
                    <Button
                        onClick={() => handleSuccessClose('another')}
                        fullWidth={isMobile}
                    >
                        Create Another
                    </Button>
                    <Button
                        onClick={() => handleSuccessClose('list')}
                        variant="outlined"
                        fullWidth={isMobile}
                    >
                        Back to List
                    </Button>
                    <Button
                        onClick={() => handleSuccessClose('view')}
                        variant="contained"
                        startIcon={<Icon icon="mdi:eye" />}
                        fullWidth={isMobile}
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
        <Box>
            <Typography variant="caption" color="textSecondary" display="block">
                {label}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
                {value}
            </Typography>
        </Box>
    );
}