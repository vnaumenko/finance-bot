import "dotenv/config";
import { Bot, session } from "grammy";
import { getLastRow, addRowData, getBalance, getFullBalance } from "./sheets";
import {
  getFormattedBalance,
  getSheetName,
  parseAddTransactionMessage,
  parseTransferTransactionMessage,
} from "./helpers";
import { MyContext } from "./types";
import { invariant } from "es-toolkit";

const bot = new Bot<MyContext>(process.env.BOT_TOKEN || "");

await bot.api.setMyCommands([
  { command: "balance", description: "Показать баланс" },
  { command: "add", description: "Добавить расход" },
  { command: "transfer", description: "Перевести деньги между счетами" },
]);

bot.use(
  session({
    initial: () => ({
      sheetName: getSheetName(),
    }),
  })
);

bot.use((ctx, next) => {
  const userId = ctx.message?.from?.id;

  if (userId !== Number(process.env.ID_USER)) {
    return ctx.reply("❌ У вас нет доступа к этому боту.");
  }

  ctx.session.sheetName = getSheetName();

  return next();
});

bot.command("balance", async (ctx) => {
  let onDeleteProcessingMessage: (() => Promise<true>) | undefined;

  try {
    const chatId = ctx.message?.chat?.id;

    invariant(chatId, "❌ Не удалось получить ID чата.");

    const processingMessage = await ctx.reply("⏳ Ищу твои копейки...");
    onDeleteProcessingMessage = () =>
      ctx.api.deleteMessage(
        processingMessage.chat.id,
        processingMessage.message_id
      );

    const fullBalance = await getFullBalance(ctx.session.sheetName);

    invariant(fullBalance, "❌ Не удалось получить баланс.");

    const formattedBalance = getFormattedBalance(fullBalance);

    await ctx.api.sendMessage(chatId, formattedBalance.join("\n"), {
      parse_mode: "HTML",
    });
  } catch (e) {
    if (e instanceof Error) {
      await ctx.reply(e.message);
    } else {
      await ctx.reply("❌ Неизвестная ошибка.");
    }
  } finally {
    await onDeleteProcessingMessage?.();
  }
});

bot.command("add", async (ctx) => {
  let onDeleteProcessingMessage: (() => Promise<true>) | undefined;

  try {
    const processingMessage = await ctx.reply("⏳ Обрабатываю...");
    onDeleteProcessingMessage = () =>
      ctx.api.deleteMessage(
        processingMessage.chat.id,
        processingMessage.message_id
      );

    const text = ctx.match;
    const sheetName = ctx.session.sheetName;
    const parsedMessage = parseAddTransactionMessage(text);
    const { description, amount, category, wallet } = parsedMessage;
    const lastRow = await getLastRow(sheetName, "N");
    const nextRow = lastRow + 1;

    await addRowData(
      sheetName,
      nextRow,
      ["N", "O", "Q", "R", "S"],
      [
        new Date().toISOString().split("T")[0],
        description,
        amount.replaceAll(".", ","),
        category,
        wallet,
      ]
    );

    const { totalBalance, dailyLimit } = await getBalance(sheetName);

    await ctx.reply(
      `✅ Данные добавлены в лист ${sheetName}!\n\n` +
        `💰 Общий баланс: ${totalBalance}\n` +
        `💰 Можно потратить сегодня: ${dailyLimit}`
    );
  } catch (e) {
    if (e instanceof Error) {
      await ctx.reply(e.message);
    } else {
      await ctx.reply("❌ Неизвестная ошибка.");
    }
  } finally {
    await onDeleteProcessingMessage?.();
  }
});

bot.command("transfer", async (ctx) => {
  let onDeleteProcessingMessage: (() => Promise<true>) | undefined;

  try {
    const processingMessage = await ctx.reply("⏳ Перекидываю денюжки...");

    onDeleteProcessingMessage = () =>
      ctx.api.deleteMessage(
        processingMessage.chat.id,
        processingMessage.message_id
      );

    const text = ctx.match;
    const sheetName = ctx.session.sheetName;
    const parsedMessage = parseTransferTransactionMessage(text);
    const { from, to, amount, description } = parsedMessage;

    const lastRow = await getLastRow(sheetName, "AA");
    const nextRow = lastRow + 1;

    await addRowData(
      sheetName,
      nextRow,
      ["AA", "AB", "AC", "AD", "AE"],
      [
        new Date().toISOString().split("T")[0],
        from,
        to,
        amount.replaceAll(".", ","),
        description,
      ]
    );

    const { totalBalance, dailyLimit } = await getBalance(sheetName);

    await ctx.reply(
      `✅ Данные добавлены в лист ${sheetName}!\n\n` +
        `💰 Общий баланс: ${totalBalance}\n` +
        `💰 Можно потратить сегодня: ${dailyLimit}`
    );
  } catch (e) {
    if (e instanceof Error) {
      await ctx.reply(e.message);
    } else {
      await ctx.reply("❌ Неизвестная ошибка.");
    }
  } finally {
    await onDeleteProcessingMessage?.();
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error("Ошибка бота:", err);
});

// Запуск бота
bot.start();

console.log("Бот запущен!");
