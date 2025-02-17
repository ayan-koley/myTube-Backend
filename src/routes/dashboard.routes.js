import {Router} from 'express';
import {verifyJwt} from '../middlewares/auth.middlewares.js';
import {getChannelStats, getChannelVideos} from '../controllers/dashboard.controllers.js';

const router = Router();

router.use(verifyJwt);

router.route("/status").get(getChannelStats);
router.route("/status/videos").get(getChannelVideos);

export default router;