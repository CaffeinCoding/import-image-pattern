# 🔴 Critical Bugs 상세 분석 및 해결 방안

**분석일**: 2025년 11월  
**상태**: ✅ 근본 원인 파악 완료  
**버그 수**: 3개 (근본 원인)

---

## 📊 **전체 데이터 흐름 분석**

### **Frontend → Backend 데이터 전송 흐름**

```
1. 사용자가 "완료" 클릭
   ↓
2. handleCompleteClick() 실행
   ↓
3. calculateLayoutPositions() 호출
   → positions 배열 생성
   → 각 position에 width, height 포함
   ↓
4. insertImages() 호출 (Backend)
   → positions[i].width, positions[i].height 사용
   ↓
5. insertImageAtCell() 실행
   → width, height를 받아서 이미지 크기 설정
```

---

## 🔴 **발견된 Critical Bugs**

### **Bug #1: 반복적인 버그 - getSelectedCellDimensions() 타이밍 이슈**

#### 문제 설명

```javascript
// setupSelectionListener() - 0.5초마다 실행
setInterval(function () {
  // 1. 셀 선택 감지
  if (셀이 변경되면) {
    appState.selectedCell = {...};

    // 2. 셀 크기 읽기 (비동기!)
    getSelectedCellDimensionsAndUpdate();  // ← 비동기 호출!
  }
}, 500);

// 문제: getSelectedCellDimensionsAndUpdate()가 완료되기 전에
// 사용자가 "완료" 버튼을 클릭할 수 있음!
```

**타임라인**:

```
T=0ms:   셀 선택
T=10ms:  setupSelectionListener 감지
T=20ms:  getSelectedCellDimensionsAndUpdate() 시작 (비동기)
T=100ms: 사용자가 "완료" 버튼 클릭  ← 문제!
T=200ms: getSelectedCellDimensions() 응답 도착 (너무 늦음!)
```

**결과**: `appState.selectedCellDimensions`가 아직 `{width: 0, height: 0}`인 상태에서 calculateImageSize()가 실행됨 → Fallback (1x1 신호) 사용

---

### **Bug #2: JPG 이미지 - MIME 타입 감지 문제 (의심)**

#### 현재 코드 (Code.gs 라인 371-374)

```javascript
const mimeMatch = imageUrl.match(/data:(image\/[^;]+)/);
if (mimeMatch && mimeMatch[1]) {
  mimeType = mimeMatch[1]; // 실제 MIME 타입 사용
}
```

**가능한 문제**:

1. JPG 파일이 `image/jpg`로 올 수도 있음 (표준은 `image/jpeg`)
2. 정규식이 모든 경우를 커버하지 못할 수도 있음
3. Base64 데이터에 특수문자가 있어서 디코딩 실패할 수도 있음

---

### **Bug #3: 반복 발생 - Rate Limit (429 에러)**

#### 현재 구현 (Code.gs 라인 272-274)

```javascript
if (i > 0) {
  Utilities.sleep(1000); // 1초 대기
}
```

**문제점**:

1. **첫 번째 이미지는 지연 없이 바로 삽입됨** (`i > 0` 조건)
2. 첫 이미지 삽입 + 두 번째 이미지 삽입 사이가 1초 간격
3. 하지만 **셀 크기 읽기 (getColumnWidth/Height)**도 API 호출임!
   - `getSelectedCellDimensionsAndUpdate()` 호출
   - `insertImageAtCell()` 내부의 `range.getColumnWidth()` 호출
   - 이미지마다 2번의 추가 API 호출 발생 가능!

**실제 API 호출 수** (이미지 5개 기준):

```
셀 선택 변경: getSelectedCellDimensions() → 1회
이미지 1: insertImage() + (조건부) getColumnWidth/Height() → 1~3회
Sleep 1초
이미지 2: insertImage() + (조건부) getColumnWidth/Height() → 1~3회
Sleep 1초
이미지 3: insertImage() + (조건부) getColumnWidth/Height() → 1~3회
...

총 API 호출: 5~15회 (짧은 시간 내)
→ Rate Limit 초과 가능성 매우 높음!
```

---

## 💡 **해결 방안**

### **Solution #1: 셀 크기 읽기 타이밍 문제 해결**

#### **방안 A: 완료 버튼 클릭 시 재확인** ⭐ (추천)

