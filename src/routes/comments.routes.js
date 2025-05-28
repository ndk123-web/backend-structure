import { addComment , getVideoComments , updateComment, deleteComment} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlerwares/auth.middleware.js";

import { Router } from "express";

const commentRouter = Router();

// middleware for all routes
commentRouter.use(verifyJWT);


commentRouter.route("/get-video-comment").post(getVideoComments);
commentRouter.route("/add-comment").post(addComment);
commentRouter.route("/update-comment").patch(updateComment)
commentRouter.route("/delete-comment/:commentId").delete(deleteComment)

export { commentRouter }