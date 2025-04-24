function generateInitialBracket(images) {
  const powerOfTwo = Math.pow(2, Math.floor(Math.log2(images.length)));
  if (images.length !== powerOfTwo) {
    throw new Error("Image count must be a power of 2 (e.g., 8, 16, 32).");
  }

  const shuffled = [...images].sort(() => 0.5 - Math.random());

  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      round: 1,
      matchId: i / 2 + 1,
      img1: shuffled[i],
      img2: shuffled[i + 1],
      winner: null
    });
  }

  return matches;
}
