import BeerFmcgIntelligenceOSRaw from "../components/BeerFmcgIntelligenceOS";
import { getSupabaseClient } from "../lib/supabase";

// Component .jsx nhận props tự do (không có type strict) — ép kiểu `any` ở đây để
// tránh TypeScript tự suy luận sai kiểu tham số mặc định (từng gây lỗi build thực tế:
// "Type 'any[]' is not assignable to type 'never[]'" khi truyền initialAlerts/initialMarketShare).
const BeerFmcgIntelligenceOS: any = BeerFmcgIntelligenceOSRaw;

// Luôn fetch dữ liệu mới nhất từ Supabase mỗi lần có người tải trang — không cache tĩnh.
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Home() {
  let alerts: any[] = [];
  let brands: any[] = [];
  let financials: any[] = [];
  let fetchError: string | null = null;

  try {
    const supabase = getSupabaseClient();

    const [alertsRes, brandsRes, financialsRes] = await Promise.all([
      supabase
        .from("market_alerts")
        .select("*")
        .order("impact", { ascending: false })
        .order("urgency", { ascending: false }),
      supabase
        .from("market_brands")
        .select("*")
        .order("market_share_volume", { ascending: false }),
      supabase
        .from("company_financials")
        .select("*")
        .order("company_name", { ascending: true }),
    ]);

    if (alertsRes.error) throw alertsRes.error;
    if (brandsRes.error) throw brandsRes.error;
    if (financialsRes.error) throw financialsRes.error;

    alerts = alertsRes.data ?? [];
    brands = brandsRes.data ?? [];
    financials = financialsRes.data ?? [];
  } catch (err: any) {
    console.error("Lỗi tải dữ liệu từ Supabase:", err?.message ?? err);
    fetchError = err?.message ?? "Không thể kết nối Supabase";
  }

  return (
    <BeerFmcgIntelligenceOS
      initialAlerts={alerts}
      initialMarketShare={brands}
      initialFinancials={financials}
      dataError={fetchError}
    />
  );
}
