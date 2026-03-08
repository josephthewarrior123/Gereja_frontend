import { Icon } from '@iconify/react';
import {
    Avatar, Box, Card, CardContent, Chip, CircularProgress,
    Grid, InputAdornment, Stack, TextField, Typography,
    useMediaQuery, useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import JournalDAO from '../../daos/JournalDao';

function formatDate(ts) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PointsBadge({ points }) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.5, py: 0.3, borderRadius: 99,
            bgcolor: '#FFFBEB', border: '1px solid #FDE68A',
        }}>
            <Icon icon="mdi:star" color="#F59E0B" width={12} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>{points} pts</Typography>
        </Box>
    );
}

function EntryCard({ entry }) {
    return (
        <Card sx={{ borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none', mb: 1.5 }}>
            <CardContent sx={{ p: '14px 16px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A', mb: 0.5 }}>
                            {entry.activity_name_snapshot || 'Activity'}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <PointsBadge points={entry.points_awarded || 0} />
                            {(entry.user_groups || []).map((g) => (
                                <Chip key={g} label={g} size="small" variant="outlined"
                                    sx={{ fontSize: 10, height: 20, borderRadius: 1 }} />
                            ))}
                        </Stack>
                        {entry.data && Object.keys(entry.data).length > 0 && (
                            <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                                {Object.entries(entry.data).map(([k, v]) => (
                                    <Box key={k}>
                                        <Typography sx={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{k}</Typography>
                                        <Typography sx={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{String(v)}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                    <Typography sx={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', mt: 0.3 }}>
                        {formatDate(entry.submitted_at)}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ActivityCard({ activity, onEdit, isAdmin }) {
    return (
        <Card sx={{ borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none', mb: 1.5 }}>
            <CardContent sx={{ p: '14px 16px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, mr: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                                {activity.name}
                            </Typography>
                            <Chip
                                label={activity.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                sx={{
                                    fontSize: 10, height: 18, fontWeight: 700, borderRadius: 1,
                                    bgcolor: activity.is_active ? '#F0FDF4' : '#FEF2F2',
                                    color: activity.is_active ? '#15803D' : '#DC2626',
                                }}
                            />
                        </Stack>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <PointsBadge points={activity.points} />
                            {(activity.groups || []).map((g) => (
                                <Chip key={g} label={g} size="small" variant="outlined"
                                    sx={{ fontSize: 10, height: 20, borderRadius: 1 }} />
                            ))}
                        </Stack>
                        {activity.fields?.length > 0 && (
                            <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.75 }}>
                                Fields: {activity.fields.map((f) => f.key).join(', ')}
                            </Typography>
                        )}
                    </Box>
                    {isAdmin && (
                        <Box onClick={onEdit} sx={{
                            width: 30, height: 30, borderRadius: 2, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9', color: '#1E3A8A' },
                        }}>
                            <Icon icon="mdi:pencil-outline" width={16} />
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

function EmptyState({ label, actionLabel, onAction }) {
    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="mdi:book-open-page-variant-outline" width={56} color="#CBD5E1" />
            <Typography sx={{ mt: 1.5, color: '#94A3B8', fontWeight: 600, fontSize: 14 }}>{label}</Typography>
            {onAction && (
                <Box onClick={onAction} sx={{
                    mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1,
                    px: 3, py: 1.2, borderRadius: 99, bgcolor: '#1E3A8A', color: '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    '&:hover': { bgcolor: '#1e40af' },
                }}>
                    <Icon icon="mdi:plus" width={16} />
                    {actionLabel}
                </Box>
            )}
        </Box>
    );
}

function TabButton({ active, label, icon, onClick }) {
    return (
        <Box onClick={onClick} sx={{
            px: 2.5, py: 0.9, borderRadius: 99, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0.75,
            bgcolor: active ? '#1E3A8A' : '#fff',
            color: active ? '#fff' : '#64748B',
            border: '1px solid', borderColor: active ? '#1E3A8A' : '#E2E8F0',
            fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
            userSelect: 'none',
        }}>
            <Icon icon={icon} width={15} />
            {label}
        </Box>
    );
}

export default function JournalPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const [tab, setTab] = useState('entries'); // 'entries' | 'activities'
    const [entries, setEntries] = useState([]);
    const [activities, setActivities] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [keyword, setKeyword] = useState('');

    const load = async () => {
        try {
            setFetching(true);
            if (tab === 'entries') {
                const res = await JournalDAO.getMyEntries();
                if (res.success) setEntries(res.data || []);
                else message(res.error || 'Gagal memuat entries', 'error');
            } else {
                const res = await JournalDAO.listActivities();
                if (res.success) setActivities(res.data || []);
                else message(res.error || 'Gagal memuat activities', 'error');
            }
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { load(); }, [tab]);

    const totalPoints = entries.reduce((s, e) => s + (e.points_awarded || 0), 0);

    const filteredEntries = entries.filter((e) =>
        !keyword || (e.activity_name_snapshot || '').toLowerCase().includes(keyword.toLowerCase())
    );
    const filteredActivities = activities.filter((a) =>
        !keyword || a.name.toLowerCase().includes(keyword.toLowerCase())
    );

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>

            {/* ===== HEADER STATS ===== */}
            <Box sx={{ px: { xs: 2, sm: 0 }, pt: { xs: 2, sm: 0 }, pb: 2 }}>
                <Box sx={{
                    borderRadius: 4, p: { xs: 2.5, sm: 3 },
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <Box>
                        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, mb: 0.5 }}>
                            My Points
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.75}>
                            <Icon icon="mdi:star" color="#FCD34D" width={22} />
                            <Typography sx={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                {totalPoints}
                            </Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, mb: 0.5 }}>
                            Total Entries
                        </Typography>
                        <Typography sx={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                            {entries.length}
                        </Typography>
                    </Box>
                    {isAdmin && (
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, mb: 0.5 }}>
                                Activities
                            </Typography>
                            <Typography sx={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                {activities.length}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* ===== TABS + SEARCH + ACTION ===== */}
            <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                    {/* Tabs */}
                    <Stack direction="row" spacing={1}>
                        <TabButton
                            active={tab === 'entries'}
                            label="My Entries"
                            icon="mdi:book-open-outline"
                            onClick={() => { setTab('entries'); setKeyword(''); }}
                        />
                        {isAdmin && (
                            <TabButton
                                active={tab === 'activities'}
                                label="Activities"
                                icon="mdi:lightning-bolt-outline"
                                onClick={() => { setTab('activities'); setKeyword(''); }}
                            />
                        )}
                    </Stack>

                    {/* Search + CTA */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Icon icon="mdi:magnify" color="#94A3B8" width={18} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: '#fff', fontSize: 13 },
                            }}
                            sx={{ width: { xs: '100%', sm: 200 } }}
                        />
                        {tab === 'entries' && (
                            <Box onClick={() => navigate('/journal/submit')} sx={{
                                px: 2.5, py: 1, borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap',
                                bgcolor: '#1E3A8A', color: '#fff', fontWeight: 700, fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 0.75,
                                '&:hover': { bgcolor: '#1e40af' },
                            }}>
                                <Icon icon="mdi:plus" width={16} />
                                Submit Entry
                            </Box>
                        )}
                        {tab === 'activities' && isAdmin && (
                            <Box onClick={() => navigate('/journal/activities/create')} sx={{
                                px: 2.5, py: 1, borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap',
                                bgcolor: '#1E3A8A', color: '#fff', fontWeight: 700, fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 0.75,
                                '&:hover': { bgcolor: '#1e40af' },
                            }}>
                                <Icon icon="mdi:plus" width={16} />
                                Buat Activity
                            </Box>
                        )}
                    </Stack>
                </Stack>
            </Box>

            {/* ===== CONTENT ===== */}
            <Box sx={{ px: { xs: 2, sm: 0 }, pb: { xs: 10, sm: 4 } }}>
                {fetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#1E3A8A' }} />
                    </Box>
                ) : tab === 'entries' ? (
                    filteredEntries.length === 0 ? (
                        <EmptyState
                            label={keyword ? 'Tidak ada hasil' : 'Belum ada journal entry'}
                            actionLabel={!keyword ? 'Submit Entry' : undefined}
                            onAction={!keyword ? () => navigate('/journal/submit') : undefined}
                        />
                    ) : (
                        filteredEntries.map((e) => <EntryCard key={e.id} entry={e} />)
                    )
                ) : (
                    filteredActivities.length === 0 ? (
                        <EmptyState
                            label={keyword ? 'Tidak ada hasil' : 'Belum ada activity'}
                            actionLabel={!keyword && isAdmin ? 'Buat Activity' : undefined}
                            onAction={!keyword && isAdmin ? () => navigate('/journal/activities/create') : undefined}
                        />
                    ) : (
                        filteredActivities.map((a) => (
                            <ActivityCard
                                key={a.id}
                                activity={a}
                                isAdmin={isAdmin}
                                onEdit={() => navigate(`/journal/activities/${a.id}/edit`)}
                            />
                        ))
                    )
                )}
            </Box>
        </Box>
    );
}