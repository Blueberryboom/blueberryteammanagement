const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View detailed information about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view')
        .setRequired(false)
    ),

  async execute(interaction) {

    const target = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ User not found in this server.",
        ephemeral: true
      });
    }

    // Fetch full user for banner info
    const fullUser = await target.fetch();

    const roles = member.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `• ${r}`)
      .join("\n") || "None";

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor === "#000000" ? 0x5865F2 : member.displayHexColor)
      .setAuthor({
        name: `${target.tag}`,
        iconURL: target.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription("### User Information")
      .addFields(
        {
          name: "General",
          value:
`**User:** ${target}
**ID:** \`${target.id}\`
**Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>
**Bot:** ${target.bot ? "Yes" : "No"}
**Banner Color:** ${fullUser.hexAccentColor || "None"}`,
          inline: false
        },
        {
          name: "Server",
          value:
`**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>
**Highest Role:** ${member.roles.highest}
**Boosting:** ${member.premiumSince ? "Yes" : "No"}
**Timed Out:** ${member.communicationDisabledUntil ? "Yes" : "No"}`,
          inline: false
        },
        {
          name: `Roles (${member.roles.cache.size - 1})`,
          value: roles.length > 1024 ? "Too many roles to display." : roles,
          inline: false
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
