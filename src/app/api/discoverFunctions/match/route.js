// match route 
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
    console.error("AUTH ERROR:", error);
    return null;
  }
}

// ======================================================
// PATCH
// ACCEPT LIKE + CREATE TWO-WAY MATCH
// ======================================================

export async function PATCH(request) {
  try {
    await connectDB();

    console.log("=================================");
    console.log("MATCH REQUEST STARTED");
    console.log("=================================");

    // ==================================================
    // 1. AUTHENTICATION
    // ==================================================

    const email = await getAuthenticatedUser();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // 2. REQUEST BODY
    // ==================================================

    const body = await request.json();

    const { likeId } = body;

    console.log("CURRENT EMAIL:", email);
    console.log("LIKE ID:", likeId);

    if (!likeId) {
      return NextResponse.json(
        {
          success: false,
          message: "likeId is required.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 3. CURRENT USER PROFILE
    // ==================================================

    const currentProfile = await Profile.findOne({
      email: email.toLowerCase(),
    });

    if (!currentProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Current profile not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 4. CURRENT USER DISCOVERY
    // ==================================================

    const currentDiscovery =
      await DiscoverySchema.findOne({
        email: currentProfile.email,
      });

    if (!currentDiscovery) {
      return NextResponse.json(
        {
          success: false,
          message: "Current discovery profile not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 5. FIND RECEIVED LIKE
    //
    // Current user = A
    // Sender       = B
    //
    // A.likedBy contains B
    // ==================================================

    const receivedLike =
      currentDiscovery.likedBy.id(likeId);

    if (!receivedLike) {
      return NextResponse.json(
        {
          success: false,
          message: "Like not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 6. FIND SENDER PROFILE
    // ==================================================

    const senderProfile =
      await Profile.findById(
        receivedLike.profileId
      );

    if (!senderProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Sender profile not found.",
        },
        { status: 404 }
      );
    }

    console.log(
      "CURRENT USER:",
      currentProfile.username
    );

    console.log(
      "SENDER:",
      senderProfile.username
    );

    // ==================================================
    // 7. CHECK IF ALREADY ACKNOWLEDGED
    // ==================================================

    if (receivedLike.acknowledge === true) {
      const existingMatch =
        currentDiscovery.matches?.find(
          (match) =>
            String(match.profileId) ===
            String(senderProfile._id)
        );

      return NextResponse.json(
        {
          success: true,
          alreadyMatched: true,
          message:
            `You already matched with ${senderProfile.username}.`,
          match:
            existingMatch || {
              profileId: senderProfile._id,
              email: senderProfile.email,
              username:
                senderProfile.username || null,
              images:
                senderProfile.images || [],
              matchedAt:
                receivedLike.createdAt,
              status: "active",
            },
        },
        { status: 200 }
      );
    }

    // ==================================================
    // 8. FIND SENDER'S DISCOVERY
    //
    // This is B's Discovery.
    // ==================================================

    const senderDiscovery =
      await DiscoverySchema.findOne({
        email: senderProfile.email.toLowerCase(),
      });

    if (!senderDiscovery) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sender discovery profile not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 9. FIND ORIGINAL LIKE IN SENDER'S liked[]
    //
    // B.liked contains A
    //
    // We DO NOT create a new liked[] record here.
    // The send-like route is responsible for that.
    // ==================================================

    const sentLike =
  senderDiscovery.liked?.find(
    (like) =>
      String(like.profileId) ===
        String(senderProfile._id) &&
      String(like.targetId) ===
        String(currentProfile._id) &&
      (like.targetType || "profile") ===
        (receivedLike.targetType || "profile")
  );

    if (!sentLike) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Original like was not found in sender's liked list.",
        },
        { status: 409 }
      );
    }

    // ==================================================
    // 10. ACKNOWLEDGE BOTH SIDES
    //
    // A.likedBy[B] = true
    // B.liked[A]   = true
    // ==================================================

    receivedLike.acknowledge = true;

    sentLike.acknowledge = true;

    console.log(
      "CURRENT USER likedBy ACKNOWLEDGE = TRUE"
    );

    console.log(
      "SENDER liked ACKNOWLEDGE = TRUE"
    );

    // ==================================================
    // 11. CHECK CURRENT USER'S MATCH
    //
    // A.matches -> B
    // ==================================================

    const alreadyCurrentMatch =
      currentDiscovery.matches?.some(
        (match) =>
          String(match.profileId) ===
          String(senderProfile._id)
      );

    // ==================================================
    // 12. ADD SENDER TO CURRENT USER'S MATCHES
    // ==================================================

    if (!alreadyCurrentMatch) {
      currentDiscovery.matches.push({
        profileId: senderProfile._id,
        email: senderProfile.email,
        username:
          senderProfile.username || null,
        images:
          senderProfile.images || [],
        matchedAt: new Date(),
        status: "active",
      });

      console.log(
        "SENDER ADDED TO CURRENT USER matches[]"
      );
    }

    // ==================================================
    // 13. CHECK SENDER'S MATCH
    //
    // B.matches -> A
    // ==================================================

    const alreadySenderMatch =
      senderDiscovery.matches?.some(
        (match) =>
          String(match.profileId) ===
          String(currentProfile._id)
      );

    // ==================================================
    // 14. ADD CURRENT USER TO SENDER'S MATCHES
    // ==================================================

    if (!alreadySenderMatch) {
      senderDiscovery.matches.push({
        profileId: currentProfile._id,
        email: currentProfile.email,
        username:
          currentProfile.username || null,
        images:
          currentProfile.images || [],
        matchedAt: new Date(),
        status: "active",
      });

      console.log(
        "CURRENT USER ADDED TO SENDER matches[]"
      );
    }

    // ==================================================
    // 15. SAVE CURRENT USER
    //
    // Saves:
    //
    // A.likedBy[B].acknowledge = true
    // A.matches -> B
    // ==================================================

    await currentDiscovery.save();

    console.log(
      "CURRENT DISCOVERY SAVED"
    );

    // ==================================================
    // 16. SAVE SENDER
    //
    // Saves:
    //
    // B.liked[A].acknowledge = true
    // B.matches -> A
    // ==================================================

    await senderDiscovery.save();

    console.log(
      "SENDER DISCOVERY SAVED"
    );

    // ==================================================
    // 17. FINAL VERIFICATION
    // ==================================================

    const verifyCurrent =
      await DiscoverySchema.findOne({
        email: currentProfile.email,
      }).select(
        "email liked likedBy matches"
      );

    const verifySender =
      await DiscoverySchema.findOne({
        email: senderProfile.email,
      }).select(
        "email liked likedBy matches"
      );

    console.log(
      "================================="
    );

    console.log(
      "FINAL CURRENT USER"
    );

    console.log(
      "liked:",
      verifyCurrent?.liked
    );

    console.log(
      "likedBy:",
      verifyCurrent?.likedBy
    );

    console.log(
      "matches:",
      verifyCurrent?.matches
    );

    console.log(
      "FINAL SENDER"
    );

    console.log(
      "liked:",
      verifySender?.liked
    );

    console.log(
      "likedBy:",
      verifySender?.likedBy
    );

    console.log(
      "matches:",
      verifySender?.matches
    );

    console.log(
      "================================="
    );

    // ==================================================
    // 18. SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        alreadyMatched: false,

        message:
          `You matched with ${senderProfile.username}!`,

        match: {
          profileId: senderProfile._id,
          email: senderProfile.email,
          username:
            senderProfile.username || null,
          images:
            senderProfile.images || [],
          matchedAt: new Date(),
          status: "active",
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "MATCH ERROR:",
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
          "Could not create match.",
      },
      { status: 500 }
    );
  }
}





// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import { cookies } from "next/headers";

// import connectDB from "@/lib/db";
// import Profile from "@/models/profile";
// import DiscoverySchema from "@/models/DiscoverySchema";

// // ======================================================
// // GET AUTHENTICATED USER
// // ======================================================

// async function getAuthenticatedUser() {
//   try {
//     const cookieStore = await cookies();

//     const token = cookieStore.get("session")?.value;

//     if (!token) {
//       return null;
//     }

//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);

//     const { payload } = await jwtVerify(token, secret);

//     return payload.email || null;
//   } catch (error) {
//     console.error("AUTH ERROR:", error);
//     return null;
//   }
// }

// // ======================================================
// // PATCH
// // ACCEPT LIKE + CREATE TWO-WAY MATCH
// // ======================================================

// export async function PATCH(request) {
//   try {
//     await connectDB();

//     console.log("=================================");
//     console.log("MATCH REQUEST STARTED");
//     console.log("=================================");

//     // ==================================================
//     // 1. AUTHENTICATION
//     // ==================================================

//     const email = await getAuthenticatedUser();

//     if (!email) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthorized",
//         },
//         { status: 401 }
//       );
//     }

//     // ==================================================
//     // 2. REQUEST BODY
//     // ==================================================

//     const body = await request.json();

//     const { likeId } = body;

//     console.log("CURRENT EMAIL:", email);
//     console.log("LIKE ID:", likeId);

//     if (!likeId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "likeId is required.",
//         },
//         { status: 400 }
//       );
//     }

//     // ==================================================
//     // 3. FIND CURRENT USER PROFILE
//     // ==================================================

//     const currentProfile = await Profile.findOne({
//       email: email.toLowerCase(),
//     });

//     if (!currentProfile) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Current profile not found.",
//         },
//         { status: 404 }
//       );
//     }

//     console.log("CURRENT PROFILE:", currentProfile.username);
//     console.log("CURRENT PROFILE ID:", currentProfile._id);

//     // ==================================================
//     // 4. FIND CURRENT USER'S DISCOVERY
//     // ==================================================

//     const currentDiscovery = await DiscoverySchema.findOne({
//       email: currentProfile.email,
//     });

//     if (!currentDiscovery) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Current discovery profile not found.",
//         },
//         { status: 404 }
//       );
//     }

//     // ==================================================
//     // 5. FIND THE LIKE IN CURRENT USER'S likedBy[]
//     //
//     // Example:
//     //
//     // B liked A
//     //
//     // A.likedBy = [
//     //   {
//     //      profileId: B
//     //      acknowledge: false
//     //   }
//     // ]
//     // ==================================================

//     const receivedLike = currentDiscovery.likedBy.id(likeId);

//     if (!receivedLike) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Like not found.",
//         },
//         { status: 404 }
//       );
//     }

//     console.log("RECEIVED LIKE FOUND:", receivedLike);

//     // ==================================================
//     // 6. FIND THE PERSON WHO SENT THE LIKE
//     // ==================================================

//     const senderProfile = await Profile.findById(
//       receivedLike.profileId
//     );

//     if (!senderProfile) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Sender profile not found.",
//         },
//         { status: 404 }
//       );
//     }

//     console.log("SENDER:", senderProfile.username);
//     console.log("SENDER EMAIL:", senderProfile.email);
//     console.log("SENDER ID:", senderProfile._id);

//     // ==================================================
//     // 7. CHECK IF THIS LIKE IS ALREADY ACKNOWLEDGED
//     // ==================================================

//     if (receivedLike.acknowledge === true) {
//       const existingMatch = currentDiscovery.matches?.find(
//         (match) =>
//           String(match.profileId) ===
//           String(senderProfile._id)
//       );

//       return NextResponse.json(
//         {
//           success: true,
//           alreadyMatched: true,
//           message: `You already matched with ${senderProfile.username}.`,
//           match: existingMatch || {
//             profileId: senderProfile._id,
//             email: senderProfile.email,
//             username: senderProfile.username,
//             images: senderProfile.images || [],
//             matchedAt: receivedLike.createdAt,
//             status: "active",
//           },
//         },
//         { status: 200 }
//       );
//     }

//     // ==================================================
//     // 8. ACKNOWLEDGE THE LIKE ON CURRENT USER'S SIDE
//     //
//     // A.likedBy[B].acknowledge = true
//     // ==================================================

//     receivedLike.acknowledge = true;

//     console.log(
//       "CURRENT USER likedBy ACKNOWLEDGE = TRUE"
//     );

//     // ==================================================
//     // 9. FIND SENDER'S DISCOVERY
//     //
//     // This is B's Discovery document.
//     // ==================================================

//     let senderDiscovery = await DiscoverySchema.findOne({
//       email: senderProfile.email.toLowerCase(),
//     });

//     // ==================================================
//     // 10. CREATE SENDER DISCOVERY IF MISSING
//     // ==================================================

//     if (!senderDiscovery) {
//       senderDiscovery = await DiscoverySchema.create({
//         email: senderProfile.email.toLowerCase(),
//         liked: [],
//         skipped: [],
//         blocked: [],
//         reported: [],
//         likedBy: [],
//         matches: [],
//       });

//       console.log("SENDER DISCOVERY CREATED");
//     }

//     // ==================================================
//     // 11. FIND CURRENT USER INSIDE SENDER'S liked[]
//     //
//     // B.liked = [
//     //   {
//     //      profileId: A
//     //      acknowledge: false
//     //   }
//     // ]
//     //
//     // We need:
//     //
//     // B.liked[A].acknowledge = true
//     // ==================================================

//     const sentLike = senderDiscovery.liked?.find(
//       (like) =>
//         String(like.profileId) ===
//         String(currentProfile._id)
//     );

//     if (sentLike) {
//       // -----------------------------------------------
//       // The original like exists
//       // -----------------------------------------------

//       sentLike.acknowledge = true;

//       console.log(
//         "SENDER liked[] ACKNOWLEDGE = TRUE"
//       );
//     } else {
//       // -----------------------------------------------
//       // The original like does not exist.
//       //
//       // This should normally never happen because
//       // senderProfile is the person who sent the like.
//       //
//       // We create the missing record so both sides
//       // remain consistent.
//       // -----------------------------------------------

//       senderDiscovery.liked.push({
//         profileId: currentProfile._id,
//         targetType: "profile",
//         targetId: String(currentProfile._id),
//         comment: "",
//         acknowledge: true,
//         createdAt: new Date(),
//       });

//       console.log(
//         "SENDER liked[] ENTRY WAS MISSING - CREATED WITH ACKNOWLEDGE TRUE"
//       );
//     }

//     // ==================================================
//     // 12. CHECK CURRENT USER'S matches[]
//     //
//     // A.matches already contains B?
//     // ==================================================

//     const alreadyCurrentMatch =
//       currentDiscovery.matches?.some(
//         (match) =>
//           String(match.profileId) ===
//           String(senderProfile._id)
//       );

//     // ==================================================
//     // 13. ADD SENDER TO CURRENT USER'S matches[]
//     //
//     // A.matches = B
//     // ==================================================

//     if (!alreadyCurrentMatch) {
//       currentDiscovery.matches.push({
//         profileId: senderProfile._id,
//         email: senderProfile.email,
//         username: senderProfile.username || null,
//         images: senderProfile.images || [],
//         matchedAt: new Date(),
//         status: "active",
//       });

//       console.log(
//         "SENDER ADDED TO CURRENT USER matches[]"
//       );
//     } else {
//       console.log(
//         "SENDER ALREADY EXISTS IN CURRENT USER matches[]"
//       );
//     }

//     // ==================================================
//     // 14. CHECK SENDER'S matches[]
//     //
//     // B.matches already contains A?
//     // ==================================================

//     const alreadySenderMatch =
//       senderDiscovery.matches?.some(
//         (match) =>
//           String(match.profileId) ===
//           String(currentProfile._id)
//       );

//     // ==================================================
//     // 15. ADD CURRENT USER TO SENDER'S matches[]
//     //
//     // B.matches = A
//     // ==================================================

//     if (!alreadySenderMatch) {
//       senderDiscovery.matches.push({
//         profileId: currentProfile._id,
//         email: currentProfile.email,
//         username: currentProfile.username || null,
//         images: currentProfile.images || [],
//         matchedAt: new Date(),
//         status: "active",
//       });

//       console.log(
//         "CURRENT USER ADDED TO SENDER matches[]"
//       );
//     } else {
//       console.log(
//         "CURRENT USER ALREADY EXISTS IN SENDER matches[]"
//       );
//     }

//     // ==================================================
//     // 16. SAVE CURRENT USER
//     //
//     // Saves:
//     //
//     // A.likedBy[B].acknowledge = true
//     //
//     // AND
//     //
//     // A.matches = B
//     // ==================================================

//     await currentDiscovery.save();

//     console.log("CURRENT DISCOVERY SAVED");

//     // ==================================================
//     // 17. SAVE SENDER
//     //
//     // Saves:
//     //
//     // B.liked[A].acknowledge = true
//     //
//     // AND
//     //
//     // B.matches = A
//     // ==================================================

//     await senderDiscovery.save();

//     console.log("SENDER DISCOVERY SAVED");

//     // ==================================================
//     // 18. FINAL VERIFICATION
//     // ==================================================

//     const verifyCurrent =
//       await DiscoverySchema.findOne({
//         email: currentProfile.email,
//       }).select("email liked likedBy matches");

//     const verifySender =
//       await DiscoverySchema.findOne({
//         email: senderProfile.email,
//       }).select("email liked likedBy matches");

//     console.log("=================================");
//     console.log("FINAL MATCH VERIFICATION");
//     console.log("=================================");

//     console.log(
//       "CURRENT USER:",
//       currentProfile.email
//     );

//     console.log(
//       "CURRENT likedBy:",
//       verifyCurrent?.likedBy
//     );

//     console.log(
//       "CURRENT matches:",
//       verifyCurrent?.matches
//     );

//     console.log(
//       "SENDER:",
//       senderProfile.email
//     );

//     console.log(
//       "SENDER liked:",
//       verifySender?.liked
//     );

//     console.log(
//       "SENDER matches:",
//       verifySender?.matches
//     );

//     console.log("=================================");

//     // ==================================================
//     // 19. SUCCESS RESPONSE
//     // ==================================================

//     return NextResponse.json(
//       {
//         success: true,
//         alreadyMatched: false,

//         message:
//           `You matched with ${senderProfile.username}!`,

//         match: {
//           profileId: senderProfile._id,
//           email: senderProfile.email,
//           username: senderProfile.username,
//           images: senderProfile.images || [],
//           matchedAt: new Date(),
//           status: "active",
//         },
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error("=================================");
//     console.error("MATCH ERROR:", error);
//     console.error("ERROR MESSAGE:", error?.message);
//     console.error("ERROR STACK:", error?.stack);
//     console.error("=================================");

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error?.message ||
//           "Could not create match.",
//       },
//       { status: 500 }
//     );
//   }
// }



