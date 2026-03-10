// src/pages/Leaderboard/LeaderboardList.jsx
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { useUser } from '../../hooks/UserProvider';
import LeaderboardDAO from '../../daos/LeaderboardDao';

const PALETTE = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#6366f1','#14b8a6'];
const avatarColor = (i) => PALETTE[i % PALETTE.length];
const getInitials = (n) => (n ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  const gold   = { bg: '#FEF9EC', color: '#D97706', border: '#FDE68A' };
  const silver = { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  const bronze = { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' };
  const plain  = { bg: '#F8FAFC', color: '#94A3B8', border: '#F1F5F9' };

  const style = rank === 1 ? gold : rank === 2 ? silver : rank === 3 ? bronze : plain;

  return (
    <Box sx={{
      width: 28, height: 28, borderRadius: '8px',
      bgcolor: style.bg,
      border: `1.5px solid ${style.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: style.color, fontFamily: '"DM Mono", monospace' }}>
        {rank}
      </Typography>
    </Box>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function RankRow({ entry, index, isCurrentUser, maxPoints }) {
  const barWidth = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      px: 2.5,
      py: 1.5,
      borderRadius: '14px',
      position: 'relative',
      overflow: 'hidden',
      border: isCurrentUser ? '1.5px solid #C4B5FD' : '1.5px solid transparent',
      bgcolor: isCurrentUser ? '#FAFAFF' : '#fff',
      transition: 'all 0.15s',
      '&:hover': {
        bgcolor: '#FAFAFF',
        border: '1.5px solid #EDE9FE',
      },
    }}>
      {/* subtle progress bar */}
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${barWidth}%`,
        bgcolor: isCurrentUser ? 'rgba(124,58,237,0.04)' : 'rgba(148,163,184,0.04)',
        borderRadius: '14px',
        pointerEvents: 'none',
      }}/>

      <RankBadge rank={entry.rank} />

      <Avatar sx={{
        width: 36, height: 36,
        bgcolor: avatarColor(index),
        fontSize: 12, fontWeight: 700,
        flexShrink: 0,
      }}>
        {getInitials(entry.fullName || entry.username)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{
            fontSize: 14, fontWeight: 600, color: '#0F172A',
            fontFamily: '"Nunito", sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {entry.fullName || entry.username}
          </Typography>
          {isCurrentUser && (
            <Box sx={{
              px: 1, py: 0.1, borderRadius: '6px',
              bgcolor: '#7C3AED', color: '#fff',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
              flexShrink: 0,
            }}>
              YOU
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.2, fontFamily: '"DM Mono", monospace' }}>
          {entry.groups?.join(' · ') || '—'} · {entry.entry_count} entries
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{
          fontSize: 15, fontWeight: 800, color: '#0F172A',
          fontFamily: '"DM Mono", monospace', letterSpacing: '-0.02em',
        }}>
          {entry.total_points.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          pts
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function UserStatsPanel({ currentUser, entries }) {
  const myEntry = entries.find((e) => e.username === currentUser?.username);
  const suffix = (r) => ['st','nd','rd'][r - 1] || 'th';
  const rankLabel = myEntry ? `${myEntry.rank}${suffix(myEntry.rank)}` : '—';

  const stats = [
    { label: 'Rank',    value: rankLabel,                    color: '#7C3AED' },
    { label: 'Points',  value: myEntry?.total_points ?? '—', color: '#10B981' },
    { label: 'Entries', value: myEntry?.entry_count   ?? '—',color: '#F97316' },
    { label: 'Group',   value: myEntry?.groups?.[0]   ?? '—',color: '#06B6D4' },
  ];

  return (
    <Box sx={{
      bgcolor: '#fff',
      borderRadius: '20px',
      border: '1.5px solid #F1F5F9',
      overflow: 'hidden',
      position: 'sticky',
      top: 24,
    }}>
      {/* header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
        px: 3, pt: 3, pb: 5,
        textAlign: 'center',
      }}>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          Your Stats
        </Typography>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: '"Nunito", sans-serif' }}>
          {currentUser?.fullName || currentUser?.username || 'Guest'}
        </Typography>
      </Box>

      {/* avatar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: -4, mb: 2.5 }}>
        <Avatar sx={{
          width: 64, height: 64,
          bgcolor: '#7C3AED',
          border: '4px solid #fff',
          fontSize: 20, fontWeight: 800,
          fontFamily: '"Nunito", sans-serif',
          boxShadow: '0 4px 16px rgba(124,58,237,0.2)',
        }}>
          {getInitials(currentUser?.fullName || currentUser?.username)}
        </Avatar>
      </Box>

      {/* stats grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, px: 2.5, pb: 3 }}>
        {stats.map((s) => (
          <Box key={s.label} sx={{
            bgcolor: '#F8FAFC',
            borderRadius: '12px',
            p: 1.5,
            textAlign: 'center',
            border: '1px solid #F1F5F9',
          }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>
              {s.value}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#94A3B8', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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

  const userGroups = user?.groups ?? [];
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <Box sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #F1F5F9',
        px: { xs: 3, md: 5 },
        py: 3,
      }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 700, color: '#7C3AED',
          letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5,
        }}>
          Season Rankings
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography sx={{
            fontFamily: '"Nunito", sans-serif',
            fontSize: { xs: 26, md: 32 },
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            Leaderboard
          </Typography>

          {/* filter pills */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['global', ...userGroups].map((g) => (
              <Box
                key={g}
                onClick={() => setFilter(g)}
                sx={{
                  px: 2, py: 0.6,
                  borderRadius: '99px',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', userSelect: 'none',
                  transition: 'all .15s',
                  bgcolor: filter === g ? '#7C3AED' : 'transparent',
                  color:   filter === g ? '#fff' : '#94A3B8',
                  border:  filter === g ? '1.5px solid #7C3AED' : '1.5px solid #E2E8F0',
                  textTransform: 'capitalize',
                  '&:hover': { borderColor: '#7C3AED', color: filter === g ? '#fff' : '#7C3AED' },
                }}
              >
                {g === 'global' ? 'Global' : g}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 260px' },
        gap: 3,
        p: { xs: 2, md: 4 },
        maxWidth: 1060,
        mx: 'auto',
      }}>
        {/* list card */}
        <Box sx={{
          bgcolor: '#fff',
          borderRadius: '20px',
          border: '1.5px solid #F1F5F9',
          p: { xs: 1.5, md: 2 },
        }}>
          {/* column headers */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, mb: 1.5, gap: 2 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', width: 28 }}>
              #
            </Typography>
            <Box sx={{ width: 36 }} />
            <Typography sx={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Player
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Points
            </Typography>
          </Box>

          <Box sx={{ height: '1px', bgcolor: '#F1F5F9', mx: 2, mb: 1.5 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={28} sx={{ color: '#7C3AED' }} />
            </Box>
          ) : error ? (
            <Typography sx={{ color: '#EF4444', textAlign: 'center', py: 8, fontSize: 13 }}>{error}</Typography>
          ) : entries.length === 0 ? (
            <Typography sx={{ color: '#94A3B8', textAlign: 'center', py: 8, fontSize: 14 }}>Belum ada data.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {entries.map((entry, i) => (
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