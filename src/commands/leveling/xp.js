const { SlashCommandBuilder } = require('discord.js');
const xpRepo = require('../../database/repositories/xpRepository');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Displays raw XP points and statistics.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose XP to inspect')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const data = await xpRepo.getUserXP(interaction.guild.id, targetUser.id);

        const embed = createInfoEmbed(
            `✨ XP Details: ${targetUser.username}`,
            `🔹 **Accumulated XP**: \`${data.xp.toLocaleString()} XP\`\n🔹 **Current Level**: \`Level ${data.level}\`\n🔹 **Total Messages Logged**: \`${data.total_messages.toLocaleString()}\``
        );

        await interaction.reply({ embeds: [embed] });
    }
};
