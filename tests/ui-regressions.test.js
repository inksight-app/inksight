import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzerHarness } from './helpers/analyzer-harness.js';
import { inkDropChartModel } from '../src/lorcana/inkdrop-chart.js';

const game=(id,profile,copies)=>({id,deck_profile_id:profile,result:'win',format:'BO1',mine_colors:['amber','emerald'],my_decklist:[{cardId:'14-1',count:copies}],apiRow:{queue_id:'core-bo1',ranked:true,season_name:'Core BO1 - Set 14',started_at:'2026-10-20',result:'win'}});

test('V3 remains readable when the same Duels deck has several recorded lists',()=>{
  const api=analyzerHarness();
  api.state.savedMatches=[game('a','v3',4),game('b','v3',3),game('c','v1',2)];
  api.state.deckProfiles=[{id:'v3'},{id:'v1'}];
  assert.equal(api.filteredSavedMatches('stats').length,3);
  assert.equal(api.isPerformanceDataScoped(),false);
  api.setSelectedFilterValues('performanceDeckFilter',['v3']);
  assert.equal(api.filteredSavedMatches('stats').length,2);
  assert.equal(api.isPerformanceDataScoped(),true);
  assert.doesNotMatch(api.performanceCardImpactHtml({cards:[]}),/Choisissez un deck/);
  assert.doesNotMatch(api.performanceMulliganHtml({cards:[]}),/Choisissez un deck/);
  assert.equal(api.selectedDeckCopiesByKey(),null);
});

test('edited profiles cannot be merged with other versions from a stale cached first list',()=>{
  const api=analyzerHarness();
  api.state.savedMatches=[game('a','v3',4),game('b','v3',3),game('c','v1',4)];
  assert.equal(api.getDeckCardList('v3'),null);
  assert.equal(JSON.stringify(api.groupIdenticalProfiles(['v3','v1'])),JSON.stringify([['v3'],['v1']]));
});

test('versions are progressive: all results first, then one color pair, with a return to all',()=>{
  const api=analyzerHarness();
  const options=[{value:'all',noDecklist:true},{value:'v3'}];
  assert.equal(api.shouldShowDeckVersionFilter(options),false);
  api.setSelectedFilterValues('performanceColorFilter',['amber|emerald']);
  assert.equal(api.shouldShowDeckVersionFilter(options),true);
  api.setSelectedFilterValues('performanceColorFilter',['amber|emerald','amber|steel']);
  assert.equal(api.shouldShowDeckVersionFilter(options),false);
  api.setSelectedFilterValues('historyColorFilter',['amber|steel']);
  assert.equal(api.shouldShowDeckVersionFilter(options,null,'history'),true);
  const target={};
  api.renderPillGroup(target,'performanceColorFilter',[{value:'all',label:'Toutes'},{value:'amber|emerald',label:'Ambre / Émeraude'}],'all',true);
  assert.match(target.innerHTML,/data-value="all"/);
  api.toggleMultiFilterValue('performanceColorFilter','all');
  api.renderPillGroup(target,'performanceColorFilter',[{value:'all',label:'Toutes'}],'all',true);
  assert.match(target.innerHTML,/aria-pressed="true"/);
  api.renderDeckPillGroup(target,'performanceDeckFilter',[{value:'all',label:'Toutes les versions',noDecklist:true},{value:'v3',label:'V3'}]);
  assert.match(target.innerHTML,/Toutes les versions/);
  assert.doesNotMatch(target.innerHTML,/data-deck-info="all"/);
});

test('color controls stay outside the collapsed advanced filters, without duplicate ids',()=>{
  const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['performanceColorPills','historyColorPills','performanceVersionBlock','historyVersionBlock']){
    assert.equal(source.split('id="'+id+'"').length-1,1);
  }
  assert(source.indexOf('id="performanceColorPills"')<source.indexOf('class="performance-filter-controls performance-filter-controls-viz"'));
  assert(source.indexOf('id="historyVersionBlock"')<source.indexOf('class="history-controls history-controls-viz"'));
});

test('history color choices are not pruned by an unrelated statistics result filter',()=>{
  const api=analyzerHarness();
  api.state.savedMatches=[game('a','v3',4),{...game('b','v3',3),result:'loss',apiRow:{...game('b','v3',3).apiRow,result:'loss'}}];
  api.setSelectedFilterValues('performanceResultFilter',['win']);
  const stats=api.performanceColorOptionsForPills();
  const history=api.performanceColorOptionsForPills('history');
  assert.equal(stats[1].count,1);
  assert.equal(history[1].count,2);
});

test('summary names are complete escaped text, not truncated in the generated markup',()=>{
  const api=analyzerHarness();
  const opponent='AdversaireAvecUnNomVraimentTrèsLong <script> & équipe';
  api.els.resultHero={};
  api.renderResultHero({wins:1,losses:0,finalMineLore:19,finalOppLore:12,opponentName:opponent,myName:'Joueur',first:{myPlayerNumber:1,opponentNumber:2,firstTurnPlayer:1},inkProfiles:{mine:{inks:['amber','emerald'],label:'Ambre / Émeraude'},opponent:{inks:['amber','steel'],label:'Ambre / Acier'}},loreSeries:[],proMetrics:{}});
  assert.match(api.els.resultHero.innerHTML,/AdversaireAvecUnNomVraimentTrèsLong &lt;script&gt; &amp; équipe/);
  assert.doesNotMatch(api.els.resultHero.innerHTML,/<script>/);
});

test('Tempo uses shared semantic table columns, preserves missing values and percentage-point deltas',()=>{
  const api=analyzerHarness();
  const html=api.performanceTempoSplitHtml({tempoSplit:{total:3,win:{n:2,avgTurns:8,otpRate:100},loss:{n:1,avgTurns:10,otpRate:0}}});
  assert.match(html,/<thead>/);assert.match(html,/<tbody>/);assert.match(html,/<th scope="row">Tours par partie/);
  assert.match(html,/2 parties/);assert.match(html,/1 partie/);assert.match(html,/100 pts/);
  assert.doesNotMatch(html,/undefined|NaN/);
});

test('mixed-chart normalization keeps a line visible instead of applying bar borderWidth=0',()=>{
  const api=analyzerHarness();
  const data={datasets:[{type:'line',borderWidth:2.5,data:[0,2]},{type:'bar',borderRadius:3,data:[1,2]}]};
  api.normalizeChartDatasets('bar',data);
  assert.equal(data.datasets[0].borderWidth,2.5);
  assert.equal(data.datasets[1].borderRadius,3);
});

test('Inkdrop visuals keep own and opponent half-turns, observed stock and nonnegative withdrawal counts',()=>{
  const timeline=[{turn:1,activeOwner:'mine',stock:1,gained:1,removed:0},{turn:1,activeOwner:'opponent',stock:3,gained:2,removed:0},{turn:2,activeOwner:'mine',stock:1,gained:0,removed:2}];
  const model=inkDropChartModel(timeline);
  assert.deepEqual(model.labels,[['T1','Vous'],['T1','Adv.'],['T2','Vous']]);
  assert.deepEqual(model.stock[0].data,[1,3,1]);assert.equal(model.stock[0].stepped,'after');
  assert.deepEqual(model.flows[1].data,[0,0,2]);
  assert.equal(inkDropChartModel(null).available,false);
  assert.equal(inkDropChartModel([]).available,true);
});
