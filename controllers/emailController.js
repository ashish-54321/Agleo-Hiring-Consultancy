const nodemailer = require("nodemailer");
const User = require('../models/User');
const Otp = require("../models/Otp.js");
const { OtpLimit, FormLimit } = require("../models/Limit");


exports.send = async (req, res) => {
    const { name, email, phone, address, type, message } = req.body;

    const forwarded = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let ip = '';
    if (typeof forwarded === 'string') {
        const ipList = forwarded.split(',').map(ip => ip.trim());
        ip = `${ipList[0]} ${ipList[ipList.length - 1]}`
    } else {
        // fallback for direct IP
        ip = `${forwarded}`;
    }


    // CheckPoint
    if (!name || !email || !phone || !address || !type || !message || !ip) {
        return res.status(400).send({ message: "All fields are required." });
    }

    // Check Rate Limit
    const rateLimit = await FormLimit.findOne({ ip });
    if (rateLimit) {
        if (rateLimit.count >= 20) {
            return res.status(429).json({ message: "You exceeded the limit. Try again after 24 hours." });
        }

        // Increment count
        rateLimit.count += 1;
        await rateLimit.save();
    } else {
        // Create new limit document
        const newrateLimit = new FormLimit({ ip, count: 1 });
        await newrateLimit.save();
    }


    let transporter = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        port: 465,
        secure: true,
        auth: {
            user: process.env.User,
            pass: process.env.Pass,
        },
    });

    try {
        await transporter.sendMail({
            from: `"Website Enquiry" <Info@agleohiringconsultancy.com>`,
            to: "Info@agleohiringconsultancy.com",
            subject: "Agleo Consultancy: Enquiry From Your Website",
            html: `
            <div style="margin:0;padding:0;background-color:#f5f5f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
                <tr>
                  <td align="center" style="padding:30px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background-color:#0d6efd; color:#ffffff; text-align:center; padding:20px 40px;">
                          <h1 style="margin:0; font-size:24px;">Agleo Consultancy</h1>
                          <p style="margin:5px 0 0;font-size:14px;">New Website Enquiry</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:30px 40px; font-family:Arial, sans-serif; color:#333333;">
                          <h2 style="margin-top:0; font-size:20px; border-bottom:1px solid #eee; padding-bottom:10px;">Customer Details</h2>
                          <p><strong>Name:</strong> ${name}</p>
                          <p><strong>Email:</strong> ${email}</p>
                          <p><strong>Phone:</strong> ${phone}</p>
                          <p><strong>Address:</strong> ${address}</p>
                          <h2 style="margin-top:30px; font-size:20px; border-bottom:1px solid #eee; padding-bottom:10px;">Enquiry</h2>
                          <p><strong>Enquiry Type:</strong> ${type}</p>
                          <p style="margin-bottom:10px;"><strong>Message:</strong></p>
                          <div style="background-color:#f0f4ff; border-left:4px solid #0d6efd; padding:15px; border-radius:4px;">
                            ${message}
                          </div>
                          <p style="margin-top:30px; font-size:12px; color:#999;">This enquiry was submitted via your website.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color:#f0f0f0; color:#555; text-align:center; padding:15px; font-size:12px;">
                          &copy; ${new Date().getFullYear()} Agleo Hiring Consultancy. All rights reserved.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            `,
        });


        res.status(200).send({ message: "Email sent" });
    } catch (error) {
        console.error("Email sending failed:", error);
        res.status(500).send({ message: "Email failed", error });
    }
};

exports.sendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Check Rate Limit
    const rateLimit = await OtpLimit.findOne({ email });
    if (rateLimit) {
        if (rateLimit.count >= 3) {
            return res.status(429).json({ message: "You exceeded the OTP limit. Try again after 24 hours." });
        }

        // Increment count
        rateLimit.count += 1;
        await rateLimit.save();
    } else {
        // Create new limit document
        const newrateLimit = new OtpLimit({ email, count: 1 });
        await newrateLimit.save();
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in MongoDB
    try {
        await Otp.create({ email, otp: otpCode });

        let transporter = nodemailer.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.User,
                pass: process.env.Pass,
            },
        });

        await transporter.sendMail({
            from: `"Nutritional Nuts" <official@nutritionalnuts.com>`,
            to: email,
            subject: "Your OTP Code",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: #2c3e50; text-align: center;">Email Verification</h2>
            <p style="font-size: 16px; color: #333;">Dear User,</p>
            <p style="font-size: 16px; color: #333;">
            Thank you for using <strong>Nutritional Nuts</strong>. To continue, please use the OTP below to verify your email address.
            </p>
            <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #eaf7e1; color: #27ae60; font-size: 28px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 3px;">
            ${otpCode}
            </span>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">
             This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 13px; color: #999; text-align: center;">
              If you did not request this, please ignore this email or contact support.
            </p>
            </div>
            `,
        });

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        console.error("OTP send error:", err);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

exports.resetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(400).json({ message: "This Email Not Register" });

    // Check Rate Limit
    const rateLimit = await OtpLimit.findOne({ email });
    if (rateLimit) {
        if (rateLimit.count >= 3) {
            return res.status(429).json({ message: "You exceeded the OTP limit. Try again after 24 hours." });
        }

        // Increment count
        rateLimit.count += 1;
        await rateLimit.save();
    } else {
        // Create new limit document
        const newrateLimit = new OtpLimit({ email, count: 1 });
        await newrateLimit.save();
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in MongoDB
    try {
        await Otp.create({ email, otp: otpCode });

        let transporter = nodemailer.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.User,
                pass: process.env.Pass,
            },
        });

        await transporter.sendMail({
            from: `"Nutritional Nuts" <official@nutritionalnuts.com>`,
            to: email,
            subject: "Your OTP Code",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: #2c3e50; text-align: center;">🔐 Email Verification</h2>
            <p style="font-size: 16px; color: #333;">Dear User,</p>
            <p style="font-size: 16px; color: #333;">
            Thank you for using <strong>Nutritional Nuts</strong>. To continue, please use the OTP below to verify your email address.
            </p>
            <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #eaf7e1; color: #27ae60; font-size: 28px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 3px;">
            ${otpCode}
            </span>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">
             This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 13px; color: #999; text-align: center;">
              If you did not request this, please ignore this email or contact support.
            </p>
            </div>
            `,
        });

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        console.error("OTP send error:", err);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};
