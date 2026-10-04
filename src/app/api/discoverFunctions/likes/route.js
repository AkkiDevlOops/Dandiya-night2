// send like route

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import Profile from "@/models/profile";
import DiscoverySchema from "@/models/DiscoverySchema";


// ======================================================
// GET AUTHENTICATED USER
// ======================================================

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(
      token,
      secret
    );

    return payload.email || null;
  } catch (error) {
    console.error(
      "AUTH ERROR:",
      error
    );

    return null;
  }
}


// ======================================================
// POST
// SEND LIKE
// ======================================================

export async function POST(request) {
  try {
    await connectDB();

    console.log(
      "================================="
    );
    console.log(
      "LIKE POST STARTED"
    );
    console.log(
      "================================="
    );

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const email =
      await getAuthenticatedUser();

    if (!email) {
      console.log(
        "NO AUTHENTICATED USER"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------

    const body =
      await request.json();

    const {
      targetType = "profile",
      targetId,
      comment = "",
    } = body;

    console.log(
      "================================="
    );
    console.log(
      "LIKE REQUEST"
    );
    console.log(
      "CURRENT EMAIL:",
      email
    );
    console.log(
      "TARGET ID:",
      targetId
    );
    console.log(
      "TARGET TYPE:",
      targetType
    );
    console.log(
      "COMMENT:",
      comment
    );
    console.log(
      "================================="
    );

    // --------------------------------------------------
    // VALIDATE TARGET ID
    // --------------------------------------------------

    if (!targetId) {
      return NextResponse.json(
        {
          success: false,
          message: "Target profile ID is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FIND CURRENT PROFILE
    // --------------------------------------------------

    const currentProfile =
      await Profile.findOne({
        email,
      });

    if (!currentProfile) {
      console.log(
        "CURRENT PROFILE NOT FOUND"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Current profile not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // FIND TARGET PROFILE
    // --------------------------------------------------

    const targetProfile =
      await Profile.findById(targetId);

    if (!targetProfile) {
      console.log(
        "TARGET PROFILE NOT FOUND"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Target profile not found.",
        },
        { status: 404 }
      );
    }

    console.log(
      "CURRENT PROFILE ID:",
      currentProfile._id
    );

    console.log(
      "CURRENT PROFILE EMAIL:",
      currentProfile.email
    );

    console.log(
      "TARGET PROFILE ID:",
      targetProfile._id
    );

    console.log(
      "TARGET PROFILE EMAIL:",
      targetProfile.email
    );

    console.log(
      "TARGET PROFILE NAME:",
      targetProfile.username
    );

    // --------------------------------------------------
    // PREVENT SELF LIKE
    // --------------------------------------------------

    if (
      String(currentProfile._id) ===
      String(targetProfile._id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot like your own profile.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // CURRENT USER DISCOVERY
    // ==================================================

    let currentDiscovery =
      await DiscoverySchema.findOne({
        email: currentProfile.email,
      });

    // --------------------------------------------------
    // CREATE CURRENT DISCOVERY IF MISSING
    // --------------------------------------------------

    if (!currentDiscovery) {
      console.log(
        "CURRENT DISCOVERY DOES NOT EXIST"
      );

      currentDiscovery =
        await DiscoverySchema.create({
          email: currentProfile.email,
          liked: [],
          skipped: [],
          blocked: [],
          reported: [],
          likedBy: [],
          matches: [],
        });

      console.log(
        "CURRENT DISCOVERY CREATED:",
        currentDiscovery._id
      );
    }

    console.log(
      "CURRENT DISCOVERY ID:",
      currentDiscovery._id
    );

    // ==================================================
    // CHECK DUPLICATE LIKE
    // ==================================================

    const alreadyLiked =
      currentDiscovery.liked?.some(
        (like) =>
          String(like.profileId) ===
            String(currentProfile._id) &&
          String(like.targetId) ===
            String(targetProfile._id) &&
          (like.targetType || "profile") ===
            targetType
      );

    console.log(
      "ALREADY LIKED:",
      alreadyLiked
    );

    // --------------------------------------------------
    // DUPLICATE LIKE
    // --------------------------------------------------

    if (alreadyLiked) {
      console.log(
        "USER ALREADY LIKED THIS PROFILE"
      );

      return NextResponse.json(
        {
          success: true,
          alreadyLiked: true,
          message:
            "You already Liked this profile",
        },
        { status: 200 }
      );
    }

    // ==================================================
    // ADD TO CURRENT USER liked[]
    // ==================================================

    const likeData = {
      profileId: currentProfile._id,

      targetType:
        targetType || "profile",

      targetId:
        String(targetProfile._id),

      comment:
        typeof comment === "string"
          ? comment.trim().slice(0, 500)
          : "",

      acknowledge: false,

      createdAt: new Date(),
    };

    console.log(
      "LIKE DATA:",
      likeData
    );

    currentDiscovery.liked.push(
      likeData
    );

    await currentDiscovery.save();

    console.log(
      "================================="
    );
    console.log(
      "LIKE SAVED IN CURRENT liked[]"
    );
    console.log(
      "CURRENT liked COUNT:",
      currentDiscovery.liked.length
    );
    console.log(
      "================================="
    );

    // ==================================================
    // TARGET USER DISCOVERY
    // ==================================================

    console.log(
      "========== TARGET DISCOVERY =========="
    );

    let targetDiscovery =
      await DiscoverySchema.findOne({
        email: targetProfile.email,
      });

    console.log(
      "TARGET DISCOVERY:",
      targetDiscovery?._id
    );

    // --------------------------------------------------
    // CREATE TARGET DISCOVERY
    // --------------------------------------------------

    if (!targetDiscovery) {
      console.log(
        "TARGET DISCOVERY DOES NOT EXIST"
      );

      targetDiscovery =
        await DiscoverySchema.create({
          email: targetProfile.email,
          liked: [],
          skipped: [],
          blocked: [],
          reported: [],
          likedBy: [],
          matches: [],
        });

      console.log(
        "TARGET DISCOVERY CREATED:",
        targetDiscovery._id
      );
    }

    console.log(
      "TARGET DISCOVERY EMAIL:",
      targetDiscovery.email
    );

    console.log(
      "TARGET likedBy BEFORE:",
      targetDiscovery.likedBy
    );

    // ==================================================
    // CHECK TARGET likedBy DUPLICATE
    // ==================================================

    const alreadyInLikedBy =
      targetDiscovery.likedBy?.some(
        (like) =>
          String(like.profileId) ===
            String(currentProfile._id) &&
          String(like.targetId) ===
            String(targetProfile._id) &&
          (like.targetType || "profile") ===
            targetType
      );

    console.log(
      "ALREADY IN TARGET likedBy:",
      alreadyInLikedBy
    );

    // ==================================================
    // ADD TO TARGET likedBy[]
    // ==================================================

    if (!alreadyInLikedBy) {
      const likedByData = {
        profileId:
          currentProfile._id,

        targetType:
          targetType || "profile",

        targetId:
          String(targetProfile._id),

        targetIdphoto:
          currentProfile.images?.[0] ||
          null,

        targetIdName:
          currentProfile.username ||
          null,

        comment:
          typeof comment === "string"
            ? comment.trim().slice(0, 500)
            : "",

        acknowledge: false,

        createdAt: new Date(),
      };

      console.log(
        "================================="
      );

      console.log(
        "ADDING TO TARGET likedBy"
      );

      console.log(
        "likedBy DATA:",
        likedByData
      );

      targetDiscovery.likedBy.push(
        likedByData
      );

      console.log(
        "TARGET likedBy AFTER PUSH:",
        targetDiscovery.likedBy
      );

      // ------------------------------------------------
      // SAVE TARGET DISCOVERY
      // ------------------------------------------------

      await targetDiscovery.save();

      console.log(
        "================================="
      );

      console.log(
        "TARGET DISCOVERY SAVED SUCCESSFULLY"
      );

      console.log(
        "TARGET DISCOVERY ID:",
        targetDiscovery._id
      );

      console.log(
        "TARGET likedBy COUNT:",
        targetDiscovery.likedBy.length
      );

      console.log(
        "LAST likedBy:",
        targetDiscovery.likedBy[
          targetDiscovery.likedBy.length - 1
        ]
      );

      console.log(
        "================================="
      );
    } else {
      console.log(
        "LIKE ALREADY EXISTS IN TARGET likedBy"
      );
    }

    // ==================================================
    // FINAL DATABASE VERIFICATION
    // ==================================================

    console.log(
      "========== FINAL VERIFICATION =========="
    );

    const verifyTarget =
      await DiscoverySchema.findOne({
        email: targetProfile.email,
      }).select(
        "email likedBy"
      );

    console.log(
      "FINAL TARGET DISCOVERY:",
      verifyTarget?._id
    );

    console.log(
      "FINAL TARGET EMAIL:",
      verifyTarget?.email
    );

    console.log(
      "FINAL TARGET likedBy COUNT:",
      verifyTarget?.likedBy?.length
    );

    console.log(
      "FINAL TARGET likedBy:",
      verifyTarget?.likedBy
    );

    console.log(
      "================================="
    );

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        alreadyLiked: false,

        alreadyLikedBy:
          alreadyInLikedBy,

        message:
          "Like sent successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "LIKE POST ERROR:",
      error
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message
    );

    console.error(
      "ERROR STACK:",
      error?.stack
    );

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}


// ======================================================
// GET
// GET RECEIVED LIKES
// ======================================================

export async function GET() {
  try {
    await connectDB();

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const email =
      await getAuthenticatedUser();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // CURRENT PROFILE
    // --------------------------------------------------

    const currentProfile =
      await Profile.findOne({
        email,
      })
        .select(
          "_id email username images"
        )
        .lean();

    if (!currentProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current profile not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // CURRENT DISCOVERY
    // --------------------------------------------------

    const discovery =
      await DiscoverySchema.findOne({
        email,
      })
        .select("likedBy")
        .lean();

    // --------------------------------------------------
    // NO DISCOVERY DOCUMENT
    // --------------------------------------------------

    if (!discovery) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          likes: [],
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------
    // ONLY UNACKNOWLEDGED LIKES
    // --------------------------------------------------

    const unacknowledgedLikes =
      (discovery.likedBy || []).filter(
        (like) =>
          like.acknowledge !== true
      );

    const likedData = [];

    // --------------------------------------------------
    // BUILD RESPONSE
    // --------------------------------------------------

    for (
      const like of unacknowledgedLikes
    ) {
      const senderProfile =
        await Profile.findById(
          like.profileId
        )
          .select(
            "_id email username images"
          )
          .lean();

      if (!senderProfile) {
        continue;
      }

      likedData.push({
        likeId: like._id,

        from: {
          profileId:
            senderProfile._id,

          username:
            senderProfile.username,

          images:
            senderProfile.images || [],
        },

        targetType:
          like.targetType ||
          "profile",

        targetId:
          like.targetId ||
          null,

        targetIdPhoto:
          like.targetIdphoto ||
          null,

        targetIdName:
          like.targetIdName ||
          null,

        comment:
          like.comment ||
          "",

        acknowledge:
          like.acknowledge ??
          false,

        needsAcknowledgement:
          true,

        createdAt:
          like.createdAt,
      });
    }

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        count:
          likedData.length,

        likes:
          likedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET LIKES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}






// import connectDB from "@/lib/db.js";
// import Profile from "@/models/profile";
// import DiscoverySchema from "@/models/DiscoverySchema";
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// // =====================================================
// // GET LOGGED-IN USER EMAIL FROM SESSION
// // =====================================================

// async function getAuthenticatedUser() {
//   const cookieStore = await cookies();

//   const token = cookieStore.get("session")?.value;

//   if (!token) {
//     return null;
//   }

//   const secret = new TextEncoder().encode(
//     process.env.JWT_SECRET
//   );

//   const { payload } = await jwtVerify(token, secret);

//   if (!payload.email) {
//     return null;
//   }

//   return payload.email.toLowerCase();
// }

// // =====================================================
// // POST - LIKE A PROFILE
// // =====================================================

// export async function POST(request) {
//   try {
//     await connectDB();

//     // -------------------------------------------------
//     // 1. Get logged-in user's email from session
//     // -------------------------------------------------

//     const email = await getAuthenticatedUser();

//     if (!email) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Please login first.",
//         },
//         { status: 401 }
//       );
//     }

//     // -------------------------------------------------
//     // 2. Get request body
//     // -------------------------------------------------

//     const body = await request.json();

//     const {
//       targetType,
//       targetId,
//       targetIdphoto,
//       targetIdName,
//       comment,
//     } = body;

//     console.log("LIKE BODY:", body);

//     // -------------------------------------------------
//     // 3. Validate targetId
//     // -------------------------------------------------

//     if (!targetId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "targetId is required.",
//         },
//         { status: 400 }
//       );
//     }

//     // -------------------------------------------------
//     // 4. Find CURRENT USER's Profile
//     // -------------------------------------------------

//     const currentProfile = await Profile.findOne({
//       email: email,
//     });

//     if (!currentProfile) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Your profile was not found.",
//         },
//         { status: 404 }
//       );
//     }

//     console.log("CURRENT PROFILE:", currentProfile._id);

//     // -------------------------------------------------
//     // 5. Find TARGET profile
//     // -------------------------------------------------

//     const targetProfile = await Profile.findById(targetId);

//     if (!targetProfile) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Target profile not found.",
//         },
//         { status: 404 }
//       );
//     }

    
//     const targetEmail = targetProfile.email;
    
//     // -------------------------------------------------
//     // 6. Don't allow liking yourself
//     // -------------------------------------------------

//     if (
//       String(currentProfile._id) ===
//       String(targetProfile._id)
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "You cannot like yourself.",
//         },
//         { status: 400 }
//       );
//     }

//     // =================================================
//     // PART A
//     // Save the like inside CURRENT USER's Discovery
//     // =================================================

//     let currentDiscovery =
//       await DiscoverySchema.findOne({
//         email: email,
//       });

//     if (!currentDiscovery) {
//       currentDiscovery = await DiscoverySchema.create({
//         email: email,
//         liked: [],
//         skipped: [],
//         blocked: [],
//         reported: [],
//         likedBy: [],
//         matches: [],
//       });
//     }

//     //  let targetDiscovery =
//     //   await DiscoverySchema.findOne({
//     //     email: email,
//     //   });

//     // if (!currentDiscovery) {
//     //   currentDiscovery = await DiscoverySchema.create({
//     //     email: email,
//     //     liked: [],
//     //     skipped: [],
//     //     blocked: [],
//     //     reported: [],
//     //     likedBy: [],
//     //     matches: [],
//     //   });
//     // }

//     console.log(targetEmail)


//     // -------------------------------------------------
//     // Check if current user already liked target
//     // -------------------------------------------------

//     const alreadyLiked =
//       currentDiscovery.liked.some(
//         (like) =>
//           String(like.targetId) ===
//           String(targetProfile._id)
//       );

//     if (alreadyLiked) {
//       return NextResponse.json(
//         {
//           success: true,
//           alreadyLiked: true,
//           message: "You already liked this profile.",
//         },
//         { status: 200 }
//       );
//     }

//     // -------------------------------------------------
//     // Add like to CURRENT USER's liked[]
//     // -------------------------------------------------

// const newLike = {
//   profileId: currentProfile._id,

//   targetType: targetType || "profile",

//   targetId: String(targetProfile._id),

//   comment:
//     typeof comment === "string"
//       ? comment.trim().slice(0, 500)
//       : "",

//   acknowledge: false,

//   createdAt: new Date(),
// };

// currentDiscovery.liked.push(newLike);

// await currentDiscovery.save();
//     // =================================================
//     // PART B
//     // Add CURRENT USER to TARGET USER's likedBy[]
//     // =================================================

//     let targetDiscovery =
//       await DiscoverySchema.findOne({
//         email: targetProfile.email.toLowerCase(),
//       });

//     // -------------------------------------------------
//     // Create target Discovery if it doesn't exist
//     // -------------------------------------------------

//     if (!targetDiscovery) {
//       targetDiscovery = await DiscoverySchema.create({
//         email: targetProfile.email.toLowerCase(),
//         liked: [],
//         skipped: [],
//         blocked: [],
//         reported: [],
//         likedBy: [],
//         matches: [],
//       });
//     }

//     // -------------------------------------------------
//     // Check duplicate likedBy
//     // -------------------------------------------------

//    const alreadyLikedBy =
//   targetDiscovery.likedBy.some(
//     (item) =>
//       String(item.profileId) === String(currentProfile._id) &&
//       String(item.targetType) === String(targetType) &&
//       String(item.targetId) === String(targetProfile._id) &&
//       String(item.targetIdphoto) === String(currentProfile.images[0]) &&   // this is the photo of person who liked this targetId means current
//       String(item.targetIdName) === String(currentProfile.username)&& // name of current profile
//       String(item.comment) === String(comment)  
//   );

//     if (!alreadyLikedBy) {
//       targetDiscovery.likedBy.push({
//         profileId: currentProfile._id,

//         targetId: String(targetProfile._id),

//        targetIdphoto: currentProfile.images[0] || null,

//        targetIdName: currentProfile.username,

//         comment:
//           typeof comment === "string"
//             ? comment.trim().slice(0, 500)
//             : "",

//         acknowledge: false,

//         createdAt: new Date(),
//       });

//       await targetDiscovery.save();
//     }

//      await targetDiscovery.save();

//     // =================================================
//     // SUCCESS
//     // =================================================

//     return NextResponse.json(
//       {
//         success: true,

//         alreadyLiked: false,

//         message: "Like sent.",

//         like: {
//           profileId: currentProfile._id,

//           targetId: targetProfile._id,

//           targetType,

//           targetIdphoto:
//             targetIdphoto || null,

//           targetIdName:
//             targetIdName ||
//             targetProfile.username ||
//             null,

//           comment:
//             typeof comment === "string"
//               ? comment.trim().slice(0, 500)
//               : "",

//           acknowledge: false,
//         },
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error("LIKE API ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Internal server error.",
//         error: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

