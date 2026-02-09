// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, REST, Routes } = require('discord.js');

require('dotenv').config();

const token = process.env.TOKEN;

if (!token) {
  console.error("❌ TOKEN not found in .env file");
  process.exit(1);
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const fs = require('fs');
const path = require('path');

client.commands = new Map();

const commandsPath = path.join(__dirname, 'commands');

// Load command files
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
  }
}

// ===== READY EVENT – STARTUP LOG + REGISTER COMMANDS =====
client.once(Events.ClientReady, async () => {

  console.log(`Ready! Logged in as ${client.user.tag}`);

  // ============ DATABASE INIT ============
  const db = require('./database/db');

  try {
    await db.initDatabase();
  } catch (err) {
    console.log("❌ DATABASE FAILED TO LOAD:", err);
  }
  // ======================================

  const logChannelId = "1468013210446594280";

  // ----- LOG BOT START -----
  const logChannel = client.channels.cache.get(logChannelId);

  if (logChannel) {
    logChannel.send({
      embeds: [
        {
          title: "Bot Started",
          description: `The bot has started successfully`,
          fields: [
            { name: "User", value: client.user.tag, inline: true },
            { name: "Time", value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
          ],
          color: 0x57F287
        }
      ]
    });
  }

  // ----- REGISTER SLASH COMMANDS -----
  const commands = [...client.commands.values()]
    .map(cmd => cmd.data.toJSON());

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

// ===== HANDLE SLASH COMMANDS =====
client.on(Events.InteractionCreate, async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);

  } catch (error) {

    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error running this command!',
        ephemeral: true
      });

    } else {
      await interaction.reply({
        content: 'There was an error running this command!',
        ephemeral: true
      });
    }
  }
});

// ===== EVENT LOADER =====
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {

  const eventFiles = fs.readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    client.on(event.name, (...args) =>
      event.execute(...args)
    );
  }
}

// Log in to Discord
client.login(token);
