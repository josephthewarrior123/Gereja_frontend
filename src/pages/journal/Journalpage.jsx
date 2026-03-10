// src/pages/Journal/JournalPage.jsx
import { Icon } from '@iconify/react';
import {
    Box, CircularProgress,
    Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import JournalDAO from '../../daos/JournalDao';
import AdminDAO from '../../daos/AdminDao';

function formatDate(ts) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const GROUP_COLORS = ['#6366f1','#0ea5e9','#f97316','#10b981','#ec4899','#8b5cf6','#14b8a6','#f59e0b'];
const groupColor = (name = '') => GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length];

function EmptyJournalSVG() {
    return (
        <svg width="120" height="110" viewBox="0 0 120 110" fill="none">
            <rect x="20" y="15" width="70" height="85" rx="10" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5"/>
            <rect x="28" y="28" width="40" height="5" rx="2.5" fill="#CBD5E1"/>
            <rect x="28" y="39" width="55" height="4" rx="2" fill="#E2E8F0"/>
            <rect x="28" y="49" width="48" height="4" rx="2" fill="#E2E8F0"/>
            <rect x="28" y="59" width="52" height="4" rx="2" fill="#E2E8F0"/>
            <rect x="28" y="69" width="36" height="4" rx="2" fill="#E2E8F0"/>
            <rect x="76" y="62" width="8" height="22" rx="2" transform="rotate(-35 76 62)" fill="#BFDBFE"/>
            <path d="M88 52 L94 58 L76 76 L70 70 Z" fill="#3B82F6"/>
            <path d="M70 70 L68 78 L76 76 Z" fill="#1D4ED8"/>
            <rect x="90" y="48" width="8" height="6" rx="1" transform="rotate(-35 90 48)" fill="#93C5FD"/>
        </svg>
    );
}

function EmptyActivitySVG() {
    return (
        <svg width="120" height="110" viewBox="0 0 120 110" fill="none">
            <circle cx="60" cy="55" r="38" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5"/>
            <path d="M42 55 L54 67 L78 43" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="88" cy="28" r="16" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
            <path d="M88 20 V28 H96" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function PointsBadge({ points }) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.4,
            px: 1.2, py: 0.25, borderRadius: '99px',
            bgcolor: '#fffbeb', border: '1.5px solid #fde68a',
        }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M5 1 L6.2 3.8 L9.5 4.1 L7.2 6.2 L7.9 9.5 L5 8 L2.1 9.5 L2.8 6.2 L0.5 4.1 L3.8 3.8 Z" fill="#f59e0b"/>
            </svg>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#d97706', fontFamily: '"DM Mono", monospace' }}>
                {points} pts
            </Typography>
        </Box>
    );
}

function GroupTag({ name }) {
    const color = groupColor(name);
    return (
        <Box sx={{
            px: 1.2, py: 0.2, borderRadius: '6px',
            bgcolor: `${color}12`, border: `1px solid ${color}30`,
            fontSize: 10, color, fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif',
        }}>
            {name}
        </Box>
    );
}

function StatCard({ label, value, icon, accent }) {
    return (
        <Box sx={{
            flex: 1, bgcolor: '#fff', borderRadius: '16px',
            border: '1.5px solid #F1F5F9',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            p: 2.5, position: 'relative', overflow: 'hidden',
        }}>
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                borderRadius: '16px 16px 0 0',
            }}/>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography sx={{
                        fontSize: 10, fontWeight: 700, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        mb: 1.5, fontFamily: '"DM Sans", sans-serif',
                    }}>
                        {label}
                    </Typography>
                    <Typography sx={{
                        fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1,
                        letterSpacing: '-0.03em', fontFamily: '"Outfit", sans-serif',
                    }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{
                    width: 40, height: 40, borderRadius: '12px',
                    background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}28)`,
                    border: `1.5px solid ${accent.from}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Icon icon={icon} color={accent.from} width={20} />
                </Box>
            </Stack>
        </Box>
    );
}

