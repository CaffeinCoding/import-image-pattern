# 🚨 긴급 버그 분석 및 해결

**발생일**: 2025년 11월  
**상태**: 🔴 긴급 수정 필요  
**버그 수**: 3개 (Critical Fix 이후 발생)

---

## 🔴 **발생한 버그들**

### **Bug #1: 셀 크기 읽기 실패**

#### 증상

- `getSelectedCellDimensions()` 호출 실패
- Backend에서 셀 크기를 읽지 못함
- "셀 크기에 맞춤" 기능 전혀 작동하지 않음

#### 가능한 원인

1. **Backend 함수 호출 오류**

   - `getSelectedCellDimensions()` 자체에 문제
   - 권한 부족
   - Sheet 접근 실패

2. **Frontend 호출 실패**
   - `google.script.run` 오류
   - 콜백 처리 오류
   - 비동기 처리 문제

---

### **Bug #2: POST 429 에러 지속 발생**

#### 증상

- Critical Fix #3 적용 후에도 429 에러 발생
- `Utilities.sleep(1000)` 추가했는데도 발생

#### 가능한 원인

1. **첫 이미지 지연이 문제**

   ```javascript
   // 현재 코드
   Utilities.sleep(1000); // 첫 이미지도 1초 대기
   insertImage(); // 그 다음 삽입
   ```

   **문제**: 첫 이미지가 삽입 **전에** 1초 대기

   - 만약 직전에 `getSelectedCellDimensions()` 호출이 있었다면?
   - getSelectedCellDimensions() → (즉시) Sleep(1000) → insertImage()
   - 실제 간격: 0초!

2. **셀 크기 읽기가 추가 API 호출**

   ```
   T=0s:    getSelectedCellDimensions() ← API 호출
   T=0.1s:  insertImages() 시작
   T=1.1s:  첫 이미지 insertImage() ← API 호출
   T=1.2s:  (fitToCell=1) getColumnWidth() ← API 호출!
   T=1.3s:  (fitToCell=1) getRowHeight() ← API 호출!

   총 4번의 API 호출이 1.3초 내에 발생!
   ```

---

### **Bug #3: 드래그 앤 드롭 순서 변경 안됨**

#### 증상

- 이미지 리스트에서 드래그 앤 드롭으로 순서 변경 시도
- 순서가 변경되지 않음
- UI에서 아무 반응 없음

#### 가능한 원인

1. **이벤트 핸들러 미등록**

   - `dragstart`, `dragover`, `drop` 이벤트 누락
   - `updateImageList()`에서 이벤트 재등록 안 됨

2. **appState.images 업데이트 실패**

   - 드롭 이벤트에서 배열 재정렬 실패
   - localStorage 저장 안 됨

3. **다른 오류로 인한 연쇄 실패**
   - Bug #1이나 #2로 인해 전체 기능 마비

---

## 💡 **해결 방안**

### **Solution #1: 셀 크기 읽기 수정**

#### 원인 파악

Backend `getSelectedCellDimensions()` 함수 확인 필요

```javascript
// Code.gs 확인 필요
function getSelectedCellDimensions() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) {
      return { success: false, error: "셀을 선택해주세요" };
    }

    // 실제 크기 읽기
    const rowHeight = range.getRowHeight();
    const colWidth = range.getColumnWidth();

    return {
      success: true,
      width: colWidth,
      height: rowHeight,
    };
  } catch (e) {
    Logger.error("셀 크기 읽기 오류: " + e.toString());
    return { success: false, error: e.toString() };
  }
}
```

**추가 로그**:

```javascript
Logger.log(
  `📐 셀 크기 읽기 시도: sheet=${sheet.getName()}, range=${range.getA1Notation()}`
);
Logger.log(`📐 결과: width=${colWidth}, height=${rowHeight}`);
```

---

### **Solution #2: Rate Limit 완전 해결**

#### 방안 A: 첫 이미지 전에도 충분한 대기

```javascript
// insertImages() 개선
function insertImages(images, startCell, settings, positions) {
  // ✅ 추가: 함수 시작 시 대기 (이전 API 호출과의 간격 확보)
  Utilities.sleep(2000);  // 2초 대기

  for (let i = 0; i < images.length; i++) {
    // 각 이미지 사이에도 대기
    if (i > 0) {
      Utilities.sleep(1000);
    }

    // 이미지 삽입
    insertImageAtCell(...);
  }
}
```

#### 방안 B: 셀 크기 읽기 지연 증가

```javascript
// insertImageAtCell() 개선
if (width == 1 && height == 1) {
  const range = sheet.getRange(row, col);
  widthPx = range.getColumnWidth();
  heightPx = range.getRowHeight();

  // ✅ 지연 증가: 100ms → 500ms
  Utilities.sleep(500);
}
```

#### 방안 C: Frontend에서 셀 크기 확실히 전달

```javascript
// calculateImageSize() 확인
if (settings.fitToCell) {
  if (
    appState.selectedCellDimensions &&
    appState.selectedCellDimensions.width > 0
  ) {
    // ✅ Frontend 크기 사용 (Backend에서 읽기 불필요)
    result = {
      width: appState.selectedCellDimensions.width,
      height: appState.selectedCellDimensions.height,
    };
  } else {
    // ❌ 1x1 신호는 최대한 피하기
    console.error("❌ 셀 크기 미확인 상태!");
  }
}
```

---

### **Solution #3: 드래그 앤 드롭 수정**

#### 확인 사항

1. `updateImageList()`에서 이벤트 등록 확인
2. `drop` 이벤트 핸들러 구현 확인

```javascript
// updateImageList() 확인
li.addEventListener("drop", (e) => {
  e.preventDefault();
  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
  const toIndex = index;

  if (fromIndex !== toIndex) {
    // ✅ 배열 재정렬
    const item = appState.images.splice(fromIndex, 1)[0];
    appState.images.splice(toIndex, 0, item);

    // ✅ UI 업데이트
    updateImageList();

    // ✅ localStorage 저장 (선택적)
    // saveImages();

    console.log(`✅ 이미지 순서 변경: ${fromIndex} → ${toIndex}`);
  }
});
```

---

## 🎯 **우선순위별 수정**

### **Priority 1: Bug #2 (429 에러) - 가장 심각**

1. `insertImages()` 시작 시 2초 대기 추가
2. 셀 크기 읽기 지연 증가 (100ms → 500ms)
3. Frontend에서 크기 확실히 전달

### **Priority 2: Bug #1 (셀 크기 읽기)**

1. `getSelectedCellDimensions()` 로그 추가
2. 에러 핸들링 강화
3. Fallback 로직 개선

### **Priority 3: Bug #3 (드래그 앤 드롭)**

1. 이벤트 핸들러 확인
2. `drop` 이벤트 구현 확인
3. 배열 재정렬 로직 확인

---

**다음 단계**: Priority 1부터 순차 수정
