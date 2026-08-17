/**
 * Thử cho từng cổng kiểm của lib/knowledge.ts GÃY.
 *
 *   node --experimental-strip-types scripts/test-knowledge-gates.mts
 *
 * VÌ SAO CẦN FILE NÀY. Cả khu /kien-thuc-excel dựa vào một tập ràng buộc chạy
 * lúc build: tường lửa từ khóa, luật công thức phải trỏ sang /ham-excel, đáp
 * án sandbox phải khớp bộ tính, chuỗi bài không được đứt quãng. Những cổng đó
 * chỉ có giá trị khi chúng thật sự chặn — mà một cổng viết sai điều kiện thì
 * im lặng cho qua đúng như một cổng viết đúng gặp dữ liệu sạch. Không có cách
 * nào phân biệt hai trường hợp ngoài việc cố tình đưa dữ liệu bẩn vào và xem
 * nó có gãy không.
 *
 * Cổng chưa từng thấy đỏ là cổng chưa biết có chạy hay không.
 *
 * Mỗi ca chạy trong một tiến trình con vì loader cache ở module scope: một
 * tiến trình chỉ nạp được corpus đúng một lần, nên không thể thử 12 phiên bản
 * dữ liệu khác nhau trong cùng một lần chạy.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAllTemplates } from "../lib/templates.ts";

const ROOT = process.cwd();
const PILLAR_DIR = join(ROOT, "data", "knowledge", "loi-excel");

/** Tiền tố cố định để dọn được cả khi lần chạy trước chết giữa chừng. */
const TMP_PREFIX = "zzz-gate-check-";

function cleanup() {
  if (!existsSync(PILLAR_DIR)) return;
  for (const f of readdirSync(PILLAR_DIR)) {
    if (f.startsWith(TMP_PREFIX)) unlinkSync(join(PILLAR_DIR, f));
  }
}

cleanup();

if (!existsSync(PILLAR_DIR)) {
  console.log("Chưa có cụm loi-excel — bỏ qua kiểm cổng.");
  process.exit(0);
}

/**
 * Bài mồi phải CHỨA ĐỦ những khối mà các ca kiểm cần làm hỏng.
 *
 * Chọn file đầu tiên theo thứ tự chữ cái là sai, và đã sai thật: thứ tự đó đổi
 * mỗi lần thêm bài, và có ngày nó rơi vào một bài không có khối sandbox — lúc
 * đó script chết giữa chừng thay vì kiểm được cổng. Chọn theo yêu cầu thì bài
 * mồi tự đúng, bất kể corpus lớn lên thế nào.
 */
type SeedShape = { type: string }[];
const hasBlocks = (body: SeedShape) => {
  const types = body.map((b) => b.type);
  return (
    types.includes("sandbox") &&
    types.includes("sheet") &&
    types.includes("formula") &&
    types.filter((t) => t === "heading").length >= 2
  );
};

const candidates = readdirSync(PILLAR_DIR).filter((f) => f.endsWith(".json"));
const seedFile = candidates.find((f) =>
  hasBlocks(JSON.parse(readFileSync(join(PILLAR_DIR, f), "utf8")).body),
);

if (!seedFile) {
  console.log(
    candidates.length === 0
      ? "Cụm loi-excel chưa có bài nào — bỏ qua kiểm cổng."
      : "Không bài nào có đủ khối (sandbox + sheet + formula + 2 heading) để làm bài mồi — bỏ qua kiểm cổng.",
  );
  process.exit(0);
}

const base = JSON.parse(readFileSync(join(PILLAR_DIR, seedFile), "utf8"));

/**
 * Một slug template CÓ THẬT nhưng chắc chắn không được thân bài mồi render.
 *
 * Không hằng số hoá được: bài mồi là file .json đầu tiên theo thứ tự chữ cái,
 * và thứ tự đó đổi mỗi khi thêm bài mới. Lần đầu viết script này đã dính đúng
 * chuyện đó — slug hằng số hoá tình cờ trùng đúng slug bài mồi đang render,
 * phép biến đổi thành vô hiệu, và cổng bị báo là thủng trong khi nó vẫn tốt.
 */
