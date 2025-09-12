// commands/automsg.js
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "automsg",
    version: "3.5",
    author: "ＮＩＲＯＢ ᶻ 𝗓 𐰁", don't change author 
    countDown: 5,
    role: 0,
    shortDescription: "Daily Auto SMS (Morning & Night in all groups, Bangla)",
    longDescription: "Bot will send Bangla Good Morning at 6:00 AM and Good Night at 11:00 PM (Asia/Dhaka timezone) in all groups with gif",
    category: "system",
  },

  onStart: async function () {},
  onChat: async function () {},

  onLoad: function ({ api }) {
    setInterval(async () => {
      // Time Bangladesh অনুযায়ী নেবে
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      );
      const hours = now.getHours();
      const minutes = now.getMinutes();

      const morningFolder = path.join(__dirname, "automsg", "morning");
      const nightFolder = path.join(__dirname, "automsg", "night");

      // === সকাল ৬:০০ (Asia/Dhaka) ===
      if (hours === 6 && minutes === 0) {
        if (fs.existsSync(morningFolder)) {
          const gifs = fs.readdirSync(morningFolder).filter(f => f.endsWith(".gif"));
          if (gifs.length > 0) {
            const gifPath = path.join(morningFolder, gifs[Math.floor(Math.random() * gifs.length)]);
            const msg = {
              body:
`✦••┈┈┈┈┈┈┈┈┈┈••✦
   🌸 শুভ সকাল 🌸
✦••┈┈┈┈┈┈┈┈┈┈••✦

☀️ আজকের দিনটা হোক রঙিন ও উজ্জ্বল 🖤
🌼 হৃদয়ে থাকুক আনন্দের ছোঁয়া 🤗
🌿 সাফল্য আসুক প্রতিটি পদক্ষেপে 😅

━━━━━━━━━━━━━━━━━  
𝗔𝗨𝗧𝗢 𝗦𝗘𝗡𝗗 𝗕𝗬 : ＮＩＲＯＢ ᶻ 𝗓 𐰁
━━━━━━━━━━━━━━━━━`,
              attachment: fs.createReadStream(gifPath),
            };

            const threads = await api.getThreadList(100, null, ["INBOX"]);
            threads.forEach(thread => {
              if (thread.isGroup) {
                api.sendMessage(msg, thread.threadID);
              }
            });
          }
        }
      }

      // === রাত ১১:০০ (Asia/Dhaka) ===
      if (hours === 23 && minutes === 0) {
        if (fs.existsSync(nightFolder)) {
          const gifs = fs.readdirSync(nightFolder).filter(f => f.endsWith(".gif"));
          if (gifs.length > 0) {
            const gifPath = path.join(nightFolder, gifs[Math.floor(Math.random() * gifs.length)]);
            const msg = {
              body:
`✦••┈┈┈┈┈┈┈┈┈┈••✦
   🌙 শুভ রাত্রি 🌙
✦••┈┈┈┈┈┈┈┈┈┈••✦

🌌 নক্ষত্রভরা আকাশে মধুর স্বপ্ন বোনা 💘
💤 প্রশান্তি আসুক প্রতিটি নিঃশ্বাসে 😻
✨ নতুন ভোর আনুক আলো আর আশীর্বাদ ♥️

━━━━━━━━━━━━━━━━━  
𝗔𝗨𝗧𝗢 𝗦𝗘𝗡𝗗 𝗕𝗬 : ＮＩＲＯＢ ᶻ 𝗓 𐰁
━━━━━━━━━━━━━━━━━`,
              attachment: fs.createReadStream(gifPath),
            };

            const threads = await api.getThreadList(100, null, ["INBOX"]);
            threads.forEach(thread => {
              if (thread.isGroup) {
                api.sendMessage(msg, thread.threadID);
              }
            });
          }
        }
      }
    }, 60 * 1000); // প্রতি মিনিটে check করবে
  },
};
