"use client";

import { motion } from "framer-motion";

interface BackgroundPatternProps {
  variant?: "grid" | "dots" | "gradient" | "mesh";
  intensity?: "subtle" | "medium" | "strong";
  className?: string;
}

export function BackgroundPattern({
  variant = "mesh",
  intensity = "medium",
  className = "",
}: BackgroundPatternProps) {
  const opacityMap = {
    subtle: "opacity-20",
    medium: "opacity-30",
    strong: "opacity-40",
  };

  const opacity = opacityMap[intensity];

  if (variant === "grid") {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        <motion.div
          className={`bg-grid-pattern ${opacity}`}
          animate={{
            backgroundPosition: ["0% 0%", "40px 40px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        <motion.div
          className={`bg-dot-pattern ${opacity}`}
          animate={{
            backgroundPosition: ["0% 0%", "24px 24px"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        <motion.div
          className="absolute inset-0 bg-primary/15"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, var(--primary) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, var(--primary) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%)",
            ],
            opacity: [0.15, 0.2, 0.15, 0.15],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            mixBlendMode: "multiply",
          }}
        />
        <motion.div
          className="absolute inset-0 bg-primary/10"
          animate={{
            background: [
              "radial-gradient(circle at 80% 50%, var(--primary) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, var(--primary) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, var(--primary) 0%, transparent 50%)",
            ],
            opacity: [0.1, 0.15, 0.1, 0.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            mixBlendMode: "multiply",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background" />
      </div>
    );
  }

  // Mesh variant (default)
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full"
        animate={{
          x: [0, 100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.2,
        }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full"
        animate={{
          x: [0, -100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.15,
        }}
      />
      {/* Grid overlay */}
      <motion.div
        className={`bg-grid-pattern ${opacity}`}
        animate={{
          backgroundPosition: ["0% 0%", "40px 40px"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: "40px 40px",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
    </div>
  );
}

