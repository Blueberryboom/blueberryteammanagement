const { EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const channelId = '1472985988228976753';
const intervalMinutes = 5;
// ==================

const messages = [
  "Is someone being toxic or breaking our rules? Report them in the discord!",
  "Use /discord link to connect your discord and sync roles!",
  "Our server is not the place to be toxic! Being toxic will result in a ban.",
  "Support us via Buy Me A Coffee for special perks! https://buymeacoffee.com/blueberryboom",
  "Got a suggestion? Let us know in discord! ",
  "We're always trying to make the server better! Coming soon: chat moderation and combat log prevention! (sounds quite boring lol)",
  "Want to host your own event? Partners and creators get access to the event server for free!"
];

module.exports = (client) => {
  let lastMessageIndex = -1; // Initialize with an invalid index

  client.once('ready', () => {
    console.log('✅ Auto message system started.');

    setInterval(async () => {
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        // Choose a new message index different from the last one
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * messages.length);
        } while (messages.length > 1 && newIndex === lastMessageIndex);

        lastMessageIndex = newIndex;

        const randomMessage = messages[newIndex];

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
