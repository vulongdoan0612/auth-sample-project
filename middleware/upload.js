import multer from 'multer';
import fs from 'fs'; // Import thư viện fs
// Cấu hình nơi lưu trữ tệp tải lên
const uploadDirectory = 'uploads';
if (!fs.existsSync(uploadDirectory)) {
    // Nếu chưa tồn tại, hãy tạo nó
    fs.mkdirSync(uploadDirectory);
  }
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Đường dẫn tới thư mục lưu trữ, bạn có thể thay đổi thành đường dẫn thư mục của bạn
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Tên tệp sau khi lưu trữ, bạn có thể thay đổi tên tệp nếu cần
    cb(null, file.originalname);
  },
});

// Tạo middleware multer
const upload = multer({ storage: storage });

export { upload, uploadDirectory };
