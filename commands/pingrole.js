const { SlashCommandBuilder } = require('discord.js');

// ===== CONFIG =====
// Map each pingable role ID to the staff role IDs allowed to ping it.
const PING_ROLE_PERMISSIONS = {
  // 'PING_ROLE_ID': ['ALLOWED_STAFF_ROLE_ID_1', 'ALLOWED_STAFF_ROLE_ID_2'],
  '1456371062530113767': ['1468294909420240917'],
  '1460357993315962962': ['1484670296077373470', '1484670174484234350', '1468294909420240917'],
  '1461819168000315412': ['1468292177397285037', '1468294685452927059', '1487425289393930462', '1468294909420240917'],
  '1461992007395446795': ['1468292177397285037', '1468294685452927059', '1487425289393930462', '1468294909420240917', '1468294406363680800'],
  '1466170775181721807': ['1468294094403928348', '1468294909420240917', '1487425289393930462'],
  '1478468619456348280': ['1468294909420240917']
};

// Optional channels where /pingrole is allowed. Leave empty to allow all channels.
const ALLOWED_CHANNEL_IDS = [];
const MANAGEMENT_LOG_CHANNEL_ID = '1468013210446594280';
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('Ping an approved role if you have permission for that specific role')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('The ping role to mention')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Optional message to send with the ping')
        .setRequired(false)),

  async execute(interaction) {
    if (ALLOWED_CHANNEL_IDS.length > 0 && !ALLOWED_CHANNEL_IDS.includes(interaction.channel.id)) {
      return interaction.reply({
        content: '❌ /pingrole cannot be used in this channel.',
        ephemeral: true
      });
    }

    const targetRole = interaction.options.getRole('role');
    const allowedStaffRoleIds = PING_ROLE_PERMISSIONS[targetRole.id];

    if (!allowedStaffRoleIds) {
      return interaction.reply({
        content: '❌ That role is not configured as a ping role.',
        ephemeral: true
      });
    }

    const canPingRole = allowedStaffRoleIds.some(roleId =>
      interaction.member.roles.cache.has(roleId)
    );

    if (!canPingRole) {
      return interaction.reply({
        content: '❌ You are not allowed to ping that role.',
        ephemeral: true
      });
    }

    const customMessage = interaction.options.getString('message');
    const content = customMessage
      ? `${targetRole} ${customMessage}`
      : `${targetRole}`;

    await interaction.channel.send({
      content,
      allowedMentions: {
        roles: [targetRole.id]
      }
    });

    const logChannel = interaction.guild.channels.cache.get(MANAGEMENT_LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        content:
          `🔔 Role ping used by ${interaction.user} in ${interaction.channel}\n` +
          `Role: <@&${targetRole.id}>\n` +
          `Message: ${customMessage || 'No message provided.'}`
      });
    }

    return interaction.reply({
      content: `✅ Ping sent for ${targetRole}.`,
      ephemeral: true
    });
  }
};
