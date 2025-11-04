/**
 * Import Images Pattern - Google Apps Script Backend
 * Sidebar를 열고 선택된 셀을 감지하는 기본 기능 구현
 */

/**
 * 스프레드시트 메뉴 추가 및 Sidebar 열기
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("이미지 패턴")
    .addItem("이미지 가져오기", "openSidebar")
    .addToUi();
}

/**
 * Sidebar 열기
 */
function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("sidebar")
    .setWidth(350)
    .setHeight(700);
  SpreadsheetApp.getUi().showModelessDialog(html, "이미지 패턴 배치");
}

/**
 * 현재 선택된 셀 정보 반환
 */
function getSelectedCellInfo() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) {
      return { success: false, error: "셀을 선택해주세요" };
    }

    const row = range.getRow();
    const col = range.getColumn();
    const address = range.getA1Notation().split(":")[0]; // 범위 선택 시 첫 셀만

    return {
      success: true,
      row: row,
      col: col,
      address: address,
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 선택된 셀의 픽셀 단위 크기 반환 (Phase 2)
 * @returns {Object} {width: number, height: number} 픽셀 단위
 */
function getSelectedCellDimensions() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();

    // 🚨 Emergency Fix: 상세 로그 추가
    Logger.log(`📐 셀 크기 읽기 시도: sheet=${sheet.getName()}`);

    if (!range) {
      // ✅ Fix: Logger.error → Logger.log
      Logger.log("❌ 셀 선택 안 됨");
      return { success: false, error: "셀을 선택해주세요" };
    }

    Logger.log(`📐 선택된 범위: ${range.getA1Notation()}`);

    // 구글 시트의 기본 셀 크기 (픽셀)
    // 행 높이: 약 21 픽셀 (기본값)
    // 열 너비: 약 88 픽셀 (기본값, 고정폭)
    const defaultRowHeight = 21;
    const defaultColWidth = 88;

    // 실제 행/열 크기 (필요시 API로 가져올 수 있음)
    const rowHeight = range.getRowHeight() || defaultRowHeight;
    const colWidth = range.getColumnWidth() || defaultColWidth;

    Logger.log(`📐 셀 크기 읽기 성공: ${colWidth}x${rowHeight}px`);

    return {
      success: true,
      width: colWidth,
      height: rowHeight,
    };
  } catch (e) {
    // ✅ Fix: Logger.error → Logger.log
    Logger.log(`❌ 셀 크기 읽기 오류: ${e.toString()}`);
    return { success: false, error: e.toString() };
  }
}

/**
 * 격자형 배치에 따른 셀 좌표 계산
 * @param {Object} settings - 배치 설정
 * @returns {Array<{row, col}>} 계산된 좌표 배열
 */
function calculateLayoutPositions(settings) {
  const {
    startRow,
    startCol,
    rows,
    cols,
    rowGap = 0,
    colGap = 0,
    inactiveCells = [],
  } = settings;

  const positions = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 실제 셀 좌표 계산 (간격 포함)
      const actualRow = startRow + r * (1 + rowGap);
      const actualCol = startCol + c * (1 + colGap);

      // 비활성 셀 확인
      const isInactive = inactiveCells[r] && inactiveCells[r][c];

      if (!isInactive) {
        positions.push({
          row: actualRow,
          col: actualCol,
          index: r * cols + c,
        });
      }
    }
  }

  return positions;
}

/**
 * 배치 로직 검증 (Phase 2)
 * @param {Object} settings - 배치 설정
 * @returns {Object} {valid: boolean, errors: string[]}
 */
function validateLayoutSettings(settings) {
  const errors = [];

  if (!settings.startRow || settings.startRow < 1) {
    errors.push("시작 행이 유효하지 않습니다.");
  }

  if (!settings.startCol || settings.startCol < 1) {
    errors.push("시작 열이 유효하지 않습니다.");
  }

  if (!settings.rows || settings.rows < 1 || settings.rows > 50) {
    errors.push("행 개수는 1~50 사이여야 합니다.");
  }

  if (!settings.cols || settings.cols < 1 || settings.cols > 50) {
    errors.push("열 개수는 1~50 사이여야 합니다.");
  }

  if (settings.rowGap < 0 || settings.rowGap > 20) {
    errors.push("행 간격은 0~20 사이여야 합니다.");
  }

  if (settings.colGap < 0 || settings.colGap > 20) {
    errors.push("열 간격은 0~20 사이여야 합니다.");
  }

  const availableCells = calculateAvailablePositions(settings);
  if (availableCells === 0) {
    errors.push("사용 가능한 셀이 없습니다.");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * 사용 가능한 셀 개수 계산 (비활성 셀 제외)
 * @param {Object} settings - 배치 설정
 * @returns {number} 사용 가능한 셀 개수
 */
function calculateAvailablePositions(settings) {
  const { rows, cols, inactiveCells = [] } = settings;
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isInactive = inactiveCells[r] && inactiveCells[r][c];
      if (!isInactive) {
        count++;
      }
    }
  }

  return count;
}

