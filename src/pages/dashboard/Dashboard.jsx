import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Users, ShieldCheck, Clock, ShieldOff, XCircle,
  Calendar, AlertTriangle, ChevronRight, Building2, Car,
  TrendingUp, TrendingDown, Search, Download, Plus,
  Bell, RefreshCw, Filter, MoreHorizontal, CheckCircle,
  Activity, Zap, Eye, ArrowUpRight, X, Menu,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line,
} from "recharts";

import CustomerDAO from "../../daos/CustomerDao";
import PropertyDAO from "../../daos/propertyDao";
import CompanyDAO from "../../daos/CompanyDao";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const tokens = {
  vehicle: {
    primary: "#2563eb",
    light: "#dbeafe",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
    glow: "rgba(37,99,235,0.25)",
  },
  property: {
    primary: "#0ea5e9",
    light: "#e0f2fe",
    gradient: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #38bdf8 100%)",
    glow: "rgba(14,165,233,0.25)",
  },
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: { primary: "#0f172a", secondary: "#475569", muted: "#94a3b8" },
  bg: { page: "#f0f4ff", card: "rgba(255,255,255,0.88)", hover: "rgba(255,255,255,0.98)" },
  border: "rgba(226,232,240,0.8)",
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
    lg: "0 12px 32px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)",
    glow: (color) => `0 8px 24px ${color}`,
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

const getStatus = (dueDateStr, statusField) => {
  if (statusField === "Cancelled") return "Cancelled";
  if (!dueDateStr) return "Unknown";
  const due = new Date(dueDateStr);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) return "Segera Jatuh Tempo";
  return "Aktif";
};

