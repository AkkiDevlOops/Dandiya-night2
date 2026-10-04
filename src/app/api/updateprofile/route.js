import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

import connectDB from "@/lib/db";
import Profile from "@/models/profile";

export const dynamic = "force-dynamic";

/* =========================================================
   GET AUTHENTICATED USER
========================================================= */

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();

    /*
      CHANGE THIS COOKIE NAME if your login route
      uses a different cookie name.
    */
    const token =
      cookieStore.get("session")?.value

    if (!token) {
      return null;
    }

    /*
      CHANGE JWT_SECRET if your project uses a different
      environment variable.
    */
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload;
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return null;
  }
}

/* =========================================================
   GET PROFILE

   Optional:
   This allows /api/updateprofile to also return the
   current profile if you want to use it.
========================================================= */

export async function GET() {
  try {
    await connectDB();

    const payload =
      await getAuthenticatedUser();

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /*
      Your JWT may contain email under different names.
    */
    const email =
      payload.email ||
      payload.userEmail ||
      payload.sub;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email not found in authentication token.",
        },
        { status: 401 }
      );
    }

    const profile =
      await Profile.findOne({
        email: String(email).toLowerCase(),
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

    return NextResponse.json(
      {
        success: true,
        user: profile,
        profile: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/updateprofile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch profile.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH PROFILE

   This is called ONLY when user clicks:
   "Update Profile"
========================================================= */

export async function PATCH(request) {
  try {
    /* -----------------------------------------------------
       DATABASE
    ----------------------------------------------------- */

    await connectDB();

    /* -----------------------------------------------------
       AUTHENTICATION
    ----------------------------------------------------- */

    const payload =
      await getAuthenticatedUser();

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /* -----------------------------------------------------
       GET EMAIL FROM JWT
    ----------------------------------------------------- */

    const email =
      payload.email ||
      payload.userEmail ||
      payload.sub;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email not found in authentication token.",
        },
        { status: 401 }
      );
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    /* -----------------------------------------------------
       READ BODY
    ----------------------------------------------------- */

    let body;

    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       FIND PROFILE
    ----------------------------------------------------- */

    const profile =
      await Profile.findOne({
        email: normalizedEmail,
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

    /* =====================================================
       IMPORTANT

       We DO NOT update:

       username
       branch
       semester
       college
       gender
       email

       These are intentionally locked.
    ===================================================== */

    /* =====================================================
       DATE OF BIRTH
    ===================================================== */

    if (
      body.dateOfBirth !==
      undefined
    ) {
      if (
        body.dateOfBirth ===
          null ||
        body.dateOfBirth === ""
      ) {
        profile.dateOfBirth =
          null;
      } else {
        const date =
          new Date(
            body.dateOfBirth
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Invalid date of birth.",
            },
            { status: 400 }
          );
        }

        /*
          Prevent future DOB.
        */
        if (
          date > new Date()
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Date of birth cannot be in the future.",
            },
            { status: 400 }
          );
        }

        profile.dateOfBirth =
          date;
      }
    }

    /* =====================================================
       INTRO
    ===================================================== */

    if (
      body.intro !==
      undefined
    ) {
      if (
        typeof body.intro !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Intro must be a string.",
          },
          { status: 400 }
        );
      }

      const intro =
        body.intro.trim();

      if (
        intro.length > 500
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Intro cannot exceed 500 characters.",
          },
          { status: 400 }
        );
      }

      profile.intro =
        intro;
    }

    /* =====================================================
       INTERESTS
    ===================================================== */

    if (
      body.interests !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.interests
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Interests must be an array.",
          },
          { status: 400 }
        );
      }

      /*
        Clean interests:
        - convert to strings
        - trim
        - remove empty values
        - remove duplicates
      */

      const cleanedInterests =
        [
          ...new Set(
            body.interests
              .map((interest) =>
                String(
                  interest
                ).trim()
              )
              .filter(Boolean)
          ),
        ];

      profile.interests =
        cleanedInterests;
    }

    /* =====================================================
       PROMPTS
       
       New format:

       prompts: [
         {
           question: String,
           answer: String
         }
       ]
    ===================================================== */

    if (
      body.prompts !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.prompts
        )
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

      /* -----------------------------------------------
         MAX 6 PROMPTS
      ------------------------------------------------ */

      if (
        body.prompts.length >
        6
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

      /* -----------------------------------------------
         CLEAN PROMPTS
      ------------------------------------------------ */

      const cleanedPrompts =
        body.prompts
          .map((prompt) => {
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

            /*
              Keep MongoDB _id if it already exists.
            */

            const cleaned = {
              question,
              answer,
            };

            if (
              prompt._id
            ) {
              cleaned._id =
                prompt._id;
            }

            return cleaned;
          })
          .filter(Boolean);

      /*
        Optional limit for individual
        question/answer length.
      */

      for (
        const prompt of cleanedPrompts
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

      profile.prompts =
        cleanedPrompts;
    }

    /* =====================================================
       IMAGES
    ===================================================== */

    if (
      body.images !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.images
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Images must be an array.",
          },
          { status: 400 }
        );
      }

      /*
        Remove empty image slots.
      */

      const cleanedImages =
        body.images
          .map((image) =>
            typeof image ===
            "string"
              ? image.trim()
              : ""
          )
          .filter(Boolean);

      /*
        Maximum 6 profile photos.
      */

      if (
        cleanedImages.length >
        6
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Maximum 6 profile images are allowed.",
          },
          { status: 400 }
        );
      }

      profile.images =
        cleanedImages;
    }

    /* =====================================================
       SAVE
    ===================================================== */

    await profile.save();

    /* =====================================================
       GET UPDATED PROFILE
    ===================================================== */

    const updatedProfile =
      await Profile.findById(
        profile._id
      ).lean();

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          "Profile updated successfully.",

        user:
          updatedProfile,

        profile:
          updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH /api/updateprofile error:",
      error
    );

    /* -----------------------------------------------------
       MONGOOSE VALIDATION ERROR
    ----------------------------------------------------- */

    if (
      error?.name ===
      "ValidationError"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            Object.values(
              error.errors
            )
              .map(
                (err) =>
                  err.message
              )
              .join(", "),
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       GENERIC ERROR
    ----------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update profile.",
      },
      { status: 500 }
    );
  }
}