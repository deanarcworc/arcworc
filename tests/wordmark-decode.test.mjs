import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeWordmark,decodedEdge} from '../dist/wordmark-decode.js';

test('alphabet reveal resolves left to right into ARCWORC within 730ms',()=>{
 const start=decodeWordmark(0);assert.equal(start[0].letter,'A');assert(start.slice(1).every(s=>!s.started));assert.equal(decodedEdge(start),0);
 assert.equal(decodeWordmark(75)[1].letter,'A');
 const mid=decodeWordmark(220);assert(mid[0].settled);assert(mid[1].letter>'A'&&mid[1].letter<'R');assert(decodedEdge(mid)>0&&decodedEdge(mid)<100);
 const done=decodeWordmark(730);assert(done.every(s=>s.settled));assert.equal(done.map(s=>s.letter).join(''),'ARCWORC');assert.equal(decodedEdge(done),100);
 let last=0;for(let t=0;t<=750;t+=15){const edge=decodedEdge(decodeWordmark(t));assert(edge>=last);last=edge;}
});
