import fs from "node:fs";
import { google } from "googleapis";
import { Settings } from "./types";

const credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Инициализация всех настроек для работы с Google Sheets
 */
export async function initializeSheets(): Promise<Settings> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    range: `settings!D2:E6`,
  });

  const valueRanges = response.data.values;

  if (!valueRanges || valueRanges.length === 0) {
    throw new Error("❌ Настройки не найдены");
  }

  const settings = valueRanges.reduce<Settings>((acc, curr) => {
    if (curr[0] === "Current Month") {
      acc.sheet = curr[1];
    }
    if (curr[0] === "Total balance") {
      acc.totalBalanceCell = curr[1];
    }
    if (curr[0] === "Day Limit") {
      acc.dayLimitCell = curr[1];
    }
    if (curr[0] === "Range Full Balance") {
      acc.rangeFullBalanceCell = curr[1];
    }
    return acc;
  }, {} as Settings);

  if (
    !settings.sheet ||
    !settings.totalBalanceCell ||
    !settings.dayLimitCell ||
    !settings.rangeFullBalanceCell
  ) {
    throw new Error("❌ Не все настройки получены");
  }

  return settings;
}

/**
 * Найти последнюю заполненную строку в указанной колонке
 */
export async function getLastRow(sheet: string, column: string): Promise<number> {
  // Читаем данные из колонки (например A:A - вся колонка A)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    range: `${sheet}!${column}:${column}`,
  });

  const values = response.data.values;
  if (!values || values.length === 0) {
    return 0; // Таблица пустая
  }

  return values.length; // Количество заполненных строк = номер последней строки
}

/**
 * Добавить данные в конкретные ячейки определенной строки
 */
export async function addRowData(
  sheet: string,
  rowNumber: number,
  columns: string[],
  values: any[],
) {
  // Создаем массив запросов для каждой ячейки
  const updates = columns.map((col, index) => ({
    range: `${sheet}!${col}${rowNumber}`,
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
}

/**
 * Получить баланс из указанного листа
 * Возвращает общий баланс и дневной лимит из конкретных ячеек
 */
export async function getBalance(sheet: string, totalBalanceCell: string, dailyLimitCell: string) {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    ranges: [`${sheet}!${totalBalanceCell}`, `${sheet}!${dailyLimitCell}`],
  });

  const valueRanges = response.data.valueRanges;

  const totalBalance = valueRanges?.[0]?.values?.[0]?.[0] || "—";
  const dailyLimit = valueRanges?.[1]?.values?.[0]?.[0] || "—";

  return {
    totalBalance,
    dailyLimit,
  };
}

export async function getFullBalance(sheet: string, rangeFullBalance: string) {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    ranges: [`${sheet}!${rangeFullBalance}`],
  });

  const valueRanges = response.data.valueRanges?.[0]?.values;

  return valueRanges;
}
