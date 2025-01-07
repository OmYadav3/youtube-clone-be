import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

// function which is generate both Accesstoken and Refreshtoken
const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = await user.generateAccessToken();
      const refreshToken = await user.generateRefreshToken();

      // Save the refreshtoken in Db with checking password so we use validateBeforeSave
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiError(
         500,
         "Something went wrong while generating Accesstoken and Refreshtoken"
      );
   }
};

const registerUser = asyncHandler(async (req, res) => {
   // get user details form frontend
   // check the field is empty or not
   // check if user is already exits or not
   // check for images and avatar
   // upload them to cloudinary ,avatar
   // create new obj - create entru on db
   // remove password and refreshtoken from response
   // check user creation
   // return response

   const { fullName, email, username, password } = req.body;

   if (
      [fullName, email, username, password].some(
         (field) => field?.trim() === ""
      )
   ) {
      throw new ApiError(400, "All Fields are required");
   }

   const existedUser = await User.findOne({
      $or: [{ email }, { username }],
   });

   if (existedUser) {
      throw new ApiError(
         409,
         "user with email or username are already exists "
      );
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   //    console.log(avatarLocalPath);

   // const coverImageLocalPath = req.files?.coverImage[0]?.path;
   //    console.log(coverImageLocalPath);

   let coverImageLocalPath;
   if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
   ) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file  is required path");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   //    console.log(avatar);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   //    console.log(coverImage);

   if (!avatar) {
      throw new ApiError(400, "Avatar is required");
   }

   const user = await User.create({
      email,
      username: username.toLowerCase(),
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
   });

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   if (!createdUser) {
      throw new ApiError(
         500,
         "Something went wrong while registering the user"
      );
   }

   return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
   // req.body - frontend details
   // check useris not empty
   // check in db by email or username
   // check password is correct
   // generate accesstoken and refreshtoken`
   // send token with cookie
   // return cookie

   const { username, email, password } = req.body;
   console.log(req.body)

   if (!(username || email)) {
      throw new ApiError(404, "email or username are required");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "User with email or username are not exists");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);

   if (!isPasswordValid) {
      throw new ApiError(404, "Password is inValid");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
   );
   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   // options is give secure the cookie on frontend , frontend developer cannot change the cookie at frontend by himself . Cookie is only change in backend
   const options = {
      httpOnly: true,
      secure: true,
   };
   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser,
               accessToken,
               refreshToken,
            },
            "User logged in Successfully "
         )
      );
});

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id, // how to find the user
      {
         $set: {
            // set is mongoDb operator for set fields
            refreshToken: undefined,
         },
      },
      {
         new: true, // new keyword true karne is humhe abb return mah jo value milega jismah refresh token undefined hoga
      }
   );

   const option = {
      httpOnly: true,
      secure: true,
   };

   return res
      .status(200)
      .clearCookie("accessToken", option)
      .clearCookie("refreshToken", option)
      .json(new ApiResponse(200, {}, "User Logout Successfully"));
});

const refreshAccesstoken = asyncHandler(async (req, res ) => {

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401, "Unauthorized request")
   }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
       throw new AppError(401, "Invalid  refresh token")
    }
 
    if(incomingRefreshToken!==user?.refreshToken){
    throw new AppError(401, "Referesh token is expired or used")
    }
 
    const options = {
       httpOnly: true,
       secure: true
    }
 
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id) 
 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
       new ApiResponse(
          200,
          {accessToken, refreshToken: newRefreshToken},
          "Access token refreshed "
       )
    )
  } catch (error) {
   throw new ApiError(
      401,
      error?.message || "Ivalid refresh token" 
   )
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const{oldPassword, newPassword} = req.body 

   if(!oldPassword || !newPassword == ""){
      throw new ApiError(
         400,
         "oldPassword or newPassword is empty"
      )
   }

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
      throw new ApiError(
         400,
         "Password is incorrect "
      )
   }

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json( new ApiResponse(
      200,
      {},
      "Password changed successfully "
   ))
})

const getCurrentUser = asyncHandler(async (req, res) => {
   return res
   .status(200)
   .json(new ApiResponse(
      200,
      req.user,
      "current user fetched successfully "
   ))
})

const updateAccountDetails = asyncHandler(async (req, res) =>{
   const {fullName, email} = req.body

   if(!fullName || !email){
      throw new ApiError(
         401,
         "All fields are required"
      )
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email
         }
      },
      {
         new: true     // its means when user updated valuye return 
      }
   ).select("-password")

   return res
   .status(200)
   .json(new ApiError(
      200,
      user,
      "Account Details updated successfully "
   ))
})

const updateUserAvatar = asyncHandler(async () => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
      throw new ApiError(
         400,
         "avatar file is missing"
      )
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
      throw new ApiError(
         400,
         "Error while uploading on avatar"
      )
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      {
         new: true
      }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiError(
      200,
      user,
      "Avatar updated successfully"
    ))
})

const updateUserCoverImage = asyncHandler(async () => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
      throw new ApiError(
         400,
         "coverImage file is missing"
      )
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
      throw new ApiError(
         400,
         "Error while uploading on coverImage"
      )
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      {
         new: true
      }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiError(
      200,
      user,
      "coverImage updated successfully"
    ))
})


export {
   registerUser,
   loginUser, 
   logoutUser, 
   refreshAccesstoken, 
   changeCurrentPassword, 
   getCurrentUser, 
   updateAccountDetails, 
   updateUserAvatar,
   updateUserCoverImage 
};
