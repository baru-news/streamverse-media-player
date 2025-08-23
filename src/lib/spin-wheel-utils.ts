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
 * Selects a reward based on probability weights - FOR BACKEND VALIDATION ONLY
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
 * Selects a reward based on visual wheel position - FOR ACCURATE SPIN TARGETING
 */
export const selectRewardByWheelPosition = (rewards: SpinWheelReward[]): { reward: SpinWheelReward; targetIndex: number } => {
  if (!rewards.length) return { reward: rewards[0], targetIndex: 0 };
  
  // For visual accuracy, we need to select where the pin will land
  // Use weighted random but ensure it corresponds to actual wheel position
  const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0);
  const random = Math.random() * totalProbability;
  
  let currentSum = 0;
  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i];
    currentSum += reward.probability;
    if (random <= currentSum) {
      console.log(`🎯 Selected reward for visual landing: "${reward.name}" at index ${i}`);
      return { reward, targetIndex: i };
    }
  }
  
  return { reward: rewards[0], targetIndex: 0 }; // Fallback
};

/**
 * Calculates precise target angle for a specific reward at specific index
 */
export const calculateTargetAngle = (
  rewards: SpinWheelReward[], 
  targetIndex: number,
  currentRotation: number
): number => {
  const segmentAngle = 360 / rewards.length;
  
  // Calculate the center angle of the winning segment
  // Segments start from top (0°) and go clockwise
  const segmentCenterAngle = (targetIndex * segmentAngle) + (segmentAngle / 2);
  
  // Add multiple full rotations for dramatic effect (4-7 rotations)
  const fullRotations = 4 + Math.random() * 3;
  const additionalRotations = fullRotations * 360;
  
  // To align the winning segment with the pointer (at top/0°):
  // We need to rotate so that the segment center is at the pointer position
  // The wheel rotates, so we need to position the segment at 0°
  const finalTargetAngle = currentRotation + additionalRotations + (360 - segmentCenterAngle);
  
  const selectedReward = rewards[targetIndex];
  console.log(`🎯 Precise spin calculation:
    - Target reward: "${selectedReward?.name}" (${selectedReward?.coin_amount} coins)
    - Target index: ${targetIndex}
    - Total segments: ${rewards.length}
    - Segment angle: ${segmentAngle}°
    - Segment center angle: ${segmentCenterAngle}°
    - Current rotation: ${currentRotation}°
    - Additional rotations: ${additionalRotations}°
    - Final target angle: ${finalTargetAngle}°
    - Pin will land at: segment ${targetIndex}`);
  
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