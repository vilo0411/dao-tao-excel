import { columnLetter, display, type TemplateSpec } from "@/lib/schema";

type Sheet = TemplateSpec["sheets"][number];
type Column = Sheet["columns"][number];

/**
 * Biểu đồ vẽ từ chính con số Excel tính ra trong file.
 *
 * Phần "Bên trong file có gì" trước đây chỉ có bảng — mà một bảng 16 cột thì
 * đọc được từng ô nhưng không thấy được hình dạng của dữ liệu. Biểu đồ trả lời
 * một câu bảng không trả lời trong một cái liếc.
 *
 * Số vẽ ở đây KHÔNG phải số minh họa. Chúng lấy từ data/computed, tức kết quả
 * qa_check chạy lại file .xlsx thật rồi ghi ra. Không có file computed thì
 * component tự biến mất chứ không vẽ số bịa.
 *
 * BỐN DẠNG, VÀ DẠNG DO DỮ LIỆU CHỌN — KHÔNG PHẢI DO CHO ĐẸP.
 *
 * Bản đầu vẽ cột ngang cho cả 18 file, và đọc ra là mười tám lần cùng một hình.
 * Nhưng cách chữa không phải là xoay vòng dạng biểu đồ cho khác nhau — một biểu
 * đồ sai dạng thì nói sai, và mỗi dạng chỉ trả lời đúng một loại câu hỏi:
 *
 *   - `meter`     Cột tỷ lệ phần trăm. Vẽ trên máng 0–100% cố định, nên nhìn
 *                 thấy cả phần CÒN THIẾU. Cột ngang so tương đối với nhau thì
 *                 giấu mất điều đó: bốn dòng đạt 40% vẫn cho ra một cột dài
 *                 chạm mép, trông y như đạt đủ.
 *   - `line`      Có cột ngày và các dòng mẫu xếp theo đúng thứ tự thời gian.
 *                 Đó là một chuỗi thời gian thật (tồn quỹ sau mỗi giao dịch),
 *                 mà chuỗi thời gian vẽ thành cột rời thì mất mạch.
 *   - `diverging` Giá trị có cả âm lẫn dương. Trục 0 nằm giữa, hai nhánh hai
 *                 màu — "còn 5 ngày" và "trễ 5 ngày" là hai chuyện ngược nhau,
 *                 vẽ cùng một chiều là xóa mất dấu.
 *   - `bar`       Mặc định, và là mặc định ĐÚNG cho phần lớn file: so độ lớn
 *                 giữa các dòng. Vẫn còn khoảng mười file dùng nó, vì đó thật
 *                 sự là câu hỏi mà dữ liệu của chúng đặt ra.
 *
 * MÀU. Thân biểu đồ dùng `chart` — cùng họ xanh lá với `computed`, vì nó vẽ
 * đúng một cột công thức và vẫn nói đúng câu đó ("số Excel tự tính"), chỉ khác
 * là vẽ thành hình thay vì in vào ô. Nhánh âm của biểu đồ phân kỳ dùng `coral`.
 * Cặp này đã chạy qua validator mù màu, xem chú thích ở app/globals.css.
 *
 * Một series thì KHÔNG có chú giải màu: tiêu đề đã gọi tên nó rồi. Và mọi cột
 * đều có nhãn số ngay bên cạnh, nên không cần tooltip — tooltip sinh ra để lộ
 * con số bị giấu, mà ở đây không con số nào bị giấu.
 */

type Form = "meter" | "line" | "diverging" | "bar";

type Chart = {
  form: Form;
  /** Tiêu đề cột giá trị, vd "Thực lĩnh". */
  title: string;
  /** Tham chiếu cột trong file, vd "P". */
  ref: string;
  format: string;
  points: { label: string; value: number }[];
};

/** Cột công thức ra số mới vẽ được; cột trả về chữ hoặc ngày thì không. */
const PLOTTABLE = new Set(["currency", "number", "percent"]);

function numericSeries(
  col: Column,
  computed: Record<string, unknown>[],
  rowCount: number,
): number[] | undefined {
  const values = Array.from({ length: rowCount }, (_, i) =>
    Number(computed[i]?.[col.key]),
  );
  if (values.some((v) => !Number.isFinite(v))) return undefined;
  // Sáu cột cao bằng nhau không cho biết gì, mà vẫn chiếm chỗ như thể có.
  if (new Set(values).size < 2) return undefined;
  return values;
}

