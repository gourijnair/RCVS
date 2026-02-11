import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    try {
        if (id) {
            // Fetch single user details with documents
            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    documents: true,
                    vehicles: {
                        include: { documents: true }
                    }
                }
            });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
            return NextResponse.json({ success: true, user });
        } else {
            // List all users
            const users = await prisma.user.findMany({
                include: {
                    _count: {
                        select: { vehicles: true, documents: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ success: true, users });
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await req.json();

        // Cascading delete is handled by Prisma relation if configured, 
        // but explicit transaction is safer if relations are optional or complex.
        // For now, simpler delete assuming Prisma handles cascade or we delete dependencies.
        // Prisma schema doesn't show onDelete: Cascade explicitly in the file view I saw earlier.
        // Let's do a transaction to be safe.

        await prisma.$transaction([
            prisma.document.deleteMany({ where: { userId: id } }),
            prisma.vehicle.deleteMany({ where: { ownerId: id } }),
            prisma.user.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete failed", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
