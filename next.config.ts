import type { NextConfig } from "next";

/**
 * Một cấu hình cho hai đích:
 *
 * - Mặc định (Vercel, domain thật): chạy đầy đủ.
 * - PREVIEW=1 (GitHub Pages): export tĩnh, đặt trong thư mục con của repo.
 *
 * Site không còn route API nào (bỏ cùng /khoa-hoc-excel ở v2.1), nên export
 * tĩnh không cần bước xóa route handler nữa.
 */
const isPreview = process.env.NEXT_PUBLIC_PREVIEW === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = isPreview
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
