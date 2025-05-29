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
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tweet",
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
});

const Like = new mongoose.model("Like", likeSchema);

export { Like }