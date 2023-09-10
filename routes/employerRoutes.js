import express from "express";
import Employer from "../models/employerModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const employerRouter = express.Router();
employerRouter.post('/register-employer', async (req, res) => {
    const { companyName, password,email,address } = req.body;

    try {
        const existingCompany = await Employer.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ message: 'email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const employer = new Employer({ companyName, password: hashedPassword ,email,address});
        await employer.save();

        res.status(201).json({ message: 'employer registered successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
employerRouter.post('/login-employer', async (req, res) => {
    const { email, password } = req.body;

    try {
        const employer = await Employer.findOne({ email });
        if (!employer) {
            return res.status(404).json({ message: 'employer not found.' });
        }
        console.log(password,employer)
        const isPasswordValid = await bcrypt.compare(password, employer.password);
        if (isPasswordValid) {
            const token = jwt.sign({ id: employer._id }, 'VinalinkGroup!2020', {
                expiresIn: '1h',
            });
            console.log(token)
            const refreshToken = jwt.sign({ id: employer._id }, 'YourRefreshSecretKey', {
                expiresIn: '7d',
            });
            res.status(200).json({ token, refreshToken });
        } else {
            res.status(401).json({ message: 'Invalid password.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
employerRouter.post('/refresh-token-employer', (req, res) => {
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
  employerRouter.post('/reset-password-employer', async (req, res) => {
    const { email, confirmationCode, newPassword } = req.body;
  
    try {
      // Tìm người dùng với email và mã reset password khớp
      const employer = await Employer.findOne({ email, confirmationCode });
      if (!employer) {
        return res.status(404).json({ message: 'Invalid reset code.' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu của người dùng với mật khẩu mới
      employer.password = hashedPassword;
      // Xóa mã reset password để nó không thể được sử dụng lại
      employer.confirmationCode = null;
      await employer.save();
  
      res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  employerRouter.post('/forgot-password-employer', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Kiểm tra xem người dùng có tồn tại không
      const employer = await Employer.findOne({ email });
      if (!employer) {
        return res.status(404).json({ message: 'employer not found.' });
      }
  
      // Tạo mã xác nhận ngẫu nhiên (có thể sử dụng thư viện như crypto để tạo mã)
      const confirmationCode = uuidv4();
  
      // Lưu mã xác nhận vào tài khoản người dùng
      employer.confirmationCode = confirmationCode;
      await employer.save();
  
      // Gửi email xác nhận với mã xác nhận
      const mailOptions = {
        from: 'longvuxautrai12345@gmail.com',
        to: email,
        subject: 'Reset Password Confirmation',
        text: `Your confirmation code of your company is: ${confirmationCode}`,
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
    jwt.verify(token, 'VinalinkGroup!2020', (err, employer) => {
        if (err) {
            return res.status(403).json({ message: 'Access Token is not valid.' });
        }

        req.employer = employer;
        next();
    });
};
employerRouter.get('/profile-employer', authenticateToken, async (req, res) => {
    try {
        const employer = await Employer.findById(req.employer.id);
        if (!employer) {
            return res.status(404).json({ message: 'employer not found.' });
        }
        const employerWithoutPassword = { ...employer.toObject() };
        delete employerWithoutPassword.password;
        res.status(200).json({ employer: employerWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default employerRouter;
