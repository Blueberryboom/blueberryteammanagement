const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const db = require('../database/db');

// ===== CONFIG =====
const welcomeChannelId = "1456367410972987576";
const generalChannelId = "1455310485363757338";
const logChannelId = "1468013210446594280";

const SERVER_IP = "play.blueberrynet.uk";
const STATUS_PAGE = "https://status.blueberrynet.uk";
// ==================

// ----- REPLACEMENT FOR loadGoal() -----
async function loadGoal() {
  try {
    const [rows] = await db.query(
      "SELECT goal FROM member_goal ORDER BY id DESC LIMIT 1"
    );

    return rows?.[0]?.goal || null;

  } catch (err) {
    console.error("Failed to load member goal:", err);
    return null;
  }
}

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {

    console.log("===== JOIN EVENT FIRED =====");
    console.log("User:", member.user?.tag);
    console.log("Guild:", member.guild.name);

    const channel =
      member.guild.channels.cache.get(welcomeChannelId);

    if (!channel) return;

    const memberCount = member.guild.memberCount;

    // ----- PLAINTEXT WELCOME (UNCHANGED) -----
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('how_to_join')
          .setLabel('Minecraft IP')
          .setStyle(ButtonStyle.Primary)
      );

    await channel.send({
      content:
`👋 Welcome ${member}! You're member **#${memberCount}** on the server! :)
Feel free to checkout <#1456354831697445017> and <#1455310485363757330>, then introduce yourself in <#1455310485363757338>!`,
      components: [row]
    });

    // ----- CHECK MEMBER GOAL (NOW FROM DB) -----
    const goal = await loadGoal();

    if (goal && memberCount >= goal) {

      const general =
        member.guild.channels.cache.get(generalChannelId);

      if (general) {
        general.send(
          `🎉 **WE HIT ${goal} MEMBERS!**\nWOOO`
        );
      }
    }
  }
};
