"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, User, Loader2, RefreshCw, Eye } from "lucide-react";
import { signOut } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface UserData {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    _count: {
        vehicles: number;
        documents: number;
    }
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [viewUser, setViewUser] = useState<any | null>(null);
    const [viewOpen, setViewOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        setDeleting(id);
        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDeleting(null);
        }
    };

    const handleView = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/users?id=${id}`);
            const data = await res.json();
            if (data.success) {
                setViewUser(data.user);
                setViewOpen(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-red-600" /> Admin Console
                    </h1>
                    <p className="text-slate-500">Manage users and system integrity</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchUsers}><RefreshCw size={16} className="mr-2" /> Refresh</Button>
                    <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>Logout</Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-slate-400" size={32} />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Stats</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{user.username}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "POLICE" ? "secondary" : "default"} className={user.role === "POLICE" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : ""}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex gap-3">
                                                <span title="Vehicles">Vehicles: {user._count.vehicles}</span>
                                                <span title="Documents">Docs: {user._count.documents}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleView(user.id)}
                                            >
                                                <Eye size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(user.id)}
                                                disabled={deleting === user.id}
                                            >
                                                {deleting === user.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>Viewing data for {viewUser?.username}</DialogDescription>
                    </DialogHeader>
                    {viewUser && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Documents</h3>
                                {viewUser.documents?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {viewUser.documents.map((doc: any) => (
                                            <div key={doc.id} className="border p-4 rounded-lg bg-gray-50">
                                                <p className="font-medium text-sm mb-2">{doc.type} - <Badge variant={doc.status === "VALID" ? "default" : "destructive"}>{doc.status}</Badge></p>
                                                {doc.imageUrl && (
                                                    <img src={doc.imageUrl} className="w-full h-48 object-cover rounded border" />
                                                )}
                                                <div className="mt-2 text-xs text-gray-500 font-mono overflow-hidden text-ellipsis">Token: {doc.token}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500">No documents found.</p>}
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-3">Vehicles & Related Docs</h3>
                                {viewUser.vehicles?.length > 0 ? (
                                    <div className="space-y-4">
                                        {viewUser.vehicles.map((v: any) => (
                                            <div key={v.id} className="border p-4 rounded-lg bg-gray-50">
                                                <div className="flex justify-between mb-3 border-b pb-2">
                                                    <span className="font-bold">{v.regNumber} ({v.model})</span>
                                                    <Badge variant="outline">{v.type}</Badge>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {v.documents?.map((doc: any) => (
                                                        <div key={doc.id} className="bg-white p-2 rounded border">
                                                            <p className="text-xs font-semibold mb-1">{doc.type}</p>
                                                            {doc.imageUrl && (
                                                                <img src={doc.imageUrl} className="w-full h-32 object-cover rounded border" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500">No vehicles found.</p>}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
