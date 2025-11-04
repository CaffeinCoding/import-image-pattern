# Phase 6: 이미지 삽입 및 에러 처리

**목표**: 실제 이미지를 스프레드시트에 삽입하고 에러 처리 완성  
**예상 기간**: 2~3일  
**상태**: 🚀 준비 중

---

## 📋 개요

Phase 6는 이제까지 설정한 모든 값들을 사용하여 실제로 이미지를 스프레드시트에 삽입하는 단계입니다.

### 핵심 기능

1. **이미지 삽입**: 계산된 위치에 이미지를 삽입
2. **진행률 표시**: 삽입 진행 상황을 UI에 표시
3. **에러 처리**: 삽입 실패 시 적절한 에러 메시지 표시
4. **상태 관리**: 삽입 완료/취소/저장 상태 관리

---

## 🎯 Phase 6 핵심 작업

### 6.1 이미지 삽입 로직 (Backend - Code.gs)

#### 필요한 함수

```javascript
/**
 * 이미지를 스프레드시트에 삽입합니다
 * @param {Array} images - 이미지 배열 (data URL)
 * @param {Object} startCell - 시작 셀 {row, col}
 * @param {Object} settings - 패턴 설정
 * @param {Array} positions - 계산된 배치 위치
 * @returns {Object} 삽입 결과
 */
function insertImages(images, startCell, settings, positions) {
  // 1. 이미지 삽입
  // 2. 진행률 반환
  // 3. 에러 처리
}

/**
 * 단일 이미지를 지정된 셀에 삽입합니다
 */
function insertImageAtCell(sheet, imageUrl, row, col, width, height) {
  // 1. 데이터 URL 검증
  // 2. 이미지 객체 생성
  // 3. 크기 설정
  // 4. 위치 설정
}

/**
 * 삽입된 이미지들을 제거합니다 (Undo 기능)
 */
function removeInsertedImages() {
  // 1. 마지막 삽입한 이미지들 추적
  // 2. 제거 로직
}
```

#### 구현 전략

```javascript
function insertImages(images, startCell, settings, positions) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const results = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const position = positions[i];

      try {
        // 이미지 삽입
        const response = insertImageAtCell(
          sheet,
          image.data,
          position.row,
          position.col,
          position.width,
          position.height
        );

        results.push({
          success: true,
          index: i,
          position: position,
        });

        // 진행률 반환 (Frontend에서 표시)
        console.log(`✅ ${i + 1}/${images.length} 이미지 삽입 완료`);
      } catch (e) {
        results.push({
          success: false,
          index: i,
          error: e.toString(),
        });
        console.error(`❌ 이미지 ${i + 1} 삽입 실패:`, e);
      }
    }

    return {
      success: results.length > 0,
      completed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results: results,
    };
  } catch (e) {
    console.error("❌ 이미지 삽입 중 오류:", e);
    return {
      success: false,
      error: e.toString(),
    };
  }
}

function insertImageAtCell(sheet, imageUrl, row, col, width, height) {
  try {
    // 1. 셀 가져오기
    const cell = sheet.getRange(row, col);

    // 2. 데이터 URL에서 이미지 객체 생성
    // Note: Google Apps Script는 직접 데이터 URL 삽입 불가
    // 대신 URL이나 Blob을 사용해야 함

    const imageBlob = Utilities.newBlob(
      Utilities.base64Decode(imageUrl.split(",")[1]),
      "image/png",
      "image.png"
    );

    // 3. 이미지 삽입
    const image = sheet.insertImage(imageBlob, col, row);

    // 4. 이미지 크기 설정 (셀 단위를 픽셀로 변환)
    // 평균 셀 크기: 가로 88px, 세로 21px
    const cellWidth = 88;
    const cellHeight = 21;

    image.setWidth(width * cellWidth);
    image.setHeight(height * cellHeight);

    return { success: true, image: image };
  } catch (e) {
    console.error("❌ 이미지 삽입 실패:", e);
    throw e;
  }
}
```

---

### 6.2 Frontend 진행률 표시

#### Progress UI (이미 있음)

