import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { analyzeDocument } from "@/services/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "CITIZEN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { images, type } = await req.json();

        if (!images || !Array.isArray(images) || images.length === 0 || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Prepare files for Gemini service
        const files = images.map((img: string) => {
            const match = img.match(/^data:(.+);base64,(.+)$/);
            if (match) {
                return { mimeType: match[1], data: match[2] };
            }
            return { mimeType: "image/jpeg", data: img }; // Fallback
        });

        const analysis = await analyzeDocument(files, type);

        return NextResponse.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
