// PropertyComponentNativeSelect.jsx - Using Native HTML Select
import { Icon } from '@iconify/react';
import { Dialog } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import PropertyDAO from '../../daos/propertyDao';
import { useLoading } from '../../hooks/LoadingProvider.jsx';
import { useAlert } from '../../hooks/SnackbarProvider.jsx';
import { useUser } from '../../hooks/UserProvider';
import {
    CustomButton,
    CustomTextInput,
} from '../../reusables';

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

// Helper function untuk format number input
const formatNumberInput = (value) => {
    if (!value) return '';
    return value.toString().replace(/[^0-9.]/g, '');
};

// Helper function untuk menentukan status berdasarkan endDate
const determineStatus = (endDate) => {
    if (!endDate) return 'Active';
    
    // Reset waktu ke 00:00:00 untuk compare date saja (bukan datetime)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Kalau endDate kurang dari hari ini, berarti expired
    if (end < now) {
        return 'Expired';
    }
    return 'Active';
};

// Native Select Component dengan styling
const NativeSelect = ({ label, name, value, onChange, onBlur, options, isMobile }) => {
    return (
        <div className="flex flex-col gap-2">
            <label className={`${isMobile ? 'typography-2' : 'typography-1'} mb-1`}>
                {label}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                style={{
                    width: '100%',
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    fontSize: '14px',
                    border: '1px solid var(--color-project-tertiary)',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    paddingRight: '40px'
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
    );
};

export default function PropertyComponentNativeSelect({
    open,
    onClose,
    selectedDetail,
    isNewRecord = false,
    onPropertySuccess,
    isMobile = false
}) {
    const loading = useLoading();
    const message = useAlert();
    const user = useUser();

    // State untuk file uploads
    const [propertyPhotos, setPropertyPhotos] = useState({
        front: null,
        back: null,
        left: null,
        right: null,
        interior1: null,
        interior2: null,
        interior3: null,
        interior4: null,
    });

    const [propertyDocuments, setPropertyDocuments] = useState({
        certificate: null,
        imb: null,
        pbb: null,
        other: null,
    });

    const [createdPropertyId, setCreatedPropertyId] = useState(null);

    const validationSchema = Yup.object({
        ownerName: Yup.string().required('Owner name is required'),
        ownerEmail: Yup.string().email('Invalid email format'),
        ownerPhone: Yup.string(),
        ownerAddress: Yup.string(),
        
        propertyType: Yup.string(),
        address: Yup.string(),
        city: Yup.string(),
        province: Yup.string(),
        postalCode: Yup.string(),
        buildingArea: Yup.number()
            .typeError('Building area must be a number')
            .min(0, 'Building area cannot be negative')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        landArea: Yup.number()
            .typeError('Land area must be a number')
            .min(0, 'Land area cannot be negative')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        numberOfFloors: Yup.number()
            .typeError('Number of floors must be a number')
            .min(0, 'Number of floors cannot be negative')
            .integer('Must be a whole number')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        yearBuilt: Yup.number()
            .typeError('Year must be a number')
            .min(1800, 'Year must be after 1800')
            .max(new Date().getFullYear(), 'Year cannot be in the future')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        propertyValue: Yup.number()
            .typeError('Property value must be a number')
            .min(0, 'Property value cannot be negative')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        buildingStructure: Yup.string(),
        
        policyNumber: Yup.string(),
        insuranceCompany: Yup.string(),
        coverageType: Yup.string(),
        insuranceValue: Yup.number()
            .typeError('Insurance value must be a number')
            .min(0, 'Insurance value cannot be negative')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        premium: Yup.number()
            .typeError('Premium must be a number')
            .min(0, 'Premium cannot be negative')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        
        startDate: Yup.date()
            .nullable()
            .typeError('Invalid date format'),
        
        endDate: Yup.date()
            .nullable()
            .typeError('Invalid date format')
            .test(
                'end-date-after-start',
                'End date must be after start date',
                function(value) {
                    const { startDate } = this.parent;
                    if (!value || !startDate) return true;
                    
                    const end = new Date(value);
                    const start = new Date(startDate);
                    return end > start;
                }
            ),
        
        deductible: Yup.number()
            .typeError('Deductible must be a number')
            .min(0, 'Deductible cannot be negative')
            .nullable()
            .transform((value, originalValue) => 
                originalValue === '' ? null : value
            ),
        
        notes: Yup.string(),
    });

    const handleSubmit = async (values) => {
        try {
            loading.start();

            const propertyData = {
                ownerName: values.ownerName,
                ownerPhone: values.ownerPhone,
                ownerEmail: values.ownerEmail,
                ownerAddress: values.ownerAddress,
                
                propertyType: values.propertyType,
                address: values.address,
                city: values.city,
                province: values.province,
                postalCode: values.postalCode,
                buildingArea: values.buildingArea || '',
                landArea: values.landArea || '',
                numberOfFloors: values.numberOfFloors || '',
                yearBuilt: values.yearBuilt || '',
                propertyValue: values.propertyValue || '',
                buildingStructure: values.buildingStructure,
                
                policyNumber: values.policyNumber,
                insuranceCompany: values.insuranceCompany,
                coverageType: values.coverageType,
                insuranceValue: values.insuranceValue || '',
                premium: values.premium || '',
                startDate: values.startDate ? new Date(values.startDate).getTime() : null,
                endDate: values.endDate ? new Date(values.endDate).getTime() : null,
                deductible: values.deductible || '',
                
                notes: values.notes,
            };

            console.log('💾 Submitting property data:', propertyData);

            let result;
            let propertyId;

            if (isNewRecord) {
                result = await PropertyDAO.createProperty(propertyData);
                propertyId = result.property.id;
                console.log('✅ Property created with ID:', propertyId);
                message('Property created successfully', 'success');
            } else {
                result = await PropertyDAO.updateProperty(selectedDetail.id, propertyData);
                propertyId = selectedDetail.id;
                console.log('✅ Property updated:', propertyId);
                message('Property updated successfully', 'success');
            }

            // Upload photos if any
            const hasPhotos = Object.values(propertyPhotos).some(photo => photo !== null);
            if (hasPhotos && propertyId) {
                try {
                    const photoFormData = new FormData();
                    
                    Object.entries(propertyPhotos).forEach(([key, file]) => {
                        if (file) {
                            photoFormData.append(key, file);
                        }
                    });

                    console.log('📸 Uploading photos...');
                    await PropertyDAO.uploadPropertyPhotos(propertyId, photoFormData);
                    console.log('✅ Photos uploaded successfully');
                    message('Photos uploaded successfully', 'success');
                } catch (photoError) {
                    console.error('❌ Error uploading photos:', photoError);
                    message('Property saved but photos upload failed', 'warning');
                }
            }

            // Upload documents if any
            const hasDocs = Object.values(propertyDocuments).some(doc => doc !== null);
            if (hasDocs && propertyId) {
                try {
                    const docFormData = new FormData();
                    
                    Object.entries(propertyDocuments).forEach(([key, file]) => {
                        if (file) {
                            docFormData.append(key, file);
                        }
                    });

                    console.log('📄 Uploading documents...');
                    await PropertyDAO.uploadPropertyDocuments(propertyId, docFormData);
                    console.log('✅ Documents uploaded successfully');
                    message('Documents uploaded successfully', 'success');
                } catch (docError) {
                    console.error('❌ Error uploading documents:', docError);
                    message('Property saved but documents upload failed', 'warning');
                }
            }

            // Reset state and close
            setPropertyPhotos({
                front: null,
                back: null,
                left: null,
                right: null,
                interior1: null,
                interior2: null,
                interior3: null,
                interior4: null,
            });
            setPropertyDocuments({
                certificate: null,
                imb: null,
                pbb: null,
                other: null,
            });

            onPropertySuccess();
            onClose();
        } catch (err) {
            console.error('❌ Error saving property:', err);
            message(err.error || 'Failed to save property', 'error');
        } finally {
            loading.stop();
        }
    };

    const formik = useFormik({
        initialValues: {
            ownerName: '',
            ownerEmail: '',
            ownerPhone: '',
            ownerAddress: '',
            
            propertyType: '',
            address: '',
            city: '',
            province: '',
            postalCode: '',
            buildingArea: '',
            landArea: '',
            numberOfFloors: '',
            yearBuilt: '',
            propertyValue: '',
            buildingStructure: '',
            
            policyNumber: '',
            insuranceCompany: '',
            coverageType: '',
            insuranceValue: '',
            premium: '',
            startDate: null,
            endDate: null,
            deductible: '',
            
            notes: '',
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    useEffect(() => {
        if (selectedDetail && open) {
            const formatDate = (dateValue) => {
                if (!dateValue) return null;
                try {
                    return dayjs(dateValue).format('YYYY-MM-DD');
                } catch (error) {
                    return null;
                }
            };

            formik.setValues({
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
            formik.resetForm();
        }
    }, [open, selectedDetail]);

    const propertyTypeOptions = Object.keys(PROPERTY_TYPES).map(key => ({
        value: PROPERTY_TYPES[key],
        label: PROPERTY_TYPES[key]
    }));

    const coverageTypeOptions = Object.keys(COVERAGE_TYPES).map(key => ({
        value: COVERAGE_TYPES[key],
        label: COVERAGE_TYPES[key]
    }));

    return (
        <Dialog 
            open={open} 
            maxWidth="md" 
            fullWidth
            fullScreen={isMobile}
        >
            <div className={`${isMobile ? 'p-4' : 'px-6 pt-5 pb-7'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className={`${isMobile ? 'typography-3' : 'typography-2'}`}>
                        {isNewRecord ? 'Add New Property' : 'Edit Property'}
                    </div>
                    <IconButton sx={{ p: isMobile ? 1 : 3 }} onClick={onClose}>
                        <Icon icon="heroicons:x-mark" />
                    </IconButton>
                </div>

                <div className={isMobile ? 'max-h-[80vh] overflow-y-auto' : 'mt-5'}>
                    <form onSubmit={formik.handleSubmit}>
                        {/* Owner Information */}
                        <div className="flex flex-col gap-4">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Owner Information</div>
                            <CustomTextInput
                                name="ownerName"
                                value={formik.values.ownerName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.ownerName && Boolean(formik.errors.ownerName)}
                                helperText={formik.touched.ownerName && formik.errors.ownerName}
                                placeholder="Enter owner's name"
                                label="Owner Name *"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                            <CustomTextInput
                                name="ownerEmail"
                                value={formik.values.ownerEmail}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.ownerEmail && Boolean(formik.errors.ownerEmail)}
                                helperText={formik.touched.ownerEmail && formik.errors.ownerEmail}
                                placeholder="Enter owner's email"
                                label="Email"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                            <CustomTextInput
                                name="ownerPhone"
                                value={formik.values.ownerPhone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Enter owner's phone"
                                label="Phone"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                            <CustomTextInput
                                name="ownerAddress"
                                value={formik.values.ownerAddress}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Enter owner's address"
                                label="Address"
                                fullWidth
                                multiline
                                rows={isMobile ? 2 : 2}
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>

                        {/* Property Details */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Property Details</div>
                            
                            {/* Property Type - NATIVE SELECT */}
                            <NativeSelect
                                label="Property Type"
                                name="propertyType"
                                value={formik.values.propertyType}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                options={propertyTypeOptions}
                                isMobile={isMobile}
                            />
                            
                            <CustomTextInput
                                name="address"
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Enter property address"
                                label="Property Address"
                                fullWidth
                                multiline
                                rows={isMobile ? 2 : 2}
                                size={isMobile ? "small" : "medium"}
                            />
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="city"
                                    value={formik.values.city}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="City"
                                    label="City"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="province"
                                    value={formik.values.province}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="Province"
                                    label="Province"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="postalCode"
                                    value={formik.values.postalCode}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="Postal Code"
                                    label="Postal Code"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="yearBuilt"
                                    value={formik.values.yearBuilt}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('yearBuilt', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.yearBuilt && Boolean(formik.errors.yearBuilt)}
                                    helperText={formik.touched.yearBuilt && formik.errors.yearBuilt}
                                    placeholder="Year Built"
                                    label="Year Built"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="buildingArea"
                                    value={formik.values.buildingArea}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('buildingArea', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.buildingArea && Boolean(formik.errors.buildingArea)}
                                    helperText={formik.touched.buildingArea && formik.errors.buildingArea}
                                    placeholder="Building Area (m²)"
                                    label="Building Area (m²)"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="landArea"
                                    value={formik.values.landArea}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('landArea', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.landArea && Boolean(formik.errors.landArea)}
                                    helperText={formik.touched.landArea && formik.errors.landArea}
                                    placeholder="Land Area (m²)"
                                    label="Land Area (m²)"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="numberOfFloors"
                                    value={formik.values.numberOfFloors}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('numberOfFloors', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.numberOfFloors && Boolean(formik.errors.numberOfFloors)}
                                    helperText={formik.touched.numberOfFloors && formik.errors.numberOfFloors}
                                    placeholder="Number of Floors"
                                    label="Number of Floors"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="propertyValue"
                                    value={formik.values.propertyValue}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('propertyValue', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.propertyValue && Boolean(formik.errors.propertyValue)}
                                    helperText={formik.touched.propertyValue && formik.errors.propertyValue}
                                    placeholder="Property Value"
                                    label="Property Value"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <CustomTextInput
                                name="buildingStructure"
                                value={formik.values.buildingStructure}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="e.g., Concrete, Wood, Steel"
                                label="Building Structure"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>

                        {/* Insurance Details */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Insurance Details</div>
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="policyNumber"
                                    value={formik.values.policyNumber}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="Policy Number"
                                    label="Policy Number"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="insuranceCompany"
                                    value={formik.values.insuranceCompany}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="Insurance Company"
                                    label="Insurance Company"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            
                            {/* Coverage Type - NATIVE SELECT */}
                            <NativeSelect
                                label="Coverage Type"
                                name="coverageType"
                                value={formik.values.coverageType}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                options={coverageTypeOptions}
                                isMobile={isMobile}
                            />
                            
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="insuranceValue"
                                    value={formik.values.insuranceValue}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('insuranceValue', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.insuranceValue && Boolean(formik.errors.insuranceValue)}
                                    helperText={formik.touched.insuranceValue && formik.errors.insuranceValue}
                                    placeholder="Insurance Value"
                                    label="Insurance Value"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="premium"
                                    value={formik.values.premium}
                                    onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        formik.setFieldValue('premium', formatted);
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.premium && Boolean(formik.errors.premium)}
                                    helperText={formik.touched.premium && formik.errors.premium}
                                    placeholder="Premium"
                                    label="Premium"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="startDate"
                                    type="date"
                                    value={formik.values.startDate || ''}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                                    helperText={formik.touched.startDate && formik.errors.startDate}
                                    label="Start Date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="endDate"
                                    type="date"
                                    value={formik.values.endDate || ''}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                                    helperText={formik.touched.endDate && formik.errors.endDate}
                                    label="End Date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <CustomTextInput
                                name="deductible"
                                value={formik.values.deductible}
                                onChange={(e) => {
                                    const formatted = formatNumberInput(e.target.value);
                                    formik.setFieldValue('deductible', formatted);
                                }}
                                onBlur={formik.handleBlur}
                                error={formik.touched.deductible && Boolean(formik.errors.deductible)}
                                helperText={formik.touched.deductible && formik.errors.deductible}
                                placeholder="Deductible Amount"
                                label="Deductible"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>

                        {/* Property Photos */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Property Photos</div>
                            <div className="text-sm text-gray-600 mb-2">
                                Upload property photos (front, back, left, right, and interior views)
                            </div>
                            
                            {/* Photo Upload Grid */}
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                {/* Front Photo */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Front View</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        name="photoFront"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    message('File too large. Max 5MB', 'error');
                                                    return;
                                                }
                                                setPropertyPhotos(prev => ({ ...prev, front: file }));
                                                console.log('✅ Front photo selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyPhotos.front && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyPhotos.front.name}
                                        </div>
                                    )}
                                </div>

                                {/* Back Photo */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Back View</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        name="photoBack"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    message('File too large. Max 5MB', 'error');
                                                    return;
                                                }
                                                setPropertyPhotos(prev => ({ ...prev, back: file }));
                                                console.log('✅ Back photo selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyPhotos.back && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyPhotos.back.name}
                                        </div>
                                    )}
                                </div>

                                {/* Left Photo */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Left View</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        name="photoLeft"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    message('File too large. Max 5MB', 'error');
                                                    return;
                                                }
                                                setPropertyPhotos(prev => ({ ...prev, left: file }));
                                                console.log('✅ Left photo selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyPhotos.left && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyPhotos.left.name}
                                        </div>
                                    )}
                                </div>

                                {/* Right Photo */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Right View</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        name="photoRight"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    message('File too large. Max 5MB', 'error');
                                                    return;
                                                }
                                                setPropertyPhotos(prev => ({ ...prev, right: file }));
                                                console.log('✅ Right photo selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyPhotos.right && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyPhotos.right.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Interior Photos */}
                            <div className="mt-2">
                                <label className={`${isMobile ? 'typography-2' : 'typography-1'} mb-2 block`}>
                                    Interior Photos (up to 4 photos)
                                </label>
                                <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                    {[1, 2, 3, 4].map((num) => (
                                        <div key={num} className="flex flex-col gap-2">
                                            <label className="typography-1 mb-1">Interior {num}</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                name={`photoInterior${num}`}
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            message('File too large. Max 5MB', 'error');
                                                            return;
                                                        }
                                                        setPropertyPhotos(prev => ({ 
                                                            ...prev, 
                                                            [`interior${num}`]: file 
                                                        }));
                                                        console.log(`✅ Interior ${num} photo selected:`, file.name);
                                                    }
                                                }}
                                                style={{
                                                    padding: '12px',
                                                    border: '1px solid var(--color-project-tertiary)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            {propertyPhotos[`interior${num}`] && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    ✓ {propertyPhotos[`interior${num}`].name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 mt-2">
                                Note: Photos can be uploaded after creating the property. Maximum 5MB per photo.
                            </div>
                        </div>

                        {/* Property Documents */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Property Documents</div>
                            <div className="text-sm text-gray-600 mb-2">
                                Upload property documents (certificate, building permit, property tax, etc.)
                            </div>
                            
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                {/* Certificate */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Land Certificate (Sertifikat)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        name="docCertificate"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    message('File too large. Max 10MB', 'error');
                                                    return;
                                                }
                                                setPropertyDocuments(prev => ({ ...prev, certificate: file }));
                                                console.log('✅ Certificate selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyDocuments.certificate && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyDocuments.certificate.name}
                                        </div>
                                    )}
                                </div>

                                {/* IMB */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Building Permit (IMB)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        name="docIMB"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    message('File too large. Max 10MB', 'error');
                                                    return;
                                                }
                                                setPropertyDocuments(prev => ({ ...prev, imb: file }));
                                                console.log('✅ IMB selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyDocuments.imb && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyDocuments.imb.name}
                                        </div>
                                    )}
                                </div>

                                {/* PBB */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Property Tax (PBB)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        name="docPBB"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    message('File too large. Max 10MB', 'error');
                                                    return;
                                                }
                                                setPropertyDocuments(prev => ({ ...prev, pbb: file }));
                                                console.log('✅ PBB selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyDocuments.pbb && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyDocuments.pbb.name}
                                        </div>
                                    )}
                                </div>

                                {/* Other */}
                                <div className="flex flex-col gap-2">
                                    <label className="typography-1 mb-1">Other Documents</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        name="docOther"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    message('File too large. Max 10MB', 'error');
                                                    return;
                                                }
                                                setPropertyDocuments(prev => ({ ...prev, other: file }));
                                                console.log('✅ Other document selected:', file.name);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid var(--color-project-tertiary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {propertyDocuments.other && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ {propertyDocuments.other.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 mt-2">
                                Accepted formats: PDF, JPG, PNG. Maximum 10MB per document.
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Additional Information</div>
                            <CustomTextInput
                                name="notes"
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Enter any additional notes"
                                label="Notes"
                                fullWidth
                                multiline
                                rows={isMobile ? 3 : 3}
                                size={isMobile ? "small" : "medium"}
                            />
                            
                            {/* Status Display (Read Only) */}
                            <div className="flex flex-col gap-2">
                                <div className={`${isMobile ? 'typography-2' : 'typography-1'}`}>
                                    Status (Automatically Calculated)
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                                        determineStatus(formik.values.endDate) === 'Active' 
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                        {determineStatus(formik.values.endDate)}
                                    </div>
                                    {formik.values.endDate && (
                                        <div className="text-sm text-gray-600">
                                            {determineStatus(formik.values.endDate) === 'Active' 
                                                ? `Expires: ${dayjs(formik.values.endDate).format('DD/MM/YYYY')}`
                                                : `Expired since: ${dayjs(formik.values.endDate).format('DD/MM/YYYY')}`
                                            }
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Status is automatically determined based on the insurance end date.
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={`flex justify-end items-center gap-3 ${isMobile ? 'mt-6 sticky bottom-0 bg-white py-3' : 'mt-5'}`}>
                            <CustomButton 
                                color="secondary" 
                                onClick={onClose}
                                size={isMobile ? "small" : "medium"}
                            >
                                Cancel
                            </CustomButton>
                            <CustomButton 
                                type="submit"
                                size={isMobile ? "small" : "medium"}
                                disabled={!formik.isValid || formik.isSubmitting}
                            >
                                {isNewRecord ? 'Create Property' : 'Update Property'}
                            </CustomButton>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
}