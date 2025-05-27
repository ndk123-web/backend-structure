import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/apiResponse.js";

const subscribeUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const channelId = req.params.channelId;

  if (!userId || !channelId) {
    throw new ApiError(
      400,
      "User ID and Channel ID are required for subscription.",
    );
  }

  const subscriptionInstance = await Subscription.create({
    subscriber: new mongoose.Schema.Types.ObjectId(userId),
    channel: new mongoose.Schema.Types.ObjectId(channelId),
  });

  if (!subscriptionInstance) {
    throw new ApiError(500, "Subscription failed. Please try again later.");
  }

  res.status(200).json(new ApiResponse(200, {}, "Success Subscription"));
});

const unSubscribeUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const channelId = req.params.channelId;

  if (!userId || !channelId) {
    throw new ApiError(
      400,
      "User ID and Channel ID are required for unsubscription.",
    );
  }

  const unsubscriberInstance = await Subscription.findOneAndDelete({
    subscriber: new mongoose.Schema.Types.ObjectId(userId),
    channel: new mongoose.Schema.Types.ObjectId(channelId),
  });

  if (!unsubscriberInstance) {
    throw new ApiError(404, "Subscription not found or already unsubscribed.");
  }

  res.status(200).json(new ApiResponse(200, {}, "Success Unsubscription"));
});

export { subscribeUser, unSubscribeUser };
