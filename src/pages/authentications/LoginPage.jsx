import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import UserDAO from '../../daos/UserDAO';

export default function LoginPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        if (user && !isLoading) {
            if (localStorage.getItem('needsOnboarding')) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate('/journal', { replace: true });
            }
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        username: Yup.string().required('Username is required!'),
        password: Yup.string().required('Password is required!'),
    });

    const applyLoginResult = (result, isGoogle = false) => {
        if (!result.success) throw new Error(result.error || 'Login failed');
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
        if (isGoogle && userData.groups.length === 0) {
            localStorage.setItem('needsOnboarding', '1');
            navigate('/onboarding', { replace: true });
        } else {
            navigate('/journal', { replace: true });
        }
    };

    const handleSubmit = async (data) => {
        try {
            loading.start();
            const result = await UserDAO.login({ username: data.username.trim(), password: data.password.trim() });
            applyLoginResult(result, false);
            message('Welcome back!', 'success');
        } catch (error) {
            message(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            loading.stop();
        }
    };

    // FIX: useGoogleLogin returns a function — call it directly, don't wrap in onClick arrow
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setGoogleLoading(true);
                loading.start();
                const result = await UserDAO.loginGoogle(tokenResponse.access_token);
                applyLoginResult(result, true);
                message('Welcome!', 'success');
            } catch (error) {
                message(error.message || 'Google login gagal', 'error');
            } finally {
                loading.stop();
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setGoogleLoading(false);
            message('Google login dibatalkan', 'warning');
        },
        flow: 'implicit', // FIX: explicitly set flow to avoid redirect_uri issues
    });

    const formik = useFormik({
        initialValues: { username: '', password: '' },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

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

                .lp-hero { animation: fadeUp 0.5s ease both; }
                .lp-card { animation: fadeUp 0.5s 0.15s ease both; }
                .lp-footer { animation: fadeUp 0.5s 0.3s ease both; }

                .lp-input {
                    width: 100%;
                    padding: 14px 16px;
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
                .lp-input::placeholder { color: #b0b0c0; font-weight: 500; }
                .lp-input:focus {
                    border-color: #F5B800;
                    box-shadow: 0 0 0 3px rgba(245,184,0,0.15), 0 2px 8px rgba(0,0,0,0.06);
                }
                .lp-input.has-error { border-color: #ff6b6b; }

                .lp-btn-main {
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
                    letter-spacing: 0.3px;
                    box-shadow: 0 6px 20px rgba(245,184,0,0.4);
                }
                .lp-btn-main:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(245,184,0,0.5);
                    background: #e6ac00;
                }
                .lp-btn-main:active:not(:disabled) { transform: translateY(0); }
                .lp-btn-main:disabled { opacity: 0.6; cursor: default; }

                .lp-google-btn {
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
                .lp-google-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    border-color: #d0d0e0;
                }
                .lp-google-btn:disabled { opacity: 0.6; cursor: default; }

                .lp-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 20px 0;
                }
                .lp-divider::before, .lp-divider::after {
                    content: '';
                    flex: 1;
                    height: 1.5px;
                    background: #ececf4;
                    border-radius: 2px;
                }
                .lp-divider span {
                    font-size: 13px;
                    color: #b0b0c0;
                    font-weight: 700;
                }

                .lp-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #8888a0;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .lp-err {
                    font-size: 11.5px;
                    color: #ff6b6b;
                    margin-top: 5px;
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
            `}</style>

            {/* TOP HERO */}
            <div className="lp-hero" style={{
                width: '100%',
                background: 'linear-gradient(160deg, #6C63E0 0%, #8B80F8 60%, #a89cf8 100%)',
                borderRadius: '0 0 40px 40px',
                paddingTop: 52,
                paddingBottom: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 250,
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -70, left: -70,
                    width: 220, height: 220, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.09)',
                    animation: 'blobPulse 5s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', bottom: 10, right: -50,
                    width: 160, height: 160, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    animation: 'blobPulse 7s ease-in-out infinite',
                }} />

                <div style={{ animation: 'floatIllo 4s ease-in-out infinite', position: 'relative', marginBottom: 8 }}>
                    <div style={{
                        width: 164, height: 164, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.15), inset 0 0 30px rgba(255,255,255,0.08)',
                    }}>
                        <div style={{
                            width: 140, height: 140, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="52" cy="82" rx="30" ry="5" fill="rgba(0,0,0,0.18)" />
                                <path d="M52 22 L20 30 L20 74 L52 70 Z" fill="#5B52CC" />
                                <path d="M52 24 L22 31 L22 72 L52 68 Z" fill="#FAFAFA" />
                                <line x1="27" y1="41" x2="48" y2="39" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <line x1="27" y1="47" x2="48" y2="45" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <line x1="27" y1="53" x2="48" y2="51" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <line x1="27" y1="59" x2="42" y2="57" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <rect x="27" y="33" width="18" height="4" rx="2" fill="#F5B800" opacity="0.85" />
                                <path d="M52 22 L84 30 L84 74 L52 70 Z" fill="#4A42B8" />
                                <path d="M52 24 L82 31 L82 72 L52 68 Z" fill="#F3F3F8" />
                                <line x1="56" y1="41" x2="77" y2="43" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <line x1="56" y1="47" x2="77" y2="49" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <line x1="56" y1="53" x2="77" y2="55" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <line x1="56" y1="59" x2="70" y2="61" stroke="#C5C0F0" strokeWidth="1.8" strokeLinecap="round" />
                                <rect x="56" y="33" width="16" height="4" rx="2" fill="#a89cf8" opacity="0.8" />
                                <path d="M52 22 L52 70" stroke="#3D36A0" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M20 74 L52 70 L52 76 L20 80 Z" fill="#4A42B8" />
                                <path d="M84 74 L52 70 L52 76 L84 80 Z" fill="#3D36A0" />
                                <path d="M72 22 L72 44 L68 41 L64 44 L64 22 Z" fill="#F5B800" />
                                <text x="6" y="28" fontSize="12" fill="white" opacity="0.85">✦</text>
                                <text x="86" y="22" fontSize="9" fill="white" opacity="0.65">✦</text>
                                <text x="10" y="60" fontSize="7" fill="white" opacity="0.5">•</text>
                                <text x="89" y="58" fontSize="7" fill="white" opacity="0.45">•</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORM */}
            <div className="lp-card" style={{
                width: '100%',
                maxWidth: 420,
                padding: '28px 24px 0',
                flex: 1,
            }}>
                <form onSubmit={formik.handleSubmit} autoComplete="off">
                    <div style={{ marginBottom: 16 }}>
                        <label className="lp-label">Username</label>
                        <input
                            className={`lp-input ${formik.touched.username && formik.errors.username ? 'has-error' : ''}`}
                            name="username"
                            placeholder="your@email.com"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.username}
                            autoComplete="off"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                        {formik.touched.username && formik.errors.username && (
                            <div className="lp-err">{formik.errors.username}</div>
                        )}
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <label className="lp-label">Password</label>
                        <div className="pw-wrap">
                            <input
                                className={`lp-input ${formik.touched.password && formik.errors.password ? 'has-error' : ''}`}
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.password}
                                autoComplete="new-password"
                                style={{ paddingRight: 48 }}
                            />
                            <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)}>
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <div className="lp-err">{formik.errors.password}</div>
                        )}
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: 24 }}>
                        <button
                            type="button"
                            onClick={() => message('Feature coming soon!', 'info')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6C63E0', fontFamily: '"Nunito",sans-serif', fontWeight: 700, padding: 0 }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button type="submit" className="lp-btn-main" disabled={!formik.isValid || formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                                Signing in...
                            </span>
                        ) : 'Log In'}
                    </button>
                </form>

                <div className="lp-divider"><span>Or</span></div>

                {/* FIX: Call handleGoogleLogin() directly — no arrow wrapper needed */}
                <button
                    type="button"
                    className="lp-google-btn"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                >
                    {googleLoading ? (
                        <span style={{ width: 18, height: 18, border: '2.5px solid #e8e8f0', borderTop: '2.5px solid #6C63E0', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                    )}
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </button>

                <div style={{ height: 32 }} />
            </div>

            {/* Footer */}
            <div className="lp-footer" style={{ paddingBottom: 36, textAlign: 'center' }}>
                <p style={{ color: '#b0b0c0', fontSize: 14, fontFamily: '"Nunito",sans-serif', fontWeight: 600, margin: 0 }}>
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/signup')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F5B800', fontWeight: 800, fontSize: 14, fontFamily: '"Nunito",sans-serif', padding: 0 }}
                    >
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
}