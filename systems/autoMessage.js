const { EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const channelId = '1472985988228976753';
const intervalMinutes = 30;
// ==================

const messages = [
  "Is someone being toxic or breaking our rules? Report them in the discord!",
  "Use /discord link to connect your discord and sync roles!",
  "Our server is not the place to be toxic! Being toxic will result in a ban.",
  "Support us via Buy Me A Coffee for special perks! https://buymeacoffee.com/blueberryboom",
  "Got a suggestion? Let us know in discord! "
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
