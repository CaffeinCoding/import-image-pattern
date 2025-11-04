# 🔥 Hotfix: Logger.error 오류 수정

**발생일**: 2025년 11월  
**상태**: ✅ 수정 완료  
**심각도**: 🔴 Critical

---

## 🔴 **발생한 오류**

### 에러 메시지

```
ScriptError: TypeError: Logger.error is not a function
```

### 발생 위치

- `Code.gs` - `getSelectedCellDimensions()` 함수

---

## 💡 **원인 분석**

### **Google Apps Script Logger API 제한**

Google Apps Script의 `Logger` 객체는 **`error()` 메서드를 지원하지 않습니다**.

#### 지원하는 메서드

```javascript
Logger.log(message); // ✅ 지원
Logger.clear(); // ✅ 지원
Logger.getLog(); // ✅ 지원
```

#### 지원하지 않는 메서드

```javascript
Logger.error(message); // ❌ 지원 안 함
Logger.warn(message); // ❌ 지원 안 함
Logger.info(message); // ❌ 지원 안 함
Logger.debug(message); // ❌ 지원 안 함
```

**참고**: Node.js의 `console` API와 혼동하지 않도록 주의!

---

## 🔧 **수정 내용**

### **Before (오류)**

```javascript
function getSelectedCellDimensions() {
  try {
    // ...
    if (!range) {
      Logger.error("❌ 셀 선택 안 됨"); // ❌ 에러 발생!
      return { success: false, error: "셀을 선택해주세요" };
    }
    // ...
  } catch (e) {
    Logger.error(`❌ 셀 크기 읽기 오류: ${e.toString()}`); // ❌ 에러 발생!
    return { success: false, error: e.toString() };
  }
}
```

### **After (수정)**

```javascript
function getSelectedCellDimensions() {
  try {
    // ...
    if (!range) {
      Logger.log("❌ 셀 선택 안 됨"); // ✅ 정상 작동
      return { success: false, error: "셀을 선택해주세요" };
    }
    // ...
  } catch (e) {
    Logger.log(`❌ 셀 크기 읽기 오류: ${e.toString()}`); // ✅ 정상 작동
    return { success: false, error: e.toString() };
  }
}
```

---

## 📝 **변경 사항**

| 위치                                  | 변경 전        | 변경 후      |
| ------------------------------------- | -------------- | ------------ |
| `getSelectedCellDimensions()` 라인 67 | `Logger.error` | `Logger.log` |
| `getSelectedCellDimensions()` 라인 92 | `Logger.error` | `Logger.log` |

---

## ✅ **효과**

- ✅ `getSelectedCellDimensions()` 정상 작동
- ✅ 셀 크기 읽기 기능 복구
- ✅ "셀의 크기에 맞춤" 기능 정상화

---

## 🧪 **테스트**

### **테스트 시나리오**

```
전제조건:
- PNG 이미지 1개 선택
- "셀의 크기에 맞춤" ✓ 체크
- B2 셀 선택

동작:
1. 완료 버튼 클릭
2. Apps Script 로그 확인

예상 결과:
✅ 로그: "📐 셀 크기 읽기 시도: sheet=시트1"
✅ 로그: "📐 선택된 범위: B2"
✅ 로그: "📐 셀 크기 읽기 성공: 100x21px"
✅ 에러 없이 정상 작동
```

---

## 📚 **교훈**

### **Google Apps Script Logger 사용 가이드**

#### ✅ 올바른 사용법

```javascript
// 일반 로그
Logger.log("정보 메시지");

// 에러 로그 (접두어 사용)
Logger.log("❌ 에러: " + errorMessage);

// 경고 로그 (접두어 사용)
Logger.log("⚠️ 경고: " + warningMessage);

// 디버그 로그 (접두어 사용)
Logger.log("🐛 디버그: " + debugInfo);
```

#### ❌ 잘못된 사용법

```javascript
Logger.error("에러 메시지"); // TypeError 발생!
Logger.warn("경고 메시지"); // TypeError 발생!
Logger.info("정보 메시지"); // TypeError 발생!
Logger.debug("디버그 메시지"); // TypeError 발생!
```

### **대안: console 객체 사용**

Google Apps Script는 `console` 객체도 지원합니다 (V8 런타임):

```javascript
console.log("일반 로그");
console.error("에러 로그"); // ✅ 지원됨
console.warn("경고 로그"); // ✅ 지원됨
console.info("정보 로그"); // ✅ 지원됨
```

**참고**: `console` 로그는 Google Cloud Console에서 확인 가능합니다.

---

## 🚀 **배포**

```bash
cd C:\Users\jinte\Desktop\projects\import-image-pattern
clasp push
```

---

**상태**: Hotfix 완료 ✅  
**다음 단계**: 배포 → 테스트 → 확인

**준비 완료!** 🚀
