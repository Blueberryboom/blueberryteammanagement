const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const db = require('../database/db');
const config = require('../config/tickets');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket moderation commands')

    // ----- /ticket useradd -----
    .addSubcommand(sub =>
      sub
        .setName('useradd')
        .setDescription('Add a user to this ticket (staff only)')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('User to add')
            .setRequired(true)
        )
    )

    // ----- /ticket closerequest -----
    .addSubcommand(sub =>
      sub
        .setName('closerequest')
        .setDescription('Ask the user if they want to close the ticket')
    )

    // ----- /ticket blacklist -----
    .addSubcommand(sub =>
      sub
        .setName('blacklist')
        .setDescription('Prevent a user from opening tickets')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('User to blacklist')
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName('reason')
            .setDescription('Why they are blacklisted')
            .setRequired(false)
        )
    )

    // ----- /ticket unblacklist -----
    .addSubcommand(sub =>
      sub
        .setName('unblacklist')
        .setDescription('Remove a user from the ticket blacklist')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('User to unblacklist')
            .setRequired(true)
        )
    ),

  async execute(interaction) {

    const sub = interaction.options.getSubcommand();

    // ===================================================
    // /ticket blacklist + /ticket unblacklist
    // ===================================================
    if (sub === 'blacklist' || sub === 'unblacklist') {
      const isAdmin = config.adminRoles.some(id => interaction.member.roles.cache.has(id));

      if (!isAdmin) {
        return interaction.reply({
          content: '❌ Only admins can manage the ticket blacklist.',
          ephemeral: true
        });
      }

      const user = interaction.options.getUser('user');

      if (sub === 'blacklist') {
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        await db.query(
          `INSERT INTO ticket_blacklist (user_id, blacklisted_by, reason)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             blacklisted_by = VALUES(blacklisted_by),
             reason = VALUES(reason),
             created_at = CURRENT_TIMESTAMP`,
          [user.id, interaction.user.id, reason]
        );

        return interaction.reply({
          content: `🚫 ${user} is now blacklisted from opening tickets.\nReason: ${reason}`,
          ephemeral: true
        });
      }

      await db.query(
        'DELETE FROM ticket_blacklist WHERE user_id = ?',
        [user.id]
      );

      return interaction.reply({
        content: `✅ ${user} has been removed from the ticket blacklist.`,
        ephemeral: true
      });
    }

    // ----- GET TICKET FROM DB -----
    const [rows] = await db.query(
      'SELECT * FROM tickets WHERE channel_id = ?',
      [interaction.channel.id]
    );

    const ticket = Array.isArray(rows) ? rows[0] : null;

    if (!ticket) {
      return interaction.reply({
        content: '❌ This command can only be used inside a ticket channel.',
        ephemeral: true
      });
    }

    // ----- STAFF CHECK -----
    const isStaff = config.permissions[ticket.type].viewRoles
      .some(id => interaction.member.roles.cache.has(id));

    if (!isStaff) {
      return interaction.reply({
        content: '❌ Only ticket staff can use this.',
        ephemeral: true
      });
    }

    // ===================================================
    // /ticket useradd
    // ===================================================
    if (sub === 'useradd') {

      const user = interaction.options.getUser('user');

      await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      await db.query(
        'INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)',
        [ticket.id, 'USER_ADD', interaction.user.id, `Added ${user.id}`]
      );

      return interaction.reply({
        content: `✅ Added ${user} to this ticket.`
      });
    }

    // ===================================================
    // /ticket closerequest
    // ===================================================
    if (sub === 'closerequest') {

      const targetUser = await interaction.guild.members
        .fetch(ticket.user_id)
        .catch(() => null);

      if (!targetUser) {
        return interaction.reply({
          content: '❌ Ticket owner not found in server.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📩 Ticket Close Request')
        .setColor(0x5865F2)
        .setDescription(
`Hey ${targetUser}!
Staff have asked if this ticket can now be closed.

Please choose an option below:`
        )
        .addFields(
          { name: 'Ticket', value: interaction.channel.name, inline: true },
          { name: 'Requested By', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Yes, close it')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('ticket_keepopen_request')
          .setLabel('No, keep it open')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.channel.send({
        content: `${targetUser}`,
        embeds: [embed],
        components: [row]
      });

      await db.query(
        'INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)',
        [ticket.id, 'CLOSE_REQUEST', interaction.user.id, 'Asked user to close ticket']
      );

      return interaction.reply({
        content: '📩 Close request sent to user.',
        ephemeral: true
      });
    }
  }
};
