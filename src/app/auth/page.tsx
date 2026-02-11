"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AuthPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    // Login State
    const [loginUser, setLoginUser] = useState("")
    const [loginPass, setLoginPass] = useState("")

    // Register State
    const [regUser, setRegUser] = useState("")
    const [regPass, setRegPass] = useState("")
    const [regEmail, setRegEmail] = useState("")
    const [regRole, setRegRole] = useState("CITIZEN")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const res = await signIn("credentials", {
            username: loginUser,
            password: loginPass,
            redirect: false,
        })

        if (res?.error) {
            setError("Invalid credentials")
        } else {
            router.push(loginUser.startsWith("officer") ? "/police" : "/citizen")
            // Ideally redirect based on role from session, but for quick UX:
            // We will let the middleware or the page itself handle redirect if wrong role.
            // Actually handling it here based on convention or fetching session is better.
            // For now, simple redirect.
            router.refresh()
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const res = await signIn("credentials", {
            username: regUser,
            password: regPass,
            email: regEmail,
            role: regRole,
            isRegister: "true",
            redirect: false,
        })

        if (res?.error) {
            setError(res.error)
        } else {
            router.push(regRole === "POLICE" ? "/police" : "/citizen")
            router.refresh()
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Welcome to RCVE</CardTitle>
                    <CardDescription>Roadside Compliance Verification Engine</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required />
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <Button type="submit" className="w-full">Login</Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-username">Username</Label>
                                    <Input id="reg-username" value={regUser} onChange={(e) => setRegUser(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">Email</Label>
                                    <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Password</Label>
                                    <Input id="reg-password" type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select onValueChange={setRegRole} defaultValue="CITIZEN">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CITIZEN">Citizen</SelectItem>
                                            <SelectItem value="POLICE">Police</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <Button type="submit" className="w-full">Create Account</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
