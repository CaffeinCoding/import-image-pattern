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
 * 선택된 셀의 실제 픽셀 크기 반환
 * @returns {Object} {width: number, height: number} 픽셀 단위
 */
function getSelectedCellDimensions() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) {
      Logger.log("❌ 셀 선택 안 됨");
      return { success: false, error: "셀을 선택해주세요" };
    }

    const notation = range.getA1Notation();
    const startRow = range.getRow();
    const startCol = range.getColumn();
    const numRows = range.getNumRows();
    const numCols = range.getNumColumns();

    Logger.log(`📐 선택된 범위: ${notation} (${numRows}행 × ${numCols}열)`);

    // ✅ 실제 셀 크기 계산
    // getColumnWidth()와 getRowHeight()는 이미 픽셀 단위를 반환합니다
    let totalWidth = 0;
    let totalHeight = 0;

    // 각 열의 실제 너비 합산 (픽셀 단위)
    for (let c = 0; c < numCols; c++) {
      const colIndex = startCol + c;
      const widthInPixels = sheet.getColumnWidth(colIndex);
      totalWidth += widthInPixels;

      if (numCols <= 3) {
        Logger.log(`📏 열 ${colIndex}: ${widthInPixels}px`);
      }
    }

    // 각 행의 실제 높이 합산 (픽셀 단위)
    for (let r = 0; r < numRows; r++) {
      const rowIndex = startRow + r;
      const heightInPixels = sheet.getRowHeight(rowIndex);
      totalHeight += heightInPixels;

      if (numRows <= 3) {
        Logger.log(`📏 행 ${rowIndex}: ${heightInPixels}px`);
      }
    }

    Logger.log(`✅ 최종 셀 크기: ${totalWidth}px × ${totalHeight}px`);

    return {
      success: true,
      width: totalWidth,
      height: totalHeight,
      numRows: numRows,
      numCols: numCols,
      isMerged: numRows > 1 || numCols > 1,
    };
  } catch (e) {
    const errorMsg = e.toString();
    Logger.log(`❌ 셀 크기 읽기 오류: ${errorMsg}`);

    return {
      success: false,
      error: errorMsg,
      width: 117,
      height: 28,
    };
  }
}

/**
 * 격자형 배치에 따른 셀 좌표 계산
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
      const actualRow = startRow + r * (1 + rowGap);
      const actualCol = startCol + c * (1 + colGap);

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
 * ❌ 제거됨: validateLayoutSettings
 * 프론트엔드에서 직접 검증하도록 변경되어 더 이상 사용되지 않음
 */

/**
 * ❌ 제거됨: calculateAvailablePositions
 * 프론트엔드에서 직접 계산하도록 변경되어 더 이상 사용되지 않음
 */

/**
 * 셀 배경색 설정
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

/**
 * 이미지를 스프레드시트에 삽입합니다
 */
function insertImages(images, startCell, settings, positions) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const results = [];
    let successCount = 0;

    const startTime = new Date().getTime();
    Logger.log(
      `📍 이미지 삽입 시작: ${images.length}개 이미지, 위치: ${positions.length}개`
    );
    Logger.log(`🖼️  이미지 형식: ${images[0]?.mimeType || "unknown"}`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const position = positions[i];

      try {
        // 최적화: 대기 시간 제거 (Rate Limit 발생 시에만 처리)

        const response = insertImageAtCell(
          sheet,
          image.data,
          image.mimeType || "image/webp",
          position.row,
          position.col,
          position.width,
          position.height
        );

        successCount++;
        results.push({
          success: true,
          index: i,
          position: position,
          address: String.fromCharCode(64 + position.col) + position.row,
        });

        Logger.log(`✅ ${i + 1}/${images.length} 완료`);
      } catch (e) {
        const errorMsg = e.toString();
        results.push({
          success: false,
          index: i,
          error: errorMsg,
        });
        Logger.log(`❌ 이미지 ${i + 1} 삽입 실패: ${errorMsg}`);

        if (errorMsg.includes("429") || errorMsg.includes("Rate Limit")) {
          Logger.log(`🚨 Rate Limit 도달! 이미지 ${i + 1}부터 중단합니다.`);

          Utilities.sleep(100);

          return {
            success: false,
            completed: successCount,
            failed: results.filter((r) => !r.success).length,
            total: images.length,
            error:
              "Google Apps Script Rate Limit 도달. 잠시 후 다시 시도해주세요.",
            results: results,
          };
        }
      }
    }

    const failedCount = results.filter((r) => !r.success).length;

    // ✅ 모든 이미지 삽입 완료 후 한 번에 flush
    Logger.log("✨ 스프레드시트 변경사항 반영 중...");
    SpreadsheetApp.flush();
    Logger.log("✅ 변경사항 반영 완료");

    const endTime = new Date().getTime();
    const totalTime = (endTime - startTime) / 1000;

    // ✅ 성능 로깅
    Logger.log("=== 📊 성능 분석 ===");
    Logger.log(`총 처리 시간: ${totalTime.toFixed(2)}초`);
    Logger.log(`이미지당 평균: ${(totalTime / images.length).toFixed(2)}초`);
    Logger.log(`성공: ${successCount}개 / 실패: ${failedCount}개`);
    Logger.log("=== 종료 ===");

    return {
      success: true,
      completed: successCount,
      failed: failedCount,
      total: images.length,
      processingTimeSeconds: parseFloat(totalTime.toFixed(2)),
      results: results,
    };
  } catch (e) {
    Logger.log("❌ 이미지 삽입 중 오류: " + e.toString());
    return {
      success: false,
      error: e.toString(),
    };
  }
}

