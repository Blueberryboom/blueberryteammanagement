const { SlashCommandBuilder } = require('discord.js');

// ===== CONFIG =====
// Map each pingable role ID to the staff role IDs allowed to ping it.
const PING_ROLE_PERMISSIONS = {
  // 'PING_ROLE_ID': ['ALLOWED_STAFF_ROLE_ID_1', 'ALLOWED_STAFF_ROLE_ID_2'],
  '111111111111111111': ['222222222222222222'],
  '333333333333333333': ['222222222222222222', '444444444444444444']
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
