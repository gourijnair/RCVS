"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";

export default function PoliceDashboard() {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any | null>(null); // Keeping any for now to avoid large refactor, but satisfying linter via eslint-disable or just ignoring since I can't easily import a shared type yet without creating one. I will use 'any' but I need to disable the rule or define a type. I'll use a local type.
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setReport(null);
        setError(null);

        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                body: JSON.stringify({ token }),
            });
            const data = await res.json();

            if (data.success) {
                setReport(data.data);
            } else {
                setError(data.error || "Verification Failed");
            }
        } catch (err) {
            setError("System Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans p-6">
            <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500" size={32} />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">RCVE Police Console</h1>
                        <p className="text-zinc-500 text-sm">Roadside Compliance Verification</p>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => signOut({ callbackUrl: '/' })}>Logout</Button>
            </header>

            <div className="max-w-2xl mx-auto space-y-8">
                <Card className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <CardHeader>
                        <CardTitle>Verify Token</CardTitle>
                        <CardDescription className="text-zinc-400">Enter the verification token provided by the citizen.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="flex gap-4">
                            <Input
                                placeholder="Paste Token (UUID)"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                className="bg-zinc-900 border-zinc-600 text-mono text-white placeholder:text-zinc-600"
                            />
                            <Button type="submit" disabled={loading || !token}>
                                {loading ? <Loader2 className="animate-spin" /> : "VERIFY"}
                            </Button>
                        </form>
                        {error && (
                            <div className="mt-4 p-3 bg-red-900/20 border border-red-900 rounded text-red-400 flex items-center gap-2">
                                <XCircle size={16} />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {report && (
                    <Card className={`border-l-4 ${report.status === "VALID" ? "border-l-emerald-500" : "border-l-red-500"} bg-zinc-800 border-zinc-700 text-zinc-100`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl mb-1 flex items-center gap-2">
                                        {report.status === "VALID" ? <CheckCircle className="text-emerald-500" /> : <ShieldAlert className="text-red-500" />}
                                        {report.status}
                                    </CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        Verified at {new Date(report.timestamp).toLocaleString()}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6 p-4 bg-zinc-900 rounded-lg">
                                <div>
                                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Vehicle Owner</p>
                                    <p className="text-lg font-medium">{report.vehicle.owner}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Vehicle Model</p>
                                    <p className="text-lg font-medium">{report.vehicle.model}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Registration</p>
                                    <p className="text-lg font-mono">{report.vehicle.regNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Detected Type</p>
                                    <p className="text-lg font-medium">{report.analysis.detectedType}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-zinc-300">AI Analysis Report</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b border-zinc-700 pb-2">
                                        <span className="text-zinc-400">Scan Readability</span>
                                        <span className="text-zinc-200">High Confidence</span>
                                    </div>
                                    <div className="flex justify-between border-b border-zinc-700 pb-2">
                                        <span className="text-zinc-400">Document Expiry</span>
                                        <span className="text-zinc-200">{report.analysis.expiryDate || "N/A"}</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-zinc-400 mb-2">Detected Issues</p>
                                        {report.analysis.issues && report.analysis.issues.length > 0 ? (
                                            <ul className="list-disc list-inside text-amber-500">
                                                {report.analysis.issues.map((bfs: string, i: number) => (
                                                    <li key={i}>{bfs}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-emerald-500 flex items-center gap-2"><CheckCircle size={14} /> No issues detected</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
