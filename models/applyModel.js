import mongoose from "mongoose";

const applySchema = new mongoose.Schema(
    {
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job'}, // Tham chiếu đến bài viết công việc
        applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tham chiếu đến người ứng tuyển
        coverLetter: { type: String }, // Thư xin việc hoặc giới thiệu bản thân
        appliedAt: { type: Date, default: Date.now }, // Thời gian ứng tuyển
        cv:{type:String},
        email:{type:String},
        phone:{type:String}
    },
    { timestamps: true }
);
const Apply = mongoose.model("Apply", applySchema);
export default Apply;
