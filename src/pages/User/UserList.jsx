// src/pages/User/UserListPage.jsx
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
    Stack,
    Menu,
    ListItemIcon,
    ListItemText,
    MenuItem,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import UserDAO from '../../daos/UserDAO';
import AdminDAO from '../../daos/AdminDao';
import {
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomRow,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

// ─── design tokens ────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
    super_admin: { label: 'Super Admin', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    admin:       { label: 'Admin',       color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    user:        { label: 'User',        color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
};
const roleColors = { super_admin: '#7C3AED', admin: '#1D4ED8', user: '#0F766E' };
const roleLabels = { ALL: 'All', super_admin: 'Super Admin', admin: 'Admin', user: 'User' };
const roleOrder  = { ALL: 0, super_admin: 1, admin: 2, user: 3 };

const STAT_ACCENT = {
    ALL:         { from: '#6366f1', to: '#8b5cf6' },
    super_admin: { from: '#7C3AED', to: '#a855f7' },
    admin:       { from: '#1D4ED8', to: '#3b82f6' },
    user:        { from: '#0F766E', to: '#14b8a6' },
};

// ─── SVG: users illustration for empty state ─────────────────────────────────
function EmptyIllustration() {
    return (
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            <circle cx="60" cy="36" r="22" fill="#F1F5F9"/>
            <circle cx="60" cy="28" r="10" fill="#CBD5E1"/>
            <path d="M32 72 Q36 54 60 54 Q84 54 88 72" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5"/>
            <circle cx="24" cy="40" r="8" fill="#E2E8F0"/>
            <path d="M8 65 Q11 54 24 54 Q37 54 40 65" fill="#F1F5F9"/>
            <circle cx="96" cy="40" r="8" fill="#E2E8F0"/>
            <path d="M80 65 Q83 54 96 54 Q109 54 112 65" fill="#F1F5F9"/>
        </svg>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ role, total, selected, onClick }) {
    const accent = STAT_ACCENT[role] || STAT_ACCENT.ALL;
    const isSelected = selected === role;
    return (
        <Box
            onClick={onClick}
            sx={{
                flex: 1,
                borderRadius: '16px',
                border: isSelected ? `2px solid ${accent.from}` : '2px solid #F1F5F9',
                bgcolor: '#fff',
                p: 2.5,
                cursor: 'pointer',
                transition: 'all .18s ease',
                boxShadow: isSelected
                    ? `0 4px 20px ${accent.from}28`
                    : '0 1px 4px rgba(0,0,0,0.04)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    borderColor: accent.from,
                    boxShadow: `0 4px 20px ${accent.from}22`,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            {/* accent strip top */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: isSelected ? `linear-gradient(90deg, ${accent.from}, ${accent.to})` : 'transparent',
                borderRadius: '16px 16px 0 0',
                transition: 'background .18s',
            }}/>
            <Typography sx={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#94a3b8', mb: 1.5,
                fontFamily: '"DM Sans", sans-serif',
            }}>
                {roleLabels[role]}
            </Typography>
            <Typography sx={{
                fontSize: 34, fontWeight: 800, color: isSelected ? accent.from : '#0f172a',
                lineHeight: 1, fontFamily: '"Outfit", sans-serif',
                letterSpacing: '-0.03em',
                transition: 'color .18s',
            }}>
                {total}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#cbd5e1', mt: 0.5 }}>
                {role === 'ALL' ? 'total users' : 'registered'}
            </Typography>
        </Box>
    );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role, onClick }) {
    const cfg = ROLE_CONFIG[role] || { label: role, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.4, borderRadius: '99px',
                bgcolor: cfg.bg, border: `1.5px solid ${cfg.border}`,
                color: cfg.color, fontSize: 11, fontWeight: 700,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'opacity .15s',
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '0.03em',
                '&:hover': onClick ? { opacity: 0.75 } : {},
            }}
        >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }}/>
            {cfg.label}
        </Box>
    );
}

