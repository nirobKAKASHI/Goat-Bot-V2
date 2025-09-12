const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "married",
    aliases: ["married"],
    version: "6.1",
    author: "kivv + modified by Nirob",
    countDown: 5,
    role: 0,
    shortDescription: "Get a wife/husband",
    longDescription: "",
    category: "fun",
    guide: "{@mention}"
  },

  onLoad: async function () {
    const { resolve } = require("path");
    const { existsSync, mkdirSync } = require("fs-extra");
    const { downloadFile } = global.utils;
    const dirMaterial = __dirname + `/cache/canvas/`;
    const pathBg = resolve(__dirname, "cache/canvas", "marriedv5.png");

    if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
    if (!existsSync(pathBg)) {
      // GitHub raw background
      await downloadFile(
        "https://raw.githubusercontent.com/nirobbhbott-ui/FUNNY-PHOTOS-/main/married.jpeg",
        pathBg
      );
    }
  },

  circle: async function(image) {
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
  },

  getGender: async function(api, threadID, uid) {
    try {
      const info = await api.getThreadInfo(threadID);
      const userInfo = info.userInfo.find(u => u.id === uid);
      if (!userInfo) return Math.random() > 0.5 ? "male" : "female";
      return userInfo.gender?.toLowerCase() || (Math.random() > 0.5 ? "male" : "female");
    } catch {
      return Math.random() > 0.5 ? "male" : "female";
    }
  },

  makeImage: async function({ uid1, uid2, gender1, gender2 }) {
    const __root = path.resolve(__dirname, "cache", "canvas");
    const bg = await jimp.read(__root + "/marriedv5.png");

    const pathImg = __root + `/married_${uid1}_${uid2}.png`;
    const pathAvt1 = __root + `/avt_${uid1}.png`;
    const pathAvt2 = __root + `/avt_${uid2}.png`;

    // Download avatars 720x720
    const avt1 = (await axios.get(
      `https://graph.facebook.com/${uid1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avt1));

    const avt2 = (await axios.get(
      `https://graph.facebook.com/${uid2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avt2));

    // Circle avatars
    const circle1 = await jimp.read(await this.circle(pathAvt1));
    const circle2 = await jimp.read(await this.circle(pathAvt2));

    // Male → male slot, Female → female slot
    function place(img, gender) {
      if (gender === "male") return [img.resize(110, 110), 500, 320]; // male slot
      return [img.resize(100, 100), 430, 400]; // female slot
    }

    const [p1, x1, y1] = place(circle1, gender1);
    const [p2, x2, y2] = place(circle2, gender2);

    bg.composite(p1, x1, y1);
    bg.composite(p2, x2, y2);

    const raw = await bg.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, raw);

    fs.unlinkSync(pathAvt1);
    fs.unlinkSync(pathAvt2);

    return pathImg;
  },

  onStart: async function({ event, api, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    const mention = Object.keys(mentions);

    let partner;
    if (mention[0]) partner = mention[0];
    else {
      const allUsers = await api.getThreadInfo(threadID);
      const members = allUsers.participantIDs.filter(id => id !== senderID);

      // Detect sender gender
      const genderSender = await this.getGender(api, threadID, senderID);

      // Filter opposite gender
      const filtered = [];
      for (let uid of members) {
        const g = await this.getGender(api, threadID, uid);
        if (genderSender === "male" && g === "female") filtered.push(uid);
        if (genderSender === "female" && g === "male") filtered.push(uid);
      }

      if (filtered.length === 0)
        return api.sendMessage("❌ Opposite gender partner not found!", threadID, messageID);

      partner = filtered[Math.floor(Math.random() * filtered.length)];
    }

    // Detect genders
    const genderSender = await this.getGender(api, threadID, senderID);
    const genderPartner = await this.getGender(api, threadID, partner);

    // Get names
    let name1, name2;
    try {
      name1 = await usersData.getName(senderID);
      if (!name1) throw new Error();
    } catch {
      const info = await api.getUserInfo(senderID);
      name1 = info[senderID]?.name || "Unknown";
    }

    try {
      name2 = await usersData.getName(partner);
      if (!name2) throw new Error();
    } catch {
      const info = await api.getUserInfo(partner);
      name2 = info[partner]?.name || "Unknown";
    }

    // Create image
    return this.makeImage({ uid1: senderID, uid2: partner, gender1: genderSender, gender2: genderPartner })
      .then(path => {
        api.sendMessage(
          { body: `💍 Congratulations 
${name1} & ${name2}!`, attachment: fs.createReadStream(path) },
          threadID,
          () => fs.unlinkSync(path),
          messageID
        );
      });
  }
};
