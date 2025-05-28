import { asyncHandler } from "../utils/asyncHandler"; // Importing asyncHandler to handle asynchronous routes
import mongoose from "mongoose"; // Importing mongoose for MongoDB operations
import { User } from "../models/user.models"; // Importing the User model
import { Like } from "../models/like.models"; // Importing the Like model
import { Video } from "../models/video.models"; // Importing the Video model
import { Subscription } from "../models/subscription.models"; // Importing the Subscription model
import { ApiError } from "../utils/apiError"; // Importing ApiError for error handling

// getChannelStats is an asynchronous function wrapped in asyncHandler
const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params; // Extract channelId from request parameters

  // Check if channelId is provided
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required"); // Throw error if channelId is missing
  }

  // Validate channelId format
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID"); // Throw error if channelId is not a valid ObjectId
  }

  // Aggregate the channel statistics
  const stats = await User.aggregate([
    // Match the user with the provided channelId

    { $match: { _id: new mongoose.Types.ObjectId(channelId) } },

    // Lookup videos owned by the matched user
    {
      $lookup: {
        from: "videos", // Reference to the videos collection
        localField: "_id", // Match user's _id
        foreignField: "owner", // With the video's owner field
        as: "videos", // Output field
      },
    },

    { $unwind: "$videos" }, // Deconstructing the videos array

    // Lookup likes for each video
    {
      $lookup: {
        from: "likes", // Reference to the likes collection
        localField: "videos._id", // Match video's _id
        foreignField: "video", // With the like's video field
        as: "likes", // Output field
      },
    },

    //  // Lookup Subscribers for each video
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

    // Add a field that counts the number of likes for each video
    {
      $addFields: {
        "videos.totalLikes": { $size: "$likes" }, // Calculate totalLikes
        "videos.subscribers": { $size: "$subscribers" },
      },
    },

    // Project specific fields to be returned
    {
      $project: {
        _id: 0, // Exclude the _id field
        videoId: "$videos._id", // Include videoId
        title: "$videos.title", // Include video title
        views: "$videos.views", // Include video views
        totalLikes: "$videos.totalLikes", // Include total number of likes
      },
    },
  ]);

  // Check if no statistics were found
  if (!stats.length) {
    throw new ApiError(404, "Channel not found"); // Throw error if no stats found
  }

  // Send the response with the fetched stats
  res.status(200).json(
    new ApiResponse(
      200,
      stats[0], // Send the first element of stats
      "Channel stats fetched successfully",
    ),
  );
});

export { getChannelStats }; // Export the getChannelStats function
