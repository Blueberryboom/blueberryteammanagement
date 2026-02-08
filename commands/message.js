const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// ===== PERMISSIONS =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037",  // Senior Moderator
  "1468294094403928348", // Event Team
  "1455544392415842500", // Trial Mod
  "1468294406363680800" // Moderator
];

// ===== YOUR MESSAGE LIBRARY =====
const messages = {
  partnerguidelines: `
# 🤝 BlueberryTeam – Partner Guidelines

Thanks for being interested in partnering with us!
By becoming a partner with **The BlueberryTeam**, you agree to the following rules.
These rules are subject to changes. In the event of a change, you will be given 2 weeks notice. 
-# V1

**1.** Your server must have no fewer than 30 human members.
**2.** Being partners with us DOES NOT allow you to advertise in the server. Only authorised advertising is permitted.
**3.** Content within the server must follow our <#1455310485363757330>.
**4.** Represent the BlueberryTeam, The Blueberry Network, and our affiliates positively. If you are uncomfortable with us being partnered with another server, please let us know through a support ticket.
**5.** If your server has less than 45 members, you must follow our <#1456355064678453279> channel in your server.
**6.** The server must be advertised in an advertising/partnership specific channel and take no less than 3 seconds to view when scrolling up.
**7.** The owner/admin of the server MUST stay in this server.
**8.** *[NOT REQUIRED]* Add our discord bot (BBGames) to your discord! We offer free customization of the bot too! *[STILL IN DEVELOPMENT - DOWNTIME MAY HAPPEN EVERY FEW DAYS WHILE WE FIX CRITICAL BUGS]*

Breaking any of these rules will result in immediate termination from our partners.
`,

  suggestion_accepted: `
# <:tick:1470047223185408188> Suggestion Accepted
Thanks for making the server a better place!
We'll aim to have your idea implemented in the next few days!
`,

  suggestion_denied: `
# <:cross:1470047224619859998> Suggestion Denied
We're sorry, but after review by our staff team, your suggestion has been denied.
`,

  huh: `
huh
`
  
};
// ================================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('message')
    .setDescription('Send a premade server message')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Which message to send')
        .setRequired(true)
        .addChoices(
          { name: 'Partner Guidelines', value: 'partnerguidelines' },
          { name: 'Suggestion - Accepted', value: 'suggestion_accepted' },
          { name: 'Suggestion - Denied', value: 'suggestion_denied' },
          { name: 'huh', value: 'huh' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {

    // ---- ROLE CHECK ----
    const member = interaction.member;

    const hasRole = allowedRoleIds.some(id =>
      member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const name = interaction.options.getString('name');
    const content = messages[name];

    if (!content) {
      return interaction.reply({
        content: "❌ That message doesn't exist!",
        ephemeral: true
      });
    }

    await interaction.channel.send(content);

    await interaction.reply({
      content: `✅ Sent message: **${name}**`,
      ephemeral: true
    });
  }
};
