const { EmbedBuilder } = require('discord.js');
const guildRepo = require('../database/repositories/guildRepository');
const loggingService = require('../services/loggingService');
const { config } = require('../config/config');
const logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const guild = member.guild;

        try {
            const settings = await guildRepo.getSettings(guild.id);

            // 1. Resolve Welcome Channel (Configured or Auto-detected #public / #welcome)
            let welcomeChannel = null;
            if (settings.welcome_channel_id) {
                welcomeChannel = guild.channels.cache.get(settings.welcome_channel_id);
            }
            if (!welcomeChannel) {
                welcomeChannel = guild.channels.cache.find(c =>
                    c.isTextBased() && ['public', 'welcome', 'welcomes', 'welcome-chat', 'general'].includes(c.name.toLowerCase())
                );
            }

            const isWelcomeActive = settings.welcome_enabled === 1 || settings.welcome_enabled === true || (welcomeChannel && welcomeChannel.name.toLowerCase() === 'public');

            if (isWelcomeActive && welcomeChannel && welcomeChannel.isTextBased()) {
                const welcomeText = (settings.welcome_message || 'Welcome to {server}, {user}! We are thrilled to have you in our community.')
                    .replace(/{user}/g, `<@${member.id}>`)
                    .replace(/{username}/g, member.user.username)
                    .replace(/{server}/g, guild.name)
                    .replace(/{memberCount}/g, guild.memberCount);

                const welcomeEmbed = new EmbedBuilder()
                    .setColor(config.bot.colors.primary)
                    .setTitle(`🎉 Welcome to ${guild.name}!`)
                    .setDescription(`Hey <@${member.id}>, welcome to **${guild.name}**!\n\n${welcomeText}`)
                    .addFields(
                        { name: '👤 User', value: `\`${member.user.tag}\``, inline: true },
                        { name: '🔢 Member Count', value: `**#${guild.memberCount}**`, inline: true },
                        { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
                    )
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setImage(guild.bannerURL({ size: 1024 }) || null)
                    .setFooter({ text: `Welcome to ${guild.name} • Member #${guild.memberCount}` })
                    .setTimestamp();

                await welcomeChannel.send({
                    content: `👋 Welcome to the server, <@${member.id}>!`,
                    embeds: [welcomeEmbed]
                }).catch(err => {
                    logger.warn(`Could not send welcome announcement to #${welcomeChannel.name}: ${err.message}`, 'WELCOME');
                });
            }

            // 2. Auto-Role Assignment
            if (settings.auto_role_id) {
                const role = guild.roles.cache.get(settings.auto_role_id);
                if (role && guild.members.me.roles.highest.position > role.position) {
                    await member.roles.add(role).catch(err => {
                        logger.warn(`Could not assign auto-role ${role.name}: ${err.message}`, 'WELCOME');
                    });
                }
            }

            // 3. Audit Logging
            await loggingService.logEvent(guild, {
                title: '📥 Member Joined',
                description: `**${member.user.tag}** joined the server.`,
                color: config.bot.colors.success,
                fields: [
                    { name: 'User', value: `<@${member.id}> (\`${member.id}\`)`, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Total Members', value: `${guild.memberCount}`, inline: true }
                ]
            });
        } catch (error) {
            logger.error(`Error processing guildMemberAdd in ${guild.id}`, error, 'WELCOME');
        }
    }
};
