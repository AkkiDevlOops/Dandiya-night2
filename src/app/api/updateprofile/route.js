import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

import connectDB from "@/lib/db";
import Profile from "@/models/profile";


// ======================================================
// AUTHENTICATE USER
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
// GET PROFILE
// GET /api/updateprofile
// ======================================================

export async function GET() {
  try {
    await connectDB();

    const email = await getAuthenticatedUser();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const profile = await Profile.findOne({
      email: email.toLowerCase(),
    }).lean();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // Convert DATABASE format -> FRONTEND format
    const user = {
      ...profile,

      interests: profile.intrest || [],

      prompts: [
        profile.promt1
          ? {
              question: profile.promt1.question || "",
              answer: profile.promt1.answer || "",
            }
          : null,

        profile.promt2
          ? {
              question: profile.promt2.question || "",
              answer: profile.promt2.answer || "",
            }
          : null,
      ].filter(Boolean),

      // Your current schema does not have intro
      intro: profile.intro || "",
    };

    return NextResponse.json({
      success: true,
      user,
      users: user,
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not load profile.",
      },
      { status: 500 }
    );
  }
}


// ======================================================
// PATCH PROFILE
// PATCH /api/updateprofile
// ======================================================

export async function PATCH(request) {
  try {
    await connectDB();

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    const email = await getAuthenticatedUser();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // BODY
    // --------------------------------------------------

    const body = await request.json();

    console.log("UPDATE PROFILE REQUEST:", body);

    // --------------------------------------------------
    // FIND USER
    // --------------------------------------------------

    const profile = await Profile.findOne({
      email: email.toLowerCase(),
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // BASIC PROFILE
    // ==================================================

    if (
      body.username !== undefined
    ) {
      profile.username =
        String(body.username).trim();
    }

    if (
      body.branch !== undefined
    ) {
      profile.branch =
        String(body.branch).trim();
    }

    if (
      body.semester !== undefined
    ) {
      profile.semester =
        String(body.semester).trim();
    }

    // ==================================================
    // INTERESTS
    // FRONTEND: interests
    // DATABASE: intrest
    // ==================================================

    if (
      body.interests !== undefined
    ) {

      if (!Array.isArray(body.interests)) {
        return NextResponse.json(
          {
            success: false,
            error: "interests must be an array.",
          },
          { status: 400 }
        );
      }

      profile.intrest = body.interests
        .map((interest) =>
          String(interest).trim()
        )
        .filter(Boolean);
    }

    // ==================================================
    // PROMPTS
    // FRONTEND:
    //
    // prompts: [
    //   {
    //      question: "...",
    //      answer: "..."
    //   }
    // ]
    //
    // DATABASE:
    // promt1
    // promt2
    // ==================================================

    if (
      body.prompts !== undefined
    ) {

      if (!Array.isArray(body.prompts)) {
        return NextResponse.json(
          {
            success: false,
            error: "prompts must be an array.",
          },
          { status: 400 }
        );
      }

      const prompts = body.prompts
        .filter(Boolean)
        .map((prompt) => ({
          question:
            String(prompt.question || "").trim(),

          answer:
            String(prompt.answer || "").trim(),
        }))
        .filter(
          (prompt) =>
            prompt.question ||
            prompt.answer
        );

      profile.promt1 =
        prompts[0] || undefined;

      profile.promt2 =
        prompts[1] || undefined;
    }

    // ==================================================
    // IMAGES
    // ==================================================

    if (
      body.images !== undefined
    ) {

      if (!Array.isArray(body.images)) {
        return NextResponse.json(
          {
            success: false,
            error: "images must be an array.",
          },
          { status: 400 }
        );
      }

      profile.images = body.images
        .map((image) =>
          String(image).trim()
        )
        .filter(Boolean);
    }

    // ==================================================
    // IMAGE HASHES
    // ==================================================

    if (
      body.imageHashes !== undefined
    ) {

      if (!Array.isArray(body.imageHashes)) {
        return NextResponse.json(
          {
            success: false,
            error: "imageHashes must be an array.",
          },
          { status: 400 }
        );
      }

      profile.imageHashes = body.imageHashes
        .map((hash) =>
          String(hash).trim()
        )
        .filter(Boolean);
    }

    // ==================================================
    // SAVE
    // ==================================================

    await profile.save();

    // ==================================================
    // RETURN FRONTEND FORMAT
    // ==================================================

    const updatedProfile = profile.toObject();

    const user = {
      ...updatedProfile,

      interests:
        updatedProfile.intrest || [],

      prompts: [
        updatedProfile.promt1
          ? {
              question:
                updatedProfile.promt1.question || "",
              answer:
                updatedProfile.promt1.answer || "",
            }
          : null,

        updatedProfile.promt2
          ? {
              question:
                updatedProfile.promt2.question || "",
              answer:
                updatedProfile.promt2.answer || "",
            }
          : null,
      ].filter(Boolean),

      intro:
        updatedProfile.intro || "",
    };

    console.log(
      "PROFILE UPDATED:",
      user
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",

        user,
        users: user,
        profile: user,
      },
      { status: 200 }
    );

  } catch (error) {

    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Could not update profile.",
      },
      { status: 500 }
    );
  }
}