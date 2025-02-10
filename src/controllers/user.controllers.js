import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefressToken();
        await user.save({ ValidateBeforeSave: false });
        return {accessToken, refreshToken};        
    } catch (error) {
        throw new ApiError(500, "Something went wrong on creating AccessToken and Refresh Token");
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
    avatar: avatarCloudinary.url,
    coverImage: converImageCloudinary?.url || "",
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
export { registerUser, loginUser, logOutUser };
