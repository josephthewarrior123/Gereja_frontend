import { useState, useEffect, useMemo } from "react";
import {
  Users, ShieldCheck, Clock, ShieldOff, XCircle,
  Calendar, AlertTriangle, ChevronRight,
  Building2, Car,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import CustomerDAO from "../../daos/CustomerDao";
import PropertyDAO from "../../daos/propertyDao";
import CompanyDAO from "../../daos/CompanyDao";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

// ✅ FIX: cek status field dulu sebelum hitung dari dueDate
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
  "Aktif":              { bg: "#dcfce7", color: "#16a34a" },
  "Active":             { bg: "#dcfce7", color: "#16a34a" },
  "Segera Jatuh Tempo": { bg: "#fef3c7", color: "#d97706" },
  "Expired":            { bg: "#fee2e2", color: "#dc2626" },
  "Cancelled":          { bg: "#f1f5f9", color: "#64748b" },
  "Unknown":            { bg: "#f8fafc", color: "#94a3b8" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={s.tooltip}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#fff", fontSize: 12 }}>
          {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

const GaugeChart = ({ percent, label = "Polis Aktif", color = "#4F6EF7" }) => {
  const circ = Math.PI * 90;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width="220" height="130" viewBox="0 0 220 130">
      <path d="M 20 115 A 90 90 0 0 1 200 115" fill="none" stroke="#E2E8F0" strokeWidth="18" strokeLinecap="round" />
      <path d="M 20 115 A 90 90 0 0 1 200 115" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
      <text x="110" y="98" textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: "#1e293b", fontFamily: "'DM Sans',sans-serif" }}>
        {percent.toFixed(0)}%
      </text>
      <text x="110" y="116" textAnchor="middle" style={{ fontSize: 11, fill: color, fontFamily: "'DM Sans',sans-serif" }}>
        {label}
      </text>
    </svg>
  );
};

const StatCard = ({ icon: Icon, iconColor, iconBg, label, value, sub, subColor }) => (
  <div style={s.statCard}>
    <div style={{ ...s.statIconWrap, backgroundColor: iconBg }}>
      <Icon size={22} color={iconColor} strokeWidth={2} />
    </div>
    <p style={s.statLabel}>{label}</p>
    <p style={s.statValue}>{value}</p>
    {sub && <p style={{ ...s.statSub, color: subColor || "#64748b" }}>{sub}</p>}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Unknown"];
  return (
    <span style={{ ...s.badge, backgroundColor: cfg.bg, color: cfg.color }}>
      {status}
    </span>
  );
};

