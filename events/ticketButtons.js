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

    const [rows] = await db.query(
      "SELECT * FROM tickets WHERE channel_id = ?",
      [interaction.channel.id]
    );

    const ticket = Array.isArray(rows) ? rows[0] : null;

    if (!ticket) {
      return interaction.reply({
        content: "❌ Ticket not found in database.",
        ephemeral: true
      });
    }

    if (id === 'ticket_claim')
      return claimTicket(interaction, ticket);

    if (id === 'ticket_close')
      return closeTicket(interaction, ticket, "No reason provided");

    if (id === 'ticket_closereason')
      return askReason(interaction, ticket);
  }
};

// ================= FUNCTIONS =================

async function claimTicket(interaction, ticket) {

  const isStaff = config.permissions[ticket.type].viewRoles
    .some(id => interaction.member.roles.cache.has(id));

  if (!isStaff) {
    return interaction.reply({
      content: "❌ Only staff can claim tickets.",
      ephemeral: true
    });
  }

  if (ticket.claimed_by) {
    return interaction.reply({
      content: "❌ This ticket is already claimed.",
      ephemeral: true
    });
  }

  await db.query(
    "UPDATE tickets SET claimed_by = ? WHERE id = ?",
    [interaction.user.id, ticket.id]
  );

  await db.query(
    "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
    [ticket.id, "CLAIM", interaction.user.id, "Ticket claimed"]
  );

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`✅ Ticket claimed by ${interaction.user}`)
    ]
  });

  await interaction.reply({
    content: "You claimed this ticket.",
    ephemeral: true
  });
}

// ------------------------------------------------

async function closeTicket(interaction, ticket, reason) {

  const isStaff = config.permissions[ticket.type].viewRoles
    .some(id => interaction.member.roles.cache.has(id));

  if (!isStaff) {
    return interaction.reply({
      content: "❌ Only staff can close tickets.",
      ephemeral: true
    });
  }

  await db.query(
    "UPDATE tickets SET status = 'closed' WHERE id = ?",
    [ticket.id]
  );

  await db.query(
    "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
    [ticket.id, "CLOSE", interaction.user.id, reason]
  );

  await interaction.channel.permissionOverwrites.edit(
    ticket.user_id,
    {
      ViewChannel: false,
      SendMessages: false
    }
  );

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("🔒 Ticket Closed")
        .setDescription(`**Reason:** ${reason}\nClosed by ${interaction.user}`)
    ]
  });

  const log = interaction.guild.channels.cache.get(config.logChannelId);

  if (log) {
    log.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Ticket Closed")
          .addFields(
            { name: "Ticket", value: `<#${interaction.channel.id}>` },
            { name: "By", value: interaction.user.tag },
            { name: "Reason", value: reason }
          )
      ]
    });
  }

  await interaction.reply({
    content: "Ticket closed.",
    ephemeral: true
  });
}

// ------------------------------------------------

async function askReason(interaction, ticket) {

  await interaction.reply({
    content: "Please type the close reason in chat within 60 seconds.",
    ephemeral: true
  });

  const filter = m =>
    m.author.id === interaction.user.id &&
    m.channel.id === interaction.channel.id;

  const collector = interaction.channel.createMessageCollector({
    filter,
    max: 1,
    time: 60000
  });

  collector.on('collect', async msg => {
    await msg.delete().catch(() => {});
    try {
      await closeTicket(interaction, ticket, msg.content);
    } catch (err) {
      console.error(err);
    }
  });

  collector.on('end', c => {
    if (c.size === 0) {
      interaction.followUp({
        content: "❌ Timed out – close cancelled.",
        ephemeral: true
      });
    }
  });
}
