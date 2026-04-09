const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const db = require('../database/db');

// ===== CONFIG (all IDs here) =====
const CONFIG = {
  COMMUNITY_MANAGER_ROLE_IDS: [
    '1487425289393930462'
  ],
  BBT_TEAM_ROLE_ID: '1470919775847973012',
  MOD_CHAT_CHANNEL_ID: '1468298848521818255',
  MANAGEMENT_LEAVE_CHANNEL_ID: '1468298848521818255',
  STAFF_ANNOUNCEMENTS_CHANNEL_ID: '1468298848521818255',
  ROLE_IDS: {
    TRIAL_MOD: '1455544392415842500',
    MINECRAFT_MOD: '1484670364335341749',
    GROWTH_MANAGER: '1470536730779062433',
    EVENT_TEAM: '1468294094403928348',
    ADVISOR: '1484663953496735855',
    MOD_EMERGENCY_PING: '1468298245594939575'
  }
};
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Staff management commands')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Show members who have the BBT Team role')
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
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
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('strike')
        .setDescription('Give a staff member a strike and log it')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Staff member to strike')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for the strike')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to log this strike in')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('request_leave')
        .setDescription('Request leave from staff duties')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Why you are requesting leave')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('length')
            .setDescription('How long (plain text)')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      return executeList(interaction);
    }

    if (subcommand === 'add') {
      return executeAdd(interaction);
    }

    if (subcommand === 'strike') {
      return executeStrike(interaction);
    }

    if (subcommand === 'request_leave') {
      return executeRequestLeave(interaction);
    }
  }
};

async function executeList(interaction) {
  await interaction.guild.members.fetch();

  const bbtRole = interaction.guild.roles.cache.get(CONFIG.BBT_TEAM_ROLE_ID);

  if (!bbtRole) {
    return interaction.reply({
      content: '❌ BBT Team role not found. Configure BBT_TEAM_ROLE_ID in commands/staff.js.',
      ephemeral: true
    });
  }

  const members = [...bbtRole.members.values()];

  if (members.length === 0) {
    return interaction.reply({
      content: 'No members currently have the BBT Team role.',
      ephemeral: true
    });
  }

  const lines = members
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(member => {
      const highestRole = member.roles.highest;
      return `<@${member.id}> — <@&${highestRole.id}>`;
    });

  const embed = new EmbedBuilder()
    .setTitle('📋 Staff Team')
    .setColor(0x5865F2)
    .setDescription(lines.join('\n').slice(0, 4000))
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function executeAdd(interaction) {
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
    return assignAndAnnounce(interaction, target, [CONFIG.ROLE_IDS.TRIAL_MOD, CONFIG.BBT_TEAM_ROLE_ID], 'Moderator');
  }

  if (type === 'minecraft') {
    return assignAndAnnounce(interaction, target, [CONFIG.ROLE_IDS.MINECRAFT_MOD, CONFIG.BBT_TEAM_ROLE_ID], 'Minecraft');
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

async function executeStrike(interaction) {
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  const canManageServer = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

  if (!isAdmin && !canManageServer) {
    return interaction.reply({
      content: '❌ You must have Administrator or Manage Server to use this.',
      ephemeral: true
    });
  }

  const targetUser = interaction.options.getUser('user', true);
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  const reason = interaction.options.getString('reason', true);
  const logChannel = interaction.options.getChannel('channel', true);

  if (!targetMember) {
    return interaction.reply({ content: '❌ That user is not in this server.', ephemeral: true });
  }

  if (!targetMember.roles.cache.has(CONFIG.BBT_TEAM_ROLE_ID)) {
    return interaction.reply({ content: '❌ That member is not on the staff team.', ephemeral: true });
  }

  await db.query(
    `INSERT INTO staff_strikes (user_id, moderator_id, reason, log_channel_id)
     VALUES (?, ?, ?, ?)`,
    [targetMember.id, interaction.user.id, reason, logChannel.id]
  );

  const [countRows] = await db.query(
    'SELECT COUNT(*) AS count FROM staff_strikes WHERE user_id = ?',
    [targetMember.id]
  );

  const count = Number(countRows?.[0]?.count || 0);
  const thresholdNote = count >= 3
    ? '\n⚠️ This staff member has reached **3 strikes** and should be reviewed for manual removal from the staff team.'
    : '';

  const strikeEmbed = new EmbedBuilder()
    .setTitle('⚠️ Staff Strike Issued')
    .setColor(0xED4245)
    .addFields(
      { name: 'Staff Member', value: `<@${targetMember.id}>`, inline: true },
      { name: 'Given By', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Total Strikes', value: `**${count}**`, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'Manual action required at 3 strikes (not automatic).' });

  await logChannel.send({
    content: thresholdNote || undefined,
    embeds: [strikeEmbed]
  });

  return interaction.reply({
    content: `✅ Strike logged for <@${targetMember.id}>. They now have **${count}** strike(s).`,
    ephemeral: true
  });
}

async function executeRequestLeave(interaction) {
  if (!interaction.member.roles.cache.has(CONFIG.BBT_TEAM_ROLE_ID)) {
    return interaction.reply({
      content: '❌ Only staff members can request leave.',
      ephemeral: true
    });
  }

  const reason = interaction.options.getString('reason', true);
  const length = interaction.options.getString('length', true);

  const [result] = await db.query(
    `INSERT INTO staff_leave_requests (user_id, reason, length_text, status)
     VALUES (?, ?, ?, 'pending')`,
    [interaction.user.id, reason, length]
  );
  const requestId = result.insertId;

  const reviewChannel = interaction.guild.channels.cache.get(CONFIG.MANAGEMENT_LEAVE_CHANNEL_ID);

  if (!reviewChannel) {
    return interaction.reply({
      content: '❌ Management leave channel is misconfigured.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📝 Staff Leave Request')
    .setColor(0xFEE75C)
    .addFields(
      { name: 'Request ID', value: `#${requestId}`, inline: true },
      { name: 'Staff Member', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Length', value: length, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`staff_leave_decide:allow:${requestId}`)
      .setLabel('Allow')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`staff_leave_decide:deny:${requestId}`)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`staff_leave_decide:partial:${requestId}`)
      .setLabel('Partially Allow')
      .setStyle(ButtonStyle.Secondary)
  );

  await reviewChannel.send({ embeds: [embed], components: [row] });

  return interaction.reply({
    content: '✅ Your leave request was sent to management for review.',
    ephemeral: true
  });
}

async function assignAndAnnounce(interaction, member, roleIds, typeLabel) {
  const rolesToAdd = roleIds.filter(Boolean);

  try {
    await member.roles.add(rolesToAdd);
  } catch (err) {
    console.error('staff add role assign failed:', err);
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
