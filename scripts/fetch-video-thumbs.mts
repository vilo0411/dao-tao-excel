/**
 * Tải poster TikTok về public/videos/ và gợi ý tag hàm từ caption.
 *
 *   node --experimental-strip-types scripts/fetch-video-thumbs.mts
 *   node --experimental-strip-types scripts/fetch-video-thumbs.mts <url> [url...]
 *
 * Không tham số: quét data/videos/*.json, tải poster nào còn thiếu.
 * Có tham số: gọi oEmbed cho từng URL rồi in ra khung JSON để chép vào
 * data/videos/, đã điền sẵn id, title gốc và các hàm đoán được từ caption.
 *
 * Vì sao phải tải ảnh về thay vì hotlink: URL thumbnail TikTok trả về có chữ
 * ký hết hạn. Nhúng thẳng thì ảnh chết dần trên site mà không ai biết lúc nào.
 *
 * oEmbed là endpoint công khai, không cần key — nhưng nó chỉ trả lời cho URL
 * của MỘT video. Không có cách công khai nào liệt kê video của cả kênh, nên
 * danh sách URL phải lấy tay hoặc từ export của chủ kênh.
 */
import { mkdirSync, existsSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "videos");
const DATA_DIR = join(process.cwd(), "data", "videos");

type OEmbed = {
  title: string;
  thumbnail_url: string;
  author_unique_id?: string;
};

async function oembed(url: string): Promise<OEmbed> {
  const res = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
  );
  if (!res.ok) {
    throw new Error(`oEmbed ${res.status} cho ${url}`);
  }
  return (await res.json()) as OEmbed;
}

async function downloadPoster(id: string, thumbnailUrl: string) {
  const res = await fetch(thumbnailUrl);
  if (!res.ok) throw new Error(`Tải poster ${res.status} cho ${id}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${id}.jpg`), buf);
  console.log(`  ✓ public/videos/${id}.jpg (${Math.round(buf.length / 1024)}KB)`);
}

/** Phần số cuối URL TikTok: .../video/7301234567890123456 */
function videoId(url: string): string {
  const match = url.match(/\/video\/(\d{6,})/);
  if (!match) throw new Error(`Không đọc được id video từ URL: ${url}`);
  return match[1];
}

/**
 * Đoán hàm từ caption. Đường phụ — kênh này hầu như không nhắc tên hàm trong
 * caption, và những hàm nó có nhắc (XLOOKUP, VLOOKUP) thì site chưa có trang.
 */
async function guessFunctions(caption: string): Promise<string[]> {
  const { getAllFunctions } = await import("../lib/functions.ts");
  const upper = caption.toUpperCase();
  return getAllFunctions()
    .map((f) => f.name)
    .filter((name) =>
      /*
       * `\b` của JS tính theo ASCII, nên chữ có dấu bị coi là ranh giới từ:
       * "NHÂN" khớp `\bN\b` ở chữ N cuối, và mọi caption tiếng Việt có "nhân
       * sự" đều bị gán hàm N. Phải tự viết ranh giới theo lớp ký tự Unicode.
       */
      new RegExp(`(?<![\\p{L}\\p{N}])${name}(?![\\p{L}\\p{N}])`, "u").test(upper),
    );
}

/** Từ xuất hiện trong gần như mọi tên template, không phân biệt được gì. */
const STOP_WORDS = new Set([
  "mẫu", "excel", "bảng", "file", "theo", "và", "cho", "của", "trong", "tự",
  "động", "danh", "sách", "quản", "lý",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w)),
  );
}

/**
 * Đoán template từ caption bằng cách đếm từ khóa trùng nhau.
 *
 * Đây là đường gắn chính vì kênh dạy theo việc, đúng cách site tổ chức: caption
 * "tạo bảng chấm công động" ăn thẳng vào template chấm công.
 *
 * Vẫn chỉ là GỢI Ý để đỡ phải gõ. Trùng từ khóa không phải là trùng nội dung —
 * một video về biểu đồ vẫn có thể trùng chữ "nhân sự" với ba template. Người
 * tag phải xem video rồi mới chốt.
 */
async function guessTemplates(caption: string): Promise<string[]> {
  const { getAllTemplates } = await import("../lib/templates.ts");
  const capTokens = tokens(caption);

  return getAllTemplates()
    .map((t) => {
      const target = tokens(`${t.h1} ${t.primaryKeyword}`);
      let score = 0;
      for (const w of target) if (capTokens.has(w)) score += 1;
      return { slug: t.slug, score };
    })
    .filter((t) => t.score >= 2) // một từ trùng là ngẫu nhiên, không phải tín hiệu
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((t) => t.slug);
}

async function scaffold(urls: string[]) {
  for (const url of urls) {
    const id = videoId(url);
    const data = await oembed(url);
    const guessedFns = await guessFunctions(data.title);
    const guessedTemplates = await guessTemplates(data.title);

    console.log(`\n─── ${url}`);
    console.log(`caption gốc: ${data.title}`);
    console.log(`  → template gợi ý: ${guessedTemplates.join(", ") || "(không)"}`);
    console.log(`  → hàm gợi ý:      ${guessedFns.join(", ") || "(không)"}`);
    if (guessedTemplates.length === 0 && guessedFns.length === 0) {
      console.log(
        "  ⚠ không đoán được chỗ gắn — xem video rồi tự điền, hoặc bỏ video này",
      );
    }

    const skeleton = {
      id,
      url,
      title: data.title.slice(0, 120),
      // Không sinh sẵn `summary`: trường này tùy chọn, không hiện trên trang,
      // và schema đòi tối thiểu 80 ký tự KHI CÓ — một chuỗi TODO ngắn sẽ làm
      // validate fail ngay trên file vừa tạo. Ai cần ghi chú thì tự thêm.
      publishedAt: new Date().toISOString().slice(0, 10),
      templates: guessedTemplates,
      functions: guessedFns.slice(0, 2),
    };

    const path = join(DATA_DIR, `${id}.json`);
    if (existsSync(path)) {
      console.log(`đã có data/videos/${id}.json, bỏ qua`);
    } else {
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(path, `${JSON.stringify(skeleton, null, 2)}\n`);
      console.log(`✓ data/videos/${id}.json — sửa title/templates/functions`);
    }

    await downloadPoster(id, data.thumbnail_url);
  }
}

async function refreshMissing() {
  let files: string[];
  try {
    files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    console.log(
      "Chưa có data/videos/. Chạy lại kèm URL video để tạo khung:\n" +
        "  node --experimental-strip-types scripts/fetch-video-thumbs.mts <url>",
    );
    return;
  }

  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as {
      id: string;
      url: string;
    };
    if (existsSync(join(OUT_DIR, `${spec.id}.jpg`))) continue;

    console.log(`thiếu poster: ${spec.id}`);
    const data = await oembed(spec.url);
    await downloadPoster(spec.id, data.thumbnail_url);
  }

  console.log(`\n✓ ${files.length} video, poster đã đủ`);
}

const urls = process.argv.slice(2);
await (urls.length > 0 ? scaffold(urls) : refreshMissing());
