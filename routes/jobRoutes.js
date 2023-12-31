import express from "express";
import Job from "../models/jobModel.js";
import Apply from "../models/applyModel.js";
import User from "../models/userModel.js";
import { checkAccessToken } from "../middleware/authMiddleware.js";


const jobRouter = express.Router();

jobRouter.post('/apply-job', checkAccessToken, async (req, res) => {
    try {

        const { coverLetter, jobId } = req.body;
        const applicantId = req.user.id; 
        const user = await User.findById(applicantId);
        if (!user) {
            return res.status(200).json({ message: "Bạn là doanh nghiệp không thể ứng tuyển" });
            ;
        }
        const applyExit = await Apply.findOne({ applicant: user._id, job: jobId });
        if (applyExit) {
            return res.status(200).json({ message: "Bạn đã ứng tuyển rồi" });
        }
        if (user.cv === null) {
            return res.status(200).json({ message: "Bạn không có CV" });

        }
        const userWithoutPassword = { ...user.toObject() };
        delete userWithoutPassword.password;

        const application = new Apply({
            job: jobId,
            applicant: applicantId,
            coverLetter,
            applier: userWithoutPassword,
            cv: user.cv,
            email: user.email,
            phone: user.userInfo.phone
        });
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
        if (!infoJob) {
            return res.status(404).json({ error: "apply không tồn tại" });
        }
        const infoJobApply = await Apply.findOne({ job: infoJob._id });
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
        const { pageSize, currentPage, filter } = req.query;
        let sortOption = { createdAt: -1 }; 

        if (filter === 'newest') {
            sortOption = { createdAt: -1 }; 
        } else if (filter === 'oldest') {
            sortOption = { createdAt: 1 }; 
        }

        const skipCount = (currentPage - 1) * pageSize;

        const applicants = await Apply.find({ job: jobId }).sort(sortOption)
            .skip(skipCount)
            .limit(Number(pageSize));;

        if (!applicants || applicants.length === 0) {
            return res.status(200).json({ error: 'Không tìm thấy ứng viên cho công việc này.' });
        }

        res.status(200).json({ data: applicants });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.get('/get-list-create-job', checkAccessToken, async (req, res) => {
    try {
        const employerId = req.user.id;
        const { pageSize, currentPage, filter } = req.query;
        let sortOption = { createdAt: -1 }; 

        if (filter === 'newest') {
            sortOption = { createdAt: -1 };
        } else if (filter === 'oldest') {
            sortOption = { createdAt: 1 }; 
        }

        const skipCount = (currentPage - 1) * pageSize;
        const listJob = await Job.find({ author: employerId }).sort(sortOption)
            .skip(skipCount)
            .limit(Number(pageSize));
        const totalRecords = await Job.countDocuments({ author: employerId });

        if (!listJob || listJob.length === 0) {
            return res.status(200).json({ error: 'Không tìm thấy công việc nào được tạo' });
        }

        res.status(200).json({ listJob: listJob, total: totalRecords });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.get('/get-all-apply-job', async (req, res) => {
    try {
        const { pageSize, currentPage, filter, type } = req.query;
        let sortOption = { createdAt: -1 }; 
        if (filter === 'newest') {
            sortOption = { createdAt: -1 }; 
        } else if (filter === 'oldest') {
            sortOption = { createdAt: 1 }; 
        }

        const skipCount = (currentPage - 1) * pageSize;
        let query = {};

       
        if (!!type && type !== "") {
            const types = type.split('$').map(decodeURIComponent);
            query['type'] = { $all: types }; 
        }
        const totalRecords = await Job.countDocuments(query);  
        const allJobs = await Job.find(query)
            .sort(sortOption)
            .skip(skipCount)
            .limit(Number(pageSize));

        if (!allJobs || allJobs.length === 0) {
            return res.status(200).json({ error: 'Không tìm thấy công việc nào.' });
        }

        res.status(200).json({ allJobs, total: totalRecords });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.post('/search-jobs', async (req, res) => {
    try {
        const { keyword } = req.query;

        // Sử dụng biểu thức chính quy để tìm kiếm các công việc có tiêu đề chứa keyword
        const regex = new RegExp(keyword, 'i'); // 'i' để tìm kiếm không phân biệt hoa thường
        const matchedJobs = await Job.find({ title: regex });

        if (!matchedJobs || matchedJobs.length === 0) {
            return res.status(200).json({ error: 'Không tìm thấy công việc nào.' });
        }

        res.status(200).json({ matchedJobs });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
jobRouter.get('/get-all-type', async (req, res) => {
    try {
        const jobs = await Job.find({}, 'type');  // Lấy ra tất cả các loại công việc

        // Duyệt qua từng công việc, lấy ra các loại và chỉ trả về một lần cho mỗi loại
        const allTypes = jobs.reduce((types, job) => {
            job.type.forEach(type => {
                if (!types.includes(type)) {
                    types.push(type);
                }
            });
            return types;
        }, []);

        res.status(200).json({ types: allTypes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
export default jobRouter;
