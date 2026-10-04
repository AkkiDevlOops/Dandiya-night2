import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import Profile from "@/models/profile";
import { jwtVerify } from "jose";
import connectDB from "@/lib/db";
import { cookies } from "next/headers";
import { userlog } from "@/models/Registration";

import crypto from "crypto";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import sharp from "sharp";

// --------------------------------------------------
// Cloudinary configuration
// --------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --------------------------------------------------
// NSFWJS model
// Load once and reuse
// --------------------------------------------------

let nsfwModel = null;

async function getNSFWModel() {
  if (!nsfwModel) {
    console.log("Loading NSFWJS model...");

    nsfwModel = await nsfwjs.load();

    console.log("NSFWJS model loaded");
  }

  return nsfwModel;
}

// --------------------------------------------------
// POST /api/uploadimage
// --------------------------------------------------

export async function POST(request) {
  try {
    // ------------------------------------------------
    // DATABASE
    // ------------------------------------------------

    await connectDB();

    // ------------------------------------------------
    // AUTHENTICATION
    // ------------------------------------------------

    const cookieStore = await cookies();

    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(
      token,
      secret
    );

    const email = String(payload.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
        },
        { status: 401 }
      );
    }

    // ------------------------------------------------
    // FIND USER
    // ------------------------------------------------

    const user = await userlog.findOne({
      email,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------
    // FIND PROFILE
    // ------------------------------------------------

    

    const profile = await Profile.findOne({
      email : email
    });
    console.log(profile);
    console.log(email);
    
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------
    // FORM DATA
    // ------------------------------------------------

    const formData = await request.formData();

    const file = formData.get("image");

    if (
      !file ||
      typeof file.arrayBuffer !== "function"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No image file provided",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // FILE TYPE CHECK
    // ------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only JPG, PNG and WEBP images are allowed.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // FILE SIZE CHECK
    // Maximum 10 MB
    // ------------------------------------------------

    const MAX_FILE_SIZE =
      10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Image must be smaller than 10 MB.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // CONVERT FILE TO BUFFER
    // ------------------------------------------------

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    // ------------------------------------------------
    // VERIFY THAT IT IS ACTUALLY A VALID IMAGE
    //
    // This prevents someone from renaming another
    // file to .jpg/.png and uploading it.
    // ------------------------------------------------

    let imageMetadata;

    try {
      imageMetadata = await sharp(buffer).metadata();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or corrupted image.",
        },
        { status: 400 }
      );
    }

    const supportedFormats = [
      "jpeg",
      "png",
      "webp",
    ];

    if (
      !supportedFormats.includes(
        imageMetadata.format
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported image format.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // OPTIONAL DIMENSION CHECK
    // ------------------------------------------------

    if (
      !imageMetadata.width ||
      !imageMetadata.height
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not read image dimensions.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 1. EXACT DUPLICATE CHECK
    //
    // SHA-256 checks whether the exact same file
    // was already uploaded by this user.
    // ------------------------------------------------

    const imageHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    const existingHashes =
      profile.imageHashes || [];

    if (
      existingHashes.includes(imageHash)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have already uploaded this image.",
        },
        { status: 409 }
      );
    }

    console.log(
      "Image hash:",
      imageHash
    );

    // ------------------------------------------------
    // 2. NSFW MODERATION
    // ------------------------------------------------

    console.log(
      "Starting image moderation..."
    );

    const model = await getNSFWModel();

    // ------------------------------------------------
    // Convert image to raw RGB pixels
    // using Sharp
    // ------------------------------------------------

    const { data, info } =
      await sharp(buffer)
        .removeAlpha()
        .raw()
        .toBuffer({
          resolveWithObject: true,
        });

    // ------------------------------------------------
    // Create TensorFlow tensor
    // ------------------------------------------------

    const imageTensor =
      tf.tensor3d(
        new Uint8Array(data),
        [
          info.height,
          info.width,
          info.channels,
        ],
        "int32"
      );

    let predictions;

    try {
      predictions =
        await model.classify(
          imageTensor
        );
    } finally {
      // Free TensorFlow memory
      imageTensor.dispose();
    }

    console.log(
      "NSFW predictions:",
      predictions
    );

    // ------------------------------------------------
    // GET PREDICTIONS
    // ------------------------------------------------

    const pornPrediction =
      predictions.find(
        (item) =>
          item.className === "Porn"
      );

    const hentaiPrediction =
      predictions.find(
        (item) =>
          item.className === "Hentai"
      );

    const sexyPrediction =
      predictions.find(
        (item) =>
          item.className === "Sexy"
      );

    const pornProbability =
      pornPrediction?.probability || 0;

    const hentaiProbability =
      hentaiPrediction?.probability || 0;

    const sexyProbability =
      sexyPrediction?.probability || 0;

    console.log({
      pornProbability,
      hentaiProbability,
      sexyProbability,
    });

    // ------------------------------------------------
    // MODERATION THRESHOLDS
    // ------------------------------------------------

    const isPorn =
      pornProbability >= 0.40;

    const isHentai =
      hentaiProbability >= 0.40;

    // const isTooSexual =
    //   sexyProbability >= 0.80;

    // ------------------------------------------------
    // REJECT IMAGE
    // ------------------------------------------------

    if (
      isPorn ||
      isHentai 
    ) {
      console.log(
        "IMAGE REJECTED BY MODERATION"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "This image contains inappropriate content and cannot be uploaded.",
        },
        { status: 400 }
      );
    }

    console.log(
      "IMAGE PASSED MODERATION"
    );

    // ------------------------------------------------
    // 3. CLOUDINARY UPLOAD
    //
    // IMPORTANT:
    // There is NO:
    //
    // moderation: "aws_rek"
    //
    // because we are doing moderation ourselves.
    // ------------------------------------------------

    const uploadResult =
      await new Promise(
        (resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder:
                "user_uploads",

              resource_type:
                "image",
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(buffer);
        }
      );

    // ------------------------------------------------
    // CHECK CLOUDINARY RESULT
    // ------------------------------------------------

    if (
      !uploadResult ||
      !uploadResult.secure_url
    ) {
      throw new Error(
        "Cloudinary did not return an image URL."
      );
    }

    console.log(
      "Cloudinary upload successful:",
      uploadResult.secure_url
    );

    // ------------------------------------------------
    // 4. SAVE IMAGE + HASH
    // ------------------------------------------------

    profile.images =
      profile.images || [];

    profile.imageHashes =
      profile.imageHashes || [];

    profile.images.push(
      uploadResult.secure_url
    );

    profile.imageHashes.push(
      imageHash
    );

    await profile.save();

    // ------------------------------------------------
    // 5. UPDATE PHOTO STATUS
    // ------------------------------------------------

    if (!user.tokenDetails) {
      user.tokenDetails = {};
    }

    user.tokenDetails.isPhotoUploaded =
      true;

    await user.save();

    // ------------------------------------------------
    // SUCCESS
    // ------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        imageUrl:
          uploadResult.secure_url,

        message:
          "Image uploaded successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "IMAGE UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to upload image.",
      },
      { status: 500 }
    );
  }
}


