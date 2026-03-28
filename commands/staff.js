const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const BBT_TEAM_ROLE_ID = '1470919775847973012';
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Show members who have BBT Team and their highest role'),

  async execute(interaction) {
    await interaction.guild.members.fetch();

    const bbtRole = interaction.guild.roles.cache.get(BBT_TEAM_ROLE_ID);

    if (!bbtRole) {
      return interaction.reply({
        content: '❌ BBT Team role not found. Configure BBT_TEAM_ROLE_ID in commands/staff.js.',
        ephemeral: true
      });
    }

    const members = [...bbtRole.members.values()];

    if (members.length === 0) {
      return interaction.reply({
        content: 'No members currently have the BBT Team role.',
        ephemeral: true
      });
    }

    const lines = members
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(member => {
        const highestRole = member.roles.highest;
        return `<@${member.id}> — <@&${highestRole.id}>`;
      });

    const embed = new EmbedBuilder()
      .setTitle('📋 Staff Team')
      .setColor(0x5865F2)
      .setDescription(lines.join('\n').slice(0, 4000))
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