/**
 * Chọn cột đáng vẽ và dạng vẽ nó, hoặc không chọn gì cả.
 *
 * Thứ tự ưu tiên cột: cột phần trăm trước, rồi tới cột công thức ra số CUỐI
 * CÙNG. Ưu tiên phần trăm không phải để biểu đồ trông đa dạng hơn — một tỷ lệ
 * so với mốc 100% nói được nhiều hơn một con số thô, và tiêu đề luôn gọi đúng
 * tên cột nên người đọc biết chính xác đang nhìn cột nào.
 *
 * Lấy cột công thức cuối chứ không phải cột đầu: bảng tính công việc xếp theo
 * mạch tính, các cột giữa là bước trung gian, cột cuối mới là con số người ta
 * cần ("Thực lĩnh", "Tồn quỹ"). Vẽ cột đầu là vẽ một bước phụ rồi gọi nó là
 * kết quả.
 */
function pickChart(
  sheet: Sheet,
  computed: Record<string, unknown>[] | undefined,
  maxPoints: number,
): Chart | undefined {
  if (!computed || sheet.sampleRows.length < 3) return undefined;

  const rows = sheet.sampleRows.slice(0, maxPoints);
  const formulas = sheet.columns
    .map((col, index) => ({ col, index }))
    .filter(({ col }) => col.type === "formula");

  const candidates = [
    // Phần trăm trước, và trong nhóm đó vẫn lấy cột cuối cùng.
    ...formulas.filter(({ col }) => col.format === "percent").reverse(),
    ...formulas
      .filter(({ col }) => PLOTTABLE.has(col.format ?? "number"))
      .reverse(),
  ];

  for (const { col, index } of candidates) {
    const values = numericSeries(col, computed, rows.length);
    if (!values) continue;

    const format = col.format ?? "number";
    const axis = timeAxis(sheet, rows);

    /*
     * Trục thời gian chỉ được dùng khi các dòng mẫu THẬT SỰ xếp theo thời gian.
     * Không có ràng buộc đó thì "ngày vào làm" của năm nhân viên cũng thành một
     * trục hoành, và đường nối giữa chúng vẽ ra một xu hướng không hề tồn tại.
     */
    const form: Form =
      format === "percent"
        ? "meter"
        : axis
          ? "line"
          : values.some((v) => v < 0) && values.some((v) => v > 0)
            ? "diverging"
            : "bar";

    // Cột ngang không vẽ được giá trị âm khi không có trục 0.
    if (form === "bar" && values.some((v) => v < 0)) continue;

    const label = axis ?? widestText(sheet);
    if (!label) continue;

    return {
      form,
      title: col.header,
      ref: columnLetter(index),
      format,
      points: rows.map((row, i) => ({
        label:
          label.type === "date"
            ? display(row[label.key], "date")
            : String(row[label.key] ?? `Dòng ${i + 2}`),
        value: values[i],
      })),
    };
  }

  return undefined;
}

/**
 * Cột ngày dùng được làm trục hoành, nếu có.
 *
 * Ba điều kiện, bỏ điều kiện nào cũng ra một biểu đồ nói dối: phải có giá trị ở
 * mọi dòng, phải không trùng nhau, và phải đã xếp tăng dần sẵn trong spec. Điều
 * kiện cuối là điều kiện thật sự phân biệt "sổ quỹ ghi theo ngày" với "danh
 * sách nhân viên có cột ngày vào làm".
 */
function timeAxis(
  sheet: Sheet,
  rows: Sheet["sampleRows"],
): Column | undefined {
  if (rows.length < 4) return undefined;

  return sheet.columns.find((col) => {
    if (col.type !== "date") return false;
    const values = rows.map((r) => r[col.key]);
    if (values.some((v) => v === undefined || v === null || v === "")) {
      return false;
    }
    const asText = values.map(String);
    if (new Set(asText).size !== asText.length) return false;
    return asText.every((v, i) => i === 0 || asText[i - 1] <= v);
  });
}

/**
 * Nhãn lấy cột chữ được khai RỘNG NHẤT, không phải cột chữ đầu tiên.
 *
 * Bảng công việc gần như luôn có cột mã đứng trước cột tên ("Mã NV" rồi mới
 * "Họ và tên"), nên lấy cột đầu là ra biểu đồ dán nhãn NV001, NV002 — đúng dữ
 * liệu nhưng không ai đọc ra được gì. Bề rộng khai trong spec chính là thứ tác
 * giả đã tuyên bố về độ dài nội dung cột.
 */
function widestText(sheet: Sheet): Column | undefined {
  return sheet.columns
    .filter((c) => c.type === "text")
    // Đồng hạng thì giữ cột đứng trước, để thứ tự không đổi giữa hai lần build.
    .reduce<Column | undefined>(
      (best, c) => (best && best.width >= c.width ? best : c),
      undefined,
    );
}

/* ------------------------------------------------------------------ */

const LABEL_COL =
  "grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]";

