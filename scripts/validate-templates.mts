/**
 * Kiểm tra toàn bộ spec template và bộ file, in ra bản tóm tắt để soát nội dung.
 *
 *   npm run validate
 *
 * Chạy đúng loader mà Next.js dùng lúc build, nên lỗi bắt được ở đây cũng
 * chính là lỗi sẽ làm gãy build — phát hiện sớm thay vì đợi deploy.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getAllTemplates, resolveFormula } from "../lib/templates.ts";
import { getAllSystems, ROLE_LABEL } from "../lib/systems.ts";
import { getAllFunctions } from "../lib/functions.ts";
import { getAllVideos } from "../lib/videos.ts";

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

const systems = getAllSystems();

for (const s of systems) {
  console.log(`\nbộ file: ${s.slug}  [${s.category}]`);
  console.log(`  H1        ${s.h1}`);
  console.log(`  metaTitle ${s.metaTitle.length} ký tự`);
  console.log(`  metaDesc  ${s.metaDesc.length} ký tự`);
  console.log(`  nhịp      ${s.cadence}`);
  console.log(`  file      ${s.liveCount}/${s.totalCount} đã có`);
  for (const node of s.nodes) {
    const mark = node.status === "live" ? "✓" : "…";
    console.log(`    ${mark} [${ROLE_LABEL[node.role]}] ${node.slug}`);
  }
  for (const edge of s.edges) {
    console.log(`    ${edge.from} —(${edge.label})→ ${edge.to}`);
  }
}

console.log(
  `\n✓ ${systems.length} bộ file hợp lệ${systems.length === 0 ? " (chưa dựng bộ nào)" : ""}`,
);

// Ném lỗi ngay tại đây nếu một hàm mới xuất hiện trong công thức mà chưa có
// mục từ điển — đúng chỗ để bắt sớm, trước khi build /ham-excel gãy.
const functions = getAllFunctions();
console.log(
  `\n✓ ${functions.length} hàm Excel có trang glossary: ${functions.map((f) => f.name).join(", ")}`,
);

/*
 * Video: bắt tag trỏ tới hàm/template không tồn tại, và bắt thiếu summary.
 * KHÔNG bắt được tag trỏ sai chỗ (hàm có thật nhưng video không nói về nó) —
 * chỗ đó chỉ người xem video mới thấy.
 */
const videos = getAllVideos();

for (const v of videos) {
  const posterPath = join(process.cwd(), "public", "videos", `${v.id}.jpg`);
  const poster = existsSync(posterPath) ? "✓ poster" : "⚠ THIẾU poster";
  console.log(`\nvideo: ${v.id}  [${v.functions.join(", ")}]  ${poster}`);
  console.log(`  ${v.title}`);
}

const missingPosters = videos.filter(
  (v) => !existsSync(join(process.cwd(), "public", "videos", `${v.id}.jpg`)),
);

if (missingPosters.length > 0) {
  console.error(
    `\n✗ ${missingPosters.length} video thiếu poster. Chạy:\n` +
      `  node --experimental-strip-types scripts/fetch-video-thumbs.mts`,
  );
  process.exit(1);
}

console.log(
  `\n✓ ${videos.length} mẹo video${videos.length === 0 ? " (chưa gắn video nào)" : ""}`,
);
