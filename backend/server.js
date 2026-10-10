require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const contentRoutes = require("./routes/contentRoutes");
const authRoutes = require("./routes/authRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

//Allows Express to understand JSON request bodies
app.use(express.json());

//Logs incoming requests in the VS Code terminal
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

//Root route
app.get("/", (req, res) => {
    res.send("CMS Backend API is running");
});

//API routes
app.use("/api/content", contentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/media", mediaRoutes);
//Error-handling middleware
app.use(errorMiddleware);

//Connect to MongoDB, then start the server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    });