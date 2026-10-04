
import crypto from "crypto";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { sendOtpEmail } from "@/lib/sendOtpEmail";
import { userlog } from "@/models/Registration";

export async function POST(request) {
  try {
    // ============================================
    // 1. GET DATA
    // ============================================

    const data = await request.json();

    const email = data.identifier;
    const number = data.number;

    console.log("LOGIN:", number, email);

    // ============================================
    // 2. VALIDATE EMAIL
    // ============================================

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. CONNECT DATABASE
    // ============================================

    await connectDB();

    // ============================================
    // 4. GENERATE OTP
    // ============================================

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    console.log("EMAIL:", normalizedEmail);
    console.log("OTP:", otp);

    // ============================================
    // 5. FIND EXISTING USER
    // ============================================

    const existingUser = await userlog.findOne({
      $or: [
        { email: normalizedEmail },
        { mobileNumber: number },
      ],
    });

    // ============================================
    // 6. USER DOES NOT EXIST
    // ============================================

    if (!existingUser) {
      console.log("NEW USER");

      // Generate token ONLY for new user
      const sessionToken = jwt.sign(
        {
          email: normalizedEmail,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "11d",
        }
      );

      // Create new user
      const newUser = new userlog({
        email: normalizedEmail,

        mobileNumber: number,

        tokenDetails: {
          currentToken: sessionToken,

          isFirstPhaseCompleted: false,

          isPhotoUploaded: false,

          isProfileFullyUpdated: false,

          isLoggedIn: false,

          tempOtp: otp,

          otpExpiresAt: otpExpiresAt,
        },
      });

      await newUser.save();

      console.log("NEW USER CREATED");

      // Send OTP
      await sendOtpEmail(
        normalizedEmail,
        otp
      );

      // Create response
      const response = NextResponse.json({
        success: true,

        message: "OTP sent successfully",

        isNewUser: true,
      });

      // ==========================================
      // SET TOKEN COOKIE
      // ==========================================

      response.cookies.set(
        "session",
        sessionToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 11 * 24 * 60 * 60,
          path: "/",
        }
      );

      return response;
    }

    // ============================================
    // 7. EXISTING USER
    // ============================================

    console.log("EXISTING USER");

    let sessionToken =
      existingUser.tokenDetails?.currentToken;

    // ============================================
    // 8. IF EXISTING USER HAS NO TOKEN
    // ============================================

    if (!sessionToken) {
      console.log(
        "Existing user has no token. Creating one..."
      );

      sessionToken = jwt.sign(
        {
          email: normalizedEmail,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "11d",
        }
      );

      existingUser.tokenDetails.currentToken =
        sessionToken;
    }

    // ============================================
    // 9. UPDATE OTP
    // ============================================

    existingUser.tokenDetails.tempOtp = otp;

    existingUser.tokenDetails.otpExpiresAt =
      otpExpiresAt;

    existingUser.tokenDetails.updatedAt =
      new Date();

    existingUser.markModified("tokenDetails");

    await existingUser.save();

    console.log(
      "USING TOKEN:",
      sessionToken
    );

    // ============================================
    // 10. SEND OTP
    // ============================================

    await sendOtpEmail(
      normalizedEmail,
      otp
    );

    console.log(
      "OTP EMAIL SENT:",
      normalizedEmail
    );

    // ============================================
    // 11. CREATE RESPONSE
    // ============================================

    const response = NextResponse.json({
      success: true,

      message: "OTP sent successfully",

      isNewUser: false,
    });

    // ============================================
    // 12. SET EXISTING TOKEN IN COOKIE
    // ============================================

    response.cookies.set(
      "session",
      sessionToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 11 * 24 * 60 * 60,
        path: "/",
      }
    );

    return response;

  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send OTP",
      },
      { status: 500 }
    );
  }
}




// import crypto from "crypto";
// import { NextResponse } from "next/server";
// import jwt from 'jsonwebtoken';
// import connectDB from "@/lib/db";
// import dbToken from "@/models/tokens";
// import { sendOtpEmail } from "@/lib/sendOtpEmail";
// import { userlog } from "@/models/Registration";

