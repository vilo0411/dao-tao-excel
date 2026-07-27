import Link from "next/link";
import type { Template } from "@/lib/templates";

export function TemplateCard({ template }: { template: Template }) {
  return (
    <li className="bg-paper">
      <Link href={template.href} className="flex h-full flex-col p-6 hover:bg-panel">
        <h3 className="font-display font-bold text-balance">{template.h1}</h3>
        <p className="mt-3 flex-1 text-sm text-ink-soft">{template.metaDesc}</p>
        {/* Hàm được trích tự động từ công thức thật trong file. */}
        <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {template.functions.map((fn) => (
            <li key={fn} className="cell-ref text-xs text-computed">
              {fn}
            </li>
          ))}
        </ul>
      </Link>
    </li>
  );
}
