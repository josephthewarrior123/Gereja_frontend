import { Icon } from '@iconify/react';
import { Dialog, Stack, Box, Typography, Chip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import PropertyDAO from '../../daos/PropertyDAO';
import { useLoading } from '../../hooks/LoadingProvider.jsx';
import { useAlert } from '../../hooks/SnackbarProvider.jsx';
import { useUser } from '../../hooks/UserProvider';
import {
    CustomButton,
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomIcon,
    CustomRadioGroup,
    CustomRow,
    CustomSelect,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

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

export default function PropertyListPage() {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [dataSource, setDataSource] = useState([]);
    const [allData, setAllData] = useState([]); // Store all data
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
        propertyType: null,
    });
    
    const [summaries, setSummaries] = useState([]);
    const loading = useLoading();
    const user = useUser();
    const message = useAlert();

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 640);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [selectedStatus, setSelectedStatus] = useState("ALL");

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            page: 0,
        }));
    };

    const fetchProperties = async () => {
        try {
            loading.start();
            
            console.log('🔍 Fetching properties with status:', selectedStatus);
            
            let result;
            if (selectedStatus === "ALL") {
                result = await PropertyDAO.getAllProperties();
                console.log('📦 ALL Properties Result:', result);
            } else {
                result = await PropertyDAO.getPropertiesByStatus(selectedStatus);
                console.log('📦 Filtered Properties Result:', result);
            }

            // Handle response structure
            const properties = result?.properties || result?.data || [];
            console.log('📊 Properties array:', properties);
            console.log('📊 Properties count:', properties.length);

            // Store all data
            setAllData(properties);

            // Apply filters
            let filteredData = [...properties];
            
            // Keyword filter
            if (dataSourceOptions.keyword) {
                const keyword = dataSourceOptions.keyword.toLowerCase();
                console.log('🔎 Filtering with keyword:', keyword);
                
                filteredData = filteredData.filter(property => {
                    const matchOwnerName = property.ownerName?.toLowerCase().includes(keyword);
                    const matchOwnerPhone = property.ownerPhone?.includes(keyword);
                    const matchOwnerEmail = property.ownerEmail?.toLowerCase().includes(keyword);
                    const matchAddress = property.propertyData?.address?.toLowerCase().includes(keyword);
                    const matchCity = property.propertyData?.city?.toLowerCase().includes(keyword);
                    const matchPolicyNumber = property.insuranceData?.policyNumber?.toLowerCase().includes(keyword);
                    
                    return matchOwnerName || matchOwnerPhone || matchOwnerEmail || 
                           matchAddress || matchCity || matchPolicyNumber;
                });
            }

            // Property type filter
            if (dataSourceOptions.propertyType) {
                console.log('🏠 Filtering by property type:', dataSourceOptions.propertyType);
                filteredData = filteredData.filter(property => 
                    property.propertyData?.propertyType === dataSourceOptions.propertyType
                );
            }

            console.log('✅ Filtered data count:', filteredData.length);

            // Sort
            if (dataSourceOptions.sortColumn) {
                console.log('🔄 Sorting by:', dataSourceOptions.sortColumn, dataSourceOptions.sortDirection);
                filteredData.sort((a, b) => {
                    let aVal = a[dataSourceOptions.sortColumn] || '';
                    let bVal = b[dataSourceOptions.sortColumn] || '';
                    
                    if (dataSourceOptions.sortColumn === 'ownerName') {
                        aVal = a.ownerName || '';
                        bVal = b.ownerName || '';
                    }
                    
                    if (dataSourceOptions.sortDirection === 'asc') {
                        return aVal > bVal ? 1 : -1;
                    } else {
                        return aVal < bVal ? 1 : -1;
                    }
                });
            }

            // Pagination
            const startIndex = dataSourceOptions.page * dataSourceOptions.limit;
            const endIndex = startIndex + dataSourceOptions.limit;
            const paginatedData = filteredData.slice(startIndex, endIndex);

            console.log('📄 Paginated data:', paginatedData);
            console.log('📄 Showing:', startIndex, 'to', endIndex);

            setDataSource(paginatedData);
            setDataSourceOptions((prevOptions) => ({
                ...prevOptions,
                total: filteredData.length,
            }));

            console.log('✅ Data source updated with', paginatedData.length, 'items');
        } catch (err) {
            console.error('❌ Error fetching properties:', err);
            message('Failed to fetch properties', 'error');
        } finally {
            loading.stop();
        }
    };

    const getPropertiesSummary = async () => {
        try {
            console.log('📊 Fetching property stats...');
            const result = await PropertyDAO.getPropertyStats();
            console.log('📊 Stats Response:', result);

            const summaryData = [
                {
                    status: "ALL",
                    total: result.stats?.totalProperties || 0,
                },
                {
                    status: "Active",
                    total: result.stats?.activeProperties || 0,
                },
                {
                    status: "Expired",
                    total: result.stats?.expiredProperties || 0,
                },
                {
                    status: "Cancelled",
                    total: 0,
                },
            ];

            console.log('📊 Summary Data:', summaryData);
            setSummaries(summaryData);
        } catch (error) {
            console.error('❌ Error fetching properties summary:', error);
        }
    };

    const statusOrder = {
        "ALL": 0,
        "Active": 1,
        "Expired": 2,
        "Cancelled": 3
    };
    
    const statusLabels = {
        "ALL": "All",
        "Active": "Active",
        "Expired": "Expired",
        "Cancelled": "Cancelled"
    };

    const sortedSummaries = [...summaries].sort((a, b) => {
        return statusOrder[a.status] - statusOrder[b.status];
    });

    const handleDelete = async (propertyId) => {
        try {
            loading.start();
            await PropertyDAO.deleteProperty(propertyId);
            message('Property deleted successfully', 'success');
            fetchProperties();
            getPropertiesSummary();
        } catch (err) {
            console.error('Error deleting property:', err);
            message('Failed to delete property', 'error');
        } finally {
            loading.stop();
        }
    };

    const columns = [
        {
            title: 'Owner',
            key: 'ownerName',
            sortable: true,
            render: (value, object) => {
                return (
                    <>
                        <div className="typography-4">
                            {object?.ownerName || '-'}
                        </div>
                        <div className="typography-6 text-gray-500">
                            {object?.ownerEmail || '-'}
                        </div>
                        <div className="typography-6 text-gray-500">
                            {object?.ownerPhone || '-'}
                        </div>
                    </>
                );
            },
        },
        {
            title: 'Property Type',
            key: 'propertyType',
            sortable: true,
            render: (value, object) => {
                return object?.propertyData?.propertyType || '-';
            },
        },
        {
            title: 'Address',
            key: 'address',
            sortable: false,
            render: (value, object) => {
                return (
                    <>
                        <div className="typography-4">
                            {object?.propertyData?.address || '-'}
                        </div>
                        <div className="typography-6 text-gray-500">
                            {object?.propertyData?.city || '-'}
                            {object?.propertyData?.province ? `, ${object.propertyData.province}` : ''}
                        </div>
                    </>
                );
            },
        },
        {
            title: 'Insurance Company',
            key: 'insuranceCompany',
            sortable: false,
            render: (value, object) => {
                return object?.insuranceData?.insuranceCompany || '-';
            },
        },
        {
            title: 'Policy Number',
            key: 'policyNumber',
            sortable: false,
            render: (value, object) => {
                return object?.insuranceData?.policyNumber || '-';
            },
        },
        {
            title: 'End Date',
            key: 'endDate',
            sortable: false,
            render: (value, object) => {
                return object?.insuranceData?.endDate
                    ? dayjs(object.insuranceData.endDate).format('DD MMM YYYY')
                    : '-';
            },
        },
        {
            title: (
                <Box sx={{ textAlign: 'left', paddingLeft: '20px', display: 'block' }}>
                    Status
                </Box>
            ),
            dataIndex: 'status',
            key: 'status',
            sortable: true,
            render: (status) => {
                const statusStyles = {
                    Active: { bg: '#2E7D32', text: '#FFFFFF' },
                    Expired: { bg: '#D32F2F', text: '#FFFFFF' },
                    Cancelled: { bg: '#9E9E9E', text: '#FFFFFF' },
                    DEFAULT: { bg: '#9E9E9E', text: '#FFFFFF' },
                };

                const style = statusStyles[status] || statusStyles.DEFAULT;

                return (
                    <Chip
                        label={status || '-'}
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '12px',
                            height: '24px',
                            padding: '0 8px',
                            textAlign: 'center',
                            backgroundColor: style.bg,
                            color: style.text,
                            borderRadius: '15px',
                        }}
                    />
                );
            },
        },
        {
            title: '',
            key: 'action',
            sortable: false,
            render: (value, object) => {
                return (
                    <Stack direction={'row'} spacing={2}>
                        <IconButton
                            size={'small'}
                            sx={{ borderRadius: 0.8 }}
                            onClick={() => {
                                setSelectedDetail(object);
                                setOpenCreateDialog(true);
                            }}
                        >
                            <Icon icon={'mdi:pencil-outline'} />
                        </IconButton>
                        <IconButton
                            size={'small'}
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this property?')) {
                                    handleDelete(object.id);
                                }
                            }}
                            sx={{ borderRadius: 0.8 }}
                        >
                            <Icon icon={'mdi:trash-can-outline'} />
                        </IconButton>
                    </Stack>
                );
            },
        },
    ];

    const handlePageChange = (newPage) => {
        console.log('📄 Page changed to:', newPage);
        setDataSourceOptions({ ...dataSourceOptions, page: newPage });
    };

    const handleLimitChange = (newLimit) => {
        console.log('📄 Limit changed to:', newLimit);
        setDataSourceOptions({ ...dataSourceOptions, limit: newLimit, page: 0 });
    };

    const handleFilterChange = (field, value) => {
        console.log('🔍 Filter changed:', field, '=', value);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            [field]: value,
            page: 0,
        }));
    };

    const handleSort = (columnKey) => {
        console.log('🔄 Sort clicked:', columnKey);
        setDataSourceOptions({
            ...dataSourceOptions,
            sortColumn: columnKey,
            sortDirection:
                dataSourceOptions.sortColumn === columnKey
                    ? dataSourceOptions.sortDirection === 'asc'
                        ? 'desc'
                        : 'asc'
                    : 'asc',
        });
    };

    useEffect(() => {
        console.log('🔄 Refetching due to dependency change');
        console.log('👤 User data:', user?.data);
        console.log('📊 Selected status:', selectedStatus);
        console.log('📄 Page options:', dataSourceOptions);
        
        // Fetch properties regardless of user data (remove user?.data check if not needed)
        console.log('✅ Fetching properties...');
        fetchProperties();
    }, [
        dataSourceOptions.page,
        dataSourceOptions.limit,
        dataSourceOptions.sortColumn,
        dataSourceOptions.sortDirection,
        dataSourceOptions.keyword,
        dataSourceOptions.propertyType,
        selectedStatus,
    ]);

    useEffect(() => {
        console.log('🚀 Initial load - fetching summary');
        getPropertiesSummary();
    }, []);

    useEffect(() => {
        const checkExpired = async () => {
            try {
                console.log('⏰ Checking expired policies...');
                await PropertyDAO.checkExpiredPolicies();
            } catch (err) {
                console.error('❌ Error checking expired policies:', err);
            }
        };
        checkExpired();
    }, []);

    if (isMobile) {
        return (
            <Box className="flex justify-center items-center h-screen">
                <Typography variant="h5" fontWeight="bold">
                    Please open in your PC
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <CustomColumn className={'gap-y-8 max-h-full'}>
                <CustomRow className={'gap-x-4'}>
                    <CustomTextInput
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleFilterChange('keyword', e.target.value);
                            }
                        }}
                        placeholder={'Search'}
                        searchIcon={true}
                    />
                    <CustomRow className={'justify-center gap-x-4'}>
                        <CustomSelect
                            value={dataSourceOptions.propertyType ?? 'ALL_TYPES'}
                            onChange={(e) =>
                                setDataSourceOptions({
                                    ...dataSourceOptions,
                                    propertyType: e.target.value === 'ALL_TYPES' ? null : e.target.value,
                                    page: 0,
                                })
                            }
                        >
                            <MenuItem value="ALL_TYPES">All Types</MenuItem>
                            {Object.keys(PROPERTY_TYPES).map((type, index) => (
                                <MenuItem value={PROPERTY_TYPES[type]} key={index}>
                                    {PROPERTY_TYPES[type]}
                                </MenuItem>
                            ))}
                        </CustomSelect>

                        <CustomButton
                            startIcon={
                                <CustomIcon
                                    icon={'heroicons:plus'}
                                    sx={{ py: 6 }}
                                />
                            }
                            onClick={() => {
                                setOpenCreateDialog(true);
                                setSelectedDetail(null);
                            }}
                            color="secondary"
                        >
                            Add Property
                        </CustomButton>
                    </CustomRow>
                </CustomRow>

                <CustomRow className={'lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start'}>
                    {sortedSummaries.map((summary) => (
                        <div
                            key={summary.status}
                            onClick={() => handleStatusChange(summary.status)}
                            className={`cursor-pointer rounded-lg transition-all duration-200 ${
                                selectedStatus === summary.status
                                    ? "border-2 border-blue-500"
                                    : "border border-transparent"
                            }`}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                            }}
                        >
                            <CustomDashboardStatsCard
                                value={summary?.total}
                                label={statusLabels[summary.status] || summary.status}
                                className="w-full h-full"
                            />
                        </div>
                    ))}
                </CustomRow>

                <CustomDatatable
                    dataSource={dataSource}
                    columns={columns}
                    page={dataSourceOptions.page}
                    limit={dataSourceOptions.limit}
                    totalRecords={dataSourceOptions.total}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    handleSort={handleSort}
                    sortColumn={dataSourceOptions.sortColumn}
                    sortDirection={dataSourceOptions.sortDirection}
                />
            </CustomColumn>

            <CreatePropertyDialog
                isNewRecord={selectedDetail === null}
                selectedDetail={selectedDetail}
                open={openCreateDialog}
                onClose={() => {
                    setOpenCreateDialog(false);
                    setSelectedDetail(null);
                }}
                onPropertySuccess={() => {
                    fetchProperties();
                    getPropertiesSummary();
                }}
            />
        </>
    );
}

