import { Icon } from '@iconify/react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    TextField,
    Typography,
    Avatar,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import GroupDAO from '../../daos/GroupDao';
import UserDAO from '../../daos/UserDAO';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';

const ROLES = [
    {
        key: 'user',
        label: 'User',
        desc: 'Anggota biasa, bisa submit journal',
        icon: 'mdi:account-outline',
        color: '#0F766E',
        bg: '#F0FDF9',
        border: '#99F6E4',
    },
    {
        key: 'admin',
        label: 'Admin',
        desc: 'Kelola aktivitas & user di group tertentu',
        icon: 'mdi:shield-outline',
        color: '#1D4ED8',
        bg: '#EFF6FF',
        border: '#BFDBFE',
    },
    {
        key: 'super_admin',
        label: 'Super Admin',
        desc: 'Akses penuh ke semua fitur & group',
        icon: 'mdi:shield-crown-outline',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
    },
];

const STEPS = ['Info Akun', 'Role & Group', 'Konfirmasi'];

function StepIndicator({ steps, activeStep }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', mb: 4 }}>
            {/* connecting line */}
            <Box sx={{ position: 'absolute', top: 16, left: 32, right: 32, height: '1px', bgcolor: '#E2E8F0', zIndex: 0 }} />
            {steps.map((step, i) => {
                const done = i < activeStep;
                const active = i === activeStep;
                return (
                    <Box key={step} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1, bgcolor: '#fff', px: 1 }}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                            bgcolor: done || active ? '#1E3A8A' : '#F1F5F9',
                            color: done || active ? '#fff' : '#94A3B8',
                            boxShadow: active ? '0 0 0 4px rgba(30,58,138,0.15)' : 'none',
                            transition: 'all 0.2s',
                        }}>
                            {done ? <Icon icon="mdi:check" width={14} /> : i + 1}
                        </Box>
                        <Typography sx={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap',
                            color: active ? '#1E3A8A' : done ? '#64748B' : '#CBD5E1',
                        }}>
                            {step}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

