const mongoose = require("mongoose");

const otplimitSchema = new mongoose.Schema({
    email: { type: String, required: true },
    count: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
});

const formlimitSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    count: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
});

// Export both models in an object
module.exports = {
    OtpLimit: mongoose.model("otpLimit", otplimitSchema),
    FormLimit: mongoose.model("formLimit", formlimitSchema)
};
