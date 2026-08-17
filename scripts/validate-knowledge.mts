/**
 * Kiểm toàn bộ bài của khu /kien-thuc-excel, in bản tóm tắt để soát nội dung.
 *
 *   node --experimental-strip-types scripts/validate-knowledge.mts
 *
 * Tách khỏi scripts/validate-templates.mts vì hai lý do. Một, file kia đã gánh
 * bốn corpus trong 102 dòng và trộn thêm vào sẽ không còn đọc được. Hai, đây
 * là corpus đầu tiên PHỤ THUỘC cả ba corpus kia — nên nó phải chạy SAU, để lỗi
 * ở nguồn hiện ra trước lỗi ở nơi tiêu thụ. Sai template mà báo lỗi bài viết
 * thì người sửa đi nhầm hướng.
 *
 * Phần lớn ràng buộc nằm trong lib/knowledge.ts (throw ⇒ gãy cả `next build`);
 * script này chỉ gọi loader rồi in ra những con số mà mắt người cần soát —
 * đúng phân vai đã ghi ở lib/templates.ts:89-95.
 */
import {
  getAllExercises,
  getAllPosts,
  getPopulatedPillars,
  getShortcuts,
  getPostsForFunction,
  getPostsForTemplate,
  MIN_POSTS_PER_PILLAR,
} from "../lib/knowledge.ts";
import { MIN_WORDS } from "../lib/knowledge-schema.ts";
import { getAllTemplates } from "../lib/templates.ts";
import { getAllFunctions } from "../lib/functions.ts";
import { PILLARS } from "../lib/site.ts";

const posts = getAllPosts();

if (posts.length === 0) {
  console.log("\n✓ Chưa có bài nào trong data/knowledge/ (khu kiến thức chưa mở)");
  process.exit(0);
}

for (const p of posts) {
  const counts = new Map<string, number>();
  for (const b of p.body) counts.set(b.type, (counts.get(b.type) ?? 0) + 1);

  console.log(`\n${p.order}. ${p.slug}  [${p.pillar}]`);
  console.log(`  H1        ${p.h1}`);
  console.log(`  từ khóa   ${p.primaryKeyword}`);
  console.log(`  metaTitle ${p.metaTitle.length} ký tự`);
  console.log(`  metaDesc  ${p.metaDesc.length} ký tự`);
  console.log(`  độ dài    ${p.wordCount} từ (sàn ${MIN_WORDS})`);
  console.log(`  mục lục   ${p.toc.length} mục`);
  console.log(
    `  khối      ${[...counts].map(([t, n]) => `${t}×${n}`).join("  ")}`,
  );
  console.log(`  trỏ ra    file: ${p.templateRefs.join(", ")}`);
  console.log(
    `            hàm:  ${p.functionRefs.join(", ") || "(không hàm nào — hợp lệ)"}`,
  );
  console.log(`  quiz      ${p.quiz.length} câu · FAQ ${p.faq.length} câu`);
  console.log(
    `  chuỗi     ${p.prev ? `← ${p.prev.slug}` : "← (bài đầu)"}   ${p.next ? `${p.next.slug} →` : "(bài cuối) →"}`,
  );
}

const exercises = getAllExercises();
const shortcuts = getShortcuts();

if (exercises.length > 0) {
  console.log("\n── Bài tập ──");
  for (const e of exercises) {
    console.log(
      `  ${e.order}. ${e.slug}  →  bài ${e.postSlug}  ·  ${e.tasks.length} yêu cầu, ${e.solution.length} bước giải`,
    );
    console.log(`     từ khóa: ${e.primaryKeyword}`);
  }
  console.log(
    `  ${exercises.length}/${posts.length} bài lý thuyết đã có bài tập kèm theo.`,
  );
}

if (shortcuts) {
  const groups = [...new Set(shortcuts.shortcuts.map((s) => s.group))];
  const noMac = shortcuts.shortcuts.filter((s) => s.mac === "—").length;
  console.log(
    `\n── Phím tắt ──\n  ${shortcuts.shortcuts.length} tổ hợp · ${groups.length} nhóm: ${groups.join(", ")}`,
  );
  console.log(`  ${noMac} tổ hợp không có bản macOS tương đương`);
}

/*
 * Bài nào cũng phải có đường vào từ bên ngoài cụm, không chỉ có đường ra.
 * Chiều ra đã được schema ép (templateRefs tối thiểu 1). Chiều vào là hệ quả
 * tự động của nó — nhưng in ra để thấy tận mắt, vì "đúng theo lập luận" và
 * "đúng trên dữ liệu thật" là hai chuyện khác nhau.
 */
console.log("\n── Đường vào ngược, từ hai khu kia trở về bài ──");

const templatesWithPosts = getAllTemplates().filter(
  (t) => getPostsForTemplate(t.slug).length > 0,
);
for (const t of templatesWithPosts) {
  console.log(
    `  /mau-excel/${t.category}/${t.slug}  →  ${getPostsForTemplate(t.slug).map((p) => p.slug).join(", ")}`,
  );
}

const functionsWithPosts = getAllFunctions().filter(
  (f) => getPostsForFunction(f.slug).length > 0,
);
for (const f of functionsWithPosts) {
  console.log(
    `  /ham-excel/${f.slug}  →  ${getPostsForFunction(f.slug).map((p) => p.slug).join(", ")}`,
  );
}

console.log(
  `  ${templatesWithPosts.length}/${getAllTemplates().length} trang template và ` +
    `${functionsWithPosts.length}/${getAllFunctions().length} trang hàm có bài trỏ về.`,
);

/*
 * Gọi CUỐI CÙNG, và cố ý gọi dù script không dùng kết quả.
 *
 * getPopulatedPillars() là nơi cổng MIN_POSTS_PER_PILLAR sống. Không gọi ở đây
 * thì một cụm dở dang vẫn qua được `npm run validate` và chỉ gãy lúc `next
 * build` — tức là muộn hơn, ở một thông điệp khó lần hơn.
 */
const populated = getPopulatedPillars();
const pending = Object.keys(PILLARS).filter((p) => !populated.includes(p as never));

console.log(
  `\n✓ ${posts.length} bài hợp lệ · ${populated.length} cụm đã mở` +
    (pending.length > 0 ? ` · chưa mở: ${pending.join(", ")}` : ""),
);
for (const pillar of populated) {
  const n = posts.filter((p) => p.pillar === pillar).length;
  console.log(`    ${pillar}: ${n} bài (ngưỡng mở ${MIN_POSTS_PER_PILLAR})`);
}
