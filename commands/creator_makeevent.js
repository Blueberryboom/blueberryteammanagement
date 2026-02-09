const { SlashCommandBuilder, EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');

// ===== CONFIG =====
const creatorRoleId = "1468302058749690026";
const eventTeamRoleId = "1468294094403928348";

const requestChannelId = "1468298889101705414";
const logChannelId = "1468013210446594280";

const COOLDOWN_HOURS = 24;
// ==================

// In-memory cooldown (you can move to DB later)
const lastRequest = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('creator_makeevent')
    .setDescription('Request to host an event on the network')

    .addStringOption(o =>
      o.setName('title')
        .setDescription('Name of your event')
        .setRequired(true)
        .setMaxLength(60)
    )

    .addStringOption(o =>
      o.setName('description')
        .setDescription('What will happen in the event?')
        .setRequired(true)
        .setMaxLength(500)
    )

    .addStringOption(o =>
      o.setName('datetime')
        .setDescription('Date & time (e.g. 25/06 7pm GMT)')
        .setRequired(true)
    )

    .addStringOption(o =>
      o.setName('duration')
        .setDescription('How long will it last?')
        .setRequired(true)
    )

    .addIntegerOption(o =>
      o.setName('player_limit')
        .setDescription('Max players (0 = unlimited)')
        .setRequired(true)
    )

    .addStringOption(o =>
      o.setName('prizes')
        .setDescription('What can players win?')
        .setRequired(true)
    )

    .addStringOption(o =>
      o.setName('server_type')
        .setDescription('SMP / Events / Minigames / Other')
        .setRequired(true)
    )

    .addBooleanOption(o =>
      o.setName('needs_staff')
        .setDescription('Do you need staff help?')
        .setRequired(true)
    )

    .addBooleanOption(o =>
      o.setName('promotion')
        .setDescription('Need announcement/ping promotion?')
        .setRequired(true)
    ),

  async execute(interaction) {

    // ----- ROLE CHECK -----
    if (!interaction.member.roles.cache.has(creatorRoleId)) {
      return interaction.reply({
        content: "❌ Only registered creators can request events!",
        ephemeral: true
      });
    }

    // ----- COOLDOWN -----
    const now = Date.now();
    const last = lastRequest.get(interaction.user.id);

    if (last && now - last < COOLDOWN_HOURS * 60 * 60 * 1000) {
      const remaining =
        Math.ceil((COOLDOWN_HOURS * 60 * 60 * 1000 - (now - last)) / 3600000);

      return interaction.reply({
        content: `⏱ You can only submit one event every ${COOLDOWN_HOURS} hours!\nTry again in **${remaining} hours**.`,
        ephemeral: true
      });
    }

    // ----- GET DATA -----
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const datetime = interaction.options.getString('datetime');
    const duration = interaction.options.getString('duration');
    const limit = interaction.options.getInteger('player_limit');
    const prizes = interaction.options.getString('prizes');
    const serverType = interaction.options.getString('server_type');
    const needsStaff = interaction.options.getBoolean('needs_staff');
    const promo = interaction.options.getBoolean('promotion');

    // ----- CREATE EMBED -----
    const embed = new EmbedBuilder()
      .setTitle(`🎪 Event Request — ${title}`)
      .setColor(0x5865F2)
      .addFields(
        { name: "📝 Description", value: description },
        { name: "📅 Date & Time", value: datetime, inline: true },
        { name: "⏱ Duration", value: duration, inline: true },
        { name: "👥 Player Limit", value: limit === 0 ? "Unlimited" : `${limit}`, inline: true },
        { name: "🎁 Prizes", value: prizes },
        { name: "🧱 Server Type", value: serverType, inline: true },
        { name: "🛠 Needs Staff", value: needsStaff ? "Yes" : "No", inline: true },
        { name: "📢 Promotion Needed", value: promo ? "Yes" : "No", inline: true },
        { name: "🧑 Creator", value: `${interaction.user.tag}` }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // ----- POST REQUEST -----
    const channel = interaction.guild.channels.cache.get(requestChannelId);

    const message = await channel.send({
      content: `<@&${eventTeamRoleId}>`,
      embeds: [embed]
    });

    // ----- REACTIONS -----
    await message.react("✅");
    await message.react("❌");

    // ----- CREATE THREAD -----
    const thread = await message.startThread({
      name: `event-${interaction.user.username}-${title.slice(0, 20)}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      reason: "Creator event discussion"
    });

    await thread.send({
      content:
`🧵 **Staff Discussion Thread**

Creator: <@${interaction.user.id}>
Team: <@&${eventTeamRoleId}>

Use this thread to:
• Ask questions  
• Plan staffing  
• Approve/deny (using reactions)

---`,
      embeds: [embed]
    });

    // ----- SAVE COOLDOWN -----
    lastRequest.set(interaction.user.id, now);

    // ----- CONFIRM TO CREATOR -----
    await interaction.reply({
      content: "✅ Your event request has been submitted to the team!",
      ephemeral: true
    });

    // ----- LOGGING -----
    const log = interaction.guild.channels.cache.get(logChannelId);

    if (log) {
      const logEmbed = new EmbedBuilder()
        .setTitle("🎪 Event Request Created")
        .setColor(0x57F287)
        .addFields(
          { name: "Creator", value: `${interaction.user.tag}`, inline: true },
          { name: "Title", value: title, inline: true },
          { name: "Needs Staff", value: needsStaff ? "Yes" : "No", inline: true },
          { name: "Promotion", value: promo ? "Yes" : "No", inline: true }
        )
        .setDescription(`[Jump to request](${message.url})`)
        .setTimestamp();

      log.send({ embeds: [logEmbed] });
    }
  }
};
