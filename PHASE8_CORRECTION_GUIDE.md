# Phase 8: 명세 검증 및 구현 수정

**목표**: 설계와 구현의 괴리 제거, 모든 기능이 명세대로 작동하도록 수정  
**상태**: 🔧 진행 중  
**예상 기간**: 1~2일

---

## 📋 **Phase 8 구성**

### Step 1: 명세 문서 수정 (완료 ✅)

#### 1.1 이미지 크기 단위 명확화

**변경 사항**:

- ❌ 이전: "이미지의 크기 단위: 셀 높이/너비"
- ✅ 수정: "이미지의 크기 단위: 픽셀 (px)"

**근거**: 구현이 모두 픽셀 기반 처리

---

### Step 2: Frontend getSelectedCellDimensions() 호출 추가 (진행 중 🔧)

**목표**: 선택한 셀의 실제 크기를 Frontend에서 읽음

#### 2.1 appState 확장

```javascript
appState = {
  // ... 기존 필드 ...
  selectedCellDimensions: {
    width: 0, // 픽셀
    height: 0, // 픽셀
  },
};
```

#### 2.2 updateSelectedCell() 개선

**현재**:

```javascript
function updateSelectedCell() {
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        appState.selectedCell = {
          row: result.row,
          col: result.col,
          address: result.address,
        };
        document.getElementById("selectedCell").value = result.address;
      }
    })
    .getSelectedCellInfo();
}
```

**수정 계획**:

```javascript
function updateSelectedCell() {
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        appState.selectedCell = {
          row: result.row,
          col: result.col,
          address: result.address,
        };
        document.getElementById("selectedCell").value = result.address;

        // ✅ 추가: 셀 크기도 함께 읽기
        getSelectedCellDimensionsAndUpdate();
      }
    })
    .getSelectedCellInfo();
}

// ✅ 새 함수
function getSelectedCellDimensionsAndUpdate() {
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        appState.selectedCellDimensions = {
          width: result.width,
          height: result.height,
        };
        console.log(`✅ 셀 크기 읽음: ${result.width}x${result.height}px`);
      }
    })
    .getSelectedCellDimensions();
}
```

#### 2.3 setupSelectionListener() 개선

**현재**:

```javascript
setInterval(function () {
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        if (
          !appState.selectedCell ||
          appState.selectedCell.row !== result.row ||
          appState.selectedCell.col !== result.col
        ) {
          appState.selectedCell = { ... };
          // ...
        }
      }
    })
    .getSelectedCellInfo();
}, 500);
```

**수정 계획**:

```javascript
setInterval(function () {
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        if (
          !appState.selectedCell ||
          appState.selectedCell.row !== result.row ||
          appState.selectedCell.col !== result.col
        ) {
          appState.selectedCell = { ... };
          // ✅ 추가: 셀 크기도 함께 읽기
          getSelectedCellDimensionsAndUpdate();
        }
      }
    })
    .getSelectedCellInfo();
}, 500);
```

---

### Step 3: calculateImageSize() 개선

**목표**: "셀 크기에 맞춤" 옵션에서 실제 셀 크기 사용

#### 3.1 현재 문제

```javascript
function calculateImageSize(imageMetadata) {
  if (settings.fitToCell) {
    // ❌ 1x1 반환만 함 (Backend에 위임)
    result = { width: 1, height: 1 };
  }
  // ...
}
```

#### 3.2 개선 로직

```javascript
function calculateImageSize(imageMetadata) {
  if (settings.fitToCell) {
    // ✅ appState에 저장된 셀 크기 직접 사용
    if (
      appState.selectedCellDimensions &&
      appState.selectedCellDimensions.width > 0
    ) {
      result = {
        width: appState.selectedCellDimensions.width,
        height: appState.selectedCellDimensions.height,
      };
      console.log(`✅ 셀 크기에 맞춤: ${result.width}x${result.height}px`);
    } else {
      // Fallback: Backend 처리 (1x1 신호)
      result = { width: 1, height: 1 };
      console.warn("⚠️ 셀 크기 미리 로드: Backend에서 처리");
    }
  }
  // ...
}
```

---

### Step 4: Backend insertImageAtCell() 최종 검증

**현재 로직**:

```javascript
if (width == 1 && height == 1) {
  // 셀 크기에 맞춤 모드
  const range = sheet.getRange(row, col);
  widthPx = range.getColumnWidth();
  heightPx = range.getRowHeight();
}
```

**검증 사항**:

- ✅ 1x1 신호 감지 정상
- ✅ getColumnWidth/getRowHeight() 호출 정상
- ✅ 최종 크기 적용 정상

---

## 📊 **상태 추적**

| 단계       | 작업                                           | 상태       | 예상 일자 |
| ---------- | ---------------------------------------------- | ---------- | --------- |
| Step 1     | 명세 수정                                      | ✅ 완료    | 완료      |
| **Step 2** | **Frontend: getSelectedCellDimensions() 호출** | 🔧 진행 중 | 1시간     |
| **Step 3** | **Frontend: calculateImageSize() 개선**        | ⏳ 대기 중 | 30분      |
| **Step 4** | **Backend 검증**                               | ⏳ 대기 중 | 30분      |
| **테스트** | **통합 테스트**                                | ⏳ 대기 중 | 1시간     |

---

## 🧪 **Step 2 테스트 방법**

### TC-Correction-001: 셀 크기 읽기

```
전제조건:
- 앱 시작
- 스프레드시트의 특정 셀 선택

동작:
1. 셀을 선택
2. 콘솔 로그 확인

예상 결과:
✅ 콘솔에 "✅ 셀 크기 읽음: {width}x{height}px" 메시지
✅ appState.selectedCellDimensions 업데이트됨
```

### TC-Correction-002: "셀 크기에 맞춤" 작동

```
전제조건:
- 이미지 선택
- "셀의 크기에 맞춤" ✓ 체크
- 특정 셀 선택

동작:
1. 콘솔에서 크기 확인

예상 결과:
✅ 콘솔에 "✅ 셀 크기에 맞춤: {width}x{height}px" 메시지
✅ 이미지가 해당 셀 크기로 삽입됨
```

---

**다음**: Step 2 구현 시작
