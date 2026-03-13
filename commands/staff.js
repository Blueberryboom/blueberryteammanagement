const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const staffRoles = [
  { id: '1468294909420240917', label: 'Blueberry Overlord' },
  { id: '1468294685452927059', label: 'Administrator' },
  { id: '1468292177397285037', label: 'Senior Moderator' },
  { id: '1470919775847973012', label: 'Moderator' },
  { id: '1470536730779062433', label: 'Partnership Manager' },
  { id: '1468294094403928348', label: 'Event Team' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('List all staff members and their staff roles'),

  async execute(interaction) {
    await interaction.guild.members.fetch();

    const membersMap = new Map();

    for (const staffRole of staffRoles) {
      const role = interaction.guild.roles.cache.get(staffRole.id);
      if (!role) continue;

      for (const [, member] of role.members) {
        if (!membersMap.has(member.id)) {
          membersMap.set(member.id, {
            mention: `<@${member.id}>`,
            roles: new Set()
          });
        }

        membersMap.get(member.id).roles.add(staffRole.label);
      }
    }

    if (membersMap.size === 0) {
      return interaction.reply({
        content: 'No staff members were found for the configured staff roles.',
        ephemeral: true
      });
    }

    const lines = [...membersMap.values()]
      .sort((a, b) => a.mention.localeCompare(b.mention))
      .map(entry => `${entry.mention} — ${[...entry.roles].join(', ')}`);

    const embed = new EmbedBuilder()
      .setTitle('📋 Staff List')
      .setColor(0x5865F2)
      .setDescription(lines.join('\n').slice(0, 4000))
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
