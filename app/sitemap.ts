import type { MetadataRoute } from "next";
import { getAllTemplates } from "@/lib/templates";
import { getAllSystems, getPopulatedCategories } from "@/lib/systems";
import { absoluteUrl, COURSE_PAGE_UPDATED, latestUpdate } from "@/lib/site";

// Bắt buộc khi output: "export" — Next cần biết chắc file này dựng lúc build.
export const dynamic = "force-static";

/**
 * Sitemap sinh từ đúng nguồn dữ liệu mà generateStaticParams dùng, nên không
 * thể xảy ra cảnh trang tồn tại nhưng thiếu trong sitemap — đúng lỗi mà hai
 * trang khóa học bên taichinhso.hvsvn.com đang mắc phải.
 *
 * Không có `new Date()` ở file này, và đó là điều kiện để lastmod còn nghĩa.
 * Lấy giờ build nghĩa là mọi URL đều "vừa sửa" sau mỗi lần deploy, kể cả deploy
 * chỉ đổi CSS. Google chỉ tin lastmod khi nó nhất quán và kiểm chứng được; thấy
 * một site khai như vậy thì họ bỏ tín hiệu cho cả site, kéo theo cả những trang
 * template đang khai đúng ngày từ `updatedAt`.
 *
 * Cũng bỏ luôn `changefreq` và `priority`: Google lẫn Bing đều không đọc chúng
 * từ lâu, giữ lại chỉ tạo thêm chỗ để tranh cãi trang nào đáng 0.8 hay 0.7.
 *
 * Ngày khai dạng "YYYY-MM-DD" chứ không phải ISO đủ giờ phút giây — dữ liệu
 * nguồn chỉ có ngày, thêm "14:54:25.677Z" vào là bịa độ chính xác.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const templates = getAllTemplates();
  const systems = getAllSystems();

  // Trang tổng hợp không có updatedAt riêng: nội dung của chúng chính là những
  // gì nằm bên dưới, nên ngày sửa của chúng là ngày sửa mới nhất bên dưới.
  const everything = [...templates, ...systems];
  const siteUpdated = latestUpdate(everything, COURSE_PAGE_UPDATED);

  return [
    { url: absoluteUrl("/"), lastModified: siteUpdated },
    // Thư viện phủ đúng `everything`, nên ngày của nó trùng ngày toàn site.
    { url: absoluteUrl("/mau-excel"), lastModified: siteUpdated },
    {
      url: absoluteUrl("/khoa-hoc-excel"),
      lastModified: COURSE_PAGE_UPDATED,
    },
    // Cùng cách xử lý category rỗng: hub bộ file chỉ đáng submit khi có bộ.
    ...(systems.length > 0
      ? [
          {
            url: absoluteUrl("/mau-excel/bo-file"),
            lastModified: latestUpdate(systems, siteUpdated),
          },
        ]
      : []),
    ...systems.map((system) => ({
      url: absoluteUrl(system.href),
      lastModified: system.updatedAt,
    })),
    /*
     * Nhóm việc rỗng không có trang để submit — getPopulatedCategories() là
     * đúng danh sách mà generateStaticParams của trang nhóm việc dùng, nên hai
     * bên không thể lệch nhau.
     */
    ...getPopulatedCategories().map((category) => {
      const inside = [
        ...templates.filter((t) => t.category === category),
        ...systems.filter((s) => s.category === category),
      ];
      return {
        url: absoluteUrl(`/mau-excel/${category}`),
        lastModified: latestUpdate(inside, siteUpdated),
      };
    }),
    ...templates.map((template) => ({
      url: absoluteUrl(template.href),
      lastModified: template.updatedAt,
    })),
  ];
}
