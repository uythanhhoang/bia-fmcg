'use client';

import React, { useState } from 'react';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell
} from 'recharts';
import {
  AlertTriangle, TrendingUp, TrendingDown, MapPin, Package, DollarSign,
  Radio, Target, Truck, Gauge, ChevronRight, Clock, ShieldAlert, Sparkles
} from 'lucide-react';

/* ---------------------------------------------------------
   FONTS — loaded via next/font/google (self-hosted at build
   time, no runtime request, no flash of unstyled text)
--------------------------------------------------------- */
const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const C = {
  bg: '#0A0F1C',
  panel: '#111827',
  panelAlt: '#161F32',
  line: '#232D42',
  navy: '#13294B',
  gold: '#C9A227',
  goldSoft: '#E8C766',
  amber: '#F2A900',
  red: '#E5484D',
  green: '#3DD68C',
  ink: '#E7EAF0',
  sub: '#8B95A7',
  faint: '#5B6478',
};

const fontDisplay = 'var(--font-display), Georgia, serif';
const fontMono = 'var(--font-mono), "Courier New", monospace';
const fontBody = 'var(--font-body), system-ui, sans-serif';

/* ---------------------------------------------------------
   DATA — Executive Tab (alerts + market share) giờ fetch động từ Supabase
   (bảng market_alerts, market_brands) qua props initialAlerts/initialMarketShare,
   xem app/page.tsx. Các phần dưới đây (pricing, distribution, forecast, jobs)
   vẫn là dữ liệu tĩnh từ blueprint gốc — sẽ migrate ở giai đoạn tiếp theo
   (product_skus, dynamic_pricing_matrix, field_sales_performance đã có schema
   sẵn trong Supabase nhưng chưa được nối vào UI).
--------------------------------------------------------- */
// Màu hiển thị theo brand — thuần presentation, không lưu trong DB.
const BRAND_COLORS = {
  'Heineken Vietnam': C.gold,
  'Heineken VN': C.gold,
  'SABECO': C.amber,
  'Carlsberg Vietnam': '#6B8CAE',
  'Carlsberg VN': '#6B8CAE',
  'HABECO': '#8B95A7',
  'Bia Ngoại Nhập/Craft': '#4A5468',
  'Ngoại nhập/Craft': '#4A5468',
};

/**
 * Chuyển 1 dòng bảng `market_brands` (Supabase) thành shape dùng cho BarChart.
 */
function mapBrandRow(row) {
  return {
    name: row.brand_name,
    share: Number(row.market_share_volume),
    fill: BRAND_COLORS[row.brand_name] || C.faint,
  };
}

/**
 * Chuyển 1 dòng bảng `market_alerts` (Supabase) thành shape dùng cho AlertCard.
 * - `level` hiển thị (critical/watch/opportunity) tách biệt với `priority` gốc trong DB:
 *   `priority` (CRITICAL/WARNING) do trigger enforce_alert_playbook_policy tự động quản lý
 *   theo impact/urgency; `alert_type` (THREAT/OPPORTUNITY) là nhãn phân loại độc lập, đặt
 *   tường minh khi insert — không bị trigger ghi đè.
 */
function mapAlertRow(row) {
  const level =
    row.alert_type === 'OPPORTUNITY' ? 'opportunity' :
    row.priority === 'CRITICAL' ? 'critical' : 'watch';
  return {
    id: row.id,
    level,
    title: row.title,
    details: row.details,
    action: row.strategic_action,
    impact: row.impact,
    urgency: row.urgency,
  };
}

const pricingMatrix = [
  { tier: 'Premium', sku: 'Heineken Original', price: 457000, unit: 'thùng' },
  { tier: 'Premium', sku: 'Heineken Silver', price: 467700, unit: 'thùng' },
  { tier: 'Premium', sku: 'Budweiser Sleek', price: 410000, unit: 'thùng' },
  { tier: 'Super-Premium', sku: 'Corona Extra', price: 685000, unit: 'thùng' },
  { tier: 'Super-Premium', sku: '1664 Blanc', price: 510000, unit: 'thùng' },
  { tier: 'Super-Premium', sku: 'Budweiser Budvar (500ml)', price: 1580000, unit: 'thùng' },
];

