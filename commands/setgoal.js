const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const logChannelId = "1468013210446594280";
// ==================

const goalFile = path.join(__dirname, '../memberGoal.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgoal')
    .setDescription('Set member goal')
    .addIntegerOption(o =>
      o.setName('amount')
       .setDescription('Member target')
       .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    fs.writeFileSync(goalFile, JSON.stringify({
      goal: amount,
      setBy: interaction.user.tag,
      time: Date.now()
    }, null, 2));

    await interaction.reply({
      content: `✅ Member goal set to **${amount}**`,
      ephemeral: true
    });

    // ---- LOG ----
    const log = interaction.guild.channels.cache.get(logChannelId);
    if (log) {
      log.send(
`🎯 **Member Goal Updated**  
👤 By: ${interaction.user.tag}  
🎯 Goal: ${amount}`
      );
    }

  }
};
