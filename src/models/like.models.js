import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  likeBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tweet",
    required: true,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  },
});

export const Like = new mongoose.model("Like", likeSchema);
