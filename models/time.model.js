import mongoose from "mongoose";

const TimeSchema = mongoose.Schema({
  closed_time: {
    type: String,
    required: true
  },
  opened_time: {
    type: String,
    required: true
  },
});

export const Time = mongoose.model("Time", TimeSchema);
