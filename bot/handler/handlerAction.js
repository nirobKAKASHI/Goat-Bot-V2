const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const request = require("request");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = (
  api,
  threadModel,
  userModel,
  dashBoardModel,
  globalModel,
  usersData,
  threadsData,
  dashBoardData,
  globalData
) => {
  const handlerEvents = require(
    process.env.NODE_ENV == "development"
      ? "./handlerEvents.dev.js"
      : "./handlerEvents.js"
  )(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

  return async function (event) {
    if (!global.utils || typeof global.utils.message !== "function") {
      console.error("global.utils.message is not defined properly!");
      return;
    }

    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event).catch(console.error);

    const handlerChat = await handlerEvents(event, message).catch(console.error);
    if (!handlerChat) return;

    const {
      onStart,
      onChat,
      onReply,
      onEvent,
      handlerEvent,
      onReaction,
      typ,
      presence,
      read_receipt
    } = handlerChat;

    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        if (onChat) onChat();
        if (onStart) onStart();
        if (onReply) onReply();

        // === ReSend Feature ===
        if (event.type === "message_unsend") {
          const resend = await threadsData.get(event.threadID, "settings.reSend");
          if (resend === true && event.senderID !== api.getCurrentUserID()) {
            if (global.reSend && global.reSend[event.threadID]) {
              const umid = global.reSend[event.threadID].findIndex(
                e => e.messageID === event.messageID
              );

              if (umid > -1) {
                const nname = await usersData.getName(event.senderID);
                const attch = [];
                const attachments = global.reSend[event.threadID][umid].attachments || [];

                let cn = 0;
                for (const abc of attachments) {
                  if (abc.type === "audio") {
                    cn += 1;
                    const pts = `scripts/cmds/tmp/${cn}.mp3`;
                    const res2 = (
                      await axios.get(abc.url, { responseType: "arraybuffer" })
                    ).data;
                    fs.writeFileSync(pts, Buffer.from(res2));
                    attch.push(fs.createReadStream(pts));
                  } else {
                    const stream = await global.utils.getStreamFromURL(abc.url);
                    if (stream) attch.push(stream);
                  }
                }

                api.sendMessage(
                  {
                    body: `${nname} removed:\n\n${global.reSend[event.threadID][umid].body}`,
                    mentions: [{ id: event.senderID, tag: nname }],
                    attachment: attch
                  },
                  event.threadID
                );
              }
            }
          }
        }
        break;

      case "event":
        if (handlerEvent) handlerEvent();
        if (onEvent) onEvent();
        break;

      case "message_reaction":
        if (onReaction) await onReaction();

        // === Custom reactions ===
        if (event.reaction === "🦶🏻") {
          if (event.userID === "61572240295227") {
            api.removeUserFromGroup(event.senderID, event.threadID, err => {
              if (err) console.log(err);
            });
          } else {
            message.send(":)");
          }
        }

        if (event.reaction === "😡") {
          if (event.senderID === api.getCurrentUserID()) {
            if (event.userID === "61572240295227") {
              message.unsend(event.messageID);
            } else {
              message.send(":)");
            }
          }
        }

        // === Help Pagination Reaction (🖤) ===
        if (global.GoatBot && global.GoatBot.onReaction) {
          const reactionData = global.GoatBot.onReaction.get(event.messageID);
          if (reactionData && reactionData.onReact) {
            await reactionData.onReact(event);
          }
        }
        break;

      case "typ":
        if (typ) typ();
        break;

      case "presence":
        if (presence) presence();
        break;

      case "read_receipt":
        if (read_receipt) read_receipt();
        break;

      default:
        break;
    }
  };
};
