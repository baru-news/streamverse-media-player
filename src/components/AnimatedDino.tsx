import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const AnimatedDino = () => {
  const { user } = useAuth();
  const [showDino, setShowDino] = useState(true);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);

  useEffect(() => {
    // Show speech bubble after dino appears
    const speechTimer = setTimeout(() => {
      setShowSpeechBubble(true);
    }, 800);

    // Hide dino after welcome message for logged-in users
    let hideTimer: NodeJS.Timeout;
    if (user) {
      hideTimer = setTimeout(() => {
        setShowDino(false);
      }, 4000);
    }

    return () => {
      clearTimeout(speechTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [user]);

  return (
    <AnimatePresence>
      {showDino && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          {/* Arrow pointing to register button (only for non-logged in users) */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                x: [0, 10, 0]
              }}
              transition={{
                opacity: { delay: 1.2 },
                x: { 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }
              }}
              className="absolute -top-16 -left-32 text-primary"
            >
              <svg width="80" height="40" viewBox="0 0 80 40" className="fill-current">
                <path d="M10 20 L50 20 M45 15 L50 20 L45 25" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="25" y="35" className="text-sm font-medium fill-current">Daftar di sini!</text>
              </svg>
            </motion.div>
          )}

          {/* Speech Bubble */}
          <AnimatePresence>
            {showSpeechBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="absolute -top-20 -left-20 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-primary/20 min-w-[200px]"
              >
                <div className="text-sm font-medium text-foreground text-center">
                  {user ? (
                    <>Selamat datang di DINO18! 🦕</>
                  ) : (
                    <>Yuk daftar gratis di sini! 🎉</>
                  )}
                </div>
                {/* Speech bubble tail */}
                <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-primary/20 transform rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dino Character */}
          <motion.div
            initial={{ y: 100, scale: 0.8, opacity: 0 }}
            animate={{ 
              y: 0, 
              scale: [1, 1.02, 1], 
              opacity: 1,
              rotate: user ? [0, 15, -15, 15, 0] : [0, -10, 0]
            }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{
              y: { type: "spring", stiffness: 100, damping: 15, duration: 0.5 },
              opacity: { duration: 0.5 },
              scale: { 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              },
              rotate: user ? {
                duration: 1.5,
                ease: "easeInOut"
              } : {
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            className="relative"
          >
            {/* Dino SVG */}
            <svg width="120" height="140" viewBox="0 0 120 140" className="drop-shadow-lg">
              {/* Dino Body */}
              <ellipse cx="60" cy="90" rx="35" ry="45" fill="url(#dinoGradient)" />
              
              {/* Dino Head */}
              <ellipse cx="60" cy="45" rx="30" ry="35" fill="url(#dinoGradient)" />
              
              {/* Dino Arms */}
              <ellipse cx={user ? "35" : "25"} cy="70" rx="8" ry="20" fill="url(#dinoGradient)" transform={user ? "rotate(-20 35 70)" : "rotate(-45 25 70)"} />
              <ellipse cx="85" cy="70" rx="8" ry="20" fill="url(#dinoGradient)" transform="rotate(20 85 70)" />
              
              {/* Dino Legs */}
              <ellipse cx="45" cy="125" rx="10" ry="15" fill="url(#dinoGradient)" />
              <ellipse cx="75" cy="125" rx="10" ry="15" fill="url(#dinoGradient)" />
              
              {/* Dino Tail */}
              <ellipse cx="25" cy="100" rx="15" ry="8" fill="url(#dinoGradient)" transform="rotate(-30 25 100)" />
              
              {/* Dino Spikes */}
              <polygon points="50,15 45,5 55,5" fill="#7C3AED" />
              <polygon points="60,12 55,2 65,2" fill="#7C3AED" />
              <polygon points="70,15 65,5 75,5" fill="#7C3AED" />
              
              {/* Eyes */}
              <circle cx="52" cy="40" r="6" fill="white" />
              <circle cx="68" cy="40" r="6" fill="white" />
              <circle cx="54" cy="38" r="3" fill="black" />
              <circle cx="70" cy="38" r="3" fill="black" />
              
              {/* Eye shine */}
              <circle cx="55" cy="36" r="1" fill="white" />
              <circle cx="71" cy="36" r="1" fill="white" />
              
              {/* Mouth */}
              <path d="M 50 55 Q 60 65 70 55" stroke="#7C3AED" strokeWidth="2" fill="none" strokeLinecap="round" />
              
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="dinoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedDino;