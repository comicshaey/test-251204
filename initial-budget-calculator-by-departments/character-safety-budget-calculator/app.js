// 인성·안전부 예산 계산기 (BudgetCore 사용)

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#csTable tbody");
  const addRowBtn = document.getElementById("csAddRowBtn");
  const clearRowsBtn = document.getElementById("csClearRowsBtn");
  const summaryBox = document.getElementById("csSummaryBox");
  const makeNoteBtn = document.getElementById("csMakeNoteBtn");
  const noteBox = document.getElementById("csNoteBox");

  if (!tbody) return;

  const CATS = [
    { value: "인성", label: "인성교육" },
    { value: "폭력예방", label: "학교폭력 예방" },
    { value: "안전체험", label: "안전체험·교육" },
    { value: "캠페인", label: "캠페인·홍보" },
    { value: "기타", label: "기타" }
  ];

  const BASE_OPTIONS = [
    { value: "perStudent", label: "학생 수 기준(1인당)" },
    { value: "perItem", label: "개별 물품 기준(개수)" }
  ];

  function getStudentCount() {
    const v = Number(document.getElementById("csStudentCount")?.value || 0);
    return v > 0 ? v : 0;
  }

  function createRow(defaultCat = "인성") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "cs-cat";
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
    nameInput.placeholder = "예: 학교폭력예방 캠페인 물품, 안전체험키트 등";
    nameInput.className = "cs-name";
    nameTd.appendChild(nameInput);

    const baseTd = document.createElement("td");
    const baseSel = document.createElement("select");
    baseSel.className = "cs-base";
    BASE_OPTIONS.forEach(oInfo => {
      const o = document.createElement("option");
      o.value = oInfo.value;
      o.textContent = oInfo.label;
      baseSel.appendChild(o);
    });
    baseTd.appendChild(baseSel);

    const unitTd = document.createElement("td");
    const unitInput = document.createElement("input");
    unitInput.type = "number";
    unitInput.min = "0";
    unitInput.step = "100";
    unitInput.placeholder = "단가";
    unitInput.className = "cs-unit";
    unitTd.appendChild(unitInput);

    const timesTd = document.createElement("td");
    const timesInput = document.createElement("input");
    timesInput.type = "number";
    timesInput.min = "0";
    timesInput.step = "1";
    timesInput.placeholder = "횟수/수량";
    timesInput.className = "cs-times";
    timesTd.appendChild(timesInput);

    const amtTd = document.createElement("td");
    amtTd.className = "cs-amount";
    amtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "비고";
    noteInput.className = "cs-note";
    noteTd.appendChild(noteInput);

    const delTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "X";
    delBtn.className = "btn-ghost-small";
    delTd.appendChild(delBtn);

    tr.appendChild(catTd);
    tr.appendChild(nameTd);
    tr.appendChild(baseTd);
    tr.appendChild(unitTd);
    tr.appendChild(timesTd);
    tr.appendChild(amtTd);
    tr.appendChild(noteTd);
    tr.appendChild(delTd);

    unitInput.addEventListener("input", updateAll);
    timesInput.addEventListener("input", updateAll);
    catSel.addEventListener("change", updateAll);
    baseSel.addEventListener("change", updateAll);
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
    const studentCount = getStudentCount();

    rows.forEach(tr => {
      const cat = tr.querySelector(".cs-cat")?.value || "기타";
      const base = tr.querySelector(".cs-base")?.value || "perStudent";
      const unitVal = Number(tr.querySelector(".cs-unit")?.value || 0);
      const timesVal = Number(tr.querySelector(".cs-times")?.value || 0);
      const amtTd = tr.querySelector(".cs-amount");

      let amt = 0;
      if (unitVal > 0 && timesVal > 0) {
        if (base === "perStudent") {
          if (studentCount > 0) {
            amt = studentCount * unitVal * timesVal;
          }
        } else {
          amt = unitVal * timesVal;
        }
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
      totalLabel: "총 소요 예산(인성·안전부)"
    });
  }

  function makeNote() {
    const year = document.getElementById("csYear")?.value || "";
    const studentCount = getStudentCount();
    const writer = (document.getElementById("csWriter")?.value || "").trim();

    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".cs-cat")?.value || "기타";
      const base = tr.querySelector(".cs-base")?.value || "perStudent";
      const name = (tr.querySelector(".cs-name")?.value || "").trim();
      const unitVal = Number(tr.querySelector(".cs-unit")?.value || 0);
      const timesVal = Number(tr.querySelector(".cs-times")?.value || 0);
      const note = (tr.querySelector(".cs-note")?.value || "").trim();

      if (!name || unitVal <= 0 || timesVal <= 0) return;

      let amt = 0;
      let formulaText = "";

      if (base === "perStudent") {
        if (studentCount <= 0) return;
        amt = studentCount * unitVal * timesVal;
        formulaText = `학생 ${studentCount}명 × 1인당 ${fmtMoney(
          unitVal
        )} × ${timesVal}회`;
      } else {
        amt = unitVal * timesVal;
        formulaText = `${timesVal}개 × ${fmtMoney(unitVal)}`;
      }

      if (amt <= 0) return;

      if (catSum[cat] == null) catSum[cat] = 0;
      catSum[cat] += amt;
      grandTotal += amt;

      details.push({
        cat,
        name,
        amt,
        note,
        formulaText
      });
    });

    if (details.length === 0) {
      noteBox.innerHTML = `<p class="muted">입력된 유효 항목이 없어 설명문을 생성할 수 없습니다.</p>`;
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
      return `- [${label}] ${d.name}: ${d.formulaText} = ${fmtMoney(
        d.amt
      )}${notePart}`;
    });

    const writerTxt = writer ? ` (${writer} 작성)` : "";

    const html = `
      <p>
        ${year || ""}학년도 인성·안전 교육(인성교육, 학교폭력 예방, 안전체험·캠페인 등) 운영을 위하여,
        관련 물품·홍보자료·체험활동비로 총 <b>${fmtMoney(grandTotal)}</b>을 편성하고자 합니다.${writerTxt}
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
        ※ 위 금액은 연간 인성·안전 교육 계획에 따른 최소 소요액을 기준으로 산정한 것입니다.
      </p>
    `;

    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("인성"));
    tbody.appendChild(createRow("폭력예방"));
    tbody.appendChild(createRow("안전체험"));
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
