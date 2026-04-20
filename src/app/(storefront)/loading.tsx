"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Animated Hanger SVG */}
        <motion.svg
          viewBox="0 0 100 60"
          className="w-24 h-auto text-black"
          initial={{ rotate: -5 }}
          animate={{ rotate: 5 }}
          transition={{
            repeat: Infinity,
            repeatType: "mirror",
            duration: 1.2,
            ease: "easeInOut",
          }}
        >
          {/* Hanger Hook */}
          <path
            d="M50 5 Q55 5, 55 10 Q55 15, 50 15 Q45 15, 45 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Hanger Main Body */}
          <path
            d="M50 15 L5 45 L95 45 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Horizontal Bar */}
          <line
            x1="5"
            y1="45"
            x2="95"
            y2="45"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.svg>

        {/* Pulsing ring around the hanger */}
        <motion.div
          className="absolute inset-0 border-2 border-gray-100 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeOut"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-col items-center"
      >
        <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-gray-900">instalook</h2>
        <p className="text-[10px] font-medium text-gray-400 mt-2 tracking-[0.3em] uppercase animate-pulse">
          Crafting your style...
        </p>
      </motion.div>
    </div>
  );
}
