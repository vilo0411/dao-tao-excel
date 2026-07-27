import type { Metadata } from "next";
import { Archivo, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { IS_PREVIEW, SITE_NAME, SITE_URL } from "@/lib/site";
import { AUTHOR } from "@/lib/author";
import { Analytics } from "@/components/Analytics";

// Cả ba font đều phải có subset vietnamese, nếu không dấu sẽ rơi về font hệ
// thống và gây layout shift. Instrument Serif từng cân nhắc nhưng bị loại vì
// không hỗ trợ tiếng Việt.
const display = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  display: "swap",
});

const body = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Font chữ đơn cách ở đây không để trang trí: công thức và tham chiếu ô phải
// thẳng cột thì mới đọc so sánh được.
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — file Excel tôi dựng cho việc của mình`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Những file Excel tôi dựng cho công việc hằng ngày, để lại đây dùng chung. Mỗi file đều phơi rõ công thức bên trong và giải thích vì sao nó chạy như vậy.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.site }],
  openGraph: { type: "website", locale: "vi_VN", siteName: SITE_NAME },
  /*
   * Bản xem thử phải chặn index. Nếu để Google thu thập, nó thành nội dung
   * trùng lặp cạnh tranh với chính excel.nguyenvietloc.com sau này — với một
   * domain mới thì đó là thiệt hại rất khó gỡ.
   *
   * Dùng thẻ meta noindex chứ không chặn bằng robots.txt: bị chặn crawl thì
   * Google không đọc được thẻ noindex, nên URL vẫn có thể nằm lại trong index.
   */
  robots: IS_PREVIEW ? { index: false, follow: false } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        {IS_PREVIEW && (
          <p className="bg-flag px-5 py-2 text-center text-sm text-paper">
            Bản xem thử giao diện. Form nhận tư vấn chưa hoạt động, và trang này
            không được Google lập chỉ mục.
          </p>
        )}

        <header className="border-b border-rule">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4">
            <Link href="/" className="font-display font-bold tracking-tight">
              {SITE_NAME}
              <span className="ml-2 font-sans text-sm font-normal text-ink-soft">
                của {AUTHOR.name}
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/mau-excel" className="hover:text-input">
                Thư viện file
              </Link>
              <Link href="/khoa-hoc-excel" className="hover:text-input">
                Khóa học tôi giới thiệu
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-rule py-10 text-sm text-ink-soft">
          <div className="mx-auto max-w-5xl px-5">
            <p className="max-w-prose">{AUTHOR.disclosure}</p>
            <p className="mt-4">
              © {new Date().getFullYear()} {AUTHOR.name} ·{" "}
              <a
                href={AUTHOR.site}
                className="underline decoration-rule underline-offset-2 hover:decoration-ink"
              >
                nguyenvietloc.com
              </a>
            </p>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
