import { Router } from "express";
import {
  changeCurrentPassword,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  addInWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logOut").post(verifyJwt, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyJwt, changeCurrentPassword);
router.route("/getcurrentuser").get(verifyJwt, getCurrentUser);
router
  .route("/change-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router
  .route("/change-coverimage")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);
router.route("/profile/:username").get(verifyJwt, getUserChannelProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistory);
router.route("/watch-history/:videoId").patch(verifyJwt, addInWatchHistory);
export default router;
