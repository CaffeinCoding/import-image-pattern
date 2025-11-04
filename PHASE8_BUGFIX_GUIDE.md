# Phase 8 이후 버그 진단 & 수정 계획

**발견일**: 2025년 11월  
**상태**: 🔴 진단 중  
**버그 수**: 2가지

---

## 🔴 **발견된 버그들**

### **Bug #1: 이미지가 여전히 셀 크기에 맞지 않음**

#### 증상

- "셀 크기에 맞춤" ✓ 체크
- 예상: 선택한 셀의 정확한 크기로 삽입
- 실제: 원본 크기로 삽입되거나, 잘못된 크기로 삽입됨

#### 가능한 원인들

| 순번 | 원인                                            | 확인 방법                                              |
| ---- | ----------------------------------------------- | ------------------------------------------------------ |
| 1️⃣   | `getSelectedCellDimensions()` 호출 안 됨        | Console: "✅ 셀 크기 읽음" 메시지 확인                 |
| 2️⃣   | `appState.selectedCellDimensions` 값 = 0        | Console: selectedCellDimensions 확인                   |
| 3️⃣   | Fallback (1x1 신호) 실행 중                     | Console: "⚠️ 셀 크기 미리 로드 안 됨" 메시지           |
| 4️⃣   | Backend에서 1x1 신호를 받아도 셀 크기 읽기 실패 | Apps Script Console: "✅ 셀 크기에 맞춤 활성화" 메시지 |
| 5️⃣   | 셀 크기를 읽었지만 이미지 크기 설정 실패        | Apps Script Console: "최종 크기" 로그 확인             |

---

### **Bug #2: JPG 이미지가 Insert 되지 않음**

#### 증상

- PNG: 정상 작동 ✅
- JPG: 에러 발생 ❌
- 에러 메시지: 구체적 내용 확인 필요

#### 가능한 원인들

| 순번 | 원인                    | 확인 방법                                         |
| ---- | ----------------------- | ------------------------------------------------- |
| 1️⃣   | MIME 타입 추출 실패     | Apps Script Console: "📄 파일 정보" 로그          |
| 2️⃣   | Base64 데이터 형식 오류 | Apps Script Console: "📦 Base64 데이터 길이" 로그 |
| 3️⃣   | Base64 디코딩 실패      | Apps Script Console: "Base64 디코딩 실패" 에러    |
| 4️⃣   | Blob 생성 실패          | Apps Script Console: "Blob 변환 실패" 에러        |
| 5️⃣   | 이미지 삽입 실패        | Apps Script Console: "❌ 이미지 삽입 실패" 에러   |
| 6️⃣   | 이미지 크기 설정 실패   | Apps Script Console: "크기 설정 전" 로그 확인     |

---

## 📋 **진단 절차 (상세)**

### **Step 1: Console 로그 확인**

#### 1-1. Browser Console (F12 → Console)

**확인 사항**:

```javascript
// ✅ 셀 크기 읽기 성공 여부
"✅ 셀 크기 읽음: {width}x{height}px"; // 있으면 성공
"⚠️ 셀 크기 읽기 실패"; // 있으면 실패

// ✅ appState 직접 확인
appState.selectedCellDimensions; // {width: 수치, height: 수치} 여부

// ✅ 이미지 예상 크기 확인
("📷 이미지 0: {파일명} → 크기: {width}x{height}px");

// ✅ Fallback 사용 여부
("⚠️ 셀 크기 미리 로드 안 됨 → Backend에서 처리 (1x1 신호)");
```

#### 1-2. Apps Script Console (Google Apps Script 에디터 → Logs)

**확인 사항**:

```javascript
// ✅ Backend 셀 크기 읽기
"✅ 셀 크기에 맞춤 활성화: 셀(row,col) = {width}x{height}px";

// ✅ JPG 처리
"📄 파일 정보: 확장자=jpg, MIME=image/jpeg";
"✅ Blob 생성 성공: image_1_1.jpg";
"✅ 이미지 객체 생성 성공";

// ✅ 최종 크기
"✅ 이미지 삽입 성공: ({row}, {col}) - 최종 크기: {width}x{height}px";

// ❌ 에러 있으면
"❌ 이미지 {idx} 삽입 실패: {에러 메시지}";
```

---

### **Step 2: 테스트 시나리오**

#### 시나리오 A: 셀 크기에 맞춤 (PNG)

