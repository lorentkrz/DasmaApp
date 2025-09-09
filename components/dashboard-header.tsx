"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Menu, X, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Playfair_Display,
  Great_Vibes,
  Cormorant_Garamond,
  Dancing_Script,
} from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
});
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface DashboardHeaderProps {
  user: SupabaseUser;
  profile: Profile | null;
  weddings?: any[];
}

export function DashboardHeader({
  user,
  profile,
  weddings,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user.email;

  const initials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`
      : user.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      <header className="relative bg-gradient-to-r from-stone-50 via-rose-50 to-amber-50 border-b border-stone-200/50 backdrop-blur-sm">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-8 w-8 h-8">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="8" r="2" fill="#E8B4CB" />
              <circle cx="12" cy="12" r="1.5" fill="#F5E6A3" />
              <circle cx="20" cy="14" r="1" fill="#C8A2C8" />
            </svg>
          </div>
          <div className="absolute top-3 right-12 w-6 h-6">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <circle cx="12" cy="6" r="1.5" fill="#F0E68C" />
              <circle cx="8" cy="10" r="1" fill="#E8B4CB" />
              <circle cx="16" cy="12" r="1.2" fill="#C8A2C8" />
            </svg>
          </div>
        </div>

        <div className="relative flex items-center justify-between px-4 md:px-6 py-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-stone-100/50 text-stone-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo/Brand */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-2xl text-stone-700">♥</div>
            <h1
              className={`${dancingScript.className} text-xl font-medium text-stone-700`}
            >
              Dasma ERP
            </h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:bg-stone-100/50"
                >
                  <Avatar className="h-10 w-10 border-2 border-stone-200/50">
                    <AvatarImage
                      src={profile?.avatar_url || ""}
                      alt={displayName || ""}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-stone-100 to-rose-100 text-stone-700 font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white/95 backdrop-blur-sm border-stone-200/50 shadow-xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p
                      className={`${cormorant.className} text-sm font-medium leading-none text-stone-800`}
                    >
                      {displayName}
                    </p>
                    <p
                      className={`${cormorant.className} text-xs leading-none text-stone-600`}
                    >
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-stone-200/50" />
                <DropdownMenuItem asChild>
                  <button
                    className={`${cormorant.className} w-full flex items-center hover:bg-stone-50 text-stone-700`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profili</span>
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    className={`${cormorant.className} w-full flex items-center hover:bg-stone-50 text-stone-700`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cilësimet</span>
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-stone-200/50" />
                <DropdownMenuItem asChild>
                  <button
                    className={`${cormorant.className} w-full flex items-center text-rose-600 hover:bg-rose-50 focus:text-rose-600`}
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Dilni</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-stone-200/50">
            <DashboardSidebar weddings={weddings || []} />
          </div>
        </div>
      )}
    </>
  );
}
