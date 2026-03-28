const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  '1470536730779062433' // Growth Manager
];

const logChannelId = '1468013210446594280'; // management-logs
const partnershipsChannelId = '1459595084663099609'; // public showcase
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership_complete')
    .setDescription('Finish a partnership and announce it')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Server owner/admin user (optional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('server_name')
        .setDescription('Name of their server')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('rules_shown')
        .setDescription('Have you shown them partner guidelines?')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('ad_sent')
        .setDescription('Has the AD been posted in BOTH our server and theirs?')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const hasRole = allowedRoleIds.some(id => interaction.member.roles.cache.has(id));

    if (!hasRole) {
      return interaction.editReply({
        content: "❌ You don't have permission to use this command."
      });
    }

    const user = interaction.options.getUser('user');

    const member = user
      ? (interaction.options.getMember('user') ||
        await interaction.guild.members.fetch(user.id).catch(() => null))
      : null;

    const serverName = interaction.options.getString('server_name');
    const rulesShown = interaction.options.getBoolean('rules_shown');
    const adSent = interaction.options.getBoolean('ad_sent');

    if (!rulesShown) {
      return interaction.editReply({
        content: '❌ You must confirm you showed them the partner guidelines!'
      });
    }

    if (!adSent) {
      return interaction.editReply({
        content: '❌ You must confirm OUR advert was posted in their server!'
      });
    }

    const rolesAddedText = 'None (role assignment disabled for this command)';

    const announce = interaction.guild.channels.cache.get(partnershipsChannelId);

    if (announce) {
      const embed = new EmbedBuilder()
        .setTitle(`<:312668partner:1470082523026686219> Partnership with ${serverName}`)
        .setColor(0x5865F2)
        .addFields(
          {
            name: '<:990644moderatorroleicon:1470566354196369491> Server Owner/Admin',
            value: member ? `<@${member.id}>` : 'Server owner/admin not in this server',
            inline: false
          },
          {
            name: '<:3169blurpleverified1:1470050180601479178> Authorized By (Staff)',
            value: `<@${interaction.member.id}>`,
            inline: false
          },
          {
            name: '<:312668partner:1470082523026686219> Info',
            value: 'Want your server to be partnered with us? Send us a ticket in <#1456400359798083789>',
            inline: false
          }
        )
        .setTimestamp();

      announce.send({ embeds: [embed] });
    }

    const log = interaction.guild.channels.cache.get(logChannelId);

    if (log) {
      const logEmbed = new EmbedBuilder()
        .setTitle('<:312668partner:1470082523026686219> Partnership Completed')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Partner', value: user ? user.tag : 'Not specified', inline: true },
          { name: 'Server', value: serverName, inline: true },
          { name: 'Rules Shown', value: rulesShown ? 'Yes' : 'No', inline: true },
          { name: 'Our Ad Sent', value: adSent ? 'Yes' : 'No', inline: true },
          { name: 'Authorized By', value: interaction.user.tag, inline: true },
          { name: 'Roles Added', value: rolesAddedText, inline: true }
        )
        .setTimestamp();

      log.send({ embeds: [logEmbed] });
    }

    await interaction.editReply({
      content: `✅ Partnership completed with **${serverName}**. No roles were assigned.`
    });
  }
};
