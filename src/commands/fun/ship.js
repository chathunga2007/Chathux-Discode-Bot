const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed, createProgressBar } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Calculate love compatibility between two users.')
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('First person')
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('Second person')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user1 = interaction.options.getUser('user1');
        const user2 = interaction.options.getUser('user2');

        // Deterministic score based on user IDs
        const combined = BigInt(user1.id) + BigInt(user2.id);
        const percent = Number(combined % 101n);
        const bar = createProgressBar(percent, 100, 15);

        let verdict = 'Soulmates destined across galaxies! 💕';
        if (percent < 30) verdict = 'Better off as polite strangers. 💀';
        else if (percent < 60) verdict = 'Decent friendship potential! 🤝';
        else if (percent < 85) verdict = 'Sparks are flying! 🔥';

        const embed = createInfoEmbed(
            '💘 Love Compatibility Scanner',
            `**${user1.username}** 💞 **${user2.username}**\n\n**Match Score**: \`${percent}%\`\n${bar}\n\n**Verdict**: ${verdict}`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
