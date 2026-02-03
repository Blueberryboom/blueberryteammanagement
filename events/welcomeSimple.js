const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const welcomeChannelId = "1456367410972987576";
const generalChannelId = "1455310485363757338";
const logChannelId = "1468013210446594280";

const SERVER_IP = "play.blueberrynet.uk";
const STATUS_PAGE = "https://status.blueberrynet.uk";
// ==================

const goalFile = path.join(__dirname, '../memberGoal.json');

function loadGoal() {
  if (!fs.existsSync(goalFile)) return null;

  return JSON.parse(fs.readFileSync(goalFile)).goal;
}

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {

    console.log("===== JOIN EVENT FIRED =====");
    console.log("User:", member.user?.tag);
    console.log("Guild:", member.guild.name);

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const memberCount = member.guild.memberCount;

    // ----- PLAINTEXT WELCOME -----
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('how_to_join')
          .setLabel('How do I join?')
          .setStyle(ButtonStyle.Primary)
      );

    await channel.send({
      content: `👋 Welcome ${member}! You're member **#${memberCount}** on the server! YAY`,
      components: [row]
    });

    // ----- CHECK MEMBER GOAL -----
    const goal = loadGoal();

    if (goal && memberCount >= goal) {
      const general = member.guild.channels.cache.get(generalChannelId);

      if (general) {
        general.send(
          `🎉 **WE HIT ${goal} MEMBERS!**\nThanks y'all`
        );
      }

    }

  }
};
