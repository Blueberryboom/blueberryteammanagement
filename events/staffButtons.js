const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CONFIG } = require('../commands/staff_add');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
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
    const bbtTeamId = CONFIG.ROLE_IDS.BBT_TEAM;

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
