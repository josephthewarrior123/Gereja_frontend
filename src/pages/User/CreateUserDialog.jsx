import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
    Avatar,
    CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import UserDAO from '../../daos/UserDAO';
import GroupDAO from '../../daos/GroupDao';

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

const STEPS = ['Account Info', 'Role & Group', 'Review'];

function StepIndicator({ steps, activeStep }) {
    return (
        <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-4 left-8 right-8 h-px bg-gray-200 z-0" />
            {steps.map((step, i) => {
                const done = i < activeStep;
                const active = i === activeStep;
                return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                            style={{
                                background: done || active ? '#1E3A8A' : '#F1F5F9',
                                color: done || active ? '#fff' : '#94A3B8',
                                boxShadow: active ? '0 0 0 4px rgba(30,58,138,0.15)' : 'none',
                            }}
                        >
                            {done ? <Icon icon="mdi:check" width={14} /> : i + 1}
                        </div>
                        <span
                            className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                            style={{ color: active ? '#1E3A8A' : done ? '#64748B' : '#CBD5E1' }}
                        >
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function FieldInput({ label, name, type = 'text', placeholder, icon, value, onChange, error, required }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon icon={icon} width={16} />
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full rounded-xl border py-2.5 text-sm text-slate-700 bg-white transition-all outline-none
                        ${icon ? 'pl-9 pr-4' : 'px-4'}
                        ${error
                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
                        }
                    `}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <Icon icon="mdi:alert-circle-outline" width={12} />
                    {error}
                </p>
            )}
        </div>
    );
}

export default function CreateUserDialog({ open, onClose, currentUserRole }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const loading = useLoading();
    const message = useAlert();

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ✅ FIX: Groups dari API, bukan hardcode
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

    const availableRoles = ROLES.filter((r) => {
        if (currentUserRole === 'admin') return r.key === 'user';
        return true;
    });

    // ✅ FIX: Fetch groups tiap kali dialog dibuka
    useEffect(() => {
        if (!open) return;
        const fetchGroups = async () => {
            try {
                setLoadingGroups(true);
                const res = await GroupDAO.listGroups();
                // Kompatibel dgn berbagai struktur response
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
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchGroups();
    }, [open]);

    // Reset saat dialog tutup
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep(0);
                setForm({ fullName: '', username: '', password: '', email: '', phone_number: '' });
                setSelectedRole('user');
                setSelectedGroups([]);
                setErrors({});
            }, 300);
        }
    }, [open]);

    // Auto-select semua group untuk super_admin
    useEffect(() => {
        if (selectedRole === 'super_admin') {
            setSelectedGroups(allGroups.map((g) => g.id));
        } else {
            // Hanya reset kalau bukan karena allGroups baru load
            setSelectedGroups((prev) => (selectedRole === 'super_admin' ? prev : []));
        }
    }, [selectedRole]);

    // Saat allGroups berhasil diload dan role sudah super_admin, auto-select
    useEffect(() => {
        if (selectedRole === 'super_admin' && allGroups.length > 0) {
            setSelectedGroups(allGroups.map((g) => g.id));
        }
    }, [allGroups]);

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

            const signupBody = {
                fullName: form.fullName.trim(),
                username: form.username.trim(),
                password: form.password,
                email: form.email.trim(),
                phone_number: form.phone_number.trim(),
                groups: selectedRole === 'user' ? selectedGroups : [],
            };

            const signupRes = await UserDAO.signUp(signupBody);
            if (!signupRes.success) throw new Error(signupRes.error || 'Gagal membuat akun');

            if (selectedRole !== 'user') {
                const roleRes = await UserDAO.setUserRole(form.username.trim(), {
                    role: selectedRole,
                    groups: [],
                    managedGroups: selectedGroups,
                });
                if (!roleRes.success) throw new Error(roleRes.error || 'Gagal set role');
            }

            message(`${ROLES.find((r) => r.key === selectedRole)?.label} berhasil dibuat!`, 'success');
            onClose(true);
        } catch (err) {
            message(err.message || 'Terjadi kesalahan', 'error');
        } finally {
            loading.stop();
            setSubmitting(false);
        }
    };

    const roleInfo = ROLES.find((r) => r.key === selectedRole);

    // ===== STEP CONTENT =====

    const renderStep0 = () => (
        <div className="space-y-4 animate-in fade-in duration-200">
            <FieldInput label="Nama Lengkap" name="fullName" placeholder="Budi Santoso" icon="mdi:account-outline" value={form.fullName} onChange={handleChange} error={errors.fullName} required />
            <FieldInput label="Username" name="username" placeholder="budi_santoso" icon="mdi:at" value={form.username} onChange={handleChange} error={errors.username} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldInput label="Email" name="email" type="email" placeholder="budi@email.com" icon="mdi:email-outline" value={form.email} onChange={handleChange} error={errors.email} />
                <FieldInput label="No. Telepon" name="phone_number" placeholder="08123456789" icon="mdi:phone-outline" value={form.phone_number} onChange={handleChange} error={errors.phone_number} />
            </div>
            <FieldInput label="Password" name="password" type="password" placeholder="Min. 6 karakter" icon="mdi:lock-outline" value={form.password} onChange={handleChange} error={errors.password} required />
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-5 animate-in fade-in duration-200">
            {/* Role Selection */}
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pilih Role</p>
                <div className="space-y-2.5">
                    {availableRoles.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setSelectedRole(r.key)}
                            className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 flex items-center gap-4"
                            style={{
                                borderColor: selectedRole === r.key ? r.color : '#E2E8F0',
                                background: selectedRole === r.key ? r.bg : '#fff',
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: selectedRole === r.key ? r.color : '#F1F5F9' }}>
                                <Icon icon={r.icon} width={20} color={selectedRole === r.key ? '#fff' : '#94A3B8'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold" style={{ color: selectedRole === r.key ? r.color : '#1E293B' }}>{r.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={{
                                    borderColor: selectedRole === r.key ? r.color : '#CBD5E1',
                                    background: selectedRole === r.key ? r.color : 'transparent',
                                }}>
                                {selectedRole === r.key && <Icon icon="mdi:check" width={12} color="#fff" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Group Selection */}
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {selectedRole === 'user' ? 'Assign ke Group' : 'Group yang Dikelola'}
                    {selectedRole !== 'super_admin' && <span className="text-red-400"> *</span>}
                </p>

                {selectedRole === 'super_admin' ? (
                    <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 flex items-center gap-2.5 mt-2">
                        <Icon icon="mdi:information-outline" color="#7C3AED" width={16} />
                        <p className="text-xs text-purple-700 font-medium">Super Admin otomatis punya akses ke semua group</p>
                    </div>
                ) : loadingGroups ? (
                    <div className="flex items-center gap-2 py-3 text-slate-400 mt-2">
                        <CircularProgress size={14} />
                        <span className="text-xs">Memuat group...</span>
                    </div>
                ) : allGroups.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mt-2">
                        <p className="text-xs text-amber-700">Belum ada group tersedia. Buat group dulu dari menu Groups.</p>
                    </div>
                ) : (
                    <>
                        {/* ✅ Render tombol dari data API */}
                        <div className="flex flex-wrap gap-2 mt-2.5">
                            {allGroups.map((g) => {
                                const active = selectedGroups.includes(g.id);
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => toggleGroup(g.id)}
                                        className="rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                                        style={{
                                            borderColor: active ? '#1E3A8A' : '#E2E8F0',
                                            background: active ? '#1E3A8A' : '#fff',
                                            color: active ? '#fff' : '#94A3B8',
                                        }}
                                    >
                                        <Icon icon={active ? 'mdi:check-circle' : 'mdi:circle-outline'} width={16} />
                                        {g.name}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.groups && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5">
                                <Icon icon="mdi:alert-circle-outline" width={12} />
                                {errors.groups}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl p-4 border-2 flex items-center gap-4"
                style={{ borderColor: roleInfo?.border, background: roleInfo?.bg }}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: roleInfo?.color, fontSize: 20, fontWeight: 700 }}>
                    {form.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <div>
                    <p className="font-bold text-slate-800">{form.fullName || '-'}</p>
                    <p className="text-sm text-slate-500">@{form.username || '-'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Icon icon={roleInfo?.icon || 'mdi:account'} width={14} color={roleInfo?.color} />
                        <span className="text-xs font-semibold" style={{ color: roleInfo?.color }}>{roleInfo?.label}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                {[
                    { label: 'Email', value: form.email || '-', icon: 'mdi:email-outline' },
                    { label: 'No. Telepon', value: form.phone_number || '-', icon: 'mdi:phone-outline' },
                    {
                        label: selectedRole === 'user' ? 'Groups' : 'Managed Groups',
                        // ✅ Tampilkan nama group, bukan id
                        value: selectedRole === 'super_admin'
                            ? 'Semua group'
                            : selectedGroups.length > 0
                                ? selectedGroups.map((id) => allGroups.find((g) => g.id === id)?.name || id).join(', ')
                                : '-',
                        icon: 'mdi:account-group-outline',
                    },
                ].map((item, i, arr) => (
                    <div key={item.label} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Icon icon={item.icon} width={16} color="#64748B" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                            <p className="text-sm text-slate-700 font-semibold capitalize truncate">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                <Icon icon="mdi:information-outline" color="#D97706" width={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">Pastikan data sudah benar. Password tidak bisa dilihat setelah dibuat.</p>
            </div>
        </div>
    );

    return (
        <Dialog
            open={open}
            onClose={() => !submitting && onClose(false)}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                style: { borderRadius: isMobile ? 0 : '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' },
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Tambah User Baru</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Isi data dan assign role & group</p>
                </div>
                <button onClick={() => !submitting && onClose(false)}
                    className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                    <Icon icon="mdi:close" width={18} />
                </button>
            </div>

            {/* Stepper */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <StepIndicator steps={STEPS} activeStep={step} />
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto bg-white" style={{ minHeight: 340, maxHeight: isMobile ? 'none' : 420 }}>
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                    onClick={step === 0 ? () => onClose(false) : handleBack}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white hover:border-slate-300 transition-all disabled:opacity-40"
                >
                    {step === 0 ? 'Batal' : '← Kembali'}
                </button>
                <button
                    onClick={handleNext}
                    disabled={submitting || (step === 1 && loadingGroups)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-60"
                    style={{ background: '#1E3A8A' }}
                >
                    {submitting ? (
                        <><CircularProgress size={14} sx={{ color: '#fff' }} />Menyimpan...</>
                    ) : step === STEPS.length - 1 ? (
                        <><Icon icon="mdi:check" width={16} />Buat Akun</>
                    ) : (
                        <>Lanjut →</>
                    )}
                </button>
            </div>
        </Dialog>
    );
}