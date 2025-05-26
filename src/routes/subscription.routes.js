import { Router } from "express";
import { verifyJWT } from "../middlerwares/auth.middleware";
import { subscribeUser, unSubscribeUser } from "../controllers/subscription.controllers";

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