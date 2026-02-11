import Link from "next/link";
// import { Button } from "@/components/ui/button";
import { ShieldCheck, User } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-3xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tighter text-zinc-900">
            RCVE
          </h1>
          <p className="text-2xl font-light text-zinc-500 tracking-wide">
            Roadside Compliance Verification Engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <Link href="/auth?role=CITIZEN" className="group">
            <div className="h-64 flex flex-col items-center justify-center space-y-6 bg-white border border-zinc-200 rounded-none hover:border-zinc-900 transition-colors duration-300 p-8 cursor-pointer shadow-sm hover:shadow-md">
              <User size={48} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900">Citizen</h2>
                <p className="text-zinc-500 font-light">
                  Upload documents & Generate Tokens
                </p>
              </div>
            </div>
          </Link>

          <Link href="/auth?role=POLICE" className="group">
            <div className="h-64 flex flex-col items-center justify-center space-y-6 bg-zinc-900 border border-zinc-900 rounded-none hover:bg-zinc-800 transition-colors duration-300 p-8 cursor-pointer shadow-sm hover:shadow-md">
              <ShieldCheck size={48} className="text-zinc-400 group-hover:text-white transition-colors" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Police</h2>
                <p className="text-zinc-400 font-light">
                  Verify Tokens & Access Reports
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          SYSTEM_STATUS: ONLINE // GEMINI_AI: ACTIVE
        </div>
      </div>
    </main>
  );
}
