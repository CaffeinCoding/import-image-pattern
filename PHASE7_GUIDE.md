# Phase 7: UI/UX 개선 및 최적화

**목표**: 사용자 인터페이스 개선 및 사용성 최적화  
**예상 기간**: 2~3일  
**상태**: 🚀 준비 중

---

## 📋 개요

Phase 7은 기존 기능들을 바탕으로 **사용자 경험을 향상**시키는 단계입니다. 이미지 선택, 설정 관리, 단축키 등 UI/UX 개선을 통해 더욱 직관적이고 빠른 사용성을 제공합니다.

### 핵심 기능

1. **이미지 선택 UI 개선**: 썸네일, 드래그앤드롭, 미리보기
2. **설정값 프리셋**: 자주 사용하는 배치 패턴 저장/로드
3. **단축키 지원**: Ctrl+S (저장), Ctrl+Z (취소) 등
4. **반응형 디자인**: 다양한 화면 크기 대응
5. **어두운 테마**: 야간 모드 지원

---

## 🎯 Phase 7 핵심 작업

### 7.1 이미지 선택 UI 개선

#### 현재 상태

```html
<!-- 기본 파일 입력 -->
<input type="file" multiple accept="image/*" id="imageInput" />
<!-- 이미지 리스트 표시 -->
<div id="imageList"></div>
```

#### 개선 목표

##### 1. 썸네일 미리보기

```html
<!-- 이미지 썸네일 표시 -->
<div class="image-thumbnail">
  <img
    src="data:image/..."
    style="width: 60px; height: 60px; object-fit: cover;"
  />
  <span class="image-name">image.jpg</span>
  <span class="image-size">250 KB</span>
  <button onclick="removeImage(index)">✕</button>
</div>
```

**구현 사항**:

- 60x60px 썸네일 표시
- 파일명 및 크기 정보
- 삭제 버튼

##### 2. 드래그앤드롭

```javascript
function setupDragAndDrop() {
  const dropZone = document.getElementById("imageList");

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  });
}
```

**구현 사항**:

- 드래그 영역 하이라이트
- 파일 드롭 시 추가
- 기존 파일 선택과 동일한 처리

##### 3. 이미지 정렬 (드래그 순서 변경)

```javascript
function makeImagesSortable() {
  // SortableJS 또는 HTML5 Drag & Drop API 사용
  // 이미지 순서 변경으로 배치 순서 조정
}
```

---

### 7.2 설정값 프리셋

#### 저장된 프리셋 구조

```javascript
{
  name: "2x3 배치",
  description: "2행 3열 기본 패턴",
  settings: {
    patternSettings: {
      rows: 2,
      cols: 3,
      rowGap: 1,
      colGap: 1
    },
    imageSizeSettings: {
      width: 2,
      height: 2,
      maintainRatio: false,
      fitToCell: false
    }
  },
  createdAt: "2025-01-15T10:30:00Z",
  usage: 15  // 사용 횟수
}
```

#### 프리셋 관리 UI

```html
<!-- 프리셋 저장 -->
<div class="preset-save">
  <input type="text" id="presetName" placeholder="프리셋 이름" />
  <input type="text" id="presetDesc" placeholder="설명 (선택)" />
  <button onclick="savePreset()">💾 저장</button>
</div>

<!-- 저장된 프리셋 목록 -->
<div class="preset-list">
  <select id="presetSelect" onchange="loadPreset()">
    <option value="">-- 프리셋 선택 --</option>
    <option value="preset1">2x3 배치</option>
    <option value="preset2">3x4 배치</option>
  </select>
  <button onclick="deletePreset()">🗑️ 삭제</button>
</div>
```

#### 구현 함수