const formatRupiah = (num) => {
  if (!num || num === 0) return "—";
  const n = typeof num === "string" ? parseFloat(num.replace(/[^0-9.-]/g, "")) : num;
  if (isNaN(n) || n === 0) return "—";
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_CONFIG = {
  "Aktif":              { bg: "#d1fae5", color: "#059669", dot: "#10b981" },
  "Active":             { bg: "#d1fae5", color: "#059669", dot: "#10b981" },
  "Segera Jatuh Tempo": { bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
  "Expired":            { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Cancelled":          { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  "Unknown":            { bg: "#f8fafc", color: "#94a3b8", dot: "#cbd5e1" },
};

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
const useBreakpoint = () => {
  const [bp, setBp] = useState(() => ({
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    width: window.innerWidth,
  }));
  useEffect(() => {
    const handler = () => setBp({
      isMobile: window.innerWidth < 640,
      isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
      width: window.innerWidth,
    });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return bp;
};

// ─── SCOPED STYLES (tidak ada yang bleed ke luar .dash-page) ─────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

    /* ── Semua style di-scope ke .dash-page — tidak ada yang bleed keluar ── */

    .dash-page {
      padding: 32px;
      min-height: 100vh;
      background: #f8faff;
      font-family: 'Sora', sans-serif;
      color: #0f172a;
      box-sizing: border-box;
    }

    .dash-page *, .dash-page *::before, .dash-page *::after {
      box-sizing: border-box;
    }

    @media (max-width: 1024px) { .dash-page { padding: 20px; } }
    @media (max-width: 640px)  { .dash-page { padding: 12px; } }

    /* Header */
    .dash-page .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 12px;
      flex-wrap: nowrap;
    }

    /* Quick Actions */
    .dash-page .quick-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }

    .dash-page .qa-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Sora', sans-serif;
      min-height: 44px;
      white-space: nowrap;
    }

    .dash-page .qa-btn:hover { transform: translateY(-1px); }
    .dash-page .qa-btn:active { transform: translateY(0); }

    .dash-page .qa-btn-primary {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      box-shadow: 0 4px 12px rgba(37,99,235,0.3);
    }
    .dash-page .qa-btn-primary:hover { box-shadow: 0 6px 16px rgba(37,99,235,0.4); }
    .dash-page .qa-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    .dash-page .qa-btn-ghost {
      background: #ffffff;
      color: #475569;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .dash-page .qa-btn-ghost:hover { background: #f8faff; color: #0f172a; }

    /* Tabs */
    .dash-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 5px;
      width: fit-content;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .dash-tab {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 20px;
      border-radius: 10px;
      border: none;
      background: none;
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: 'Sora', sans-serif;
      min-height: 42px;
      position: relative;
    }

    .dash-tab.active-vehicle {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      color: #fff;
      box-shadow: 0 4px 12px rgba(37,99,235,0.35);
      transform: scale(1.02);
    }

    .dash-tab.active-property {
      background: linear-gradient(135deg, #0369a1, #0ea5e9);
      color: #fff;
      box-shadow: 0 4px 12px rgba(14,165,233,0.35);
      transform: scale(1.02);
    }

    .dash-page .tab-count {
      background: rgba(255,255,255,0.25);
      border-radius: 20px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }

    .dash-page .tab-count-inactive {
      background: #f1f5f9;
      color: #64748b;
      border-radius: 20px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }

    /* Card */
    .dash-page .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(37,99,235,0.04);
      transition: box-shadow 0.25s ease, transform 0.25s ease;
      overflow: hidden;
    }

    .dash-page .card:hover {
      box-shadow: 0 4px 20px rgba(37,99,235,0.1), 0 1px 4px rgba(0,0,0,0.06);
    }

    /* Stat grid */
    .dash-page .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 18px;
    }

    @media (max-width: 1024px) { .dash-page .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px)  { .dash-page .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

    /* Row layouts */
    .dash-page .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }

    @media (max-width: 1024px) { .dash-page .row-2 { grid-template-columns: 1fr; } }

    /* Stat card */
    .dash-page .stat-card {
      padding: 20px;
      position: relative;
      overflow: hidden;
      cursor: default;
    }

    .dash-page .stat-card::before {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.05;
    }

    .dash-page .stat-card:hover { transform: translateY(-2px); }

    .dash-page .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .dash-page .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 4px;
    }

    .dash-page .stat-value {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 6px;
    }

    @media (max-width: 640px) {
      .dash-page .stat-value { font-size: 26px; }
      .dash-page .stat-card { padding: 14px; }
    }

    .dash-page .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    /* Chart card */
    .dash-page .chart-card { padding: 22px; }

    .dash-page .chart-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 3px;
    }

    .dash-page .chart-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 14px;
    }

    /* Table — di-scope ketat supaya ga override tabel sidebar */
    .dash-page .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      position: relative;
    }

    .dash-page .table-wrapper::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 24px;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.9));
      pointer-events: none;
    }

    .dash-page .table-wrapper table { width: 100%; border-collapse: collapse; min-width: 600px; }

    .dash-page .table-wrapper th {
      text-align: left;
      font-size: 10px;
      color: #94a3b8;
      font-weight: 700;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
      font-family: 'Sora', sans-serif;
    }

    .dash-page .table-wrapper td {
      padding: 12px 14px;
      font-size: 13px;
      color: #334155;
      vertical-align: middle;
      border-bottom: 1px solid rgba(241,245,249,0.8);
      font-family: 'Sora', sans-serif;
    }

    .dash-page .table-wrapper tr:last-child td { border-bottom: none; }
    .dash-page .table-wrapper tr:hover td { background: rgba(241,245,249,0.5); }

    .dash-page .table-wrapper::-webkit-scrollbar { height: 4px; }
    .dash-page .table-wrapper::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 2px; }
    .dash-page .table-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

    /* Badge */
    .dash-page .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .dash-page .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Search */
    .dash-page .search-wrap {
      position: relative;
      flex: 1;
      max-width: 280px;
    }

    .dash-page .search-input {
      width: 100%;
      padding: 9px 14px 9px 38px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      font-size: 13px;
      font-family: 'Sora', sans-serif;
      color: #0f172a;
      outline: none;
      transition: all 0.2s;
      min-height: 44px;
    }

    .dash-page .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
      background: #fff;
    }

    .dash-page .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }

    /* Avatar */
    .dash-page .avatar {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }

    /* Alert row */
    .dash-page .alert-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      margin-bottom: 8px;
      transition: transform 0.2s;
    }
    .dash-page .alert-row:hover { transform: translateX(2px); }

    /* Plate */
    .dash-page .plate {
      background: #f1f5f9;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11.5px;
      font-family: 'DM Mono', monospace;
      font-weight: 500;
      color: #334155;
      letter-spacing: 0.02em;
      border: 1px solid #e2e8f0;
    }

    /* Gauge */
    .dash-page .gauge-card {
      padding: 22px;
      display: flex;
      flex-direction: column;
    }

    /* Skeleton */
    .dash-page .skeleton {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: dash-shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes dash-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes dash-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.7; transform: scale(1.2); }
    }

    /* FAB — fixed position, aman tidak bleed ke layout lain */
    .dash-fab {
      display: none;
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      border: none;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(37,99,235,0.4);
      z-index: 100;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .dash-fab:hover { transform: scale(1.1); }

    @media (max-width: 640px) {
      .dash-fab { display: flex; }
      .dash-page .qa-btn-text { display: none; }
    }

    /* Progress */
    .dash-page .progress-wrap {
      background: #f1f5f9;
      border-radius: 100px;
      height: 6px;
      overflow: hidden;
      margin-top: 4px;
    }

    .dash-page .progress-bar {
      height: 100%;
      border-radius: 100px;
      transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Tooltip — rendered di luar .dash-page oleh Recharts, prefix custom */
    .dash-tooltip {
      background: rgba(15,23,42,0.95);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 10px 14px;
      color: #fff;
      font-size: 12.5px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.1);
      font-family: 'Sora', sans-serif;
    }

    /* Empty state */
    .dash-page .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }

    .dash-page .empty-icon {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
    }

    /* View all link */
    .dash-page .view-all {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #3b82f6;
      font-weight: 700;
      font-size: 13px;
      text-decoration: none;
      transition: gap 0.2s;
    }
    .dash-page .view-all:hover { gap: 6px; }

    /* Animations */
    @keyframes dash-fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dash-page .fade-in   { animation: dash-fadeInUp 0.4s ease forwards; }
    .dash-page .fade-in-1 { animation-delay: 0.05s; opacity: 0; }
    .dash-page .fade-in-2 { animation-delay: 0.1s;  opacity: 0; }
    .dash-page .fade-in-3 { animation-delay: 0.15s; opacity: 0; }
    .dash-page .fade-in-4 { animation-delay: 0.2s;  opacity: 0; }
  `}</style>
);

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#a5b4fc", margin: 0, fontSize: 12 }}>
          {p.name}: <b style={{ color: "#fff" }}>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Unknown"];
  return (
    <span className="badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <span className="badge-dot" style={{ backgroundColor: cfg.dot }} />
      {status}
    </span>
  );
};

const SkeletonCard = () => (
  <div className="card stat-card">
    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 12 }} />
    <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: 8 }} />
    <div className="skeleton" style={{ width: "40%", height: 32 }} />
  </div>
);

const GaugeChart = ({ percent, color }) => {
  const circ = Math.PI * 80;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width="200" height="115" viewBox="0 0 200 115">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
      <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)", filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
      <text x="100" y="90" textAnchor="middle" style={{ fontSize: 28, fontWeight: 800, fill: "#0f172a", fontFamily: "'Sora',sans-serif" }}>
        {percent.toFixed(0)}%
      </text>
      <text x="100" y="108" textAnchor="middle" style={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        POLIS AKTIF
      </text>
    </svg>
  );
};

const StatCard = ({ icon: Icon, iconColor, iconBg, label, value, sub, subColor, trend, trendUp, delay = 0 }) => (
  <div className={`card stat-card fade-in`} style={{ animationDelay: `${delay}s` }}>
    <div className="stat-icon" style={{ backgroundColor: iconBg }}>
      <Icon size={20} color={iconColor} strokeWidth={2.5} />
    </div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {sub && (
      <div className="stat-trend" style={{ color: subColor || "#64748b" }}>
        {trendUp !== undefined && (trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
        <span>{sub}</span>
      </div>
    )}
    {trend !== undefined && (
      <div className="progress-wrap" style={{ marginTop: 10 }}>
        <div className="progress-bar" style={{ width: `${trend}%`, background: `linear-gradient(90deg, ${iconColor}cc, ${iconColor})` }} />
      </div>
    )}
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="search-wrap">
    <Search size={14} className="search-icon" />
    <input
      className="search-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Cari..."}
      aria-label="Search"
    />
  </div>
);

// ─── VEHICLE TAB ──────────────────────────────────────────────────────────────
function VehicleTab({ customers }) {
  const [search, setSearch] = useState("");
  const { isMobile } = useBreakpoint();

  const stats = useMemo(() => {
    if (!customers.length) return null;
    const total = customers.length;
    const aktif     = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Aktif").length;
    const segera    = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Segera Jatuh Tempo").length;
    const expired   = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Expired").length;
    const cancelled = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Cancelled").length;
    const activePercent = total > 0 ? Math.round((aktif / total) * 100) : 0;

    const monthlyMap = Array(12).fill(0);
    customers.forEach(c => { monthlyMap[new Date(c.createdAt).getMonth()]++; });
    const monthlyData = MONTH_NAMES.map((month, i) => ({ month, nasabah: monthlyMap[i] }));

    const statusData = [
      { name: "Aktif", value: aktif, color: "#10b981" },
      { name: "Segera JT", value: segera, color: "#f59e0b" },
      { name: "Expired", value: expired, color: "#ef4444" },
      { name: "Cancelled", value: cancelled, color: "#94a3b8" },
    ].filter(d => d.value > 0);

    const brandMap = {};
    customers.forEach(c => {
      const brand = c.carData?.carBrand || "Lainnya";
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    const brandData = Object.entries(brandMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([brand, count]) => ({ brand, count }));

    const soonExpiring = customers
      .filter(c => getStatus(c.carData?.dueDate, c.status) === "Segera Jatuh Tempo")
      .sort((a, b) => new Date(a.carData.dueDate) - new Date(b.carData.dueDate))
      .slice(0, 6);

    return { total, aktif, segera, expired, cancelled, activePercent, monthlyData, statusData, brandData, soonExpiring };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers
      .filter(c =>
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.carData?.carBrand?.toLowerCase().includes(q) ||
        c.carData?.plateNumber?.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [customers, search]);

  if (!stats) return (
    <div className="empty-state">
      <div className="empty-icon"><Car size={28} color="#94a3b8" /></div>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Belum ada data kendaraan</p>
      <p style={{ fontSize: 12 }}>Mulai tambahkan nasabah kendaraan</p>
    </div>
  );

  return (
    <>
      {/* Stat Grid */}
      <div className="stat-grid">
        <StatCard icon={Users}       iconColor="#2563eb" iconBg="#dbeafe" label="Total Nasabah"       value={stats.total}            sub="Nasabah terdaftar"             trend={100}  delay={0.05} />
        <StatCard icon={ShieldCheck} iconColor="#10b981" iconBg="#d1fae5" label="Polis Aktif"         value={stats.aktif}            sub={`${stats.activePercent}% dari total`} subColor="#10b981" trendUp trend={stats.activePercent} delay={0.1} />
        <StatCard icon={Clock}       iconColor="#d97706" iconBg="#fef3c7" label="Segera Jatuh Tempo"  value={stats.segera}           sub="Dalam 30 hari" subColor="#d97706" trendUp={false} delay={0.15} />
        <StatCard icon={ShieldOff}   iconColor="#ef4444" iconBg="#fee2e2" label="Expired / Cancelled" value={stats.expired + stats.cancelled} sub={`${stats.expired} expired · ${stats.cancelled} cancelled`} subColor="#ef4444" delay={0.2} />
      </div>

      {/* Charts row 1: bar + donut */}
      <div className="row-2 fade-in fade-in-2">
        <div className="card chart-card">
          <div className="chart-title">Nasabah Baru per Bulan</div>
          <div className="chart-sub">Berdasarkan tanggal pendaftaran</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={stats.monthlyData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora'" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora'" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="nasabah" name="Nasabah Baru" stroke="#3b82f6" strokeWidth={2.5} fill="url(#vGrad)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Distribusi Status Polis</div>
          <div className="chart-sub">Proporsi status seluruh nasabah</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <PieChart width={155} height={170}>
              <Pie data={stats.statusData} cx={72} cy={82} innerRadius={44} outerRadius={68} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {stats.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
            <div style={{ flex: 1 }}>
              {stats.statusData.map(item => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2: brand + gauge + soon expiring */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 260px 1fr", gap: 16, marginBottom: 18 }}>
        <div className="card chart-card">
          <div className="chart-title">Merek Kendaraan Terpopuler</div>
          <div className="chart-sub">Distribusi merek dari seluruh nasabah</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.brandData} layout="vertical" margin={{ top: 4, right: 14, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora'" }} allowDecimals={false} />
              <YAxis type="category" dataKey="brand" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#334155", fontFamily: "'Sora'" }} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Jumlah" radius={[0, 6, 6, 0]}>
                {stats.brandData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${215 + i * 12}, ${80 - i * 5}%, ${55 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card gauge-card" style={{ alignItems: "center" }}>
          <div className="chart-title" style={{ textAlign: "center" }}>Keaktifan</div>
          <div className="chart-sub" style={{ textAlign: "center" }}>Tingkat polis aktif</div>
          <GaugeChart percent={stats.activePercent} color="#3b82f6" />
          <div style={{ display: "flex", justifyContent: "space-around", width: "100%", borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 8 }}>
            {[
              { label: "Total", val: stats.total, color: "#0f172a" },
              { label: "Aktif", val: stats.aktif, color: "#10b981" },
              { label: "Expired", val: stats.expired, color: "#ef4444" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <AlertTriangle size={15} color="#d97706" />
            <div className="chart-title">Segera Jatuh Tempo</div>
          </div>
          <div className="chart-sub">Polis berakhir dalam 30 hari ke depan</div>
          {!stats.soonExpiring.length ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <CheckCircle size={28} color="#10b981" style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>Semua polis aman 🎉</p>
            </div>
          ) : stats.soonExpiring.map(c => {
            const due = new Date(c.carData.dueDate);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            const urgent = diffDays <= 7;
            return (
              <div key={c.id} className="alert-row" style={{
                backgroundColor: urgent ? "#fff7ed" : "#fffbeb",
                border: `1px solid ${urgent ? "#fed7aa" : "#fde68a"}`,
              }}>
                <div className="avatar" style={{ background: urgent ? "#ea580c" : "#f59e0b", color: "#fff" }}>
                  {c.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 12.5, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.carData?.plateNumber}</p>
                </div>
                <div style={{ backgroundColor: urgent ? "#ea580c" : "#f59e0b", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {diffDays === 0 ? "Hari ini!" : `${diffDays}h`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent table */}
      <div className="card fade-in fade-in-4" style={{ padding: "22px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <div className="chart-title">Daftar Nasabah</div>
            <div className="chart-sub" style={{ marginBottom: 0 }}>Cari & filter nasabah kendaraan</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Cari nama, merek, plat..." />
            <a href="/customers" className="view-all">
              Semua <ChevronRight size={14} />
            </a>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Nasabah", "Kendaraan", "No. Plat", "Harga Mobil", "Jatuh Tempo", "Status"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>Tidak ada hasil untuk "{search}"</td></tr>
              ) : filtered.map((c, i) => {
                const status = getStatus(c.carData?.dueDate, c.status);
                const due = c.carData?.dueDate
                  ? new Date(c.carData.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          {c.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{c.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.carData?.carBrand} {c.carData?.carModel}</td>
                    <td><span className="plate">{c.carData?.plateNumber || "—"}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(c.carData?.carPrice)}</td>
                    <td style={{ color: "#475569" }}>{due}</td>
                    <td><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── PROPERTY TAB ─────────────────────────────────────────────────────────────
function PropertyTab({ properties }) {
  const [search, setSearch] = useState("");
  const { isMobile } = useBreakpoint();

  const getPropertyStatus = useCallback((p) => {
    if (p.status === "Cancelled") return "Cancelled";
    const endDate = p.insuranceData?.endDate;
    if (p.status === "Active" || !p.status) {
      if (endDate) {
        const due = new Date(endDate);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "Expired";
        if (diffDays <= 30) return "Segera Jatuh Tempo";
      }
      return "Aktif";
    }
    if (p.status === "Expired") return "Expired";
    return "Unknown";
  }, []);

  const stats = useMemo(() => {
    if (!properties.length) return null;
    const total = properties.length;
    const aktif     = properties.filter(p => getPropertyStatus(p) === "Aktif").length;
    const segera    = properties.filter(p => getPropertyStatus(p) === "Segera Jatuh Tempo").length;
    const expired   = properties.filter(p => getPropertyStatus(p) === "Expired").length;
    const cancelled = properties.filter(p => getPropertyStatus(p) === "Cancelled").length;
    const activePercent = total > 0 ? Math.round((aktif / total) * 100) : 0;

    const monthlyMap = Array(12).fill(0);
    properties.forEach(p => { monthlyMap[new Date(p.createdAt).getMonth()]++; });
    const monthlyData = MONTH_NAMES.map((month, i) => ({ month, properti: monthlyMap[i] }));

    const statusData = [
      { name: "Aktif", value: aktif, color: "#10b981" },
      { name: "Segera JT", value: segera, color: "#f59e0b" },
      { name: "Expired", value: expired, color: "#ef4444" },
      { name: "Cancelled", value: cancelled, color: "#94a3b8" },
    ].filter(d => d.value > 0);

    const typeMap = {};
    properties.forEach(p => {
      const type = p.propertyData?.propertyType || "Lainnya";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const typeData = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    const cityMap = {};
    properties.forEach(p => {
      const city = p.propertyData?.city || "Lainnya";
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const cityData = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([city, count]) => ({ city, count }));

    const soonExpiring = properties
      .filter(p => getPropertyStatus(p) === "Segera Jatuh Tempo")
      .sort((a, b) => new Date(a.insuranceData?.endDate) - new Date(b.insuranceData?.endDate))
      .slice(0, 6);

    return { total, aktif, segera, expired, cancelled, activePercent, monthlyData, statusData, typeData, cityData, soonExpiring };
  }, [properties, getPropertyStatus]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return properties
      .filter(p =>
        !q ||
        p.ownerName?.toLowerCase().includes(q) ||
        p.propertyData?.propertyType?.toLowerCase().includes(q) ||
        p.propertyData?.city?.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [properties, search]);

  if (!stats) return (
    <div className="empty-state">
      <div className="empty-icon"><Building2 size={28} color="#94a3b8" /></div>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Belum ada data properti</p>
      <p style={{ fontSize: 12 }}>Mulai tambahkan properti nasabah</p>
    </div>
  );

  const PROPERTY_COLORS = ["#2563eb","#0ea5e9","#38bdf8","#7dd3fc","#bae6fd","#0369a1"];

  return (
    <>
      {/* Stat Grid */}
      <div className="stat-grid">
        <StatCard icon={Building2}   iconColor="#2563eb" iconBg="#dbeafe" label="Total Properti"       value={stats.total}                    sub="Properti terdaftar"          trend={100} delay={0.05} />
        <StatCard icon={ShieldCheck} iconColor="#10b981" iconBg="#d1fae5" label="Polis Aktif"          value={stats.aktif}                    sub={`${stats.activePercent}% dari total`} subColor="#10b981" trendUp trend={stats.activePercent} delay={0.1} />
        <StatCard icon={Clock}       iconColor="#d97706" iconBg="#fef3c7" label="Segera Jatuh Tempo"   value={stats.segera}                   sub="Dalam 30 hari" subColor="#d97706" trendUp={false} delay={0.15} />
        <StatCard icon={XCircle}     iconColor="#ef4444" iconBg="#fee2e2" label="Expired / Cancelled"  value={stats.expired + stats.cancelled} sub={`${stats.expired} expired · ${stats.cancelled} cancelled`} subColor="#ef4444" delay={0.2} />
      </div>

      {/* Charts row 1 */}
      <div className="row-2">
        <div className="card chart-card">
          <div className="chart-title">Properti Baru per Bulan</div>
          <div className="chart-sub">Berdasarkan tanggal pendaftaran</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={stats.monthlyData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora'" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora'" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="properti" name="Properti Baru" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#pGrad)" dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Distribusi Status Polis</div>
          <div className="chart-sub">Proporsi status seluruh properti</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <PieChart width={155} height={170}>
              <Pie data={stats.statusData} cx={72} cy={82} innerRadius={44} outerRadius={68} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {stats.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
            <div style={{ flex: 1 }}>
              {stats.statusData.map(item => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 260px 1fr", gap: 16, marginBottom: 18 }}>
        <div className="card chart-card">
          <div className="chart-title">Tipe & Persebaran Kota</div>
          <div className="chart-sub">Distribusi tipe properti terdaftar</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.typeData} layout="vertical" margin={{ top: 4, right: 14, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "'Sora'" }} allowDecimals={false} />
              <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#334155", fontFamily: "'Sora'" }} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Jumlah" radius={[0, 6, 6, 0]}>
                {stats.typeData.map((_, i) => (
                  <Cell key={i} fill={PROPERTY_COLORS[i % PROPERTY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card gauge-card" style={{ alignItems: "center" }}>
          <div className="chart-title" style={{ textAlign: "center" }}>Keaktifan</div>
          <div className="chart-sub" style={{ textAlign: "center" }}>Tingkat polis aktif</div>
          <GaugeChart percent={stats.activePercent} color="#0ea5e9" />
          <div style={{ display: "flex", justifyContent: "space-around", width: "100%", borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 8 }}>
            {[
              { label: "Total", val: stats.total, color: "#0f172a" },
              { label: "Aktif", val: stats.aktif, color: "#10b981" },
              { label: "Expired", val: stats.expired, color: "#ef4444" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <AlertTriangle size={15} color="#d97706" />
            <div className="chart-title">Segera Jatuh Tempo</div>
          </div>
          <div className="chart-sub">Polis properti berakhir dalam 30 hari</div>
          {!stats.soonExpiring.length ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <CheckCircle size={28} color="#10b981" style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>Semua polis aman 🎉</p>
            </div>
          ) : stats.soonExpiring.map(p => {
            const due = new Date(p.insuranceData?.endDate);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            const urgent = diffDays <= 7;
            return (
              <div key={p.id} className="alert-row" style={{
                backgroundColor: urgent ? "#eff6ff" : "#f0f9ff",
                border: `1px solid ${urgent ? "#bfdbfe" : "#bae6fd"}`,
              }}>
                <div className="avatar" style={{ background: urgent ? "#1d4ed8" : "#0ea5e9", color: "#fff" }}>
                  {p.ownerName?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 12.5, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.ownerName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.propertyData?.propertyType} · {p.propertyData?.city}</p>
                </div>
                <div style={{ backgroundColor: urgent ? "#1d4ed8" : "#0ea5e9", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {diffDays === 0 ? "Hari ini!" : `${diffDays}h`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent table */}
      <div className="card" style={{ padding: "22px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <div className="chart-title">Daftar Properti</div>
            <div className="chart-sub" style={{ marginBottom: 0 }}>Cari & filter properti terdaftar</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Cari nama, tipe, kota..." />
            <a href="/properties" className="view-all">Semua <ChevronRight size={14} /></a>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Pemilik", "Tipe Properti", "Kota", "Nilai Properti", "Jatuh Tempo", "Status"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>Tidak ada hasil untuk "{search}"</td></tr>
              ) : filtered.map((p, i) => {
                const status = getPropertyStatus(p);
                const due = p.insuranceData?.endDate
                  ? new Date(p.insuranceData.endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          {p.ownerName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{p.ownerName}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{p.ownerPhone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.propertyData?.propertyType || "—"}</td>
                    <td>{p.propertyData?.city || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(p.propertyData?.propertyValue)}</td>
                    <td style={{ color: "#475569" }}>{due}</td>
                    <td><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab]     = useState("vehicle");
  const [customers, setCustomers]     = useState([]);
  const [properties, setProperties]   = useState([]);
  const [companyProfile, setCompany]  = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [urgentCount, setUrgentCount] = useState(0);
  const [exporting, setExporting]     = useState(false);
  const { isMobile }                  = useBreakpoint();

  // ─── Export CSV ───────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    setExporting(true);
    try {
      let rows = [];
      let filename = "";

      if (activeTab === "vehicle") {
        filename = `nasabah-kendaraan-${new Date().toISOString().slice(0,10)}.csv`;
        const headers = ["Nama","Telepon","Merek Kendaraan","Model","No. Plat","Harga Mobil","Jatuh Tempo","Status"];
        rows = [
          headers,
          ...customers.map(c => {
            const status = getStatus(c.carData?.dueDate, c.status);
            const due = c.carData?.dueDate
              ? new Date(c.carData.dueDate).toLocaleDateString("id-ID")
              : "-";
            const price = c.carData?.carPrice
              ? Number(c.carData.carPrice).toLocaleString("id-ID")
              : "-";
            return [
              c.name || "-",
              c.phone || "-",
              c.carData?.carBrand || "-",
              c.carData?.carModel || "-",
              c.carData?.plateNumber || "-",
              price,
              due,
              status,
            ];
          }),
        ];
      } else {
        filename = `properti-${new Date().toISOString().slice(0,10)}.csv`;
        const headers = ["Nama Pemilik","Telepon","Tipe Properti","Kota","Nilai Properti","Jatuh Tempo","Status"];
        rows = [
          headers,
          ...properties.map(p => {
            const endDate = p.insuranceData?.endDate;
            let status = "Unknown";
            if (p.status === "Cancelled") status = "Cancelled";
            else if (endDate) {
              const diff = Math.ceil((new Date(endDate) - today) / 86400000);
              if (diff < 0) status = "Expired";
              else if (diff <= 30) status = "Segera Jatuh Tempo";
              else status = "Aktif";
            } else status = "Aktif";
            const due = endDate ? new Date(endDate).toLocaleDateString("id-ID") : "-";
            const val = p.propertyData?.propertyValue
              ? Number(p.propertyData.propertyValue).toLocaleString("id-ID")
              : "-";
            return [
              p.ownerName || "-",
              p.ownerPhone || "-",
              p.propertyData?.propertyType || "-",
              p.propertyData?.city || "-",
              val,
              due,
              status,
            ];
          }),
        ];
      }

      // Build CSV string — pakai semicolon supaya Excel pisah per kolom otomatis
      const csvContent = rows
        .map(row => row.map(cell => {
          const val = String(cell).replace(/"/g, '""');
          // Wrap dengan kutip jika ada semicolon, newline, atau kutip
          return /[;"'\n\r]/.test(val) ? `"${val}"` : val;
        }).join(";"))
        .join("\r\n");

      // BOM supaya Excel bisa baca karakter Indonesia
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export gagal:", e);
    } finally {
      setExporting(false);
    }
  }, [activeTab, customers, properties]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [custRes, propRes, compRes] = await Promise.allSettled([
        CustomerDAO.getAllCustomers(),
        PropertyDAO.getAllProperties(),
        CompanyDAO.getCompanyProfile(),
      ]);

      let custs = [];
      if (custRes.status === "fulfilled") {
        const res = custRes.value;
        custs = res?.customers || res?.data || (Array.isArray(res) ? res : []);
        setCustomers(custs);
      }

      let props = [];
      if (propRes.status === "fulfilled") {
        const res = propRes.value;
        props = res?.properties || res?.data || (Array.isArray(res) ? res : []);
        setProperties(props);
      }

      if (compRes.status === "fulfilled") {
        setCompany(compRes.value?.profile || null);
      }

      // Calculate urgent
      const urgentV = custs.filter(c => {
        if (!c.carData?.dueDate || c.status === "Cancelled") return false;
        const d = Math.ceil((new Date(c.carData.dueDate) - today) / 86400000);
        return d >= 0 && d <= 7;
      }).length;
      const urgentP = props.filter(p => {
        if (!p.insuranceData?.endDate || p.status === "Cancelled") return false;
        const d = Math.ceil((new Date(p.insuranceData.endDate) - today) / 86400000);
        return d >= 0 && d <= 7;
      }).length;
      setUrgentCount(urgentV + urgentP);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div className="dash-page">
          <div style={{ marginBottom: 24, height: 60, borderRadius: 16 }} className="skeleton" />
          <div className="stat-grid">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
          <div className="row-2">
            {[0,1].map(i => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <div className="skeleton" style={{ height: 20, width: "50%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 210 }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalStyles />
        <div className="dash-page">
          <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 14, padding: "20px 24px", color: "#dc2626", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Gagal memuat data</p>
              <p style={{ fontSize: 13 }}>{error}</p>
            </div>
            <button onClick={load} className="qa-btn qa-btn-ghost" style={{ color: "#dc2626", borderColor: "#fca5a5" }}>
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        </div>
      </>
    );
  }

  const co = activeTab === "vehicle" ? tokens.vehicle : tokens.property;

  return (
    <>
      <GlobalStyles />
      <div className="dash-page">

        {/* ── Header ── */}
        <div className="dash-header">
          {/* Kiri: logo + nama perusahaan — sembunyikan di mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: co.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: tokens.shadow.glow(co.glow),
              flexShrink: 0,
            }}>
              {activeTab === "vehicle" ? <Car size={24} color="#fff" /> : <Building2 size={24} color="#fff" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: isMobile ? 15 : 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {companyProfile?.companyName || "Dashboard Asuransi"}
              </h1>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {companyProfile?.companySubtitle || "Ringkasan nasabah & status polis"}
                {companyProfile?.companyCity ? ` · ${companyProfile.companyCity}` : ""}
              </p>
            </div>
          </div>

          {/* Kanan: tombol aksi — selalu di kanan baik mobile maupun desktop */}
          <div className="quick-actions">
            <button className="qa-btn qa-btn-ghost" onClick={load} aria-label="Refresh data">
              <RefreshCw size={14} />
              {!isMobile && <span className="qa-btn-text">Refresh</span>}
            </button>
            <button className="qa-btn qa-btn-primary" onClick={exportCSV} disabled={exporting} aria-label="Export CSV">
              <Download size={14} />
              {!isMobile && <span className="qa-btn-text">{exporting ? "Exporting..." : "Export CSV"}</span>}
            </button>
            {/* Tanggal: hanya tampil di desktop */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 12, color: "#475569", fontWeight: 500, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                <Calendar size={13} />
                {today.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="dash-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "vehicle"}
            className={`dash-tab${activeTab === "vehicle" ? " active-vehicle" : ""}`}
            onClick={() => setActiveTab("vehicle")}
          >
            <Car size={15} />
            Kendaraan
            <span className={activeTab === "vehicle" ? "tab-count" : "tab-count-inactive"}>
              {customers.length}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "property"}
            className={`dash-tab${activeTab === "property" ? " active-property" : ""}`}
            onClick={() => setActiveTab("property")}
          >
            <Building2 size={15} />
            Properti
            <span className={activeTab === "property" ? "tab-count" : "tab-count-inactive"}>
              {properties.length}
            </span>
          </button>
        </div>

        {/* ── Content ── */}
        {activeTab === "vehicle"
          ? <VehicleTab customers={customers} />
          : <PropertyTab properties={properties} />
        }
      </div>

    </>
  );
} 