import { Comment } from "../models/comment.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Validate videoId format
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const commentAggregation = Comment.aggregate([
    {
      $match: {
        video: mongoose.Schema.Types.ObjectId(videoId), // Fix: Use Types.ObjectId
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avtar: 1, // Fix: typo in 'avatar'
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const comments = await Comment.aggregatePaginate(commentAggregation, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  if (!comments.docs.length) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { comments: [] },
        "No comments found for this video",
      ),
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { comments }, "Comments fetched successfully"),
  );
});


export {
    getVideoComments
}