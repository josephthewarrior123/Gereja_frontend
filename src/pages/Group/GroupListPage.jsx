// src/pages/Group/GroupListPage.jsx
import { Icon } from '@iconify/react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Fab,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import GroupDAO from '../../daos/GroupDao';
import { CustomDatatable } from '../../reusables';
import GroupFormDialog from './GroupFormDialog';
import GroupDeleteDialog from './GroupDeleteDialog';

// ─── design tokens ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active: { label: 'Aktif', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    inactive: { label: 'Nonaktif', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const STAT_ACCENT = {
    ALL: { from: '#6366f1', to: '#8b5cf6' },
    active: { from: '#16a34a', to: '#22c55e' },
    inactive: { from: '#dc2626', to: '#f97316' },
};

const GROUP_COLORS = [
    '#6366f1', '#0ea5e9', '#f97316', '#10b981',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b',
];
const groupColor = (name = '') => GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length];

// ─── SVG: empty state ─────────────────────────────────────────────────────────
function EmptyGroupIllustration() {
    return (
        <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
            <rect x="15" y="20" width="80" height="55" rx="10" fill="#F1F5F9" />
            <rect x="25" y="32" width="30" height="6" rx="3" fill="#CBD5E1" />
            <rect x="25" y="44" width="50" height="4" rx="2" fill="#E2E8F0" />
            <rect x="25" y="53" width="40" height="4" rx="2" fill="#E2E8F0" />
            <circle cx="82" cy="28" r="14" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
            <path d="M82 22 V28 H88" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ statKey, label, value, selected, onClick }) {
    const accent = STAT_ACCENT[statKey] || STAT_ACCENT.ALL;
    const isSelected = selected === statKey;
    return (
        <Box onClick={onClick} sx={{
            flex: 1, borderRadius: '16px',
            border: isSelected ? `2px solid ${accent.from}` : '2px solid #F1F5F9',
            bgcolor: '#fff', p: 2.5, cursor: 'pointer',
            transition: 'all .18s ease',
            boxShadow: isSelected ? `0 4px 20px ${accent.from}28` : '0 1px 4px rgba(0,0,0,0.04)',
            position: 'relative', overflow: 'hidden',
            '&:hover': { borderColor: accent.from, boxShadow: `0 4px 20px ${accent.from}22`, transform: 'translateY(-2px)' },
        }}>
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: isSelected ? `linear-gradient(90deg, ${accent.from}, ${accent.to})` : 'transparent',
                borderRadius: '16px 16px 0 0', transition: 'background .18s',
            }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', mb: 1.5, fontFamily: '"DM Sans", sans-serif' }}>
                {label}
            </Typography>
            <Typography sx={{
                fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
                fontFamily: '"Outfit", sans-serif',
                color: isSelected ? accent.from : '#0f172a',
                transition: 'color .18s',
            }}>
                {value}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#cbd5e1', mt: 0.5, fontFamily: '"DM Sans", sans-serif' }}>
                {statKey === 'ALL' ? 'total groups' : 'groups'}
            </Typography>
        </Box>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
    const cfg = isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.5, py: 0.4, borderRadius: '99px',
            bgcolor: cfg.bg, border: `1.5px solid ${cfg.border}`,
            color: cfg.color, fontSize: 11, fontWeight: 700,
            fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.03em',
        }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
            {cfg.label}
        </Box>
    );
}