/**
 * 단일 이미지를 지정된 셀에 삽입합니다
 * @param {Sheet} sheet - 대상 시트
 * @param {string} base64Data - 순수 base64 문자열 (파싱 불필요)
 * @param {string} mimeType - 이미지 MIME 타입 (예: 'image/png', 'image/jpeg', 'image/webp')
 * @param {number} row - 행 번호
 * @param {number} col - 열 번호
 * @param {number} width - 이미지 너비 (픽셀)
 * @param {number} height - 이미지 높이 (픽셀)
 */
function insertImageAtCell(
  sheet,
  base64Data,
  mimeType,
  row,
  col,
  width,
  height
) {
  try {
    // 유효성 검증
    if (!base64Data || base64Data.length === 0) {
      throw new Error("이미지 데이터가 비어있습니다");
    }

    if (typeof base64Data !== "string") {
      throw new Error("이미지 데이터 형식이 올바르지 않습니다");
    }

    if (base64Data.length < 100) {
      throw new Error("이미지 데이터가 너무 작습니다");
    }

    // ✅ MIME 타입 정규화 (JPEG 중심)
    if (mimeType === "image/jpg") {
      mimeType = "image/jpeg";
    } else if (mimeType === "image/webp") {
      // WebP는 지원 안 함 - JPEG로 변환하도록 클라이언트에서 처리
      Logger.log(`⚠️ WebP 형식 감지 → JPEG로 처리됨`);
      mimeType = "image/jpeg";
    } else if (!mimeType || mimeType === "image/png") {
      mimeType = "image/png";
    }

    Logger.log(`📋 이미지 형식: ${mimeType}`);

    // Base64 디코딩
    let decodedData;
    try {
      decodedData = Utilities.base64Decode(base64Data);
    } catch (e) {
      throw new Error("Base64 디코딩 실패: " + e.toString());
    }

    if (!decodedData || decodedData.length === 0) {
      throw new Error("디코딩된 이미지 데이터가 없습니다");
    }

    // ✅ 파일 확장자 결정 (WebP 지원 추가)
    let fileExt = "png"; // 기본값
    if (mimeType.includes("jpeg")) {
      fileExt = "jpg";
    } else if (mimeType.includes("webp")) {
      fileExt = "webp";
    }

    // Blob 생성
    const imageBlob = Utilities.newBlob(
      decodedData,
      mimeType,
      `image_${row}_${col}.${fileExt}`
    );

    if (!imageBlob || imageBlob.getBytes().length === 0) {
      throw new Error("Blob 변환 실패");
    }

    // 이미지 삽입 및 크기 설정
    // setWidth()와 setHeight()는 픽셀 단위를 사용합니다
    const image = sheet.insertImage(imageBlob, col, row);
    image.setWidth(width);
    image.setHeight(height);

    Logger.log(
      `✅ [삽입 완료] (${row}, ${col}) - 형식: ${fileExt} | 크기: ${width}px × ${height}px`
    );

    return {
      success: true,
      image: image,
      position: { row, col, width, height },
    };
  } catch (e) {
    Logger.log(`❌ 이미지 삽입 실패 (${row}, ${col}): ${e.toString()}`);
    throw e;
  }
}
