import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";

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
app.use("/api", jobRouter);
app.use("/", userRouter);
app.get('/', async (req, res) => {
    res.json('hello');
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