export default function UserListPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        keyword: '', page: 0, limit: 10, total: 0, sortColumn: '', sortDirection: 'asc',
    });
    const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [updatingRole, setUpdatingRole] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const applyFilters = (users, role, options) => {
        let filtered = [...users];
        if (role !== 'ALL') filtered = filtered.filter((u) => u.role === role);
        if (options.keyword) {
            const kw = options.keyword.toLowerCase();
            filtered = filtered.filter(
                (u) => u.fullName.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw)
            );
        }
        if (options.sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[options.sortColumn] || '', bVal = b[options.sortColumn] || '';
                return options.sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
        }
        setSummaries([
            { role: 'ALL',         total: users.length },
            { role: 'super_admin', total: users.filter((u) => u.role === 'super_admin').length },
            { role: 'admin',       total: users.filter((u) => u.role === 'admin').length },
            { role: 'user',        total: users.filter((u) => u.role === 'user').length },
        ]);
        const start = options.page * options.limit;
        setDataSource(filtered.slice(start, start + options.limit));
        setDataSourceOptions((prev) => ({ ...prev, total: filtered.length }));
    };

    const fetchUsers = async () => {
        try {
            loading.start();
            let rawUsers = [];
            if (user?.role === 'super_admin') {
                const response = await UserDAO.getAllUsers();
                if (!response.success) throw new Error(response.error || 'Failed to fetch users');
                rawUsers = response.users || [];
            } else {
                const response = await AdminDAO.listUsers();
                if (!response.success) throw new Error(response.error || 'Failed to fetch users');
                rawUsers = response.data || [];
            }
            const users = rawUsers.map((u) => ({
                id: u.username, username: u.username, fullName: u.fullName || '-',
                email: u.email || '-', phone_number: u.phone_number || '-',
                role: u.role || 'user', groups: u.groups || [], managedGroups: u.managedGroups || [],
                isActive: u.isActive !== false, createdAt: u.createdAt || null,
            }));
            setAllUsers(users);
            applyFilters(users, selectedRole, dataSourceOptions);
        } catch (error) {
            message(error.message || 'Failed to fetch users', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => { if (user) fetchUsers(); }, [
        user, dataSourceOptions.page, dataSourceOptions.limit,
        dataSourceOptions.sortColumn, dataSourceOptions.sortDirection,
        dataSourceOptions.keyword, selectedRole,
    ]);
    useEffect(() => { if (allUsers.length > 0) applyFilters(allUsers, selectedRole, dataSourceOptions); }, [allUsers, selectedRole]);

    const handleRoleFilterChange = (role) => { setSelectedRole(role); setDataSourceOptions((prev) => ({ ...prev, page: 0 })); };
    const handleFilterChange = (field, value) => setDataSourceOptions((prev) => ({ ...prev, [field]: value, page: 0 }));
    const handlePageChange = (newPage) => setDataSourceOptions((prev) => ({ ...prev, page: newPage }));
    const handleLimitChange = (newLimit) => setDataSourceOptions((prev) => ({ ...prev, limit: newLimit, page: 0 }));
    const handleSort = (columnKey) => setDataSourceOptions((prev) => ({
        ...prev, sortColumn: columnKey,
        sortDirection: prev.sortColumn === columnKey ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
    const formatDate = (ts) => !ts ? '-' : new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const handleRoleMenuOpen = (e, userRow) => { e.stopPropagation(); setRoleMenuAnchor(e.currentTarget); setSelectedUser(userRow); };
    const handleRoleMenuClose = () => { setRoleMenuAnchor(null); setSelectedUser(null); };
    const handleRoleUpdate = async (newRole) => {
        if (!selectedUser) return;
        if (user.role === 'admin' && newRole === 'super_admin') { message('Admin tidak bisa set super_admin', 'error'); handleRoleMenuClose(); return; }
        try {
            setUpdatingRole(true); loading.start();
            const response = await UserDAO.setUserRole(selectedUser.username, { role: newRole, groups: newRole === 'user' ? selectedUser.groups : [], managedGroups: newRole !== 'user' ? selectedUser.managedGroups : [] });
            if (!response.success) throw new Error(response.error);
            message('Role berhasil diupdate', 'success');
            fetchUsers();
        } catch (error) {
            message(error.message || 'Gagal update role', 'error');
        } finally { loading.stop(); setUpdatingRole(false); handleRoleMenuClose(); }
    };
    const openDeleteDialog = (userRow) => { setUserToDelete(userRow); setIsDeleteDialogOpen(true); };
    const closeDeleteDialog = () => { setIsDeleteDialogOpen(false); setUserToDelete(null); };
    const sortedSummaries = [...summaries].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

    // ─── table columns ────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'User', dataIndex: 'fullName', key: 'fullName', sortable: true,
            render: (value, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                        width: 38, height: 38,
                        bgcolor: roleColors[row.role] || '#64748B',
                        fontSize: 14, fontWeight: 800,
                        fontFamily: '"Outfit", sans-serif',
                        boxShadow: `0 2px 8px ${roleColors[row.role] || '#64748B'}44`,
                    }}>
                        {value?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                            {value}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                            @{row.username}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            title: 'Email', dataIndex: 'email', key: 'email', sortable: false,
            render: (value) => (
                <Typography sx={{ fontSize: 13, color: '#64748b', fontFamily: '"DM Sans", sans-serif' }}>{value}</Typography>
            ),
        },
        {
            title: 'Groups', dataIndex: 'groups', key: 'groups', sortable: false,
            render: (value, row) => {
                const list = row.role === 'user' ? (value || []) : (row.managedGroups || []);
                if (!list.length) return <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>—</Typography>;
                return (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {list.map((g) => (
                            <Box key={g} sx={{
                                px: 1.2, py: 0.3, borderRadius: '6px',
                                bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                                fontSize: 11, color: '#475569', fontWeight: 600,
                                fontFamily: '"DM Sans", sans-serif',
                            }}>
                                {g}
                            </Box>
                        ))}
                    </Stack>
                );
            },
        },
        {
            title: 'Role', dataIndex: 'role', key: 'role', sortable: true,
            render: (value, row) => <RoleBadge role={value} onClick={(e) => handleRoleMenuOpen(e, row)} />,
        },
        {
            title: 'Joined', dataIndex: 'createdAt', key: 'createdAt', sortable: false,
            render: (value) => (
                <Typography sx={{ fontSize: 12, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>
                    {formatDate(value)}
                </Typography>
            ),
        },
        {
            title: 'Actions', dataIndex: 'actions', key: 'actions', sortable: false,
            render: (_, row) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => navigate(`/users/${row.username}/edit`)}
                        sx={{ borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                        <Icon icon="mdi:pencil-outline" width={17} />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => handleRoleMenuOpen(e, row)}
                        sx={{ borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                        <Icon icon="mdi:shield-account-outline" width={17} />
                    </IconButton>
                    {((user?.role === 'super_admin' && row.role !== 'super_admin') || (user?.role === 'admin' && row.role === 'user')) && (
                        <IconButton size="small" onClick={() => openDeleteDialog(row)}
                            sx={{ borderRadius: '8px', color: '#94a3b8', '&:hover': { bgcolor: '#FEF2F2', color: '#EF4444' } }}>
                            <Icon icon="mdi:trash-can-outline" width={17} />
                        </IconButton>
                    )}
                </Stack>
            ),
        },
    ];

    // ─── mobile ───────────────────────────────────────────────────────────────
    const renderMobileView = () => {
        const mobileLimit = 5;
        const startIndex = dataSourceOptions.page * mobileLimit;
        let filtered = [...allUsers];
        if (selectedRole !== 'ALL') filtered = filtered.filter((u) => u.role === selectedRole);
        if (dataSourceOptions.keyword) {
            const kw = dataSourceOptions.keyword.toLowerCase();
            filtered = filtered.filter((u) => u.fullName.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw));
        }
        const paginated = filtered.slice(startIndex, startIndex + mobileLimit);
        const total = filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button fullWidth variant="contained"
                        startIcon={<Icon icon="mdi:account-plus-outline" />}
                        onClick={() => navigate('/users/create')}
                        sx={{ textTransform: 'none', borderRadius: '12px', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
                        Create User
                    </Button>
                    {user?.role === 'super_admin' && (
                        <Button fullWidth variant="outlined"
                            startIcon={<Icon icon="mdi:shield-plus-outline" />}
                            onClick={() => navigate('/users/create-admin')}
                            sx={{ textTransform: 'none', borderRadius: '12px', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, borderColor: '#e2e8f0', color: '#0f172a' }}>
                            Create Admin
                        </Button>
                    )}
                </Stack>

                <TextField fullWidth placeholder="Search users..." value={mobileSearchInput}
                    onChange={(e) => setMobileSearchInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleFilterChange('keyword', mobileSearchInput); }}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: '#fff', fontSize: 14, fontFamily: '"DM Sans", sans-serif', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } },
                    }}
                />

                {user?.role === 'super_admin' && (
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
                        {sortedSummaries.map((s) => {
                            const acc = STAT_ACCENT[s.role];
                            return (
                                <Box key={s.role} onClick={() => handleRoleFilterChange(s.role)} sx={{
                                    flexShrink: 0, px: 2, py: 0.8, borderRadius: '99px', cursor: 'pointer',
                                    fontWeight: 700, fontSize: 12, fontFamily: '"DM Sans", sans-serif',
                                    border: '1.5px solid',
                                    borderColor: selectedRole === s.role ? acc.from : '#e2e8f0',
                                    bgcolor: selectedRole === s.role ? acc.from : '#fff',
                                    color: selectedRole === s.role ? '#fff' : '#64748b',
                                    transition: 'all .15s',
                                }}>
                                    {roleLabels[s.role]} ({s.total})
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <EmptyIllustration />
                        <Typography sx={{ mt: 2, color: '#94A3B8', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>No users found</Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {paginated.map((u) => (
                            <Card key={u.id} sx={{ borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
                                <CardContent sx={{ p: '18px !important' }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                        <Avatar sx={{ width: 44, height: 44, bgcolor: roleColors[u.role] || '#64748B', fontWeight: 800, fontFamily: '"Outfit", sans-serif', boxShadow: `0 2px 8px ${roleColors[u.role] || '#64748B'}44` }}>
                                            {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>{u.fullName}</Typography>
                                            <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>@{u.username}</Typography>
                                        </Box>
                                        <RoleBadge role={u.role} onClick={(e) => handleRoleMenuOpen(e, u)} />
                                    </Stack>

                                    <Divider sx={{ mb: 1.5, borderColor: '#f8fafc' }} />

                                    {/* ── Info grid: email removed ── */}
                                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                                        <Grid item xs={6}>
                                            <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>Groups</Typography>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                {(u.role === 'user' ? u.groups : u.managedGroups).map((g) => (
                                                    <Box key={g} sx={{ px: 1, py: 0.2, borderRadius: '5px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 10, color: '#475569', fontWeight: 600 }}>{g}</Box>
                                                ))}
                                                {!(u.role === 'user' ? u.groups : u.managedGroups).length && <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>—</Typography>}
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>Joined</Typography>
                                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: '"DM Sans", sans-serif' }}>{formatDate(u.createdAt)}</Typography>
                                        </Grid>
                                    </Grid>

                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ pt: 1, borderTop: '1px solid #f8fafc' }}>
                                        <IconButton size="small" onClick={() => navigate(`/users/${u.username}/edit`)} sx={{ borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                                            <Icon icon="mdi:pencil-outline" width={20} />
                                        </IconButton>
                                        <IconButton size="small" onClick={(e) => handleRoleMenuOpen(e, u)} sx={{ borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                                            <Icon icon="mdi:shield-account-outline" width={20} />
                                        </IconButton>
                                        {((user?.role === 'super_admin' && u.role !== 'super_admin') || (user?.role === 'admin' && u.role === 'user')) && (
                                            <IconButton size="small" onClick={() => openDeleteDialog(u)} sx={{ borderRadius: '8px', color: '#94a3b8', '&:hover': { bgcolor: '#FEF2F2', color: '#EF4444' } }}>
                                                <Icon icon="mdi:trash-can-outline" width={20} />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {total > 0 && (
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E2E8F0', pb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: 12, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                {startIndex + 1}–{Math.min(startIndex + mobileLimit, total)} of {total}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                Page {dataSourceOptions.page + 1} / {Math.ceil(total / mobileLimit)}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5}>
                            <Button fullWidth variant="outlined" disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page - 1 }))}
                                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, textTransform: 'none', fontFamily: '"DM Sans", sans-serif', borderColor: '#e2e8f0', color: '#64748b' }}>
                                Previous
                            </Button>
                            <Button fullWidth variant="contained" disabled={(startIndex + mobileLimit) >= total}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page + 1 }))}
                                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, textTransform: 'none', fontFamily: '"DM Sans", sans-serif', bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
                                Next
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        );
    };

    // ─── desktop ──────────────────────────────────────────────────────────────
    const renderDesktopView = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, bgcolor: '#f8fafc', minHeight: '100%' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

            {/* ── Header row ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: '"DM Sans", sans-serif', mb: 0.3 }}>
                        Management
                    </Typography>
                    <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.02em', lineHeight: 1 }}>
                        Users
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="contained"
                        startIcon={<Icon icon="mdi:account-plus-outline" />}
                        onClick={() => navigate('/users/create')}
                        sx={{
                            textTransform: 'none', borderRadius: '12px',
                            bgcolor: '#0f172a', fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                            px: 2.5, py: 1.1, fontSize: 13,
                            boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
                            '&:hover': { bgcolor: '#1e293b' },
                        }}>
                        Create User
                    </Button>
                    {user?.role === 'super_admin' && (
                        <Button
                            variant="outlined"
                            startIcon={<Icon icon="mdi:shield-plus-outline" />}
                            onClick={() => navigate('/users/create-admin')}
                            sx={{
                                textTransform: 'none', borderRadius: '12px',
                                fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                                px: 2.5, py: 1.1, fontSize: 13,
                                borderColor: '#e2e8f0', color: '#0f172a',
                                '&:hover': { borderColor: '#0f172a', bgcolor: '#f8fafc' },
                            }}>
                            Create Admin
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* ── Search ── */}
            <Box sx={{ maxWidth: 380 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name, username or email…"
                    onKeyPress={(e) => { if (e.key === 'Enter') handleFilterChange('keyword', e.target.value); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Icon icon="mdi:magnify" color="#94A3B8" width={18} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '12px', bgcolor: '#fff', fontSize: 13,
                            fontFamily: '"DM Sans", sans-serif',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' },
                        },
                    }}
                />
            </Box>

            {/* ── Stat cards ── */}
            {user?.role === 'super_admin' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {sortedSummaries.map((s) => (
                        <StatCard
                            key={s.role}
                            role={s.role}
                            total={s.total}
                            selected={selectedRole}
                            onClick={() => handleRoleFilterChange(s.role)}
                        />
                    ))}
                </Box>
            )}

            {/* ── Table ── */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <CustomDatatable
                    dataSource={dataSource} columns={columns}
                    page={dataSourceOptions.page} limit={dataSourceOptions.limit}
                    totalRecords={dataSourceOptions.total}
                    handlePageChange={handlePageChange} handleLimitChange={handleLimitChange}
                    handleSort={handleSort} sortColumn={dataSourceOptions.sortColumn} sortDirection={dataSourceOptions.sortDirection}
                />
            </Box>
        </Box>
    );

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* ── Role menu ── */}
            <Menu anchorEl={roleMenuAnchor} open={Boolean(roleMenuAnchor)} onClose={handleRoleMenuClose}
                PaperProps={{ sx: { borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 190, border: '1px solid #f1f5f9' } }}>
                <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: '"DM Sans", sans-serif' }}>
                    Change Role
                </Typography>
                <MenuItem onClick={() => handleRoleUpdate('user')} disabled={updatingRole} sx={{ borderRadius: '8px', mx: 0.5, my: 0.3 }}>
                    <ListItemIcon><Icon icon="mdi:account-outline" color={roleColors.user} width={18} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' } }} primary="User" />
                </MenuItem>
                <MenuItem onClick={() => handleRoleUpdate('admin')} disabled={updatingRole} sx={{ borderRadius: '8px', mx: 0.5, my: 0.3 }}>
                    <ListItemIcon><Icon icon="mdi:shield-outline" color={roleColors.admin} width={18} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' } }} primary="Admin" />
                </MenuItem>
                {user?.role === 'super_admin' && (
                    <MenuItem onClick={() => handleRoleUpdate('super_admin')} disabled={updatingRole} sx={{ borderRadius: '8px', mx: 0.5, my: 0.3 }}>
                        <ListItemIcon><Icon icon="mdi:shield-crown-outline" color={roleColors.super_admin} width={18} /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ sx: { fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' } }} primary="Super Admin" />
                    </MenuItem>
                )}
            </Menu>

            {/* ── Delete dialog ── */}
            <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif', mb: 0.3 }}>
                                Delete User
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                This action cannot be undone
                            </Typography>
                        </Box>
                        <IconButton onClick={closeDeleteDialog} size="small" sx={{ borderRadius: '8px', color: '#94a3b8' }}>
                            <Icon icon="mdi:close" width={18} />
                        </IconButton>
                    </Box>

                    <Box sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', p: 2, mb: 3 }}>
                        <Typography sx={{ fontSize: 13, color: '#991b1b', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.6 }}>
                            Yakin mau hapus <strong>{userToDelete?.fullName}</strong> (@{userToDelete?.username})?
                        </Typography>
                    </Box>

                    <Stack direction={isMobile ? 'column' : 'row'} spacing={1} justifyContent="flex-end">
                        <Button variant="outlined" onClick={closeDeleteDialog}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}>
                            Batal
                        </Button>
                        <Button variant="contained" color="error"
                            startIcon={<Icon icon="mdi:delete" />}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, bgcolor: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.3)', '&:hover': { bgcolor: '#dc2626' } }}
                            onClick={async () => {
                                try {
                                    loading.start();
                                    const res = await AdminDAO.deleteUser(userToDelete.username);
                                    if (!res.success) throw new Error(res.error);
                                    message(`User @${userToDelete.username} berhasil dihapus`, 'success');
                                    closeDeleteDialog();
                                    fetchUsers();
                                } catch (e) {
                                    message(e.message || 'Gagal menghapus user', 'error');
                                } finally { loading.stop(); }
                            }}>
                            Hapus User
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}