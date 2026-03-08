import { Icon } from '@iconify/react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import GroupDAO from '../../daos/GroupDao';
import UserDAO from '../../daos/UserDAO';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';

export default function CreateAdminPage() {
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();
    const { user } = useUser();

    const [allGroups, setAllGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        username: '',
        password: '',
        email: '',
        phone_number: '',
        managedGroups: [],
    });

    useEffect(() => {
        if (user && user.role === 'user') {
            message('Access denied', 'error');
            navigate('/dashboard', { replace: true });
        }
    }, [user, message, navigate]);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                setLoadingGroups(true);
                const res = await GroupDAO.listGroups();

                // ✅ FIX: Handle struktur response { success, count, groups: [...] }
                const raw = res?.groups ?? res?.data?.groups ?? res?.data ?? [];
                const normalized = (Array.isArray(raw) ? raw : [])
                    .map((g) => {
                        if (typeof g === 'string') return { id: g, name: g };
                        const id = g.id || g.code;
                        const name = g.name || g.id;
                        if (!id) return null;
                        return { id, name };
                    })
                    .filter(Boolean);

                setAllGroups(normalized);

                if (normalized.length === 0) {
                    console.warn('Group API response kosong:', res);
                }
            } catch (error) {
                console.error('Failed to load groups:', error);
                setAllGroups([]);
                message('Gagal memuat daftar group', 'warning');
            } finally {
                setLoadingGroups(false);
            }
        };
        loadGroups();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ FIX: Toggle group langsung dari button, bukan pakai MUI Select
    const toggleGroup = (groupId) => {
        setForm((prev) => ({
            ...prev,
            managedGroups: prev.managedGroups.includes(groupId)
                ? prev.managedGroups.filter((g) => g !== groupId)
                : [...prev.managedGroups, groupId],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName.trim() || !form.username.trim() || !form.password) {
            message('Nama, username, dan password wajib diisi', 'error');
            return;
        }
        if (form.managedGroups.length === 0) {
            message('Pilih minimal 1 group untuk admin', 'error');
            return;
        }

        try {
            loading.start();
            const username = form.username.trim();

            const signupRes = await UserDAO.signUp({
                fullName: form.fullName.trim(),
                username,
                password: form.password,
                email: form.email.trim(),
                phone_number: form.phone_number.trim(),
                groups: [],
            });
            if (!signupRes.success) throw new Error(signupRes.error || 'Gagal membuat akun admin');

            const roleRes = await UserDAO.setUserRole(username, {
                role: 'admin',
                groups: [],
                managedGroups: form.managedGroups,
            });
            if (!roleRes.success) throw new Error(roleRes.error || 'Gagal assign admin ke group');

            message('Admin berhasil dibuat', 'success');
            navigate('/users');
        } catch (error) {
            message(error.message || 'Terjadi kesalahan', 'error');
        } finally {
            loading.stop();
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 600 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Create Admin
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3 }}>
                Buat admin baru dan tentukan group yang dikelola.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
                <TextField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required />
                <TextField label="Username" name="username" value={form.username} onChange={handleChange} required />
                <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
                <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
                <TextField label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleChange} />

                {/* ✅ FIX: Group picker pakai button toggle, bukan MUI Select */}
                <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                        Managed Groups <span style={{ color: '#ef4444' }}>*</span>
                    </Typography>

                    {loadingGroups ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                            <CircularProgress size={16} />
                            <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Memuat group...</Typography>
                        </Box>
                    ) : allGroups.length === 0 ? (
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                            <Typography sx={{ fontSize: 13, color: '#92400e' }}>
                                Belum ada group tersedia. Buat group dulu dari menu Groups.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {allGroups.map((g) => {
                                const active = form.managedGroups.includes(g.id);
                                return (
                                    <Chip
                                        key={g.id}
                                        label={g.name}
                                        onClick={() => toggleGroup(g.id)}
                                        icon={<Icon icon={active ? 'mdi:check-circle' : 'mdi:circle-outline'} width={16} />}
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: 13,
                                            border: '2px solid',
                                            borderColor: active ? '#1E3A8A' : '#e2e8f0',
                                            bgcolor: active ? '#1E3A8A' : '#fff',
                                            color: active ? '#fff' : '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            '& .MuiChip-icon': { color: active ? '#fff' : '#94a3b8' },
                                            '&:hover': { opacity: 0.85 },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    )}

                    {form.managedGroups.length > 0 && (
                        <Typography sx={{ fontSize: 12, color: '#64748b', mt: 1 }}>
                            Dipilih: <b>{form.managedGroups.map((id) => allGroups.find((g) => g.id === id)?.name || id).join(', ')}</b>
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="outlined" onClick={() => navigate('/users')}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loadingGroups}
                        startIcon={<Icon icon="mdi:shield-plus-outline" />}
                    >
                        Create Admin
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}