import { months } from "./contants";
import { invariant } from "es-toolkit/util";

export const getSheetName = () => {
  const now = new Date();
  const monthName = months[now.getMonth()];
  const yearShort = (now.getFullYear() % 100).toString().padStart(2, "0");

  return `${monthName}'${yearShort}`;
};

export const parseMessage = (message: string) => {
  try {
    const partsMessage = message.split(",");

    const description = partsMessage[0]?.trim();
    invariant(description, "Описание не может быть пустым");

    let amount = partsMessage[1]?.trim();
    invariant(!isNaN(Number(amount)) && amount, "Сумма должна быть числом");
    amount = amount.replace(".", ",");

    const category = partsMessage[2]?.trim();
    invariant(category, "Категория не может быть пустой");

    const wallet = partsMessage[3]?.trim();
    invariant(wallet, "Кошелек не может быть пустым");

    return { description, amount, category, wallet };
  } catch (e) {
    return { error: (e as Error).message };
  }
};
