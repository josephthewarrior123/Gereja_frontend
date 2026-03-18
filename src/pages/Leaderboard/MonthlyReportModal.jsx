// src/pages/Leaderboard/MonthlyReportModal.jsx
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import JournalDAO from '../../daos/JournalDao';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const ACT_COLORS = ['#2563EB', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6'];

function roundRect(ctx, x, y, w, h, r = 8) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
}

function generateAndDownload(data, filename) {
    const { activities, users, summary_by_activity, grand_total, group, year, month } = data;

    const SCALE   = 2; // retina
    const PAD     = 48;
    const COL_NAME = 200;
    const COL_W   = 110;
    const ROW_H   = 44;
    const HDR_H   = 52;

    // Chart dimensions
    const LEGEND_H   = 28 * Math.ceil(activities.length / 3); // legend rows
    const CHART_BAR  = 180; // bar area height
    const CHART_AXIS = 32;  // x-axis labels
    const CHART_H    = LEGEND_H + CHART_BAR + CHART_AXIS;

    const TABLE_COLS = activities.length + 1; // +1 total
    const TABLE_W    = COL_NAME + COL_W * TABLE_COLS;
    const TABLE_H    = HDR_H + ROW_H * (users.length + 1);

    const W = TABLE_W + PAD * 2;
    const H = PAD              // top pad
            + 18               // subtitle
            + 10               // gap
            + 40               // title
            + 24               // gap
            + CHART_H + 24     // chart + gap
            + TABLE_H          // table
            + PAD;             // bottom pad

    const canvas = document.createElement('canvas');
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, W, H);

    // white content card
    roundRect(ctx, PAD - 16, PAD - 16, W - (PAD - 16) * 2, H - (PAD - 16) * 2, 16);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // ── Header ──────────────────────────────────────────────────────────────
    let curY = PAD;

    ctx.fillStyle = '#2563EB';
    ctx.font = `700 11px "Arial", sans-serif`;
    ctx.fillText('LAPORAN AKTIVITAS BULANAN', PAD, curY);
    curY += 14;

    ctx.fillStyle = '#0F172A';
    ctx.font = `900 28px "Arial", sans-serif`;
    ctx.fillText(`${group.toUpperCase()} — ${MONTH_NAMES[month - 1]} ${year}`, PAD, curY + 24);
    curY += 24 + 20;

    // ── Legend ──────────────────────────────────────────────────────────────
    const ITEMS_PER_ROW = 3;
    const LEG_COL_W = TABLE_W / ITEMS_PER_ROW;
    activities.forEach((act, i) => {
        const col = i % ITEMS_PER_ROW;
        const row = Math.floor(i / ITEMS_PER_ROW);
        const lx = PAD + col * LEG_COL_W;
        const ly = curY + row * 28;
        const color = ACT_COLORS[i % ACT_COLORS.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lx + 6, ly - 4, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.font = `500 12px "Arial", sans-serif`;
        ctx.fillText(act, lx + 18, ly);
    });
    curY += LEGEND_H + 16;

    // ── Bar Chart ────────────────────────────────────────────────────────────
    const chartX = PAD;
    const chartW = TABLE_W;
    const maxVal = Math.max(...summary_by_activity.map(s => s.total_count), 1);
    const barCount = summary_by_activity.length;
    const barSlot = chartW / barCount;
    const barW = Math.min(72, barSlot * 0.5);

    // chart bg
    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, chartX, curY, chartW, CHART_BAR, 12);
    ctx.fill();

    summary_by_activity.forEach((act, i) => {
        const color = ACT_COLORS[i % ACT_COLORS.length];
        const bx = chartX + barSlot * i + (barSlot - barW) / 2;
        const bh = Math.max(4, (act.total_count / maxVal) * (CHART_BAR * 0.78));
        const by = curY + CHART_BAR - bh - 10;

        // bg track
        ctx.fillStyle = color + '18';
        roundRect(ctx, bx, curY + 8, barW, CHART_BAR - 18, 8);
        ctx.fill();

        // bar
        ctx.fillStyle = color;
        roundRect(ctx, bx, by, barW, bh, 6);
        ctx.fill();

        // value above bar
        ctx.fillStyle = '#0F172A';
        ctx.font = `700 14px "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(act.total_count, bx + barW / 2, by - 8);

        // label below chart
        ctx.fillStyle = '#64748B';
        ctx.font = `400 11px "Arial", sans-serif`;
        const short = act.activity_name.length > 14 ? act.activity_name.slice(0, 13) + '…' : act.activity_name;
        ctx.fillText(short, bx + barW / 2, curY + CHART_BAR + 18);
    });

    ctx.textAlign = 'left';
    curY += CHART_BAR + CHART_AXIS + 16;

    // ── Table ────────────────────────────────────────────────────────────────
    const tX = PAD;
    const tY = curY;

    // table shadow / bg
    ctx.fillStyle = '#fff';
    roundRect(ctx, tX, tY, TABLE_W, TABLE_H, 12);
    ctx.fill();
    // header bg
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, tX, tY, TABLE_W, HDR_H, 12);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(tX, tY + HDR_H - 12, TABLE_W, 12);

    // header text
    ctx.fillStyle = '#fff';
    ctx.font = `700 12px "Arial", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Nama', tX + 16, tY + HDR_H / 2 + 5);

    activities.forEach((act, i) => {
        const cx = tX + COL_NAME + COL_W * i + COL_W / 2;
        ctx.textAlign = 'center';
        ctx.font = `700 11px "Arial", sans-serif`;
        ctx.fillStyle = ACT_COLORS[i % ACT_COLORS.length] + 'dd';
        const short = act.length > 13 ? act.slice(0, 12) + '…' : act;
        ctx.fillText(short, cx, tY + HDR_H / 2 + 5);
    });

    // Total header
    const totalX = tX + COL_NAME + COL_W * activities.length + COL_W / 2;
    ctx.fillStyle = '#93C5FD';
    ctx.font = `700 12px "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Total', totalX, tY + HDR_H / 2 + 5);

    // Rows
    users.forEach((u, ri) => {
        const ry = tY + HDR_H + ROW_H * ri;

        // alternating row bg
        ctx.fillStyle = ri % 2 === 0 ? '#F8FAFC' : '#fff';
        ctx.fillRect(tX, ry, TABLE_W, ROW_H);

        // name
        ctx.fillStyle = '#0F172A';
        ctx.font = `500 13px "Arial", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(u.fullName, tX + 16, ry + ROW_H / 2 + 5);

        // activity values
        activities.forEach((act, ai) => {
            const val = u.by_activity[act]?.count ?? 0;
            const cx = tX + COL_NAME + COL_W * ai + COL_W / 2;
            ctx.textAlign = 'center';
            if (val > 0) {
                ctx.fillStyle = '#0F172A';
                ctx.font = `600 13px "Arial", sans-serif`;
                ctx.fillText(val, cx, ry + ROW_H / 2 + 5);
            } else {
                ctx.fillStyle = '#CBD5E1';
                ctx.font = `400 13px "Arial", sans-serif`;
                ctx.fillText('—', cx, ry + ROW_H / 2 + 5);
            }
        });

        // total
        const tv = u.total_count;
        ctx.fillStyle = tv > 0 ? '#2563EB' : '#CBD5E1';
        ctx.font = tv > 0 ? `700 14px "Arial", sans-serif` : `400 13px "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(tv > 0 ? tv : '0', totalX, ry + ROW_H / 2 + 5);
    });

    // Grand total row
    const gtY = tY + HDR_H + ROW_H * users.length;
    ctx.fillStyle = '#EFF6FF';
    ctx.fillRect(tX, gtY, TABLE_W, ROW_H);

    // round bottom corners
    roundRect(ctx, tX, gtY, TABLE_W, ROW_H, 0, 0, 12, 12);
    ctx.fillStyle = '#EFF6FF';
    ctx.fill();

    ctx.fillStyle = '#1D4ED8';
    ctx.font = `700 13px "Arial", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Total', tX + 16, gtY + ROW_H / 2 + 5);

    summary_by_activity.forEach((act, ai) => {
        const cx = tX + COL_NAME + COL_W * ai + COL_W / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1D4ED8';
        ctx.font = `700 13px "Arial", sans-serif`;
        ctx.fillText(act.total_count, cx, gtY + ROW_H / 2 + 5);
    });

    ctx.fillStyle = '#1D4ED8';
    ctx.font = `800 15px "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(grand_total.total_count, totalX, gtY + ROW_H / 2 + 5);



    // Watermark
    ctx.fillStyle = '#CBD5E1';
    ctx.font = `400 10px "Arial", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`Generated ${new Date().toLocaleDateString('id-ID')}`, W - PAD + 16, H - 14);

    // Download
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

export default function MonthlyReportModal({ open, onClose, group }) {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear]   = useState(now.getFullYear());
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState(null);
    const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i);
    const nowMonth = now.getMonth() + 1;
    const nowYear  = now.getFullYear();
    const isFuture = (y, m) => y > nowYear || (y === nowYear && m > nowMonth);

    if (!open) return null;

    const handleDownload = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await JournalDAO.getGroupMonthlyReport(group, year, month);
            if (!res.success) throw new Error('Gagal mengambil data');
            const filename = `report_${group}_${MONTH_NAMES[month - 1].toLowerCase()}_${year}.png`;
            generateAndDownload(res, filename);
        } catch (e) {
            setError(e.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');`}</style>

            {/* Backdrop */}
            <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(15,23,42,0.5)', zIndex: 1300, backdropFilter: 'blur(3px)' }} />

            {/* Modal */}
            <Box sx={{
                position: 'fixed', zIndex: 1301,
                bottom: { xs: 0, sm: '50%' },
                left: { xs: 0, sm: '50%' },
                right: { xs: 0, sm: 'auto' },
                transform: { xs: 'none', sm: 'translate(-50%, 50%)' },
                width: { xs: '100%', sm: 420 },
                bgcolor: '#fff',
                borderRadius: { xs: '20px 20px 0 0', sm: '20px' },
                p: 3, boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            }}>
                {/* Handle */}
                <Box sx={{ width: 36, height: 4, bgcolor: '#E2E8F0', borderRadius: 99, mx: 'auto', mb: 3, display: { sm: 'none' } }} />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box>
                        <Typography sx={{ fontSize: 17, fontWeight: 800, color: '#0F172A', fontFamily: '"Nunito", sans-serif' }}>Download Laporan</Typography>
                        <Typography sx={{ fontSize: 12, color: '#94A3B8', mt: 0.3, fontFamily: '"Nunito", sans-serif', textTransform: 'capitalize' }}>{group}</Typography>
                    </Box>
                    <Box onClick={onClose} sx={{ width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9' } }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </Box>
                </Box>

                {/* Month picker */}
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5, fontFamily: '"Nunito", sans-serif' }}>Bulan</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2.5 }}>
                    {MONTH_NAMES.map((name, i) => {
                        const m = i + 1;
                        const active = month === m;
                        const disabled = isFuture(year, m);
                        return (
                            <Box key={m} onClick={() => !disabled && setMonth(m)} sx={{
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

                {/* Year picker */}
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5, fontFamily: '"Nunito", sans-serif' }}>Tahun</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    {years.map((y) => {
                        const active = year === y;
                        const disabled = y > nowYear;
                        return (
                            <Box key={y} onClick={() => {
                                if (disabled) return;
                                setYear(y);
                                // kalau bulan yang dipilih jadi future setelah ganti tahun, reset ke bulan ini
                                if (y === nowYear && month > nowMonth) setMonth(nowMonth);
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

                {error && (
                    <Typography sx={{ fontSize: 12, color: '#EF4444', mb: 2, textAlign: 'center' }}>{error}</Typography>
                )}

                {/* Download button */}
                <Box onClick={!loading ? handleDownload : undefined} sx={{
                    width: '100%', py: 1.5, borderRadius: '12px', textAlign: 'center',
                    bgcolor: loading ? '#93C5FD' : '#2563EB', color: '#fff',
                    cursor: loading ? 'default' : 'pointer',
                    fontSize: 14, fontWeight: 700, fontFamily: '"Nunito", sans-serif',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                    '&:hover': { bgcolor: loading ? '#93C5FD' : '#1D4ED8' },
                }}>
                    {loading ? (
                        <><CircularProgress size={16} sx={{ color: '#fff' }} /> Generating...</>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v8M4 7l4 4 4-4M2 13h12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Download PNG
                        </>
                    )}
                </Box>
            </Box>
        </>
    );
}