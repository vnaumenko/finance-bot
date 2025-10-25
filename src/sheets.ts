import fs from "node:fs";
import { google } from "googleapis";

const credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Найти последнюю заполненную строку в указанной колонке
 */
export async function getLastRow(
  sheetName: string,
  column: string = "A"
): Promise<number> {
  try {
    // Читаем данные из колонки (например A:A - вся колонка A)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: `${sheetName}!${column}:${column}`,
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return 0; // Таблица пустая
    }

    return values.length; // Количество заполненных строк = номер последней строки
  } catch (error) {
    console.error("Ошибка при получении последней строки:", error);
    return 0;
  }
}

/**
 * Добавить данные в конкретные ячейки определенной строки
 */
export async function addRowData(
  sheetName: string,
  rowNumber: number,
  columns: string[],
  values: any[]
) {
  try {
    // Создаем массив запросов для каждой ячейки
    const updates = columns.map((col, index) => ({
      range: `${sheetName}!${col}${rowNumber}`,
      values: [[values[index]]],
    }));

    // Используем batchUpdate для обновления нескольких ячеек одновременно
    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении данных:", error);
    throw error;
  }
}

/**
 * Получить информацию о таблице и её листах
 */
export async function getSpreadsheetInfo() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    });

    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map((sheet) => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
        index: sheet.properties?.index,
      })),
    };
  } catch (error) {
    console.error("Ошибка при получении информации о таблице:", error);
    throw error;
  }
}

/**
 * Получить баланс из указанного листа
 * Возвращает общий баланс и дневной лимит из конкретных ячеек
 */
export async function getBalance(
  sheetName: string,
  totalBalanceCell: string = "C26",
  dailyLimitCell: string = "C28"
) {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    ranges: [
      `${sheetName}!${totalBalanceCell}`,
      `${sheetName}!${dailyLimitCell}`,
    ],
  });

  const valueRanges = response.data.valueRanges;

  const totalBalance = valueRanges?.[0]?.values?.[0]?.[0] || "—";
  const dailyLimit = valueRanges?.[1]?.values?.[0]?.[0] || "—";

  return {
    totalBalance,
    dailyLimit,
  };
}

export async function getFullBalance(sheetName: string) {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    ranges: [`${sheetName}!A2:B23`],
  });

  const valueRanges = response.data.valueRanges?.[0]?.values;

  return valueRanges;
}
