import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client dùng chung cho Beer & FMCG Intelligence OS.
 *
 * Yêu cầu 2 biến môi trường (đặt trong Vercel Project Settings → Environment Variables,
 * áp dụng cho cả Production và Preview):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY  (publishable key — an toàn để lộ ở client, chỉ có quyền
 *     đọc theo RLS policy "public_read_*" đã cấu hình cho các bảng market_alerts, market_brands...)
 *
 * Không dùng service_role key ở đây — client này chỉ nên có quyền SELECT.
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Kiểm tra Vercel Project Settings → Environment Variables.'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
