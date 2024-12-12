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
            const partner = message.mentions.users.first();
            if (!partner) return message.reply("Bạn cần tag người mà bạn muốn cầu hôn! Cú pháp: `emarry @user`.");

            if (partner.id === message.author.id) {
                return message.reply("Bạn không thể tự kết hôn với chính mình!");
            }

            // Lấy dữ liệu người dùng và đối tượng
            const user = await findOrCreateUser(message.author.id, message.author.username);
            const partnerData = await findOrCreateUser(partner.id, partner.username);

            // Kiểm tra xem cả hai đã kết hôn chưa
            if (user.marriage || partnerData.marriage) {
                return message.reply("Một trong hai người đã kết hôn! Không thể kết hôn thêm.");
            }

            // Kiểm tra xem người dùng có nhẫn trong kho hay không
            if (!user.inventory || user.inventory.length === 0) {
                return message.reply("Bạn cần mua một chiếc nhẫn từ `eshop` trước khi cầu hôn!");
            }

            const embed = new EmbedBuilder()
                .setColor("Pink")
                .setTitle("💍 Lời cầu hôn")
                .setDescription(
                    `${message.author.username} muốn kết hôn với ${partner.username} bằng một chiếc nhẫn ${user.inventory[0]}.\n\n${partner.username}, hãy trả lời \`yes\` để chấp nhận hoặc \`no\` để từ chối.`
                );

            message.reply({ embeds: [embed] });

            const filter = (response) =>
                response.author.id === partner.id &&
                ["yes", "no"].includes(response.content.toLowerCase());

            const collector = message.channel.createMessageCollector({ filter, time: 30000 });

            collector.on("collect", async (response) => {
                if (response.content.toLowerCase() === "yes") {
                    // Xóa nhẫn khỏi kho của người cầu hôn
                    user.inventory.shift();
                    user.marriage = partner.id;
                    partnerData.marriage = message.author.id;

                    // Lưu dữ liệu
                    await user.save();
                    await partnerData.save();

                    message.channel.send(
                        `💖 Chúc mừng! ${message.author.username} và ${partner.username} đã chính thức kết hôn! 💍`
                    );
                } else {
                    message.channel.send(`${partner.username} đã từ chối lời cầu hôn. 😢`);
                }
                collector.stop();
            });

            collector.on("end", (_, reason) => {
                if (reason === "time") {
                    message.reply(`${partner.username} không trả lời. Lời cầu hôn đã hết hạn.`);
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

            // Kiểm tra xem người dùng đã kết hôn hay chưa
            if (!user.marriage) {
                return message.reply("Bạn chưa kết hôn với ai cả!");
            }

            // Lấy thông tin đối tác
            const partner = await findOrCreateUser(user.marriage);
            if (!partner) {
                return message.reply("Đối tác của bạn không tồn tại hoặc đã bị xóa.");
            }

            // Lấy thông tin hôn nhân
            const marriageDate = user.marriageDate || "Không rõ ngày";
            const lovePoints = user.lovePoints || 0;
            const weddingRing = user.weddingRing || "Không có nhẫn";
            const weddingImage = user.weddingImage || "Chưa thêm ảnh marry";

            // Embed hiển thị thông tin hôn nhân
            const embed = new EmbedBuilder()
                .setColor("Pink")
                .setTitle("💍 Thông tin hôn nhân")
                .addFields(
                    { name: "👫 Bạn đang hạnh phúc với", value: `${partner.username}`, inline: true },
                    { name: "📅 Ngày kết hôn", value: marriageDate, inline: true },
                    { name: "💎 Nhẫn kết hôn", value: weddingRing, inline: true },
                    { name: "❤️ Điểm yêu thương", value: `${lovePoints}`, inline: true },
                    { name: "🖼️ Ảnh marry", value: weddingImage, inline: false }
                )
                .setFooter({ text: "Hãy yêu thương và giữ gìn hạnh phúc của mình nhé!" });

            message.reply({ embeds: [embed] });
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
       case "eshop": {
            const rings = [
                { id: "01", name: "ENZ Peridot", price: 100000 },
                { id: "02", name: "ENZ Citrin", price: 200000 },
                { id: "03", name: "ENZ Topaz", price: 500000 },
                { id: "04", name: "ENZ Spinel", price: 1000000 },
                { id: "05", name: "ENZ Aquamarine", price: 2500000 },
                { id: "06", name: "ENZ Emerald", price: 5000000 },
                { id: "07", name: "ENZ Ruby", price: 10000000 },
                { id: "999", name: "ENZ Sapphire", price: 25000000 },
            ];

            const shopEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("💍 Cửa hàng nhẫn kết hôn")
                .setDescription(
                    rings
                        .map(
                            (ring) =>
                                `**${ring.id}**: ${ring.name} - ${ring.price.toLocaleString()} xu`
                        )
                        .join("\n")
                )
                .setFooter({ text: "Sử dụng lệnh ebuy <mã nhẫn> để mua!" });

            return message.reply({ embeds: [shopEmbed] });
        }

        case "ebuy": {
            const rings = [
                { id: "01", name: "ENZ Peridot", price: 100000 },
                { id: "02", name: "ENZ Citrin", price: 200000 },
                { id: "03", name: "ENZ Topaz", price: 500000 },
                { id: "04", name: "ENZ Spinel", price: 1000000 },
                { id: "05", name: "ENZ Aquamarine", price: 2500000 },
                { id: "06", name: "ENZ Emerald", price: 5000000 },
                { id: "07", name: "ENZ Ruby", price: 10000000 },
                { id: "999", name: "ENZ Sapphire", price: 25000000 },
            ];

            const ringId = args[0];
            if (!ringId) return message.reply("Cú pháp: `ebuy <mã nhẫn>`.");

            const ring = rings.find((r) => r.id === ringId);
            if (!ring) return message.reply("Mã nhẫn không hợp lệ!");

            const buyer = await findOrCreateUser(message.author.id, message.author.username);
            if (buyer.balance < ring.price) {
                return message.reply("Bạn không đủ xu để mua nhẫn này!");
            }

            buyer.balance -= ring.price;

            if (!buyer.inventory) buyer.inventory = [];
            buyer.inventory.push(ring.name);

            await buyer.save();

            message.reply(`💍 Bạn đã mua nhẫn **${ring.name}** thành công!`);
            break;
        }

        case "einv": {
            const user = await findOrCreateUser(message.author.id, message.author.username);

            if (!user.inventory || user.inventory.length === 0) {
                return message.reply("📦 Kho lưu trữ của bạn trống. Hãy mua nhẫn tại `eshop`!");
            }

            const inventoryEmbed = new EmbedBuilder()
                .setColor("Pink")
                .setTitle("📦 Kho lưu trữ nhẫn của bạn")
                .setDescription(
                    user.inventory.map((ring, index) => `${index + 1}. ${ring}`).join("\n")
                )
                .setFooter({ text: `Bạn có ${user.inventory.length} nhẫn trong kho.` });

            message.reply({ embeds: [inventoryEmbed] });
            break;
        } 
        case "egift": {
            const recipient = message.mentions.users.first();
            const ringName = args.slice(1).join(" ");

            if (!recipient) {
                return message.reply("Bạn cần tag người nhận! Cú pháp: `egift @user <tên_nhẫn>`.");
            }

            if (recipient.id === message.author.id) {
                return message.reply("Bạn không thể tặng nhẫn cho chính mình!");
            }

            if (!ringName) {
                return message.reply("Hãy nhập tên nhẫn mà bạn muốn tặng! Cú pháp: `egift @user <tên_nhẫn>`.");
            }

            // Lấy dữ liệu người dùng và đối tượng
            const sender = await findOrCreateUser(message.author.id, message.author.username);
            const receiver = await findOrCreateUser(recipient.id, recipient.username);

            if (!sender.inventory || sender.inventory.length === 0) {
                return message.reply("Bạn không có nhẫn nào trong kho để tặng! Hãy mua nhẫn tại `eshop`.");
            }

            // Kiểm tra nhẫn có trong kho hay không
            const ringIndex = sender.inventory.findIndex((item) => item.toLowerCase() === ringName.toLowerCase());
            if (ringIndex === -1) {
                return message.reply("Bạn không có nhẫn này trong kho để tặng.");
            }

            // Chuyển nhẫn từ người gửi sang người nhận
            const ring = sender.inventory[ringIndex];
            sender.inventory.splice(ringIndex, 1); // Xóa nhẫn khỏi kho của người gửi
            if (!receiver.inventory) receiver.inventory = [];
            receiver.inventory.push(ring); // Thêm nhẫn vào kho của người nhận

            // Lưu thay đổi
            await sender.save();
            await receiver.save();

            const giftEmbed = new EmbedBuilder()
                .setColor("Pink")
                .setTitle("🎁 Quà tặng nhẫn")
                .setDescription(
                    `${message.author.username} đã tặng nhẫn **${ring}** cho ${recipient.username}.`
                );

            message.reply({ embeds: [giftEmbed] });
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
                **exu** - Kiểm tra số dư xu của bạn.
                **etx <số_xu> <tai/xiu>** - Chơi tài xỉu.
                **edaily** - Nhận xu hàng ngày.
                **egivexu @user <số_xu>** - Chuyển xu cho người khác.
                **emarry @user** - Cầu hôn người được tag.
                **edivorce** - Ly hôn vợ/chồng hiện tại.
                **epmarry** - Xem thông tin kết hôn.
                **eaddimage <URL ảnh>** - Thêm ảnh vào bộ sưu tập kết hôn.
                **edelimage <URL ảnh>** - Xóa ảnh khỏi bộ sưu tập kết hôn.
                **eshop** - Hiển thị các loại nhẫn có thể mua
                **ebuy <mã nhẫn>** - Mua nhẫn để cầu hôn.
                **einv** - Kiểm tra kho nhẫn của bạn
                **egift @user <tên_nhẫn>** - Tặng nhẫn cho người khác.
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
