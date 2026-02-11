import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { analyzeDocument } from "@/services/gemini";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "CITIZEN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { images, type, vehicleId } = await req.json();

        if (!images || !Array.isArray(images) || images.length === 0 || !type) {
            return NextResponse.json({ error: "Missing required fields or invalid images format" }, { status: 400 });
        }

        // For non-DL types, vehicleId is required
        if (type !== "Driving License" && !vehicleId) {
            return NextResponse.json({ error: "Vehicle ID required for this document type" }, { status: 400 });
        }

        // 1. Analyze with Gemini
        // Prepare files for Gemini service (assuming frontend sends { data: base64, mimeType: string } or just base64 strings with headers)
        // Let's assume frontend sends array of base64 strings including mime type header

        const files = images.map((img: string) => {
            const match = img.match(/^data:(.+);base64,(.+)$/);
            if (match) {
                return { mimeType: match[1], data: match[2] };
            }
            return { mimeType: "image/jpeg", data: img }; // Fallback
        });

        const analysis = await analyzeDocument(files, type);

        // 2. Generate Verification Token
        const token = uuidv4();

        // 3. Save to Database
        // Store all images as a JSON string array to keep schema simple
        const docData: any = {
            type,
            imageUrl: JSON.stringify(images),
            analysisResult: JSON.stringify(analysis),
            status: analysis.status,
            token,
        };

        if (type === "Driving License") {
            docData.userId = session.user.id;
        } else {
            docData.vehicleId = vehicleId;
        }

        const document = await prisma.document.create({
            data: docData,
        });

        return NextResponse.json({
            success: true,
            analysis,
            token,
            documentId: document.id
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
