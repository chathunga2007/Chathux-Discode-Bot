const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays detailed information and analytics about this server.'),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({ content: 'This command can only be used within a server.', ephemeral: true });
        }

        const owner = await guild.fetchOwner().catch(() => null);
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const totalRoles = guild.roles.cache.size;
        const totalEmojis = guild.emojis.cache.size;

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🏰 ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Owner', value: owner ? `${owner.user.tag} (\`${owner.id}\`)` : 'N/A', inline: true },
                { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
                { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: 'Total Members', value: `👥 ${guild.memberCount}`, inline: true },
                { name: 'Boost Level', value: `🚀 Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
                { name: 'Verification', value: `${guild.verificationLevel}`, inline: true },
                { name: 'Channels', value: `💬 ${textChannels} Text | 🔊 ${voiceChannels} Voice`, inline: true },
                { name: 'Roles', value: `🏷️ ${totalRoles}`, inline: true },
                { name: 'Emojis', value: `😀 ${totalEmojis}`, inline: true }
            )
            .setFooter({ text: 'ChathuX Server Analytics' })
            .setTimestamp();

        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ size: 1024 }));
        }

        await interaction.reply({ embeds: [embed] });
    }
};
