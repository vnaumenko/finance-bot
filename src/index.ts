import "dotenv/config";
import { Bot } from "grammy";
import { getLastRow, addRowData, getBalance, getFullBalance } from "./sheets";
import { getSheetName, parseMessage } from "./helpers";

const bot = new Bot(process.env.BOT_TOKEN || "");

// Обработка текстовых сообщений
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.message.from?.id;

  if (userId !== Number(process.env.ID_USER)) {
    await ctx.reply("❌ У вас нет доступа к этому боту.");
    return;
  }

  const sheetName = getSheetName();

  if (text === "Баланс") {
    const fullBalance = await getFullBalance(sheetName);

    await ctx.api.sendMessage(
      ctx.message.chat.id,
      `\`\`\`\n${fullBalance?.map((row) => row?.join(": ")).join("\n")}\`\`\``,
      {
        parse_mode: "MarkdownV2",
      }
    );

    return;
  }

  const parsedMessage = parseMessage(text);

  if ("error" in parsedMessage) {
    await ctx.reply(
      "❌ Некорректный формат сообщения.\n\n" +
        `Ошибка: ${parsedMessage.error}\n` +
        "Необходимый формат: описание, сумма, категория, кошелек\n" +
        "Пример: Продукты, 1500, Еда, Наличные"
    );
    return;
  }

  const { description, amount, category, wallet } = parsedMessage;

  try {
    const processingMessage = await ctx.reply("⏳ Обрабатываю...");

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

    await ctx.api.deleteMessage(
      processingMessage.chat.id,
      processingMessage.message_id
    );
  } catch (error) {
    await ctx.reply("❌ Произошла ошибка при добавлении данных.");
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error("Ошибка бота:", err);
});

// Запуск бота
bot.start();

console.log("Бот запущен!");
