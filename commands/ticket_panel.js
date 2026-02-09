const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ChannelType
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
    .setDescription('Send the ticket creation panel')

    // ⭐ NEW OPTION
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send panel to (optional)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

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

    // ----- GET TARGET CHANNEL -----
    const targetChannel =
      interaction.options.getChannel('channel') ||
      interaction.channel;

    // ----- EMBED -----
    const embed = new EmbedBuilder()
      .setTitle("<:543581paperplane:1470555820453396573> Contact Us")
      .setDescription(
`**Contact us via the select menu below!**
Here you can contact us! Please refer to <#1456373556932772030> for more info.
Ticket options include:
- Partnerships
- Apply for creator 
- Mod Applications 
- Other

<a:85951rfalert:1470557230674870476> **Please note:** All tickets are reviewed and responded to by the BBT team!
Troll tickets will lead to punishments - it wastes our time!`
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
          value: "partner"
        },
        {
          label: "Verified Creator",
          description: "Apply for creator rank",
          value: "creator"
        },
        {
          label: "Staff Application",
          description: "Apply to join the staff team",
          value: "staff"
        },
        {
          label: "Other Support",
          description: "General help / questions",
          value: "other"
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    // ----- SEND PANEL -----
    await targetChannel.send({
      embeds: [embed],
      components: [row]
    });

    // ----- CONFIRM TO MOD -----
    await interaction.reply({
      content: `✅ Ticket panel sent to ${targetChannel}`,
      ephemeral: true
   
    });
  }
};
