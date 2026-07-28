import Link from "next/link";
import type { SystemCardData } from "@/lib/systems-schema";

/**
 * Card cho một bộ file. Khác card template ở chỗ nó phải nói được "đây là
 * nhiều file nối nhau", nên có thêm dãy ô mini xem trước sơ đồ và bộ đếm
 * "đã có / tổng".
 *
 * Dãy ô mini dùng đúng hai màu của sơ đồ, vì đó vẫn là cùng một câu chuyện —
 * người đọc gặp quy ước ở card rồi mới mở trang bộ ra thấy lại nó.
 */
export function SystemCard({ system }: { system: SystemCardData }) {
  return (
    <li className="group bg-paper">
      <Link href={system.href} className="flex h-full flex-col p-6 hover:bg-panel">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display font-medium text-balance">{system.h1}</h3>
          <span className="cell-ref shrink-0 text-xs text-ink-faint tabular-nums">
            {system.liveCount}/{system.totalCount}
          </span>
        </div>

        <p className="mt-3 flex-1 text-sm text-ink-soft">{system.metaDesc}</p>

        {/* Bo góc 0: đây là mảnh của lưới bảng tính, không phải huy hiệu. */}
        <ul aria-hidden className="mt-5 flex items-center gap-1">
          {system.shape.map((role, index) => (
            <li
              key={index}
              className={`h-3 w-6 border ${
                role === "input"
                  ? "bg-input-bg border-input/40"
                  : "bg-computed-bg border-computed/40"
              } ${role === "master" ? "w-8 border-2" : ""}`}
            />
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-faint">
          <span>
            {system.cadence}
            {system.hasBundle && (
              <>
                <span aria-hidden className="px-2">
                  ·
                </span>
                <span className="text-ink-soft">tải được bản gộp 1 file</span>
              </>
            )}
          </span>
          <span aria-hidden className="transition-colors group-hover:text-ink">
            Xem cả bộ →
          </span>
        </div>
      </Link>
    </li>
  );
}
