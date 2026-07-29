import Link from "next/link";

export type CategoryCardData = {
  slug: string;
  name: string;
  description: string;
  templateCount: number;
  systemCount: number;
};

/**
 * Card cho một nghề. Cùng lưới bảng tính với card file, nhưng nó không mở ra
 * một file nào — nó mở ra trang nghề, chỗ duy nhất xếp bộ file đứng trên file
 * lẻ. Nên số đếm phải nói cả hai thứ: người vào đây cần biết nghề của mình có
 * sẵn cả quy trình hay chỉ có vài bảng rời.
 */
export function CategoryCard({ category }: { category: CategoryCardData }) {
  return (
    <li className="group bg-paper">
      <Link
        href={`/mau-excel/${category.slug}`}
        className="flex h-full flex-col p-6 hover:bg-panel"
      >
        <h3 className="font-display font-medium text-balance">
          {category.name}
        </h3>
        <p className="mt-3 flex-1 text-sm text-ink-soft">
          {category.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-ink-faint">
          <span className="cell-ref tabular-nums">
            {category.templateCount} file
            {category.systemCount > 0 && (
              <>
                <span aria-hidden className="px-2">
                  ·
                </span>
                {category.systemCount} bộ
              </>
            )}
          </span>
          <span aria-hidden className="transition-colors group-hover:text-ink">
            Xem nghề này →
          </span>
        </div>
      </Link>
    </li>
  );
}
