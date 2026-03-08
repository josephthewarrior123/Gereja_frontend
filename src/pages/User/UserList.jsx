import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    Button,
    Chip,
    Avatar,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Grid,
    useMediaQuery,
    useTheme,
    Divider,
    MenuItem,
    Stack,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import UserDAO from '../../daos/UserDAO';
import {
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomRow,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

export default function UserListPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Guard: kalau bukan admin/super_admin, redirect
    useEffect(() => {
        if (user && user.role === 'user') {
            message('Access denied', 'error');
            navigate('/dashboard', { replace: true });
        }
    }, [user]);

    const [allUsers, setAllUsers] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [summaries, setSummaries] = useState([]);
    const [mobileSearchInput, setMobileSearchInput] = useState('');
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
    });

    // Role menu state
    const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [updatingRole, setUpdatingRole] = useState(false);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const roleOrder = { ALL: 0, super_admin: 1, admin: 2, user: 3 };
    const roleLabels = { ALL: 'All', super_admin: 'Super Admin', admin: 'Admin', user: 'User' };
    const roleColors = { super_admin: '#7C3AED', admin: '#1D4ED8', user: '#0F766E' };

    // ===== FETCH =====

    const applyFilters = (users, role, options) => {
        let filtered = [...users];

        if (role !== 'ALL') {
            filtered = filtered.filter((u) => u.role === role);
        }

        if (options.keyword) {
            const kw = options.keyword.toLowerCase();
            filtered = filtered.filter(
                (u) =>
                    u.fullName.toLowerCase().includes(kw) ||
                    u.username.toLowerCase().includes(kw) ||
                    u.email.toLowerCase().includes(kw)
            );
        }

        if (options.sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[options.sortColumn] || '';
                const bVal = b[options.sortColumn] || '';
                return options.sortDirection === 'asc'
                    ? aVal > bVal ? 1 : -1
                    : aVal < bVal ? 1 : -1;
            });
        }

        const summaryData = [
            { role: 'ALL', total: users.length },
            { role: 'super_admin', total: users.filter((u) => u.role === 'super_admin').length },
            { role: 'admin', total: users.filter((u) => u.role === 'admin').length },
            { role: 'user', total: users.filter((u) => u.role === 'user').length },
        ];
        setSummaries(summaryData);

        const start = options.page * options.limit;
        const paginated = filtered.slice(start, start + options.limit);
        setDataSource(paginated);
        setDataSourceOptions((prev) => ({ ...prev, total: filtered.length }));
    };

    const fetchUsers = async () => {
        try {
            loading.start();
            const response = await UserDAO.getAllUsers();
            if (!response.success) throw new Error(response.error || 'Failed to fetch users');

            const users = response.users.map((u) => ({
                id: u.username,
                username: u.username,
                fullName: u.fullName || '-',
                email: u.email || '-',
                phone_number: u.phone_number || '-',
                role: u.role || 'user',
                groups: u.groups || [],
                managedGroups: u.managedGroups || [],
                isActive: u.isActive !== false,
                createdAt: u.createdAt || null,
            }));

            setAllUsers(users);
            applyFilters(users, selectedRole, dataSourceOptions);
        } catch (error) {
            message(error.message || 'Failed to fetch users', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [
        dataSourceOptions.page,
        dataSourceOptions.limit,
        dataSourceOptions.sortColumn,
        dataSourceOptions.sortDirection,
        dataSourceOptions.keyword,
        selectedRole,
    ]);

    useEffect(() => {
        if (allUsers.length > 0) {
            applyFilters(allUsers, selectedRole, dataSourceOptions);
        }
    }, [allUsers, selectedRole]);

    // ===== HANDLERS =====

    const handleRoleFilterChange = (role) => {
        setSelectedRole(role);
        setDataSourceOptions((prev) => ({ ...prev, page: 0 }));
    };

    const handleFilterChange = (field, value) => {
        setDataSourceOptions((prev) => ({ ...prev, [field]: value, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setDataSourceOptions((prev) => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit) => {
        setDataSourceOptions((prev) => ({ ...prev, limit: newLimit, page: 0 }));
    };

    const handleSort = (columnKey) => {
        setDataSourceOptions((prev) => ({
            ...prev,
            sortColumn: columnKey,
            sortDirection:
                prev.sortColumn === columnKey
                    ? prev.sortDirection === 'asc' ? 'desc' : 'asc'
                    : 'asc',
        }));
    };

    const formatDate = (ts) => {
        if (!ts) return '-';
        return new Date(ts).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    };

    const handleRoleMenuOpen = (e, userRow) => {
        e.stopPropagation();
        setRoleMenuAnchor(e.currentTarget);
        setSelectedUser(userRow);
    };

    const handleRoleMenuClose = () => {
        setRoleMenuAnchor(null);
        setSelectedUser(null);
    };

    const handleRoleUpdate = async (newRole) => {
        if (!selectedUser) return;
        if (user.role === 'admin' && newRole === 'super_admin') {
            message('Admin tidak bisa set super_admin', 'error');
            handleRoleMenuClose();
            return;
        }
        try {
            setUpdatingRole(true);
            loading.start();
            const response = await UserDAO.setUserRole(selectedUser.username, {
                role: newRole,
                groups: newRole === 'user' ? selectedUser.groups : [],
                managedGroups: newRole !== 'user' ? selectedUser.managedGroups : [],
            });
            if (!response.success) throw new Error(response.error);
            message('Role berhasil diupdate', 'success');
            fetchUsers();
        } catch (error) {
            message(error.message || 'Gagal update role', 'error');
        } finally {
            loading.stop();
            setUpdatingRole(false);
            handleRoleMenuClose();
        }
    };

    const openDeleteDialog = (userRow) => {
        setUserToDelete(userRow);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const sortedSummaries = [...summaries].sort(
        (a, b) => roleOrder[a.role] - roleOrder[b.role]
    );

    // ===== TABLE COLUMNS =====

    const columns = [
        {
            title: 'User',
            dataIndex: 'fullName',
            key: 'fullName',
            sortable: true,
            render: (value, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                        width: 36, height: 36,
                        bgcolor: roleColors[row.role] || '#64748B',
                        fontSize: 14, fontWeight: 700
                    }}>
                        {value?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={600} color="#1E293B">
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            @{row.username}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sortable: false,
            render: (value) => (
                <Typography variant="body2" color="text.secondary">{value}</Typography>
            ),
        },
        {
            title: 'Groups',
            dataIndex: 'groups',
            key: 'groups',
            sortable: false,
            render: (value, row) => {
                const list = row.role === 'user' ? (value || []) : (row.managedGroups || []);
                if (!list.length) return <Typography variant="caption" color="text.disabled">-</Typography>;
                return (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {list.map((g) => (
                            <Chip key={g} label={g} size="small" variant="outlined"
                                sx={{ fontSize: 11, height: 22 }} />
                        ))}
                    </Stack>
                );
            },
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            sortable: true,
            render: (value, row) => (
                <Chip
                    label={roleLabels[value] || value}
                    size="small"
                    onClick={(e) => handleRoleMenuOpen(e, row)}
                    sx={{
                        fontWeight: 700, fontSize: 11,
                        bgcolor: roleColors[value] || '#64748B',
                        color: '#fff', cursor: 'pointer',
                        '&:hover': { opacity: 0.85 },
                    }}
                />
            ),
        },
        {
            title: 'Joined',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sortable: false,
            render: (value) => (
                <Typography variant="body2" color="text.secondary">{formatDate(value)}</Typography>
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            sortable: false,
            render: (_, row) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={(e) => handleRoleMenuOpen(e, row)}
                        sx={{ borderRadius: 0.8 }}>
                        <Icon icon="mdi:shield-account-outline" />
                    </IconButton>
                    {user?.role === 'super_admin' && row.role !== 'super_admin' && (
                        <IconButton size="small" onClick={() => openDeleteDialog(row)}
                            sx={{ borderRadius: 0.8 }}>
                            <Icon icon="mdi:trash-can-outline" />
                        </IconButton>
                    )}
                </Stack>
            ),
        },
    ];

    // ===== MOBILE VIEW =====

    const renderMobileView = () => {
        const mobileLimit = 5;
        const startIndex = dataSourceOptions.page * mobileLimit;
        const endIndex = startIndex + mobileLimit;

        let filtered = [...allUsers];
        if (selectedRole !== 'ALL') filtered = filtered.filter((u) => u.role === selectedRole);
        if (dataSourceOptions.keyword) {
            const kw = dataSourceOptions.keyword.toLowerCase();
            filtered = filtered.filter(
                (u) =>
                    u.fullName.toLowerCase().includes(kw) ||
                    u.username.toLowerCase().includes(kw) ||
                    u.email.toLowerCase().includes(kw)
            );
        }

        const paginated = filtered.slice(startIndex, endIndex);
        const total = filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Icon icon="mdi:account-plus-outline" />}
                        onClick={() => navigate('/users/create')}
                        sx={{ textTransform: 'none', borderRadius: '12px' }}
                    >
                        Create User
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Icon icon="mdi:shield-plus-outline" />}
                        onClick={() => navigate('/users/create-admin')}
                        sx={{ textTransform: 'none', borderRadius: '12px' }}
                    >
                        Create Admin
                    </Button>
                </Stack>

                {/* Search */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search users..."
                        value={mobileSearchInput}
                        onChange={(e) => setMobileSearchInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleFilterChange('keyword', mobileSearchInput);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon icon="mdi:magnify" color="#94A3B8" />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '12px', bgcolor: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            },
                        }}
                    />
                </Box>

                {/* Role Filter Chips */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {sortedSummaries.map((s) => (
                        <Chip
                            key={s.role}
                            label={`${roleLabels[s.role]} (${s.total})`}
                            onClick={() => handleRoleFilterChange(s.role)}
                            sx={{
                                border: '1px solid',
                                borderColor: selectedRole === s.role ? '#1E3A8A' : '#E2E8F0',
                                backgroundColor: selectedRole === s.role ? '#1E3A8A' : '#fff',
                                color: selectedRole === s.role ? '#fff' : '#64748B',
                                fontWeight: 600, height: 38, borderRadius: '20px',
                            }}
                        />
                    ))}
                </Box>

                {/* User Cards */}
                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:account-off-outline" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>
                            No users found
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginated.map((u) => (
                            <Card key={u.id} sx={{
                                borderRadius: '24px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                border: '1px solid #F1F5F9'
                            }}>
                                <CardContent sx={{ p: '20px !important' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Avatar sx={{
                                            width: 48, height: 48,
                                            bgcolor: roleColors[u.role] || '#64748B',
                                            fontWeight: 700
                                        }}>
                                            {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
                                                {u.fullName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                @{u.username}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={roleLabels[u.role] || u.role}
                                            size="small"
                                            onClick={(e) => handleRoleMenuOpen(e, u)}
                                            sx={{
                                                fontWeight: 700, fontSize: '0.65rem',
                                                bgcolor: roleColors[u.role] || '#64748B',
                                                color: '#fff', borderRadius: '8px', cursor: 'pointer',
                                            }}
                                        />
                                    </Stack>

                                    <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Email
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="#334155"
                                                sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                                                {u.email}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Groups
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                {(u.role === 'user' ? u.groups : u.managedGroups).length > 0 ? (
                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                        {(u.role === 'user' ? u.groups : u.managedGroups).map((g) => (
                                                            <Chip key={g} label={g} size="small" variant="outlined"
                                                                sx={{ fontSize: 10, height: 20 }} />
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">-</Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Joined
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="#334155" sx={{ mt: 0.5 }}>
                                                {formatDate(u.createdAt)}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Stack direction="row" spacing={1} justifyContent="flex-end"
                                        sx={{ pt: 1, borderTop: '1px solid #F8FAFC' }}>
                                        <IconButton size="small" onClick={(e) => handleRoleMenuOpen(e, u)}
                                            sx={{ color: '#64748B' }}>
                                            <Icon icon="mdi:shield-account-outline" width={22} />
                                        </IconButton>
                                        {user?.role === 'super_admin' && u.role !== 'super_admin' && (
                                            <IconButton size="small" onClick={() => openDeleteDialog(u)}
                                                sx={{ color: '#64748B' }}>
                                                <Icon icon="mdi:trash-can-outline" width={22} />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Pagination */}
                {total > 0 && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0', pb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Showing <b>{startIndex + 1}–{Math.min(endIndex, total)}</b> of <b>{total}</b>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Page <b>{dataSourceOptions.page + 1}</b> of <b>{Math.ceil(total / mobileLimit)}</b>
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Button fullWidth variant="outlined"
                                disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page - 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#E2E8F0', color: '#64748B' }}
                            >
                                Prev
                            </Button>
                            <Button fullWidth variant="outlined"
                                disabled={endIndex >= total}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page + 1 }))}
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

    // ===== DESKTOP VIEW =====

    const renderDesktopView = () => (
        <CustomColumn className="gap-y-8 max-h-full">
            <CustomRow className="gap-x-3">
                <Button
                    variant="contained"
                    startIcon={<Icon icon="mdi:account-plus-outline" />}
                    onClick={() => navigate('/users/create')}
                    sx={{ textTransform: 'none' }}
                >
                    Create User
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Icon icon="mdi:shield-plus-outline" />}
                    onClick={() => navigate('/users/create-admin')}
                    sx={{ textTransform: 'none' }}
                >
                    Create Admin
                </Button>
            </CustomRow>

            <CustomRow className="gap-x-4">
                <CustomTextInput
                    placeholder="Search users..."
                    searchIcon
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleFilterChange('keyword', e.target.value);
                    }}
                />
            </CustomRow>

            <CustomRow className="lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start">
                {sortedSummaries.map((s) => (
                    <div
                        key={s.role}
                        onClick={() => handleRoleFilterChange(s.role)}
                        className={`cursor-pointer rounded-lg transition-all duration-200 ${
                            selectedRole === s.role ? 'border-2 border-blue-500' : 'border border-transparent'
                        }`}
                        style={{ width: '100%', height: '100%', display: 'flex' }}
                    >
                        <CustomDashboardStatsCard
                            value={s.total}
                            label={roleLabels[s.role] || s.role}
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

    // ===== RENDER =====

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* Role Change Menu */}
            <Menu
                anchorEl={roleMenuAnchor}
                open={Boolean(roleMenuAnchor)}
                onClose={handleRoleMenuClose}
                PaperProps={{ sx: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: 180 } }}
            >
                <Typography variant="caption" sx={{ px: 2, py: 1, color: '#94A3B8', fontWeight: 700, display: 'block' }}>
                    CHANGE ROLE
                </Typography>
                <MenuItem onClick={() => handleRoleUpdate('user')} disabled={updatingRole}>
                    <ListItemIcon>
                        <Icon icon="mdi:account-outline" color={roleColors.user} width={20} />
                    </ListItemIcon>
                    <ListItemText primary="User" />
                </MenuItem>
                <MenuItem onClick={() => handleRoleUpdate('admin')} disabled={updatingRole}>
                    <ListItemIcon>
                        <Icon icon="mdi:shield-outline" color={roleColors.admin} width={20} />
                    </ListItemIcon>
                    <ListItemText primary="Admin" />
                </MenuItem>
                {user?.role === 'super_admin' && (
                    <MenuItem onClick={() => handleRoleUpdate('super_admin')} disabled={updatingRole}>
                        <ListItemIcon>
                            <Icon icon="mdi:shield-crown-outline" color={roleColors.super_admin} width={20} />
                        </ListItemIcon>
                        <ListItemText primary="Super Admin" />
                    </MenuItem>
                )}
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={closeDeleteDialog}
                maxWidth="xs"
                fullWidth
                fullScreen={isMobile}
            >
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">Konfirmasi Hapus</Typography>
                        <IconButton onClick={closeDeleteDialog} size="small">
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Yakin mau hapus user <b>{userToDelete?.fullName}</b> (@{userToDelete?.username})?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Aksi ini tidak bisa dibatalkan.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button variant="outlined" onClick={closeDeleteDialog} fullWidth={isMobile}>
                            Batal
                        </Button>
                        <Button
                            variant="contained" color="error"
                            startIcon={<Icon icon="mdi:delete" />}
                            fullWidth={isMobile}
                            onClick={() => {
                                // implement delete kalau backend udah support
                                message('Fitur delete user belum tersedia di backend', 'info');
                                closeDeleteDialog();
                            }}
                        >
                            Hapus User
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}
