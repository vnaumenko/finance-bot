/**
 * Типы для работы бота
 */

export interface FinanceEntry {
  date?: string;
  category?: string;
  amount?: number;
  description?: string;
  [key: string]: string | number | undefined;
}

export interface ParsedData {
  fields: string[];
  values: (string | number)[];
}

