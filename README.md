# Discord Bot - ENZ Bot

## Giới thiệu
ENZ Bot là một bot Discord đa chức năng với các lệnh về kinh tế, kết hôn, và quản lý server. Bot được thiết kế với prefix `e` và tích hợp lưu trữ dữ liệu bằng MongoDB, chạy ổn định 24/7 trên Render.com.

---

## Tính năng chính

### **1. Kinh tế**
- `exu`: Kiểm tra số dư xu của bạn.
- `etx <số_xu> <tai/xiu>`: Chơi tài xỉu với cơ chế đặt cược.
- `edaily`: Nhận xu ngẫu nhiên từ **1,000** đến **20,000** mỗi ngày.
- `egivexu @user <số_xu>`: Chuyển xu cho người dùng khác.
- `etop`: Hiển thị bảng xếp hạng người dùng có nhiều xu nhất.

### **2. Kết hôn**
- **Shop nhẫn:**
  - Các loại nhẫn với giá từ 100,000 đến 25,000,000 xu.
- **Lệnh kết hôn:**
  - `ebuy <mã_nhẫn>`: Mua nhẫn để cầu hôn.
  - `egift @user`: Tặng nhẫn cho người dùng khác.
  - `emarry @user`: Cầu hôn một người dùng (cả hai phải đồng ý).
  - `epmarry`: Hiển thị thông tin hôn nhân (bao gồm ảnh nếu có).
  - `edivorce`: Ly hôn với xác nhận trước.
  - `eaddimage <link>`: Thêm ảnh kết hôn (khi đã kết hôn).
  - `edelimage`: Xóa ảnh kết hôn.

### **3. Điểm yêu thương**
- `elove`: Tăng **1 điểm yêu thương** mỗi giờ.

### **4. Quản lý**
- `eaddreply <từ_khóa> <nội_dung>`: Thêm trả lời tự động (admin).
- `edelreply <từ_khóa>`: Xóa trả lời tự động (admin).
- `elistreply`: Hiển thị danh sách trả lời tự động.
- `eaddxu @user <số_xu>`: Thêm xu cho người dùng khác (chỉ dành cho admin).
- `edelxu @user <số_xu>`: Trừ xu của người dùng (chỉ dành cho admin).
- `eresetallbot`: Reset toàn bộ dữ liệu bot (chỉ dành cho admin).

---

## Yêu cầu cài đặt

- **Node.js** (phiên bản 16.9.0 trở lên)
- **MongoDB** (để lưu trữ dữ liệu người dùng)
- **Discord.js** (phiên bản 14.x)

---

## Hướng dẫn cài đặt

### **1. Clone repository**
```bash
git clone <link-repo-của-bạn>
cd discord-bot