const renderedInSeed = new Set<string>(
  base.body
    .filter((b: { type: string }) => b.type === "templateRef" || b.type === "sheet")
    .map((b: { type: string; slug?: string; templateSlug?: string }) =>
      b.type === "templateRef" ? b.slug : b.templateSlug,
    ),
);
const unrenderedTemplate = getAllTemplates().find((t) => !renderedInSeed.has(t.slug))?.slug;
if (!unrenderedTemplate) {
  throw new Error("Không tìm được template nào nằm ngoài thân bài mồi để thử cổng link ma.");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Spec = any;

type Case = {
  name: string;
  mutate: (p: Spec) => void;
  /** Một mẩu chữ phải có trong thông điệp lỗi. Ép thông điệp phải nói được lý do. */
  expect: string;
  /** Đổi luôn tên file, cho ca cố tình sửa slug (cổng tên file gãy trước). */
  fileSlug?: string;
};

/**
 * Đặt primaryKeyword VÀ đồng bộ intro.
 *
 * Không đồng bộ thì cổng schema "intro phải chứa primaryKeyword" gãy trước, và
 * ta tưởng tường lửa từ khóa thủng trong khi nó còn chưa được chạy tới. Đây là
 * lỗi thật đã mắc phải khi viết file này, ghi lại để không mắc lần nữa.
 */
function setKeyword(p: Spec, kw: string) {
  p.primaryKeyword = kw;
  p.intro = `Bài tạm dùng để thử cổng kiểm, viết về ${kw} và không bao giờ được publish, nó chỉ tồn tại trong đúng một lần chạy script này rồi bị xoá.`;
}

const cases: Case[] = [
  {
    name: "primaryKeyword là intent tải file (trùng của một template)",
    mutate: (p) => setKeyword(p, "mẫu excel đánh giá kpi nhân viên"),
    expect: "intent tải file",
  },
  {
    /*
     * Biến thể "file …" của một từ khóa template.
     *
     * Luật ban đầu chặn thô mọi từ khóa bắt đầu bằng "file", và nó bắt nhầm
     * ngay bài "file excel nặng và chậm" — một bài sửa lỗi không cạnh tranh
     * với template nào. Luật giờ so ở tầng sâu hơn: bỏ tiền tố intent rồi mới
     * đối chiếu. Ca này giữ cho lỗ hổng đó không mở lại khi luật được nới.
     */
    name: 'biến thể "file …" của một từ khóa template',
    mutate: (p) => setKeyword(p, "file excel đánh giá kpi nhân viên"),
    expect: "đã được template",
  },
  {
    name: "primaryKeyword là intent tra hàm",
    mutate: (p) => setKeyword(p, "hàm IFERROR trong excel"),
    expect: "intent tra hàm",
  },
  {
    name: "primaryKeyword chứa tên hàm đã có trang, đứng thành token riêng",
    mutate: (p) => setKeyword(p, "sửa lỗi iferror bị lồng quá sâu"),
    expect: "đã có trang riêng",
  },
  {
    name: 'slug bắt đầu bằng "ham-"',
    mutate: (p) => (p.slug = "ham-thu-nghiem-cho-vui"),
    fileSlug: "ham-thu-nghiem-cho-vui",
    expect: "tiền tố đó thuộc hai khu kia",
  },
  {
    name: 'h1 mở đầu bằng "Mẫu"',
    mutate: (p) => (p.h1 = "Mẫu file chặn lỗi chia không"),
    expect: "nghe như trang của hai khu kia",
  },
  {
    name: "không khai templateRefs (bài mồ côi)",
    mutate: (p) => (p.templateRefs = []),
    expect: "templateRefs",
  },
  {
    name: "templateRefs khai nhưng thân bài không render",
    mutate: (p) => (p.templateRefs = [unrenderedTemplate]),
    expect: "link ma",
  },
  {
    name: "đáp án sandbox không khớp expected",
    mutate: (p) => {
      const s = p.body.find((b: Spec) => b.type === "sandbox");
      if (!s) throw new Error("bài mẫu không có khối sandbox để thử");
      s.expected = "999";
    },
    expect: "nhưng expected khai",
  },
  {
    name: "công thức dùng hàm có trang mà không khai functionRefs",
    mutate: (p) => (p.functionRefs = []),
    expect: "không khai trong functionRefs",
  },
  {
    name: "thân bài không có khối bằng chứng nào",
    mutate: (p) => {
      p.body = p.body.filter(
        (b: Spec) => !["sheet", "formula", "errorCase", "sandbox"].includes(b.type),
      );
    },
    expect: "khối bằng chứng",
  },
  {
    name: "khối sheet trỏ tới template không tồn tại",
    mutate: (p) => {
      const s = p.body.find((b: Spec) => b.type === "sheet");
      if (!s) throw new Error("bài mẫu không có khối sheet để thử");
      s.templateSlug = "khong-co-that";
    },
    expect: "không có template nào dùng",
  },
  {
    name: "hai heading sinh ra cùng một id neo",
    mutate: (p) => {
      const hs = p.body.filter((b: Spec) => b.type === "heading");
      hs[1].text = hs[0].text;
    },
    expect: "cùng sinh ra id",
  },
  {
    name: "chuỗi bài đứt quãng (order không liên tục)",
    mutate: (p) => (p.order = 99),
    expect: "order phải liên tục",
  },
];

let pass = 0;
let fail = 0;

try {
  for (const c of cases) {
    const spec: Spec = JSON.parse(JSON.stringify(base));
    const slug = c.fileSlug ?? `${TMP_PREFIX}tam`;
    spec.slug = slug;
    // Bài tạm luôn đứng ngay sau bài cuối, để mặc định không phạm cổng order.
    spec.order = base.order + 1;
    setKeyword(spec, "chuoi tu khoa chi dung de thu cong khong ai tim");
    c.mutate(spec);

    const target = join(PILLAR_DIR, `${slug}.json`);
    writeFileSync(target, JSON.stringify(spec));

    let out: string;
    try {
      execFileSync(
        process.execPath,
        [
          "--experimental-strip-types",
          "--input-type=module",
          "-e",
          "import {getAllPosts} from './lib/knowledge.ts'; getAllPosts();",
        ],
        { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
      );
      out = "(KHÔNG GÃY — cổng này đang thủng)";
    } catch (e) {
      const err = e as { stderr?: Buffer | string; message?: string };
      out = String(err.stderr ?? err.message ?? "");
    } finally {
      unlinkSync(target);
    }

    const ok = out.includes(c.expect);
    if (ok) pass++;
    else fail++;
    console.log(`${ok ? "✔" : "✖"} ${c.name}`);
    if (!ok) {
      console.log(`    mong thông điệp chứa "${c.expect}", nhưng nhận:`);
      console.log(`    ${out.slice(0, 700).replace(/\n/g, "\n    ")}`);
    }
  }
} finally {
  cleanup();
}

console.log(`\n${pass} cổng chặn đúng, ${fail} cổng thủng.`);
process.exit(fail === 0 ? 0 : 1);
