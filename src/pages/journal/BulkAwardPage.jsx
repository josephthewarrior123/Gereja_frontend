// src/pages/journal/BulkAwardPage.jsx
import { Icon } from '@iconify/react';
import {
    Box, Button, Checkbox, CircularProgress,
    TextField, Typography, InputAdornment, Collapse,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import AdminDAO from '../../daos/AdminDao';
import JournalDAO from '../../daos/JournalDao';

/* ─── palette ─── */
const C = {
    blue: '#2563EB',
    blueBg: '#EFF6FF',
    blueBorder: '#BFDBFE',
    green: '#16a34a',
    greenBg: '#f0fdf4',
    greenBorder: '#bbf7d0',
    red: '#dc2626',
    redBg: '#fef2f2',
    redBorder: '#fecaca',
    ink: '#0f172a',
    slate: '#475569',
    muted: '#94a3b8',
    border: '#e2e8f0',
    surface: '#f8fafc',
};

const Label = ({ children, required }) => (
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.slate, mb: 1, fontFamily: '"DM Sans", sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {children}{required && <span style={{ color: C.red }}> *</span>}
    </Typography>
);

const Card = ({ children, sx = {} }) => (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${C.border}`, borderRadius: '16px', p: 3, ...sx }}>
        {children}
    </Box>
);

/* ─── ResultRow ─── */
function ResultRow({ item, success }) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            py: 1.1,
            borderBottom: '1px solid #f1f5f9',
            '&:last-child': { borderBottom: 'none' },
        }}>
            <Box sx={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                bgcolor: success ? '#dcfce7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon icon={success ? 'mdi:check' : 'mdi:close'} color={success ? '#15803d' : '#b91c1c'} width={14} />
            </Box>
            <Box flex={1} minWidth={0}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3 }}>
                    {item.fullName || item.username}
                </Typography>
                <Typography noWrap sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                    @{item.username}{!success && item.reason ? ` · ${item.reason}` : ''}
                </Typography>
            </Box>
            {success && item.points_awarded !== undefined && (
                <Box sx={{ flexShrink: 0, px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: '#dcfce7' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#15803d', fontFamily: '"DM Sans", sans-serif' }}>
                        +{item.points_awarded} pts
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

/* ─── ActivityDropdown ─── */
function ActivityDropdown({ activities, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = activities.find(a => a.id === value);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <Box ref={ref} sx={{ position: 'relative' }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    border: `1.5px solid ${open ? C.blue : C.border}`,
                    borderRadius: '12px', p: '10px 14px',
                    cursor: 'pointer', bgcolor: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color .15s',
                    '&:hover': { borderColor: C.blue },
                }}
            >
                {selected ? (
                    <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: '"DM Sans", sans-serif' }}>
                            {selected.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>
                            +{selected.points} pts{(selected.groups || []).length > 0 && ` · ${selected.groups.join(', ')}`}
                        </Typography>
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>
                        Pilih activity…
                    </Typography>
                )}
                <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} color={C.muted} width={20} />
            </Box>

            <Collapse in={open}>
                <Box sx={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                    bgcolor: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,.08)', overflow: 'hidden',
                    maxHeight: 260, overflowY: 'auto',
                }}>
                    {activities.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Tidak ada activity aktif</Typography>
                        </Box>
                    ) : activities.map((a, i) => {
                        const isSelected = a.id === value;
                        return (
                            <Box
                                key={a.id}
                                onClick={() => { onChange(a.id); setOpen(false); }}
                                sx={{
                                    px: 2, py: 1.5, cursor: 'pointer',
                                    bgcolor: isSelected ? C.blueBg : '#fff',
                                    borderBottom: i < activities.length - 1 ? `1px solid ${C.surface}` : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    '&:hover': { bgcolor: C.blueBg },
                                    transition: 'background .1s',
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: '"DM Sans", sans-serif' }}>
                                        {a.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.75, mt: 0.4, flexWrap: 'wrap' }}>
                                        <Box sx={{ px: 1, py: 0.15, borderRadius: '5px', bgcolor: '#fffbeb', border: '1px solid #fde68a', fontSize: 10, color: '#d97706', fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>
                                            +{a.points} pts
                                        </Box>
                                        {(a.groups || []).map(g => (
                                            <Box key={g} sx={{ px: 1, py: 0.15, borderRadius: '5px', bgcolor: `${C.blue}12`, fontSize: 10, color: C.blue, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                                                {g}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                {isSelected && <Icon icon="mdi:check-circle" color={C.blue} width={18} />}
                            </Box>
                        );
                    })}
                </Box>
            </Collapse>
        </Box>
    );
}

/* ─── UserMultiDropdown ─── */
function UserMultiDropdown({ users, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = useMemo(() => {
        const kw = search.toLowerCase();
        return users.filter(u => !kw || u.username.toLowerCase().includes(kw) || (u.fullName || '').toLowerCase().includes(kw));
    }, [users, search]);

    const toggle = (username) => {
        onChange(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
    };

    const toggleAll = () => {
        const visible = filtered.map(u => u.username);
        const allChecked = visible.every(u => selected.includes(u));
        if (allChecked) {
            onChange(prev => prev.filter(u => !visible.includes(u)));
        } else {
            onChange(prev => [...new Set([...prev, ...visible])]);
        }
    };

    const removeOne = (username, e) => {
        e.stopPropagation();
        onChange(prev => prev.filter(u => u !== username));
    };

    const selectedUsers = users.filter(u => selected.includes(u.username));

    return (
        <Box ref={ref} sx={{ position: 'relative' }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    border: `1.5px solid ${open ? C.blue : C.border}`,
                    borderRadius: '12px', p: selected.length > 0 ? '8px 12px' : '10px 14px',
                    cursor: 'pointer', bgcolor: '#fff', minHeight: 44,
                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75,
                    transition: 'border-color .15s',
                    '&:hover': { borderColor: C.blue },
                }}
            >
                {selected.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif', flex: 1 }}>
                        Pilih user…
                    </Typography>
                ) : (
                    <>
                        {selectedUsers.slice(0, 3).map(u => (
                            <Box key={u.username} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: '6px', px: 1, py: 0.3 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.blue, fontFamily: '"DM Sans", sans-serif' }}>
                                    {u.fullName || u.username}
                                </Typography>
                                <Icon icon="mdi:close" width={13} color={C.blue} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={(e) => removeOne(u.username, e)} />
                            </Box>
                        ))}
                        {selected.length > 3 && (
                            <Box sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', px: 1, py: 0.3 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.slate, fontFamily: '"DM Sans", sans-serif' }}>
                                    +{selected.length - 3} lainnya
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
                <Box sx={{ ml: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selected.length > 0 && (
                        <Box onClick={(e) => { e.stopPropagation(); onChange([]); }} sx={{ display: 'flex', p: 0.25, borderRadius: '4px', '&:hover': { bgcolor: C.surface } }}>
                            <Icon icon="mdi:close-circle" color={C.muted} width={16} />
                        </Box>
                    )}
                    <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} color={C.muted} width={20} />
                </Box>
            </Box>

            <Collapse in={open}>
                <Box sx={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                    bgcolor: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,.08)', overflow: 'hidden',
                }}>
                    <Box sx={{ p: 1.5, borderBottom: `1px solid ${C.surface}` }}>
                        <TextField
                            fullWidth size="small"
                            placeholder="Cari nama atau username…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color={C.muted} width={16} /></InputAdornment>,
                                sx: { borderRadius: '8px', fontFamily: '"DM Sans", sans-serif', fontSize: 12, bgcolor: C.surface },
                            }}
                        />
                    </Box>

                    {filtered.length > 0 && (
                        <Box onClick={toggleAll} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: `1px solid ${C.surface}`, cursor: 'pointer', bgcolor: C.surface, '&:hover': { bgcolor: C.blueBg } }}>
                            <Checkbox
                                size="small"
                                checked={filtered.length > 0 && filtered.every(u => selected.includes(u.username))}
                                indeterminate={filtered.some(u => selected.includes(u.username)) && !filtered.every(u => selected.includes(u.username))}
                                onClick={e => e.stopPropagation()}
                                onChange={toggleAll}
                                sx={{ p: 0, color: C.muted, '&.Mui-checked': { color: C.blue }, '&.MuiCheckbox-indeterminate': { color: C.blue } }}
                            />
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.slate, fontFamily: '"DM Sans", sans-serif' }}>
                                Pilih semua ({filtered.length})
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                        {users.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Tidak ada user tersedia</Typography>
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Tidak ada hasil untuk "{search}"</Typography>
                            </Box>
                        ) : filtered.map((u, i) => {
                            const isChecked = selected.includes(u.username);
                            return (
                                <Box
                                    key={u.username}
                                    onClick={() => toggle(u.username)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        px: 2, py: 1.2, cursor: 'pointer',
                                        bgcolor: isChecked ? C.blueBg : '#fff',
                                        borderBottom: i < filtered.length - 1 ? `1px solid ${C.surface}` : 'none',
                                        '&:hover': { bgcolor: isChecked ? C.blueBg : C.surface },
                                        transition: 'background .1s',
                                    }}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={isChecked}
                                        onChange={() => toggle(u.username)}
                                        onClick={e => e.stopPropagation()}
                                        sx={{ p: 0, color: C.muted, '&.Mui-checked': { color: C.blue } }}
                                    />
                                    <Box sx={{
                                        width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                                        bgcolor: isChecked ? C.blue : C.border,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: isChecked ? '#fff' : C.slate,
                                        fontWeight: 800, fontSize: 12, fontFamily: '"DM Sans", sans-serif',
                                        transition: 'all .12s',
                                    }}>
                                        {(u.fullName || u.username)?.charAt(0)?.toUpperCase()}
                                    </Box>
                                    <Box flex={1} minWidth={0}>
                                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: '"DM Sans", sans-serif' }}>
                                            {u.fullName || u.username}
                                        </Typography>
                                        <Typography noWrap sx={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>
                                            @{u.username}{(u.groups || []).length > 0 && ` · ${u.groups.join(', ')}`}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {selected.length > 0 && (
                        <Box sx={{ px: 2, py: 1.2, borderTop: `1px solid ${C.surface}`, bgcolor: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: 12, color: C.blue, fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>
                                {selected.length} user dipilih
                            </Typography>
                            <Box
                                onClick={e => { e.stopPropagation(); setOpen(false); }}
                                sx={{ fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: '#fff', border: `1px solid ${C.border}`, '&:hover': { bgcolor: C.blueBg } }}
                            >
                                Selesai
                            </Box>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
}

/* ─── MAIN ─── */
export default function BulkAwardPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const message = useAlert();

    const [activities, setActivities] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState('');
    const [selectedUsernames, setSelectedUsernames] = useState([]);
    const [fields, setFields] = useState({});
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const allowed = ['admin', 'super_admin', 'gembala'];
        if (user && !allowed.includes(user?.role)) {
            message('Akses ditolak', 'error');
            navigate('/journal', { replace: true });
        }
    }, [user]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const actRes = await JournalDAO.listActivities();
                if (actRes.success) setActivities((actRes.data || []).filter(a => a.is_active));

                const usrRes = await AdminDAO.listUsers();
                if (usrRes.success) {
                    const list = (usrRes.data || []).filter(u => u.username !== user?.username && (u.role === 'user' || u.isActive !== false));
                    setUsers(list);
                }
            } catch {
                message('Gagal memuat data', 'error');
            } finally {
                setFetching(false);
            }
        };
        if (user) fetchAll();
    }, [user]);

    const activityObj = activities.find(a => a.id === selectedActivity) || null;

    const handleActivityChange = (actId) => {
        setSelectedActivity(actId);
        setFields({});
        setResult(null);
    };

    const handleFieldChange = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        if (!selectedActivity) { message('Pilih activity terlebih dahulu', 'error'); return; }
        if (selectedUsernames.length === 0) { message('Pilih minimal 1 user', 'error'); return; }
        if (selectedUsernames.length > 100) { message('Maksimal 100 user per batch', 'error'); return; }

        try {
            setLoading(true);
            setResult(null);
            const res = await JournalDAO.bulkAward({
                activity_id: selectedActivity,
                usernames: selectedUsernames,
                data: fields,
                note: note.trim(),
            });
            if (!res.success) throw new Error(res.error || 'Gagal bulk award');
            setResult({ awarded: res.awarded ?? [], skipped: res.skipped ?? [] });
            message(`Selesai! ${res.awarded?.length ?? 0} awarded, ${res.skipped?.length ?? 0} skipped`, 'success');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally { setLoading(false); }
    };

    const handleReset = () => {
        setResult(null);
        setSelectedUsernames([]);
        setNote('');
        setFields({});
    };

    if (fetching) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                <CircularProgress sx={{ color: C.blue }} />
            </Box>
        );
    }

    const awardedCount = result?.awarded?.length ?? 0;
    const skippedCount = result?.skipped?.length ?? 0;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 2, sm: 4 } }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* ── SUCCESS MODAL (bottom sheet) ── */}
            {result && (
                <Box sx={{
                    position: 'fixed', inset: 0, zIndex: 1300,
                    bgcolor: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                    <Box sx={{
                        width: '100%', maxWidth: 520,
                        bgcolor: '#fff', borderRadius: '28px 28px 0 0',
                        overflow: 'hidden',
                        boxShadow: '0 -20px 60px rgba(0,0,0,.18)',
                        animation: 'slideUp .3s cubic-bezier(0.32, 0.72, 0, 1)',
                        '@keyframes slideUp': { from: { transform: 'translateY(110%)' }, to: { transform: 'translateY(0)' } },
                    }}>
                        {/* ── top accent bar ── */}
                        <Box sx={{
                            height: 4, width: '100%',
                            background: awardedCount > 0
                                ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 50%, #86efac 100%)'
                                : 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)',
                        }} />

                        <Box sx={{ p: '20px 24px 28px' }}>
                            {/* top row: pill + close */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box sx={{ width: 32, height: 3, borderRadius: 4, bgcolor: '#e2e8f0' }} />
                                <Box
                                    onClick={handleReset}
                                    sx={{
                                        width: 28, height: 28, borderRadius: '50%', bgcolor: '#f1f5f9',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: 'bgcolor .15s',
                                        '&:hover': { bgcolor: '#e2e8f0' },
                                    }}
                                >
                                    <Icon icon="mdi:close" color="#64748b" width={15} />
                                </Box>
                            </Box>

                            {/* ── headline ── */}
                            <Box sx={{ mb: 3 }}>
                                <Typography sx={{
                                    fontSize: 22, fontWeight: 800, color: '#0f172a',
                                    fontFamily: '"DM Sans", sans-serif', lineHeight: 1.15, mb: 0.5,
                                }}>
                                    {awardedCount > 0 ? 'Award selesai 🎉' : 'Tidak ada yang awarded'}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: '#64748b', fontFamily: '"DM Sans", sans-serif' }}>
                                    {awardedCount} berhasil · {skippedCount} dilewati
                                </Typography>
                            </Box>

                            {/* ── stat row ── */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <Box sx={{
                                    flex: 1, borderRadius: '16px', p: '14px 16px',
                                    bgcolor: '#f0fdf4', position: 'relative', overflow: 'hidden',
                                }}>
                                    <Box sx={{
                                        position: 'absolute', right: -8, top: -8,
                                        width: 52, height: 52, borderRadius: '50%',
                                        bgcolor: '#bbf7d0', opacity: 0.6,
                                    }} />
                                    <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#15803d', fontFamily: '"DM Sans", sans-serif', lineHeight: 1 }}>
                                        {awardedCount}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#15803d', fontFamily: '"DM Sans", sans-serif', mt: 0.4, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Awarded
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    flex: 1, borderRadius: '16px', p: '14px 16px',
                                    bgcolor: skippedCount > 0 ? '#fef2f2' : '#f8fafc',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <Box sx={{
                                        position: 'absolute', right: -8, top: -8,
                                        width: 52, height: 52, borderRadius: '50%',
                                        bgcolor: skippedCount > 0 ? '#fecaca' : '#e2e8f0', opacity: 0.5,
                                    }} />
                                    <Typography sx={{ fontSize: 32, fontWeight: 900, color: skippedCount > 0 ? '#b91c1c' : '#94a3b8', fontFamily: '"DM Sans", sans-serif', lineHeight: 1 }}>
                                        {skippedCount}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: skippedCount > 0 ? '#b91c1c' : '#94a3b8', fontFamily: '"DM Sans", sans-serif', mt: 0.4, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Dilewati
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ── detail list ── */}
                            {(awardedCount > 0 || skippedCount > 0) && (
                                <Box sx={{
                                    maxHeight: 220, overflowY: 'auto',
                                    mb: 3, mx: -0.5, px: 0.5,
                                    '&::-webkit-scrollbar': { width: 4 },
                                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 4 },
                                }}>
                                    {result.awarded?.map(item => <ResultRow key={item.username} item={item} success />)}
                                    {result.skipped?.map(item => <ResultRow key={item.username} item={item} success={false} />)}
                                </Box>
                            )}

                            {/* ── actions ── */}
                            <Box
                                onClick={handleReset}
                                sx={{
                                    py: 1.4, borderRadius: '14px',
                                    bgcolor: '#0f172a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                                    cursor: 'pointer', transition: 'all .15s',
                                    '&:hover': { bgcolor: '#1e293b' },
                                }}
                            >
                                <Icon icon="mdi:refresh" color="#fff" width={16} />
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: '"DM Sans", sans-serif' }}>
                                    Award Lagi
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── FORM (always rendered) ── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* 1. Activity */}
                <Card>
                    <Label>1. Pilih Activity</Label>
                    <ActivityDropdown
                        activities={activities}
                        value={selectedActivity}
                        onChange={handleActivityChange}
                    />

                    {activityObj?.fields?.length > 0 && (
                        <Box mt={2.5}>
                            <Label>Data Tambahan</Label>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {activityObj.fields.map(f => (
                                    <Box key={f.key}>
                                        <Typography sx={{ fontSize: 12, color: C.slate, mb: 0.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                                            {f.key}{f.required && <span style={{ color: C.red }}> *</span>}
                                        </Typography>
                                        <TextField
                                            fullWidth size="small"
                                            type={f.type === 'number' ? 'number' : 'text'}
                                            placeholder={`Masukkan ${f.key}…`}
                                            value={fields[f.key] || ''}
                                            onChange={e => handleFieldChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                                            InputProps={{ sx: { borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: 13 } }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Card>

                {/* 2. User */}
                <Card>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Label>2. Pilih User</Label>
                        {selectedUsernames.length > 0 && (
                            <Box sx={{ px: 1.5, py: 0.3, borderRadius: '20px', bgcolor: C.blueBg, border: `1px solid ${C.blueBorder}` }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.blue, fontFamily: '"DM Sans", sans-serif' }}>
                                    {selectedUsernames.length} dipilih
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <UserMultiDropdown
                        users={users}
                        selected={selectedUsernames}
                        onChange={setSelectedUsernames}
                    />
                </Card>

                {/* 3. Note */}
                <Card>
                    <Label>3. Catatan (opsional)</Label>
                    <TextField
                        fullWidth size="small"
                        placeholder="e.g. Hadir ibadah minggu 14 Maret"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        InputProps={{ sx: { borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: 13 } }}
                    />
                </Card>

                {/* Submit */}
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || !selectedActivity || selectedUsernames.length === 0}
                    startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Icon icon="mdi:send-outline" width={18} />}
                    sx={{
                        borderRadius: '12px', textTransform: 'none',
                        fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: 14, py: 1.4,
                        bgcolor: C.blue, boxShadow: `0 4px 14px ${C.blue}33`,
                        '&:hover': { bgcolor: '#1D4ED8', boxShadow: `0 6px 20px ${C.blue}44`, transform: 'translateY(-1px)' },
                        '&:disabled': { bgcolor: C.border, boxShadow: 'none' },
                        transition: 'all .15s',
                    }}
                >
                    {loading ? 'Memproses…' : `Award ke ${selectedUsernames.length} User`}
                </Button>
            </Box>
        </Box>
    );
}