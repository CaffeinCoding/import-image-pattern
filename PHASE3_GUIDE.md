# Phase 3: 프리뷰 시스템

**목표**: 실시간 배치 프리뷰 및 색상 시스템 구현  
**예상 기간**: 3~4일  
**상태**: 🚀 구현 중

---

## 📋 개요

Phase 3는 세 가지 핵심 작업으로 구성됩니다:

1. **3.1 프리뷰 배경색 시스템** ✅
2. **3.2 Debounce 및 프리뷰 갱신** ✅
3. **3.3 선택 셀 프리뷰 시스템** ✅

---

## 3.1 프리뷰 배경색 시스템 ✅

### 색상 정의

```javascript
const COLORS = {
  selected: "#196fe1", // 선택 셀 (파란색)
  inactive: "#7c7c7c", // 비활성 셀 (회색)
  image: "#269444", // 이미지 셀 (초록색)
  mixed: "#0d4a6d", // 선택 + 비활성 혼합
};
```

### 색상 우선순위

```
우선순위 (높음 → 낮음)
1️⃣ 선택 셀 (#196fe1) - 최우선
2️⃣ 비활성 셀 (#7c7c7c) - 선택 셀과 겹치면 혼합색 적용
3️⃣ 이미지 셀 (#269444) - 기본 색상
```

### Google Apps Script 새 함수

#### 1. 셀 배경색 조회

```javascript
// Code.gs
function getCellBackgroundColors(cells) {
  // 각 셀의 현재 배경색 반환
  return {
    success: true,
    colors: [
      { row, col, color: "#ffffff" },
      ...
    ]
  };
}
```

**목적**: 프리뷰 적용 전 원본 색상 저장

#### 2. 프리뷰 색상 일괄 적용

```javascript
// Code.gs
function applyPreviewColors(imageCells, inactiveCells, selectedCell) {
  // 1. 이미지 셀에 초록색 적용
  // 2. 비활성 셀에 회색 적용 (이미지 셀 제외)
  // 3. 선택 셀에 파란색 적용 (우선순위 최고)
  //    → 선택 셀이 비활성 셀이면 혼합색
  return { success: true };
}
```

**목적**: 모든 프리뷰 색상을 한 번에 적용

#### 3. 프리뷰 색상 제거

```javascript
// Code.gs
function clearPreviewColors(previewCells) {
  // 프리뷰 색상 제거 및 원본 색상 복구
  return { success: true };
}
```

**목적**: 프리뷰 상태 해제 및 원본 복구

### Frontend 구현

#### 원본 색상 저장

```javascript
// 프리뷰 적용 전 원본 색상 저장 (처음만)
if (appState.previewCells.length === 0) {
  google.script.run
    .withSuccessHandler(function (result) {
      // 원본 색상을 appState에 저장
      for (const cell of result.colors) {
        const existingCell = appState.previewCells.find(...);
        if (existingCell) {
          existingCell.originalColor = cell.color;
        }
      }
    })
    .getCellBackgroundColors(previewCells);
}
```

#### 프리뷰 적용

```javascript
// 이미지 셀, 비활성 셀, 선택 셀 수집 후 색상 적용
const imageCells = positions;
const inactiveCells = collectInactiveCells();

google.script.run
  .withSuccessHandler(function (result) {
    if (result.success) {
      console.log("✅ 프리뷰 배경색 적용됨");
    }
  })
  .applyPreviewColors(imageCells, inactiveCells, appState.selectedCell);
```

#### 프리뷰 제거

```javascript
function clearPreview() {
  if (appState.previewCells.length === 0) return;

  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        console.log("✅ 프리뷰 제거됨");
      }
    })
    .clearPreviewColors(appState.previewCells);

  appState.previewCells = [];
}
```

---

## 3.2 Debounce 및 프리뷰 갱신 ✅

### Debounce 설정

```javascript
const DEBOUNCE_DELAY = 500; // 0.5초

function triggerPreviewUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updatePreview, DEBOUNCE_DELAY);
}
```

### 프리뷰 갱신 시점

| 이벤트           | Debounce | 동작                  |
| ---------------- | -------- | --------------------- |
| 설정값 변경      | 0.5초    | 프리뷰 갱신           |
| 선택 셀 변경     | 1초 폴링 | 프리뷰 제거 후 재적용 |
| 이미지 추가/삭제 | 0.5초    | 프리뷰 갱신           |
| 비활성 셀 변경   | 0.5초    | 프리뷰 갱신           |