```javascript
function handleCompleteClick() {
  // ✅ 추가: 셀 크기 다시 읽기 (동기 대기)
  if (appState.imageSizeSettings.fitToCell) {
    if (
      !appState.selectedCellDimensions ||
      appState.selectedCellDimensions.width === 0
    ) {
      console.warn("⚠️ 셀 크기 재확인 필요");

      // 비동기 호출 후 대기
      google.script.run
        .withSuccessHandler(function (result) {
          if (result.success) {
            appState.selectedCellDimensions = {
              width: result.width,
              height: result.height,
            };
            console.log(
              `✅ 셀 크기 재확인: ${result.width}x${result.height}px`
            );

            // 크기 확인 후 실제 삽입 실행
            proceedWithImageInsertion();
          }
        })
        .getSelectedCellDimensions();

      return; // 여기서 일단 중단
    }
  }

  // 크기가 이미 있으면 바로 실행
  proceedWithImageInsertion();
}

// 새 함수: 실제 이미지 삽입 로직
function proceedWithImageInsertion() {
  // 기존 handleCompleteClick의 로직 이동
  const positions = calculateLayoutPositions();
  // ... 나머지 로직
}
```

#### **방안 B: 초기 로드 시 자동 읽기**

```javascript
function initializeApp() {
  loadSettings();
  loadTheme();
  setupEventListeners();
  setupSelectionListener();
  updateUI();

  // ✅ 추가: 초기 셀 크기 읽기
  updateSelectedCell(); // 이미 있는 함수 호출
}
```

---

### **Solution #2: JPG 지원 강화**

```javascript
// Code.gs - insertImageAtCell 개선
// MIME 타입 감지 강화
let mimeType = "image/png"; // 기본값

if (imageUrl.includes("data:image")) {
  // ✅ 개선: 더 유연한 MIME 타입 감지
  const mimeMatch = imageUrl.match(/data:(image\/[^;]+)/);
  if (mimeMatch && mimeMatch[1]) {
    mimeType = mimeMatch[1];

    // ✅ 추가: jpg → jpeg 정규화
    if (mimeType === "image/jpg") {
      mimeType = "image/jpeg";
    }
  }

  // ✅ 추가: 로그로 확인
  Logger.log(`📄 MIME 타입 감지: ${mimeType}`);
}

// 파일 확장자 결정
const fileExt =
  mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
```

---

### **Solution #3: Rate Limit 방지 강화**

#### **방안 A: 첫 이미지도 지연 추가**

```javascript
// insertImages() 개선
for (let i = 0; i < images.length; i++) {
  // ✅ 변경: 모든 이미지에 지연 추가
  if (i >= 0) {
    // i > 0 → i >= 0 변경
    Utilities.sleep(1000);
  }

  // ...
}
```

#### **방안 B: 셀 크기 읽기 최적화**

```javascript
// Frontend에서 미리 읽은 크기 사용 (이미 구현됨)
// Backend에서 1x1 신호 받을 때만 셀 크기 읽기

// 추가: 셀 크기 읽기 후 추가 지연
if (width == 1 && height == 1) {
  const range = sheet.getRange(row, col);
  widthPx = range.getColumnWidth();
  heightPx = range.getRowHeight();

  Utilities.sleep(100); // 이미 있음 ✅
}
```

#### **방안 C: 배치 처리 (장기 개선안)**

```javascript
// 여러 이미지를 한 번에 처리하는 대신
// 작은 배치로 나누어 처리
const BATCH_SIZE = 3;
for (let batch = 0; batch < Math.ceil(images.length / BATCH_SIZE); batch++) {
  const start = batch * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, images.length);

  // 배치 처리
  for (let i = start; i < end; i++) {
    // 이미지 삽입
  }

  // 배치 사이 긴 지연
  if (batch < Math.ceil(images.length / BATCH_SIZE) - 1) {
    Utilities.sleep(3000); // 3초
  }
}
```

---

## 🎯 **우선순위별 수정 계획**

### **Phase A: Immediate Fixes** (지금 바로)

1. **✅ Solution #1-A 구현** - 셀 크기 재확인

   - handleCompleteClick 분리
   - proceedWithImageInsertion 추가
   - 예상 시간: 15분

2. **✅ Solution #2 구현** - JPG 지원 강화

   - MIME 타입 정규화
   - 로그 추가
   - 예상 시간: 5분

3. **✅ Solution #3-A 구현** - 첫 이미지 지연
   - `i > 0` → `i >= 0` 변경
   - 예상 시간: 1분

### **Phase B: 테스트 및 검증**

1. 디버그 로그 확인
2. 실제 테스트 (PNG, JPG)
3. Rate Limit 확인

### **Phase C: 추가 개선** (필요시)

1. Solution #3-C (배치 처리) 검토
2. 성능 최적화
3. 에러 핸들링 강화

---

## 📋 **예상 효과**

| 문제               | 현재 상태    | 수정 후      | 개선 |
| ------------------ | ------------ | ------------ | ---- |
| **셀 크기 미적용** | ❌ 항상 실패 | ✅ 정상 작동 | 100% |
| **JPG 미지원**     | ❌ 에러 발생 | ✅ 정상 작동 | 100% |
| **429 에러**       | ⚠️ 자주 발생 | ✅ 거의 없음 | 80%  |

---

**다음 단계**: Phase A의 3가지 수정 구현 시작