// export async function POST(request) {
//   try {
//     // Read email from request body
//     const data = await request.json();
//     const  email  = data.identifier;
//     const number = data.number;
//     console.log(number + email);
    

//     // Validate email
//     if (!email || typeof email !== "string") {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Email is required",
//         },
//         { status: 400 }
//       );
//     }

//     // Normalize email
//     const normalizedEmail = email.trim().toLowerCase();

//     if (!normalizedEmail) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Email is required",
//         },
//         { status: 400 }
//       );
//     }

//     // Connect to MongoDB
//     await connectDB();

//     // Generate 6-digit OTP
//     const otp = crypto.randomInt(100000, 1000000).toString();

//     // OTP expires in 5 minutes
//     const otpExpiresAt = new Date(
//       Date.now() + 5 * 60 * 1000
//     );

//     console.log("EMAIL VALUE:", normalizedEmail);
//     console.log("OTP GENERATED:", otp);

//     const payload = {
//   email: normalizedEmail,
// };

// const sessionToken = jwt.sign(
//   payload, 
//   process.env.JWT_SECRET, 
//   { expiresIn: '11d' } // 🚀 Valid for exactly 11 days
// );

//     /*
//      * --------------------------------------------------
//      * SAVE OTP TO MONGODB
//      * --------------------------------------------------
//      *
//      * You need to associate this OTP with the correct
//      * registration/token document.
//      *
//      * For now this section is commented because I don't
//      * yet know how your Registration document is linked
//      * to the user's email/currentToken.
//      */

//     // Example:
//     //
//     const alreadyemail = await userlog.findOne({
//         $or: [
//     { email: normalizedEmail },
//     { mobileNumber: number }
//   ]
//     });

    
//     if(!alreadyemail){
//        await connectDB();

//   const newUser = new userlog({
//     email: normalizedEmail,
//     mobileNumber: number,
//      tokenDetails: {
//       currentToken: sessionToken,
//       isFirstPhaseCompleted: false,
//       isPhotoUploaded: false,
//       isProfileFullyUpdated: false,
//       isLoggedIn: false,
//       tempOtp: otp,
//       otpExpiresAt: otpExpiresAt,
//     }
//   });

//   // Saving the parent document inserts everything into MongoDB automatically
//   const savedUser = await newUser.save();
//   console.log(savedUser);

//    await sendOtpEmail(normalizedEmail, otp);

//     console.log("OTP EMAIL SENT:", normalizedEmail);

//     return NextResponse.json({
//       success: true,
//       message: "OTP sent successfully",
//     });
//     }
    
//     // if (!tokenDoc) {
//     //   return NextResponse.json(
//     //     {
//     //       success: false,
//     //       message: "User/token not found",
//     //     },
//     //     { status: 404 }
//     //   );
//     // }
//     //
   
//     /*
//      * --------------------------------------------------
//      * SEND OTP EMAIL
//      * --------------------------------------------------
//      */
//     const fetchedToken = alreadyemail.tokenDetails;

// console.log("OLD TOKEN DETAILS:", fetchedToken);

    
//       alreadyemail.tokenDetails.tempOtp = otp;
//       alreadyemail.tokenDetails.otpExpiresAt = otpExpiresAt;
//       alreadyemail.tokenDetails.updatedAt = new Date();

//       alreadyemail.markModified("tokenDetails");

//   // 3. Save the changes permanently back to MongoDB
//   await alreadyemail.save();

//     await sendOtpEmail(normalizedEmail, otp);

//     console.log("OTP EMAIL SENT:", normalizedEmail);

//     const response =  NextResponse.json({
//       success: true,
//       message: "OTP sent successfully",
//     });

   

//   return response;

    
//   } catch (error) {
//     console.error("SEND OTP ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to send OTP",
//       },
//       { status: 500 }
//     );
//   }
// }
