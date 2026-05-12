const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

// =========================
// BOT TOKEN
// =========================

const BOT_TOKEN = "8779470611:AAE6MnR-n0jOsvDKGBvV9aHqeyPXNzZeteI";

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});

// =========================
// CHANNEL SETTINGS
// =========================

const CHANNEL_USERNAME = "@Digiwordls";
const CHANNEL_LINK = "https://t.me/Digiwordls";

// =========================
// CHECK JOIN
// =========================

async function isJoined(userId) {
  try {
    const member = await bot.getChatMember(
      CHANNEL_USERNAME,
      userId
    );

    return (
      member.status === "member" ||
      member.status === "administrator" ||
      member.status === "creator"
    );
  } catch (e) {
    console.log(e);
    return false;
  }
}

// =========================
// START MENU
// =========================

async function sendMenu(chatId, firstName, userId) {
  const joined = await isJoined(userId);

  if (!joined) {
    return bot.sendMessage(
      chatId,
      "⚠️ Please join our channel first.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📢 Join Channel",
                url: CHANNEL_LINK,
              },
            ],
            [
              {
                text: "✅ Verify",
                callback_data: "verify",
              },
            ],
          ],
        },
      }
    );
  }

  bot.sendMessage(
    chatId,
    `🔥 Welcome ${firstName}!`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 Create Link",
              callback_data: "create",
            },
          ],
          [
            {
              text: "📖 Help",
              callback_data: "help",
            },
          ],
        ],
      },
    }
  );
}

// =========================
// MESSAGES
// =========================

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text === "/start") {
    return sendMenu(
      chatId,
      msg.from.first_name,
      userId
    );
  }

  if (msg.text === "/help") {
    return bot.sendMessage(
      chatId,
      `
📖 Commands

/start - Start bot
/help - Help menu
/create - Create utility link
`
    );
  }

  if (msg.text === "/create") {
    return bot.sendMessage(
      chatId,
      "✅ Feature enabled."
    );
  }
});

// =========================
// CALLBACKS
// =========================

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  bot.answerCallbackQuery(query.id);

  if (query.data === "verify") {
    const joined = await isJoined(userId);

    if (!joined) {
      return bot.sendMessage(
        chatId,
        "❌ You still haven't joined."
      );
    }

    return sendMenu(
      chatId,
      query.from.first_name,
      userId
    );
  }

  if (query.data === "help") {
    return bot.sendMessage(
      chatId,
      "📖 Use /create to use features."
    );
  }

  if (query.data === "create") {
    return bot.sendMessage(
      chatId,
      "🌐 Create feature clicked."
    );
  }
});

// =========================
// EXPRESS
// =========================

app.get("/", (req, res) => {
  res.send("✅ Bot Running");
});

// =========================
// PORT
// =========================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `✅ Server Running On Port ${PORT}`
  );
});
