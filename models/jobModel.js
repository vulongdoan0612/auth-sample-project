import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: { type: String },
        company: { type: String },
        slug: { type: String, unique: true },
        salary: { type: String },
        address: { type: String },
        rank: { type: String },
        deadline: { type: String },
        welfare: [{ type: String }],
        description: { type: String },
        requirement: { type: String },
        anotherInformation: { type: String }
    },
    { timestamps: true }
);
const Job = mongoose.model("Job", jobSchema);
export default Job;
