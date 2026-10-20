import test from 'node:test';
import assert from 'node:assert/strict';
import {generateLocalCoachCommentary,COACH_ENTRY_COUNT} from '../src/lorcana/commentary.js';
import {generateLocalCoachCommentary as apiCommentary} from '../api/getCoachCommentary.js';

test('the original cinema database runs locally and is shared with the API',()=>{
  const input={monScore:20,scoreAdverse:0,nbTours:7,isWin:true};
  const line=generateLocalCoachCommentary(input);
  assert(COACH_ENTRY_COUNT>100);
  assert.equal(line.bucket,'perfectWin');
  assert.match(line.sourceLine,/Réf\./);
  assert.deepEqual(apiCommentary(input),line);
  assert.deepEqual(generateLocalCoachCommentary(input),line);
  assert.notEqual(generateLocalCoachCommentary({...input,monScore:18,scoreAdverse:20,isWin:false}).bucket,'perfectWin');
  assert(!JSON.stringify(line).includes('Calcul local gratuit'));
});
