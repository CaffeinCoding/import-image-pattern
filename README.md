# Import Images Pattern

구글 스프레드시트에 이미지를 격자형 패턴으로 배치하는 기능을 제공하는 Google Apps Script 확장 프로그램입니다.

## 🎯 프로젝트 개요

- **기술 스택**: Google Apps Script, HTML/CSS/JavaScript (Vanilla JS)
- **개발 기간**: 약 4~5주 (풀타임 1인 기준)
- **난이도**: 중상

## 📁 프로젝트 구조

```
import-image-pattern/
├── Code.gs              # Google Apps Script 백엔드
├── sidebar.html         # Sidebar UI 마크업
├── sidebar.js           # 프론트엔드 로직
├── styles.css           # 스타일 (다크모드 지원)
├── appsscript.json      # 매니페스트 파일
├── 프로젝트 명세.md      # 기능 명세
├── 개발계획.md          # 개발 로드맵
├── 테스트계획.md        # 테스트 계획
└── README.md            # 이 파일
```

## ✨ 주요 기능

- ✅ 격자형 패턴 이미지 배치
- ❌ 실시간 프리뷰 시스템 (제거됨 - Phase 4)
- ✅ 간격 설정 및 비활성 셀 지정
- ✅ 이미지 크기 조절 (비율 유지 포함)
- ✅ 설정값 저장 및 복구 (localStorage)
- ✅ 에러 처리 및 진행 상황 표시
- ✅ 다크모드 지원
- ✅ 반응형 디자인
- ✅ 명시적 셀 선택 및 좌표 표시 (Phase 4)

## 🚀 시작하기

### 1. Google Apps Script 프로젝트 설정

