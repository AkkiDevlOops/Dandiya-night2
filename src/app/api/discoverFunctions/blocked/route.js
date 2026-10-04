import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Discovery from "@/models/discovery";
import Profile from "@/models/profile";


/*
=====================================================
GET LOGGED-IN USER
=====================================================
*/

async function getAuthenticatedUser() {
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

  if (!payload.email) {
    return null;
  }

  return payload.email.toLowerCase();
}


/*
=====================================================
POST - BLOCK PROFILE
=====================================================
*/

export async function POST(request) {
  try {
    await connectDB();

    // ============================================
    // AUTHENTICATE USER
    // ============================================

    const email = await getAuthenticatedUser();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }


    // ============================================
    // GET REQUEST BODY
    // ============================================

    const body = await request.json();

    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          message: "profileId is required.",
        },
        { status: 400 }
      );
    }


    // ============================================
    // CHECK TARGET PROFILE
    // ============================================

    const targetProfile = await Profile.findById(
      profileId
    )
      .select("_id email username")
      .lean();

    if (!targetProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }


    // ============================================
    // DON'T ALLOW SELF BLOCK
    // ============================================

    if (
      targetProfile.email?.toLowerCase() === email
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot block yourself.",
        },
        { status: 400 }
      );
    }


    // ============================================
    // FIND CURRENT USER DISCOVERY
    // ============================================

    let discovery = await Discovery.findOne({
      email,
    });


    // ============================================
    // CREATE DISCOVERY IF MISSING
    // ============================================

    if (!discovery) {
      discovery = await Discovery.create({
        email,
        liked: [],
        skipped: [],
        blocked: [],
        reported: [],
        likedBy: [],
        matches: [],
      });
    }


    // ============================================
    // CHECK IF ALREADY BLOCKED
    // ============================================

    const alreadyBlocked =
      discovery.blocked.some(
        (blockedId) =>
          String(blockedId) ===
          String(profileId)
      );


    if (alreadyBlocked) {
      return NextResponse.json(
        {
          success: true,
          alreadyBlocked: true,
          message:
            "You already blocked this profile.",
        },
        { status: 200 }
      );
    }


    // ============================================
    // ADD BLOCK
    // ============================================

    discovery.blocked.push(profileId);

    await discovery.save();


    // ============================================
    // SUCCESS
    // ============================================

    return NextResponse.json(
      {
        success: true,
        alreadyBlocked: false,
        message: "Profile blocked.",
        blockedProfileId: profileId,
      },
      { status: 200 }
    );

  } catch (error) {

    console.error(
      "BLOCK API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}