const loggingService = require('../services/loggingService');
const { config } = require('../config/config');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // No content change (e.g. embed preview load)

        const oldContent = oldMessage.content ? oldMessage.content.slice(0, 1000) : '*Original content unavailable*';
        const newContent = newMessage.content ? newMessage.content.slice(0, 1000) : '*Empty*';

        await loggingService.logEvent(newMessage.guild, {
            title: '✏️ Message Edited',
            description: `A message by **${newMessage.author.tag}** was edited in <#${newMessage.channel.id}>. [Jump to Message](${newMessage.url})`,
            color: config.bot.colors.warning,
            fields: [
                { name: 'Author', value: `${newMessage.author.tag} (\`${newMessage.author.id}\`)`, inline: true },
                { name: 'Channel', value: `<#${newMessage.channel.id}>`, inline: true },
                { name: 'Before', value: oldContent, inline: false },
                { name: 'After', value: newContent, inline: false }
            ]
        });
    }
};
