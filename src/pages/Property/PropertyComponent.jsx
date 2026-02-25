import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import PropertyDAO from '../../daos/propertyDao';
import { useLoading } from '../../hooks/LoadingProvider.jsx';
import { useAlert } from '../../hooks/SnackbarProvider.jsx';
import FormInput from '../../reusables/form/FormInput';
import FormFileUpload from '../../reusables/form/FormFileUpload';

const PROPERTY_TYPES = {
    HOUSE: 'House',
    APARTMENT: 'Apartment',
    OFFICE: 'Office',
    WAREHOUSE: 'Warehouse',
    SHOP: 'Shop',
    LAND: 'Land'
};

const COVERAGE_TYPES = {
    FIRE: 'Fire',
    EARTHQUAKE: 'Earthquake',
    FLOOD: 'Flood',
    ALL_RISK: 'All Risk',
    BASIC: 'Basic'
};

const formatNumberInput = (value) => {
    if (!value) return '';
    return value.toString().replace(/[^0-9.]/g, '');
};

const determineStatus = (endDate) => {
    if (!endDate) return 'Active';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (end < now) {
        return 'Expired';
    }
    return 'Active';
};

const NativeSelect = ({ label, name, value, onChange, options, icon }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon icon={icon} width="20" />
                    </div>
                )}
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#002D5B] focus:border-[#002D5B] block p-2.5 ${icon ? 'pl-10' : ''} transition-all duration-200 outline-none`}
                    style={{
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '36px'
                    }}
                >
                    <option value="">Select {label}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default function PropertyComponent({
    open,
    onClose,
    selectedDetail,
    isNewRecord = false,
    onPropertySuccess,
    isMobile: _isMobileProp // Not used directly, useMediaQuery is better
}) {
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});

    // File states
    const [propertyPhotos, setPropertyPhotos] = useState({
        front: null, back: null, left: null, right: null,
        interior1: null, interior2: null, interior3: null, interior4: null
    });

    const [propertyDocuments, setPropertyDocuments] = useState({
        certificate: null, imb: null, pbb: null, other: null
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
        ownerName: '', ownerEmail: '', ownerPhone: '', ownerAddress: '',
        propertyType: '', address: '', city: '', province: '', postalCode: '',
        buildingArea: '', landArea: '', numberOfFloors: '', yearBuilt: '',
        propertyValue: '', buildingStructure: '',
        policyNumber: '', insuranceCompany: '', coverageType: '',
        insuranceValue: '', premium: '', startDate: '', endDate: '', deductible: '',
        notes: ''
    });

    const steps = ['OWNER INFO', 'PROPERTY DETAILS', 'INSURANCE DETAILS', 'DOCUMENTS', 'UPLOAD PHOTO'];

    useEffect(() => {
        if (selectedDetail && open) {
            const formatDate = (dateValue) => {
                if (!dateValue) return '';
                try {
                    return dayjs(dateValue).format('YYYY-MM-DD');
                } catch (error) {
                    return '';
                }
            };

            setFormData({
                ownerName: selectedDetail.ownerName || '',
                ownerEmail: selectedDetail.ownerEmail || '',
                ownerPhone: selectedDetail.ownerPhone || '',
                ownerAddress: selectedDetail.ownerAddress || '',

                propertyType: selectedDetail.propertyData?.propertyType || '',
                address: selectedDetail.propertyData?.address || '',
                city: selectedDetail.propertyData?.city || '',
                province: selectedDetail.propertyData?.province || '',
                postalCode: selectedDetail.propertyData?.postalCode || '',
                buildingArea: selectedDetail.propertyData?.buildingArea || '',
                landArea: selectedDetail.propertyData?.landArea || '',
                numberOfFloors: selectedDetail.propertyData?.numberOfFloors || '',
                yearBuilt: selectedDetail.propertyData?.yearBuilt || '',
                propertyValue: selectedDetail.propertyData?.propertyValue || '',
                buildingStructure: selectedDetail.propertyData?.buildingStructure || '',

                policyNumber: selectedDetail.insuranceData?.policyNumber || '',
                insuranceCompany: selectedDetail.insuranceData?.insuranceCompany || '',
                coverageType: selectedDetail.insuranceData?.coverageType || '',
                insuranceValue: selectedDetail.insuranceData?.insuranceValue || '',
                premium: selectedDetail.insuranceData?.premium || '',
                startDate: formatDate(selectedDetail.insuranceData?.startDate),
                endDate: formatDate(selectedDetail.insuranceData?.endDate),
                deductible: selectedDetail.insuranceData?.deductible || '',

                notes: selectedDetail.notes || '',
            });
        } else {
            resetForm();
        }
    }, [open, selectedDetail]);

    const resetForm = () => {
        setFormData({
            ownerName: '', ownerEmail: '', ownerPhone: '', ownerAddress: '',
            propertyType: '', address: '', city: '', province: '', postalCode: '',
            buildingArea: '', landArea: '', numberOfFloors: '', yearBuilt: '',
            propertyValue: '', buildingStructure: '',
            policyNumber: '', insuranceCompany: '', coverageType: '',
            insuranceValue: '', premium: '', startDate: '', endDate: '', deductible: '',
            notes: ''
        });
        setPropertyPhotos({
            front: null, back: null, left: null, right: null,
            interior1: null, interior2: null, interior3: null, interior4: null
        });
        setPropertyDocuments({
            certificate: null, imb: null, pbb: null, other: null
        });
        setActiveStep(0);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: formatNumberInput(value) }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handlePhotoUpload = (key, file) => {
        if (!file) {
            setPropertyPhotos(prev => ({ ...prev, [key]: null }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            message('File too large. Max 5MB', 'error');
            return;
        }
        setPropertyPhotos(prev => ({ ...prev, [key]: file }));
    };

    const handleDocUpload = (key, file) => {
        if (!file) {
            setPropertyDocuments(prev => ({ ...prev, [key]: null }));
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            message('File too large. Max 10MB', 'error');
            return;
        }
        setPropertyDocuments(prev => ({ ...prev, [key]: file }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (activeStep === 0) {
            if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
        }

        if (activeStep === 2) {
            if (formData.startDate && formData.endDate) {
                if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                    newErrors.endDate = 'End date must be after start date';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (activeStep === steps.length - 1) {
                handleSubmit();
            } else {
                setActiveStep(prev => prev + 1);
            }
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        try {
            loadingProvider.start();

            const propertyData = {
                ownerName: formData.ownerName,
                ownerPhone: formData.ownerPhone,
                ownerEmail: formData.ownerEmail,
                ownerAddress: formData.ownerAddress,

                propertyType: formData.propertyType,
                address: formData.address,
                city: formData.city,
                province: formData.province,
                postalCode: formData.postalCode,
                buildingArea: formData.buildingArea || '',
                landArea: formData.landArea || '',
                numberOfFloors: formData.numberOfFloors || '',
                yearBuilt: formData.yearBuilt || '',
                propertyValue: formData.propertyValue || '',
                buildingStructure: formData.buildingStructure,

                policyNumber: formData.policyNumber,
                insuranceCompany: formData.insuranceCompany,
                coverageType: formData.coverageType,
                insuranceValue: formData.insuranceValue || '',
                premium: formData.premium || '',
                startDate: formData.startDate ? new Date(formData.startDate).getTime() : null,
                endDate: formData.endDate ? new Date(formData.endDate).getTime() : null,
                deductible: formData.deductible || '',

                notes: formData.notes,
            };

            let result;
            let propertyId;

            if (isNewRecord) {
                result = await PropertyDAO.createProperty(propertyData);
                propertyId = result.property.id;
                message('Property created successfully', 'success');
            } else {
                result = await PropertyDAO.updateProperty(selectedDetail.id, propertyData);
                propertyId = selectedDetail.id;
                message('Property updated successfully', 'success');
            }

            // Upload photos if any
            const hasPhotos = Object.values(propertyPhotos).some(photo => photo !== null);
            if (hasPhotos && propertyId) {
                try {
                    const photoFormData = new FormData();
                    Object.entries(propertyPhotos).forEach(([key, file]) => {
                        if (file) photoFormData.append(key, file);
                    });
                    await PropertyDAO.uploadPropertyPhotos(propertyId, photoFormData);
                } catch (photoError) {
                    console.error('Error uploading photos:', photoError);
                    message('Property saved but photos upload failed', 'warning');
                }
            }

            // Upload documents if any
            const hasDocs = Object.values(propertyDocuments).some(doc => doc !== null);
            if (hasDocs && propertyId) {
                try {
                    const docFormData = new FormData();
                    Object.entries(propertyDocuments).forEach(([key, file]) => {
                        if (file) docFormData.append(key, file);
                    });
                    await PropertyDAO.uploadPropertyDocuments(propertyId, docFormData);
                } catch (docError) {
                    console.error('Error uploading documents:', docError);
                    message('Property saved but documents upload failed', 'warning');
                }
            }

            onPropertySuccess();
            handleClose();
        } catch (err) {
            console.error('Error saving property:', err);
            message(err.error || 'Failed to save property', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    const propertyTypeOptions = Object.keys(PROPERTY_TYPES).map(key => ({
        value: PROPERTY_TYPES[key], label: PROPERTY_TYPES[key]
    }));

    const coverageTypeOptions = Object.keys(COVERAGE_TYPES).map(key => ({
        value: COVERAGE_TYPES[key], label: COVERAGE_TYPES[key]
    }));

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                style: { borderRadius: isMobile ? '0px' : '12px', overflow: 'hidden' }
            }}
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-gray-100`}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>
                    {isNewRecord ? 'Add New Property' : 'Edit Property'}
                </h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <Icon icon="mdi:close" width="24" />
                </button>
            </div>

            {/* Stepper */}
            <div className={`bg-gray-50 ${isMobile ? 'px-4 py-4' : 'px-6 py-6'} border-b border-gray-100`}>
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -z-0 -translate-y-[10px]" />
                    {steps.map((label, index) => {
                        const isActive = index === activeStep;
                        const isCompleted = index < activeStep;
                        return (
                            <div key={label} className="flex flex-col items-center relative z-10 bg-gray-50 px-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-colors
                                        ${isActive || isCompleted
                                            ? 'bg-[#002D5B] text-white shadow-md'
                                            : 'bg-white border border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {isCompleted ? <Icon icon="mdi:check" width="16" /> : index + 1}
                                </div>
                                <span className={`text-[10px] font-bold tracking-wider uppercase text-center
                                    ${isActive ? 'text-[#002D5B]' : 'text-gray-400'}
                                    ${isMobile && !isActive ? 'hidden' : 'block'}
                                `}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Body */}
            <div className={`${isMobile ? 'p-4' : 'p-8'} min-h-[400px] overflow-y-auto`}>
                {activeStep === 0 && (
                    <div className="space-y-5 animate-fadeIn">
                        <FormInput
                            label="Owner Name"
                            name="ownerName"
                            placeholder="John Doe"
                            icon="lucide:user"
                            required
                            value={formData.ownerName}
                            onChange={handleChange}
                            error={errors.ownerName}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput
                                label="Email"
                                name="ownerEmail"
                                type="email"
                                placeholder="john@example.com"
                                icon="lucide:mail"
                                value={formData.ownerEmail}
                                onChange={handleChange}
                                error={errors.ownerEmail}
                            />
                            <FormInput
                                label="Phone Number"
                                name="ownerPhone"
                                placeholder="+62 812 3456 7890"
                                icon="lucide:phone"
                                value={formData.ownerPhone}
                                onChange={handleChange}
                                error={errors.ownerPhone}
                            />
                        </div>

                        <FormInput
                            label="Owner Address"
                            name="ownerAddress"
                            placeholder="Owner's full address..."
                            icon="lucide:map-pin"
                            multiline
                            value={formData.ownerAddress}
                            onChange={handleChange}
                            error={errors.ownerAddress}
                        />

                        <FormInput
                            label="Additional Notes"
                            name="notes"
                            placeholder="Add any additional details..."
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
                            <NativeSelect
                                label="Property Type"
                                name="propertyType"
                                value={formData.propertyType}
                                onChange={handleChange}
                                options={propertyTypeOptions}
                                icon="lucide:home"
                            />
                            <FormInput label="Building Structure" name="buildingStructure" placeholder="Concrete, Wood, Steel" icon="lucide:layout" value={formData.buildingStructure} onChange={handleChange} />
                        </div>

                        <FormInput label="Property Address" name="address" placeholder="Property locations..." icon="lucide:map-pin" multiline value={formData.address} onChange={handleChange} />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <FormInput label="City" name="city" placeholder="Jakarta" icon="lucide:map" value={formData.city} onChange={handleChange} />
                            <FormInput label="Province" name="province" placeholder="DKI Jakarta" icon="lucide:map" value={formData.province} onChange={handleChange} />
                            <FormInput label="Postal Code" name="postalCode" placeholder="12345" icon="lucide:hash" value={formData.postalCode} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput label="Building Area (m²)" name="buildingArea" value={formData.buildingArea} onChange={handleNumberChange} icon="lucide:maximize" />
                            <FormInput label="Land Area (m²)" name="landArea" value={formData.landArea} onChange={handleNumberChange} icon="lucide:maximize" />
                            <FormInput label="Number of Floors" name="numberOfFloors" value={formData.numberOfFloors} onChange={handleNumberChange} icon="lucide:layers" />
                            <FormInput label="Year Built" name="yearBuilt" value={formData.yearBuilt} onChange={handleNumberChange} icon="lucide:calendar" />
                            <FormInput label="Property Value" name="propertyValue" value={formData.propertyValue} onChange={handleNumberChange} icon="lucide:dollar-sign" />
                        </div>
                    </div>
                )}

                {activeStep === 2 && (
                    <div className="space-y-5 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput label="Policy Number" name="policyNumber" value={formData.policyNumber} onChange={handleChange} icon="lucide:file-text" />
                            <FormInput label="Insurance Company" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} icon="lucide:shield" />
                        </div>

                        <NativeSelect
                            label="Coverage Type"
                            name="coverageType"
                            value={formData.coverageType}
                            onChange={handleChange}
                            options={coverageTypeOptions}
                            icon="lucide:check-square"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput label="Insurance Value" name="insuranceValue" value={formData.insuranceValue} onChange={handleNumberChange} icon="lucide:dollar-sign" />
                            <FormInput label="Premium" name="premium" value={formData.premium} onChange={handleNumberChange} icon="lucide:dollar-sign" />
                            <FormInput label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} icon="lucide:calendar" />
                            <FormInput label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleChange} error={errors.endDate} icon="lucide:calendar" />
                            <FormInput label="Deductible" name="deductible" value={formData.deductible} onChange={handleNumberChange} icon="lucide:dollar-sign" />
                        </div>

                        {formData.endDate && (
                            <div className="flex items-center gap-3 mt-4 text-sm">
                                <span className="font-semibold text-gray-700">Property Policy Status:</span>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${determineStatus(formData.endDate) === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {determineStatus(formData.endDate)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {activeStep === 3 && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormFileUpload
                                label="Upload Certificate (SHM/HGB)"
                                file={propertyDocuments.certificate}
                                onClick={() => document.getElementById('doc-certificate').click()}
                                icon="lucide:file-text"
                            />
                            <FormFileUpload
                                label="Upload Building Permit (IMB)"
                                file={propertyDocuments.imb}
                                onClick={() => document.getElementById('doc-imb').click()}
                                icon="lucide:file-text"
                            />
                            <FormFileUpload
                                label="Upload Property Tax (PBB)"
                                file={propertyDocuments.pbb}
                                onClick={() => document.getElementById('doc-pbb').click()}
                                icon="lucide:file-text"
                            />
                            <FormFileUpload
                                label="Other Documents"
                                file={propertyDocuments.other}
                                onClick={() => document.getElementById('doc-other').click()}
                                icon="lucide:folder"
                            />
                        </div>
                        {/* Hidden Inputs */}
                        <input id="doc-certificate" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('certificate', e.target.files[0])} />
                        <input id="doc-imb" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('imb', e.target.files[0])} />
                        <input id="doc-pbb" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('pbb', e.target.files[0])} />
                        <input id="doc-other" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('other', e.target.files[0])} />
                    </div>
                )}

                {activeStep === 4 && (
                    <div className="animate-fadeIn space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Exterior Photos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormFileUpload label="Front View" file={propertyPhotos.front} onClick={() => document.getElementById('photo-front').click()} icon="lucide:camera" />
                                <FormFileUpload label="Back View" file={propertyPhotos.back} onClick={() => document.getElementById('photo-back').click()} icon="lucide:camera" />
                                <FormFileUpload label="Left View" file={propertyPhotos.left} onClick={() => document.getElementById('photo-left').click()} icon="lucide:camera" />
                                <FormFileUpload label="Right View" file={propertyPhotos.right} onClick={() => document.getElementById('photo-right').click()} icon="lucide:camera" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Interior Photos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((num) => (
                                    <FormFileUpload key={`int-${num}`} label={`Interior ${num}`} file={propertyPhotos[`interior${num}`]} onClick={() => document.getElementById(`photo-interior${num}`).click()} icon="lucide:camera" />
                                ))}
                            </div>
                        </div>

                        {/* Hidden Inputs */}
                        <input id="photo-front" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload('front', e.target.files[0])} />
                        <input id="photo-back" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload('back', e.target.files[0])} />
                        <input id="photo-left" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload('left', e.target.files[0])} />
                        <input id="photo-right" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload('right', e.target.files[0])} />
                        {[1, 2, 3, 4].map(num => (
                            <input key={`inpt-int-${num}`} id={`photo-interior${num}`} type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(`interior${num}`, e.target.files[0])} />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`border-t border-gray-100 ${isMobile ? 'p-4' : 'p-6'} flex justify-between items-center bg-gray-50`}>
                <button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    type="button"
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors
                        ${activeStep === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                            : 'border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 bg-white'
                        }`}
                >
                    &lt; Back
                </button>

                <button
                    onClick={handleNext}
                    type="button"
                    className="px-6 py-2 bg-[#002D5B] text-white text-sm font-medium rounded-md hover:bg-[#001f40] transition-colors shadow-sm flex items-center gap-2"
                >
                    {activeStep === steps.length - 1 ? (isNewRecord ? 'Create' : 'Save Changes') : 'Next >'}
                </button>
            </div>
        </Dialog>
    );
}