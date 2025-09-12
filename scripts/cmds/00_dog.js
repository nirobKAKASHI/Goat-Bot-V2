// commands/dog.js

const axios = require("axios");
const jimp = require("jimp");
const path = require("path");
const fs = require("fs-extra");

const VIP_FILE = path.join(__dirname, "vip.json");

module.exports = {
  config: {
    name: "dog",
    version: "2.0.0",
    author: "Kakashi + Optimized",
    countDown: 3,
    role: 0,
    shortDescription: "Turns someone into a dog (VIP only, FAST)",
    longDescription: "Puts the tagged/replied user's face on a dog template, VIP users only.",
    category: "fun",
    guide: {
      en: "{pn} @mention or reply"
    }
  },

  langs: {
    en: {
      noTag: "🐶 You must tag or reply to someone to dogify them!",
      notVip: "❌ | You are not a VIP user. Type !vip to see how to get VIP access."
    }
  },

  onStart: async function ({ event, message, api, getLang }) {
    try {
      // === VIP check ===
      let vipDB = [];
      if (fs.existsSync(VIP_FILE)) {
        try { vipDB = JSON.parse(fs.readFileSync(VIP_FILE)); } catch { vipDB = []; }
      }

      const senderID = event.senderID;
      const isVip = vipDB.some(
        user => user.uid === senderID && (user.expire === 0 || user.expire > Date.now())
      );
      if (!isVip) return message.reply(getLang("notVip"));
      // =================

      // Target user
      let targetID = Object.keys(event.mentions || {})[0];
      if (event.type === "message_reply") targetID = event.messageReply.senderID;
      if (!targetID) return message.reply(getLang("noTag"));

      // Dog template (cached in memory if already downloaded)
      const dogTemplateUrl = "https://raw.githubusercontent.com/kakashiNN/FUNNY-PHOTOS-/main/Dog2.jpeg";
      const dogBuffer = (await axios.get(dogTemplateUrl, { responseType: "arraybuffer" })).data;

      // User avatar (directly buffer, no fs save)
      const avatarBuffer = (
        await axios.get(
          `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;

      // Process images in memory
      const [bg, avatar] = await Promise.all([
        jimp.read(dogBuffer),
        jimp.read(avatarBuffer)
      ]);

      avatar.resize(200, 200).circle();
      bg.composite(avatar, 280, 400);

      // Save output into memory buffer instead of disk
      const resultBuffer = await bg.getBufferAsync(jimp.MIME_PNG);

      // Get user name
      const userInfo = await api.getUserInfo(targetID);
      const name = userInfo[targetID]?.name || "Someone";

      await message.reply({
        body: `🤣 ${name} এখন একেবারে আসল কুকুর! 🐶`,
        mentions: [{ tag: name, id: targetID }],
        attachment: resultBuffer
      });

    } catch (err) {
      console.error("🐶 Dog command error:", err);
      return message.reply("❌ Error while turning into dog.");
    }
  }
};
