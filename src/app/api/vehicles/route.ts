import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "CITIZEN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { regNumber, model, type } = await req.json();

        if (!regNumber || !model || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                ownerId: session.user.id,
                regNumber,
                model,
                type,
                token: uuidv4(),
            },
        });

        return NextResponse.json({ success: true, vehicle });

    } catch (error) {
        console.error("Vehicle Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "CITIZEN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                ownerId: session.user.id
            },
            include: {
                documents: true
            }
        });

        // Backfill tokens for existing vehicles if missing
        const vehiclesWithTokens = await Promise.all(vehicles.map(async (v) => {
            if (!v.token) {
                const newToken = uuidv4();
                await prisma.vehicle.update({
                    where: { id: v.id },
                    data: { token: newToken }
                });
                return { ...v, token: newToken };
            }
            return v;
        }));

        return NextResponse.json({ success: true, vehicles: vehiclesWithTokens })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
