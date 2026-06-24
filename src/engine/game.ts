import { Card, Player, PlayerId, Round, RoundStats, RulesContext, TeamId } from '../model/types';
import { cardKey, createPlayers, deal, isShaman, makeDeck, shuffle, teamOf } from '../model/cards';
import { bankCards, battleShamanUses, resolveBattle, respond, specialPenaltyTarget, startBattle } from '../rules/battle';
import { canBeatSet, handPoints, hasIntervention, isFourAces, isFourSixes, playableBeatingSets, playableLeadSets } from '../rules/cards';

export interface MatchSimulationResult {
  winner: TeamId;
  loser: TeamId;
  rounds: number;
  stats: RoundStats;
}

export const emptyStats = (): RoundStats => ({
  eggs: 0,
  fourAces: 0,
  fourSixes: 0,
  interventions: 0,
  shamanUses: 0,
  penalties: { '+2': 0, '+4': 0, '+6': 0, '+12': 0 },
});

export function createRound(rnd = Math.random, eggDebt = 0): Round {
  const shuffled = shuffle(makeDeck(), rnd);
  const dealt = deal(shuffled);
  const trumpCard = dealt.rest[0];
  const context: RulesContext = isShaman(trumpCard) ? { noTrump: true } : { noTrump: false, trumpSuit: trumpCard.suit };
  const players = createPlayers();
  players.forEach((player, index) => {
    player.hand = dealt.hands[index];
  });

  return {
    deck: { cards: dealt.rest },
    players,
    teams: {
      A: { id: 'A', players: [0, 2], penalty: 0 },
      B: { id: 'B', players: [1, 3], penalty: 0 },
    },
    context,
    currentStarter: 0,
    eggDebt,
    stats: emptyStats(),
  };
}

export function drawAfterBattle(players: Player[], deck: Card[], owner: PlayerId): { players: Player[]; deck: Card[] } {
  const updatedPlayers = players.map((player) => ({ ...player, hand: [...player.hand] }));
  const updatedDeck = [...deck];
  const order = [0, 1, 2, 3].map((offset) => ((owner + offset) % 4) as PlayerId);

  while (updatedDeck.length >= 4 && order.every((playerId) => updatedPlayers[playerId].hand.length < 4)) {
    for (const playerId of order) updatedPlayers[playerId].hand.push(updatedDeck.shift()!);
  }

  return { players: updatedPlayers, deck: updatedDeck };
}

export function chooseIntervention(clicks: PlayerId[], previousOwner: PlayerId): PlayerId | undefined {
  if (clicks.length === 0) return undefined;
  const clickedTeams = new Set(clicks.map(teamOf));
  if (clickedTeams.size > 1) {
    const previousOwnerTeam = teamOf(previousOwner);
    return clicks.find((playerId) => teamOf(playerId) === previousOwnerTeam);
  }
  return clicks[0];
}

export function scoreRound(pointsA: number, pointsB: number, eggDebt = 0): {
  penalties: Record<TeamId, number>;
  eggDebt: number;
  egg: boolean;
  bucket?: '+2' | '+4' | '+6';
} {
  if (pointsA === 60 && pointsB === 60) return { penalties: { A: 0, B: 0 }, eggDebt: eggDebt + 2, egg: true };

  const loser: TeamId = pointsA < pointsB ? 'A' : 'B';
  const loserPoints = loser === 'A' ? pointsA : pointsB;
  const basePenalty = loserPoints === 0 ? 6 : loserPoints <= 30 ? 4 : 2;
  return {
    penalties: { A: loser === 'A' ? basePenalty + eggDebt : 0, B: loser === 'B' ? basePenalty + eggDebt : 0 },
    eggDebt: 0,
    egg: false,
    bucket: `+${basePenalty}` as '+2' | '+4' | '+6',
  };
}

export function detectSpecial(hand: Card[]): 'aces' | 'sixes' | undefined {
  if (isFourAces(hand)) return 'aces';
  if (isFourSixes(hand)) return 'sixes';
  return undefined;
}