/**
 * 셀 배경색 설정
 * @param {Array<{row, col}>} cells - 셀 좌표 배열
 * @param {string} color - 색상 (16진수, 예: "#269444")
 */
function setCellBackgroundColors(cells, color) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();

    for (const cell of cells) {
      const range = sheet.getRange(cell.row, cell.col);
      range.setBackground(color);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 셀 배경색 초기화
 * @param {Array<{row, col, originalColor}>} cells - 원본 색상 정보 포함된 셀 배열
 */
function restoreOriginalColors(cells) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();

    for (const cell of cells) {
      const range = sheet.getRange(cell.row, cell.col);
      range.setBackground(cell.originalColor || "#ffffff");
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 프리뷰 색상 관련 함수들 (Phase 3에서 제거)
 * getCellBackgroundColors, applyPreviewColors, clearPreviewColors 제거됨
 */

/**
 * Undo 기능 호출
 */
function undoLastAction() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().undo();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============ Phase 6: 이미지 삽입 ============

/**
 * 이미지를 스프레드시트에 삽입합니다
 * @param {Array} images - 이미지 배열 (data URL)
 * @param {Object} startCell - 시작 셀 {row, col}
 * @param {Object} settings - 패턴 설정
 * @param {Array} positions - 계산된 배치 위치
 * @returns {Object} 삽입 결과
 */
function insertImages(images, startCell, settings, positions) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const results = [];

    Logger.log(
      `📍 이미지 삽입 시작: ${images.length}개 이미지, 위치: ${positions.length}개`
    );

    // 🚨 Emergency Fix: insertImages 시작 전 대기
    // 이전 API 호출(getSelectedCellDimensions 등)과의 간격 확보
    Logger.log("⏳ Rate Limit 방지: 2초 초기 대기 시작");
    Utilities.sleep(2000); // 2초 대기
    Logger.log("✅ 초기 대기 완료, 이미지 삽입 시작");

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const position = positions[i];

      try {
        // 각 이미지 사이 대기 (첫 이미지 제외, 이미 위에서 2초 대기함)
        if (i > 0) {
          Utilities.sleep(1500); // 1.5초 대기 (증가)
        }

        // 각 이미지 삽입
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
          address: String.fromCharCode(64 + position.col) + position.row,
        });

        Logger.log(
          `✅ ${i + 1}/${images.length} 이미지 삽입 완료 (${
            results[results.length - 1].address
          })`
        );
      } catch (e) {
        const errorMsg = e.toString();
        results.push({
          success: false,
          index: i,
          error: errorMsg,
        });
        Logger.log(`❌ 이미지 ${i + 1} 삽입 실패: ${errorMsg}`);

        // ⚠️ 429 에러가 발생하면 즉시 중단 (더 이상 재시도하지 않음)
        if (errorMsg.includes("429") || errorMsg.includes("Rate Limit")) {
          Logger.error(`🚨 Rate Limit 도달! 이미지 ${i + 1}부터 중단합니다.`);
          return {
            success: false,
            completed: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            total: images.length,
            error:
              "Google Apps Script Rate Limit 도달. 잠시 후 다시 시도해주세요.",
            results: results,
          };
        }
      }
    }

    const completedCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return {
      success: completedCount > 0,
      completed: completedCount,
      failed: failedCount,
      total: images.length,
      results: results,
    };
  } catch (e) {
    Logger.error("❌ 이미지 삽입 중 오류: " + e.toString());
    return {
      success: false,
      error: e.toString(),
    };
  }
}

/**
 * 단일 이미지를 지정된 셀에 삽입합니다
 * @param {Sheet} sheet - 스프레드시트 시트
 * @param {String} imageUrl - 이미지 data URL
 * @param {Number} row - 행 위치
 * @param {Number} col - 열 위치
 * @param {Number} width - 너비 (픽셀 단위 또는 1 = fitToCell)
 * @param {Number} height - 높이 (픽셀 단위 또는 1 = fitToCell)
 * @returns {Object} 삽입 결과
 */
