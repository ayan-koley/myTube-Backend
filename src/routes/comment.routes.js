import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controllers.js"
import {verifyJwt} from "../middlewares/auth.middlewares.js"

const router = Router();

router.route("/:videoId").get(getVideoComments).post(verifyJwt, addComment);
router.route("/c/:commentId").delete(verifyJwt, deleteComment).patch(verifyJwt, updateComment);

export default router