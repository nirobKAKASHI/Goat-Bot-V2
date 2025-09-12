const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "4k",
  version: "1.0.1",
  permission: 0,
  credits: "NIROB",
  description: "Reply to an image to upscale it to 4K",
  category: "image",
  usages: "Reply to an image",
  cooldowns: 5
};

module.exports.onStart = async function({ api, event }) {
  try {
    // Check if the message is a reply with an image
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0 || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("⚠️ Please reply to an image.", event.threadID, event.messageID);
    }

    const imageUrl = event.messageReply.attachments[0].url;
    api.sendMessage("⏳ Upscaling your image to 4K, please wait...", event.threadID, event.messageID);

    const upscaleApi = `http://veda.hidencloud.com:24611/upscale?url=${encodeURIComponent(imageUrl)}`;
    const res = await axios.get(upscaleApi);

    if (res.data?.status && res.data.result?.data?.downloadUrls?.length > 0) {
      const upscaledUrl = res.data.result.data.downloadUrls[0];
      const tempPath = path.join(__dirname, `cache_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(tempPath);

      const response = await axios.get(upscaledUrl, { responseType: "stream" });
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          { body: "✅ Image upscaled to 4K successfully!", attachment: fs.createReadStream(tempPath) },
          event.threadID,
          () => fs.unlinkSync(tempPath),
          event.messageID
        );
      });

      writer.on("error", (err) => {
        console.error(err);
        api.sendMessage("❌ Failed to process upscaled image.", event.threadID, event.messageID);
      });
    } else {
      api.sendMessage("❌ Failed to upscale image.", event.threadID, event.messageID);
    }
  } catch (err) {
    console.error(err);
    api.sendMessage("⚠️ Error while upscaling image.", event.threadID, event.messageID);
  }
};
