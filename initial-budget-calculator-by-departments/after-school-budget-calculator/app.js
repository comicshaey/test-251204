// 늘봄·방과후 프로그램 예산 계산기 (BudgetCore 사용)
// - 강좌별 인건비 + 기관부담 사회보험률 반영

window.addEventListener("DOMContentLoaded", () => {
  if (!window.BudgetCore) return;
  const { fmtMoney, buildCategorySummaryHtml, bindClearAll } = window.BudgetCore;

  const tbody = document.querySelector("#asTable tbody");
  const addRowBtn = document.getElementById("asAddRowBtn");
  const clearRowsBtn = document.getElementById("asClearRowsBtn");
  const summaryBox = document.getElementById("asSummaryBox");
  const makeNoteBtn = document.getElementById("asMakeNoteBtn");
  const noteBox = document.getElementById("asNoteBox");

  if (!tbody) return;

  // 선택형/맞춤형/돌봄 프로그램 구분 정도만
  const CATS = [
    { value: "선택형유료", label: "선택형 교육(유료)" },
    { value: "선택형무료", label: "선택형 교육(무료)" },
    { value: "맞춤형교육", label: "맞춤형 교육" },
    { value: "선택형돌봄", label: "선택형 돌봄" },
    { value: "기타", label: "기타" }
  ];

  function getYear() {
    return document.getElementById("asYear")?.value || "";
  }

  function getOrgRate() {
    // 기관부담 사회보험률(%) 입력값
    const v = Number(document.getElementById("asOrgRate")?.value || 0);
    return v > 0 ? v : 0;
  }

  function createRow(defaultCat = "선택형유료") {
    const tr = document.createElement("tr");

    const catTd = document.createElement("td");
    const catSel = document.createElement("select");
    catSel.className = "as-cat";
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
    nameInput.className = "as-name";
    nameInput.placeholder = "예: 피아노A, 영어B, 맞춤형 미술 등";
    nameTd.appendChild(nameInput);

    // 수강생 수
    const stdTd = document.createElement("td");
    const stdInput = document.createElement("input");
    stdInput.type = "number";
    stdInput.min = "0";
    stdInput.step = "1";
    stdInput.className = "as-students";
    stdInput.placeholder = "인원";
    stdTd.appendChild(stdInput);

    // 연간 회기수(주차)
    const sessionsTd = document.createElement("td");
    const sessionsInput = document.createElement("input");
    sessionsInput.type = "number";
    sessionsInput.min = "0";
    sessionsInput.step = "1";
    sessionsInput.className = "as-sessions";
    sessionsInput.placeholder = "회기수";
    sessionsTd.appendChild(sessionsInput);

    // 1회기 수업시간(시간)
    const hoursTd = document.createElement("td");
    const hoursInput = document.createElement("input");
    hoursInput.type = "number";
    hoursInput.min = "0";
    hoursInput.step = "0.1";
    hoursInput.className = "as-hours";
    hoursInput.placeholder = "시간";
    hoursTd.appendChild(hoursInput);

    // 강사 시급
    const payTd = document.createElement("td");
    const payInput = document.createElement("input");
    payInput.type = "number";
    payInput.min = "0";
    payInput.step = "1000";
    payInput.className = "as-hourly";
    payInput.placeholder = "시급";
    payTd.appendChild(payInput);

    // 인건비 + 기관부담 합계
    const wageTd = document.createElement("td");
    wageTd.className = "as-wage";
    wageTd.textContent = "-";

    // 수강료 단가(1인/1회 또는 1인/월 등, 편의상 1인·1회 기준으로 입력)
    const feeUnitTd = document.createElement("td");
    const feeUnitInput = document.createElement("input");
    feeUnitInput.type = "number";
    feeUnitInput.min = "0";
    feeUnitInput.step = "1000";
    feeUnitInput.className = "as-fee-unit";
    feeUnitInput.placeholder = "1인당 수강료 단가";
    feeUnitTd.appendChild(feeUnitInput);

    // 수강료 총액
    const feeAmtTd = document.createElement("td");
    feeAmtTd.className = "as-fee-amount";
    feeAmtTd.textContent = "-";

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "as-note";
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
    tr.appendChild(stdTd);
    tr.appendChild(sessionsTd);
    tr.appendChild(hoursTd);
    tr.appendChild(payTd);
    tr.appendChild(wageTd);
    tr.appendChild(feeUnitTd);
    tr.appendChild(feeAmtTd);
    tr.appendChild(noteTd);
    tr.appendChild(delTd);

    [stdInput, sessionsInput, hoursInput, payInput, feeUnitInput].forEach(el =>
      el.addEventListener("input", updateAll)
    );
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
    const feeCatSum = {};
    CATS.forEach(c => {
      catSum[c.value] = 0;
      feeCatSum[c.value] = 0;
    });
    let grandWage = 0;
    let grandFee = 0;

    const orgRate = getOrgRate() / 100; // %

    rows.forEach(tr => {
      const cat = tr.querySelector(".as-cat")?.value || "기타";
      const students = Number(tr.querySelector(".as-students")?.value || 0);
      const sessions = Number(tr.querySelector(".as-sessions")?.value || 0);
      const hours = Number(tr.querySelector(".as-hours")?.value || 0);
      const hourly = Number(tr.querySelector(".as-hourly")?.value || 0);
      const feeUnit = Number(tr.querySelector(".as-fee-unit")?.value || 0);

      const wageTd = tr.querySelector(".as-wage");
      const feeAmtTd = tr.querySelector(".as-fee-amount");

      // 강사 인건비 = 시급 × 시간 × 회기수
      let wageBase = 0;
      if (hourly > 0 && hours > 0 && sessions > 0) {
        wageBase = hourly * hours * sessions;
      }

      let wageTotal = wageBase;
      if (wageBase > 0 && orgRate > 0) {
        wageTotal = Math.round(wageBase * (1 + orgRate));
      }

      if (wageTotal > 0) {
        wageTd.textContent = fmtMoney(wageTotal);
        if (catSum[cat] == null) catSum[cat] = 0;
        catSum[cat] += wageTotal;
        grandWage += wageTotal;
      } else {
        wageTd.textContent = "-";
      }

      // 수강료 총액 = 수강생 수 × 회기수 × 1인당 단가
      let feeTotal = 0;
      if (students > 0 && sessions > 0 && feeUnit > 0) {
        feeTotal = students * sessions * feeUnit;
      }

      if (feeTotal > 0) {
        feeAmtTd.textContent = fmtMoney(feeTotal);
        if (feeCatSum[cat] == null) feeCatSum[cat] = 0;
        feeCatSum[cat] += feeTotal;
        grandFee += feeTotal;
      } else {
        feeAmtTd.textContent = "-";
      }
    });

    // 요약 박스: 인건비/수강료 둘 다 보여주자
    const wageHtml = buildCategorySummaryHtml(CATS, catSum, grandWage, {
      title: "카테고리별 강사 인건비(기관부담 포함)",
      totalLabel: "강사 인건비 총액"
    });

    const feeLines = [];
    feeLines.push("<p><b>카테고리별 수강료 총액</b></p>");
    CATS.forEach(c => {
      const sum = feeCatSum[c.value] || 0;
      if (sum > 0) {
        feeLines.push(`<p>· ${c.label}: <b>${fmtMoney(sum)}</b></p>`);
      } else {
        feeLines.push(`<p>· ${c.label}: 0원</p>`);
      }
    });
    feeLines.push("<hr>");
    feeLines.push(
      `<p><b>수강료 총액 합계</b> = <b>${fmtMoney(grandFee)}</b></p>`
    );

    summaryBox.innerHTML = `
      ${wageHtml}
      <div style="margin-top:12px;"></div>
      ${feeLines.join("")}
    `;
  }

  function makeNote() {
    const year = getYear();
    const orgRate = getOrgRate();
    const rows = tbody.querySelectorAll("tr");

    const catWageSum = {};
    const catFeeSum = {};
    CATS.forEach(c => {
      catWageSum[c.value] = 0;
      catFeeSum[c.value] = 0;
    });

    let grandWage = 0;
    let grandFee = 0;
    const details = [];

    rows.forEach(tr => {
      const cat = tr.querySelector(".as-cat")?.value || "기타";
      const name = (tr.querySelector(".as-name")?.value || "").trim();
      const students = Number(tr.querySelector(".as-students")?.value || 0);
      const sessions = Number(tr.querySelector(".as-sessions")?.value || 0);
      const hours = Number(tr.querySelector(".as-hours")?.value || 0);
      const hourly = Number(tr.querySelector(".as-hourly")?.value || 0);
      const feeUnit = Number(tr.querySelector(".as-fee-unit")?.value || 0);
      const note = (tr.querySelector(".as-note")?.value || "").trim();

      if (!name || sessions <= 0) return;

      let wageBase = 0;
      if (hourly > 0 && hours > 0) {
        wageBase = hourly * hours * sessions;
      }
      let wageTotal = wageBase;
      if (wageBase > 0 && orgRate > 0) {
        wageTotal = Math.round(wageBase * (1 + orgRate / 100));
      }

      let feeTotal = 0;
      if (students > 0 && feeUnit > 0) {
        feeTotal = students * sessions * feeUnit;
      }

      if (wageTotal <= 0 && feeTotal <= 0) return;

      if (wageTotal > 0) {
        if (catWageSum[cat] == null) catWageSum[cat] = 0;
        catWageSum[cat] += wageTotal;
        grandWage += wageTotal;
      }
      if (feeTotal > 0) {
        if (catFeeSum[cat] == null) catFeeSum[cat] = 0;
        catFeeSum[cat] += feeTotal;
        grandFee += feeTotal;
      }

      const label = CATS.find(c => c.value === cat)?.label || cat;
      const wageText =
        wageTotal > 0
          ? `강사 인건비: 시급 ${fmtMoney(hourly)} × ${hours}시간 × ${sessions}회기 × (기관부담 ${orgRate}% 포함) ≒ ${fmtMoney(
              wageTotal
            )}`
          : "강사 인건비: -";

      const feeText =
        feeTotal > 0
          ? `수강료: 수강생 ${students}명 × ${sessions}회기 × 1인당 ${fmtMoney(
              feeUnit
            )} = ${fmtMoney(feeTotal)}`
          : "수강료: -";

      details.push({
        label,
        name,
        wageText,
        feeText,
        note
      });
    });

    if (details.length === 0) {
      noteBox.innerHTML = `<p class="muted">입력된 강좌가 없어 설명문을 생성할 수 없습니다.</p>`;
      return;
    }

    const catLines = [];
    CATS.forEach(c => {
      const w = catWageSum[c.value] || 0;
      const f = catFeeSum[c.value] || 0;
      catLines.push(
        `· ${c.label}: 강사 인건비 ${fmtMoney(w)}, 수강료 ${fmtMoney(f)}`
      );
    });

    const detailLines = details.map(d => {
      const notePart = d.note ? `<br>  - 비고: ${d.note}` : "";
      return `<p>- [${d.label}] ${d.name}<br>  - ${d.wageText}<br>  - ${d.feeText}${notePart}</p>`;
    });

    const html = `
      <p>
        ${year || ""}학년도 늘봄교실 및 방과후학교 프로그램 운영을 위하여,
        강사 인건비(기관부담 사회보험료 포함)와 수강료 산정 기준에 따라
        강사 인건비 총 <b>${fmtMoney(
          grandWage
        )}</b>, 수강료 총 <b>${fmtMoney(grandFee)}</b>을 편성하고자 합니다.
      </p>
      <p>
        카테고리별 인건비·수강료 소요액은 다음과 같습니다.<br>
        ${catLines.join("<br>")}
      </p>
      <p>세부 산출 내역은 아래와 같으며, 필요 시 강좌별 내역서를 첨부합니다.</p>
      <div style="margin-top:8px;">
        ${detailLines.join("")}
      </div>
      <p class="muted" style="margin-top:8px;">
        ※ 실제 집행 시에는 강사 계약서 및 사회보험 요율, 수강료 징수계획을 다시 확인해야 합니다.
      </p>
    `;

    noteBox.innerHTML = html;
  }

  function initRows() {
    tbody.innerHTML = "";
    tbody.appendChild(createRow("선택형유료"));
    tbody.appendChild(createRow("맞춤형교육"));
    tbody.appendChild(createRow("선택형돌봄"));
    updateAll();
  }

  addRowBtn?.addEventListener("click", () => {
    tbody.appendChild(createRow());
    updateAll();
  });

  bindClearAll(clearRowsBtn, initRows, "모든 강좌를 삭제하시겠습니까?");
  makeNoteBtn?.addEventListener("click", makeNote);

  initRows();
});
