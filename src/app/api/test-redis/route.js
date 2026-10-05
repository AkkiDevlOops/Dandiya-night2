import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    await redis.set("raas-mitra:test", "Redis is working!", {
      ex: 60,
    });

    const value = await redis.get("raas-mitra:test");

    return NextResponse.json({
      success: true,
      message: value,
    });
  } catch (error) {
    console.error("Redis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}