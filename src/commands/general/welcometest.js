const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const guildRepo = require('../../database/repositories/guildRepository');
const { createSuccessEmbed } = require('../../utils/embeds');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcometest')
        .setDescription('Test and preview the welcome announcement card in your public/welcome channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const guild = interaction.guild;
        const member = interaction.member;

        const settings = await guildRepo.getSettings(guild.id);

        let welcomeChannel = null;
        if (settings.welcome_channel_id) {
            welcomeChannel = guild.channels.cache.get(settings.welcome_channel_id);
        }
        if (!welcomeChannel) {
            welcomeChannel = guild.channels.cache.find(c =>
                c.isTextBased() && ['public', 'welcome', 'welcomes', 'welcome-chat', 'general'].includes(c.name.toLowerCase())
            ) || interaction.channel;
        }

        const welcomeText = (settings.welcome_message || 'Welcome to {server}, {user}! We are thrilled to have you here.')
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount);

        const welcomeEmbed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🎉 Welcome to ${guild.name}!`)
            .setDescription(`Hey <@${member.id}>, welcome to **${guild.name}**!\n\n${welcomeText}`)
            .addFields(
                { name: '👤 Member Tag', value: `\`${member.user.tag}\``, inline: true },
                { name: '🔢 Member Number', value: `**#${guild.memberCount}**`, inline: true },
                { name: '📅 Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage(guild.bannerURL({ size: 1024 }) || null)
            .setFooter({ text: `Test Announcement • Member #${guild.memberCount}` })
            .setTimestamp();

        await welcomeChannel.send({
            content: `👋 Welcome to the server, <@${member.id}>! *(Test Announcement)*`,
            embeds: [welcomeEmbed]
        });

        await interaction.reply({
            embeds: [createSuccessEmbed('Welcome Test Sent', `Test welcome announcement has been posted to <#${welcomeChannel.id}>!`)],
            flags: MessageFlags.Ephemeral
        });
    }
};
