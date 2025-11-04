# Phase 5: 이미지 크기 및 설정 관리

**목표**: 이미지 크기 조절 및 설정값 상태 관리  
**예상 기간**: 2~3일  
**상태**: 🚀 진행 중

---

## 📋 개요

Phase 5는 사용자가 이미지의 크기를 설정할 수 있도록 하고, 모든 설정값을 localStorage에 저장하여 나중에 복구할 수 있게 합니다.

### 핵심 기능

1. **이미지 크기 설정**: 가로/세로 크기를 셀 단위로 지정
2. **비율 유지 옵션**: 이미지 원본 비율 유지 선택 가능
3. **셀 크기에 맞춤**: 선택된 셀의 크기에 이미지를 맞춤
4. **설정값 저장**: 모든 설정을 localStorage에 자동 저장

---

## 🎯 Phase 5 핵심 작업

### 5.1 이미지 크기 설정 UI 및 계산

#### 필요한 UI 요소 (이미 있음)

```html
<!-- 이미지 크기 입력 필드 -->
<div class="form-group">
  <label>이미지 크기</label>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
    <input type="number" id="imageWidth" placeholder="가로 (셀)" />
    <input type="number" id="imageHeight" placeholder="세로 (셀)" />
  </div>
</div>

<!-- 체크박스 -->
<label>
  <input type="checkbox" id="fitToCellCheckbox" />
  셀 크기에 맞춤
</label>

<label>
  <input type="checkbox" id="maintainRatioCheckbox" />
  비율 유지
</label>
```

#### 구현할 함수

```javascript
// 1. 크기 계산 함수
function calculateImageSize(
  originalWidth,
  originalHeight,
  settings,
  selectedCellSize
) {
  // 선택된 설정에 따라 이미지 크기 계산
  // 반환: { width: number, height: number }
}

// 2. 체크박스 상호 배타적 처리
function handleFitToCellChange(isChecked) {
  // fitToCell이 ON이면 maintainRatio OFF
}

function handleMaintainRatioChange(isChecked) {
  // maintainRatio가 ON이면 fitToCell OFF
}

// 3. 크기 유효성 검사
function validateImageSize(width, height) {
  // 크기가 유효한지 검사 (최소 1셀, 최대 50셀 등)
}
```

#### 크기 계산 로직

| 케이스 | 조건              | 계산                    | 예시                    |
| ------ | ----------------- | ----------------------- | ----------------------- |
| 1      | 비율 유지, 가로만 | height = width / ratio  | 가로 2 → 세로 자동 계산 |
| 2      | 비율 유지, 세로만 | width = height \* ratio | 세로 3 → 가로 자동 계산 |
| 3      | 비율 유지, 둘 다  | 비율 유지 OFF로 변경    | 입력 후 자동 해제       |
| 4      | 셀 크기에 맞춤 ON | size = selectedCellSize | A1의 크기에 맞춤        |
| 5      | 기본값            | fitToCell ON            | 초기 상태               |

---

### 5.2 비활성 셀 지정 UI (현재 있음)

이미 구현되어 있으므로 검증만 하면 됩니다:

```javascript
// 확인할 함수
function generateInactiveCellTable(rows, cols)
function toggleInactiveCell(row, col)
function getInactiveCells()
```

---

### 5.3 localStorage 저장 및 복구

#### 저장할 데이터 구조

```javascript
const savedSettings = {
  version: "1.0",
  patternSettings: {
    rows: 3,
    cols: 4,
  },
  layoutSettings: {
    rowGap: 1,
    colGap: 1,
    inactiveCells: [
      [false, true, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ],
  },
  imageSizeSettings: {
    width: 2,
    height: 3,
    maintainRatio: true,
    fitToCell: false,
  },
  savedAt: 1234567890,
};
```

#### 구현할 함수

```javascript
// 1. 설정 저장
function saveSettings(state) {
  // localStorage에 저장
  // 키: "importImagePattern:settings"
}

// 2. 설정 불러오기
function loadSettings() {
  // localStorage에서 로드
  // 버전 체크 및 마이그레이션
}

// 3. 설정 초기화
function resetSettings() {
  // 모든 설정을 기본값으로 변경
}

// 4. 상태 업데이트 시 자동 저장
function handleSettingChange() {
  // debounce 후 saveSettings() 호출
}
```

---

## 📝 구현 순서

### Step 1: 크기 계산 로직 (30분)

```javascript
function calculateImageSize(
  originalWidth,
  originalHeight,
  settings,
  selectedCellSize
) {
  let result = { width: 1, height: 1 };

  if (settings.fitToCell) {
    // 셀 크기에 맞춤
    result = { ...selectedCellSize };
  } else if (settings.maintainRatio && originalWidth && originalHeight) {
    const ratio = originalWidth / originalHeight;

    if (settings.width && !settings.height) {
      // 가로만 지정
      result.width = settings.width;
      result.height = Math.round(settings.width / ratio);
    } else if (settings.height && !settings.width) {
      // 세로만 지정
      result.height = settings.height;
      result.width = Math.round(settings.height * ratio);
    } else if (settings.width && settings.height) {
      // 둘 다 지정: 비율 유지 OFF
      settings.maintainRatio = false;
      result = { width: settings.width, height: settings.height };
    }
  } else {
    // 자유 크기
    result = {
      width: settings.width || 1,
      height: settings.height || 1,
    };
  }

  return result;
}
```

