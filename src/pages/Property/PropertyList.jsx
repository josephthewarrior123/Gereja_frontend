// PropertyList.jsx
import { Icon } from '@iconify/react';
import {
    Stack,
    Box,
    Typography,
    Chip,
    Card,
    CardContent,
    Button,
    TextField,
    InputAdornment,
    Avatar,
    Divider,
    Grid
} from '@mui/material';
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
        const mobileLimit = 10;
        const startIndex = dataSourceOptions.page * mobileLimit;
        const endIndex = startIndex + mobileLimit;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                {/* Search Bar */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search properties..."
                        value={dataSourceOptions.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon icon="mdi:magnify" color="#94A3B8" />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '12px',
                                bgcolor: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' }
                            }
                        }}
                    />
                </Box>

                {/* Add Property Button */}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => { setOpenCreateDialog(true); setSelectedDetail(null); }}
                    startIcon={<Icon icon="heroicons:plus" />}
                    sx={{
                        bgcolor: '#1E3A8A',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: '16px',
                        mb: 3,
                        boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.3)',
                        '&:hover': { bgcolor: '#1e40af' }
                    }}
                >
                    Add Property
                </Button>

                {/* Status Filters */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {sortedSummaries.map((summary) => (
                        <Chip
                            key={summary.status}
                            label={`${statusLabels[summary.status]} (${summary.total})`}
                            onClick={() => handleStatusChange(summary.status)}
                            sx={{
                                border: '1px solid',
                                borderColor: selectedStatus === summary.status ? '#1E3A8A' : '#E2E8F0',
                                backgroundColor: selectedStatus === summary.status ? '#1E3A8A' : '#fff',
                                color: selectedStatus === summary.status ? '#fff' : '#64748B',
                                fontWeight: 600,
                                px: 1,
                                height: 38,
                                borderRadius: '20px',
                                '&:active': { transform: 'scale(0.95)' }
                            }}
                        />
                    ))}
                </Box>

                {/* List Content */}
                {dataSource.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:home-off-outline" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>No properties found</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {dataSource.map((property) => (
                            <Card key={property.id} sx={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
                                <CardContent sx={{ p: '20px !important' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}>
                                            {property.ownerName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.25 }}>
                                                {property.ownerName}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Icon icon="mdi:phone" width={14} /> {property.ownerPhone}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={(property.status || 'Active').toUpperCase()}
                                            size="small"
                                            sx={{
                                                bgcolor: property.status === 'Active' ? '#D1FAE5' : property.status === 'Expired' ? '#FEE2E2' : '#F1F5F9',
                                                color: property.status === 'Active' ? '#065F46' : property.status === 'Expired' ? '#991B1B' : '#475569',
                                                fontWeight: 800, fontSize: '0.65rem', borderRadius: '8px'
                                            }}
                                        />
                                    </Stack>

                                    <Divider sx={{ mb: 2.5, borderStyle: 'dashed' }} />

                                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>PROPERTY</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.5 }}>{property.propertyData?.propertyType || '-'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>{property.propertyData?.address?.substring(0, 20)}...</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>DUE DATE</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.5 }}>
                                                {property.insuranceData?.endDate ? dayjs(property.insuranceData.endDate).format('DD MMM YYYY') : '-'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: property.status === 'Active' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                                                {property.status === 'Active' ? 'Policy Active' : property.status === 'Expired' ? 'Expired' : 'Status Pending'}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1, borderTop: '1px solid #F8FAFC' }}>
                                        <IconButton size="small" onClick={() => { setSelectedDetail(property); setOpenCreateDialog(true); }} sx={{ color: '#64748B' }}><Icon icon="mdi:pencil-outline" width={22} /></IconButton>
                                        <IconButton size="small" onClick={() => { if (window.confirm('Delete this property?')) handleDelete(property.id); }} sx={{ color: '#64748B' }}><Icon icon="mdi:trash-can-outline" width={22} /></IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Pagination */}
                {dataSourceOptions.total > 0 && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0', pb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Showing <b>{startIndex + 1}-{Math.min(endIndex, dataSourceOptions.total)}</b> of <b>{dataSourceOptions.total}</b>
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Page <b>{dataSourceOptions.page + 1}</b> of <b>{Math.ceil(dataSourceOptions.total / mobileLimit)}</b>
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                disabled={dataSourceOptions.page === 0}
                                onClick={() => handlePageChange(dataSourceOptions.page - 1)}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#E2E8F0', color: '#64748B' }}
                            >
                                Prev
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                disabled={(dataSourceOptions.page + 1) * mobileLimit >= dataSourceOptions.total}
                                onClick={() => handlePageChange(dataSourceOptions.page + 1)}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#1E3A8A', color: '#1E3A8A' }}
                            >
                                Next
                            </Button>
                        </Stack>
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
                        <CustomButton
                            startIcon={
                                <CustomIcon
                                    icon={'heroicons:plus'}
                                    sx={{ py: 0 }}
                                />
                            }
                            onClick={() => {
                                setOpenCreateDialog(true);
                                setSelectedDetail(null);
                            }}
                            color="secondary"
                            sx={{
                                height: 50,
                                minWidth: 160,
                                whiteSpace: 'nowrap',
                                px: 3,
                                borderRadius: 1.5,
                                fontSize: '0.9375rem',
                                fontWeight: 600
                            }}
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
                            className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedStatus === summary.status
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