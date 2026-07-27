import type { NextConfig } from "next";

/**
 * Một cấu hình cho hai đích:
 *
 * - Mặc định (Vercel, domain thật): chạy đầy đủ, có API route nhận lead.
 * - PREVIEW=1 (GitHub Pages): export tĩnh, đặt trong thư mục con của repo.
 *
 * GitHub Pages chỉ phục vụ file tĩnh nên không chạy được route handler. Workflow
 * deploy sẽ xóa thư mục app/api trước khi build — xóa trong bản dựng của CI,
 * không đụng tới mã nguồn trong repo.
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
