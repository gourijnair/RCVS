"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, FileText, Plus, Loader2, CheckCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";

interface Document {
    id: string;
    type: string;
    status: string;
    token: string | null;
    analysisResult: string;
    createdAt: string;
}

interface AnalysisResult {
    detectedType?: string;
    regNumber?: string;
    ownerName?: string;
    expiryDate?: string;
    issues?: string[];
    status?: string;
    classOfVehicle?: string;
}

interface Vehicle {
    id: string;
    regNumber: string;
    model: string;
    type: string;
    token?: string | null;
    documents: Document[];
}

export default function CitizenDashboard() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Registration State
    const [regNo, setRegNo] = useState("");
    const [model, setModel] = useState("");
    const [vType, setVType] = useState("Private Car");
    const [regLoading, setRegLoading] = useState(false);

    // Analysis State
    const [docType, setDocType] = useState("Registration Certificate");

    // Vehicle Document State
    const [vehicleFiles, setVehicleFiles] = useState<File[]>([]);
    const [vehiclePreviewUrls, setVehiclePreviewUrls] = useState<string[]>([]);

    // DL Document State
    const [dlFiles, setDlFiles] = useState<File[]>([]);
    const [dlPreviewUrls, setDlPreviewUrls] = useState<string[]>([]);

    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    // User Documents State
    const [userDocs, setUserDocs] = useState<Document[]>([]);

    useEffect(() => {
        fetchVehicles();
        fetchUserDocs();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await fetch("/api/vehicles");
            const data = await res.json();
            if (data.success) {
                setVehicles(data.vehicles);
            }
        } catch (error) {
            console.error("Failed to fetch vehicles", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDocs = async () => {
        try {
            const res = await fetch("/api/user/documents");
            const data = await res.json();
            if (data.success) {
                setUserDocs(data.documents);
            }
        } catch (error) {
            console.error("Failed to fetch user documents", error);
        }
    };

    const handleRegisterVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegLoading(true);
        try {
            const res = await fetch("/api/vehicles", {
                method: "POST",
                body: JSON.stringify({ regNumber: regNo, model, type: vType }),
            });
            const data = await res.json();
            if (data.success) {
                setRegNo("");
                setModel("");
                fetchVehicles(); // Refresh list
            }
        } catch (error) {
            console.error("Registration failed", error);
        } finally {
            setRegLoading(false);
        }
    };

    const handleVehicleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setVehicleFiles(selectedFiles);
            setAnalysisResult(null);
            setGeneratedToken(null);

            // Generate previews
            const urls: string[] = [];
            let processed = 0;
            selectedFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    urls.push(reader.result as string);
                    processed++;
                    if (processed === selectedFiles.length) {
                        setVehiclePreviewUrls([...urls]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleDlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setDlFiles(selectedFiles);
            setAnalysisResult(null);
            setGeneratedToken(null);

            // Generate previews
            const urls: string[] = [];
            let processed = 0;
            selectedFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    urls.push(reader.result as string);
                    processed++;
                    if (processed === selectedFiles.length) {
                        setDlPreviewUrls([...urls]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleAnalyzeVehicle = async () => {
        if (vehicleFiles.length === 0 || !selectedVehicle) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setGeneratedToken(null);

        // Convert all files to base64
        const filePromises = vehicleFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
        });

        const base64Files = await Promise.all(filePromises);

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                body: JSON.stringify({
                    images: base64Files, // Send array
                    type: docType,
                    vehicleId: selectedVehicle.id
                })
            });
            const data = await res.json();
            if (data.success) {
                setAnalysisResult(data.analysis);
                setGeneratedToken(data.token);
                fetchVehicles(); // Refetch to show new doc in list
                setVehicleFiles([]);
                setVehiclePreviewUrls([]);
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAnalyzeDL = async () => {
        if (dlFiles.length === 0) return;
        setAnalyzing(true);
        // setAnalysisResult(null); // Don't clear result if we are proceeding
        setGeneratedToken(null);

        // Convert all files to base64
        const filePromises = dlFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
        });

        const base64Files = await Promise.all(filePromises);

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                body: JSON.stringify({
                    images: base64Files, // Send array
                    type: "Driving License",
                })
            });
            const data = await res.json();
            if (data.success) {
                setAnalysisResult(data.analysis);
                setGeneratedToken(data.token);
                fetchUserDocs(); // Refresh user docs
                setDlFiles([]);
                setDlPreviewUrls([]);
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleVerifyVehicle = async () => {
        if (vehicleFiles.length === 0 || !selectedVehicle) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setGeneratedToken(null);

        // Convert all files to base64
        const filePromises = vehicleFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
        });

        const base64Files = await Promise.all(filePromises);

        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                body: JSON.stringify({
                    images: base64Files, // Send array
                    type: docType,
                })
            });
            const data = await res.json();
            if (data.success) {
                setAnalysisResult(data.analysis);
            }
        } catch (error) {
            console.error("Verification failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleVerifyDL = async () => {
        if (dlFiles.length === 0) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setGeneratedToken(null);

        // Convert all files to base64
        const filePromises = dlFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
        });

        const base64Files = await Promise.all(filePromises);

        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                body: JSON.stringify({
                    images: base64Files, // Send array
                    type: "Driving License",
                })
            });
            const data = await res.json();
            if (data.success) {
                setAnalysisResult(data.analysis);
            }
        } catch (error) {
            console.error("Verification failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const dlDocument = userDocs.find(d => d.type === "Driving License");

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Citizen Portal</h1>
                    <p className="text-gray-500">Manage your vehicles and documents</p>
                </div>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Button>
            </header>

            {/* DL Section */}
            <div className="mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={18} /> Driver&apos;s License
                        </CardTitle>
                        <CardDescription>
                            Your personal driving license. You only need to upload this once.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dlDocument ? (
                            <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <CheckCircle size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-green-900">License Uploaded</p>
                                        <p className="text-sm text-green-700">Status: {dlDocument.status}</p>
                                        {(() => {
                                            try {
                                                const res = JSON.parse(dlDocument.analysisResult);
                                                return res.classOfVehicle ? <p className="text-xs text-green-800 mt-1">Class: <span className="font-semibold">{res.classOfVehicle}</span></p> : null;
                                            } catch (e) { return null; }
                                        })()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-mono">Token</p>
                                    <p className="text-sm font-mono font-bold">{dlDocument.token?.slice(0, 12)}...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Upload License Image</Label>
                                        <Input type="file" multiple onChange={handleDlFileChange} accept="image/*,application/pdf" />
                                    </div>
                                    <Button onClick={analysisResult && !generatedToken ? handleAnalyzeDL : handleVerifyDL} disabled={analyzing || dlFiles.length === 0}>
                                        {analyzing ? <Loader2 className="animate-spin mr-2" /> : (analysisResult && !generatedToken ? "Proceed to Save & Generate Token" : "Verify License")}
                                    </Button>
                                </div>
                                {dlPreviewUrls.length > 0 && (
                                    <div className="mt-4 flex gap-2 overflow-x-auto">
                                        {dlPreviewUrls.map((url, index) => (
                                            <div key={index} className="border rounded-md overflow-hidden relative h-32 w-48 bg-gray-100 flex items-center justify-center shrink-0">
                                                {url.startsWith("data:application/pdf") ? (
                                                    <div className="text-center p-2">
                                                        <FileText size={32} className="mx-auto text-red-500 mb-2" />
                                                        <p className="text-xs text-gray-500">PDF Document</p>
                                                    </div>
                                                ) : (
                                                    <img src={url} alt={`Preview ${index}`} className="h-full object-contain" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show Analysis Result for DL if just uploaded */}
                        {analysisResult && !selectedVehicle && analysisResult.detectedType === "Driving License" && (
                            <div className="mt-4 p-4 border rounded bg-gray-50">
                                <h4 className="font-bold mb-2 flex items-center justify-between">
                                    Verification Status
                                    <Badge variant={analysisResult.status === "VALID" ? "default" : "destructive"}>
                                        {analysisResult.status}
                                    </Badge>
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                    <div>
                                        <p className="text-gray-500">License No.</p>
                                        <p className="font-medium text-lg">{analysisResult.regNumber || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Name</p>
                                        <p className="font-medium">{analysisResult.ownerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Expiry</p>
                                        <p className="font-medium">{analysisResult.expiryDate}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500">Issues</p>
                                        <p className="font-medium text-amber-600">{analysisResult.issues?.join(", ") || "None"}</p>
                                    </div>
                                </div>
                                {!generatedToken && (
                                    <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded mb-2">
                                        Please review the verification status above. If correct, proceed to save.
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Col: Vehicle List & Registration */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Plus size={18} /> Register New Vehicle</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRegisterVehicle} className="space-y-4">
                                <Input placeholder="Registration Number (e.g. DL-01-AB-1234)" value={regNo} onChange={e => setRegNo(e.target.value)} required />
                                <Input placeholder="Model (e.g. Honda City)" value={model} onChange={e => setModel(e.target.value)} required />
                                <Select value={vType} onValueChange={setVType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Private Car">Private Car</SelectItem>
                                        <SelectItem value="Commercial Truck">Commercial Truck</SelectItem>
                                        <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" className="w-full" disabled={regLoading}>
                                    {regLoading ? <Loader2 className="animate-spin mr-2" /> : "Register Vehicle"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">Your Vehicles</h3>
                        {loading ? <Loader2 className="animate-spin" /> :
                            vehicles.length === 0 ? <p className="text-gray-400 text-sm">No vehicles registered.</p> :
                                vehicles.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => { setSelectedVehicle(v); setAnalysisResult(null); setGeneratedToken(null); setVehicleFiles([]); setVehiclePreviewUrls([]); }}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedVehicle?.id === v.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Car size={20} />
                                            <div>
                                                <p className="font-bold">{v.regNumber}</p>
                                                <p className="text-xs opacity-70">{v.model} • {v.type}</p>
                                            </div>
                                        </div>
                                        {v.token && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex justify-between items-center group mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs opacity-70">Token</span>
                                                        <code className="text-xs font-mono font-bold bg-gray-100 p-1 rounded">{v.token.slice(0, 8)}...</code>
                                                    </div>
                                                    <div className="bg-white p-1 rounded">
                                                        <QRCodeSVG value={JSON.stringify({ type: "VEHICLE", token: v.token })} size={48} />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-center text-gray-400">Scan for Status</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                    </div>
                </div>

                {/* Right Col: Details & Actions */}
                <div className="md:col-span-2 space-y-6">
                    {selectedVehicle ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upload Document for {selectedVehicle.regNumber}</CardTitle>
                                    <CardDescription>Upload a clear image of your RC, Insurance, or PUC.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Document Type</Label>
                                            <Select value={docType} onValueChange={setDocType}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Registration Certificate">Registration Certificate</SelectItem>
                                                    <SelectItem value="Insurance Policy">Insurance Policy</SelectItem>
                                                    <SelectItem value="PUC Certificate">PUC Certificate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Document Image</Label>
                                            <Input type="file" multiple onChange={handleVehicleFileChange} accept="image/*,application/pdf" />
                                        </div>
                                    </div>

                                    {vehiclePreviewUrls.length > 0 && (
                                        <div className="mt-4 flex gap-2 overflow-x-auto">
                                            {vehiclePreviewUrls.map((url, index) => (
                                                <div key={index} className="border rounded-md overflow-hidden relative h-48 w-48 bg-gray-100 flex items-center justify-center shrink-0">
                                                    {url.startsWith("data:application/pdf") ? (
                                                        <div className="text-center p-2">
                                                            <FileText size={48} className="mx-auto text-red-500 mb-2" />
                                                            <p className="text-xs text-gray-500">PDF Document</p>
                                                        </div>
                                                    ) : (
                                                        <img src={url} alt={`Preview ${index}`} className="h-full object-contain" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleVerifyVehicle}
                                            disabled={analyzing || vehicleFiles.length === 0 || (!!analysisResult && !generatedToken)}
                                            variant={analysisResult && !generatedToken ? "outline" : "default"}
                                            className="w-full"
                                        >
                                            {analyzing && !analysisResult ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Document"}
                                        </Button>

                                        {analysisResult && !generatedToken && (
                                            <Button
                                                onClick={handleAnalyzeVehicle}
                                                disabled={analyzing}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save & Generate Token"}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {analysisResult && (
                                <Card className="bg-zinc-50 border-zinc-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Analysis Result
                                            <Badge variant={analysisResult.status === "VALID" ? "default" : "destructive"}>
                                                {analysisResult.status}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Document No.</p>
                                                <p className="font-medium text-lg">{analysisResult.regNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Detected Type</p>
                                                <p className="font-medium">{analysisResult.detectedType}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Owner Name</p>
                                                <p className="font-medium">{analysisResult.ownerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Expiry Date</p>
                                                <p className="font-medium">{analysisResult.expiryDate || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Class of Vehicle</p>
                                                <p className="font-medium">{analysisResult.classOfVehicle || "N/A"}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Issues</p>
                                                <p className="font-medium text-amber-600">{analysisResult.issues?.join(", ") || "None"}</p>
                                            </div>
                                        </div>

                                        {generatedToken && (
                                            <div className="mt-4 p-4 bg-zinc-900 text-white rounded-md">
                                                <p className="text-xs text-zinc-400 mb-1">VERIFICATION TOKEN</p>
                                                <div className="flex items-center justify-between">
                                                    <code className="text-lg font-mono tracking-wide">{generatedToken}</code>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => navigator.clipboard.writeText(generatedToken)}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recent Documents */}
                            <h3 className="font-semibold text-gray-700 mt-8">Recent Documents</h3>
                            <div className="space-y-2">
                                {selectedVehicle.documents?.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 bg-white border rounded-md">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            <span>{doc.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{doc.status}</Badge>
                                            {doc.token && (
                                                <span className="text-xs font-mono text-gray-400" title={doc.token}>
                                                    {doc.token.slice(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg p-12">
                            <Car size={48} className="mb-4 opacity-50" />
                            <p>Select a vehicle to manage documents</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