```javascript
function savePreset() {
  const name = document.getElementById("presetName").value;
  const desc = document.getElementById("presetDesc").value;

  const preset = {
    name: name,
    description: desc,
    settings: {
      patternSettings: appState.patternSettings,
      imageSizeSettings: appState.imageSizeSettings,
    },
    createdAt: new Date().toISOString(),
  };

  // localStorage에 저장
  const presets = JSON.parse(
    localStorage.getItem("importImagePattern:presets") || "[]"
  );
  presets.push(preset);
  localStorage.setItem("importImagePattern:presets", JSON.stringify(presets));

  alert("✅ 프리셋이 저장되었습니다: " + name);
}

function loadPreset(presetName) {
  const presets = JSON.parse(
    localStorage.getItem("importImagePattern:presets") || "[]"
  );
  const preset = presets.find((p) => p.name === presetName);

  if (preset) {
    appState.patternSettings = preset.settings.patternSettings;
    appState.imageSizeSettings = preset.settings.imageSizeSettings;
    updateUI();
    console.log("✅ 프리셋 로드: " + presetName);
  }
}
```

---

### 7.3 단축키 지원

#### 지원할 단축키

```
Ctrl+S (또는 Cmd+S): 프리셋 저장
Ctrl+Z (또는 Cmd+Z): 작업 취소 (Undo)
Ctrl+Shift+Z (또는 Cmd+Shift+Z): 작업 재실행 (Redo) - 선택사항
Enter: 이미지 삽입 시작 ("완료" 버튼 클릭)
Escape: 작업 취소
```

#### 구현 방식

```javascript
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          savePreset();
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            redo(); // 선택사항
          } else {
            handleCancelClick();
          }
          break;
        case "Enter":
          e.preventDefault();
          handleCompleteClick();
          break;
      }
    } else if (e.key === "Escape") {
      handleCancelClick();
    }
  });
}
```

---

### 7.4 반응형 디자인

#### 브레이크포인트

```css
/* 모바일 (< 600px) */
@media (max-width: 600px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: static;
  }
  .form-group {
    margin-bottom: 16px;
  }
}

/* 태블릿 (600px ~ 1024px) */
@media (min-width: 600px) and (max-width: 1024px) {
  .sidebar {
    width: 350px;
  }
}

/* 데스크톱 (> 1024px) */
@media (min-width: 1024px) {
  .sidebar {
    width: 400px;
  }
}
```

#### 개선 사항

- Sidebar 너비 동적 조정
- 폰트 크기 반응형
- 버튼 크기 조정
- 여백/간격 최적화

---

### 7.5 어두운 테마 지원

#### CSS 변수 사용

```css
:root {
  /* Light 테마 (기본) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --button-bg: #4caf50;
  --button-text: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark 테마 */
    --bg-primary: #1e1e1e;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border-color: #404040;
    --button-bg: #45a049;
    --button-text: #ffffff;
  }
}
```

#### 테마 토글 구현

```html
<!-- 테마 토글 버튼 -->
<button id="themeToggle" onclick="toggleTheme()">🌙 어두운 모드</button>

<script>
  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute("data-theme") === "dark";

    if (isDark) {
      html.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      html.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  }

  // 초기 테마 로드
  function loadTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }
</script>
```

---

## 📝 구현 순서

### Step 1: 이미지 선택 UI (1시간)

- 썸네일 미리보기 추가
- 드래그앤드롭 구현
- 이미지 정렬 기능 (선택사항)

### Step 2: 설정값 프리셋 (45분)

- 프리셋 저장 함수
- 프리셋 로드 함수
- 프리셋 삭제 함수
- UI 추가

### Step 3: 단축키 지원 (30분)

- Keyboard 이벤트 리스너
- 단축키 매핑
- 도움말 표시 (?)

### Step 4: 반응형 디자인 (1시간)

- CSS 미디어 쿼리
- Viewport 메타 태그 확인
- 다양한 화면 테스트

### Step 5: 어두운 테마 (1시간)

- CSS 변수 정의
- 테마 토글 UI
- localStorage 저장/로드

### Step 6: 테스트 및 문서화 (1시간)

