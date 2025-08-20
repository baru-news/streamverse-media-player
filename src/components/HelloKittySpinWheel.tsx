import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SpinWheelReward {
  id: string;
  name: string;
  coin_amount: number;
  rarity: string;
  color: string;
  sort_order: number;
}

interface HelloKittySpinWheelProps {
  rewards: SpinWheelReward[];
  onSpin: () => Promise<SpinWheelReward | null>;
  spinning: boolean;
  disabled?: boolean;
}

const HelloKittySpinWheel: React.FC<HelloKittySpinWheelProps> = ({
  rewards,
  onSpin,
  spinning,
  disabled = false
}) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [lastWonReward, setLastWonReward] = useState<SpinWheelReward | null>(null);

  const handleSpin = async () => {
    if (spinning || disabled) return;

    // Generate random spin rotation (multiple full rotations + random position)
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const finalAngle = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + finalAngle;

    setRotation(totalRotation);

    // Perform the actual spin
    const wonReward = await onSpin();
    
    if (wonReward) {
      setLastWonReward(wonReward);
      
      // Calculate which segment was won and adjust rotation to point to it
      const segmentAngle = 360 / rewards.length;
      const rewardIndex = rewards.findIndex(r => r.id === wonReward.id);
      const targetAngle = (rewardIndex * segmentAngle) + (segmentAngle / 2);
      
      // Adjust final rotation to point arrow to winning segment
      const adjustedRotation = totalRotation - (finalAngle - targetAngle);
      setRotation(adjustedRotation);
    }
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
      {/* Hello Kitty Decorations */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-pink-600">🎀 Hello Kitty Lucky Wheel 🎀</h2>
        <p className="text-pink-500 text-sm">Spin for magical rewards! ✨</p>
      </div>

      {/* Wheel Container */}
      <div className="relative">
        {/* Decorative Hearts */}
        <div className="absolute -top-4 -left-4 text-pink-400 text-2xl animate-pulse">💕</div>
        <div className="absolute -top-4 -right-4 text-pink-400 text-2xl animate-pulse delay-1000">💖</div>
        <div className="absolute -bottom-4 -left-4 text-pink-400 text-2xl animate-pulse delay-500">💗</div>
        <div className="absolute -bottom-4 -right-4 text-pink-400 text-2xl animate-pulse delay-1500">💝</div>

        {/* Arrow Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-pink-600">
          </div>
          <div className="text-pink-600 text-xs font-bold text-center mt-1">🎀</div>
        </div>

        {/* Spin Wheel */}
        <div className="relative w-80 h-80">
          <div
            ref={wheelRef}
            className={cn(
              "w-full h-full rounded-full border-8 border-pink-400 relative shadow-xl",
              "transition-transform duration-4000 ease-out",
              spinning && "animate-spin-slow"
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              background: 'conic-gradient(from 0deg, #fdf2f8, #fce7f3, #fbcfe8, #f9a8d4, #f472b6, #ec4899, #db2777, #be185d)'
            }}
          >
            {rewards.map((reward, index) => {
              const startAngle = index * segmentAngle;
              const midAngle = startAngle + (segmentAngle / 2);
              const radians = (midAngle * Math.PI) / 180;
              
              // Calculate text position
              const radius = 100; // Distance from center
              const x = Math.cos(radians - Math.PI / 2) * radius;
              const y = Math.sin(radians - Math.PI / 2) * radius;
              
              return (
                <div key={reward.id}>
                  {/* Segment background */}
                  <div
                    className="absolute w-full h-full"
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
                  
                  {/* Text positioned absolutely */}
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    <div className={cn(
                      "text-center space-y-0.5 w-16",
                      getTextColor(reward.rarity)
                    )}>
                      <div className="text-xs font-bold leading-tight break-words">
                        {reward.name}
                      </div>
                      <div className="text-sm font-bold leading-tight">
                        {reward.coin_amount}
                      </div>
                      <div className="text-xs leading-none">
                        🪙
                      </div>
                      <div className="text-xs leading-none">
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full border-4 border-pink-400 flex items-center justify-center shadow-lg z-10">
              <div className="text-3xl">🐱</div>
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
        disabled={spinning || disabled}
        className={cn(
          "px-8 py-3 rounded-full font-bold text-white shadow-lg transform transition-all duration-200",
          "bg-gradient-to-r from-pink-400 to-pink-500",
          "hover:from-pink-500 hover:to-pink-600 hover:scale-105 hover:shadow-xl",
          "active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          spinning && "animate-pulse"
        )}
      >
        {spinning ? (
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
        <div className="bg-gradient-to-r from-pink-100 to-pink-200 border-2 border-pink-300 rounded-lg p-5 animate-bounce">
          <div className="text-center">
            <div className="text-pink-700 font-bold text-xl mb-2">🎉 Selamat! 🎉</div>
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
            🌸 Selesaikan semua tugas harian untuk membuka roda beruntung! 🌸
          </p>
        </div>
      )}
    </div>
  );
};

export default HelloKittySpinWheel;