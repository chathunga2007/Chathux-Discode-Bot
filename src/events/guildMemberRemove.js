const loggingService = require('../services/loggingService');
const { config } = require('../config/config');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const guild = member.guild;

        await loggingService.logEvent(guild, {
            title: '📤 Member Left',
            description: `**${member.user.tag}** has departed from the server.`,
            color: config.bot.colors.danger,
            fields: [
                { name: 'User', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                { name: 'Roles', value: member.roles.cache.filter(r => r.id !== guild.id).map(r => r.name).join(', ') || 'None', inline: false },
                { name: 'Remaining Members', value: `${guild.memberCount}`, inline: true }
            ]
        });
    }
};
