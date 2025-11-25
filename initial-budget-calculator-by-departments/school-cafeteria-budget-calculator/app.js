// 급식실 예산 계산기 (BudgetCore 사용)

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#cfTable tbody");
  const addRowBtn = document.getElementById("cfAddRowBtn");
  const clearRowsBtn = document.getElementById("cfClearRowsBtn");
  const summaryBox = document.getElementById("cfSummaryBox");
  const makeNoteBtn = document.getElementById("cfMakeNoteBtn");
  const noteBox = document.getElementById("cfNoteBox");

  if (!tbody) return;

  const CATS = [
    { value: "식품비", label: "식품비(1식당 단가)" },
    { value: "부식소모품", label: "부식·소모품" },
    { value: "기구장비", label: "기구·장비" },
    { value: "위생안전", label: "위생·안전" },
    { value: "기타", label: "기타" }
  ];

  const BASE_OPTIONS = [
    { value: "perMeal", label: "학생수×급식일수×1식단가" },
    { value: "perItem", label: "단순 물품(단가×수량)" }
  ];

  function getStudentCount() {
    const v = Number(document.getElementById("cfStudentCount")?.value || 0);
    return v > 0 ? v : 0;
  }

  function getMealDays() {
    const v = Number(document.getElementById("cfMealDays")?.value || 0);
    return v > 0 ? v : 0;
  }

  function createRow(defaultCat = "식품비") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "cf-cat";
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
    nameInput.className = "cf-name";
    nameInput.placeholder = "예: 식품비, 일회용품, 조리기구, 위생점검비 등";
    nameTd.appendChild(nameInput);

    const baseTd = document.createElement("td");
    const baseSel = document.createElement("select");
    baseSel.className = "cf-base";
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
    unitInput.step = "10";
    unitInput.className = "cf-unit";
    unitInput.placeholder = "1식 단가 또는 물품 단가";
    unitTd.appendChild(unitInput);

    const qtyTd = document.createElement("td");
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "0";
    qtyInput.step = "1";
    qtyInput.className = "cf-qty";
    qtyInput.placeholder = "물품 수량(식품비는 1 권장)";
    qtyTd.appendChild(qtyInput);

    const amtTd = document.createElement("td");
    amtTd.className = "cf-amount";
    amtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "cf-note";
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
    tr.appendChild(baseTd);
    tr.appendChild(unitTd);
    tr.appendChild(qtyTd);
    tr.appendChild(amtTd);
    tr.appendChild(noteTd);
    tr.appendChild(delTd);

    unitInput.addEventListener("input", updateAll);
    qtyInput.addEventListener("input", updateAll);
    baseSel.addEventListener("change", updateAll);
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
    const mealDays = getMealDays();

    rows.forEach(tr => {
      const cat = tr.querySelector(".cf-cat")?.value || "기타";
      const base = tr.querySelector(".cf-base")?.value || "perMeal";
      const unitVal = Number(tr.querySelector(".cf-unit")?.value || 0);
      const qtyVal = Number(tr.querySelector(".cf-qty")?.value || 0);
      const amtTd = tr.querySelector(".cf-amount");

      let amt = 0;

      if (unitVal > 0) {
        if (base === "perMeal") {
          if (studentCount > 0 && mealDays > 0) {
            // 학생수 × 급식일수 × 1식 단가
            amt = studentCount * mealDays * unitVal;
          }
        } else {
          // 단순 물품
          if (qtyVal > 0) amt = unitVal * qtyVal;
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
      totalLabel: "총 소요 예산(급식실)"
    });
  }

  function makeNote() {
    const year = document.getElementById("cfYear")?.value || "";
    const writer = (document.getElementById("cfWriter")?.value || "").trim();
    const studentCount = getStudentCount();
    const mealDays = getMealDays();

    const rows = tbody.querySelectorAll("tr");
    const catSum = {};
    CATS.forEach(c => (catSum[c.value] = 0));
    let grandTotal = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".cf-cat")?.value || "기타";
      const base = tr.querySelector(".cf-base")?.value || "perMeal";
      const name = (tr.querySelector(".cf-name")?.value || "").trim();
      const unitVal = Number(tr.querySelector(".cf-unit")?.value || 0);
      const qtyVal = Number(tr.querySelector(".cf-qty")?.value || 0);
      const note = (tr.querySelector(".cf-note")?.value || "").trim();

      if (!name || unitVal <= 0) return;

      let amt = 0;
      let formulaText = "";

      if (base === "perMeal") {
        if (studentCount <= 0 || mealDays <= 0) return;
        amt = studentCount * mealDays * unitVal;
        formulaText = `학생 ${studentCount}명 × 급식일수 ${mealDays}일 × 1식 ${fmtMoney(
          unitVal
        )}`;
      } else {
        if (qtyVal <= 0) return;
        amt = unitVal * qtyVal;
        formulaText = `${qtyVal}개 × ${fmtMoney(unitVal)}`;
      }

      if (amt <= 0) return;

      if (catSum[cat] == null) catSum[cat] = 0;
      catSum[cat] += amt;
      grandTotal += amt;

      details.push({ cat, name, formulaText, amt, note });
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
      return `- [${label}] ${d.name}: ${d.formulaText} = ${fmtMoney(
        d.amt
      )}${notePart}`;
    });

    const writerTxt = writer ? ` (${writer} 작성)` : "";

    const html = `
      <p>
        ${year || ""}학년도 학교급식 운영을 위하여,
        식품비 및 부식·소모품·기구장비·위생안전 확보를 위한 예산으로
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
        ※ 위 금액은 급식기본계획 상 급식일수 및 학생 수를 기준으로 산정한 최소 소요액입니다.
      </p>
    `;
    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("식품비"));
    tbody.appendChild(createRow("부식소모품"));
    tbody.appendChild(createRow("위생안전"));
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
