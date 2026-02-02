// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const token = process.env.TOKEN;

if (!token) {
  console.error("❌ TOKEN not found in .env file");
  process.exit(1);
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const fs = require('fs');
const path = require('path');

client.commands = new Map();

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
  }
}

const { REST, Routes } = require('discord.js');

client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("✅ Slash commands registered automatically");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error running this command!',
      ephemeral: true
    });
  }
});

// Log in to Discord with your client's token
client.login(token);