export function simulateRound(rnd = Math.random, eggDebt = 0): { penalties: Record<TeamId, number>; eggDebt: number; stats: RoundStats; points: Record<TeamId, number> } {
  let round = createRound(rnd, eggDebt);
  let starter = round.currentStarter;
  let safety = 0;

  while (round.players.some((player) => player.hand.length > 0) && safety < 32) {
    safety += 1;
    const eligible = round.players.filter((player) => hasIntervention(player.hand, round.context)).map((player) => player.id);
    const intervention = chooseIntervention(shuffle(eligible, rnd), starter);
    if (intervention !== undefined) {
      starter = intervention;
      round.stats.interventions += 1;
    }

    const battleResult = playAutomaticBattle(round.players, starter, round.context, rnd);
    const resolved = resolveBattle(battleResult.battle);
    const owner = resolved.bankOwnerId!;
    const pot = bankCards(resolved);
    round.players[owner].bank.push(...pot);
    round.stats.shamanUses += battleShamanUses(resolved, round.context);
    round.stats.fourAces += battleResult.special === 'aces' ? 1 : 0;
    round.stats.fourSixes += battleResult.special === 'sixes' ? 1 : 0;

    if (resolved.specialPenalty) {
      const target = specialPenaltyTarget(resolved)!;
      round.teams[target].penalty += resolved.specialPenalty;
      round.stats.penalties[`+${resolved.specialPenalty}` as '+6' | '+12'] += 1;
    }

    const drawn = drawAfterBattle(round.players, round.deck.cards, owner);
    round = { ...round, players: drawn.players, deck: { cards: drawn.deck }, currentStarter: owner };
    starter = owner;
  }

  const points = scoreBanks(round.players);
  const score = scoreRound(points.A, points.B, round.eggDebt);
  if (score.egg) round.stats.eggs += 1;
  for (const penalty of Object.values(score.penalties)) {
    if (penalty === 2 || penalty === 4 || penalty === 6) round.stats.penalties[`+${penalty}`] += 1;
  }

  return { penalties: score.penalties, eggDebt: score.eggDebt, stats: round.stats, points };
}

export function simulateMatch(rnd = Math.random): MatchSimulationResult {
  let penaltyA = 0;
  let penaltyB = 0;
  let eggDebt = 0;
  let rounds = 0;
  const stats = emptyStats();

  while (penaltyA < 12 && penaltyB < 12 && rounds < 100) {
    rounds += 1;
    const round = simulateRound(rnd, eggDebt);
    eggDebt = round.eggDebt;
    penaltyA += round.penalties.A;
    penaltyB += round.penalties.B;
    mergeStats(stats, round.stats);
  }

  return penaltyA >= 12 ? { winner: 'B', loser: 'A', rounds, stats } : { winner: 'A', loser: 'B', rounds, stats };
}

export const randomMatch = simulateMatch;

export function scoreBanks(players: Player[]): Record<TeamId, number> {
  return players.reduce(
    (acc, player) => {
      acc[player.team] += handPoints(player.bank);
      return acc;
    },
    { A: 0, B: 0 } as Record<TeamId, number>,
  );
}

export function cards(input: string): Card[] {
  const suitByMark: Record<string, Card['suit']> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ({ rank: token.slice(0, -1) as Card['rank'], suit: suitByMark[token.slice(-1)] }));
}

export const formatCards = (items: Card[]): string => items.map(cardKey).join(' ');

function playAutomaticBattle(players: Player[], starter: PlayerId, context: RulesContext, rnd: () => number): { battle: ReturnType<typeof startBattle>; special?: 'aces' | 'sixes' } {
  const updatedHands = players.map((player) => player.hand);
  const attackerHand = updatedHands[starter];
  const special = detectSpecial(attackerHand);
  const attack = special ? [...attackerHand] : chooseRandom(playableLeadSets(attackerHand, context), rnd) ?? attackerHand.slice(0, 1);
  let battle = startBattle(starter, attack, context, special === 'aces' ? 12 : special === 'sixes' ? 6 : undefined);
  removeCards(updatedHands[starter], attack);

  for (let offset = 1; offset < 4; offset += 1) {
    const playerId = ((starter + offset) % 4) as PlayerId;
    const lastOpen = [...battle.sets].reverse().find((set) => set.kind === 'open')!;
    const beatingSets = playableBeatingSets(lastOpen.cards, updatedHands[playerId], context);
    const willBeat = beatingSets.length > 0 && rnd() > 0.35;
    const answer = willBeat ? chooseRandom(beatingSets, rnd)! : updatedHands[playerId].slice(0, lastOpen.cards.length);
    const kind = willBeat && canBeatSet(lastOpen.cards, answer, context) ? 'open' : 'discard';
    battle = respond(battle, playerId, answer, kind, context);
    removeCards(updatedHands[playerId], answer);
  }

  return { battle, special };
}

function chooseRandom<T>(items: T[], rnd: () => number): T | undefined {
  return items.length === 0 ? undefined : items[Math.floor(rnd() * items.length)];
}

function removeCards(hand: Card[], cardsToRemove: Card[]): void {
  for (const card of cardsToRemove) {
    const index = hand.findIndex((candidate) => candidate.rank === card.rank && candidate.suit === card.suit);
    if (index >= 0) hand.splice(index, 1);
  }
}

function mergeStats(target: RoundStats, source: RoundStats): void {
  target.eggs += source.eggs;
  target.fourAces += source.fourAces;
  target.fourSixes += source.fourSixes;
  target.interventions += source.interventions;
  target.shamanUses += source.shamanUses;
  for (const key of Object.keys(target.penalties) as Array<keyof RoundStats['penalties']>) target.penalties[key] += source.penalties[key];
}
