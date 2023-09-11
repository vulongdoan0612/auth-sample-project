import express from "express";
import expressAsyncHandler from "express-async-handler";
import Job from "../models/jobModel.js";
import Apply from "../models/applyModel.js";
import User from "../models/userModel.js";
import { checkAccessToken } from "../middleware/authMiddleware.js";


const jobRouter = express.Router();

jobRouter.post('/apply-job', checkAccessToken, async (req, res) => {
    try {

        const { coverLetter } = req.body;
        const jobId = req.query.jobId;
        console.log(req.query, 'asdasdasd')
        const applicantId = req.user.id; // Lấy thông tin người dùng từ token hoặc session
        console.log(applicantId)
        const user = await User.findById(applicantId);
        if (!user) {
            return res.status(500).json({ message: "Bạn là doanh nghiệp không thể ứng tuyển" });
            ;
        }
        const applyExit = await Apply.findOne({applicant:user._id});
        if(applyExit){
            return res.status(500).json({ message: "Bạn đã ứng tuến rồi" });
        }
        // Tạo một bản ghi mới trong schema Application
        const application = new Apply({
            job: jobId,
            applicant: applicantId,
            coverLetter,
            cv: user.cv,
            email:user.email,
            phone:user.userInfo.phone
        });
        console.log(application)
        // Lưu thông tin ứng tuyển vào cơ sở dữ liệu
        await application.save();

        res.status(201).json({ message: 'Ứng tuyển thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.put('/edit-apply-job', checkAccessToken, async (req, res) => {
    const { coverLetter } = req.body;
    try {
        const querySlug = req.query.jobId;
        const infoJob = await Job.findOne({ _id: querySlug });
        console.log(infoJob)
        if (!infoJob) {
            return res.status(404).json({ error: "apply khogn6 tồn tại" });
        }
        const infoJobApply = await Apply.findOne({ job: infoJob._id });
        console.log(infoJobApply)
        if (!infoJobApply) {
            return res.status(404).json({ error: "Thông tin ứng tuyển không tồn tại" });
        }
        const updatedApply = await Apply.findByIdAndUpdate(infoJobApply._id, { coverLetter }, { new: true });


        res.status(200).json({ message: 'Profile updated successfully.', apply: updatedApply });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
})
jobRouter.get('/get-list-apply-job', checkAccessToken, async (req, res) => {
    try {
        const jobId = req.query.jobId;

        // Tìm tất cả các ứng viên cho công việc có jobId cụ thể
        const applicants = await Apply.find({ job: jobId });

        if (!applicants || applicants.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy ứng viên cho công việc này.' });
        }

        res.status(200).json({ applicants: applicants });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.get('/get-all-apply-job', async (req, res) => {
    try {
        const { pageSize, currentPage, filter, type } = req.query;

        // Kiểm tra filter để xác định cách sắp xếp
        let sortOption = { createdAt: -1 }; // Mặc định sắp xếp theo thời gian mới nhất

        if (filter === 'newest') {
            sortOption = { createdAt: -1 }; // Sắp xếp theo thời gian mới nhất
        } else if (filter === 'oldest') {
            sortOption = { createdAt: 1 }; // Sắp xếp theo thời gian cũ nhất
        }

        // Số bản ghi bỏ qua (phân trang)
        const skipCount = (currentPage - 1) * pageSize;

        // Sử dụng sortOption để sắp xếp kết quả
        const allJobs = await Job.find({type:type})
            .sort(sortOption)
            .skip(skipCount)
            .limit(Number(pageSize));

        if (!allJobs || allJobs.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy công việc nào.' });
        }

        res.status(200).json({ allJobs });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.post('/search-jobs',  async (req, res) => {
    try {
        const { keyword } = req.query;

        // Sử dụng biểu thức chính quy để tìm kiếm các công việc có tiêu đề chứa keyword
        const regex = new RegExp(keyword, 'i'); // 'i' để tìm kiếm không phân biệt hoa thường
        console.log(keyword)
        const matchedJobs = await Job.find({ title: regex });

        if (!matchedJobs || matchedJobs.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy công việc nào.' });
        }

        res.status(200).json({ matchedJobs });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default jobRouter;