```html
<div id="progressContainer" class="progress-container" style="display: none;">
  <div class="progress-header">
    <span id="progressText">진행 중...</span>
  </div>
  <div class="progress-bar">
    <div id="progressFill" class="progress-fill" style="width: 0%"></div>
  </div>
  <div class="progress-detail">
    <span id="progressDetail"></span>
  </div>
</div>
```

#### Progress 업데이트 함수

```javascript
function showProgress() {
  document.getElementById("progressContainer").style.display = "block";
  document.getElementById("progressFill").style.width = "0%";
}

function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById(
    "progressText"
  ).textContent = `진행 중: ${current}/${total} (${percent}%)`;
  document.getElementById(
    "progressDetail"
  ).textContent = `${current}개 이미지 삽입 완료`;
}

function hideProgress() {
  setTimeout(() => {
    document.getElementById("progressContainer").style.display = "none";
  }, 1000);
}

function showProgressError(message) {
  document.getElementById("progressText").textContent = "❌ " + message;
  document.getElementById("progressText").style.color = "#e74c3c";
}
```

---

### 6.3 이미지 삽입 실행 함수

#### Frontend 구현

```javascript
function handleCompleteClick() {
  console.log("📍 이미지 삽입 시작");

  if (!appState.selectedCell) {
    alert("먼저 시작 셀을 선택해주세요");
    return;
  }

  if (appState.images.length === 0) {
    alert("표시할 이미지가 없습니다");
    return;
  }

  const validation = validateLayoutAndImages();
  if (!validation.valid) {
    alert(validation.message);
    return;
  }

  appState.isProcessing = true;
  updateCompleteButtonState();
  showProgress();

  // Backend 함수 호출
  google.script.run
    .withSuccessHandler(function (result) {
      if (result.success) {
        console.log(`✅ 이미지 삽입 완료:`, result);
        updateProgress(result.completed, appState.images.length);

        alert(
          `✅ 이미지 삽입 완료!\n` +
            `삽입됨: ${result.completed}개\n` +
            `실패: ${result.failed}개`
        );
      } else {
        console.error("❌ 이미지 삽입 실패:", result.error);
        showProgressError(result.error);
        alert("이미지 삽입 실패: " + result.error);
      }

      appState.isProcessing = false;
      updateCompleteButtonState();
      hideProgress();
    })
    .withFailureHandler(function (error) {
      console.error("❌ 오류:", error);
      showProgressError(error);
      alert("오류: " + error);

      appState.isProcessing = false;
      updateCompleteButtonState();
      hideProgress();
    })
    .insertImages(
      appState.images,
      appState.selectedCell,
      appState.patternSettings,
      validation.positions
    );
}
```

---

### 6.4 에러 처리

#### 예상 에러 케이스

```javascript
// 1. 이미지 데이터 오류
const errors = {
  INVALID_IMAGE_FORMAT: "이미지 형식이 올바르지 않습니다",
  IMAGE_TOO_LARGE: "이미지가 너무 큽니다",
  IMAGE_DATA_EMPTY: "이미지 데이터가 비어있습니다",

  // 2. 셀 위치 오류
  INVALID_CELL_POSITION: "잘못된 셀 위치입니다",
  CELL_OUT_OF_BOUNDS: "셀 범위를 벗어났습니다",

  // 3. 권한 오류
  PERMISSION_DENIED: "스프레드시트 수정 권한이 없습니다",

  // 4. 기타
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다",
};

function handleImageInsertionError(error) {
  console.error("❌ 삽입 오류:", error);

  if (error.includes("Permission")) {
    return {
      success: false,
      error: "스프레드시트 수정 권한이 없습니다",
    };
  } else if (error.includes("out of bounds")) {
    return {
      success: false,
      error: "셀 범위를 벗어났습니다",
    };
  }

  return {
    success: false,
    error: error.toString(),
  };
}
```

---

## 📝 구현 순서

### Step 1: 이미지 삽입 함수 구현 (1시간)

- `insertImages()` 함수 구현
- `insertImageAtCell()` 함수 구현
- Blob 변환 로직
- 진행률 로깅

### Step 2: Frontend 통합 (30분)

- `handleCompleteClick()` 개선
- Progress UI 동작 확인
- 진행률 업데이트

