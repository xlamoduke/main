import { Card, Player, PlayerId, RulesContext, TeamId, RoundStats } from '../model/types';
import { cardKey, createPlayers, deal, makeDeck, shuffle, teamOf } from '../model/cards';
import { handPoints, isFourAces, isFourSixes } from '../rules/cards';
export const emptyStats = (): RoundStats => ({eggs:0,fourAces:0,fourSixes:0,interventions:0,shamanUses:0,penalties:{'+2':0,'+4':0,'+6':0,'+12':0}});
export function createRound(rnd=Math.random) { const deck = shuffle(makeDeck(), rnd); const d=deal(deck); const trumpCard=d.rest[0]; const context: RulesContext = trumpCard.rank==='6'&&trumpCard.suit==='spades'?{noTrump:true}:{noTrump:false,trumpSuit:trumpCard.suit}; const players=createPlayers(); players.forEach((p,i)=>p.hand=d.hands[i]); return {deck:{cards:d.rest}, players, teams:{A:{id:'A' as TeamId,players:[0,2] as PlayerId[],penalty:0},B:{id:'B' as TeamId,players:[1,3] as PlayerId[],penalty:0}}, context, currentStarter:0 as PlayerId, eggDebt:0, stats:emptyStats()}; }
export function drawAfterBattle(players: Player[], deck: Card[], owner: PlayerId): {players:Player[]; deck:Card[]} {
  const ps = players.map(p=>({...p, hand:[...p.hand]})); const d=[...deck]; const order=[0,1,2,3].map(i=>((owner+i)%4) as PlayerId);
  while(d.length >= 4 && order.every(id=>ps[id].hand.length<4)){ for(const id of order) ps[id].hand.push(d.shift()!); }
  return {players:ps, deck:d};
}
export function chooseIntervention(clicks: PlayerId[], previousOwner: PlayerId): PlayerId|undefined {
  if(clicks.length===0) return; const prevTeam=teamOf(previousOwner); const teams=new Set(clicks.map(teamOf)); if(teams.size>1){ const p=clicks.find(id=>teamOf(id)===prevTeam); if(p!==undefined) return p; } return clicks[0];
}
export function scoreRound(pointsA: number, pointsB: number, eggDebt=0): {penalties: Record<TeamId, number>; eggDebt: number; egg: boolean; bucket?: '+2'|'+4'|'+6'} {
  if(pointsA===60 && pointsB===60) return {penalties:{A:0,B:0}, eggDebt: eggDebt+2, egg:true};
  const loser: TeamId = pointsA < pointsB ? 'A' : 'B'; const score = loser==='A'?pointsA:pointsB; const base = score===0?6:score<=30?4:score<=59?2:0; return {penalties:{A: loser==='A'?base+eggDebt:0, B: loser==='B'?base+eggDebt:0}, eggDebt:0, egg:false, bucket:`+${base}` as any};
}
export function detectSpecial(hand: Card[]): 'aces'|'sixes'|undefined { if(isFourAces(hand)) return 'aces'; if(isFourSixes(hand)) return 'sixes'; }
export const cards = (s: string): Card[] => s.split(/\s+/).filter(Boolean).map(x=>{const rank=x.slice(0,-1) as any; const m=x.slice(-1); const suit:any={S:'spades',H:'hearts',D:'diamonds',C:'clubs'}[m]; return {rank,suit};});
export const formatCards = (cs: Card[]) => cs.map(cardKey).join(' ');
export function randomMatch(rnd=Math.random){ let penaltyA=0, penaltyB=0, eggDebt=0, rounds=0; const stats=emptyStats(); while(penaltyA<12&&penaltyB<12&&rounds<50){ rounds++; const a=Math.floor(rnd()*121), b=120-a; const sc=scoreRound(a,b,eggDebt); eggDebt=sc.eggDebt; penaltyA+=sc.penalties.A; penaltyB+=sc.penalties.B; if(sc.egg) stats.eggs++; for(const t of ['A','B'] as TeamId[]) if(sc.penalties[t]) stats.penalties[`+${Math.min(sc.penalties[t],12)}`]=(stats.penalties[`+${Math.min(sc.penalties[t],12)}`]??0)+1; if(rnd()<.03) stats.fourAces++; if(rnd()<.03) stats.fourSixes++; if(rnd()<.2) stats.interventions++; if(rnd()<.25) stats.shamanUses++; } return {winner: penaltyA>=12?'B':'A', rounds, stats}; }
