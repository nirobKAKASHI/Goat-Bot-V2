const osu = require("node-os-utils");
const os = require("os");

if (!global.botStartTime) global.botStartTime = Date.now();

// Function to create graph-style bars
function createGraphBar(percentage, length = 15) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${percentage.toFixed(1)}%`;
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "6.9",
    author: "VEX_ADNAN",
    role: 0,
    category: "System"
  },

  onStart: async function ({ api, event }) {
    try {
      // --- uptime ---
      const ms = Date.now() - global.botStartTime;
      const d = Math.floor(ms / 86400000);
      const h = Math.floor(ms / 3600000) % 24;
      const m = Math.floor(ms / 60000) % 60;
      const s = Math.floor(ms / 1000) % 60;
      const uptimeStr = `${d}d ${h}h ${m}m ${s}s`;

      // --- system stats ---
      const cpuUsage = await osu.cpu.usage();
      const mem = await osu.mem.info();
      const cpuBar = createGraphBar(cpuUsage, 15);
      const ramBar = createGraphBar((mem.usedMemMb / mem.totalMemMb) * 100, 15);

      const platform = os.platform();
      const arch = os.arch();
      const release = os.release();
      const hostname = os.hostname();
      const uniqueId = Math.random().toString(36).slice(2, 8);

      // --- ping ---
      const pingStart = Date.now();
      await new Promise(resolve =>
        api.sendMessage("🏓 Checking uptime...", event.threadID, () => resolve())
      );
      const ping = Date.now() - pingStart;

      // --- current group info ---
      const threadInfo = await api.getThreadInfo(event.threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";
      const totalUsers = threadInfo.participantIDs.length;
      const adminCount = threadInfo.adminIDs.length;

      // --- all groups info ---
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = allThreads.filter(t => t.isGroup);
      const totalGroups = groupThreads.length;
      const totalMembersInAllGroups = groupThreads.reduce((sum, g) => sum + g.participantIDs.length, 0);

      // --- image url ---
      const imageUrl = "https://files.catbox.moe/a6pasj.jpg";

      // --- final message ---
      const msg = `
🌸 𝗞𝗔𝗞𝗔𝗦𝗛𝗜 𝗕𝗢𝗧 𝗦𝗧𝗔𝗧𝗨𝗦 🌸

⏳ Uptime : ${uptimeStr}
⚡ Ping   : ${ping}ms

💻 CPU    : ${cpuBar}
🧠 RAM    : ${ramBar}

🖥️ OS     : ${platform} ${arch} (v${release})
🏷️ Host   : ${hostname}
🆔 UID    : ${uniqueId}

👥 Current Group : ${groupName}
👤 Members       : ${totalUsers}
🛡️ Admins        : ${adminCount}

🌍 Total Groups  : ${totalGroups}
👥  Total User   : ${totalMembersInAllGroups}

👑 Owner : NIROB
🐺 Nick  : KAKASHI
`;

      // Check if global.utils.getStreamFromURL exists
      let attachment = null;
      if (global.utils && typeof global.utils.getStreamFromURL === "function") {
        attachment = await global.utils.getStreamFromURL(imageUrl);
      }

      api.sendMessage(
        attachment ? { body: msg, attachment } : { body: msg },
        event.threadID
      );

    } catch (err) {
      console.error("Uptime error:", err);
      api.sendMessage("❌ Error while checking uptime.", event.threadID);
    }
  }
};
