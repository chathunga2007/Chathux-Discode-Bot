const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggles repeat mode between off, single song, and entire queue.')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Select repeat loop mode')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Repeat Song', value: 'song' },
                    { name: 'Repeat Queue', value: 'queue' }
                )
        ),
    async execute(interaction) {
        const mode = interaction.options.getString('mode');
        const updated = musicService.setLoop(interaction.guild.id, mode);

        await interaction.reply({
            embeds: [createSuccessEmbed('Loop Mode Updated', `Music loop mode is now set to: **${updated.toUpperCase()}**`)]
        });
    }
};
