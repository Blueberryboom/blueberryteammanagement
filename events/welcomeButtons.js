const { EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const SERVER_IP = "play.blueberrynet.uk";
const STATUS_PAGE = "https://status.blueberrynet.uk";
// ==================

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'how_to_join') {

      const embed = new EmbedBuilder()
        .setTitle("🎮 How to Join")
        .setDescription(
`**Minecraft IP:** \`${SERVER_IP}\`

1. Open Minecraft (Java)
2. Multiplayer → Add Server  
3. Enter the IP above  
4. Join and have fun!

📊 **Status Page:**  
${STATUS_PAGE}`
        )
        .setColor(0x4F46E5);

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    
    }
  }
};
