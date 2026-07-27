/**
 * Kiểm tra toàn bộ spec template và in ra bản tóm tắt để soát nội dung.
 *
 *   npm run validate
 *
 * Chạy đúng loader mà Next.js dùng lúc build, nên lỗi bắt được ở đây cũng
 * chính là lỗi sẽ làm gãy build — phát hiện sớm thay vì đợi deploy.
 */
import { getAllTemplates, resolveFormula } from "../lib/templates.ts";

const templates = getAllTemplates();

if (templates.length === 0) {
  console.error("Không tìm thấy template nào trong data/templates/");
  process.exit(1);
}

for (const t of templates) {
  console.log(`\n${t.slug}  [${t.category}]`);
  console.log(`  H1        ${t.h1}`);
  console.log(`  metaTitle ${t.metaTitle.length} ký tự`);
  console.log(`  metaDesc  ${t.metaDesc.length} ký tự`);
  console.log(`  hàm dùng  ${t.functions.join(", ") || "(không có công thức)"}`);
  console.log(`  CTA       ${t.ctaTarget}`);

  for (const sheet of t.sheets) {
    const formulas = sheet.columns.filter((c) => c.formula);
    if (formulas.length === 0) continue;
    console.log(`  sheet "${sheet.name}" — công thức tại dòng dữ liệu đầu tiên:`);
    for (const col of formulas) {
      console.log(
        `    ${col.header}: ${resolveFormula(col.formula!, sheet.columns, 2)}`,
      );
    }
  }
}

console.log(`\n✓ ${templates.length} template hợp lệ`);
