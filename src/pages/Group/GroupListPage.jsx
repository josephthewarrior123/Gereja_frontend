import { Icon } from '@iconify/react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import GroupDAO from '../../daos/GroupDao';
import {
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomRow,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';
import GroupFormDialog from './GroupFormDialog';
import GroupDeleteDialog from './GroupDeleteDialog';

export default function GroupListPage() {
    const { user } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [allGroups, setAllGroups] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const [summaries, setSummaries] = useState({ total: 0, active: 0, inactive: 0 });
    const [mobileSearchInput, setMobileSearchInput] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
    });

    // Dialog states
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    // ── Fetch & Filter ──────────────────────────────────────────────────────

    const applyFilters = (groups, status, options) => {
        let filtered = [...groups];

        if (status === 'active') filtered = filtered.filter((g) => g.isActive);
        else if (status === 'inactive') filtered = filtered.filter((g) => !g.isActive);

        if (options.keyword) {
            const kw = options.keyword.toLowerCase();
            filtered = filtered.filter(
                (g) => g.name.toLowerCase().includes(kw) || g.id.toLowerCase().includes(kw)
            );
        }

        if (options.sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[options.sortColumn] || '';
                const bVal = b[options.sortColumn] || '';
                return options.sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
        }

        setSummaries({
            total: groups.length,
            active: groups.filter((g) => g.isActive).length,
            inactive: groups.filter((g) => !g.isActive).length,
        });

        const start = options.page * options.limit;
        const paginated = filtered.slice(start, start + options.limit);
        setDataSource(paginated);
        setDataSourceOptions((prev) => ({ ...prev, total: filtered.length }));
    };

    const fetchGroups = async () => {
        try {
            loading.start();
            const res = await GroupDAO.listGroups();
            if (!res.success) throw new Error(res.error || 'Gagal memuat groups');
            setAllGroups(res.groups || []);
            applyFilters(res.groups || [], filterStatus, dataSourceOptions);
        } catch (e) {
            message(e.message || 'Gagal memuat groups', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => { fetchGroups(); }, []);

    useEffect(() => {
        if (allGroups.length >= 0) applyFilters(allGroups, filterStatus, dataSourceOptions);
    }, [
        allGroups, filterStatus,
        dataSourceOptions.keyword, dataSourceOptions.page,
        dataSourceOptions.limit, dataSourceOptions.sortColumn, dataSourceOptions.sortDirection,
    ]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleToggleActive = async (group) => {
        try {
            setTogglingId(group.id);
            const res = await GroupDAO.toggleGroup(group.id, !group.isActive);
            if (!res.success) throw new Error(res.error);
            message(`Group berhasil ${!group.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
            fetchGroups();
        } catch (e) {
            message(e.message || 'Gagal mengubah status group', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            loading.start();
            const res = await GroupDAO.deleteGroup(deleteTarget.id);
            if (!res.success) throw new Error(res.error);
            message('Group berhasil dihapus', 'success');
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchGroups();
        } catch (e) {
            message(e.message || 'Gagal menghapus group', 'error');
        } finally {
            loading.stop();
        }
    };

    const openEdit = (group) => { setEditTarget(group); setFormOpen(true); };
    const openCreate = () => { setEditTarget(null); setFormOpen(true); };
    const openDelete = (group) => { setDeleteTarget(group); setDeleteDialogOpen(true); };

    const formatDate = (ts) => {
        if (!ts) return '-';
        return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ── Table Columns ───────────────────────────────────────────────────────

    const columns = [
        {
            title: 'Group',
            dataIndex: 'name',
            key: 'name',
            sortable: true,
            render: (value, row) => (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{
                        width: 36, height: 36, borderRadius: 2,
                        bgcolor: row.isActive ? '#EFF6FF' : '#F1F5F9',
                        color: row.isActive ? '#1E3A8A' : '#94A3B8',
                        fontSize: 16, fontWeight: 800,
                    }}>
                        {value?.charAt(0)?.toUpperCase() || 'G'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={700} color="#1E293B">{value}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
                    </Box>
                </Stack>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            sortable: false,
            render: (value) => (
                <Chip
                    label={value ? 'Aktif' : 'Nonaktif'}
                    size="small"
                    sx={{
                        fontWeight: 700, fontSize: 11,
                        bgcolor: value ? '#DCFCE7' : '#FEF2F2',
                        color: value ? '#16A34A' : '#DC2626',
                        border: 'none',
                    }}
                />
            ),
        },
        {
            title: 'Dibuat oleh',
            dataIndex: 'createdBy',
            key: 'createdBy',
            sortable: false,
            render: (value) => (
                <Typography variant="body2" color="text.secondary">
                    {value ? `@${value}` : '-'}
                </Typography>
            ),
        },
        {
            title: 'Tanggal Dibuat',
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
                    <IconButton size="small" onClick={() => openEdit(row)} title="Edit group"
                        sx={{ borderRadius: 1.5, color: '#64748B', '&:hover': { bgcolor: '#EFF6FF', color: '#1E3A8A' } }}>
                        <Icon icon="mdi:pencil-outline" width={18} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleToggleActive(row)}
                        disabled={togglingId === row.id}
                        title={row.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        sx={{
                            borderRadius: 1.5, color: '#64748B',
                            '&:hover': {
                                bgcolor: row.isActive ? '#FEF2F2' : '#DCFCE7',
                                color: row.isActive ? '#DC2626' : '#16A34A',
                            },
                        }}>
                        <Icon icon={row.isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off-outline'}
                            width={20} color={row.isActive ? '#16A34A' : '#CBD5E1'} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDelete(row)} title="Hapus permanen"
                        sx={{ borderRadius: 1.5, color: '#64748B', '&:hover': { bgcolor: '#FEF2F2', color: '#DC2626' } }}>
                        <Icon icon="mdi:trash-can-outline" width={18} />
                    </IconButton>
                </Stack>
            ),
        },
    ];

    // ── Mobile View ─────────────────────────────────────────────────────────

    const renderMobileView = () => {
        const mobileLimit = 8;
        const startIndex = dataSourceOptions.page * mobileLimit;

        let filtered = [...allGroups];
        if (filterStatus === 'active') filtered = filtered.filter((g) => g.isActive);
        if (filterStatus === 'inactive') filtered = filtered.filter((g) => !g.isActive);
        if (dataSourceOptions.keyword) {
            const kw = dataSourceOptions.keyword.toLowerCase();
            filtered = filtered.filter((g) => g.name.toLowerCase().includes(kw));
        }
        const paginated = filtered.slice(startIndex, startIndex + mobileLimit);
        const total = filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                <Button fullWidth variant="contained"
                    startIcon={<Icon icon="mdi:plus" />}
                    onClick={openCreate}
                    sx={{ textTransform: 'none', borderRadius: '12px', mb: 2, bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#1e40af' } }}>
                    Buat Group Baru
                </Button>

                <TextField fullWidth placeholder="Cari group..."
                    value={mobileSearchInput}
                    onChange={(e) => setMobileSearchInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') setDataSourceOptions((prev) => ({ ...prev, keyword: mobileSearchInput, page: 0 }));
                    }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } },
                    }}
                    sx={{ mb: 2 }}
                />

                <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {[
                        { key: 'ALL', label: `Semua (${summaries.total})` },
                        { key: 'active', label: `Aktif (${summaries.active})` },
                        { key: 'inactive', label: `Nonaktif (${summaries.inactive})` },
                    ].map((f) => (
                        <Chip key={f.key} label={f.label} onClick={() => setFilterStatus(f.key)}
                            sx={{
                                border: '1px solid',
                                borderColor: filterStatus === f.key ? '#1E3A8A' : '#E2E8F0',
                                bgcolor: filterStatus === f.key ? '#1E3A8A' : '#fff',
                                color: filterStatus === f.key ? '#fff' : '#64748B',
                                fontWeight: 600, height: 36, borderRadius: '20px', whiteSpace: 'nowrap',
                            }}
                        />
                    ))}
                </Stack>

                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:account-group-outline" width={64} color="#CBD5E1" />
                        <Typography sx={{ mt: 2, color: '#94A3B8', fontWeight: 600 }}>Belum ada group</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginated.map((g) => (
                            <Card key={g.id} sx={{ borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                                        <Avatar sx={{
                                            width: 44, height: 44, borderRadius: 2.5,
                                            bgcolor: g.isActive ? '#EFF6FF' : '#F1F5F9',
                                            color: g.isActive ? '#1E3A8A' : '#94A3B8',
                                            fontSize: 18, fontWeight: 800,
                                        }}>
                                            {g.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="subtitle2" fontWeight={700} color="#1E293B">{g.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">ID: {g.id}</Typography>
                                        </Box>
                                        <Chip label={g.isActive ? 'Aktif' : 'Nonaktif'} size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: 11,
                                                bgcolor: g.isActive ? '#DCFCE7' : '#FEF2F2',
                                                color: g.isActive ? '#16A34A' : '#DC2626',
                                            }}
                                        />
                                    </Stack>

                                    <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

                                    <Grid container spacing={1.5} mb={1.5}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Dibuat Oleh
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="#334155" sx={{ mt: 0.25 }}>
                                                {g.createdBy ? `@${g.createdBy}` : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Tanggal
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="#334155" sx={{ mt: 0.25 }}>
                                                {formatDate(g.createdAt)}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Stack direction="row" spacing={1} justifyContent="flex-end" pt={1} sx={{ borderTop: '1px solid #F8FAFC' }}>
                                        <IconButton size="small" onClick={() => openEdit(g)}
                                            sx={{ color: '#64748B', '&:hover': { bgcolor: '#EFF6FF', color: '#1E3A8A' } }}>
                                            <Icon icon="mdi:pencil-outline" width={20} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleToggleActive(g)} disabled={togglingId === g.id}
                                            sx={{ color: '#64748B' }}>
                                            <Icon icon={g.isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off-outline'}
                                                width={22} color={g.isActive ? '#16A34A' : '#CBD5E1'} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => openDelete(g)}
                                            sx={{ color: '#64748B', '&:hover': { bgcolor: '#FEF2F2', color: '#DC2626' } }}>
                                            <Icon icon="mdi:trash-can-outline" width={20} />
                                        </IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {total > mobileLimit && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0', pb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary">
                                <b>{startIndex + 1}–{Math.min(startIndex + mobileLimit, total)}</b> dari <b>{total}</b>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Hal <b>{dataSourceOptions.page + 1}</b> / <b>{Math.ceil(total / mobileLimit)}</b>
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Button fullWidth variant="outlined"
                                disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page - 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#E2E8F0', color: '#64748B' }}>
                                Prev
                            </Button>
                            <Button fullWidth variant="outlined"
                                disabled={startIndex + mobileLimit >= total}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page + 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#1E3A8A', color: '#1E3A8A' }}>
                                Next
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        );
    };

    // ── Desktop View ─────────────────────────────────────────────────────────

    const renderDesktopView = () => (
        <CustomColumn className="gap-y-8 max-h-full">
            <CustomRow className="gap-x-3">
                <Button variant="contained"
                    startIcon={<Icon icon="mdi:plus" />}
                    onClick={openCreate}
                    sx={{ textTransform: 'none', bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#1e40af' } }}>
                    Buat Group Baru
                </Button>
            </CustomRow>

            <CustomRow className="gap-x-4">
                <CustomTextInput
                    placeholder="Cari group..."
                    searchIcon
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') setDataSourceOptions((prev) => ({ ...prev, keyword: e.target.value, page: 0 }));
                    }}
                />
            </CustomRow>

            <CustomRow className="lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start">
                {[
                    { key: 'ALL', label: 'Total Group', value: summaries.total },
                    { key: 'active', label: 'Aktif', value: summaries.active },
                    { key: 'inactive', label: 'Nonaktif', value: summaries.inactive },
                ].map((s) => (
                    <div key={s.key}
                        onClick={() => setFilterStatus(s.key)}
                        className={`cursor-pointer rounded-lg transition-all duration-200 ${filterStatus === s.key ? 'border-2 border-blue-500' : 'border border-transparent'}`}
                        style={{ width: '100%', height: '100%', display: 'flex' }}>
                        <CustomDashboardStatsCard value={s.value} label={s.label} className="w-full h-full" />
                    </div>
                ))}
            </CustomRow>

            <CustomDatatable
                dataSource={dataSource}
                columns={columns}
                page={dataSourceOptions.page}
                limit={dataSourceOptions.limit}
                totalRecords={dataSourceOptions.total}
                handlePageChange={(p) => setDataSourceOptions((prev) => ({ ...prev, page: p }))}
                handleLimitChange={(l) => setDataSourceOptions((prev) => ({ ...prev, limit: l, page: 0 }))}
                handleSort={(col) => setDataSourceOptions((prev) => ({
                    ...prev,
                    sortColumn: col,
                    sortDirection: prev.sortColumn === col ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
                }))}
                sortColumn={dataSourceOptions.sortColumn}
                sortDirection={dataSourceOptions.sortDirection}
            />
        </CustomColumn>
    );

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            <GroupFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSuccess={fetchGroups}
                editTarget={editTarget}
            />

            <GroupDeleteDialog
                open={deleteDialogOpen}
                onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
                onConfirm={handleDeleteConfirm}
                target={deleteTarget}
                isMobile={isMobile}
            />
        </>
    );
}