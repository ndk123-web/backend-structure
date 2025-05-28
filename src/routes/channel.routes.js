import { getChannelVideos , getChannelStats } from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlerwares/auth.middleware.js";

import { Router } from "express";

const channeRouter = Router();

channeRouter.use(verifyJWT);

channeRouter.route("/get-channel-stats").get(getChannelStats);
channeRouter.route("/get-channel-videos").get(getChannelVideos);

export { channeRouter }