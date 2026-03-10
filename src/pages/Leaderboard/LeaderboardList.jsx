// src/pages/Leaderboard/LeaderboardList.jsx
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { useUser } from '../../hooks/UserProvider';
import LeaderboardDAO from '../../daos/LeaderboardDao';

// ─── helpers ──────────────────────────────────────────────────────────────────
const PALETTE = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#6366f1','#14b8a6'];
const avatarColor = (i) => PALETTE[i % PALETTE.length];
const getInitials = (n) => (n ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// ─── SVG: Trophy Illustration ─────────────────────────────────────────────────
function TrophyIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* glow */}
      <ellipse cx="110" cy="170" rx="60" ry="12" fill="url(#glowGrad)" opacity="0.35"/>
      {/* pedestal */}
      <rect x="70" y="155" width="80" height="12" rx="6" fill="#e2d9f3"/>
      <rect x="82" y="143" width="56" height="16" rx="5" fill="#c4b5fd"/>
      {/* cup body */}
      <path d="M78 60 Q68 90 75 118 Q88 138 110 142 Q132 138 145 118 Q152 90 142 60 Z" fill="url(#cupGrad)"/>
      {/* cup shine */}
      <path d="M88 68 Q83 92 88 112 Q95 128 108 133" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeLinecap="round"/>
      {/* handles */}
      <path d="M78 75 Q52 80 55 105 Q57 122 78 120" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M142 75 Q168 80 165 105 Q163 122 142 120" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* star on cup */}
      <path d="M110 82 L113.5 92.5 L124 92.5 L115.5 98.8 L118.8 109.5 L110 103 L101.2 109.5 L104.5 98.8 L96 92.5 L106.5 92.5 Z" fill="white" opacity="0.9"/>
      {/* floating stars */}
      <circle cx="55" cy="48" r="3" fill="#fbbf24" opacity="0.7"/>
      <circle cx="165" cy="38" r="2" fill="#a78bfa" opacity="0.7"/>
      <circle cx="40" cy="90" r="2" fill="#f9a8d4" opacity="0.6"/>
      <circle cx="178" cy="80" r="3" fill="#6ee7b7" opacity="0.6"/>
      <path d="M148 22 L149.8 27.4 L155.5 27.4 L151 30.6 L152.8 36 L148 32.8 L143.2 36 L145 30.6 L140.5 27.4 L146.2 27.4 Z" fill="#fbbf24" opacity="0.8"/>
      <path d="M62 30 L63.4 34.2 L67.8 34.2 L64.4 36.7 L65.7 41 L62 38.4 L58.3 41 L59.6 36.7 L56.2 34.2 L60.6 34.2 Z" fill="#c4b5fd" opacity="0.7"/>
      {/* lines/confetti */}
      <line x1="30" y1="60" x2="38" y2="60" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round"/>
      <line x1="182" y1="55" x2="190" y2="55" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"/>
      <line x1="25" y1="120" x2="30" y2="115" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="cupGrad" x1="78" y1="60" x2="142" y2="142" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── SVG: Medal icons ─────────────────────────────────────────────────────────
function MedalIcon({ rank }) {
  const configs = {
    1: { outer: '#fbbf24', inner: '#f59e0b', ribbon1: '#fde68a', ribbon2: '#fbbf24', label: '1' },
    2: { outer: '#9ca3af', inner: '#6b7280', ribbon1: '#e5e7eb', ribbon2: '#d1d5db', label: '2' },
    3: { outer: '#d97706', inner: '#b45309', ribbon1: '#fde68a', ribbon2: '#fcd34d', label: '3' },
  };
  const c = configs[rank];
  if (!c) return null;
  return (
    <svg width="32" height="38" viewBox="0 0 32 38" fill="none">
      <path d="M10 0 L14 10 H18 L22 0 Z" fill={c.ribbon1}/>
      <path d="M14 0 H18 L20 8 H12 Z" fill={c.ribbon2}/>
      <circle cx="16" cy="24" r="12" fill={c.outer}/>
      <circle cx="16" cy="24" r="9" fill={c.inner}/>
      <text x="16" y="29" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif">{c.label}</text>
    </svg>
  );
}

// ─── SVG: Crown ───────────────────────────────────────────────────────────────
function CrownIcon({ size = 20 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none">
      <path d="M2 26 L6 10 L14 18 L20 2 L26 18 L34 10 L38 26 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="2" cy="26" r="2.5" fill="#fbbf24"/>
      <circle cx="38" cy="26" r="2.5" fill="#fbbf24"/>
      <circle cx="20" cy="2" r="2.5" fill="#fbbf24"/>
      <rect x="2" y="24" width="36" height="4" rx="2" fill="#f59e0b"/>
    </svg>
  );
}

