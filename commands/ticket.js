const { 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
    ),

  async execute(interaction) {

    const sub = interaction.options.getSubcommand();

    // ----- GET TICKET FROM DB -----
    const [rows] = await db.query(
      "SELECT * FROM tickets WHERE channel_id = ?",
      [interaction.channel.id]
    );

    const ticket = Array.isArray(rows) ? rows[0] : null;

    if (!ticket) {
      return interaction.reply({
        content: "❌ This command can only be used inside a ticket channel.",
        ephemeral: true
      });
    }

    // ----- STAFF CHECK -----
    const isStaff = config.permissions[ticket.type].viewRoles
      .some(id => interaction.member.roles.cache.has(id));

    if (!isStaff) {
      return interaction.reply({
        content: "❌ Only ticket staff can use this.",
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
        "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
        [ticket.id, "USER_ADD", interaction.user.id, `Added ${user.id}`]
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
          content: "❌ Ticket owner not found in server.",
          ephemeral: true
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Yes, close it')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('ticket_keepopen')
          .setLabel('Keep it open')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.channel.send({
        content: `${targetUser}, would you like to close this ticket?`,
        components: [row]
      });

      await db.query(
        "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
        [ticket.id, "CLOSE_REQUEST", interaction.user.id, "Asked user to close ticket"]
      );

      return interaction.reply({
        content: "📩 Close request sent to user.",
        ephemeral: true
        
      });
    }
  }
};
