const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');

const logChannelId = '1468013210446594280';

const allowedRoleIds = [
  '1468294909420240917', // Blueberry Overlord
  '1468294685452927059', // Administrator
  '1468292177397285037' // Senior Moderator
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aprilfools')
    .setDescription('Enable or disable Swedish-flag enforcement in general chat')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Enable or disable the Swedish-flag requirement')
        .setRequired(true)
        .addChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' }
        )
    ),

  async execute(interaction) {
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const status = interaction.options.getString('status');
    const enabled = status === 'enable';

    await db.query(
      `UPDATE april_fools_settings
       SET enabled = ?, set_by = ?, time = ?
       WHERE id = 1`,
      [enabled, interaction.user.tag, Date.now()]
    );

    await interaction.reply({
      content: `✅ Swedish flag requirement has been **${enabled ? 'ENABLED' : 'DISABLED'}**.`,
      ephemeral: true
    });

    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      logChannel.send(
`🇸🇪 **Aprilfools setting updated**
👤 By: ${interaction.user.tag}
📌 Status: **${enabled ? 'ENABLED' : 'DISABLED'}**`
      );
    }
  }
};
