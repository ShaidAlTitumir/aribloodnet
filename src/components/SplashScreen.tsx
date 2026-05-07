import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white flex justify-center items-center overflow-hidden"
        >
          <div className="text-center space-y-8 px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="relative inline-block"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-100 border border-red-100">
                <Heart className="w-12 h-12 md:w-16 md:h-16 text-primary fill-current animate-pulse" />
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full border-4 border-white"
              />
            </motion.div>

            <div className="space-y-4">
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary"
              >
                ARI Blood Net
              </motion.p>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter"
              >
                Saving Lives, Together
              </motion.h1>
              
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm md:text-xl font-black uppercase tracking-[0.3em] text-on-surface-variant/40"
              >
                Al-Ribat International
              </motion.p>
            </div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="max-w-[200px] mx-auto h-1 bg-surface-container-high rounded-full overflow-hidden"
            >
              <div className="h-full bg-primary w-full" />
            </motion.div>
          </div>

          {/* Background Accents */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
