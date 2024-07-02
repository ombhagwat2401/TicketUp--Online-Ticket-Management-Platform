const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    userId: String,
    eventName: String,
    eventPrice: String,
    image: String,
    eventAttendee: String,
}, { timestamps: true });


const eventdb = new mongoose.model("events", eventSchema);

module.exports = eventdb;