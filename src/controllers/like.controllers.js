import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid VideoId");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid ObjectId of VideoId");
  }

  const userId = req.user._id;

  const existingLike = await Like.findOne({
    video: videoId,
    likeBy: userId,
  });

  if (existingLike) {
    // User has already liked the video, so remove the like
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully unliked"));
  }

  // User has not liked the video, so create a new like
  const newLike = await Like.create({
    video: videoId,
    likeBy: userId,
  });

  if (!newLike) {
    throw new ApiError(500, "Server Not able to Store Like");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Successfully liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid ObjectId of tweet");
  }

  const userId = req.user._id;

  const isExist = await Like.findOne({
    tweet: tweetId,
    likeBy: userId,
  });

  if (!isExist) {
    const newTweet = await Like.create({
      tweet: tweetId,
      likeBy: userId,
    });

    if (!newTweet) {
      throw new ApiError(500, "Server Not able to store new tweet");
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully liked the tweet"));
  } else {
    await Like.findByIdAndRemove(isExist._id);
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully unliked the tweet"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid ObjectId of comment id");
  }

  const userId = req.user._id;

  const existingLike = await Like.findOne({
    comment: commentId,
    likeBy: userId,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully unliked the comment"));
  }

  const newCommentLike = await Like.create({
    comment: commentId,
    likeBy: userId,
  });

  if (!newCommentLike) {
    throw new ApiError(500, "Server not able to store the comment like");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully liked the comment"));
});

// sample output of getLikedVideos
/*
  {
  "_id": "u1",
  "fullname": "Navnath",
  "email": "nav@example.com",
  "avatar": "dp.png",
  "likedVideos": [
    {
      "_id": "l1",
      "likeBy": "u1",
      "video": {
        "_id": "v1",
        "title": "Node.js Crash",
        "owner": {
          "_id": "u2",
          "fullname": "John"
        }
      }
    },
    {
      "_id": "l2",
      "likeBy": "u1",
      "video": {
        "_id": "v2",
        "title": "AI Basics",
        "owner": {
          "_id": "u3",
          "fullname": "Jane"
        }
      }
    }
  ]
}

*/
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const userLikedVideos = await User.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    {
      $lookup: {
        from: "likes", // converted collection name
        localField: "_id",
        foreignField: "likeBy",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "videoDetails",
              pipeline: [
                {
                  $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "videoOwnerDetails",
                  },
                },
                {
                  $unwind: "$videoOwnerDetails",
                },
              ],
            },
          },
          {
            $unwind: "$videoDetails",
          },
          {
            $project: {
              _id: 1,
              likeBy: 1,
              video: "$videoDetails", // embed whole video doc with owner
            },
          },
        ],
      },
    },
    {
      $project: {
        fullname: 1,
        email: 1,
        avatar: 1,
        likedVideos: 1,
      },
    },
  ]);

  res.status(200).json(userLikedVideos[0]?.likedVideos || []);
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
