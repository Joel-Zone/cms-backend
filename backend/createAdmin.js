require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("./config/prisma");

async function createAdmin() {
    try {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error(
                "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
            );
        }

        await prisma.$connect();

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log("A user with this email already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                name: "CMS Administrator",
                email,
                password: hashedPassword,
                role: "admin",
            },
        });

        console.log("Admin account created successfully.");
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
