const { MessageFlags } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const { handleButtonInteraction, handleSelectMenuInteraction } = require('../handlers/buttonHandler');
const guildRepo = require('../database/repositories/guildRepository');
const { config } = require('../config/config');
const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // 1. Handle Slash Commands
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) {
                    logger.warn(`Received interaction for unregistered command: ${interaction.commandName}`, 'INTERACTION');
                    return interaction.reply({
                        embeds: [createErrorEmbed('Unknown Command', 'This command is no longer available.')],
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                }

                // Check Owner-Only Command Lockdown
                let isOwnerLock = config.bot.ownerOnly;
                if (!isOwnerLock && interaction.guildId) {
                    try {
                        const guildSettings = await guildRepo.getSettings(interaction.guildId);
                        if (guildSettings && (guildSettings.owner_only_mode === 1 || guildSettings.owner_only_mode === true)) {
                            isOwnerLock = true;
                        }
                    } catch {
                        // Fallback to unlocked if database error occurs
                    }
                }

                if (isOwnerLock) {
                    const isServerOwner = interaction.guild && interaction.guild.ownerId === interaction.user.id;
                    const isBotOwner = config.bot.ownerId && config.bot.ownerId === interaction.user.id;

                    if (!isServerOwner && !isBotOwner) {
                        return interaction.reply({
                            embeds: [createErrorEmbed(
                                '🔒 Owner-Only Mode Active',
                                'Commands for **ChathuX** are currently restricted to the Server Owner only. Contact the server owner if you require access.'
                            )],
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                }

                try {
                    await command.execute(interaction, client);
                } catch (cmdError) {
                    logger.error(`Error executing /${interaction.commandName}`, cmdError, 'COMMAND_EXEC');
                    const errorResponse = {
                        embeds: [createErrorEmbed('Command Error', 'An unexpected error occurred while executing this command. The engineering team has been notified.')],
                        flags: MessageFlags.Ephemeral
                    };

                    try {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.editReply(errorResponse);
                        } else {
                            await interaction.reply(errorResponse);
                        }
                    } catch {
                        // Interaction token may have expired or already replied
                    }
                }
                return;
            }

            // 2. Handle Autocomplete
            if (interaction.isAutocomplete()) {
                const command = client.commands.get(interaction.commandName);
                if (command && typeof command.autocomplete === 'function') {
                    await command.autocomplete(interaction);
                }
                return;
            }

            // 3. Handle Button Interactions
            if (interaction.isButton()) {
                await handleButtonInteraction(interaction);
                return;
            }

            // 4. Handle Select Menus
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenuInteraction(interaction);
                return;
            }
        } catch (error) {
            logger.error('Unhandled interaction error', error, 'INTERACTION');
        }
    }
};
