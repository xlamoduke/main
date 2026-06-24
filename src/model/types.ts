export type Suit = 'spades'|'hearts'|'diamonds'|'clubs';
export type Rank = 'A'|'10'|'K'|'Q'|'J'|'9'|'8'|'7'|'6';
export type TeamId = 'A'|'B';
export type PlayerId = 0|1|2|3;
export interface Card { suit: Suit; rank: Rank }
export interface Player { id: PlayerId; team: TeamId; hand: Card[]; bank: Card[] }
export interface Team { id: TeamId; players: PlayerId[]; penalty: number }
export interface Deck { cards: Card[] }
export interface RulesContext { trumpSuit?: Suit; noTrump: boolean }
export type SetKind = 'open'|'discard';
export interface PlayedSet { playerId: PlayerId; team: TeamId; cards: Card[]; kind: SetKind }
export interface Battle { attackerId: PlayerId; sets: PlayedSet[]; bankOwnerId?: PlayerId; specialPenalty?: 6|12; specialOwnerTeam?: TeamId; tauntAvailableFor?: PlayerId[] }
export interface GameState { deck: Deck; players: Player[]; teams: Record<TeamId, Team>; context: RulesContext; currentStarter: PlayerId; eggDebt: number; stats: RoundStats }
export interface Round { deck: Deck; players: Player[]; teams: Record<TeamId, Team>; context: RulesContext; currentStarter: PlayerId; eggDebt: number; stats: RoundStats }
export interface Match { teams: Record<TeamId, Team>; rounds: Round[]; eggDebt: number; winner?: TeamId; loser?: TeamId }
export interface RoundStats { eggs: number; fourAces: number; fourSixes: number; interventions: number; shamanUses: number; penalties: Record<string, number> }
