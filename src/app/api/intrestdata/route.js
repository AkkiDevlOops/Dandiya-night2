import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import Profile from "@/models/profile";
import connectDB from "@/lib/db";
import { userlog } from "@/models/Registration";
import DiscoverySchema from "@/models/DiscoverySchema";

export async function POST(request) {
  try {
    /* =====================================================
       CONNECT DATABASE
    ===================================================== */

    await connectDB();

    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const cookieStore = await cookies();

    const token =
      cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Session cookie missing. Please log in.",
        },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Server authentication configuration is missing.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       VERIFY JWT
    ===================================================== */

    let payload;

    try {
      const verified =
        await jwtVerify(
          token,
          new TextEncoder().encode(
            process.env.JWT_SECRET
          )
        );

      payload =
        verified.payload;
    } catch (error) {
      console.error(
        "JWT verification error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired session. Please log in again.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET EMAIL
    ===================================================== */

    const email =
      payload.email;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email not found in session.",
        },
        { status: 401 }
      );
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    /* =====================================================
       GET REGISTRATION USER
    ===================================================== */

    const user =
      await userlog.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Registered user not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       PARSE BODY
    ===================================================== */

    const body =
      await request.json();

    const {
      interests,
      height,
      prompts,
    } = body;

    /* =====================================================
       VALIDATE INTERESTS
    ===================================================== */

    if (
      !Array.isArray(
        interests
      ) ||
      interests.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select at least one interest.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CLEAN INTERESTS
    ===================================================== */

    const cleanedInterests = [
      ...new Set(
        interests
          .map((interest) =>
            String(
              interest
            ).trim()
          )
          .filter(Boolean)
      ),
    ];

    if (
      cleanedInterests.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select at least one valid interest.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       HEIGHT
    ===================================================== */

    if (
      height === undefined ||
      height === null ||
      height === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Height is required.",
        },
        { status: 400 }
      );
    }

    const numericHeight =
      Number(height);

    if (
      !Number.isFinite(
        numericHeight
      ) ||
      numericHeight < 100 ||
      numericHeight > 250
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Height must be between 100cm and 250cm.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PROMPTS

       New schema:

       prompts: [
         {
           question: String,
           answer: String
         }
       ]
    ===================================================== */

    if (
      !Array.isArray(prompts)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Prompts must be an array.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       MAX 6 PROMPTS
    ===================================================== */

    if (
      prompts.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please add at least one prompt.",
        },
        { status: 400 }
      );
    }

    if (
      prompts.length > 6
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum 6 prompts are allowed.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CLEAN PROMPTS
    ===================================================== */

    const cleanedPrompts =
      prompts.map(
        (prompt) => {
          if (
            !prompt ||
            typeof prompt !==
              "object"
          ) {
            return null;
          }

          const question =
            typeof prompt.question ===
            "string"
              ? prompt.question.trim()
              : "";

          const answer =
            typeof prompt.answer ===
            "string"
              ? prompt.answer.trim()
              : "";

          return {
            question,
            answer,
          };
        }
      );

    /* =====================================================
       REMOVE INVALID PROMPTS
    ===================================================== */

    const validPrompts =
      cleanedPrompts.filter(
        (prompt) =>
          prompt &&
          prompt.question &&
          prompt.answer
      );

    if (
      validPrompts.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please complete at least one prompt.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PROMPT LENGTH VALIDATION
    ===================================================== */

    for (
      const prompt of validPrompts
    ) {
      if (
        prompt.question.length >
        200
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Prompt question cannot exceed 200 characters.",
          },
          { status: 400 }
        );
      }

      if (
        prompt.answer.length >
        1000
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Prompt answer cannot exceed 1000 characters.",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       UPDATE PROFILE

       IMPORTANT:
       We DO NOT update:

       username
       branch
       semester
       college
       gender
       email

       Those were already created during registration.
    ===================================================== */

    const profile =
      await Profile.findOneAndUpdate(
        {
          email:
            normalizedEmail,
        },

        {
          $set: {
            interests:
              cleanedInterests,

            height:
              String(
                numericHeight
              ),

            prompts:
              validPrompts,
          },
        },

        {
          new: true,
          runValidators: true,
        }
      );

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Profile not found. Please complete your basic profile first.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       UPDATE REGISTRATION STATUS
    ===================================================== */

    if (
      user.tokenDetails
    ) {
      user.tokenDetails.isProfileFullyUpdated =
        true;
    }

    await user.save();

    /* =====================================================
       CREATE DISCOVERY DOCUMENT
       
       ONLY CREATE IF IT DOESN'T ALREADY EXIST.
       
       This prevents duplicate Discovery documents.
    ===================================================== */

    const existingDiscovery =
      await DiscoverySchema.findOne(
        {
          email:
            normalizedEmail,
        }
      );

    if (
      !existingDiscovery
    ) {
      await DiscoverySchema.create(
        {
          email:
            normalizedEmail,

          liked: [],

          skipped: [],

          blocked: [],

          reported: [],

          likedBy: [],

          matches: [],
        }
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "Profile step two saved successfully.",

        user: profile,

        profile: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Profile save error:",
      error
    );

    /* =====================================================
       MONGOOSE VALIDATION ERROR
    ===================================================== */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const validationErrors =
        Object.values(
          error.errors || {}
        )
          .map(
            (err) =>
              err.message
          )
          .join(", ");

      return NextResponse.json(
        {
          success: false,
          error:
            validationErrors ||
            "Profile validation failed.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DUPLICATE KEY ERROR
    ===================================================== */

    if (
      error?.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A profile with this information already exists.",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       GENERIC ERROR
    ===================================================== */

    return NextResponse.json(
      {
        success: false,
        error:
          "Server error processing request.",
      },
      { status: 500 }
    );
  }
}


// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';
// import * as jose from 'jose';
// import { jwtVerify } from 'jose';
// import Profile from '@/models/profile';
// import connectDB from '@/lib/db';
// import dbToken from '@/models/tokens';
// import { userlog } from '@/models/Registration';
// import DiscoverySchema from '@/models/DiscoverySchema';

// export async function POST(request) {
//   try {
//     await connectDB();
//     // 1. Extract and Decrypt the Session Cookie (Inline Middleware)
//     const cookieStore = await cookies();
//     const token = cookieStore.get('session')?.value;
    
//     if (!token) {
//       return NextResponse.json({ error: 'Session cookie missing. Please log in.' }, { status: 401 });
//     }

//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
//       // 3. Verify and decode the token payload
//       const { payload } = await jwtVerify(token, secret);
//       const email = payload.email;
       
//              const user = await userlog.findOne({
//               email: email,
//             })
//         console.log(user);
    
//              const userToken = user.tokenDetails
    
//     // Now you have access to user info (e.g., payload.userId)
   

//     // 2. Parse and Validate the Incoming Body Data
//     const body = await request.json();
//     const { interests, height, prompt1, prompt2 } = body;

//     if (!interests || !Array.isArray(interests) || interests.length === 0) {
//       return NextResponse.json({ error: 'At least one interest is required.' }, { status: 400 });
//     }
//     if (!height || height < 100 || height > 250) {
//       return NextResponse.json({ error: 'A valid height is required.' }, { status: 400 });
//     }
//     if (!prompt1?.trim() || !prompt2?.trim()) {
//       return NextResponse.json({ error: 'Both prompts are required.' }, { status: 400 });
//     }

//         // const { interests, height, prompt1, prompt2 } = body;

//    const existing = await Profile.findOneAndUpdate(
//   { email: email }, // 1. Filter
//   {
//     $set: {
//       intrest: interests, // Note: If 'interests' is already an array, wrapping it in brackets [interests] makes it a nested array [[item1, item2]]. Drop the brackets if it's already an array!
//       height: height,
//       promt1: prompt1,
//       promt2: prompt2,
//     },
//   }, // 2. Update
//   { returnDocument: 'after', runValidators: true } // 3. Combined Options
// );

//     console.log(existing);
//     // 3. Save to Database (Placeholder Logic)
//     // Example: await db.userProfile.update({ where: { userId }, data: { ... } })
//     console.log(`Saving profile data for user :`, { interests, height, prompt1, prompt2 });

//     // const savetoken = await dbToken.create({
//     //    useId : userId,
//     // username: existing.username,
//     // setUpprofile:true
//     // });

//     // console.log(savetoken);

//     userToken.isProfileFullyUpdated = true
//     await user.save();

//     await DiscoverySchema.create({
//               email:email,
    
//               liked: [],
    
//               skipped: [],
    
//               blocked: [],
    
//               reported: [],
    
//               likedBy: [],
    
//               matches: [],
//             });

//     // 4. Return Success Response
//     return NextResponse.json({ 
//       success: true, 
//       message: 'Profile step two saved successfully!' 
//     });

//   } catch (error) {
//     console.error("Profile save error:", error.message);
    
//     // Catch-all for decryption failures or validation crashes
//     if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
//       return NextResponse.json({ error: 'Invalid or expired session. Please log in again.' }, { status: 401 });
//     }

//     return NextResponse.json({ error: 'Server error processing request.' }, { status: 500 });
//   }
// }
