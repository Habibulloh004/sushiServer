import mongoose from "mongoose";

// const NotifySchema = mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
//   subTitle: {
//     type: String,
//     required: true,
//   },
//   text: {
//     type: String,
//     required: true,
//   },
// });

const NotifySchema = mongoose.Schema({
  en: {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  ru: {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  uz: {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
});

export const Notify = mongoose.model("Notify", NotifySchema);
