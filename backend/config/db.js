const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to " + process.env.MONGO_URI);
    } catch (err) {
        console.error("DB connection error:", err);
        process.exit(1);
    }
};

module.exports = connectDB;