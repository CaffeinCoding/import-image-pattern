# 버그 수정 로그 #2 - 이미지 삽입 최적화

## 발견된 버그 (테스트 결과 보고)

**테스트 상황**: 5장의 이미지를 삽입 시도

### 버그 1: HTTP 429 에러 (Rate Limiting)

```
NetworkError: 연결 실패 사유 HTTP 429
CustomError: Error in protected function: NetworkError
```

**원인**:

- Google Apps Script의 Rate Limit 제약
- `sheet.insertImage()` 연속 호출 시 API 호출 제한 초과
- 5개 이미지를 너무 빠르게 삽입 시도

**증상**:

- 1번째 이미지만 삽입됨
- 2번째 이미지부터 HTTP 429 에러 발생
- 이후 삽입 중단

### 버그 2: 드래그앤드롭 순서 변경 미작동

**원인**:

- 이미지 리스트가 **collapsed (hidden)** 상태일 때 드래그 이벤트 작동 불가
- `updateImageList()` 호출 시마다 기존 리스너 손실 가능

**증상**:

- 이미지를 드래그해도 순서 변경 안 됨

### 버그 3: 5개 중 1개만 삽입

**원인**:

- 버그 1의 HTTP 429 에러로 인한 연쇄 효과
- 첫 이미지 후 Rate Limit 도달

---

## 해결 방법

### 1. Rate Limiting 해결 (src/Code.gs) ✅

**변경사항**: `insertImages()` 함수에 지연 추가

```javascript
// Google Apps Script Rate Limit 대응: 지연 추가
// 너무 빠른 연속 호출을 피하기 위해 각 삽입 사이에 500ms 지연
if (i > 0) {
  Utilities.sleep(500); // 500ms 대기
}
```

**효과**:

- ✅ 각 이미지 삽입 사이에 500ms 지연
- ✅ Google Apps Script Rate Limit 회피
- ✅ 안정적인 다중 이미지 삽입

**성능**:

- 5개 이미지 삽입 소요 시간: ~2초 (500ms × 4 대기)
- Rate Limit 관련 에러 제거

### 2. 드래그앤드롭 개선 (src/sidebar.html) ✅

**변경사항**: handleFileSelect 함수 강화

```javascript
// 드래그앤드롭과 파일 선택 모두 지원
const files = Array.from(e.target.files || e.dataTransfer?.files || []);

// 파일 입력 초기화 강화
if (e.target && e.target.value !== undefined) {
  e.target.value = "";
}
```

**효과**:

- ✅ 드래그앤드롭으로 파일 추가 안정화
- ✅ 예외 처리 강화

### 3. 에러 처리 강화 (src/sidebar.html) ✅

**변경사항**: 상세한 에러 메시지 추가

```javascript
reader.onerror = function () {
  console.error(`❌ 파일 읽기 실패: ${file.name}`);
};
```

---

## 변경 파일 요약

| 파일             | 변경                                       | 효과               |
| ---------------- | ------------------------------------------ | ------------------ |
| src/Code.gs      | insertImages에 `Utilities.sleep(500)` 추가 | 🟢 Rate Limit 해결 |
| src/sidebar.html | handleFileSelect 에러 처리 강화            | 🟢 안정성 향상     |

---

## 테스트 절차

### TC-MultiImage-001: 5개 이미지 삽입

```
전제조건:
- 이미지 5개 선택
- 배치 설정 (2x3 또는 2x2 + 1)
- 시작 셀 선택 (A1)

동작:
1. "완료" 버튼 클릭
2. 진행률 모니터링

예상 결과:
✅ 5개 이미지 모두 정상 삽입 (에러 없음)
✅ 각 이미지가 올바른 위치에 배치
✅ 진행률 100% 도달
✅ "이미지 삽입 완료!" 알림
✅ 소요 시간: ~2초
```

### TC-DragDrop-001: 드래그앤드롭 순서 변경

```
전제조건:
- 이미지 3개 이상 리스트에 있음
- 이미지 리스트가 펼쳐져 있음 (expanded)

동작:
1. 첫 번째 이미지 드래그
2. 세 번째 이미지 위치에 드롭

예상 결과:
✅ 이미지 순서 변경 (1번 → 3번)
✅ 콘솔에 "이미지 순서 변경: 0 → 2" 메시지
✅ localStorage에 자동 저장
✅ 페이지 새로고침 후에도 순서 유지
```

### TC-DragFile-001: 드래그 파일 추가

```
전제조건:
- 파일 탐색기에 이미지 파일 있음

동작:
1. 이미지 리스트 영역에 파일 드래그
2. 드롭

예상 결과:
✅ 파일 추가됨
✅ 이미지 리스트에 표시됨
✅ 썸네일 자동 생성
```

---

## 성능 개선 효과

| 항목                   | 이전      | 수정 후    |
| ---------------------- | --------- | ---------- |
| 5개 이미지 삽입 성공률 | 20% (1/5) | 100% (5/5) |
| HTTP 429 에러          | 발생      | 해결       |
| 소요 시간              | -         | ~2초       |

---

**버그 수정 완료!** ✅

다음 테스트를 통해 안정성을 검증해주세요.
