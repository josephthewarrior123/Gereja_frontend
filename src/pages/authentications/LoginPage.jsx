import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import UserDAO from '../../daos/UserDAO';

export default function LoginPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !isLoading) {
            if (localStorage.getItem('needsOnboarding')) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
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
        };
        login(userData);

        // Kalau Google login & groups kosong → onboarding
        if (isGoogle && userData.groups.length === 0) {
            localStorage.setItem('needsOnboarding', '1'); navigate('/onboarding', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
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

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                loading.start();
                const result = await UserDAO.loginGoogle(tokenResponse.access_token);
                applyLoginResult(result, true);
                message('Welcome!', 'success');
            } catch (error) {
                message(error.message || 'Google login gagal', 'error');
            } finally {
                loading.stop();
            }
        },
        onError: () => message('Google login dibatalkan', 'warning'),
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0f' }}>
                <div style={{ width: 36, height: 36, border: '2px solid #ffffff20', borderTop: '2px solid #a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px', fontFamily: '"DM Sans", sans-serif',
            position: 'relative', overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
                @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.05);} }
                @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,30px) scale(1.08);} }
                @keyframes floatC { 0%,100%{transform:translate(0,0);} 50%{transform:translate(15px,15px);} }
                .login-card  { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
                .login-hdr   { animation: fadeUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
                .login-form  { animation: fadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both; }
                .orb-a { position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;width:400px;height:400px;top:-100px;left:-100px;background:radial-gradient(circle,#6d28d960 0%,transparent 70%);animation:floatA 8s ease-in-out infinite; }
                .orb-b { position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;width:350px;height:350px;bottom:-80px;right:-80px;background:radial-gradient(circle,#1d4ed840 0%,transparent 70%);animation:floatB 10s ease-in-out infinite; }
                .orb-c { position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;width:200px;height:200px;top:40%;right:20%;background:radial-gradient(circle,#ec489920 0%,transparent 70%);animation:floatC 6s ease-in-out infinite; }
                .grid-bg { position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%); }
                .ci { width:100%;padding:13px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#f1f5f9;font-size:14px;font-family:"DM Sans",sans-serif;outline:none;transition:all 0.2s;box-sizing:border-box; }
                .ci::placeholder { color:rgba(255,255,255,0.25); }
                .ci:focus { border-color:rgba(167,139,250,0.5);background:rgba(167,139,250,0.06);box-shadow:0 0 0 3px rgba(167,139,250,0.1); }
                .btn-p { width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-size:15px;font-weight:700;font-family:"DM Sans",sans-serif;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 24px rgba(124,58,237,0.4); }
                .btn-p:hover { transform:translateY(-1px);box-shadow:0 8px 32px rgba(124,58,237,0.55); }
                .btn-p:active { transform:translateY(0); }
                .btn-p:disabled { opacity:0.5;cursor:default;transform:none; }
                .btn-g { width:100%;padding:13px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#e2e8f0;font-size:14px;font-weight:600;font-family:"DM Sans",sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s; }
                .btn-g:hover { background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.18);transform:translateY(-1px); }
                .fl { display:flex;align-items:center;gap:12px;margin:20px 0; }
                .fl::before,.fl::after { content:'';flex:1;height:1px;background:rgba(255,255,255,0.08); }
                .fl span { font-size:12px;color:rgba(255,255,255,0.25);font-family:"DM Sans",sans-serif;letter-spacing:0.08em;white-space:nowrap; }
                .fl-label { display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,0.45);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;font-family:"DM Sans",sans-serif; }
                .fl-err { font-size:11px;color:#f87171;margin-top:5px; }
                .badge { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;border:1px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.08);font-size:11px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:0.1em;font-family:"DM Sans",sans-serif;margin-bottom:20px; }
            `}</style>

            <div className="orb-a" /><div className="orb-b" /><div className="orb-c" />
            <div className="grid-bg" />

            <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
                <div className="login-hdr" style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9a12.02 12.02 0 00-.382-3.016A11.955 11.955 0 0112 2.944z" fill="white" />
                        </svg>
                    </div>
                    <div className="badge"><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />Member Portal</div>
                    <h1 style={{ fontFamily: '"Syne",sans-serif', fontWeight: 800, fontSize: 36, color: '#f8fafc', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                        Welcome<br />
                        <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>back.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0, fontFamily: '"DM Sans",sans-serif' }}>Sign in to access your journal</p>
                </div>

                <div className="login-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                    <form className="login-form" onSubmit={formik.handleSubmit}>
                        <div style={{ marginBottom: 18 }}>
                            <label className="fl-label">Username</label>
                            <input className="ci" name="username" placeholder="Enter your username" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.username} autoComplete="username" />
                            {formik.touched.username && formik.errors.username && <div className="fl-err">{formik.errors.username}</div>}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label className="fl-label">Password</label>
                            <input className="ci" name="password" type="password" placeholder="Enter your password" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.password} autoComplete="current-password" />
                            {formik.touched.password && formik.errors.password && <div className="fl-err">{formik.errors.password}</div>}
                        </div>
                        <div style={{ textAlign: 'right', marginBottom: 22 }}>
                            <button type="button" onClick={() => message('Feature coming soon!', 'info')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#a78bfa', fontFamily: '"DM Sans",sans-serif', fontWeight: 600, padding: 0 }}>Forgot password?</button>
                        </div>
                        <button type="submit" className="btn-p" disabled={!formik.isValid || formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span style={{ width: 16, height: 16, border: '2px solid #ffffff40', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="fl"><span>or continue with</span></div>

                    <button type="button" className="btn-g" onClick={() => handleGoogleLogin()}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Continue with Google
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: '"DM Sans",sans-serif', margin: 0 }}>
                        Don't have an account?{' '}
                        <button type="button" onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontWeight: 600, fontSize: 13, fontFamily: '"DM Sans",sans-serif', padding: 0 }}>
                            Create account
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}