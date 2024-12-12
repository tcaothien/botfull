const { EmbedBuilder } = require('discord.js');

function createEmbed(title, description, color = "Red") {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description);
}

module.exports = { createEmbed };
