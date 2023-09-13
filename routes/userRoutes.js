import express from "express";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { checkAccessToken } from "../middleware/authMiddleware.js";
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import config from "../config/firebase.js"
import multer from "multer";
import Apply from "../models/applyModel.js";


initializeApp(config.firebaseConfig);
const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });


const userRouter = express.Router();
userRouter.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email });
    await user.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
userRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    console.log(password, user)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign({ id: user._id }, 'VinalinkGroup!2020', {
        expiresIn: '1h',
      });
      console.log(token)
      const refreshToken = jwt.sign({ id: user._id }, 'YourRefreshSecretKey', {
        expiresIn: '7d',
      });
      res.status(200).json({ token, refreshToken,role:'user' });
    } else {
      res.status(401).json({ message: 'Invalid password.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
userRouter.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, 'YourRefreshSecretKey');
    const accessToken = jwt.sign({ id: decoded.id }, 'VinalinkGroup!2020', {
      expiresIn: '1h',
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid Refresh Token.' });
  }
});
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Hoặc sử dụng các dịch vụ khác như SendGrid, Mailgun, ...
  auth: {
    user: 'do.not.reply.0612@gmail.com', // Điền email của bạn ở đây
    pass: 'lqdyfeilteovnofn', // Điền mật khẩu email của bạn ở đây
  },
});

// Route để xử lý yêu cầu quên mật khẩu và gửi email xác nhận
userRouter.post('/reset-password', async (req, res) => {
  const { email, confirmationCode, newPassword } = req.body;

  try {
    // Tìm người dùng với email và mã reset password khớp
    const user = await User.findOne({ email, confirmationCode });
    if (!user) {
      return res.status(404).json({ message: 'Invalid reset code.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu của người dùng với mật khẩu mới
    user.password = hashedPassword;
    // Xóa mã reset password để nó không thể được sử dụng lại
    user.confirmationCode = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
userRouter.put('/change-profile', checkAccessToken, upload.single('avatar'), async (req, res) => {
  const { username,userInfo  } = req.body;
  try {
    const userId = req.user.id;
    const updatedUserData = {};

    // Kiểm tra xem người dùng đã tải lên hình ảnh avatar hay chưa
    if (req.file) {
      const user = await User.findById(userId);
      const storageRef = ref(storage, `user-info/${user.email}/${req.file.originalname}`);
      const metadata = {
        contentType: req.file.mimetype,
      };
      const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
      //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

      // Grab the public URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      updatedUserData.avatar = downloadURL;
    }

    // Kiểm tra xem người dùng đã cung cấp tên người dùng mới hay chưa
    if (username) {
      updatedUserData.username = username;
    }
    console.log(userInfo)
    if (userInfo) {
      updatedUserData.userInfo = userInfo;
    }
    console.log(updatedUserData)
    const updatedUser = await User.findByIdAndUpdate(userId, updatedUserData, { new: true });
    res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Tạo mã xác nhận ngẫu nhiên (có thể sử dụng thư viện như crypto để tạo mã)
    const confirmationCode = uuidv4();

    // Lưu mã xác nhận vào tài khoản người dùng
    user.confirmationCode = confirmationCode;
    await user.save();

    // Gửi email xác nhận với mã xác nhận
    const mailOptions = {
      from: 'longvuxautrai12345@gmail.com',
      to: email,
      subject: 'Reset Password Confirmation',
      text: `Your confirmation code is: ${confirmationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Email could not be sent.' });
      }
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Confirmation code sent to your email.' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Access Token is missing.' });
  }
  jwt.verify(token, 'VinalinkGroup!2020', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Access Token is not valid.' });
    }

    req.user = user;
    next();
  });
};
userRouter.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
userRouter.post('/upload-cv', checkAccessToken, upload.single('cv'), async (req, res) => {
  try {
    // Lấy tên tệp đã tải lên từ request
    // const cvFileName = req.file.filename;

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (user.cv !== null || user.cvName !== null) {
      return res.send({ message: 'Aldready upload cv !' });
    }

    // Lấy thông tin người dùng từ JWT hoặc session
    console.log(req.file)
    const storageRef = ref(storage, `user-cv/${user.email}/${req.file.originalname}`);
    const metadata = {
      contentType: req.file.mimetype,
    };

    // Upload the file in the bucket storage
    const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('File successfully uploaded.');
    await User.findByIdAndUpdate(userId, { cv: downloadURL, cvName: req.file.originalname });
    // Lưu tên tệp vào thông tin người dùng hoặc làm bất kỳ điều gì bạn cần
    return res.send({
      message: 'file uploaded to firebase storage',
      name: req.file.originalname,
      type: req.file.mimetype,
      downloadURL: downloadURL
    })

    // console.log(req.user)
    // // Xác định đường dẫn đến tệp CV đã tải lên
    // const cvFilePath = `${uploadDirectory}/${cvFileName}`;
    // console.log(cvFileName,'cvFileName',userId);

    // // Cập nhật thông tin người dùng với tên tệp CV

    // res.status(200).json({ message: 'CV uploaded successfully.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});
userRouter.delete('/delete-cv', checkAccessToken, async (req, res) => {
  try {
    const userId = req.user.id; // Lấy thông tin người dùng từ AccessToken
    const user = await User.findById(userId);
    // Xóa thông tin CV của người dùng bằng cách đặt giá trị cv thành null
    await User.findByIdAndUpdate(userId, { cv: null, cvName: null });
    const storageRef = ref(storage, `user-cv/${user.email}`);

    await deleteObject(storageRef).then(() => {
      console.log("File deleted successfully!")
    }).catch((error) => {
      // Do something if error occured.
      console.log(error)
      if (error.code == 'storage/object-not-found') {
        console.log('Object not found!')
      }
    });
    res.status(200).json({ message: 'CV deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
userRouter.get('/applied-job', checkAccessToken, async (req, res) => {
  try {
    const userId = req.user.id; // Lấy thông tin người dùng từ AccessToken

      // Tìm tất cả các ứng viên cho công việc có jobId cụ thể
      const applicants = await Apply.find({ applicant: userId });

      if (!applicants || applicants.length === 0) {
          return res.status(404).json({ error: 'Bạn chưa ứng tuyển' });
      }

      res.status(200).json({ applicants: applicants });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});
export default userRouter;
