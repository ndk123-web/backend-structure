import { Router } from "express";
import { verifyJWT } from "../middlerwares/auth.middleware.js";
import { subscribeUser, unSubscribeUser } from "../controllers/subcription.controllers.js";

const subscriptionRouter = Router();

subscriptionRouter.route("/subscribe/:channelId").post(
    verifyJWT,
    subscribeUser     
);

subscriptionRouter.route("/unsubscribe/:channelId").post(
    verifyJWT,
    unSubscribeUser
)

export { subscriptionRouter };