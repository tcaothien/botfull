module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;
        
        // Kiểm tra prefix và xử lý các lệnh
        if (message.content.startsWith("e")) {
            const args = message.content.slice(1).split(' ');
            const command = args.shift().toLowerCase();

            // Xử lý các lệnh từ thư mục commands
            const commandFile = require(`../commands/${command}.js`);
            if (commandFile) commandFile.execute(message, args);
        }
    }
};
