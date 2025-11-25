// 유치원 예산 계산기 (BudgetCore 사용)

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#kTable tbody");
  const addRowBtn = document.getElementById("kAddRowBtn");
  const clearRowsBtn = document.getElementById("kClearRowsBtn");
  const summaryBox = document.getElementById("kSummaryBox");
  const makeNoteBtn = document.getElementById("kMakeNoteBtn");
  const noteBox = document.getElementById("kNoteBox");

  if (!tbody) return;

  const CATS = [
    { value: "놀이", label: "놀이·일상활동" },
    { value: "체험", label: "체험·현장학습" },
    { value: "행사", label: "행사·공연" },
    { value: "간식", label: "간식·간단급식" },
    { value: "교재", label: "교재·교구" },
    { value: "기타", label: "기타" }
  ];

  function getChildCount() {
    const v = Number(document.getElementById("kChildCount")?.value || 0);
    return v > 0 ? v : 0;
  }

  function createRow(defaultCat = "놀이") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "k-cat";
    CATS.forEach(c => {
      const o = document.createElement("option");
      o.value = c.value;
      o.textContent = c.label;
      if (c.value === defaultCat) o.selected = true;
      catSel.appendChild(o);
    });
    catTd.appendChild(catSel);

    const nameTd = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "예: 현장체험학습, 계절행사, 생일축하 등";
    nameInput.className = "k-name";
    nameTd.appendChild(nameInput);

    const unitTd = document.createElement("td");
    const unitInput = document.createElement("input");
    unitInput.type = "number";
    unitInput.min = "0";
    unitInput.step = "100";
    unitInput.placeholder = "1인당 단가";
    unitInput.className = "k-unit";
    unitTd.appendChild(unitInput);

    const timesTd = document.createElement("td");
    const timesInput = document.createElement("input");
    timesInput.type = "number";
    timesInput.min = "0";
    timesInput.step = "1";
    timesInput.placeholder = "연간 횟수";
    timesInput.className = "k-times";
    timesTd.appendChild(timesInput);

    const amtTd = document.createElement("td");
    amtTd.className = "k-amount";
    amtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "비고";
    noteInput.className = "k-note";
    noteTd.appendChild(noteInput);

    const delTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "X";
    delBtn.className = "btn-ghost-small";
    delTd.appendChild(delBtn);

    tr.appendChild(catTd);
    tr.appendChild(nameTd);
    tr.appendChild(unitTd);
    tr.appendChild(timesTd);
    tr.appendChild(amtTd);
    tr.appendChild(noteTd);
    tr.appendChild(delTd);

    unitInput.addEventListener("input", updateAll);
    timesInput.addEventListener("input", updateAll);
    catSel.addEventListener("change", updateAll);
    delBtn.addEventListener("click", () => {
      tr.remove();
      updateAll();
    });

    return tr;
  }

  function updateAll() {
    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const childCount = getChildCount();

    rows.forEach(tr => {
      const cat = tr.querySelector(".k-cat")?.value || "기타";
      const unitVal = Number(tr.querySelector(".k-unit")?.value || 0);
      const timesVal = Number(tr.querySelector(".k-times")?.value || 0);
      const amtTd = tr.querySelector(".k-amount");

      let amt = 0;
      if (childCount > 0 && unitVal > 0 && timesVal > 0) {
        amt = childCount * unitVal * timesVal;
      }

      if (amt > 0) {
        amtTd.textContent = fmtMoney(amt);
        if (catSum[cat] == null) catSum[cat] = 0;
        catSum[cat] += amt;
        grandTotal += amt;
      } else {
        amtTd.textContent = "-";
      }
    });

    summaryBox.innerHTML = buildCategorySummaryHtml(CATS, catSum, grandTotal, {
      title: "카테고리별 소계",
      totalLabel: "총 소요 예산(유치원 교육활동)"
    });
  }

  function makeNote() {
    const year = document.getElementById("kYear")?.value || "";
    const className = (document.getElementById("kClassName")?.value || "").trim();
    const childCount = getChildCount();

    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".k-cat")?.value || "기타";
      const name = (tr.querySelector(".k-name")?.value || "").trim();
      const unitVal = Number(tr.querySelector(".k-unit")?.value || 0);
      const timesVal = Number(tr.querySelector(".k-times")?.value || 0);
      const note = (tr.querySelector(".k-note")?.value || "").trim();

      if (!name || childCount <= 0 || unitVal <= 0 || timesVal <= 0) return;

      const amt = childCount * unitVal * timesVal;
      if (amt <= 0) return;

      if (catSum[cat] == null) catSum[cat] = 0;
      catSum[cat] += amt;
      grandTotal += amt;

      details.push({ cat, name, unitVal, timesVal, amt, note });
    });

    if (details.length === 0) {
      noteBox.innerHTML = `<p class="muted">입력된 유효 항목이 없어 설명문을 생성할 수 없습니다. 유아 수, 단가, 횟수를 다시 확인해 주세요.</p>`;
      return;
    }

    const catLines = [];
    CATS.forEach(c => {
      const sum = catSum[c.value];
      if (sum > 0) catLines.push(`${c.label} ${fmtMoney(sum)}`);
    });

    const detailLines = details.map(d => {
      const label = CATS.find(c => c.value === d.cat)?.label || d.cat;
      const notePart = d.note ? `, 비고: ${d.note}` : "";
      return `- [${label}] ${d.name}: 유아 ${childCount}명 × 1인당 ${fmtMoney(
        d.unitVal
      )} × 연 ${d.timesVal}회 = ${fmtMoney(d.amt)}${notePart}`;
    });

    const targetText = className ? `(${className})` : "유치원 전체";
    const html = `
      <p>
        ${year || ""}학년도 유치원 교육활동 운영을 위하여, ${targetText} 유아 ${childCount}명을 기준으로
        놀이·체험·행사·간식·교재교구 예산으로 총 <b>${fmtMoney(grandTotal)}</b>을 편성하고자 합니다.
      </p>
      <p>
        카테고리별 소요액은 다음과 같습니다.<br>
        ${catLines.join(", ") || "※ 카테고리별 합계 없음"}
      </p>
      <p>세부 산출 내역은 아래와 같으며, 필요 시 첨부표로 제출합니다.</p>
      <div style="margin-top:8px;">
        ${detailLines.map(l => `<p>${l}</p>`).join("")}
      </div>
      <p class="muted" style="margin-top:8px;">
        ※ 위 금액은 유치원 교육과정 운영 계획에 따른 최소 소요액을 기준으로 산정한 것입니다.
      </p>
    `;

    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("놀이"));
    tbody.appendChild(createRow("체험"));
    tbody.appendChild(createRow("행사"));
    updateAll();
  }

  addRowBtn?.addEventListener("click", () => {
    tbody.appendChild(createRow());
    updateAll();
  });

  bindClearAll(clearRowsBtn, initRows, "모든 행을 삭제하시겠습니까?");
  makeNoteBtn?.addEventListener("click", makeNote);

  initRows();
});
