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
 * SIMPLE DETERMINISTIC SYSTEM: 
 * Select reward based on final wheel angle position
 */
export const selectRewardByFinalAngle = (
  rewards: SpinWheelReward[], 
  finalAngle: number
): { reward: SpinWheelReward; targetIndex: number } => {
  if (!rewards.length) return { reward: rewards[0], targetIndex: 0 };
  
  // Normalize angle to 0-360 range
  const normalizedAngle = ((finalAngle % 360) + 360) % 360;
  
  // CRITICAL FIX: The wheel pointer is at top (0°), but segments start from 0°
  // We need to account for the fact that the pointer points to the TOP of the wheel
  // Each segment has a center angle, and we need to find which segment the pointer hits
  const segmentAngle = 360 / rewards.length;
  
  // Calculate which segment the TOP pointer (0°) points to
  // The pointer points "down" into the wheel, so we need to find which segment it hits
  let targetIndex = Math.floor((360 - normalizedAngle) / segmentAngle);
  
  // Handle edge case where angle is exactly 0 or 360
  if (targetIndex >= rewards.length) {
    targetIndex = 0;
  }
  
  const selectedReward = rewards[targetIndex];
  
  console.log(`🎯 ACCURATE POINTER CALCULATION:
    - Final wheel angle: ${finalAngle}° 
    - Normalized wheel: ${normalizedAngle}°
    - Segment size: ${segmentAngle}°
    - Pointer hits segment: ${targetIndex}
    - Reward: "${selectedReward.name}" (${selectedReward.coin_amount} coins)
    - Segment start angle: ${targetIndex * segmentAngle}°
    - Segment end angle: ${(targetIndex + 1) * segmentAngle}°`);
  
  return { reward: selectedReward, targetIndex };
};

/**
 * EXCITING SPIN CALCULATION:
 * Ensures fast spinning for at least 1 second before finding target
 */
export const calculateSpinTarget = (
  rewards: SpinWheelReward[],
  currentRotation: number
): { finalAngle: number; rewardData: { reward: SpinWheelReward; targetIndex: number } } => {
  // Ensure minimum 5 full rotations for exciting spin (at least 1800°)
  const minRotations = 5;
  const extraRotations = Math.random() * 4; // 0-4 additional rotations
  const totalRotations = minRotations + extraRotations;
  
  // Random position within 360° for final landing
  const randomAngle = Math.random() * 360;
  const finalAngle = currentRotation + (totalRotations * 360) + randomAngle;
  
  // Determine what reward will be selected at this angle
  const rewardData = selectRewardByFinalAngle(rewards, finalAngle);
  
  console.log(`🎲 EXCITING SPIN CALCULATION:
    - Current rotation: ${currentRotation}°
    - Minimum rotations: ${minRotations} (${minRotations * 360}°)
    - Extra rotations: ${extraRotations.toFixed(2)} (${(extraRotations * 360).toFixed(0)}°)
    - Total rotations: ${totalRotations.toFixed(2)} (${(totalRotations * 360).toFixed(0)}°)
    - Random final position: ${randomAngle.toFixed(0)}°
    - Final angle: ${finalAngle.toFixed(0)}°
    - Will land on: "${rewardData.reward.name}"`);
  
  return { finalAngle, rewardData };
};

/**
 * Creates smooth easing function for wheel animation
 */
export const createEasingFunction = (duration: number) => {
  return `cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
};

/**
 * Calculates exciting animation duration - minimum 2.5 seconds for satisfying spin
 */
export const calculateAnimationDuration = (rotationDistance: number): number => {
  // Ensure minimum 2.5 seconds for exciting feel, up to 4 seconds for long spins
  const minDuration = 2500;
  const maxDuration = 4000;
  
  // Calculate duration based on rotation distance (more spins = longer duration)
  const baseDuration = Math.min(minDuration + (rotationDistance / 1800) * 1000, maxDuration);
  
  console.log(`⏱️ ANIMATION DURATION:
    - Rotation distance: ${rotationDistance.toFixed(0)}°
    - Calculated duration: ${baseDuration}ms`);
  
  return baseDuration;
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