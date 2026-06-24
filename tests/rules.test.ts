declare const process: any;
import { cards, chooseIntervention, drawAfterBattle, scoreRound } from '../src/engine/game';
import { beatsCard, canBeatSet, hasIntervention } from '../src/rules/cards';
import { respond, resolveBattle, specialPenaltyTarget, startBattle } from '../src/rules/battle';
import { createPlayers } from '../src/model/cards';

const heartsTrump = { noTrump: false as const, trumpSuit: 'hearts' as const };
const noTrump = { noTrump: true as const };
const assert = {
  equal: (actual: unknown, expected: unknown) => {
    if (actual !== expected) throw new Error(`${actual} !== ${expected}`);
  },
  deepEqual: (actual: unknown, expected: unknown) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
  },
  throws: (fn: () => void) => {
    let threw = false;
    try { fn(); } catch { threw = true; }
    if (!threw) throw new Error('Expected throw');
  },
};
const tests: [string, () => void][] = [];
const it = (name: string, fn: () => void) => tests.push([name, fn]);

it('A♠ beats K♠', () => assert.equal(beatsCard(cards('KS')[0], cards('AS')[0], heartsTrump), true));
it('K♠ does not beat A♠', () => assert.equal(beatsCard(cards('AS')[0], cards('KS')[0], heartsTrump), false));
it('6♥ as trump beats A♠', () => assert.equal(beatsCard(cards('AS')[0], cards('6H')[0], heartsTrump), true));
it('A♠ does not beat 6♥ when hearts are trump', () => assert.equal(beatsCard(cards('6H')[0], cards('AS')[0], heartsTrump), false));
it('in no-trump A♠ beats K♠', () => assert.equal(beatsCard(cards('KS')[0], cards('AS')[0], noTrump), true));
it('in no-trump 7♠ beats 6♠', () => assert.equal(beatsCard(cards('6S')[0], cards('7S')[0], noTrump), true));
it('in ordinary mode Shaman 6♠ cannot be beaten by anything', () => {
  for (const response of cards('AS 10S KS AH 6H 7S')) assert.equal(beatsCard(cards('6S')[0], response, heartsTrump), false);
});
it('Shaman substitutes suit', () => assert.equal(hasIntervention(cards('10H JH QH 6S'), heartsTrump), true));
it('rejects partial beating', () => assert.equal(canBeatSet(cards('AS 10S'), cards('KS QS'), heartsTrump), false));
it('allows voluntary discard', () => {
  let battle = startBattle(0, cards('7C'), heartsTrump);
  battle = respond(battle, 1, cards('AC'), 'discard', heartsTrump);
  assert.equal(battle.sets[1].kind, 'discard');
});
it('bank goes to last beating player', () => {
  let battle = startBattle(0, cards('7C'), heartsTrump);
  battle = respond(battle, 1, cards('8C'), 'open', heartsTrump);
  battle = respond(battle, 2, cards('9C'), 'open', heartsTrump);
  battle = respond(battle, 3, cards('6D'), 'discard', heartsTrump);
  assert.equal(resolveBattle(battle).bankOwnerId, 2);
});
it('battle ends after 4 actions', () => {
  let battle = startBattle(0, cards('7C'), heartsTrump);
  battle = respond(battle, 1, cards('8C'), 'open', heartsTrump);
  battle = respond(battle, 2, cards('9C'), 'open', heartsTrump);
  battle = respond(battle, 3, cards('6D'), 'discard', heartsTrump);
  assert.throws(() => respond(battle, 0, cards('AC'), 'open', heartsTrump));
});
it('draw starts from bank owner clockwise', () => {
  const players = createPlayers();
  players.forEach((player) => { player.hand = []; });
  const result = drawAfterBattle(players, cards('AS AH AD AC'), 2);
  assert.deepEqual(result.players.map((player) => player.hand.map((card) => card.rank + card.suit[0])), [['Ad'], ['Ac'], ['As'], ['Ah']]);
});
it('intervention priorities', () => {
  assert.equal(chooseIntervention([1, 2], 0), 2);
  assert.equal(chooseIntervention([2, 0], 1), 2);
});
it('four aces +12 to opponents if unbeaten', () => {
  let battle = startBattle(0, cards('AS AH AD AC'), heartsTrump, 12);
  battle = respond(battle, 1, cards('7D 8D 9D JD'), 'discard', heartsTrump);
  battle = respond(battle, 2, cards('7H 8H 9H JH'), 'discard', heartsTrump);
  battle = respond(battle, 3, cards('7C 8C 9C JC'), 'discard', heartsTrump);
  assert.equal(specialPenaltyTarget(resolveBattle(battle)), 'B');
});
it('four aces reflect when beaten', () => {
  let battle = startBattle(0, cards('AS AH AD AC'), heartsTrump, 12);
  battle = respond(battle, 1, cards('6S 10H KH QH'), 'open', heartsTrump);
  battle = respond(battle, 2, cards('7D 8D 9D JD'), 'discard', heartsTrump);
  battle = respond(battle, 3, cards('7C 8C 9C JC'), 'discard', heartsTrump);
  assert.equal(specialPenaltyTarget(resolveBattle(battle)), 'A');
});
it('four sixes ordinary mode cannot be fully beaten', () => assert.equal(canBeatSet(cards('6S 6H 6D 6C'), cards('AH 7H 7D 7C'), heartsTrump), false));
it('four sixes no-trump can be beaten', () => assert.equal(canBeatSet(cards('6S 6H 6D 6C'), cards('7S 7H 7D 7C'), noTrump), true));
it('penalties 0 / 1-30 / 31-59', () => {
  assert.equal(scoreRound(0, 120).penalties.A, 6);
  assert.equal(scoreRound(30, 90).penalties.A, 4);
  assert.equal(scoreRound(59, 61).penalties.A, 2);
});
it('eggs accumulate debt', () => {
  const first = scoreRound(60, 60, 0);
  const second = scoreRound(60, 60, first.eggDebt);
  assert.equal(scoreRound(20, 100, second.eggDebt).penalties.A, 8);
});
it('taunt after four-card beat', () => {
  let battle = startBattle(0, cards('6C 7C 8C 9C'), heartsTrump);
  battle = respond(battle, 1, cards('10C JC QC KC'), 'open', heartsTrump);
  assert.equal(battle.tauntAvailableFor.includes(1), true);
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log('✓', name);
    passed += 1;
  } catch (error) {
    console.error('✗', name);
    console.error(error);
    process.exit(1);
  }
}
console.log(`${passed} tests passed`);
