import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { User } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
                email: { label: "Email", type: "email" },
                isRegister: { label: "Register", type: "text" }, // "true" or "false"
                role: { label: "Role", type: "text" }, // "CITIZEN" or "POLICE"
            },
            authorize: async (credentials) => {
                const { username, password, email, isRegister, role } = credentials as {
                    username: string;
                    password: string;
                    email?: string;
                    isRegister?: string;
                    role?: string;
                }

                if (isRegister === "true" && email && role) {
                    // Registration flow
                    const existingUser = await prisma.user.findUnique({
                        where: { username },
                    })

                    if (existingUser) {
                        throw new Error("User already exists")
                    }

                    const hashedPassword = await bcrypt.hash(password, 10)

                    const newUser = await prisma.user.create({
                        data: {
                            username,
                            password: hashedPassword,
                            email,
                            role,
                        },
                    })

                    return newUser
                } else {
                    // Login flow
                    const user = await prisma.user.findUnique({
                        where: { username },
                    })

                    if (!user) {
                        throw new Error("User not found")
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password)

                    if (!passwordsMatch) {
                        throw new Error("Invalid password")
                    }

                    return user
                }
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as User).role
                token.id = (user as User).id
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
            }
            return session
        },
    },
    pages: {
        signIn: "/auth",
    },
    secret: process.env.AUTH_SECRET,
})
