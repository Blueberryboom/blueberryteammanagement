const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "1470919775847973012" // BBT Team
];

const partnerRoleId = "1468302227075498105";
const logChannelId = "1468013210446594280";

const MASS_DM_DELAY = 1500; // 1.5s between messages

// ✍ YOUR SIGNATURE
const SIGNATURE = (interaction) => `
—
**Thanks,**
<@${interaction.user.id}> | The BlueberryTeam Management
`;
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnerdm')
    .setDescription('DM partners via the bot')

    .addSubcommand(sub =>
      sub
        .setName('user')
        .setDescription('DM one partner')
        .addUserOption(o =>
          o.setName('target')
           .setDescription('Partner to message')
           .setRequired(true)
        )
        .addStringOption(o =>
          o.setName('message')
           .setDescription('Message to send')
           .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('all')
        .setDescription('DM ALL partners')
        .addStringOption(o =>
          o.setName('message')
           .setDescription('Message to send')
           .setRequired(true)
        )
    ),

  async execute(interaction) {

    // ----- PERMISSION CHECK -----
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const text = interaction.options.getString('message');

    // Block mass pings
    if (text.includes("@everyone") || text.includes("@here")) {
      return interaction.reply({
        content: "❌ You cannot use @everyone or @here in partner DMs.",
        ephemeral: true
      });
    }

    // Add signature to message
    const finalMessage = text + SIGNATURE(interaction);

    const embed = new EmbedBuilder()
      .setTitle("📩 Message from BlueberryTeam")
      .setDescription(finalMessage)
      .setColor(0x5865F2)
      .setFooter({ text: "You received this because you are a partner" })
      .setTimestamp();

    // ===== SINGLE USER DM =====
    if (sub === "user") {
      const user = interaction.options.getUser('target');

      try {
        await user.send({ embeds: [embed] });

        await interaction.reply({
          content: `✅ Message sent to **${user.tag}**`,
          ephemeral: true
        });

        log(interaction, `DM to ${user.tag}`, finalMessage);

      } catch {
        await interaction.reply({
          content: "❌ Could not DM this user (DMs closed?)",
          ephemeral: true
        });
      }
    }

    // ===== MASS DM =====
    if (sub === "all") {

      await interaction.reply({
        content: "📨 Starting to DM all partners... (this may take a moment)",
        ephemeral: true
      });

      const role = interaction.guild.roles.cache.get(partnerRoleId);

      if (!role) {
        return interaction.followUp({
          content: "❌ Partner role not found!",
          ephemeral: true
        });
      }

      const partners = role.members;

      let success = 0;
      let failed = 0;

      for (const [id, member] of partners) {

        try {
          await member.send({ embeds: [embed] });
          success++;
        } catch {
          failed++;
        }

        // avoid rate limits
        await new Promise(r => setTimeout(r, MASS_DM_DELAY));
      }

      await interaction.followUp({
        content: `✅ Finished!\n📨 Sent: ${success}\n❌ Failed: ${failed}`,
        ephemeral: true
      });

      log(
        interaction,
        `MASS DM to partners`,
        `${finalMessage}\n\nSent: ${success} | Failed: ${failed}`
      );
    }
  }
};

// ===== LOG FUNCTION =====
function log(interaction, title, message) {
  const logChannel =
    interaction.guild.channels.cache.get(logChannelId);

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle("📨 Partner DM Sent")
    .setColor(0x5865F2)
    .addFields(
      { name: "By", value: interaction.user.tag, inline: true },
      { name: "Type", value: title, inline: true },
      { name: "Message", value: message.slice(0, 900) }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
}