// ─── Group Avatar ─────────────────────────────────────────────────────────────
function GroupAvatar({ name, size = 38, inactive }) {
    const color = inactive ? '#94a3b8' : groupColor(name);
    return (
        <Box sx={{
            width: size, height: size, borderRadius: '10px',
            bgcolor: inactive ? '#f1f5f9' : `${color}18`,
            border: `1.5px solid ${inactive ? '#e2e8f0' : `${color}44`}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
        }}>
            <Typography sx={{ fontSize: size * 0.38, fontWeight: 800, color: inactive ? '#94a3b8' : color, fontFamily: '"Outfit", sans-serif', lineHeight: 1 }}>
                {name?.charAt(0)?.toUpperCase() || 'G'}
            </Typography>
        </Box>
    );
}

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
        keyword: '', page: 0, limit: 10, total: 0, sortColumn: '', sortDirection: 'asc',
    });
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [actionSheetGroup, setActionSheetGroup] = useState(null);

    // ── logic (unchanged) ─────────────────────────────────────────────────────
    const applyFilters = (groups, status, options) => {
        let filtered = [...groups];
        if (status === 'active') filtered = filtered.filter((g) => g.isActive);
        else if (status === 'inactive') filtered = filtered.filter((g) => !g.isActive);
        if (options.keyword) {
            const kw = options.keyword.toLowerCase();
            filtered = filtered.filter((g) => g.name.toLowerCase().includes(kw) || g.id.toLowerCase().includes(kw));
        }
        if (options.sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[options.sortColumn] || '', bVal = b[options.sortColumn] || '';
                return options.sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
        }
        setSummaries({ total: groups.length, active: groups.filter((g) => g.isActive).length, inactive: groups.filter((g) => !g.isActive).length });
        const start = options.page * options.limit;
        setDataSource(filtered.slice(start, start + options.limit));
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
        } finally { loading.stop(); }
    };

    useEffect(() => { fetchGroups(); }, []);
    useEffect(() => {
        if (allGroups.length >= 0) applyFilters(allGroups, filterStatus, dataSourceOptions);
    }, [allGroups, filterStatus, dataSourceOptions.keyword, dataSourceOptions.page, dataSourceOptions.limit, dataSourceOptions.sortColumn, dataSourceOptions.sortDirection]);

    const handleToggleActive = async (group) => {
        try {
            setTogglingId(group.id);
            const res = await GroupDAO.toggleGroup(group.id, !group.isActive);
            if (!res.success) throw new Error(res.error);
            message(`Group berhasil ${!group.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
            fetchGroups();
        } catch (e) {
            message(e.message || 'Gagal mengubah status group', 'error');
        } finally { setTogglingId(null); }
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
        } finally { loading.stop(); }
    };

    const openEdit = (g) => { setEditTarget(g); setFormOpen(true); };
    const openCreate = () => { setEditTarget(null); setFormOpen(true); };
    const openDelete = (g) => { setDeleteTarget(g); setDeleteDialogOpen(true); };
    const formatDate = (ts) => !ts ? '-' : new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    // ── table columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Group', dataIndex: 'name', key: 'name', sortable: true,
            render: (value, row) => (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <GroupAvatar name={value} inactive={!row.isActive} />
                    <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                            {value}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                            ID: {row.id}
                        </Typography>
                    </Box>
                </Stack>
            ),
        },
        {
            title: 'Status', dataIndex: 'isActive', key: 'isActive', sortable: false,
            render: (value) => <StatusBadge isActive={value} />,
        },
        {
            title: 'Dibuat oleh', dataIndex: 'createdBy', key: 'createdBy', sortable: false,
            render: (value) => (
                <Typography sx={{ fontSize: 13, color: '#64748b', fontFamily: '"DM Sans", sans-serif' }}>
                    {value ? `@${value}` : '—'}
                </Typography>
            ),
        },
        {
            title: 'Tanggal Dibuat', dataIndex: 'createdAt', key: 'createdAt', sortable: false,
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
                    <IconButton size="small" onClick={() => openEdit(row)}
                        sx={{ borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                        <Icon icon="mdi:pencil-outline" width={17} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleToggleActive(row)} disabled={togglingId === row.id}
                        sx={{ borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: row.isActive ? '#fef2f2' : '#f0fdf4', color: row.isActive ? '#dc2626' : '#16a34a' } }}>
                        <Icon icon={row.isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off-outline'}
                            width={20} color={row.isActive ? '#16a34a' : '#cbd5e1'} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDelete(row)}
                        sx={{ borderRadius: '8px', color: '#94a3b8', '&:hover': { bgcolor: '#fef2f2', color: '#dc2626' } }}>
                        <Icon icon="mdi:trash-can-outline" width={17} />
                    </IconButton>
                </Stack>
            ),
        },
    ];

    // ── mobile ────────────────────────────────────────────────────────────────
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
            <Box sx={{ p: 2, bgcolor: '#f8fafc', minHeight: '100%', pb: 12 }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

                <TextField fullWidth placeholder="Cari group..." value={mobileSearchInput}
                    onChange={(e) => setMobileSearchInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') setDataSourceOptions((prev) => ({ ...prev, keyword: mobileSearchInput, page: 0 })); }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: '#fff', fontSize: 14, fontFamily: '"DM Sans", sans-serif', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } },
                    }}
                    sx={{ mb: 2 }}
                />

                {/* filter pills */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {[
                        { key: 'ALL', label: `Semua (${summaries.total})` },
                        { key: 'active', label: `Aktif (${summaries.active})` },
                        { key: 'inactive', label: `Nonaktif (${summaries.inactive})` },
                    ].map((f) => {
                        const acc = STAT_ACCENT[f.key];
                        return (
                            <Box key={f.key} onClick={() => setFilterStatus(f.key)} sx={{
                                flexShrink: 0, px: 2, py: 0.8, borderRadius: '99px', cursor: 'pointer',
                                fontWeight: 700, fontSize: 12, fontFamily: '"DM Sans", sans-serif',
                                border: '1.5px solid',
                                borderColor: filterStatus === f.key ? acc.from : '#e2e8f0',
                                bgcolor: filterStatus === f.key ? acc.from : '#fff',
                                color: filterStatus === f.key ? '#fff' : '#64748b',
                                transition: 'all .15s',
                            }}>
                                {f.label}
                            </Box>
                        );
                    })}
                </Box>

                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <EmptyGroupIllustration />
                        <Typography sx={{ mt: 2, color: '#94a3b8', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                            Belum ada group
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {paginated.map((g) => (
                            <Card key={g.id} sx={{ borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <CardContent sx={{ p: '18px !important' }}>
                                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <GroupAvatar name={g.name} size={44} inactive={!g.isActive} />
                                            <Box flex={1}>
                                                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                                                    {g.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                                    ID: {g.id}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <StatusBadge isActive={g.isActive} />
                                            <IconButton
                                                size="small"
                                                onClick={() => setActionSheetGroup(g)}
                                                sx={{
                                                    width: 32, height: 32, borderRadius: '8px',
                                                    color: '#64748b', '&:hover': { bgcolor: '#F1F5F9' },
                                                }}
                                            >
                                                <Icon icon="mdi:dots-vertical" width={20} />
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    <Divider sx={{ mb: 1.5, borderColor: '#f8fafc' }} />

                                    <Grid container spacing={1.5} mb={1.5}>
                                        <Grid item xs={6}>
                                            <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                                                Dibuat Oleh
                                            </Typography>
                                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', fontFamily: '"DM Sans", sans-serif' }}>
                                                {g.createdBy ? `@${g.createdBy}` : '—'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                                                Tanggal
                                            </Typography>
                                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', fontFamily: '"DM Sans", sans-serif' }}>
                                                {formatDate(g.createdAt)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {total > mobileLimit && (
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e2e8f0', pb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: 12, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                {startIndex + 1}–{Math.min(startIndex + mobileLimit, total)} dari {total}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                Hal {dataSourceOptions.page + 1} / {Math.ceil(total / mobileLimit)}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5}>
                            <Button fullWidth variant="outlined" disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page - 1 }))}
                                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, textTransform: 'none', fontFamily: '"DM Sans", sans-serif', borderColor: '#e2e8f0', color: '#64748b' }}>
                                Previous
                            </Button>
                            <Button fullWidth variant="contained" disabled={startIndex + mobileLimit >= total}
                                onClick={() => setDataSourceOptions((prev) => ({ ...prev, page: prev.page + 1 }))}
                                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, textTransform: 'none', fontFamily: '"DM Sans", sans-serif', bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
                                Next
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* FAB */}
                <Fab
                    aria-label="create"
                    sx={{
                        position: 'fixed', bottom: 80, right: 20,
                        bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' },
                        boxShadow: '0 6px 24px rgba(37,99,235,0.4)',
                        zIndex: 1200, color: '#fff', width: 56, height: 56,
                    }}
                    onClick={openCreate}
                >
                    <Icon icon="mdi:plus" width={28} />
                </Fab>

                {/* Bottom Action Sheet */}
                <Drawer
                    anchor="bottom"
                    open={Boolean(actionSheetGroup)}
                    onClose={() => setActionSheetGroup(null)}
                    PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, pb: 3, pt: 1 } }}
                >
                    <Box sx={{ width: 40, height: 4, bgcolor: '#e2e8f0', borderRadius: 2, mx: 'auto', mb: 2 }} />
                    <List sx={{ px: 1 }}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { setActionSheetGroup(null); openEdit(actionSheetGroup); }} sx={{ borderRadius: '12px', mb: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}><Icon icon="mdi:pencil-outline" width={24} color="#64748b" /></ListItemIcon>
                                <ListItemText primary="Edit Group" primaryTypographyProps={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, color: '#0f172a' }} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { setActionSheetGroup(null); handleToggleActive(actionSheetGroup); }} disabled={actionSheetGroup && togglingId === actionSheetGroup.id} sx={{ borderRadius: '12px', mb: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Icon icon={actionSheetGroup?.isActive ? 'mdi:toggle-switch-off-outline' : 'mdi:toggle-switch'} width={24} color={actionSheetGroup?.isActive ? '#cbd5e1' : '#16a34a'} />
                                </ListItemIcon>
                                <ListItemText primary={actionSheetGroup?.isActive ? 'Nonaktifkan Group' : 'Aktifkan Group'} primaryTypographyProps={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, color: '#0f172a' }} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { setActionSheetGroup(null); openDelete(actionSheetGroup); }} sx={{ borderRadius: '12px', '&:hover': { bgcolor: '#FEF2F2' } }}>
                                <ListItemIcon sx={{ minWidth: 40 }}><Icon icon="mdi:trash-can-outline" width={24} color="#EF4444" /></ListItemIcon>
                                <ListItemText primary="Delete Group" primaryTypographyProps={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, color: '#EF4444' }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Drawer>
            </Box>
        );
    };

    // ── desktop ───────────────────────────────────────────────────────────────
    const renderDesktopView = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, bgcolor: '#f8fafc', minHeight: '100%' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: '"DM Sans", sans-serif', mb: 0.3 }}>
                        Management
                    </Typography>
                    <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.02em', lineHeight: 1 }}>
                        Groups
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate}
                    sx={{
                        textTransform: 'none', borderRadius: '12px',
                        bgcolor: '#0f172a', fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                        px: 2.5, py: 1.1, fontSize: 13,
                        boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
                        '&:hover': { bgcolor: '#1e293b' },
                    }}>
                    Buat Group Baru
                </Button>
            </Box>

            {/* ── Search ── */}
            <Box sx={{ maxWidth: 380 }}>
                <TextField fullWidth placeholder="Cari nama atau ID group…"
                    onKeyPress={(e) => { if (e.key === 'Enter') setDataSourceOptions((prev) => ({ ...prev, keyword: e.target.value, page: 0 })); }}
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
            <Box sx={{ display: 'flex', gap: 2 }}>
                {[
                    { key: 'ALL', label: 'Total Group', value: summaries.total },
                    { key: 'active', label: 'Aktif', value: summaries.active },
                    { key: 'inactive', label: 'Nonaktif', value: summaries.inactive },
                ].map((s) => (
                    <StatCard
                        key={s.key}
                        statKey={s.key}
                        label={s.label}
                        value={s.value}
                        selected={filterStatus}
                        onClick={() => setFilterStatus(s.key)}
                    />
                ))}
            </Box>

            {/* ── Table ── */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <CustomDatatable
                    dataSource={dataSource} columns={columns}
                    page={dataSourceOptions.page} limit={dataSourceOptions.limit}
                    totalRecords={dataSourceOptions.total}
                    handlePageChange={(p) => setDataSourceOptions((prev) => ({ ...prev, page: p }))}
                    handleLimitChange={(l) => setDataSourceOptions((prev) => ({ ...prev, limit: l, page: 0 }))}
                    handleSort={(col) => setDataSourceOptions((prev) => ({
                        ...prev, sortColumn: col,
                        sortDirection: prev.sortColumn === col ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
                    }))}
                    sortColumn={dataSourceOptions.sortColumn}
                    sortDirection={dataSourceOptions.sortDirection}
                />
            </Box>
        </Box>
    );

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