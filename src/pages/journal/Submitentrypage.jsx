import { Icon } from '@iconify/react';
import {
    Box, CircularProgress,
    Stack, TextField, Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import JournalDAO from '../../daos/JournalDao';

const GROUP_COLORS = ['#6366f1','#0ea5e9','#f97316','#10b981','#ec4899','#8b5cf6','#14b8a6','#f59e0b'];
const groupColor = (name = '') => GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length];

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

// ─── Activity Dropdown ────────────────────────────────────────────────────────
function ActivityDropdown({ activities, selected, onSelect, loading }) {
    const [open, setOpen] = useState(false);
    const [panelStyle, setPanelStyle] = useState({});
    const ref = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        if (loading) return;
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const maxH = 280;

            if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
                // open downward
                setPanelStyle({
                    position: 'fixed',
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                    maxHeight: Math.min(maxH, spaceBelow - 16),
                });
            } else {
                // open upward
                setPanelStyle({
                    position: 'fixed',
                    bottom: window.innerHeight - rect.top + 8,
                    left: rect.left,
                    width: rect.width,
                    maxHeight: Math.min(maxH, spaceAbove - 16),
                });
            }
        }
        setOpen((v) => !v);
    };

    return (
        <Box ref={ref} sx={{ position: 'relative' }}>
            {/* Trigger */}
            <Box
                ref={triggerRef}
                onClick={handleOpen}
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2, py: 1.5,
                    borderRadius: '14px',
                    border: open ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                    bgcolor: '#fff',
                    cursor: loading ? 'default' : 'pointer',
                    transition: 'all .15s',
                    boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                    '&:hover': { borderColor: '#6366f1' },
                    minHeight: 52,
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={16} sx={{ color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: 14, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                            Memuat activities...
                        </Typography>
                    </Box>
                ) : selected ? (
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a', fontFamily: '"Outfit", sans-serif', mb: 0.4 }}>
                            {selected.name}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <PointsBadge points={selected.points} />
                            {(selected.groups || []).map((g) => <GroupTag key={g} name={g} />)}
                        </Stack>
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: 14, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                        Pilih aktivitas...
                    </Typography>
                )}

                <Box sx={{
                    ml: 1.5, flexShrink: 0,
                    transition: 'transform .2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: '#94a3b8',
                }}>
                    <Icon icon="mdi:chevron-down" width={20} />
                </Box>
            </Box>

            {/* Panel */}
            {open && (
                <Box sx={{
                    ...panelStyle,
                    bgcolor: '#fff', borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    zIndex: 1300,
                    overflowY: 'auto',
                }}>
                    {activities.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 13, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                Belum ada activity tersedia
                            </Typography>
                        </Box>
                    ) : activities.map((a) => {
                        const isSelected = selected?.id === a.id;
                        return (
                            <Box
                                key={a.id}
                                onClick={() => { onSelect(a); setOpen(false); }}
                                sx={{
                                    px: 2, py: 1.5,
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? '#f5f3ff' : 'transparent',
                                    borderBottom: '1px solid #f8fafc',
                                    transition: 'background .1s',
                                    '&:hover': { bgcolor: isSelected ? '#f5f3ff' : '#fafafa' },
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box flex={1} minWidth={0}>
                                        <Typography sx={{
                                            fontWeight: 700, fontSize: 14,
                                            color: isSelected ? '#6366f1' : '#0f172a',
                                            fontFamily: '"Outfit", sans-serif', mb: 0.4,
                                        }}>
                                            {a.name}
                                        </Typography>
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            <PointsBadge points={a.points} />
                                            {(a.groups || []).map((g) => <GroupTag key={g} name={g} />)}
                                        </Stack>
                                        {a.fields?.length > 0 && (
                                            <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: '"DM Sans", sans-serif' }}>
                                                {a.fields.length} field{a.fields.length > 1 ? 's' : ''} to fill
                                            </Typography>
                                        )}
                                    </Box>
                                    {isSelected && (
                                        <Box sx={{ ml: 1, color: '#6366f1', flexShrink: 0 }}>
                                            <Icon icon="mdi:check-circle" width={18} />
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SubmitEntryPage() {
    const navigate = useNavigate();
    const message = useAlert();

    const [activities, setActivities] = useState([]);
    const [fetchingActivities, setFetchingActivities] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await JournalDAO.listActivities();
                if (res.success) setActivities(res.data || []);
                else message(res.error || 'Gagal memuat activities', 'error');
            } catch (e) {
                message('Gagal memuat activities', 'error');
            } finally {
                setFetchingActivities(false);
            }
        };
        load();
    }, []);

    const handleSelectActivity = (activity) => {
        setSelectedActivity(activity);
        const init = {};
        (activity.fields || []).forEach((f) => { init[f.key] = ''; });
        setFieldValues(init);
    };

    const handleSubmit = async () => {
        if (!selectedActivity) {
            message('Pilih aktivitas terlebih dahulu', 'error');
            return;
        }
        if (selectedActivity.fields?.length > 0) {
            for (const f of selectedActivity.fields) {
                if (f.required && !fieldValues[f.key]) {
                    message(`Field "${f.key}" wajib diisi`, 'error');
                    return;
                }
            }
        }

        try {
            setSubmitting(true);
            const parsedData = { ...fieldValues };
            (selectedActivity.fields || []).forEach((f) => {
                if (f.type === 'number' && parsedData[f.key] !== '') {
                    parsedData[f.key] = Number(parsedData[f.key]);
                }
            });

            const res = await JournalDAO.submitEntry({
                activity_id: selectedActivity.id,
                data: parsedData,
            });

            if (!res.success) throw new Error(res.error || 'Gagal submit entry');
            message(`Entry berhasil! +${res.data?.points_awarded || selectedActivity.points} pts`, 'success');
            navigate('/journal');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 560, mx: 'auto', px: { xs: 2, sm: 0 }, pb: 12 }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');`}</style>

            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1} mb={3} mt={{ xs: 2, sm: 0 }}>
                <Box
                    onClick={() => navigate('/journal')}
                    sx={{
                        width: 36, height: 36, borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                        '&:hover': { bgcolor: '#f1f5f9' },
                        transition: 'background .15s',
                    }}
                >
                    <Icon icon="mdi:arrow-left" width={20} color="#64748b" />
                </Box>
                <Box>
                    <Typography sx={{
                        fontWeight: 800, fontSize: 22, color: '#0f172a', lineHeight: 1,
                        fontFamily: '"Outfit", sans-serif',
                    }}>
                        Submit Entry
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 0.25, fontFamily: '"DM Sans", sans-serif' }}>
                        Pilih aktivitas yang ingin dicatat
                    </Typography>
                </Box>
            </Stack>

            {/* Dropdown label */}
            <Typography sx={{
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                mb: 0.75, fontFamily: '"DM Sans", sans-serif',
            }}>
                Aktivitas
            </Typography>

            {/* Dropdown */}
            <ActivityDropdown
                activities={activities}
                selected={selectedActivity}
                onSelect={handleSelectActivity}
                loading={fetchingActivities}
            />

            {/* Fields — muncul setelah pilih activity */}
            {selectedActivity && (
                <Box sx={{ mt: 3 }}>
                    {selectedActivity.fields?.length > 0 ? (
                        <Stack spacing={2.5}>
                            {selectedActivity.fields.map((f) => (
                                <Box key={f.key}>
                                    <Typography sx={{
                                        fontSize: 11, fontWeight: 700, color: '#64748b',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        mb: 0.75, fontFamily: '"DM Sans", sans-serif',
                                    }}>
                                        {f.key}{f.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type={f.type === 'number' ? 'number' : 'text'}
                                        placeholder={f.label || f.key}
                                        value={fieldValues[f.key] || ''}
                                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                bgcolor: '#fff',
                                                fontSize: 14,
                                                fontFamily: '"DM Sans", sans-serif',
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#6366f1' },
                                                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                            },
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Box sx={{
                            py: 3, px: 2, borderRadius: '14px',
                            bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
                            display: 'flex', alignItems: 'center', gap: 1.5,
                        }}>
                            <Icon icon="mdi:check-circle-outline" width={22} color="#16a34a" />
                            <Typography sx={{ fontSize: 13, color: '#15803d', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                                Tidak ada field tambahan untuk diisi
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Save Button — fixed bottom */}
            <Box sx={{
                position: 'fixed',
                bottom: { xs: 72, sm: 24 },
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: 560,
                px: { xs: 2, sm: 0 },
                zIndex: 100,
            }}>
                <Box
                    onClick={!submitting ? handleSubmit : undefined}
                    sx={{
                        py: 1.75, borderRadius: '14px',
                        bgcolor: selectedActivity ? '#0f172a' : '#e2e8f0',
                        color: selectedActivity ? '#fff' : '#94a3b8',
                        textAlign: 'center', fontWeight: 700, fontSize: 15,
                        cursor: submitting || !selectedActivity ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        fontFamily: '"DM Sans", sans-serif',
                        boxShadow: selectedActivity ? '0 4px 20px rgba(15,23,42,0.25)' : 'none',
                        transition: 'all .2s',
                        '&:hover': {
                            bgcolor: submitting || !selectedActivity ? undefined : '#1e293b',
                        },
                    }}
                >
                    {submitting ? (
                        <><CircularProgress size={18} sx={{ color: '#fff' }} /> Menyimpan...</>
                    ) : (
                        <>
                            <Icon icon="mdi:content-save-outline" width={20} />
                            Simpan Entry
                            {selectedActivity && (
                                <Box sx={{
                                    ml: 0.5, px: 1.2, py: 0.15, borderRadius: '99px',
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    fontSize: 12, fontWeight: 800,
                                    fontFamily: '"DM Mono", monospace',
                                }}>
                                    +{selectedActivity.points} pts
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}