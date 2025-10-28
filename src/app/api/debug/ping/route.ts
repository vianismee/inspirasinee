import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    method: "GET",
    url: request.url,
    headers: {
      "user-agent": request.headers.get("user-agent"),
      "host": request.headers.get("host")
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: "pong_post",
      timestamp: new Date().toISOString(),
      method: "POST",
      received_body: body
    });
  } catch (error) {
    return NextResponse.json({
      message: "Error parsing POST body",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}