function EntryCard({ entry }) {
    return (
        <Box sx={{
            bgcolor: '#fff', borderRadius: '14px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            p: 2,
            transition: 'box-shadow .15s, transform .15s',
            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography sx={{
                    fontWeight: 700, fontSize: 14, color: '#0f172a',
                    fontFamily: '"Outfit", sans-serif', flex: 1, mr: 2,
                }}>
                    {entry.activity_name_snapshot || 'Activity'}
                </Typography>
                <Typography sx={{
                    fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap',
                    fontFamily: '"DM Mono", monospace', flexShrink: 0,
                }}>
                    {formatDate(entry.submitted_at)}
                </Typography>
            </Stack>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mb={entry.data && Object.keys(entry.data).length > 0 ? 1.5 : 0}>
                <PointsBadge points={entry.points_awarded || 0} />
                {(entry.user_groups || []).map((g) => <GroupTag key={g} name={g} />)}
            </Stack>

            {entry.data && Object.keys(entry.data).length > 0 && (
                <Box sx={{
                    bgcolor: '#f8fafc', borderRadius: '10px',
                    border: '1px solid #f1f5f9', p: 1.5,
                }}>
                    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                        {Object.entries(entry.data).map(([k, v]) => (
                            <Box key={k}>
                                <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.3, fontFamily: '"DM Sans", sans-serif' }}>
                                    {k}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: '#334155', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                                    {String(v)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

function ActivityCard({ activity, onEdit, isAdmin }) {
    const isActive = activity.is_active;
    return (
        <Box sx={{
            bgcolor: '#fff', borderRadius: '14px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            p: 2,
            transition: 'box-shadow .15s, transform .15s',
            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1} mr={1}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                            {activity.name}
                        </Typography>
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.4,
                            px: 1.2, py: 0.2, borderRadius: '99px',
                            bgcolor: isActive ? '#f0fdf4' : '#fef2f2',
                            border: `1.5px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
                            fontSize: 10, fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                            color: isActive ? '#16a34a' : '#dc2626',
                        }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: isActive ? '#16a34a' : '#dc2626' }}/>
                            {isActive ? 'Active' : 'Inactive'}
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mb={activity.fields?.length > 0 ? 1 : 0}>
                        <PointsBadge points={activity.points} />
                        {(activity.groups || []).map((g) => <GroupTag key={g} name={g} />)}
                    </Stack>

                    {activity.fields?.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {activity.fields.map((f) => (
                                <Box key={f.key} sx={{
                                    px: 1.2, py: 0.2, borderRadius: '6px',
                                    bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                                    fontSize: 10, color: '#64748b', fontWeight: 600,
                                    fontFamily: '"DM Sans", sans-serif',
                                }}>
                                    {f.key}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>

                {isAdmin && (
                    <Box onClick={onEdit} sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#94a3b8', flexShrink: 0,
                        '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                        transition: 'all .15s',
                    }}>
                        <Icon icon="mdi:pencil-outline" width={16} />
                    </Box>
                )}
            </Stack>
        </Box>
    );
}

function EmptyState({ type, onAction, actionLabel }) {
    const isEntries = type === 'entries';
    return (
        <Box sx={{
            bgcolor: '#fff', borderRadius: '20px',
            border: '1.5px dashed #e2e8f0',
            py: 7, px: 3, textAlign: 'center',
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                {isEntries ? <EmptyJournalSVG /> : <EmptyActivitySVG />}
            </Box>
            <Typography sx={{
                fontSize: 17, fontWeight: 800, color: '#0f172a', mb: 1,
                fontFamily: '"Outfit", sans-serif',
            }}>
                {isEntries ? 'Your journal is waiting' : 'No activities yet'}
            </Typography>
            <Typography sx={{
                fontSize: 13, color: '#94a3b8', maxWidth: 300, mx: 'auto',
                lineHeight: 1.7, mb: 3, fontFamily: '"DM Sans", sans-serif',
            }}>
                {isEntries
                    ? "You haven't added any entries yet. Capture your first activity or milestone."
                    : 'Belum ada activity yang dibuat. Buat activity baru untuk mulai mencatat.'}
            </Typography>
            {onAction && (
                <Box onClick={onAction} sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                    px: 3, py: 1.3, borderRadius: '99px',
                    bgcolor: '#0f172a', color: '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    fontFamily: '"DM Sans", sans-serif',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
                    transition: 'all .15s',
                    '&:hover': { bgcolor: '#1e293b', transform: 'translateY(-1px)' },
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
            px: 2.5, py: 0.9, borderRadius: '99px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0.75,
            bgcolor: active ? '#0f172a' : '#fff',
            color: active ? '#fff' : '#64748b',
            border: '1.5px solid', borderColor: active ? '#0f172a' : '#e2e8f0',
            fontWeight: 600, fontSize: 13, transition: 'all .15s',
            userSelect: 'none', fontFamily: '"DM Sans", sans-serif',
            boxShadow: active ? '0 2px 8px rgba(15,23,42,0.18)' : 'none',
            '&:hover': { borderColor: '#0f172a', color: active ? '#fff' : '#0f172a' },
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

    const [tab, setTab] = useState('entries');
    const [entries, setEntries] = useState([]);
    const [activities, setActivities] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const load = async (reset = true) => {
        try {
            if (reset) setFetching(true);
            else setLoadingMore(true);
            if (tab === 'entries') {
                const res = await JournalDAO.getMyEntries({ limit: 20, cursor: reset ? undefined : cursor });
                if (res.success) {
                    setEntries((prev) => reset ? (res.data || []) : [...prev, ...(res.data || [])]);
                    setCursor(res.next_cursor || null);
                    setHasMore(!!res.next_cursor);
                } else { message(res.error || 'Gagal memuat entries', 'error'); }
            } else {
                const res = isAdmin ? await AdminDAO.listAdminActivities() : await JournalDAO.listActivities();
                if (res.success) setActivities(res.data || []);
                else message(res.error || 'Gagal memuat activities', 'error');
            }
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally { setFetching(false); setLoadingMore(false); }
    };

    useEffect(() => {
        setCursor(null); setHasMore(false); setEntries([]);
        load(true);
    }, [tab]);

    const totalPoints = entries.reduce((s, e) => s + (e.points_awarded || 0), 0);

    return (
        <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');`}</style>

            {/* ── Page header — desktop only ── */}
            <Box sx={{ px: { xs: 2, sm: 0 }, pt: { xs: 0, sm: 0 }, pb: 3, display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#94a3b8',
                    fontFamily: '"DM Sans", sans-serif', mb: 0.3,
                }}>
                    Activity Tracker
                </Typography>
                <Typography sx={{
                    fontSize: 26, fontWeight: 800, color: '#0f172a',
                    fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.02em', lineHeight: 1,
                }}>
                    Journal
                </Typography>
            </Box>

            {/* ── Stat cards ── */}
            <Box sx={{ px: { xs: 2, sm: 0 }, pt: { xs: 2, sm: 0 }, pb: 3 }}>
                <Stack direction="row" spacing={2}>
                    <StatCard
                        label="My Points"
                        value={totalPoints.toLocaleString()}
                        icon="mdi:star-four-points"
                        accent={{ from: '#f59e0b', to: '#f97316' }}
                    />
                    <StatCard
                        label="Total Entries"
                        value={entries.length}
                        icon="mdi:book-edit-outline"
                        accent={{ from: '#6366f1', to: '#8b5cf6' }}
                    />
                </Stack>
            </Box>

            {/* ── Tabs + action ── */}
            <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1}>
                        <TabButton active={tab === 'entries'} label="My Entries" icon="mdi:book-open-outline" onClick={() => setTab('entries')} />
                        {isAdmin && (
                            <TabButton active={tab === 'activities'} label="Activities" icon="mdi:lightning-bolt-outline" onClick={() => setTab('activities')} />
                        )}
                    </Stack>
                    {tab === 'activities' && isAdmin && (
                        <Box onClick={() => navigate('/journal/activities/create')} sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.75,
                            px: 2.5, py: 1, borderRadius: '99px', cursor: 'pointer',
                            bgcolor: '#0f172a', color: '#fff',
                            fontWeight: 700, fontSize: 13, fontFamily: '"DM Sans", sans-serif',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
                            transition: 'all .15s', whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#1e293b' },
                        }}>
                            <Icon icon="mdi:plus" width={16} />
                            Buat Activity
                        </Box>
                    )}
                </Stack>
            </Box>

            {/* ── Content ── */}
            <Box sx={{ px: { xs: 2, sm: 0 }, pb: { xs: 14, sm: 4 } }}>
                {fetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                    </Box>
                ) : tab === 'entries' ? (
                    entries.length === 0 ? (
                        <EmptyState type="entries" actionLabel="Create Your First Entry" onAction={() => navigate('/journal/submit')} />
                    ) : (
                        <Stack spacing={1.5}>
                            {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
                            {hasMore && (
                                <Box onClick={() => !loadingMore && load(false)} sx={{
                                    py: 1.5, borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0', bgcolor: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 1, cursor: loadingMore ? 'default' : 'pointer',
                                    color: '#64748b', fontWeight: 600, fontSize: 13,
                                    fontFamily: '"DM Sans", sans-serif',
                                    transition: 'all .15s',
                                    '&:hover': { bgcolor: loadingMore ? '#fff' : '#f8fafc', borderColor: '#cbd5e1' },
                                }}>
                                    {loadingMore
                                        ? <><CircularProgress size={14} sx={{ color: '#94a3b8' }} /> Memuat...</>
                                        : <><Icon icon="mdi:chevron-down" width={18} /> Lihat lebih banyak</>
                                    }
                                </Box>
                            )}
                        </Stack>
                    )
                ) : (
                    activities.length === 0 ? (
                        <EmptyState
                            type="activities"
                            actionLabel={isAdmin ? 'Buat Activity' : undefined}
                            onAction={isAdmin ? () => navigate('/journal/activities/create') : undefined}
                        />
                    ) : (
                        <Stack spacing={1.5}>
                            {activities.map((a) => (
                                <ActivityCard
                                    key={a.id} activity={a} isAdmin={isAdmin}
                                    onEdit={() => navigate(`/journal/activities/${a.id}/edit`)}
                                />
                            ))}
                        </Stack>
                    )
                )}
            </Box>

            {/* ── FAB ── */}
            {tab === 'entries' && (
                <Box onClick={() => navigate('/journal/submit')} sx={{
                    position: 'fixed',
                    bottom: { xs: 80, sm: 32 },
                    right: { xs: 20, sm: 32 },
                    width: 54, height: 54, borderRadius: '50%',
                    bgcolor: '#0f172a', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(15,23,42,0.3)',
                    zIndex: 1200, transition: 'all .2s',
                    '&:hover': { bgcolor: '#1e293b', transform: 'scale(1.08)', boxShadow: '0 6px 24px rgba(15,23,42,0.4)' },
                    '&:active': { transform: 'scale(0.95)' },
                }}>
                    <Icon icon="mdi:plus" width={26} />
                </Box>
            )}
        </Box>
    );
}