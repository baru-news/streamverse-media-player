import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  calculateTargetAngle, 
  calculateAnimationDuration,
  getAnticipationAnimation,
  createEasingFunction 
} from '@/lib/spin-wheel-utils';

interface SpinWheelReward {
  id: string;
  name: string;
  coin_amount: number;
  rarity: string;
  probability: number;
  color: string;
  sort_order: number;
}

interface HelloKittySpinWheelProps {
  rewards: SpinWheelReward[];
  onSpin: (preSelectedReward?: SpinWheelReward) => Promise<SpinWheelReward | null>;
  onSelectReward: () => SpinWheelReward | null;
  spinning: boolean;
  disabled?: boolean;
}

const HelloKittySpinWheel: React.FC<HelloKittySpinWheelProps> = ({
  rewards,
  onSpin,
  onSelectReward,
  spinning,
  disabled = false
}) => {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [lastWonReward, setLastWonReward] = useState<SpinWheelReward | null>(null);
  const [animationDuration, setAnimationDuration] = useState(3000);

  const handleSpin = async () => {
    if (spinning || disabled || isAnimating) return;

    // Pre-select reward for precise targeting
    const selectedReward = onSelectReward();
    if (!selectedReward) return;

    setIsAnimating(true);

    // Calculate precise target angle for selected reward
    const targetAngle = calculateTargetAngle(rewards, selectedReward, rotation);
    const rotationDistance = Math.abs(targetAngle - rotation);
    const duration = calculateAnimationDuration(rotationDistance);
    
    setAnimationDuration(duration);

    // Anticipation animation - small backward rotation
    const anticipation = getAnticipationAnimation(rotation);
    
    // Apply anticipation
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${anticipation.anticipationDuration}ms ease-out`;
      wheelRef.current.style.transform = `rotate(${anticipation.anticipation}deg)`;
    }
    
    // After anticipation, start main spin animation
    setTimeout(() => {
      setRotation(targetAngle);
      
      // Start the backend process
      setTimeout(async () => {
        const wonReward = await onSpin(selectedReward);
        if (wonReward) {
          setLastWonReward(wonReward);
        }
        setIsAnimating(false);
      }, duration - 500); // Start backend call 500ms before animation ends
      
    }, anticipation.anticipationDuration);
  };

  const segmentAngle = 360 / rewards.length;

  // Hello Kitty color scheme
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-pink-200 to-pink-300';
      case 'rare': return 'from-pink-300 to-pink-400';
      case 'epic': return 'from-pink-400 to-pink-500';
      case 'legendary': return 'from-pink-500 to-pink-600';
      default: return 'from-pink-200 to-pink-300';
    }
  };

  const getTextColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-white';
      case 'epic': return 'text-white';
      default: return 'text-pink-800';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Wheel Container */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Decorative Hearts */}
        <div className="absolute -top-4 -left-4 text-pink-400 text-2xl animate-pulse">💕</div>
        <div className="absolute -top-4 -right-4 text-pink-400 text-2xl animate-pulse delay-1000">💖</div>
        <div className="absolute -bottom-4 -left-4 text-pink-400 text-2xl animate-pulse delay-500">💗</div>
        <div className="absolute -bottom-4 -right-4 text-pink-400 text-2xl animate-pulse delay-1500">💝</div>

        {/* Arrow Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-500 drop-shadow-lg">
          </div>
          <div className="text-yellow-600 text-xs font-bold text-center mt-1 drop-shadow-md">🎀</div>
        </div>

        {/* Spin Wheel - contained properly within bounds */}
        <div className="relative w-full h-full">
          <div
            ref={wheelRef}
            className={cn(
              "w-full h-full rounded-full border-4 border-pink-400 relative shadow-xl overflow-hidden",
              !isAnimating && "transition-transform duration-300 ease-out"
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isAnimating ? `transform ${animationDuration}ms ${createEasingFunction(animationDuration)}` : undefined,
              background: 'conic-gradient(from 0deg, #fdf2f8, #fce7f3, #fbcfe8, #f9a8d4, #f472b6, #ec4899, #db2777, #be185d)',
              willChange: isAnimating ? 'transform' : 'auto'
            }}
          >
            {rewards.map((reward, index) => {
              const startAngle = index * segmentAngle;
              
              return (
                <div key={reward.id}>
                  {/* Segment background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${startAngle}deg)`,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.tan((segmentAngle * Math.PI) / 360) * 50}% 0%)`
                    }}
                  >
                    <div className={cn(
                      "w-full h-full bg-gradient-to-r",
                      getRarityColor(reward.rarity)
                    )}>
                    </div>
                  </div>

                  {/* Separator line between segments */}
                  <div
                    className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-black/70 origin-bottom z-10"
                    style={{
                      transform: `rotate(${startAngle}deg)`,
                      transformOrigin: 'bottom center'
                    }}
                  ></div>
                </div>
              );
            })}

            {/* Text layer - rendered separately on top with highest z-index */}
            {rewards.map((reward, index) => {
              const startAngle = index * segmentAngle;
              const centerAngle = startAngle + (segmentAngle / 2); // Center of the segment
              
              return (
                <div
                  key={`text-${reward.id}`}
                  className="absolute inset-0 pointer-events-none z-30"
                >
                  {/* Segment text - positioned exactly in center of segment */}
                  <div 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 origin-bottom z-40"
                    style={{ 
                      transform: `rotate(${centerAngle}deg)`,
                      transformOrigin: 'center bottom',
                      height: '50%' // Only use half the radius
                    }}
                  >
                    <div className={cn(
                      "absolute top-4 left-1/2 transform -translate-x-1/2 text-center w-16 pointer-events-none",
                      getTextColor(reward.rarity),
                      // Add text shadow for better visibility
                      "drop-shadow-md"
                    )}>
                      <div className="text-xs font-bold leading-tight break-words drop-shadow-sm mb-1">
                        {reward.name}
                      </div>
                      <div className="text-sm font-bold leading-tight drop-shadow-sm mb-0.5">
                        {reward.coin_amount}
                      </div>
                      <div className="text-xs leading-none drop-shadow-sm mb-0.5">
                        🪙
                      </div>
                      {/* Rarity indicator */}
                      <div className="text-xs leading-none drop-shadow-sm">
                        {reward.rarity === 'legendary' && '👑'}
                        {reward.rarity === 'epic' && '⭐'}
                        {reward.rarity === 'rare' && '💎'}
                        {reward.rarity === 'common' && '🌸'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Center Hello Kitty Face */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-pink-400 flex items-center justify-center shadow-lg z-20">
              <div className="text-2xl">🐱</div>
            </div>
          </div>
        </div>

        {/* Paw Print Decorations */}
        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-pink-300 text-xl opacity-50">
          🐾
        </div>
        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-pink-300 text-xl opacity-50">
          🐾
        </div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={spinning || disabled || isAnimating}
        className={cn(
          "px-8 py-3 rounded-full font-bold text-white shadow-lg transform transition-all duration-200",
          "bg-gradient-to-r from-pink-400 to-pink-500",
          "hover:from-pink-500 hover:to-pink-600 hover:scale-105 hover:shadow-xl",
          "active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          (spinning || isAnimating) && "animate-pulse"
        )}
      >
        {spinning || isAnimating ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Spinning... ✨
          </span>
        ) : (
          <span className="flex items-center gap-2">
            🎀 Spin the Wheel! 🎀
          </span>
        )}
      </button>

      {/* Last Won Display */}
      {lastWonReward && (
        <div className={cn(
          "bg-gradient-to-r from-pink-100 to-pink-200 border-2 border-pink-300 rounded-lg p-5",
          lastWonReward.rarity === 'legendary' ? "animate-wheel-glow" : "animate-victory-bounce"
        )}>
          <div className="text-center">
            <div className="text-pink-700 font-bold text-xl mb-2">
              🎉 Selamat! 🎉
              {lastWonReward.rarity === 'legendary' && ' 👑'}
              {lastWonReward.rarity === 'epic' && ' ⭐'}
            </div>
            <div className="text-pink-900 font-bold text-lg mb-1">
              Anda memenangkan: {lastWonReward.name}
            </div>
            <div className="text-pink-800 font-bold text-lg">
              +{lastWonReward.coin_amount} koin! 🪙✨
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {disabled && (
        <div className="text-center bg-pink-50 border border-pink-200 rounded-lg p-4 max-w-sm">
          <p className="text-pink-700 text-base font-bold leading-relaxed">
            🗝️ Kumpulkan Kitty Key untuk memutar roda beruntung! 🌸
          </p>
        </div>
      )}
    </div>
  );
};

export default HelloKittySpinWheel;