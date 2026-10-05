import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const title = formData.get("title");
    const artist = formData.get("artist");
    const genre = formData.get("genre");

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Song file is required",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Song title is required",
        },
        { status: 400 }
      );
    }

    // Validate audio type
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only audio files are allowed",
        },
        { status: 400 }
      );
    }

    // Limit file size to 20 MB
    const MAX_SIZE = 20 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum song size is 20MB",
        },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop();

    const safeTitle = title
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const fileName = `${Date.now()}-${safeTitle}.${extension}`;

    const filePath = `songs/${fileName}`;

    // Convert File → ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
  .from("Dandiya-night-songs")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload song",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Generate public URL
   const { data: publicUrlData } = supabaseAdmin.storage
  .from("Dandiya-night-songs")
  .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      message: "Song uploaded successfully",
      song: {
        title,
        artist: artist || "",
        genre: genre || "",
        audioUrl,
        filePath,
      },
    });
  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
        error: error.message,
      },
      { status: 500 }
    );
  }
}