### Step 3: 에러 처리 (30분)

- 에러 케이스 처리
- 사용자 친화적 메시지
- 로깅 및 디버깅

### Step 4: Undo 기능 (30분)

- `removeInsertedImages()` 함수
- 마지막 삽입 추적
- Cancel 기능 개선

### Step 5: 테스트 및 문서화 (1시간)

- 모든 테스트 케이스 실행
- 린트 검사
- 문서 업데이트

---

## 🧪 테스트 케이스

### TC-6.1: 기본 이미지 삽입

```
조건:
- 이미지 1개
- 시작 셀: A1
- 크기: 2x2 셀

동작:
1. "완료" 버튼 클릭

예상 결과:
- 이미지가 A1 위치에 2x2 셀 크기로 삽입됨
- 진행률 표시: 1/1 (100%)
- 성공 메시지 표시
```

### TC-6.2: 여러 이미지 삽입

```
조건:
- 이미지 4개
- 패턴: 2x2
- 간격: 1

동작:
1. 이미지 4개 선택
2. "완료" 버튼 클릭

예상 결과:
- 4개 이미지가 계산된 위치에 삽입됨
- 진행률: 1/4 → 2/4 → 3/4 → 4/4 단계별 표시
- 최종 성공 메시지
```

### TC-6.3: 이미지 삽입 실패

```
조건:
- 권한 없음 또는 셀 범위 초과

동작:
1. 조건에 맞는 설정 후 "완료" 버튼 클릭

예상 결과:
- 에러 메시지 표시
- 진행률 정지
- 사용자 친화적 오류 설명
```

### TC-6.4: Cancel 기능

```
조건:
- 이미지 삽입 중

동작:
1. 진행 중에 "취소" 버튼 클릭

예상 결과:
- 진행 중단
- 삽입된 이미지 제거 (또는 유지)
- 상태 초기화
```

---

## 📊 파일 변경 예정

### src/Code.gs

```diff
+ function insertImages(images, startCell, settings, positions)
+ function insertImageAtCell(sheet, imageUrl, row, col, width, height)
+ function removeInsertedImages()
+ function handleImageInsertionError(error)
```

### src/sidebar.html

```diff
+ function handleCompleteClick() { ... insertImages() ... }
+ function updateProgress(current, total)
+ function showProgressError(message)
```

---

## ✅ Phase 6 완료 체크리스트

- [x] insertImages() 함수 구현
- [x] insertImageAtCell() 함수 구현
- [x] Blob 변환 로직
- [x] Frontend 통합
- [x] Progress UI 동작
- [x] 에러 처리
- [ ] 모든 테스트 케이스 통과
- [ ] 린트 검사 통과
- [ ] 문서 업데이트

---

## 📝 현재 진행 상황

### Step 1: 이미지 삽입 함수 구현 ✅ 완료

- ✅ `insertImages()` 함수 구현
- ✅ `insertImageAtCell()` 함수 구현
- ✅ Blob 변환 로직
- ✅ 진행률 로깅

### Step 2: Frontend 통합 ✅ 완료

- ✅ `handleCompleteClick()` 개선
- ✅ Progress UI 동작 확인
- ✅ 진행률 업데이트

### Step 3: 에러 처리 ✅ 완료

- ✅ 에러 케이스 처리
- ✅ 사용자 친화적 메시지
- ✅ 로깅 및 디버깅

### Step 4: Undo 기능 ✅ 완료

- ✅ `handleCancelClick()` 함수 개선
- ✅ 마지막 삽입 추적 및 취소
- ✅ Cancel 기능 개선

### Step 5: 테스트 및 문서화 ⏳ 예정

- [ ] 모든 테스트 케이스 실행
- [ ] 린트 검사
- [ ] 문서 업데이트

---

## 🎯 다음 Phase

**Phase 7**: UI/UX 개선 및 최적화

- 더 나은 이미지 선택 UI
- 설정값 프리셋
- 단축키 지원
- 반응형 디자인 개선

---

**상태**: 🚀 Phase 6 준비 중  
**예상 완료**: 2~3일  
**진행도**: 55% (5/8 Phase)
