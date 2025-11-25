// 과학정보부 예산 계산기 (BudgetCore 사용)

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#siTable tbody");
  const addRowBtn = document.getElementById("siAddRowBtn");
  const clearRowsBtn = document.getElementById("siClearRowsBtn");
  const summaryBox = document.getElementById("siSummaryBox");
  const makeNoteBtn = document.getElementById("siMakeNoteBtn");
  const noteBox = document.getElementById("siNoteBox");

  if (!tbody) return;

  const CATS = [
    { value: "실험소모품", label: "실험소모품" },
    { value: "실험기구장비", label: "실험기구·장비" },
    { value: "정보화장비", label: "정보화장비" },
    { value: "소프트웨어", label: "소프트웨어·라이선스" },
    { value: "기타", label: "기타" }
  ];

  function createRow(defaultCat = "실험소모품") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "si-cat";
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
    nameInput.className = "si-name";
    nameInput.placeholder = "예: 실험키트, 시약, 빔프로젝터, 소프트웨어 라이선스 등";
    nameTd.appendChild(nameInput);

    const unitTd = document.createElement("td");
    const unitInput = document.createElement("input");
    unitInput.type = "number";
    unitInput.min = "0";
    unitInput.step = "100";
    unitInput.className = "si-unit";
    unitInput.placeholder = "단가";
    unitTd.appendChild(unitInput);

    const qtyTd = document.createElement("td");
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "0";
    qtyInput.step = "1";
    qtyInput.className = "si-qty";
    qtyInput.placeholder = "수량";
    qtyTd.appendChild(qtyInput);

    const amtTd = document.createElement("td");
    amtTd.className = "si-amount";
    amtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "si-note";
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
      const cat = tr.querySelector(".si-cat")?.value || "기타";
      const unitVal = Number(tr.querySelector(".si-unit")?.value || 0);
      const qtyVal = Number(tr.querySelector(".si-qty")?.value || 0);
      const amtTd = tr.querySelector(".si-amount");

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
      totalLabel: "총 소요 예산(과학정보부)"
    });
  }

  function makeNote() {
    const year = document.getElementById("siYear")?.value || "";
    const writer = (document.getElementById("siWriter")?.value || "").trim();

    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".si-cat")?.value || "기타";
      const name = (tr.querySelector(".si-name")?.value || "").trim();
      const unitVal = Number(tr.querySelector(".si-unit")?.value || 0);
      const qtyVal = Number(tr.querySelector(".si-qty")?.value || 0);
      const note = (tr.querySelector(".si-note")?.value || "").trim();
      const amt = unitVal * qtyVal;

      if (!name || amt <= 0) return;

      if (catSum[cat] == null) catSum[cat] = 0;
      catSum[cat] += amt;
      grandTotal += amt;

      details.push({
        cat,
        name,
        unitVal,
        qtyVal,
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
      return `- [${label}] ${d.name}: 단가 ${fmtMoney(
        d.unitVal
      )} × ${d.qtyVal} = ${fmtMoney(d.amt)}${notePart}`;
    });

    const writerTxt = writer ? ` (${writer} 작성)` : "";

    const html = `
      <p>
        ${year || ""}학년도 과학·정보 교육환경 유지를 위하여,
        실험소모품·실험기구·정보화장비·소프트웨어 라이선스 구입비 등으로
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
        ※ 위 금액은 과학실 실험 및 정보화장비 유지에 필요한 최소 소요액을 기준으로 산정한 것입니다.
      </p>
    `;
    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("실험소모품"));
    tbody.appendChild(createRow("실험기구장비"));
    tbody.appendChild(createRow("정보화장비"));
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
