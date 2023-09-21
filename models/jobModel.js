import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: { type: String },
        email: { type: String },
        company: { type: String },
        slug: { type: String },
        avatar: { type: String },
        salary: { type: String },
        address: { type: String },
        rank: { type: String },
        reason: [{ type: Object }],//Top 3 reasons to join us
        deadline: { type: String },
        type: [{ type: String }], //Skills
        welfare: { type: String }, // Why you'll love working here
        description: { type: String },//Job description
        requirement: { type: String },//Your skills and experience
        anotherInformation: [{ type: Object }],
        author: { type: String },
    },
    { timestamps: true }
);
const Job = mongoose.model("Job", jobSchema);
export default Job;
