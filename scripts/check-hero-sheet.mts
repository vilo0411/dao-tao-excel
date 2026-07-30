/**
 * Chặn bảng demo trang chủ trôi khỏi file Excel mà nó đang nói thay.
 *
 *   node --experimental-strip-types scripts/check-hero-sheet.mts
 *   (đã nối vào npm run validate, nên npm run check cũng chạy)
 *
 * components/HeroSheet dựng lại cách tính lương của
 * data/templates/nhan-su/bang-tinh-luong-nhan-vien.json bằng TypeScript, vì nó
 * phải chạy trong trình duyệt. Đó là một bản sao, và bản sao thì sớm muộn cũng
 * lệch: sửa biểu thuế trong spec JSON rồi quên component, thế là trang chủ tính
 * sai thuế ngay dưới câu quảng cáo "công thức đã kiểm bằng máy". Vòng kiểm này
 * làm cho việc quên đó gãy build thay vì lặng lẽ lên production.
 *
 * Cách kiểm: rút mọi hằng số ra khỏi công thức Excel trong spec, rút cùng ngần
 * ấy hằng số ra khỏi lib/thue-tncn.ts (cả biến số lẫn chuỗi công thức hiện trên
 * thanh fx), rồi so từng con số. Tham chiếu ô thì KHÔNG so — file thật là bảng
 * ngang nhiều dòng, bảng demo dựng đứng, nên B4/B5 hai bên vốn khác nhau. Chỉ
 * các con số mang nghĩa pháp lý mới phải trùng.
 */
import { getTemplate } from "../lib/templates.ts";
import {
  BAC_THUE,
  DEMO_FORMULA,
  GIAM_TRU_BAN_THAN,
  GIAM_TRU_PHU_THUOC,
  TY_LE_BAO_HIEM,
} from "../lib/thue-tncn.ts";

const CATEGORY = "nhan-su";
const SLUG = "bang-tinh-luong-nhan-vien";

const loi: string[] = [];
const fail = (msg: string) => loi.push(msg);

const template = getTemplate(CATEGORY, SLUG);

if (!template) {
  // Không hạ xuống cảnh báo: mất file này thì bảng ở trang chủ đang mô phỏng
  // một thứ không tồn tại, mà nó lại mời người đọc "Mở file đầy đủ".
  console.error(
    `✗ Không tìm thấy template ${CATEGORY}/${SLUG}.\n` +
      `  components/HeroSheet đang dựng lại chính file này. Khôi phục file,\n` +
      `  hoặc trỏ bảng demo sang file khác rồi cập nhật scripts/check-hero-sheet.mts.`,
  );
  process.exit(1);
}

const columns = template.sheets.flatMap((sheet) => sheet.columns);

function congThuc(key: string): string {
  const col = columns.find((c) => c.key === key);
  if (!col?.formula) {
    fail(
      `spec ${SLUG} không còn cột công thức "${key}" — bảng demo đang dựa vào cột này`,
    );
    return "";
  }
  return col.formula;
}

/** Mọi số nguyên từ 4 chữ số trở lên, theo đúng thứ tự xuất hiện. */
function soNguyen(formula: string): number[] {
  return [...formula.matchAll(/(?<![\d.])(\d{4,})(?![\d.])/g)].map((m) =>
    Number(m[1]),
  );
}

/** Mọi tỉ lệ phần trăm, trả về dạng thập phân: "10.5%" → 0.105. */
function phanTram(formula: string): number[] {
  return [...formula.matchAll(/(\d+(?:\.\d+)?)%/g)].map(
    (m) => Number(m[1]) / 100,
  );
}

/**
 * Rút biểu thuế lũy tiến ra khỏi một chuỗi IF lồng nhau.
 *
 * Cố ý bám sát đúng dạng công thức hiện tại (IF lồng, mỗi bậc là
 * "<=ngưỡng, thu nhập*suất-số trừ"). Ai viết lại công thức sang dạng khác —
 * VLOOKUP vào bảng bậc thuế chẳng hạn — sẽ làm hàm này rút ra sai số lượng,
 * và nó báo lỗi đòi cập nhật thay vì im lặng cho qua. Im lặng cho qua mới là
 * kết cục tệ: vòng kiểm còn đó nhưng không còn kiểm gì.
 */
