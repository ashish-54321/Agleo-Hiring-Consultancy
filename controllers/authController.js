const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Otp = require("../models/Otp.js");

exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, otp } = req.body;

        if (!email || !fullName || !password || !otp) {
            return res.status(400).json({ message: "Missing Required Details" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const validOtp = await Otp.findOne({ email, otp });
        if (!validOtp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Delete OTP after successful verification
        await Otp.deleteMany({ email });

        // Continue registration process
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, email, password: hashedPassword });
        await newUser.save();

        // ✅ Single response only
        return res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Signup failed", error });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({ token, user: { fullName: user.fullName, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error });
    }
};


exports.restPassword = async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        if (!email || !password || !otp) {
            return res.status(400).json({ message: "Missing Required Details" });
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "Email Not Found" });
        }

        const validOtp = await Otp.findOne({ email, otp });
        if (!validOtp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Delete OTP after successful verification
        await Otp.deleteMany({ email });

        // Continue reset process
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword

        await existingUser.save();

        // ✅ Single response only
        return res.status(201).json({ message: "Password Reset successfully" });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Password Reset failed", error });
    }
};
