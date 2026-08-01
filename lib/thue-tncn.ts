/**
 * Cách tính lương ròng dùng cho bảng demo ở trang chủ (components/HeroSheet).
 *
 * Vì sao nằm riêng ở lib thay vì ngay trong component: những con số này là
 * bản sao của công thức trong data/templates/nhan-su/bang-tinh-luong-nhan-vien.json.
 * Hai bản sao thì sớm muộn cũng lệch — mà lệch ở đây nghĩa là trang chủ nói
 * sai thuế, ngay dưới câu quảng cáo "công thức đã kiểm bằng máy".
 *
 * Tách ra thành module .ts thuần (không JSX) để scripts/check-hero-sheet.mts
 * import được bằng node và đối chiếu từng con số với spec JSON. Component chỉ
 * còn việc hiển thị; nguồn số nằm ở đây và được canh gác ở đó.
 *
 * Biểu thuế 2026: giảm trừ bản thân 15,5 triệu, mỗi người phụ thuộc 6,2 triệu,
 * lũy tiến 5 bậc. Đổi số ở đây thì phải đổi cả spec JSON, và ngược lại —
 * npm run validate sẽ chặn nếu chỉ đổi một bên.
 */

export const GIAM_TRU_BAN_THAN = 15_500_000;
export const GIAM_TRU_PHU_THUOC = 6_200_000;
export const TY_LE_BAO_HIEM = 0.105;

/** Biểu lũy tiến 5 bậc, viết dạng thuế suất + số trừ nhanh. */
export const BAC_THUE = [
  { tran: 10_000_000, suat: 0.05, tru: 0 },
  { tran: 30_000_000, suat: 0.1, tru: 500_000 },
  { tran: 60_000_000, suat: 0.2, tru: 3_500_000 },
  { tran: 100_000_000, suat: 0.3, tru: 9_500_000 },
  { tran: Infinity, suat: 0.35, tru: 14_500_000 },
];

export function tinhThue(thuNhapTinhThue: number): number {
  const bac = BAC_THUE.find((b) => thuNhapTinhThue <= b.tran)!;
  return Math.max(0, thuNhapTinhThue * bac.suat - bac.tru);
}

/**
 * Công thức hiện trên thanh fx của bảng demo, viết theo lưới dựng đứng của nó
 * (B1 lương cơ bản, B2 phụ cấp, B3 số người phụ thuộc).
 *
 * Đây là lời khai của trang chủ về cách file thật chạy, nên nó cũng bị đối
 * chiếu với spec JSON: mọi con số trong các chuỗi dưới đây phải trùng với con
 * số trong công thức Excel tương ứng. File thật là bảng ngang nhiều dòng nên
 * tham chiếu ô khác nhau — chỉ các hằng số là phải khớp.
 */
export const DEMO_FORMULA = {
  B4: "=B1+B2",
  B5: "=B1*10.5%",
  B6: "=15500000+B3*6200000",
  B7: "=MAX(0,B4-B5-B6)",
  B8: "=IF(B7<=10000000,B7*5%,IF(B7<=30000000,B7*10%-500000,IF(B7<=60000000,B7*20%-3500000,IF(B7<=100000000,B7*30%-9500000,B7*35%-14500000))))",
  B9: "=B4-B5-B8",
};

/**
 * Các ô mà một công thức đang đọc vào — Excel gọi là precedents, và vẽ khung
 * quanh chúng khi bạn double-click vào ô công thức.
 *
 * Trích thẳng từ chuỗi công thức chứ KHÔNG khai thành bảng riêng. Một bảng
 * `{ B9: ["B4","B5","B8"] }` viết tay là bản sao thứ hai của cùng một sự thật,
 * và bản sao thì lệch: sửa B9 thành "=B4-B5-B8-B10" mà quên bảng, thế là trang
 * chủ khoanh sai ô ngay dưới câu quảng cáo "công thức đã kiểm bằng máy". Cùng
 * lý do lib/templates trích tên hàm từ công thức thật thay vì để người khai.
 *
 * Bảng demo dựng đứng nên mọi tham chiếu đều là cột B một chữ số — không cần
 * parser Excel đầy đủ, và nếu ai đó thêm cột C thì regex này im lặng bỏ qua nó.
 * Đổi bảng sang nhiều cột thì phải mở rộng chỗ này.
 */
export function tienDe(formula: string): string[] {
  return [...new Set(formula.match(/\bB\d+\b/g) ?? [])];
}
