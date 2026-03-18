// src/pages/journal/BulkAwardPage.jsx
import { Icon } from '@iconify/react';
import {
    Box, Button, Checkbox, CircularProgress,
    TextField, Typography, InputAdornment,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import AdminDAO from '../../daos/AdminDao';
import JournalDAO from '../../daos/JournalDao';

/* ─── palette ─── */
const C = {
    blue: '#2563EB', blueBg: '#EFF6FF', blueBorder: '#BFDBFE',
    green: '#16a34a', greenBg: '#f0fdf4', greenBorder: '#bbf7d0',
    red: '#dc2626', redBg: '#fef2f2', redBorder: '#fecaca',
    ink: '#0f172a', slate: '#475569', muted: '#94a3b8',
    border: '#e2e8f0', surface: '#f8fafc',
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

/* ─── Modal (bottom sheet mobile, centered desktop) ─── */
function BottomModal({ open, onClose, title, children, wide }) {
    if (!open) return null;
    return (
        <>
            <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(2,6,23,0.5)', zIndex: 1200, backdropFilter: 'blur(4px)' }} />
            <Box sx={{
                position: 'fixed', zIndex: 1201,
                // mobile: bottom sheet
                bottom: { xs: 0, md: 'auto' },
                left: { xs: 0, md: '50%' },
                right: { xs: 0, md: 'auto' },
                top: { xs: 'auto', md: '50%' },
                transform: { xs: 'none', md: 'translate(-50%, -50%)' },
                width: { xs: '100%', md: wide ? 560 : 460 },
                maxHeight: { xs: '85vh', md: '80vh' },
                bgcolor: '#fff',
                borderRadius: { xs: '24px 24px 0 0', md: '20px' },
                boxShadow: { xs: '0 -20px 60px rgba(0,0,0,0.15)', md: '0 24px 64px rgba(0,0,0,0.18)' },
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Handle — mobile only */}
                <Box sx={{ pt: 2, pb: 0, px: 3, flexShrink: 0 }}>
                    <Box sx={{ width: 36, height: 4, bgcolor: '#E2E8F0', borderRadius: 99, mx: 'auto', mb: 2, display: { md: 'none' } }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: '"DM Sans", sans-serif' }}>{title}</Typography>
                        <Box onClick={onClose} sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: C.border } }}>
                            <Icon icon="mdi:close" color={C.muted} width={16} />
                        </Box>
                    </Box>
                </Box>
                {/* Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
                    {children}
                </Box>
            </Box>
        </>
    );
}

/* ─── ResultRow ─── */
function ResultRow({ item, success }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.1, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, bgcolor: success ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={success ? 'mdi:check' : 'mdi:close'} color={success ? '#15803d' : '#b91c1c'} width={14} />
            </Box>
            <Box flex={1} minWidth={0}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3 }}>{item.fullName || item.username}</Typography>
                <Typography noWrap sx={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>@{item.username}{!success && item.reason ? ` · ${item.reason}` : ''}</Typography>
            </Box>
            {success && item.points_awarded !== undefined && (
                <Box sx={{ flexShrink: 0, px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: '#dcfce7' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#15803d', fontFamily: '"DM Sans", sans-serif' }}>+{item.points_awarded} pts</Typography>
                </Box>
            )}
        </Box>
    );
}

/* ─── ActivityModal ─── */
function ActivityModal({ open, onClose, activities, value, onChange }) {
    return (
        <BottomModal open={open} onClose={onClose} title="Pilih Activity">
            {activities.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Tidak ada activity aktif</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activities.map((a) => {
                        const isSelected = a.id === value;
                        return (
                            <Box key={a.id} onClick={() => { onChange(a.id); onClose(); }} sx={{
                                p: 2, borderRadius: '14px', cursor: 'pointer',
                                border: `1.5px solid ${isSelected ? C.blue : C.border}`,
                                bgcolor: isSelected ? C.blueBg : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                transition: 'all .15s', '&:hover': { borderColor: C.blue, bgcolor: C.blueBg },
                            }}>
                                <Box>
                                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: '"DM Sans", sans-serif', mb: 0.5 }}>{a.name}</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                        <Box sx={{ px: 1, py: 0.15, borderRadius: '5px', bgcolor: '#fffbeb', border: '1px solid #fde68a', fontSize: 10, color: '#d97706', fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>
                                            +{a.points} pts
                                        </Box>
                                        {(a.groups || []).map(g => (
                                            <Box key={g} sx={{ px: 1, py: 0.15, borderRadius: '5px', bgcolor: `${C.blue}12`, fontSize: 10, color: C.blue, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>{g}</Box>
                                        ))}
                                    </Box>
                                </Box>
                                {isSelected && <Icon icon="mdi:check-circle" color={C.blue} width={22} />}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </BottomModal>
    );
}

/* ─── UserModal ─── */
function UserModal({ open, onClose, users, selected, onChange }) {
    const [search, setSearch] = useState('');

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
        if (allChecked) onChange(prev => prev.filter(u => !visible.includes(u)));
        else onChange(prev => [...new Set([...prev, ...visible])]);
    };

    const allChecked = filtered.length > 0 && filtered.every(u => selected.includes(u.username));
    const someChecked = filtered.some(u => selected.includes(u.username)) && !allChecked;

    return (
        <BottomModal open={open} onClose={onClose} title="Pilih User" wide>
            {/* Search */}
            <Box sx={{ mb: 2 }}>
                <TextField fullWidth size="small" placeholder="Cari nama atau username…"
                    value={search} onChange={e => setSearch(e.target.value)} autoFocus
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color={C.muted} width={16} /></InputAdornment>,
                        sx: { borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, bgcolor: C.surface },
                    }}
                />
            </Box>

            {/* Select all */}
            {filtered.length > 0 && (
                <Box onClick={toggleAll} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '10px 14px', borderRadius: '12px', bgcolor: C.surface, cursor: 'pointer', mb: 1.5, '&:hover': { bgcolor: C.blueBg }, transition: 'background .1s' }}>
                    <Checkbox size="small" checked={allChecked} indeterminate={someChecked}
                        onClick={e => e.stopPropagation()} onChange={toggleAll}
                        sx={{ p: 0, color: C.muted, '&.Mui-checked': { color: C.blue }, '&.MuiCheckbox-indeterminate': { color: C.blue } }}
                    />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.slate, fontFamily: '"DM Sans", sans-serif' }}>
                        Pilih semua ({filtered.length})
                    </Typography>
                </Box>
            )}

            {/* User list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {users.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Tidak ada user tersedia</Typography>
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Tidak ada hasil untuk "{search}"</Typography>
                    </Box>
                ) : filtered.map((u) => {
                    const isChecked = selected.includes(u.username);
                    return (
                        <Box key={u.username} onClick={() => toggle(u.username)} sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            p: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                            border: `1.5px solid ${isChecked ? C.blue : C.border}`,
                            bgcolor: isChecked ? C.blueBg : '#fff',
                            transition: 'all .12s', '&:hover': { borderColor: C.blue, bgcolor: C.blueBg },
                        }}>
                            <Checkbox size="small" checked={isChecked}
                                onChange={() => toggle(u.username)} onClick={e => e.stopPropagation()}
                                sx={{ p: 0, color: C.muted, '&.Mui-checked': { color: C.blue } }}
                            />
                            <Box sx={{ width: 34, height: 34, borderRadius: '10px', flexShrink: 0, bgcolor: isChecked ? C.blue : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isChecked ? '#fff' : C.slate, fontWeight: 800, fontSize: 13, fontFamily: '"DM Sans", sans-serif', transition: 'all .12s' }}>
                                {(u.fullName || u.username)?.charAt(0)?.toUpperCase()}
                            </Box>
                            <Box flex={1} minWidth={0}>
                                <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: '"DM Sans", sans-serif' }}>{u.fullName || u.username}</Typography>
                                <Typography noWrap sx={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>@{u.username}{(u.groups || []).length > 0 && ` · ${u.groups.join(', ')}`}</Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Done button */}
            {selected.length > 0 && (
                <Box sx={{ position: 'sticky', bottom: 0, pt: 2, pb: 1, bgcolor: '#fff' }}>
                    <Box onClick={onClose} sx={{
                        py: 1.4, borderRadius: '12px', textAlign: 'center', bgcolor: C.blue, cursor: 'pointer',
                        fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: '"DM Sans", sans-serif',
                        boxShadow: `0 2px 8px ${C.blue}44`, '&:hover': { bgcolor: '#1D4ED8' }, transition: 'all .15s',
                    }}>
                        Pilih {selected.length} User
                    </Box>
                </Box>
            )}
        </BottomModal>
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
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [userModalOpen, setUserModalOpen] = useState(false);

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
            } catch { message('Gagal memuat data', 'error'); }
            finally { setFetching(false); }
        };
        if (user) fetchAll();
    }, [user]);

    const activityObj = activities.find(a => a.id === selectedActivity) || null;
    const selectedUserObjs = users.filter(u => selectedUsernames.includes(u.username));

    const handleActivityChange = (actId) => { setSelectedActivity(actId); setFields({}); setResult(null); };
    const handleFieldChange = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        if (!selectedActivity) { message('Pilih activity terlebih dahulu', 'error'); return; }
        if (selectedUsernames.length === 0) { message('Pilih minimal 1 user', 'error'); return; }
        if (selectedUsernames.length > 100) { message('Maksimal 100 user per batch', 'error'); return; }
        try {
            setLoading(true); setResult(null);
            const res = await JournalDAO.bulkAward({ activity_id: selectedActivity, usernames: selectedUsernames, data: fields, note: note.trim() });
            if (!res.success) throw new Error(res.error || 'Gagal bulk award');
            setResult({ awarded: res.awarded ?? [], skipped: res.skipped ?? [] });
            message(`Selesai! ${res.awarded?.length ?? 0} awarded, ${res.skipped?.length ?? 0} skipped`, 'success');
        } catch (e) { message(e.message || 'Terjadi kesalahan', 'error'); }
        finally { setLoading(false); }
    };

    const handleReset = () => { setResult(null); setSelectedUsernames([]); setNote(''); setFields({}); };

    if (fetching) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <CircularProgress sx={{ color: C.blue }} />
        </Box>
    );

    const awardedCount = result?.awarded?.length ?? 0;
    const skippedCount = result?.skipped?.length ?? 0;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 2, sm: 4 } }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* ── SUCCESS MODAL ── */}
            {result && (
                <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: 520, bgcolor: '#fff', borderRadius: '28px 28px 0 0', overflow: 'hidden', boxShadow: '0 -20px 60px rgba(0,0,0,.18)' }}>
                        <Box sx={{ height: 4, width: '100%', background: awardedCount > 0 ? 'linear-gradient(90deg, #4ade80, #22c55e, #86efac)' : 'linear-gradient(90deg, #f87171, #ef4444)' }} />
                        <Box sx={{ p: '20px 24px 28px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box sx={{ width: 32, height: 3, borderRadius: 4, bgcolor: '#e2e8f0' }} />
                                <Box onClick={handleReset} sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#e2e8f0' } }}>
                                    <Icon icon="mdi:close" color="#64748b" width={15} />
                                </Box>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.15, mb: 0.5 }}>
                                    {awardedCount > 0 ? 'Award selesai 🎉' : 'Tidak ada yang awarded'}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: '#64748b', fontFamily: '"DM Sans", sans-serif' }}>
                                    {awardedCount} berhasil · {skippedCount} dilewati
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <Box sx={{ flex: 1, borderRadius: '16px', p: '14px 16px', bgcolor: '#f0fdf4', position: 'relative', overflow: 'hidden' }}>
                                    <Box sx={{ position: 'absolute', right: -8, top: -8, width: 52, height: 52, borderRadius: '50%', bgcolor: '#bbf7d0', opacity: 0.6 }} />
                                    <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#15803d', fontFamily: '"DM Sans", sans-serif', lineHeight: 1 }}>{awardedCount}</Typography>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#15803d', fontFamily: '"DM Sans", sans-serif', mt: 0.4, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Awarded</Typography>
                                </Box>
                                <Box sx={{ flex: 1, borderRadius: '16px', p: '14px 16px', bgcolor: skippedCount > 0 ? '#fef2f2' : '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                                    <Box sx={{ position: 'absolute', right: -8, top: -8, width: 52, height: 52, borderRadius: '50%', bgcolor: skippedCount > 0 ? '#fecaca' : '#e2e8f0', opacity: 0.5 }} />
                                    <Typography sx={{ fontSize: 32, fontWeight: 900, color: skippedCount > 0 ? '#b91c1c' : '#94a3b8', fontFamily: '"DM Sans", sans-serif', lineHeight: 1 }}>{skippedCount}</Typography>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: skippedCount > 0 ? '#b91c1c' : '#94a3b8', fontFamily: '"DM Sans", sans-serif', mt: 0.4, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dilewati</Typography>
                                </Box>
                            </Box>
                            {(awardedCount > 0 || skippedCount > 0) && (
                                <Box sx={{ maxHeight: 220, overflowY: 'auto', mb: 3, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 4 } }}>
                                    {result.awarded?.map(item => <ResultRow key={item.username} item={item} success />)}
                                    {result.skipped?.map(item => <ResultRow key={item.username} item={item} success={false} />)}
                                </Box>
                            )}
                            <Box onClick={handleReset} sx={{ py: 1.4, borderRadius: '14px', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, cursor: 'pointer', '&:hover': { bgcolor: '#1e293b' }, transition: 'all .15s' }}>
                                <Icon icon="mdi:refresh" color="#fff" width={16} />
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: '"DM Sans", sans-serif' }}>Award Lagi</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── FORM ── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* 1. Activity */}
                <Card>
                    <Label>1. Pilih Activity</Label>
                    {/* Trigger button */}
                    <Box onClick={() => setActivityModalOpen(true)} sx={{
                        border: `1.5px solid ${activityObj ? C.blue : C.border}`,
                        borderRadius: '12px', p: '10px 14px', cursor: 'pointer', bgcolor: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'border-color .15s', '&:hover': { borderColor: C.blue },
                    }}>
                        {activityObj ? (
                            <Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: '"DM Sans", sans-serif' }}>{activityObj.name}</Typography>
                                <Typography sx={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>
                                    +{activityObj.points} pts{(activityObj.groups || []).length > 0 && ` · ${activityObj.groups.join(', ')}`}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif' }}>Pilih activity…</Typography>
                        )}
                        <Icon icon="mdi:chevron-right" color={C.muted} width={20} />
                    </Box>

                    {/* Extra fields */}
                    {activityObj?.fields?.length > 0 && (
                        <Box mt={2.5}>
                            <Label>Data Tambahan</Label>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {activityObj.fields.map(f => (
                                    <Box key={f.key}>
                                        <Typography sx={{ fontSize: 12, color: C.slate, mb: 0.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                                            {f.key}{f.required && <span style={{ color: C.red }}> *</span>}
                                        </Typography>
                                        <TextField fullWidth size="small"
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
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.blue, fontFamily: '"DM Sans", sans-serif' }}>{selectedUsernames.length} dipilih</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Trigger button */}
                    <Box onClick={() => setUserModalOpen(true)} sx={{
                        border: `1.5px solid ${selectedUsernames.length > 0 ? C.blue : C.border}`,
                        borderRadius: '12px', p: '10px 14px', cursor: 'pointer', bgcolor: '#fff',
                        display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
                        transition: 'border-color .15s', '&:hover': { borderColor: C.blue },
                        minHeight: 46,
                    }}>
                        {selectedUsernames.length === 0 ? (
                            <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: '"DM Sans", sans-serif', flex: 1 }}>Pilih user…</Typography>
                        ) : (
                            <>
                                {selectedUserObjs.slice(0, 3).map(u => (
                                    <Box key={u.username} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: '6px', px: 1, py: 0.3 }}>
                                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.blue, fontFamily: '"DM Sans", sans-serif' }}>{u.fullName || u.username}</Typography>
                                        <Icon icon="mdi:close" width={13} color={C.blue} style={{ cursor: 'pointer' }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedUsernames(prev => prev.filter(n => n !== u.username)); }}
                                        />
                                    </Box>
                                ))}
                                {selectedUsernames.length > 3 && (
                                    <Box sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', px: 1, py: 0.3 }}>
                                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.slate, fontFamily: '"DM Sans", sans-serif' }}>+{selectedUsernames.length - 3} lainnya</Typography>
                                    </Box>
                                )}
                            </>
                        )}
                        <Box sx={{ ml: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {selectedUsernames.length > 0 && (
                                <Box onClick={(e) => { e.stopPropagation(); setSelectedUsernames([]); }} sx={{ display: 'flex', p: 0.25, borderRadius: '4px', '&:hover': { bgcolor: C.surface } }}>
                                    <Icon icon="mdi:close-circle" color={C.muted} width={16} />
                                </Box>
                            )}
                            <Icon icon="mdi:chevron-right" color={C.muted} width={20} />
                        </Box>
                    </Box>
                </Card>

                {/* 3. Note */}
                <Card>
                    <Label>3. Catatan (opsional)</Label>
                    <TextField fullWidth size="small"
                        placeholder="e.g. Hadir ibadah minggu 14 Maret"
                        value={note} onChange={e => setNote(e.target.value)}
                        InputProps={{ sx: { borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: 13 } }}
                    />
                </Card>

                {/* Submit */}
                <Button variant="contained" fullWidth size="large" onClick={handleSubmit}
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

            {/* ── Modals ── */}
            <ActivityModal
                open={activityModalOpen}
                onClose={() => setActivityModalOpen(false)}
                activities={activities}
                value={selectedActivity}
                onChange={handleActivityChange}
            />
            <UserModal
                open={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                users={users}
                selected={selectedUsernames}
                onChange={setSelectedUsernames}
            />
        </Box>
    );
}