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

    const [groups, setGroups]             = useState([]);
    const [selected, setSelected]         = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [submitting, setSubmitting]     = useState(false);

    // ── Guard ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isLoading) return;

        console.log('[Onboarding] user:', user);
        console.log('[Onboarding] needsOnboarding:', localStorage.getItem('needsOnboarding'));
        console.log('[Onboarding] groups:', user?.groups);

        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        // Hanya skip ke journal kalau TIDAK ada flag onboarding
        const flag = localStorage.getItem('needsOnboarding');
        if (!flag && user.groups?.length > 0) {
            navigate('/journal', { replace: true });
        }
    }, [user, isLoading]);

    // ── Load groups ───────────────────────────────────────────────────────────
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

    const toggle = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selected.length === 0) { message('Pilih minimal 1 grup', 'error'); return; }
        try {
            loading.start();
            setSubmitting(true);

            const res = await UserDAO.updateGroups(user.username, selected);
            if (!res.success) throw new Error(res.error || 'Gagal menyimpan grup');

            // Hapus flag & update user di context
            localStorage.removeItem('needsOnboarding');
            login({ ...user, groups: selected });

            message('Selamat datang! 🎉', 'success');
            navigate('/journal', { replace: true });
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
            setSubmitting(false);
        } finally {
            loading.stop();
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px', fontFamily: '"DM Sans", sans-serif',
            position: 'relative', overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
                @keyframes floatA { 0%,100%{transform:translate(0,0);} 50%{transform:translate(30px,-20px);} }
                @keyframes floatB { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-20px,30px);} }
                @keyframes spin   { to{transform:rotate(360deg);} }
                @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
                .ob-hdr  { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
                .ob-card { animation: fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
                .ob-grid { animation: fadeUp 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both; }
                .orb-a { position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;width:400px;height:400px;top:-100px;left:-100px;background:radial-gradient(circle,#6d28d960 0%,transparent 70%);animation:floatA 8s ease-in-out infinite; }
                .orb-b { position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;width:350px;height:350px;bottom:-80px;right:-80px;background:radial-gradient(circle,#1d4ed840 0%,transparent 70%);animation:floatB 10s ease-in-out infinite; }
                .grid-bg { position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%); }
                .gchip { border-radius:14px;padding:16px;cursor:pointer;transition:all 0.2s;border:1.5px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden;user-select:none; }
                .gchip:hover { border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);transform:translateY(-1px); }
                .gchip.on { border-color:var(--c);background:color-mix(in srgb,var(--c) 12%,transparent); }
                .btn-sub { width:100%;padding:15px;border-radius:14px;border:none;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-size:15px;font-weight:700;font-family:"DM Sans",sans-serif;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 24px rgba(124,58,237,0.4); }
                .btn-sub:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 8px 32px rgba(124,58,237,0.55); }
                .btn-sub:disabled { opacity:0.4;cursor:default;transform:none; }
                .skel { background:rgba(255,255,255,0.06);border-radius:14px;animation:pulse 1.5s ease-in-out infinite; }
            `}</style>

            <div className="orb-a"/><div className="orb-b"/>
            <div className="grid-bg"/>

            <div style={{ width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>

                {/* Header */}
                <div className="ob-hdr" style={{ textAlign:'center', marginBottom:32 }}>
                    <div style={{ width:56,height:56,borderRadius:16,margin:'0 auto 20px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(124,58,237,0.45)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 style={{ fontFamily:'"Syne",sans-serif',fontWeight:800,fontSize:32,color:'#f8fafc',margin:'0 0 10px',letterSpacing:'-0.03em',lineHeight:1.1 }}>
                        Pilih{' '}
                        <span style={{ background:'linear-gradient(135deg,#a78bfa,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
                            Grupmu
                        </span>
                    </h1>
                    <p style={{ color:'rgba(255,255,255,0.35)',fontSize:14,margin:0,fontFamily:'"DM Sans",sans-serif',lineHeight:1.6 }}>
                        Hai, <strong style={{ color:'rgba(255,255,255,0.7)' }}>{user?.fullName || user?.username}</strong>! 👋<br/>
                        Pilih grup yang ingin kamu ikuti
                    </p>
                </div>

                {/* Card */}
                <div className="ob-card" style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:24,backdropFilter:'blur(20px)',boxShadow:'0 24px 64px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)' }}>

                    {/* Count bar */}
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
                        <span style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em' }}>
                            Grup tersedia
                        </span>
                        {selected.length > 0 && (
                            <span style={{ fontSize:12,fontWeight:700,color:'#a78bfa',background:'rgba(167,139,250,0.12)',border:'1px solid rgba(167,139,250,0.3)',borderRadius:99,padding:'2px 10px' }}>
                                {selected.length} dipilih
                            </span>
                        )}
                    </div>

                    {/* Grid */}
                    <div className="ob-grid" style={{ marginBottom:24 }}>
                        {loadingGroups ? (
                            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                                {[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height:80 }}/>)}
                            </div>
                        ) : groups.length === 0 ? (
                            <div style={{ textAlign:'center',padding:'32px 0',color:'rgba(255,255,255,0.25)',fontSize:14 }}>
                                Belum ada grup tersedia
                            </div>
                        ) : (
                            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10 }}>
                                {groups.map((g) => {
                                    const color   = groupColor(g.name);
                                    const isOn    = selected.includes(g.id);
                                    return (
                                        <div
                                            key={g.id}
                                            className={`gchip${isOn ? ' on' : ''}`}
                                            style={{ '--c': color }}
                                            onClick={() => toggle(g.id)}
                                        >
                                            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                                                <div style={{ width:32,height:32,borderRadius:10,background:`${color}22`,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px solid ${color}44` }}>
                                                    <span style={{ fontSize:14,fontWeight:800,color,fontFamily:'"Syne",sans-serif' }}>
                                                        {g.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                {isOn && (
                                                    <div style={{ width:20,height:20,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                                        <svg width="10" height="10" viewBox="0 0 10 10">
                                                            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize:13,fontWeight:isOn?700:500,color:isOn?'#f1f5f9':'rgba(255,255,255,0.55)',fontFamily:'"DM Sans",sans-serif',lineHeight:1.3 }}>
                                                {g.name}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button className="btn-sub" onClick={handleSubmit} disabled={selected.length === 0 || submitting}>
                        {submitting ? (
                            <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                                <span style={{ width:16,height:16,border:'2px solid #ffffff40',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/>
                                Menyimpan...
                            </span>
                        ) : (
                            <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                                Mulai Jurnal
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        )}
                    </button>
                </div>

                <div style={{ textAlign:'center',marginTop:16 }}>
                    <p style={{ color:'rgba(255,255,255,0.2)',fontSize:12,fontFamily:'"DM Sans",sans-serif',margin:0 }}>
                        Kamu bisa ganti grup kapan saja melalui pengaturan profil
                    </p>
                </div>

            </div>
        </div>
    );
}