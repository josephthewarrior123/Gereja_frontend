// PropertyList.jsx
import { Icon } from '@iconify/react';
import { Stack, Box, Typography, Chip, Card, CardContent } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import PropertyDAO from '../../daos/propertyDao';
import { useLoading } from '../../hooks/LoadingProvider.jsx';
import { useAlert } from '../../hooks/SnackbarProvider.jsx';
import { useUser } from '../../hooks/UserProvider';
import {
    CustomButton,
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomIcon,
    CustomRow,
    CustomSelect,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';
import PropertyComponent from './PropertyComponent';

const PROPERTY_TYPES = {
    HOUSE: 'House',
    APARTMENT: 'Apartment',
    OFFICE: 'Office',
    WAREHOUSE: 'Warehouse',
    SHOP: 'Shop',
    LAND: 'Land'
};

export default function PropertyListPage() {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [dataSource, setDataSource] = useState([]);
    const [allData, setAllData] = useState([]);
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

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
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

            const properties = result?.properties || result?.data || [];
            console.log('📊 Properties array:', properties);
            console.log('📊 Properties count:', properties.length);

            setAllData(properties);

            let filteredData = [...properties];
            
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

            if (dataSourceOptions.propertyType) {
                console.log('🏠 Filtering by property type:', dataSourceOptions.propertyType);
                filteredData = filteredData.filter(property => 
                    property.propertyData?.propertyType === dataSourceOptions.propertyType
                );
            }

            console.log('✅ Filtered data count:', filteredData.length);

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

    const renderMobileView = () => {
        return (
            <Box sx={{ p: 2 }}>
                {/* Search and Filter Section */}
                <Box sx={{ mb: 3 }}>
                    <CustomTextInput
                        fullWidth
                        placeholder="Search properties..."
                        value={dataSourceOptions.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                        <CustomSelect
                            fullWidth
                            value={dataSourceOptions.propertyType || 'ALL_TYPES'}
                            onChange={(e) =>
                                setDataSourceOptions({
                                    ...dataSourceOptions,
                                    propertyType: e.target.value === 'ALL_TYPES' ? null : e.target.value,
                                    page: 0,
                                })
                            }
                            sx={{ flex: 1 }}
                        >
                            <MenuItem value="ALL_TYPES">All Types</MenuItem>
                            {Object.keys(PROPERTY_TYPES).map((type, index) => (
                                <MenuItem value={PROPERTY_TYPES[type]} key={index}>
                                    {PROPERTY_TYPES[type]}
                                </MenuItem>
                            ))}
                        </CustomSelect>
                        
                        <Box
                            onClick={() => {
                                setOpenCreateDialog(true);
                                setSelectedDetail(null);
                            }}
                            sx={{
                                minWidth: '56px',
                                height: '56px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#1976d2',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                                transition: 'all 0.2s',
                                '&:active': {
                                    transform: 'scale(0.95)',
                                    boxShadow: '0 1px 4px rgba(25, 118, 210, 0.3)',
                                },
                            }}
                        >
                            <Icon icon="heroicons:plus" style={{ fontSize: '24px', color: '#fff' }} />
                        </Box>
                    </Box>
                    
                    {/* Status Filter Chips */}
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                        {sortedSummaries.map((summary) => (
                            <Chip
                                key={summary.status}
                                label={`${statusLabels[summary.status]} (${summary.total})`}
                                onClick={() => handleStatusChange(summary.status)}
                                sx={{
                                    backgroundColor: selectedStatus === summary.status ? '#1976d2' : '#f5f5f5',
                                    color: selectedStatus === summary.status ? '#fff' : '#666',
                                    fontWeight: selectedStatus === summary.status ? 'bold' : 'normal',
                                    transition: 'all 0.2s',
                                    '&:active': {
                                        transform: 'scale(0.95)',
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Property List */}
                {dataSource.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No properties found
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {dataSource.map((property) => (
                            <Card 
                                key={property.id} 
                                sx={{ 
                                    mb: 2, 
                                    borderRadius: 2,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <CardContent>
                                    {/* Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {property.ownerName || '-'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {property.ownerPhone || '-'}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={property.status || '-'}
                                            size="small"
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: property.status === 'Active' 
                                                    ? '#2E7D32' 
                                                    : property.status === 'Expired'
                                                    ? '#D32F2F'
                                                    : '#9E9E9E',
                                                color: '#fff',
                                            }}
                                        />
                                    </Box>

                                    {/* Property Details */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Property Details
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Type:</strong> {property.propertyData?.propertyType || '-'}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Address:</strong> {property.propertyData?.address || '-'}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>City:</strong> {property.propertyData?.city || '-'}
                                        </Typography>
                                    </Box>

                                    {/* Insurance Details */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Insurance Details
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Company:</strong> {property.insuranceData?.insuranceCompany || '-'}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Policy:</strong> {property.insuranceData?.policyNumber || '-'}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>End Date:</strong> {property.insuranceData?.endDate
                                                ? dayjs(property.insuranceData.endDate).format('DD MMM YYYY')
                                                : '-'}
                                        </Typography>
                                    </Box>

                                    {/* Action Buttons */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedDetail(property);
                                                setOpenCreateDialog(true);
                                            }}
                                            sx={{ color: '#1976d2' }}
                                        >
                                            <Icon icon="mdi:pencil-outline" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this property?')) {
                                                    handleDelete(property.id);
                                                }
                                            }}
                                            sx={{ color: '#d32f2f' }}
                                        >
                                            <Icon icon="mdi:trash-can-outline" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* Pagination */}
                {dataSourceOptions.total > 0 && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mt: 3,
                        pt: 2,
                        borderTop: '1px solid #e0e0e0'
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {Math.min(dataSourceOptions.page * dataSourceOptions.limit + 1, dataSourceOptions.total)} 
                            - {Math.min((dataSourceOptions.page + 1) * dataSourceOptions.limit, dataSourceOptions.total)} 
                            of {dataSourceOptions.total}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <CustomButton
                                size="small"
                                disabled={dataSourceOptions.page === 0}
                                onClick={() => handlePageChange(dataSourceOptions.page - 1)}
                            >
                                Prev
                            </CustomButton>
                            <CustomButton
                                size="small"
                                disabled={(dataSourceOptions.page + 1) * dataSourceOptions.limit >= dataSourceOptions.total}
                                onClick={() => handlePageChange(dataSourceOptions.page + 1)}
                            >
                                Next
                            </CustomButton>
                        </Box>
                    </Box>
                )}
            </Box>
        );
    };

    const renderDesktopView = () => {
        return (
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
        );
    };

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            <PropertyComponent
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
                isMobile={isMobile}
            />
        </>
    );
}