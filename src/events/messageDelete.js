const loggingService = require('../services/loggingService');
const { config } = require('../config/config');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        if (!message.guild || message.author?.bot) return;

        const content = message.content ? message.content.slice(0, 1000) : '*No text content (embed or attachment)*';
        
        await loggingService.logEvent(message.guild, {
            title: '🗑️ Message Deleted',
            description: `A message from **${message.author?.tag || 'Unknown User'}** was deleted in <#${message.channel.id}>.`,
            color: config.bot.colors.danger,
            fields: [
                { name: 'Author', value: `${message.author?.tag || 'Unknown'} (\`${message.author?.id || 'N/A'}\`)`, inline: true },
                { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                { name: 'Deleted Content', value: content, inline: false }
            ]
        });
    }
};