const marginWaterfall = [
  { label: 'Giá CIF Nhập Khẩu', note: 'Điểm khởi đầu chuỗi giá trị' },
  { label: 'Trade Spend & Markup', note: 'Chi phí thương mại + biên NPP' },
  { label: 'Giá Bán Buôn Vào Chuỗi', note: 'Giá giao cho Modern Trade' },
  { label: 'Margin Chuỗi Siêu Thị', note: '27% – 31%' },
  { label: 'Giá Người Tiêu Dùng Đề Xuất', note: 'RSP hiển thị trên kệ' },
];

const regions = [
  { name: 'Miền Bắc', outlets: 'Kim Cương / Vàng / Bạc', strike: 68, drop: 74, red: 81 },
  { name: 'Miền Trung', outlets: 'Kim Cương / Vàng / Bạc', strike: 61, drop: 69, red: 73 },
  { name: 'Miền Nam', outlets: 'Kim Cương / Vàng / Bạc', strike: 74, drop: 82, red: 86 },
];

const forecastData = [
  { day: 'Hiện tại', base: 100, sctImpact: 100 },
  { day: '30 ngày', base: 101, sctImpact: 97 },
  { day: '90 ngày', base: 103, sctImpact: 91 },
  { day: '180 ngày', base: 105, sctImpact: 84 },
];

const channelShift = [
  { year: '2023', onTrade: 46, offTrade: 54 },
  { year: '2024', onTrade: 42, offTrade: 58 },
  { year: '2025', onTrade: 39.8, offTrade: 60.2 },
];

const marketGaps = [
  { sku: 'Asahi', origin: 'Nhật Bản', phase: 'Phase 1', note: 'Nghiên cứu thị trường & định giá thử nghiệm' },
  { sku: 'Kirin', origin: 'Nhật Bản', phase: 'Phase 2', note: 'Pilot tại 50 điểm bán WinMart+ trung tâm' },
  { sku: 'Tsingtao', origin: 'Trung Quốc', phase: 'Phase 3', note: 'Mở rộng toàn hệ thống nếu pilot đạt KPI' },
];

const jobs = [
  { name: 'JOB 1 — Market Alert', cadence: 'Mỗi 30 phút', desc: 'Quét biến động giá >15% hoặc SKU mới của đối thủ' },
  { name: 'JOB 2 — Daily Executive Brief', cadence: '07:00 hằng ngày', desc: 'Top 5 diễn biến quan trọng nhất, dưới 500 từ' },
  { name: 'JOB 3 — Weekly Market Review', cadence: 'Thứ Hai, 07:30', desc: 'Giá bán lẻ, SoV, cường độ khuyến mãi — dưới 600 từ' },
  { name: 'JOB 4 — Monthly Board Report', cadence: 'Ngày 1 hằng tháng, 08:00', desc: 'Dự báo 90 ngày, RGB, đề xuất Trade Spend — dưới 1,000 từ' },
];

