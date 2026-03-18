import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import GroupDAO from '../../daos/GroupDao';
import UserDAO from '../../daos/UserDAO';

const GROUP_COLORS = ['#6366f1','#0ea5e9','#f97316','#10b981','#ec4899','#8b5cf6','#14b8a6','#f59e0b'];
const groupColor = (name = '') => GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length];

export default function OnboardingPage() {
    const { user, login, isLoading } = useUser();
    const loading  = useLoading();
    const message  = useAlert();
    const navigate = useNavigate();

    const [groups, setGroups]               = useState([]);
    const [selected, setSelected]           = useState(''); // single select — string, bukan array
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [submitting, setSubmitting]       = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!user) { navigate('/login', { replace: true }); return; }
        const flag = localStorage.getItem('needsOnboarding');
        if (!flag && user.groups?.length > 0) navigate('/journal', { replace: true });
    }, [user, isLoading]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingGroups(true);
                const res    = await GroupDAO.listGroups();
                const raw    = res?.groups ?? res?.data ?? [];
                const active = raw.filter((g) => g.isActive !== false);
                setGroups(active);
            } catch {
                message('Gagal memuat grup', 'warning');
            } finally {
                setLoadingGroups(false);
            }
        };
        load();
    }, []);

    // Single select — toggle sama id = deselect
    const toggle = (id) => {
        setSelected((prev) => prev === id ? '' : id);
    };

    const handleSubmit = async () => {
        if (!selected) { message('Pilih 1 grup dulu', 'error'); return; }
        try {
            loading.start();
            setSubmitting(true);
            const res = await UserDAO.updateGroups(user.username, [selected]);
            if (!res.success) throw new Error(res.error || 'Gagal menyimpan grup');
            localStorage.removeItem('needsOnboarding');
            login({ ...user, groups: [selected] });
            message('Selamat datang! 🎉', 'success');
            navigate('/journal', { replace: true });
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
            setSubmitting(false);
        } finally {
            loading.stop();
        }
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
            minHeight: '100vh', background: '#f7f7fb',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            fontFamily: '"Nunito", sans-serif', overflowX: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes floatIllo { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-10px);} }
                @keyframes blobPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
                @keyframes pulse   { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
                * { box-sizing: border-box; }
                .ob-hero   { animation: fadeUp 0.5s ease both; }
                .ob-card   { animation: fadeUp 0.5s 0.15s ease both; }
                .ob-footer { animation: fadeUp 0.5s 0.3s ease both; }
                .ob-btn {
                    width: 100%; padding: 15px; border-radius: 50px; border: none;
                    background: #F5B800; color: #fff; font-size: 16px; font-weight: 800;
                    font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.2s;
                    box-shadow: 0 6px 20px rgba(245,184,0,0.4);
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .ob-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(245,184,0,0.5); background: #e6ac00; }
                .ob-btn:active:not(:disabled) { transform: translateY(0); }
                .ob-btn:disabled { opacity: 0.5; cursor: default; transform: none; }
                .gchip {
                    padding: 12px 14px; border-radius: 14px; cursor: pointer;
                    transition: all 0.18s; border: 1.5px solid #e8e8f0; background: #fff;
                    display: flex; align-items: center; gap: 10px; user-select: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .gchip:hover { border-color: #6C63E0; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(108,99,224,0.12); }
                .gchip.on {
                    border-color: var(--c);
                    background: color-mix(in srgb, var(--c) 8%, #fff);
                    box-shadow: 0 4px 14px color-mix(in srgb, var(--c) 20%, transparent);
                }
                .skel { background: #ececf4; border-radius: 14px; animation: pulse 1.5s ease-in-out infinite; }
            `}</style>

            {/* TOP HERO */}
            <div className="ob-hero" style={{
                width: '100%',
                background: 'linear-gradient(160deg, #6C63E0 0%, #8B80F8 60%, #a89cf8 100%)',
                borderRadius: '0 0 40px 40px', paddingTop: 44, paddingBottom: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', animation: 'blobPulse 5s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: 0, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'blobPulse 7s ease-in-out infinite' }} />

                <div style={{ animation: 'floatIllo 4s ease-in-out infinite' }}>
                    <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="86" height="86" viewBox="0 0 86 86" fill="none">
                                <circle cx="43" cy="28" r="11" fill="#FFD580"/>
                                <path d="M25 62 C25 50 34 44 43 44 C52 44 61 50 61 62 Z" fill="#FFD580"/>
                                <circle cx="20" cy="32" r="8" fill="rgba(255,255,255,0.7)"/>
                                <path d="M6 62 C6 53 12 48 20 48 C28 48 34 53 34 62 Z" fill="rgba(255,255,255,0.5)"/>
                                <circle cx="66" cy="32" r="8" fill="rgba(255,255,255,0.7)"/>
                                <path d="M52 62 C52 53 58 48 66 48 C74 48 80 53 80 62 Z" fill="rgba(255,255,255,0.5)"/>
                                <line x1="28" y1="40" x2="36" y2="44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                                <line x1="58" y1="40" x2="50" y2="44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                                <text x="36" y="16" fontSize="9" fill="white" opacity="0.8">✦</text>
                                <text x="52" y="13" fontSize="7" fill="white" opacity="0.6">✦</text>
                            </svg>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', paddingBottom: 22, marginTop: 8 }}>
                    <h1 style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', margin: '0 0 5px', letterSpacing: '-0.02em' }}>
                        Pilih Grupmu
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                        Hai, <strong style={{ color: '#fff' }}>{user?.fullName || user?.username}</strong>! 👋 Pilih 1 grup yang ingin kamu ikuti
                    </p>
                </div>
            </div>

            {/* FORM CARD */}
            <div className="ob-card" style={{ width: '100%', maxWidth: 420, padding: '24px 24px 0', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Grup tersedia
                    </span>
                    {selected && (
                        <span style={{
                            fontSize: 12, fontWeight: 800, color: '#6C63E0',
                            background: 'rgba(108,99,224,0.1)', border: '1.5px solid rgba(108,99,224,0.2)',
                            borderRadius: 99, padding: '3px 12px', fontFamily: '"Nunito",sans-serif',
                        }}>
                            1 dipilih
                        </span>
                    )}
                </div>

                {loadingGroups ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                        {[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height: 56 }} />)}
                    </div>
                ) : groups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#b0b0c0', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
                        Belum ada grup tersedia.<br/>Hubungi admin.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
                        {groups.map((g) => {
                            const color = groupColor(g.name);
                            const isOn  = selected === g.id;
                            return (
                                <div key={g.id} className={`gchip${isOn ? ' on' : ''}`} style={{ '--c': color }} onClick={() => toggle(g.id)}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                        background: `${color}18`, border: `1.5px solid ${color}44`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: '"Nunito",sans-serif' }}>
                                            {g.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: isOn ? 800 : 600, color: isOn ? '#1a1a2e' : '#8888a0', fontFamily: '"Nunito",sans-serif', flex: 1, lineHeight: 1.3 }}>
                                        {g.name}
                                    </span>
                                    {isOn && (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="9" height="9" viewBox="0 0 10 10">
                                                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <button className="ob-btn" onClick={handleSubmit} disabled={!selected || submitting}>
                    {submitting ? (
                        <>
                            <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            Mulai Jurnal
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </>
                    )}
                </button>
                <div style={{ height: 28 }} />
            </div>

            <div className="ob-footer" style={{ paddingBottom: 36, textAlign: 'center' }}>
                <p style={{ color: '#c0c0d0', fontSize: 12, fontFamily: '"Nunito",sans-serif', fontWeight: 600, margin: 0 }}>
                    Kamu bisa ganti grup kapan saja melalui pengaturan profil
                </p>
            </div>
        </div>
    );
}