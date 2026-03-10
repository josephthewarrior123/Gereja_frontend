// src/pages/Journal/ActivityFormPage.jsx
import { Icon } from '@iconify/react';
import {
    Box, CircularProgress, MenuItem,
    Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import JournalDAO from '../../daos/JournalDao';
import AdminDAO from '../../daos/AdminDao';
import GroupDAO from '../../daos/GroupDao';

// ─── tokens ───────────────────────────────────────────────────────────────────
const ACCENT      = '#6366f1';
const ACCENT_DARK = '#4f46e5';
const FIELD_TYPES = ['text', 'number', 'date'];

const GROUP_COLORS = ['#6366f1','#0ea5e9','#f97316','#10b981','#ec4899','#8b5cf6','#14b8a6','#f59e0b'];
const groupColor = (name = '') => GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length];

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children, noMargin }) {
    return (
        <Typography sx={{
            fontSize: 10, fontWeight: 700, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            mb: noMargin ? 0 : 1.5, fontFamily: '"DM Sans", sans-serif',
        }}>
            {children}
        </Typography>
    );
}

// ─── Labeled Field ────────────────────────────────────────────────────────────
function LabeledField({ label, required, hint, children }) {
    return (
        <Box>
            <Typography sx={{
                fontSize: 11, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.09em', mb: 0.75,
                fontFamily: '"DM Sans", sans-serif',
            }}>
                {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
            </Typography>
            {hint && (
                <Typography sx={{ fontSize: 11, color: '#94a3b8', mb: 0.75, fontFamily: '"DM Sans", sans-serif' }}>
                    {hint}
                </Typography>
            )}
            {children}
        </Box>
    );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({ field, index, onChange, onRemove }) {
    return (
        <Box sx={{
            p: 2, borderRadius: '14px',
            border: '1px solid #f1f5f9',
            bgcolor: '#fafafa', mb: 1.5,
            transition: 'box-shadow .15s',
            '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 22, height: 22, borderRadius: '6px',
                        bgcolor: `${ACCENT}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: ACCENT, fontFamily: '"DM Mono", monospace' }}>
                            {index + 1}
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Sans", sans-serif' }}>
                        Field #{index + 1}
                    </Typography>
                </Box>
                <Box onClick={() => onRemove(index)} sx={{
                    width: 28, height: 28, borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#cbd5e1', transition: 'all .15s',
                    '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' },
                }}>
                    <Icon icon="mdi:close" width={15}/>
                </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                    label="Key" size="small" fullWidth
                    placeholder="e.g. book, chapter"
                    value={field.key}
                    onChange={(e) => onChange(index, 'key', e.target.value)}
                    InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fff', fontSize: 13, fontFamily: '"DM Sans", sans-serif' } }}
                />
                <TextField
                    label="Label" size="small" fullWidth
                    placeholder="Display name"
                    value={field.label || ''}
                    onChange={(e) => onChange(index, 'label', e.target.value)}
                    InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fff', fontSize: 13, fontFamily: '"DM Sans", sans-serif' } }}
                />
                <TextField
                    select label="Type" size="small" sx={{ minWidth: 110 }}
                    value={field.type || 'text'}
                    onChange={(e) => onChange(index, 'type', e.target.value)}
                    InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fff', fontSize: 13, fontFamily: '"DM Sans", sans-serif' } }}
                >
                    {FIELD_TYPES.map((t) => (
                        <MenuItem key={t} value={t} sx={{ fontSize: 13, fontFamily: '"DM Sans", sans-serif' }}>{t}</MenuItem>
                    ))}
                </TextField>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Switch
                        size="small"
                        checked={!!field.required}
                        onChange={(e) => onChange(index, 'required', e.target.checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ACCENT },
                        }}
                    />
                    <Typography sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', fontFamily: '"DM Sans", sans-serif' }}>
                        Required
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ActivityFormPage() {
    const { activityId } = useParams();
    const isEdit = !!activityId;
    const navigate  = useNavigate();
    const message   = useAlert();
    const loading   = useLoading();
    const { user }  = useUser();
    const isAdmin   = user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        if (user && !isAdmin) { message('Access denied', 'error'); navigate('/journal', { replace: true }); }
    }, [user]);

    const [allGroups, setAllGroups]           = useState([]);
    const [loadingGroups, setLoadingGroups]   = useState(false);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [form, setForm] = useState({ name: '', points: 0, groups: [], fields: [], is_active: true });

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingGroups(true);
                const res = await GroupDAO.listGroups();
                const raw = res?.groups ?? res?.data?.groups ?? res?.data ?? [];
                const normalized = (Array.isArray(raw) ? raw : [])
                    .map((g) => typeof g === 'string' ? { id: g, name: g } : { id: g.id || g.code, name: g.name || g.id })
                    .filter((g) => g.id);
                const filtered = user?.role === 'super_admin'
                    ? normalized
                    : normalized.filter((g) => (user?.managedGroups || []).includes(g.id));
                setAllGroups(filtered);
            } catch { message('Gagal memuat groups', 'warning'); }
            finally { setLoadingGroups(false); }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                setLoadingActivity(true);
                const res = await AdminDAO.listAdminActivities();
                if (res.success) {
                    const found = (res.data || []).find((a) => a.id === activityId);
                    if (found) {
                        setForm({ name: found.name || '', points: found.points ?? 0, groups: found.groups || [], fields: found.fields || [], is_active: found.is_active ?? true });
                    } else { message('Activity tidak ditemukan atau tidak ada akses', 'error'); navigate('/journal'); }
                }
            } catch { message('Gagal memuat activity', 'error'); }
            finally { setLoadingActivity(false); }
        };
        load();
    }, [activityId]);

    const toggleGroup = (id) => setForm((p) => ({
        ...p, groups: p.groups.includes(id) ? p.groups.filter((g) => g !== id) : [...p.groups, id],
    }));
    const addField    = () => setForm((p) => ({ ...p, fields: [...p.fields, { key: '', label: '', type: 'text', required: false }] }));
    const updateField = (i, k, v) => setForm((p) => { const f = [...p.fields]; f[i] = { ...f[i], [k]: v }; return { ...p, fields: f }; });
    const removeField = (i) => setForm((p) => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));

    const handleSubmit = async () => {
        if (!form.name.trim())       { message('Nama wajib diisi', 'error'); return; }
        if (form.points < 0)         { message('Points tidak boleh negatif', 'error'); return; }
        if (form.groups.length === 0){ message('Pilih minimal 1 group', 'error'); return; }
        for (const f of form.fields) { if (!f.key.trim()) { message('Key field tidak boleh kosong', 'error'); return; } }

        const body = { name: form.name.trim(), points: Number(form.points), groups: form.groups, fields: form.fields, is_active: form.is_active };
        try {
            loading.start();
            const res = isEdit ? await JournalDAO.updateActivity(activityId, body) : await JournalDAO.createActivity(body);
            if (!res.success) throw new Error(res.error || 'Gagal menyimpan activity');
            message(isEdit ? 'Activity berhasil diperbarui' : 'Activity berhasil dibuat', 'success');
            navigate('/journal');
        } catch (e) { message(e.message || 'Terjadi kesalahan', 'error'); }
        finally { loading.stop(); }
    };

    if (loadingActivity) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={32} sx={{ color: ACCENT }}/>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 0 }, pb: 10 }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

            {/* ── Header ── */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={4} mt={{ xs: 2.5, sm: 0 }}>
                <Box onClick={() => navigate('/journal')} sx={{
                    width: 36, height: 36, borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '1.5px solid #f1f5f9', bgcolor: '#fff',
                    transition: 'all .15s',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#e2e8f0' },
                }}>
                    <Icon icon="mdi:arrow-left" width={18} color="#64748b"/>
                </Box>
                <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: '"DM Sans", sans-serif', mb: 0.2 }}>
                        {isEdit ? 'Edit Activity' : 'New Activity'}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0f172a', lineHeight: 1, fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.02em' }}>
                        {isEdit ? 'Edit Activity' : 'Buat Activity'}
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={2.5}>

                {/* ── Basic Info Card ── */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', p: 2.5 }}>
                    <SectionLabel>Informasi Dasar</SectionLabel>
                    <Stack spacing={2.5}>

                        <LabeledField label="Nama Activity" required>
                            <TextField
                                fullWidth size="small"
                                placeholder="e.g. Baca Alkitab, Doa Pagi"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fafafa', fontSize: 14, fontFamily: '"DM Sans", sans-serif',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT, borderWidth: '1.5px' },
                                }}}
                            />
                        </LabeledField>

                        <LabeledField label="Points" required hint="Poin yang didapat user per entry">
                            <TextField
                                size="small" type="number"
                                inputProps={{ min: 0 }}
                                value={form.points}
                                onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                            <svg width="14" height="14" viewBox="0 0 10 10">
                                                <path d="M5 1 L6.2 3.8 L9.5 4.1 L7.2 6.2 L7.9 9.5 L5 8 L2.1 9.5 L2.8 6.2 L0.5 4.1 L3.8 3.8 Z" fill="#f59e0b"/>
                                            </svg>
                                        </Box>
                                    ),
                                    sx: { borderRadius: '10px', bgcolor: '#fafafa', fontSize: 14, width: 160, fontFamily: '"DM Mono", monospace',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT, borderWidth: '1.5px' },
                                    },
                                }}
                            />
                        </LabeledField>

                        <LabeledField label="Status">
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Switch
                                    checked={form.is_active}
                                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#16a34a' },
                                    }}
                                />
                                <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                    px: 1.5, py: 0.4, borderRadius: '99px',
                                    bgcolor: form.is_active ? '#f0fdf4' : '#fef2f2',
                                    border: `1.5px solid ${form.is_active ? '#bbf7d0' : '#fecaca'}`,
                                }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: form.is_active ? '#16a34a' : '#dc2626' }}/>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: form.is_active ? '#16a34a' : '#dc2626', fontFamily: '"DM Sans", sans-serif' }}>
                                        {form.is_active ? 'Active' : 'Inactive'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </LabeledField>

                    </Stack>
                </Box>

                {/* ── Groups Card ── */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', p: 2.5 }}>
                    <SectionLabel>Groups <span style={{ color: '#ef4444' }}>*</span></SectionLabel>

                    {loadingGroups ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CircularProgress size={14} sx={{ color: ACCENT }}/>
                            <Typography sx={{ fontSize: 13, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>Memuat groups...</Typography>
                        </Stack>
                    ) : allGroups.length === 0 ? (
                        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#fffbeb', border: '1.5px solid #fde68a' }}>
                            <Typography sx={{ fontSize: 13, color: '#92400e', fontFamily: '"DM Sans", sans-serif' }}>
                                Belum ada group. Buat group dulu dari menu Groups.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {allGroups.map((g) => {
                                const active = form.groups.includes(g.id);
                                const color  = groupColor(g.name);
                                return (
                                    <Box
                                        key={g.id}
                                        onClick={() => toggleGroup(g.id)}
                                        sx={{
                                            display: 'inline-flex', alignItems: 'center', gap: 0.75,
                                            px: 1.8, py: 0.7, borderRadius: '99px', cursor: 'pointer',
                                            border: '1.5px solid',
                                            borderColor: active ? color : '#e2e8f0',
                                            bgcolor: active ? `${color}14` : '#fafafa',
                                            transition: 'all .15s',
                                            '&:hover': { borderColor: color, bgcolor: `${color}10` },
                                        }}
                                    >
                                        {active && (
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}/>
                                        )}
                                        <Typography sx={{
                                            fontSize: 13, fontWeight: active ? 700 : 500,
                                            color: active ? color : '#64748b',
                                            fontFamily: '"DM Sans", sans-serif',
                                        }}>
                                            {g.name}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Box>

                {/* ── Custom Fields Card ── */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box>
                            <SectionLabel noMargin>Custom Fields</SectionLabel>
                            <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.3, fontFamily: '"DM Sans", sans-serif' }}>
                                Data tambahan yang diisi user saat submit
                            </Typography>
                        </Box>
                        <Box onClick={addField} sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.6,
                            px: 1.8, py: 0.7, borderRadius: '99px', cursor: 'pointer',
                            border: `1.5px solid ${ACCENT}`,
                            bgcolor: `${ACCENT}10`, color: ACCENT,
                            fontWeight: 700, fontSize: 12,
                            fontFamily: '"DM Sans", sans-serif',
                            transition: 'all .15s',
                            '&:hover': { bgcolor: `${ACCENT}18` },
                        }}>
                            <Icon icon="mdi:plus" width={14}/>
                            Tambah Field
                        </Box>
                    </Stack>

                    {form.fields.length === 0 ? (
                        <Box sx={{
                            py: 4, textAlign: 'center', borderRadius: '12px',
                            border: '1.5px dashed #e2e8f0', bgcolor: '#fafafa',
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                                <svg width="40" height="36" viewBox="0 0 40 36" fill="none">
                                    <rect x="4" y="4" width="32" height="28" rx="5" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5"/>
                                    <rect x="10" y="11" width="14" height="3" rx="1.5" fill="#CBD5E1"/>
                                    <rect x="10" y="17" width="20" height="2.5" rx="1.25" fill="#E2E8F0"/>
                                    <rect x="10" y="22" width="16" height="2.5" rx="1.25" fill="#E2E8F0"/>
                                </svg>
                            </Box>
                            <Typography sx={{ fontSize: 13, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                                Tidak ada custom fields — user hanya perlu klik submit
                            </Typography>
                        </Box>
                    ) : (
                        form.fields.map((f, i) => (
                            <FieldRow key={i} field={f} index={i} onChange={updateField} onRemove={removeField}/>
                        ))
                    )}
                </Box>

                {/* ── Submit ── */}
                <Box
                    onClick={handleSubmit}
                    sx={{
                        py: 1.8, borderRadius: '14px',
                        background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                        color: '#fff', textAlign: 'center',
                        fontWeight: 700, fontSize: 15, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        fontFamily: '"DM Sans", sans-serif',
                        boxShadow: `0 4px 16px ${ACCENT}44`,
                        transition: 'all .15s',
                        '&:hover': { boxShadow: `0 6px 20px ${ACCENT}55`, transform: 'translateY(-1px)' },
                        '&:active': { transform: 'translateY(0)' },
                    }}
                >
                    <Icon icon={isEdit ? 'mdi:content-save-outline' : 'mdi:lightning-bolt'} width={20}/>
                    {isEdit ? 'Simpan Perubahan' : 'Buat Activity'}
                </Box>

            </Stack>
        </Box>
    );
}