const { EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const channelId = '1472985988228976753';
const intervalMinutes = 20;
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

// Internal queue system
let messageQueue = [];

// Shuffle function (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = (client) => {
  client.once('ready', () => {
    console.log('✅ Auto message system started.');

    // Create initial shuffled queue
    messageQueue = shuffle([...messages]);

    setInterval(async () => {
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        // If queue empty, reshuffle
        if (messageQueue.length === 0) {
          messageQueue = shuffle([...messages]);
        }

        const nextMessage = messageQueue.shift();

        await channel.send({
          content: nextMessage,
          allowedMentions: {
            parse: ['users', 'roles'] // allows normal mentions but not @everyone
          }
        });

      } catch (err) {
        console.error('Auto message error:', err);
      }
    }, intervalMinutes * 60 * 1000);
  });
};
