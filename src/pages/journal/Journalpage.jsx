import { Icon } from '@iconify/react';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    Stack, Typography,
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

// ── Stat Card — card style like reference image, blue ──────────────────────

function StatCard({ label, value, icon }) {
    return (
        <Card sx={{
            flex: 1,
            borderRadius: 3,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            bgcolor: '#fff',
        }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography sx={{
                            fontSize: 11, fontWeight: 700, color: '#94A3B8',
                            textTransform: 'uppercase', letterSpacing: 0.8, mb: 1,
                        }}>
                            {label}
                        </Typography>
                        <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2.5,
                        bgcolor: '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Icon icon={icon} color="#2563EB" width={20} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

// ── Empty State — styled like reference image ──────────────────────────────

function EmptyState({ label, description, actionLabel, onAction }) {
    return (
        <Card sx={{
            borderRadius: 4,
            border: '1.5px dashed #E2E8F0',
            boxShadow: 'none',
            bgcolor: '#fff',
        }}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <Box sx={{
                    width: 96, height: 96, borderRadius: '50%',
                    bgcolor: '#FFF7F5', mx: 'auto', mb: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '50%',
                        bgcolor: '#DBEAFE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Icon icon="mdi:file-document-edit-outline" color="#93C5FD" width={36} />
                    </Box>
                </Box>

                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0F172A', mb: 1 }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#94A3B8', maxWidth: 320, mx: 'auto', lineHeight: 1.6, mb: 3 }}>
                    {description}
                </Typography>

                {onAction && (
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Box onClick={onAction} sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 1,
                            px: 3, py: 1.4, borderRadius: 99,
                            bgcolor: '#1E3A8A', color: '#fff',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            '&:hover': { bgcolor: '#1e40af' },
                        }}>
                            <Icon icon="mdi:plus-circle-outline" width={17} />
                            {actionLabel}
                        </Box>
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 1,
                            px: 3, py: 1.4, borderRadius: 99,
                            bgcolor: '#F1F5F9', color: '#64748B',
                            fontWeight: 600, fontSize: 13, cursor: 'default',
                        }}>
                            <Icon icon="mdi:information-outline" width={17} />
                            Learn More
                        </Box>
                    </Stack>
                )}
            </CardContent>
        </Card>
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function JournalPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const [tab, setTab] = useState('entries');
    const [entries, setEntries] = useState([]);
    const [activities, setActivities] = useState([]);
    const [fetching, setFetching] = useState(false);

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



    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>

            {/* ===== STAT CARDS ===== */}
            <Box sx={{ px: { xs: 2, sm: 0 }, pt: { xs: 2, sm: 0 }, pb: 2.5 }}>
                <Stack direction="row" spacing={2}>
                    <StatCard
                        label="My Points"
                        value={totalPoints.toLocaleString()}
                        icon="mdi:star-four-points"
                    />
                    <StatCard
                        label="Total Entries"
                        value={entries.length}
                        icon="mdi:book-edit-outline"
                    />
                </Stack>
            </Box>

            {/* ===== TABS + ACTION ===== */}
            <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1}>
                        <TabButton
                            active={tab === 'entries'}
                            label="My Entries"
                            icon="mdi:book-open-outline"
                            onClick={() => setTab('entries')}
                        />
                        {isAdmin && (
                            <TabButton
                                active={tab === 'activities'}
                                label="Activities"
                                icon="mdi:lightning-bolt-outline"
                                onClick={() => setTab('activities')}
                            />
                        )}
                    </Stack>

                    <Stack direction="row" spacing={1}>
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
                    entries.length === 0 ? (
                        <EmptyState
                            label="Your journal is waiting"
                            description="You haven't added any entries yet. Capture your first thought, activity, or milestone of the day."
                            actionLabel="Create Your First Entry"
                            onAction={() => navigate('/journal/submit')}
                        />
                    ) : (
                        entries.map((e) => <EntryCard key={e.id} entry={e} />)
                    )
                ) : (
                    activities.length === 0 ? (
                        <EmptyState
                            label="No activities yet"
                            description="Belum ada activity yang dibuat. Buat activity baru untuk mulai mencatat."
                            actionLabel={isAdmin ? 'Buat Activity' : undefined}
                            onAction={isAdmin ? () => navigate('/journal/activities/create') : undefined}
                        />
                    ) : (
                        activities.map((a) => (
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