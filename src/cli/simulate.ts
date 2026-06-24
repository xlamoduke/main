declare const process: any;
import { randomMatch } from '../engine/game';
const n = Number(process.argv[2] ?? 1000);
const total:any = {matches:n,winsA:0,winsB:0,rounds:0,eggs:0,fourAces:0,fourSixes:0,interventions:0,shamanUses:0,penalties:{}};
for(let i=0;i<n;i++){ const m=randomMatch(); total[m.winner==='A'?'winsA':'winsB']++; total.rounds+=m.rounds; for(const k of ['eggs','fourAces','fourSixes','interventions','shamanUses']) total[k]+= (m.stats as any)[k]; for(const [k,v] of Object.entries(m.stats.penalties)) total.penalties[k]=(total.penalties[k]??0)+(v as number); }
console.log('2x2 card game simulation');
console.log(`matches: ${total.matches}`); console.log(`team A wins: ${total.winsA}`); console.log(`team B wins: ${total.winsB}`); console.log(`average match length (rounds): ${(total.rounds/n).toFixed(2)}`); console.log(`egg mode count: ${total.eggs}`); console.log(`four aces: ${total.fourAces}`); console.log(`four sixes: ${total.fourSixes}`); console.log(`interventions: ${total.interventions}`); console.log(`Shaman uses: ${total.shamanUses}`); console.log('penalty distribution:', total.penalties);