export default function CreateUserPage() {
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();
    const { user } = useUser();

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [allGroups, setAllGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        username: '',
        password: '',
        email: '',
        phone_number: '',
    });

    const [selectedRole, setSelectedRole] = useState('user');
    const [selectedGroups, setSelectedGroups] = useState([]);

    // Role yang tersedia tergantung role yang login
    const availableRoles = ROLES.filter((r) => {
        if (user?.role === 'admin') return r.key === 'user';
        return true;
    });

    // Guard
    useEffect(() => {
        if (user && user.role === 'user') {
            message('Access denied', 'error');
            navigate('/dashboard', { replace: true });
        }
    }, [user]);

    // Fetch groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoadingGroups(true);
                const res = await GroupDAO.listGroups();
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
            } catch (e) {
                console.error('Gagal load groups:', e);
                setAllGroups([]);
                message('Gagal memuat daftar group', 'warning');
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchGroups();
    }, []);

    // Auto-select semua group untuk super_admin
    useEffect(() => {
        if (selectedRole === 'super_admin') {
            setSelectedGroups(allGroups.map((g) => g.id));
        } else {
            setSelectedGroups([]);
        }
    }, [selectedRole, allGroups]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const toggleGroup = (groupId) => {
        if (selectedRole === 'super_admin') return;
        setSelectedGroups((prev) =>
            prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
        );
        if (errors.groups) setErrors((prev) => ({ ...prev, groups: '' }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 0) {
            if (!form.fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi';
            if (!form.username.trim()) newErrors.username = 'Username wajib diisi';
            if (form.username && !/^[a-zA-Z0-9_]+$/.test(form.username))
                newErrors.username = 'Username hanya boleh huruf, angka, dan underscore';
            if (!form.password) newErrors.password = 'Password wajib diisi';
            if (form.password && form.password.length < 6) newErrors.password = 'Password minimal 6 karakter';
        }
        if (step === 1 && selectedRole !== 'super_admin') {
            if (selectedGroups.length === 0)
                newErrors.groups = selectedRole === 'user'
                    ? 'Pilih minimal 1 group untuk user'
                    : 'Pilih minimal 1 group yang dikelola admin';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (step < STEPS.length - 1) setStep((s) => s + 1);
        else handleSubmit();
    };

    const handleBack = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            loading.start();

            const username = form.username.trim();

            // Signup dulu
            const signupRes = await UserDAO.signUp({
                fullName: form.fullName.trim(),
                username,
                password: form.password,
                email: form.email.trim(),
                phone_number: form.phone_number.trim(),
                groups: selectedRole === 'user' ? selectedGroups : [],
            });
            if (!signupRes.success) throw new Error(signupRes.error || 'Gagal membuat akun');

            // Kalau bukan user biasa, update role
            if (selectedRole !== 'user') {
                const roleRes = await UserDAO.setUserRole(username, {
                    role: selectedRole,
                    groups: [],
                    managedGroups: selectedGroups,
                });
                if (!roleRes.success) throw new Error(roleRes.error || 'Gagal set role');
            }

            const roleLabel = ROLES.find((r) => r.key === selectedRole)?.label;
            message(`${roleLabel} berhasil dibuat!`, 'success');
            navigate('/users');
        } catch (err) {
            message(err.message || 'Terjadi kesalahan', 'error');
        } finally {
            loading.stop();
            setSubmitting(false);
        }
    };

    const roleInfo = ROLES.find((r) => r.key === selectedRole);

    // ===== STEP 0: INFO AKUN =====
    const renderStep0 = () => (
        <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
                label="Nama Lengkap"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
                fullWidth
            />
            <TextField
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                required
                fullWidth
                InputProps={{
                    startAdornment: <Typography sx={{ color: '#94a3b8', mr: 0.5, fontSize: 15 }}>@</Typography>
                }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    fullWidth
                />
                <TextField
                    label="No. Telepon"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    fullWidth
                />
            </Box>
            <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || 'Minimal 6 karakter'}
                required
                fullWidth
            />
        </Box>
    );

    // ===== STEP 1: ROLE & GROUP =====
    const renderStep1 = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Role picker */}
            <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
                    Pilih Role
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {availableRoles.map((r) => {
                        const active = selectedRole === r.key;
                        return (
                            <Box
                                key={r.key}
                                onClick={() => setSelectedRole(r.key)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    p: 2, borderRadius: 3, cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: active ? r.color : '#E2E8F0',
                                    bgcolor: active ? r.bg : '#fff',
                                    transition: 'all 0.15s',
                                    '&:hover': { borderColor: r.color, opacity: 0.9 },
                                }}
                            >
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: active ? r.color : '#F1F5F9',
                                }}>
                                    <Icon icon={r.icon} width={20} color={active ? '#fff' : '#94A3B8'} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: active ? r.color : '#1E293B' }}>
                                        {r.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: '#64748b', mt: 0.25 }}>
                                        {r.desc}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    width: 20, height: 20, borderRadius: '50%', border: '2px solid', flexShrink: 0,
                                    borderColor: active ? r.color : '#CBD5E1',
                                    bgcolor: active ? r.color : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {active && <Icon icon="mdi:check" width={12} color="#fff" />}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Group picker */}
            <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
                    {selectedRole === 'user' ? 'Assign ke Group' : 'Group yang Dikelola'}
                    {selectedRole !== 'super_admin' && <span style={{ color: '#ef4444' }}> *</span>}
                </Typography>

                {selectedRole === 'super_admin' ? (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Icon icon="mdi:information-outline" color="#7C3AED" width={16} />
                        <Typography sx={{ fontSize: 12, color: '#6D28D9', fontWeight: 500 }}>
                            Super Admin otomatis punya akses ke semua group
                        </Typography>
                    </Box>
                ) : loadingGroups ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                        <CircularProgress size={14} />
                        <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Memuat group...</Typography>
                    </Box>
                ) : allGroups.length === 0 ? (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                        <Typography sx={{ fontSize: 13, color: '#92400e' }}>
                            Belum ada group tersedia. Buat group dulu dari menu Groups.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {allGroups.map((g) => {
                                const active = selectedGroups.includes(g.id);
                                return (
                                    <Chip
                                        key={g.id}
                                        label={g.name}
                                        onClick={() => toggleGroup(g.id)}
                                        icon={<Icon icon={active ? 'mdi:check-circle' : 'mdi:circle-outline'} width={16} />}
                                        sx={{
                                            fontWeight: 600, fontSize: 13,
                                            border: '2px solid',
                                            borderColor: active ? '#1E3A8A' : '#e2e8f0',
                                            bgcolor: active ? '#1E3A8A' : '#fff',
                                            color: active ? '#fff' : '#64748b',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            '& .MuiChip-icon': { color: active ? '#fff' : '#94a3b8' },
                                            '&:hover': { opacity: 0.85 },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                        {errors.groups && (
                            <Typography sx={{ fontSize: 12, color: '#ef4444', mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Icon icon="mdi:alert-circle-outline" width={14} />
                                {errors.groups}
                            </Typography>
                        )}
                        {selectedGroups.length > 0 && (
                            <Typography sx={{ fontSize: 12, color: '#64748b', mt: 1 }}>
                                Dipilih: <b>{selectedGroups.map((id) => allGroups.find((g) => g.id === id)?.name || id).join(', ')}</b>
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );

    // ===== STEP 2: KONFIRMASI =====
    const renderStep2 = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* User card */}
            <Box sx={{
                p: 2.5, borderRadius: 3, border: '2px solid',
                borderColor: roleInfo?.border, bgcolor: roleInfo?.bg,
                display: 'flex', alignItems: 'center', gap: 2,
            }}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: roleInfo?.color, fontSize: 20, fontWeight: 700 }}>
                    {form.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                    <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{form.fullName || '-'}</Typography>
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>@{form.username || '-'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                        <Icon icon={roleInfo?.icon || 'mdi:account'} width={14} color={roleInfo?.color} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: roleInfo?.color }}>
                            {roleInfo?.label}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Detail */}
            <Box sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {[
                    { label: 'Email', value: form.email || '-', icon: 'mdi:email-outline' },
                    { label: 'No. Telepon', value: form.phone_number || '-', icon: 'mdi:phone-outline' },
                    {
                        label: selectedRole === 'user' ? 'Groups' : 'Managed Groups',
                        value: selectedRole === 'super_admin'
                            ? 'Semua group'
                            : selectedGroups.length > 0
                                ? selectedGroups.map((id) => allGroups.find((g) => g.id === id)?.name || id).join(', ')
                                : '-',
                        icon: 'mdi:account-group-outline',
                    },
                ].map((item, i, arr) => (
                    <Box key={item.label} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                        borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon icon={item.icon} width={16} color="#64748B" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{item.label}</Typography>
                            <Typography sx={{ fontSize: 13, color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>{item.value}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Icon icon="mdi:information-outline" color="#D97706" width={16} style={{ marginTop: 1, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: '#92400e' }}>
                    Pastikan data sudah benar. Password tidak bisa dilihat setelah dibuat.
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 560 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                    Tambah Akun Baru
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#64748b' }}>
                    Buat user, admin, atau super admin dan assign ke group.
                </Typography>
            </Box>

            {/* Stepper */}
            <StepIndicator steps={STEPS} activeStep={step} />

            {/* Content */}
            <Box sx={{ mb: 3 }}>
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </Box>

            {/* Footer buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={step === 0 ? () => navigate('/users') : handleBack}
                    disabled={submitting}
                    sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, borderColor: '#E2E8F0', color: '#64748b' }}
                >
                    {step === 0 ? 'Batal' : '← Kembali'}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={submitting || (step === 1 && loadingGroups)}
                    startIcon={
                        submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> :
                        step === STEPS.length - 1 ? <Icon icon="mdi:check" width={18} /> : null
                    }
                    sx={{
                        borderRadius: 2.5, px: 4, fontWeight: 700,
                        bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#1e40af' },
                    }}
                >
                    {submitting ? 'Menyimpan...' : step === STEPS.length - 1 ? 'Buat Akun' : 'Lanjut →'}
                </Button>
            </Box>
        </Box>
    );
}