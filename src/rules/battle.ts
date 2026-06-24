import { Battle, Card, PlayerId, RulesContext, TeamId } from '../model/types';
import { isShaman, teamOf } from '../model/cards';
import { canBeatSet, canLead, isFourAces, isFourSixes } from './cards';
export const startBattle = (attackerId: PlayerId, cards: Card[], ctx: RulesContext, specialPenalty?: 6|12): Battle => {
  if(!canLead(cards, ctx) && !(specialPenalty && (isFourAces(cards) || isFourSixes(cards)))) throw new Error('Attack must be 1-4 cards of one suit');
  return { attackerId, sets:[{playerId:attackerId, team:teamOf(attackerId), cards, kind:'open'}], specialPenalty, specialOwnerTeam: teamOf(attackerId), tauntAvailableFor: [] };
};
export function respond(b: Battle, playerId: PlayerId, cards: Card[], kind: 'open'|'discard', ctx: RulesContext): Battle {
  if(b.sets.length>=4) throw new Error('Battle already complete');
  const lastOpen = [...b.sets].reverse().find(s=>s.kind==='open'); if(!lastOpen) throw new Error('No open set');
  if(cards.length !== lastOpen.cards.length) throw new Error('Must spend same number of cards');
  if(kind==='open' && !canBeatSet(lastOpen.cards, cards, ctx)) throw new Error('Cannot partially beat set');
  const nb: Battle = {...b, sets:[...b.sets,{playerId, team:teamOf(playerId), cards, kind}], tauntAvailableFor:[...(b.tauntAvailableFor??[])]};
  if(kind==='open' && cards.length===4) nb.tauntAvailableFor!.push(playerId);
  return nb;
}
export const isBattleComplete = (b: Battle) => b.sets.length === 4;
export function resolveBattle(b: Battle): Battle {
  if(!isBattleComplete(b)) throw new Error('Battle needs exactly 4 actions');
  const openSets = b.sets.filter(s=>s.kind==='open');
  const owner = openSets.length === 1 ? b.attackerId : openSets[openSets.length-1].playerId;
  return {...b, bankOwnerId: owner};
}
export const bankCards = (b: Battle) => b.sets.flatMap(s=>s.cards);
export const battleShamanUses = (b: Battle, ctx: RulesContext) => ctx.noTrump ? 0 : b.sets.flatMap(s=>s.cards).filter(isShaman).length;
export function specialPenaltyTarget(b: Battle): TeamId|undefined { if(!b.specialPenalty) return; const resolved = b.bankOwnerId!==undefined ? b : resolveBattle(b); const ownerTeam = teamOf(resolved.bankOwnerId!); return ownerTeam === b.specialOwnerTeam ? (b.specialOwnerTeam==='A'?'B':'A') : b.specialOwnerTeam; }
