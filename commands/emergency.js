const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037",  // Senior Moderator
  "1468294094403928348", // Event Team
  "1455544392415842500", // Trial Mod
  "1468294406363680800" // Moderator
];

const emergencyRoleId = "1468298245594939575";   // @Mods Emergency Ping
const logChannelId = "1468298889101705414";

const COOLDOWN_MINUTES = 5;
// ==================

let lastUsed = 0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emergency')
    .setDescription('Call an emergency and ping moderators')
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('What is happening?')
        .setRequired(false)
    ),

  async execute(interaction) {

    // ----- ROLE CHECK -----
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    // ----- COOLDOWN -----
    const now = Date.now();
    const cooldown = COOLDOWN_MINUTES * 60 * 1000;

    if (now - lastUsed < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastUsed)) / 60000);

      return interaction.reply({
        content: `⏱ This command is on cooldown! Try again in **${remaining} minutes**.`,
        ephemeral: true
      });
    }

    lastUsed = now;

    const reason =
      interaction.options.getString('reason') ||
      "No reason provided";

    // ----- CREATE EMBED -----
    const embed = new EmbedBuilder()
      .setTitle("🚨 EMERGENCY ALERT")
      .setColor(0xED4245)
      .addFields(
        { name: "Called By", value: `${interaction.user.tag}`, inline: true },
        { name: "Reason", value: reason, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: "Blueberry Team Utils" });

    // ----- SEND ALERT -----
    const message = await interaction.channel.send({
      content: `<@&${emergencyRoleId}>`,
      embeds: [embed]
    });

    await interaction.reply({
      content: "🚨 Emergency alert sent!",
      ephemeral: true
    });

    // ----- LOGGING -----
    const log = interaction.guild.channels.cache.get(logChannelId);

    if (log) {
      const logEmbed = new EmbedBuilder()
        .setTitle("Emergency Command Used")
        .setColor(0xED4245)
        .addFields(
          { name: "User", value: interaction.user.tag, inline: true },
          { name: "Channel", value: `<#${interaction.channel.id}>`, inline: true },
          { name: "Reason", value: reason }
        )
        .setDescription(`[Jump to alert](${message.url})`)
        .setTimestamp();

      log.send({ embeds: [logEmbed] });
    }

  }
};