function insertImageAtCell(sheet, imageUrl, row, col, width, height) {
  try {
    // 1. Data URL 검증
    if (!imageUrl || imageUrl.length === 0) {
      throw new Error("이미지 데이터가 비어있습니다");
    }

    // 문자열 형식 확인
    if (typeof imageUrl !== "string") {
      throw new Error("이미지 데이터 형식이 올바르지 않습니다");
    }

    // 2. Data URL 파싱
    let base64Data = null;
    let mimeType = "image/png"; // 기본값

    // data URL 형식인 경우
    if (imageUrl.includes("data:image")) {
      // MIME 타입 추출 (예: "data:image/jpeg;base64," → "image/jpeg")
      const mimeMatch = imageUrl.match(/data:(image\/[^;]+)/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1]; // 실제 MIME 타입 사용

        // ✅ Critical Fix #2: jpg → jpeg 정규화
        if (mimeType === "image/jpg") {
          mimeType = "image/jpeg";
          Logger.log("📝 MIME 타입 정규화: image/jpg → image/jpeg");
        }
      }

      Logger.log(`📄 MIME 타입 최종: ${mimeType}`);

      const matches = imageUrl.match(/base64,(.+)$/);
      if (!matches || !matches[1]) {
        throw new Error("Base64 데이터를 추출할 수 없습니다");
      }
      base64Data = matches[1];
    } else {
      // 직접 base64 데이터인 경우
      base64Data = imageUrl;
    }

    // Base64 데이터가 너무 짧으면 에러
    if (base64Data.length < 100) {
      throw new Error("이미지 데이터가 너무 작습니다");
    }

    Logger.log(`📦 Base64 데이터 길이: ${base64Data.length} 문자`);

    // 3. Base64 → Blob 변환
    let decodedData;
    try {
      decodedData = Utilities.base64Decode(base64Data);
    } catch (e) {
      throw new Error("Base64 디코딩 실패: " + e.toString());
    }

    // 디코딩된 데이터 검증
    if (!decodedData || decodedData.length === 0) {
      throw new Error("디코딩된 이미지 데이터가 없습니다");
    }

    Logger.log(`📦 디코딩된 데이터 크기: ${decodedData.length} 바이트`);

    // 파일 확장자 결정 (MIME 타입 기반)
    const fileExt = mimeType.includes("jpeg") ? "jpg" : "png";

    Logger.log(`📄 파일 정보: 확장자=${fileExt}, MIME=${mimeType}`);

    const imageBlob = Utilities.newBlob(
      decodedData,
      mimeType, // ✅ 동적 MIME 타입 사용
      `image_${row}_${col}.${fileExt}`
    );

    // Blob 검증
    if (!imageBlob || imageBlob.getBytes().length === 0) {
      throw new Error("Blob 변환 실패");
    }

    Logger.log(
      `✅ Blob 생성 성공: ${imageBlob.getName()} (${
        imageBlob.getBytes().length
      } bytes)`
    );

    // 4. 이미지 삽입
    const image = sheet.insertImage(imageBlob, col, row);

    Logger.log(`✅ 이미지 객체 생성 성공`);

    // 5. 크기 설정
    let widthPx = width;
    let heightPx = height;

    Logger.log(
      `📏 크기 설정 전: width=${width}, height=${height} (타입: ${typeof width}, ${typeof height})`
    );

    // width와 height가 모두 1이면 "셀 크기에 맞춤" 모드
    // 선택한 셀의 실제 픽셀 크기를 읽음
    if (width == 1 && height == 1) {
      // ✅ 정확한 비교 사용
      const range = sheet.getRange(row, col);
      widthPx = range.getColumnWidth(); // 실제 셀 너비 (픽셀)
      heightPx = range.getRowHeight(); // 실제 셀 높이 (픽셀)
      Logger.log(
        `✅ 셀 크기에 맞춤 활성화: 셀(${row},${col}) = ${widthPx}x${heightPx}px`
      );
      // 🚨 Emergency Fix: API 호출 후 지연 증가 (100ms → 300ms)
      Utilities.sleep(300);
    } else {
      Logger.log(
        `✅ 이미지 크기: ${widthPx}x${heightPx}px (직접 지정 또는 픽셀 단위)`
      );
    }

    image.setWidth(widthPx);
    image.setHeight(heightPx);

    Logger.log(
      `✅ 이미지 삽입 성공: (${row}, ${col}) - 최종 크기: ${widthPx}x${heightPx}px`
    );

    return {
      success: true,
      image: image,
      position: { row, col, width: widthPx, height: heightPx },
    };
  } catch (e) {
    Logger.error(`❌ 이미지 삽입 실패 (${row}, ${col}): ${e.toString()}`);
    throw e;
  }
}