### 선택 셀 변경 감지

```javascript
// 1초마다 폴링하여 선택 셀 변경 감지
setInterval(function () {
  google.script.run
    .withSuccessHandler(function (result) {
      if (
        result.success &&
        appState.selectedCell &&
        (appState.selectedCell.row !== result.row ||
          appState.selectedCell.col !== result.col)
      ) {
        // 선택 셀이 변경됨
        console.log(`📍 선택 셀 변경됨: ... → ...`);
        clearPreview(); // 기존 프리뷰 제거
        triggerPreviewUpdate(); // 새 프리뷰 적용
      }
    })
    .getSelectedCellInfo();
}, 1000);
```

---

## 3.3 선택 셀 프리뷰 시스템 ✅

### 동작 방식

1. **선택 셀 감지**: 1초마다 폴링하여 셀 선택 변경 감지
2. **프리뷰 제거**: 기존 프리뷰 색상 제거 및 원본 복구
3. **프리뷰 재적용**: 새로운 위치에 프리뷰 색상 적용

### 선택 셀 하이라이팅

```javascript
// applyPreviewColors 함수에서 마지막에 적용
if (selectedCell) {
  const range = sheet.getRange(selectedCell.row, selectedCell.col);

  // 선택 셀이 비활성 셀이면 혼합 색상
  const isInactive = inactiveCells.some(
    (cell) => cell.row === selectedCell.row && cell.col === selectedCell.col
  );

  range.setBackground(isInactive ? COLORS.mixed : COLORS.selected);
}
```

---

## 📊 프리뷰 예시

### 예시 1: 기본 프리뷰

```
선택 셀: B1 (파란색 표시)
패턴: 2x2
이미지: 2개

스프레드시트:
| A1 | B1 | C1 |
|----|===|-----|  ← B1 선택 (파란색)
|    | ✓ |    |  ← B1에 이미지 1 배치 (초록색)
|----|---|----|
|    | ✓ |    |  ← B2에 이미지 2 배치 (초록색)
|----|---|----|
```

### 예시 2: 비활성 셀 포함

```
선택 셀: B1 (파란색)
패턴: 2x2
비활성 셀: (0, 1) (우상단 회색)
이미지: 2개

스프레드시트:
| A1 | B1 | C1 |
|----|===|✗✗|  ← B1 선택 (파란색), C1 비활성 (회색)
|    | ✓ |    |  ← B1에 이미지 1
|----|---|----|
|    | ✓ |    |  ← B2에 이미지 2 (비활성 셀 건너뜀)
|----|---|----|
```

### 예시 3: 선택 셀이 비활성 셀

```
선택 셀: B1 (혼합색 - 파란색 + 회색)
패턴: 2x2
비활성 셀: (0, 0) (좌상단 - 선택 셀 위치)
이미지: 2개

스프레드시트:
| A1 | B1 | C1 |
|~~~|~~~|    |  ← B1 선택이면서 비활성 (혼합색)
|    |    |    |
|----|---|----|
|    | ✓ | ✓ |  ← B2, C2에 이미지 배치
|----|---|----|
```

---

## 🔄 프리뷰 갱신 흐름도

```
┌─────────────────┐
│ 설정값 변경 또는│
│ 셀 선택 변경   │
└────────┬────────┘
         │
         ▼
   ┌──────────────┐
   │ debounce     │
   │ 0.5초 대기   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ updatePreview()  │
   │ 프리뷰 갱신 시작 │
   └──────┬───────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ getCellBackgroundColors │
   │ 원본 색상 저장          │
   └──────┬──────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ applyPreviewColors   │
   │ 프리뷰 색상 적용     │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────┐
   │ 프리뷰 표시 완료 │
   └──────────────────┘

취소 버튼 클릭:
   ┌──────────────────┐
   │ clearPreview()   │
   │ 색상 복구 시작   │
   └──────┬───────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ clearPreviewColors      │
   │ 원본 색상으로 복구      │
   └──────┬──────────────────┘
          │
          ▼
   ┌──────────────────┐
   │ 프리뷰 제거 완료 │
   └──────────────────┘
```

---

## 🧪 테스트 케이스

### TC-3.1: 색상 우선순위

