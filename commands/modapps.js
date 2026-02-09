const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modapps')
    .setDescription('Shows moderator application status'),

  async execute(interaction) {

    // ----- LOAD FROM DATABASE -----
    const [rows] = await db.query(
      "SELECT open, message, set_by, time FROM mod_applications WHERE id = 1"
    );

    const data = rows?.[0];

    // Fallback if somehow missing
    const open = data?.open ?? false;
    const message =
      data?.message ||
      "Moderator applications are currently CLOSED. We'll let you know when they're back!";

    const embed = new EmbedBuilder()
      .setTitle('🫐 Moderator Applications')
      .setColor(open ? 0x57F287 : 0xED4245)
      .setDescription(message)
      .addFields(
        {
          name: "Status",
          value: open ? "🟢 **OPEN**" : "🔴 **CLOSED**",
          inline: true
        },
        {
          name: "Last Updated By",
          value: data?.set_by || "System",
          inline: true
        },
        {
          name: "Updated",
          value: data?.time
            ? `<t:${Math.floor(data.time / 1000)}:R>`
            : "Unknown",
          inline: true
        }
      )
      .setFooter({
        text: 'BlueberryTeam Management• Hosted on the Blueberry Network'
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  }
};
