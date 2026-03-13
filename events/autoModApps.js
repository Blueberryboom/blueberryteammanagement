const db = require('../database/db');

// ===================== CONFIG =====================

// CHANNEL IDS where the bot is allowed to respond
const allowedChannels = [
  '1455310485363757338' // general
];

// Channel where staff logs should go (set to null to disable)
const staffLogChannel = '1468013210446594280';

// Cooldown per channel (3 minutes)
const COOLDOWN = 3 * 60 * 1000;

// ==================================================

const channelCooldowns = new Map();

// Phrases that trigger the response
const triggers = [
  'can i be mod',
  'can i get mod',
  'how to be mod',
  'how do i get mod',
  'mod apps',
  'mod applications',
  'apply for mod',
  'be staff',
  'get staff',
  'mod pls'
];

async function loadData() {
  const [rows] = await db.query(
    'SELECT open, message FROM mod_applications WHERE id = 1'
  );

  return rows?.[0] || {
    open: false,
    message: 'Moderator applications are currently CLOSED.'
  };
}

module.exports = {
  name: 'messageCreate',

  async execute(message) {

    // Ignore bots and DMs
    if (!message.guild) return;
    if (message.author.bot) return;

    // ----- CHANNEL WHITELIST -----
    if (!allowedChannels.includes(message.channel.id)) return;

    const content = message.content.toLowerCase();

    // ----- TRIGGER CHECK -----
    if (!triggers.some(t => content.includes(t))) return;

    // ----- CHANNEL COOLDOWN CHECK -----
    const last = channelCooldowns.get(message.channel.id);
    const now = Date.now();

    if (last && now - last < COOLDOWN) return;

    channelCooldowns.set(message.channel.id, now);

    // ----- LOAD FROM DATABASE -----
    const data = await loadData();

    const reply =
`🛡 **Moderator Applications**

${data.message}

👉 Use **/modapps** to check anytime.`;

    await message.reply(reply);

    // ----- OPTIONAL STAFF LOG -----
    if (staffLogChannel) {
      const logChannel =
        message.guild.channels.cache.get(staffLogChannel);

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
