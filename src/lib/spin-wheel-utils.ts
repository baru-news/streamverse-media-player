interface SpinWheelReward {
  id: string;
  name: string;
  coin_amount: number;
  rarity: string;
  probability: number;
  color: string;
  sort_order: number;
}

/**
 * Selects a reward based on probability weights
 */
export const selectRewardByProbability = (rewards: SpinWheelReward[]): SpinWheelReward | null => {
  if (!rewards.length) return null;
  
  const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0);
  const random = Math.random() * totalProbability;
  
  let currentSum = 0;
  for (const reward of rewards) {
    currentSum += reward.probability;
    if (random <= currentSum) {
      return reward;
    }
  }
  
  return rewards[0]; // Fallback
};

/**
 * Calculates precise target angle for a specific reward
 */
export const calculateTargetAngle = (
  rewards: SpinWheelReward[], 
  selectedReward: SpinWheelReward,
  currentRotation: number
): number => {
  const segmentAngle = 360 / rewards.length;
  const rewardIndex = rewards.findIndex(r => r.id === selectedReward.id);
  
  // Calculate the center angle of the winning segment
  const targetSegmentCenter = (rewardIndex * segmentAngle) + (segmentAngle / 2);
  
  // Add multiple full rotations for dramatic effect (4-7 rotations)
  const fullRotations = 4 + Math.random() * 3;
  const additionalRotations = fullRotations * 360;
  
  // Calculate final angle - we want the pointer (at top) to point to the center of winning segment
  // Since pointer is at top (0°), we need to rotate so that the winning segment is at top
  const finalTargetAngle = currentRotation + additionalRotations + (360 - targetSegmentCenter);
  
  return finalTargetAngle;
};

/**
 * Creates smooth easing function for wheel animation
 */
export const createEasingFunction = (duration: number) => {
  return `cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
};

/**
 * Calculates animation duration based on rotation distance
 */
export const calculateAnimationDuration = (rotationDistance: number): number => {
  // Base duration of 3 seconds, with slight variation based on distance
  const baseDuration = 3000;
  const variationFactor = Math.min(rotationDistance / 1800, 1) * 500; // Max 500ms variation
  return baseDuration + variationFactor;
};

/**
 * Generates anticipation animation values
 */
export const getAnticipationAnimation = (currentRotation: number) => {
  return {
    start: currentRotation,
    anticipation: currentRotation - 15, // Small backward rotation
    anticipationDuration: 200
  };
};