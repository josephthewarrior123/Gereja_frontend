// src/pages/Leaderboard/LeaderboardList.jsx
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../../hooks/UserProvider';
import LeaderboardDAO from '../../daos/LeaderboardDao';
import MonthlyReportModal from './MonthlyReportModal';
import UserDAO from '../../daos/UserDAO';

const PALETTE = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];
const avatarColor = (i) => PALETTE[i % PALETTE.length];
const getInitials = (n) => (n ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// ─── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <Box sx={{
        width: 32, height: 32, borderRadius: '10px',
        background: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
        border: '1.5px solid #FCD34D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(245,158,11,0.35)', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L9.5 5.5H13.5L10.5 7.8L11.5 12L8 9.8L4.5 12L5.5 7.8L2.5 5.5H6.5L8 1.5Z" fill="#92400E" stroke="#92400E" strokeWidth="0.5" strokeLinejoin="round" />
        </svg>
      </Box>
    );
  }
  const silver = { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  const bronze = { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' };
  const plain  = { bg: '#F8FAFC', color: '#94A3B8', border: '#F1F5F9' };
  const style  = rank === 2 ? silver : rank === 3 ? bronze : plain;
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
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barWidth}%`, bgcolor: isCurrentUser ? 'rgba(124,58,237,0.04)' : 'rgba(148,163,184,0.04)', borderRadius: '14px', pointerEvents: 'none' }} />
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
function UserStatsPanel({ currentUser, entries, myStats }) {
  const myEntry = entries.find((e) => e.username === currentUser?.username);
  const suffix = (r) => ['st', 'nd', 'rd'][r - 1] || 'th';
  const rank = myEntry?.rank ?? myStats?.rank ?? null;
  const rankLabel = rank ? `${rank}${suffix(rank)}` : '—';
  const stats = [
    { label: 'Rank',    value: rankLabel },
    { label: 'Points',  value: myEntry?.total_points ?? myStats?.total_points ?? '—' },
    { label: 'Entries', value: myEntry?.entry_count  ?? myStats?.entry_count  ?? '—' },
    { label: 'Group',   value: myEntry?.groups?.[0]  ?? myStats?.groups?.[0]  ?? currentUser?.groups?.[0] ?? '—' },
  ];
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1.5px solid #F1F5F9', overflow: 'hidden', position: { xs: 'static', lg: 'sticky' }, top: 24 }}>

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

// ─── Group Filter Dropdown ────────────────────────────────────────────────────
function FilterDropdown({ filter, setFilter, filterGroups }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <Box ref={ref} sx={{ position: 'relative' }}>
      <Box onClick={() => setOpen((v) => !v)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.9, borderRadius: '10px', border: '1.5px solid #E2E8F0', bgcolor: '#fff', cursor: 'pointer', userSelect: 'none', transition: 'all .15s', '&:hover': { borderColor: '#2563EB' } }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: '"Nunito", sans-serif', textTransform: 'capitalize', minWidth: 60 }}>{filter}</Typography>
        <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Box>
      </Box>
      {open && filterGroups.length > 0 && (
        <Box sx={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 160, bgcolor: '#fff', borderRadius: '12px', border: '1.5px solid #F1F5F9', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100 }}>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Groups</Typography>
          </Box>
          {filterGroups.map((g) => (
            <Box key={g} onClick={() => { setFilter(g); setOpen(false); }} sx={{ px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: filter === g ? '#EFF6FF' : 'transparent', '&:hover': { bgcolor: '#EFF6FF' }, transition: 'background .1s' }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#2563EB', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, fontWeight: filter === g ? 700 : 500, color: filter === g ? '#2563EB' : '#334155', fontFamily: '"Nunito", sans-serif', textTransform: 'capitalize' }}>{g}</Typography>
              {filter === g && <Box sx={{ ml: 'auto' }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></Box>}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Period Modal ─────────────────────────────────────────────────────────────
function PeriodModal({ open, onClose, mode, setMode, month, year, setMonth, setYear, filter, setFilter, filterGroups }) {
  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear  = now.getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i);
  const isFuture = (y, m) => y > nowYear || (y === nowYear && m > nowMonth);

  const [draftMode, setDraftMode] = React.useState(mode);
  const [draftMonth, setDraftMonth] = React.useState(month);
  const [draftYear, setDraftYear] = React.useState(year);
  const [draftFilter, setDraftFilter] = React.useState(filter);

  React.useEffect(() => {
    if (open) {
      setDraftMode(mode);
      setDraftMonth(month);
      setDraftYear(year);
      setDraftFilter(filter);
    }
  }, [open]);

  const handleApply = () => {
    setMode(draftMode);
    setMonth(draftMonth);
    setYear(draftYear);
    setFilter(draftFilter);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(15,23,42,0.4)', zIndex: 1200, backdropFilter: 'blur(2px)' }} />
      <Box sx={{
        position: 'fixed', zIndex: 1201,
        bottom: { xs: 0, sm: '50%' },
        left: { xs: 0, sm: '50%' },
        right: { xs: 0, sm: 'auto' },
        transform: { xs: 'none', sm: 'translate(-50%, 50%)' },
        width: { xs: '100%', sm: 360 },
        bgcolor: '#fff',
        borderRadius: { xs: '20px 20px 0 0', sm: '20px' },
        p: 3,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <Box sx={{ width: 36, height: 4, bgcolor: '#E2E8F0', borderRadius: 99, mx: 'auto', mb: 3, display: { sm: 'none' } }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: '"Nunito", sans-serif' }}>Filter Periode</Typography>
          <Box onClick={onClose} sx={{ width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9' } }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </Box>
        </Box>

        {/* Mode toggle */}
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1, fontFamily: '"Nunito", sans-serif' }}>Tampilkan</Typography>
        <Box sx={{ display: 'flex', bgcolor: '#F1F5F9', borderRadius: '12px', p: '4px', gap: '4px', mb: 3 }}>
          {[{ key: 'alltime', label: 'All Time' }, { key: 'monthly', label: 'Bulanan' }].map(({ key, label }) => (
            <Box key={key} onClick={() => setDraftMode(key)} sx={{
              flex: 1, py: 1, borderRadius: '9px', cursor: 'pointer', textAlign: 'center',
              fontSize: 13, fontWeight: 700, fontFamily: '"Nunito", sans-serif',
              transition: 'all .15s',
              bgcolor: draftMode === key ? '#fff' : 'transparent',
              color: draftMode === key ? '#0F172A' : '#94A3B8',
              boxShadow: draftMode === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>{label}</Box>
          ))}
        </Box>

        {/* Month & year */}
        {draftMode === 'monthly' && (
          <>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5, fontFamily: '"Nunito", sans-serif' }}>Bulan</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2.5 }}>
              {MONTH_NAMES.map((name, i) => {
                const m = i + 1;
                const active = draftMonth === m;
                const disabled = isFuture(draftYear, m);
                return (
                  <Box key={m} onClick={() => !disabled && setDraftMonth(m)} sx={{
                    py: 1, borderRadius: '10px', textAlign: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 12, fontWeight: 700, fontFamily: '"Nunito", sans-serif',
                    border: '1.5px solid', transition: 'all .15s',
                    borderColor: disabled ? '#F1F5F9' : active ? '#2563EB' : '#E2E8F0',
                    bgcolor: disabled ? '#F8FAFC' : active ? '#EFF6FF' : '#fff',
                    color: disabled ? '#CBD5E1' : active ? '#2563EB' : '#64748B',
                    opacity: disabled ? 0.5 : 1,
                  }}>{name.slice(0, 3)}</Box>
                );
              })}
            </Box>

            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5, fontFamily: '"Nunito", sans-serif' }}>Tahun</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {years.map((y) => {
                const active = draftYear === y;
                const disabled = y > nowYear;
                return (
                  <Box key={y} onClick={() => {
                    if (disabled) return;
                    setDraftYear(y);
                    if (y === nowYear && draftMonth > nowMonth) setDraftMonth(nowMonth);
                  }} sx={{
                    flex: 1, py: 1, borderRadius: '10px', textAlign: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: '"DM Mono", monospace',
                    border: '1.5px solid', transition: 'all .15s',
                    borderColor: disabled ? '#F1F5F9' : active ? '#2563EB' : '#E2E8F0',
                    bgcolor: disabled ? '#F8FAFC' : active ? '#EFF6FF' : '#fff',
                    color: disabled ? '#CBD5E1' : active ? '#2563EB' : '#64748B',
                    opacity: disabled ? 0.5 : 1,
                  }}>{y}</Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Group filter */}
        {filterGroups.length > 1 && (
          <>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5, fontFamily: '"Nunito", sans-serif' }}>Group</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {filterGroups.map((g) => {
                const active = draftFilter === g;
                return (
                  <Box key={g} onClick={() => setDraftFilter(g)} sx={{
                    px: 2, py: 0.8, borderRadius: '10px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: '"Nunito", sans-serif',
                    border: '1.5px solid', transition: 'all .15s', textTransform: 'capitalize',
                    borderColor: active ? '#2563EB' : '#E2E8F0',
                    bgcolor: active ? '#EFF6FF' : '#fff',
                    color: active ? '#2563EB' : '#64748B',
                  }}>{g}</Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Terapkan */}
        <Box onClick={handleApply} sx={{
          width: '100%', py: 1.4, borderRadius: '12px', textAlign: 'center',
          bgcolor: '#2563EB', color: '#fff', cursor: 'pointer',
          fontSize: 14, fontWeight: 700, fontFamily: '"Nunito", sans-serif',
          boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'all .15s',
          '&:hover': { bgcolor: '#1D4ED8' },
        }}>
          Terapkan
        </Box>
      </Box>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LeaderboardList() {
  const { user } = useUser();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminLike = ['admin', 'gembala'].includes(user?.role);

  const filterGroups = isAdminLike
    ? (user?.managedGroups ?? [])
    : (user?.groups ?? []);

  const defaultFilter = filterGroups.length > 0 ? filterGroups[0] : '';

  const [allGroups, setAllGroups] = useState([]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    UserDAO.getAllUsers()
      .then((res) => {
        if (res.success && res.users) {
          const groups = [...new Set(
            res.users.flatMap((u) => u.groups || []).filter(Boolean)
          )].sort();
          setAllGroups(groups);
        }
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const activeFilterGroups = isSuperAdmin ? allGroups : filterGroups;
  const activeDefaultFilter = isSuperAdmin ? (allGroups[0] ?? '') : defaultFilter;

  const now = new Date();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [isTop3, setIsTop3] = useState(true);

  const [mode, setMode] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin && allGroups.length > 0 && !filter) {
      setFilter(allGroups[0]);
    }
  }, [allGroups]);

  useEffect(() => {
    if (!isSuperAdmin && activeDefaultFilter && !filter) {
      setFilter(activeDefaultFilter);
    }
  }, [activeDefaultFilter]);

  const [myStats, setMyStats] = useState(null);
  useEffect(() => {
    UserDAO.getMyStats()
      .then((res) => { if (res.success && res.data) setMyStats(res.data); })
      .catch(() => {});
  }, []);

  const maxPoints = entries[0]?.total_points || 1;

  const fetchLeaderboard = (top3Only = true) => {
    if (!filter) return;
    setEntries([]);
    setError(null);
    setLoading(true);

    if (mode === 'monthly') {
      setIsTop3(false);
      LeaderboardDAO.getGroupMonthlyLeaderboard(filter, selectedYear, selectedMonth)
        .then((res) => setEntries(res.data ?? []))
        .catch((err) => { console.error(err); setError('Gagal memuat leaderboard.'); })
        .finally(() => setLoading(false));
      return;
    }

    setIsTop3(top3Only);
    if (!top3Only) setLoadingMore(true);
    const req = top3Only ? LeaderboardDAO.getGroupTop3(filter) : LeaderboardDAO.getGroupLeaderboard(filter);
    req
      .then((res) => setEntries(res.data ?? []))
      .catch((err) => { console.error(err); setError('Gagal memuat leaderboard.'); })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { fetchLeaderboard(true); }, [filter, mode, selectedMonth, selectedYear]);

  const loadFull = () => fetchLeaderboard(false);

  const periodLabel = mode === 'monthly'
    ? `${MONTH_NAMES[selectedMonth - 1].slice(0, 3)} ${selectedYear}`
    : 'All Time';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #F1F5F9', px: { xs: 3, md: 5 }, py: 3 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#2563EB', letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5, display: { xs: 'none', md: 'block' } }}>
          Season Rankings
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: { xs: 22, md: 32 }, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1, display: { xs: 'none', md: 'block' } }}>
              Leaderboard
            </Typography>
            <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1, textTransform: 'capitalize', display: { xs: 'block', md: 'none' } }}>
              {filter || 'Leaderboard'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Download laporan */}
            {['super_admin', 'admin', 'gembala'].includes(user?.role) && (
              <Box onClick={() => setReportModalOpen(true)} sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                px: 1.75, py: 0.9, borderRadius: '10px',
                border: '1.5px solid #E2E8F0', cursor: 'pointer', transition: 'all .15s',
                bgcolor: '#fff', '&:hover': { borderColor: '#2563EB', bgcolor: '#EFF6FF' },
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v7M3 5.5l3.5 3.5L10 5.5M1 11h11" stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: '"Nunito", sans-serif', display: { xs: 'none', sm: 'block' } }}>
                  Laporan
                </Typography>
              </Box>
            )}

            {/* Period filter */}
            <Box onClick={() => setModalOpen(true)} sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 1.75, py: 0.9, borderRadius: '10px',
              border: '1.5px solid', cursor: 'pointer', transition: 'all .15s',
              borderColor: mode === 'monthly' ? '#BFDBFE' : '#E2E8F0',
              bgcolor: mode === 'monthly' ? '#EFF6FF' : '#fff',
              '&:hover': { borderColor: '#2563EB' },
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="2" width="11" height="10" rx="2" stroke={mode === 'monthly' ? '#2563EB' : '#94A3B8'} strokeWidth="1.5" />
                <path d="M4 1v2M9 1v2M1 5h11" stroke={mode === 'monthly' ? '#2563EB' : '#94A3B8'} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: mode === 'monthly' ? '#2563EB' : '#64748B', fontFamily: '"Nunito", sans-serif' }}>
                {periodLabel}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography sx={{ mt: 1, fontSize: 13, fontWeight: 700, color: '#64748B', fontFamily: '"Nunito", sans-serif', textTransform: 'capitalize', display: { xs: 'none', md: 'block' } }}>
          {filter}
        </Typography>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 260px' }, gap: 3, p: { xs: 2, md: 4 }, pb: { xs: 10, md: 4 }, maxWidth: 1060, mx: 'auto' }}>
        <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1.5px solid #F1F5F9', p: { xs: 1.5, md: 2 } }}>
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
                  <RankRow key={`${entry.username}-${entry.rank}`} entry={entry} index={i} isCurrentUser={entry.username === user?.username} maxPoints={maxPoints} />
                ))}
              </Box>
              {isTop3 && (
                <Box onClick={!loadingMore ? loadFull : undefined} sx={{
                  mt: 1.5, mx: 0.5, py: 1.25, borderRadius: '12px',
                  border: '1.5px dashed #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                  cursor: loadingMore ? 'default' : 'pointer',
                  color: '#2563EB', fontWeight: 700, fontSize: 13,
                  fontFamily: '"Nunito", sans-serif', transition: 'all .15s',
                  '&:hover': { bgcolor: loadingMore ? 'transparent' : '#EFF6FF', borderColor: '#BFDBFE' },
                }}>
                  {loadingMore
                    ? <><CircularProgress size={14} sx={{ color: '#2563EB' }} /> Memuat...</>
                    : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7l5 5 5-5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Lihat semua peringkat</>
                  }
                </Box>
              )}
            </>
          )}
        </Box>

        <UserStatsPanel currentUser={user} entries={entries} myStats={myStats} />
      </Box>

      {/* ── Monthly Report Modal ── */}
      <MonthlyReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        group={filter}
      />

      {/* ── Period Modal ── */}
      <PeriodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={mode} setMode={setMode}
        month={selectedMonth} year={selectedYear}
        setMonth={setSelectedMonth} setYear={setSelectedYear}
        filter={filter} setFilter={setFilter} filterGroups={activeFilterGroups}
      />
    </Box>
  );
}