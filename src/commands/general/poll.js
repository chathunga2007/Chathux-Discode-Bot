const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');
const pollService = require('../../services/pollService');
const { createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create an interactive community poll with real-time voting buttons.')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a poll with custom choices (up to 5 options)')
                .addStringOption(opt =>
                    opt.setName('question')
                        .setDescription('The question you are asking the community')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('option1')
                        .setDescription('First choice option')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('option2')
                        .setDescription('Second choice option')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('option3')
                        .setDescription('Third choice option')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('option4')
                        .setDescription('Fourth choice option')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('option5')
                        .setDescription('Fifth choice option')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('quick')
                .setDescription('Launch a fast Yes / No / Maybe poll')
                .addStringOption(opt =>
                    opt.setName('question')
                        .setDescription('The question you want to ask')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const question = interaction.options.getString('question');

        let options = [];
        if (subcommand === 'quick') {
            options = ['Yes 👍', 'No 👎', 'Maybe 🤔'];
        } else {
            const rawOptions = [
                interaction.options.getString('option1'),
                interaction.options.getString('option2'),
                interaction.options.getString('option3'),
                interaction.options.getString('option4'),
                interaction.options.getString('option5')
            ].filter(Boolean);

            if (rawOptions.length < 2) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Invalid Options', 'You must provide at least 2 distinct options for the poll.')],
                    flags: MessageFlags.Ephemeral
                });
            }
            options = rawOptions;
        }

        const pollData = pollService.createPoll({
            question,
            options,
            authorId: interaction.user.id,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id
        });

        const embed = pollService.buildPollEmbed(pollData);
        // Initially send without poll.id set, reply immediately
        await interaction.reply({
            embeds: [embed]
        });

        const replyMessage = await interaction.fetchReply();
        pollService.registerPoll(replyMessage.id, pollData);

        const rows = pollService.buildButtonRows(pollData);
        await interaction.editReply({
            embeds: [embed],
            components: rows
        });
    }
};
