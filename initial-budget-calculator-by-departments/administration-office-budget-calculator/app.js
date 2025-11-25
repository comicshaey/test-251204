// 교육행정실 예산 계산기 (BudgetCore 사용)

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#aoTable tbody");
  const addRowBtn = document.getElementById("aoAddRowBtn");
  const clearRowsBtn = document.getElementById("aoClearRowsBtn");
  const summaryBox = document.getElementById("aoSummaryBox");
  const makeNoteBtn = document.getElementById("aoMakeNoteBtn");
  const noteBox = document.getElementById("aoNoteBox");

  if (!tbody) return;

  const CATS = [
    { value: "사무용품", label: "사무용품" },
    { value: "OA장비", label: "OA장비·토너" },
    { value: "시설경미수선", label: "시설 경미수선" },
    { value: "기타", label: "기타" }
  ];

  function createRow(defaultCat = "사무용품") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "ao-cat";
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
    nameInput.className = "ao-name";
    nameInput.placeholder = "예: 복사용지, 프린터 토너, 형광등, 경미수선 등";
    nameTd.appendChild(nameInput);

    const unitTd = document.createElement("td");
    const unitInput = document.createElement("input");
    unitInput.type = "number";
    unitInput.min = "0";
    unitInput.step = "1000";
    unitInput.className = "ao-unit";
    unitInput.placeholder = "단가";
    unitTd.appendChild(unitInput);

    const qtyTd = document.createElement("td");
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "0";
    qtyInput.step = "1";
    qtyInput.className = "ao-qty";
    qtyInput.placeholder = "수량";
    qtyTd.appendChild(qtyInput);

    const amtTd = document.createElement("td");
    amtTd.className = "ao-amount";
    amtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "ao-note";
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
    tr.appendChild(qtyTd);
    tr.appendChild(amtTd);
    tr.appendChild(noteTd);
    tr.appendChild(delTd);

    unitInput.addEventListener("input", updateAll);
    qtyInput.addEventListener("input", updateAll);
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

    rows.forEach(tr => {
      const cat = tr.querySelector(".ao-cat")?.value || "기타";
      const unitVal = Number(tr.querySelector(".ao-unit")?.value || 0);
      const qtyVal = Number(tr.querySelector(".ao-qty")?.value || 0);
      const amtTd = tr.querySelector(".ao-amount");

      const amt = unitVal * qtyVal;
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
      totalLabel: "총 소요 예산(교육행정실)"
    });
  }

  function makeNote() {
    const year = document.getElementById("aoYear")?.value || "";
    const writer = (document.getElementById("aoWriter")?.value || "").trim();

    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".ao-cat")?.value || "기타";
      const name = (tr.querySelector(".ao-name")?.value || "").trim();
      const unitVal = Number(tr.querySelector(".ao-unit")?.value || 0);
      const qtyVal = Number(tr.querySelector(".ao-qty")?.value || 0);
      const note = (tr.querySelector(".ao-note")?.value || "").trim();
      const amt = unitVal * qtyVal;

      if (!name || amt <= 0) return;

      if (catSum[cat] == null) catSum[cat] = 0;
      catSum[cat] += amt;
      grandTotal += amt;

      details.push({ cat, name, unitVal, qtyVal, amt, note });
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
      return `- [${label}] ${d.name}: 단가 ${fmtMoney(
        d.unitVal
      )} × ${d.qtyVal} = ${fmtMoney(d.amt)}${notePart}`;
    });

    const writerTxt = writer ? ` (${writer} 작성)` : "";

    const html = `
      <p>
        ${year || ""}학년도 학교행정 운영을 위하여,
        사무용품·OA장비 소모품·시설 경미수선비 등 교육행정실 예산으로
        총 <b>${fmtMoney(grandTotal)}</b>을 편성하고자 합니다.${writerTxt}
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
        ※ 위 금액은 학교 행정업무 수행을 위한 기본 소요액을 기준으로 산정한 것입니다.
      </p>
    `;
    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("사무용품"));
    tbody.appendChild(createRow("OA장비"));
    tbody.appendChild(createRow("시설경미수선"));
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
