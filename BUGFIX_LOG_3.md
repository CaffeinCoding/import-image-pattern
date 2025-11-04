# 버그 수정 로그 #3 (수정됨) - 이미지 크기 설정 미적용

## 발견된 버그

**테스트 상황**: "셀의 크기에 맞춤" 옵션 선택 후 이미지 삽입

**버그**: 셀 크기에 맞춤을 선택했지만 이미지가 **원본 크기**로 삽입됨

**증상**:

- UI에서 "셀의 크기에 맞춤" 체크박스 선택
- 완료 버튼 클릭
- ❌ 이미지가 원본 크기 (예: 1920x1080) 그대로 삽입됨
- ✅ 예상: 이미지가 선택한 셀의 실제 크기로 조정되어야 함

---

## 근본 원인 (수정됨) 🔍

**문제 1**: calculateLayoutPositions() 함수에서 **모든 이미지에 고정 크기 적용**

**문제 2**: `calculateImageSize()` 함수가 **셀 단위로 계산** (잘못됨)

- 현재: 1x1 셀로 반환
- 문제: 이 값이 Backend에서 다시 88px × 21px로 변환됨 (고정값)
- ❌ 실제 셀 크기를 반영하지 못함

**문제 3**: 이미지 크기 입력 단위 혼동

- 비율 유지/자유 크기: **픽셀** 단위여야 함 (셀이 아님)
- 예: 너비 176px, 높이 88px

---

## 올바른 이해 (정정됨) ✅

### "셀의 크기에 맞춤"의 정확한 동작

```
1. 사용자가 선택한 셀의 실제 픽셀 크기 읽음
   - getColumnWidth() → 실제 열 너비 (픽셀)
   - getRowHeight() → 실제 행 높이 (픽셀)
   예: A1 셀 = 88px × 21px

2. 이미지를 해당 픽셀 크기로 조절
   image.setWidth(셀너비)
   image.setHeight(셀높이)

3. 스프레드시트에 삽입
```

### "비율 유지" 설정

- **입력 단위**: 픽셀 (셀이 아님!)
- 예: 너비 176px 입력 → 원본 비율에 따라 높이 자동 계산
- 픽셀 계산: 176px / 이미지비율 = 높이px

---

## 해결 방법 (수정됨) ✅

### 1. Backend 수정 (src/Code.gs)

**변경**: insertImageAtCell() 함수

```javascript
// ✅ width/height가 모두 1이면 "셀 크기에 맞춤" 신호
if (width === 1 && height === 1) {
  const range = sheet.getRange(row, col);
  widthPx = range.getColumnWidth(); // 실제 셀 너비 읽음!
  heightPx = range.getRowHeight(); // 실제 셀 높이 읽음!
  Logger.log(`✅ 셀(${row},${col}) = ${widthPx}x${heightPx}px`);
} else {
  // 직접 지정된 픽셀 값 사용
  widthPx = width; // 픽셀 그대로
  heightPx = height; // 픽셀 그대로
}

image.setWidth(widthPx);
image.setHeight(heightPx);
```

**효과**:

- ✅ 각 이미지별 크기 개별 계산
- ✅ 선택한 셀의 실제 픽셀 크기 적용
- ✅ 고정 변환값 제거 (88px, 21px 상수 제거)

### 2. Frontend 수정 (src/sidebar.html)

**변경**: calculateImageSize() 함수

```javascript
if (settings.fitToCell) {
  // Frontend: 1x1로 반환 (Backend의 신호)
  result = { width: 1, height: 1 };
  // Backend에서 이를 감지하고 실제 셀 크기로 변환
}

// 비율 유지/자유 크기: 픽셀 단위 입력값 그대로 반환
result = { width: widthPx, height: heightPx }; // 픽셀 단위!
```

**효과**:

- ✅ Frontend에서는 크기를 그대로 통과시킴
- ✅ Backend에서 실제 처리
- ✅ 픽셀 단위로 명확화

---

## 데이터 흐름 (수정됨)

```
사용자 설정 (UI)
    ↓
calculateImageSize()
    ├─ fitToCell = true → {width: 1, height: 1} 반환
    └─ 비율유지/자유 → {width: px, height: px} 반환 (픽셀)
    ↓
calculateLayoutPositions() → positions 배열에 추가
    ↓
Backend insertImages() 호출
    ↓
insertImageAtCell()
    ├─ width=1 && height=1이면
    │  └─ 실제 셀 크기 읽음: getColumnWidth(), getRowHeight()
    └─ 그 외: 받은 픽셀값 그대로 사용
    ↓
image.setWidth(픽셀), image.setHeight(픽셀) 적용
```

---

## 변경 파일 요약

| 파일             | 함수                     | 변경 내용     |
| ---------------- | ------------------------ | ------------- |
| src/Code.gs      | insertImageAtCell        | +10줄         |
| src/sidebar.html | calculateImageSize       | +5줄          |
| src/sidebar.html | calculateLayoutPositions | (이미 수정됨) |

---

## 테스트 절차 (수정됨)

### TC-FitToCell-001: 셀 크기에 맞춤 ✅

```
전제조건:
- 이미지 선택 (예: 1920x1080)
- "셀의 크기에 맞춤" ✓ 체크

동작:
1. 배치 설정 (2x2)
2. "완료" 클릭

예상 결과:
✅ Backend 로그: "셀(1,1) = 88x21px"
✅ 이미지가 선택한 셀의 실제 크기(88x21px)로 조정
✅ 다른 크기의 셀에 삽입하면 그 셀 크기로 조정됨
```

### TC-MaintainRatio-001: 비율 유지 (픽셀 단위) ✅

```
전제조건:
- 이미지 선택 (1920x1080)
- "비율 유지" ✓ 체크
- 이미지 너비: 176 (픽셀!) 입력
- 이미지 높이: 비워둠

동작:
1. "완료" 클릭

예상 결과:
✅ 콘솔: "너비 176px → 높이 99px (비율 유지)"
✅ 이미지가 176x99 픽셀로 조정됨
✅ 계산: 176 / (1920/1080) = 99px
```

### TC-CustomSize-001: 자유 크기 (픽셀 단위) ✅

```
전제조건:
- 이미지 선택
- "셀의 크기에 맞춤" ☐ 미체크
- "비율 유지" ☐ 미체크
- 이미지 너비: 200 (픽셀!)
- 이미지 높이: 150 (픽셀!)

동작:
1. "완료" 클릭

예상 결과:
✅ 콘솔: "자유 크기 200x150px (픽셀)"
✅ 이미지가 정확히 200x150 픽셀로 조정됨
```

---

## 핵심 정정 사항 📌

| 항목           | 이전 (잘못됨)  | 수정 (정확함)     |
| -------------- | -------------- | ----------------- |
| 셀 크기에 맞춤 | 고정 88x21px   | 실제 셀 크기 읽음 |
| 크기 단위      | 셀 단위 (혼동) | 픽셀 단위         |
| 계산 위치      | Frontend       | Backend (더 정확) |
| 입력값 처리    | 변환           | 그대로 전달       |

---

**수정된 버그 해결!** ✅

이제 다음과 같이 작동합니다:

1. **셀 크기에 맞춤** → 선택한 셀의 **실제 픽셀 크기**로 이미지 조정
2. **비율 유지/자유** → **픽셀 단위** 입력값으로 이미지 조정
3. **정확한 크기 제어** → 명확한 픽셀 기준

다시 테스트해주세요! 🚀
