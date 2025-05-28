import { Comment } from "../models/comments.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { User } from "../models/user.models.js";

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

  // comments object structure from mongoose-aggregate-paginate-v2:
  /*
  {
    docs: [], // The actual comment documents
    totalDocs: 23, // Total number of documents
    limit: 10, // Documents per page
    totalPages: 3, // Total number of pages
    page: 3, // Current page
    pagingCounter: 21, // Starting document number
    hasPrevPage: true, // If previous page exists
    hasNextPage: false, // If next page exists
    prevPage: 2, // Previous page number
    nextPage: null // Next page number
  }
  */
  const comments = await Comment.aggregatePaginate(commentAggregation, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  if (!comments.docs.length) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { comments: [] },
          "No comments found for this video",
        ),
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { comments }, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { v } = req.query;

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User Id is Invalid");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Content is Empty");
  }

  const newComment = await Comment.create({
    content: content.trim(),
    video: v,
    owner: req.user._id,
  });

  if (!newComment) {
    throw new ApiError(500, "Server not able to Stored the New Comment");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { newComment: newComment },
        "Successfully adds comment",
      ),
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // Extract the comment ID and content from the request body.
  const { commentId, content } = req.body;

  // Get the user ID from the request object.
  const userId = req.user._id;

  // Check if the comment ID is present.
  if (!commentId) {
    // If comment ID is not present, throw an error.
    throw new ApiError(400, "Comment ID is required");
  }

  // Check if the comment ID is valid.
  if (!mongoose.isValidObjectId(commentId)) {
    // If comment ID is invalid, throw an error.
    throw new ApiError(400, "Invalid comment ID");
  }

  // Check if the content is present.
  if (!content?.trim()) {
    // If content is not present or empty, throw an error.
    throw new ApiError(400, "Content is required");
  }

  // Find the comment in the database by ID.
  const comment = await Comment.findById(commentId);

  // Check if the comment is found.
  if (!comment) {
    // If comment is not found, throw an error.
    throw new ApiError(404, "Comment not found");
  }

  // Verify the ownership of the comment.
  if (comment.owner.toString() !== userId.toString()) {
    // If the user is not the owner of the comment, throw an error.
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  // Update the comment in the database.
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content.trim(), // Trim the content to remove any whitespace.
      },
    },
    {
      new: true, // Return the updated document.
      runValidators: true, // Enforce schema validation.
    },
  ).populate({
    // Populate the owner of the comment with the username, fullname, and avatar.
    path: "owner",
    select: "username fullname avatar",
  });

  // Check if the comment is updated successfully.
  if (!updatedComment) {
    // If comment is not updated successfully, throw an error.
    throw new ApiError(500, "Failed to update comment");
  }

  // Send the updated comment back to the client.
  res.status(200).json(
    new ApiResponse(
      200,
      {
        editedComment: updatedComment, // Send the updated comment.
      },
      "Successfully updated the comment", // Send a success message.
    ),
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  // 1. Check if commentId exists in the request body
  if (!commentId) {
    throw new ApiError(400, "Invalid commentId");
  }

  // 2. Validate that commentId is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid ObjectId of CommentId");
  }

  // 3. Find the comment by its ID
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "No comments found");
  }

  // 4. Check if the logged-in user is the owner of the comment
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // 5. Delete the comment
  const isDelete = await Comment.findByIdAndDelete(commentId);
  if (!isDelete) {
    throw new ApiError(500, "Server was not able to delete this comment");
  }

  // 6. Send response
  res.status(200).json(new ApiResponse(200, {}, "Successfully deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
