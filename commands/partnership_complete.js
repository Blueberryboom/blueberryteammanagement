const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037",  // Senior Moderator
  "1468294094403928348", // Event Team
  "1455544392415842500", // Trial Mod
  "1468294406363680800" // Moderator
];

const partnerRoleId = "1468302227075498105";      // @Partner
const logChannelId = "1468013210446594280";      // management-logs
const partnershipsChannelId = "1459595084663099609"; // public showcase
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership_complete')
    .setDescription('Finish a partnership and announce it')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Partner user')
        .setRequired(true)
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

    // ----- ROLE CHECK -----
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const serverName = interaction.options.getString('server_name');
    const rulesShown = interaction.options.getBoolean('rules_shown');
    const adSent = interaction.options.getBoolean('ad_sent');

    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({
        content: "❌ User not in server!",
        ephemeral: true
      });
    }

    if (!rulesShown) {
      return interaction.reply({
        content: "❌ You must confirm you showed them the partner guidelines!",
        ephemeral: true
      });
    }

    if (!adSent) {
      return interaction.reply({
        content: "❌ You must confirm OUR advert was posted in their server!",
        ephemeral: true
      });
    }

    if (member.roles.cache.has(partnerRoleId)) {
      return interaction.reply({
        content: "⚠️ User already has Partner role!",
        ephemeral: true
      });
    }

    // ----- ADD ROLE -----
    await member.roles.add(partnerRoleId);

    // ----- PUBLIC ANNOUNCEMENT -----
    const announce = interaction.guild.channels.cache.get(partnershipsChannelId);

    if (announce) {
      const embed = new EmbedBuilder()
        .setTitle(`🤝 Partnership with ${serverName}`)
        .setColor(0x5865F2)
        .addFields(
          {
            name: "<:312668partner:1470082523026686219> Partnered By",
            value: `${user}`,
            inline: false
          },
          {
            name: "<:312668partner:1470082523026686219> Info",
            value: "Want your server to be partnered with us? Send us a ticket in <#1456400359798083789>",
            inline: false
          }
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      announce.send({ embeds: [embed] });
    }

    // ----- DM TO PARTNER -----
    try {
      const dm = new EmbedBuilder()
        .setTitle("🤝 Partnership Confirmed!")
        .setColor(0x57F287)
        .setDescription(
`Hi ${user.username}!  

Your server **${serverName}** is now officially partnered with us and you now have the **Partner** role in our discord!

Please ensure that you follow our partnership guidelines as outlined in the rules you agreed too.
If you require any further support - let us know in a ticket!

Thanks - **The Blueberry Team Management**`
        )
        .setTimestamp();

      await user.send({ embeds: [dm] });

    } catch (err) {
      // DM closed – ignore
    }

    // ----- STAFF CONFIRM -----
    await interaction.reply({
      content: `✅ Partnership completed with **${serverName}**`,
      ephemeral: true
    });

    // ----- LOGGING -----
    const log = interaction.guild.channels.cache.get(logChannelId);

    if (log) {
      const logEmbed = new EmbedBuilder()
        .setTitle("🤝 Partnership Completed")
        .setColor(0x5865F2)
        .addFields(
          { name: "Partner", value: `${user.tag}`, inline: true },
          { name: "Server", value: serverName, inline: true },
          { name: "Rules Shown", value: rulesShown ? "Yes" : "No", inline: true },
          { name: "Our Ad Sent", value: adSent ? "Yes" : "No", inline: true },
          { name: "Added By", value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      log.send({ embeds: [logEmbed] });
    }

  }
};
