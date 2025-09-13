/**
 * Modified Goat.js for Termux
 * Adds safety checks for missing modules and files
 */

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

let axios, fsExtra, google, nodemailer, nodeCron;
try { axios = require("axios"); } catch(e) { console.log("Module axios missing. Run: npm install axios"); }
try { fsExtra = require("fs-extra"); } catch(e) { console.log("Module fs-extra missing. Run: npm install fs-extra"); }
try { google = require("googleapis").google; } catch(e) { console.log("Module googleapis missing. Run: npm install googleapis"); }
try { nodemailer = require("nodemailer"); } catch(e) { console.log("Module nodemailer missing. Run: npm install nodemailer"); }
try { nodeCron = require("node-cron"); } catch(e) { console.log("Module node-cron missing. Run: npm install node-cron"); }

const { execSync } = require('child_process');
const path = require("path");

const log = (() => {
  try { return require('./logger/log.js'); } 
  catch(e) { console.log("Logger missing"); return { info: console.log, warn: console.log, error: console.log, success: console.log, master: console.log }; }
})();

// Helper to check file exists
function validJSON(pathDir) {
  if (!fsExtra) return false;
  try {
    if (!fsExtra.existsSync(pathDir))
      throw new Error(`File "${pathDir}" not found`);
    execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
    return true;
  } catch (err) {
    let msgError = err.message.split("\n").slice(1).join("\n");
    const indexPos = msgError.indexOf("    at");
    msgError = msgError.slice(0, indexPos != -1 ? indexPos - 1 : msgError.length);
    throw new Error(msgError);
  }
}

// Paths
const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirAccount = path.normalize(`${__dirname}/account${['production', 'development'].includes(NODE_ENV) ? '.dev.txt' : '.txt'}`);

// Validate config files
for (const pathDir of [dirConfig, dirConfigCommands]) {
  try { validJSON(pathDir); }
  catch (err) { log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}": ${err.message}`); process.exit(0); }
}

// Require configs safely
let config, configCommands;
try { config = require(dirConfig); } catch(e) { console.log("Config file missing:", dirConfig); config = {}; }
try { configCommands = require(dirConfigCommands); } catch(e) { console.log("ConfigCommands missing:", dirConfigCommands); configCommands = {}; }

// Setup global objects
global.GoatBot = {
  startTime: Date.now() - process.uptime() * 1000,
  commands: new Map(),
  eventCommands: new Map(),
  aliases: new Map(),
  config,
  configCommands
};

let utils;
try { utils = require("./utils.js"); } catch(e) { console.log("utils.js missing"); utils = {}; }
global.utils = utils;
const colors = utils.colors || { gray: (t)=>t, hex: (h,t)=>t };

// Auto restart simplified
if (config.autoRestart) {
  const time = config.autoRestart.time;
  if (!isNaN(time) && time > 0) {
    log.info("AUTO RESTART", `Restarting in ${time} ms`);
    setTimeout(() => { process.exit(2); }, time);
  }
  else if (typeof time === "string" && nodeCron) {
    nodeCron.schedule(time, () => { log.info("AUTO RESTART", "Restarting..."); process.exit(2); });
  }
}

// Start async bot safely
(async () => {
  // Gmail setup (optional)
  if (google && nodemailer && config.credentials?.gmailAccount) {
    try {
      const { gmailAccount } = config.credentials;
      const { email, clientId, clientSecret, refreshToken } = gmailAccount;
      const OAuth2 = google.auth.OAuth2;
      const OAuth2_client = new OAuth2(clientId, clientSecret);
      OAuth2_client.setCredentials({ refresh_token: refreshToken });
      const accessToken = await OAuth2_client.getAccessToken();
      const transporter = nodemailer.createTransport({ host:'smtp.gmail.com', service:'Gmail', auth:{ type:'OAuth2', user:email, clientId, clientSecret, refreshToken, accessToken }});
      utils.sendMail = async (options) => { return await transporter.sendMail(options); };
    } catch(e){ console.log("Gmail setup failed:", e.message); }
  }

  // Check version
  if (axios) {
    try {
      const { data: { version } } = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json");
      const currentVersion = require("./package.json").version;
      if (version !== currentVersion) log.info("NEW VERSION", `Update available: ${version}`);
    } catch(e) { console.log("Version check failed"); }
  }

  // Login file
  let loginPath = `./bot/login/login${NODE_ENV==='development'?'.dev.js':'.js'}`;
  try { require(loginPath); } catch(e) { console.log("Login file missing:", loginPath); }
})();
