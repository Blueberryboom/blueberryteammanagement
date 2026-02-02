const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../modapps.json');

// Load status from file or default
function loadData() {
  if (!fs.existsSync(dataFile)) {
    return {
      open: false,
      message: "Moderator applications are currently CLOSED. We'll let you know when they're back in <#1455310485363757331>!"
    };
  }

  return JSON.parse(fs.readFileSync(dataFile));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modapps')
    .setDescription('Shows moderator application status'),

  async execute(interaction) {
    const data = loadData();

    const embed = new EmbedBuilder()
      .setTitle('🫐 Moderator Applications')
      .setColor(data.open ? 0x57F287 : 0xED4245)
      .setDescription(data.message)
      .setFooter({ text: 'BlueberryTeam Utils • Hosted on the Blueberry Network' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