const VALUE = "shrink-0 font-mono text-xs tabular-nums text-ink-soft";

/**
 * Cột ngang: so độ lớn giữa các dòng.
 *
 * Bề rộng tính theo giá trị lớn nhất trong chính bộ dòng mẫu, nên thanh dài
 * nhất luôn chạm mép — trục ở đây là so sánh giữa các dòng với nhau, không phải
 * một thang tuyệt đối. Cột phần trăm KHÔNG đi đường này, vì với nó cái mốc
 * tuyệt đối mới là điều đáng nói; xem Meter.
 */
function Bars({ chart }: { chart: Chart }) {
  const max = Math.max(...chart.points.map((p) => p.value));

  return (
    <dl className="mt-4 space-y-2">
      {chart.points.map((point, i) => (
        <div key={`${point.label}-${i}`} className={LABEL_COL}>
          <dt className="truncate text-sm text-ink-soft">{point.label}</dt>
          <dd className="flex items-center gap-3">
            {/*
              Thanh nằm trong một đường chạy riêng chiếm hết chỗ còn lại. Đặt
              thanh trực tiếp vào flex rồi cho nó width:100% thì ở dòng lớn nhất
              nó đẩy con số ra khỏi khung.
            */}
            <span aria-hidden className="min-w-0 flex-1">
              <span
                className="block h-4 min-w-px bg-chart"
                style={{ width: `${Math.max(1, (point.value / max) * 100)}%` }}
              />
            </span>
            <span className={VALUE}>{display(point.value, chart.format)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Máng đo: tỷ lệ so với mốc 100%, không so với nhau.
 *
 * Máng xám luôn vẽ đủ chiều dài, và đó chính là toàn bộ lý do dạng này tồn tại
 * — phần máng còn trống là phần CÒN THIẾU, thứ mà một biểu đồ cột co giãn theo
 * giá trị lớn nhất không bao giờ cho thấy.
 *
 * Vượt 100% thì thanh dừng ở mép máng và phần vượt hiện bằng một vạch coral nối
 * tiếp: kéo dài thanh ra ngoài máng sẽ phá mất chính cái mốc mà máng đang dựng.
 */
function Meter({ chart }: { chart: Chart }) {
  return (
    <dl className="mt-4 space-y-2">
      {chart.points.map((point, i) => {
        const pct = point.value * 100;
        return (
          <div key={`${point.label}-${i}`} className={LABEL_COL}>
            <dt className="truncate text-sm text-ink-soft">{point.label}</dt>
            <dd className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex min-w-0 flex-1 border border-rule bg-panel"
              >
                <span
                  className="block h-4 bg-chart"
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
                {pct > 100 && (
                  <span className="block h-4 w-1.5 shrink-0 bg-coral" />
                )}
              </span>
              <span className={VALUE}>{display(point.value, chart.format)}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Hai nhánh quanh trục 0: dấu của con số là một phần của thông tin.
 *
 * "Còn 5 ngày" và "trễ 5 ngày" dài bằng nhau nhưng ngược nghĩa nhau. Vẽ cùng
 * một chiều rồi để dấu trừ trong nhãn số gánh hết nghĩa là bắt người đọc đọc
 * chữ mới hiểu được hình — mà biểu đồ sinh ra để khỏi phải đọc.
 *
 * Cả hai nhánh chia chung một thang theo |giá trị| lớn nhất, nên hai nửa so
 * được với nhau. Thang riêng cho mỗi nhánh sẽ làm một số nhỏ bên trái trông
 * ngang một số lớn bên phải.
 */
function Diverging({ chart }: { chart: Chart }) {
  const scale = Math.max(...chart.points.map((p) => Math.abs(p.value)));

  return (
    <dl className="mt-4 space-y-2">
      {chart.points.map((point, i) => {
        const width = `${Math.max(1, (Math.abs(point.value) / scale) * 100)}%`;
        const negative = point.value < 0;
        /*
         * Đúng 0 thì không vẽ gì cả, chỉ còn nét trục.
         *
         * Sàn 1% ở trên tồn tại để giá trị rất nhỏ vẫn hiện ra một vạch thay vì
         * biến mất, nhưng áp nó cho số 0 thì thành vạch xanh nằm ở nhánh dương —
         * tức là gán cho 0 một chiều mà nó không có. "Còn đúng 0 ngày" phải đọc
         * ra là đứng ngay trên vạch, không phải nghiêng về bên nào.
         */
        const zero = point.value === 0;

        return (
          <div key={`${point.label}-${i}`} className={LABEL_COL}>
            <dt className="truncate text-sm text-ink-soft">{point.label}</dt>
            <dd className="flex items-center gap-3">
              <span aria-hidden className="flex min-w-0 flex-1">
                {/* Hai nửa bằng nhau, trục 0 là nét kẻ đứng ở giữa. */}
                <span className="flex flex-1 justify-end border-r border-ink-faint">
                  {negative && !zero && (
                    <span className="block h-4 bg-coral" style={{ width }} />
                  )}
                </span>
                <span className="flex flex-1">
                  {!negative && !zero && (
                    <span className="block h-4 bg-chart" style={{ width }} />
                  )}
                </span>
              </span>
              <span className={VALUE}>{display(point.value, chart.format)}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Đường theo thời gian.
 *
 * Vẽ bằng SVG có viewBox nên co giãn theo bề ngang khung, còn nét thì giữ đúng
 * 2px nhờ vector-effect="non-scaling-stroke" — thiếu thuộc tính đó thì nét dày
 * mỏng thay đổi theo khổ màn hình.
 *
 * ĐIỂM MỐC vẽ bằng HTML đặt chồng lên, không phải bằng <circle> trong SVG.
 * `preserveAspectRatio="none"` kéo giãn hệ tọa độ theo phương ngang để đường
 * lấp đầy khung, và nó kéo giãn luôn cả hình tròn — <circle> ra hình bầu dục,
 * méo dần theo bề ngang màn hình. Đường thì chịu được phép kéo đó (non-scaling
 * -stroke giữ nét), hình tròn thì không. Thẻ HTML nằm ngoài hệ tọa độ SVG nên
 * tròn ở mọi khổ màn hình, và không bị mép viewBox cắt mất một nửa như điểm
 * đầu và điểm cuối trước đây.
 *
 * Nhãn ngày và nhãn số đặt bằng HTML dưới biểu đồ chứ không bằng <text> trong
 * SVG: chữ trong SVG không thừa hưởng được font và cỡ chữ của hệ thiết kế, mà
 * ngày tháng thì cần font mono để thẳng cột.
 */
function Line({ chart }: { chart: Chart }) {
  const W = 100;
  const H = 32;
  const values = chart.points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = chart.points.map((p, i) => ({
    x: (i / (chart.points.length - 1)) * W,
    y: H - ((p.value - min) / span) * H,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`).join(" ");
  // Vùng tô khép kín xuống đáy: nó nói rằng đây là số dư tích lại, không phải
  // một dãy điểm rời.
  const area = `${path} L${W} ${H} L0 ${H} Z`;

  return (
    <figure className="mt-4">
      <div className="relative h-32">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="presentation"
          className="h-full w-full"
        >
          <path d={area} className="fill-chart/10" />
          <path
            d={path}
            fill="none"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className="stroke-chart"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {coords.map((c, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-chart bg-paper"
            style={{ left: `${c.x}%`, top: `${(c.y / H) * 100}%` }}
          />
        ))}
      </div>

      {/*
        Mỗi mốc một cột đều nhau, khớp với khoảng cách điểm trên SVG. Ngày ở
        trên, giá trị ở dưới — đọc dọc theo một cột là ra một điểm.
      */}
      <dl className="mt-3 flex text-center">
        {chart.points.map((point, i) => (
          <div key={`${point.label}-${i}`} className="min-w-0 flex-1">
            <dt className="truncate font-mono text-[0.7rem] text-ink-faint">
              {point.label}
            </dt>
            <dd className="truncate font-mono text-xs tabular-nums text-ink-soft">
              {display(point.value, chart.format)}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

const NOTE: Record<Form, string> = {
  meter: "trên máng 100%, phần trống là phần còn thiếu",
  line: "theo thứ tự thời gian trong file",
  diverging: "trục 0 ở giữa, hai bên là hai chiều ngược nhau",
  bar: "so giữa các dòng mẫu trong file",
};

export function SheetChart({
  sheet,
  computed,
  maxPoints = 6,
}: {
  sheet: Sheet;
  computed?: Record<string, unknown>[];
  maxPoints?: number;
}) {
  const chart = pickChart(sheet, computed, maxPoints);
  if (!chart) return null;

  return (
    <figure className="mt-8 border border-rule bg-paper p-5">
      <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-medium">{chart.title}</span>
        {/* Tham chiếu cột thật, để người đọc mở file ra là tìm thấy ngay. */}
        <span className="cell-ref text-xs text-computed">cột {chart.ref}</span>
        <span className="text-sm text-ink-faint">{NOTE[chart.form]}</span>
      </figcaption>

      {chart.form === "meter" && <Meter chart={chart} />}
      {chart.form === "line" && <Line chart={chart} />}
      {chart.form === "diverging" && <Diverging chart={chart} />}
      {chart.form === "bar" && <Bars chart={chart} />}
    </figure>
  );
}
