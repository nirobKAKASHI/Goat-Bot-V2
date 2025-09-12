const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

const helpImages = [
  "https://files.catbox.moe/wseew7.jpg",
  "https://files.catbox.moe/tywnfi.jpg",
  "https://files.catbox.moe/tse9uk.jpg",
  "https://files.catbox.moe/l8d5af.jpg",
  "https://files.catbox.moe/hgmwuw.jpg",
  "https://files.catbox.moe/gu6m57.jpg",
  "https://files.catbox.moe/t366ko.jpg",
  "https://files.catbox.moe/pto5xi.jpg",
  "https://files.catbox.moe/td2723.jpg",
  "https://files.catbox.moe/y5kplz.jpg"
];

function getRandomImage() {
  return helpImages[Math.floor(Math.random() * helpImages.length)];
}

function buildCategory(catName, commands, prefix) {
  const cmdList = commands.map(c => `${prefix}${c}`).join("   ");
  return `───────────────\n📂 ${catName}\n${cmdList}\n───────────────\n`;
}

module.exports = {
  config: {
    name: "help",
    version: "2.3",
    author: "ＮＩＲＯＢ",
    role: 0,
    shortDescription: { en: "Help menu with 🖤 pagination & command info" },
    longDescription: { en: "Shows commands by category with images or specific command info." },
    category: "info",
    guide: { en: "{pn} [1-10] or {pn} <commandName>" },
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID) || global.GoatBot.config.prefix || "!";

    // যদি কোনো specific command উল্লেখ করা হয়
    if (args[0] && isNaN(args[0])) {
      const query = args[0].toLowerCase().trim();
      const cmd = commands.get(query);

      if (!cmd) return message.reply(`❌ Command "${query}" পাওয়া যায়নি.`);

      const info = cmd.config || {};
      return message.reply(
`｡･:*:･ﾟ★,｡･:*:･ﾟ♡
   🌸 Command Info 🌸
｡･:*:･ﾟ♡,｡･:*:･ﾟ★

💖 Command: ${info.name || query}
🎀 Author: ${info.author || "Unknown"}
🧸 Modifier: ${info.modifier || "None"}
📂 Category: ${info.category || "Uncategorized"}
📝 Description: ${info.description || "No description"}
🍬 Usage: ${prefix}${info.usage || info.name || query}
${info.extra ? `📝 Extra: ${info.extra}` : ""}
｡･:*:･ﾟ★,｡･:*:･ﾟ♡`
      );
    }

    // Pagination system for all commands
    let page = 1;
    if (args.length > 0) {
      const p = parseInt(args[0]);
      if (!isNaN(p) && p >= 1 && p <= 10) page = p;
    }

    const availableCommands = [];
    for (const [name, cmd] of commands) {
      if (cmd.config.role > role) continue;
      availableCommands.push(cmd);
    }

    const categories = {};
    for (const cmd of availableCommands) {
      const cat = cmd.config.category || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    const allCategories = Object.keys(categories);
    const totalPages = 10;
    const perPage = Math.ceil(allCategories.length / totalPages);

    async function sendPage(p, oldMessageID = null) {
      const startIndex = (p - 1) * perPage;
      const endIndex = startIndex + perPage;
      const pageCategories = allCategories.slice(startIndex, endIndex);

      let msg = `🐾 Kakashi Help Menu 🐾\nPage ${p}/${totalPages}\n────────────────────────────\n`;
      for (const cat of pageCategories) {
        msg += buildCategory(cat, categories[cat], prefix);
      }

      let nextPage = p + 1;
      if (nextPage > totalPages) nextPage = 1;

      msg += `────────────────────────────
Dev: Nirob | Nick: Kakashi
FB: https://facebook.com/hatake.kakashi.NN

React 🖤 to go next page
or type: ${prefix}help ${nextPage}
────────────────────────────`;

      const sentMsg = await message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(getRandomImage())
      });

      if (oldMessageID) {
        try { await global.GoatBot.api.unsendMessage(oldMessageID); } catch (e) {}
      }

      global.GoatBot.onReaction.set(sentMsg.messageID, {
        messageObj: message,
        onReact: async (eventReact) => {
          if (eventReact.reaction !== '🖤') return;

          let nextPage = p + 1;
          if (nextPage > totalPages) nextPage = 1;

          await sendPage(nextPage, sentMsg.messageID);
        }
      });
    }

    await sendPage(page);
  }
};
