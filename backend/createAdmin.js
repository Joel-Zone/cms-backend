
const dns = require("node:dns");
dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createAdmin() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error(
                "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
            );
        }

        await mongoose.connect(process.env.MONGO_URI);

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("A user with this email already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name: "CMS Administrator",
            email,
            password: hashedPassword,
            role: "admin",
        });

        console.log("Admin account created successfully.");
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

createAdmin();
