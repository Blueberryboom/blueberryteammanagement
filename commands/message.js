const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// ===== PERMISSIONS =====
const allowedRoleIds = [
  '1470919775847973012' // BBT Team
];

// ===== YOUR MESSAGE LIBRARY =====
const messages = {
  partner_guidelines: `
# <:312668partner:1470082523026686219> BlueberryTeam – Partner Guidelines

Thanks for your interest in partnering with us!
By becoming a partner with **The BlueberryTeam**, you agree to the following rules.

**1.** Your server must have no fewer than 30 human members.
**2.** Being partners with us DOES NOT allow you to advertise in the server. Only authorised advertising is permitted.
**3.** Content within the server must follow our <#1455310485363757330>.
**4.** Your server cannot offer any services that compete with us, specifically Minecraft servers.

Thanks!
`,

  creator_guidelines: `
# <:youtube:1473318721996193834> BlueberryTeam – Creator Requirements

Thanks for being interested in becoming a creator on our network!
By becoming a creator on the **Blueberry Network**, you agree to the following requirements.
These requirements are subject to changes. In the event of a change, you will be given 1 weeks notice. 
-# V1

**1.** Your channel must have 30+ subscribers.
**2.** You must upload at least once every month.
**3.** Content within the channel must follow our <#1455310485363757330>.
**4.** Represent the BlueberryTeam, The Blueberry Network, and our affiliates positively.
**5.** Your average view count to recieve perks must be more than 500+ views!
**6.** The server must be mentioned every 3-6 videos.
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
          { name: 'Partner Guidelines', value: 'partner_guidelines' },
          { name: 'Creator Guidelines', value: 'creator_guidelines' }
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
