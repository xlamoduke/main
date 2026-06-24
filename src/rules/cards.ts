import { Card, Rank, RulesContext, Suit } from '../model/types';
import { cardPoints, isShaman, rankStrength, suits } from '../model/cards';

export function points(card: Card): number {
  return cardPoints[card.rank];
}

export function handPoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + points(card), 0);
}

export function canRepresentSuit(card: Card, suit: Suit, context: RulesContext): boolean {
  return card.suit === suit || (!context.noTrump && isShaman(card));
}

export function canLead(cards: Card[], context: RulesContext): boolean {
  if (cards.length < 1 || cards.length > 4) return false;
  return suits.some((suit) => cards.every((card) => canRepresentSuit(card, suit, context)));
}

export function beatsCard(attackCard: Card, responseCard: Card, context: RulesContext): boolean {
  if (!context.noTrump && isShaman(attackCard)) return false;
  if (!context.noTrump && isShaman(responseCard)) return true;

  if (context.noTrump) {
    return attackCard.suit === responseCard.suit && rankStrength[responseCard.rank] > rankStrength[attackCard.rank];
  }

  const attackIsTrump = attackCard.suit === context.trumpSuit;
  const responseIsTrump = responseCard.suit === context.trumpSuit;

  if (responseIsTrump && !attackIsTrump) return true;
  if (!responseIsTrump && attackIsTrump) return false;
  if (responseCard.suit !== attackCard.suit) return false;
  return rankStrength[responseCard.rank] > rankStrength[attackCard.rank];
}

export function canBeatSet(openSet: Card[], response: Card[], context: RulesContext): boolean {
  if (openSet.length !== response.length) return false;

  const used = new Set<number>();
  const match = (openIndex: number): boolean => {
    if (openIndex === openSet.length) return true;

    return response.some((candidate, responseIndex) => {
      if (used.has(responseIndex) || !beatsCard(openSet[openIndex], candidate, context)) return false;
      used.add(responseIndex);
      const matched = match(openIndex + 1);
      used.delete(responseIndex);
      return matched;
    });
  };

  return match(0);
}

export function playableLeadSets(hand: Card[], context: RulesContext): Card[][] {
  const result: Card[][] = [];
  const maxMask = 1 << hand.length;
  for (let mask = 1; mask < maxMask; mask += 1) {
    const set = hand.filter((_, index) => (mask & (1 << index)) !== 0);
    if (canLead(set, context)) result.push(set);
  }
  return result.sort((a, b) => a.length - b.length);
}

export function playableBeatingSets(openSet: Card[], hand: Card[], context: RulesContext): Card[][] {
  const result: Card[][] = [];
  const maxMask = 1 << hand.length;
  for (let mask = 1; mask < maxMask; mask += 1) {
    const set = hand.filter((_, index) => (mask & (1 << index)) !== 0);
    if (canBeatSet(openSet, set, context)) result.push(set);
  }
  return result.sort((a, b) => a.length - b.length);
}

export function hasFourOfOneSuit(cards: Card[], context: RulesContext): boolean {
  return cards.length === 4 && suits.some((suit) => cards.every((card) => canRepresentSuit(card, suit, context)));
}

export function hasIntervention(cards: Card[], context: RulesContext): boolean {
  return handPoints(cards) > 40 || hasFourOfOneSuit(cards, context);
}

export function isFourAces(cards: Card[]): boolean {
  return isFourRanks(cards, 'A');
}

export function isFourSixes(cards: Card[]): boolean {
  return isFourRanks(cards, '6');
}

function isFourRanks(cards: Card[], rank: Rank): boolean {
  return cards.length === 4 && cards.every((card) => card.rank === rank) && new Set(cards.map((card) => card.suit)).size === 4;
}
