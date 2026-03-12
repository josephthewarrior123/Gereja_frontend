// src/pages/Leaderboard/LeaderboardList.jsx
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '../../hooks/UserProvider';
import LeaderboardDAO from '../../daos/LeaderboardDao';

const PALETTE = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#6366f1','#14b8a6'];
const avatarColor = (i) => PALETTE[i % PALETTE.length];
const getInitials = (n) => (n ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <Box sx={{
        width: 32, height: 32, borderRadius: '10px',
        background: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
        border: '1.5px solid #FCD34D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L9.5 5.5H13.5L10.5 7.8L11.5 12L8 9.8L4.5 12L5.5 7.8L2.5 5.5H6.5L8 1.5Z" fill="#92400E" stroke="#92400E" strokeWidth="0.5" strokeLinejoin="round"/>
        </svg>
      </Box>
    );
  }
  const silver = { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  const bronze = { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' };
  const plain  = { bg: '#F8FAFC', color: '#94A3B8', border: '#F1F5F9' };
  const style = rank === 2 ? silver : rank === 3 ? bronze : plain;
  return (
    <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: style.bg, border: `1.5px solid ${style.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: style.color, fontFamily: '"DM Mono", monospace' }}>{rank}</Typography>
    </Box>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function RankRow({ entry, index, isCurrentUser, maxPoints }) {
  const barWidth = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5,
      borderRadius: '14px', position: 'relative', overflow: 'hidden',
      border: isCurrentUser ? '1.5px solid #BFDBFE' : '1.5px solid transparent',
      bgcolor: isCurrentUser ? '#F0F9FF' : '#fff', transition: 'all 0.15s',
      '&:hover': { bgcolor: '#F0F9FF', border: '1.5px solid #EFF6FF' },
    }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barWidth}%`, bgcolor: isCurrentUser ? 'rgba(124,58,237,0.04)' : 'rgba(148,163,184,0.04)', borderRadius: '14px', pointerEvents: 'none' }}/>
      <RankBadge rank={entry.rank} />
      <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColor(index), fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {getInitials(entry.fullName || entry.username)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: '"Nunito", sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.fullName || entry.username}
          </Typography>
          {isCurrentUser && (
            <Box sx={{ px: 1, py: 0.1, borderRadius: '6px', bgcolor: '#2563EB', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', flexShrink: 0 }}>YOU</Box>
          )}
        </Box>
        <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.2, fontFamily: '"DM Mono", monospace' }}>
          {entry.groups?.join(' · ') || '—'} · {entry.entry_count} entries
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: '"DM Mono", monospace', letterSpacing: '-0.02em' }}>
          {entry.total_points.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</Typography>
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
    { label: 'Rank',    value: rankLabel },
    { label: 'Points',  value: myEntry?.total_points ?? '—' },
    { label: 'Entries', value: myEntry?.entry_count   ?? '—' },
    { label: 'Group',   value: myEntry?.groups?.[0]   ?? '—' },
  ];
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1.5px solid #F1F5F9', overflow: 'hidden', position: 'sticky', top: 24 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)', px: 3, pt: 3, pb: 5, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>Your Stats</Typography>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: '"Nunito", sans-serif' }}>{currentUser?.fullName || currentUser?.username || 'Guest'}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: -4, mb: 2.5 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: '#2563EB', border: '4px solid #fff', fontSize: 20, fontWeight: 800, fontFamily: '"Nunito", sans-serif', boxShadow: '0 4px 16px rgba(124,58,237,0.2)' }}>
          {getInitials(currentUser?.fullName || currentUser?.username)}
        </Avatar>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, px: 2.5, pb: 3 }}>
        {stats.map((s) => (
          <Box key={s.label} sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', p: 1.5, textAlign: 'center', border: '1px solid #F1F5F9' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 10, color: '#94A3B8', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ filter, setFilter, userGroups }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const label = filter === 'global' ? 'Global' : filter;
  return (
    <Box ref={ref} sx={{ position: 'relative' }}>
      <Box onClick={() => setOpen((v) => !v)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.9, borderRadius: '10px', border: '1.5px solid #E2E8F0', bgcolor: '#fff', cursor: 'pointer', userSelect: 'none', transition: 'all .15s', '&:hover': { borderColor: '#2563EB' } }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: filter === 'global' ? '#94A3B8' : '#2563EB', flexShrink: 0 }}/>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: '"Nunito", sans-serif', textTransform: 'capitalize', minWidth: 60 }}>{label}</Typography>
        <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Box>
      </Box>
      {open && (
        <Box sx={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 160, bgcolor: '#fff', borderRadius: '12px', border: '1.5px solid #F1F5F9', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100 }}>
          {userGroups.length > 0 && (
            <>
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>My Groups</Typography>
              </Box>
              {userGroups.map((g) => (
                <Box key={g} onClick={() => { setFilter(g); setOpen(false); }} sx={{ px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: filter === g ? '#EFF6FF' : 'transparent', '&:hover': { bgcolor: '#EFF6FF' }, transition: 'background .1s' }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#2563EB', flexShrink: 0 }}/>
                  <Typography sx={{ fontSize: 13, fontWeight: filter === g ? 700 : 500, color: filter === g ? '#2563EB' : '#334155', fontFamily: '"Nunito", sans-serif', textTransform: 'capitalize' }}>{g}</Typography>
                  {filter === g && <Box sx={{ ml: 'auto' }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></Box>}
                </Box>
              ))}
              <Box sx={{ height: '1px', bgcolor: '#F1F5F9', mx: 2, my: 0.5 }}/>
            </>
          )}
          <Box sx={{ px: 2, pt: userGroups.length > 0 ? 0.5 : 1.5, pb: 0.5 }}>
            <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Overall</Typography>
          </Box>
          <Box onClick={() => { setFilter('global'); setOpen(false); }} sx={{ px: 2, py: 1, mb: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: filter === 'global' ? '#F8FAFC' : 'transparent', '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background .1s' }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#94A3B8', flexShrink: 0 }}/>
            <Typography sx={{ fontSize: 13, fontWeight: filter === 'global' ? 700 : 500, color: filter === 'global' ? '#334155' : '#64748B', fontFamily: '"Nunito", sans-serif' }}>Global</Typography>
            {filter === 'global' && <Box sx={{ ml: 'auto' }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></Box>}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LeaderboardList() {
  const { user } = useUser();
  const userGroups = user?.groups ?? [];
  const defaultFilter = userGroups.length > 0 ? userGroups[0] : 'global';

  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);
  const [filter, setFilter]           = useState(defaultFilter);
  const [isTop3, setIsTop3]           = useState(filter !== 'global');

  const maxPoints = entries[0]?.total_points || 1;

  // reset + load top3 (or global full) whenever filter changes
  useEffect(() => {
    setEntries([]);
    setError(null);
    setLoading(true);
    const top3Mode = filter !== 'global';
    setIsTop3(top3Mode);

    const req = top3Mode
      ? LeaderboardDAO.getGroupTop3(filter)
      : LeaderboardDAO.getGlobalLeaderboard();

    req
      .then((res) => setEntries(res.data ?? []))
      .catch((err) => { console.error(err); setError('Gagal memuat leaderboard.'); })
      .finally(() => setLoading(false));
  }, [filter]);

  const loadFull = () => {
    setLoadingMore(true);
    LeaderboardDAO.getGroupLeaderboard(filter)
      .then((res) => { setEntries(res.data ?? []); setIsTop3(false); })
      .catch((err) => { console.error(err); setError('Gagal memuat semua data.'); })
      .finally(() => setLoadingMore(false));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #F1F5F9', px: { xs: 3, md: 5 }, py: 3 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#2563EB', letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          Season Rankings
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: { xs: 26, md: 32 }, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Leaderboard
          </Typography>
          <FilterDropdown filter={filter} setFilter={setFilter} userGroups={userGroups} />
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 260px' }, gap: 3, p: { xs: 2, md: 4 }, maxWidth: 1060, mx: 'auto' }}>

        {/* list card */}
        <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1.5px solid #F1F5F9', p: { xs: 1.5, md: 2 } }}>
          {/* column headers */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, mb: 1.5, gap: 2 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', width: 28 }}>#</Typography>
            <Box sx={{ width: 36 }} />
            <Typography sx={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Player</Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Points</Typography>
          </Box>
          <Box sx={{ height: '1px', bgcolor: '#F1F5F9', mx: 2, mb: 1.5 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={28} sx={{ color: '#2563EB' }} />
            </Box>
          ) : error ? (
            <Typography sx={{ color: '#EF4444', textAlign: 'center', py: 8, fontSize: 13 }}>{error}</Typography>
          ) : entries.length === 0 ? (
            <Typography sx={{ color: '#94A3B8', textAlign: 'center', py: 8, fontSize: 14 }}>Belum ada data.</Typography>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {entries.map((entry, i) => (
                  <RankRow
                    key={`${entry.username}-${entry.rank}`}
                    entry={entry} index={i}
                    isCurrentUser={entry.username === user?.username}
                    maxPoints={maxPoints}
                  />
                ))}
              </Box>

              {/* Expand to full list — only for group top3 mode */}
              {isTop3 && filter !== 'global' && (
                <Box
                  onClick={!loadingMore ? loadFull : undefined}
                  sx={{
                    mt: 1.5, mx: 0.5, py: 1.25, borderRadius: '12px',
                    border: '1.5px dashed #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                    cursor: loadingMore ? 'default' : 'pointer',
                    color: '#2563EB', fontWeight: 700, fontSize: 13,
                    fontFamily: '"Nunito", sans-serif', transition: 'all .15s',
                    '&:hover': { bgcolor: loadingMore ? 'transparent' : '#EFF6FF', borderColor: '#BFDBFE' },
                  }}
                >
                  {loadingMore ? (
                    <><CircularProgress size={14} sx={{ color: '#2563EB' }} /> Memuat...</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 2v10M2 7l5 5 5-5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Lihat semua peringkat
                    </>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* stats panel */}
        <UserStatsPanel currentUser={user} entries={entries} />
      </Box>
    </Box>
  );
}