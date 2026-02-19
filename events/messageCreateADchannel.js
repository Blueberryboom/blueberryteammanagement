const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');

// ===== CONFIG =====
const advertisingChannelId = "1471545487424356382";
// ==================

let lastStickyMessageId = null;

module.exports = {
  name: 'messageCreate',

  async execute(message) {

    // Ignore bots & DMs
    if (!message.guild) return;
    if (message.author.bot) return;

    // Only run in advertising channel
    if (message.channel.id !== advertisingChannelId) return;

    try {

      // Delete previous sticky if exists
      if (lastStickyMessageId) {
        try {
          const old = await message.channel.messages.fetch(lastStickyMessageId);
          if (old) await old.delete();
        } catch (e) {}
      }

      // Create rules embed
      const embed = new EmbedBuilder()
        .setTitle("Advertising Info")
        .setColor(0x5865F2)
        .setDescription(
`## Advertising Info
In order to advertise here, you need the <@&1460351285327954011>, <@&1468302058749690026>, <@&1468302227075498105> or any paid supporter role.
### <:rules:1474178164761559192> Advertising Rules
> - Ad must contain **1** discord server invite link.
> - Ad must follow all our <#1455310485363757330>.
> - Message can't be longer than 10 lines.
-# <a:85951rfalert:1470557230674870476> Please note: this is the only channel where you can advertise; you cannot ask people to view your ad.`
        )
        .setFooter({ text: "Failure to follow rules may result in a timeout." });

      // Create a button for Buy Me A Coffee
      const button = new ButtonBuilder()
        .setLabel('Paid Access Roles')
        .setStyle('LINK')
        .setURL('https://www.buymeacoffee.com/Blueberryboom'); // Replace with your actual URL

      // Create an action row containing the button
      const row = new ActionRowBuilder().addComponents(button);

      const sent = await message.channel.send({ embeds: [embed], components: [row] });

      lastStickyMessageId = sent.id;

    } catch (err) {
      console.error("Sticky error:", err);
      
    }
  }
};
