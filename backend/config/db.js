const mongoose = require("mongoose");

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to "+process.env.MONGO_URI))
    .catch((err) => console.log("Failed to "+process.env.MONGO_URI, err));