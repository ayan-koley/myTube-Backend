import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    playlistVideos,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js"
import {verifyJwt} from "../middlewares/auth.middlewares.js"

const router = Router();

// router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(verifyJwt, createPlaylist)

router
    .route("/:playlistId")
    .get(verifyJwt, getPlaylistById)
    .patch(verifyJwt, updatePlaylist)
    .delete(verifyJwt, deletePlaylist);

router.route("/add/:playlistId/:videoId").patch(verifyJwt, addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").patch(verifyJwt, removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);
router.route("/:playlistId/videos").get(playlistVideos);

export default router