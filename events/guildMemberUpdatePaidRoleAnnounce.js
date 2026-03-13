const { ChannelType } = require('discord.js');

const generalChannelId = '1455310485363757338';

const purchasableRoleNames = new Set([
  'Certified Blueberry',
  'Blueberry Plus',
  'Elite Blueberry'
]);

module.exports = {
  name: 'guildMemberUpdate',

  async execute(oldMember, newMember) {
    if (!oldMember?.guild || !newMember?.guild) return;

    const addedRoleIds = [...newMember.roles.cache.keys()].filter(
      roleId => !oldMember.roles.cache.has(roleId)
    );

    const purchasedRoleNames = addedRoleIds
      .map(roleId => newMember.guild.roles.cache.get(roleId)?.name)
      .filter(roleName => roleName && purchasableRoleNames.has(roleName));

    if (purchasedRoleNames.length === 0) return;

    const generalChannel = newMember.guild.channels.cache.get(generalChannelId);
    if (!generalChannel || generalChannel.type !== ChannelType.GuildText) return;

    for (const roleName of purchasedRoleNames) {
      await generalChannel.send(
        `Thanks ${newMember} for purchasing ${roleName}! :D`
      );
    }
  }
};
