import {Router} from "express"
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";
import {verifyJwt} from "../middlewares/auth.middlewares.js"

const router = Router();

router.route("/").get(getAllVideos)
router.route("/publish-video").post(verifyJwt, upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]) ,publishAVideo)
router.route("/getvideo/:videoId").get(getVideoById)
router.route("/updatevideo/:videoId").patch(updateVideo)
router.route("/deletevideo/:videoId").delete(deleteVideo)
router.route("/toggle-publish/:videoId").patch(togglePublishStatus);

export default router