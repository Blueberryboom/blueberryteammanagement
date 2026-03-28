const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// ===== CONFIG (fill all IDs here) =====
const CONFIG = {
  COMMUNITY_MANAGER_ROLE_IDS: [
    'PUT_COMMUNITY_MANAGER_ROLE_ID_HERE'
  ],
  MOD_CHAT_CHANNEL_ID: 'PUT_MOD_CHAT_CHANNEL_ID_HERE',
  ROLE_IDS: {
    BBT_TEAM: '1470919775847973012',
    TRIAL_MOD: 'PUT_TRIAL_MOD_ROLE_ID_HERE',
    MINECRAFT_MOD: 'PUT_MINECRAFT_MOD_ROLE_ID_HERE',
    GROWTH_MANAGER: '1470536730779062433',
    EVENT_TEAM: '1468294094403928348',
    ADVISOR: 'PUT_ADVISOR_ROLE_ID_HERE',
    MOD_EMERGENCY_PING: 'PUT_MOD_EMERGENCY_PING_ROLE_ID_HERE'
  }
};
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff_add')
    .setDescription('Add a user to staff with the selected team roles')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Member to add')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Staff type to assign')
        .setRequired(true)
        .addChoices(
          { name: 'moderator', value: 'moderator' },
          { name: 'minecraft', value: 'minecraft' },
          { name: 'misc', value: 'misc' }
        )
    ),

  async execute(interaction) {
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const isCommunityManager = CONFIG.COMMUNITY_MANAGER_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));

    if (!isOwner && !isCommunityManager) {
      return interaction.reply({
        content: "❌ Only the server owner or configured Community Managers can use this command.",
        ephemeral: true
      });
    }

    const target =
      interaction.options.getMember('user') ||
      await interaction.guild.members.fetch(interaction.options.getUser('user').id).catch(() => null);

    if (!target) {
      return interaction.reply({
        content: '❌ Could not resolve that member in this server.',
        ephemeral: true
      });
    }

    const type = interaction.options.getString('type');

    if (type === 'moderator') {
      return assignAndAnnounce(interaction, target, [CONFIG.ROLE_IDS.TRIAL_MOD, CONFIG.ROLE_IDS.BBT_TEAM], 'Moderator');
    }

    if (type === 'minecraft') {
      return assignAndAnnounce(interaction, target, [CONFIG.ROLE_IDS.MINECRAFT_MOD, CONFIG.ROLE_IDS.BBT_TEAM], 'Minecraft');
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`staff_add_misc:growth:${target.id}`)
        .setLabel('Growth Manager')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`staff_add_misc:event:${target.id}`)
        .setLabel('Event Team')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`staff_add_misc:advisor:${target.id}`)
        .setLabel('Advisor')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: `Select which misc role to give to <@${target.id}>.`,
      components: [row],
      ephemeral: true
    });
  }
};

async function assignAndAnnounce(interaction, member, roleIds, typeLabel) {
  const rolesToAdd = roleIds.filter(Boolean);

  try {
    await member.roles.add(rolesToAdd);
  } catch (err) {
    console.error('staff_add role assign failed:', err);
    return interaction.reply({
      content: '❌ Failed to add one or more roles. Check role IDs and hierarchy.',
      ephemeral: true
    });
  }

  const roleNames = rolesToAdd
    .map(id => interaction.guild.roles.cache.get(id)?.name)
    .filter(Boolean);

  await sendWelcomeToModChat(interaction, member, roleNames, typeLabel);

  return interaction.reply({
    content: `✅ Added roles to <@${member.id}>: ${roleNames.join(', ')}`,
    ephemeral: true
  });
}

async function sendWelcomeToModChat(interaction, member, roleNames, typeLabel) {
  const modChat = interaction.guild.channels.cache.get(CONFIG.MOD_CHAT_CHANNEL_ID);
  if (!modChat) return;

  const embed = new EmbedBuilder()
    .setTitle('🫐 Welcome to the Team')
    .setColor(0x57F287)
    .setDescription(`${member} has joined the staff team.`)
    .addFields(
      { name: 'Staff Type', value: typeLabel, inline: true },
      { name: 'Roles Given', value: roleNames.join(', ') || 'None', inline: false }
    )
    .setTimestamp();

  const components = [];

  if (typeLabel === 'Moderator') {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('staff_emergency_optin')
          .setLabel("I'm ok to be pinged in emergencies")
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  await modChat.send({
    content: `Welcome ${member}!`,
    embeds: [embed],
    components
  });
}

module.exports.CONFIG = CONFIG;
