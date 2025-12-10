// src/utils/eloUtils.ts

const K_FACTOR = 32; 

/**
 * Calculates the new Elo rating.
 * 
 * @param currentElo - The player's current rating
 * @param opponentElo - The opponent's rating
 * @param actualScore - 1 for Win, 0 for Loss, 0.5 for Draw
 * @returns The new integer rating
 */
export const calculateEloChange = (
  currentElo: number, 
  opponentElo: number, 
  actualScore: number
): number => {
  // 1. Calculate Expected Score based on rating difference
  // Formula: E = 1 / (1 + 10 ^ ((OpponentElo - MyElo) / 400))
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));

  // 2. Calculate New Rating
  // Formula: NewRating = OldRating + K * (Actual - Expected)
  const newRating = currentElo + K_FACTOR * (actualScore - expectedScore);

  return Math.round(newRating);
};