### Step 2: 체크박스 상호 배타적 처리 (15분)

```javascript
function handleFitToCellChange(isChecked) {
  if (isChecked) {
    document.getElementById("maintainRatioCheckbox").checked = false;
  }
}

function handleMaintainRatioChange(isChecked) {
  if (isChecked) {
    document.getElementById("fitToCellCheckbox").checked = false;
  }
}
```

### Step 3: localStorage 함수 (30분)

```javascript
function saveSettings(state) {
  const toSave = {
    version: "1.0",
    patternSettings: state.patternSettings,
    layoutSettings: state.layoutSettings,
    imageSizeSettings: state.imageSizeSettings,
    savedAt: Date.now(),
  };
  localStorage.setItem("importImagePattern:settings", JSON.stringify(toSave));
  console.log("✅ 설정 저장 완료");
}

function loadSettings() {
  const saved = localStorage.getItem("importImagePattern:settings");
  if (!saved) return null;

  try {
    const settings = JSON.parse(saved);
    // 버전 체크
    if (settings.version !== "1.0") {
      console.warn("⚠️ 저장된 설정 버전이 다릅니다");
    }
    return settings;
  } catch (e) {
    console.error("❌ 설정 로드 실패:", e);
    return null;
  }
}
```

### Step 4: 자동 저장 (15분)

```javascript
// handleSettingChange에 추가
function handleSettingChange() {
  // 기존 로직...

  // 1초 후 저장 (debounce)
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveSettings(appState);
  }, 1000);
}
```

### Step 5: 초기화 시 복구 (15분)

```javascript
// 앱 초기화 시
function initializeApp() {
  // 1. localStorage에서 설정 로드
  const saved = loadSettings();

  if (saved) {
    // 2. appState 업데이트
    appState.patternSettings = saved.patternSettings;
    appState.layoutSettings = saved.layoutSettings;
    appState.imageSizeSettings = saved.imageSizeSettings;

    // 3. UI 업데이트
    updateUIFromState();
    console.log("✅ 저장된 설정 복구 완료");
  }
}
```

---

## 🧪 테스트 케이스

### TC-5.1: 기본 크기 설정

```
1. 이미지 크기 필드에 가로: 2, 세로: 3 입력
2. appState.imageSizeSettings 확인
3. 기대: { width: 2, height: 3, maintainRatio: false, fitToCell: false }
```

### TC-5.2: 비율 유지 (가로만 지정)

```
1. 원본 이미지: 500x1000px (비율 1:2)
2. 비율 유지 체크
3. 가로: 2 입력
4. 기대: 세로가 자동으로 4로 계산됨
```

### TC-5.3: 셀 크기에 맞춤

```
1. 셀 크기에 맞춤 체크
2. 가로/세로 입력 필드 비활성화 확인
3. 선택된 셀이 A1 (크기 88x21px)일 때
4. 기대: 이미지가 88x21px로 설정됨
```

### TC-5.4: localStorage 저장/복구

```
1. 설정값 입력 (행 3, 열 4, 비율 유지 ON 등)
2. 페이지 새로고침 또는 Sidebar 닫기/열기
3. 기대: 모든 설정값이 동일하게 복구됨
```

### TC-5.5: 상호 배타적 체크박스

```
1. "셀 크기에 맞춤" 체크
2. "비율 유지" 자동으로 언체크 확인
3. "비율 유지" 다시 체크
4. "셀 크기에 맞춤" 자동으로 언체크 확인
```

---

## 📊 파일 변경 예정

### src/sidebar.html

```diff
+ function calculateImageSize(...)
+ function handleFitToCellChange(...)
+ function handleMaintainRatioChange(...)
+ function saveSettings(...)
+ function loadSettings(...)
+ function initializeApp() { ... loadSettings() ... }
+ // handleSettingChange 개선 (자동 저장 추가)
```

### 새 파일: PHASE5_GUIDE.md

- Phase 5 상세 구현 가이드
- 테스트 케이스
- 크기 계산 로직 설명

---

## ✅ Phase 5 완료 체크리스트

- [x] 이미지 크기 계산 함수 구현
- [x] 체크박스 상호 배타적 처리
- [x] localStorage 저장/복구 함수
- [x] 자동 저장 로직 통합
- [x] 앱 초기화 시 자동 복구
- [x] 모든 테스트 케이스 이론적 검증
- [x] 린트 검사 통과
- [x] 문서 업데이트 (README, DEVELOPMENT_STATUS, PHASE5_GUIDE)

---

## 🎯 다음 Phase

**Phase 6**: 이미지 삽입 및 에러 처리

- 실제 이미지 삽입 로직
- Progress 표시
- 완료/취소/저장 버튼 상태 관리

---

**상태**: 🚀 Phase 5 진행 중  
**예상 완료**: 2~3시간  
**진행도**: 50% (4/8 Phase)
