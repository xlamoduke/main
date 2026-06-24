import { Card, Player, PlayerId, Rank, Suit, TeamId } from './types';

export const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const ranks: Rank[] = ['A', '10', 'K', 'Q', 'J', '9', '8', '7', '6'];

export const rankStrength: Record<Rank, number> = {
  A: 9,
  '10': 8,
  K: 7,
  Q: 6,
  J: 5,
  '9': 4,
  '8': 3,
  '7': 2,
  '6': 1,
};

export const cardPoints: Record<Rank, number> = {
  A: 11,
  '10': 10,
  K: 4,
  Q: 3,
  J: 2,
  '9': 0,
  '8': 0,
  '7': 0,
  '6': 0,
};

export const makeDeck = (): Card[] => suits.flatMap((suit) => ranks.map((rank) => ({ suit, rank })));
export const isShaman = (card: Card): boolean => card.rank === '6' && card.suit === 'spades';
export const teamOf = (playerId: PlayerId | number): TeamId => (playerId % 2 === 0 ? 'A' : 'B');
export const nextPlayer = (playerId: PlayerId | number): PlayerId => ((playerId + 1) % 4) as PlayerId;
export const createPlayers = (): Player[] => [0, 1, 2, 3].map((id) => ({ id: id as PlayerId, team: teamOf(id), hand: [], bank: [] }));

export function shuffle<T>(items: T[], rnd = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function deal(deck: Card[], handSize = 4): { hands: Card[][]; rest: Card[] } {
  return {
    hands: [0, 1, 2, 3].map((playerIndex) => deck.slice(playerIndex * handSize, playerIndex * handSize + handSize)),
    rest: deck.slice(handSize * 4),
  };
}

export function cardKey(card: Card): string {
  const suitMark: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
  return `${card.rank}${suitMark[card.suit]}`;
}
