import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { SessionBoundary } from '../../src/security/session.js';
import { CORE_SET_NUMBERS,isCurrentCoreGame } from '../../src/lorcana/format.js';
import { replayCancellations,analyzeInkDrops,combineInkDrops } from '../../src/lorcana/resources.js';
import { applyReplayPatch } from '../../src/security/replay.js';
import { inkDropChartModel } from '../../src/lorcana/inkdrop-chart.js';
import * as seasons from '../../src/lorcana/seasons.js';

export function analyzerHarness(){
  const source=fs.readFileSync(new URL('../../src/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  const end=source.indexOf('\n})();');
  assert(end>0);
  const context=vm.createContext({
    ...seasons,inkDropChartModel,SessionBoundary,CORE_SET_NUMBERS,isCurrentCoreGame,
    analyzeInkDrops,combineInkDrops,replayCancellations,applyReplayPatch,
    document:{documentElement:{style:{setProperty(){}}},addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;},getElementById(){return null;}},
    getComputedStyle(){return{getPropertyValue(){return'';}};},window:{},Chart:{},JSZip:{},pako:{},
    structuredClone,console,setTimeout,clearTimeout,TextDecoder,URL,Map,Set,Date
  });
  vm.runInContext(source.slice(0,end)+`\n globalThis.testApi={state,els,charts,filteredSavedMatches,isPerformanceDataScoped,setSelectedFilterValues,selectedFilterValues,toggleMultiFilterValue,shouldShowDeckVersionFilter,performanceColorOptionsForPills,renderPillGroup,renderDeckPillGroup,selectedDeckCopiesByKey,getDeckCardList,groupIdenticalProfiles,performanceCardImpactHtml,performanceMulliganHtml,performanceTempoSplitHtml,renderResultHero,normalizeChartDatasets,deepMerge,renderInkDropChart,chart};\n})();`,context);
  return context.testApi;
}
