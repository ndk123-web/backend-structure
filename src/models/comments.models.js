import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = new mongoose.model("Comment", commentSchema);
