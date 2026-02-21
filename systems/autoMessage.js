const { EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const channelId = 'YOUR_CHANNEL_ID_HERE';
const intervalMinutes = 30;
// ==================

const messages = [
  "🎮 Play on the Blueberry Network today!",
  "📢 Check out our latest updates in <#1455310485363757330>!",
  "⭐ Want to partner with us? Open a ticket!",
  "📺 Subscribe to our YouTube for exclusive content!",
  "💬 Got suggestions? Use the suggestions channel!"
];

module.exports = (client) => {
  client.once('ready', () => {
    console.log('✅ Auto message system started.');

    setInterval(async () => {
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];

        await channel.send({
          content: randomMessage,
          allowedMentions: {
            parse: ['users', 'roles']
          }
        });

      } catch (err) {
        console.error('Auto message error:', err);
      }
    }, intervalMinutes * 60 * 1000);
  });
};
