import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
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
  onSpin: (preSelectedData?: { finalAngle: number; rewardData: { reward: SpinWheelReward; targetIndex: number } }) => Promise<SpinWheelReward | null>;
  onSelectReward: () => { finalAngle: number; rewardData: { reward: SpinWheelReward; targetIndex: number } } | null;
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

    // Generate spin data with final angle
    const spinData = onSelectReward();
    if (!spinData) return;

    const { finalAngle, rewardData } = spinData;
    
    console.log('🎯 SIMPLE SPIN SYSTEM:', {
      finalAngle,
      targetReward: rewardData.reward.name,
      targetIndex: rewardData.targetIndex
    });
    
    setIsAnimating(true);

    // Calculate total rotation distance for exciting animation
    // Ensure we always get minimum rotations regardless of current position
    const totalRotation = finalAngle - rotation;
    const rotationDistance = Math.abs(totalRotation);
    
    // Use fixed exciting duration - don't rely on distance calculation
    const duration = Math.max(2500, Math.min(4000, 2500 + (rotationDistance / 2000) * 1500));
    
    setAnimationDuration(duration);

    // Anticipation animation
    const anticipation = getAnticipationAnimation(rotation);
    
    // Apply anticipation
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${anticipation.anticipationDuration}ms ease-out`;
      wheelRef.current.style.transform = `rotate(${anticipation.anticipation}deg)`;
    }
    
    // Main spin to final angle
    setTimeout(() => {
      setRotation(finalAngle);
      
      // Start backend process
      setTimeout(async () => {
        const wonReward = await onSpin(spinData);
        if (wonReward) {
          setLastWonReward(wonReward);
        }
        setIsAnimating(false);
      }, duration - 500);
      
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
    <div className="flex flex-col items-center space-y-8">
      {/* Wheel Container with Enhanced Styling */}
      <div className="relative w-96 h-96 mx-auto">
        {/* Floating Magic Stars */}
        <div className="absolute -top-8 -left-8 text-3xl animate-bounce" style={{animationDelay: '0s'}}>✨</div>
        <div className="absolute -top-6 -right-10 text-2xl animate-bounce" style={{animationDelay: '1s'}}>⭐</div>
        <div className="absolute -bottom-8 -left-10 text-3xl animate-bounce" style={{animationDelay: '2s'}}>🌟</div>
        <div className="absolute -bottom-6 -right-8 text-2xl animate-bounce" style={{animationDelay: '0.5s'}}>💫</div>
        
        {/* Orbiting Hearts */}
        <div className="absolute inset-0 animate-spin" style={{animationDuration: '20s'}}>
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-pink-400 text-xl">💕</div>
          <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 text-pink-400 text-xl">💖</div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-pink-400 text-xl">💗</div>
          <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 text-pink-400 text-xl">💝</div>
        </div>

        {/* Enhanced Arrow Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-50">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-yellow-300 rounded-full blur-sm opacity-60 scale-125"></div>
            {/* Arrow */}
            <div className="relative w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-500 drop-shadow-2xl">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-300"></div>
            </div>
          </div>
          <div className="text-2xl text-center mt-2 drop-shadow-lg animate-pulse">🎀</div>
        </div>

        {/* Spin Wheel with Enhanced Design */}
        <div className="relative w-full h-full z-10">
          <div
            ref={wheelRef}
            className={cn(
              "w-full h-full rounded-full border-6 relative overflow-hidden z-20",
              "shadow-[0_0_40px_rgba(236,72,153,0.4),inset_0_0_40px_rgba(255,255,255,0.1)]",
              "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent before:z-10",
              !isAnimating && "transition-transform duration-300 ease-out"
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isAnimating ? `transform ${animationDuration}ms ${createEasingFunction(animationDuration)}` : undefined,
              background: 'conic-gradient(from 0deg, hsl(326, 87%, 95%), hsl(322, 86%, 92%), hsl(318, 85%, 88%), hsl(314, 84%, 82%), hsl(310, 83%, 75%), hsl(306, 82%, 68%), hsl(302, 81%, 60%), hsl(298, 80%, 52%))',
              border: '6px solid hsl(326, 100%, 74%)',
              willChange: isAnimating ? 'transform' : 'auto'
            }}
          >
            {rewards.map((reward, index) => {
              const startAngle = index * segmentAngle;
              
              console.log(`🎨 Rendering segment ${index}: ${reward.name} at angle ${startAngle}°`);
              
              return (
                <div key={reward.id}>
                  {/* Enhanced Segment background with glow effects */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${startAngle}deg)`,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.tan((segmentAngle * Math.PI) / 360) * 50}% 0%)`
                    }}
                  >
                    <div className={cn(
                      "w-full h-full bg-gradient-to-r relative",
                      getRarityColor(reward.rarity),
                      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:to-transparent",
                      "after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/10 after:to-transparent"
                    )}>
                      {/* Shimmer effect for legendary items */}
                      {reward.rarity === 'legendary' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Separator line between segments */}
                  <div
                    className="absolute top-0 left-1/2 w-1 h-1/2 bg-gradient-to-b from-pink-600/80 to-pink-300/60 origin-bottom z-10 shadow-md"
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
              
              console.log(`📝 Rendering text for segment ${index}: ${reward.name} at center angle ${centerAngle}°`);
              
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

            {/* Enhanced Center Hello Kitty Face */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full blur-sm opacity-60 animate-pulse scale-110"></div>
              
              {/* Main center circle */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-white via-pink-50 to-pink-100 rounded-full border-4 border-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
                <div className="relative text-3xl animate-pulse">🐱</div>
                
                {/* Floating sparkles around center */}
                <div className="absolute -top-2 -right-2 text-yellow-300 text-sm animate-bounce" style={{animationDelay: '0s'}}>✨</div>
                <div className="absolute -bottom-2 -left-2 text-pink-300 text-sm animate-bounce" style={{animationDelay: '1s'}}>💖</div>
              </div>
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

      {/* Enhanced Spin Button */}
      <button
        onClick={handleSpin}
        disabled={spinning || disabled || isAnimating}
        className={cn(
          "relative px-10 py-4 rounded-full font-bold text-white shadow-2xl transform transition-all duration-300 overflow-hidden",
          "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500",
          "hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 hover:scale-110 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]",
          "active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-full",
          "after:absolute after:inset-0 after:bg-gradient-to-br after:from-transparent after:via-transparent after:to-black/10 after:rounded-full",
          (spinning || isAnimating) && "animate-pulse"
        )}
      >
        {/* Button glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 rounded-full blur-lg opacity-30 animate-pulse"></div>
        
        <span className="relative z-10 flex items-center gap-3 text-lg">
          {spinning || isAnimating ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Spinning... ✨
            </>
          ) : (
            <>
              🎀 Spin the Wheel! 🎀
            </>
          )}
        </span>
      </button>

      {/* Enhanced Last Won Display */}
      {lastWonReward && (
        <div className={cn(
          "relative bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border-4 border-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 rounded-xl p-6 shadow-2xl overflow-hidden",
          lastWonReward.rarity === 'legendary' && "animate-pulse shadow-[0_0_40px_rgba(255,215,0,0.5)]",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:to-transparent before:rounded-xl"
        )}>
          {/* Confetti effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute -top-4 -left-4 text-2xl animate-bounce" style={{animationDelay: '0s'}}>🎊</div>
            <div className="absolute -top-2 -right-6 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>🎉</div>
            <div className="absolute -bottom-4 -right-4 text-2xl animate-bounce" style={{animationDelay: '1s'}}>✨</div>
            <div className="absolute -bottom-2 -left-6 text-xl animate-bounce" style={{animationDelay: '1.5s'}}>🌟</div>
          </div>
          
          <div className="relative text-center z-10">
            <div className="text-pink-700 font-bold text-2xl mb-3 drop-shadow-lg">
              🎉 Selamat! 🎉
              {lastWonReward.rarity === 'legendary' && ' 👑'}
              {lastWonReward.rarity === 'epic' && ' ⭐'}
            </div>
            <div className="text-pink-900 font-bold text-xl mb-2 drop-shadow-md">
              Anda memenangkan: {lastWonReward.name}
            </div>
            <div className="text-pink-800 font-bold text-xl drop-shadow-md bg-gradient-to-r from-yellow-200 to-yellow-300 px-4 py-2 rounded-lg inline-block">
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