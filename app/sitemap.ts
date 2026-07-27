import type { MetadataRoute } from "next";
import { getAllTemplates } from "@/lib/templates";
import { absoluteUrl, CATEGORY_SLUGS } from "@/lib/site";

// Bắt buộc khi output: "export" — Next cần biết chắc file này dựng lúc build.
export const dynamic = "force-static";

/**
 * Sitemap sinh từ đúng nguồn dữ liệu mà generateStaticParams dùng, nên không
 * thể xảy ra cảnh trang tồn tại nhưng thiếu trong sitemap — đúng lỗi mà hai
 * trang khóa học bên taichinhso.hvsvn.com đang mắc phải.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const templates = getAllTemplates();
  const lastModified = new Date();

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1, lastModified },
    {
      url: absoluteUrl("/mau-excel"),
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified,
    },
    {
      url: absoluteUrl("/khoa-hoc-excel"),
      changeFrequency: "monthly",
      priority: 0.9,
      lastModified,
    },
    // Chỉ submit category đã có template. Category rỗng là trang mỏng, đưa vào
    // sitemap chỉ làm loãng chất lượng khi Google đánh giá site mới.
    ...CATEGORY_SLUGS.filter((category) =>
      templates.some((t) => t.category === category),
    ).map((category) => ({
      url: absoluteUrl(`/mau-excel/${category}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified,
    })),
    ...templates.map((template) => ({
      url: absoluteUrl(template.href),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      lastModified: new Date(template.updatedAt),
    })),
  ];
}
