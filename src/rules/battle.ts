import { Battle, Card, PlayerId, RulesContext, TeamId } from '../model/types';
import { isShaman, teamOf } from '../model/cards';
import { canBeatSet, canLead, isFourAces, isFourSixes } from './cards';

export function startBattle(attackerId: PlayerId, cards: Card[], context: RulesContext, specialPenalty?: 6 | 12): Battle {
  const isSpecial = specialPenalty !== undefined && (isFourAces(cards) || isFourSixes(cards));
  if (!canLead(cards, context) && !isSpecial) throw new Error('Attack must be 1-4 cards of one suit');

  return {
    attackerId,
    sets: [{ playerId: attackerId, team: teamOf(attackerId), cards, kind: 'open' }],
    specialPenalty,
    specialOwnerTeam: teamOf(attackerId),
    tauntAvailableFor: [],
  };
}

export function respond(battle: Battle, playerId: PlayerId, cards: Card[], kind: 'open' | 'discard', context: RulesContext): Battle {
  if (battle.sets.length >= 4) throw new Error('Battle already complete');
  const lastOpenSet = [...battle.sets].reverse().find((set) => set.kind === 'open');
  if (!lastOpenSet) throw new Error('No open set to answer');
  if (cards.length !== lastOpenSet.cards.length) throw new Error('Must spend the same number of cards as the last open set');
  if (kind === 'open' && !canBeatSet(lastOpenSet.cards, cards, context)) throw new Error('Cannot partially beat the last open set');

  return {
    ...battle,
    sets: [...battle.sets, { playerId, team: teamOf(playerId), cards, kind }],
    tauntAvailableFor: kind === 'open' && cards.length === 4 ? [...battle.tauntAvailableFor, playerId] : [...battle.tauntAvailableFor],
  };
}

export const isBattleComplete = (battle: Battle): boolean => battle.sets.length === 4;

export function resolveBattle(battle: Battle): Battle {
  if (!isBattleComplete(battle)) throw new Error('Battle needs exactly 4 actions');
  const openSets = battle.sets.filter((set) => set.kind === 'open');
  const bankOwnerId = openSets.length === 1 ? battle.attackerId : openSets[openSets.length - 1].playerId;
  return { ...battle, bankOwnerId };
}

export const bankCards = (battle: Battle): Card[] => battle.sets.flatMap((set) => set.cards);
export const battleShamanUses = (battle: Battle, context: RulesContext): number =>
  context.noTrump ? 0 : battle.sets.flatMap((set) => set.cards).filter(isShaman).length;

export function specialPenaltyTarget(battle: Battle): TeamId | undefined {
  if (!battle.specialPenalty) return undefined;
  const resolved = battle.bankOwnerId === undefined ? resolveBattle(battle) : battle;
  const ownerTeam = teamOf(resolved.bankOwnerId!);
  return ownerTeam === battle.specialOwnerTeam ? oppositeTeam(battle.specialOwnerTeam) : battle.specialOwnerTeam;
}

function oppositeTeam(team: TeamId): TeamId {
  return team === 'A' ? 'B' : 'A';
}
