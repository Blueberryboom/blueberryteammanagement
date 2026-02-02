const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../modapps.json');

function loadData() {
  if (!fs.existsSync(dataFile)) {
    return {
      open: false,
      message: "Moderator applications are currently CLOSED. We'll let you know when they're back in <#1455310485363757331>!"
    };
  }

  return JSON.parse(fs.readFileSync(dataFile));
}

// Phrases that trigger the response
const triggers = [
  "can i be mod",
  "can i get mod",
  "how to be mod",
  "how do i get mod",
  "mod apps",
  "mod applications",
  "apply for mod",
  "be staff",
  "get staff"
];

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    // Ignore bots
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    // Check if message contains any trigger phrase
    if (!triggers.some(t => content.includes(t))) return;

    const data = loadData();

    const reply =
`**Moderator Applications**

${data.message}

👉 Use **/modapps** to check anytime.`;

    message.reply(reply);
  }
};
