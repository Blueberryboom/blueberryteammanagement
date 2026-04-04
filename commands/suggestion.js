const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');

// ===== CONFIG =====
const BBT_TEAM_ROLE_IDS = [
  '1470919775847973012'
];

const MANAGEMENT_LOG_CHANNEL_ID = '1468013210446594280';

const SUGGESTION_TAG_IDS = {
  denied: 'REPLACE_WITH_DENIED_TAG_ID',
  considering: 'REPLACE_WITH_CONSIDERING_TAG_ID',
  accepted: 'REPLACE_WITH_ACCEPTED_TAG_ID',
  future: 'REPLACE_WITH_FUTURE_TAG_ID',
  planned: 'REPLACE_WITH_PLANNED_TAG_ID'
};
// ==================

const statuses = {
  deny: {
    key: 'denied',
    title: '❌ Suggestion Denied',
    lockAndClose: true,
    message: reason =>
      `# ❌ Suggestion Denied\n${reason ? `**Reason:** ${reason}\n` : ''}Thanks for sharing your idea with us.`
  },
  considering: {
    key: 'considering',
    title: '🤔 Suggestion Under Consideration',
    lockAndClose: false,
    message: reason =>
      `# 🤔 Suggestion Under Consideration\n${reason ? `**Notes:** ${reason}\n` : ''}Thanks for your suggestion. We're actively discussing it.`
  },
  accepted: {
    key: 'accepted',
    title: '✅ Suggestion Accepted',
    lockAndClose: true,
    message: reason =>
      `# ✅ Suggestion Accepted\n${reason ? `**Notes:** ${reason}\n` : ''}Great idea — thank you for helping improve the server!`
  },
  future: {
    key: 'future',
    title: '🧭 Suggestion Saved for the Future',
    lockAndClose: true,
    message: reason =>
      `# 🧭 Suggestion Saved for the Future\n${reason ? `**Notes:** ${reason}\n` : ''}We like this idea and may revisit it later.`
  },
  planned: {
    key: 'planned',
    title: '🗂️ Suggestion Already Planned',
    lockAndClose: true,
    message: reason =>
      `# 🗂️ Suggestion Already Planned\n${reason ? `**Notes:** ${reason}\n` : ''}Good news — this is already on our roadmap.`
  }
};

function isInBbtTeam(member) {
  return BBT_TEAM_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Manage a suggestion forum post status')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(subcommand =>
      subcommand
        .setName('deny')
        .setDescription('Deny a suggestion')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Why the suggestion was denied')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('considering')
        .setDescription('Mark a suggestion as under consideration')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Context or notes for this status')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('accepted')
        .setDescription('Accept a suggestion')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Why the suggestion was accepted')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('future')
        .setDescription('Save a suggestion for future review')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Why this is being deferred')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('planned')
        .setDescription('Mark a suggestion as already planned')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('What is already planned')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!isInBbtTeam(interaction.member)) {
      return interaction.reply({
        content: "❌ You must be in the BBT Team to use this command.",
        ephemeral: true
      });
    }

    const channel = interaction.channel;
    if (!channel || !channel.isThread()) {
      return interaction.reply({
        content: '❌ This command can only be used in a suggestion forum post thread.',
        ephemeral: true
      });
    }

    if (!channel.parent || channel.parent.type !== ChannelType.GuildForum) {
      return interaction.reply({
        content: '❌ This command can only be used in a forum post thread.',
        ephemeral: true
      });
    }

    const action = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason', true).trim();
    const status = statuses[action];
    const tagId = SUGGESTION_TAG_IDS[status.key];

    if (!tagId || tagId.startsWith('REPLACE_WITH_')) {
      return interaction.reply({
        content: `❌ Missing config: set the tag ID for **${status.key}** in \`commands/suggestion.js\`.`,
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const existingTags = channel.appliedTags || [];
    const appliedTags = existingTags.includes(tagId)
      ? existingTags
      : [...existingTags, tagId];

    await channel.setAppliedTags(appliedTags, `${interaction.user.tag} used /suggestion ${action}`);
    await channel.send(status.message(reason));

    if (status.lockAndClose) {
      await channel.setLocked(true, `${interaction.user.tag} used /suggestion ${action}`);
      await channel.setArchived(true, `${interaction.user.tag} used /suggestion ${action}`);
    }

    const logChannel = interaction.guild.channels.cache.get(MANAGEMENT_LOG_CHANNEL_ID);
    if (logChannel && logChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle('Suggestion Status Updated')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Action', value: status.title, inline: true },
          { name: 'Staff', value: `${interaction.user}`, inline: true },
          { name: 'Post', value: `[Jump to post](${channel.url})`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    await interaction.editReply({
      content: `✅ Updated suggestion to **${status.key}**.${status.lockAndClose ? ' Post locked and closed.' : ''}`
    });
  }
};
