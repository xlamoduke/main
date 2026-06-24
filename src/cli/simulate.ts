declare const process: { argv: string[] };

import { emptyStats, simulateMatch } from '../engine/game';
import { RoundStats } from '../model/types';

const matchCount = Number(process.argv[2] ?? 1000);
const totals = {
  matches: matchCount,
  winsA: 0,
  winsB: 0,
  rounds: 0,
  stats: emptyStats(),
};

for (let i = 0; i < matchCount; i += 1) {
  const match = simulateMatch();
  if (match.winner === 'A') totals.winsA += 1;
  else totals.winsB += 1;
  totals.rounds += match.rounds;
  addStats(totals.stats, match.stats);
}

console.log('2x2 card game simulation');
console.log(`matches: ${totals.matches}`);
console.log(`team A wins: ${totals.winsA}`);
console.log(`team B wins: ${totals.winsB}`);
console.log(`average match length (rounds): ${(totals.rounds / matchCount).toFixed(2)}`);
console.log(`egg mode count: ${totals.stats.eggs}`);
console.log(`four aces: ${totals.stats.fourAces}`);
console.log(`four sixes: ${totals.stats.fourSixes}`);
console.log(`interventions: ${totals.stats.interventions}`);
console.log(`Shaman uses: ${totals.stats.shamanUses}`);
console.log('penalty distribution:', totals.stats.penalties);

function addStats(target: RoundStats, source: RoundStats): void {
  target.eggs += source.eggs;
  target.fourAces += source.fourAces;
  target.fourSixes += source.fourSixes;
  target.interventions += source.interventions;
  target.shamanUses += source.shamanUses;
  for (const key of Object.keys(target.penalties) as Array<keyof RoundStats['penalties']>) target.penalties[key] += source.penalties[key];
}
