import Image from "next/image";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { AUTHOR } from "@/lib/author";

/**
 * Chưa có ảnh thật thì dùng monogram thay vì để khung vỡ hoặc ảnh 404.
 * Kiểm tra lúc build nên không tốn gì ở runtime.
 */
function hasPhoto(): boolean {
  return existsSync(join(process.cwd(), "public", AUTHOR.photo));
}

function Avatar({ size }: { size: number }) {
  if (hasPhoto()) {
    return (
      <Image
        src={AUTHOR.photo}
        alt={AUTHOR.name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm font-medium text-paper"
    >
      {AUTHOR.initials}
    </span>
  );
}

/** Dòng ký tên nhỏ, đặt cuối mỗi trang mẫu. */
export function AuthorByline() {
  return (
    <div className="flex items-center gap-3 border-t border-rule pt-5">
      <Avatar size={40} />
      <p className="text-sm text-ink-soft">
        <span className="font-medium text-ink">{AUTHOR.name}</span> dựng và kiểm
        tra file này.{" "}
        <a
          href={AUTHOR.site}
          className="underline decoration-rule underline-offset-2 hover:decoration-ink"
        >
          nguyenvietloc.com
        </a>
      </p>
    </div>
  );
}

/** Khối giới thiệu đầy đủ, dùng ở trang chủ và trang khóa học. */
export function AuthorCard() {
  return (
    <section className="rounded-md border border-rule bg-panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar size={64} />
        <div>
          <p className="font-display text-xl font-medium">{AUTHOR.name}</p>
          <p className="text-sm text-ink-soft">{AUTHOR.role}</p>
        </div>
      </div>
      <p className="mt-5 max-w-prose text-ink-soft">{AUTHOR.bio}</p>
      <p className="mt-4 max-w-prose border-l-2 border-rule pl-4 text-sm text-ink-soft">
        {AUTHOR.disclosure}
      </p>
    </section>
  );
}