```
✅ 이미지 셀은 초록색 표시
✅ 비활성 셀은 회색 표시
✅ 선택 셀은 파란색 표시 (최우선)
✅ 선택 셀이 비활성 셀이면 혼합색
```

### TC-3.2: 프리뷰 갱신

```
✅ 설정값 변경 시 0.5초 후 갱신
✅ 이미지 추가/삭제 시 갱신
✅ 비활성 셀 변경 시 갱신
✅ 선택 셀 변경 시 즉시 갱신
```

### TC-3.3: 프리뷰 제거

```
✅ 취소 버튼 클릭 시 프리뷰 제거
✅ 원본 색상 정확히 복구
✅ 프리뷰 상태 초기화
```

---

## 🐛 디버깅 팁

### 콘솔 로그 확인

```javascript
// 프리뷰 적용 로그
✅ 프리뷰 배경색 적용됨

// 프리뷰 정보
🎨 프리뷰 정보
이미지 셀: 4개 (초록색 #269444)
비활성 셀: 1개 (회색 #7c7c7c)
선택 셀: 1개 (파란색 #196fe1) - B1
색상 우선순위: 선택 셀 > 비활성 셀 > 이미지 셀

// 선택 셀 변경
📍 선택 셀 변경됨: B1 → C1
```

### Chrome DevTools

```
1. F12 또는 Ctrl+Shift+J로 DevTools 열기
2. Console 탭에서 로그 확인
3. appState.previewCells 확인
4. 스프레드시트의 실제 색상 확인
```

---

## ✅ Phase 3 체크리스트

### 3.1 프리뷰 배경색 시스템

- [x] 색상 정의 (4가지)
- [x] 색상 우선순위 관리
- [x] 원본 색상 저장 함수
- [x] 프리뷰 색상 적용 함수
- [x] 프리뷰 색상 제거 함수

### 3.2 Debounce 및 프리뷰 갱신

- [x] Debounce 타이머 (0.5초)
- [x] 설정값 변경 감지
- [x] 선택 셀 변경 감지 (1초 폴링)
- [x] 프리뷰 자동 갱신
- [x] 프리뷰 정보 로깅

### 3.3 선택 셀 프리뷰

- [x] 선택 셀 감지
- [x] 선택 셀 하이라이팅
- [x] 선택 셀 변경 시 프리뷰 업데이트
- [x] 취소 버튼에서 프리뷰 제거

---

## 🎯 주요 개선사항

### 성능 개선

- ✨ Debounce로 불필요한 프리뷰 갱신 방지
- ✨ 원본 색상 한 번만 저장
- ✨ 1초 폴링으로 선택 셀 변경 감지

### 안정성 개선

- ✨ 색상 우선순위로 충돌 방지
- ✨ 원본 색상 정확히 복구
- ✨ 에러 처리 강화

### 사용자 경험 개선

- ✨ 실시간 프리뷰로 투명성 증대
- ✨ 색상으로 직관적인 이해
- ✨ 취소 기능으로 안전성 증대

---

## 📝 구현된 함수

### Backend (Code.gs)

| 함수                      | 목적             | 신규 |
| ------------------------- | ---------------- | ---- |
| `getCellBackgroundColors` | 원본 색상 저장   | ✨   |
| `applyPreviewColors`      | 프리뷰 색상 적용 | ✨   |
| `clearPreviewColors`      | 프리뷰 색상 제거 | ✨   |

### Frontend (sidebar.html)

| 함수                     | 목적                  | 신규 |
| ------------------------ | --------------------- | ---- |
| `updatePreview`          | 프리뷰 갱신 (개선됨)  | -    |
| `logPreviewInfo`         | 프리뷰 정보 로깅      | ✨   |
| `collectInactiveCells`   | 비활성 셀 수집        | ✨   |
| `clearPreview`           | 프리뷰 제거           | ✨   |
| `setupSelectionListener` | 선택 셀 감지 (개선됨) | -    |

---

## 🎊 결론

**Phase 3 프리뷰 시스템이 완성되었습니다!**

모든 색상 우선순위가 정확히 적용되고, debounce로 성능이 최적화되며, 선택 셀 변경도 자동으로 감지됩니다.

다음 Phase 4에서는 이미지 크기 조절 기능을 구현할 예정입니다.

---

**상태**: ✅ Phase 3 구현 완료  
**다음**: Phase 4 이미지 크기 및 설정 관리  
**진행도**: 37.5% (3/8 Phase)