```
1. PNG 이미지 선택
2. "셀의 크기에 맞춤" ✓ 체크
3. 특정 셀 선택 (예: B2)
4. F12 콘솔에서 다음 확인:
   - "✅ 셀 크기 읽음" 메시지
   - appState.selectedCellDimensions 값
5. 완료 버튼 클릭
6. Browser Console 확인:
   - "📷 이미지 0: ... → 크기: {실제 픽셀}x{실제 픽셀}px"
7. Apps Script 로그 확인:
   - "✅ 셀 크기에 맞춤 활성화"
   - "최종 크기"
```

#### 시나리오 B: 셀 크기에 맞춤 (JPG)

```
1. JPG 이미지 선택
2. "셀의 크기에 맞춤" ✓ 체크
3. 특정 셀 선택
4. 완료 버튼 클릭
5. Browser Console 확인:
   - JPG 로드 성공 메시지
6. Apps Script 로그 확인:
   - "📄 파일 정보: 확장자=jpg"
   - "✅ Blob 생성 성공"
   - "최종 크기"
7. 스프레드시트 확인:
   - 이미지 삽입됨?
```

---

## 🔧 **예상 해결책**

### **Bug #1 해결책 (셀 크기 미적용)**

**가능성 높은 순서**:

1. **✅ 확인 사항**: `getSelectedCellDimensionsAndUpdate()`가 호출되는가?

   - 만약 없다면: `setupSelectionListener()` 에서 호출 추가되어 있는지 확인
   - 만약 호출되지만 값이 0이면: Backend `getSelectedCellDimensions()` 문제일 수 있음

2. **✅ 확인 사항**: Fallback (1x1 신호)이 사용되는가?

   - "⚠️ 셀 크기 미리 로드 안 됨" 메시지가 있으면, Backend에서 1x1 신호를 받았음
   - 이 경우 Backend의 `if (width == 1 && height == 1)` 분기가 실행되어야 함

3. **✅ 확인 사항**: Backend에서 1x1을 받았을 때 셀 크기 읽기가 성공했는가?
   - "✅ 셀 크기에 맞춤 활성화" 메시지 확인
   - 만약 이 메시지가 없으면, `if (width == 1 && height == 1)` 조건이 false인 것

### **Bug #2 해결책 (JPG 미지원)**

**가능성 높은 순서**:

1. **✅ MIME 타입 추출**

   - 로그: "📄 파일 정보" 확인
   - JPG가 `image/jpeg`로 추출되는가?
   - 아니면 `image/png` (기본값)로 남아있는가?

2. **✅ Base64 디코딩**

   - 로그: "📦 Base64 데이터 길이" 확인
   - 로그: "📦 디코딩된 데이터 크기" 확인
   - 디코딩이 성공했는가?

3. **✅ Blob 생성**
   - 로그: "✅ Blob 생성 성공" 확인
   - 파일명이 `.jpg`인가, `.png`인가?

---

## 🚀 **다음 액션 아이템**

### **Immediate** (지금)

1. [ ] 위 **Step 2의 테스트 시나리오 A, B 실행**
2. [ ] **Browser Console에서 로그 캡처**
3. [ ] **Apps Script 로그 캡처**
4. [ ] **결과 공유**

### **Based on 로그 결과**

- 로그를 기반으로 정확한 원인 파악
- 필요한 수정 사항 구현
- 다시 테스트

---

## 📊 **디버그 로그 추가 목록**

| 위치                     | 추가된 로그                      | 목적                     |
| ------------------------ | -------------------------------- | ------------------------ |
| handleCompleteClick      | "=== 🔍 이미지 삽입 전 상태 ===" | 삽입 전 상태 확인        |
| handleCompleteClick      | selectedCellDimensions 출력      | 셀 크기 값 확인          |
| handleCompleteClick      | 각 이미지의 예상 크기            | 크기 계산 결과 확인      |
| insertImageAtCell        | "📄 파일 정보"                   | MIME 타입 및 확장자 확인 |
| insertImageAtCell        | "✅ Blob 생성 성공"              | Blob 생성 성공 여부      |
| insertImageAtCell        | "📦 Base64 데이터 길이"          | Base64 길이 확인         |
| insertImageAtCell        | "📦 디코딩된 데이터 크기"        | 디코딩 성공 여부         |
| calculateLayoutPositions | 로그 단위 수정: "픽셀"           | 명확한 단위 표시         |

---

**현재 상태**: 디버그 로그 추가 완료, 테스트 대기 중
