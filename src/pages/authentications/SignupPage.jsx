import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import UserDAO from '../../daos/UserDAO';
import GroupDAO from '../../daos/GroupDao';

export default function SignUpPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    const [groupOptions, setGroupOptions] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setGroupsLoading(true);
                const result = await GroupDAO.listGroups();
                if (result.success) {
                    const activeGroups = result.groups.filter((g) => g.isActive !== false);
                    setGroupOptions(activeGroups);
                }
            } catch (error) {
                console.error('Failed to fetch groups:', error);
            } finally {
                setGroupsLoading(false);
            }
        };
        fetchGroups();
    }, []);

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        fullName: Yup.string()
            .required('Full name is required!')
            .min(2, 'Full name must be at least 2 characters'),
        username: Yup.string()
            .required('Username is required!')
            .min(4, 'Username must be at least 4 characters')
            .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
        email: Yup.string()
            .email('Invalid email format')
            .required('Email is required!'),
        password: Yup.string()
            .required('Password is required!')
            .min(6, 'Password must be at least 6 characters'),
        confirmPassword: Yup.string()
            .required('Please confirm your password!')
            .oneOf([Yup.ref('password'), null], 'Passwords must match'),
        groups: Yup.array().min(1, 'Pilih minimal 1 grup'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            const result = await UserDAO.signUp({
                fullName: data.fullName.trim(),
                username: data.username.trim(),
                email: data.email.trim().toLowerCase(),
                password: data.password.trim(),
                role: 'user',
                groups: data.groups,
            });
            if (!result.success) throw new Error(result.error || 'Sign up failed');
            if (result.token) localStorage.setItem('authToken', result.token);
            login({
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role || 'user',
                email: result.user.email || '',
                groups: result.user.groups || [],
                managedGroups: result.user.managedGroups || [],
                permissions: result.user.permissions || {},
            });
            message('Account created successfully! Welcome aboard! 🎉', 'success');
            navigate('/', { replace: true });
        } catch (error) {
            message(error.message || 'Sign up failed. Please try again.', 'error');
        } finally {
            loading.stop();
        }
    };

    const handleGoogleSignUp = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                loading.start();
                const result = await UserDAO.loginGoogle(tokenResponse.access_token);
                if (!result.success) throw new Error(result.error || 'Google sign up failed');
                if (result.token) localStorage.setItem('authToken', result.token);
                const userData = {
                    id: result.user.username,
                    username: result.user.username,
                    fullName: result.user.fullName,
                    role: result.user.role || 'user',
                    email: result.user.email || '',
                    groups: result.user.groups || [],
                    managedGroups: result.user.managedGroups || [],
                    permissions: result.user.permissions || {},
                };
                login(userData);
                if (userData.groups.length === 0) {
                    localStorage.setItem('needsOnboarding', '1');
                    navigate('/onboarding', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
                message('Welcome!', 'success');
            } catch (error) {
                message(error.message || 'Google sign up gagal', 'error');
            } finally {
                loading.stop();
            }
        },
        onError: () => message('Google sign up dibatalkan', 'warning'),
    });

    const formik = useFormik({
        initialValues: {
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            groups: [],
        },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    const toggleGroup = (groupId) => {
        const current = formik.values.groups;
        const next = current.includes(groupId)
            ? current.filter((g) => g !== groupId)
            : [...current, groupId];
        formik.setFieldValue('groups', next);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f7f7fb' }}>
                <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTop: '3px solid #F5B800', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f7f7fb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: '"Nunito", sans-serif',
            overflowX: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes floatIllo { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-10px);} }
                @keyframes blobPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }

                * { box-sizing: border-box; }

                .sp-hero   { animation: fadeUp 0.5s ease both; }
                .sp-card   { animation: fadeUp 0.5s 0.15s ease both; }
                .sp-footer { animation: fadeUp 0.5s 0.3s ease both; }

                .sp-input {
                    width: 100%;
                    padding: 13px 16px;
                    border-radius: 14px;
                    border: 1.5px solid #e8e8f0;
                    background: #fff;
                    color: #1a1a2e;
                    font-size: 14px;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .sp-input::placeholder { color: #b0b0c0; font-weight: 500; }
                .sp-input:focus {
                    border-color: #F5B800;
                    box-shadow: 0 0 0 3px rgba(245,184,0,0.15), 0 2px 8px rgba(0,0,0,0.06);
                }
                .sp-input.has-error { border-color: #ff6b6b; }

                .sp-btn-main {
                    width: 100%;
                    padding: 15px;
                    border-radius: 50px;
                    border: none;
                    background: #F5B800;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 800;
                    font-family: 'Nunito', sans-serif;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 6px 20px rgba(245,184,0,0.4);
                }
                .sp-btn-main:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(245,184,0,0.5);
                    background: #e6ac00;
                }
                .sp-btn-main:active:not(:disabled) { transform: translateY(0); }
                .sp-btn-main:disabled { opacity: 0.6; cursor: default; }

                .sp-google-btn {
                    width: 100%;
                    padding: 13px 16px;
                    border-radius: 50px;
                    border: 1.5px solid #e8e8f0;
                    background: #fff;
                    color: #1a1a2e;
                    font-size: 14px;
                    font-weight: 700;
                    font-family: 'Nunito', sans-serif;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .sp-google-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    border-color: #d0d0e0;
                }

                .sp-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 18px 0;
                }
                .sp-divider::before, .sp-divider::after {
                    content: '';
                    flex: 1;
                    height: 1.5px;
                    background: #ececf4;
                    border-radius: 2px;
                }
                .sp-divider span {
                    font-size: 13px;
                    color: #b0b0c0;
                    font-weight: 700;
                }

                .sp-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: #8888a0;
                    margin-bottom: 7px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .sp-err {
                    font-size: 11.5px;
                    color: #ff6b6b;
                    margin-top: 4px;
                    font-weight: 600;
                }

                .pw-wrap { position: relative; }
                .pw-toggle {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: #b0b0c0;
                    display: flex;
                    align-items: center;
                }
                .pw-toggle:hover { color: #7c6be0; }

                .group-chip {
                    padding: 8px 16px;
                    border-radius: 50px;
                    font-size: 13px;
                    font-weight: 700;
                    font-family: 'Nunito', sans-serif;
                    border: 1.5px solid #e8e8f0;
                    background: #fff;
                    color: #8888a0;
                    cursor: pointer;
                    transition: all 0.18s;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
                }
                .group-chip:hover {
                    border-color: #6C63E0;
                    color: #6C63E0;
                    transform: translateY(-1px);
                }
                .group-chip.selected {
                    background: #6C63E0;
                    border-color: #6C63E0;
                    color: #fff;
                    box-shadow: 0 4px 12px rgba(108,99,224,0.3);
                }
            `}</style>

            {/* TOP HERO — shorter for signup */}
            <div className="sp-hero" style={{
                width: '100%',
                background: 'linear-gradient(160deg, #6C63E0 0%, #8B80F8 60%, #a89cf8 100%)',
                borderRadius: '0 0 40px 40px',
                paddingTop: 40,
                paddingBottom: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Blobs */}
                <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', animation: 'blobPulse 5s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: 0, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'blobPulse 7s ease-in-out infinite' }} />

                {/* Book illustration — smaller for signup */}
                <div style={{ animation: 'floatIllo 4s ease-in-out infinite' }}>
                    <div style={{
                        width: 130, height: 130, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        marginBottom: 8,
                    }}>
                        <div style={{
                            width: 112, height: 112, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="80" height="80" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="52" cy="82" rx="30" ry="5" fill="rgba(0,0,0,0.18)" />
                                <path d="M52 22 L20 30 L20 74 L52 70 Z" fill="#5B52CC"/>
                                <path d="M52 24 L22 31 L22 72 L52 68 Z" fill="#FAFAFA"/>
                                <line x1="27" y1="41" x2="48" y2="39" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="27" y1="47" x2="48" y2="45" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="27" y1="53" x2="48" y2="51" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="27" y1="59" x2="42" y2="57" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <rect x="27" y="33" width="18" height="4" rx="2" fill="#F5B800" opacity="0.85"/>
                                <path d="M52 22 L84 30 L84 74 L52 70 Z" fill="#4A42B8"/>
                                <path d="M52 24 L82 31 L82 72 L52 68 Z" fill="#F3F3F8"/>
                                <line x1="56" y1="41" x2="77" y2="43" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="56" y1="47" x2="77" y2="49" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="56" y1="53" x2="77" y2="55" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="56" y1="59" x2="70" y2="61" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round"/>
                                <rect x="56" y="33" width="16" height="4" rx="2" fill="#a89cf8" opacity="0.8"/>
                                <path d="M52 22 L52 70" stroke="#3D36A0" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M20 74 L52 70 L52 76 L20 80 Z" fill="#4A42B8"/>
                                <path d="M84 74 L52 70 L52 76 L84 80 Z" fill="#3D36A0"/>
                                <path d="M72 22 L72 44 L68 41 L64 44 L64 22 Z" fill="#F5B800"/>
                                <text x="6"  y="28" fontSize="12" fill="white" opacity="0.85">✦</text>
                                <text x="86" y="22" fontSize="9"  fill="white" opacity="0.65">✦</text>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Title inside hero */}
                <div style={{ textAlign: 'center', paddingBottom: 20 }}>
                    <h1 style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', margin: '4px 0 4px', letterSpacing: '-0.02em' }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                        Join and start your journey
                    </p>
                </div>
            </div>

            {/* FORM */}
            <div className="sp-card" style={{
                width: '100%',
                maxWidth: 420,
                padding: '24px 24px 0',
            }}>
                <form onSubmit={formik.handleSubmit}>

                    {/* Google Sign Up — top of form */}
                    <button type="button" className="sp-google-btn" onClick={() => handleGoogleSignUp()}>
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div className="sp-divider"><span>Or sign up with email</span></div>

                    {/* Full Name */}
                    <div style={{ marginBottom: 14 }}>
                        <label className="sp-label">Full Name</label>
                        <input
                            className={`sp-input ${formik.touched.fullName && formik.errors.fullName ? 'has-error' : ''}`}
                            name="fullName"
                            placeholder="John Doe"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.fullName}
                            autoComplete="name"
                        />
                        {formik.touched.fullName && formik.errors.fullName && (
                            <div className="sp-err">{formik.errors.fullName}</div>
                        )}
                    </div>

                    {/* Username */}
                    <div style={{ marginBottom: 14 }}>
                        <label className="sp-label">Username</label>
                        <input
                            className={`sp-input ${formik.touched.username && formik.errors.username ? 'has-error' : ''}`}
                            name="username"
                            placeholder="johndoe123"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.username}
                            autoComplete="username"
                        />
                        {formik.touched.username && formik.errors.username && (
                            <div className="sp-err">{formik.errors.username}</div>
                        )}
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 14 }}>
                        <label className="sp-label">Email Address</label>
                        <input
                            className={`sp-input ${formik.touched.email && formik.errors.email ? 'has-error' : ''}`}
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                            autoComplete="email"
                        />
                        {formik.touched.email && formik.errors.email && (
                            <div className="sp-err">{formik.errors.email}</div>
                        )}
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: 14 }}>
                        <label className="sp-label">Password</label>
                        <div className="pw-wrap">
                            <input
                                className={`sp-input ${formik.touched.password && formik.errors.password ? 'has-error' : ''}`}
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.password}
                                autoComplete="new-password"
                                style={{ paddingRight: 48 }}
                            />
                            <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)}>
                                {showPassword ? (
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <div className="sp-err">{formik.errors.password}</div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: 14 }}>
                        <label className="sp-label">Confirm Password</label>
                        <div className="pw-wrap">
                            <input
                                className={`sp-input ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'has-error' : ''}`}
                                name="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="••••••••"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.confirmPassword}
                                autoComplete="new-password"
                                style={{ paddingRight: 48 }}
                            />
                            <button type="button" className="pw-toggle" onClick={() => setShowConfirm(v => !v)}>
                                {showConfirm ? (
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                            <div className="sp-err">{formik.errors.confirmPassword}</div>
                        )}
                    </div>

                    {/* Group Selection */}
                    <div style={{ marginBottom: 22 }}>
                        <label className="sp-label">Pilih Grup</label>
                        {groupsLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: '#8888a0', fontSize: 13, fontWeight: 600 }}>
                                <span style={{ width: 16, height: 16, border: '2px solid #e8e8f0', borderTop: '2px solid #6C63E0', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                                Memuat daftar grup...
                            </div>
                        ) : groupOptions.length === 0 ? (
                            <p style={{ color: '#b0b0c0', fontSize: 13, fontWeight: 600, padding: '8px 0' }}>
                                Belum ada grup tersedia. Hubungi admin.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {groupOptions.map((group) => {
                                    const isSelected = formik.values.groups.includes(group.id);
                                    return (
                                        <button
                                            key={group.id}
                                            type="button"
                                            className={`group-chip ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            {isSelected && <span style={{ marginRight: 4 }}>✓</span>}
                                            {group.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {formik.touched.groups && formik.errors.groups && (
                            <div className="sp-err">{formik.errors.groups}</div>
                        )}
                    </div>

                    {/* Submit */}
                    <button type="submit" className="sp-btn-main" disabled={!formik.isValid || formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                                Creating Account...
                            </span>
                        ) : 'Create Account'}
                    </button>

                    <p style={{ color: '#c0c0d0', fontSize: 11, textAlign: 'center', marginTop: 14, fontWeight: 600, lineHeight: 1.5 }}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </form>

                <div style={{ height: 28 }} />
            </div>

            {/* Footer */}
            <div className="sp-footer" style={{ paddingBottom: 36, textAlign: 'center' }}>
                <p style={{ color: '#b0b0c0', fontSize: 14, fontFamily: '"Nunito",sans-serif', fontWeight: 600, margin: 0 }}>
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F5B800', fontWeight: 800, fontSize: 14, fontFamily: '"Nunito",sans-serif', padding: 0 }}
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
}