1. [Google Apps Script 콘솔](https://script.google.com)에 접속
2. 새 프로젝트 생성
3. 파일 추가:

   - `Code.gs` - 이 저장소의 `Code.gs` 복사
   - `sidebar.html` - 이 저장소의 `sidebar.html` 복사
   - `sidebar.js` - 이 저장소의 `sidebar.js` 복사
   - `styles.css` - 이 저장소의 `styles.css` 복사

4. 프로젝트 설정:
   - `appsscript.json` 내용 복사 (프로젝트 설정 > 매니페스트 에디터)

### 2. 테스트 스프레드시트 생성

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. Apps Script 프로젝트와 연결
3. "이미지 패턴" 메뉴 > "이미지 가져오기" 클릭

### 3. 로컬 개발 (선택사항)

clasp를 사용한 로컬 개발:

```bash
# clasp 설치
npm install -g @google/clasp

# Google 계정 로그인
clasp login

# 프로젝트 클론
clasp clone <scriptId>

# 개발 및 배포
npm run watch
npm run push
```

## 📚 개발 단계

### Phase 1: 프로젝트 초기화 ✅

- ✅ Google Apps Script 프로젝트 생성
- ✅ Sidebar 기본 레이아웃 구성
- ✅ 개발 도구 설정

### Phase 2: 이미지 관리 및 기본 배치 ✅

- ✅ 이미지 업로드 및 리스트 관리
- ✅ 셀 선택 및 패턴 설정
- ✅ 격자형 배치 로직

### Phase 3: 프리뷰 시스템 ✅ (이후 제거)

- ✅ 프리뷰 배경색 시스템 (성능 최적화 후 제거)
- ✅ debounce 및 프리뷰 갱신
- ✅ 선택 셀 프리뷰

### Phase 4: 기능 변경 (프리뷰 제거, 셀 표시) ✅

- ✅ 프리뷰 기능 완전 제거
- ✅ 셀 좌표 표시 기능 추가 ("선택" 버튼)
- ✅ UI/UX 개선

### Phase 5: 이미지 크기 및 설정 관리 (진행 예정)

- [ ] 이미지 크기 설정 UI
- [ ] 비활성 셀 지정 개선
- [ ] 상태 관리 통합

### Phase 6: 이미지 삽입

- [ ] 이미지 삽입 로직
- [ ] Progress 표시
- [ ] 에러 처리

### Phase 7: 고급 기능

- [ ] 이미지 드래그 앤 드롭
- [ ] 추가 커스터마이징 옵션

### Phase 8: 테스트 및 배포

- [ ] 기능 테스트
- [ ] 호환성 테스트
- [ ] 배포 및 문서화

## 🛠️ 개발 가이드

### 파일 설명

#### `Code.gs`

Google Apps Script 백엔드입니다. 다음 기능을 제공합니다:

- Sidebar 열기/닫기
- 선택된 셀 정보 조회
- 배치 좌표 계산
- 셀 배경색 설정/복구
- Undo 기능

#### `sidebar.html`

Sidebar UI의 마크업입니다. 구성:

- 헤더 (프로젝트 제목)
- 상단 버튼 (이미지 가져오기, 완료/저장)
- 이미지 리스트 (Collapsible)
- 설정 패널 (행/열 개수, 간격, 크기)
- 비활성 셀 지정 표

#### `sidebar.js`

프론트엔드 로직입니다:

- 상태 관리 (appState)
- 이벤트 처리
- UI 업데이트
- localStorage 저장/복구
- 배치 좌표 계산

#### `styles.css`

스타일시트입니다:

- CSS 변수 사용 (다크모드 지원)
- 반응형 디자인
- 다크모드 미디어쿼리
- 컴포넌트 스타일

## 🔧 상태 관리 (appState 구조)

```javascript
{
  images: [],                    // 로드된 이미지 배열
  selectedCell: {                // 선택된 셀
    row: number,
    col: number,
    address: string             // "A1" 형식
  },
  patternSettings: {             // 패턴 설정
    rows: number,               // 행 개수
    cols: number,               // 열 개수
    rowGap: number,             // 행 간격
    colGap: number              // 열 간격
  },
  imageSizeSettings: {           // 이미지 크기 설정
    width: number,              // 너비 (셀 단위)
    height: number,             // 높이 (셀 단위)
    maintainRatio: boolean,     // 비율 유지
    fitToCell: boolean          // 셀 크기에 맞춤
  },
  inactiveCells: boolean[][],    // 비활성 셀 2D 배열
  isProcessing: boolean,         // 처리 중 여부
  previewCells: []               // 프리뷰 셀 정보
}
```

## 💾 localStorage 저장 범위

- ✅ 행/열 개수
- ✅ 간격 설정
- ✅ 이미지 크기
- ✅ 비활성 셀 (2D 배열)
- ❌ 이미지 목록
- ❌ 선택된 셀

## 🎨 색상 정의

```javascript
const COLORS = {
  selected: "#196fe1", // 선택 셀 (파란색)
  inactive: "#7c7c7c", // 비활성 셀 (회색)
  image: "#269444", // 이미지 셀 (초록색)
  mixed: "#0d4a6d", // 혼합 (선택 + 비활성)
};
```

## 📋 주요 체크포인트

- [ ] Phase 2 배치 로직 정확도 검증 (매우 중요!)
- [ ] Phase 3 프리뷰 색상 우선순위 확인
- [ ] Phase 4 크기 계산 로직 테스트 (비율 유지 케이스)
- [ ] Phase 6 에러 처리 케이스 완벽 테스트

## 🔗 유용한 링크

- [Google Apps Script 공식 문서](https://developers.google.com/apps-script)
- [Sheets API 참조](https://developers.google.com/sheets/api)
- [Clasp 개발 도구](https://github.com/google/clasp)

## 📝 라이선스

MIT License

## 👤 개발자

개발 중...

---

## 📊 개발 현황

**현재 상태**: Phase 1~6 완료 ✅ | Phase 7 준비 중 🎯 (63% 진행)

| Phase | 주제                     | 상태                       |
| ----- | ------------------------ | -------------------------- |
| 1     | 프로젝트 초기화          | ✅ 완료                    |
| 2     | 이미지 관리 + 배치 로직  | ✅ 완료                    |
| 3     | 프리뷰 시스템            | ✅ 완료 (Phase 4에서 제거) |
| 4     | 기능 변경 (셀 좌표 표시) | ✅ 완료                    |
| 5     | 이미지 크기 + 설정 관리  | ✅ 완료                    |
| 6     | 이미지 삽입 + 에러 처리  | ✅ 완료                    |
| 7     | UI/UX 개선 + 최적화      | 🎯 준비 중                 |
| 8     | 테스트 + 배포            | ⏳ 예정                    |
