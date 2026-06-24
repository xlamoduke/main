import { cards, scoreRound } from '../engine/game';
import { beatsCard, canBeatSet } from '../rules/cards';
import { respond, resolveBattle, specialPenaltyTarget, startBattle } from '../rules/battle';

const trump = { noTrump: false as const, trumpSuit: 'hearts' as const };
const noTrump = { noTrump: true as const };

console.log('1. Shaman неперебиваем:', !beatsCard(cards('6S')[0], cards('AH')[0], trump));
console.log('2. В бескозырке 6♠ обычная шестёрка:', beatsCard(cards('6S')[0], cards('7S')[0], noTrump));
console.log('3. Нельзя частично перебить набор:', !canBeatSet(cards('AS 10S'), cards('KS QS'), trump));

let battle = startBattle(0, cards('7C'), trump);
battle = respond(battle, 1, cards('8C'), 'open', trump);
battle = respond(battle, 2, cards('9C'), 'open', trump);
battle = respond(battle, 3, cards('6D'), 'discard', trump);
console.log('4. Банк получает последний перебивший:', resolveBattle(battle).bankOwnerId === 2);

let fourAces = startBattle(0, cards('AS AH AD AC'), trump, 12);
fourAces = respond(fourAces, 1, cards('6S 10H KH QH'), 'open', trump);
fourAces = respond(fourAces, 2, cards('7D 8D 9D JD'), 'discard', trump);
fourAces = respond(fourAces, 3, cards('7C 8C 9C JC'), 'discard', trump);
console.log('5. Четыре туза могут отразиться обратно:', specialPenaltyTarget(resolveBattle(fourAces)) === 'A');

const firstEgg = scoreRound(60, 60, 0);
const secondEgg = scoreRound(60, 60, firstEgg.eggDebt);
const resolvedEggDebt = scoreRound(20, 100, secondEgg.eggDebt);
console.log('6. Яйца накапливают eggDebt:', resolvedEggDebt.penalties.A === 8);

let taunt = startBattle(0, cards('6C 7C 8C 9C'), trump);
taunt = respond(taunt, 1, cards('10C JC QC KC'), 'open', trump);
console.log('7. Игрок, перебивший 4 карты, может вызвать tauntInsufficient:', taunt.tauntAvailableFor.includes(1));
