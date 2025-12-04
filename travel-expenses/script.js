// 공통: 숫자 안전 파싱
function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

// 세 자리 콤마
function formatWon(n) {
  return n.toLocaleString("ko-KR") + " 원";
}

// ----------------------
// 탭 전환
// ----------------------
document.querySelectorAll('input[name="calcType"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const type = document.querySelector('input[name="calcType"]:checked').value;
    document.getElementById("section-inner").style.display = (type === "inner") ? "block" : "none";
    document.getElementById("section-outer").style.display = (type === "outer") ? "block" : "none";
  });
});

// ----------------------
// 1. 근무지 내 국내출장
// ----------------------
document.getElementById("btnInner").addEventListener("click", () => {
  const distance = toNumber(document.getElementById("innerDistance").value);
  const hours = toNumber(document.getElementById("innerHours").value);
  const carUse = document.querySelector('input[name="innerCar"]:checked').value;
  const actualShort = toNumber(document.getElementById("innerActualShort").value);

  let base = 0;
  let typeDesc = "";
  let note = [];

  if (hours <= 0) {
    alert("출장 소요시간을 입력해 주세요.");
    return;
  }

  // 왕복 2km 이내 근거리
  if (distance > 0 && distance <= 2) {
    typeDesc = "근무지 내 근거리 출장 (왕복 2km 이내, 실비 기준)";
    if (actualShort <= 0) {
      note.push("근거리 출장은 정액 대신 실비 지급 대상입니다. 실제 운임·식비 합계를 입력해야 정확한 금액이 나옵니다.");
    }
    const limit = hours < 4 ? 10000 : 20000;
    base = Math.min(actualShort, limit);
    note.push(`· 시간 기준 상한: ${formatWon(limit)} (입력 실비와 비교하여 작은 금액 적용)`);
  } else {
    // 일반 근무지 내 출장 정액
    typeDesc = "근무지 내 출장 (정액 기준)";
    if (hours < 4) {
      base = 10000;
    } else {
      base = 20000;
    }

    if (carUse === "yes") {
      base = Math.max(0, base - 10000);
      note.push("공용차량/임차차량 사용으로 10,000원 감액 적용됨.");
    }
  }

  const resultEl = document.getElementById("innerResult");
  resultEl.style.display = "block";
  resultEl.innerHTML = `
    <div class="result-line">
      <div class="result-label">구분</div>
      <div class="result-value">${typeDesc}</div>
    </div>
    <div class="result-line">
      <div class="result-label">산출 여비</div>
      <div class="result-value"><strong>${formatWon(base)}</strong></div>
    </div>
    <p class="muted" style="margin-top:8px;">
      · 1회 출장 기준 금액입니다. 실제 지급 시에는 1일 2만원 상한, 운전원 특례 여부 등을 별도로 확인해야 합니다.
      ${note.length ? "<br/>" + note.join("<br/>") : ""}
    </p>
  `;
});

// ----------------------
// 2. 근무지 외 국내출장
// ----------------------
document.getElementById("btnOuter").addEventListener("click", () => {
  const days = toNumber(document.getElementById("outerDays").value);
  const nights = toNumber(document.getElementById("outerNights").value);
  const region = document.getElementById("outerRegion").value;
  const lodgingSpent = toNumber(document.getElementById("outerLodgingSpent").value);
  const lodgingExtra = document.querySelector('input[name="outerLodgingExtra"]:checked').value;
  const carDays = toNumber(document.getElementById("outerCarDays").value);
  const mileageUse = document.querySelector('input[name="outerMileage"]:checked').value;
  const mealsProvided = toNumber(document.getElementById("outerMealsProvided").value);
  const longStayRate = Number(document.getElementById("outerLongStayRate").value);
  const fare = toNumber(document.getElementById("outerFare").value);

  if (days <= 0) {
    alert("출장일수를 1일 이상 입력해 주세요.");
    return;
  }
  if (carDays > days) {
    alert("공용/임차 차량 사용일수가 출장일수보다 많을 수 없습니다.");
    return;
  }

  // 기본 단가 (제2호 기준)
  const PER_DIEM_BASE = 20000; // 일비
  const MEAL_BASE = 20000;     // 식비

  // 1) 일비 계산
  const normalDays = Math.max(0, days - carDays);
  const carUseDays = Math.max(0, carDays);
  let perDiem = normalDays * PER_DIEM_BASE + carUseDays * (PER_DIEM_BASE / 2);

  // 장기체재 감액
  perDiem = Math.round(perDiem * longStayRate);

  // 2) 식비 계산
  let mealTotal = days * MEAL_BASE;
  const perMeal = Math.round(MEAL_BASE / 3); // 1식당 1/3 감액
  const mealReduction = perMeal * mealsProvided;
  mealTotal = Math.max(0, mealTotal - mealReduction);

  // 3) 숙박비 상한 계산
  let capPerNight = 50000; // 기타·세종·제주
  if (region === "seoul") capPerNight = 70000;
  if (region === "metro") capPerNight = 60000;

  if (lodgingExtra === "yes") {
    capPerNight = Math.round(capPerNight * 1.3);
  }

  const lodgingCapTotal = capPerNight * nights;
  const lodgingAllowed = Math.min(lodgingSpent, lodgingCapTotal);

  // 4) 항공마일리지 사용 시 일비 추가
  let perDiemExtra = 0;
  if (mileageUse === "yes") {
    perDiemExtra = Math.round(perDiem * 0.5);
  }

  // 5) 총액
  const total = fare + perDiem + perDiemExtra + mealTotal + lodgingAllowed;

  // 비고문구
  const notes = [];
  if (lodgingExtra === "yes") {
    notes.push("· 숙박비 상한 30% 가산을 적용한 금액입니다. 실제 지급 시에는 불가피한 사유 인정 여부를 확인해야 합니다.");
  }
  if (mileageUse === "yes") {
    notes.push("· 항공마일리지 사용에 따른 일비 50% 추가는 '절약된 항공운임의 1/2 한도'를 별도로 검토해야 합니다.");
  }
  if (longStayRate < 1.0) {
    notes.push("· 동일지역 장기체재 일비 감액율을 적용했습니다.");
  }

  const resultEl = document.getElementById("outerResult");
  resultEl.style.display = "block";
  resultEl.innerHTML = `
    <div class="result-line">
      <div class="result-label">운임(실비)</div>
      <div class="result-value">${formatWon(fare)}</div>
    </div>
    <div class="result-line">
      <div class="result-label">일비 합계</div>
      <div class="result-value">${formatWon(perDiem)}</div>
    </div>
    <div class="result-line">
      <div class="result-label">일비 추가 (마일리지)</div>
      <div class="result-value">${formatWon(perDiemExtra)}</div>
    </div>
    <div class="result-line">
      <div class="result-label">식비 합계</div>
      <div class="result-value">${formatWon(mealTotal)}</div>
    </div>
    <div class="result-line">
      <div class="result-label">숙박비 인정액</div>
      <div class="result-value">${formatWon(lodgingAllowed)} / 상한 ${formatWon(lodgingCapTotal)}</div>
    </div>
    <hr/>
    <div class="result-line">
      <div class="result-label">총 여비 (참고)</div>
      <div class="result-value"><strong>${formatWon(total)}</strong></div>
    </div>
    <p class="muted" style="margin-top:8px;">
      · 국내 근무지 외 출장(제2호 기준) 여비 산출 결과입니다. 실제 지급 시에는 기관별 세부지침과 증빙서류를 기준으로 다시 검토해야 합니다.<br/>
      ${notes.join("<br/>")}
    </p>
  `;
});
