import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import employerRouter from "./routes/employerRoutes.js";
import cors from "cors";

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to database");
    })
    .catch((err) => {
        console.log(err.message);
    });

const app = express();

app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", jobRouter);
app.use("/", userRouter);
app.use("/", employerRouter);
app.use(cors({origin:true}))

app.get('/', async (req, res) => {
    res.json('hello');
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
