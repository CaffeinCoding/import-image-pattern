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

    if (!range) {
      return { success: false, error: "셀을 선택해주세요" };
    }

    // 구글 시트의 기본 셀 크기 (픽셀)
    // 행 높이: 약 21 픽셀 (기본값)
    // 열 너비: 약 88 픽셀 (기본값, 고정폭)
    const defaultRowHeight = 21;
    const defaultColWidth = 88;

    // 실제 행/열 크기 (필요시 API로 가져올 수 있음)
    const rowHeight = range.getRowHeight() || defaultRowHeight;
    const colWidth = range.getColumnWidth() || defaultColWidth;

    return {
      success: true,
      width: colWidth,
      height: rowHeight,
    };
  } catch (e) {
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
 * 셀 배경색 조회 (Phase 3)
 * @param {Array<{row, col}>} cells - 셀 좌표 배열
 * @returns {Array<{row, col, color}>} 각 셀의 배경색
 */
function getCellBackgroundColors(cells) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const colors = [];

    for (const cell of cells) {
      const range = sheet.getRange(cell.row, cell.col);
      colors.push({
        row: cell.row,
        col: cell.col,
        color: range.getBackground(),
      });
    }

    return { success: true, colors: colors };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 프리뷰 배경색 일괄 설정 (Phase 3)
 * @param {Array} imageCells - 이미지 셀 배열
 * @param {Array} inactiveCells - 비활성 셀 배열
 * @param {Object} selectedCell - 선택된 셀 정보
 */
function applyPreviewColors(imageCells, inactiveCells, selectedCell) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const COLORS = {
      selected: "#196fe1", // 선택 셀 (파란색)
      inactive: "#7c7c7c", // 비활성 셀 (회색)
      image: "#269444", // 이미지 셀 (초록색)
      mixed: "#0d4a6d", // 혼합 (선택 + 비활성)
    };

    // 1. 이미지 셀에 초록색 적용
    for (const cell of imageCells) {
      const range = sheet.getRange(cell.row, cell.col);
      range.setBackground(COLORS.image);
    }

    // 2. 비활성 셀에 회색 적용 (이미지 셀 제외)
    for (const cell of inactiveCells) {
      const isImageCell = imageCells.some(
        (img) => img.row === cell.row && img.col === cell.col
      );
      if (!isImageCell) {
        const range = sheet.getRange(cell.row, cell.col);
        range.setBackground(COLORS.inactive);
      }
    }

    // 3. 선택 셀에 파란색 적용 (우선순위 최고)
    if (selectedCell) {
      const range = sheet.getRange(selectedCell.row, selectedCell.col);

      // 선택 셀이 비활성 셀이면 혼합 색상
      const isInactive = inactiveCells.some(
        (cell) => cell.row === selectedCell.row && cell.col === selectedCell.col
      );

      range.setBackground(isInactive ? COLORS.mixed : COLORS.selected);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 프리뷰 색상 제거 및 원본 색상 복구 (Phase 3)
 * @param {Array} previewCells - 프리뷰 대상이었던 셀들
 */
function clearPreviewColors(previewCells) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();

    for (const cell of previewCells) {
      const range = sheet.getRange(cell.row, cell.col);
      // 원본 색상으로 복구
      range.setBackground(cell.originalColor || "#ffffff");
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
