const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const db = require('../database/db');
const config = require('../config/tickets');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'ticket_create') return;

    const type = interaction.values[0];
    const ticketType = config.permissions[type];

    if (!ticketType) {
      return interaction.reply({
        content: "❌ Invalid ticket type.",
        ephemeral: true
      });
    }

    // ----- CHECK MAX OPEN -----
    const [existing] = await db.query(
      "SELECT COUNT(*) AS count FROM tickets WHERE user_id = ? AND status = 'open'",
      [interaction.user.id]
    );

    if (existing.count >= config.settings.maxOpenTicketsPerUser) {
      return interaction.reply({
        content: "❌ You already have an open ticket!",
        ephemeral: true
      });
    }

    // ----- CHANNEL NAME -----
    const name =
      `${config.settings.naming.prefix}` +
      `${config.settings.naming.separator}` +
      `${interaction.user.username}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    // ----- PERMISSIONS -----
    const perms = [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    // Staff roles for this ticket type
    for (const roleId of ticketType.viewRoles) {
      perms.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }

    // ----- CREATE CHANNEL -----
    const channel = await interaction.guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: config.categoryId,
      permissionOverwrites: perms
    });

    // ----- SAVE TO DB -----
    await db.query(
      `INSERT INTO tickets (user_id, channel_id, type)
       VALUES (?, ?, ?)`,
      [interaction.user.id, channel.id, type]
    );

    // ----- START EMBED -----
    const embed = new EmbedBuilder()
      .setTitle(ticketType.name)
      .setColor(0x5865F2)
      .setDescription(
`Welcome ${interaction.user} 👋

Please explain your request in as much detail as possible.

A ${ticketType.name} team member will help soon.`
      )
      .addFields(
        { name: "Category", value: ticketType.name, inline: true },
        { name: "User", value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    // ----- CONTROL BUTTONS -----
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('ticket_closereason')
        .setLabel('Close With Reason')
        .setStyle(ButtonStyle.Secondary)
    );

    // ----- SEND FIRST MESSAGE -----
    await channel.send({
      content: config.settings.autoPingOnCreate
        ? ticketType.viewRoles.map(r => `<@&${r}>`).join(" ")
        : null,
      embeds: [embed],
      components: [row]
    });

    // ----- LOG -----
    const log = interaction.guild.channels.cache.get(config.logChannelId);

    if (log) {
      log.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎟 Ticket Created")
            .setColor(0x57F287)
            .addFields(
              { name: "User", value: interaction.user.tag, inline: true },
              { name: "Type", value: ticketType.name, inline: true },
              { name: "Channel", value: `<#${channel.id}>`, inline: true }
            )
            .setTimestamp()
        ]
      });
    }

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
  }
};
