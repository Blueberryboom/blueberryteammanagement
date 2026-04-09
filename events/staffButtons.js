const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const db = require('../database/db');
const { CONFIG } = require('../commands/staff');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (interaction.isModalSubmit() && interaction.customId.startsWith('staff_leave_note:')) {
      return handleLeaveNoteModal(interaction);
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'staff_emergency_optin') {
      const roleId = CONFIG.ROLE_IDS.MOD_EMERGENCY_PING;
      const role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.reply({
          content: '❌ Mod Emergency Ping role is not configured correctly.',
          ephemeral: true
        });
      }

      try {
        await interaction.member.roles.add(roleId);
      } catch (err) {
        console.error('Emergency opt-in role failed:', err);
        return interaction.reply({
          content: '❌ I could not assign that role. Check bot permissions/role hierarchy.',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `✅ You now have the **${role.name}** role.`,
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('staff_leave_decide:')) {
      const [, decision, requestId] = interaction.customId.split(':');
      if (!decision || !requestId) return;

      const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
      const canManageServer = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

      if (!isAdmin && !canManageServer) {
        return interaction.reply({
          content: '❌ You must have Administrator or Manage Server to review leave requests.',
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`staff_leave_note:${decision}:${requestId}`)
        .setTitle('Leave request review note');

      const noteInput = new TextInputBuilder()
        .setCustomId('note')
        .setLabel('Reason / note')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000)
        .setPlaceholder('Explain why this request is allowed, denied, or partially allowed.');

      modal.addComponents(new ActionRowBuilder().addComponents(noteInput));
      return interaction.showModal(modal);
    }

    if (!interaction.customId.startsWith('staff_add_misc:')) return;

    const [prefix, choice, targetId] = interaction.customId.split(':');
    if (prefix !== 'staff_add_misc' || !choice || !targetId) return;

    if (interaction.guild.ownerId !== interaction.user.id) {
      const hasCmRole = CONFIG.COMMUNITY_MANAGER_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
      if (!hasCmRole) {
        return interaction.reply({
          content: '❌ Only the server owner or configured Community Managers can use this.',
          ephemeral: true
        });
      }
    }

    const roleMap = {
      growth: CONFIG.ROLE_IDS.GROWTH_MANAGER,
      event: CONFIG.ROLE_IDS.EVENT_TEAM,
      advisor: CONFIG.ROLE_IDS.ADVISOR
    };

    const miscRoleId = roleMap[choice];
    const bbtTeamId = CONFIG.BBT_TEAM_ROLE_ID;

    const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: '❌ Could not find that member anymore.',
        ephemeral: true
      });
    }

    try {
      await targetMember.roles.add([miscRoleId, bbtTeamId].filter(Boolean));
    } catch (err) {
      console.error('staff misc role assign failed:', err);
      return interaction.reply({
        content: '❌ Failed to assign misc roles. Check IDs and hierarchy.',
        ephemeral: true
      });
    }

    const roleNames = [miscRoleId, bbtTeamId]
      .map(id => interaction.guild.roles.cache.get(id)?.name)
      .filter(Boolean);

    const modChat = interaction.guild.channels.cache.get(CONFIG.MOD_CHAT_CHANNEL_ID);

    if (modChat) {
      await modChat.send({
        content: `Welcome ${targetMember}!`,
        embeds: [
          {
            title: '🫐 Welcome to the Team',
            color: 0x57F287,
            description: `${targetMember} has joined the staff team.`,
            fields: [
              { name: 'Staff Type', value: 'Misc', inline: true },
              { name: 'Roles Given', value: roleNames.join(', ') || 'None', inline: false }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      });
    }

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_misc_done')
        .setLabel('Selection completed')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.update({
      content: `✅ Assigned ${roleNames.join(', ')} to <@${targetMember.id}>.`,
      components: [disabledRow]
    });
  }
};

async function handleLeaveNoteModal(interaction) {
  const [, decision, requestIdRaw] = interaction.customId.split(':');
  const requestId = Number(requestIdRaw);
  const note = interaction.fields.getTextInputValue('note');

  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  const canManageServer = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

  if (!isAdmin && !canManageServer) {
    return interaction.reply({
      content: '❌ You must have Administrator or Manage Server to review leave requests.',
      ephemeral: true
    });
  }

  if (!requestId) {
    return interaction.reply({ content: '❌ Invalid leave request ID.', ephemeral: true });
  }

  const [rows] = await db.query(
    'SELECT * FROM staff_leave_requests WHERE id = ?',
    [requestId]
  );
  const request = rows?.[0];

  if (!request) {
    return interaction.reply({ content: '❌ Leave request not found.', ephemeral: true });
  }

  if (request.status !== 'pending') {
    return interaction.reply({
      content: `❌ This request has already been reviewed (status: ${request.status}).`,
      ephemeral: true
    });
  }

  const statusMap = {
    allow: 'allowed',
    deny: 'denied',
    partial: 'partially_allowed'
  };
  const status = statusMap[decision];

  if (!status) {
    return interaction.reply({ content: '❌ Invalid decision type.', ephemeral: true });
  }

  await db.query(
    `UPDATE staff_leave_requests
     SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, interaction.user.id, note, requestId]
  );

  const staffChannel = interaction.guild.channels.cache.get(CONFIG.STAFF_ANNOUNCEMENTS_CHANNEL_ID);
  if (staffChannel) {
    const resultText = status === 'partially_allowed'
      ? 'Partially Allowed'
      : status === 'allowed'
        ? 'Allowed'
        : 'Denied';

    const color = status === 'allowed'
      ? 0x57F287
      : status === 'denied'
        ? 0xED4245
        : 0xFEE75C;

    const embed = new EmbedBuilder()
      .setTitle('📣 Staff Leave Request Update')
      .setColor(color)
      .addFields(
        { name: 'Request ID', value: `#${requestId}`, inline: true },
        { name: 'Staff Member', value: `<@${request.user_id}>`, inline: true },
        { name: 'Decision', value: resultText, inline: true },
        { name: 'Reviewed By', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Leave Length', value: request.length_text || 'Not provided', inline: true },
        { name: 'Original Reason', value: request.reason || 'No reason provided', inline: false },
        { name: 'Note', value: note, inline: false }
      )
      .setTimestamp();

    await staffChannel.send({ embeds: [embed] });
  }

  if (interaction.message) {
    const disabled = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_leave_done_allow')
        .setLabel('Allow')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('staff_leave_done_deny')
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('staff_leave_done_partial')
        .setLabel('Partially Allow')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.message.edit({ components: [disabled] }).catch(() => {});
  }

  return interaction.reply({
    content: `✅ Leave request #${requestId} marked as **${status.replace('_', ' ')}**.`,
    ephemeral: true
  });
}
