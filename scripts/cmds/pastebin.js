const PastebinAPI = require('pastebin-js');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "pastebin",
    version: "1.3",
    aliases: ["p-bin", "bin"],
    author: "SANDIP + Arijit",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Upload files to Pastebin (Owner only)" },
    longDescription: { en: "Only Arijit (bot owner) can upload files to Pastebin and get a shareable link." },
    category: "owner",
    guide: { en: "Use: !pastebin <filename>\nExample: !pastebin mycmd.js\nFile must be in 'cmds' folder." }
  },

  onStart: async function ({ api, event, args }) {
    const ownerID = "61572240295227";

    // ❌ Owner check
    if (event.senderID !== ownerID) {
      return api.sendMessage(
        "❌ ওহো! এই কমান্ডটা শুধু আমার মালিকের জন্য 💖",
        event.threadID,
        event.messageID
      );
    }

    // ❌ No filename
    if (!args[0]) {
      return api.sendMessage(
        "❌ ওহ! প্রথমে আমাকে ফাইলের নাম তো দাও 😹",
        event.threadID,
        event.messageID
      );
    }

    const pastebin = new PastebinAPI({
      api_dev_key: 'LFhKGk5aRuRBII5zKZbbEpQjZzboWDp9'
    });

    const fileName = args[0].replace(/\.js$/, ""); 
    const filePath = path.join(__dirname, '..', 'cmds', fileName + '.js');

    // ❌ File not found
    if (!fs.existsSync(filePath)) {
      return api.sendMessage(
        `❌ হায়! '${fileName}.js' নামে কোনো ফাইল cmds ফোল্ডারে খুঁজে পাচ্ছি না 😿`,
        event.threadID,
        event.messageID
      );
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');

      const pasteUrl = await pastebin.createPaste({
        text: data,
        title: fileName,
        format: "text",
        privacy: 1 // unlisted
      });

      // Create raw link
      const pasteID = pasteUrl.split("/").pop();
      const rawUrl = `https://pastebin.com/raw/${pasteID}`;

      // ✅ Success message - এখন dynamic fileName আসবে
      const message = `✨ 𝗬𝗔𝗬! ফাইল আপলোড সম্পন্ন হয়েছে ✨
🎶 Filename: "${fileName}.js"
🔗 Link: ${rawUrl}`;

      api.sendMessage(message, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ অয় অয়… ফাইল আপলোড করতে গিয়ে সমস্যা হয়ে গেছে 😢",
        event.threadID,
        event.messageID
      );
    }
  }
};
