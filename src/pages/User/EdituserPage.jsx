import { Icon } from '@iconify/react';
import {
    Box, Chip, CircularProgress, MenuItem,
    Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import AdminDAO from '../../daos/AdminDao';
import GroupDAO from '../../daos/GroupDao';

const VALID_ROLES = ['user', 'admin', 'super_admin'];
const roleLabels = { user: 'User', admin: 'Admin', super_admin: 'Super Admin' };
const roleColors = { user: '#0F766E', admin: '#1D4ED8', super_admin: '#7C3AED' };

function SectionLabel({ children }) {
    return (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
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

export default function EditUserPage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();
    const { user: currentUser } = useUser();

    const isSuperAdmin = currentUser?.role === 'super_admin';

    // Redirect kalau bukan admin/super_admin
    useEffect(() => {
        if (currentUser && currentUser.role === 'user') {
            message('Access denied', 'error');
            navigate('/dashboard', { replace: true });
        }
    }, [currentUser]);

    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [allGroups, setAllGroups] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone_number: '',
        role: 'user',
        groups: [],
        managedGroups: [],
        isActive: true,
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

                // admin biasa hanya bisa assign ke managedGroups-nya
                const filtered = isSuperAdmin
                    ? normalized
                    : normalized.filter((g) => (currentUser?.managedGroups || []).includes(g.id));

                setAllGroups(filtered);
            } catch {
                message('Gagal memuat groups', 'warning');
            } finally {
                setLoadingGroups(false);
            }
        };
        if (currentUser) loadGroups();
    }, [currentUser]);



    // Load user data
    useEffect(() => {
        const loadUser = async () => {
            try {
                setLoadingUser(true);
                const res = isSuperAdmin
                    ? await AdminDAO.listUsers()  // super_admin: semua user
                    : await AdminDAO.listUsers(); // admin: filtered by managedGroups
                if (!res.success) throw new Error(res.error);

                const found = (res.data || []).find((u) => u.username === username);
                if (!found) {
                    message('User tidak ditemukan atau tidak ada akses', 'error');
                    navigate('/users');
                    return;
                }

                setForm({
                    fullName: found.fullName || '',
                    email: found.email || '',
                    phone_number: found.phone_number || '',
                    role: found.role || 'user',
                    groups: found.groups || [],
                    managedGroups: found.managedGroups || [],
                    isActive: found.isActive !== false,
                });
            } catch (e) {
                message(e.message || 'Gagal memuat data user', 'error');
                navigate('/users');
            } finally {
                setLoadingUser(false);
            }
        };
        if (username && currentUser) loadUser();
    }, [username, currentUser]);

    const toggleGroup = (id) => {
        const field = form.role === 'user' ? 'groups' : 'managedGroups';
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].includes(id)
                ? prev[field].filter((g) => g !== id)
                : [...prev[field], id],
        }));
    };



    const handleRoleChange = (newRole) => {
        setForm((prev) => ({
            ...prev,
            role: newRole,
            // reset groups saat ganti role
            groups: newRole === 'user' ? prev.groups : [],
            managedGroups: newRole !== 'user' ? prev.managedGroups : [],
        }));
    };

    const handleSubmit = async () => {
        if (!form.fullName.trim()) { message('Nama wajib diisi', 'error'); return; }

        // admin biasa tidak bisa set super_admin
        if (!isSuperAdmin && form.role === 'super_admin') {
            message('Tidak bisa set role super_admin', 'error');
            return;
        }

        const body = {
            username,
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone_number: form.phone_number.trim(),
            role: form.role,
            groups: form.role === 'user' ? form.groups : [],
            managedGroups: form.role !== 'user' ? form.managedGroups : [],
            is_active: form.isActive,
        };

        try {
            setSubmitting(true);
            loading.start();
            const res = await AdminDAO.upsertUser(body);
            if (!res.success) throw new Error(res.error || 'Gagal menyimpan');
            message('User berhasil diupdate', 'success');
            navigate('/users');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            setSubmitting(false);
            loading.stop();
        }
    };

    const activeGroups = form.role === 'user' ? form.groups : form.managedGroups;

    if (loadingUser) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress sx={{ color: '#1E3A8A' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', px: { xs: 2, sm: 0 }, pb: 10 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1} mb={3} mt={{ xs: 2, sm: 0 }}>
                <Box onClick={() => navigate('/users')}
                    sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#F1F5F9' } }}>
                    <Icon icon="mdi:arrow-left" width={20} color="#64748B" />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0F172A', lineHeight: 1 }}>
                        Edit User
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#94A3B8', mt: 0.25 }}>
                        @{username}
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={3}>
                {/* Info Dasar */}
                <Box>
                    <SectionLabel>Informasi Dasar</SectionLabel>
                    <Stack spacing={2}>
                        <LabeledField label="Nama Lengkap" required>
                            <TextField fullWidth size="small" placeholder="Nama lengkap"
                                value={form.fullName}
                                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                                InputProps={{ sx: { borderRadius: 2.5, bgcolor: '#fff', fontSize: 14 } }}
                            />
                        </LabeledField>
                        <LabeledField label="Email">
                            <TextField fullWidth size="small" placeholder="email@example.com" type="email"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                InputProps={{ sx: { borderRadius: 2.5, bgcolor: '#fff', fontSize: 14 } }}
                            />
                        </LabeledField>
                        <LabeledField label="No. Telepon">
                            <TextField fullWidth size="small" placeholder="+62..."
                                value={form.phone_number}
                                onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                                InputProps={{ sx: { borderRadius: 2.5, bgcolor: '#fff', fontSize: 14 } }}
                            />
                        </LabeledField>
                        <LabeledField label="Status">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Switch checked={form.isActive}
                                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: form.isActive ? '#15803D' : '#DC2626' }}>
                                    {form.isActive ? 'Active' : 'Inactive'}
                                </Typography>
                            </Stack>
                        </LabeledField>
                    </Stack>
                </Box>

                {/* Role — hanya super_admin yang bisa ganti role */}
                {isSuperAdmin && (
                    <Box>
                        <SectionLabel>Role</SectionLabel>
                        <Stack direction="row" spacing={1}>
                            {VALID_ROLES.map((r) => {
                                const active = form.role === r;
                                return (
                                    <Box key={r} onClick={() => handleRoleChange(r)}
                                        sx={{
                                            px: 2, py: 1, borderRadius: 2.5, cursor: 'pointer',
                                            border: '2px solid', fontWeight: 700, fontSize: 13,
                                            borderColor: active ? roleColors[r] : '#E2E8F0',
                                            bgcolor: active ? roleColors[r] : '#fff',
                                            color: active ? '#fff' : '#64748B',
                                            transition: 'all 0.15s',
                                            '&:hover': { opacity: 0.85 },
                                        }}>
                                        {roleLabels[r]}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* Groups */}
                <Box>
                    <SectionLabel>
                        {form.role === 'user' ? 'Groups' : 'Managed Groups'}
                    </SectionLabel>
                    {loadingGroups ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CircularProgress size={14} />
                            <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>Memuat groups...</Typography>
                        </Stack>
                    ) : allGroups.length === 0 ? (
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <Typography sx={{ fontSize: 13, color: '#92400E' }}>Belum ada group tersedia.</Typography>
                        </Box>
                    ) : (
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {allGroups.map((g) => {
                                const active = activeGroups.includes(g.id);
                                return (
                                    <Chip key={g.id} label={g.name}
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



                {/* Submit */}
                <Box onClick={!submitting ? handleSubmit : undefined}
                    sx={{
                        py: 1.75, borderRadius: 3, bgcolor: '#1E3A8A', color: '#fff',
                        textAlign: 'center', fontWeight: 700, fontSize: 15,
                        cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        '&:hover': { bgcolor: submitting ? '#1E3A8A' : '#1e40af' },
                    }}>
                    {submitting ? (
                        <><CircularProgress size={18} sx={{ color: '#fff' }} /> Menyimpan...</>
                    ) : (
                        <><Icon icon="mdi:content-save-outline" width={20} /> Simpan Perubahan</>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}