// ─── TAB: Kendaraan ──────────────────────────────────────────────────────────
function VehicleTab({ customers }) {
  const stats = useMemo(() => {
    if (!customers.length) return null;
    const total = customers.length;

    // ✅ FIX: pass c.status ke getStatus supaya Cancelled ikut terhitung
    const aktif     = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Aktif").length;
    const segera    = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Segera Jatuh Tempo").length;
    const expired   = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Expired").length;
    const cancelled = customers.filter(c => getStatus(c.carData?.dueDate, c.status) === "Cancelled").length;
    const activePercent = total > 0 ? Math.round((aktif / total) * 100) : 0;

    const monthlyMap = Array(12).fill(0);
    customers.forEach(c => { monthlyMap[new Date(c.createdAt).getMonth()]++; });
    const monthlyData = MONTH_NAMES.map((month, i) => ({ month, nasabah: monthlyMap[i] }));

    const statusData = [
      { name: "Aktif",      value: aktif,     color: "#4F6EF7" },
      { name: "Segera JT",  value: segera,    color: "#f59e0b" },
      { name: "Expired",    value: expired,   color: "#ef4444" },
      { name: "Cancelled",  value: cancelled, color: "#94a3b8" },
    ].filter(d => d.value > 0);

    const brandMap = {};
    customers.forEach(c => {
      const brand = c.carData?.carBrand || "Lainnya";
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    const brandData = Object.entries(brandMap)
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ brand, count }));

    const soonExpiring = customers
      .filter(c => getStatus(c.carData?.dueDate, c.status) === "Segera Jatuh Tempo")
      .sort((a, b) => new Date(a.carData.dueDate) - new Date(b.carData.dueDate))
      .slice(0, 5);

    const recent = [...customers]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    return { total, aktif, segera, expired, cancelled, activePercent, monthlyData, statusData, brandData, soonExpiring, recent };
  }, [customers]);

  if (!stats) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Belum ada data kendaraan.</p>;

  return (
    <>
      {/* Stat Cards + Gauge */}
      <div style={s.row1}>
        <div style={s.statGrid}>
          <StatCard icon={Users}      iconColor="#4F6EF7" iconBg="#EEF2FF" label="Total Nasabah"      value={stats.total}   sub="Nasabah terdaftar" />
          <StatCard icon={ShieldCheck} iconColor="#16a34a" iconBg="#dcfce7" label="Polis Aktif"       value={stats.aktif}   sub={`${stats.activePercent}% dari total`} subColor="#22c55e" />
          <StatCard icon={Clock}      iconColor="#d97706" iconBg="#fef3c7" label="Segera Jatuh Tempo" value={stats.segera}  sub="Dalam 30 hari ke depan" subColor="#f59e0b" />
          <StatCard icon={ShieldOff}  iconColor="#dc2626" iconBg="#fee2e2" label="Expired"            value={stats.expired} sub={`+ ${stats.cancelled} Cancelled`} subColor="#ef4444" />
        </div>
        <div style={s.gaugeCard}>
          <p style={s.chartTitle}>Tingkat Keaktifan Polis</p>
          <p style={s.chartSub}>Persentase polis aktif dari total nasabah</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <GaugeChart percent={stats.activePercent} label="Polis Aktif" color="#4F6EF7" />
          </div>
          <div style={s.gaugeFooter}>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Total</span><span style={s.gaugeFValue}>{stats.total}</span></div>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Aktif</span><span style={{ ...s.gaugeFValue, color: "#22c55e" }}>{stats.aktif}</span></div>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Expired</span><span style={{ ...s.gaugeFValue, color: "#ef4444" }}>{stats.expired}</span></div>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Cancel</span><span style={{ ...s.gaugeFValue, color: "#94a3b8" }}>{stats.cancelled}</span></div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={s.row2}>
        <div style={s.chartCard}>
          <p style={s.chartTitle}>Nasabah Baru per Bulan</p>
          <p style={s.chartSub}>Berdasarkan tanggal pendaftaran</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="nasabah" name="Nasabah Baru" fill="#4F6EF7" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.chartCard}>
          <p style={s.chartTitle}>Distribusi Status Polis</p>
          <p style={s.chartSub}>Termasuk Cancelled</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
            <PieChart width={160} height={170}>
              <Pie data={stats.statusData} cx={75} cy={80} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                {stats.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.statusData.map(item => (
                <div key={item.name} style={s.legendRow}>
                  <div style={{ ...s.legendDot, backgroundColor: item.color }} />
                  <span style={s.legendLabel}>{item.name}</span>
                  <span style={s.legendValue}>{item.value} nasabah</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Brand + Soon Expiring */}
      <div style={s.row2}>
        <div style={s.chartCard}>
          <p style={s.chartTitle}>Merek Kendaraan</p>
          <p style={s.chartSub}>Distribusi merek dari seluruh nasabah</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.brandData} layout="vertical" margin={{ top: 8, right: 20, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <YAxis type="category" dataKey="brand" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#334155" }} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Jumlah" fill="#A5B4FC" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.alertCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <AlertTriangle size={16} color="#d97706" />
            <p style={s.chartTitle}>Segera Jatuh Tempo</p>
          </div>
          <p style={s.chartSub}>Polis berakhir dalam 30 hari ke depan</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {!stats.soonExpiring.length ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 20 }}>Tidak ada polis yang segera jatuh tempo 🎉</p>
            ) : stats.soonExpiring.map(c => {
              const due = new Date(c.carData.dueDate);
              const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
              return (
                <div key={c.id} style={s.alertRow}>
                  <div style={s.alertAvatar}>{c.name?.[0]?.toUpperCase() || "?"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.alertName}>{c.name}</p>
                    <p style={s.alertSub}>{c.carData?.carBrand} {c.carData?.carModel} · {c.carData?.plateNumber}</p>
                  </div>
                  <div style={s.alertBadge}>{diffDays === 0 ? "Hari ini!" : `${diffDays}h lagi`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Table */}
      <div style={s.tableCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p style={s.chartTitle}>Nasabah Terbaru</p>
            <p style={s.chartSub}>Urut berdasarkan tanggal pendaftaran terbaru</p>
          </div>
          <a href="/customers" style={s.viewAll}>Lihat Semua <ChevronRight size={14} style={{ verticalAlign: "middle" }} /></a>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>{["Nama", "Kendaraan", "No. Plat", "Harga Mobil", "Jatuh Tempo", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {stats.recent.map((c, i) => {
                const status = getStatus(c.carData?.dueDate, c.status);
                const due = c.carData?.dueDate
                  ? new Date(c.carData.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={s.avatar}>{c.name?.[0]?.toUpperCase() || "?"}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{c.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{c.carData?.carBrand} {c.carData?.carModel}</td>
                    <td style={s.td}><span style={s.plateChip}>{c.carData?.plateNumber || "—"}</span></td>
                    <td style={s.td}>{formatRupiah(c.carData?.carPrice)}</td>
                    <td style={s.td}>{due}</td>
                    <td style={s.td}><StatusBadge status={status} /></td>
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

// ─── TAB: Properti ────────────────────────────────────────────────────────────
function PropertyTab({ properties }) {
  const getPropertyStatus = (p) => {
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
  };

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
      { name: "Aktif",     value: aktif,     color: "#7c3aed" },
      { name: "Segera JT", value: segera,    color: "#f59e0b" },
      { name: "Expired",   value: expired,   color: "#ef4444" },
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

    const soonExpiring = properties
      .filter(p => getPropertyStatus(p) === "Segera Jatuh Tempo")
      .sort((a, b) => new Date(a.insuranceData?.endDate) - new Date(b.insuranceData?.endDate))
      .slice(0, 5);

    const recent = [...properties]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    return { total, aktif, segera, expired, cancelled, activePercent, monthlyData, statusData, typeData, soonExpiring, recent };
  }, [properties]);

  if (!stats) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Belum ada data properti.</p>;

  return (
    <>
      {/* Stat Cards + Gauge */}
      <div style={s.row1}>
        <div style={s.statGrid}>
          <StatCard icon={Building2}   iconColor="#7c3aed" iconBg="#f5f3ff" label="Total Properti"     value={stats.total}   sub="Properti terdaftar" />
          <StatCard icon={ShieldCheck} iconColor="#16a34a" iconBg="#dcfce7" label="Polis Aktif"        value={stats.aktif}   sub={`${stats.activePercent}% dari total`} subColor="#22c55e" />
          <StatCard icon={Clock}       iconColor="#d97706" iconBg="#fef3c7" label="Segera Jatuh Tempo" value={stats.segera}  sub="Dalam 30 hari ke depan" subColor="#f59e0b" />
          <StatCard icon={XCircle}     iconColor="#dc2626" iconBg="#fee2e2" label="Expired"            value={stats.expired} sub={`+ ${stats.cancelled} Cancelled`} subColor="#ef4444" />
        </div>
        <div style={s.gaugeCard}>
          <p style={s.chartTitle}>Tingkat Keaktifan Polis</p>
          <p style={s.chartSub}>Persentase polis aktif dari total properti</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <GaugeChart percent={stats.activePercent} label="Polis Aktif" color="#7c3aed" />
          </div>
          <div style={s.gaugeFooter}>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Total</span><span style={s.gaugeFValue}>{stats.total}</span></div>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Aktif</span><span style={{ ...s.gaugeFValue, color: "#22c55e" }}>{stats.aktif}</span></div>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Expired</span><span style={{ ...s.gaugeFValue, color: "#ef4444" }}>{stats.expired}</span></div>
            <div style={s.gaugeFooterItem}><span style={s.gaugeFLabel}>Cancel</span><span style={{ ...s.gaugeFValue, color: "#94a3b8" }}>{stats.cancelled}</span></div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={s.row2}>
        <div style={s.chartCard}>
          <p style={s.chartTitle}>Properti Baru per Bulan</p>
          <p style={s.chartSub}>Berdasarkan tanggal pendaftaran</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="properti" name="Properti Baru" fill="#7c3aed" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.chartCard}>
          <p style={s.chartTitle}>Distribusi Status Polis</p>
          <p style={s.chartSub}>Termasuk Cancelled</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
            <PieChart width={160} height={170}>
              <Pie data={stats.statusData} cx={75} cy={80} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                {stats.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.statusData.map(item => (
                <div key={item.name} style={s.legendRow}>
                  <div style={{ ...s.legendDot, backgroundColor: item.color }} />
                  <span style={s.legendLabel}>{item.name}</span>
                  <span style={s.legendValue}>{item.value} properti</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Type Chart + Soon Expiring */}
      <div style={s.row2}>
        <div style={s.chartCard}>
          <p style={s.chartTitle}>Tipe Properti</p>
          <p style={s.chartSub}>Distribusi tipe dari seluruh properti</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stats.typeData} layout="vertical" margin={{ top: 8, right: 20, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#334155" }} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Jumlah" fill="#C4B5FD" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.alertCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <AlertTriangle size={16} color="#d97706" />
            <p style={s.chartTitle}>Segera Jatuh Tempo</p>
          </div>
          <p style={s.chartSub}>Polis properti berakhir dalam 30 hari</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {!stats.soonExpiring.length ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 20 }}>Tidak ada polis yang segera jatuh tempo 🎉</p>
            ) : stats.soonExpiring.map(p => {
              const due = new Date(p.insuranceData?.endDate);
              const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} style={{ ...s.alertRow, backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" }}>
                  <div style={{ ...s.alertAvatar, backgroundColor: "#7c3aed" }}>{p.ownerName?.[0]?.toUpperCase() || "?"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.alertName}>{p.ownerName}</p>
                    <p style={s.alertSub}>{p.propertyData?.propertyType} · {p.propertyData?.city}</p>
                  </div>
                  <div style={{ ...s.alertBadge, backgroundColor: "#7c3aed" }}>{diffDays === 0 ? "Hari ini!" : `${diffDays}h lagi`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Table */}
      <div style={s.tableCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p style={s.chartTitle}>Properti Terbaru</p>
            <p style={s.chartSub}>Urut berdasarkan tanggal pendaftaran terbaru</p>
          </div>
          <a href="/properties" style={s.viewAll}>Lihat Semua <ChevronRight size={14} style={{ verticalAlign: "middle" }} /></a>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>{["Nama Pemilik", "Tipe Properti", "Kota", "Nilai Properti", "Jatuh Tempo", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {stats.recent.map((p, i) => {
                const status = getPropertyStatus(p);
                const due = p.insuranceData?.endDate
                  ? new Date(p.insuranceData.endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...s.avatar, backgroundColor: "#f5f3ff", color: "#7c3aed" }}>{p.ownerName?.[0]?.toUpperCase() || "?"}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{p.ownerName}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{p.ownerPhone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{p.propertyData?.propertyType || "—"}</td>
                    <td style={s.td}>{p.propertyData?.city || "—"}</td>
                    <td style={s.td}>{formatRupiah(p.propertyData?.propertyValue)}</td>
                    <td style={s.td}>{due}</td>
                    <td style={s.td}><StatusBadge status={status} /></td>
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab]           = useState("vehicle");
  const [customers, setCustomers]           = useState([]);
  const [properties, setProperties]         = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, propRes, compRes] = await Promise.allSettled([
          CustomerDAO.getAllCustomers(),
          PropertyDAO.getAllProperties(),
          CompanyDAO.getCompanyProfile(),
        ]);

        if (custRes.status === "fulfilled") {
          const res = custRes.value;
          setCustomers(res?.customers || res?.data || (Array.isArray(res) ? res : []));
        }
        if (propRes.status === "fulfilled") {
          const res = propRes.value;
          setProperties(res?.properties || res?.data || (Array.isArray(res) ? res : []));
        }
        if (compRes.status === "fulfilled") {
          setCompanyProfile(compRes.value?.profile || null);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={s.spinner} />
          <p style={{ color: "#64748b", marginTop: 16, fontSize: 14 }}>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div style={s.page}><div style={s.errorBox}>Gagal memuat data: {error}</div></div>;
  }

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {companyProfile?.companyLogo?.url && (
            <img src={companyProfile.companyLogo.url} alt="Logo"
              style={{ width: 48, height: 48, borderRadius: 12, objectFit: "contain", border: "1px solid #e2e8f0", backgroundColor: "#fff", padding: 4 }}
            />
          )}
          <div>
            <h1 style={s.headerTitle}>{companyProfile?.companyName || "Dashboard Asuransi"}</h1>
            <p style={s.headerSub}>
              {companyProfile?.companySubtitle
                ? `${companyProfile.companySubtitle}${companyProfile.companyCity ? " · " + companyProfile.companyCity : ""}`
                : "Ringkasan data nasabah & status polis"}
            </p>
          </div>
        </div>
        <div style={s.dateChip}>
          <Calendar size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          {today.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabContainer}>
        <button
          style={{ ...s.tabBtn, ...(activeTab === "vehicle" ? s.tabBtnActiveBlue : {}) }}
          onClick={() => setActiveTab("vehicle")}
        >
          <Car size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Kendaraan
          <span style={{
            ...s.tabCount,
            backgroundColor: activeTab === "vehicle" ? "#4F6EF7" : "#e2e8f0",
            color: activeTab === "vehicle" ? "#fff" : "#64748b"
          }}>
            {customers.length}
          </span>
        </button>
        <button
          style={{ ...s.tabBtn, ...(activeTab === "property" ? s.tabBtnActivePurple : {}) }}
          onClick={() => setActiveTab("property")}
        >
          <Building2 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Properti
          <span style={{
            ...s.tabCount,
            backgroundColor: activeTab === "property" ? "#7c3aed" : "#e2e8f0",
            color: activeTab === "property" ? "#fff" : "#64748b"
          }}>
            {properties.length}
          </span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "vehicle"
        ? <VehicleTab customers={customers} />
        : <PropertyTab properties={properties} />
      }

    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: { padding: "28px 32px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#1e293b" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.5px" },
  headerSub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  dateChip: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#475569", fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", whiteSpace: "nowrap" },

  tabContainer: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0", paddingBottom: 0 },
  tabBtn: { display: "flex", alignItems: "center", padding: "10px 20px", borderRadius: "10px 10px 0 0", border: "2px solid transparent", borderBottom: "none", background: "none", fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "all 0.2s", marginBottom: -2 },
  tabBtnActiveBlue:   { color: "#4F6EF7", backgroundColor: "#EEF2FF", borderColor: "#e2e8f0", borderBottomColor: "#EEF2FF" },
  tabBtnActivePurple: { color: "#7c3aed", backgroundColor: "#f5f3ff", borderColor: "#e2e8f0", borderBottomColor: "#f5f3ff" },
  tabCount: { marginLeft: 8, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700, transition: "all 0.2s" },

  row1: { display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, marginBottom: 18 },
  statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  statCard: { backgroundColor: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 4 },
  statIconWrap: { width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statLabel: { margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  statValue: { margin: 0, fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 },
  statSub: { margin: 0, fontSize: 12 },

  gaugeCard: { backgroundColor: "#fff", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  gaugeFooter: { display: "flex", justifyContent: "space-around", borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 8 },
  gaugeFooterItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  gaugeFLabel: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" },
  gaugeFValue: { fontSize: 20, fontWeight: 800, color: "#0f172a" },

  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 },
  chartCard: { backgroundColor: "#fff", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  chartTitle: { margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" },
  chartSub: { margin: "3px 0 10px", fontSize: 12, color: "#94a3b8" },

  legendRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f8fafc" },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  legendLabel: { fontSize: 13, color: "#334155", flex: 1 },
  legendValue: { fontSize: 13, fontWeight: 700, color: "#0f172a" },

  alertCard: { backgroundColor: "#fff", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  alertRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", backgroundColor: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" },
  alertAvatar: { width: 34, height: 34, borderRadius: "50%", backgroundColor: "#f59e0b", color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  alertName: { margin: 0, fontWeight: 700, fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  alertSub: { margin: 0, fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  alertBadge: { backgroundColor: "#f59e0b", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 18 },
  viewAll: { color: "#4F6EF7", fontWeight: 700, fontSize: 13, textDecoration: "none" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, color: "#94a3b8", fontWeight: 700, padding: "10px 12px", borderBottom: "2px solid #f1f5f9", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" },
  td: { padding: "12px 12px", fontSize: 13, color: "#334155", verticalAlign: "middle" },
  avatar: { width: 32, height: 32, borderRadius: "50%", backgroundColor: "#EEF2FF", color: "#4F6EF7", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  plateChip: { backgroundColor: "#f1f5f9", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "#334155" },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },

  tooltip: { backgroundColor: "#1e293b", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" },
  spinner: { width: 40, height: 40, borderRadius: "50%", border: "4px solid #EEF2FF", borderTopColor: "#4F6EF7", margin: "0 auto" },
  errorBox: { backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px", color: "#dc2626", fontSize: 14 },
};