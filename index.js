const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

// Kết nối MongoDB
mongoose.connect("MONGODB_CONNECTION_STRING", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Schema người dùng
const userSchema = new mongoose.Schema({
    userId: String,
    username: String,
    balance: { type: Number, default: 0 },
    isMarried: { type: Boolean, default: false },
    spouseId: { type: String, default: null },
    marriageDate: { type: Date, default: null },
    marriageImages: { type: [String], default: [] },
    lovePoints: { type: Number, default: 0 },
    ring: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

// Khởi tạo bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const prefix = "e";

// Hàm tiện ích
async function findOrCreateUser(userId, username) {
    let user = await User.findOne({ userId });
    if (!user) {
        user = new User({ userId, username });
        await user.save();
    }
    return user;
}

// Sự kiện khi bot sẵn sàng
client.once("ready", () => {
    console.log(`${client.user.tag} đã sẵn sàng!`);
});

// Lệnh chính
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Các lệnh liên quan đến xu
    switch (command) {
        case "exu": {
            const user = await findOrCreateUser(message.author.id, message.author.username);
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("💰 Số dư")
                .setDescription(`Bạn hiện có **${user.balance} xu**.`);
            message.reply({ embeds: [embed] });
            break;
        }
        case "etx": {
            if (args.length < 2) return message.reply("Cú pháp: `etx <số_xu> <tai/xiu>`.");
            const betAmount = parseInt(args[0]);
            const choice = args[1].toLowerCase();

            if (isNaN(betAmount) || !["tai", "xiu"].includes(choice)) {
                return message.reply("Hãy nhập số xu và lựa chọn hợp lệ (tai/xiu).");
            }

            const gambler = await findOrCreateUser(message.author.id, message.author.username);
            if (gambler.balance < betAmount) return message.reply("Bạn không đủ xu để đặt cược!");

            // Xử lý kết quả tài xỉu 🎲
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const total = dice1 + dice2;
            const result = total <= 10 ? "xiu" : "tai";

            const resultEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("🎲 Tài Xỉu")
                .setDescription(
                    `Bạn đã đặt **${betAmount} xu** vào **${choice}**.\n` +
                    `🎲 Kết quả: ${dice1} + ${dice2} = **${total}** (**${result}**).`
                );

            if (choice === result) {
                gambler.balance += betAmount;
                resultEmbed.addFields({ name: "Kết quả:", value: `🎉 Bạn đã **thắng**! Nhận **${betAmount} xu**.` });
            } else {
                gambler.balance -= betAmount;
                resultEmbed.addFields({ name: "Kết quả:", value: `😢 Bạn đã **thua**! Mất **${betAmount} xu**.` });
            }

            await gambler.save();
            message.reply({ embeds: [resultEmbed] });
            break;
        }
        case "edaily": {
            const user = await findOrCreateUser(message.author.id, message.author.username);
            const dailyAmount = Math.floor(Math.random() * 20000) + 1000; // Random từ 1,000 đến 20,000 xu
            user.balance += dailyAmount;
            await user.save();
            message.reply(`Bạn nhận được **${dailyAmount} xu** từ quà tặng hàng ngày!`);
            break;
        }
        case "egivexu": {
            if (args.length < 2) return message.reply("Cú pháp: `egivexu @user <số_xu>`.");
            const mentionedUser = message.mentions.users.first();
            if (!mentionedUser) return message.reply("Hãy tag người dùng bạn muốn chuyển xu!");
            const betAmount = parseInt(args[1]);

            const giver = await findOrCreateUser(message.author.id, message.author.username);
            const receiver = await findOrCreateUser(mentionedUser.id, mentionedUser.username);

            if (giver.balance < betAmount) return message.reply("Bạn không đủ xu để chuyển!");

            giver.balance -= betAmount;
            receiver.balance += betAmount;

            await giver.save();
            await receiver.save();

            message.reply(`Bạn đã chuyển **${betAmount} xu** cho ${mentionedUser.tag}`);
            break;
        }

        // Các lệnh kết hôn
        case "emarry": {
            if (!message.mentions.users.size) return message.reply("Hãy tag người bạn muốn cầu hôn!");
            const partner = message.mentions.users.first();

            const proposer = await findOrCreateUser(message.author.id, message.author.username);
            const receiver = await findOrCreateUser(partner.id, partner.username);

            if (proposer.isMarried || receiver.isMarried) {
                return message.reply("Một trong hai người đã kết hôn!");
            }

            if (!proposer.ring) {
                return message.reply("Bạn cần mua nhẫn trước khi cầu hôn! Sử dụng lệnh `ebuy` để mua nhẫn.");
            }

            const confirmMessage = await message.channel.send(
                `${partner}, bạn có đồng ý kết hôn với ${message.author} không? Trả lời bằng \`có\` hoặc \`không\`.`
            );

            const filter = (response) => {
                return (
                    response.author.id === partner.id &&
                    ["có", "không"].includes(response.content.toLowerCase())
                );
            };

            const collector = message.channel.createMessageCollector({ filter, time: 30000 });

            collector.on("collect", async (response) => {
                if (response.content.toLowerCase() === "có") {
                    proposer.isMarried = true;
                    proposer.spouseId = partner.id;
                    proposer.marriageDate = new Date();

                    receiver.isMarried = true;
                    receiver.spouseId = message.author.id;
                    receiver.marriageDate = new Date();

                    await proposer.save();
                    await receiver.save();

                    message.channel.send(`💍 Chúc mừng! ${message.author} và ${partner} đã kết hôn!`);
                } else {
                    message.channel.send(`${partner} đã từ chối lời cầu hôn của bạn.`);
                }
                collector.stop();
            });

            collector.on("end", (_, reason) => {
                if (reason === "time") {
                    message.channel.send("⏰ Hết thời gian trả lời. Lời cầu hôn bị hủy.");
                }
            });
            break;
        }
        case "edivorce": {
            const divorcer = await findOrCreateUser(message.author.id, message.author.username);
            if (!divorcer.isMarried) return message.reply("Bạn chưa kết hôn!");

            const divorceConfirm = await message.reply(
                "Bạn có chắc chắn muốn ly hôn? Gõ `có` để xác nhận hoặc `không` để hủy."
            );

            const filterDivorce = (response) =>
                response.author.id === message.author.id && ["có", "không"].includes(response.content.toLowerCase());

            const collectorDivorce = message.channel.createMessageCollector({
                filter: filterDivorce,
                time: 30000,
            });

            collectorDivorce.on("collect", async (response) => {
                if (response.content.toLowerCase() === "có") {
                    const spouse = await User.findOne({ userId: divorcer.spouseId });

                    divorcer.isMarried = false;
                    divorcer.spouseId = null;
                    divorcer.marriageDate = null;
                    divorcer.marriageImages = [];
                    divorcer.ring = null;

                    spouse.isMarried = false;
                    spouse.spouseId = null;
                    spouse.marriageDate = null;
                    spouse.marriageImages = [];
                    spouse.ring = null;

                    await divorcer.save();
                    await spouse.save();

                    message.channel.send("💔 Bạn đã ly hôn thành công.");
                } else {
                    message.reply("Bạn đã hủy yêu cầu ly hôn.");
                }
                collectorDivorce.stop();
            });

            collectorDivorce.on("end", (_, reason) => {
                if (reason === "time") {
                    message.channel.send("⏰ Hết thời gian xác nhận. Yêu cầu ly hôn đã bị hủy.");
                }
            });
            break;
        }
        case "epmarry": {
    const user = await findOrCreateUser(message.author.id, message.author.username);
    if (!user.isMarried) return message.reply("Bạn chưa kết hôn!");

    const spouse = await client.users.fetch(user.spouseId);
    const marriageEmbed = new EmbedBuilder()
        .setColor("Pink")
        .setTitle("💍 Thông tin hôn nhân")
        .addFields(
            { name: "Tên chồng/vợ", value: spouse.tag },
            { name: "Ngày kết hôn", value: user.marriageDate.toLocaleDateString() },
            { name: "Điểm yêu thương", value: `${user.lovePoints}` },
        );

    // Chỉ thêm ảnh kết hôn nếu người dùng có ảnh
    if (user.marriageImages.length > 0) {
        marriageEmbed.setImage(user.marriageImages[0]);
    }

    marriageEmbed.setFooter({ text: "Hãy giữ yêu thương trọn vẹn!" });

    message.reply({ embeds: [marriageEmbed] });
    break;
}
        case "edelimage": {
            const user = await findOrCreateUser(message.author.id, message.author.username);
            if (!user.isMarried) return message.reply("Bạn chưa kết hôn!");

            const image = args.join(" ");
            if (!image || !user.marriageImages.includes(image)) {
                return message.reply("Ảnh này không tồn tại trong bộ sưu tập của bạn.");
            }
            user.marriageImages = user.marriageImages.filter((img) => img !== image);
            await user.save();
            message.reply(`Ảnh kết hôn đã được xóa: ${image}`);
            break;
        }
        case "ebuy": {
            const rings = {
                "01": { name: "ENZ Peridot", price: 100000 },
                "02": { name: "ENZ Citrin", price: 200000 },
                "03": { name: "ENZ Topaz", price: 500000 },
                "04": { name: "ENZ Spinel", price: 1000000 },
                "05": { name: "ENZ Aquamarine", price: 2500000 },
                "06": { name: "ENZ Emerald", price: 5000000 },
                "07": { name: "ENZ Ruby", price: 10000000 },
                "999": { name: "ENZ Sapphire", price: 25000000 }
            };

            const ringCode = args[0];
            if (!rings[ringCode]) return message.reply("Mã nhẫn không hợp lệ.");

            const user = await findOrCreateUser(message.author.id, message.author.username);
            if (user.balance < rings[ringCode].price) {
                return message.reply("Bạn không đủ xu để mua nhẫn.");
            }

            user.balance -= rings[ringCode].price;
            user.ring = rings[ringCode].name;
            await user.save();

            message.reply(`Bạn đã mua nhẫn **${rings[ringCode].name}** với giá **${rings[ringCode].price} xu**.`);
            break;
        }
        case "egift": {
            if (args.length < 2) return message.reply("Cú pháp: `egift @user <mã nhẫn>`.");

            const mentionedUser = message.mentions.users.first();
            if (!mentionedUser) return message.reply("Hãy tag người dùng bạn muốn tặng nhẫn!");

            const ringCode = args[1];
            const rings = {
                "01": { name: "ENZ Peridot", price: 100000 },
                "02": { name: "ENZ Citrin", price: 200000 },
                "03": { name: "ENZ Topaz", price: 500000 },
                "04": { name: "ENZ Spinel", price: 1000000 },
                "05": { name: "ENZ Aquamarine", price: 2500000 },
                "06": { name: "ENZ Emerald", price: 5000000 },
                "07": { name: "ENZ Ruby", price: 10000000 },
                "999": { name: "ENZ Sapphire", price: 25000000 }
            };

            if (!rings[ringCode]) return message.reply("Mã nhẫn không hợp lệ.");

            const giver = await findOrCreateUser(message.author.id, message.author.username);
            if (!giver.ring) return message.reply("Bạn chưa có nhẫn để tặng!");

            const receiver = await findOrCreateUser(mentionedUser.id, mentionedUser.username);

            receiver.ring = rings[ringCode].name;
            await receiver.save();

            message.reply(`Bạn đã tặng nhẫn **${rings[ringCode].name}** cho ${mentionedUser.tag}.`);
            break;
        }
        case "eaddreply": {
            if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền thực hiện lệnh này!");

            const keyword = args[0];
            const reply = args.slice(1).join(" ");
            if (!keyword || !reply) return message.reply("Cú pháp: `eaddreply <từ_khóa> <nội_dung_trả_lời>`.");

            // Lưu trữ trả lời tự động
            // Your code to add automatic replies to the database or memory

            message.reply(`Đã thêm trả lời tự động cho từ khóa: **${keyword}**.`);
            break;
        }
        case "edelreply": {
            if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền thực hiện lệnh này!");

            const keyword = args[0];
            if (!keyword) return message.reply("Cú pháp: `edelreply <từ_khóa>`.");

            // Your code to delete automatic replies from the database or memory

            message.reply(`Đã xóa trả lời tự động cho từ khóa: **${keyword}**.`);
            break;
        }
        case "elistreply": {
            if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền thực hiện lệnh này!");

            // Your code to list all automatic replies

            message.reply("Danh sách trả lời tự động:");
            break;
        }
        case "eaddxu": {
            if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền thực hiện lệnh này!");

            const mentionedUser = message.mentions.users.first();
            const amount = parseInt(args[1]);
            if (!mentionedUser || isNaN(amount)) return message.reply("Cú pháp: `eaddxu @user <số_xu>`.");

            const user = await findOrCreateUser(mentionedUser.id, mentionedUser.username);
            user.balance += amount;
            await user.save();

            message.reply(`Đã thêm **${amount} xu** cho ${mentionedUser.tag}.`);
            break;
        }
        case "edelxu": {
            if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền thực hiện lệnh này!");

            const mentionedUser = message.mentions.users.first();
            const amount = parseInt(args[1]);
            if (!mentionedUser || isNaN(amount)) return message.reply("Cú pháp: `edelxu @user <số_xu>`.");

            const user = await findOrCreateUser(mentionedUser.id, mentionedUser.username);
            if (user.balance < amount) return message.reply("Người này không đủ xu!");

            user.balance -= amount;
            await user.save();

            message.reply(`Đã trừ **${amount} xu** từ ${mentionedUser.tag}.`);
            break;
        }
        case "eresetallbot": {
            if (message.author.id !== "1262464227348582492") return message.reply("Bạn không có quyền thực hiện lệnh này!");

            await User.deleteMany({});
            message.reply("Đã reset tất cả dữ liệu của bot.");
            break;
        }
        case "etop": {
            // Your code to show leaderboard
            break;
        }
        case "ehelps": {
            const helpEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("📚 Danh sách lệnh bot")
                .setDescription(`
                **eexu** - Kiểm tra số dư xu của bạn.
                **etx <số_xu> <tai/xiu>** - Chơi tài xỉu.
                **edaily** - Nhận xu hàng ngày.
                **egivexu @user <số_xu>** - Chuyển xu cho người khác.
                **emarry @user** - Cầu hôn người được tag.
                **edivorce** - Ly hôn vợ/chồng hiện tại.
                **epmarry** - Xem thông tin kết hôn.
                **eaddimage <URL ảnh>** - Thêm ảnh vào bộ sưu tập kết hôn.
                **edelimage <URL ảnh>** - Xóa ảnh khỏi bộ sưu tập kết hôn.
                **ebuy <mã nhẫn>** - Mua nhẫn để cầu hôn.
                **egift @user <mã nhẫn>** - Tặng nhẫn cho người khác.
                **eaddreply <từ_khóa> <nội_dung_trả_lời>** - Thêm trả lời tự động cho từ khóa.
                **edelreply <từ_khóa>** - Xóa trả lời tự động cho từ khóa.
                **elistreply** - Liệt kê các từ khóa và trả lời tự động.
                **eaddxu @user <số_xu>** - Thêm xu cho người dùng.
                **edelxu @user <số_xu>** - Trừ xu từ người dùng.
                **eresetallbot** - Reset tất cả dữ liệu của bot.
                **etop** - Hiển thị bảng xếp hạng người chơi.
                **ehelps** - Hiển thị danh sách lệnh của bot.
                `);
            message.reply({ embeds: [helpEmbed] });
            break;
        }
    }
});

// Đăng nhập vào Discord
client.login("YOUR_BOT_TOKEN");
