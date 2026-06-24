import { Card, Rank, Suit, Player, TeamId } from './types';
export const suits: Suit[] = ['spades','hearts','diamonds','clubs'];
export const ranks: Rank[] = ['A','10','K','Q','J','9','8','7','6'];
export const rankStrength: Record<Rank, number> = {A:9,'10':8,K:7,Q:6,J:5,'9':4,'8':3,'7':2,'6':1};
export const cardPoints: Record<Rank, number> = {A:11,'10':10,K:4,Q:3,J:2,'9':0,'8':0,'7':0,'6':0};
export const makeDeck = (): Card[] => suits.flatMap(suit => ranks.map(rank => ({suit, rank})));
export const cardKey = (c: Card) => `${c.rank}${c.suit[0]}`;
export const isShaman = (c: Card) => c.rank === '6' && c.suit === 'spades';
export const teamOf = (playerId: number): TeamId => playerId % 2 === 0 ? 'A' : 'B';
export const createPlayers = (): Player[] => [0,1,2,3].map(id => ({id:id as any, team: teamOf(id), hand: [], bank: []}));
export function shuffle<T>(items: T[], rnd = Math.random): T[] { const a=[...items]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
export const deal = (deck: Card[], count=4) => ({ hands:[0,1,2,3].map(i => deck.slice(i*count, i*count+count)), rest: deck.slice(count*4) });
