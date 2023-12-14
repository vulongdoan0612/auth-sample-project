import express from "express";
import Employer from "../models/employerModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { checkAccessToken } from "../middleware/authMiddleware.js";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import config from "../config/firebase.js"
import multer from "multer";
import { initializeApp } from "firebase/app";
import Job from "../models/jobModel.js";

initializeApp(config.firebaseConfig);
const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });
const employerRouter = express.Router();
employerRouter.post('/register-employer', async (req, res) => {
  const { companyName, password, email, address } = req.body;

  try {
    const existingCompany = await Employer.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employer = new Employer({ companyName, password: hashedPassword, email, address });
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
      return res.status(200).json({ message: 'Employer not found. Please sign up !',status:'NOT_FOUND' });
    }
    const isPasswordValid = await bcrypt.compare(password, employer.password);
    if (isPasswordValid) {
      const token = jwt.sign({ id: employer._id }, 'VinalinkGroup!2020', {
        expiresIn: '1h',
      });
      const refreshToken = jwt.sign({ id: employer._id }, 'YourRefreshSecretKey', {
        expiresIn: '7d',
      });
      res
        .status(200)
        .json({ token, refreshToken, role: "business", companyName: employer.companyName });
    } else {
      res.status(200).json({ message: 'Invalid password. Please try again.',status:'WRONG_PASSWORD' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
employerRouter.put('/change-profile-employer', checkAccessToken, upload.single('avatar'), async (req, res) => {
  const {
    address,
    companyName,
    welfare,
    description,
    anotherInformation,
    employerInfo
  } = req.body; try {
    const employerId = req.user.id;
    const updateEmployer = {};
    // Kiểm tra xem người dùng đã tải lên hình ảnh avatar hay chưa
    if (req.file) {
      const employer = await Employer.findById(employerId);
      const storageRef = ref(storage, `employer-info/${employer.email}/${req.file.originalname}`);
      const metadata = {
        contentType: req.file.mimetype,
      };
      const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
      //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

      // Grab the public URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      updateEmployer.avatar = downloadURL;
    }

    // Kiểm tra xem người dùng đã cung cấp tên người dùng mới hay chưa
    if (companyName) {
      updateEmployer.companyName = companyName;
    }
    if (companyName) {
      updateEmployer.companyName = companyName;
    }
    if (address) {
      updateEmployer.address = address;
    }

    if (description) {
      updateEmployer.description = description;
    }
    if (welfare) {
      updateEmployer.welfare = welfare;
    }
    if (employerInfo) {
      updateEmployer.employerInfo = employerInfo;
    }
    if (anotherInformation) {
      updateEmployer.anotherInformation = anotherInformation;
    }
    const updatedUser = await Employer.findByIdAndUpdate(employerId, updateEmployer, { new: true });
    res.status(200).json({ message: 'Profile updated successfully.', employer: updatedUser });
  } catch (error) {
    console.log(error);
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
employerRouter.post('/create-job-employer', checkAccessToken, async (req, res) => {
  try {
    const {
      title,
      company,
      salary,
      address,
      rank,
      deadline,
      welfare,
      description,
      requirement, reason,
      type,
      anotherInformation,
    } = req.body;
    const userId = req.user.id;
    const infoEmployer = await Employer.findOne({ _id: userId })
    if (
      !infoEmployer ||
      !infoEmployer.companyName ||
      !infoEmployer.address ||
      !infoEmployer.email ||
      !infoEmployer.avatar ||
      !infoEmployer.anotherInformation ||
      !infoEmployer.anotherInformation.phone ||
      !infoEmployer.anotherInformation.major ||
      !infoEmployer.anotherInformation.countEmploy ||
      !infoEmployer.anotherInformation.workTime ||
      !infoEmployer.anotherInformation.ot ||
      !infoEmployer.anotherInformation.anotherLocation ||
      !infoEmployer.anotherInformation.birthdate ||
      !infoEmployer.anotherInformation.fax ||
      !infoEmployer.anotherInformation.address ||
      !infoEmployer.anotherInformation.country
    ) {
      return res.status(200).json({ error: 'Vui lòng điền đầy đủ thông tin cá nhân trước khi tạo bài viết.' });
    }
    // Tạo một bài viết mới
    const job = new Job({
      title,
      company, reason,
      slug: company + title + rank,
      salary,
      address,
      rank,
      deadline,
      avatar: infoEmployer?.avatar,
      welfare, type,
      description,
      requirement,
      anotherInformation,
      author: userId, // Gán thông tin người tạo bài viết

    });
    // Lưu bài viết vào cơ sở dữ liệu
    await job.save();

    res.status(201).json({ message: 'Bài viết đã được tạo thành công.', job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
employerRouter.put('/edit-job-employer', checkAccessToken, async (req, res) => {
  const {
    title,
    company,
    salary,
    address,
    rank,
    reason,
    deadline,
    welfare,
    description,
    requirement,
    anotherInformation,
  } = req.body;
  try {
    const querySlug = req.query.querySlug;
    console.log(querySlug);
    const userId = req.user.id;
    const updatedPostJob = {};
    // if(userId===)
    const existingJob = await Job.findOne({ slug: querySlug });
    if (!existingJob) {
      return res.status(404).json({ message: 'Bài viết không tồn tại.' });
    }
    // Kiểm tra xem người dùng đã tải lên hình ảnh avatar hay chưa

    // Kiểm tra xem người dùng đã cung cấp tên người dùng mới hay chưa
    if (title) {
      updatedPostJob.title = title;
    }
    if (company) {
      updatedPostJob.company = company;
    }

    if (salary) {
      updatedPostJob.salary = salary;
    }
    if (address) {
      updatedPostJob.address = address;
    }
    if (rank) {
      updatedPostJob.rank = rank;
    }
    if (welfare) {
      updatedPostJob.welfare = welfare;
    }
    if (deadline) {
      updatedPostJob.deadline = deadline;
    }
    if (description) {
      updatedPostJob.description = description;
    }
    if (requirement) {
      updatedPostJob.requirement = requirement;
    }
    if (anotherInformation) {
      updatedPostJob.anotherInformation = anotherInformation;
    }
    if (reason) {
      updatedPostJob.reason = reason;
    }
    if (existingJob.author.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài viết này.' });
    }
    const updatedJob = await Job.findOneAndUpdate({ slug: querySlug, author: userId }, updatedPostJob, { new: true });
    res.status(200).json({ message: 'Profile updated successfully.', job: updatedJob });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});
employerRouter.delete('/delete-job-employer', checkAccessToken, async (req, res) => {
  try {
    const querySlug = req.query.slug;
    const userId = req.user.id;

    // Tìm bài viết dựa trên slug và kiểm tra xem author có phải là userId hay không
    const existingJob = await Job.findOne({ slug: querySlug, author: userId });
    if (!existingJob) {
      return res.status(404).json({ message: 'Bài viết không tồn tại hoặc bạn không có quyền xóa nó.' });
    }

    // Xóa bài viết
    await Job.findOneAndRemove({ slug: querySlug, author: userId });

    res.status(200).json({ message: 'Bài viết đã được xóa thành công.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
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
