import type { NextConfig } from "next";

/**
 * Một cấu hình cho hai đích:
 *
 * - Mặc định (Vercel, domain thật): chạy đầy đủ.
 * - STATIC_EXPORT=1 (GitHub Pages): export tĩnh, đặt trong thư mục con của repo.
 *
 * Cờ này chỉ nói về cách build, không nói bản dựng ra là "bản thử" hay không —
 * chuyện chặn index nằm ở NEXT_PUBLIC_NOINDEX, xem lib/site.ts.
 *
 * Site không còn route API nào (bỏ cùng /khoa-hoc-excel ở v2.1), nên export
 * tĩnh không cần bước xóa route handler nữa.
 */
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      basePath,
      // Trang tĩnh không có server để tối ưu ảnh lúc chạy.
      images: { unoptimized: true },
      // Pages phục vụ /duong-dan/ dưới dạng thư mục có index.html.
      trailingSlash: true,
    }
  : {};

export default nextConfig;
