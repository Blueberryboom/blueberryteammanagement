const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');

// ===== CONFIG =====
const logChannelId = "1468013210446594280";

const allowedRoleIds = [
  "1468294909420240917", // Overlord
  "1468294685452927059", // Admin
  "1468292177397285037", // Senior Mod
  "1468294094403928348"  // Event Team
];

module.exports = {

  data: new SlashCommandBuilder()
    .setName('setgoal')
    .setDescription('Set member goal')
    .addIntegerOption(o =>
      o.setName('amount')
       .setDescription('Member target')
       .setRequired(true)
    ),

  async execute(interaction) {

  const hasRole = allowedRoleIds.some(id =>
    interaction.member.roles.cache.has(id)
  );

  if (!hasRole) {
    return interaction.reply({
      content: "❌ You don't have permission.",
      ephemeral: true
    });
  }

  const amount = interaction.options.getInteger('amount');

  // ---- SAVE ----
  await db.setGoal(amount, interaction.user);

  await interaction.reply({
    content: `✅ Member goal set to **${amount}**`,
    ephemeral: true
  });

  // ---- LOG ----
  const log =
    interaction.guild.channels.cache.get(logChannelId);

  if (log) {
    log.send(
      `🎯 **Member Goal Updated**\n` +
      `👤 By: ${interaction.user.tag}\n` +
      `🎯 Goal: ${amount}`
    );
  }
}