// import { v2 as cloudinary } from 'cloudinary';
// import { NextResponse } from 'next/server';
// import User from '@/models/user'
// import Profile from '@/models/profile';
// import { jwtVerify } from 'jose';
// import connectDB from '@/lib/db';
// import { cookies } from 'next/headers';
// import { userlog } from '@/models/Registration';




// export async function POST(request) {
//   try {
//     connectDB();
//     cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

//      const cookieStore = await cookies();
//      const token = cookieStore.get('session')?.value;
//      if (!token) {
//       console.log("no token found")
//       return Response.json(false);
//     }
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
//       // 3. Verify and decode the token payload
//       const { payload } = await jwtVerify(token, secret);
//       const email = payload.email;
      
//            const user = await userlog.findOne({
//             email: email,
//           })
      
//            const userToken = user.tokenDetails

//     // 2. Parse the incoming multi-part form data
//     const formData = await request.formData();
//     const file = formData.get('image'); // Looks for the input named 'image'
   
  
    
//     if (!file) {
//       return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
//     }

//     // 3. Convert the file into a temporary buffer for Cloudinary
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // 4. Upload directly to your Cloudinary project environment
//     const uploadResult = await new Promise((resolve, reject) => {
//       cloudinary.uploader.upload_stream(
//         {
//           folder: 'user_uploads', // 📂 Automatically creates this folder in Cloudinary
//           resource_type: 'auto',  // Handles images, vectors, gifs, etc.
//         },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       ).end(buffer);
//     });

//       console.log(uploadResult.secure_url);
//     // const user = await  User.findOne()

//      const updatedUser = await Profile.findOneAndUpdate(
//       { email: email }, // 👈 Just write the key-value pair directly!
//       { $push: { images: uploadResult.secure_url } },
//       { returnDocument: 'after',
//         runValidators: true
//        }
     
//     );

//     console.log(updatedUser);

//     userToken.isPhotoUploaded = true
//     await user.save();

   
//     // 5. Return the permanent, queryable secure URL back to the frontend
//     return NextResponse.json({ 
//       success: true, 
//       imageUrl: uploadResult.secure_url // 🔗 Save this URL string in MongoDB later!
//     });

//   } catch (error) {
//     console.error('Cloudinary Upload Error:', error);
//     return NextResponse.json({ error: 'Failed to upload image to cloud' }, { status: 500 });
//   }
// }
