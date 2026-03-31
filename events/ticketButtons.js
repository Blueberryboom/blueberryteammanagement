const { 
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

    if (!interaction.isButton()) return;

    const id = interaction.customId;

    // 👇 ADDED ticket_keepopen_request
    if (![
      'ticket_claim',
      'ticket_close',
      'ticket_closereason',
      'ticket_close_confirm',
      'ticket_close_cancel',
      'ticket_keepopen_request'
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
      return askCloseConfirm(interaction, ticket);

    if (id === 'ticket_closereason')
      return askReason(interaction, ticket);

    if (id === 'ticket_close_confirm')
      return confirmClose(interaction, ticket, "No reason provided");

    if (id === 'ticket_close_cancel')
      return interaction.update({
        content: "✅ Close cancelled.",
        embeds: [],
        components: []
      });

    // 👇 NEW
    if (id === 'ticket_keepopen_request')
      return keepOpenRequest(interaction, ticket);
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
        .setTitle("<:3169blurpleverified1:1470050180601479178> Ticket claimed!")
        .setDescription(`Your ticket will be handled by ${interaction.user}`)
    ]
  });

  await interaction.reply({
    content: "You claimed this ticket.",
    ephemeral: true
  });
}

// ------------------------------------------------

async function askCloseConfirm(interaction, ticket) {

  const isStaff = config.permissions[ticket.type].viewRoles
    .some(id => interaction.member.roles.cache.has(id));

  const isTicketOwner = interaction.user.id === ticket.user_id;

  if (ticket.prevent_user_close && isTicketOwner && !isStaff) {
    return interaction.reply({
      content: "❌ You cannot close this ticket. A staff member must close it.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("<a:85951rfalert:1470557230674870476> Confirm Ticket Closure")
    .setColor(0xED4245)
    .setDescription(
`Are you sure you want to close this ticket?

• Channel will be **deleted**  
• Ticket will be **removed from database**  
• This cannot be undone`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close_confirm')
      .setLabel('Yes, Delete Ticket')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('ticket_close_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

// ------------------------------------------------

async function keepOpenRequest(interaction, ticket) {

  // Build staff ping string from config
  const staffRoles =
    config.permissions[ticket.type].viewRoles
      .map(id => `<@&${id}>`)
      .join(" ");

  const embed = new EmbedBuilder()
    .setTitle("🟡 User Wants Ticket To Stay Open")
    .setColor(0xFEE75C)
    .setDescription(
`${interaction.user} has chosen to keep this ticket open!`
    )
    .addFields(
      { name: "Ticket", value: interaction.channel.name, inline: true },
      { name: "User", value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  await interaction.channel.send({
    content: staffRoles,
    embeds: [embed]
  });

  await db.query(
    "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
    [
      ticket.id,
      "KEEP_OPEN",
      interaction.user.id,
      "User requested ticket stay open"
    ]
  );

  await interaction.reply({
    content: "✅ Staff have been notified that you want this ticket to stay open.",
    ephemeral: true
  });
}

// ------------------------------------------------

async function confirmClose(interaction, ticket, reason) {
  if (config.settings.transcriptOnClose) {
    await sendTranscriptToManagementThread(interaction, ticket, reason);
  }

  await db.query(
    "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
    [ticket.id, "DELETE", interaction.user.id, reason]
  );

  await db.query(
    "DELETE FROM tickets WHERE id = ?",
    [ticket.id]
  );

  const log =
    interaction.guild.channels.cache.get(config.logChannelId);

  if (log) {
    log.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗑 Ticket Deleted")
          .setColor(0xED4245)
          .addFields(
            { name: "Channel", value: interaction.channel.name },
            { name: "By", value: interaction.user.tag },
            { name: "Reason", value: reason }
          )
          .setTimestamp()
      ]
    });
  }

  try {
    await interaction.reply({
      content: "🗑 Deleting ticket...",
      ephemeral: true
    });
  } catch {}

  await interaction.channel.delete().catch(() => {});
}

// ------------------------------------------------

async function sendTranscriptToManagementThread(interaction, ticket, reason) {
  if (!ticket.transcript_thread_id) return;

  const transcriptThread = interaction.guild.channels.cache.get(ticket.transcript_thread_id);
  if (!transcriptThread) return;

  const transcriptLines = await buildTranscriptLines(interaction.channel);

  const transcriptHeader =
`📄 **Ticket Transcript**
Ticket: #${ticket.id}
Channel: ${interaction.channel.name}
Closed by: ${interaction.user.tag}
Reason: ${reason}
Closed at: <t:${Math.floor(Date.now() / 1000)}:F>
`;

  const chunks = chunkText([transcriptHeader, ...transcriptLines].join('\n'), 1900);

  for (const chunk of chunks) {
    await transcriptThread.send({ content: chunk });
  }
}

async function buildTranscriptLines(channel) {
  const all = [];
  let before;

  while (true) {
    const options = { limit: 100 };
    if (before) options.before = before;

    const batch = await channel.messages.fetch(options);
    if (!batch.size) break;

    const ordered = [...batch.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    for (const message of ordered) {
      const stamp = Math.floor(message.createdTimestamp / 1000);
      const clean = (message.cleanContent || '').trim();
      const content = clean.length ? clean : '[no text content]';
      all.push(`[${stamp}] ${message.author.tag}: ${content}`);
    }

    if (batch.size < 100) break;
    before = batch.last().id;
  }

  if (all.length === 0) {
    return ['[No messages found in this ticket.]'];
  }

  return all;
}

function chunkText(text, maxLen) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLen));
    start += maxLen;
  }

  return chunks;
}

// ------------------------------------------------

async function askReason(interaction, ticket) {
  const isStaff = config.permissions[ticket.type].viewRoles
    .some(id => interaction.member.roles.cache.has(id));

  const isTicketOwner = interaction.user.id === ticket.user_id;

  if (ticket.prevent_user_close && isTicketOwner && !isStaff) {
    return interaction.reply({
      content: "❌ You cannot close this ticket. A staff member must close it.",
      ephemeral: true
    });
  }

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

    // FIXED – no double reply crash
    await confirmClose(interaction, ticket, msg.content);
  });

  collector.on('end', c => {
    if (c.size === 0) {
      interaction.followUp({
        content: "❌ Timed out – close cancelled.",
        ephemeral: true
      }).catch(() => {});
    }
  });
}
