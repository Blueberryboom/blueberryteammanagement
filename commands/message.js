const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// ===== YOUR MESSAGE LIBRARY =====
const messages = {
  partnerguidelines: `
# 🤝 **Blueberry Network – Partner Guidelines**

Thanks for being interested in partnering with us!
By becoming a partner with **The BlueberryTeam**, you agree to the following rules.
These rules are subject to changes. In the event of a change, you will be given 2 weeks notice. 
-# V1

**1.** Your server must have no fewer than 40 human members.
**2.** Being partners with us DOES NOT allow you to advertise in the server. Only authorised advertising is permitted.
**3.** Content within the server must follow our <#1455310485363757330>.
**4.** Represent the BlueberryTeam, The Blueberry Network, and our affiliates positively. If you are uncomfortable with us being partnered with another server, please let us know through a support ticket.
**5.** If your server has less than 45 members, you must follow our <#1456355064678453279> channel in your server.
**6.** The server must be advertised in an advertising/partnership specific channel and take no less than 3 seconds to view when scrolling up.
**7.** The owner/admin of the server MUST stay in this server.
**8.** *[NOT YET]* Add our discord bot (BBUtils) to your discord! We offer free customization of the bot too!

Breaking any of these rules will result in immediate termination from our partners.
`,

  creatorfaq: `
# 📘 Creator FAQ 
-# V1

**Q: Can I record/stream on the server?**
✅ Yes! You’re welcome to create content on Blueberry Network. Please keep it respectful and follow server rules while recording.

**Q: Do I need permission first?**
❌ No permission is needed for normal gameplay content!

**Q: Can I show the IP in my video?**
✅ Absolutely — this is a requirement to be part of the Creator Programme!
"IP:* play.blueberrynet.uk

**Q: Do creators get perks?**
✅ Yep! Eligible creators can get:
- YouTuber rank in discord & server
- Free usage of the events server (1/month)
- Channel is advertised within the network!

**Q: What’s NOT allowed in videos?**
- Exploit tutorials
- Breaking server rules
- Encouraging rule breaking

**Q: What if the video I upload breaks these rules?**
You will be immediately removed from the creator program and could be banned network-wide. We may also ask for you to remove the video of it is only a minor issue.
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
          { name: 'Creator FAQ', value: 'creatorfaq' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
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
