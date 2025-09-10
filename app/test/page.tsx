"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  const [status, setStatus] = useState("Loading...");
  const [redirects, setRedirects] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setRedirects(prev => [...prev, "Page loaded at " + new Date().toISOString()]);

    // Check session without any redirects
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("✅ AUTHENTICATED - Session found");
        setRedirects(prev => [...prev, "Session check: AUTHENTICATED"]);
      } else {
        setStatus("❌ NOT AUTHENTICATED - No session");
        setRedirects(prev => [...prev, "Session check: NOT AUTHENTICATED"]);
      }
    });

    // Listen for auth changes but DON'T redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setRedirects(prev => [...prev, `Auth event: ${event} at ${new Date().toISOString()}`]);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Authentication Test</h1>
        <div className="mb-4">
          <p className="text-lg font-semibold">{status}</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Event Log:</h3>
          <div className="max-h-48 overflow-y-auto bg-gray-100 p-2 rounded text-sm">
            {redirects.map((redirect, index) => (
              <div key={index} className="mb-1">{redirect}</div>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <a href="/auth/login" className="bg-blue-500 text-white px-4 py-2 rounded">
            Go to Login
          </a>
          <a href="/dashboard" className="bg-green-500 text-white px-4 py-2 rounded">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
