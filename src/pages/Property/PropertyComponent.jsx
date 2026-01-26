// PropertyComponent.jsx
import { Icon } from '@iconify/react';
import { Dialog, MenuItem } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useEffect } from 'react';
import * as Yup from 'yup';
import PropertyDAO from '../../daos/propertyDao';
import { useLoading } from '../../hooks/LoadingProvider.jsx';
import { useAlert } from '../../hooks/SnackbarProvider.jsx';
import { useUser } from '../../hooks/UserProvider';
import {
    CustomButton,
    CustomSelect,
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

export default function PropertyComponent({
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
        buildingArea: Yup.string(),
        landArea: Yup.string(),
        numberOfFloors: Yup.string(),
        yearBuilt: Yup.string(),
        propertyValue: Yup.string(),
        buildingStructure: Yup.string(),
        
        policyNumber: Yup.string(),
        insuranceCompany: Yup.string(),
        coverageType: Yup.string(),
        insuranceValue: Yup.string(),
        premium: Yup.string(),
        startDate: Yup.date().nullable(),
        endDate: Yup.date().nullable(),
        deductible: Yup.string(),
        
        notes: Yup.string(),
        status: Yup.string(),
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
                buildingArea: values.buildingArea,
                landArea: values.landArea,
                numberOfFloors: values.numberOfFloors,
                yearBuilt: values.yearBuilt,
                propertyValue: values.propertyValue,
                buildingStructure: values.buildingStructure,
                
                policyNumber: values.policyNumber,
                insuranceCompany: values.insuranceCompany,
                coverageType: values.coverageType,
                insuranceValue: values.insuranceValue,
                premium: values.premium,
                startDate: values.startDate ? new Date(values.startDate).getTime() : null,
                endDate: values.endDate ? new Date(values.endDate).getTime() : null,
                deductible: values.deductible,
                
                notes: values.notes,
                status: values.status || 'Active',
            };

            console.log('💾 Submitting property data:', propertyData);

            let result;
            if (isNewRecord) {
                result = await PropertyDAO.createProperty(propertyData);
                message('Property created successfully', 'success');
            } else {
                result = await PropertyDAO.updateProperty(selectedDetail.id, propertyData);
                message('Property updated successfully', 'success');
            }

            console.log('✅ Result:', result);
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
            status: 'Active',
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    useEffect(() => {
        if (selectedDetail) {
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
                startDate: selectedDetail.insuranceData?.startDate 
                    ? dayjs(selectedDetail.insuranceData.startDate).format('YYYY-MM-DD')
                    : null,
                endDate: selectedDetail.insuranceData?.endDate
                    ? dayjs(selectedDetail.insuranceData.endDate).format('YYYY-MM-DD')
                    : null,
                deductible: selectedDetail.insuranceData?.deductible || '',
                
                notes: selectedDetail.notes || '',
                status: selectedDetail.status || 'Active',
            });
        } else {
            formik.resetForm();
        }
    }, [open, selectedDetail]);

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
                                label="Owner Name"
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
                                placeholder="Enter owner's phone"
                                label="Phone"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                            <CustomTextInput
                                name="ownerAddress"
                                value={formik.values.ownerAddress}
                                onChange={formik.handleChange}
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
                            <div>
                                <label className={isMobile ? 'typography-2' : 'typography-1'}>Property Type</label>
                                <CustomSelect
                                    name="propertyType"
                                    value={formik.values.propertyType || ''}
                                    onChange={formik.handleChange}
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                >
                                    <MenuItem value="">Select Type</MenuItem>
                                    {Object.keys(PROPERTY_TYPES).map((type) => (
                                        <MenuItem key={type} value={PROPERTY_TYPES[type]}>
                                            {PROPERTY_TYPES[type]}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </div>
                            <CustomTextInput
                                name="address"
                                value={formik.values.address}
                                onChange={formik.handleChange}
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
                                    placeholder="City"
                                    label="City"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="province"
                                    value={formik.values.province}
                                    onChange={formik.handleChange}
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
                                    placeholder="Postal Code"
                                    label="Postal Code"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="yearBuilt"
                                    value={formik.values.yearBuilt}
                                    onChange={formik.handleChange}
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
                                    onChange={formik.handleChange}
                                    placeholder="Building Area (m²)"
                                    label="Building Area (m²)"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="landArea"
                                    value={formik.values.landArea}
                                    onChange={formik.handleChange}
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
                                    onChange={formik.handleChange}
                                    placeholder="Number of Floors"
                                    label="Number of Floors"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="propertyValue"
                                    value={formik.values.propertyValue}
                                    onChange={formik.handleChange}
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
                                    placeholder="Policy Number"
                                    label="Policy Number"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="insuranceCompany"
                                    value={formik.values.insuranceCompany}
                                    onChange={formik.handleChange}
                                    placeholder="Insurance Company"
                                    label="Insurance Company"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <div>
                                <label className={isMobile ? 'typography-2' : 'typography-1'}>Coverage Type</label>
                                <CustomSelect
                                    name="coverageType"
                                    value={formik.values.coverageType || ''}
                                    onChange={formik.handleChange}
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                >
                                    <MenuItem value="">Select Coverage</MenuItem>
                                    {Object.keys(COVERAGE_TYPES).map((type) => (
                                        <MenuItem key={type} value={COVERAGE_TYPES[type]}>
                                            {COVERAGE_TYPES[type]}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </div>
                            <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
                                <CustomTextInput
                                    name="insuranceValue"
                                    value={formik.values.insuranceValue}
                                    onChange={formik.handleChange}
                                    placeholder="Insurance Value"
                                    label="Insurance Value"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="premium"
                                    value={formik.values.premium}
                                    onChange={formik.handleChange}
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
                                    value={formik.values.startDate}
                                    onChange={formik.handleChange}
                                    label="Start Date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? "small" : "medium"}
                                />
                                <CustomTextInput
                                    name="endDate"
                                    type="date"
                                    value={formik.values.endDate}
                                    onChange={formik.handleChange}
                                    label="End Date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? "small" : "medium"}
                                />
                            </div>
                            <CustomTextInput
                                name="deductible"
                                value={formik.values.deductible}
                                onChange={formik.handleChange}
                                placeholder="Deductible Amount"
                                label="Deductible"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                            />
                        </div>

                        {/* Additional Information */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`${isMobile ? 'typography-2' : 'typography-3'}`}>Additional Information</div>
                            <CustomTextInput
                                name="notes"
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                placeholder="Enter any additional notes"
                                label="Notes"
                                fullWidth
                                multiline
                                rows={isMobile ? 3 : 3}
                                size={isMobile ? "small" : "medium"}
                            />
                            <div>
                                <label className={isMobile ? 'typography-2' : 'typography-1'}>Status</label>
                                <CustomSelect
                                    name="status"
                                    value={formik.values.status || 'Active'}
                                    onChange={formik.handleChange}
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Expired">Expired</MenuItem>
                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                </CustomSelect>
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