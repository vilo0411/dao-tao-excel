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
 * Đoán hàm từ caption. Chỉ là GỢI Ý để đỡ phải gõ — caption TikTok phần lớn là
 * copy câu view ("99% dân văn phòng chưa biết"), và một hàm được nhắc thoáng
 * qua thì không có nghĩa video nói về nó. Người tag vẫn phải xem video.
 */
async function guessFunctions(caption: string): Promise<string[]> {
  const { getAllFunctions } = await import("../lib/functions.ts");
  const upper = caption.toUpperCase();
  return getAllFunctions()
    .map((f) => f.name)
    .filter((name) => new RegExp(`\\b${name}\\b`).test(upper));
}

async function scaffold(urls: string[]) {
  for (const url of urls) {
    const id = videoId(url);
    const data = await oembed(url);
    const guessed = await guessFunctions(data.title);

    console.log(`\n─── ${url}`);
    console.log(`caption gốc: ${data.title}`);
    if (guessed.length === 0) {
      console.log("(caption không nhắc hàm nào — phải tự tag sau khi xem)");
    }

    const skeleton = {
      id,
      url,
      title: data.title.slice(0, 120),
      summary: "TODO: 2-3 câu viết tay, đây là phần Google đọc được",
      publishedAt: new Date().toISOString().slice(0, 10),
      functions: guessed.slice(0, 2),
      templates: [],
    };

    const path = join(DATA_DIR, `${id}.json`);
    if (existsSync(path)) {
      console.log(`đã có data/videos/${id}.json, bỏ qua`);
    } else {
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(path, `${JSON.stringify(skeleton, null, 2)}\n`);
      console.log(`✓ data/videos/${id}.json — sửa title/summary/functions`);
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