// ─── SVG: Star rating ─────────────────────────────────────────────────────────
function StarRating({ points, max }) {
  const pct = Math.min(points / max, 1);
  const filled = Math.round(pct * 5);
  return (
    <Box sx={{ display: 'flex', gap: 0.3 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 1 L6.2 3.8 L9.5 4.1 L7.2 6.2 L7.9 9.5 L5 8 L2.1 9.5 L2.8 6.2 L0.5 4.1 L3.8 3.8 Z"
            fill={i < filled ? '#fbbf24' : '#e5e7eb'}/>
        </svg>
      ))}
    </Box>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function RankRow({ entry, index, isCurrentUser, maxPoints }) {
  const isTop3 = entry.rank <= 3;
  const barWidth = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '44px 46px 1fr auto',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: '14px',
        bgcolor: isCurrentUser
          ? 'linear-gradient(135deg,#faf5ff,#ede9fe)'
          : isTop3
          ? '#fafafa'
          : '#fff',
        background: isCurrentUser
          ? 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)'
          : undefined,
        border: isCurrentUser
          ? '1.5px solid #c4b5fd'
          : '1px solid #f1f5f9',
        boxShadow: isTop3 ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
        transition: 'transform .15s, box-shadow .15s',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* progress bar bg */}
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${barWidth}%`,
        bgcolor: isCurrentUser ? 'rgba(124,58,237,0.05)' : 'rgba(0,0,0,0.02)',
        borderRadius: '14px',
        pointerEvents: 'none',
      }}/>

      {/* rank / medal */}
      <Box sx={{ display: 'flex', justifyContent: 'center', zIndex: 1 }}>
        {isTop3
          ? <MedalIcon rank={entry.rank} />
          : (
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              bgcolor: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: '"DM Mono", monospace' }}>
                {entry.rank}
              </Typography>
            </Box>
          )
        }
      </Box>

      {/* avatar */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Avatar sx={{
          width: 40, height: 40,
          bgcolor: avatarColor(index),
          fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          {getInitials(entry.fullName || entry.username)}
        </Avatar>
        {entry.rank === 1 && (
          <Box sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }}>
            <CrownIcon size={18} />
          </Box>
        )}
      </Box>

      {/* info */}
      <Box sx={{ zIndex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{
            fontSize: 14, fontWeight: 600, color: '#0f172a',
            fontFamily: '"Outfit", sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {entry.fullName || entry.username}
          </Typography>
          {isCurrentUser && (
            <Box sx={{
              px: 1, py: 0.2, borderRadius: '99px',
              bgcolor: '#7c3aed', color: '#fff',
              fontSize: 10, fontWeight: 700, lineHeight: 1.6,
              letterSpacing: '0.05em', flexShrink: 0,
            }}>
              YOU
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
          <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: '"DM Mono", monospace' }}>
            {entry.groups?.join(' · ') || '—'}
          </Typography>
          <StarRating points={entry.total_points} max={maxPoints} />
        </Box>
      </Box>

      {/* points */}
      <Box sx={{ textAlign: 'right', zIndex: 1 }}>
        <Typography sx={{
          fontSize: 15, fontWeight: 800, color: '#0f172a',
          fontFamily: '"DM Mono", monospace',
          letterSpacing: '-0.02em',
        }}>
          {entry.total_points.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          pts · {entry.entry_count} entries
        </Typography>
      </Box>
    </Box>
  );
}

// ─── User Stats Panel ─────────────────────────────────────────────────────────
function UserStatsPanel({ currentUser, entries }) {
  const myEntry = entries.find((e) => e.username === currentUser?.username);
  const rankLabel = myEntry
    ? `${myEntry.rank}${['st','nd','rd'][myEntry.rank - 1] || 'th'}`
    : '—';

  const stats = [
    { label: 'Ranking',  value: rankLabel,                     accent: '#7c3aed' },
    { label: 'Group',    value: myEntry?.groups?.[0] ?? '—',   accent: '#06b6d4' },
    { label: 'Entries',  value: myEntry?.entry_count ?? '—',   accent: '#f97316' },
    { label: 'Points',   value: myEntry?.total_points ?? '—',  accent: '#10b981' },
  ];

  return (
    <Box sx={{
      bgcolor: '#fff',
      borderRadius: '20px',
      border: '1px solid #f1f5f9',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      position: 'sticky',
      top: 24,
    }}>
      {/* header strip */}
      <Box sx={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        p: 3, pb: 5,
        textAlign: 'center',
      }}>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          Your Profile
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: '"Outfit", sans-serif' }}>
          {currentUser?.fullName || currentUser?.username || 'Guest'}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>
          {currentUser?.email || ''}
        </Typography>
      </Box>

      {/* avatar overlapping */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: -4, mb: 2 }}>
        <Avatar sx={{
          width: 72, height: 72,
          bgcolor: '#fff',
          border: '4px solid #fff',
          boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
          color: '#7c3aed',
          fontSize: 22, fontWeight: 800,
          fontFamily: '"Outfit", sans-serif',
        }}>
          {getInitials(currentUser?.fullName || currentUser?.username)}
        </Avatar>
      </Box>

      {/* stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, px: 2.5, pb: 2.5 }}>
        {stats.map((s) => (
          <Box key={s.label} sx={{
            bgcolor: '#f8fafc',
            borderRadius: '12px',
            p: 1.5,
            textAlign: 'center',
            border: '1px solid #f1f5f9',
          }}>
            <Box sx={{ width: 3, height: 20, bgcolor: s.accent, borderRadius: '99px', mx: 'auto', mb: 0.8 }}/>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>
              {s.value}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LeaderboardList() {
  const { user } = useUser();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('global');

  // Tab grup diambil dari grup milik user sendiri, bukan dari data leaderboard
  const userGroups = user?.groups ?? [];
  const displayed  = entries;
  const maxPoints  = entries[0]?.total_points || 1;

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetch = filter === 'global'
      ? LeaderboardDAO.getGlobalLeaderboard()
      : LeaderboardDAO.getGroupLeaderboard(filter);

    fetch
      .then((res) => setEntries(res.data ?? []))
      .catch((err) => { console.error(err); setError('Gagal memuat leaderboard.'); })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', fontFamily: '"Outfit", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Hero ── */}
      <Box sx={{
        background: 'linear-gradient(160deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%)',
        borderBottom: '1px solid #f1f5f9',
        px: { xs: 3, md: 6 },
        pt: 5, pb: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {/* text */}
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#7c3aed', mb: 1,
          }}>
            Season Rankings
          </Typography>
          <Typography sx={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: { xs: 32, md: 42 },
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            mb: 1.5,
          }}>
            Leaderboard
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#64748b', maxWidth: 380, lineHeight: 1.7 }}>
            Compete, earn points, and rise through the ranks. Top performers each month earn exclusive rewards.
          </Typography>

          {/* filter pills */}
          <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
            {['global', ...userGroups].map((g) => (
              <Box
                key={g}
                onClick={() => setFilter(g)}
                sx={{
                  px: 2.5, py: 0.7,
                  borderRadius: '99px',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all .15s',
                  bgcolor: filter === g ? '#7c3aed' : '#fff',
                  color: filter === g ? '#fff' : '#64748b',
                  border: filter === g ? '1.5px solid #7c3aed' : '1.5px solid #e2e8f0',
                  boxShadow: filter === g ? '0 2px 12px rgba(124,58,237,0.25)' : 'none',
                  '&:hover': { borderColor: '#7c3aed', color: filter === g ? '#fff' : '#7c3aed' },
                  textTransform: 'capitalize',
                }}
              >
                {g === 'global' ? 'Global' : g}
              </Box>
            ))}
          </Box>
        </Box>

        {/* illustration */}
        <Box sx={{ flexShrink: 0, opacity: 0.95 }}>
          <TrophyIllustration />
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' },
        gap: 3,
        p: { xs: 2, md: 4 },
        maxWidth: 1100,
        mx: 'auto',
      }}>
        {/* list */}
        <Box sx={{
          bgcolor: '#fff',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
          p: 2,
        }}>
          {/* column header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '44px 46px 1fr auto', gap: 1.5, px: 2, mb: 1 }}>
            {['Rank','','Player','Points'].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: i === 3 ? 'right' : 'left' }}>
                {h}
              </Typography>
            ))}
          </Box>

          <Box sx={{ width: '100%', height: '1px', bgcolor: '#f1f5f9', mb: 1.5 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={32} sx={{ color: '#7c3aed' }} />
            </Box>
          ) : error ? (
            <Typography sx={{ color: '#ef4444', textAlign: 'center', py: 8, fontSize: 13 }}>{error}</Typography>
          ) : displayed.length === 0 ? (
            <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 8, fontSize: 14 }}>Belum ada data.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {displayed.map((entry, i) => (
                <RankRow
                  key={`${entry.username}-${entry.rank}`}
                  entry={entry}
                  index={i}
                  isCurrentUser={entry.username === user?.username}
                  maxPoints={maxPoints}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* stats panel */}
        <UserStatsPanel currentUser={user} entries={entries} />
      </Box>
    </Box>
  );
}