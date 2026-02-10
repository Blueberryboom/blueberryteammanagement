const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "1470919775847973012" // BBT Team
];

const emergencyRoleId = "1468298245594939575";   // @Mods Emergency Ping
const emergencyChannelId = "1468298889101705414"; 
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

    // ----- SEND ALERT TO FIXED CHANNEL -----
    const emergencyChannel =
      interaction.guild.channels.cache.get(emergencyChannelId);

    if (!emergencyChannel) {
      return interaction.reply({
        content: "❌ Emergency channel not found! Check bot config.",
        ephemeral: true
      });
    }

    const message = await emergencyChannel.send({
      content: `<@&${emergencyRoleId}>`,
      embeds: [embed]
    });

    await interaction.reply({
      content: "🚨 Emergency alert sent to #emergency!",
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
          { name: "Executed In", value: `<#${interaction.channel.id}>`, inline: true },
          { name: "Reason", value: reason }
        )
        .setDescription(`[Jump to alert](${message.url})`)
        .setTimestamp();

      log.send({ embeds: [logEmbed] });
    }
  }
};
