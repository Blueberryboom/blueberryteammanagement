const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const config = require('../config/tickets');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    if (![
      'ticket_claim',
      'ticket_close',
      'ticket_closereason'
    ].includes(id)) return;

    // ----- GET TICKET FROM DB -----
    const [rows] = await db.query(
      "SELECT * FROM tickets WHERE channel_id = ?",
      [interaction.channel.id]
    );

    const ticket = rows?.[0];

    if (!ticket) {
      return interaction.reply({
        content: "❌ Ticket not found in database.",
        ephemeral: true
      });
    }

    // ----- CLAIM TICKET -----
    if (id === 'ticket_claim') {
      return claimTicket(interaction, ticket);
    }

    // ----- CLOSE (NO REASON) -----
    if (id === 'ticket_close') {
      return closeTicket(interaction, ticket, "No reason provided");
    }

    // ----- CLOSE WITH REASON -----
    if (id === 'ticket_closereason') {
      return askReason(interaction, ticket);
   
    }
  }
};