function CreatePropertyDialog({
    open,
    onClose,
    selectedDetail,
    isNewRecord = false,
    onPropertySuccess
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
        <Dialog open={open} maxWidth="md" fullWidth>
            <div className="px-6 pt-5 pb-7">
                <div className="flex justify-between items-center">
                    <div className="typography-2">
                        {isNewRecord ? 'Add New Property' : 'Edit Property'}
                    </div>
                    <IconButton sx={{ p: 3 }} onClick={onClose}>
                        <Icon icon="heroicons:x-mark" />
                    </IconButton>
                </div>

                <div className="mt-5">
                    <form onSubmit={formik.handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="typography-3">Owner Information</div>
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
                            />
                            <CustomTextInput
                                name="ownerPhone"
                                value={formik.values.ownerPhone}
                                onChange={formik.handleChange}
                                placeholder="Enter owner's phone"
                                label="Phone"
                                fullWidth
                            />
                            <CustomTextInput
                                name="ownerAddress"
                                value={formik.values.ownerAddress}
                                onChange={formik.handleChange}
                                placeholder="Enter owner's address"
                                label="Address"
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            <div className="typography-3">Property Details</div>
                            <CustomSelect
                                name="propertyType"
                                value={formik.values.propertyType}
                                onChange={formik.handleChange}
                                label="Property Type"
                                fullWidth
                            >
                                <MenuItem value="">Select Type</MenuItem>
                                {Object.keys(PROPERTY_TYPES).map((type) => (
                                    <MenuItem key={type} value={PROPERTY_TYPES[type]}>
                                        {PROPERTY_TYPES[type]}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomTextInput
                                name="address"
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                placeholder="Enter property address"
                                label="Property Address"
                                fullWidth
                                multiline
                                rows={2}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="city"
                                    value={formik.values.city}
                                    onChange={formik.handleChange}
                                    placeholder="City"
                                    label="City"
                                    fullWidth
                                />
                                <CustomTextInput
                                    name="province"
                                    value={formik.values.province}
                                    onChange={formik.handleChange}
                                    placeholder="Province"
                                    label="Province"
                                    fullWidth
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="postalCode"
                                    value={formik.values.postalCode}
                                    onChange={formik.handleChange}
                                    placeholder="Postal Code"
                                    label="Postal Code"
                                    fullWidth
                                />
                                <CustomTextInput
                                    name="yearBuilt"
                                    value={formik.values.yearBuilt}
                                    onChange={formik.handleChange}
                                    placeholder="Year Built"
                                    label="Year Built"
                                    fullWidth
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="buildingArea"
                                    value={formik.values.buildingArea}
                                    onChange={formik.handleChange}
                                    placeholder="Building Area (m²)"
                                    label="Building Area (m²)"
                                    fullWidth
                                />
                                <CustomTextInput
                                    name="landArea"
                                    value={formik.values.landArea}
                                    onChange={formik.handleChange}
                                    placeholder="Land Area (m²)"
                                    label="Land Area (m²)"
                                    fullWidth
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="numberOfFloors"
                                    value={formik.values.numberOfFloors}
                                    onChange={formik.handleChange}
                                    placeholder="Number of Floors"
                                    label="Number of Floors"
                                    fullWidth
                                />
                                <CustomTextInput
                                    name="propertyValue"
                                    value={formik.values.propertyValue}
                                    onChange={formik.handleChange}
                                    placeholder="Property Value"
                                    label="Property Value"
                                    fullWidth
                                />
                            </div>
                            <CustomTextInput
                                name="buildingStructure"
                                value={formik.values.buildingStructure}
                                onChange={formik.handleChange}
                                placeholder="e.g., Concrete, Wood, Steel"
                                label="Building Structure"
                                fullWidth
                            />
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            <div className="typography-3">Insurance Details</div>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="policyNumber"
                                    value={formik.values.policyNumber}
                                    onChange={formik.handleChange}
                                    placeholder="Policy Number"
                                    label="Policy Number"
                                    fullWidth
                                />
                                <CustomTextInput
                                    name="insuranceCompany"
                                    value={formik.values.insuranceCompany}
                                    onChange={formik.handleChange}
                                    placeholder="Insurance Company"
                                    label="Insurance Company"
                                    fullWidth
                                />
                            </div>
                            <CustomSelect
                                name="coverageType"
                                value={formik.values.coverageType}
                                onChange={formik.handleChange}
                                label="Coverage Type"
                                fullWidth
                            >
                                <MenuItem value="">Select Coverage</MenuItem>
                                {Object.keys(COVERAGE_TYPES).map((type) => (
                                    <MenuItem key={type} value={COVERAGE_TYPES[type]}>
                                        {COVERAGE_TYPES[type]}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="insuranceValue"
                                    value={formik.values.insuranceValue}
                                    onChange={formik.handleChange}
                                    placeholder="Insurance Value"
                                    label="Insurance Value"
                                    fullWidth
                                />
                                <CustomTextInput
                                    name="premium"
                                    value={formik.values.premium}
                                    onChange={formik.handleChange}
                                    placeholder="Premium"
                                    label="Premium"
                                    fullWidth
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomTextInput
                                    name="startDate"
                                    type="date"
                                    value={formik.values.startDate}
                                    onChange={formik.handleChange}
                                    label="Start Date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <CustomTextInput
                                    name="endDate"
                                    type="date"
                                    value={formik.values.endDate}
                                    onChange={formik.handleChange}
                                    label="End Date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </div>
                            <CustomTextInput
                                name="deductible"
                                value={formik.values.deductible}
                                onChange={formik.handleChange}
                                placeholder="Deductible Amount"
                                label="Deductible"
                                fullWidth
                            />
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            <div className="typography-3">Additional Information</div>
                            <CustomTextInput
                                name="notes"
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                placeholder="Enter any additional notes"
                                label="Notes"
                                fullWidth
                                multiline
                                rows={3}
                            />
                            <CustomSelect
                                name="status"
                                value={formik.values.status}
                                onChange={formik.handleChange}
                                label="Status"
                                fullWidth
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Expired">Expired</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </CustomSelect>
                        </div>

                        <div className="flex justify-end items-center gap-3 mt-5">
                            <CustomButton color="secondary" onClick={onClose}>
                                Cancel
                            </CustomButton>
                            <CustomButton type="submit">
                                {isNewRecord ? 'Create Property' : 'Update Property'}
                            </CustomButton>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
}