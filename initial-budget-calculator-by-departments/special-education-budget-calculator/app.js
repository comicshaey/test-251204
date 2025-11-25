// 특수교육부 예산 계산기 (BudgetCore 사용)

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#seTable tbody");
  const addRowBtn = document.getElementById("seAddRowBtn");
  const clearRowsBtn = document.getElementById("seClearRowsBtn");
  const summaryBox = document.getElementById("seSummaryBox");
  const makeNoteBtn = document.getElementById("seMakeNoteBtn");
  const noteBox = document.getElementById("seNoteBox");

  if (!tbody) return;

  const CATS = [
    { value: "교구보조공학", label: "교구·보조공학기기" },
    { value: "치료지원", label: "치료지원" },
    { value: "체험활동", label: "체험활동" },
    { value: "기타", label: "기타" }
  ];

  function getStudentCount() {
    const v = Number(document.getElementById("seStudentCount")?.value || 0);
    return v > 0 ? v : 0;
  }

  function createRow(defaultCat = "교구보조공학") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "se-cat";
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
    nameInput.className = "se-name";
    nameInput.placeholder = "예: 감각통합치료, 특수교구, 체험활동비 등";
    nameTd.appendChild(nameInput);

    const unitTd = document.createElement("td");
    const unitInput = document.createElement("input");
    unitInput.type = "number";
    unitInput.min = "0";
    unitInput.step = "1000";
    unitInput.className = "se-unit";
    unitInput.placeholder = "1인당 단가";
    unitTd.appendChild(unitInput);

    const timesTd = document.createElement("td");
    const timesInput = document.createElement("input");
    timesInput.type = "number";
    timesInput.min = "0";
    timesInput.step = "1";
    timesInput.className = "se-times";
    timesInput.placeholder = "연간 횟수";
    timesTd.appendChild(timesInput);

    const amtTd = document.createElement("td");
    amtTd.className = "se-amount";
    amtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "se-note";
    noteInput.placeholder = "비고";
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
    const studentCount = getStudentCount();

    rows.forEach(tr => {
      const cat = tr.querySelector(".se-cat")?.value || "기타";
      const unitVal = Number(tr.querySelector(".se-unit")?.value || 0);
      const timesVal = Number(tr.querySelector(".se-times")?.value || 0);
      const amtTd = tr.querySelector(".se-amount");

      let amt = 0;
      if (studentCount > 0 && unitVal > 0 && timesVal > 0) {
        amt = studentCount * unitVal * timesVal;
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
      totalLabel: "총 소요 예산(특수교육부)"
    });
  }

  function makeNote() {
    const year = document.getElementById("seYear")?.value || "";
    const writer = (document.getElementById("seWriter")?.value || "").trim();
    const studentCount = getStudentCount();

    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".se-cat")?.value || "기타";
      const name = (tr.querySelector(".se-name")?.value || "").trim();
      const unitVal = Number(tr.querySelector(".se-unit")?.value || 0);
      const timesVal = Number(tr.querySelector(".se-times")?.value || 0);
      const note = (tr.querySelector(".se-note")?.value || "").trim();

      if (!name || studentCount <= 0 || unitVal <= 0 || timesVal <= 0) return;

      const amt = studentCount * unitVal * timesVal;
      if (amt <= 0) return;

      if (catSum[cat] == null) catSum[cat] = 0;
      catSum[cat] += amt;
      grandTotal += amt;

      details.push({
        cat,
        name,
        unitVal,
        timesVal,
        amt,
        note
      });
    });

    if (details.length === 0) {
      noteBox.innerHTML = `<p class="muted">입력된 항목이 없어 설명문을 생성할 수 없습니다.</p>`;
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
      return `- [${label}] ${d.name}: 학생 ${studentCount}명 × 1인당 ${fmtMoney(
        d.unitVal
      )} × ${d.timesVal}회 = ${fmtMoney(d.amt)}${notePart}`;
    });

    const writerTxt = writer ? ` (${writer} 작성)` : "";

    const html = `
      <p>
        ${year || ""}학년도 특수교육 대상 학생 지원을 위하여,
        교구·보조공학기기, 치료지원, 체험활동비 등으로 총
        <b>${fmtMoney(grandTotal)}</b>을 편성하고자 합니다.${writerTxt}
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
        ※ 위 금액은 특수교육 대상 학생의 교육·치료·체험을 지원하기 위한 최소 소요액을 기준으로 산정한 것입니다.
      </p>
    `;
    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("교구보조공학"));
    tbody.appendChild(createRow("치료지원"));
    tbody.appendChild(createRow("체험활동"));
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
