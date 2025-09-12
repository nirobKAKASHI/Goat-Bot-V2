module.exports = {
  config: {
    name: "category",
    version: "1.0",
    role: 0,
    author: "ＮＩＲＯＢ ᶻ 𝗓 𐰁",
    countDown: 5,
    category: "system",
    shortDescription: { en: "Show commands by category" },
    longDescription: { en: "Display commands in a selected category" },
    guide: { en: "{pn} <categoryName>" }
  },

  onStart: async function({ message, args, commands }) {
    try {
      if (!args[0]) {
        return await message.reply(
          "❌ Specify a category, e.g., /category game"
        );
      }

      const categoryQuery = args[0].toLowerCase();
      const categories = {};

      for (const cmd of commands.values()) { // assuming commands is a Map
        const cat = (cmd.config.category || "other").toLowerCase();
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd.config.name);
      }

      if (!categories[categoryQuery]) {
        return await message.reply(
          "❌ Category not found!\nAvailable: " +
            Object.keys(categories).join(", ")
        );
      }

      const prefix = global.GoatBot?.config?.prefix || "!";
      const cmdsList = categories[categoryQuery]
        .map(c => `${prefix}${c}`)
        .join("\n");

      return await message.reply(
        `📂 Commands in category: **${categoryQuery}**\n────────────────────\n${cmdsList}`
      );
    } catch (err) {
      console.error("❌ [CATEGORY] Error:", err);
      return await message.reply(
        "❌ Error occurred while fetching category commands."
      );
    }
  }
};
