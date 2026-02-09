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

// ====== CUSTOM START MESSAGES PER TYPE ======
const startMessages = {
  partner: `<:312668partner:1470082523026686219> **Partnership Application**

Thanks for your interest in partnering with us!
While you wait for us to see this ticket, please let us know:
- Your server invite link  
- Member count  
- What your server is about
- Where our advert will be posted 

A server <@&1470536730779062433> will get back to you soon!`,

  creator: `<:201953camera:1470564956826243155> **Verified Creator Application**

Hi! While you wait for us to see this ticket, please let us know:
- Your channel link 
- Average views 
- Subscriber count
- Content type (long-form, shorts, live streams)
- How you’ll promote the network or server

Our <@&1468294094403928348> or a <@&1470536730779062433> will review your application shortly!`,

  staff: `<:990644moderatorroleicon:1470566354196369491> **Staff Application**

Thanks for applying for staff!
While you wait for us to review your application, please answer:
• Are you familiar with the server's rules and structure?
• Previous experience (not required)
• Why you want to join 
• Strengths & weaknesses  
• Timezone & availability`,

  other: `❓ **General Support**

Tell us what you need help with and we’ll assist as soon as possible!
Please note that general support tickets generally take longer for us to respond to due to being at a lower priority compared to other ticket types!`
};

// ============================================

async function modAppsOpen() {
  const [rows] = await db.query(
    "SELECT open, message FROM mod_applications WHERE id = 1"
  );

  return rows?.[0] || { open: false, message: "Applications closed." };
}

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

    // ======================================================
    // 🛑 BLOCK STAFF TICKETS IF MOD APPS CLOSED
    // ======================================================
    if (type === "staff") {
      const status = await modAppsOpen();

      if (!status.open) {
        return interaction.reply({
          content:
`❌ Moderator applications are currently **CLOSED**

${status.message}`,
          ephemeral: true
        });
      }
    }

    // ----- CHECK MAX OPEN -----
    const [existing] = await db.query(
      "SELECT COUNT(*) AS count FROM tickets WHERE user_id = ? AND status = 'open'",
      [interaction.user.id]
    );

    const count = Array.isArray(existing)
      ? existing[0]?.count
      : existing?.count;

    if (count >= config.settings.maxOpenTicketsPerUser) {
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

    // ----- START EMBED (DIFFERENT PER TYPE) -----
    const embed = new EmbedBuilder()
      .setTitle(ticketType.name)
      .setColor(0x5865F2)
      .setDescription(
        startMessages[type] ||
        "Please describe your request in detail."
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
            .setTitle("<:3169blurpleverified1:1470050180601479178> Ticket Created")
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
      content: `<:3169blurpleverified1:1470050180601479178> Ticket created: ${channel}`,
      ephemeral: true
    });
  }
};
