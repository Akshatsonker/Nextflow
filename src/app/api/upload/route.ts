import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    console.log("KEY:", process.env.TRANSLOADIT_KEY);
    console.log("SECRET:", process.env.TRANSLOADIT_SECRET);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = {
      auth: {
        key: process.env.TRANSLOADIT_KEY,
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      steps: {
  ":original": {
    robot: "/upload/handle",
  },
}
    };

    const paramsString = JSON.stringify(params);

    const signature =
      "sha384:" +
      crypto
        .createHmac("sha384", process.env.TRANSLOADIT_SECRET!)
        .update(paramsString)
        .digest("hex");

    return NextResponse.json({
      params: paramsString,
      signature,
    });

  } catch (err: any) {
    console.error("UPLOAD API ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}