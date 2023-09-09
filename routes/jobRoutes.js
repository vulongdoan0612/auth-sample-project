import express from "express";
import expressAsyncHandler from "express-async-handler";
import Job from "../models/jobModel.js";


const jobRouter = express.Router();

jobRouter.get("/", async (req, res) => {
    const jobs = await Job.find();
    res.send(jobs);
});

jobRouter.post(
    "/job",
    expressAsyncHandler(async (req, res) => {
        const newJob = new Job({
            title: "",
            slug: "",
            salary: "",
            address: "",
            rank: "",
            deadline: "",
            welfare: [],
            description: "",
            requirement: "",
            anotherInformation: "",
        });
        const job = await newJob.save();
        res.send({ message: "Job Created", job });
    })
);
export default jobRouter;
