import { Tweet } from "../models/tweets.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  // No need to check user existence since verifyJWT middleware already does that

  // Fix: Remove 'new' keyword and don't chain .select() with .create()
  const tweet = await Tweet.create({
    content,
    owner: userId, // MongoDB will automatically convert to ObjectId
  });

  // If you need tweet without owner, use separate query
  const createdTweet = await Tweet.findById(tweet._id).select("-owner");

  if (!createdTweet) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id), // Fix 1: Remove $ and convert to ObjectId
      },
    },
    {
      $lookup: {
        // Fix 2: Add lookup to get owner details
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullname: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        // Fix 3: Convert owner array to single object
        owner: { $first: "$owner" },
      },
    },
  ]);

  if (!userTweets?.length) {
    // Fix 4: Check array length, not falsy
    throw new ApiError(404, "No tweets found"); // Fix 5: Use 404 status code
  }

  return res.status(200).json(
    // Fix 6: Add return statement
    new ApiResponse(
      200,
      userTweets, // Fix 7: Send tweets directly
      "Successfully Fetched User Tweets",
    ),
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId, content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Check if user is the owner of the tweet
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized: You can't update this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { 
      $set: {
        content: content.trim()
      }
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedTweet,
      "Tweet updated successfully"
    )
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params; // Should be params not body for DELETE requests

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Check if user is the owner of the tweet
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized: You can't delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId); // Not req.user._id

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Tweet deleted successfully"
    )
  );
});

export { createTweet, getUserTweets, updateTweet , deleteTweet};
