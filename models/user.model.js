import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  user_id: {
    type: Number,
  },
  name: {
    type: String,
  },
  login: {
    type: String,
    unique: true,
  },
  role_name: {
    type: String,
  },
  role_id: {
    type: Number,
  },
  user_type: {
    type: Number,
  },
  access_mask: {
    type: Number,
  },
  last_in: {
    type: String,
  },
});

export const User = mongoose.model("User", UserSchema)
