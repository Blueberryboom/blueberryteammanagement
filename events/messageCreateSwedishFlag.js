const db = require('../database/db');

const generalChannelId = '1455310485363757338';
const swedishFlag = '🇸🇪';

async function isEnabled() {
  const [rows] = await db.query(
    'SELECT enabled FROM april_fools_settings WHERE id = 1'
  );

  return Boolean(rows?.[0]?.enabled);
}

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (message.channel.id !== generalChannelId) return;

    const enabled = await isEnabled();

    if (!enabled) return;
    if (message.content.includes(swedishFlag)) return;

    const warning = await message.channel.send(
      `Hey ${message.author}, please show your love for IKEA country! ${swedishFlag}`
    );

    setTimeout(async () => {
      try {
        await warning.delete();
      } catch (err) {}
    }, 6_000);
  }
};