- 모든 기능 테스트
- TC-59 ~ TC-70 작성
- PHASE7_SUMMARY 작성

---

## 🧪 테스트 케이스

### TC-59: 이미지 썸네일 표시

```
조건:
- 이미지 3개 선택

동작:
1. 각 이미지의 썸네일 확인

예상 결과:
- 60x60px 썸네일 표시
- 파일명, 크기 정보 표시
- 삭제 버튼 동작
```

### TC-60: 드래그앤드롭

```
조건:
- 이미지 파일 2개

동작:
1. 드래그 영역에 파일 드롭

예상 결과:
- 파일 추가 성공
- 기존 파일과 동일하게 처리
```

### TC-61: 프리셋 저장

```
조건:
- 설정값 입력 완료

동작:
1. 프리셋 이름 입력
2. "저장" 버튼 클릭

예상 결과:
- "✅ 프리셋이 저장되었습니다" 메시지
- localStorage에 저장 확인
```

### TC-62: 프리셋 로드

```
조건:
- 저장된 프리셋 있음

동작:
1. 프리셋 선택
2. 드롭다운에서 선택

예상 결과:
- 모든 설정값 자동 로드
- UI 업데이트
```

### TC-63: 단축키 - Ctrl+S

```
조건:
- 설정값 입력 완료

동작:
1. Ctrl+S 누름

예상 결과:
- 프리셋 저장 함수 실행
- 저장 완료 메시지
```

### TC-64: 단축키 - Ctrl+Z

```
조건:
- 이미지 삽입 진행 중

동작:
1. Ctrl+Z 누름

예상 결과:
- 작업 취소
- Undo 호출
```

### TC-65: 단축키 - Enter

```
조건:
- 모든 설정 완료

동작:
1. 아무 입력 필드에서 Enter 누름

예상 결과:
- 이미지 삽입 시작 (완료 버튼 클릭)
```

### TC-66: 단축키 - Escape

```
조건:
- 어떤 상태든

동작:
1. Escape 키 누름

예상 결과:
- 작업 취소 (필요시)
```

### TC-67: 반응형 - 모바일 (< 600px)

```
조건:
- 모바일 화면 (360px ~ 480px)

동작:
1. Sidebar 레이아웃 확인

예상 결과:
- 전체 너비 사용
- 요소 적절히 배치
- 스크롤 필요시 가능
```

### TC-68: 반응형 - 태블릿 (600px ~ 1024px)

```
조건:
- 태블릿 화면 (768px)

동작:
1. 레이아웃 확인

예상 결과:
- 350px 너비로 조정
- 모든 요소 표시 가능
```

### TC-69: 어두운 테마 - 토글

```
조건:
- 테마 토글 버튼 있음

동작:
1. 🌙 버튼 클릭

예상 결과:
- 테마 전환 (Light ↔ Dark)
- 모든 색상 업데이트
- localStorage 저장
```

### TC-70: 어두운 테마 - 시스템 설정 감지

```
조건:
- OS 어두운 모드 활성화

동작:
1. 앱 시작

예상 결과:
- 자동으로 어두운 테마 적용
- 또는 저장된 설정 우선
```

---

## ✅ Phase 7 완료 체크리스트

- [ ] 이미지 썸네일 미리보기
- [ ] 드래그앤드롭 기능
- [ ] 프리셋 저장/로드/삭제
- [ ] 단축키 (Ctrl+S, Ctrl+Z, Enter, Escape)
- [ ] 반응형 디자인
- [ ] 어두운 테마 토글
- [ ] 모든 테스트 케이스 통과
- [ ] 린트 검사 통과
- [ ] 문서 업데이트

---

## 🎯 다음 Phase

**Phase 8**: 테스트 + 배포

- 통합 테스트
- 성능 최적화
- Google Marketplace 배포 (선택사항)

---

**상태**: 🚀 Phase 7 준비 중  
**예상 완료**: 2~3일  
**진행도**: 60% (6/8 Phase 완료)
