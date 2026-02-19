import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import FormInput from '../../reusables/form/FormInput';
import FormFileUpload from '../../reusables/form/FormFileUpload';

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function untuk compress image (Existing Logic)
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

// Helper function untuk retry upload (Existing Logic)
const uploadWithRetry = async (customerId, formData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await delay(attempt * 1000);
            const response = await CustomerDAO.uploadCarPhotos(customerId, formData);
            if (response.success) return { success: true, data: response };
            if (attempt === maxRetries) return { success: false, error: response.error };
        } catch (error) {
            if (attempt === maxRetries) return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'Max retries reached' };
};

// Helper function untuk upload dokumen (Existing Logic)
const uploadDocumentsWithRetry = async (customerId, documentFiles, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await delay(attempt * 1000);
            const formData = new FormData();
            Object.entries(documentFiles).forEach(([type, file]) => {
                if (file) formData.append(type, file, file.name);
            });

            const response = await CustomerDAO.uploadDocuments(customerId, formData);
            if (response.success) return { success: true, data: response };
            if (attempt === maxRetries) return { success: false, error: response.error };
        } catch (error) {
            if (attempt === maxRetries) return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'Max retries reached' };
};

// --- UI COMPONENTS ---
// Components moved to src/reusables/form/

export default function CreateCustomerDialog({ open, onClose }) {
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({ leftSide: null, rightSide: null, front: null, back: null });
    const [documentFiles, setDocumentFiles] = useState({ stnk: null, sim: null, ktp: null });

    // eslint-disable-next-line no-unused-vars
    const [compressing, setCompressing] = useState(false);

    const theme = useTheme();
    // eslint-disable-next-line no-unused-vars
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', notes: '',
        carOwnerName: '', carBrand: '', carModel: '', plateNumber: '',
        chassisNumber: '', engineNumber: '', dueDate: '', carPrice: ''
    });

    const steps = ['CUSTOMER INFO', 'CAR DETAILS', 'DOCUMENTS', 'UPLOAD PHOTO'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileUpload = async (side, file) => {
        if (!file) {
            setUploadedFiles(prev => ({ ...prev, [side]: null }));
            return;
        }
        try {
            setCompressing(true);
            let processedFile = file;
            if (file.size > 500 * 1024) processedFile = await compressImage(file);
            setUploadedFiles(prev => ({ ...prev, [side]: processedFile }));
        } catch (error) {
            console.error(error);
            message('Failed to process image', 'error');
        } finally {
            setCompressing(false);
        }
    };

    const handleDocumentUpload = async (type, file) => {
        if (!file) {
            setDocumentFiles(prev => ({ ...prev, [type]: null }));
            return;
        }
        try {
            setCompressing(true);
            let processedFile = file;
            if (file.type.startsWith('image/') && file.size > 500 * 1024) processedFile = await compressImage(file);
            setDocumentFiles(prev => ({ ...prev, [type]: processedFile }));
        } catch (error) {
            console.error(error);
            message('Failed to process document', 'error');
        } finally {
            setCompressing(false);
        }
    };

    const validateStep = () => {
        const newErrors = {};
        if (activeStep === 0) {
            if (!formData.name.trim()) newErrors.name = 'Customer name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handleSubmit();
        } else {
            if (validateStep()) setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const resetForm = () => {
        setFormData({
            name: '', email: '', phone: '', address: '', notes: '',
            carOwnerName: '', carBrand: '', carModel: '', plateNumber: '',
            chassisNumber: '', engineNumber: '', dueDate: '', carPrice: ''
        });
        setUploadedFiles({ leftSide: null, rightSide: null, front: null, back: null });
        setDocumentFiles({ stnk: null, sim: null, ktp: null });
        setActiveStep(0);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose(false);
    };

    const handleSubmit = async () => {
        // ... (Existing Logic for Submit)
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

            const customerResponse = await CustomerDAO.createCustomer(customerData);
            if (!customerResponse.success) throw new Error(customerResponse.error || 'Failed to create customer');

            const customerId = customerResponse.customer.id;

            const hasDocuments = Object.values(documentFiles).some(file => file !== null);
            if (hasDocuments) await uploadDocumentsWithRetry(customerId, documentFiles);

            const hasPhotos = Object.values(uploadedFiles).some(file => file !== null);
            if (hasPhotos) {
                const formDataObj = new FormData();
                Object.entries(uploadedFiles).forEach(([side, file]) => {
                    if (file) formDataObj.append(side, file, file.name);
                });
                await uploadWithRetry(customerId, formDataObj);
            }

            message('Customer created successfully!', 'success');
            onClose(true);
            resetForm();
        } catch (error) {
            console.error(error);
            message(error.message || 'Failed to create customer', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    // --- UI COMPONENTS ---



    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                style: { borderRadius: '12px', overflow: 'hidden' }
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Create New Customer</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <Icon icon="mdi:close" width="24" />
                </button>
            </div>

            {/* Stepper */}
            <div className="bg-gray-50 px-6 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -z-0 -translate-y-[10px]" />

                    {steps.map((label, index) => {
                        const isActive = index === activeStep;
                        const isCompleted = index < activeStep;

                        return (
                            <div key={label} className="flex flex-col items-center relative z-10 bg-gray-50 px-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-colors
                                        ${isActive || isCompleted
                                            ? 'bg-[#002D5B] text-white shadow-md'
                                            : 'bg-white border border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {isCompleted ? <Icon icon="mdi:check" width="16" /> : index + 1}
                                </div>
                                <span className={`text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-[#002D5B]' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-8 min-h-[400px]">
                {activeStep === 0 && (
                    <div className="space-y-5 animate-fadeIn">
                        <FormInput
                            label="Customer Name"
                            name="name"
                            placeholder="John Doe"
                            icon="lucide:user"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput
                                label="Email (Optional)"
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                icon="lucide:mail"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />
                            <FormInput
                                label="Phone Number"
                                name="phone"
                                placeholder="+62 812 3456 7890"
                                icon="lucide:phone"
                                value={formData.phone}
                                onChange={handleChange}
                                error={errors.phone}
                            />
                        </div>

                        <FormInput
                            label="Address"
                            name="address"
                            placeholder="1234 Main St, Springfield, IL"
                            icon="lucide:map-pin"
                            value={formData.address}
                            onChange={handleChange}
                            error={errors.address}
                        />

                        <FormInput
                            label="Notes"
                            name="notes"
                            placeholder="Add any additional details regarding the customer..."
                            icon="lucide:file-text"
                            multiline
                            value={formData.notes}
                            onChange={handleChange}
                            error={errors.notes}
                        />
                    </div>
                )}

                {activeStep === 1 && (
                    <div className="space-y-5 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput label="Car Owner Name" name="carOwnerName" placeholder="Owner Name" icon="lucide:user" value={formData.carOwnerName} onChange={handleChange} error={errors.carOwnerName} />
                            <FormInput label="Car Brand" name="carBrand" placeholder="Toyota" icon="lucide:car" value={formData.carBrand} onChange={handleChange} error={errors.carBrand} />
                            <FormInput label="Car Model" name="carModel" placeholder="Avanza" icon="lucide:car" value={formData.carModel} onChange={handleChange} error={errors.carModel} />
                            <FormInput label="Plate Number" name="plateNumber" placeholder="B 1234 ABC" icon="lucide:hash" value={formData.plateNumber} onChange={handleChange} error={errors.plateNumber} />
                            <FormInput label="Chassis Number" name="chassisNumber" placeholder="MH..." icon="lucide:barcode" value={formData.chassisNumber} onChange={handleChange} error={errors.chassisNumber} />
                            <FormInput label="Engine Number" name="engineNumber" placeholder="ENG..." icon="lucide:settings" value={formData.engineNumber} onChange={handleChange} error={errors.engineNumber} />
                            <FormInput label="Insurance Due Date" name="dueDate" type="date" icon="lucide:calendar" value={formData.dueDate} onChange={handleChange} error={errors.dueDate} />
                            <FormInput label="Car Price" name="carPrice" type="number" placeholder="0" icon="lucide:dollar-sign" value={formData.carPrice} onChange={handleChange} error={errors.carPrice} />
                        </div>
                    </div>
                )}

                {activeStep === 2 && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormFileUpload
                                label="Upload STNK"
                                file={documentFiles.stnk}
                                onClick={() => document.getElementById('doc-stnk').click()}
                                icon="lucide:file-text"
                            />
                            <FormFileUpload
                                label="Upload SIM"
                                file={documentFiles.sim}
                                onClick={() => document.getElementById('doc-sim').click()}
                                icon="lucide:credit-card"
                            />
                            <FormFileUpload
                                label="Upload KTP"
                                file={documentFiles.ktp}
                                onClick={() => document.getElementById('doc-ktp').click()}
                                icon="lucide:credit-card"
                            />
                        </div>
                        {/* Hidden Inputs */}
                        <input id="doc-stnk" type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleDocumentUpload('stnk', e.target.files[0])} />
                        <input id="doc-sim" type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleDocumentUpload('sim', e.target.files[0])} />
                        <input id="doc-ktp" type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleDocumentUpload('ktp', e.target.files[0])} />
                    </div>
                )}

                {activeStep === 3 && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                            <FormFileUpload label="Left Side" file={uploadedFiles.leftSide} onClick={() => document.getElementById('photo-left').click()} icon="lucide:camera" />
                            <FormFileUpload label="Right Side" file={uploadedFiles.rightSide} onClick={() => document.getElementById('photo-right').click()} icon="lucide:camera" />
                            <FormFileUpload label="Front" file={uploadedFiles.front} onClick={() => document.getElementById('photo-front').click()} icon="lucide:camera" />
                            <FormFileUpload label="Back" file={uploadedFiles.back} onClick={() => document.getElementById('photo-back').click()} icon="lucide:camera" />
                        </div>
                        {/* Hidden Inputs */}
                        <input id="photo-left" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('leftSide', e.target.files[0])} />
                        <input id="photo-right" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('rightSide', e.target.files[0])} />
                        <input id="photo-front" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('front', e.target.files[0])} />
                        <input id="photo-back" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('back', e.target.files[0])} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6 flex justify-between items-center bg-gray-50">
                <button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors
                        ${activeStep === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400'
                        }`}
                >
                    &lt; Back
                </button>

                <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-[#002D5B] text-white text-sm font-medium rounded-md hover:bg-[#001f40] transition-colors shadow-sm flex items-center gap-2"
                >
                    {activeStep === steps.length - 1 ? 'Submit' : 'Next >'}
                </button>
            </div>
        </Dialog>
    );
}