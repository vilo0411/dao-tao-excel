"use client";

import { useId, useState } from "react";
import type { QuizItem } from "@/lib/knowledge-schema";

/**
 * Quiz tự chấm cuối bài.
 *
 * Chấm ngay trong trình duyệt, không gửi đi đâu, không tài khoản, không lưu
 * tiến độ. Site xuất tĩnh (`output: "export"`) nên không có chỗ nào để chấm
 * phía máy chủ — và cũng không cần: đây là bài tự kiểm chứ không phải bài thi.
 * Đáp án nằm trong payload trang và người muốn xem thì xem được; chấp nhận
 * điều đó thẳng thắn hơn là dựng một lớp che mắt không chặn được ai.
 *
 * Phần dạy học thật nằm ở `explain`, và nó hiện ra DÙ ĐÚNG HAY SAI. Chỉ hiện
 * khi sai thì người trả lời đúng vì đoán mò không học được gì, mà đó lại đúng
 * là nhóm cần giải thích nhất.
 *
 * KHÔNG khai JSON-LD kiểu Quiz. Google chỉ hiện rich result đó cho nội dung
 * giáo dục đã qua duyệt, và khai một schema không đủ điều kiện là tự mở đường
 * cho manual action. FAQPage mới là chỗ đáng đầu tư trên trang này.
 */
export function Quiz({ items }: { items: QuizItem[] }) {
  const groupId = useId();
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const answered = Object.keys(chosen).length;
  const correct = items.filter((q, i) => chosen[i] === q.answer).length;

  return (
    <section className="mt-24">
      <h2 className="font-display text-3xl">Kiểm tra nhanh</h2>
      <p className="mt-5 max-w-prose text-ink-soft">
        {items.length} câu, chấm ngay trên trình duyệt. Không cần đăng nhập và
        không có gì được gửi đi.
      </p>

      <ol className="mt-8 space-y-8">
        {items.map((q, qi) => {
          const pick = chosen[qi];
          const isRight = pick === q.answer;

          return (
            <li key={q.q}>
              <fieldset>
                <legend className="font-medium">
                  {qi + 1}. {q.q}
                </legend>

                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => {
                    // Sau khi chấm: tô đáp án đúng, và tô riêng lựa chọn sai
                    // của người dùng. Chỉ tô cái sai thì người trả lời sai
                    // không biết đâu mới là đúng.
                    let tone = "border-rule";
                    if (checked && oi === q.answer) tone = "border-computed bg-computed-bg";
                    else if (checked && oi === pick) tone = "border-flag";

                    return (
                      <label
                        key={opt}
                        className={`flex cursor-pointer gap-3 rounded-sm border p-3 text-sm ${tone}`}
                      >
                        <input
                          type="radio"
                          name={`${groupId}-${qi}`}
                          checked={pick === oi}
                          onChange={() => {
                            setChosen((s) => ({ ...s, [qi]: oi }));
                            // Đổi lựa chọn sau khi đã chấm thì xoá kết quả cũ,
                            // nếu không thì màu tô sẽ nói về một câu trả lời
                            // người dùng vừa bỏ đi.
                            setChecked(false);
                          }}
                          className="mt-0.5"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {checked && pick !== undefined && (
                  <p className="mt-3 max-w-prose text-sm text-ink-soft">
                    <span
                      className={isRight ? "text-computed" : "text-flag"}
                    >
                      {isRight ? "Đúng. " : "Chưa đúng. "}
                    </span>
                    {q.explain}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={answered < items.length}
          className="rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:opacity-85 disabled:opacity-40"
        >
          Kiểm tra
        </button>
        <span aria-live="polite" className="text-sm text-ink-soft">
          {checked
            ? `Đúng ${correct}/${items.length}`
            : answered < items.length
              ? `Còn ${items.length - answered} câu chưa chọn`
              : "Sẵn sàng"}
        </span>
      </div>
    </section>
  );
}