function bieuThue(formula: string, nguon: string) {
  const nguong = [...formula.matchAll(/<=\s*(\d+)/g)].map((m) => Number(m[1]));
  const suat = phanTram(formula);
  const truNhanh = [...formula.matchAll(/%\s*-\s*(\d+)/g)].map((m) =>
    Number(m[1]),
  );

  if (
    nguong.length !== BAC_THUE.length - 1 ||
    suat.length !== BAC_THUE.length ||
    truNhanh.length !== BAC_THUE.length - 1
  ) {
    fail(
      `${nguon}: công thức thuế đã đổi dạng (đọc ra ${nguong.length} ngưỡng, ` +
        `${suat.length} thuế suất, ${truNhanh.length} số trừ nhanh — cần ` +
        `${BAC_THUE.length - 1}/${BAC_THUE.length}/${BAC_THUE.length - 1}).\n` +
        `  Cập nhật lại scripts/check-hero-sheet.mts cho khớp dạng mới.`,
    );
    return null;
  }

  // Bậc cuối không có ngưỡng trên, bậc đầu không trừ nhanh.
  return { nguong, suat, truNhanh: [0, ...truNhanh] };
}

function soSanh(nguon: string, ten: string, doc: number[], mong: number[]) {
  const lech = doc.length !== mong.length || doc.some((v, i) => v !== mong[i]);
  if (lech) {
    fail(
      `${nguon} — ${ten}\n` +
        `  spec Excel     : ${doc.join(", ") || "(không đọc được số nào)"}\n` +
        `  lib/thue-tncn  : ${mong.join(", ")}`,
    );
  }
}

/*
 * Ba nhóm hằng số, mỗi nhóm soát hai lần: một lần với biến số trong
 * lib/thue-tncn.ts (thứ bảng demo dùng để TÍNH), một lần với chuỗi công thức
 * trong DEMO_FORMULA (thứ bảng demo KHAI trên thanh fx). Hai thứ đó cũng có
 * thể lệch nhau — bảng tính đúng nhưng khai sai công thức thì vẫn là nói dối.
 */
const specBaoHiem = congThuc("baoHiem");
soSanh("baoHiem", "tỉ lệ bảo hiểm", phanTram(specBaoHiem), [TY_LE_BAO_HIEM]);
soSanh("baoHiem", "tỉ lệ bảo hiểm trên thanh fx", phanTram(DEMO_FORMULA.B5), [
  TY_LE_BAO_HIEM,
]);

const specGiamTru = congThuc("giamTru");
const giamTruMong = [GIAM_TRU_BAN_THAN, GIAM_TRU_PHU_THUOC];
soSanh("giamTru", "mức giảm trừ", soNguyen(specGiamTru), giamTruMong);
soSanh(
  "giamTru",
  "mức giảm trừ trên thanh fx",
  soNguyen(DEMO_FORMULA.B6),
  giamTruMong,
);

const specThue = congThuc("thueTNCN");
const mong = {
  nguong: BAC_THUE.slice(0, -1).map((b) => b.tran),
  suat: BAC_THUE.map((b) => b.suat),
  truNhanh: BAC_THUE.map((b) => b.tru),
};

if (BAC_THUE.at(-1)?.tran !== Infinity) {
  fail("lib/thue-tncn: bậc thuế cuối phải có tran = Infinity (không trần trên)");
}

for (const [nguon, formula] of [
  ["thueTNCN", specThue],
  ["thueTNCN trên thanh fx", DEMO_FORMULA.B8],
] as const) {
  const doc = bieuThue(formula, nguon);
  if (!doc) continue;
  soSanh(nguon, "ngưỡng bậc thuế", doc.nguong, mong.nguong);
  soSanh(nguon, "thuế suất", doc.suat, mong.suat);
  soSanh(nguon, "số trừ nhanh", doc.truNhanh, mong.truNhanh);
}

if (loi.length > 0) {
  console.error(
    `\n✗ Bảng demo trang chủ lệch khỏi ${CATEGORY}/${SLUG}:\n\n${loi.join("\n\n")}\n\n` +
      `Sửa cho khớp ở cả hai nơi: data/templates/${CATEGORY}/${SLUG}.json và lib/thue-tncn.ts\n`,
  );
  process.exit(1);
}

console.log(
  `✓ Bảng demo trang chủ khớp ${CATEGORY}/${SLUG}: ` +
    `bảo hiểm ${TY_LE_BAO_HIEM * 100}%, giảm trừ ${GIAM_TRU_BAN_THAN.toLocaleString("vi-VN")}` +
    ` + ${GIAM_TRU_PHU_THUOC.toLocaleString("vi-VN")}/người, ${BAC_THUE.length} bậc thuế`,
);
