const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===================================
// BOT TOKEN
// ===================================

const BOT_TOKEN = "8779470611:AAE6MnR-n0jOsvDKGBvV9aHqeyPXNzZeteI";

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});

// ===================================
// CHANNEL SETTINGS
// ===================================

const CHANNEL_USERNAME = "@Digiwordls";
const CHANNEL_LINK = "https://t.me/Digiwordls";

// ===================================
// HOST URL
// ===================================

const hostURL = "https://google-co-file.onrender.com";

// ===================================
// CHECK JOIN
// ===================================

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

// ===================================
// SEND MENU
// ===================================

async function sendMenu(chatId, firstName, userId) {
  const joined = await isJoined(userId);

  if (!joined) {
    return bot.sendMessage(
      chatId,
      `⚠️ Please join our channel first.`,
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
                callback_data: "verify_join",
              },
            ],
          ],
        },
      }
    );
  }

  bot.sendMessage(
    chatId,
    `
🔥 Welcome ${firstName}

━━━━━━━━━━━━━━
⚡ Utility Telegram Bot
━━━━━━━━━━━━━━

Choose an option below 👇
`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 Create Link",
              callback_data: "create_link",
            },
          ],
          [
            {
              text: "📖 Help",
              callback_data: "help",
            },
            {
              text: "ℹ️ About",
              callback_data: "about",
            },
          ],
        ],
      },
    }
  );
}

// ===================================
// CREATE NEW
// ===================================

function createNew(chatId) {
  bot.sendMessage(chatId, "🌐 Send your URL", {
    reply_markup: {
      force_reply: true,
    },
  });
}

// ===================================
// CREATE LINK
// ===================================

function createLink(chatId, url) {
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {
    return bot.sendMessage(
      chatId,
      "⚠️ Please send a valid URL."
    );
  }

  const encoded = Buffer.from(url).toString(
    "base64"
  );

  const finalLink = `${hostURL}/go/${encoded}`;

  bot.sendMessage(
    chatId,
    `
✅ Link Created Successfully

🌍 Original URL:
${url}

━━━━━━━━━━━━━━

🔗 Generated Link:
${finalLink}
`
  );
}

// ===================================
// BOT MESSAGES
// ===================================

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Force Join
  const joined = await isJoined(userId);

  if (!joined && msg.text !== "/start") {
    return bot.sendMessage(
      chatId,
      "⚠️ Join the channel first.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📢 Join Channel",
                url: CHANNEL_LINK,
              },
            ],
          ],
        },
      }
    );
  }

  // Reply URL
  if (
    msg.reply_to_message &&
    msg.reply_to_message.text ===
      "🌐 Send your URL"
  ) {
    return createLink(chatId, msg.text);
  }

  // Start
  if (msg.text === "/start") {
    return sendMenu(
      chatId,
      msg.from.first_name,
      userId
    );
  }

  // Create
  if (msg.text === "/create") {
    return createNew(chatId);
  }

  // Help
  if (msg.text === "/help") {
    return bot.sendMessage(
      chatId,
      `
📖 HOW TO USE

1️⃣ Send /create

2️⃣ Send your URL

3️⃣ Bot generates a custom link
`
    );
  }
});

// ===================================
// CALLBACKS
// ===================================

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  bot.answerCallbackQuery(query.id);

  // Verify
  if (query.data === "verify_join") {
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

  // Create
  if (query.data === "create_link") {
    return createNew(chatId);
  }

  // Help
  if (query.data === "help") {
    return bot.sendMessage(
      chatId,
      `
📖 Help Menu

/create - Create a new link
/help - Open help
`
    );
  }

  // About
  if (query.data === "about") {
    return bot.sendMessage(
      chatId,
      `
ℹ️ About Bot

⚡ Built using:
• NodeJS
• Express
• Telegram Bot API
`
    );
  }
});

// ===================================
// REDIRECT ROUTE
// ===================================

app.get("/go/:url", (req, res) => {
  try {
    const decoded = Buffer.from(
      req.params.url,
      "base64"
    ).toString("utf-8");

    return res.redirect(decoded);
  } catch {
    return res.send("Invalid URL");
  }
});

// ===================================
// HOME
// ===================================

app.get("/", (req, res) => {
  res.send("✅ Bot Running");
});

// ===================================
// SERVER
// ===================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `✅ Server Running On Port ${PORT}`
  );
});
