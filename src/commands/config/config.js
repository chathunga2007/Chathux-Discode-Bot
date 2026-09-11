const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const guildRepo = require('../../database/repositories/guildRepository');
const modRepo = require('../../database/repositories/moderationRepository');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure ChathuX settings, modules, and channels for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current server configuration overview.')
        )
        .addSubcommand(sub =>
            sub.setName('welcome')
                .setDescription('Configure member onboarding and welcome messages.')
                .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable welcome system').setRequired(false))
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel for welcome announcements').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addRoleOption(opt => opt.setName('autorole').setDescription('Role automatically assigned to new members').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Custom message (supports {user}, {server}, {memberCount})').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('logs')
                .setDescription('Configure server audit logging.')
                .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable audit logging').setRequired(false))
                .addChannelOption(opt => opt.setName('channel').setDescription('Audit logs channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('moderation')
                .setDescription('Configure moderation and auto-defense engine.')
                .addChannelOption(opt => opt.setName('mod_channel').setDescription('Channel for mod action logs').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addBooleanOption(opt => opt.setName('anti_spam').setDescription('Enable rate-limit anti-spam').setRequired(false))
                .addBooleanOption(opt => opt.setName('bad_words').setDescription('Filter offensive terms').setRequired(false))
                .addBooleanOption(opt => opt.setName('filter_links').setDescription('Block links & invite urls').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('ai')
                .setDescription('Configure AI Assistant channel and status.')
                .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable AI features').setRequired(false))
                .addChannelOption(opt => opt.setName('channel').setDescription('Designated natural AI chat channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('leveling')
                .setDescription('Configure XP progression and level notifications.')
                .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable message XP gaining').setRequired(false))
                .addChannelOption(opt => opt.setName('channel').setDescription('Level-up announcement channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('economy')
                .setDescription('Enable or disable server economy system.')
                .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable virtual economy').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('owneronly')
                .setDescription('Lock all bot commands to the Server Owner / Bot Owner only.')
                .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable Owner-Only execution mode').setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'view') {
            const settings = await guildRepo.getSettings(guildId);
            const modSettings = await modRepo.getSettings(guildId);

            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.primary)
                .setTitle(`⚙️ Configuration Profile: ${interaction.guild.name}`)
                .addFields(
                    { name: '👋 Welcome System', value: `${settings.welcome_enabled ? '🟢 Enabled' : '🔴 Disabled'} (Channel: ${settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : '*None*'} | Auto-Role: ${settings.auto_role_id ? `<@&${settings.auto_role_id}>` : '*None*'})`, inline: false },
                    { name: '📜 Audit Logging', value: `${settings.logging_enabled ? '🟢 Enabled' : '🔴 Disabled'} (Channel: ${settings.log_channel_id ? `<#${settings.log_channel_id}>` : '*None*'})`, inline: false },
                    { name: '🛡️ Moderation & Auto-Mod', value: `Mod Channel: ${settings.mod_channel_id ? `<#${settings.mod_channel_id}>` : '*None*'} | Anti-Spam: ${modSettings.anti_spam ? '✔' : '✖'} | Bad-Words: ${modSettings.filter_bad_words ? '✔' : '✖'} | Link Filter: ${modSettings.filter_links ? '✔' : '✖'}`, inline: false },
                    { name: '🤖 AI Assistant', value: `${settings.ai_enabled ? '🟢 Enabled' : '🔴 Disabled'} (AI Channel: ${settings.ai_channel_id ? `<#${settings.ai_channel_id}>` : '*All text channels*'})`, inline: false },
                    { name: '🏆 Leveling & XP', value: `${settings.leveling_enabled ? '🟢 Enabled' : '🔴 Disabled'} (Announce Channel: ${settings.level_channel_id ? `<#${settings.level_channel_id}>` : '*Current channel*'})`, inline: false },
                    { name: '💰 Virtual Economy', value: `${settings.economy_enabled ? '🟢 Enabled' : '🔴 Disabled'}`, inline: false },
                    { name: '🔒 Owner-Only Mode', value: `${(settings.owner_only_mode || config.bot.ownerOnly) ? '🟢 Enabled (Owner-Only Locked)' : '⚪ Disabled (Public Commands)'}`, inline: false }
                )
                .setFooter({ text: 'All settings can also be customized via the web dashboard' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'welcome') {
            const updates = {};
            const enabled = interaction.options.getBoolean('enabled');
            const channel = interaction.options.getChannel('channel');
            const autorole = interaction.options.getRole('autorole');
            const message = interaction.options.getString('message');

            if (enabled !== null) updates.welcome_enabled = enabled ? 1 : 0;
            if (channel) updates.welcome_channel_id = channel.id;
            if (autorole) updates.auto_role_id = autorole.id;
            if (message) updates.welcome_message = message;

            await guildRepo.updateSettings(guildId, updates);
            return interaction.reply({
                embeds: [createSuccessEmbed('Welcome Configured', 'Welcome onboarding settings have been updated!')]
            });
        }

        if (subcommand === 'logs') {
            const updates = {};
            const enabled = interaction.options.getBoolean('enabled');
            const channel = interaction.options.getChannel('channel');

            if (enabled !== null) updates.logging_enabled = enabled ? 1 : 0;
            if (channel) updates.log_channel_id = channel.id;

            await guildRepo.updateSettings(guildId, updates);
            return interaction.reply({
                embeds: [createSuccessEmbed('Audit Logs Configured', 'Server audit logging parameters have been updated!')]
            });
        }

        if (subcommand === 'moderation') {
            const modUpdates = {};
            const channel = interaction.options.getChannel('mod_channel');
            const antiSpam = interaction.options.getBoolean('anti_spam');
            const badWords = interaction.options.getBoolean('bad_words');
            const filterLinks = interaction.options.getBoolean('filter_links');

            if (channel) await guildRepo.updateSettings(guildId, { mod_channel_id: channel.id });
            if (antiSpam !== null) modUpdates.anti_spam = antiSpam ? 1 : 0;
            if (badWords !== null) modUpdates.filter_bad_words = badWords ? 1 : 0;
            if (filterLinks !== null) modUpdates.filter_links = filterLinks ? 1 : 0;

            if (Object.keys(modUpdates).length > 0) {
                await modRepo.updateSettings(guildId, modUpdates);
            }

            return interaction.reply({
                embeds: [createSuccessEmbed('Moderation Configured', 'Auto-mod filters and moderation audit channels updated!')]
            });
        }

        if (subcommand === 'ai') {
            const updates = {};
            const enabled = interaction.options.getBoolean('enabled');
            const channel = interaction.options.getChannel('channel');

            if (enabled !== null) updates.ai_enabled = enabled ? 1 : 0;
            if (channel) updates.ai_channel_id = channel.id;

            await guildRepo.updateSettings(guildId, updates);
            return interaction.reply({
                embeds: [createSuccessEmbed('AI Configured', 'AI Assistant preferences updated for this server!')]
            });
        }

        if (subcommand === 'leveling') {
            const updates = {};
            const enabled = interaction.options.getBoolean('enabled');
            const channel = interaction.options.getChannel('channel');

            if (enabled !== null) updates.leveling_enabled = enabled ? 1 : 0;
            if (channel) updates.level_channel_id = channel.id;

            await guildRepo.updateSettings(guildId, updates);
            return interaction.reply({
                embeds: [createSuccessEmbed('Leveling Configured', 'XP progression and level announcement parameters updated!')]
            });
        }

        if (subcommand === 'economy') {
            const enabled = interaction.options.getBoolean('enabled');
            await guildRepo.updateSettings(guildId, { economy_enabled: enabled ? 1 : 0 });

            return interaction.reply({
                embeds: [createSuccessEmbed('Economy Configured', `Virtual economy has been **${enabled ? 'enabled' : 'disabled'}** for this server.`)]
            });
        }

        if (subcommand === 'owneronly') {
            const isOwner = interaction.user.id === interaction.guild.ownerId || (config.bot.ownerId && interaction.user.id === config.bot.ownerId);
            if (!isOwner) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Permission Denied', 'Only the Server Owner or Bot Developer can modify Owner-Only lockdown settings.')],
                    ephemeral: true
                });
            }

            const enabled = interaction.options.getBoolean('enabled');
            await guildRepo.updateSettings(guildId, { owner_only_mode: enabled ? 1 : 0 });

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'Owner-Only Mode Updated',
                    enabled
                        ? '🔒 **Owner-Only Mode is now ENABLED!** Only the Server Owner can execute bot commands on this server.'
                        : '🔓 **Owner-Only Mode is now DISABLED!** Standard member command permissions have been restored.'
                )]
            });
        }
    }
};
