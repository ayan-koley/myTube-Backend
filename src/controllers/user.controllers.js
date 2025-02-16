import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { deleteImageOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefressToken();
        await user.save({ ValidateBeforeSave: false });
        return {accessToken, refreshToken};        
    } catch (error) {
      console.log(error.message);
        throw new ApiError(500, "Something went wrong on creating AccessToken and Refresh Token", error.message);
    }
}

const registerUser = asyncHandler(async (req, res) => {
  // check for username, email, passowrd, fullname have or not
  const { username, fullname, email, password } = req.body;
  // check validation on values
  if (
    [username, fullname, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required !");
  }
  // check account already create on dbs or not
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User is already exist on database");
  }
  // checking avtar have or not

  if (!req.files.avatar) {
    throw new ApiError(400, "avatar is missing");
  }
  const avatarLocalFile = req.files?.avatar[0]?.path;
  const coverImageLocalFile = req.files?.coverImage?.[0]?.path;
  // upload avtar in cloudinary
  const avatarCloudinary = await uploadOnCloudinary(avatarLocalFile);
  // upload coverImage in cloudinary
  const converImageCloudinary = await uploadOnCloudinary(coverImageLocalFile);
  if (!avatarCloudinary) {
    throw new ApiError(400, "avatar file is missing");
  }
  // create a object from userData
  const newUser = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: {
      url: avatarCloudinary.url,
      public_id: avatarCloudinary.public_id
    },
    coverImage: {
      url: converImageCloudinary?.url || "",
      public_id: converImageCloudinary?.public_id || ""
    },
  });
  // remove refreshToken and password from return data
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  // check for user create
  if (!createdUser) {
    throw new ApiError(500, "User doesn't create");
  }
  // return result
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User create successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get email and password from user
  // validation on email and password
  // user have or not in dbs
  // generate refresh tokne
  // store access token as cookies
  // return login details
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const user = await User.findOne({ email });
  if(!user) {
    throw new ApiError(404, "User is not register on database");
  }
  const isValidPassword = await user.isCurrectPassword(password);
  if(!isValidPassword) {
    throw new ApiError(400, "Invalid User Crediantials :: password");
  }
  const {accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, refreshToken, accessToken
        },
        "User logedIn Successfully "
    )
  )

});

const logOutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          refreshToken: undefined
        }
      },
      {
        new: true // use for return updated value
      }
    )
    const options = {
      httpOnly: true,
      secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "User Logout successfully ")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    // decode the token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRECT);
    const user = await User.findById(decodedToken?._id);
    if(!user) {
      throw new ApiError(401, "Invalid Refresh token");
    }
    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
  
    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          accessToken, refreshToken
        },
        "AccessToken refresh"
      )
    )
  } catch (error) {
    throw new ApiError(500, error?.message || "Internal serverproblem when generate new refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body;
  if(!(oldPassword && newPassword) ) {
    throw new ApiError(400, "OldPassword and newpassword is missing");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCurrct = await user.isCurrectPassword(oldPassword);
  if(!isPasswordCurrct) {
    throw new ApiError(400, "Send a valid old password");
  }
  user.password = newPassword;
  await user.save({ValidateBeforeSave: false})
  return res
  .status(200)
  .json(
    new ApiResponse(200, "Password Change Successfully")
  )
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200, req.user, "Current user fetch successfully")
  )
})



const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatar = req.file?.path;
  console.log(req.file)
  if(!avatar) {
    throw new ApiError(400, "Avatar is missing ");
  }
  // find prev avtar from user
  const user = await User.findById(req.user?._id);
  if(!user) {
    throw new ApiError(401, "Unauthorized file changing request ");
  }
  // upload new avatar
  const newAvatar = await uploadOnCloudinary(avatar);
  if(!newAvatar.url) {
    throw new ApiError(500, "Problem when upload avatar on Cloudinary");
  }
  // delete old avatar

  // add new avatar
  const updatedUser = await User.findByIdAndUpdate(user._id,
    {
      $set: {
        avatar: {
          url: newAvatar.url,
          public_id: newAvatar.public_id
        }
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  if(user.avatar.public_id != "") {
    const deleteCoverImagefromCloudinary = await deleteImageOnCloudinary(user.avatar.public_id);
    if(!deleteCoverImagefromCloudinary) {
      throw new ApiError(500, "Something went wrong when delete avatar from cloudinary");
    }
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, updatedUser, "Avatar is successfully updated")
  )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage is missing ");
  }
  // find prev avtar from user
  const user = await User.findById(req.user?._id);
  if(!user) {
    throw new ApiError(401, "Unauthorized file changing request ");
  }
  // upload new avatar
  const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!newCoverImage.url) {
    throw new ApiError(500, "Problem when upload coverImage on Cloudinary");
  }
  // delete old avatar

  // add new avatar
  const updatedUser = await User.findByIdAndUpdate(user._id,
    {
      $set: {
        coverImage: {
          url: newCoverImage.url,
          public_id: newCoverImage.public_id
        }
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  if(user.coverImage.public_id != "") {
    const deleteCoverImagefromCloudinary = await deleteImageOnCloudinary(user.coverImage.public_id);
    if(!deleteCoverImagefromCloudinary) {
      throw new ApiError(500, "Something went wrong when delete coverimage from cloudinary");
    }
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200, updatedUser, "Avatar is successfully updated")
  )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params;
  if(!username?.trim()) {
    throw new ApiError(400, "Send a valid username name :");
  }
  const userDetails = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers"
        },
        channelSubscribedCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        email: 1,
        username: 1,
        subscriberCount: 1,
        channelSubscribedCount: 1,
        isSubscribed: 1
      }
    }
])

console.log("userDetails is ", userDetails);
  if(!userDetails?.length) {
    throw new ApiError(400, "channel doesn't exist")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200, userDetails[0], "User channel fetched successfully ")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    avatar: 1,
                    username: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])
  console.log(watchHistory);
  if(!watchHistory) {
    throw new ApiError(400, "Unauthorized request");
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200, watchHistory[0].watchHistory, "WatchHistory fetched successfully")
  )
})

export { 
  registerUser, 
  loginUser, 
  logOutUser, 
  refreshAccessToken, 
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