/* ---------------------------------------------------------
   SMALL BUILDING BLOCKS
--------------------------------------------------------- */
function fmt(n) {
  return n.toLocaleString('vi-VN');
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: '18px 20px', flex: 1, minWidth: 180,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={15} color={accent || C.gold} />
        <span style={{ fontFamily: fontBody, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.sub }}>{label}</span>
      </div>
      <div style={{ fontFamily: fontMono, fontSize: 26, color: C.ink, fontWeight: 600, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: fontBody, fontSize: 12, color: C.faint, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function LevelTag({ level }) {
  const map = {
    critical: { bg: 'rgba(229,72,77,0.15)', fg: C.red, label: 'NGHIÊM TRỌNG' },
    watch: { bg: 'rgba(242,169,0,0.15)', fg: C.amber, label: 'THEO DÕI SÁT' },
    opportunity: { bg: 'rgba(61,214,140,0.15)', fg: C.green, label: 'CƠ HỘI' },
  };
  const s = map[level];
  return (
    <span style={{
      fontFamily: fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
      padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.fg,
    }}>{s.label}</span>
  );
}

function AlertCard({ a }) {
  const borderColor = a.level === 'critical' ? C.red : a.level === 'watch' ? C.amber : C.green;
  return (
    <div style={{
      background: C.panelAlt, borderLeft: `3px solid ${borderColor}`, borderRadius: 6,
      padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <LevelTag level={a.level} />
        <span style={{ fontFamily: fontMono, fontSize: 11, color: C.faint }}>
          IMPACT {a.impact}/5 · URGENCY {a.urgency}/5
        </span>
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 15.5, color: C.ink, marginBottom: 10, lineHeight: 1.35 }}>
        {a.title}
      </div>
      <div style={{ fontFamily: fontBody, fontSize: 12.5, color: C.sub, lineHeight: 1.55, marginBottom: 10 }}>
        {a.details}
      </div>
      {a.action && (
        <div style={{ fontFamily: fontBody, fontSize: 12.5, color: C.gold, lineHeight: 1.5 }}>
          <b>Khuyến nghị:</b> {a.action}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {Icon && <Icon size={16} color={C.gold} />}
      <h2 style={{ fontFamily: fontDisplay, fontSize: 17, color: C.ink, fontWeight: 600, margin: 0 }}>{children}</h2>
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 22, ...style }}>
      {children}
    </div>
  );
}

function ProgressBar({ value, label, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fontBody, fontSize: 12, color: C.sub, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: fontMono, color: C.ink }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: C.line, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color || C.gold, borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   TABS
--------------------------------------------------------- */
function ExecutiveTab({ alertData, marketShareData, dataError }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      <div>
        <SectionTitle icon={Radio}>Real-Time System Alerts (Job 1)</SectionTitle>
        {dataError && (
          <div style={{ fontFamily: fontBody, fontSize: 12.5, color: C.red, marginBottom: 12 }}>
            Không tải được dữ liệu từ Supabase ({dataError}). Kiểm tra biến môi trường
            NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel.
          </div>
        )}
        {!dataError && alertData.length === 0 && (
          <div style={{ fontFamily: fontBody, fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
            Chưa có cảnh báo nào trong bảng market_alerts.
          </div>
        )}
        {alertData.map(a => <AlertCard key={a.id} a={a} />)}
      </div>
      <div>
        <SectionTitle icon={Package}>Tỷ Trọng Thị Phần Nội Địa (Volume)</SectionTitle>
        <Panel>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketShareData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                <XAxis type="number" stroke={C.faint} fontSize={11} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" stroke={C.sub} fontSize={11.5} width={110} />
                <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, fontFamily: fontMono, fontSize: 12 }}
                  formatter={v => [`${v}%`, 'Thị phần']} />
                <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                  {marketShareData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <SectionTitle icon={Clock}>Lịch Job Tự Động</SectionTitle>
          <Panel>
            {jobs.map((j, i) => (
              <div key={i} style={{ paddingBottom: i < jobs.length - 1 ? 12 : 0, marginBottom: i < jobs.length - 1 ? 12 : 0, borderBottom: i < jobs.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ fontFamily: fontMono, fontSize: 12.5, color: C.gold, marginBottom: 3 }}>{j.name}</div>
                <div style={{ fontFamily: fontBody, fontSize: 12, color: C.sub }}>{j.desc}</div>
                <div style={{ fontFamily: fontBody, fontSize: 11, color: C.faint, marginTop: 2 }}>{j.cadence}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function PricingTab() {
  const tiers = ['Premium', 'Super-Premium'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
      <div>
        <SectionTitle icon={DollarSign}>Ma Trận SKU Giá Thị Trường Động — WinMart</SectionTitle>
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          {tiers.map(tier => (
            <div key={tier}>
              <div style={{ padding: '10px 20px', background: C.navy, fontFamily: fontMono, fontSize: 11, letterSpacing: '0.06em', color: C.goldSoft, textTransform: 'uppercase' }}>
                {tier} Tier
              </div>
              {pricingMatrix.filter(p => p.tier === tier).map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 20px', borderBottom: `1px solid ${C.line}`,
                }}>
                  <span style={{ fontFamily: fontBody, fontSize: 13.5, color: C.ink }}>{p.sku}</span>
                  <span style={{ fontFamily: fontMono, fontSize: 13.5, color: C.gold }}>{fmt(p.price)} đ / {p.unit}</span>
                </div>
              ))}
            </div>
          ))}
        </Panel>
        <div style={{ marginTop: 16, fontFamily: fontBody, fontSize: 12, color: C.faint, lineHeight: 1.6 }}>
          <b style={{ color: C.sub }}>Cơ chế phân tích Delta:</b> tự động tính chênh lệch giữa giá General Trade và giá Modern Trade để nhận diện chiến lược co-funded deal giữa NPP và chuỗi retail.
        </div>
      </div>

      <div>
        <SectionTitle icon={TrendingUp}>Cấu Trúc Giá SKU Mới — Tsingtao (Thử Nghiệm)</SectionTitle>
        <Panel>
          {marginWaterfall.slice().reverse().map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < marginWaterfall.length - 1 ? 4 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: C.gold, flexShrink: 0 }} />
                {i < marginWaterfall.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 26, background: C.line }} />}
              </div>
              <div style={{ paddingBottom: 18 }}>
                <div style={{ fontFamily: fontBody, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{step.label}</div>
                <div style={{ fontFamily: fontBody, fontSize: 11.5, color: C.faint, marginTop: 2 }}>{step.note}</div>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function DistributionTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
      {regions.map((r, i) => (
        <div key={i}>
          <SectionTitle icon={MapPin}>{r.name}</SectionTitle>
          <Panel>
            <div style={{ fontFamily: fontBody, fontSize: 11.5, color: C.faint, marginBottom: 14 }}>
              Phân khúc điểm bán: {r.outlets}
            </div>
            <ProgressBar value={r.strike} label="Strike Rate" color={C.gold} />
            <ProgressBar value={r.drop} label="Drop Size Index" color={C.amber} />
            <ProgressBar value={r.red} label="RED Score" color={C.green} />
          </Panel>
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
        <SectionTitle icon={Truck}>Ma Trận Phân Khúc Điểm Bán</SectionTitle>
        <Panel>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { name: 'Kim Cương', desc: 'Dung lượng tiêu thụ cao nhất — tần suất viếng thăm dày nhất', color: C.gold },
              { name: 'Vàng', desc: 'Dung lượng trung bình — tần suất viếng thăm chuẩn', color: C.amber },
              { name: 'Bạc', desc: 'Dung lượng thấp — tần suất viếng thăm tối ưu hóa chi phí', color: C.faint },
            ].map((g, i) => (
              <div key={i} style={{ flex: 1, minWidth: 200, borderLeft: `3px solid ${g.color}`, paddingLeft: 14 }}>
                <div style={{ fontFamily: fontMono, fontSize: 12.5, color: g.color, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontFamily: fontBody, fontSize: 12, color: C.sub }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ForecastTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
      <div>
        <SectionTitle icon={TrendingDown}>Dự Báo Sản Lượng 30-90-180 Ngày (Chỉ Số Nền = 100)</SectionTitle>
        <Panel>
          <div style={{ fontFamily: fontBody, fontSize: 11.5, color: C.faint, marginBottom: 14 }}>
            Kịch bản minh họa dưới tác động kép SCT 65% (lộ trình chính thức theo Luật 66/2025/QH15) và Nghị định 168 — không phải số liệu công bố chính thức.
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                <XAxis dataKey="day" stroke={C.sub} fontSize={11.5} />
                <YAxis stroke={C.faint} fontSize={11} domain={[75, 108]} />
                <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, fontFamily: fontMono, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: fontBody, fontSize: 12 }} />
                <Line type="monotone" dataKey="base" name="Kịch bản nền" stroke={C.sub} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sctImpact" name="SCT 65% + NĐ 168" stroke={C.red} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div style={{ marginTop: 16 }}>
          <SectionTitle icon={ChevronRight}>Dịch Chuyển Kênh Tiêu Thụ</SectionTitle>
          <Panel>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={channelShift}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="year" stroke={C.sub} fontSize={11.5} />
                  <YAxis stroke={C.faint} fontSize={11} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, fontFamily: fontMono, fontSize: 12 }} formatter={v => `${v}%`} />
                  <Legend wrapperStyle={{ fontFamily: fontBody, fontSize: 12 }} />
                  <Area type="monotone" dataKey="onTrade" name="On-Premise" stackId="1" stroke={C.faint} fill={C.faint} fillOpacity={0.4} />
                  <Area type="monotone" dataKey="offTrade" name="Off-Trade" stackId="1" stroke={C.gold} fill={C.gold} fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      <div>
        <SectionTitle icon={ShieldAlert}>Khoảng Trắng Kệ Hàng — WinMart</SectionTitle>
        {marketGaps.map((g, i) => (
          <Panel key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: fontDisplay, fontSize: 15, color: C.ink }}>{g.sku}</span>
              <span style={{ fontFamily: fontMono, fontSize: 10.5, color: C.gold, background: 'rgba(201,162,39,0.12)', padding: '2px 8px', borderRadius: 4 }}>{g.phase}</span>
            </div>
            <div style={{ fontFamily: fontBody, fontSize: 11.5, color: C.faint, marginBottom: 4 }}>Xuất xứ: {g.origin}</div>
            <div style={{ fontFamily: fontBody, fontSize: 12.5, color: C.sub }}>{g.note}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT
--------------------------------------------------------- */
const TABS = [
  { key: 'executive', label: 'Executive', sub: 'Phòng Điều Hành', icon: Gauge },
  { key: 'pricing', label: 'Pricing', sub: 'War Room', icon: DollarSign },
  { key: 'distribution', label: 'Distribution', sub: 'Hiện Trường', icon: Truck },
  { key: 'forecast', label: 'Forecast', sub: 'Hoạch Định', icon: Sparkles },
];

/**
 * @param {{
 *   initialAlerts?: any[],
 *   initialMarketShare?: any[],
 *   dataError?: string | null,
 * }} props
 */
export default function BeerFmcgIntelligenceOS({
  initialAlerts = /** @type {any[]} */ ([]),
  initialMarketShare = /** @type {any[]} */ ([]),
  dataError = null,
}) {
  const [activeTab, setActiveTab] = useState('executive');

  const alertData = initialAlerts.map(mapAlertRow);
  const marketShareData = initialMarketShare.map(mapBrandRow);

  return (
    <div className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`} style={{
      background: C.bg, minHeight: '100vh', padding: '28px 32px',
      fontFamily: fontBody, color: C.ink,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        borderBottom: `1px solid ${C.line}`, paddingBottom: 18, marginBottom: 22,
      }}>
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: '0.12em', color: C.faint, marginBottom: 6 }}>
            MCP AI · BEER &amp; FMCG INTELLIGENCE OS
          </div>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, margin: 0, color: C.ink }}>
            Hệ Thống Giám Sát &amp; Điều Hành Thương Mại
          </h1>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, fontFamily: fontMono, fontSize: 11.5,
          color: C.green, background: 'rgba(61,214,140,0.1)', border: `1px solid rgba(61,214,140,0.3)`,
          padding: '6px 12px', borderRadius: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} />
          SYSTEM ACTIVE
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 26, flexWrap: 'wrap' }}>
        <KpiCard icon={Package} label="Sản Lượng Toàn Thị Trường" value="~4,15 tỷ lít" sub="Ước tính cả năm 2026 (VBA/Nielsen) — giảm từ ~4,6 tỷ lít các năm trước" />
        <KpiCard icon={DollarSign} label="Net Sales Value" value="Đang cập nhật" sub="NSV toàn ngành — cần dữ liệu tài chính Q2/2026" accent={C.faint} />
        <KpiCard icon={AlertTriangle} label="Trade Spend / Doanh Thu" value="Đang cập nhật" sub="TTS % — cần dữ liệu nội bộ NPP" accent={C.faint} />
        <KpiCard icon={Target} label="Cảnh Báo Đang Mở" value={alertData.length} sub="Impact ≥3 hoặc Urgency ≥3" accent={C.red} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: `1px solid ${C.line}` }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 18px', fontFamily: fontBody, fontSize: 13.5,
                color: active ? C.gold : C.sub,
                borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              <Icon size={14} />
              {t.label}
              <span style={{ fontSize: 11, color: C.faint }}>· {t.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'executive' && (
        <ExecutiveTab alertData={alertData} marketShareData={marketShareData} dataError={dataError} />
      )}
      {activeTab === 'pricing' && <PricingTab />}
      {activeTab === 'distribution' && <DistributionTab />}
      {activeTab === 'forecast' && <ForecastTab />}

      {/* Footer note */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.line}`, fontFamily: fontBody, fontSize: 11, color: C.faint, lineHeight: 1.6 }}>
        Tab Executive (cảnh báo &amp; thị phần) đọc dữ liệu trực tiếp từ Supabase (bảng market_alerts, market_brands) mỗi lần tải trang.
        Các tab Pricing / Distribution / Forecast vẫn dùng dữ liệu tĩnh từ Beer &amp; FMCG Intelligence OS Blueprint — sẽ migrate sang
        Supabase (product_skus, dynamic_pricing_matrix, field_sales_performance) ở giai đoạn tiếp theo. Nội dung pháp lý cập nhật đến Q3/2026
        (Luật Thuế TTĐB 66/2025/QH15, Nghị định 168/2024, Luật Trật tự ATGT đường bộ 2024). Các trường "Đang cập nhật" phản ánh khoảng trống
        dữ liệu thực tế (không có báo cáo tài chính công khai Q2/2026 cho phần lớn các hãng). Kịch bản dự báo mang tính minh họa cấu trúc,
        không phải số liệu dự báo chính thức.
      </div>
    </div>
  );
}
