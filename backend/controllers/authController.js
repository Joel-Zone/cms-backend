const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "editor",
      },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};


// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const registerUser = async (req, res, next) => {
//     try {
//         const { name, email, password, role } = req.body;

//         // Check if email already exists
//         const existingUser = await User.findOne({ email });

//         if (existingUser) {
//             return res.status(409).json({
//                 success: false,
//                 message: "User with this email already exists",
//             });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user
//         const user = await User.create({
//             name,
//             email,
//             password: hashedPassword,
//             role: "editor"
//         });

//         // Never return the password
//         res.status(201).json({
//             success: true,
//             message: "User registered successfully",
//             data: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//             },
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// const loginUser = async (req, res, next) => {
//     try {
//         const { email, password } = req.body;

//         // Find user by email
//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid email or password",
//             });
//         }

//         // Compare entered password with hashed password
//         const isPasswordCorrect = await bcrypt.compare(
//             password,
//             user.password
//         );

//         if (!isPasswordCorrect) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid email or password",
//             });
//         }
//         const token = jwt.sign(
//             {
//                 id: user._id,
//                 role: user.role,
//             },
//                 process.env.JWT_SECRET,
//             {
//                 expiresIn: "1h",
//             }
//         );

//         res.status(200).json({
//             success: true,
//             message: "Login successful",
//             data: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//                 token,
//             },
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// const getCurrentUser = async (req, res, next) => {
//     try {
//         const user = await User.findById(req.user.id).select(
//             "-password"
//         );

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: user,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = {
//     registerUser,
//     loginUser,
//     getCurrentUser,
// };