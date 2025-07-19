import { Icon } from '@iconify/react';
import { Dialog, Stack } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import InvitationDAO from '../../daos/InvitationDAO.jsx';
import ShowDAO from '../../daos/ShowDAO';
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
import BatchAddGuestModal from './batch-add-guest-modal';
import { Box, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';


const SEATING_TYPES = { VIP: 'VIP', NORMAL: 'NORMAL' };

export default function GuestListPage() {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isBatchInviting, setIsBatchInviting] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
        seating_type: null, 
    });
    
    const [summaries, setSummaries] = useState([]);
    const loading = useLoading();
    const user = useUser();

     // State untuk mengecek apakah layar adalah mobile
     const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

     // Effect untuk mendeteksi perubahan ukuran layar
     useEffect(() => {
         const handleResize = () => {
             setIsMobile(window.innerWidth <= 640);
         };
 
         window.addEventListener('resize', handleResize);
         return () => window.removeEventListener('resize', handleResize);
     }, []);
 
     const [selectedStatus, setSelectedStatus] = useState("ALL");
     useEffect(() => {
        if (user?.data) {
            fetchInvitation(); // Panggil fetchInvitation setiap kali selectedStatus berubah
        }
    }, [selectedStatus]); // Dependency array: fetchInvitation akan dipanggil saat selectedStatus berubah

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            page: 0, // Reset ke halaman pertama saat status berubah
        }));
    };

     const fetchInvitation = async () => {
        try {
            loading.start();
            const filters = {
                keyword: dataSourceOptions.keyword,
                active: true,
                page: dataSourceOptions.page,
                limit: dataSourceOptions.limit,
                sort_by: dataSourceOptions.sortColumn || 'id',
                sort_type: dataSourceOptions.sortDirection || 'desc',
                seating_type: dataSourceOptions.seating_type ?? '',
                premier_id: user?.data?.premiers?.id,
            };
    
            // Tambahkan filter status hanya jika selectedStatus bukan "ALL"
            if (selectedStatus !== "ALL") {
                filters.status = selectedStatus;
            }
    
            const result = await InvitationDAO.getAll(filters);
    
            console.debug('Data', result?.meta?.total_data);
    
            const invitationsWithShowtime = await Promise.all(result.data.map(async (invitation) => {
                const show = await ShowDAO.getById(invitation.show_id);
                return {
                    ...invitation,
                    start_time: show?.start_time || null,
                };
            }));
    
            setDataSource(invitationsWithShowtime);
            setDataSourceOptions((prevOptions) => ({
                ...prevOptions,
                total: result?.meta?.total_data, // Total data yang difilter dari server
            }));
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            loading.stop();
        }
    };


    const getInvitationsSummary = async () => {
        try {
            // Ambil premier_id dari user yang login
            const premierId = user?.data?.premiers?.id;
            console.log('Premier ID:', premierId); 

            // Ambil semua data invitations
            const response = await InvitationDAO.getAll();
            console.log('API Response:', response); 
    
           
            const allInvitations = response.data || []; // Ambil properti `data` dari respons
            console.log('All Invitations:', allInvitations); 
    
            // Filter invitations berdasarkan premier_id
            const filteredInvitations = allInvitations.filter(
                (invitation) => invitation.premier_id === premierId
            );
            console.log('Filtered Invitations:', filteredInvitations); 
    
          
            const summaryData = [
                {
                    status: "INVITED",
                    total: filteredInvitations.filter(
                        (invitation) => invitation.status === "INVITED"
                    ).length,
                },
                {
                    status: "ACCEPTED",
                    total: filteredInvitations.filter(
                        (invitation) => invitation.status === "ACCEPTED"
                    ).length,
                },
                {
                    status: "CHECKED_IN",
                    total: filteredInvitations.filter(
                        (invitation) => invitation.status === "CHECKED_IN"
                    ).length,
                },
            ];
    
           
            summaryData.unshift({
                status: "ALL",
                total: filteredInvitations.length,
            });
    
            console.log('Summary Data:', summaryData); 
    
           
            setSummaries(summaryData);
        } catch (error) {
            console.error('Error fetching invitations summary:', error);
        }
    };

    const statusOrder = {
        "ALL": 0,
        "INVITED": 1,
        "ACCEPTED": 2,
        "CHECKED_IN": 3
    };
    
    const statusLabels = {
        "ALL": "All",
        "INVITED": "Invited",
        "ACCEPTED": "Accepted",
        "CHECKED_IN": "Check in"
    };

   
    
    const filteredData = dataSource.filter((item) => 
    selectedStatus === "ALL" || item.status === selectedStatus
);


    

    const sortedSummaries = [...summaries].sort((a, b) => {
        return statusOrder[a.status] - statusOrder[b.status];
    });

   
    

    const columns = [
        {
            title: 'Guest',
            key: 'name',
            sortable: true,
            render: (value, object) => {
                return (
                    <>
                        <div className="typography-4">
                            {object?.name || '-'}
                        </div>
                        <div className="typography-6 text-gray-500">
                            {object?.email || '-'}
                        </div>
                        <div className="typography-6 text-gray-500">
                            {object?.phone_number || '-'}
                        </div>
                    </>
                );
            },
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            sortable: false,
        },
        {
            title: 'Showtime',
            key: 'showtime',
            sortable: false,
            render: (value, object) => {
                return object?.start_time && dayjs.utc(object.start_time).isValid()
                    ? dayjs.utc(object.start_time).format('HH:mm')
                    : '-';
            },
        },
        { title: 'Seating', dataIndex: 'type', key: 'type', sortable: true },
        {
            title: 'Invited by',
            dataIndex: 'inviter',
            key: 'inviter',
            sortable: false,
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
                    INVITED: { bg: '#FFB020', text: '#FFFFFF' },
                    CHECKED_IN: { bg: '#2E7D32', text: '#FFFFFF' }, 
                    ACCEPTED: { bg: '#1976D2', text: '#FFFFFF' }, 
                    REJECTED: { bg: '#D32F2F', text: '#FFFFFF' },
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
            title: 'Studio',
            dataIndex: 'studio_id',
            key: 'studio',
            sortable: false,
            render: (value, object) => {
                return object?.studios?.name;
            },
        },
        {
            title: '',
            key: 'action',
            sortable: false,
            render: (value, object) => {
                return (
                    <>
                        {/*mdi:trash-can-outline*/}
                        <Stack direction={'row'} spacing={2}>
                            {/* <IconButton
                                size={'small'}
                                sx={{
                                    ...componentStyling.BUTTON_ICON, borderRadius: 0.8,
                                }}
                                onClick={() => {
                                    setSelectedDetail(object);
                                    setOpenCreateDialog(true);
                                    alert('Edit');
                                }}
                            >
                                <Icon icon={'mdi:pencil-outline'} />
                            </IconButton> */}
                            {/* <div>
                                <IconButton
                                    size={'small'}
                                    onClick={() => {
                                        confirm({
                                            title: 'Are you sure want delete?',
                                            description:
                                                'This action is permanent!',
                                        })
                                            .then(async () => {
                                                handleDelete(object.id);
                                            })
                                            .catch((e) => {
                                                if (e) {
                                                    showMessage(
                                                        'Something went wrong... Please try again later',
                                                        'error',
                                                    );
                                                    console.log('err', e);
                                                }
                                            });
                                    }}
                                    sx={{
                                        ...componentStyling.BUTTON_ICON, borderRadius: 0.8,
                                    }}
                                >
                                    <Icon icon={'mdi:trash-can-outline'} />
                                </IconButton>
                            </div> */}
                            {/* <Link to={`/donors/${object.id}`}> */}

                            {/* </Link> */}
                        </Stack>
                    </>
                );
            },
        },
    ];

    const handlePageChange = (newPage) => {
        setDataSourceOptions({ ...dataSourceOptions, page: newPage });
    };

    const handleLimitChange = (newLimit) => {
        setDataSourceOptions({ ...dataSourceOptions, limit: newLimit });
    };

    const handleFilterChange = (field, value) => {
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            [field]: value,
        }));
    };

    const handleSort = (columnKey) => {
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
        if (user?.data) fetchInvitation();
    }, [
        dataSourceOptions.page,
        dataSourceOptions.limit,
        dataSourceOptions.sortColumn,
        dataSourceOptions.sortDirection,
        dataSourceOptions.keyword,
        dataSourceOptions.seating_type,
        user?.data,
    ]);

    

    useEffect(() => {
        getInvitationsSummary();
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
            {/* Search Bar, Type Filter, and Create Invitation Button */}
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
                        value={dataSourceOptions.seating_type ?? 'ALL_SEATING'} 
                        onChange={(e) =>
                            setDataSourceOptions({
                                ...dataSourceOptions,
                                seating_type: e.target.value === 'ALL_SEATING' ? null : e.target.value,
                            })
                        }
                    >
                        <MenuItem value="ALL_SEATING">All Seating</MenuItem> 
                        {Object.keys(SEATING_TYPES).map((type, index) => (
                            <MenuItem value={SEATING_TYPES[type]} key={index}>
                                {SEATING_TYPES[type]}
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
                            Invite
                        </CustomButton>
                    </CustomRow>
                </CustomRow>

                <CustomRow className={'lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start'}>
    {sortedSummaries.map((summary) => (
        <div 
            key={summary.status}
            onClick={() => handleStatusChange(summary.status)}
            className={`cursor-pointer rounded-lg transition-all duration-200 ${
                selectedStatus === summary.status ? "border-2 border-blue-500" : "border border-transparent"
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
    dataSource={dataSource} // Gunakan dataSource yang sudah difilter dari server
    columns={columns}
    page={dataSourceOptions.page}
    limit={dataSourceOptions.limit}
    totalRecords={dataSourceOptions.total} // Gunakan total data yang difilter dari server
    handlePageChange={handlePageChange}
    handleLimitChange={handleLimitChange}
    handleSort={handleSort}
    sortColumn={dataSourceOptions.sortColumn}
    sortDirection={dataSourceOptions.sortDirection}
/>
            </CustomColumn>

            {/* Create Invitation Dialog */}
            <CreateInvitationDialog
                isNewRecord={selectedDetail === null}
                selectedDetail={selectedDetail}
                open={openCreateDialog}
                onClose={() => setOpenCreateDialog(false)}
                onInviteSuccess={(newGuest) => {
                 
                    const updatedGuest = { ...newGuest, status: "INVITED" };
                    setDataSource((prevData) => [...prevData, updatedGuest]);
                    setSummaries((prevSummaries) =>
                        prevSummaries.map((summary) =>
                            summary.status === "INVITED"
                                ? { ...summary, total: summary.total + 1 }
                                : summary.status === "ALL"
                                ? { ...summary, total: summary.total + 1 }
                                : summary
                        )
                    );
                }}
            />
        </>
    );
}

function CreateInvitationDialog({
    open,
    onClose,
    selectedDetail,
    isNewRecord = false, onInviteSuccess
}) {
    const [shows, setShows] = useState([]);
    const user = useUser();
    const loading = useLoading();
    const message = useAlert();

    const getData = async () => {
        try {
            let showsData = await ShowDAO.getByPremiereId(
                user?.data?.premiers?.id,
            );
            setShows(showsData);
        } catch (error) {
            console.error(error);
        }
    };

    const validationSchema = Yup.object({
        name: Yup.string().required('Guest name is required'),
        email: Yup.string()
            .required('Guest e-mail is required')
            .email('Invalid email format'),
        phone_number: Yup.string().optional(),
        inviter: Yup.string().required('Inverter is required'),
        show_id: Yup.number().required('Show time is required!'),
        type: Yup.string(),
        quantity: Yup.number() 
            .required('Quantity is required!')
            .min(1, 'Quantity must be at least 1') 
            .integer('Quantity must be an integer'), 
    });

    const handleSubmit = async (values) => {
        if (!user?.data) {
            message('User data is not available', 'error');
            return;
        }
    
        try {
            loading.start();
            values.premier_id = user?.data?.premiers?.id;
            values.studio_id = shows.find(show => show.id === values.show_id)?.studios?.id;
    
            
            console.log('Submitting with values:', values); 
    
            const result = await InvitationDAO.create(values);
    
            if (result) {
                message('Invitation created successfully', 'success');
    
                const selectedShow = shows.find(show => show.id === values.show_id);
                const updatedGuest = {
                    id: result.id,
                    ...values,
                    status: "INVITED",
                    start_time: selectedShow?.start_time || null,
                    studios: { name: selectedShow?.studios?.name || "-" },
                };
    
                onInviteSuccess(updatedGuest);
            }
    
            onClose();
        } catch (err) {
            if (err.response && err.response.data) {
                const errorMessage = err.response.data.detail || err.response.data.error || 'An error occurred';
                message(errorMessage, 'error');
            } else {
                message(err.error_message || 'Failed to invite guest', 'error');
            }
            console.log('err', err);
        } finally {
            loading.stop();
        }
    };
    
    
    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            phone_number: '',
            inviter: '',
            show_id: '',
            type: '',
            quantity: 1, 
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    useEffect(() => {
        if (user?.data) getData();
    }, [user?.data]);

    useEffect(() => {
        if (selectedDetail) {
            formik.setValues({
                name: selectedDetail.name,
                email: selectedDetail.email,
                phone_number: selectedDetail.phone_number,
                inviter: selectedDetail.inviter,
                show_time: selectedDetail.show_time,
                type: selectedDetail.type,
            });
        } else {
            formik.setValues({
                name: '',
                email: '',
                phone_number: '',
                inviter: '',
                show_time: '',
                type: '',
            });
        }
    }, [open, selectedDetail]);

    return (
        <Dialog open={open} maxWidth="md" fullWidth>
            <div className="px-6 pt-5 pb-7">
                {/* Dialog Title */}
                <div className="flex justify-between items-center">
                    <div className="typography-2">Invite</div>
                    <IconButton sx={{ p: 3 }} onClick={onClose}>
                        <Icon icon="heroicons:x-mark" />
                    </IconButton>
                </div>

                {/* Dialog Content */}
                <div className="mt-5">
                    <form onSubmit={formik.handleSubmit}>
                        {/* Premiere Information */}
                        <div className="flex flex-col gap-4">
                            <div className="typography-3">
                                Premiere Information
                            </div>
                            <div>
                                <div className="typography-1">Movie Title</div>
                                <div className="mt-1">
                                    {user?.data?.premiers?.name}
                                </div>
                            </div>
                            <div>
                                <div className="typography-1">Cinema</div>
                                <div className="mt-1">
                                    {user?.data?.premiers?.cinemas?.name}
                                </div>
                            </div>
                            <div>
                                <div className="typography-1">Date</div>
                                <div className="mt-1">
                                    {dayjs(user?.data?.premiers?.date).format(
                                        'dddd, DD MMM YYYY',
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Guest Information */}
                        <div className="flex flex-col gap-4 mt-6">
                            <div className="typography-3">
                                Guest Information
                            </div>
                            <CustomTextInput
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.touched.name &&
                                    Boolean(formik.errors.name)
                                }
                                helperText={
                                    formik.touched.name && formik.errors.name
                                }
                                placeholder="Enter attendee’s name"
                                label="Name"
                                fullWidth
                            />
                            <CustomTextInput
                                name="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.touched.email &&
                                    Boolean(formik.errors.email)
                                }
                                helperText={
                                    formik.touched.email && formik.errors.email
                                }
                                placeholder="Enter attendee’s email"
                                label="E-mail"
                                fullWidth
                            />
                            <div>
                                <CustomTextInput
                                    name="phone_number"
                                    value={formik.values.phone_number}
                                    onChange={formik.handleChange}
                                    placeholder="Enter attendee’s phone number"
                                    label="Phone Number"
                                    fullWidth
                                    error={
                                        formik.touched.phone_number &&
                                        Boolean(formik.errors.phone_number)
                                    }
                                    helperText={(
                                        formik.touched.phone_number &&
                                        formik.errors.phone_number) || 
                                        'Phone number must starts with a country code & without any symbols (ex: 628123456789)'
                                    }
                                />
                            </div>
                            <CustomTextInput
                                name="inviter"
                                value={formik.values.inviter}
                                onChange={formik.handleChange}
                                placeholder="Enter inviter’s name"
                                label="Invited By"
                                fullWidth
                                error={
                                    formik.touched.inviter &&
                                    Boolean(formik.errors.inviter)
                                }
                                helperText={
                                    formik.touched.inviter &&
                                    formik.errors.inviter
                                }
                            />
                            
                        </div>

                        {/* Studio, Show Time, and Seating Type */}
                        <div className="mt-6 flex flex-col gap-4">
                            <div className="typography-3">
                                Show Time and Seating Type
                            </div>
                            <CustomSelect
                                name="show_id"
                                value={formik.values.show_id}
                                onChange={formik.handleChange}
                                label="Show Time"
                                fullWidth
                                error={Boolean(formik.errors.show_id)}
                                helperText={formik.errors.show_id}
                            >
                                {shows.map((show, index) => (
                                <MenuItem
                                    key={show?.id || index}
                                    value={show?.id}
                                >
                                    {show?.studios?.name} -{' '}
                                    {show?.start_time && dayjs.utc(show.start_time).isValid()
                                        ? dayjs.utc(show.start_time).format('HH:mm') // Format waktu sama seperti di tabel
                                        : '-'}

                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomRadioGroup
                                name="type"
                                value={formik.values.type}
                                onChange={(e) => {
                                    formik.setFieldValue(
                                        'type',
                                        e.target.value,
                                    );
                                }}
                                label="Seating Type"
                                options={[
                                    { value: 'NORMAL', label: 'Normal' },
                                    { value: 'VIP', label: 'VIP' },
                                ]}
                            />
                            <div className="mb-2"> {/* Ini buat kasih jarak antar elemen */}
                            <CustomTextInput
                            name="quantity"
                            value={formik.values.quantity}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Enter quantity"
                            label="Quantity"
                            fullWidth
                            type="number" 
                            error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                            helperText={formik.touched.quantity && formik.errors.quantity}
                            
                        />
                        </div>
                        </div>

                        <div className="flex justify-end items-center gap-3 mt-5">
                            <CustomButton color="secondary" onClick={onClose}>
                                Cancel
                            </CustomButton>
                            <CustomButton type="submit">Invite</CustomButton>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>

        
    );
}