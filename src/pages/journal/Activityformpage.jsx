import { Icon } from '@iconify/react';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import JournalDAO from '../../daos/JournalDao';
import GroupDAO from '../../daos/GroupDao';

const FIELD_TYPES = ['text', 'number', 'date'];

function FieldRow({ field, index, onChange, onRemove }) {
    return (
        <Box sx={{
            p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0',
            bgcolor: '#FAFAFA', mb: 1.5,
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Field #{index + 1}
                </Typography>
                <Box onClick={() => onRemove(index)} sx={{
                    width: 28, height: 28, borderRadius: 2, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#CBD5E1',
                    '&:hover': { bgcolor: '#FEF2F2', color: '#EF4444' },
                }}>
                    <Icon icon="mdi:close" width={16} />
                </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                    label="Key" size="small" fullWidth
                    placeholder="e.g. book, chapter"
                    value={field.key}
                    onChange={(e) => onChange(index, 'key', e.target.value)}
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#fff', fontSize: 13 } }}
                />
                <TextField
                    label="Label" size="small" fullWidth
                    placeholder="Display name"
                    value={field.label || ''}
                    onChange={(e) => onChange(index, 'label', e.target.value)}
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#fff', fontSize: 13 } }}
                />
                <TextField
                    select label="Type" size="small" sx={{ minWidth: 100 }}
                    value={field.type || 'text'}
                    onChange={(e) => onChange(index, 'type', e.target.value)}
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#fff', fontSize: 13 } }}
                >
                    {FIELD_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                </TextField>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Switch
                        size="small"
                        checked={!!field.required}
                        onChange={(e) => onChange(index, 'required', e.target.checked)}
                    />
                    <Typography sx={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>Required</Typography>
                </Stack>
            </Stack>
        </Box>
    );
}

export default function ActivityFormPage() {
    const { activityId } = useParams(); // undefined = create mode
    const isEdit = !!activityId;
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();
    const { user } = useUser();

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Redirect if not admin
    useEffect(() => {
        if (user && !isAdmin) {
            message('Access denied', 'error');
            navigate('/journal', { replace: true });
        }
    }, [user]);

    const [allGroups, setAllGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingActivity, setLoadingActivity] = useState(false);

    const [form, setForm] = useState({
        name: '',
        points: 0,
        groups: [],
        fields: [],
        is_active: true,
    });

    // Load groups
    useEffect(() => {
        const loadGroups = async () => {
            try {
                setLoadingGroups(true);
                const res = await GroupDAO.listGroups();
                const raw = res?.groups ?? res?.data?.groups ?? res?.data ?? [];
                const normalized = (Array.isArray(raw) ? raw : [])
                    .map((g) => typeof g === 'string' ? { id: g, name: g } : { id: g.id || g.code, name: g.name || g.id })
                    .filter((g) => g.id);
                setAllGroups(normalized);
            } catch (e) {
                message('Gagal memuat groups', 'warning');
            } finally {
                setLoadingGroups(false);
            }
        };
        loadGroups();
    }, []);

    // Load activity if edit mode
    useEffect(() => {
        if (!isEdit) return;
        const loadActivity = async () => {
            try {
                setLoadingActivity(true);
                const res = await JournalDAO.listActivities();
                if (res.success) {
                    const found = (res.data || []).find((a) => a.id === activityId);
                    if (found) {
                        setForm({
                            name: found.name || '',
                            points: found.points ?? 0,
                            groups: found.groups || [],
                            fields: found.fields || [],
                            is_active: found.is_active ?? true,
                        });
                    } else {
                        message('Activity tidak ditemukan', 'error');
                        navigate('/journal');
                    }
                }
            } catch (e) {
                message('Gagal memuat activity', 'error');
            } finally {
                setLoadingActivity(false);
            }
        };
        loadActivity();
    }, [activityId]);

    const toggleGroup = (id) => {
        setForm((prev) => ({
            ...prev,
            groups: prev.groups.includes(id)
                ? prev.groups.filter((g) => g !== id)
                : [...prev.groups, id],
        }));
    };

    const addField = () => {
        setForm((prev) => ({
            ...prev,
            fields: [...prev.fields, { key: '', label: '', type: 'text', required: false }],
        }));
    };

    const updateField = (index, key, value) => {
        setForm((prev) => {
            const fields = [...prev.fields];
            fields[index] = { ...fields[index], [key]: value };
            return { ...prev, fields };
        });
    };

    const removeField = (index) => {
        setForm((prev) => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) { message('Nama wajib diisi', 'error'); return; }
        if (form.points < 0) { message('Points tidak boleh negatif', 'error'); return; }
        if (form.groups.length === 0) { message('Pilih minimal 1 group', 'error'); return; }
        for (const f of form.fields) {
            if (!f.key.trim()) { message('Key field tidak boleh kosong', 'error'); return; }
        }

        const body = {
            name: form.name.trim(),
            points: Number(form.points),
            groups: form.groups,
            fields: form.fields,
            is_active: form.is_active,
        };

        try {
            loading.start();
            let res;
            if (isEdit) {
                res = await JournalDAO.updateActivity(activityId, body);
            } else {
                res = await JournalDAO.createActivity(body);
            }
            if (!res.success) throw new Error(res.error || 'Gagal menyimpan activity');
            message(isEdit ? 'Activity berhasil diperbarui' : 'Activity berhasil dibuat', 'success');
            navigate('/journal');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            loading.stop();
        }
    };

    if (loadingActivity) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress sx={{ color: '#1E3A8A' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 0 }, pb: 10 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1} mb={3} mt={{ xs: 2, sm: 0 }}>
                <Box onClick={() => navigate('/journal')}
                    sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#F1F5F9' } }}>
                    <Icon icon="mdi:arrow-left" width={20} color="#64748B" />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0F172A', lineHeight: 1 }}>
                        {isEdit ? 'Edit Activity' : 'Buat Activity'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#94A3B8', mt: 0.25 }}>
                        {isEdit ? 'Update informasi activity' : 'Tambah activity baru untuk jurnal'}
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={3}>
                {/* Basic Info */}
                <Box>
                    <SectionLabel>Informasi Dasar</SectionLabel>
                    <Stack spacing={2}>
                        <LabeledField label="Nama Activity" required>
                            <TextField
                                fullWidth size="small"
                                placeholder="e.g. Baca Alkitab, Doa Pagi"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                InputProps={{ sx: { borderRadius: 2.5, bgcolor: '#fff', fontSize: 14 } }}
                            />
                        </LabeledField>

                        <LabeledField label="Points" required hint="Berapa poin yang didapat per entry">
                            <TextField
                                size="small" type="number"
                                inputProps={{ min: 0 }}
                                value={form.points}
                                onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                            <Icon icon="mdi:star" color="#F59E0B" width={18} />
                                        </Box>
                                    ),
                                    sx: { borderRadius: 2.5, bgcolor: '#fff', fontSize: 14, width: 160 },
                                }}
                            />
                        </LabeledField>

                        <LabeledField label="Status">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Switch
                                    checked={form.is_active}
                                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                                    sx={{ '& .MuiSwitch-thumb': { bgcolor: form.is_active ? '#1E3A8A' : undefined } }}
                                />
                                <Typography sx={{ fontSize: 14, color: form.is_active ? '#15803D' : '#DC2626', fontWeight: 600 }}>
                                    {form.is_active ? 'Active' : 'Inactive'}
                                </Typography>
                            </Stack>
                        </LabeledField>
                    </Stack>
                </Box>

                {/* Groups */}
                <Box>
                    <SectionLabel>Groups <span style={{ color: '#EF4444' }}>*</span></SectionLabel>
                    {loadingGroups ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CircularProgress size={14} />
                            <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>Memuat groups...</Typography>
                        </Stack>
                    ) : allGroups.length === 0 ? (
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <Typography sx={{ fontSize: 13, color: '#92400E' }}>
                                Belum ada group. Buat group dulu dari menu Groups.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {allGroups.map((g) => {
                                const active = form.groups.includes(g.id);
                                return (
                                    <Chip
                                        key={g.id}
                                        label={g.name}
                                        onClick={() => toggleGroup(g.id)}
                                        icon={<Icon icon={active ? 'mdi:check-circle' : 'mdi:circle-outline'} width={15} />}
                                        sx={{
                                            fontWeight: 600, fontSize: 13,
                                            border: '2px solid',
                                            borderColor: active ? '#1E3A8A' : '#E2E8F0',
                                            bgcolor: active ? '#1E3A8A' : '#fff',
                                            color: active ? '#fff' : '#64748B',
                                            cursor: 'pointer',
                                            '& .MuiChip-icon': { color: active ? '#fff' : '#94A3B8' },
                                            '&:hover': { opacity: 0.85 },
                                        }}
                                    />
                                );
                            })}
                        </Stack>
                    )}
                </Box>

                {/* Custom Fields */}
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box>
                            <SectionLabel noMargin>Custom Fields</SectionLabel>
                            <Typography sx={{ fontSize: 12, color: '#94A3B8', mt: 0.25 }}>
                                Data tambahan yang harus diisi user saat submit
                            </Typography>
                        </Box>
                        <Box onClick={addField} sx={{
                            px: 2, py: 0.75, borderRadius: 2.5, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            bgcolor: '#F1F5F9', color: '#334155', fontWeight: 600, fontSize: 13,
                            '&:hover': { bgcolor: '#E2E8F0' },
                        }}>
                            <Icon icon="mdi:plus" width={16} />
                            Tambah Field
                        </Box>
                    </Stack>

                    {form.fields.length === 0 ? (
                        <Box sx={{ py: 3, textAlign: 'center', borderRadius: 3, border: '1px dashed #E2E8F0' }}>
                            <Icon icon="mdi:form-textbox" width={36} color="#CBD5E1" />
                            <Typography sx={{ fontSize: 13, color: '#94A3B8', mt: 1 }}>
                                Tidak ada custom fields — user hanya perlu klik submit
                            </Typography>
                        </Box>
                    ) : (
                        form.fields.map((f, i) => (
                            <FieldRow key={i} field={f} index={i} onChange={updateField} onRemove={removeField} />
                        ))
                    )}
                </Box>

                {/* Submit */}
                <Box
                    onClick={handleSubmit}
                    sx={{
                        py: 1.75, borderRadius: 3, bgcolor: '#1E3A8A', color: '#fff',
                        textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        '&:hover': { bgcolor: '#1e40af' },
                    }}
                >
                    <Icon icon={isEdit ? 'mdi:content-save-outline' : 'mdi:lightning-bolt'} width={20} />
                    {isEdit ? 'Simpan Perubahan' : 'Buat Activity'}
                </Box>
            </Stack>
        </Box>
    );
}

function SectionLabel({ children, noMargin }) {
    return (
        <Typography sx={{
            fontSize: 12, fontWeight: 700, color: '#64748B',
            textTransform: 'uppercase', letterSpacing: 1,
            mb: noMargin ? 0 : 1.5,
        }}>
            {children}
        </Typography>
    );
}

function LabeledField({ label, required, hint, children }) {
    return (
        <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.75 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </Typography>
            {hint && <Typography sx={{ fontSize: 11, color: '#94A3B8', mb: 0.75 }}>{hint}</Typography>}
            {children}
        </Box>
    );
}