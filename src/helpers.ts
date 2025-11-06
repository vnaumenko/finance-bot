import { months } from "./contants";
import { invariant } from "es-toolkit/util";

export const getSheetName = () => {
  const now = new Date();
  const monthName = months[now.getMonth()];
  const yearShort = (now.getFullYear() % 100).toString().padStart(2, "0");

  return `${monthName}'${yearShort}`;
};

export const parseAddTransactionMessage = (message: string) => {
  try {
    const [description, amount, category, wallet] = message
      .split(",")
      .map((part) => part.trim());

    invariant(description, "Описание не может быть пустым");
    invariant(amount, "Сумма не может быть пустой");
    invariant(category, "Категория не может быть пустой");
    invariant(wallet, "Кошелек не может быть пустым");

    return { description, amount, category, wallet };
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(
        "❌ Некорректный формат сообщения.\n\n" +
          `Ошибка: ${e.message}\n` +
          "Необходимый формат: описание, сумма, категория, кошелек\n" +
          "Пример: Продукты, 1500, Еда, Наличные"
      );
    }

    throw e;
  }
};

export const parseTransferTransactionMessage = (message: string) => {
  try {
    const [path, amount, description] = message
      .split(",")
      .map((part) => part.trim());

    invariant(path, "Путь не может быть пустым");
    invariant(amount, "Сумма не может быть пустой");

    const [from, to] = path.split(">").map((part) => part.trim());

    invariant(from, "Откуда не может быть пустым");
    invariant(to, "Куда не может быть пустым");

    return { from, to, amount, description };
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(
        "❌ Некорректный формат сообщения.\n\n" +
          `Ошибка: ${e.message}\n` +
          "Необходимый формат: откуда > куда, сумма, описание\n" +
          "Пример: Дебет > Кредит, 1000, оплата кредита"
      );
    }

    throw e;
  }
};

export const getFormattedBalance = (balance: string[][]) => {
  const { title, amount } = balance.reduce(
    (max, row) => ({
      title: Math.max(max.title, row[0]?.length || 0),
      amount: Math.max(max.amount, row[1]?.length || 0),
    }),
    { title: 0, amount: 0 }
  );

  return balance.map(
    (row) => `<code>${row[0]?.padEnd(title)} ${row[1]?.padStart(amount)}</code>`
  );
};
