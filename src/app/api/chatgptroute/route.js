// Discovery route and Intrest Page


import connectDB from "@/lib/db.js";
import Profile from "@/models/profile";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { userlog } from "@/models/Registration";


// ---------------------------------------------------------
// Helper: Get logged-in user from session cookie
// ---------------------------------------------------------

async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET
  );

  const { payload } = await jwtVerify(
    sessionToken,
    secret
  );

  if (!payload.email) {
    return null;
  }

  return {
    email: payload.email.toLowerCase(),
  };
}


// ---------------------------------------------------------
// Helper: safely convert IDs to strings
// ---------------------------------------------------------

function idString(id) {
  return String(id);
}


// =========================================================
// POST
// =========================================================

export async function POST(request) {

  try {

    await connectDB();

    // -----------------------------------------------------
    // Read request
    // -----------------------------------------------------

    let body = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      action = "discover",

      // Used for like / skip / block / report
      profileId,

      // Used for like
      targetType = "profile",
      targetId = null,
      comment = "",

      // Used for report
      reason = "",

      // Pagination
      limit = 10,
    } = body;


    // -----------------------------------------------------
    // Authenticate
    // -----------------------------------------------------

    const authenticatedUser =
      await getAuthenticatedUser();

     

    if (!authenticatedUser) {
  return NextResponse.json(
    {
      success: false,
      redirect: true,         // Tell the frontend to redirect
      url: '/LoginRegister',          // Where to go
      message: "Session cookie missing or invalid. Please log in.",
    },
    { status: 401 }
  );
}
    
            


    const email =
      authenticatedUser.email;



    // -----------------------------------------------------
    // Find user
    // -----------------------------------------------------

    const currentUser =
      await userlog.findOne({
        email,
      });



    if (!currentUser) {

      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        {
          status: 404,
        }
      );

    }


    // -----------------------------------------------------
    // Get raw MongoDB document
    //
    // We use this because discovery data is not currently
    // part of your Mongoose schema.
    // -----------------------------------------------------

    const rawUser =
      await userlog.collection.findOne({
        _id: currentUser._id,
      });

            

    // -----------------------------------------------------
    // Existing discovery state
    // -----------------------------------------------------

    const discovery =
      rawUser?.discovery || {};


    const liked =
      Array.isArray(discovery.liked)
        ? discovery.liked
        : [];


    const skipped =
      Array.isArray(discovery.skipped)
        ? discovery.skipped
        : [];


    const blocked =
      Array.isArray(discovery.blocked)
        ? discovery.blocked
        : [];


    const reported =
      Array.isArray(discovery.reported)
        ? discovery.reported
        : [];


    // =====================================================
    // ACTION: LIKE
    // =====================================================

    if (action === "like") {

      if (!profileId) {

        return NextResponse.json(
          {
            success: false,
            message: "profileId is required.",
          },
          {
            status: 400,
          }
        );

      }
 
      // Make sure target profile exists

      const targetProfile =
        await Profile.findById(profileId)
          .select("_id email username images promt1")
          .lean();


      if (!targetProfile) {

        return NextResponse.json(
          {
            success: false,
            message: "Profile not found.",
          },
          {
            status: 404,
          }
        );

      }


      // Don't allow liking yourself

      if (
        targetProfile.email?.toLowerCase() ===
        email
      ) {

        return NextResponse.json(
          {
            success: false,
            message: "You cannot like yourself.",
          },
          {
            status: 400,
          }
        );

      }


      // Don't allow liking a blocked user

      const alreadyBlocked =
        blocked.some(
          item =>
            String(item.profileId) ===
            String(profileId)
        );


      if (alreadyBlocked) {

        return NextResponse.json(
          {
            success: false,
            message:
              "You cannot like a blocked profile.",
          },
          {
            status: 400,
          }
        );

      }


      // ---------------------------------------------------
      // Remove skip if they previously skipped this person
      // ---------------------------------------------------

      // await userlog.collection.updateOne(
      //   {
      //     _id: currentUser._id,
      //   },
      //   {
      //     $pull: {
      //       "discovery.skipped": {
      //         profileId: String(profileId),
      //       },
      //     },
      //   }
      // );


      // ---------------------------------------------------
      // Create like object
      // ---------------------------------------------------

      // const likeObject = {

      //   profileId: String(profileId),

      //   targetType:
      //     targetType || "profile",

      //   targetId:
      //     targetId
      //       ? String(targetId)
      //       : null,

      //   comment:
      //     typeof comment === "string"
      //       ? comment.trim().slice(0, 500)
      //       : "",

      //   createdAt: new Date(),

      // };


      // ---------------------------------------------------
      // Remove previous like for same profile
      // ---------------------------------------------------

      // await userlog.collection.updateOne(
      //   {
      //     _id: currentUser._id,
      //   },
      //   {
      //     $pull: {
      //       "discovery.liked": {
      //         profileId: String(profileId),
      //       },
      //     },
      //   }
      // );


      // ---------------------------------------------------
      // Add new like
      // ---------------------------------------------------

      // await userlog.collection.updateOne(
      //   {
      //     _id: currentUser._id,
      //   },
      //   {
      //     $push: {
      //       "discovery.liked": likeObject,
      //     },
      //   }
      // );


      return NextResponse.json({

        success: true,

        message:
          comment?.trim()
            ? "Like and comment sent."
            : "Like sent.",

        action: "like",

        profileId,

      });

    }


    // =====================================================
    // ACTION: SKIP
    // =====================================================

    if (action === "skip") {

      if (!profileId) {

        return NextResponse.json(
          {
            success: false,
            message: "profileId is required.",
          },
          {
            status: 400,
          }
        );

      }


      // ---------------------------------------------------
      // Don't create duplicate skip
      // ---------------------------------------------------

      const alreadySkipped =
        skipped.some(
          item =>
            String(item.profileId) ===
            String(profileId)
        );


      if (!alreadySkipped) {

        await userlog.collection.updateOne(
          {
            _id: currentUser._id,
          },
          {

            $push: {

              "discovery.skipped": {

                profileId:
                  String(profileId),

                createdAt:
                  new Date(),

              },

            },

          }
        );

      }


      return NextResponse.json({

        success: true,

        message: "Profile skipped.",

        action: "skip",

        profileId,

      });

    }


    // =====================================================
    // ACTION: UNDO SKIP
    // =====================================================

    if (action === "undo") {

      if (!profileId) {

        return NextResponse.json(
          {
            success: false,
            message: "profileId is required.",
          },
          {
            status: 400,
          }
        );

      }


      const result =
        await userlog.collection.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $pull: {
              "discovery.skipped": {
                profileId:
                  String(profileId),
              },
            },
          }
        );


      return NextResponse.json({

        success: true,

        message:
          result.modifiedCount
            ? "Profile restored."
            : "Profile was not skipped.",

        action: "undo",

        profileId,

      });

    }


    // =====================================================
    // ACTION: BLOCK
    // =====================================================

    if (action === "block") {

      if (!profileId) {

        return NextResponse.json(
          {
            success: false,
            message: "profileId is required.",
          },
          {
            status: 400,
          }
        );

      }


      // Remove from likes/skips

      await userlog.collection.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $pull: {
            "discovery.liked": {
              profileId:
                String(profileId),
            },

            "discovery.skipped": {
              profileId:
                String(profileId),
            },
          },
        }
      );


      // Add to blocked list

      await userlog.collection.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $push: {

            "discovery.blocked": {

              profileId:
                String(profileId),

              createdAt:
                new Date(),

            },

          },
        }
      );


      return NextResponse.json({

        success: true,

        message:
          "Profile blocked.",

        action: "block",

        profileId,

      });

    }


    // =====================================================
    // ACTION: REPORT
    // =====================================================

    if (action === "report") {

      if (!profileId) {

        return NextResponse.json(
          {
            success: false,
            message: "profileId is required.",
          },
          {
            status: 400,
          }
        );

      }


      const cleanReason =
        typeof reason === "string"
          ? reason.trim().slice(0, 500)
          : "";


      await userlog.collection.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $push: {

            "discovery.reported": {

              profileId:
                String(profileId),

              reason:
                cleanReason,

              createdAt:
                new Date(),

            },

          },
        }
      );


      // Also remove this person from discovery

      await userlog.collection.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $addToSet: {

            "discovery.blocked": {

              profileId:
                String(profileId),

              createdAt:
                new Date(),

            },

          },

        }
      );


      return NextResponse.json({

        success: true,

        message:
          "Profile reported.",

        action: "report",

        profileId,

      });

    }


    // =====================================================
    // ACTION: DISCOVER
    // =====================================================

    if (action === "discover") {

      // ---------------------------------------------------
      // Find current user's profile
      // ---------------------------------------------------

      const myProfile =
        await Profile.findOne({
          email,
        })
        .select("email gender username")
        .lean();


      if (!myProfile) {

        return NextResponse.json(
          {
            success: false,
            message:
              "Your profile has not been completed yet.",
          },
          {
            status: 404,
          }
        );

      }


      const gender =
        myProfile.gender
          ?.toLowerCase()
          .trim();


      if (!gender) {

        return NextResponse.json(
          {
            success: false,
            message:
              "Your gender is not set.",
          },
          {
            status: 400,
          }
        );

      }


      // ---------------------------------------------------
      // Your current dating logic:
      //
      // Female -> Male
      // Male -> Female
      //
      // No distance
      // No university
      // No matching score
      // ---------------------------------------------------

      let targetGender;


      if (gender === "female") {

        targetGender = "male";

      } else if (gender === "male") {

        targetGender = "female";

      } else {

        return NextResponse.json(
          {
            success: false,
            message:
              "Unsupported gender value.",
          },
          {
            status: 400,
          }
        );

      }


      // ---------------------------------------------------
      // Build IDs that should NOT appear
      // ---------------------------------------------------

      const excludedIds = [

        ...liked.map(
          item =>
            String(item.profileId)
        ),

        ...skipped.map(
          item =>
            String(item.profileId)
        ),

        ...blocked.map(
          item =>
            String(item.profileId)
        ),

        ...reported.map(
          item =>
            String(item.profileId)
        ),

      ];


      // ---------------------------------------------------
      // Limit
      // ---------------------------------------------------

      const safeLimit =
        Math.min(
          Math.max(
            Number(limit) || 10,
            1
          ),
          20
        );


      // ---------------------------------------------------
      // Build query
      // ---------------------------------------------------

      const matchQuery = {

        gender: {
          $regex:
            new RegExp(
              `^${targetGender}$`,
              "i"
            ),
        },

        email: {
          $ne: email,
        },

      };


      // ---------------------------------------------------
      // Exclude previously interacted profiles
      // ---------------------------------------------------

      if (excludedIds.length > 0) {

        matchQuery._id = {
          $nin: excludedIds,
        };

      }


      // ---------------------------------------------------
      // Get randomized profiles
      //
      // $sample prevents the same database ordering
      // every time.
      // ---------------------------------------------------

      const profiles =
        await Profile.aggregate([

          {
            $match:
              matchQuery,
          },

          {
            $sample: {
              size: safeLimit,
            },
          },

        ]);


      // ---------------------------------------------------
      // Return discovery feed
      // ---------------------------------------------------

      return NextResponse.json({

        success: true,

        action: "discover",

        count:
          profiles.length,

        hasMore:
          profiles.length === safeLimit,

        users:
          profiles,

      });

    }


    // =====================================================
    // INVALID ACTION
    // =====================================================

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action.",
      },
      {
        status: 400,
      }
    );


  } catch (error) {

    console.error(
      "EXPLORE API ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message:
          "Internal server error.",
      },
      {
        status: 500,
      }
    );

  }

}