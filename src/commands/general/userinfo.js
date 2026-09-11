const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays profile, roles, and status of a server member.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member to inspect (defaults to you)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(member?.displayHexColor || config.bot.colors.primary)
            .setTitle(`👤 ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'User ID', value: `\`${user.id}\``, inline: true },
                { name: 'Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false }
            )
            .setTimestamp();

        if (member) {
            const roles = member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => `<@&${r.id}>`)
                .slice(0, 15);

            embed.addFields(
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Highest Role', value: `${member.roles.highest}`, inline: true },
                { name: `Roles (${member.roles.cache.size - 1})`, value: roles.length > 0 ? roles.join(', ') : 'None', inline: false }
            );
        }

        await interaction.reply({ embeds: [embed] });
    }
};
