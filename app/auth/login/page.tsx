"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Ensure the session is properly established before redirecting
      if (data?.session) {
        console.log("Login successful, session established");

        // Force a small delay to ensure cookies are set
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if we need to redirect to a specific page
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirectedFrom") || "/dashboard";

        // Use window.location for more reliable redirect after auth
        window.location.href = redirectTo;
      } else {
        throw new Error("Sesioni nuk u krijua");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Ndodhi një gabim");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel with storytelling */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center opacity-10">
          <Heart className="h-[450px] w-[450px] text-rose-200" />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1
            className={`${cormorant.className} text-4xl font-bold text-gray-800 mb-4`}
          >
            Dasma ERP
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Një ERP e krijuar posaçërisht për ditën më të rëndësishme. Organizim
            i përsosur, stil elegant dhe gjithçka në një vend.
          </p>
        </div>
      </div>

      {/* Right panel with form */}
      <div className="flex items-center justify-center bg-white">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-rose-100 shadow-2xl rounded-2xl mx-6">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-rose-100 rounded-full">
                <Heart className="h-6 w-6 text-rose-500" />
              </div>
            </div>
            <CardTitle
              className={`${cormorant.className} text-3xl font-bold text-gray-800`}
            >
              Mirë se u ktheve
            </CardTitle>
            <p className="text-sm text-gray-500">
              Hyr për të vazhduar me organizimin e dasmës
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-gray-700 font-medium"
                  >
                    <Mail className="h-4 w-4 text-rose-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="shembull@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-md border-rose-100 focus:border-rose-300 focus:ring-rose-200 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <Lock className="h-4 w-4 text-rose-400" />
                      Fjalëkalimi
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-rose-600 hover:text-rose-700 hover:underline font-medium"
                    >
                      E harruat?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Shkruani fjalëkalimin tuaj"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-md border-rose-100 focus:border-rose-300 focus:ring-rose-200 bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3">
                  <p className="text-sm text-rose-700 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full font-semibold py-3 text-base bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Duke hyrë...
                  </div>
                ) : (
                  "Kyçu"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
