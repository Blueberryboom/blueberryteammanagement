const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const logChannelId = "1468013210446594280";

// ===== PERMISSIONS =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037",  // Senior Moderator
  "1468294094403928348" // Event Team
];
// ==================

const dataFile = path.join(__dirname, '../modapps.json');

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodapps')
    .setDescription('Set whether moderator applications are open or closed')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Open or closed')
        .setRequired(true)
        .addChoices(
          { name: 'Open', value: 'open' },
          { name: 'Closed', value: 'closed' }
        )
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Custom message to show')
        .setRequired(true)
    ),

  async execute(interaction) {

    // ===== ROLE GATE =====
    const member = interaction.member;

    const hasRole = allowedRoleIds.some(id =>
      member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }
    // =====================

    const status = interaction.options.getString('status');
    const message = interaction.options.getString('message');

    const data = {
      open: status === 'open',
      message: message,
      setBy: interaction.user.tag,
      time: Date.now()
    };

    saveData(data);

    await interaction.reply({
      content: `✅ Moderator applications set to **${status.toUpperCase()}**`,
      ephemeral: true
    });

    // ---- LOG ----
    const log = interaction.guild.channels.cache.get(logChannelId);
    if (log) {
      log.send(
`🎉 **Mod Applications Updated**

👤 By: ${interaction.user.tag}  
📌 Status: **${status.toUpperCase()}**

📝 Message:
> ${message}`
      );
    }

  }
};
