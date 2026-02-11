import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { analyzeDocument } from "@/services/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // SCENARIO 1: TOKEN VERIFICATION (POLICE or anyone with token)
        if (body.token) {
            // Search in Documents
            let document = await prisma.document.findUnique({
                where: { token: body.token },
                include: { vehicle: true, user: true }
            });

            if (document) {
                const analysis = JSON.parse(document.analysisResult);
                return NextResponse.json({
                    success: true,
                    data: {
                        status: document.status,
                        timestamp: document.createdAt,
                        vehicle: {
                            owner: document.user?.username || "Unknown",
                            model: document.vehicle?.model || "N/A",
                            regNumber: document.vehicle?.regNumber || analysis.regNumber || "N/A",
                        },
                        imageUrl: document.imageUrl,
                        analysis: analysis
                    }
                });
            }

            // Search in Vehicles (for QR code on vehicle card)
            let vehicle = await prisma.vehicle.findUnique({
                where: { token: body.token },
                include: { owner: true, documents: true }
            });

            if (vehicle) {
                // Return vehicle summary
                return NextResponse.json({
                    success: true,
                    data: {
                        status: "VALID", // Vehicle registration itself is valid if it exists here
                        timestamp: vehicle.createdAt,
                        vehicle: {
                            owner: vehicle.owner.username,
                            model: vehicle.model,
                            regNumber: vehicle.regNumber,
                        },
                        analysis: {
                            detectedType: "Vehicle Registration",
                            expiryDate: "N/A",
                            issues: []
                        }
                    }
                });
            }

            return NextResponse.json({ error: "Invalid Token" }, { status: 404 });
        }

        // SCENARIO 2: CITIZEN IMAGE ANALYSIS
        if (session.user.role !== "CITIZEN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { images, type } = body;

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
