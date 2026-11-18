// Pure audio math — no Web Audio here so it is unit-testable.
export function noteToFreq(semitonesFromA4) {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

export function clickPitch(clickPowerNumber) {
  const cp = Math.max(1, clickPowerNumber);
  const semis = Math.log2(cp) * 2; // 2 semitones per doubling
  const f = noteToFreq(-12 + semis); // start an octave below A4
  return Math.max(220, Math.min(1760, f));
}

// Root drops ~5 semitones per scale; each scale is a simple stacked chord.
export function scaleDroneFreqs(scaleIndex) {
  const root = noteToFreq(-24 - scaleIndex * 5); // lower as we zoom out
  return [root, root * 1.5, root * 2]; // root, fifth, octave
}
