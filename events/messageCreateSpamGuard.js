const spamTracker = new Map();

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content.trim();
    if (!content) return;

    const key = `${message.guild.id}:${message.channel.id}:${message.author.id}`;
    const existing = spamTracker.get(key);

    if (!existing || existing.content !== content) {
      spamTracker.set(key, { content, count: 1 });
      return;
    }

    existing.count += 1;

    if (existing.count < 3) {
      spamTracker.set(key, existing);
      return;
    }

    spamTracker.set(key, { content, count: 0 });

    // Delete current message + up to two previous duplicates from same user
    const deletedIds = new Set();

    try {
      await message.delete();
      deletedIds.add(message.id);
    } catch (err) {}

    try {
      const recent = await message.channel.messages.fetch({ limit: 10 });
      const duplicates = [...recent.values()]
        .filter(m =>
          m.author.id === message.author.id &&
          m.content.trim() === content &&
          !deletedIds.has(m.id)
        )
        .slice(0, 2);

      for (const duplicate of duplicates) {
        try {
          await duplicate.delete();
          deletedIds.add(duplicate.id);
        } catch (err) {}
      }
    } catch (err) {}

    const warning = await message.channel.send(
      `Hey ${message.author}, please do not spam the same message in chat!`
    );

    setTimeout(async () => {
      try {
        await warning.delete();
      } catch (err) {}
    }, 20_000);
  }
};
