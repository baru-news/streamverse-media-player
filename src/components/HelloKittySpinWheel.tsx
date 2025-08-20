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
        <div className="relative w-72 h-72">
          <div
            ref={wheelRef}
            className={cn(
              "w-full h-full rounded-full border-8 border-pink-400 relative overflow-hidden shadow-xl",
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
              const endAngle = (index + 1) * segmentAngle;
              
              return (
                <div
                  key={reward.id}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${startAngle}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.tan((segmentAngle * Math.PI) / 360) * 50}% 0%)`
                  }}
                >
                  <div className={cn(
                    "w-full h-full bg-gradient-to-r relative",
                    getRarityColor(reward.rarity)
                  )}>
                    {/* Segment Content */}
                    <div 
                      className="absolute top-4 left-1/2 transform -translate-x-1/2"
                      style={{ transform: `rotate(${segmentAngle / 2}deg)` }}
                    >
                      <div className={cn(
                        "text-center space-y-1",
                        getTextColor(reward.rarity)
                      )}>
                        <div className="text-xs font-bold truncate w-16">
                          {reward.name}
                        </div>
                        <div className="text-xs font-bold">
                          {reward.coin_amount}
                          <span className="text-yellow-600"> 🪙</span>
                        </div>
                        {/* Rarity indicator */}
                        <div className="text-xs">
                          {reward.rarity === 'legendary' && '👑'}
                          {reward.rarity === 'epic' && '⭐'}
                          {reward.rarity === 'rare' && '💎'}
                          {reward.rarity === 'common' && '🌸'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Center Hello Kitty Face */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-pink-400 flex items-center justify-center shadow-lg">
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
        <div className="bg-gradient-to-r from-pink-100 to-pink-200 border-2 border-pink-300 rounded-lg p-4 animate-bounce">
          <div className="text-center">
            <div className="text-pink-600 font-bold text-lg">🎉 Congratulations! 🎉</div>
            <div className="text-pink-800 font-semibold">
              You won: {lastWonReward.name}
            </div>
            <div className="text-pink-700">
              +{lastWonReward.coin_amount} coins! 🪙✨
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {disabled && (
        <div className="text-center bg-pink-50 border border-pink-200 rounded-lg p-3 max-w-sm">
          <p className="text-pink-600 text-sm font-medium">
            🌸 Complete all daily tasks to unlock the lucky wheel! 🌸
          </p>
        </div>
      )}
    </div>
  );
};

export default HelloKittySpinWheel;