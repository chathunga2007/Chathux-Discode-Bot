const { PermissionFlagsBits } = require('discord.js');

/**
 * Friendly names for Discord permission bitfields
 */
const PermissionNames = {
    [PermissionFlagsBits.Administrator]: 'Administrator',
    [PermissionFlagsBits.ManageGuild]: 'Manage Server',
    [PermissionFlagsBits.ManageRoles]: 'Manage Roles',
    [PermissionFlagsBits.ManageChannels]: 'Manage Channels',
    [PermissionFlagsBits.KickMembers]: 'Kick Members',
    [PermissionFlagsBits.BanMembers]: 'Ban Members',
    [PermissionFlagsBits.ModerateMembers]: 'Timeout Members',
    [PermissionFlagsBits.ManageMessages]: 'Manage Messages',
    [PermissionFlagsBits.SendMessages]: 'Send Messages',
    [PermissionFlagsBits.EmbedLinks]: 'Embed Links',
    [PermissionFlagsBits.AttachFiles]: 'Attach Files',
    [PermissionFlagsBits.Connect]: 'Connect to Voice',
    [PermissionFlagsBits.Speak]: 'Speak in Voice'
};

/**
 * Formats a permission bitflag or name to human-readable string
 */
function formatPermission(permission) {
    return PermissionNames[permission] || String(permission);
}

/**
 * Checks if a member can moderate a target member based on role hierarchy
 */
function canModerate(moderatorMember, targetMember, guild) {
    if (moderatorMember.id === guild.ownerId) return true;
    if (targetMember.id === guild.ownerId) return false;
    if (moderatorMember.id === targetMember.id) return false;

    return moderatorMember.roles.highest.position > targetMember.roles.highest.position;
}

/**
 * Checks if the bot can moderate a target member based on role hierarchy
 */
function botCanModerate(botMember, targetMember, guild) {
    if (targetMember.id === guild.ownerId) return false;
    if (targetMember.id === botMember.id) return false;

    return botMember.roles.highest.position > targetMember.roles.highest.position;
}

module.exports = {
    PermissionNames,
    formatPermission,
    canModerate,
    botCanModerate
};
