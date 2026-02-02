const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../modapps.json');

// ===== CONFIG =====

// Channels where the bot is allowed to respond
const allowedChannels = [
  "general",
  "support",
  "minecraft",
  "chat"
];

// Optional staff log channel (set null to disable)
const staffLogChannel = "staff-logs";

// Cooldown in milliseconds (5 minutes)
const COOLDOWN = 5 * 60 * 1000;

// ==================

const cooldowns = new Map();

function loadData() {
  if (!fs.existsSync(dataFile)) {
    return {
      open: false,
      message: "Moderator applications are currently CLOSED."
    };
  }

  return JSON.parse(fs.readFileSync(dataFile));
}

const triggers = [
  "can i be mod",
  "can i get mod",
  "how to be mod",
  "how do i get mod",
  "mod apps",
  "mod applications",
  "apply for mod",
  "be staff",
  "get staff"
];

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    if (message.author.bot) return;

    // ---- CHANNEL WHITELIST CHECK ----
    if (!allowedChannels.includes(message.channel.name)) return;

    const content = message.content.toLowerCase();

    if (!triggers.some(t => content.includes(t))) return;

    // ---- COOLDOWN CHECK ----
    const last = cooldowns.get(message.author.id);
    const now = Date.now();

    if (last && now - last < COOLDOWN) return;

    cooldowns.set(message.author.id, now);

    const data = loadData();

    const reply =
`🛡 **Moderator Applications**

${data.message}

👉 Use **/modapps** to check anytime.`;

    await message.reply(reply);

    // ---- STAFF LOG ----
    if (staffLogChannel) {
      const logChannel = message.guild.channels.cache
        .find(c => c.name === staffLogChannel);

      if (logChannel) {
        logChannel.send(
`👤 **${message.author.tag}** asked about mod apps  
📍 Channel: <#${message.channel.id}>  
💬 Message: "${message.content}"`
        );
      }
    }
  }
};
