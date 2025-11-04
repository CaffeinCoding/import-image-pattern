# 구현 분석 및 명세 검증 보고서

**작성일**: 2025년 11월  
**목적**: 설계와 구현의 괴리 파악 및 수정 계획 수립

---

## 🔴 **Critical Issues** (심각한 문제)

### Issue #1: 셀 크기에 맞춤 기능 미작동

#### 명세 요구사항 (프로젝트 명세.md 라인 67-68)

```
셀의 크기에 맞춤 옵션의 경우 선택한 단일 셀의 가로 세로 크기에 이미지 크기를 맞춤
패턴에 포함된 셀 중 선택한 셀의 가로 세로 크기와 다를 경우 무시 (선택한 셀이 기준, 이미지 크기 계산에만 사용)
```

#### 현재 구현 상황

- ✅ Backend: `getSelectedCellDimensions()` 구현됨 (Code.gs 라인 57-84)
- ❌ Frontend: **이 함수를 호출하지 않음**
- ❌ 결과: "셀 크기에 맞춤" 옵션이 작동하지 않음

#### 근본 원인

1. **설계 오류**: "셀 크기에 맞춤"의 정의가 혼동됨
   - 명세: 선택한 셀의 크기를 읽어서 그 크기로 모든 이미지 조정
   - 구현: width==1, height==1을 신호로 사용 (backend에서 셀 크기 읽음)
2. **Frontend 누락**:
   - calculateImageSize()에서는 1x1을 반환만 함
   - 선택한 셀의 실제 크기를 미리 읽지 않음
   - getSelectedCellDimensions() 호출 없음

#### 영향 범위

- Phase 5: 이미지 크기 설정 (⚠️ 부분 실패)
- Phase 6: 이미지 삽입 (⚠️ 크기 오류)
- Phase 7: UI 개선 (정상)

---

## 📋 **설계와 구현의 괴리 목록**

### 1. 이미지 크기 단위 혼동

#### 명세 (라인 17)

```
이미지의 크기 단위: 셀 높이/너비
```

#### 현재 구현

```javascript
// Backend: 픽셀 단위로 처리
const widthPx = width * CELL_WIDTH_PX; // 셀 단위 × 88px

// Frontend: 픽셀 단위 입력값 받음
result = { width: 176, height: 99 }; // 픽셀 단위
```

**문제**: 명세는 "셀 단위"이지만 구현은 "픽셀 단위"

---

### 2. "셀 크기에 맞춤"의 정의 불명확

#### 명세 (라인 67-68)

- 선택한 셀의 실제 크기 읽기
- 그 크기로 이미지 조정

#### 현재 구현

- Frontend: width=1, height=1로 신호 전송
- Backend: getRange().getColumnWidth/Height() 호출
- **문제**: Frontend에서 먼저 크기를 읽고 보낼 수도 있음

---

### 3. getSelectedCellDimensions() 함수 미사용

#### Backend 구현 (Code.gs 라인 57-84)

```javascript
function getSelectedCellDimensions() {
  // 선택된 셀의 실제 픽셀 크기 반환
  return { width, height };
}
```

#### Frontend 사용 현황

```javascript
// ❌ 사용하지 않음
// getSelectedCellDimensions() 호출 없음
```

---

### 4. 이미지 메타데이터 활용 불완전

#### 현재 상황

```javascript
// Frontend에서 이미지 로드 시 메타데이터 추출
const image = {
  width: img.width, // 원본 픽셀 너비
  height: img.height, // 원본 픽셀 높이
  ratio: img.width / img.height,
};

// ❌ 그러나 "비율 유지" 옵션에서만 사용
// ❌ "셀 크기에 맞춤"에서는 사용 안 함
```

---

## 🔧 **수정 계획**

### Phase A: 명세 명확화 (문서 수정)

**작업 1**: 이미지 크기 단위 정의

- 명세: "셀 단위" → "픽셀 단위로 수정" (구현이 픽셀 기반)
- 이유: Backend에서 이미 픽셀 기반 처리

**작업 2**: "셀 크기에 맞춤" 정의 재정의

- 선택한 셀의 실제 픽셀 크기를 getSelectedCellDimensions()로 읽음
- 그 크기를 모든 이미지에 적용

### Phase B: Frontend 수정

**작업 1**: calculateImageSize() 개선

- fitToCell이 true일 때: 선택한 셀의 크기를 미리 읽음
- Backend 호출 없이 Frontend에서 처리

**작업 2**: getSelectedCellDimensions() 활용

- updateSelectedCell() 후 셀 크기도 함께 읽음
- appState에 저장

### Phase C: Backend 검토

**작업 1**: insertImageAtCell() 최종 검증

- 현재 구현이 정상인지 확인
- 픽셀 기반 처리 확인

---

## 📊 **상태 체크리스트**

| 항목                            | 현재 상태    | 필요 작업                     |
| ------------------------------- | ------------ | ----------------------------- |
| **명세 명확화**                 | ❌ 불명확    | 수정 필요                     |
| **getSelectedCellDimensions()** | ✅ 구현됨    | 👈 **Frontend에서 호출 추가** |
| **calculateImageSize()**        | ⚠️ 부분 작동 | 개선 필요                     |
| **이미지 크기 적용**            | ❌ 미작동    | 수정 필요                     |
| **Backend 처리**                | ✅ 정상      | 검증만 필요                   |

---

**다음 단계**: Phase A부터 순차적으로 진행
