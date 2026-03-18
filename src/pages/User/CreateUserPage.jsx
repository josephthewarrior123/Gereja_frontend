// src/pages/User/CreateUserPage.jsx
import { Icon } from '@iconify/react';
import {
    Box, Button, CircularProgress,
    Stack, TextField, Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import GroupDAO from '../../daos/GroupDao';
import UserDAO from '../../daos/UserDAO';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';

const ROLES = [
    { key: 'user',        label: 'User',        icon: 'mdi:account-outline',      color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', desc: 'Anggota biasa, bisa submit journal' },
    { key: 'gembala',     label: 'Gembala',     icon: 'mdi:account-heart-outline', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', desc: 'Bisa bulk award di group nya' },
    { key: 'admin',       label: 'Admin',       icon: 'mdi:shield-outline',        color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Kelola aktivitas & user di group' },
    { key: 'super_admin', label: 'Super Admin', icon: 'mdi:shield-crown-outline',  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', desc: 'Akses penuh ke semua fitur' },
];

// ─── Role Dropdown ────────────────────────────────────────────────────────────
function RoleDropdown({ value, onChange, availableRoles }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = ROLES.find(r => r.key === value);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <Box ref={ref} sx={{ position: 'relative' }}>
            <Box onClick={() => setOpen(o => !o)} sx={{
                border: `1.5px solid ${open ? selected?.color || '#2563EB' : '#E2E8F0'}`,
                borderRadius: '12px', p: '10px 14px', cursor: 'pointer', bgcolor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'border-color .15s', '&:hover': { borderColor: selected?.color || '#2563EB' },
            }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: selected?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon icon={selected?.icon || 'mdi:account'} color={selected?.color} width={18} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.2 }}>{selected?.label}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>{selected?.desc}</Typography>
                    </Box>
                </Stack>
                <Box sx={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}>
                    <Icon icon="mdi:chevron-down" color="#94a3b8" width={20} />
                </Box>
            </Box>

            {open && (
                <Box sx={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100, bgcolor: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {availableRoles.map((r, i) => {
                        const isSelected = r.key === value;
                        return (
                            <Box key={r.key} onClick={() => { onChange(r.key); setOpen(false); }} sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 2, py: 1.5, cursor: 'pointer',
                                bgcolor: isSelected ? r.bg : '#fff',
                                borderBottom: i < availableRoles.length - 1 ? '1px solid #F8FAFC' : 'none',
                                '&:hover': { bgcolor: r.bg }, transition: 'background .1s',
                            }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: isSelected ? r.color : r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                                        <Icon icon={r.icon} color={isSelected ? '#fff' : r.color} width={17} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: isSelected ? r.color : '#0f172a', fontFamily: '"DM Sans", sans-serif' }}>{r.label}</Typography>
                                        <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>{r.desc}</Typography>
                                    </Box>
                                </Stack>
                                {isSelected && <Icon icon="mdi:check-circle" color={r.color} width={18} />}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

// ─── Group Picker (single select) ────────────────────────────────────────────
function GroupPicker({ groups, value, onChange, loading: loadingGroups }) {
    if (loadingGroups) return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={14} sx={{ color: '#2563EB' }} />
            <Typography sx={{ fontSize: 13, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>Memuat group...</Typography>
        </Stack>
    );
    if (groups.length === 0) return (
        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
            <Typography sx={{ fontSize: 13, color: '#92400e', fontFamily: '"DM Sans", sans-serif' }}>Belum ada group. Buat dulu dari menu Groups.</Typography>
        </Box>
    );
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {groups.map(g => {
                const active = value === g.id;
                return (
                    <Box key={g.id} onClick={() => onChange(active ? '' : g.id)} sx={{
                        px: 2, py: 0.9, borderRadius: '10px', cursor: 'pointer',
                        border: '1.5px solid', transition: 'all .15s',
                        fontWeight: 700, fontSize: 13, fontFamily: '"DM Sans", sans-serif',
                        borderColor: active ? '#1E3A8A' : '#E2E8F0',
                        bgcolor: active ? '#1E3A8A' : '#fff',
                        color: active ? '#fff' : '#64748b',
                        '&:hover': { borderColor: '#1E3A8A', color: active ? '#fff' : '#1E3A8A' },
                    }}>
                        {g.name}
                    </Box>
                );
            })}
        </Box>
    );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
    return (
        <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75, fontFamily: '"DM Sans", sans-serif' }}>
                {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
            </Typography>
            {children}
            {error && (
                <Typography sx={{ fontSize: 11, color: '#ef4444', mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: '"DM Sans", sans-serif' }}>
                    <Icon icon="mdi:alert-circle-outline" width={13} />{error}
                </Typography>
            )}
        </Box>
    );
}

const inputSx = { borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, bgcolor: '#fff' };

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function CreateUserPage() {
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();
    const { user } = useUser();

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [selectedRole, setSelectedRole] = useState('user');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [form, setForm] = useState({ fullName: '', username: '', password: '', email: '', phone_number: '' });

    const availableRoles = ROLES.filter(r => {
        if (user?.role === 'super_admin') return true; // semua role
        if (user?.role === 'admin') return ['user', 'gembala'].includes(r.key); // admin bisa buat user & gembala
        if (user?.role === 'gembala') return r.key === 'user'; // gembala cuma bisa buat user
        return false;
    });

    const needsGroup = selectedRole !== 'super_admin';
    const isPromote = false; // semua role dibuat langsung

    useEffect(() => {
        if (user && user.role === 'user') { message('Access denied', 'error'); navigate('/dashboard', { replace: true }); }
    }, [user]);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoadingGroups(true);
                const res = await GroupDAO.listGroups();
                const raw = res?.groups ?? res?.data?.groups ?? res?.data ?? [];
                const normalized = (Array.isArray(raw) ? raw : [])
                    .map(g => typeof g === 'string' ? { id: g, name: g } : { id: g.id || g.code, name: g.name || g.id })
                    .filter(g => g.id);
                // admin only sees managedGroups
                const filtered = user?.role === 'admin'
                    ? normalized.filter(g => (user.managedGroups || []).includes(g.id))
                    : normalized;
                setAllGroups(filtered);
            } catch { message('Gagal memuat group', 'warning'); }
            finally { setLoadingGroups(false); }
        };
        fetchGroups();
    }, [user]);

    // reset group when role changes
    useEffect(() => { setSelectedGroup(''); }, [selectedRole]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!isPromote) {
            if (!form.fullName.trim()) e.fullName = 'Nama lengkap wajib diisi';
            if (!form.username.trim()) e.username = 'Username wajib diisi';
            if (!form.password) e.password = 'Password wajib diisi';
            else if (form.password.length < 6) e.password = 'Password minimal 6 karakter';
        } else {
            if (!form.username.trim()) e.username = 'Username wajib diisi';
        }
        if (needsGroup && !selectedGroup) e.group = 'Pilih 1 group';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            setSubmitting(true);
            loading.start();

            // signup dulu
            const signupRes = await UserDAO.signUp({
                fullName: form.fullName.trim(),
                username: form.username.trim(),
                password: form.password,
                email: form.email.trim(),
                phone_number: form.phone_number.trim(),
                groups: selectedRole === 'user' ? [selectedGroup] : [],
            });
            if (!signupRes.success) throw new Error(signupRes.error || 'Gagal membuat akun');

            // set role kalau bukan user biasa
            if (selectedRole !== 'user') {
                const roleRes = await UserDAO.setUserRole(form.username.trim(), {
                    role: selectedRole,
                    groups: [],
                    managedGroups: selectedRole !== 'super_admin' ? [selectedGroup] : [],
                });
                if (!roleRes.success) throw new Error(roleRes.error || 'Gagal assign role');
            }

            message('Akun berhasil dibuat!', 'success');
            navigate('/users');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            setSubmitting(false);
            loading.stop();
        }
    };

    const roleInfo = ROLES.find(r => r.key === selectedRole);

    return (
        <Box sx={{ maxWidth: 520, mx: 'auto', p: { xs: 2, sm: 4 }, pb: 8 }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box onClick={() => navigate('/users')} sx={{ cursor: 'pointer', color: '#94a3b8', '&:hover': { color: '#0f172a' }, display: 'flex' }}>
                    <Icon icon="mdi:arrow-left" width={22} />
                </Box>
                <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563EB', fontFamily: '"DM Sans", sans-serif', mb: 0.2 }}>
                        User Management
                    </Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: '"DM Sans", sans-serif', lineHeight: 1 }}>
                        Buat Akun Baru
                    </Typography>
                </Box>
            </Stack>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Role */}
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', p: 2.5 }}>
                    <Field label="Role" required>
                        <RoleDropdown value={selectedRole} onChange={setSelectedRole} availableRoles={availableRoles} />
                    </Field>
                </Box>



                {/* Info super_admin = no group */}
                {selectedRole === 'super_admin' && (
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F5F3FF', border: '1.5px solid #DDD6FE', display: 'flex', gap: 1.5 }}>
                        <Icon icon="mdi:information-outline" color="#7C3AED" width={18} style={{ flexShrink: 0, marginTop: 1 }} />
                        <Typography sx={{ fontSize: 12.5, color: '#6D28D9', lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif' }}>
                            Super Admin otomatis punya akses ke <strong>semua group</strong>.
                        </Typography>
                    </Box>
                )}

                {/* Form fields */}
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', p: 2.5 }}>
                    <Stack spacing={2}>
                        <Field label="Nama Lengkap" required error={errors.fullName}>
                                <TextField fullWidth size="small" name="fullName" placeholder="Nama lengkap"
                                    value={form.fullName} onChange={handleChange}
                                    error={!!errors.fullName}
                                    InputProps={{ sx: inputSx }} />
                            </Field>
                        <Field label="Username" required error={errors.username}>
                            <TextField fullWidth size="small" name="username" placeholder="Username"
                                value={form.username} onChange={handleChange}
                                error={!!errors.username}
                                InputProps={{ sx: inputSx }} />
                        </Field>
                        <Field label="Password" required error={errors.password}>
                            <TextField fullWidth size="small" name="password" type="password" placeholder="Min. 6 karakter"
                                value={form.password} onChange={handleChange}
                                error={!!errors.password}
                                InputProps={{ sx: inputSx }} />
                        </Field>
                        <Field label="Email">
                            <TextField fullWidth size="small" name="email" type="email" placeholder="email@example.com"
                                value={form.email} onChange={handleChange}
                                InputProps={{ sx: inputSx }} />
                        </Field>
                        <Field label="No. Telepon">
                            <TextField fullWidth size="small" name="phone_number" placeholder="+62..."
                                value={form.phone_number} onChange={handleChange}
                                InputProps={{ sx: inputSx }} />
                        </Field>
                    </Stack>
                </Box>

                {/* Group picker — hanya kalau bukan super_admin */}
                {needsGroup && (
                    <Box sx={{ bgcolor: '#fff', border: `1px solid ${errors.group ? '#fecaca' : '#e2e8f0'}`, borderRadius: '16px', p: 2.5 }}>
                        <Field label={selectedRole === 'user' ? 'Group' : 'Managed Group'} required error={errors.group}>
                            <Box mt={0.5}>
                                <GroupPicker
                                    groups={allGroups}
                                    value={selectedGroup}
                                    onChange={setSelectedGroup}
                                    loading={loadingGroups}
                                />
                            </Box>
                        </Field>
                    </Box>
                )}

                {/* Submit */}
                <Box onClick={!submitting ? handleSubmit : undefined} sx={{
                    py: 1.5, borderRadius: '12px', textAlign: 'center', cursor: submitting ? 'default' : 'pointer',
                    background: `linear-gradient(135deg, ${roleInfo?.color || '#1E3A8A'}, ${roleInfo?.color || '#1E3A8A'}cc)`,
                    color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: '"DM Sans", sans-serif',
                    boxShadow: `0 4px 14px ${roleInfo?.color || '#1E3A8A'}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                    opacity: submitting ? 0.75 : 1, transition: 'all .15s',
                    '&:hover': { opacity: submitting ? 0.75 : 0.9, transform: submitting ? 'none' : 'translateY(-1px)' },
                }}>
                    {submitting
                        ? <><CircularProgress size={16} sx={{ color: '#fff' }} /> Menyimpan...</>
                        : <><Icon icon={roleInfo?.icon || 'mdi:account-plus'} width={18} /> Buat Akun</>
                    }
                </Box>
            </Box>
        </Box>
    );
}