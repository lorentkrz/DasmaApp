"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Playfair_Display, Lora } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
});

const lora = Lora({ subsets: ["latin", "latin-ext"], variable: "--font-lora" });

export default function InvitationCard() {
  // Details (can be wired to token data later)
  const details = {
    bride: "Benita",
    groom: "Mendim",
    date: "30 Qershor 2026",
    venue: 'Restaurant "Alegria"',
    city: "Prizren",
    reception: "19:00 – 20:00",
    families: "Me respekt, Familja Elezi",
    rsvp: "Ju lutemi konfirmoni pjesëmarrjen tuaj.",
  } as const;

  const monogram = `${details.bride[0]}${details.groom[0]}`;

  return (
    <div
      className={`border-2 w-screen overflow-y-auto h-full flex justify-center items-center overflow-y-auto ${playfair.variable} ${lora.variable}`}
    >
      <div className="relative flex flex-row w-[90vw] max-w-3xl aspect-[3/4] bg-white shadow-xl border-[12px] border-pink-50/70">
        {/* Decorative section */}
        <div className="w-1/2 justify-center items-center flex h-full relative">
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -2, 0, 2, 0] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ willChange: "transform" }}
            className="w-full h-full flex items-center justify-center"
          >
            <Image
              alt="test Flowers"
              src="/flowers-g.png"
              width={800}
              height={1200}
              className="object-fill -right-44 min-w-[1000px] absolute max-h-[1200px]"
            />
          </motion.div>
          {/* soft fade to keep text area clean */}
          <div
            aria-hidden
            className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/80 to-transparent"
          />
        </div>
        {/* Text section */}
        <div className="w-1/2 px-8 py-10 flex flex-col justify-between h-full">
          {/* Monogram */}
          <div className="flex justify-end">
            <span
              className="text-4xl tracking-wide text-gray-800"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {monogram}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* Lead line */}
            <p
              className="text-gray-700 text-[13px] leading-6 italic mb-5 text-right"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Tani e tutje ëndrrën do ta jetojmë bashkë — sot, nesër dhe
              përgjithmonë.
            </p>

            <p
              className="text-gray-800 text-sm mb-6 text-right"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Me kënaqësi të veçantë ju ftojmë të ndani gëzimin e martesës sonë.
            </p>

            {/* Names */}
            <div className="text-right mb-6">
              <div
                className="text-4xl md:text-5xl text-gray-900 tracking-tight leading-tight"
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontStyle: "italic",
                }}
              >
                {details.bride}
              </div>
              <div className="text-2xl text-gray-700 my-1">&amp;</div>
              <div
                className="text-4xl md:text-5xl text-gray-900 tracking-tight leading-tight"
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontStyle: "italic",
                }}
              >
                {details.groom}
              </div>
            </div>

            {/* Date */}
            <div
              className="text-right text-gray-900 text-lg font-medium mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {details.date}
            </div>

            {/* Venue */}
            <div
              className="text-right text-gray-700 text-sm space-y-1"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              <p>
                {details.venue} — {details.city}
              </p>
              <p className="tracking-wide">
                Pritja e mysafirëve: {details.reception}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-right space-y-2">
            <p
              className="text-[12px] text-gray-500"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {details.families}
            </p>
            <p
              className="text-[11px] text-gray-400"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {details.rsvp}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
