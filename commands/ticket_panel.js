const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder 
} = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059"  // Administrator
];
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket_panel')
    .setDescription('Send the ticket creation panel'),

  async execute(interaction) {

    // ----- PERMISSION CHECK -----
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this.",
        ephemeral: true
      });
    }

    // ----- EMBED -----
    const embed = new EmbedBuilder()
      .setTitle("🎟 Create a Ticket")
      .setDescription(
`Select a category below to open a ticket.

Our team will respond as soon as possible!`
      )
      .setColor(0x5865F2);

    // ----- DROPDOWN -----
    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_create')
      .setPlaceholder('Choose ticket type...')
      .addOptions(
        {
          label: "Become a Partner",
          description: "Apply to partner with our network",
          value: "partner",
          emoji: "🤝"
        },
        {
          label: "Verified Creator",
          description: "Apply for creator rank",
          value: "creator",
          emoji: "🎬"
        },
        {
          label: "Staff Application",
          description: "Apply to join the staff team",
          value: "staff",
          emoji: "🛡"
        },
        {
          label: "Other Support",
          description: "General help / questions",
          value: "other",
          emoji: "❓"
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
