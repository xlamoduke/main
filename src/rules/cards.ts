import { Card, RulesContext, Suit } from '../model/types';
import { cardPoints, isShaman, rankStrength, suits } from '../model/cards';
export const points = (c: Card) => cardPoints[c.rank];
export const handPoints = (cards: Card[]) => cards.reduce((s,c)=>s+points(c),0);
export function canRepresentSuit(card: Card, suit: Suit, ctx: RulesContext) { return card.suit === suit || (!ctx.noTrump && isShaman(card)); }
export function canLead(cards: Card[], ctx: RulesContext): boolean { if(cards.length<1||cards.length>4) return false; return suits.some(s => cards.every(c => canRepresentSuit(c,s,ctx))); }
export function beatsCard(attacker: Card, defender: Card, ctx: RulesContext): boolean {
  if(!ctx.noTrump && isShaman(attacker)) return false;
  if(!ctx.noTrump && isShaman(defender)) return true;
  if(ctx.noTrump) return attacker.suit === defender.suit && rankStrength[defender.rank] > rankStrength[attacker.rank];
  if(defender.suit === ctx.trumpSuit && attacker.suit !== ctx.trumpSuit) return true;
  if(defender.suit !== attacker.suit) return false;
  return rankStrength[defender.rank] > rankStrength[attacker.rank];
}
export function canBeatSet(open: Card[], response: Card[], ctx: RulesContext): boolean {
  if(open.length !== response.length) return false;
  const used = Array(response.length).fill(false);
  function rec(i:number): boolean { if(i===open.length) return true; for(let j=0;j<response.length;j++) if(!used[j] && beatsCard(open[i], response[j], ctx)){ used[j]=true; if(rec(i+1)) return true; used[j]=false; } return false; }
  return rec(0);
}
export function hasIntervention(cards: Card[], ctx: RulesContext): boolean {
  if(handPoints(cards)>40) return true;
  return suits.some(s => cards.length === 4 && cards.every(c => canRepresentSuit(c,s,ctx)));
}
export function isFourAces(cards: Card[]) { return cards.length===4 && cards.every(c=>c.rank==='A') && new Set(cards.map(c=>c.suit)).size===4; }
export function isFourSixes(cards: Card[]) { return cards.length===4 && cards.every(c=>c.rank==='6') && new Set(cards.map(c=>c.suit)).size===4; }
