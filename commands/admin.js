module.exports = {
    name: 'admin',
    description: 'Lệnh quản trị cho admin',
    
    execute(message, args) {
        if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền sử dụng lệnh này.");
        
        const command = args[0];
        
        switch (command) {
            case 'eaddxu':
                // Thêm xu cho người dùng
                break;
            case 'edelxu':
                // Trừ xu của người dùng
                break;
            case 'eresetallbot':
                // Reset dữ liệu bot
                break;
            default:
                message.reply("Lệnh không hợp lệ.");
        }
    }
};
