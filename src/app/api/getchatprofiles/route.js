import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

import connectDB from "@/lib/db";
import DiscoverySchema from "@/models/DiscoverySchema";

async function getAuthenticatedUser() {
  try {
    const { cookies } = await import("next/headers");

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(token, secret);

    return payload.email || null;
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return null;
  }
}

export async function GET() {
  try {
    await connectDB();

    // Get logged-in user's email
    const email = await getAuthenticatedUser();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // Find current user's Discovery document
   const discovery = await DiscoverySchema.findOne({
   email: email.toLowerCase(),

   })
  .select("likedBy liked matches")// 🌟 This tells MongoDB to ONLY return the likedBy field
  .lean();

 const matches = (discovery.matches || [])
  .map((match) => ({
    profileId: match.profileId?._id || match.profileId,
    email: match.profileId?.email || match.email,
    username: match.username,
    images: match.images || [],
    matchedAt: match.matchedAt,
    status: match.status || "active",
  }));


     
    
      
     
// const array1 = (discovery?.liked || [])
//   .filter((match) => match.acknowledge === true)
//   .map((match) => ({
//     profileId: match.profileId,
//     email: match.email,
//     username: match.targetIdName,
//     image: match.targetIdphoto,
//     status: match.status,
//   }));

// const array2 = (discovery?.likedBy || [])
//   .filter((match) => match.acknowledge === true)
//   .map((match) => ({
//     profileId: match.profileId,
//     email: match.email,
//     username: match.targetIdName,
//     image: match.targetIdphoto,
//     status: match.status,
//   }));

// const matches = [];

// matches.push(...array1);
// matches.push(...array2);


  




    if (!discovery) {
      return NextResponse.json(
        {
          success: false,
          message: "Discovery profile not found.",
          matches: [],
        },
        {
          status: 404,
        }
      );
    }



    // Get active matches
  

    return NextResponse.json(
      {
        success: true,
        count: matches.length,
        matches,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET MATCHES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Could not fetch matches.",
        matches: [],
      },
      {
        status: 500,
      }
    );
  }
}

