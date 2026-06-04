import './style.css';
import { supabase, signUpUser, signInUser, signOutUser, getCurrentUser, signInWithDiscord, saveMatchAnalysis, listSavedMatchHistoryLight, getSavedMatch, deleteSavedMatch, patchSavedMatchTeamVisible, listDeckProfiles, upsertDeckProfile, ensureDeckProfileByExternalId, listSavedAnalyticsDetails, updateSavedMatchDeck, renameDeckProfile, archiveDeckProfile, mergeDeckProfiles, logDuelinkSyncRun, updateDeckProfilePoolTag } from './supabase.js';

(() => {
  'use strict';

  const LOCAL_CARD_DATA_URL = '/lorcana-cards-import-ready.json';
  const MAX_FILES = 20;
  const SAVED_MATCH_HISTORY_LIMIT = 1000;
  const PERF_DEBUG = true;
  // Master codes here must match the `set` field on cards in
  // /lorcana-cards-import-ready.json so hydrateCard resolves IDs like "12-139".
  const SET_NUM_TO_CODE = { '1':'TFC', '2':'ROTF', '3':'ITI', '4':'URR', '5':'SHS', '6':'AZS', '7':'ARI', '8':'ROJ', '9':'FAB', '10':'WITW', '11':'WIS', '12':'WUN', '13':'SET13', '14':'SET14' };
  const SET_CODE_TO_NUM = Object.fromEntries(Object.entries(SET_NUM_TO_CODE).map(([n,c]) => [c,n]));
  // Aliases so legacy data using the older codes still resolves.
  Object.assign(SET_CODE_TO_NUM, { FC:'1', TFC:'1', SHS:'5', SSK:'5', WITW:'10', WHW:'10', WIS:'11', WIN:'11', WUN:'12', WIL:'12' });
  const SET_LABELS = { TFC:'Premier Chapitre', FC:'Premier Chapitre', ROTF:'L’Ascension des Floodborn', ITI:'Les Terres d’Encres', URR:'Le Retour d’Ursula', SSK:'Ciel Scintillant', AZS:'La Mer Azurite', ARI:'L’Île d’Archazia', ROJ:'Le Règne de Jafar', FAB:'Fabuleux', WHW:'Lueurs dans les Profondeurs', WIN:'Givresort', WIL:'Contrées Inconnues', SET13:'Invasion Épineuse !', SET14:'Hyperia City', P1:'Cartes Promo — Année 1', P2:'Cartes Promo — Année 2', P3:'Cartes Promo — Année 3' };
  const INK_FR = { amber:'Ambre', amethyst:'Améthyste', emerald:'Émeraude', ruby:'Rubis', sapphire:'Saphir', steel:'Acier', Amber:'Ambre', Amethyst:'Améthyste', Emerald:'Émeraude', Ruby:'Rubis', Sapphire:'Saphir', Steel:'Acier', 'Dual Ink':'Double encre' };
  const RARITY_FR = { common:'Commune', uncommon:'Inhabituelle', rare:'Rare', 'super rare':'Très rare', super_rare:'Très rare', legendary:'Légendaire', enchanted:'Enchantée', iconic:'Iconique', promo:'Promo', Common:'Commune', Uncommon:'Inhabituelle', Rare:'Rare', Legendary:'Légendaire', Enchanted:'Enchantée', Iconic:'Iconique', Promo:'Promo' };
  const TYPE_FR = { character:'Personnage', action:'Action', song:'Chanson', item:'Objet', location:'Lieu', Character:'Personnage', Action:'Action', Item:'Objet', Location:'Lieu' };
  const INK_COLORS = { amber:'#f6c54d', amethyst:'#8b5cc7', emerald:'#34d399', ruby:'#fb7185', sapphire:'#2f8bd9', steel:'#9ca3af', inkless:'#63636d' };
  const GAME_ACTIONS = new Set(['ADD_TO_INK','PLAY_CARD','QUEST','CHALLENGE','ATTACK','END_TURN','MOVE_TO_LOCATION','ACTIVATE_ABILITY','RESPOND_TO_PROMPT']);
  const $ = id => document.getElementById(id);
  const els = {};
  const charts = { lore:null, action:null, ink:null, matrix:null, hand:null, board:null, performanceLore:null, performanceAction:null };
  const INKWELL_SOURCE_KEYS = ['inkedFromHand','inkedFromDiscard','inkedFromBoard','inkedFromDeck','inkedFromUnknown'];
  const INKWELL_SOURCE_LABELS = { hand:'Main', discard:'Défausse', board:'Board', deck:'Deck', unknown:'Source inconnue' };
  const state = { cards:[], index:new Map(), cardLoadPromise:null, replays:[], sessions:[], merged:null, isBO3:false, viewMode:0, matchMeta:null, activeTab:'overview', scope:'mine', cardFilter:'all', lastFocused:null, themes:{ mine:[INK_COLORS.sapphire, INK_COLORS.amber], opponent:[INK_COLORS.ruby, INK_COLORS.amethyst] }, mulliganResolved:false, currentUser:null, savePending:false, lastSavedMatchId:null, loadedSavedMatchId:null, savedMatches:[], savedMatchesLoaded:false, savedMatchesLoading:false, selectedSavedMatchId:null, expandedSavedMatchId:null, activeHistoryActionsId:null, deckProfiles:[], deckProfilesLoaded:false, deckProfilesLoading:false, savedAnalytics:{ games:[], cardStats:[], turnStats:[], key:'', loading:false, error:'' }, editingSavedMatchId:null, performanceCardSort:'lore', performanceMulliganSort:'smart', performanceMulliganMatchupFilter:'all', performanceMulliganPlayFilter:'all', performanceMulliganRecommendationFilter:'all', performanceExpandedLists:{ cards:false, mulligan:false }, performanceDetailTab:'overview', filterSelections:{}, pendingDeckSelection:{}, statExpandedLists:{}, bulkQueue:[], activeBulkIndex:null, bulkSaving:false, bulkSaveTotal:0, bulkSaveDone:0, lastBulkSaveMessage:'', cloudOffline:false, cloudBannerDismissed:false, historyVisibleCount:5, historyLastFilterKey:'', coachCommentaryCache:new Map(), coachCommentaryPendingKey:'', coachCommentarySeq:0, duelinkPreviewRows:[], duelinkImporting:false, duelinkAutoSaving:false, duelinkConnection:null, duelinkConnectionLoaded:false, duelinkSyncSummary:null, duelinkPreparedGameIds:new Set(), duelinkPreparedReplayIds:new Set(), duelinkSkippedGameIds:new Set(), duelinkSkippedReplayIds:new Set(), team:null, teamMode:false, teamMemberIds:[], teamDisplayNames:{}, dateFilter:{ stats:{ preset:'all', from:null, to:null }, history:{ preset:'all', from:null, to:null } } };


  function perfMark(label, startedAt, extra={}){
    if(!PERF_DEBUG || !startedAt) return;
    const now = perfNow();
    const duration = Math.round(now - startedAt);
    try{ console.info(`[InkSight perf] ${label}: ${duration}ms`, extra); }catch(_err){ /* no-op */ }
  }

  function perfNow(){
    try{ return performance.now(); }catch(_err){ return Date.now(); }
  }

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    collectEls();
    bindUI();
    initSaveIntegration();
    scheduleLocalCardLoad();
  }

  function collectEls(){
    ['apiBadge','bo3Selector','dropzone','dropzoneStatus','fileInput','browseButton','clearButton','fileList','statusText','detectedPlayer','detectedOpponent','detectedTurns','detectedActions','analysisTabs','sessionRecord','sessionOpponent','sessionTurns','sessionPlayDraw','sessionLore','sessionMatchup','coachTitle','coachText','coachConfidence','matchPills','resultHero','keyMoments','nextAction','momentFortPanel','shareMatchButton','mulliganPanel','mulliganSubtitle','mulliganButton','mulliganCards','handTooltip','inkFloatTotal','inkFloatAverage','actionRatioKpi','actionRatioLabel','topDeckTurns','topDeckBadge','questChallengeCenter','questChallengeGauge','questChallengeInsight','questCountLabel','challengeCountLabel','statsScopeSubtitle','topQuestersTitle','topQuestersHelp','mostInkedTitle','mostInkedHelp','playTimingTitle','playTimingHelp','challengeTitle','challengeHelp','topQuestersTable','mostInkedTable','playTimingTable','challengeTable','cardsGrid','cardsSubtitle','inkwellPanel','inkwellTimeline','inkwellSubtitle','timelineList','timelineFilter','cardModal','modalBody','closeModal','topQuestersSort','mostInkedSort','playTimingSort','challengeSort','inkChartSubtitle','actionChartTitle','actionChartSubtitle','quickInsights','deadWeightTitle','deadWeightHelp','deadWeightTable','deckDepthMatch','deckDepthMatchPanel','performanceDeckDepth','performanceOpeningConsistency','saveAnalysisPanel','saveAnalysisButton','saveAnalysisStatus','saveDeckSelect','saveDeckNameInput','saveDeckHint','saveDeckPills','performanceLoginHint','performanceColorFilter','performanceColorPills','performanceOpponentColorFilter','performanceOpponentColorPills','performanceVersionBlock','performanceDeckPills','performanceFormatPills','performanceTempoFilter','performanceTempoPills','performanceResultPills','performanceResetFilters','performanceSavedCount','performanceWinrate','performanceBo3Count','performanceFavoriteMatchup','performanceStreak','performanceStreakHelp','performanceStreakCard','performanceSampleLabel','performanceSampleHelp','performanceTopLore','performanceTopLoreHelp','performanceMostInked','performanceMostInkedHelp','performanceOtpSplit','performanceOtpSplitHelp','performanceFormatSplit','performanceFormatSplitHelp','performanceAvgTurns','performanceAvgTurnsHelp','performanceTopDeckAvg','performanceTopDeckAvgHelp','performanceAvgLore','performanceAvgLoreHelp','performanceDataQuality','performanceDataQualityHelp','performanceCoachTitle','performanceCoachText','performanceActionPlan','performanceBestSignal','performanceBestSignalText','performanceWarningSignal','performanceWarningSignalText','performanceMatchupBreakdown','performanceCardImpactTable','performanceMulliganTable','performanceTurnCurveTable','postImportCleanupList','historyList','historyStatus','historyRefreshButton','historyColorFilter','historyColorPills','historyOpponentColorFilter','historyOpponentColorPills','historyVersionBlock','historyDeckPills','historyFormatPills','historyTempoFilter','historyTempoPills','historyResultPills','historyResetFilters','historyFormatFilter','historyTempoFilter','historyResultFilter','historyDeckFilter','performanceDeckFilter','performanceFormatFilter','performanceResultFilter','historySearchInput','historyDetail','loreChartSummary','actionChartSummary','inkChartSummary','questChartSummary','handChartSummary','boardChartSummary','deckManagerRefresh','deckManagerStatus','deckManagerList','dataQualityTitle','dataQualityText','dataQualitySummary','duelinkTokenInput','duelinkTestButton','duelinkPreviewButton','duelinkImportButton','duelinkImport50Button','duelinkImport100Button','duelinkImportAllButton','duelinkImportSaveButton','duelinkSaveTokenButton','duelinkForgetTokenButton','duelinkSavedTokenHint','duelinkTokenStatus','duelinkTestResult','duplicateAuditList','bulkImportPanel','bulkImportStatus','bulkDeckTools','bulkImportList','bulkSaveAllButton','bulkImportMoreButton','bulkClearButton','cloudStatusBanner','cloudStatusDismiss','performancePoolBlock','performancePoolPills','performanceSetBlock','performanceSetPills','historyPoolBlock','historyPoolPills','historySetBlock','historySetPills','performancePoolFilter','performanceSetFilter','historyPoolFilter','historySetFilter','performanceArchetypeBlock','performanceArchetypePills','performanceArchetypeFilter','historyArchetypeBlock','historyArchetypePills','historyArchetypeFilter','teamSection','teamContextBarStats','teamContextBarHistory','performanceDateFrom','performanceDateTo','performanceDateCustom','historyDateFrom','historyDateTo','historyDateCustom'].forEach(id => els[id] = $(id));
  }

  function bindUI(){
    // V129.1 — halo souris conservé, mais lissé.
    // On garde l'effet premium de halo qui suit la souris, sans utiliser de calque bluré
    // susceptible de produire un rectangle visible en haut de page.
    document.documentElement.style.setProperty('--mx', '50%');
    document.documentElement.style.setProperty('--my', '18%');
    const pointerAura = { x: 50, y: 18, tx: 50, ty: 18, raf: 0 };
    const applyPointerAura = () => {
      pointerAura.x += (pointerAura.tx - pointerAura.x) * 0.09;
      pointerAura.y += (pointerAura.ty - pointerAura.y) * 0.09;
      document.documentElement.style.setProperty('--mx', `${pointerAura.x.toFixed(2)}%`);
      document.documentElement.style.setProperty('--my', `${pointerAura.y.toFixed(2)}%`);
      if(Math.abs(pointerAura.tx - pointerAura.x) > 0.05 || Math.abs(pointerAura.ty - pointerAura.y) > 0.05){
        pointerAura.raf = requestAnimationFrame(applyPointerAura);
      } else {
        pointerAura.raf = 0;
      }
    };
    const updatePointerAura = e => {
      pointerAura.tx = Math.max(0, Math.min(100, (e.clientX / Math.max(1, window.innerWidth)) * 100));
      pointerAura.ty = Math.max(0, Math.min(100, (e.clientY / Math.max(1, window.innerHeight)) * 100));
      if(!pointerAura.raf) pointerAura.raf = requestAnimationFrame(applyPointerAura);
    };
    const finePointer = window.matchMedia?.('(pointer:fine)')?.matches !== false;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
    if(finePointer && !reduceMotion){
      document.addEventListener('pointermove', event => {
        if(event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        updatePointerAura(event);
      }, { passive:true });
    }

    initMobileViewportNav();

    const resetReplayFileInput = () => { if(els.fileInput) els.fileInput.value = ''; };
    const openReplayFilePicker = () => {
      if(!els.fileInput) return;
      resetReplayFileInput();
      // Important iOS/Safari: keep the click in the same user gesture.
      // A setTimeout here can open the picker, then return without a change event.
      els.fileInput.click();
    };
    ['pointerdown','touchstart'].forEach(type => els.browseButton?.addEventListener(type, resetReplayFileInput, { passive:true }));
    els.browseButton?.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openReplayFilePicker();
      }
    });
    els.dropzone?.addEventListener('click', e => {
      if(e.target?.closest?.('#browseButton') || e.target === els.fileInput) return;
      openReplayFilePicker();
    });
    els.dropzone?.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openReplayFilePicker(); } });
    els.fileInput?.addEventListener('click', resetReplayFileInput);
    els.fileInput?.addEventListener('change', e => {
      const files = Array.from(e.target.files || []);
      if(files.length) handleFiles(files);
    });
    ['dragenter','dragover'].forEach(type => els.dropzone?.addEventListener(type, e => { e.preventDefault(); els.dropzone.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(type => els.dropzone?.addEventListener(type, e => { e.preventDefault(); els.dropzone.classList.remove('dragover'); }));
    els.dropzone?.addEventListener('drop', e => handleFiles([...e.dataTransfer.files]));
    els.clearButton?.addEventListener('click', () => { clearReplays(); setTab('overview'); });
    els.bulkSaveAllButton?.addEventListener('click', saveBulkQueue);
    els.bulkImportMoreButton?.addEventListener('click', () => { if(els.fileInput){ els.fileInput.value = ''; els.fileInput.click(); } });
    els.bulkClearButton?.addEventListener('click', clearBulkQueue);

    document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
    els.analysisTabs?.addEventListener('keydown', handleTabsKeydown);
    document.querySelectorAll('[data-scope]').forEach(btn => btn.addEventListener('click', () => setScope(btn.dataset.scope)));
    document.querySelectorAll('[data-card-filter]').forEach(btn => btn.addEventListener('click', () => setCardFilter(btn.dataset.cardFilter)));
    document.addEventListener('click', handleOpponentDeckExportClick);
    [els.topQuestersSort, els.mostInkedSort, els.playTimingSort, els.challengeSort, els.timelineFilter].forEach(el => el?.addEventListener('change', renderAll));
    els.closeModal?.addEventListener('click', closeCardModal);
    els.mulliganButton?.addEventListener('click', toggleMulliganResolution);
    els.saveAnalysisButton?.addEventListener('click', saveCurrentAnalysis);
    els.historyRefreshButton?.addEventListener('click', () => refreshSavedMatches({ force:true }));
    els.performanceResetFilters?.addEventListener('click', resetPerformanceFilters);
    els.historyResetFilters?.addEventListener('click', resetHistoryFilters);
    els.deckManagerRefresh?.addEventListener('click', async () => { await refreshDeckProfiles({ force:true, silent:true }); await refreshSavedMatches({ force:true, silent:true }); renderAccountPage(); });
    els.duelinkTestButton?.addEventListener('click', testDuelinkToken);
    els.duelinkPreviewButton?.addEventListener('click', previewDuelinkMatches);
    els.duelinkImportButton?.addEventListener('click', () => importDuelinkPreviewAndSave({ limit:25 }));
    els.duelinkImport50Button?.addEventListener('click', () => importDuelinkPreviewAndSave({ limit:50 }));
    els.duelinkImport100Button?.addEventListener('click', () => importDuelinkPreviewAndSave({ limit:100 }));
    els.duelinkImportAllButton?.addEventListener('click', () => importDuelinkPreviewAndSave({ limit:'all' }));
    els.duelinkTestResult?.addEventListener('click', handleDuelinkImportFilterClick);
    els.duelinkSaveTokenButton?.addEventListener('click', saveDuelinkTokenForAccount);
    els.duelinkForgetTokenButton?.addEventListener('click', forgetDuelinkTokenForAccount);
    els.duelinkTokenInput?.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); testDuelinkToken(); } });
    els.duelinkTokenInput?.addEventListener('input', updateDuelinkStoredTokenUi);
    [els.historyColorFilter, els.historyOpponentColorFilter, els.historyFormatFilter, els.historyTempoFilter, els.historyResultFilter, els.historyDeckFilter, els.historyArchetypeFilter, els.performanceColorFilter, els.performanceOpponentColorFilter, els.performanceDeckFilter, els.performanceArchetypeFilter, els.performanceFormatFilter, els.performanceTempoFilter, els.performanceResultFilter, els.historySearchInput].forEach(el => el?.addEventListener('input', renderPerformanceData));
    document.addEventListener('click', handlePerformanceFilterClick);
    document.addEventListener('click', handleAccountDeckManagerClick);
    document.addEventListener('change', handlePerformanceSortChange);
    document.addEventListener('click', handleMulliganLabFilterClick);
    document.addEventListener('click', handleResponsiveFilterToggle);
    document.addEventListener('click', handleBulkQueueClick);
    document.addEventListener('click', handlePostImportCleanupClick);
    document.addEventListener('click', handlePerformanceDetailClick);
    document.addEventListener('click', handleDateFilterClick);
    [els.performanceDateFrom, els.performanceDateTo].forEach(el => el?.addEventListener('change', () => {
      state.dateFilter.stats.from = els.performanceDateFrom?.value || null;
      state.dateFilter.stats.to = els.performanceDateTo?.value || null;
      renderPerformanceData();
    }));
    [els.historyDateFrom, els.historyDateTo].forEach(el => el?.addEventListener('change', () => {
      state.dateFilter.history.from = els.historyDateFrom?.value || null;
      state.dateFilter.history.to = els.historyDateTo?.value || null;
      renderPerformanceData();
    }));
    document.addEventListener('click', handlePerformanceListModalClick);
    document.addEventListener('click', handleDataMaintenanceClick);
    document.addEventListener('click', handleDuelinkNavigationClick);
    document.addEventListener('click', handleInfoDotClick);
    [els.saveDeckSelect, els.saveDeckNameInput].forEach(el => el?.addEventListener('input', () => syncSaveButton()));
    document.querySelectorAll('[data-app-view="performances"], [data-performance-view]').forEach(btn => btn.addEventListener('click', () => {
      setTimeout(() => refreshSavedMatches({ silent:true }), 0);
    }));
    els.cardModal?.addEventListener('click', e => { if(e.target === els.cardModal) closeCardModal(); });
    document.addEventListener('keydown', handleModalKeydown);
    bindTeamEvents();
  }


  function normalizeDuelinkTokenInput(value){
    return String(value || '').trim().replace(/^Bearer\s+/i, '');
  }

  function formatShortDateTime(value){
    const date = value ? new Date(value) : null;
    if(!date || Number.isNaN(date.getTime())) return 'date inconnue';
    return new Intl.DateTimeFormat('fr-CH', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(date);
  }

  function duelinkSourceLabel(value){
    const key = String(value || '').toLowerCase();
    if(key === 'matchmaking') return 'Matchmaking';
    if(key === 'private') return 'Private';
    if(key === 'bot') return 'Bot';
    return value ? String(value) : 'Source inconnue';
  }

  function renderDuelinkTestResult(payload){
    if(!els.duelinkTestResult) return;
    const games = Array.isArray(payload?.games) ? payload.games : [];
    if(!games.length){
      els.duelinkTestResult.innerHTML = `<div class="duelink-result-empty"><strong>Token valide, mais aucun match retourné.</strong><span>L’API a répondu correctement. Il n’y a simplement pas de partie dans les 5 dernières lignes accessibles.</span></div>`;
      return;
    }
    const newest = games.slice().sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
    const replayCount = games.filter(game => game.replayId).length;
    const sourceSet = [...new Set(games.map(game => duelinkSourceLabel(game.source)).filter(Boolean))];
    const rows = games.map((game, index) => {
      const title = game.opponent ? `vs ${esc(game.opponent)}` : `Match Duels.ink ${game.id ? `<span class="duelink-row-id">${esc(String(game.id).slice(0, 10))}</span>` : `#${index + 1}`}`;
      const source = duelinkSourceLabel(game.source);
      const queue = game.queue ? esc(String(game.queue)) : 'queue inconnue';
      const replay = game.replayId ? 'Replay OK' : 'Replay non indiqué';
      const date = formatShortDateTime(game.updatedAt);
      const dateLabel = game.dateSource === 'id' ? `${date} · estimée via ID` : date;
      return `<li>
        <div class="duelink-row-main"><strong>${title}</strong><span>${esc(dateLabel)}</span></div>
        <div class="duelink-row-meta"><span>${esc(source)}</span><span>${queue}</span><span>${esc(replay)}</span></div>
      </li>`;
    }).join('');
    els.duelinkTestResult.innerHTML = `
      <div class="duelink-result-summary">
        <div><strong>Connexion validée</strong><span>${games.length} match(s) lus sur Duels.ink. Test uniquement : rien n’est ajouté à l’historique.</span></div>
        <div class="duelink-mini-stats" aria-label="Résumé du test Duels.ink">
          <span><b>${games.length}</b><small>matchs lus</small></span>
          <span><b>${replayCount}</b><small>replays OK</small></span>
          <span><b>${esc(formatShortDateTime(newest?.updatedAt))}</b><small>dernier match</small></span>
          <span><b>${esc(sourceSet.join(', ') || 'Source inconnue')}</b><small>source</small></span>
        </div>
      </div>
      <ul class="duelink-result-list">${rows}</ul>`;
  }


  function collectPreparedDuelinkRefs(){
    return {
      gameIds: state.duelinkPreparedGameIds instanceof Set ? state.duelinkPreparedGameIds : new Set(),
      replayIds: state.duelinkPreparedReplayIds instanceof Set ? state.duelinkPreparedReplayIds : new Set()
    };
  }

  function collectSkippedDuelinkRefs(){
    return {
      gameIds: state.duelinkSkippedGameIds instanceof Set ? state.duelinkSkippedGameIds : new Set(),
      replayIds: state.duelinkSkippedReplayIds instanceof Set ? state.duelinkSkippedReplayIds : new Set()
    };
  }

  function duelinkGameId(game={}){
    return game?.id || game?.game_id || game?.duelink_game_id || '';
  }

  function duelinkReplayId(game={}){
    return game?.replayId || game?.replay_id || game?.duelink_replay_id || '';
  }

  function markDuelinkRowAsPrepared(game={}){
    const gameId = duelinkGameId(game);
    const replayId = duelinkReplayId(game);
    if(!(state.duelinkPreparedGameIds instanceof Set)) state.duelinkPreparedGameIds = new Set();
    if(!(state.duelinkPreparedReplayIds instanceof Set)) state.duelinkPreparedReplayIds = new Set();
    if(gameId) state.duelinkPreparedGameIds.add(String(gameId));
    if(replayId) state.duelinkPreparedReplayIds.add(String(replayId));
  }

  function markDuelinkRowAsSkipped(game={}){
    const gameId = duelinkGameId(game);
    const replayId = duelinkReplayId(game);
    if(!(state.duelinkSkippedGameIds instanceof Set)) state.duelinkSkippedGameIds = new Set();
    if(!(state.duelinkSkippedReplayIds instanceof Set)) state.duelinkSkippedReplayIds = new Set();
    if(gameId) state.duelinkSkippedGameIds.add(String(gameId));
    if(replayId) state.duelinkSkippedReplayIds.add(String(replayId));
  }

  function collectDuelinkRefsFromBulkQueue(){
    const gameIds = new Set();
    const replayIds = new Set();
    const replayHashes = new Set();
    (state.bulkQueue || []).forEach(item => {
      const game = item?.duelinkGame || item?.merged?.apiRow || item?.merged?.api_row || {};
      const api = apiMetadataForSavedData(item?.merged) || {};
      const gameId = game.id || game.duelink_game_id || api.duelink_game_id || item?.merged?.duelinkGameId || '';
      const replayId = game.replayId || game.replay_id || api.duelink_replay_id || item?.merged?.duelinkReplayId || '';
      if(gameId) gameIds.add(String(gameId));
      if(replayId) replayIds.add(String(replayId));
      const hash = replaySha256ForSavedData(item?.merged) || item?.replays?.find(entry => entry?.replaySha256)?.replaySha256 || '';
      if(hash) replayHashes.add(String(hash));
    });
    return { gameIds, replayIds, replayHashes };
  }

  function collectSavedDuelinkRefs(){
    const gameIds = new Set();
    const replayIds = new Set();
    const rows = Array.isArray(state.savedMatches) ? state.savedMatches : [];
    rows.forEach(row => {
      if(row?.duelink_match_id) gameIds.add(String(row.duelink_match_id));
      if(row?.analysis_json?.duelink_game_id) gameIds.add(String(row.analysis_json.duelink_game_id));
      if(row?.analysis_json?.duelink_replay_id) replayIds.add(String(row.analysis_json.duelink_replay_id));
      if(row?.api_metadata?.game_id) gameIds.add(String(row.api_metadata.game_id));
      if(row?.api_metadata?.duelink_game_id) gameIds.add(String(row.api_metadata.duelink_game_id));
      if(row?.analysis_json?.api_metadata?.duelink_game_id) gameIds.add(String(row.analysis_json.api_metadata.duelink_game_id));
      if(row?.api_metadata?.replay_id) replayIds.add(String(row.api_metadata.replay_id));
      if(row?.api_metadata?.duelink_replay_id) replayIds.add(String(row.api_metadata.duelink_replay_id));
      if(row?.analysis_json?.api_metadata?.duelink_replay_id) replayIds.add(String(row.analysis_json.api_metadata.duelink_replay_id));
    });
    const games = Array.isArray(state.savedAnalytics?.games) ? state.savedAnalytics.games : [];
    games.forEach(row => {
      if(row?.duelink_game_id) gameIds.add(String(row.duelink_game_id));
      if(row?.duelink_replay_id) replayIds.add(String(row.duelink_replay_id));
      if(row?.api_row?.id) gameIds.add(String(row.api_row.id));
      if(row?.api_row?.replayId || row?.api_row?.replay_id) replayIds.add(String(row.api_row.replayId || row.api_row.replay_id));
    });
    return { gameIds, replayIds };
  }

  function collectAllDuelinkRefs(){
    const saved = collectSavedDuelinkRefs();
    const queued = collectDuelinkRefsFromBulkQueue();
    const prepared = collectPreparedDuelinkRefs();
    const skipped = collectSkippedDuelinkRefs();
    return {
      savedGameIds:saved.gameIds,
      savedReplayIds:saved.replayIds,
      queuedGameIds:new Set([...queued.gameIds, ...prepared.gameIds]),
      queuedReplayIds:new Set([...queued.replayIds, ...prepared.replayIds]),
      skippedGameIds:skipped.gameIds,
      skippedReplayIds:skipped.replayIds,
      queuedReplayHashes:queued.replayHashes
    };
  }

  function duelinkPreviewStatus(game, refs){
    const gameId = game?.id || game?.game_id || game?.duelink_game_id ? String(game.id || game.game_id || game.duelink_game_id) : '';
    const replayId = game?.replayId || game?.replay_id || game?.duelink_replay_id ? String(game.replayId || game.replay_id || game.duelink_replay_id) : '';
    if((gameId && refs.savedGameIds?.has(gameId)) || (replayId && refs.savedReplayIds?.has(replayId))){
      return { key:'existing', label:'Déjà présent' };
    }
    if((gameId && refs.queuedGameIds?.has(gameId)) || (replayId && refs.queuedReplayIds?.has(replayId))){
      return { key:'queued', label:'Déjà dans la file' };
    }
    if((gameId && refs.skippedGameIds?.has(gameId)) || (replayId && refs.skippedReplayIds?.has(replayId))){
      return { key:'skipped', label:'Mis de côté' };
    }
    return { key:'new', label:'Nouveau' };
  }

  function refreshDuelinkPreviewStatuses(){
    const rows = state.duelinkPreviewRows || [];
    if(!rows.length){
      syncDuelinkActionButtons(0);
      return;
    }
    const refs = collectAllDuelinkRefs();
    rows.forEach(row => {
      if(row?.game) row.status = duelinkPreviewStatus(row.game, refs);
    });
    syncDuelinkActionButtons();
  }

  // ----- Filtres d'import Duels.ink (format / pool) -----
  function gameQueueString(game){
    return [game?.queue, game?.queue_id, game?.apiRow?.queue, game?.apiRow?.queue_id, game?.source]
      .map(value => String(value || '')).filter(Boolean).join(' ').toLowerCase();
  }
  function isLimitedFormatGame(game){
    const q = gameQueueString(game);
    return !!q && (/\b(sealed|pack[\s_-]*rush|packrush|draft|booster)\b/.test(q) || q.includes('scell'));
  }
  function gamePool(game){
    const q = gameQueueString(game);
    if(!q) return '';
    if(isLimitedFormatGame(game)) return 'limited';
    if(q.includes('infinity')) return 'infinity';
    if(q.includes('core')) return 'core';
    return '';
  }
  function gameFormatKey(game){
    const f = String(game?.format || '').toUpperCase();
    if(f.includes('BO3')) return 'BO3';
    if(f.includes('BO1')) return 'BO1';
    return '';
  }
  function duelinkImportFilters(){
    const f = state.duelinkImportFilters || {};
    return { format:f.format || 'all', pool:f.pool || 'all' };
  }
  function gamePassesImportFilters(game){
    const f = duelinkImportFilters();
    if(f.format !== 'all' && gameFormatKey(game) !== f.format) return false;
    if(f.pool !== 'all' && gamePool(game) !== f.pool) return false;
    return true;
  }

  function getDuelinkImportableRows(){
    return (state.duelinkPreviewRows || []).filter(row => row?.status?.key === 'new' && row?.game?.replayId && gamePassesImportFilters(row.game));
  }

  function setDuelinkBatchButton(button, count, limit, busy){
    if(!button) return;
    const numericLimit = limit === 'all' ? count : Math.max(1, n(limit, 25));
    const toImport = limit === 'all' ? count : Math.min(numericLimit, count);
    button.hidden = !count;
    button.disabled = !count || busy;
    if(!count){
      button.textContent = limit === 'all' ? 'Tout importer' : `Importer ${numericLimit}`;
      return;
    }
    button.textContent = limit === 'all' ? `Tout importer (${count})` : `Importer ${toImport}`;
  }

  function syncDuelinkActionButtons(newCount=null){
    const count = newCount === null ? getDuelinkImportableRows().length : n(newCount);
    const busy = !!(state.duelinkImporting || state.duelinkAutoSaving);
    setDuelinkBatchButton(els.duelinkImportButton, count, 25, busy);
    setDuelinkBatchButton(els.duelinkImport50Button, count, 50, busy);
    setDuelinkBatchButton(els.duelinkImport100Button, count, 100, busy);
    setDuelinkBatchButton(els.duelinkImportAllButton, count, 'all', busy);
    if(els.duelinkImportSaveButton){
      els.duelinkImportSaveButton.hidden = true;
      els.duelinkImportSaveButton.disabled = true;
    }
  }

  function duelinkFormatLabel(value){
    const text = String(value || '').toUpperCase();
    if(text.includes('BO3')) return 'BO3';
    if(text.includes('BO1')) return 'BO1';
    return value ? String(value) : 'Format inconnu';
  }

  function classifyDuelinkRows(games=[]){
    const refs = collectAllDuelinkRefs();
    return (games || []).map((game, index) => ({ game, index, status:duelinkPreviewStatus(game, refs) }));
  }

  function duelinkPreviewStats(classified=[]){
    const games = classified.map(row => row.game).filter(Boolean);
    const newRows = classified.filter(row => row.status.key === 'new');
    const newWithReplay = newRows.filter(row => row.game?.replayId);
    const skipped = classified.filter(row => row.status.key === 'skipped');
    const missingReplay = [...newRows.filter(row => !row.game?.replayId), ...skipped];
    const existing = classified.filter(row => row.status.key === 'existing');
    const queued = classified.filter(row => row.status.key === 'queued');
    const replayCount = games.filter(game => game.replayId).length;
    const newest = games.slice().sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
    const oldest = games.slice().sort((a,b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0))[0];
    const sources = [...new Set(games.map(game => duelinkSourceLabel(game.source)).filter(Boolean))];
    return { games, newRows, newWithReplay, missingReplay, existing, queued, skipped, replayCount, newest, oldest, sources };
  }

  function renderDuelinkScanProgress({ page=0, total=0, cursor='', done=false, error='' }={}){
    if(!els.duelinkTestResult) return;
    const title = error ? 'Synchronisation interrompue' : (done ? 'Scan Duels.ink terminé' : 'Scan Duels.ink en cours');
    const text = error
      ? error
      : (done ? `${total} partie${total > 1 ? 's' : ''} lue${total > 1 ? 's' : ''} dans l’historique Duels.ink.` : `Page ${page} lue · ${total} partie${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}.`);
    const percent = done ? 100 : Math.min(95, Math.max(12, page * 7));
    els.duelinkTestResult.innerHTML = `<div class="duelink-import-progress ${done ? 'is-complete' : ''}">
      <div class="duelink-import-progress-head"><strong>${esc(title)}</strong><span>${esc(String(total))}</span></div>
      <div class="duelink-progressbar"><i style="width:${percent}%"></i></div>
      <div class="duelink-import-summary-card ${error ? 'error' : ''}">
        <strong>${esc(text)}</strong>
        <span>${cursor && !done ? 'Duels.ink a encore des pages à lire. Le scan continue automatiquement.' : 'Aucun filtre n’est appliqué à l’import : InkSight récupère tout, les filtres viendront ensuite dans Historique et Performance.'}</span>
      </div>
    </div>`;
  }


  function stableJsonStringify(value){
    if(value === null || value === undefined) return 'null';
    if(Array.isArray(value)) return `[${value.map(stableJsonStringify).join(',')}]`;
    if(typeof value === 'object'){
      return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function simpleHashText(input=''){
    let h = 2166136261;
    const text = String(input || '');
    for(let i = 0; i < text.length; i += 1){
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function apiDecklistCardId(card={}){
    return String(card.cardId || card.card_id || card.id || card.lorcanaId || card.name || card.cardName || card.fullName || '').trim();
  }

  function apiDecklistCardName(card={}){
    return String(card.name || card.cardName || card.fullName || card.title || card.cardId || card.card_id || '').trim();
  }

  function apiDecklistCardCount(card={}){
    const count = n(card.count ?? card.quantity ?? card.qty ?? card.copies ?? 1, 1);
    return Math.max(1, count || 1);
  }

  function normalizeApiDecklist(decklist){
    if(!Array.isArray(decklist)) return [];
    const byId = new Map();
    decklist.forEach(raw => {
      if(!raw || typeof raw !== 'object') return;
      const id = apiDecklistCardId(raw);
      if(!id) return;
      const previous = byId.get(id) || { id, name:apiDecklistCardName(raw) || id, count:0 };
      previous.count += apiDecklistCardCount(raw);
      if(!previous.name || previous.name === previous.id) previous.name = apiDecklistCardName(raw) || previous.id;
      byId.set(id, previous);
    });
    return [...byId.values()].sort((a,b) => a.id.localeCompare(b.id));
  }

  function apiDecklistSummary(decklist){
    const cards = normalizeApiDecklist(decklist);
    const copies = cards.reduce((sum, card) => sum + n(card.count), 0);
    const hash = cards.length ? simpleHashText(stableJsonStringify(cards.map(card => [card.id, card.count]))) : '';
    return { cards, unique:cards.length, copies, hash };
  }

  const SENSITIVE_DUELINK_OPPONENT_DECK_KEYS = new Set([
    'opponentDecklist', 'opponent_decklist', 'oppDecklist', 'opp_decklist',
    'enemyDecklist', 'enemy_decklist', 'opponentDeck', 'opponent_deck',
    'opponent_deck_hash', 'opponentDeckHash',
    'opponent_deck_unique_cards', 'opponentDeckUniqueCards',
    'opponent_deck_copies', 'opponentDeckCopies'
  ]);

  function sanitizeDuelinkApiObject(value, seen=new WeakSet()){
    if(!value || typeof value !== 'object') return value;
    if(seen.has(value)) return null;
    seen.add(value);
    if(Array.isArray(value)) return value.map(item => sanitizeDuelinkApiObject(item, seen));
    const clean = {};
    Object.entries(value).forEach(([key, nested]) => {
      if(SENSITIVE_DUELINK_OPPONENT_DECK_KEYS.has(key) || /^opp(?:onent)?_?deck(?:list|_hash|_copies|_unique_cards)?$/i.test(key) || /^enemy_?deck(list)?$/i.test(key)) return;
      clean[key] = sanitizeDuelinkApiObject(nested, seen);
    });
    return clean;
  }

  function apiDecklistStatus(rowOrMeta={}, side='mine'){
    if(side !== 'mine') return { cards:[], unique:0, copies:0, hash:'', source:'unavailable', label:'Deck adverse non exporté' };
    const meta = rowOrMeta?.api_metadata || rowOrMeta?.analysis_json?.api_metadata || rowOrMeta || {};
    const direct = rowOrMeta?.my_decklist || meta.my_decklist
      || meta?.api_row?.raw?.your_decklist || meta?.api_row?.raw?.my_decklist;
    const summary = apiDecklistSummary(direct);
    if(summary.unique) return { ...summary, source:'api', label:'Decklist API complète' };
    return { ...summary, source:'estimated', label:'Decklist estimée' };
  }

  function apiDecklistBadgesHtml(row){
    const sourceType = String(row?.source_type || row?.analysis_json?.source_type || '').toLowerCase();
    if(!sourceType.includes('duelink')) return '';
    const badges = [];
    const mine = apiDecklistStatus(row, 'mine');
    if(mine.source === 'api') badges.push(`<em class="history-source-badge decklist complete">Votre deck complet · ${n(mine.copies)} cartes</em>`);
    return badges.length ? `<span class="history-api-badges">${badges.join('')}</span>` : '';
  }

  function decklistPreviewHtml(title, status){
    if(!status || status.source !== 'api' || !status.unique) return '';
    const top = (status.cards || []).slice(0, 8).map(card => `<li><b>${n(card.count)}x</b><span>${esc(card.name || card.id)}</span></li>`).join('');
    return `<div class="api-decklist-panel">
      <div class="api-decklist-head"><strong>${esc(title)}</strong><span>${n(status.unique)} cartes uniques · ${n(status.copies)} cartes au total</span></div>
      <ul>${top}</ul>
    </div>`;
  }

  function renderDuelinkPreviewResult(payload){
    if(!els.duelinkTestResult) return;
    const games = Array.isArray(payload?.games) ? payload.games : [];
    const classified = payload?.classified || classifyDuelinkRows(games);
    state.duelinkPreviewRows = classified;
    const stats = duelinkPreviewStats(classified);
    // Les compteurs des boutons reflètent les filtres d'import actifs.
    syncDuelinkActionButtons();

    if(!games.length){
      els.duelinkTestResult.innerHTML = `<div class="duelink-result-empty"><strong>Aucune partie trouvée.</strong><span>L’API répond, mais aucun match terminé n’a été retourné dans l’historique Duels.ink.</span></div>`;
      return;
    }

    const sourceSummary = stats.sources.join(', ') || 'Sources inconnues';
    const ready = stats.newWithReplay.length;
    const filteredReady = getDuelinkImportableRows().length;
    const already = stats.existing.length + stats.queued.length;
    els.duelinkTestResult.innerHTML = `
      <div class="duelink-result-summary duelink-result-summary-compact">
        <div><strong>Synchronisation prête</strong><span>${games.length} partie${games.length > 1 ? 's' : ''} trouvée${games.length > 1 ? 's' : ''}. Affinez éventuellement par format/pool puis choisissez un volume d’import.</span></div>
        <div class="duelink-mini-stats" aria-label="Résumé synchronisation Duels.ink">
          <span><b>${games.length}</b><small>trouvées</small></span>
          <span><b>${ready}</b><small>nouvelles</small></span>
          <span><b>${filteredReady}</b><small>après filtres</small></span>
          <span><b>${already}</b><small>déjà dans InkSight</small></span>
          <span><b>${stats.missingReplay.length}</b><small>sans replay</small></span>
          <span><b>${esc(formatShortDateTime(stats.newest?.updatedAt))}</b><small>plus récent</small></span>
        </div>
        ${duelinkImportFiltersHtml(games)}
        ${duelinkQueueReadoutHtml(games)}
        ${duelinkReplayDiagnosticHtml(games)}
      </div>`;
  }

  // Ventilation des matchs « sans replay » : Duels.ink ne génère pas de replay
  // pour les parties abandonnées/interrompues (rien à importer, normal). Les
  // parties complètes sans replay_id n'ont simplement pas (encore) de replay
  // généré côté Duels.ink → ouvrir « Replay » sur la partie puis resynchroniser.
  function duelinkReplayDiagnosticHtml(games=[]){
    const missing = (games || []).filter(g => g && !g.replayId);
    if(!missing.length) return '';
    const isAbandon = g => {
      const r = String(g.result || g.apiRow?.result || '').toLowerCase();
      const er = String(g.apiRow?.end_reason || '').toLowerCase();
      const turns = n(g.apiRow?.turns);
      return r === 'abandoned' || er === 'abandoned' || r === 'incomplete' || (turns > 0 && turns <= 1);
    };
    const abandoned = missing.filter(isAbandon).length;
    const completed = missing.length - abandoned;
    return `<details class="duelink-queue-readout">
      <summary>Pourquoi ${missing.length} « sans replay » ?</summary>
      <div class="duelink-diag-line">• <b>${abandoned}</b> partie(s) abandonnée(s)/interrompue(s) : Duels.ink ne génère pas de replay → rien à importer (normal).</div>
      <div class="duelink-diag-line">• <b>${completed}</b> partie(s) complète(s) sans replay disponible : le replay n'a pas (encore) été généré côté Duels.ink. Ouvre « Replay » sur la partie dans Duels.ink, puis resynchronise.</div>
    </details>`;
  }

  function duelinkImportFiltersHtml(games=[]){
    const f = duelinkImportFilters();
    const pill = (group, value, label, active) =>
      `<button type="button" class="filter-pill" data-duelink-import-filter="${escAttr(group)}" data-value="${escAttr(value)}" aria-pressed="${active ? 'true' : 'false'}">${esc(label)}</button>`;
    const formats = new Set(games.map(gameFormatKey).filter(Boolean));
    const pools = new Set(games.map(gamePool).filter(Boolean));
    const poolLabels = { core:'Core', infinity:'Infinity', limited:'Limité' };
    const formatRow = formats.size > 1 ? `<div class="duelink-filter-row"><span class="duelink-filter-label">Format</span>
        ${pill('format','all','Tous', f.format === 'all')}${[...formats].sort().map(v => pill('format', v, v, f.format === v)).join('')}
      </div>` : '';
    const poolRow = pools.size > 1 ? `<div class="duelink-filter-row"><span class="duelink-filter-label">Pool</span>
        ${pill('pool','all','Tous', f.pool === 'all')}${[...pools].sort().map(v => pill('pool', v, poolLabels[v] || v, f.pool === v)).join('')}
      </div>` : '';
    if(!formatRow && !poolRow) return '';
    return `<div class="duelink-import-filters">${formatRow}${poolRow}</div>`;
  }

  function duelinkQueueReadoutHtml(games=[]){
    // Lecture des files Duels.ink réellement présentes (utile pour calibrer la
    // détection core/infinity/limité quand les libellés de l'API évoluent).
    const counts = new Map();
    games.forEach(game => {
      const label = String(game?.queue || '').trim() || '—';
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    const entries = [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0, 12);
    if(!entries.length) return '';
    const items = entries.map(([label, count]) => `<span class="duelink-queue-chip">${esc(label)} <b>${count}</b></span>`).join('');
    return `<details class="duelink-queue-readout"><summary>Files détectées (${counts.size})</summary><div class="duelink-queue-chips">${items}</div></details>`;
  }

  function handleDuelinkImportFilterClick(event){
    const btn = event.target.closest('[data-duelink-import-filter]');
    if(!btn) return;
    const group = btn.dataset.duelinkImportFilter;
    const value = btn.dataset.value || 'all';
    if(group !== 'format' && group !== 'pool') return;
    state.duelinkImportFilters = { ...duelinkImportFilters(), [group]:value };
    syncDuelinkActionButtons();
    renderDuelinkPreviewResult({ games:(state.duelinkPreviewRows || []).map(row => row.game), classified:state.duelinkPreviewRows });
  }

  function attachDuelinkMetadataToSession(session, game={}, replaySha256=''){
    if(!session) return session;
    session.sourceType = 'duelink_api';
    session.duelinkGameId = game.id || '';
    session.duelinkReplayId = game.replayId || '';
    session.duelinkSource = game.source || '';
    session.duelinkQueue = game.queue || '';
    session.duelinkFormat = game.format || '';
    session.duelinkUpdatedAt = game.updatedAt || null;
    session.playedAt = session.playedAt || game.updatedAt || null;
    session.replaySha256 = replaySha256 || session.replaySha256 || '';
    session.myDecklist = Array.isArray(game.myDecklist) ? game.myDecklist : null;
    delete session.opponentDecklist;
    const myDeckSummary = apiDecklistSummary(session.myDecklist);
    session.myDeckHash = myDeckSummary.hash || '';
    delete session.opponentDeckHash;
    session.apiRow = {
      id: game.id || null,
      replayId: game.replayId || null,
      source: game.source || null,
      queue: game.queue || null,
      updatedAt: game.updatedAt || null,
      dateSource: game.dateSource || null,
      format: game.format || null,
      opponent: game.opponent || null,
      result: game.result || null,
      myDeckHash: myDeckSummary.hash || null,
      myDeckUniqueCards: myDeckSummary.unique || 0,
      myDeckCopies: myDeckSummary.copies || 0,
      raw: sanitizeDuelinkApiObject(game.apiRow || null),
    };
    return session;
  }

  function openBulkImportArea(){
    document.querySelector('.app-nav-button[data-app-view="analysis"]')?.click();
    setTab('overview');
    requestAnimationFrame(() => {
      const target = els.bulkImportPanel || document.getElementById('bulkImportPanel') || els.dropzone;
      target?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  }

  function handleDuelinkNavigationClick(event){
    const button = event.target.closest('[data-duelink-go-bulk]');
    if(!button) return;
    event.preventDefault();
    openBulkImportArea();
  }


  async function duelinkAuthHeaders(extra={}){
    const headers = { ...extra };
    try{
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      if(accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }catch(err){ console.warn('Session Supabase indisponible pour Duels.ink', err); }
    return headers;
  }

  async function duelinkTokenPayload(){
    const token = normalizeDuelinkTokenInput(els.duelinkTokenInput?.value || '');
    return token ? { token } : {};
  }

  async function hasDuelinkTokenAvailable(){
    const token = normalizeDuelinkTokenInput(els.duelinkTokenInput?.value || '');
    return Boolean(token || state.duelinkConnection?.connected);
  }

  function updateDuelinkStoredTokenUi(){
    const connection = state.duelinkConnection;
    const connected = Boolean(connection?.connected);
    const hasTypedToken = Boolean(normalizeDuelinkTokenInput(els.duelinkTokenInput?.value || ''));
    if(els.duelinkSavedTokenHint){
      els.duelinkSavedTokenHint.textContent = connected
        ? 'Clé Duels.ink mémorisée. Vous pouvez synchroniser sans recoller la clé.'
        : 'Optionnel : mémorisez la clé de manière chiffrée pour éviter de la recoller à chaque session.';
    }
    if(els.duelinkTokenInput){
      els.duelinkTokenInput.placeholder = connected ? 'Clé mémorisée — nouvelle clé optionnelle' : 'Bearer token Duels.ink';
    }
    if(els.duelinkForgetTokenButton) els.duelinkForgetTokenButton.hidden = !connected;
    if(els.duelinkSaveTokenButton){
      els.duelinkSaveTokenButton.hidden = connected;
      els.duelinkSaveTokenButton.textContent = 'Mémoriser la clé chiffrée';
      els.duelinkSaveTokenButton.disabled = false;
    }
    if(connected && els.duelinkTokenStatus && !['Scan en cours…','Import en cours…','Test en cours…'].includes(els.duelinkTokenStatus.textContent || '')){
      els.duelinkTokenStatus.textContent = 'Connexion mémorisée';
      els.duelinkTokenStatus.className = 'duelink-status-chip ok';
    }
  }

  async function refreshDuelinkConnectionStatus({ silent=false }={}){
    if(!state.currentUser){
      state.duelinkConnection = null;
      state.duelinkConnectionLoaded = true;
      updateDuelinkStoredTokenUi();
      return null;
    }
    try{
      const response = await fetch('/api/duelink-token', {
        method:'GET',
        headers: await duelinkAuthHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if(!response.ok || !payload.success) throw new Error(payload.error || `Erreur HTTP ${response.status}`);
      state.duelinkConnection = payload;
      state.duelinkConnectionLoaded = true;
      updateDuelinkStoredTokenUi();
      return payload;
    }catch(err){
      state.duelinkConnection = null;
      state.duelinkConnectionLoaded = true;
      updateDuelinkStoredTokenUi();
      if(!silent && els.duelinkSavedTokenHint) els.duelinkSavedTokenHint.textContent = `Statut clé Duels.ink indisponible : ${err.message || err}`;
      return null;
    }
  }

  async function saveDuelinkTokenForAccount(){
    const token = normalizeDuelinkTokenInput(els.duelinkTokenInput?.value || '');
    if(!state.currentUser){
      if(els.duelinkSavedTokenHint) els.duelinkSavedTokenHint.textContent = 'Connectez-vous à InkSight avant de mémoriser une clé.';
      return;
    }
    if(!token){
      if(els.duelinkSavedTokenHint) els.duelinkSavedTokenHint.textContent = 'Collez une clé Duels.ink avant de la mémoriser.';
      return;
    }
    if(els.duelinkSaveTokenButton) els.duelinkSaveTokenButton.disabled = true;
    try{
      const response = await fetch('/api/duelink-token', {
        method:'POST',
        headers: await duelinkAuthHeaders({ 'Content-Type':'application/json' }),
        body: JSON.stringify({ token })
      });
      const payload = await response.json().catch(() => ({}));
      if(!response.ok || !payload.success) throw new Error(payload.error || `Erreur HTTP ${response.status}`);
      state.duelinkConnection = payload;
      if(els.duelinkTokenInput) els.duelinkTokenInput.value = '';
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Connexion mémorisée'; els.duelinkTokenStatus.className = 'duelink-status-chip ok'; }
      updateDuelinkStoredTokenUi();
    }catch(err){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Mémoire indisponible'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkSavedTokenHint) els.duelinkSavedTokenHint.textContent = err.message || String(err);
    }finally{
      if(els.duelinkSaveTokenButton) els.duelinkSaveTokenButton.disabled = false;
    }
  }

  async function forgetDuelinkTokenForAccount(){
    if(!state.currentUser) return;
    if(!confirm('Supprimer la clé Duels.ink mémorisée pour ce compte ?')) return;
    if(els.duelinkForgetTokenButton) els.duelinkForgetTokenButton.disabled = true;
    try{
      const response = await fetch('/api/duelink-token', {
        method:'DELETE',
        headers: await duelinkAuthHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if(!response.ok || !payload.success) throw new Error(payload.error || `Erreur HTTP ${response.status}`);
      state.duelinkConnection = payload;
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Clé supprimée'; els.duelinkTokenStatus.className = 'duelink-status-chip'; }
      updateDuelinkStoredTokenUi();
    }catch(err){
      if(els.duelinkSavedTokenHint) els.duelinkSavedTokenHint.textContent = err.message || String(err);
    }finally{
      if(els.duelinkForgetTokenButton) els.duelinkForgetTokenButton.disabled = false;
    }
  }

  function wait(ms){
    return new Promise(resolve => window.setTimeout(resolve, Math.max(0, n(ms))));
  }

  function duelinkRetryDelayMs(payload={}){
    const retryAfter = Number(payload?.retryAfter);
    if(Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(60000, retryAfter * 1000);
    return 3000;
  }

  async function downloadDuelinkReplayBuffer(tokenPayload, replayId){
    let lastError = null;
    for(let attempt = 0; attempt < 3; attempt += 1){
      const response = await fetch('/api/duelink-download', {
        method:'POST',
        headers: await duelinkAuthHeaders({ 'Content-Type':'application/json' }),
        body:JSON.stringify({ ...(tokenPayload || {}), id:replayId })
      });
      if(response.ok) return response.arrayBuffer();
      const payload = await response.json().catch(() => ({}));
      lastError = new Error(payload.error || `Téléchargement impossible pour ${replayId}`);
      if(response.status !== 429 || attempt >= 2) break;
      if(els.duelinkTokenStatus){
        els.duelinkTokenStatus.textContent = 'Pause Duels.ink…';
        els.duelinkTokenStatus.className = 'duelink-status-chip pending';
      }
      await wait(duelinkRetryDelayMs(payload));
    }
    throw lastError || new Error(`Téléchargement impossible pour ${replayId}`);
  }

  function renderDuelinkImportProgress(rows, activeIndex=-1, done=0, failed=0){
    if(!els.duelinkTestResult) return;
    const total = rows.length;
    const finished = total > 0 && (done + failed) >= total;
    const percent = total ? Math.round(((done + failed) / total) * 100) : 0;
    const readyCount = (state.bulkQueue || []).filter(item => item?.merged && ['ready','warning'].includes(item.status)).length;
    const duplicateCount = (state.bulkQueue || []).filter(item => item.status === 'duplicate').length;
    const errorCount = (state.bulkQueue || []).filter(item => item.status === 'error').length;

    if(finished){
      const block = `<div class="duelink-import-progress is-complete" id="duelinkImportProgressBox">
        <div class="duelink-import-progress-head"><strong>Lot traité</strong><span>${done}/${total}</span></div>
        <div class="duelink-progressbar"><i style="width:${percent}%"></i></div>
        <div class="duelink-import-summary-card">
          <strong>${done} replay${done > 1 ? 's' : ''} analysé${done > 1 ? 's' : ''}</strong>
          <span>${duplicateCount} doublon${duplicateCount > 1 ? 's' : ''} ignoré${duplicateCount > 1 ? 's' : ''} · ${errorCount || failed} erreur${(errorCount || failed) > 1 ? 's' : ''} mise${(errorCount || failed) > 1 ? 's' : ''} de côté.</span>
        </div>
      </div>`;
      const existing = document.getElementById('duelinkImportProgressBox');
      if(existing) existing.outerHTML = block;
      else els.duelinkTestResult.insertAdjacentHTML('afterbegin', block);
      return;
    }

    const items = rows.map((row, index) => {
      const game = row.game || row;
      const replayId = String(game.replayId || game.id || `#${index + 1}`);
      const title = game.opponent ? `vs ${esc(game.opponent)}` : `Match ${esc(replayId.slice(0, 10))}`;
      let status = 'pending', label = 'En attente';
      if(index < done) { status = 'done'; label = 'OK'; }
      else if(index === activeIndex) { status = 'active'; label = 'En cours'; }
      if(row.importError) { status = 'error'; label = 'Erreur'; }
      return `<li class="duelink-import-step ${status}"><span class="bulk-status-dot"></span><div><strong>${title}</strong><small>${esc(label)} · replay ${esc(replayId.slice(0, 12))}</small></div></li>`;
    }).join('');
    const block = `<div class="duelink-import-progress" id="duelinkImportProgressBox">
      <div class="duelink-import-progress-head"><strong>Traitement du lot</strong><span>${done + failed}/${total}</span></div>
      <div class="duelink-progressbar"><i style="width:${percent}%"></i></div>
      <ul>${items}</ul>
    </div>`;
    const existing = document.getElementById('duelinkImportProgressBox');
    if(existing) existing.outerHTML = block;
    else els.duelinkTestResult.insertAdjacentHTML('afterbegin', block);
  }


  function renderDuelinkPostBatchSummary({ imported=0, duplicates=0, errors=0, ready=0, batchSize=0 }={}){
    const remaining = getDuelinkImportableRows().length;
    const message = `<div class="duelink-result-empty ok duelink-batch-summary">
      <strong>${imported} replay${imported > 1 ? 's' : ''} traité${imported > 1 ? 's' : ''} dans ce lot.</strong>
      <span>${remaining} partie${remaining > 1 ? 's' : ''} encore prête${remaining > 1 ? 's' : ''} à importer · ${ready} analyse${ready > 1 ? 's' : ''} prête${ready > 1 ? 's' : ''} dans la file · ${duplicates} doublon${duplicates > 1 ? 's' : ''} · ${errors} erreur${errors > 1 ? 's' : ''}.</span>
    </div>`;
    const games = (state.duelinkPreviewRows || []).map(row => row.game).filter(Boolean);
    renderDuelinkPreviewResult({ games, classified:state.duelinkPreviewRows || [] });
    if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', message);
    syncDuelinkActionButtons(remaining);
  }

  async function importDuelinkPreviewToBulkQueue(options={}){
    const tokenPayload = await duelinkTokenPayload();
    if(!tokenPayload.token && !state.duelinkConnection?.connected){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Token manquant'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.innerHTML = '<div class="duelink-result-empty error"><strong>Collez un token Duels.ink ou mémorisez une clé chiffrée.</strong><span>Le token sert à récupérer les replays depuis Duels.ink.</span></div>';
      return { imported:0, duplicates:0, errors:0, ready:0 };
    }
    if(state.currentUser){
      try{ await globalThis.INKSIGHT_refreshSavedMatches?.({ silent:true }); }catch(err){ console.warn('Historique indisponible pour le contrôle doublon API', err); }
    }
    const refsBeforeImport = collectAllDuelinkRefs();
    (state.duelinkPreviewRows || []).forEach(row => {
      if(row?.game) row.status = duelinkPreviewStatus(row.game, refsBeforeImport);
    });
    syncDuelinkActionButtons();
    const availableRows = getDuelinkImportableRows();
    const requestedLimit = options.limit === 'all' ? availableRows.length : Math.max(1, n(options.limit, 25));
    const rows = availableRows.slice(0, requestedLimit);
    if(!rows.length){
      if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', '<div class="duelink-result-empty"><strong>Aucun nouveau replay à importer.</strong><span>Lancez d’abord une prévisualisation ou ajustez la fenêtre de matchs.</span></div>');
      return { imported:0, duplicates:0, errors:0, ready:0 };
    }
    await ensureLocalCardsLoaded();
    state.duelinkImporting = true;
    [els.duelinkImportButton, els.duelinkImport50Button, els.duelinkImport100Button, els.duelinkImportAllButton].forEach(button => {
      if(button){ button.disabled = true; }
    });
    if(els.duelinkImportButton) els.duelinkImportButton.textContent = options.autoSave ? 'Traitement…' : 'Import en cours…';
    if(els.duelinkImportSaveButton){ els.duelinkImportSaveButton.disabled = true; els.duelinkImportSaveButton.textContent = options.autoSave ? 'Traitement…' : 'Import en cours…'; }
    if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Import en cours…'; els.duelinkTokenStatus.className = 'duelink-status-chip pending'; }
    renderDuelinkImportProgress(rows, 0, 0, 0);
    try{
      const ids = rows.map(row => row.game.replayId);
      const fileById = new Map();
      const missingIds = new Set();
      const chunkSize = 1000;
      for(let offset = 0; offset < ids.length; offset += chunkSize){
        const chunkIds = ids.slice(offset, offset + chunkSize);
        const manifestResponse = await fetch('/api/duelink-replays', {
          method:'POST',
          headers: await duelinkAuthHeaders({ 'Content-Type':'application/json' }),
          body:JSON.stringify({ ...tokenPayload, ids:chunkIds })
        });
        const manifest = await manifestResponse.json().catch(() => ({}));
        if(!manifestResponse.ok || !manifest.success){
          throw new Error(manifest.error || `Erreur HTTP ${manifestResponse.status}`);
        }
        const files = Array.isArray(manifest.files) ? manifest.files : [];
        files.forEach(file => fileById.set(String(file.id), file));
        (Array.isArray(manifest.missing) ? manifest.missing : []).forEach(id => missingIds.add(String(id)));
      }
      const previousMatchMeta = state.matchMeta;
      if(!state.bulkQueue.length){
        clearReplays({ keepBulk:true });
        state.bulkQueue = [];
        state.activeBulkIndex = null;
      }
      let importedCount = 0;
      let failedCount = 0;
      for(let rowIndex = 0; rowIndex < rows.length; rowIndex += 1){
        const row = rows[rowIndex];
        renderDuelinkImportProgress(rows, rowIndex, importedCount, failedCount);
        const game = row.game;
        const replayId = String(game.replayId || '');
        const freshRefs = collectAllDuelinkRefs();
        const freshStatus = duelinkPreviewStatus(game, freshRefs);
        if(freshStatus.key !== 'new'){
          row.status = freshStatus;
          continue;
        }
        const file = fileById.get(replayId) || null;
        const item = {
          id:`duelink-${replayId}-${Date.now()}`,
          fileName:file?.filename || `${replayId}.replay.gz`,
          fileSize:0,
          replays:[], sessions:[], merged:null, matchMeta:null,
          status:'reading', message:'Téléchargement Duels.ink…', duplicate:null, savedId:null, error:null, assignedDeck:null,
          duelinkGame:game
        };
        state.bulkQueue.push(item);
        if(!options.autoSave) renderBulkQueue();
        try{
          // Le manifeste bulk peut refuser certains IDs alors que le téléchargement direct /r/{id}
          // reste parfois disponible. On tente donc le téléchargement direct au lieu de bloquer tout le lot.
          if(missingIds.has(replayId)){
            item.message = 'Replay absent du manifeste bulk · tentative directe…';
            if(!options.autoSave) renderBulkQueue();
          }
          // Duels.ink limite les appels à environ 30 requêtes/minute.
          // On cadence les téléchargements pour éviter les 429 pendant les imports 50/100/tout importer.
          if(rowIndex > 0) await wait(2100);
          const buffer = await downloadDuelinkReplayBuffer(tokenPayload, replayId);
          item.fileSize = buffer.byteLength || 0;
          const replaySha256 = await replaySha256FromBuffer(buffer);
          const replay = await readReplayBuffer(buffer, file?.filename || `${replayId}.replay.gz`);
          const pseudoFile = {
            name:file?.filename || `${replayId}.replay.gz`,
            size:item.fileSize,
            parentName:'Duels.ink API',
            isDuelinkApi:true,
            lastModified:0,
            playedAt:game.updatedAt || null,
            replaySha256
          };
          const session = parseReplay(replay, pseudoFile);
          attachDuelinkMetadataToSession(session, game, replaySha256);
          const merged = mergeSessions([session]);
          if(merged){
            attachDuelinkMetadataToSession(merged, game, replaySha256);
            merged.sessions = [session];
          }
          item.replays = [{ file:pseudoFile, parentFile:null, replay, replaySha256, session, matchMeta:null, sourceType:'duelink_api' }];
          item.sessions = [session];
          item.merged = merged;
          item.matchMeta = null;
          const duplicate = merged ? findDuplicateSavedMatchForData(merged) : null;
          item.duplicate = duplicate || null;
          item.status = duplicate ? 'duplicate' : 'ready';
          item.message = duplicate ? 'Déjà présent dans l’historique.' : 'Importé depuis Duels.ink. Prêt à sauvegarder.';
          markDuelinkRowAsPrepared(game);
          row.status = duplicate ? { key:'existing', label:'Déjà présent' } : { key:'queued', label:'Déjà dans la file' };
          importedCount += 1;
          renderDuelinkImportProgress(rows, rowIndex + 1, importedCount, failedCount);
        }catch(err){
          console.error(err);
          item.status = 'error';
          item.error = err;
          item.message = `Erreur Duels.ink : ${err.message}`;
          row.importError = item.message;
          // Important : une ligne en erreur est mise de côté pour cette session.
          // Le prochain clic sur “Importer 25” doit continuer avec les parties suivantes.
          markDuelinkRowAsSkipped(game);
          row.status = { key:'skipped', label:'Mis de côté' };
          failedCount += 1;
          renderDuelinkImportProgress(rows, rowIndex + 1, importedCount, failedCount);
        }
        if(!options.autoSave) renderBulkQueue();
      }
      state.matchMeta = previousMatchMeta;
      const firstReady = state.bulkQueue.findIndex(item => item.merged && item.status !== 'error');
      if(firstReady >= 0 && !options.autoSave) activateBulkItem(firstReady);
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Import prêt'; els.duelinkTokenStatus.className = 'duelink-status-chip ok'; }
      renderDuelinkImportProgress(rows, rows.length, importedCount, failedCount);
      refreshDuelinkPreviewStatuses();
      const ready = state.bulkQueue.filter(item => item.status === 'ready').length;
      const duplicates = state.bulkQueue.filter(item => item.status === 'duplicate').length;
      const errors = state.bulkQueue.filter(item => item.status === 'error').length;
      if(!options.autoSave){
        renderDuelinkPostBatchSummary({ imported:importedCount, duplicates, errors, ready, batchSize:rows.length });
      }
      return { imported:importedCount, duplicates, errors, ready, batchSize:rows.length }; 
    }catch(err){
      console.error(err);
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Échec import'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', `<div class="duelink-result-empty error"><strong>Impossible d’importer les replays Duels.ink.</strong><span>${esc(err.message || err)}.</span></div>`);
      return { imported:0, duplicates:0, errors:1, ready:0, error:err };
    }finally{
      state.duelinkImporting = false;
      refreshDuelinkPreviewStatuses();
    }
  }

  async function importDuelinkPreviewAndSave(options={}){
    if(state.duelinkAutoSaving || state.duelinkImporting) return;
    if(!state.currentUser){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Connexion requise'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', '<div class="duelink-result-empty error"><strong>Connectez-vous avant la sauvegarde.</strong><span>Le test et l’import sont possibles sans stockage du token, mais la sauvegarde dans l’historique nécessite votre compte InkSight.</span></div>');
      syncDuelinkActionButtons();
      return;
    }
    const rows = (state.duelinkPreviewRows || []).filter(row => row?.status?.key === 'new' && row?.game?.replayId);
    if(!rows.length){
      if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', '<div class="duelink-result-empty"><strong>Aucun nouveau replay à sauvegarder.</strong><span>Lancez une prévisualisation ou vérifiez que les matchs ne sont pas déjà présents.</span></div>');
      return;
    }
    state.duelinkAutoSaving = true;
    [els.duelinkImportButton, els.duelinkImport50Button, els.duelinkImport100Button, els.duelinkImportAllButton].forEach(button => { if(button) button.disabled = true; });
    if(els.duelinkImportButton) els.duelinkImportButton.textContent = 'Traitement…';
    if(els.duelinkImportSaveButton){ els.duelinkImportSaveButton.disabled = true; els.duelinkImportSaveButton.textContent = 'Traitement…'; }
    if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Traitement…'; els.duelinkTokenStatus.className = 'duelink-status-chip pending'; }
    const startedAt = new Date().toISOString();
    let importSummary = { imported:0, duplicates:0, errors:0, ready:0 };
    try{
      importSummary = await importDuelinkPreviewToBulkQueue({ limit:options.limit || 25, autoSave:true, silentSuccess:true }) || importSummary;
      const readyBeforeSave = (state.bulkQueue || []).filter(item => item?.merged && ['ready','warning'].includes(item.status)).length;
      if(!readyBeforeSave){
        if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', '<div class="duelink-result-empty"><strong>Aucune analyse à sauvegarder.</strong><span>Les replays étaient déjà présents ou en erreur. Rien n’a été ajouté à l’historique.</span></div>');
        return;
      }
      if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', `<div class="duelink-result-empty pending"><strong>Sauvegarde en cours.</strong><span>${readyBeforeSave} analyse(s) vont être ajoutées à l’historique après dédoublonnage.</span></div>`);
      const saveSummary = await saveBulkQueue() || {};
      refreshDuelinkPreviewStatuses();
      const saved = n(saveSummary.saved);
      const duplicates = n(saveSummary.duplicates);
      const errors = n(saveSummary.errors);
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Sync terminée'; els.duelinkTokenStatus.className = 'duelink-status-chip ok'; }
      const remainingAfterSave = getDuelinkImportableRows().length;
      if(els.duelinkTestResult){
        const games = (state.duelinkPreviewRows || []).map(row => row.game).filter(Boolean);
        renderDuelinkPreviewResult({ games, classified:state.duelinkPreviewRows || [] });
        els.duelinkTestResult.insertAdjacentHTML('afterbegin', `<div class="duelink-result-empty ok duelink-batch-summary"><strong>${saved} partie${saved > 1 ? 's' : ''} ajoutée${saved > 1 ? 's' : ''} à InkSight.</strong><span>${remainingAfterSave} encore prête${remainingAfterSave > 1 ? 's' : ''} à importer · ${duplicates} doublon${duplicates > 1 ? 's' : ''} · ${errors} erreur${errors > 1 ? 's' : ''} mise${errors > 1 ? 's' : ''} de côté.</span></div>`);
      }
      await logDuelinkSyncRun({
        started_at:startedAt,
        finished_at:new Date().toISOString(),
        status: errors ? 'partial' : 'success',
        matches_seen:(state.duelinkPreviewRows || []).length,
        matches_imported:saved,
        matches_skipped:duplicates,
        matches_failed:errors,
        details:{ mode:'duelink_batch_import_save', limit:options.limit || 25, imported:importSummary.imported, ready:importSummary.ready }
      }).catch(err => console.warn('Duels.ink sync log unavailable:', err));
    }catch(err){
      console.error(err);
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Sync échouée'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.insertAdjacentHTML('afterbegin', `<div class="duelink-result-empty error"><strong>Synchronisation interrompue.</strong><span>${esc(err.message || err)}.</span></div>`);
      await logDuelinkSyncRun({
        started_at:startedAt,
        finished_at:new Date().toISOString(),
        status:'error',
        matches_seen:(state.duelinkPreviewRows || []).length,
        matches_imported:0,
        matches_skipped:0,
        matches_failed:rows.length,
        error:String(err.message || err),
        details:{ mode:'duelink_batch_import_save', limit:options.limit || 25 }
      }).catch(logErr => console.warn('Duels.ink sync log unavailable:', logErr));
    }finally{
      state.duelinkAutoSaving = false;
      syncDuelinkActionButtons();
    }
  }

  async function previewDuelinkMatches(){
    const tokenPayload = await duelinkTokenPayload();
    if(!tokenPayload.token && !state.duelinkConnection?.connected){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Token manquant'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.innerHTML = '<div class="duelink-result-empty error"><strong>Collez un token Duels.ink ou mémorisez une clé chiffrée.</strong><span>La synchronisation lit tout l’historique disponible sans appliquer de filtres.</span></div>';
      return;
    }
    if(state.duelinkImporting || state.duelinkAutoSaving) return;
    if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Scan en cours…'; els.duelinkTokenStatus.className = 'duelink-status-chip pending'; }
    state.duelinkPreviewRows = [];
    state.duelinkSkippedGameIds = new Set();
    state.duelinkSkippedReplayIds = new Set();
    state.duelinkSyncSummary = null;
    syncDuelinkActionButtons(0);
    if(els.duelinkImportButton){ els.duelinkImportButton.disabled = true; els.duelinkImportButton.textContent = 'Importer 25'; }
    if(els.duelinkPreviewButton){ els.duelinkPreviewButton.disabled = true; els.duelinkPreviewButton.textContent = 'Synchronisation…'; }
    if(els.duelinkTestButton) els.duelinkTestButton.disabled = true;
    renderDuelinkScanProgress({ page:0, total:0 });
    const startedAt = new Date().toISOString();
    try{
      if(state.currentUser){
        await refreshSavedMatches({ force:true, silent:true });
      }
      const allGames = [];
      let cursor = '';
      let page = 0;
      const seenCursors = new Set();
      do{
        page += 1;
        const response = await fetch('/api/duelink-history', {
          method:'POST',
          headers: await duelinkAuthHeaders({ 'Content-Type':'application/json' }),
          body:JSON.stringify({ ...tokenPayload, limit:1000, cursor })
        });
        const payload = await response.json().catch(() => ({}));
        if(!response.ok || !payload.success){
          throw new Error(payload.error || `Erreur HTTP ${response.status}`);
        }
        const games = Array.isArray(payload.games) ? payload.games : [];
        allGames.push(...games);
        cursor = payload.next_cursor || payload.nextCursor || '';
        renderDuelinkScanProgress({ page, total:allGames.length, cursor });
        if(cursor && seenCursors.has(cursor)){
          console.warn('Duels.ink next_cursor déjà vu, arrêt de sécurité.', cursor);
          cursor = '';
        }
        if(cursor) seenCursors.add(cursor);
      }while(cursor);

      const classified = classifyDuelinkRows(allGames);
      const stats = duelinkPreviewStats(classified);
      state.duelinkPreviewRows = classified;
      state.duelinkSyncSummary = {
        scannedAt:new Date().toISOString(),
        pages:page,
        total:allGames.length,
        newCount:stats.newRows.length,
        readyCount:stats.newWithReplay.length,
        existingCount:stats.existing.length,
        queuedCount:stats.queued.length,
        missingReplayCount:stats.missingReplay.length
      };
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Duels.ink synchronisé'; els.duelinkTokenStatus.className = 'duelink-status-chip ok'; }
      renderDuelinkPreviewResult({ games:allGames, classified });
      await logDuelinkSyncRun({
        started_at:startedAt,
        finished_at:new Date().toISOString(),
        status:'scanned',
        matches_seen:allGames.length,
        matches_imported:0,
        matches_skipped:stats.existing.length + stats.queued.length + stats.missingReplay.length,
        matches_failed:0,
        details:{ mode:'full_history_scan', pages:page, ready_to_import:stats.newWithReplay.length, missing_replay:stats.missingReplay.length }
      }).catch(err => console.warn('Duels.ink scan log unavailable:', err));
    }catch(err){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Échec scan'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      renderDuelinkScanProgress({ error:`Impossible de synchroniser Duels.ink : ${err.message || err}` });
      await logDuelinkSyncRun({
        started_at:startedAt,
        finished_at:new Date().toISOString(),
        status:'error',
        matches_seen:(state.duelinkPreviewRows || []).length,
        matches_imported:0,
        matches_skipped:0,
        matches_failed:0,
        error:String(err.message || err),
        details:{ mode:'full_history_scan' }
      }).catch(logErr => console.warn('Duels.ink scan log unavailable:', logErr));
    }finally{
      if(els.duelinkPreviewButton){ els.duelinkPreviewButton.disabled = false; els.duelinkPreviewButton.textContent = state.duelinkSyncSummary?.total ? 'Actualiser' : 'Synchroniser'; }
      if(els.duelinkTestButton) els.duelinkTestButton.disabled = false;
      syncDuelinkActionButtons();
    }
  }

  async function testDuelinkToken(){
    const tokenPayload = await duelinkTokenPayload();
    if(!tokenPayload.token && !state.duelinkConnection?.connected){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Token manquant'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.innerHTML = '<div class="duelink-result-empty error"><strong>Collez un token Duels.ink ou mémorisez une clé chiffrée.</strong><span>Dans Duels.ink : Mon compte → API Tokens → créer un token avec expiration.</span></div>';
      return;
    }
    if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Test en cours…'; els.duelinkTokenStatus.className = 'duelink-status-chip pending'; }
    state.duelinkPreviewRows = [];
    if(els.duelinkImportButton){ els.duelinkImportButton.disabled = true; els.duelinkImportButton.textContent = 'Importer 25'; }
    if(els.duelinkTestButton) els.duelinkTestButton.disabled = true;
    if(els.duelinkTestResult) els.duelinkTestResult.innerHTML = '<div class="duelink-result-empty"><strong>Connexion à Duels.ink…</strong><span>Test rapide sur les 5 dernières lignes accessibles. Rien n’est importé.</span></div>';
    try{
      const response = await fetch('/api/duelink-history', {
        method:'POST',
        headers: await duelinkAuthHeaders({ 'Content-Type':'application/json' }),
        body:JSON.stringify({ ...tokenPayload, limit:5 })
      });
      const payload = await response.json().catch(() => ({}));
      if(!response.ok || !payload.success){
        throw new Error(payload.error || `Erreur HTTP ${response.status}`);
      }
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Token valide'; els.duelinkTokenStatus.className = 'duelink-status-chip ok'; }
      renderDuelinkTestResult(payload);
    } catch(err){
      if(els.duelinkTokenStatus){ els.duelinkTokenStatus.textContent = 'Échec du test'; els.duelinkTokenStatus.className = 'duelink-status-chip error'; }
      if(els.duelinkTestResult) els.duelinkTestResult.innerHTML = `<div class="duelink-result-empty error"><strong>Impossible de lire l’historique Duels.ink.</strong><span>${esc(err.message || err)}. Vérifiez que le token est actif et copié en entier.</span></div>`;
    } finally {
      if(els.duelinkTestButton) els.duelinkTestButton.disabled = false;
    }
  }


  function initMobileViewportNav(){
    if(state.mobileNavReady) return;
    state.mobileNavReady = true;

    const syncVisualViewportInset = () => {
      const vv = window.visualViewport;
      const bottom = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      document.documentElement.style.setProperty('--vv-bottom', `${bottom}px`);
    };
    syncVisualViewportInset();
    window.visualViewport?.addEventListener('resize', syncVisualViewportInset, { passive:true });
    window.visualViewport?.addEventListener('scroll', syncVisualViewportInset, { passive:true });
    window.addEventListener('resize', syncVisualViewportInset, { passive:true });

    const isMobile = () => window.matchMedia?.('(max-width:820px)')?.matches === true;
    const scrollRoot = () => document.scrollingElement || document.documentElement || document.body;
    const currentY = () => Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);
    let lastY = currentY();
    let ticking = false;
    const showNav = () => document.body.classList.remove('mobile-nav-hidden');
    const hideNav = () => document.body.classList.add('mobile-nav-hidden');
    const onScroll = () => {
      if(!isMobile()) { showNav(); return; }
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = currentY();
        const root = scrollRoot();
        const maxY = Math.max(0, n(root.scrollHeight) - window.innerHeight);
        const delta = y - lastY;
        if(y < 90 || delta < -7 || y > maxY - 80){
          showNav();
        }else if(delta > 9 && y > 180){
          hideNav();
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    document.body.addEventListener('scroll', onScroll, { passive:true });
    document.addEventListener('touchstart', showNav, { passive:true });
    document.addEventListener('focusin', showNav, { passive:true });
  }

  function setApiStatus(text, mode='loading'){
    if(!els.apiBadge) return;
    els.apiBadge.classList.toggle('ready', mode === 'ready');
    els.apiBadge.classList.toggle('error', mode === 'error');
    els.apiBadge.innerHTML = `<span></span>${esc(text)}`;
  }

  async function loadLocalCards(){
    setApiStatus('Base locale · chargement…');
    try{
      const res = await fetch(LOCAL_CARD_DATA_URL, { cache:'force-cache' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      state.cards = Array.isArray(payload) ? payload : (payload.cards || []);
      buildCardIndex();
      setApiStatus(`Base locale prête · ${state.cards.length} cartes`, 'ready');
    }catch(err){
      console.warn(err);
      setApiStatus('Base locale introuvable', 'error');
    }
  }

  function scheduleLocalCardLoad(){
    setApiStatus('Base locale · prête au chargement…');
    const start = () => {
      if(!state.cardLoadPromise) state.cardLoadPromise = loadLocalCards();
    };
    if('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout:1800 });
    else window.setTimeout(start, 900);
  }

  async function ensureLocalCardsLoaded(){
    if(state.cards?.length && state.index?.size) return;
    if(!state.cardLoadPromise) state.cardLoadPromise = loadLocalCards();
    await state.cardLoadPromise;
  }

  function buildCardIndex(){
    state.index.clear();
    for(const raw of state.cards){
      const card = normalizeLocalCard(raw);
      const keys = new Set(cardReferenceKeys(card));
      keys.add(slug(`${card.name} ${card.version}`));

      // V41: index set/number pairs without creating false cross-products.
      // Some local rows represent reprints: set="TFC\nFAB" and number="161\n163".
      // The old code paired every set with every number, causing TFC-161 to match the wrong card.
      alignedPrintReferenceKeys(card).forEach(k => keys.add(k));

      keys.forEach(k => { if(k && !state.index.has(k)) state.index.set(k, card); });
    }
  }

  function alignedPrintReferenceKeys(card){
    const keys = new Set();
    const codes = arrayify(card?.setCodes?.length ? card.setCodes : card?.setCode || card?.set || '').map(normalizeSetCode).filter(Boolean);
    const numbers = arrayify(card?.numbers?.length ? card.numbers : card?.number || card?.cardNumber || '').map(strip0).filter(Boolean);
    if(!codes.length || !numbers.length) return [];

    const addPair = (code, number) => addSetNumberReferenceKeys(keys, code, number);

    if(codes.length === numbers.length){
      codes.forEach((code, idx) => addPair(code, numbers[idx]));
    }else if(codes.length === 1){
      numbers.forEach(number => addPair(codes[0], number));
    }else if(numbers.length === 1){
      codes.forEach(code => addPair(code, numbers[0]));
    }else{
      const maxAligned = Math.min(codes.length, numbers.length);
      for(let i = 0; i < maxAligned; i += 1) addPair(codes[i], numbers[i]);
    }
    return [...keys];
  }

  function addSetNumberReferenceKeys(keys, code, number){
    const normalizedCode = normalizeSetCode(code);
    const cardNumber = strip0(number);
    if(!normalizedCode || !cardNumber) return;
    const setNum = SET_CODE_TO_NUM[code] || SET_CODE_TO_NUM[normalizedCode] || normalizedCode;
    keys.add(`${setNum}-${cardNumber}`);
    keys.add(slug(`${code}-${cardNumber}`));
    keys.add(slug(`${normalizedCode}-${cardNumber}`));
    keys.add(slug(`${code} ${cardNumber}`));
    keys.add(slug(`${normalizedCode} ${cardNumber}`));
  }

  function normalizeLocalCard(raw){
    const setCodes = arrayify(raw.setCodes?.length ? raw.setCodes : raw.set || raw.setCode).flatMap(v => String(v).split(/[\n,+/]/)).map(normalizeSetCode).filter(Boolean);
    const numbers = arrayify(raw.numbers?.length ? raw.numbers : raw.number || raw.cardNumber || raw.collector_number || raw.collectorNumber).flatMap(v => String(v).split(/[\n,+/]/)).map(strip0).filter(Boolean);
    return {
      source:'local', id:raw.id || raw.cardId || '', name:raw.name || raw.cardName || '', version:raw.version || raw.title || '', fullName:raw.fullName || raw.cardName || [raw.name, raw.version || raw.title].filter(Boolean).join(' - '),
      type:raw.cardType || raw.type || '', colors:arrayify(raw.colors?.length ? raw.colors : raw.color || raw.inkColor), cost:n(raw.cost ?? raw.inkCost), inkable:boolValue(raw.inkable ?? raw.inkwell), rarity:raw.rarity || '',
      strength:nullable(raw.strength), willpower:nullable(raw.willpower), lore:nullable(raw.lore), moveCost:nullable(raw.moveCost), classifications:arrayify(raw.classifications),
      text:raw.text || raw.ability || raw.rulesText || '', flavorText:raw.flavorText || '', franchise:raw.franchise || raw.story || raw.universe || '', artists:arrayify(raw.illustrators || raw.artists || raw.artist),
      setCodes, setCode:setCodes[0] || '', numbers, number:numbers[0] || strip0(raw.number || raw.cardNumber || raw.collector_number || raw.collectorNumber), image:getCardImage(raw, 'normal'), imageSmall:getCardImage(raw, 'small'), raw
    };
  }

  async function handleFiles(files){
    if(!files.length) return;
    await ensureLocalCardsLoaded();
    const accepted = files.slice(0, MAX_FILES);
    if(accepted.length > 1 || state.bulkQueue.length){
      try{
        await handleBulkFiles(accepted, { append:!!state.bulkQueue.length });
      }finally{
        if(els.fileInput) els.fileInput.value = '';
      }
      return;
    }
    try{
      const imported = await readReplayInputFile(accepted[0]);
      applyImportedReplayGroup(imported, { resetBulk:false, sourceLabel:accepted[0]?.name || '' });
    }catch(err){
      console.error(err);
      alert(`Impossible de lire ${accepted[0]?.name || 'ce fichier'}: ${err.message}`);
    }finally{
      // Important mobile/Safari: reset even on error so the same replay can be selected again.
      if(els.fileInput) els.fileInput.value = '';
    }
  }

  async function handleBulkFiles(files, options={}){
    await ensureLocalCardsLoaded();
    if(!options.append){
      state.bulkQueue = [];
      state.activeBulkIndex = null;
      clearReplays({ keepBulk:true });
    }
    state.bulkSaving = false;
    if(state.currentUser){
      try{ await globalThis.INKSIGHT_refreshSavedMatches?.({ silent:true }); }
      catch(err){ console.warn('Historique indisponible pour la détection des doublons', err); }
      try{ await refreshDeckProfiles({ silent:true }); }
      catch(err){ console.warn('Decks indisponibles pour l’attribution par lot', err); }
    }

    for(const file of files){
      const item = {
        id:`bulk-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName:file.name || 'Replay',
        fileSize:file.size || 0,
        replays:[], sessions:[], merged:null, matchMeta:null,
        status:'reading', message:'Lecture du replay…', duplicate:null, savedId:null, error:null, assignedDeck:null
      };
      state.bulkQueue.push(item);
      renderBulkQueue();
      try{
        const previousMatchMeta = state.matchMeta;
        const imported = await readReplayInputFile(file);
        const matchMeta = imported.find(entry => entry.matchMeta)?.matchMeta || state.matchMeta || null;
        state.matchMeta = matchMeta;
        const sessions = imported.map(entry => entry.session).filter(Boolean);
        const merged = mergeSessions(sessions);
        state.matchMeta = previousMatchMeta;
        item.replays = imported;
        item.sessions = sessions;
        item.merged = merged;
        item.matchMeta = matchMeta;
        const duplicate = merged ? findDuplicateSavedMatchForData(merged) : null;
        item.duplicate = duplicate || null;
        item.status = duplicate ? 'duplicate' : 'ready';
        item.message = duplicate ? 'Déjà présent dans l’historique.' : 'Prêt à sauvegarder.';
      }catch(err){
        console.error(err);
        item.status = 'error';
        item.error = err;
        item.message = `Erreur de lecture : ${err.message}`;
      }
      renderBulkQueue();
    }

    const firstReady = Number.isInteger(state.activeBulkIndex) && state.bulkQueue[state.activeBulkIndex]?.merged
      ? state.activeBulkIndex
      : state.bulkQueue.findIndex(item => item.merged && item.status !== 'error');
    if(firstReady >= 0) activateBulkItem(firstReady);
    else renderBulkQueue();
  }

  function applyImportedReplayGroup(imported, options={}){
    const replays = Array.isArray(imported) ? imported : [];
    const matchMeta = options.matchMeta !== undefined ? options.matchMeta : (replays.find(entry => entry.matchMeta)?.matchMeta || state.matchMeta || null);
    state.replays = replays;
    state.sessions = state.replays.map(r => r.session).filter(Boolean);
    state.matchMeta = matchMeta;
    state.merged = mergeSessions(state.sessions);
    state.isBO3 = state.sessions.length > 1;
    state.viewMode = state.isBO3 ? 'global' : (state.sessions.length ? 0 : null);
    state.mulliganResolved = false;
    state.lastSavedMatchId = null;
    state.loadedSavedMatchId = null;
    state.performanceExpandedLists = { cards:false, mulligan:false };
    state.statExpandedLists = {};
    if(state.isBO3 && state.cardFilter === 'all') state.cardFilter = 'opponent';
    if(els.saveDeckSelect) els.saveDeckSelect.value = '';
    if(els.saveDeckNameInput) els.saveDeckNameInput.value = '';
    if(els.fileInput) els.fileInput.value = '';
    if(els.dropzoneStatus) els.dropzoneStatus.textContent = state.sessions.length ? `${state.sessions.length} replay(s) chargé(s). Analyse prête.` : 'Aucun replay chargé.';
    document.body.classList.toggle('empty-state', !state.sessions.length);
    document.body.classList.toggle('has-results', !!state.sessions.length);
    setTab('overview');
    renderAll();
  }

  function activateBulkItem(index){
    const item = state.bulkQueue[index];
    if(!item || !item.merged) return;
    state.activeBulkIndex = index;
    applyImportedReplayGroup(item.replays, { matchMeta:item.matchMeta });
    renderBulkQueue();
  }

  function clearBulkQueue(){
    state.bulkQueue = [];
    state.activeBulkIndex = null;
    state.bulkSaving = false;
    renderBulkQueue();
  }

  async function readReplayInputFile(file){
    const fileName = String(file.name || 'replay');
    if(/\.zip$/i.test(fileName)) return readMatchReplayZip(file);
    const imported = await readReplayFileWithMeta(file);
    const enrichedFile = Object.assign(file, { replaySha256:imported.replaySha256 });
    const session = parseReplay(imported.replay, enrichedFile);
    session.replaySha256 = imported.replaySha256 || session.replaySha256 || '';
    return [{ file:enrichedFile, replay:imported.replay, replaySha256:imported.replaySha256, session }];
  }

  async function readMatchReplayZip(file){
    if(!window.JSZip) throw new Error('JSZip est nécessaire pour lire une archive BO3.');
    const zip = await window.JSZip.loadAsync(file);
    const matchEntry = zip.file(/^match\.json$/i)?.[0] || null;
    let matchMeta = null;
    if(matchEntry){
      try{ matchMeta = JSON.parse(await matchEntry.async('string')); }
      catch(err){ console.warn('match.json illisible', err); }
    }
    if(matchMeta) state.matchMeta = matchMeta;

    const replayEntries = Object.values(zip.files)
      .filter(entry => !entry.dir && /\.replay(\.gz)?$/i.test(entry.name) && !/match\.json$/i.test(entry.name))
      .sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric:true, sensitivity:'base' }));

    if(!replayEntries.length) throw new Error('Aucun fichier .replay trouvé dans cette archive.');

    const imported = [];
    for(let index = 0; index < replayEntries.length; index += 1){
      const entry = replayEntries[index];
      const buffer = await entry.async('arraybuffer');
      const replaySha256 = await replaySha256FromBuffer(buffer);
      const replay = await readReplayBuffer(buffer, entry.name);
      const pseudoFile = {
        name: entry.name,
        size: buffer.byteLength || entry._data?.uncompressedSize || 0,
        parentName: file.name,
        isZipEntry:true,
        lastModified: 0,
        playedAt: null,
        replaySha256
      };
      const session = parseReplay(replay, pseudoFile);
      session.replaySha256 = replaySha256 || session.replaySha256 || '';
      enrichSessionWithMatchMeta(session, matchMeta, index);
      imported.push({ file:pseudoFile, parentFile:file, replay, replaySha256, session, matchMeta });
    }
    return imported;
  }

  function enrichSessionWithMatchMeta(session, matchMeta, index){
    session.gameIndex = index;
    session.gameNumber = index + 1;
    if(!matchMeta?.games?.length) return;
    const info = matchMeta.games.find(g => String(g.gameId || '') === String(session.data?.gameId || '')) || matchMeta.games[index];
    if(!info) return;
    session.gameNumber = n(info.gameNumber || session.gameNumber);
    session.matchGameInfo = info;
    session.matchScoreAfter = info.matchScoreAfter || null;
    if(info.winner !== undefined){
      session.winner = Number(info.winner);
      session.isWin = Number(info.winner) === Number(session.perspective);
    }
    if(info.victoryReason) session.victoryReason = info.victoryReason;
    session.playedAt = session.playedAt || firstValidDate([info.playedAt, info.startedAt, info.createdAt, matchMeta.playedAt, matchMeta.startedAt, matchMeta.createdAt]);
  }

  async function replaySha256FromBuffer(buf){
    if(!buf) return '';
    try{
      const digest = await crypto.subtle.digest('SHA-256', buf instanceof ArrayBuffer ? buf : new Uint8Array(buf).buffer);
      return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
    }catch(err){
      console.warn('SHA-256 indisponible pour ce replay', err);
      return '';
    }
  }

  async function readReplayFileWithMeta(file){
    const buf = await file.arrayBuffer();
    const replaySha256 = await replaySha256FromBuffer(buf);
    const replay = await readReplayBuffer(buf, file.name || 'replay');
    return { replay, replaySha256 };
  }

  async function readReplayFile(file){
    const { replay } = await readReplayFileWithMeta(file);
    return replay;
  }

  async function readReplayBuffer(buf, fileName='replay'){
    let text;
    if(/\.gz$/i.test(fileName)){
      if(window.pako) text = window.pako.ungzip(new Uint8Array(buf), { to:'string' });
      else {
        const ds = new DecompressionStream('gzip');
        const stream = new Blob([buf]).stream().pipeThrough(ds);
        text = await new Response(stream).text();
      }
    }else{
      text = new TextDecoder().decode(buf);
    }
    return JSON.parse(text);
  }

  function clearReplays(options={}){
    state.replays = []; state.sessions = []; state.merged = null; state.isBO3 = false; state.viewMode = 0; state.matchMeta = null; state.mulliganResolved = false; state.lastSavedMatchId = null; state.loadedSavedMatchId = null; state.statExpandedLists = {};
    if(!options.keepBulk){ state.bulkQueue = []; state.activeBulkIndex = null; state.bulkSaving = false; state.bulkSaveTotal = 0; state.bulkSaveDone = 0; }
    document.body.classList.add('empty-state'); document.body.classList.remove('has-results','bo3-global','bo3-game');
    if(els.fileInput) els.fileInput.value = '';
    if(els.dropzoneStatus) els.dropzoneStatus.textContent = 'Aucun replay chargé.';
    if(els.bo3Selector){ els.bo3Selector.innerHTML = ''; els.bo3Selector.hidden = true; }
    destroyCharts();
    renderAll();
    renderBulkQueue();
  }

  function reimportReplay(){
    clearReplays();
    setTab('overview');
    if(els.fileInput){
      els.fileInput.value = '';
      els.fileInput.click();
    }
  }

  // Cartes vues (exact) depuis les logs : main de départ + toutes les pioches
  // (CARD_DRAWN inclut les pioches d'effet, pas seulement la pioche de tour).
  function computeCardsSeenFromLogs(data, perspective){
    const logs = Array.isArray(data?.logs) ? data.logs : [];
    if(!logs.length) return 0;
    const initial = logs.find(l => l.type === 'INITIAL_HAND');
    const initialCount = initial ? (arrayify(initial.cardRefs).length || 7) : 7;
    // Toute carte qui passe du DECK à la MAIN compte : pioche de tour ET pioches
    // d'effet (CARD_DRAWN), cartes prises via un « regarde le dessus » (CARD_LOOKED_AT
    // « put … into hand », ex. Vision of the Future) et tutors (« Searched deck … put
    // it into hand »). NB : les cartes regardées puis remises au fond ne sont PAS
    // journalisées par Duels.ink — on ne peut donc pas les identifier.
    const fromDeckToHand = logs.filter(l => {
      if(Number(l.player) !== Number(perspective)) return false;
      const msg = String(l.message || '');
      if(l.type === 'CARD_DRAWN') return true;
      if(l.type === 'CARD_LOOKED_AT') return /into hand/i.test(msg);
      if(l.type === 'ABILITY_TRIGGERED') return /searched deck/i.test(msg) && /into hand/i.test(msg);
      return false;
    }).length;
    return Math.min(60, initialCount + fromDeckToHand);
  }

  function parseReplay(data, file){
    const perspective = Number(data.perspective || data.baseSnapshot?.viewingAs || 1);
    const playerNames = data.playerNames || {};
    const myPlayerNumber = perspective;
    const opponentNumber = String(perspective) === '1' ? 2 : 1;
    const myName = playerNames[myPlayerNumber] || 'Joueur';
    const opponentName = playerNames[opponentNumber] || 'Adversaire';
    const winner = Number(data.winner || 0);
    const isWin = winner === perspective;

    const working = deepClone(data.baseSnapshot || {});
    const mulligan = extractMulligan(data, perspective);
    const rows = { mine:[], opponent:[] };
    const currentRows = { mine:null, opponent:null };
    let firstTurnPlayer = null;
    const seenCards = new Map();
    const passiveSeenOnce = new Set();
    const timeline = [];
    const loreByTurn = new Map();
    const actionByTurn = new Map();
    const opponentDeckTracker = new Map();
    const handLifecycle = { mine:null, opponent:null };

    const frames = [...(data.frames || [])].sort((a,b) => n(a.seq) - n(b.seq));

    const ownerFromPlayer = player => {
      const value = Number(player);
      if(value !== 1 && value !== 2) return null;
      return value === perspective ? 'mine' : 'opponent';
    };
    const ownerFromValue = value => {
      const numeric = Number(value);
      if(numeric === 1 || numeric === 2) return ownerFromPlayer(numeric);
      const raw = String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
      if(['mine','me','my','myplayer','self'].includes(raw)) return 'mine';
      if(['opponent','adversaire','opp','opposingplayer'].includes(raw)) return 'opponent';
      return null;
    };
    const zoneFromOwner = owner => owner === 'mine' ? 'myPlayer' : owner === 'opponent' ? 'opponent' : null;
    const ownerTurnNumber = owner => currentRows[owner]?.turn || rows[owner]?.length + 1 || 1;
    handLifecycle.mine = createHandLifecycleTracker('mine', ownerTurnNumber);
    handLifecycle.opponent = createHandLifecycleTracker('opponent', ownerTurnNumber);
    const deckOwners = buildDeckOwnerIndex(data, perspective);
    const replayCardIndex = buildReplayCardIndex(data);
    const inferFrameOwner = (frame, snapshot) => {
      const taken = frame.takenAction || {};
      const candidates = [
        frame.player, frame.playerNumber, frame.playerId, frame.actor, frame.actorPlayer, frame.actorPlayerNumber,
        taken.player, taken.playerNumber, taken.playerId, taken.actor, taken.actorPlayer, taken.actorPlayerNumber,
        taken.owner, taken.controller
      ];
      for(const candidate of candidates){
        const owner = ownerFromValue(candidate);
        if(owner) return owner;
      }
      // Important: a patch path indicates which zone changed, not who performed the action.
      // Using it as the actor was the source of the Moi/Adversaire card mixing.
      if(GAME_ACTIONS.has(frame.actionType)) return ownerFromPlayer(snapshot?.currentPlayer);
      return null;
    };

    const ensureTurnRow = (player, snapshot) => {
      if(![1,2].includes(Number(player))) return null;
      const owner = ownerFromPlayer(player);
      if(currentRows[owner]) return currentRows[owner];
      const zoneKey = zoneFromOwner(owner);
      if(!zoneKey) return null;
      const z = zoneStats(snapshot, zoneKey);
      const row = { owner, player:Number(player), turn:rows[owner].length + 1, globalTurn:n(snapshot.turnNumber || 1), startInk:z.ink, capacity:z.ink, spent:z.exerted, float:0, inked:0, played:0, quest:0, challenge:0, handStart:z.hand, handEnd:z.hand, endInk:z.ink, boardCharacters:z.boardCharacters, boardLocations:z.boardLocations, boardLorePotential:z.boardLorePotential };
      currentRows[owner] = row;
      return row;
    };

    const updateTurnRow = (owner, snapshot) => {
      const row = currentRows[owner]; if(!row) return;
      const zoneKey = zoneFromOwner(owner);
      if(!zoneKey) return;
      const z = zoneStats(snapshot, zoneKey);
      const beforeCap = row.capacity;
      row.capacity = Math.max(row.capacity, z.ink);
      row.spent = Math.max(row.spent, z.exerted);
      row.handEnd = z.hand;
      row.endInk = z.ink;
      row.boardCharacters = z.boardCharacters;
      row.boardLocations = z.boardLocations;
      row.boardLorePotential = z.boardLorePotential;
      if(z.ink > beforeCap) row.inked += z.ink - beforeCap;
    };

    const closeTurnRow = (owner, snapshot) => {
      const row = currentRows[owner]; if(!row) return;
      updateTurnRow(owner, snapshot);
      row.float = Math.max(0, round1(row.capacity - row.spent));
      rows[owner].push(row);
      currentRows[owner] = null;
    };

    const recordLore = (turn, mineLore, oppLore) => {
      const key = Number(turn) || 1;
      loreByTurn.set(key, { turn:key, mine:n(mineLore), opponent:n(oppLore) });
    };
    recordLore(1, zoneStats(working,'myPlayer').lore, zoneStats(working,'opponent').lore);
    scanVisibleCardsForStats(working, seenCards, passiveSeenOnce);
    scanOpponentVisibleInstances(working, opponentDeckTracker, { turn:1, zone:'initial' });
    handLifecycle.mine.sync(working, null);
    handLifecycle.opponent.sync(working, null);

    for(const frame of frames){
      const actionType = frame.actionType;
      const actorOwner = inferFrameOwner(frame, working);
      const beforeCurrent = Number(working.currentPlayer);
      const beforeOwner = ownerFromPlayer(beforeCurrent);
      const isGame = GAME_ACTIONS.has(actionType);
      if(isGame && [1,2].includes(beforeCurrent)){
        if(firstTurnPlayer === null) firstTurnPlayer = beforeCurrent;
        ensureTurnRow(beforeCurrent, working);
        updateTurnRow(beforeOwner, working);
      }

      updateActionStatsFromFrame(frame, actorOwner, seenCards, timeline, actionByTurn, actorOwner ? currentRows[actorOwner] : null, working, deckOwners, replayCardIndex, opponentDeckTracker);
      creditNonQuestLoreSources(frame, actorOwner, seenCards, working, deckOwners, replayCardIndex);
      creditInkwellAdditionsFromFrame(frame, actorOwner, seenCards, working, replayCardIndex, opponentDeckTracker);

      for(const patch of frame.patch || []) applyPatch(working, patch);
      scanVisibleCardsForStats(working, seenCards, passiveSeenOnce);
      scanOpponentVisibleInstances(working, opponentDeckTracker, { turn:n(frame.turnNumber || working.turnNumber || 1), zone:'visible' });
      handLifecycle.mine.sync(working, frame);
      handLifecycle.opponent.sync(working, frame);

      if(isGame && [1,2].includes(beforeCurrent)){
        updateTurnRow(beforeOwner, working);
      }

      const afterCurrent = Number(working.currentPlayer);
      if([1,2].includes(beforeCurrent) && afterCurrent !== beforeCurrent){
        closeTurnRow(beforeOwner, working);
      }

      const myLore = zoneStats(working,'myPlayer').lore;
      const oppLore = zoneStats(working,'opponent').lore;
      recordLore(frame.turnNumber || working.turnNumber || 1, myLore, oppLore);
    }
    closeTurnRow('mine', working); closeTurnRow('opponent', working);
    handLifecycle.mine.finish(working);
    handLifecycle.opponent.finish(working);

    const finalMineLore = zoneStats(working,'myPlayer').lore || n(data.baseSnapshot?.myPlayer?.lore);
    const finalOppLore = zoneStats(working,'opponent').lore || n(data.baseSnapshot?.opponent?.lore);
    const actions = timeline.filter(a => a.type !== 'end');
    const cards = [...seenCards.values()].map(c => finalizeCard(c));

    const proMetrics = computeMetrics(rows.mine, actions.filter(a => a.owner === 'mine'));
    const opponentProMetrics = computeMetrics(rows.opponent, actions.filter(a => a.owner === 'opponent'));
    const inkProfiles = buildInkProfiles({ cards });
    const matchupLabel = formatMatchupLabel(inkProfiles);
    const opponentDeckEstimate = finalizeOpponentDeckEstimate(opponentDeckTracker);

    let mineHandRetention = finalizeHandRetention(handLifecycle.mine);
    // Les imports Duels.ink API et les imports manuels doivent produire les mêmes signaux.
    // Le suivi par instance est prioritaire, mais on le complète systématiquement avec un fallback
    // depuis la main résolue du mulligan pour éviter les faux vides quand Duels.ink décale les instances
    // après une pioche/recherche ou un effet de type main -> main.
    if(mulligan?.visible){
      const fallbackRetention = fallbackHandRetentionFromMulligan(mulligan, timeline, rows.mine, cards);
      if(fallbackRetention.length){
        mineHandRetention = mergeHandRetention([...mineHandRetention, ...fallbackRetention]);
      }
    }
    return { fileName:file.name, fileSize:file.size, replaySha256:file.replaySha256 || '', data, playedAt:detectReplayPlayedAt(data, file), perspective, myPlayerNumber, opponentNumber, myName, opponentName, firstTurnPlayer, winner, isWin, victoryReason:data.victoryReason || '', turnCount:data.turnCount || Math.max(rows.mine.length, rows.opponent.length), mulligan, finalMineLore, finalOppLore, actions, cards, timeline, loreSeries:[...loreByTurn.values()].sort((a,b)=>a.turn-b.turn), actionSeries:buildActionSeries(actionByTurn), proMetrics, opponentProMetrics, inkProfiles, matchupLabel, opponentDeckEstimate, cardsSeen:computeCardsSeenFromLogs(data, perspective), handRetention:mineHandRetention, opponentHandRetention:finalizeHandRetention(handLifecycle.opponent) };
  }

  function fallbackHandRetentionFromMulligan(mulligan, timeline=[], turnRows=[], cards=[]){
    const split = splitMulliganInitialCards(mulligan);
    const resolved = arrayify(split.resolvedCards || mulligan?.resolved).map(card => hydrateCard(card)).filter(card => cleanCardName(fullName(card)) !== 'Carte inconnue');
    if(!resolved.length) return [];
    const lastTurn = Math.max(1, ...arrayify(turnRows).map(row => n(row.turn)), ...arrayify(timeline).map(row => n(row.turn)));
    const actions = arrayify(timeline).filter(row => row.owner === 'mine' && ['play','ink','discard'].includes(row.type));
    const episodes = resolved.map(card => {
      const key = statCardKey(card) || cardKey(card) || cleanCardName(fullName(card));
      const name = cleanCardName(fullName(card));
      const exit = actions.find(row => {
        const rowKey = row.cardKey || statCardKey(row.card) || cardKey(row.card) || cleanCardName(row.cardName || row.title);
        const rowName = cleanCardName(row.cardName || row.title || fullName(row.card || {}));
        return (key && rowKey && key === rowKey) || (name && rowName && name === rowName);
      });
      const exitTurn = exit ? Math.max(1, n(exit.turn)) : lastTurn;
      const exitReason = exit?.type === 'ink' ? 'inked' : exit?.type === 'play' ? 'played' : exit?.type === 'discard' ? 'discarded' : 'stillInHand';
      return {
        owner:'mine', trackingId:`fallback:${key}`,
        card, cardKey:key, cardName:name,
        inkable:cardIsInkable(card), cost:card.cost ?? null,
        entryTurn:1, exitTurn, heldTurns:Math.max(0, exitTurn - 1),
        entryReason:'openingHand', exitReason, stillInHand:exitReason === 'stillInHand'
      };
    }).filter(ep => ep.heldTurns > 0);
    return mergeHandRetention(episodes);
  }

  function updateActionStatsFromFrame(frame, owner, seenCards, timeline, actionByTurn, row, snapshot, deckOwners, replayCardIndex, opponentDeckTracker=null){
    if(owner !== 'mine' && owner !== 'opponent') return;
    const taken = frame.takenAction || {};
    const type = frame.actionType;
    const turn = n(frame.turnNumber || row?.globalTurn || snapshot?.turnNumber || 1);
    const sourceCard = sourceCardForAction(frame, owner, snapshot, deckOwners, replayCardIndex);
    const inkedFromHandCard = type === 'ADD_TO_INK' ? inkedCardFromHandForFrame(frame, owner, snapshot, replayCardIndex) : null;
    const statSourceCard = type === 'ADD_TO_INK' ? inkedFromHandCard : sourceCard;
    const sourceOwner = statSourceCard ? deckOwnerForCard(statSourceCard, owner, deckOwners) : owner;
    const canCountSource = !statSourceCard || sourceOwner === owner;
    const sourceName = statSourceCard ? cleanCardName(fullName(statSourceCard)) : (sourceCard ? cleanCardName(fullName(sourceCard)) : cleanCardName(actionSourceName(frame, type) || 'Carte inconnue'));
    let entryType = '', title = '', detail = '', icon = '•', timelineCard = null;
    const agg = actionByTurn.get(turn) || { turn, ink:0, play:0, quest:0, challenge:0, mineChallenge:0, opponentChallenge:0 };

    const countSource = (inc) => {
      if(statSourceCard && canCountSource) updateCardStat(seenCards, statSourceCard, owner, inc);
      else if(type !== 'ADD_TO_INK' && !statSourceCard && actionSourceName(frame, type)) updateCardStat(seenCards, { fullName:actionSourceName(frame, type), id:taken.cardId || taken.sourceCardId || '' }, owner, inc);
    };
    const useCardForTimeline = () => {
      const timelineSource = statSourceCard || sourceCard;
      timelineCard = timelineSource && canCountSource ? hydrateCard(timelineSource) : null;
    };

    if(type === 'ADD_TO_INK'){
      entryType='ink'; icon='◆'; title=`Encre ${sourceName}`; detail=`${owner === 'mine' ? 'Vous transformez' : 'L’adversaire transforme'} ${sourceName} en ressource d’encre.`; agg.ink += 1;
      // Le crédit statistique des cartes encrées est centralisé dans creditInkwellAdditionsFromFrame.
      // Cela permet de compter aussi les ajouts en encre par effet, avec source Main / Défausse / Board / Deck.
      useCardForTimeline();
    }else if(type === 'PLAY_CARD'){
      if(!sourceCard && sourceName === 'Carte inconnue') return;
      entryType='play'; icon='▶'; title=`Joue ${sourceName}`; detail=`${owner === 'mine' ? 'Vous jouez' : 'L’adversaire joue'} ${sourceName}.`; agg.play += 1; if(row) row.played += 1;
      countSource({ played:1, seen:1, firstTurn:turn }); useCardForTimeline();
    }else if(type === 'QUEST'){
      const lore = questLoreForFrame(frame, owner, sourceCard, snapshot);
      entryType='quest'; icon=''; title=`Quête avec ${sourceName}`; detail=`${owner === 'mine' ? 'Vous partez' : 'L’adversaire part'} à l’aventure${lore ? ` pour ${lore} lore` : ''}.`; agg.quest += 1; if(row) row.quest += 1;
      countSource({ quest:1, lore, seen:1 }); useCardForTimeline();
    }else if(type === 'CHALLENGE' || type === 'ATTACK'){
      const target = cleanCardName(actionTargetName(frame) || 'une cible adverse');
      entryType='challenge'; icon=''; title=`Défi avec ${sourceName}`; detail=`${owner === 'mine' ? 'Vous défiez' : 'L’adversaire défie'} ${target}.`; agg.challenge += 1; agg[`${owner}Challenge`] = n(agg[`${owner}Challenge`]) + 1; if(row) row.challenge += 1;
      countSource({ challenge:1, seen:1 }); useCardForTimeline();
    }else if(type === 'END_TURN'){
      entryType='end'; icon='↪'; title='Fin de tour'; detail=`${owner === 'mine' ? 'Vous terminez' : 'L’adversaire termine'} le tour.`;
      timelineCard = null;
    }else if(type === 'MOVE_TO_LOCATION'){
      entryType='move'; icon='↗'; title=sourceCard ? `Déplace ${sourceName}` : 'Déplace une carte'; detail=sourceCard ? `${sourceName} se déplace vers un lieu.` : 'Une carte se déplace vers un lieu.';
      useCardForTimeline();
    }else if(type === 'ACTIVATE_ABILITY'){
      entryType='ability'; icon=''; title=sourceCard ? `Active ${sourceName}` : 'Active une capacité'; detail=sourceCard ? `Capacité de ${sourceName}.` : 'Une capacité est activée.';
      if(sourceCard && canCountSource) updateCardStat(seenCards, sourceCard, owner, { seen:1 });
      useCardForTimeline();
    }else if(type === 'RESPOND_TO_PROMPT'){
      const promptPlayedCard = sourceCard && (frame.patch || []).some(p => p?.op === 'add' && pathHasAnyZone(p.path, ['field','characters','items','locations']));
      if(promptPlayedCard){
        entryType='play'; icon='▶'; title=`Joue ${sourceName}`; detail=`${owner === 'mine' ? 'Vous jouez' : 'L’adversaire joue'} ${sourceName}.`; agg.play += 1; if(row) row.played += 1;
        countSource({ played:1, seen:1, firstTurn:turn }); useCardForTimeline();
      }else{
        entryType='ability'; icon=''; title='Résout un effet'; detail='Un effet est résolu.';
        timelineCard = null;
      }
    }
    actionByTurn.set(turn, agg);
    if(owner === 'opponent' && timelineCard && opponentDeckTracker){
      recordOpponentDeckInstance(opponentDeckTracker, timelineCard, { turn, zone:entryType });
    }
    if(entryType){
      timeline.push({
        owner, type:entryType, turn, icon, title, detail, rawType:type, cardName:sourceName,
        cardKey:timelineCard ? cardKey(timelineCard) : '', card:timelineCard,
        handCount:zoneStats(snapshot, owner === 'mine' ? 'myPlayer' : 'opponent').hand
      });
    }
  }


  function scanOpponentVisibleInstances(snapshot, tracker, context={}){
    if(!tracker || !snapshot?.opponent) return;
    const source = snapshot.opponent;
    const visibleZones = ['field','characters','locations','items','discard','revealedCards','play','banished','banish','exile','inkwell'];
    visibleZones.forEach(zoneKey => {
      const value = source?.[zoneKey];
      if(!value) return;
      extractCards(value, []).forEach(card => recordOpponentDeckInstance(tracker, card, { ...context, zone:zoneKey }));
    });
  }

  function cardCopyInstanceId(cardLike){
    const normalized = normalizeCardReference(cardLike || {});
    const raw = cardLike || {};
    return firstString([
      normalized.instanceId,
      normalized.cardInstanceId,
      raw.instanceId,
      raw.cardInstanceId,
      raw.card?.instanceId,
      raw.card?.cardInstanceId,
      raw.raw?.instanceId,
      raw.raw?.cardInstanceId
    ]);
  }

  function recordOpponentDeckInstance(tracker, cardLike, context={}){
    if(!tracker || !cardLike || isPlaceholderCard(cardLike)) return;
    const hydrated = hydrateCard(cardLike);
    const key = statCardKey(hydrated) || cardKey(hydrated);
    const name = cleanCardName(fullName(hydrated));
    if(!key || !name || name === 'Carte inconnue') return;
    const instanceId = cardCopyInstanceId(hydrated) || cardCopyInstanceId(cardLike) || `fallback:${key}`;
    const existing = tracker.get(key) || {
      key,
      cardKey:key,
      card:{ ...hydrated },
      cardName:name,
      subtitle:cardSubtitle(hydrated),
      instanceIds:new Set(),
      fallbackOnly:true,
      zones:new Set(),
      firstSeenTurn:null
    };
    existing.card = mergeCard(existing.card || {}, hydrated);
    existing.cardName = cleanCardName(fullName(existing.card)) || name;
    existing.subtitle = cardSubtitle(existing.card);
    existing.instanceIds.add(String(instanceId));
    if(!String(instanceId).startsWith('fallback:')) existing.fallbackOnly = false;
    if(context.zone) existing.zones.add(String(context.zone));
    const turn = n(context.turn);
    if(turn && (!existing.firstSeenTurn || turn < existing.firstSeenTurn)) existing.firstSeenTurn = turn;
    tracker.set(key, existing);
  }

  function cardSubtitle(card){
    const name = cleanCardName(card?.name || '');
    const version = cleanCardName(card?.version || card?.subtitle || card?.title || '');
    const full = cleanCardName(fullName(card || {}));
    if(version) return version;
    if(name && full.startsWith(`${name} - `)) return full.slice(name.length + 3).trim();
    return '';
  }

  function finalizeOpponentDeckEstimate(tracker){
    const rows = [...(tracker || new Map()).values()].map(item => {
      const instanceIds = [...(item.instanceIds || [])].filter(Boolean);
      const uniqueCopies = instanceIds.length || 1;
      const estimatedCopies = Math.max(1, Math.min(4, uniqueCopies));
      const card = item.card || {};
      const displayName = cleanCardName(fullName(card) || item.cardName || 'Carte inconnue');
      return {
        key:item.key,
        cardKey:item.key,
        card,
        cardName:displayName,
        subtitle:cardSubtitle(card),
        estimatedCopies,
        uniqueCopies,
        instanceIds,
        fallbackOnly:!!item.fallbackOnly,
        seenZones:[...(item.zones || [])],
        firstSeenTurn:item.firstSeenTurn || null,
        type:card.type || card.cardType || '',
        colors:card.colors || [],
        image:card.image || '',
        imageSmall:card.imageSmall || ''
      };
    }).filter(row => row.cardName && row.cardName !== 'Carte inconnue');
    rows.sort((a,b) => (n(b.estimatedCopies) - n(a.estimatedCopies)) || (n(a.firstSeenTurn || 999) - n(b.firstSeenTurn || 999)) || a.cardName.localeCompare(b.cardName));
    return { cards:rows, totalConfirmedCards:sum(rows, 'estimatedCopies'), exportText:buildOpponentDeckExportText(rows) };
  }

  function mergeOpponentDeckEstimates(estimates){
    const byKey = new Map();
    (estimates || []).forEach((estimate, gameIndex) => {
      (estimate?.cards || []).forEach(row => {
        const key = row.cardKey || row.key || statCardKey(row.card) || slug(row.cardName || '');
        if(!key) return;
        const existing = byKey.get(key) || {
          key,
          cardKey:key,
          card:row.card || { fullName:row.cardName || '' },
          cardName:row.cardName || cleanCardName(fullName(row.card || {})),
          subtitle:row.subtitle || cardSubtitle(row.card || {}),
          estimatedCopies:0,
          uniqueCopies:0,
          instanceIds:[],
          fallbackOnly:true,
          seenZones:new Set(),
          firstSeenTurn:null,
          type:row.type || row.card?.type || '',
          colors:row.colors || row.card?.colors || [],
          image:row.image || row.card?.image || '',
          imageSmall:row.imageSmall || row.card?.imageSmall || ''
        };
        existing.card = mergeCard(existing.card || {}, row.card || {});
        existing.cardName = row.cardName || cleanCardName(fullName(existing.card));
        existing.subtitle = row.subtitle || cardSubtitle(existing.card);
        existing.estimatedCopies = Math.max(n(existing.estimatedCopies), n(row.estimatedCopies));
        existing.uniqueCopies = Math.max(n(existing.uniqueCopies), n(row.uniqueCopies || row.estimatedCopies));
        const ids = Array.isArray(row.instanceIds) && row.instanceIds.length ? row.instanceIds : [`fallback:${key}`];
        ids.forEach(id => {
          const text = String(id || '').trim();
          if(text) existing.instanceIds.push(`g${gameIndex + 1}:${text}`);
          if(text && !text.startsWith('fallback:')) existing.fallbackOnly = false;
        });
        (row.seenZones || []).forEach(zone => existing.seenZones.add(zone));
        const turn = n(row.firstSeenTurn);
        if(turn && (!existing.firstSeenTurn || turn < existing.firstSeenTurn)) existing.firstSeenTurn = turn;
        byKey.set(key, existing);
      });
    });
    const rows = [...byKey.values()].map(row => ({
      ...row,
      estimatedCopies:Math.max(1, Math.min(4, n(row.estimatedCopies))),
      uniqueCopies:Math.max(1, n(row.uniqueCopies)),
      seenZones:[...row.seenZones],
      fallbackOnly:!!row.fallbackOnly
    })).sort((a,b) => (n(b.estimatedCopies) - n(a.estimatedCopies)) || (n(a.firstSeenTurn || 999) - n(b.firstSeenTurn || 999)) || a.cardName.localeCompare(b.cardName));
    return { cards:rows, totalConfirmedCards:sum(rows, 'estimatedCopies'), exportText:buildOpponentDeckExportText(rows) };
  }


  function compactOpponentDeckEstimate(estimate){
    const source = estimate?.cards ? estimate : finalizeOpponentDeckEstimate(new Map());
    const cards = (source.cards || []).map(row => {
      const card = row.card || {};
      return {
        key:row.key || row.cardKey || statCardKey(card) || slug(row.cardName || ''),
        cardKey:row.cardKey || row.key || statCardKey(card) || slug(row.cardName || ''),
        card:{
          id:card.id || row.cardKey || row.key || '',
          name:card.name || row.cardName || '',
          fullName:fullName(card) || row.cardName || '',
          type:card.type || row.type || '',
          colors:arrayify(card.colors || row.colors).map(inkKey).filter(Boolean),
          image:card.image || row.image || '',
          imageSmall:card.imageSmall || row.imageSmall || row.image || ''
        },
        cardName:cleanCardName(row.cardName || fullName(card)),
        subtitle:row.subtitle || cardSubtitle(card),
        estimatedCopies:Math.max(1, Math.min(4, n(row.estimatedCopies))),
        uniqueCopies:Math.max(1, n(row.uniqueCopies || row.estimatedCopies)),
        instanceIds:Array.isArray(row.instanceIds) ? row.instanceIds.map(String).filter(Boolean) : [],
        fallbackOnly:!!row.fallbackOnly,
        seenZones:Array.isArray(row.seenZones) ? row.seenZones.filter(Boolean) : [],
        firstSeenTurn:row.firstSeenTurn || null,
        type:row.type || card.type || '',
        colors:arrayify(row.colors || card.colors).map(inkKey).filter(Boolean),
        image:row.image || card.image || '',
        imageSmall:row.imageSmall || card.imageSmall || row.image || card.image || ''
      };
    }).filter(row => row.cardName && row.cardName !== 'Carte inconnue');
    return { cards, totalConfirmedCards:sum(cards, 'estimatedCopies'), exportText:buildOpponentDeckExportText(cards) };
  }

  function normalizeStoredOpponentDeckEstimate(raw, fallbackCards=[]){
    const source = raw?.opponent_deck_estimate || raw?.opponentDeckEstimate || raw?.opponentDeck || raw;
    const rows = Array.isArray(source?.cards) ? source.cards : [];
    if(!rows.length) return fallbackOpponentDeckEstimateFromCards(fallbackCards);
    const cards = rows.map(row => {
      const baseCard = hydrateCard(row.card || { id:row.cardKey || row.key || '', fullName:row.cardName || '', name:row.cardName || '', type:row.type || '', colors:row.colors || [], image:row.image || '', imageSmall:row.imageSmall || row.image || '' });
      const key = row.cardKey || row.key || statCardKey(baseCard) || cardKey(baseCard);
      const card = mergeCard(baseCard, {
        id:key,
        fullName:row.cardName || fullName(baseCard),
        name:row.cardName || baseCard.name,
        type:row.type || baseCard.type,
        colors:arrayify(row.colors || baseCard.colors).map(inkKey).filter(Boolean),
        image:row.image || baseCard.image || '',
        imageSmall:row.imageSmall || baseCard.imageSmall || row.image || baseCard.image || ''
      });
      return {
        key,
        cardKey:key,
        card,
        cardName:cleanCardName(row.cardName || fullName(card)),
        subtitle:row.subtitle || cardSubtitle(card),
        estimatedCopies:Math.max(1, Math.min(4, n(row.estimatedCopies || row.uniqueCopies || 1))),
        uniqueCopies:Math.max(1, n(row.uniqueCopies || row.estimatedCopies || 1)),
        instanceIds:Array.isArray(row.instanceIds) ? row.instanceIds.map(String).filter(Boolean) : [],
        fallbackOnly:!!row.fallbackOnly,
        seenZones:Array.isArray(row.seenZones) ? row.seenZones.filter(Boolean) : [],
        firstSeenTurn:row.firstSeenTurn || null,
        type:row.type || card.type || '',
        colors:arrayify(row.colors || card.colors).map(inkKey).filter(Boolean),
        image:row.image || card.image || '',
        imageSmall:row.imageSmall || card.imageSmall || row.image || card.image || ''
      };
    }).filter(row => row.cardName && row.cardName !== 'Carte inconnue');
    cards.sort((a,b) => (n(b.estimatedCopies) - n(a.estimatedCopies)) || (n(a.firstSeenTurn || 999) - n(b.firstSeenTurn || 999)) || a.cardName.localeCompare(b.cardName));
    return { cards, totalConfirmedCards:sum(cards, 'estimatedCopies'), exportText:buildOpponentDeckExportText(cards) };
  }

  function fallbackOpponentDeckEstimateFromCards(cards=[]){
    const rows = [];
    (cards || []).forEach(card => {
      const scoped = scopedCard(card, 'opponent');
      const hasOpponentSignal = scoped?.owners?.includes?.('opponent') || n(scoped.seen) || n(scoped.played) || n(scoped.inked) || n(scoped.quest) || n(scoped.challenge) || n(scoped.lore);
      if(!hasOpponentSignal) return;
      const key = statCardKey(scoped) || cardKey(scoped);
      const name = cleanCardName(fullName(scoped));
      if(!key || !name || name === 'Carte inconnue') return;
      rows.push({
        key,
        cardKey:key,
        card:scoped,
        cardName:name,
        subtitle:cardSubtitle(scoped),
        estimatedCopies:1,
        uniqueCopies:1,
        instanceIds:[`fallback:${key}`],
        fallbackOnly:true,
        seenZones:['historique'],
        firstSeenTurn:Array.isArray(scoped.firstTurns) && scoped.firstTurns.length ? Math.min(...scoped.firstTurns.map(n).filter(Boolean)) : null,
        type:scoped.type || '',
        colors:arrayify(scoped.colors).map(inkKey).filter(Boolean),
        image:scoped.image || '',
        imageSmall:scoped.imageSmall || scoped.image || ''
      });
    });
    rows.sort((a,b) => a.cardName.localeCompare(b.cardName));
    return { cards:rows, totalConfirmedCards:sum(rows, 'estimatedCopies'), exportText:buildOpponentDeckExportText(rows) };
  }

  function buildOpponentDeckExportText(cards){
    return (cards || [])
      .filter(card => n(card.estimatedCopies) > 0 && card.cardName && card.cardName !== 'Carte inconnue')
      .map(card => `${Math.min(4, n(card.estimatedCopies))} ${cleanCardName(card.cardName)}`)
      .join('\n');
  }

  async function copyTextToClipboard(text){
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }

  async function handleOpponentDeckExportClick(event){
    const button = event.target?.closest?.('[data-export-opponent-deck]');
    if(!button) return;
    const estimate = getWorkingData()?.opponentDeckEstimate;
    const text = estimate?.exportText || buildOpponentDeckExportText(estimate?.cards || []);
    if(!text.trim()) return;
    const original = button.textContent;
    button.disabled = true;
    try{
      await copyTextToClipboard(text);
      button.textContent = `Decklist copiée · ${n(estimate?.totalConfirmedCards)} cartes`;
      button.classList.add('copied');
    }catch(err){
      console.warn(err);
      button.textContent = 'Copie impossible';
    }finally{
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = original || 'Copier la decklist partielle';
        button.classList.remove('copied');
      }, 1800);
    }
  }

  function buildDeckOwnerIndex(data, perspective){
    const base = data?.baseSnapshot || {};
    const sets = { mine:new Set(), opponent:new Set() };
    const mineChunks = [base.mySetup, data?.mySetup, base.myPlayer?.setup, base.players?.[perspective]?.setup, base.playerSetups?.[perspective]];
    const opponentNumber = String(perspective) === '1' ? 2 : 1;
    const opponentChunks = [base.opponentSetup, data?.opponentSetup, base.opponent?.setup, base.players?.[opponentNumber]?.setup, base.playerSetups?.[opponentNumber]];
    mineChunks.forEach(chunk => collectDeckIds(chunk, sets.mine));
    opponentChunks.forEach(chunk => collectDeckIds(chunk, sets.opponent));
    return sets;
  }

  function collectDeckIds(value, out, depth=0){
    if(!value || depth > 4) return;
    if(Array.isArray(value)){
      value.forEach(item => addDeckId(item, out));
      return;
    }
    if(typeof value !== 'object') { addDeckId(value, out); return; }
    for(const key of ['deckCardIds','deckIds','decklist','deck','cards','mainDeck']){
      if(value[key] !== undefined) collectDeckIds(value[key], out, depth + 1);
    }
  }

  function addDeckId(value, out){
    if(value === undefined || value === null) return;
    if(typeof value === 'object'){
      const id = canonicalCardId(value);
      if(id) out.add(id);
      return;
    }
    const raw = String(value).trim();
    if(!raw) return;
    const parts = raw.split(/[\s,;]+/).filter(Boolean);
    parts.forEach(part => {
      const id = canonicalCardId({ id:part });
      if(id) out.add(id);
    });
  }

  function canonicalCardId(cardLike){
    const raw = String(cardLike?.id || cardLike?.cardId || cardLike?.card_id || '').trim();
    if(!raw) return '';
    const compact = raw.replace(/^lorcana[-_:]/i, '').replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const match = compact.match(/^(\d{1,2})-(\d{1,4})$/) || compact.match(/^(\d{1,2})-(\d{1,4})-/);
    if(match) return `${Number(match[1])}-${Number(match[2])}`;
    return slug(compact);
  }

  function deckOwnerForCard(cardLike, fallbackOwner, deckOwners){
    const id = canonicalCardId(cardLike);
    if(!id || !deckOwners) return fallbackOwner;
    const inMine = deckOwners.mine?.has(id);
    const inOpponent = deckOwners.opponent?.has(id);
    if(inMine && !inOpponent) return 'mine';
    if(inOpponent && !inMine) return 'opponent';
    return fallbackOwner;
  }


  function questLoreForFrame(frame, owner, sourceCard, snapshot){
    const taken = frame?.takenAction || {};
    const explicit = n(taken.loreGained ?? taken.lore ?? taken.loreGain ?? taken.questLore);
    if(explicit > 0) return explicit;
    const delta = positiveLoreDeltasByOwner(frame, snapshot).find(item => item.owner === owner)?.delta;
    if(n(delta) > 0) return n(delta);
    return n(cardIntrinsicLore(sourceCard));
  }

  function creditInkwellAdditionsFromFrame(frame, actorOwner, seenCards, snapshot, replayCardIndex, opponentDeckTracker=null){
    const patches = Array.isArray(frame?.patch) ? frame.patch : [];
    if(!patches.length) return;
    const credited = new Set();
    for(const patch of patches){
      const path = String(patch?.path || '');
      if(patch?.op !== 'add' || !pathHasAnyZone(path, ['inkwell'])) continue;
      const owner = ownerFromPatchPath(path);
      if(owner !== 'mine' && owner !== 'opponent') continue;
      const rawCard = primaryCardFromPatchValue(patch.value);
      if(!rawCard || isPlaceholderCard(rawCard)) continue;
      const resolved = resolveCardReference(rawCard, owner, replayCardIndex) || rawCard;
      const card = hydrateCard(resolved);
      if(!card || isPlaceholderCard(card)) continue;
      const instanceId = cardCopyInstanceId(card) || cardCopyInstanceId(rawCard) || '';
      const key = `${owner}:${instanceId || statCardKey(card) || cardKey(card)}:${path}`;
      if(credited.has(key)) continue;
      credited.add(key);

      const source = classifyInkwellSource(frame, owner, card, snapshot, replayCardIndex, actorOwner);
      const inc = { inked:1, seen:1 };
      inc[inkwellSourceStatKey(source)] = 1;
      updateCardStat(seenCards, card, owner, inc);
      if(owner === 'opponent' && opponentDeckTracker) recordOpponentDeckInstance(opponentDeckTracker, card, { turn:n(frame?.turnNumber || snapshot?.turnNumber || 1), zone:`inkwell:${source}` });
    }
  }

  function primaryCardFromPatchValue(value){
    if(!value || typeof value !== 'object') return null;
    if(value.card && typeof value.card === 'object' && isCardLike(value.card)){
      return {
        ...value.card,
        instanceId:value.instanceId || value.cardInstanceId || value.card.instanceId || value.card.cardInstanceId || '',
        cardInstanceId:value.cardInstanceId || value.instanceId || value.card.cardInstanceId || value.card.instanceId || '',
        exerted:value.exerted ?? value.card.exerted,
        hidden:value.hidden ?? value.card.hidden
      };
    }
    if(isCardLike(value)) return value;
    const cards = extractCards(value, []).filter(card => !isNonCardAbilityObject(card));
    return cards[0] || null;
  }

  function isNonCardAbilityObject(value){
    if(!value || typeof value !== 'object') return false;
    const hasCardIdentity = !!(value.id || value.cardId || value.card_id || value.instanceId || value.cardInstanceId || value.imageUrl || value.imageSmallUrl || value.cost !== undefined || value.inkCost !== undefined || value.type || value.cardType || value.colors || value.color);
    const hasAbilityShape = !!(value.effect || value.slug || value.ability || value.name) && !hasCardIdentity;
    return hasAbilityShape;
  }

  function inkwellSourceStatKey(source){
    if(source === 'hand') return 'inkedFromHand';
    if(source === 'discard') return 'inkedFromDiscard';
    if(source === 'board') return 'inkedFromBoard';
    if(source === 'deck') return 'inkedFromDeck';
    return 'inkedFromUnknown';
  }

  function classifyInkwellSource(frame, owner, card, snapshot, replayCardIndex, actorOwner=null){
    const exactZone = findCardSourceZoneInSnapshot(snapshot, owner, card, replayCardIndex, true);
    if(exactZone) return normalizeInkwellSourceZone(exactZone);

    const patchedZone = findRemovedSourceZoneInFrame(frame, owner, card, snapshot, replayCardIndex);
    if(patchedZone) return normalizeInkwellSourceZone(patchedZone);

    // Pour l'action normale ADD_TO_INK, Duels.ink fournit souvent la carte révélée mais pas
    // la main adverse complète. Si aucune zone publique ne contient cette instance, on classe
    // l'encrage comme venant de la main.
    if(frame?.actionType === 'ADD_TO_INK' && actorOwner === owner) return 'hand';
    return 'unknown';
  }

  function normalizeInkwellSourceZone(zone){
    if(zone === 'hand') return 'hand';
    if(zone === 'discard') return 'discard';
    if(zone === 'deck') return 'deck';
    if(['field','characters','items','locations','play'].includes(zone)) return 'board';
    return 'unknown';
  }

  function findCardSourceZoneInSnapshot(snapshot, owner, card, replayCardIndex, exactOnly=false){
    const root = owner === 'mine' ? snapshot?.myPlayer : owner === 'opponent' ? snapshot?.opponent : null;
    if(!root || !card) return '';
    const zones = ['hand','field','characters','locations','items','play','discard','deck','revealedCards','banished','banish','exile'];
    for(const zone of zones){
      const value = root?.[zone];
      if(!value) continue;
      const cards = extractCards(value, []).filter(candidate => !isNonCardAbilityObject(candidate));
      if(cards.some(candidate => cardReferencesMatch(candidate, card, owner, replayCardIndex, exactOnly))) return zone;
    }
    return '';
  }

  function findRemovedSourceZoneInFrame(frame, owner, card, snapshot, replayCardIndex){
    const patches = Array.isArray(frame?.patch) ? frame.patch : [];
    const exactMatches = [];
    const looseMatches = [];
    for(const patch of patches){
      const path = String(patch?.path || '');
      if(patch?.op !== 'remove' || ownerFromPatchPath(path) !== owner) continue;
      const sourceZone = zoneNameFromPointer(path);
      if(!sourceZone || sourceZone === 'inkwell') continue;
      const candidates = [];
      extractCards(patch.value, []).forEach(c => candidates.push(c));
      extractCards(valueAtPointer(snapshot, path), []).forEach(c => candidates.push(c));
      extractCards(valueAtPointer(snapshot, parentPointer(path)), []).forEach(c => candidates.push(c));
      if(!candidates.length) continue;
      if(candidates.some(candidate => !isNonCardAbilityObject(candidate) && cardReferencesMatch(candidate, card, owner, replayCardIndex, true))) exactMatches.push(sourceZone);
      else if(candidates.some(candidate => !isNonCardAbilityObject(candidate) && cardReferencesMatch(candidate, card, owner, replayCardIndex, false))) looseMatches.push(sourceZone);
    }
    return exactMatches[0] || looseMatches[0] || '';
  }

  function zoneNameFromPointer(path){
    const parts = pointerParts(path);
    return ['hand','discard','field','characters','items','locations','play','deck','revealedCards','banished','banish','exile','inkwell'].find(zone => parts.includes(zone)) || '';
  }

  function cardReferencesMatch(candidate, wanted, owner, replayCardIndex, exactOnly=false){
    if(!candidate || !wanted) return false;
    const a = resolveCardReference(candidate, owner, replayCardIndex) || candidate;
    const b = resolveCardReference(wanted, owner, replayCardIndex) || wanted;
    const aInstance = cardCopyInstanceId(a) || cardCopyInstanceId(candidate);
    const bInstance = cardCopyInstanceId(b) || cardCopyInstanceId(wanted);
    if(aInstance && bInstance) return String(aInstance) === String(bInstance);
    if(exactOnly) return false;
    const aId = canonicalCardId(a) || canonicalCardId(candidate);
    const bId = canonicalCardId(b) || canonicalCardId(wanted);
    if(aId && bId && aId === bId) return true;
    const aName = slug(cleanCardName(fullName(a) || a.cardName || a.name || ''));
    const bName = slug(cleanCardName(fullName(b) || b.cardName || b.name || ''));
    return !!(aName && bName && aName === bName);
  }

  function inkedCardFromHandForFrame(frame, owner, snapshot, replayCardIndex){
    if(owner !== 'mine' && owner !== 'opponent') return null;
    const patches = Array.isArray(frame?.patch) ? frame.patch : [];
    const handCandidates = [];
    const nonHandCandidates = [];
    const pushCards = (bucket, value) => {
      extractCards(value, []).forEach(card => bucket.push(card));
    };

    for(const patch of patches){
      const path = String(patch?.path || '');
      if(ownerFromPatchPath(path) !== owner) continue;
      const isHandPath = isOwnerHandPath(path);
      const isNonHandSourcePath = pathHasAnyZone(path, ['discard','field','characters','items','locations','play','banished','banish','exile']);

      if(isHandPath && patch.op === 'remove'){
        // Une carte encrée depuis la main doit alimenter le classement "encrées".
        // On lit à la fois la valeur du patch et la snapshot avant patch, car Duels.ink
        // alterne selon les actions standard et les effets visibles type Sail.
        pushCards(handCandidates, patch.value);
        pushCards(handCandidates, valueAtPointer(snapshot, path));
        pushCards(handCandidates, valueAtPointer(snapshot, parentPointer(path)));
        continue;
      }

      if(isNonHandSourcePath && patch.op === 'remove'){
        // Une carte envoyée en encre depuis le board ou la défausse ne doit pas compter
        // comme "carte sacrifiée depuis la main".
        pushCards(nonHandCandidates, patch.value);
        pushCards(nonHandCandidates, valueAtPointer(snapshot, path));
        pushCards(nonHandCandidates, valueAtPointer(snapshot, parentPointer(path)));
      }
    }

    const direct = cardFromInkActionFields(frame);
    const directResolved = resolveCardReference(direct, owner, replayCardIndex);
    const directCard = directResolved || (direct && isKnownActionCard(direct) ? direct : null);
    if(directCard){
      if(cardListContainsReference(nonHandCandidates, directCard, owner, replayCardIndex)) return null;
      // Standard Lorcana : inking from hand reveals the card first. For the opponent,
      // the hand itself may stay private in the export, but if Duels.ink gives cardName/cardId
      // on ADD_TO_INK and no board/discard source contradicts it, this is a valid hand-ink.
      return hydrateCard(directCard);
    }

    for(const candidate of handCandidates){
      const resolved = resolveCardReference(candidate, owner, replayCardIndex) || candidate;
      const hydrated = hydrateCard(resolved);
      if(isKnownActionCard(hydrated)) return hydrated;
    }
    return null;
  }

  function cardFromInkActionFields(frame){
    const taken = frame?.takenAction || {};
    const nested = taken.card && typeof taken.card === 'object' ? taken.card : null;
    const name = firstString([
      taken.inkedCardName,
      taken.cardName,
      taken.card?.fullName,
      taken.card?.cardName,
      taken.card?.name
    ]);
    const id = firstString([
      taken.inkedCardId,
      taken.cardId,
      taken.card?.id,
      taken.card?.cardId
    ]);
    const instanceId = firstString([
      taken.inkedCardInstanceId,
      taken.cardInstanceId,
      taken.instanceId,
      taken.card?.instanceId,
      taken.card?.cardInstanceId
    ]);
    if(nested && isKnownActionCard(nested)) return { ...nested, id:id || nested.id || nested.cardId || '', cardId:id || nested.cardId || nested.id || '', fullName:name || fullName(nested), name:name || nested.name || nested.cardName || '', cardName:name || nested.cardName || nested.name || '', instanceId:instanceId || nested.instanceId || nested.cardInstanceId || '', cardInstanceId:instanceId || nested.cardInstanceId || nested.instanceId || '' };
    if(name || id || instanceId) return { id, cardId:id, fullName:name, name, cardName:name, instanceId, cardInstanceId:instanceId };
    return null;
  }

  function cardListContainsReference(cards, cardLike, owner, replayCardIndex){
    const wantedKeys = new Set(cardReferenceKeys(cardLike));
    const resolved = resolveCardReference(cardLike, owner, replayCardIndex);
    if(resolved) cardReferenceKeys(resolved).forEach(key => wantedKeys.add(key));
    if(!wantedKeys.size) return false;
    return (cards || []).some(candidate => {
      const keys = new Set(cardReferenceKeys(candidate));
      const candidateResolved = resolveCardReference(candidate, owner, replayCardIndex);
      if(candidateResolved) cardReferenceKeys(candidateResolved).forEach(key => keys.add(key));
      return [...keys].some(key => wantedKeys.has(key));
    });
  }

  function handContainsCard(snapshot, owner, cardLike, replayCardIndex){
    const zone = owner === 'mine' ? 'myPlayer' : owner === 'opponent' ? 'opponent' : '';
    const hand = Array.isArray(snapshot?.[zone]?.hand) ? snapshot[zone].hand : [];
    if(!hand.length || !cardLike) return false;
    return cardListContainsReference(hand, cardLike, owner, replayCardIndex);
  }

  function sourceCardForAction(frame, owner, snapshot, deckOwners, replayCardIndex){
    const type = frame.actionType;
    const direct = type === 'ADD_TO_INK' ? cardFromInkActionFields(frame) : cardFromActionFields(frame, type);
    const directResolved = resolveCardReference(direct, owner, replayCardIndex);
    if(directResolved && isKnownActionCard(directResolved)) return hydrateCard(directResolved);
    if(direct && isKnownActionCard(direct)) return hydrateCard(direct);

    if(type === 'ADD_TO_INK') return findCardInOwnerPatches(frame, owner, snapshot, ['inkwell','hand'], deckOwners, replayCardIndex);
    if(type === 'PLAY_CARD') return findCardInOwnerPatches(frame, owner, snapshot, ['play','field','characters','items','locations','discard','hand'], deckOwners, replayCardIndex);
    if(type === 'RESPOND_TO_PROMPT') return findCardInOwnerPatches(frame, owner, snapshot, ['field','characters','items','locations'], deckOwners, replayCardIndex);
    if(type === 'QUEST' || type === 'CHALLENGE' || type === 'ATTACK' || type === 'MOVE_TO_LOCATION') return findCardInOwnerPatches(frame, owner, snapshot, ['play','field','characters','items','locations'], deckOwners, replayCardIndex);
    if(type === 'ACTIVATE_ABILITY'){
      const explicit = cardFromActionFields(frame, type, true);
      const explicitResolved = resolveCardReference(explicit, owner, replayCardIndex);
      if(explicitResolved && isKnownActionCard(explicitResolved)) return hydrateCard(explicitResolved);
      if(explicit && isKnownActionCard(explicit)) return hydrateCard(explicit);
      const boardSource = findCardInOwnerPatches(frame, owner, snapshot, ['field','characters','items','locations','play'], deckOwners, replayCardIndex);
      if(boardSource && isKnownActionCard(boardSource)) return hydrateCard(boardSource);
      return null;
    }
    return null;
  }

  function creditNonQuestLoreSources(frame, actorOwner, seenCards, snapshot, deckOwners, replayCardIndex){
    if(!frame || frame.actionType === 'QUEST') return;
    const deltas = positiveLoreDeltasByOwner(frame, snapshot);
    if(!deltas.length) return;

    const type = frame.actionType;

    deltas.forEach(({ owner, delta }) => {
      if(delta <= 0) return;

      // V115: on attribue le delta de lore au propriétaire du gain, pas forcément à
      // l'acteur inféré du frame. C'est indispensable pour les effets qui résolvent
      // en différé, notamment Lucky Dime : l'ACTIVATE_ABILITY pose promptSourceCard,
      // puis le gain de lore arrive seulement sur le frame GAME_FINISH suivant.
      const sourceCard = sourceCardForLoreDelta(frame, owner, actorOwner, snapshot, deckOwners, replayCardIndex);
      const sourceOwner = sourceCard ? deckOwnerForCard(sourceCard, owner, deckOwners) : owner;
      const sourceCanReceiveLore = sourceCard && sourceOwner === owner && canAttributeNonQuestLoreToSource(sourceCard, type);

      if(sourceCanReceiveLore){
        updateCardStat(seenCards, sourceCard, owner, { lore:delta, seen:1, loreActions:1 });
        return;
      }

      // Les lieux génèrent leur lore au début du tour. Duels.ink les stocke souvent
      // dans /locations et non dans /field : creditPassiveLocationLore lit maintenant
      // les deux structures.
      creditPassiveLocationLore(snapshot, owner, delta, seenCards);
    });
  }

  function sourceCardForLoreDelta(frame, loreOwner, actorOwner, snapshot, deckOwners, replayCardIndex){
    const ownersToTry = [];
    if(actorOwner === loreOwner) ownersToTry.push(actorOwner);
    ownersToTry.push(loreOwner);

    for(const owner of [...new Set(ownersToTry.filter(Boolean))]){
      const direct = sourceCardForAction(frame, owner, snapshot, deckOwners, replayCardIndex);
      if(direct) return direct;
    }

    // Source persistante d'une capacité en cours de résolution. Elle existe souvent
    // dans le snapshot AVANT l'application du frame qui modifie le lore.
    const promptSources = [
      frame?.promptSourceCard,
      snapshot?.promptSourceCard,
      ...(Array.isArray(frame?.patch) ? frame.patch
        .filter(patch => String(patch?.path || '') === '/promptSourceCard')
        .map(patch => patch.value) : [])
    ];
    for(const raw of promptSources){
      if(!raw || !isCardLike(raw)) continue;
      const resolved = resolveCardReference(raw, loreOwner, replayCardIndex) || raw;
      const hydrated = hydrateCard(resolved);
      if(!isKnownActionCard(hydrated)) continue;
      if(deckOwnerForCard(hydrated, loreOwner, deckOwners) === loreOwner) return hydrated;
    }

    return null;
  }

  function canAttributeNonQuestLoreToSource(card, actionType){
    if(!card) return false;
    if(canCardDirectlyGainLore(card)) return true;
    const type = typeLabel(card.type || card.cardType || '').toLowerCase();
    const rawType = String(card.type || card.cardType || '').toLowerCase();
    const isItem = type.includes('objet') || rawType.includes('item');
    const isAction = type.includes('action') || type.includes('chanson') || rawType.includes('action') || rawType.includes('song');
    const isLocation = type.includes('lieu') || rawType.includes('location');
    // Une capacité activée qui provoque un delta positif de lore doit être attribuable à sa source,
    // même si le texte local n'est pas complet dans l'index de cartes. GAME_FINISH est inclus
    // car Duels.ink peut appliquer le gain final de Lucky Dime dans ce frame technique.
    if(actionType === 'ACTIVATE_ABILITY' || actionType === 'GAME_FINISH') return isItem || isAction || isLocation || canCardDirectlyGainLore(card);
    if(actionType === 'PLAY_CARD' || actionType === 'RESPOND_TO_PROMPT') return isAction || isItem || isLocation;
    return isItem || isAction || isLocation;
  }

  function positiveLoreDeltasByOwner(frame, snapshot){
    const patches = Array.isArray(frame?.patch) ? frame.patch : [];
    const currentLore = {
      mine:n(zoneStats(snapshot, 'myPlayer').lore),
      opponent:n(zoneStats(snapshot, 'opponent').lore)
    };
    const out = [];
    patches.forEach(patch => {
      const owner = ownerFromLorePatchPath(patch?.path);
      if(!owner || patch?.op !== 'replace') return;
      const nextValue = n(patch.value);
      const previousValue = n(currentLore[owner]);
      const delta = nextValue - previousValue;
      currentLore[owner] = nextValue;
      if(delta > 0) out.push({ owner, delta });
    });
    return out;
  }

  function ownerFromLorePatchPath(path){
    const p = String(path || '');
    if(p === '/myPlayer/lore') return 'mine';
    if(p === '/opponent/lore') return 'opponent';
    return null;
  }

  function creditPassiveLocationLore(snapshot, owner, delta, seenCards){
    if(owner !== 'mine' && owner !== 'opponent') return 0;
    const locations = fieldCardsForOwner(snapshot, owner).filter(isLocationWithLore);
    if(!locations.length) return 0;

    let remaining = n(delta);
    let credited = 0;
    locations.forEach(location => {
      if(remaining <= 0) return;
      const amount = Math.min(remaining, cardIntrinsicLore(location));
      if(amount <= 0) return;
      updateCardStat(seenCards, location, owner, { lore:amount, seen:1, loreActions:1 });
      remaining -= amount;
      credited += amount;
    });
    return credited;
  }

  function fieldCardsForOwner(snapshot, owner){
    const zone = owner === 'mine' ? 'myPlayer' : owner === 'opponent' ? 'opponent' : '';
    const source = zone ? snapshot?.[zone] : null;
    if(!source) return [];
    const zones = ['field', 'characters', 'locations', 'items'];
    return zones.flatMap(key => Array.isArray(source[key]) ? source[key] : []).map(entry => {
      if(entry?.card && isCardLike(entry.card)){
        return {
          ...entry.card,
          instanceId:entry.instanceId || entry.cardInstanceId || entry.card.instanceId || entry.card.cardInstanceId || '',
          cardInstanceId:entry.cardInstanceId || entry.instanceId || entry.card.cardInstanceId || entry.card.instanceId || '',
          exerted:entry.exerted ?? entry.card.exerted,
          justPlayed:entry.justPlayed ?? entry.card.justPlayed
        };
      }
      return entry;
    }).filter(isCardLike);
  }

  function isLocationWithLore(card){
    const type = String(card?.type || card?.cardType || '').toLowerCase();
    const label = typeLabel(card?.type || card?.cardType || '').toLowerCase();
    return (type.includes('location') || label.includes('lieu')) && cardIntrinsicLore(card) > 0;
  }

  function cardIntrinsicLore(card){
    const value = card?.lore;
    if(value === undefined || value === null || value === '') return 0;
    return n(value);
  }

  function canCardDirectlyGainLore(card){
    const text = cardRulesText(card).toLowerCase();
    if(!text) return false;
    return /\bgain(?:s)?\s+(?:\d+|x|that much|this much)?\s*lore\b/.test(text)
      || /\bgain\s+lore\b/.test(text)
      || /\bgagnez?\s+(?:\d+|x)?\s*(?:éclats? de )?lore\b/.test(text)
      || /\bremportez?\s+(?:\d+|x)?\s*(?:éclats? de )?lore\b/.test(text);
  }

  function cardRulesText(card){
    const raw = card?.raw || {};
    const abilitySource = card?.specialAbilities || raw.specialAbilities || raw.abilities || [];
    const abilityList = Array.isArray(abilitySource) ? abilitySource : Object.values(abilitySource || {});
    const abilityText = abilityList
      .map(a => typeof a === 'string' ? a : [a?.name, a?.effect, a?.text].filter(Boolean).join(' '))
      .join(' ');
    return [
      card?.rulesText, card?.text, card?.ability, card?.effect,
      raw.rulesText, raw.text, raw.ability, raw.effect,
      raw.translations?.fr?.rulesText,
      abilityText
    ].filter(Boolean).join(' ');
  }

  function cardFromActionFields(frame, type, allowPrompt=false){
    const taken = frame.takenAction || {};
    const nameFields = actionNameFields(type);
    const idFields = actionIdFields(type);
    const instanceFields = actionInstanceFields(type);
    const name = firstString(nameFields.map(key => taken[key]));
    const id = firstString(idFields.map(key => taken[key]));
    const instanceId = firstString(instanceFields.map(key => taken[key]));
    if(name || id || instanceId) return { id, cardId:id, fullName:name, name, cardName:name, instanceId, cardInstanceId:instanceId };
    if(allowPrompt && frame.promptSourceCard && isCardLike(frame.promptSourceCard)) return frame.promptSourceCard;
    return null;
  }

  function actionNameFields(type){
    if(type === 'CHALLENGE' || type === 'ATTACK') return ['attackerName','challengerName','sourceName','sourceCardName','characterName'];
    if(type === 'QUEST') return ['questerName','characterName','sourceName','sourceCardName','cardName','attackerName'];
    if(type === 'ACTIVATE_ABILITY') return ['sourceName','sourceCardName','cardName','characterName','abilitySourceName','activatedCardName','itemName','locationName'];
    return ['cardName','sourceName','sourceCardName','characterName','name'];
  }

  function actionIdFields(type){
    if(type === 'CHALLENGE' || type === 'ATTACK') return ['attackerCardId','attackerId','challengerCardId','sourceCardId','characterCardId'];
    if(type === 'QUEST') return ['questerCardId','characterCardId','sourceCardId','cardId'];
    if(type === 'ACTIVATE_ABILITY') return ['sourceCardId','cardId','characterCardId','abilitySourceCardId','activatedCardId','itemCardId','locationCardId'];
    return ['cardId','sourceCardId','characterCardId'];
  }

  function actionInstanceFields(type){
    if(type === 'CHALLENGE' || type === 'ATTACK') return ['attackerInstanceId','attackerCardInstanceId','challengerInstanceId','sourceInstanceId','sourceCardInstanceId','characterInstanceId','cardInstanceId','instanceId'];
    if(type === 'QUEST') return ['questerInstanceId','questerCardInstanceId','characterInstanceId','sourceInstanceId','sourceCardInstanceId','cardInstanceId','instanceId'];
    if(type === 'ACTIVATE_ABILITY') return ['sourceInstanceId','sourceCardInstanceId','characterInstanceId','cardInstanceId','instanceId','abilitySourceInstanceId','activatedInstanceId','itemInstanceId','locationInstanceId'];
    return ['cardInstanceId','instanceId','sourceInstanceId','sourceCardInstanceId','characterInstanceId'];
  }

  function actionSourceName(frame, type){
    const taken = frame.takenAction || {};
    return firstString(actionNameFields(type).map(key => taken[key]));
  }

  function actionTargetName(frame){
    const taken = frame.takenAction || {};
    return firstString([
      taken.defenderName, taken.defendingName, taken.challengeeName, taken.targetName,
      taken.targetCardName, taken.opposingCardName, taken.opponentCardName
    ]);
  }

  function isKnownActionCard(card){
    return !!(card && (card.id || card.cardId || cleanCardName(card.fullName || card.name || card.cardName) !== 'Carte inconnue'));
  }

  function firstString(values){
    for(const value of values){
      if(value === undefined || value === null) continue;
      const text = String(value).trim();
      if(text) return text;
    }
    return '';
  }

  function findCardInOwnerPatches(frame, owner, snapshot, zoneHints=[], deckOwners, replayCardIndex){
    const patches = Array.isArray(frame.patch) ? frame.patch : [];
    const priority = [];
    const normal = [];
    const handShiftFallback = [];
    const candidates = [];

    const pushCards = (bucket, value) => {
      const cards = extractCards(value, []);
      if(cards.length) bucket.push(...cards);
    };

    const direct = cardFromActionFields(frame, frame.actionType, true);
    const directResolved = resolveCardReference(direct, owner, replayCardIndex);
    if(directResolved) priority.push(directResolved);
    else if(direct && isKnownActionCard(direct)) priority.push(direct);

    for(const patch of patches){
      const path = String(patch.path || '');
      const patchOwner = ownerFromPatchPath(path);
      const isGlobalSource = patchOwner === 'global';
      if(patchOwner && patchOwner !== owner && !isGlobalSource) continue;

      if(path === '/promptSourceCard'){
        // Source absolue des PLAY_CARD avec prompt : elle doit passer devant les décalages de main.
        pushCards(priority, patch.value);
        continue;
      }

      if(!isGlobalSource && zoneHints.length && !pathHasAnyZone(path, zoneHints)) continue;

      const isHandPath = isOwnerHandPath(path);
      const isHandReplace = patch.op === 'replace' && isHandPath;
      const isHandRemove = patch.op === 'remove' && isHandPath;
      if(isHandReplace){
        // Les replaces /hand/5/instanceId, /hand/5/imageUrl, etc. sont souvent des shifts après pioche/recherche.
        // Les utiliser en priorité fait confondre la carte jouée avec la carte qui glisse dans la main.
        continue;
      }

      const isResolutionAdd = patch.op === 'add' && pathHasAnyZone(path, ['discard','field','characters','items','locations','inkwell']);
      const bucket = isResolutionAdd ? priority : (isHandRemove ? handShiftFallback : normal);

      pushCards(bucket, patch.value);

      const directValue = valueAtPointer(snapshot, path);
      pushCards(isHandPath ? handShiftFallback : bucket, directValue);

      if(!isHandPath){
        let parentPath = parentPointer(path);
        for(let i=0; i<2 && parentPath; i++){
          pushCards(bucket, valueAtPointer(snapshot, parentPath));
          parentPath = parentPointer(parentPath);
        }
      }
    }

    candidates.push(...priority, ...normal, ...handShiftFallback);

    for(const candidate of candidates){
      const resolved = resolveCardReference(candidate, owner, replayCardIndex) || candidate;
      const hydrated = hydrateCard(resolved);
      const deckOwner = deckOwnerForCard(hydrated, owner, deckOwners);
      if(deckOwner === owner) return hydrated;
    }
    return candidates.length ? hydrateCard(candidates[0]) : null;
  }

  function ownerFromPatchPath(path){
    const p = String(path || '');
    if(p === '/promptSourceCard' || p.startsWith('/promptSourceCard/')) return 'global';
    if(p === '/waitingForOpponent' || p.startsWith('/waitingForOpponent/')) return 'global';
    if(p === '/myPlayer' || p.startsWith('/myPlayer/')) return 'mine';
    if(p === '/opponent' || p.startsWith('/opponent/')) return 'opponent';
    return null;
  }

  function isOwnerHandPath(path){
    return /^\/(?:myPlayer|opponent)\/hand\/\d+(?:\/|$)/.test(String(path || ''));
  }

  function pathHasAnyZone(path, zones){
    const parts = pointerParts(path);
    return zones.some(zone => parts.includes(zone));
  }

  function valueAtPointer(obj, path){
    const parts = pointerParts(path);
    let current = obj;
    for(const part of parts){
      if(current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  function parentPointer(path){
    const parts = pointerParts(path);
    if(parts.length <= 1) return '';
    return '/' + parts.slice(0, -1).map(p => p.replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
  }

  function buildReplayCardIndex(data){
    const index = { mine:new Map(), opponent:new Map() };
    const addOwnerCards = (owner, value) => {
      if(owner !== 'mine' && owner !== 'opponent') return;
      extractCards(value, []).forEach(card => indexCardReference(index[owner], card));
    };
    addOwnerCards('mine', data?.baseSnapshot?.myPlayer);
    addOwnerCards('opponent', data?.baseSnapshot?.opponent);
    for(const frame of data?.frames || []){
      for(const patch of frame.patch || []){
        const owner = ownerFromPatchPath(patch.path);
        if(owner) addOwnerCards(owner, patch.value);
      }
    }
    return index;
  }

  function indexCardReference(map, cardLike){
    if(!map || !cardLike) return;
    const hydrated = hydrateCard(cardLike);
    if(!isKnownActionCard(hydrated)) return;
    for(const key of cardReferenceKeys(cardLike)) if(key && !map.has(key)) map.set(key, hydrated);
    for(const key of cardReferenceKeys(hydrated)) if(key && !map.has(key)) map.set(key, hydrated);
  }

  function resolveCardReference(cardLike, owner, replayCardIndex){
    if(!cardLike || (owner !== 'mine' && owner !== 'opponent') || !replayCardIndex?.[owner]) return null;
    const map = replayCardIndex[owner];
    const keys = cardReferenceKeys(cardLike);
    for(const key of keys){
      const card = map.get(key);
      if(card) return hydrateCard(card);
    }
    return null;
  }

  function cardReferenceKeys(cardLike){
    if(!cardLike) return [];
    const normalized = normalizeCardReference(cardLike);
    const keys = new Set();
    [normalized.instanceId, normalized.cardInstanceId, normalized.id, normalized.cardId].forEach(v => {
      const text = String(v || '').trim();
      if(text){ keys.add(text); keys.add(slug(text)); keys.add(canonicalCardId({ id:text })); }
    });
    if(normalized.fullName) keys.add(slug(normalized.fullName));
    if(normalized.name) keys.add(slug(normalized.name));
    if(normalized.name && normalized.version) keys.add(slug(`${normalized.name} ${normalized.version}`));
    const setCode = normalizeSetCode(normalized.setCode || normalized.set || '');
    const number = strip0(normalized.number || normalized.cardNumber || normalized.collector_number || normalized.collectorNumber || '');
    if(setCode && number){
      const setNum = SET_CODE_TO_NUM[setCode] || setCode;
      keys.add(`${setNum}-${number}`);
      keys.add(slug(`${setCode}-${number}`));
      keys.add(slug(`${setCode} ${number}`));
    }
    const id = String(normalized.id || normalized.cardId || '');
    const match = id.match(/^(\d{1,2})[-_](\d{1,4})/);
    if(match) keys.add(`${Number(match[1])}-${Number(match[2])}`);
    return [...keys].filter(Boolean);
  }

  function normalizeCardReference(rawInput){
    const raw = rawInput?.card && typeof rawInput.card === 'object' ? { ...rawInput.card, instanceId:rawInput.instanceId || rawInput.cardInstanceId || rawInput.card.instanceId || rawInput.card.cardInstanceId || '', cardInstanceId:rawInput.cardInstanceId || rawInput.instanceId || rawInput.card.cardInstanceId || rawInput.card.instanceId || '' } : (rawInput || {});
    const id = raw.id || raw.cardId || raw.card_id || '';
    const name = raw.name || raw.cardName || '';
    const version = raw.version || raw.title || raw.subtitle || '';
    return {
      ...raw, id, cardId:id, name, version, fullName:raw.fullName || raw.cardName || [name, version].filter(Boolean).join(' - ') || name,
      instanceId:raw.instanceId || raw.cardInstanceId || '', cardInstanceId:raw.cardInstanceId || raw.instanceId || '',
      setCode:raw.setCode || raw.set || raw.set_code || '', number:raw.number || raw.cardNumber || raw.collector_number || raw.collectorNumber || ''
    };
  }

  function extractMulligan(data, perspective){
    const initialSnapshot = deepClone(data.baseSnapshot || {});
    const zoneKey = 'myPlayer';
    const initial = snapshotHandCards(initialSnapshot, 'mine').slice(0, 7);
    const working = deepClone(data.baseSnapshot || {});
    const frames = [...(data.frames || [])].sort((a,b) => n(a.seq) - n(b.seq));
    for(const frame of frames){
      if(frame.actionType !== 'MULLIGAN' && frame.actionType !== 'CHOOSE_STARTING_PLAYER') break;
      for(const patch of frame.patch || []) applyPatch(working, patch);
    }
    const resolved = snapshotHandCards(working, 'mine').slice(0, 7);
    const initialIds = new Set(initial.map(cardIdentity));
    const resolvedIds = new Set(resolved.map(cardIdentity));
    const kept = resolved.filter(c => initialIds.has(cardIdentity(c))).length;
    const replaced = resolved.filter(c => !initialIds.has(cardIdentity(c))).map(c => ({ ...c, mulligan:true }));
    return { initial, resolved, replaced, kept, changed:replaced.length > 0, visible:initial.length > 0 };
  }

  function snapshotHandCards(snapshot, owner){
    if(!snapshot) return [];
    const zone = owner === 'mine' ? 'myPlayer' : 'opponent';
    const hand = snapshot?.[zone]?.hand;
    if(!Array.isArray(hand)) return [];
    return hand.map(c => hydrateCard(c)).filter(Boolean);
  }

  function cardIdentity(card){
    return card?.instanceId || card?.cardInstanceId || card?.id || cardKey(card) || fullName(card);
  }


  function createHandLifecycleTracker(owner, getTurn){
    const active = new Map();
    const episodes = [];
    let lastKnownCount = 0;
    const handForSnapshot = snapshot => {
      const zone = owner === 'mine' ? 'myPlayer' : 'opponent';
      const hand = snapshot?.[zone]?.hand;
      if(!Array.isArray(hand)) return [];
      return hand.map((raw, index) => {
        const card = hydrateCard(raw);
        const trackingId = handTrackingId(raw, card, index);
        return { raw, card, trackingId, index };
      }).filter(row => row.trackingId && row.card && !isPlaceholderCard(row.card));
    };
    const sync = (snapshot, frame=null) => {
      const hand = handForSnapshot(snapshot);
      if(!hand.length && !Array.isArray(snapshot?.[owner === 'mine' ? 'myPlayer' : 'opponent']?.hand)) return;
      const nowIds = new Set(hand.map(row => row.trackingId));
      const turn = Math.max(1, n(getTurn(owner)) || 1);
      [...active.entries()].forEach(([trackingId, episode]) => {
        if(nowIds.has(trackingId)) return;
        closeHandEpisode(episode, turn, inferHandExitReason(frame, owner, episode.card), false);
        episodes.push(episode);
        active.delete(trackingId);
      });
      hand.forEach(row => {
        if(active.has(row.trackingId)) return;
        const episode = {
          owner,
          trackingId:row.trackingId,
          instanceId:cardInstanceIdentity(row.raw || row.card),
          card:row.card,
          cardKey:statCardKey(row.card) || cardKey(row.card),
          cardName:cleanCardName(fullName(row.card)),
          inkable:cardIsInkable(row.card),
          cost:row.card.cost ?? row.card.inkCost ?? null,
          entryTurn:turn,
          exitTurn:null,
          heldTurns:0,
          entryReason:inferHandEntryReason(frame, owner, row.card),
          exitReason:'',
          stillInHand:false
        };
        active.set(row.trackingId, episode);
      });
      lastKnownCount = hand.length;
    };
    const finish = snapshot => {
      const turn = Math.max(1, n(getTurn(owner)) || 1);
      [...active.entries()].forEach(([trackingId, episode]) => {
        closeHandEpisode(episode, turn, 'stillInHand', true);
        episodes.push(episode);
        active.delete(trackingId);
      });
      lastKnownCount = handForSnapshot(snapshot).length || lastKnownCount;
    };
    return { owner, sync, finish, episodes, active, get known(){ return episodes.length || active.size || lastKnownCount > 0; } };
  }

  function handTrackingId(raw, card, index=0){
    const inst = cardInstanceIdentity(raw) || cardInstanceIdentity(card);
    if(inst) return `inst:${inst}`;
    const key = statCardKey(card) || cleanCardName(fullName(card));
    return key ? `fallback:${key}:slot:${index}` : '';
  }

  function cardInstanceIdentity(cardLike){
    if(!cardLike || typeof cardLike !== 'object') return '';
    return String(cardLike.instanceId || cardLike.cardInstanceId || cardLike.instance_id || cardLike.uuid || cardLike.uid || cardLike.localId || cardLike.card?.instanceId || cardLike.card?.cardInstanceId || '').trim();
  }

  function cardIsInkable(card){
    if(!card || typeof card !== 'object') return null;
    const candidates = [card.inkable, card.isInkable, card.canInk, card.inkwell, card.hasInkwell, card.has_inkwell];
    for(const value of candidates){
      if(value === true || value === false) return !!value;
      if(typeof value === 'string'){
        const raw = value.toLowerCase();
        if(['true','yes','oui','inkable'].includes(raw)) return true;
        if(['false','no','non','uninkable','non-inkable'].includes(raw)) return false;
      }
    }
    const symbol = String(card.inkwellSymbol || card.inkwell_symbol || card.inkSymbol || '').toLowerCase();
    if(symbol) return !['false','no','none','absent'].includes(symbol);
    return null;
  }

  function closeHandEpisode(episode, exitTurn, exitReason='unknown', stillInHand=false){
    episode.exitTurn = Math.max(n(exitTurn), n(episode.entryTurn));
    episode.heldTurns = Math.max(0, n(episode.exitTurn) - n(episode.entryTurn));
    episode.exitReason = exitReason || 'unknown';
    episode.stillInHand = !!stillInHand || episode.exitReason === 'stillInHand';
  }

  function inferHandEntryReason(frame, owner, card){
    if(!frame) return 'openingHand';
    const type = String(frame.actionType || frame.takenAction?.actionType || '');
    const pathText = arrayify(frame.patch).map(p => `${p.path || ''}`).join(' ').toLowerCase();
    if(type.includes('DRAW') || pathText.includes('/deck') && pathText.includes('/hand')) return 'draw';
    if(pathText.includes('/discard') && pathText.includes('/hand')) return 'recovered';
    if(pathText.includes('/field') && pathText.includes('/hand') || pathText.includes('/characters') && pathText.includes('/hand') || pathText.includes('/play') && pathText.includes('/hand')) return 'bounce';
    if(type === 'RESPOND_TO_PROMPT') return 'effect';
    return 'handAdd';
  }

  function inferHandExitReason(frame, owner, card){
    if(!frame) return 'unknown';
    const type = String(frame.actionType || frame.takenAction?.actionType || '');
    if(type === 'PLAY_CARD') return 'played';
    if(type === 'ADD_TO_INK') return 'inked';
    const zones = handExitZonesFromFrame(frame, owner, card);
    if(zones.has('inkwell')) return 'inked';
    if(zones.has('discard') || zones.has('banished') || zones.has('banish') || zones.has('exile')) return 'discarded';
    if(zones.has('field') || zones.has('characters') || zones.has('items') || zones.has('locations') || zones.has('play')) return 'played';
    if(zones.has('deck')) return 'deck';
    if(type === 'RESPOND_TO_PROMPT') return 'effect';
    return 'unknown';
  }

  function handExitZonesFromFrame(frame, owner, card){
    const zones = new Set();
    const zonePrefix = owner === 'mine' ? '/myPlayer/' : '/opponent/';
    const cardIds = new Set([cardInstanceIdentity(card), statCardKey(card), cardKey(card), cleanCardName(fullName(card))].filter(Boolean).map(String));
    arrayify(frame?.patch).forEach(patch => {
      const path = String(patch?.path || '');
      if(!path.startsWith(zonePrefix)) return;
      const parts = pointerParts(path);
      const zone = parts[1] || '';
      if(!zone || zone === 'hand') return;
      const candidates = extractCards(patch?.value, []);
      if(!candidates.length){ zones.add(zone); return; }
      const match = candidates.some(candidate => {
        const h = hydrateCard(candidate);
        const ids = [cardInstanceIdentity(candidate), cardInstanceIdentity(h), statCardKey(h), cardKey(h), cleanCardName(fullName(h))].filter(Boolean).map(String);
        return ids.some(id => cardIds.has(id));
      });
      if(match) zones.add(zone);
    });
    return zones;
  }

  function finalizeHandRetention(tracker){
    const episodes = arrayify(tracker?.episodes).filter(ep => ep?.cardName && ep.cardName !== 'Carte inconnue');
    return mergeHandRetention(episodes);
  }

  function mergeHandRetention(rows=[]){
    const map = new Map();
    arrayify(rows).forEach(row => {
      const card = hydrateCard(row.card || { fullName:row.cardName, id:row.cardKey, cost:row.cost, inkable:row.inkable });
      const key = row.cardKey || statCardKey(card) || cardKey(card);
      if(!key) return;
      const existing = map.get(key) || {
        card,
        cardKey:key,
        cardName:cleanCardName(row.cardName || fullName(card)),
        inkable:row.inkable ?? cardIsInkable(card),
        cost:row.cost ?? card.cost ?? null,
        episodes:0,
        totalHeldTurns:0,
        maxHeldTurns:0,
        stuckEpisodes:0,
        exits:{ played:0, inked:0, discarded:0, deck:0, effect:0, stillInHand:0, unknown:0 },
        representative:null,
        gameIndex:row.gameIndex,
        gameNumber:row.gameNumber
      };
      const held = n(row.heldTurns);
      existing.episodes += n(row.episodes || 1);
      existing.totalHeldTurns += row.totalHeldTurns !== undefined ? n(row.totalHeldTurns) : held;
      existing.maxHeldTurns = Math.max(existing.maxHeldTurns, n(row.maxHeldTurns ?? held));
      existing.stuckEpisodes += row.stuckEpisodes !== undefined ? n(row.stuckEpisodes) : (held >= 4 ? 1 : 0);
      const exitReason = row.exitReason || (row.stillInHand ? 'stillInHand' : 'unknown');
      if(row.exits && typeof row.exits === 'object') Object.entries(row.exits).forEach(([k,v]) => { existing.exits[k] = n(existing.exits[k]) + n(v); });
      else existing.exits[exitReason] = n(existing.exits[exitReason]) + 1;
      const rep = row.representative || row;
      if(!existing.representative || n(rep.heldTurns) > n(existing.representative.heldTurns)) existing.representative = { ...rep, card, cardName:existing.cardName, cardKey:key };
      existing.card = mergeCard(existing.card, card);
      map.set(key, existing);
    });
    return [...map.values()].map(item => ({
      ...item,
      averageHeldTurns:round1(item.totalHeldTurns / Math.max(1, item.episodes)),
      stuckRate:round1((item.stuckEpisodes / Math.max(1, item.episodes)) * 100)
    })).sort((a,b) => n(b.maxHeldTurns) - n(a.maxHeldTurns) || n(b.averageHeldTurns) - n(a.averageHeldTurns) || String(a.cardName).localeCompare(String(b.cardName)));
  }

  function compactHandRetention(rows=[]){
    return arrayify(rows).map(row => ({
      cardKey:row.cardKey || statCardKey(row.card),
      cardName:row.cardName || cleanCardName(fullName(row.card || {})),
      card:row.card ? {
        id:row.card.id || row.cardKey || '', fullName:fullName(row.card), name:row.card.name || '', type:row.card.type || '', colors:row.card.colors || [], cost:row.card.cost ?? null, inkable:row.inkable ?? cardIsInkable(row.card), image:row.card.image || '', imageSmall:row.card.imageSmall || row.card.image || ''
      } : null,
      inkable:row.inkable,
      cost:row.cost ?? null,
      episodes:n(row.episodes),
      totalHeldTurns:round1(row.totalHeldTurns),
      averageHeldTurns:round1(row.averageHeldTurns),
      maxHeldTurns:n(row.maxHeldTurns),
      stuckEpisodes:n(row.stuckEpisodes),
      stuckRate:round1(row.stuckRate),
      exits:row.exits || {},
      representative:row.representative ? {
        entryTurn:n(row.representative.entryTurn), exitTurn:n(row.representative.exitTurn), heldTurns:n(row.representative.heldTurns), entryReason:row.representative.entryReason || '', exitReason:row.representative.exitReason || '', stillInHand:!!row.representative.stillInHand, gameNumber:row.representative.gameNumber || row.gameNumber || null
      } : null
    })).slice(0, 120);
  }

  function computeMetrics(turnRows, actions){
    const questCount = actions.filter(a => a.type === 'quest').length;
    const challengeCount = actions.filter(a => a.type === 'challenge').length;
    const handByTurn = turnRows.map(r => ({ turn:r.turn, handCount:r.handEnd }));
    const inkByTurn = turnRows.map(r => ({ turn:r.turn, capacity:r.capacity, spent:r.spent, float:r.float, inked:r.inked, handStart:r.handStart, handEnd:r.handEnd }));
    const boardByTurn = turnRows.map(r => ({ turn:r.turn, characters:n(r.boardCharacters), locations:n(r.boardLocations), lorePotential:n(r.boardLorePotential) }));
    return { totalInkFloat:round1(sum(inkByTurn, 'float')), totalInkSpent:round1(sum(inkByTurn, 'spent')), questCount, challengeCount, topDeckTurns:handByTurn.filter(r => r.handCount <= 1).length, handKnown:handByTurn.length > 0, handByTurn, inkByTurn, boardByTurn };
  }



  function extractCards(value, found=[], depth=0){
    if(!value || typeof value !== 'object' || depth > 6) return found;
    if(isCardLike(value)) found.push(value);
    if(value.card && isCardLike(value.card)){
      found.push({
        ...value.card,
        instanceId:value.instanceId || value.cardInstanceId || value.card.instanceId || value.card.cardInstanceId || '',
        cardInstanceId:value.cardInstanceId || value.instanceId || value.card.cardInstanceId || value.card.instanceId || '',
        exerted:value.exerted ?? value.card.exerted
      });
    }
    if(Array.isArray(value)) value.forEach(v => extractCards(v, found, depth + 1));
    else Object.values(value).forEach(v => { if(v && typeof v === 'object') extractCards(v, found, depth + 1); });
    return found;
  }

  function isCardLike(v){
    return !!(v && typeof v === 'object'
      && (v.fullName || v.name || v.cardName || v.title)
      && (v.id || v.cardId || v.cost !== undefined || v.inkCost !== undefined || v.imageUrl || v.imageSmallUrl || v.image || v.image_uris || v.images || v.rulesText || v.text || v.type || v.cardType));
  }


  function statCardKey(cardLike){
    const hydrated = cardLike || {};
    const name = cleanCardName(fullName(hydrated) || hydrated.cardName || hydrated.name || '');
    const normalizedName = slug(name);
    if(normalizedName && normalizedName !== 'carte-inconnue') return normalizedName;
    return cardKey(hydrated);
  }

  function isPlaceholderCard(cardLike){
    const name = cleanCardName(fullName(cardLike || {}));
    return !name || name === 'Carte inconnue' || slug(name) === 'carte-inconnue';
  }

  function ensureCardSeenOnce(map, cardLike, owner, seenOnce){
    if(owner !== 'mine' && owner !== 'opponent' || !cardLike || isPlaceholderCard(cardLike)) return;
    const hydrated = hydrateCard(cardLike);
    const key = statCardKey(hydrated) || cardKey(hydrated);
    if(!key) return;
    const token = `${owner}|${key}`;
    if(seenOnce?.has(token)) return;
    const existing = map.get(key);
    const existingSeen = n(normalizeOwnerStats(existing?.ownerStats)[owner].seen);
    if(existingSeen <= 0) updateCardStat(map, hydrated, owner, { seen:1 });
    seenOnce?.add(token);
  }

  function scanVisibleCardsForStats(snapshot, seenCards, seenOnce){
    ['mine','opponent'].forEach(owner => {
      const zone = owner === 'mine' ? 'myPlayer' : 'opponent';
      const source = snapshot?.[zone];
      if(!source) return;
      ['hand','field','characters','locations','items','discard','revealedCards','play'].forEach(zoneKey => {
        const value = source?.[zoneKey];
        if(!value) return;
        extractCards(value, []).forEach(card => ensureCardSeenOnce(seenCards, card, owner, seenOnce));
      });
      // Inkwell is visible only when Duels.ink provides the nested card object. Face-down
      // resources without card data are ignored, but visible cards still become tracked.
      extractCards(source?.inkwell || [], []).forEach(card => ensureCardSeenOnce(seenCards, card, owner, seenOnce));
    });
  }

  function updateCardStat(map, cardLike, owner, inc={}){
    if(!cardLike || (owner !== 'mine' && owner !== 'opponent')) return;
    const hydrated = hydrateCard(cardLike);
    const key = statCardKey(hydrated) || cardKey(hydrated);
    if(!key) return;
    const existing = map.get(key) || { ...hydrated, owners:new Set(), seen:0, played:0, inked:0, quest:0, lore:0, challenge:0, firstTurns:[], ownerStats:{ mine:freshOwnerStats(), opponent:freshOwnerStats() } };
    existing.ownerStats = normalizeOwnerStats(existing.ownerStats);
    const merged = mergeCard(existing, hydrated);
    merged.ownerStats = normalizeOwnerStats(existing.ownerStats);
    merged.owners.add(owner);

    const bucket = merged.ownerStats[owner] || freshOwnerStats();
    bucket.seen += inc.seen || 0;
    bucket.played += inc.played || 0;
    bucket.inked += inc.inked || 0;
    INKWELL_SOURCE_KEYS.forEach(key => { bucket[key] = n(bucket[key]) + n(inc[key]); });
    bucket.quest += inc.quest || 0;
    bucket.lore += inc.lore || 0;
    bucket.loreActions += inc.loreActions || 0;
    bucket.challenge += inc.challenge || 0;
    if(inc.firstTurn) bucket.firstTurns.push(inc.firstTurn);
    merged.ownerStats[owner] = bucket;

    merged.seen += inc.seen || 0;
    merged.played += inc.played || 0;
    merged.inked += inc.inked || 0;
    INKWELL_SOURCE_KEYS.forEach(key => { merged[key] = n(merged[key]) + n(inc[key]); });
    merged.quest += inc.quest || 0;
    merged.lore += inc.lore || 0;
    merged.loreActions = n(merged.loreActions) + (inc.loreActions || 0);
    merged.challenge += inc.challenge || 0;
    if(inc.firstTurn) merged.firstTurns.push(inc.firstTurn);
    map.set(key, merged);
  }

  function freshOwnerStats(){ return { seen:0, played:0, inked:0, inkedFromHand:0, inkedFromDiscard:0, inkedFromBoard:0, inkedFromDeck:0, inkedFromUnknown:0, quest:0, lore:0, loreActions:0, challenge:0, firstTurns:[] }; }

  function normalizeOwnerStats(stats){
    return {
      mine:{ ...freshOwnerStats(), ...(stats?.mine || {}) },
      opponent:{ ...freshOwnerStats(), ...(stats?.opponent || {}) }
    };
  }

  function scopedCard(card, owner){
    if(owner !== 'mine' && owner !== 'opponent') return card;
    const stats = normalizeOwnerStats(card.ownerStats)[owner];
    const sourceStats = Object.fromEntries(INKWELL_SOURCE_KEYS.map(key => [key, n(stats[key])]));
    return { ...card, owners:[owner], seen:n(stats.seen), played:n(stats.played), inked:n(stats.inked), ...sourceStats, quest:n(stats.quest), lore:n(stats.lore), loreActions:n(stats.loreActions), challenge:n(stats.challenge), firstTurns:stats.firstTurns || [], avgTurn:stats.firstTurns?.length ? mean(stats.firstTurns) : null };
  }

  function cardsForScope(m, scope=state.scope){
    if(!m?.cards) return [];
    if(scope !== 'mine' && scope !== 'opponent') return m.cards;
    return m.cards
      .filter(c => normalizeOwnerStats(c.ownerStats)[scope].seen || c.owners?.includes(scope))
      .map(c => scopedCard(c, scope));
  }

  function loreEngineCards(cards){
    return (cards || []).filter(c => n(c?.lore) > 0 || n(c?.loreActions) > 0);
  }

  function compareLoreEngines(a, b){
    return (n(b?.lore) - n(a?.lore)) || (n(b?.loreActions) - n(a?.loreActions)) || (n(b?.quest) - n(a?.quest)) || (n(b?.played) - n(a?.played)) || fullName(a).localeCompare(fullName(b));
  }


  function loreActivityChip(card){
    const type = typeLabel(card?.type || card?.cardType || '').toLowerCase();
    const rawType = String(card?.type || card?.cardType || '').toLowerCase();
    const q = n(card?.quest);
    const a = n(card?.loreActions);
    const p = n(card?.played);
    if(type.includes('personnage') || rawType.includes('character')){
      return `${q} aventure${q > 1 ? 's' : ''}`;
    }
    if(type.includes('lieu') || rawType.includes('location')){
      const v = a || p || n(card?.seen);
      return `${v} gain${v > 1 ? 's' : ''}`;
    }
    if(type.includes('objet') || rawType.includes('item')){
      const v = a || p || n(card?.seen);
      return `${v} activation${v > 1 ? 's' : ''}`;
    }
    if(type.includes('action') || type.includes('chanson') || rawType.includes('action') || rawType.includes('song')){
      const v = p || a || n(card?.seen);
      return `${v} jouée${v > 1 ? 's' : ''}`;
    }
    const v = a || q || p || n(card?.seen);
    return `${v} action${v > 1 ? 's' : ''}`;
  }

  function hydrateCard(cardLike){
    const replay = normalizeReplayCard(cardLike);
    const keys = new Set(cardReferenceKeys(replay));
    keys.add(slug(`${replay.name} ${replay.version}`));
    if(replay.setCode && replay.number){
      const code = normalizeSetCode(replay.setCode);
      const num = SET_CODE_TO_NUM[code] || String(replay.id || '').split('-')[0];
      const cardNumber = strip0(replay.number);
      keys.add(`${num}-${cardNumber}`);
      keys.add(slug(`${code}-${cardNumber}`));
      keys.add(slug(`${code} ${cardNumber}`));
    }
    let local = null;
    for(const k of keys){ if(state.index.has(k)){ local = state.index.get(k); break; } }
    if(!local && replay.id?.includes('-')){
      const [setNum, number] = replay.id.split('-');
      const code = SET_NUM_TO_CODE[setNum] || setNum;
      local = state.index.get(slug(`${code}-${strip0(number)}`)) || state.index.get(`${setNum}-${strip0(number)}`) || null;
    }
    return mergeCard(local || {}, replay);
  }

  function normalizeReplayCard(rawInput){
    const raw = rawInput?.card && isCardLike(rawInput.card) ? {
      ...rawInput.card,
      instanceId:rawInput.instanceId || rawInput.cardInstanceId || rawInput.card.instanceId || rawInput.card.cardInstanceId || '',
      cardInstanceId:rawInput.cardInstanceId || rawInput.instanceId || rawInput.card.cardInstanceId || rawInput.card.instanceId || '',
      exerted:rawInput.exerted ?? rawInput.card.exerted
    } : (rawInput || {});
    const fr = raw.translations?.fr || {};
    const id = raw.id || raw.cardId || raw.card_id || '';
    const name = raw.name || raw.cardName || '';
    const version = raw.title || raw.version || raw.subtitle || '';
    const fullName = raw.fullName || raw.cardName || [name, version].filter(Boolean).join(' - ') || name;
    const setNum = String(id).split('-')[0];
    const setCode = SET_NUM_TO_CODE[setNum] || normalizeSetCode(raw.set || raw.setCode || raw.set_code || raw.expansion || '');
    return {
      source:'replay', id, cardId:id, instanceId:raw.instanceId || raw.cardInstanceId || '', cardInstanceId:raw.cardInstanceId || raw.instanceId || '',
      name, version, fullName, type:raw.type || raw.cardType || '', colors:arrayify(raw.colors || raw.color || raw.inkColor), cost:nullable(raw.cost ?? raw.inkCost), inkable:boolValue(raw.inkable ?? raw.inkwell), rarity:raw.rarity || '',
      strength:nullable(raw.strength), willpower:nullable(raw.willpower), lore:nullable(raw.lore), moveCost:nullable(raw.moveCost), classifications:arrayify(raw.subtypes || raw.classifications),
      text:fr.rulesText || raw.rulesText || raw.text || raw.ability || '', flavorText:fr.flavorText || raw.flavorText || '', franchise:raw.franchise || raw.story || '', artists:arrayify(raw.illustrators || raw.artists || raw.artist),
      setCodes:setCode ? [setCode] : [], setCode, number:strip0(String(id).split('-')[1] || raw.number || raw.cardNumber || raw.collector_number || raw.collectorNumber || ''),
      image:getCardImage(raw, 'normal'), imageSmall:getCardImage(raw, 'small'), specialAbilities:raw.specialAbilities || [], abilities:raw.abilities || [], raw
    };
  }

  function mergeCard(base, incoming){
    const out = { ...base };
    for(const [k,v] of Object.entries(incoming || {})){
      if(k === 'owners' || k === 'ownerStats') continue;
      if(k === 'image' || k === 'imageSmall') { if(v) out[k] = v; continue; }
      if(k === 'text') { if(v && String(v).length > String(out[k] || '').length) out[k] = v; continue; }
      if((out[k] === undefined || out[k] === null || out[k] === '' || (Array.isArray(out[k]) && !out[k].length)) && !(v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))) out[k] = v;
    }
    return out;
  }
  function finalizeCard(c){
    const ownerStats = normalizeOwnerStats(c.ownerStats);
    const intrinsicLore = n(cardIntrinsicLore(c));
    if(intrinsicLore > 0){
      ['mine','opponent'].forEach(owner => {
        if(n(ownerStats[owner].quest) > 0 && n(ownerStats[owner].lore) === 0){
          ownerStats[owner].lore = n(ownerStats[owner].quest) * intrinsicLore;
        }
      });
    }
    const totalStats = ['mine','opponent'].reduce((acc, owner) => {
      const stats = ownerStats[owner] || freshOwnerStats();
      acc.seen += n(stats.seen);
      acc.played += n(stats.played);
      acc.inked += n(stats.inked);
      INKWELL_SOURCE_KEYS.forEach(key => { acc[key] = n(acc[key]) + n(stats[key]); });
      acc.quest += n(stats.quest);
      acc.lore += n(stats.lore);
      acc.loreActions += n(stats.loreActions);
      acc.challenge += n(stats.challenge);
      acc.firstTurns.push(...arrayify(stats.firstTurns));
      return acc;
    }, { seen:0, played:0, inked:0, inkedFromHand:0, inkedFromDiscard:0, inkedFromBoard:0, inkedFromDeck:0, inkedFromUnknown:0, quest:0, lore:0, loreActions:0, challenge:0, firstTurns:[] });
    const ownersValue = c.owners instanceof Set ? [...c.owners] : arrayify(c.owners);
    const sourceStats = Object.fromEntries(INKWELL_SOURCE_KEYS.map(key => [key, n(totalStats[key])]));
    return { ...c, owners:ownersValue, ownerStats, seen:totalStats.seen, played:totalStats.played, inked:totalStats.inked, ...sourceStats, quest:totalStats.quest, lore:totalStats.lore, loreActions:totalStats.loreActions, challenge:totalStats.challenge, firstTurns:totalStats.firstTurns, avgTurn:totalStats.firstTurns.length ? mean(totalStats.firstTurns) : null };
  }

  function mergeScopedCardTotals(a, b){
    const out = mergeCard(a || {}, b || {});
    const toOwnerList = value => value instanceof Set ? [...value] : arrayify(value);
    const owners = new Set([...toOwnerList(a?.owners), ...toOwnerList(b?.owners)]);
    out.owners = [...owners].filter(Boolean);
    const aStats = normalizeOwnerStats(a?.ownerStats);
    const bStats = normalizeOwnerStats(b?.ownerStats);
    out.ownerStats = { mine:freshOwnerStats(), opponent:freshOwnerStats() };
    ['mine','opponent'].forEach(owner => {
      const firstTurns = [...(aStats[owner].firstTurns || []), ...(bStats[owner].firstTurns || [])];
      out.ownerStats[owner] = {
        seen:n(aStats[owner].seen) + n(bStats[owner].seen),
        played:n(aStats[owner].played) + n(bStats[owner].played),
        inked:n(aStats[owner].inked) + n(bStats[owner].inked),
        quest:n(aStats[owner].quest) + n(bStats[owner].quest),
        lore:n(aStats[owner].lore) + n(bStats[owner].lore),
        loreActions:n(aStats[owner].loreActions) + n(bStats[owner].loreActions),
        challenge:n(aStats[owner].challenge) + n(bStats[owner].challenge),
        firstTurns
      };
    });
    out.seen = n(a?.seen) + n(b?.seen);
    out.played = n(a?.played) + n(b?.played);
    out.inked = n(a?.inked) + n(b?.inked);
    out.quest = n(a?.quest) + n(b?.quest);
    out.lore = n(a?.lore) + n(b?.lore);
    out.loreActions = n(a?.loreActions) + n(b?.loreActions);
    out.challenge = n(a?.challenge) + n(b?.challenge);
    out.firstTurns = [...(a?.firstTurns || []), ...(b?.firstTurns || [])];
    out.avgTurn = out.firstTurns.length ? mean(out.firstTurns) : null;
    return out;
  }

  function mergeSessions(sessions){
    if(!sessions.length) return null;
    const first = sessions[0];
    const allCards = new Map();
    const allActions = [];
    const allTimeline = [];
    const allHandRetention = [];
    const allOpponentHandRetention = [];
    sessions.forEach((s, index) => {
      const gameIndex = index;
      const gameNumber = n(s.gameNumber || index + 1);
      s.cards.forEach(c => {
        const k = cardKey(c);
        const withGame = { ...c, ownerStats:normalizeOwnerStats(c.ownerStats), gameIndex, gameNumber };
        const prev = allCards.get(k);
        allCards.set(k, prev ? mergeScopedCardTotals(prev, withGame) : withGame);
      });
      allActions.push(...s.actions.map(a => ({ ...a, gameIndex, gameNumber })));
      allTimeline.push(...s.timeline.map(t => ({ ...t, gameIndex, gameNumber })));
      allHandRetention.push(...arrayify(s.handRetention).map(row => ({ ...row, gameIndex, gameNumber })));
      allOpponentHandRetention.push(...arrayify(s.opponentHandRetention).map(row => ({ ...row, gameIndex, gameNumber })));
    });
    const cards = [...allCards.values()];
    const inkProfiles = buildInkProfiles({ cards });
    const matchupLabel = formatMatchupLabel(inkProfiles);
    const opponentDeckEstimate = mergeOpponentDeckEstimates(sessions.map(s => s.opponentDeckEstimate));
    const wins = sessions.filter(s=>s.isWin).length;
    const losses = sessions.length - wins;
    const otpStats = computePlayDrawStats(sessions);
    const last = sessions[sessions.length - 1] || first;
    return {
      isBO3:sessions.length > 1,
      viewMode:'global',
      sessions,
      myName:first.myName,
      opponentName:first.opponentName,
      wins,
      losses,
      avgTurns:mean(sessions.map(s=>n(s.turnCount))),
      totalTurns:sum(sessions,'turnCount'),
      wentFirst:sessions.filter(s=>s.firstTurnPlayer === s.myPlayerNumber).length,
      otpStats,
      finalMineLore:last.finalMineLore,
      finalOppLore:last.finalOppLore,
      cards,
      actions:allActions,
      timeline:allTimeline,
      proMetrics:mergeMetrics(sessions.map(s=>s.proMetrics)),
      opponentProMetrics:mergeMetrics(sessions.map(s=>s.opponentProMetrics)),
      handRetention:mergeHandRetention(allHandRetention),
      opponentHandRetention:mergeHandRetention(allOpponentHandRetention),
      loreSeries:first.loreSeries,
      actionSeries:first.actionSeries,
      inkProfiles,
      matchupLabel,
      opponentDeckEstimate,
      first,
      last,
      matchMeta:state.matchMeta
    };
  }

  function computePlayDrawStats(sessions){
    const stats = { otp:{ wins:0, losses:0, total:0 }, otd:{ wins:0, losses:0, total:0 } };
    sessions.forEach(s => {
      const bucket = s.firstTurnPlayer === s.myPlayerNumber ? stats.otp : stats.otd;
      bucket.total += 1;
      if(s.isWin) bucket.wins += 1; else bucket.losses += 1;
    });
    return stats;
  }

  function sessionToWorkingData(session, index=0){
    if(!session) return null;
    const cards = session.cards.map(c => ({ ...c, ownerStats:normalizeOwnerStats(c.ownerStats), gameIndex:index, gameNumber:n(session.gameNumber || index + 1) }));
    const inkProfiles = session.inkProfiles || buildInkProfiles({ cards });
    return {
      isBO3:false,
      isSingleGame:true,
      viewMode:index,
      gameIndex:index,
      gameNumber:n(session.gameNumber || index + 1),
      sessions:[session],
      myName:session.myName,
      opponentName:session.opponentName,
      wins:session.isWin ? 1 : 0,
      losses:session.isWin ? 0 : 1,
      avgTurns:n(session.turnCount),
      totalTurns:n(session.turnCount),
      wentFirst:session.firstTurnPlayer === session.myPlayerNumber ? 1 : 0,
      otpStats:computePlayDrawStats([session]),
      finalMineLore:session.finalMineLore,
      finalOppLore:session.finalOppLore,
      cards,
      actions:session.actions.map(a => ({ ...a, gameIndex:index, gameNumber:n(session.gameNumber || index + 1) })),
      timeline:session.timeline.map(t => ({ ...t, gameIndex:index, gameNumber:n(session.gameNumber || index + 1) })),
      proMetrics:session.proMetrics,
      opponentProMetrics:session.opponentProMetrics,
      handRetention:arrayify(session.handRetention),
      opponentHandRetention:arrayify(session.opponentHandRetention),
      loreSeries:session.loreSeries,
      actionSeries:session.actionSeries,
      inkProfiles,
      matchupLabel:session.matchupLabel || formatMatchupLabel(inkProfiles),
      opponentDeckEstimate:session.opponentDeckEstimate || finalizeOpponentDeckEstimate(new Map()),
      first:session,
      last:session
    };
  }

  function getWorkingData(){
    if(!state.sessions.length) return null;
    if(state.viewMode === 'global') return state.merged;
    const index = Number(state.viewMode || 0);
    return sessionToWorkingData(state.sessions[index], index);
  }

  function isGlobalView(){
    return state.isBO3 && state.viewMode === 'global';
  }

  function mergeMetrics(list){
    if(list.length === 1) return list[0];
    return { totalInkFloat:sum(list,'totalInkFloat'), totalInkSpent:sum(list,'totalInkSpent'), questCount:sum(list,'questCount'), challengeCount:sum(list,'challengeCount'), topDeckTurns:sum(list,'topDeckTurns'), handKnown:list.some(x=>x.handKnown), inkByTurn:list.flatMap(x=>x.inkByTurn || []), handByTurn:list.flatMap(x=>x.handByTurn || []), boardByTurn:list.flatMap(x=>x.boardByTurn || []) };
  }

  function renderAll(){
    const m = getWorkingData();
    updateDynamicTheme(m || state.merged, state.scope);
    syncViewModeVisibility();
    renderBo3Selector();
    document.querySelectorAll('[data-card-filter]').forEach(b=>b.classList.toggle('active', b.dataset.cardFilter === state.cardFilter));
    renderFiles(); renderBulkQueue(); renderDetected(); renderOverview(); renderStats(); renderCards(); renderTimeline(); renderDeckOptions(); syncSaveButton();
  }

  function cloudErrorMessage(error){
    const raw = String(error?.message || error || '').toLowerCase();
    if(raw.includes('failed to fetch') || raw.includes('network') || raw.includes('fetch') || raw.includes('blocked')){
      return 'Supabase est inaccessible depuis ce réseau. L’analyse locale reste disponible.';
    }
    return error?.message || 'Connexion cloud momentanément indisponible.';
  }

  function setCloudOffline(error=null){
    state.cloudOffline = true;
    state.cloudErrorMessage = cloudErrorMessage(error);
    state.currentUser = null;
    syncSaveButton(state.cloudErrorMessage);
    renderCloudStatus();
    renderPerformanceData();
  }

  function setCloudOnline(){
    state.cloudOffline = false;
    state.cloudErrorMessage = '';
    renderCloudStatus();
  }

  function renderCloudStatus(){
    document.body?.classList.toggle('cloud-offline', !!state.cloudOffline);
    if(!els.cloudStatusBanner) return;
    const show = !!state.cloudOffline && !state.cloudBannerDismissed;
    els.cloudStatusBanner.hidden = !show;
    if(show){
      const text = els.cloudStatusBanner.querySelector('span');
      if(text) text.textContent = state.cloudErrorMessage || 'L’analyse locale reste disponible. La sauvegarde reprendra quand le cloud sera accessible.';
    }
  }

  function initSaveIntegration(){
    getCurrentUser()
      .then(user => {
        setCloudOnline();
        state.currentUser = user;
        syncSaveButton();
        renderBulkQueue();
        refreshDeckProfiles({ silent:true }).catch(setCloudOffline);
        refreshSavedMatches({ silent:true }).catch(setCloudOffline);
        if(user) {
          getOrCreateUserProfile().catch(() => {});
          loadMyTeam().then(team => { state.team = team; updateTeamContextBars(); renderAccountPage(); }).catch(() => {});
        }
      })
      .catch(error => { setCloudOffline(error); });

    try{
      supabase.auth.onAuthStateChange((_event, session) => {
        setCloudOnline();
        const nextUser = session?.user || null;
        const sameUser = !!(state.currentUser?.id && nextUser?.id && state.currentUser.id === nextUser.id);
        state.currentUser = nextUser;
        syncSaveButton();
        renderBulkQueue();
        if(state.currentUser){
          refreshDeckProfiles({ force:!sameUser && !state.deckProfilesLoaded, silent:true }).catch(setCloudOffline);
          refreshSavedMatches({ force:!sameUser && !state.savedMatchesLoaded, silent:true }).catch(setCloudOffline);
          if(!sameUser) {
            getOrCreateUserProfile().catch(() => {});
            loadMyTeam().then(team => { state.team = team; updateTeamContextBars(); renderAccountPage(); }).catch(() => {});
          }
        }
        else {
          clearSessionCacheForCurrentUser();
          state.savedMatches = [];
          state.savedMatchesLoaded = false;
          state.selectedSavedMatchId = null;
          state.deckProfiles = [];
          state.deckProfilesLoaded = false;
          state.team = null;
          state.teamMode = false;
          state.teamMemberIds = [];
          state.teamDisplayNames = {};
          renderDeckOptions();
          renderBulkQueue();
          updateTeamContextBars();
          renderPerformanceData();
        }
      });
    }catch(error){
      setCloudOffline(error);
    }
  }

  function syncSaveButton(message=''){
    if(!els.saveAnalysisPanel || !els.saveAnalysisButton || !els.saveAnalysisStatus) return;
    const hasAnalysis = !!getWorkingData() && state.sessions.length > 0;
    els.saveAnalysisPanel.hidden = !hasAnalysis;
    if(!hasAnalysis){
      els.saveAnalysisButton.disabled = true;
      els.saveAnalysisStatus.textContent = 'Importez un replay pour pouvoir sauvegarder une analyse.';
      return;
    }

    const loggedIn = !!state.currentUser;
    if(state.cloudOffline){
      els.saveAnalysisButton.disabled = true;
      els.saveAnalysisButton.classList.toggle('is-saved', false);
      els.saveAnalysisButton.textContent = 'Sauvegarde indisponible';
      els.saveAnalysisStatus.textContent = message || state.cloudErrorMessage || 'Connexion cloud indisponible sur ce réseau. Vous pouvez continuer l’analyse locale.';
      return;
    }
    els.saveAnalysisButton.disabled = state.savePending || !loggedIn;
    els.saveAnalysisButton.classList.toggle('is-saved', !!state.lastSavedMatchId && !state.savePending);

    if(state.savePending){
      els.saveAnalysisButton.textContent = 'Sauvegarde…';
      els.saveAnalysisStatus.textContent = 'Envoi sécurisé vers votre historique.';
      return;
    }

    if(!loggedIn){
      els.saveAnalysisButton.textContent = 'Connectez-vous pour sauvegarder';
      els.saveAnalysisStatus.textContent = message || 'Connectez-vous avec Discord pour ajouter cette analyse à votre historique.';
      return;
    }

    const alreadySaved = !!(state.lastSavedMatchId || state.loadedSavedMatchId);
    if(alreadySaved){
      // V136.0C: un match déjà sauvegardé ne doit plus proposer d’action de sauvegarde.
      // Cela évite les doublons quand l’utilisateur rouvre une analyse depuis l’historique.
      els.saveAnalysisPanel.hidden = true;
      els.saveAnalysisButton.disabled = true;
      els.saveAnalysisButton.textContent = 'Analyse sauvegardée';
      els.saveAnalysisStatus.textContent = message || 'Ce match est déjà dans votre historique.';
      return;
    }

    els.saveAnalysisButton.textContent = 'Sauvegarder l’analyse';
    els.saveAnalysisStatus.textContent = message || 'Cette analyse sera liée à votre compte.';
  }

  async function saveCurrentAnalysis(){
    if(state.savePending) return;
    if(state.lastSavedMatchId || state.loadedSavedMatchId){
      syncSaveButton('Ce match est déjà dans votre historique. Aucun doublon créé.');
      return;
    }
    if(!state.currentUser){
      syncSaveButton('Connectez-vous avec Discord avant de sauvegarder.');
      return;
    }

    const m = getWorkingData();
    if(!m){
      syncSaveButton('Importez un replay avant de sauvegarder.');
      return;
    }

    let finalMessage = '';
    try{
      state.savePending = true;
      syncSaveButton();
      await globalThis.INKSIGHT_refreshSavedMatches?.({ silent:true });
      const duplicate = findDuplicateSavedMatch(m);
      if(duplicate){
        state.loadedSavedMatchId = duplicate.id;
        state.lastSavedMatchId = duplicate.id;
        finalMessage = 'Cette analyse existe déjà dans votre historique. Aucun doublon créé.';
        return;
      }
      const deckProfile = await resolveDeckProfileForSave(m);
      const details = buildSavedAnalysisDetails(m);
      const payload = buildSavedMatchPayload(m, deckProfile, details);
      const saved = await saveMatchAnalysis(payload, details);
      state.lastSavedMatchId = saved?.id || null;
      await refreshSavedMatches({ force:true, silent:true });
      state.selectedSavedMatchId = state.lastSavedMatchId;
      renderPerformanceData();
      finalMessage = 'Analyse sauvegardée. Elle pourra alimenter l’historique et les statistiques globales.';
    }catch(err){
      console.error(err);
      state.lastSavedMatchId = null;
      finalMessage = `Erreur de sauvegarde : ${err.message}`;
    }finally{
      state.savePending = false;
      syncSaveButton(finalMessage);
    }
  }

  async function saveBulkQueue(){
    if(state.bulkSaving) return { saved:0, duplicates:0, errors:0 };
    if(!state.currentUser){
      if(els.bulkImportStatus) els.bulkImportStatus.textContent = 'Connectez-vous avec Discord avant de sauvegarder un lot.';
      return;
    }
    const queue = state.bulkQueue || [];
    const candidates = queue.filter(item => item.merged && ['ready','warning'].includes(item.status));
    if(!candidates.length){
      if(els.bulkImportStatus) els.bulkImportStatus.textContent = 'Aucune analyse valide à sauvegarder dans la file.';
      renderBulkQueue();
      return;
    }
    state.bulkSaving = true;
    state.bulkSaveTotal = candidates.length;
    state.bulkSaveDone = 0;
    renderBulkQueue();
    try{
      await globalThis.INKSIGHT_refreshSavedMatches?.({ silent:true });
      let savedCount = 0;
      let duplicateCount = 0;
      for(const item of candidates){
        item.status = 'saving';
        item.message = 'Sauvegarde en cours…';
        renderBulkQueue();
        const duplicate = findDuplicateSavedMatchForData(item.merged);
        if(duplicate){
          item.status = 'duplicate';
          item.duplicate = duplicate;
          item.message = 'Déjà présent dans l’historique. Aucun doublon créé.';
          duplicateCount += 1;
          state.bulkSaveDone += 1;
          renderBulkQueue();
          continue;
        }
        const previous = snapshotCurrentReplayState();
        try{
          restoreReplayStateFromBulkItem(item);
          const details = buildSavedAnalysisDetails(item.merged);
          const deckProfile = await resolveBulkDeckForItem(item);
          const payload = buildSavedMatchPayload(item.merged, deckProfile, details);
          const saved = await saveMatchAnalysis(payload, details);
          item.savedId = saved?.id || null;
          item.status = 'saved';
          item.message = 'Analyse sauvegardée.';
          savedCount += 1;
        }catch(err){
          console.error(err);
          item.status = 'error';
          item.error = err;
          item.message = `Erreur de sauvegarde : ${err.message}`;
        }finally{
          restoreReplayStateSnapshot(previous);
        }
        state.bulkSaveDone += 1;
        renderBulkQueue();
      }
      await refreshSavedMatches({ force:true, silent:true });
      const errorCountBeforeCleanup = queue.filter(item => item.status === 'error').length;
      const shouldCleanQueue = queue.length > 1 || queue.some(item => item?.duelinkGame || item?.merged?.sourceType === 'duelink_api');
      if(shouldCleanQueue){
        if(state.duelinkAutoSaving){
          state.bulkQueue = state.bulkQueue.filter(item => !(item?.duelinkGame || item?.merged?.sourceType === 'duelink_api'));
        }else{
          state.bulkQueue = state.bulkQueue.filter(item => !['saved','duplicate'].includes(item.status));
        }
        state.activeBulkIndex = state.bulkQueue.findIndex(item => item?.merged && item.status !== 'error');
        if(state.activeBulkIndex < 0) state.activeBulkIndex = null;
      }
      const finalMessage = `${savedCount} analyse${savedCount > 1 ? 's' : ''} sauvegardée${savedCount > 1 ? 's' : ''}.${duplicateCount ? ` ${duplicateCount} doublon${duplicateCount > 1 ? 's' : ''} ignoré${duplicateCount > 1 ? 's' : ''}.` : ''}`.trim();
      state.lastBulkSaveMessage = finalMessage;
      if(els.bulkImportStatus) els.bulkImportStatus.textContent = finalMessage;
      if(shouldCleanQueue && !state.bulkQueue.length){
        clearReplays();
        if(els.dropzoneStatus) els.dropzoneStatus.textContent = finalMessage;
        if(els.statusText) els.statusText.textContent = finalMessage;
      }
      return { saved:savedCount, duplicates:duplicateCount, errors:errorCountBeforeCleanup, message:finalMessage };
    }finally{
      state.bulkSaving = false;
      state.bulkSaveTotal = 0;
      state.bulkSaveDone = 0;
      renderBulkQueue();
    }
  }

  function snapshotCurrentReplayState(){
    return {
      replays:state.replays,
      sessions:state.sessions,
      merged:state.merged,
      isBO3:state.isBO3,
      viewMode:state.viewMode,
      matchMeta:state.matchMeta
    };
  }

  function restoreReplayStateSnapshot(snapshot){
    if(!snapshot) return;
    state.replays = snapshot.replays;
    state.sessions = snapshot.sessions;
    state.merged = snapshot.merged;
    state.isBO3 = snapshot.isBO3;
    state.viewMode = snapshot.viewMode;
    state.matchMeta = snapshot.matchMeta;
  }

  function restoreReplayStateFromBulkItem(item){
    state.replays = item.replays || [];
    state.sessions = item.sessions || [];
    state.merged = item.merged || null;
    state.isBO3 = state.sessions.length > 1;
    state.viewMode = state.isBO3 ? 'global' : 0;
    state.matchMeta = item.matchMeta || null;
  }

  function replaySha256ForSavedData(m){
    const sessions = Array.isArray(m?.sessions) && m.sessions.length ? m.sessions : (m?.first ? [m.first] : []);
    const hashes = sessions.map(session => session?.replaySha256).filter(Boolean);
    if(hashes.length === 1) return hashes[0];
    if(hashes.length > 1) return hashes.join(':');
    return m?.replaySha256 || m?.first?.replaySha256 || '';
  }


  function apiMetadataForSavedData(m){
    const sessions = Array.isArray(m?.sessions) && m.sessions.length ? m.sessions : (m?.first ? [m.first] : []);
    const first = sessions.find(session => session?.sourceType === 'duelink_api' || session?.duelinkGameId || session?.duelinkReplayId) || (m?.sourceType === 'duelink_api' ? m : null);
    if(!first) return null;
    const myDeck = first.myDecklist || m?.myDecklist || null;
    const mySummary = apiDecklistSummary(myDeck);
    return {
      source_type:'duelink_api',
      duelink_game_id:first.duelinkGameId || m?.duelinkGameId || null,
      duelink_replay_id:first.duelinkReplayId || m?.duelinkReplayId || null,
      duelink_source:first.duelinkSource || m?.duelinkSource || null,
      duelink_queue:first.duelinkQueue || m?.duelinkQueue || null,
      duelink_format:first.duelinkFormat || m?.duelinkFormat || null,
      duelink_updated_at:first.duelinkUpdatedAt || m?.duelinkUpdatedAt || first.playedAt || null,
      my_decklist:myDeck,
      my_deck_hash:mySummary.hash || null,
      my_deck_unique_cards:mySummary.unique || 0,
      my_deck_copies:mySummary.copies || 0,
      api_row:sanitizeDuelinkApiObject(first.apiRow || m?.apiRow || null)
    };
  }

  function buildSavedMatchPayload(m, deckProfile={}, details={}){
    const apiMeta = apiMetadataForSavedData(m);
    const apiRaw = apiMeta?.api_row?.raw || null;
    const rawFmt = String(apiRaw?.match_format || '').toLowerCase();
    // Id de série Duels.ink (groupe les games d'un BO3). Absent pour les BO1.
    const seriesMatchId = apiRaw?.match_id || null;
    const global = !!(m?.isBO3 || isGlobalView());
    // Le format vient d'abord de Duels.ink (match_format), sinon du mode d'analyse.
    const format = rawFmt === 'bo3' ? 'BO3' : (rawFmt === 'bo1' ? 'BO1' : (global ? 'BO3' : 'BO1'));
    const profiles = m.inkProfiles || buildInkProfiles(m);
    const wins = n(m.wins);
    const losses = n(m.losses);
    const win = wins > losses;
    const result = win ? 'win' : 'loss';
    const scoreLabel = global ? `${wins}-${losses}` : `${n(m.finalMineLore)}-${n(m.finalOppLore)}`;
    const matchup = m.matchupLabel || formatMatchupLabel(profiles);
    const title = `${format} · ${win ? 'Victoire' : 'Défaite'} ${scoreLabel} · ${matchup}`;
    const quality = auditCurrentAnalysisQuality(m, details, deckProfile);
    const fingerprint = savedMatchSignatureFromM(m);
    const playedAt = detectPlayedAt(m) || null;
    const sourceType = apiMeta?.source_type || 'manual';

    return {
      title,
      format,
      result,
      wins,
      losses,
      score_label:scoreLabel,
      matchup_label:matchup,
      mine_colors:(profiles.mine?.inks || []).map(inkLabel),
      opponent_colors:(profiles.opponent?.inks || []).map(inkLabel),
      opponent_name:m.opponentName || '',
      deck_name:deckProfile.name || null,
      deck_profile_id:deckProfile.id || null,
      duelink_url:null,
      played_at:playedAt,
      source_type:sourceType,
      duelink_match_id:apiMeta?.duelink_game_id || null,
      series_match_id:seriesMatchId,
      went_first:(apiRaw?.went_first === true || apiRaw?.went_first === 'true') ? true : ((apiRaw?.went_first === false || apiRaw?.went_first === 'false') ? false : null),
      duelink_source:apiMeta?.duelink_source || null,
      duelink_queue:apiMeta?.duelink_queue || null,
      duelink_updated_at:apiMeta?.duelink_updated_at || null,
      replay_sha256:replaySha256ForSavedData(m) || null,
      my_decklist:apiMeta?.my_decklist || null,
      api_metadata:apiMeta || null,
      replay_fingerprint:fingerprint || null,
      data_quality:quality.status,
      quality_issues:quality.issues,
      total_turns:Math.round(global ? n(m.totalTurns) : n(m.avgTurns || m.first?.turnCount)),
      avg_turns:round1(m.avgTurns || 0),
      final_mine_lore:n(m.finalMineLore),
      final_opp_lore:n(m.finalOppLore),
      analysis_json:buildSavedAnalysisJson(m, { format, result, scoreLabel, matchup, profiles, deckProfile, quality, apiMeta, sourceType })
    };
  }


  function buildSavedAnalysisDetails(m){
    const sessions = Array.isArray(m?.sessions) && m.sessions.length ? m.sessions : (m?.first ? [m.first] : []);
    const games = [];
    const cardStats = [];
    const turnStats = [];

    sessions.forEach((session, index) => {
      const gameNumber = n(session.gameNumber || index + 1);
      const profiles = session.inkProfiles || buildInkProfiles({ cards:session.cards || [] });
      const mineColors = (profiles.mine?.inks || []).map(inkLabel);
      const opponentColors = (profiles.opponent?.inks || []).map(inkLabel);

      games.push({
        game_number:gameNumber,
        is_win:!!session.isWin,
        format:state.isBO3 ? 'BO3' : 'BO1',
        played_at:session.playedAt || null,
        source_type:session.sourceType || 'manual',
        duelink_game_id:session.duelinkGameId || null,
        duelink_replay_id:session.duelinkReplayId || null,
        duelink_gamelog_id:session.duelinkGamelogId || null,
        duelink_source:session.duelinkSource || null,
        duelink_queue:session.duelinkQueue || null,
        replay_sha256:session.replaySha256 || null,
        my_decklist:session.myDecklist || null,
        api_row:session.apiRow || null,
        otp:session.firstTurnPlayer === session.myPlayerNumber,
        first_turn_player:n(session.firstTurnPlayer),
        turn_count:n(session.turnCount),
        cards_seen:n(session.cardsSeen),
        final_mine_lore:n(session.finalMineLore),
        final_opp_lore:n(session.finalOppLore),
        mine_colors:mineColors,
        opponent_colors:opponentColors,
        matchup_label:session.matchupLabel || formatMatchupLabel(profiles),
        game_json:{
          file_name:session.fileName || '',
          victory_reason:session.victoryReason || '',
          mulligan:compactMulligan(session.mulligan),
          metrics:{ mine:compactMetrics(session.proMetrics), opponent:compactMetrics(session.opponentProMetrics) },
          hand_retention:{ mine:compactHandRetention(session.handRetention), opponent:compactHandRetention(session.opponentHandRetention) },
          handRetention:compactHandRetention(session.handRetention),
          lore_series:compactLoreSeries(session.loreSeries),
          action_series:compactActionSeries(session.actionSeries)
        }
      });

      const mulliganMaps = detailedMulliganMaps(session.mulligan);
      ['mine','opponent'].forEach(owner => {
        const opening = owner === 'mine' ? mulliganMaps.initial : new Map();
        const kept = owner === 'mine' ? mulliganMaps.kept : new Map();
        const replaced = owner === 'mine' ? mulliganMaps.replaced : new Map();
        (session.cards || []).forEach(card => {
          const scoped = scopedCard(card, owner);
          if(!n(scoped.seen) && !scoped.owners?.includes(owner)) return;
          const key = statCardKey(scoped) || cardKey(scoped) || fullName(scoped);
          if(!key) return;
          cardStats.push({
            game_number:gameNumber,
            owner,
            card_key:key,
            card_name:fullName(scoped),
            card_type:typeLabel(scoped.type),
            colors:arrayify(scoped.colors).map(inkLabel),
            seen:n(scoped.seen),
            in_opening_hand:n(opening.get(key)),
            kept_mulligan:n(kept.get(key)),
            replaced_mulligan:n(replaced.get(key)),
            played:n(scoped.played),
            inked:n(scoped.inked),
            quest_count:n(scoped.quest),
            lore_generated:n(scoped.lore),
            challenge_count:n(scoped.challenge),
            first_turns:Array.isArray(scoped.firstTurns) ? scoped.firstTurns.map(n).filter(Boolean) : [],
            avg_turn:scoped.avgTurn === null || scoped.avgTurn === undefined ? null : round1(scoped.avgTurn)
          });
        });
        if(owner === 'mine'){
          const existingKeys = new Set((session.cards || []).map(card => {
            const scoped = scopedCard(card, 'mine');
            return statCardKey(scoped) || cardKey(scoped) || fullName(scoped);
          }).filter(Boolean));
          const mulliganKeys = new Set([...opening.keys(), ...kept.keys(), ...replaced.keys()]);
          mulliganKeys.forEach(key => {
            if(existingKeys.has(key)) return;
            cardStats.push({
              game_number:gameNumber,
              owner:'mine',
              card_key:key,
              card_name:fullName(hydrateCard({ id:key, fullName:key, name:key })),
              card_type:typeLabel(hydrateCard({ id:key, fullName:key, name:key }).type),
              colors:arrayify(hydrateCard({ id:key, fullName:key, name:key }).colors).map(inkLabel),
              seen:0,
              in_opening_hand:n(opening.get(key)),
              kept_mulligan:n(kept.get(key)),
              replaced_mulligan:n(replaced.get(key)),
              played:0,
              inked:0,
              quest_count:0,
              lore_generated:0,
              challenge_count:0,
              first_turns:[],
              avg_turn:null
            });
          });
        }
      });

      turnStats.push(...detailedTurnRowsForSession(session, gameNumber, 'mine'));
      turnStats.push(...detailedTurnRowsForSession(session, gameNumber, 'opponent'));
    });

    return { games, cardStats, turnStats };
  }

  function mulliganStableCardKey(card){
    const hydrated = hydrateCard(card || {});
    return statCardKey(hydrated) || statCardKey(card || {}) || card?.key || card?.id || '';
  }

  function mulliganInstanceKey(card){
    return card?.instanceId || card?.instance_id || card?.cardInstanceId || card?.instance || '';
  }

  function countMulliganCards(cards){
    const map = new Map();
    (cards || []).forEach(card => {
      const key = mulliganStableCardKey(card);
      if(!key) return;
      map.set(key, n(map.get(key)) + 1);
    });
    return map;
  }

  function splitMulliganInitialCards(mulligan){
    const initialCards = arrayify(mulligan?.initial);
    const resolvedCards = arrayify(mulligan?.resolved);
    const exactResolved = new Map();
    resolvedCards.forEach(card => {
      const instance = mulliganInstanceKey(card);
      if(!instance) return;
      exactResolved.set(instance, n(exactResolved.get(instance)) + 1);
    });

    const keptCards = [];
    const thrownCards = [];
    const unresolvedInitial = [];

    initialCards.forEach(card => {
      const instance = mulliganInstanceKey(card);
      if(instance && n(exactResolved.get(instance)) > 0){
        keptCards.push(card);
        exactResolved.set(instance, n(exactResolved.get(instance)) - 1);
      }else if(instance){
        thrownCards.push(card);
      }else{
        unresolvedInitial.push(card);
      }
    });

    if(unresolvedInitial.length){
      const resolvedByName = countMulliganCards(resolvedCards);
      keptCards.forEach(card => {
        const key = mulliganStableCardKey(card);
        if(key) resolvedByName.set(key, Math.max(0, n(resolvedByName.get(key)) - 1));
      });
      unresolvedInitial.forEach(card => {
        const key = mulliganStableCardKey(card);
        if(key && n(resolvedByName.get(key)) > 0){
          keptCards.push(card);
          resolvedByName.set(key, n(resolvedByName.get(key)) - 1);
        }else{
          thrownCards.push(card);
        }
      });
    }

    return { initialCards, keptCards, thrownCards, replacementCards:arrayify(mulligan?.replaced), resolvedCards };
  }

  function detailedMulliganMaps(mulligan){
    // Duels.ink stores "replaced" as the replacement cards drawn after the mulligan, not the cards sent back.
    // The real decision is: initial card stayed in resolved hand = kept; initial card absent from resolved hand = renvoyée.
    const split = splitMulliganInitialCards(mulligan);
    return {
      initial:countMulliganCards(split.initialCards),
      kept:countMulliganCards(split.keptCards),
      replaced:countMulliganCards(split.thrownCards)
    };
  }

  function detailedTurnRowsForSession(session, gameNumber, owner){
    const metrics = owner === 'mine' ? session.proMetrics : session.opponentProMetrics;
    const loreMap = new Map((session.loreSeries || []).map(row => [n(row.turn), owner === 'mine' ? n(row.mine) : n(row.opponent)]));
    const actionCounts = new Map();
    (session.timeline || []).forEach(entry => {
      if(entry.owner !== owner) return;
      const turn = n(entry.turn || entry.globalTurn || 1);
      const bucket = actionCounts.get(turn) || { play:0, quest:0, challenge:0, ink:0 };
      if(entry.type === 'play') bucket.play += 1;
      if(entry.type === 'quest') bucket.quest += 1;
      if(entry.type === 'challenge') bucket.challenge += 1;
      if(entry.type === 'ink') bucket.ink += 1;
      actionCounts.set(turn, bucket);
    });
    const handMap = new Map((metrics?.handByTurn || []).map(row => [n(row.turn), n(row.handCount)]));
    return (metrics?.inkByTurn || []).map(row => {
      const turn = n(row.turn);
      const counts = actionCounts.get(turn) || { play:0, quest:0, challenge:0, ink:0 };
      return {
        game_number:gameNumber,
        turn,
        owner,
        lore:n(loreMap.get(turn)),
        hand_count:n(row.handEnd ?? handMap.get(turn)),
        ink_capacity:round1(row.capacity),
        ink_spent:round1(row.spent),
        ink_float:round1(row.float),
        inked:n(row.inked ?? counts.ink),
        cards_played:n(counts.play),
        quests:n(counts.quest),
        challenges:n(counts.challenge)
      };
    });
  }

  function buildSavedAnalysisJson(m, meta){
    const narrative = generateMatchNarrative(m);
    return {
      schema_version:'v78',
      saved_at:new Date().toISOString(),
      played_at:detectPlayedAt(m) || null,
      duplicate_signature:savedMatchSignatureFromM(m),
      data_quality:meta.quality || null,
      source:'lorcana-gto-replay-analyzer',
      source_type:meta.sourceType || 'manual',
      replay_sha256:replaySha256ForSavedData(m) || null,
      api_metadata:meta.apiMeta || null,
      view_mode:state.viewMode,
      format:meta.format,
      cards_seen:n(m.cardsSeen ?? m.sessions?.[0]?.cardsSeen ?? m.first?.cardsSeen ?? 0),
      result:{
        value:meta.result,
        wins:n(m.wins),
        losses:n(m.losses),
        score_label:meta.scoreLabel,
        final_mine_lore:n(m.finalMineLore),
        final_opp_lore:n(m.finalOppLore),
        avg_turns:round1(m.avgTurns || 0),
        total_turns:n(m.totalTurns || m.avgTurns || 0)
      },
      players:{ mine:m.myName || 'Joueur', opponent:m.opponentName || 'Adversaire' },
      deck:{ id:meta.deckProfile?.id || null, name:meta.deckProfile?.name || null },
      matchup:{
        label:meta.matchup,
        mine:{ label:meta.profiles.mine?.label || '', inks:meta.profiles.mine?.inks || [] },
        opponent:{ label:meta.profiles.opponent?.label || '', inks:meta.profiles.opponent?.inks || [] }
      },
      narrative:{ title:narrative.title, text:narrative.text || narrative.summary || '', badge:narrative.badge || '' },
      key_moments:collectKeyMoments(m).map(moment => ({ kind:moment.kind, owner:moment.owner, turn:n(moment.turn), delta:n(moment.delta), text:keyMomentText(moment) })),
      metrics:{ mine:compactMetrics(m.proMetrics), opponent:compactMetrics(m.opponentProMetrics) },
      hand_retention:{ mine:compactHandRetention(m.handRetention), opponent:compactHandRetention(m.opponentHandRetention) },
      mulligan:compactMulligan(m.sessions?.[0]?.mulligan || m.first?.mulligan),
      charts:{ lore_series:compactLoreSeries(m.loreSeries), action_series:compactActionSeries(m.actionSeries) },
      opponent_deck_estimate:compactOpponentDeckEstimate(m.opponentDeckEstimate),
      cards:{ mine:compactCardStats(cardsForScope(m, 'mine')), opponent:compactCardStats(cardsForScope(m, 'opponent')) },
      timeline:compactTimeline(m.timeline),
      games:compactGames(m.sessions || [])
    };
  }

  function compactMetrics(metrics={}){
    return {
      totalInkFloat:round1(metrics.totalInkFloat),
      totalInkSpent:round1(metrics.totalInkSpent),
      questCount:n(metrics.questCount),
      challengeCount:n(metrics.challengeCount),
      topDeckTurns:n(metrics.topDeckTurns),
      handKnown:!!metrics.handKnown,
      handByTurn:(metrics.handByTurn || []).map(r => ({ turn:n(r.turn), handCount:n(r.handCount) })),
      inkByTurn:(metrics.inkByTurn || []).map(r => ({ turn:n(r.turn), capacity:n(r.capacity), spent:n(r.spent), float:round1(r.float), inked:n(r.inked), handStart:n(r.handStart), handEnd:n(r.handEnd) })),
      boardByTurn:(metrics.boardByTurn || []).map(r => ({ turn:n(r.turn), characters:n(r.characters), locations:n(r.locations), lorePotential:n(r.lorePotential) }))
    };
  }

  function compactLoreSeries(rows=[]){
    return rows.map(r => ({ turn:n(r.turn), mine:n(r.mine), opponent:n(r.opponent) }));
  }

  function compactActionSeries(rows=[]){
    return rows.map(r => ({ turn:n(r.turn), ink:n(r.ink), play:n(r.play), quest:n(r.quest), challenge:n(r.challenge), mineChallenge:n(r.mineChallenge), opponentChallenge:n(r.opponentChallenge) }));
  }

  function compactCardStats(cards=[]){
    return (cards || [])
      .map(card => ({
        key:statCardKey(card) || cardKey(card),
        name:fullName(card),
        type:typeLabel(card.type),
        colors:arrayify(card.colors).map(inkLabel),
        seen:n(card.seen),
        played:n(card.played),
        inked:n(card.inked),
        inkedFromHand:n(card.inkedFromHand),
        inkedFromDiscard:n(card.inkedFromDiscard),
        inkedFromBoard:n(card.inkedFromBoard),
        inkedFromDeck:n(card.inkedFromDeck),
        inkedFromUnknown:n(card.inkedFromUnknown),
        quest:n(card.quest),
        lore:n(card.lore),
        loreActions:n(card.loreActions),
        challenge:n(card.challenge),
        avgTurn:card.avgTurn === null || card.avgTurn === undefined ? null : round1(card.avgTurn),
        image:card.imageSmall || card.image || ''
      }))
      .filter(card => card.key || card.name)
      .slice(0, 240);
  }

  function compactMulliganCard(card={}){
    if(!card) return null;
    return {
      key:statCardKey(card) || cardKey(card),
      name:fullName(card),
      type:typeLabel(card.type),
      colors:arrayify(card.colors).map(inkLabel),
      image:card.imageSmall || card.image || '',
      instanceId:card.instanceId || card.cardInstanceId || '',
      mulligan:!!card.mulligan
    };
  }

  function compactMulligan(mulligan){
    if(!mulligan || !mulligan.visible) return null;
    const pack = cards => (cards || []).map(compactMulliganCard).filter(Boolean);
    return {
      visible:true,
      kept:n(mulligan.kept),
      changed:!!mulligan.changed,
      initial:pack(mulligan.initial),
      resolved:pack(mulligan.resolved),
      replaced:pack(mulligan.replaced).map(card => ({ ...card, mulligan:true }))
    };
  }

  function compactTimelineCard(card){
    if(!card) return null;
    const hydrated = hydrateCard(card);
    const name = cleanCardName(fullName(hydrated));
    if(!name || name === 'Carte inconnue') return null;
    return {
      id:hydrated.id || hydrated.cardId || '',
      cardId:hydrated.cardId || hydrated.id || '',
      instanceId:hydrated.instanceId || hydrated.cardInstanceId || '',
      cardInstanceId:hydrated.cardInstanceId || hydrated.instanceId || '',
      name:hydrated.name || '',
      version:hydrated.version || hydrated.title || '',
      fullName:name,
      type:hydrated.type || '',
      colors:arrayify(hydrated.colors),
      cost:hydrated.cost ?? null,
      inkable:hydrated.inkable ?? null,
      image:hydrated.image || '',
      imageSmall:hydrated.imageSmall || hydrated.image || ''
    };
  }

  function compactTimeline(rows=[]){
    return (rows || []).map(row => ({
      gameNumber:n(row.gameNumber),
      turn:n(row.turn),
      owner:row.owner,
      type:row.type,
      title:row.title,
      detail:row.detail,
      cardName:row.cardName || '',
      cardKey:row.cardKey || '',
      card:compactTimelineCard(row.card)
    })).slice(0, 800);
  }

  function compactGames(sessions=[]){
    return (sessions || []).map((session, index) => ({
      gameNumber:n(session.gameNumber || index + 1),
      cardsSeen:n(session.cardsSeen),
      playedAt:session.playedAt || session.matchGameInfo?.startedAt || session.matchGameInfo?.createdAt || null,
      replaySha256:session.replaySha256 || null,
      sourceType:'manual',
      isWin:!!session.isWin,
      firstTurnPlayer:session.firstTurnPlayer,
      otp:session.firstTurnPlayer === session.myPlayerNumber,
      turnCount:n(session.turnCount),
      finalMineLore:n(session.finalMineLore),
      finalOppLore:n(session.finalOppLore),
      matchupLabel:session.matchupLabel || '',
      proMetrics:compactMetrics(session.proMetrics),
      opponentProMetrics:compactMetrics(session.opponentProMetrics),
      handRetention:compactHandRetention(session.handRetention),
      opponentHandRetention:compactHandRetention(session.opponentHandRetention),
      mulligan:compactMulligan(session.mulligan),
      loreSeries:compactLoreSeries(session.loreSeries),
      actionSeries:compactActionSeries(session.actionSeries),
      opponent_deck_estimate:compactOpponentDeckEstimate(session.opponentDeckEstimate)
    }));
  }

  async function loadSavedAnalysis(row){
    if(!row){
      if(els.historyStatus) els.historyStatus.textContent = 'Analyse sauvegardée introuvable.';
      return;
    }
    try{
      let hydratedRow = row;
      if(!hydratedRow.analysis_json && hydratedRow.id){
        if(els.historyStatus) els.historyStatus.textContent = 'Chargement de l’analyse sauvegardée…';
        hydratedRow = await getSavedMatch(hydratedRow.id);
        const index = state.savedMatches.findIndex(item => item.id === hydratedRow.id);
        if(index >= 0) state.savedMatches[index] = { ...state.savedMatches[index], ...hydratedRow };
      }
      if(!hydratedRow || !hydratedRow.analysis_json){
        if(els.historyStatus) els.historyStatus.textContent = 'Analyse sauvegardée introuvable.';
        return;
      }
      // Si le match fait partie d'une série BO3 (même series_match_id), on
      // recolle les games sœurs pour rouvrir tout le BO3 comme un import zip.
      const seriesId = hydratedRow.series_match_id;
      let runtime;
      if(seriesId && String(hydratedRow.format||'').toUpperCase() === 'BO3'){
        const siblings = (state.savedMatches || []).filter(m => m.series_match_id === seriesId);
        if(siblings.length > 1){
          const byId = new Map([[hydratedRow.id, hydratedRow]]);
          await Promise.all(siblings.map(async sib => {
            if(sib.id === hydratedRow.id || byId.has(sib.id)) return;
            const full = await getSavedMatch(sib.id).catch(()=>null);
            if(full) byId.set(full.id, full);
          }));
          const rows = [...byId.values()].filter(r => r?.analysis_json);
          if(rows.length > 1){
            rows.sort((a,b) => {
              const ga = n(a.api_metadata?.api_row?.raw?.match_game_number) || 0;
              const gb = n(b.api_metadata?.api_row?.raw?.match_game_number) || 0;
              if(ga !== gb) return ga - gb;
              return String(a.played_at||a.created_at||'').localeCompare(String(b.played_at||b.created_at||''));
            });
            runtime = savedSeriesToRuntimeState(rows);
          }
        }
      }
      if(!runtime) runtime = savedRowToRuntimeState(hydratedRow);
      state.replays = runtime.replays;
      state.sessions = runtime.sessions;
      state.merged = runtime.merged;
      state.isBO3 = runtime.isBO3;
      state.viewMode = runtime.isBO3 ? 'global' : 0;
      state.matchMeta = { source:'saved_match', id:hydratedRow.id, created_at:hydratedRow.created_at };
      state.mulliganResolved = false;
      state.lastSavedMatchId = hydratedRow.id;
      state.loadedSavedMatchId = hydratedRow.id;
      state.selectedSavedMatchId = hydratedRow.id;
      if(state.isBO3) state.cardFilter = 'opponent';
      document.body.classList.toggle('empty-state', !state.sessions.length);
      document.body.classList.toggle('has-results', !!state.sessions.length);
      setTab('overview');
      renderAll();
      document.querySelector('.app-nav-button[data-app-view="analysis"]')?.click();
      if(els.statusText) els.statusText.textContent = 'Analyse sauvegardée rechargée depuis votre historique.';
      if(els.historyStatus) els.historyStatus.textContent = 'Analyse ouverte dans l’onglet Analyse.';
    }catch(err){
      console.error(err);
      if(els.historyStatus) els.historyStatus.textContent = `Erreur de chargement : ${err.message}`;
    }
  }

  function savedRowToRuntimeState(row){
    const analysis = row.analysis_json || {};
    const format = String(row.format || analysis.format || 'BO1').toUpperCase();
    const globalCards = savedCardsToRuntimeCards(analysis.cards || {});
    const fullTimeline = savedTimelineToRuntime(analysis.timeline || []);
    const games = Array.isArray(analysis.games) ? analysis.games : [];
    const isBO3 = format === 'BO3' && games.length > 1;
    const myName = analysis.players?.mine || 'Joueur';
    const opponentName = row.opponent_name || analysis.players?.opponent || 'Adversaire';
    const profiles = savedInkProfiles(row, analysis);

    const sessions = isBO3
      ? games.map((game, index) => savedGameToSession(row, analysis, game, index, myName, opponentName, profiles))
      : [savedGameToSession(row, analysis, null, 0, myName, opponentName, profiles)];

    const merged = isBO3 ? savedMergedToWorkingData(row, analysis, sessions, globalCards, fullTimeline, profiles, myName, opponentName) : sessionToWorkingData(sessions[0], 0);
    const replays = sessions.map((session, index) => ({
      file:{ name:`${format} sauvegardé · ${formatSavedDate(row.created_at)}${isBO3 ? ` · Game ${index + 1}` : ''}`, size:0, savedMatchId:row.id },
      replay:{ saved:true, id:row.id },
      session
    }));
    return { isBO3, sessions, merged, replays };
  }

  // Reconstruit un état BO3 multi-sessions à partir de plusieurs saved_matches
  // partageant un series_match_id (un sauvé par game à l'import Duels.ink).
  function savedSeriesToRuntimeState(rows){
    const canonical = rows[rows.length - 1];
    const baseAnalysis = canonical.analysis_json || {};
    const myName = baseAnalysis?.players?.mine || 'Joueur';
    const opponentName = canonical.opponent_name || baseAnalysis?.players?.opponent || 'Adversaire';
    const profiles = savedInkProfiles(canonical, baseAnalysis);
    const globalCards = savedCardsToRuntimeCards(baseAnalysis.cards || {});
    const fullTimeline = savedTimelineToRuntime(baseAnalysis.timeline || []);
    const sessions = rows.map((sib, idx) => {
      const a = sib.analysis_json || {};
      const went = sib.api_metadata?.api_row?.raw?.went_first;
      const game = {
        gameNumber: idx + 1,
        isWin: sib.result === 'win',
        otp: went === true || went === 'true',
        turnCount: n(sib.total_turns || sib.avg_turns),
        finalMineLore: n(sib.final_mine_lore),
        finalOppLore: n(sib.final_opp_lore)
      };
      return savedGameToSession(sib, a, game, idx, myName, opponentName, profiles);
    });
    const merged = savedMergedToWorkingData(canonical, baseAnalysis, sessions, globalCards, fullTimeline, profiles, myName, opponentName);
    const replays = sessions.map((session, idx) => ({
      file:{ name:`BO3 sauvegardé · ${formatSavedDate(rows[idx].created_at)} · Game ${idx + 1}`, size:0, savedMatchId:rows[idx].id },
      replay:{ saved:true, id:rows[idx].id },
      session
    }));
    return { isBO3: true, sessions, merged, replays };
  }

  function savedMergedToWorkingData(row, analysis, sessions, cards, timeline, profiles, myName, opponentName){
    const result = analysis.result || {};
    const wins = n(row.wins ?? result.wins);
    const losses = n(row.losses ?? result.losses);
    const loreSeries = compactLoreSeries(analysis.charts?.lore_series || []);
    const actionSeries = compactActionSeries(analysis.charts?.action_series || []);
    return {
      isBO3:true,
      isSavedAnalysis:true,
      viewMode:'global',
      sessions,
      myName,
      opponentName,
      wins,
      losses,
      avgTurns:round1(row.avg_turns || mean(sessions.map(s => n(s.turnCount)))),
      totalTurns:n(row.total_turns || result.total_turns || sum(sessions, 'turnCount')),
      wentFirst:sessions.filter(s => s.firstTurnPlayer === s.myPlayerNumber).length,
      otpStats:computePlayDrawStats(sessions),
      finalMineLore:n(row.final_mine_lore ?? result.final_mine_lore),
      finalOppLore:n(row.final_opp_lore ?? result.final_opp_lore),
      cards,
      actions:timeline.map(t => ({ ...t, actionType:t.type })),
      timeline,
      proMetrics:savedMetrics(analysis.metrics?.mine),
      opponentProMetrics:savedMetrics(analysis.metrics?.opponent),
      loreSeries,
      actionSeries,
      inkProfiles:profiles,
      matchupLabel:row.matchup_label || analysis.matchup?.label || formatMatchupLabel(profiles),
      opponentDeckEstimate:normalizeStoredOpponentDeckEstimate(analysis, cards),
      // Rétention de main agrégée : on privilégie la valeur stockée du match
      // fusionné, sinon on concatène celle des games (BO3 multi-lignes).
      handRetention:arrayify(analysis.hand_retention?.mine).length ? arrayify(analysis.hand_retention?.mine) : sessions.flatMap(s => arrayify(s.handRetention)),
      opponentHandRetention:arrayify(analysis.hand_retention?.opponent).length ? arrayify(analysis.hand_retention?.opponent) : sessions.flatMap(s => arrayify(s.opponentHandRetention)),
      first:sessions[0],
      last:sessions[sessions.length - 1],
      savedAnalysis:analysis
    };
  }

  function savedGameToSession(row, analysis, game, index, myName, opponentName, profiles){
    const isBo3Game = !!game;
    const gameNumber = n(game?.gameNumber || index + 1);
    const result = analysis.result || {};
    const isWin = isBo3Game ? !!game.isWin : row.result === 'win';
    const otp = isBo3Game ? !!game.otp : null;
    const turnCount = n(game?.turnCount || row.total_turns || result.total_turns || result.avg_turns);
    const finalMineLore = n(game?.finalMineLore ?? row.final_mine_lore ?? result.final_mine_lore);
    const finalOppLore = n(game?.finalOppLore ?? row.final_opp_lore ?? result.final_opp_lore);
    const timeline = savedTimelineToRuntime(analysis.timeline || [], isBo3Game ? gameNumber : null);
    const cards = isBo3Game ? savedCardsFromTimeline(timeline, analysis.cards || {}) : savedCardsToRuntimeCards(analysis.cards || {});
    const mulligan = savedMulliganToRuntime(game?.mulligan || (!isBo3Game ? analysis.mulligan : null));
    const opponentDeckEstimate = normalizeStoredOpponentDeckEstimate(game?.opponent_deck_estimate || game?.opponentDeckEstimate || (!isBo3Game ? analysis : null), cards);
    const firstTurnPlayer = otp === null ? 1 : (otp ? 1 : 2);
    return {
      isSavedAnalysis:true,
      data:{ saved:true, id:row.id },
      file:{ name:`Analyse sauvegardée ${formatSavedDate(row.created_at)}` },
      perspective:1,
      myPlayerNumber:1,
      opponentNumber:2,
      firstTurnPlayer,
      myName,
      opponentName,
      gameIndex:index,
      gameNumber,
      winner:isWin ? 1 : 2,
      isWin,
      turnCount,
      cardsSeen:n(isBo3Game ? game?.cardsSeen : (analysis.cards_seen ?? analysis.games?.[0]?.cardsSeen)),
      finalMineLore,
      finalOppLore,
      wins:isWin ? 1 : 0,
      losses:isWin ? 0 : 1,
      cards,
      actions:timeline.map(t => ({ ...t, actionType:t.type })),
      timeline,
      proMetrics:savedMetrics(game?.proMetrics || analysis.metrics?.mine),
      opponentProMetrics:savedMetrics(game?.opponentProMetrics || analysis.metrics?.opponent),
      loreSeries:compactLoreSeries(game?.loreSeries || analysis.charts?.lore_series || []),
      actionSeries:compactActionSeries(game?.actionSeries || analysis.charts?.action_series || []),
      inkProfiles:profiles,
      matchupLabel:row.matchup_label || analysis.matchup?.label || formatMatchupLabel(profiles),
      opponentDeckEstimate,
      // Rétention de main : reconstruite depuis l'analyse stockée (le bloc « Cartes
      // restées en main » était vide sur les matchs rechargés car non reconstruit).
      handRetention:arrayify(isBo3Game ? (game?.handRetention || game?.hand_retention?.mine) : analysis.hand_retention?.mine),
      opponentHandRetention:arrayify(isBo3Game ? (game?.opponentHandRetention || game?.hand_retention?.opponent) : analysis.hand_retention?.opponent),
      mulligan
    };
  }

  function savedMulliganToRuntime(mulligan){
    if(!mulligan || !mulligan.visible) return null;
    const convert = cards => (cards || []).map(item => {
      const card = savedCompactCardToRuntime({ ...item, seen:1 }, 'mine');
      return {
        ...card,
        instanceId:item.instanceId || card.instanceId || '',
        cardInstanceId:item.instanceId || card.cardInstanceId || '',
        mulligan:!!item.mulligan
      };
    });
    const initial = convert(mulligan.initial);
    const resolved = convert(mulligan.resolved);
    const replaced = convert(mulligan.replaced).map(card => ({ ...card, mulligan:true }));
    return {
      visible:true,
      initial,
      resolved,
      replaced,
      kept:n(mulligan.kept),
      changed:!!mulligan.changed
    };
  }

  function savedInkProfiles(row, analysis){
    const normalize = values => arrayify(values).map(inkKey).filter(Boolean);
    const mine = normalize(row.mine_colors?.length ? row.mine_colors : analysis.matchup?.mine?.inks);
    const opponent = normalize(row.opponent_colors?.length ? row.opponent_colors : analysis.matchup?.opponent?.inks);
    return {
      mine:{ inks:mine, label:mine.map(inkLabel).join(' / ') || analysis.matchup?.mine?.label || '—' },
      opponent:{ inks:opponent, label:opponent.map(inkLabel).join(' / ') || analysis.matchup?.opponent?.label || '—' }
    };
  }

  function savedMetrics(metrics={}){
    return {
      totalInkFloat:round1(metrics?.totalInkFloat),
      totalInkSpent:round1(metrics?.totalInkSpent),
      questCount:n(metrics?.questCount),
      challengeCount:n(metrics?.challengeCount),
      topDeckTurns:n(metrics?.topDeckTurns),
      handKnown:!!metrics?.handKnown,
      handByTurn:(metrics?.handByTurn || []).map(r => ({ turn:n(r.turn), handCount:n(r.handCount) })),
      inkByTurn:(metrics?.inkByTurn || []).map(r => ({ turn:n(r.turn), capacity:n(r.capacity), spent:n(r.spent), float:round1(r.float), inked:n(r.inked), handStart:n(r.handStart), handEnd:n(r.handEnd) })),
      boardByTurn:(metrics?.boardByTurn || []).map(r => ({ turn:n(r.turn), characters:n(r.characters), locations:n(r.locations), lorePotential:n(r.lorePotential) }))
    };
  }

  function savedCardsToRuntimeCards(cardsByOwner={}){
    const map = new Map();
    ['mine','opponent'].forEach(owner => {
      (cardsByOwner?.[owner] || []).forEach(compact => {
        const card = savedCompactCardToRuntime(compact, owner);
        const key = cardKey(card);
        map.set(key, map.has(key) ? mergeScopedCardTotals(map.get(key), card) : card);
      });
    });
    return [...map.values()].map(finalizeCard);
  }

  function savedCardsFromTimeline(timeline=[], cardsByOwner={}){
    const global = savedCardsToRuntimeCards(cardsByOwner);
    const byKey = new Map(global.map(card => [cardKey(card), card]));
    const map = new Map();
    timeline.forEach(row => {
      if(!row.cardKey && !row.cardName) return;
      const key = row.cardKey || slug(row.cardName);
      const owner = row.owner === 'opponent' ? 'opponent' : 'mine';
      const existing = byKey.get(key) || savedCompactCardToRuntime({ key, name:row.cardName || 'Carte inconnue', seen:1 }, owner);
      const stats = normalizeOwnerStats(existing.ownerStats);
      const ownerStats = { mine:freshOwnerStats(), opponent:freshOwnerStats() };
      ownerStats[owner] = { ...freshOwnerStats(), seen:1, played:row.type === 'play' ? 1 : 0, inked:row.type === 'ink' ? 1 : 0, quest:row.type === 'quest' ? 1 : 0, challenge:row.type === 'challenge' ? 1 : 0, lore:0, loreActions:0, firstTurns:[n(row.turn)].filter(Boolean) };
      const card = { ...existing, owners:[owner], ownerStats, seen:1, played:ownerStats[owner].played, inked:ownerStats[owner].inked, quest:ownerStats[owner].quest, challenge:ownerStats[owner].challenge, lore:0, loreActions:0, firstTurns:ownerStats[owner].firstTurns };
      map.set(cardKey(card), map.has(cardKey(card)) ? mergeScopedCardTotals(map.get(cardKey(card)), card) : card);
    });
    return [...map.values()].map(finalizeCard);
  }

  function savedCompactCardToRuntime(compact={}, owner='mine'){
    const key = compact.key || slug(compact.name);
    const local = state.index.get(key) || state.index.get(slug(compact.name)) || null;
    const incoming = {
      id:key,
      name:compact.name || local?.name || 'Carte inconnue',
      fullName:compact.name || fullName(local || {}),
      type:compact.type || local?.type || '',
      colors:(compact.colors || []).map(inkKey),
      image:compact.image || local?.image || '',
      imageSmall:compact.image || local?.imageSmall || local?.image || ''
    };
    const hydrated = mergeCard(local || {}, incoming);
    const ownerStats = { mine:freshOwnerStats(), opponent:freshOwnerStats() };
    ownerStats[owner] = {
      ...freshOwnerStats(),
      seen:n(compact.seen),
      played:n(compact.played),
      inked:n(compact.inked),
      inkedFromHand:n(compact.inkedFromHand),
      inkedFromDiscard:n(compact.inkedFromDiscard),
      inkedFromBoard:n(compact.inkedFromBoard),
      inkedFromDeck:n(compact.inkedFromDeck),
      inkedFromUnknown:n(compact.inkedFromUnknown),
      quest:n(compact.quest),
      lore:n(compact.lore),
      loreActions:n(compact.loreActions),
      challenge:n(compact.challenge),
      firstTurns:[]
    };
    const stats = ownerStats[owner];
    return { ...hydrated, owners:[owner], ownerStats, seen:stats.seen, played:stats.played, inked:stats.inked, quest:stats.quest, lore:stats.lore, loreActions:stats.loreActions, challenge:stats.challenge, firstTurns:[], avgTurn:null };
  }

  function savedTimelineToRuntime(rows=[], gameNumber=null){
    return (rows || [])
      .filter(row => gameNumber === null || n(row.gameNumber) === n(gameNumber))
      .map(row => {
        const key = row.cardKey || '';
        const name = row.cardName || '';
        return {
          gameNumber:n(row.gameNumber || gameNumber || 1),
          turn:n(row.turn),
          owner:row.owner === 'opponent' ? 'opponent' : 'mine',
          type:row.type || 'ability',
          title:row.title || (name ? `Action avec ${name}` : 'Action'),
          detail:row.detail || '',
          cardName:name,
          cardKey:key,
          icon:savedActionIcon(row.type),
          card:row.card ? hydrateCard(row.card) : (key || name ? { id:key || slug(name), name, fullName:name } : null)
        };
      });
  }

  function savedActionIcon(type){
    return ({ ink:'◆', play:'▶', quest:'', challenge:'', move:'↗', ability:'', end:'↪' })[type] || '•';
  }


  // ============================================================
  // TEAM — Supabase helpers
  // ============================================================

  async function getOrCreateUserProfile(displayName) {
    const userId = state.currentUser?.id;
    if (!userId) return null;
    const avatarUrl = state.currentUser?.user_metadata?.avatar_url || state.currentUser?.user_metadata?.picture || null;
    const discordName = state.currentUser?.user_metadata?.full_name || state.currentUser?.user_metadata?.user_name || state.currentUser?.email?.split('@')[0] || 'Joueur';
    const { data } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
    if (data) {
      const updates = {};
      if (displayName && displayName !== data.display_name) updates.display_name = displayName;
      if (avatarUrl && avatarUrl !== data.avatar_url) updates.avatar_url = avatarUrl;
      if (Object.keys(updates).length) {
        await supabase.from('user_profiles').update(updates).eq('user_id', userId);
        return { ...data, ...updates };
      }
      return data;
    }
    const name = displayName || discordName;
    const { data: created } = await supabase.from('user_profiles').insert({ user_id: userId, display_name: name, avatar_url: avatarUrl }).select().single();
    return created;
  }

  async function createTeam(name) {
    const userId = state.currentUser?.id;
    if (!userId) return null;
    const profile = await getOrCreateUserProfile();
    const { data: team, error } = await supabase.from('teams').insert({ name }).select().single();
    if (error || !team) throw error || new Error('Impossible de créer l\'équipe');
    await supabase.from('team_members').insert({
      team_id: team.id, user_id: userId,
      display_name: profile?.display_name || 'Joueur',
      role: 'owner'
    });
    return team;
  }

  async function loadMyTeam() {
    const userId = state.currentUser?.id;
    if (!userId) return null;
    const { data: membership } = await supabase.from('team_members')
      .select('team_id, role').eq('user_id', userId).is('left_at', null).single();
    if (!membership) return null;
    const { data: team } = await supabase.from('teams').select('*').eq('id', membership.team_id).single();
    const { data: members } = await supabase.from('team_members')
      .select('id, user_id, display_name, role, joined_at, left_at')
      .eq('team_id', membership.team_id).is('left_at', null).order('joined_at');
    // Load avatars from user_profiles
    const memberUserIds = (members || []).map(m => m.user_id).filter(Boolean);
    const { data: profiles } = memberUserIds.length
      ? await supabase.from('user_profiles').select('user_id, display_name, avatar_url').in('user_id', memberUserIds)
      : { data: [] };
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
    const membersWithProfiles = (members || []).map(m => ({
      ...m,
      display_name: profileMap[m.user_id]?.display_name || m.display_name || 'Joueur',
      avatar_url: profileMap[m.user_id]?.avatar_url || null
    }));
    return { ...team, myRole: membership.role, members: membersWithProfiles };
  }

  async function joinTeamByCode(code) {
    if (!state.currentUser?.id) throw new Error('Non connecté');
    // Passe par la fonction serveur sécurisée : un non-membre ne peut pas lire la
    // table teams (RLS), donc la résolution + l'inscription se font côté serveur.
    const { data, error } = await supabase.rpc('join_team_by_code', { p_code: String(code || '').trim().toUpperCase() });
    if (error) {
      const msg = String(error.message || '');
      if (msg.includes('INVALID_CODE')) throw new Error('Code d\'invitation invalide');
      if (msg.includes('ALREADY_MEMBER')) throw new Error('Tu es déjà membre de cette équipe');
      if (msg.includes('NOT_AUTHENTICATED')) throw new Error('Non connecté');
      throw new Error(msg || 'Erreur lors de la jonction.');
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { id: row?.team_id, name: row?.team_name || 'l\'équipe' };
  }

  async function peekTeamByCode(code) {
    const { data, error } = await supabase.rpc('peek_team_by_code', { p_code: String(code || '').trim().toUpperCase() });
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row?.team_id ? { id: row.team_id, name: row.team_name, memberCount: row.member_count } : null;
  }

  async function leaveTeam(teamId) {
    const userId = state.currentUser?.id;
    if (!userId) return;
    await supabase.from('team_members')
      .update({ left_at: new Date().toISOString() })
      .eq('team_id', teamId).eq('user_id', userId).is('left_at', null);
  }

  async function kickTeamMember(memberId) {
    await supabase.from('team_members')
      .update({ left_at: new Date().toISOString() })
      .eq('id', memberId);
  }

  async function refreshTeamInviteCode(teamId) {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data } = await supabase.from('teams')
      .update({ invite_code: newCode }).eq('id', teamId).select('invite_code').single();
    return data?.invite_code;
  }

  async function loadTeamMatches(teamMemberUserIds) {
    const { data } = await supabase.from('saved_matches')
      .select('id,user_id,played_at,created_at,result,wins,losses,score_label,matchup_label,mine_colors,opponent_colors,opponent_name,deck_name,deck_profile_id,format,went_first,source_type,duelink_match_id,series_match_id,duelink_source,duelink_queue,queue_id,my_decklist,api_metadata,data_quality,quality_issues,total_turns,avg_turns,final_mine_lore,final_opp_lore,team_visible')
      .in('user_id', teamMemberUserIds)
      .order('played_at', { ascending: false })
      .limit(5000);
    return data || [];
  }

  async function loadTeamDeckProfiles(teamMemberUserIds) {
    const { data } = await supabase.from('deck_profiles')
      .select('*').in('user_id', teamMemberUserIds);
    return data || [];
  }

  // ============================================================
  // TEAM — context activation helpers
  // ============================================================

  async function activateTeamMode() {
    if (!state.team) return;
    const activeMembers = state.team.members.filter(m => !m.left_at && m.user_id);
    state.teamMemberIds = activeMembers.map(m => m.user_id);
    state.teamDisplayNames = {};
    activeMembers.forEach(m => { state.teamDisplayNames[m.user_id] = m.display_name; });
    const selfProfile = await getOrCreateUserProfile();
    if (selfProfile && state.currentUser?.id) {
      state.teamDisplayNames[state.currentUser.id] = selfProfile.display_name;
    }
    const [matches, profiles] = await Promise.all([
      loadTeamMatches(state.teamMemberIds),
      loadTeamDeckProfiles(state.teamMemberIds)
    ]);
    state.savedMatches = matches;
    state.deckProfiles = profiles;
    state.teamMode = true;
    deckArchetypeCache.clear();
    deckCardListCache.clear();
    renderPerformanceData();
  }

  async function deactivateTeamMode() {
    state.teamMode = false;
    state.teamMemberIds = [];
    state.teamDisplayNames = {};
    await refreshSavedMatches({ force: true });
    await refreshDeckProfiles({ force: true });
  }

  // ============================================================
  // TEAM — UI rendering
  // ============================================================

  function renderTeamSection() {
    if (!els.teamSection) return;
    if (!state.currentUser) { els.teamSection.innerHTML = ''; return; }

    if (!state.team) {
      // On NE consomme PAS pendingCode ici : c'est showJoinInviteConfirm qui le
      // gère (affiche un récap + bouton « Rejoindre »), et qui le nettoie après.
      const pendingCode = sessionStorage.getItem('inksight:pendingJoinCode') || '';
      els.teamSection.innerHTML = `
        <div class="team-section">
          <div class="team-head">
            <p class="kicker">Équipe</p>
            <h2>Rejoindre une équipe</h2>
            <p>Utilise un lien ou code d'invitation pour rejoindre une équipe et partager vos statistiques.</p>
          </div>
          <div id="teamJoinConfirm"></div>
          <div class="team-field">
            <label class="team-field-label" for="teamCodeInput">Code d'invitation</label>
            <input type="text" id="teamCodeInput" placeholder="Ex: HELVETNK" maxlength="16" autocomplete="off" value="${esc(pendingCode)}">
          </div>
          <button type="button" id="teamJoinBtn" class="ghost-button">Rejoindre</button>
          <p id="teamActionStatus" class="team-status"></p>
        </div>`;
      bindTeamFormEvents();
      if (pendingCode) showJoinInviteConfirm(pendingCode);
      return;
    }

    // In a team — show compact widget + link to team page
    const team = state.team;
    const memberCount = (team.members || []).filter(m => !m.left_at).length;
    els.teamSection.innerHTML = `
      <div class="team-section">
        <div class="team-head">
          <p class="kicker">Équipe</p>
          <h2>${esc(team.name)}</h2>
          <p>${memberCount} membre${memberCount > 1 ? 's' : ''}</p>
        </div>
        <div class="team-widget-actions">
          <button type="button" id="teamViewPageBtn" class="ghost-button">Voir la page équipe</button>
          <button type="button" id="teamStatsBtn" class="ghost-button" ${state.team ? '' : 'disabled'}>Stats de l'équipe</button>
        </div>
        <p id="teamActionStatus" class="team-status"></p>
      </div>`;
    document.getElementById('teamViewPageBtn')?.addEventListener('click', renderTeamPage);
    document.getElementById('teamStatsBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('teamStatsBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'Chargement…'; }
      try { await activateTeamMode(); } finally { if (btn) { btn.disabled = false; btn.textContent = 'Stats de l\'équipe'; } }
      updateTeamContextBars();
      document.querySelector('.app-nav-button[data-app-view="performances"]')?.click();
    });
  }

  function renderTeamPage() {
    if (!els.teamSection || !state.team) return;
    const team = state.team;
    const isOwner = team.myRole === 'owner';
    const activeMembers = (team.members || []).filter(m => !m.left_at);

    const membersHtml = activeMembers.map(m => {
      const isSelf = m.user_id === state.currentUser?.id;
      const avatarHtml = m.avatar_url
        ? `<img src="${escAttr(m.avatar_url)}" alt="${escAttr(m.display_name)}" class="team-member-avatar" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const initials = (m.display_name || 'J').slice(0, 2).toUpperCase();
      const fallbackHtml = `<div class="team-member-avatar-fallback" ${m.avatar_url ? 'style="display:none"' : ''}>${esc(initials)}</div>`;
      const ownerIcon = m.role === 'owner' ? '<span class="team-member-crown" aria-label="Propriétaire">♛</span>' : '';
      const selfTag = isSelf ? '<span class="team-member-self-tag">Toi</span>' : '';
      return `<li class="team-member-card">
        <div class="team-member-avatar-wrap">${avatarHtml}${fallbackHtml}${ownerIcon}</div>
        <span class="team-member-card-name">${esc(m.display_name || 'Joueur')}${selfTag}</span>
      </li>`;
    }).join('');

    const inviteSection = isOwner ? `
      <div class="team-invite-block">
        <div class="team-invite-top">
          <span class="team-invite-label">Code d'invitation</span>
          <code class="team-invite-code">${esc(team.invite_code || '—')}</code>
        </div>
        <div class="team-invite-actions">
          <button type="button" id="teamCopyLinkBtn" class="ghost-button compact">Copier le lien d'invitation</button>
          <button type="button" id="teamRotateCodeBtn" class="ghost-button compact">Nouveau code</button>
        </div>
      </div>` : `
      <div class="team-invite-block">
        <p style="font-size:.85rem;color:var(--muted);margin:0">Demande le lien d'invitation au propriétaire de l'équipe pour inviter de nouveaux membres.</p>
      </div>`;

    // Description: split on newlines, render as paragraphs
    const descHtml = (team.description || '').split('\n').filter(Boolean).map(line => {
      // Detect URLs
      const urlified = line.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="team-link">$1</a>');
      return `<p class="team-desc-para">${urlified}</p>`;
    }).join('');

    els.teamSection.innerHTML = `
      <div class="team-section">
        <div class="team-page-nav">
          <button type="button" id="teamBackBtn" class="ghost-button compact">← Retour</button>
        </div>
        <div class="team-head">
          <p class="kicker">Équipe</p>
          <h2>${esc(team.name)}</h2>
        </div>
        ${descHtml ? `<div class="team-description">${descHtml}</div>` : ''}
        ${inviteSection}
        <div>
          <p class="kicker" style="margin-bottom:.75rem">Membres · ${activeMembers.length}</p>
          <ul class="team-members-grid">${membersHtml}</ul>
        </div>
        <div class="team-danger-row">
          <button type="button" id="teamLeaveBtn" class="ghost-button danger compact">Quitter l'équipe</button>
        </div>
        <p id="teamActionStatus" class="team-status"></p>
      </div>`;

    document.getElementById('teamBackBtn')?.addEventListener('click', () => renderTeamSection());
    document.getElementById('teamCopyLinkBtn')?.addEventListener('click', () => {
      const code = state.team?.invite_code || '';
      const url = `${window.location.origin}${window.location.pathname}?join=${code}`;
      navigator.clipboard?.writeText(url).then(() => setTeamActionStatus('Lien copié !')).catch(() => setTeamActionStatus(url));
    });
    document.getElementById('teamRotateCodeBtn')?.addEventListener('click', async () => {
      if (!state.team?.id) return;
      try {
        const newCode = await refreshTeamInviteCode(state.team.id);
        state.team = await loadMyTeam();
        renderTeamPage();
        setTeamActionStatus(`Nouveau code : ${newCode}`);
      } catch (err) { setTeamActionStatus(err.message || 'Erreur.', true); }
    });
    document.getElementById('teamLeaveBtn')?.addEventListener('click', async () => {
      if (!state.team?.id) return;
      if (!confirm('Quitter l\'équipe ?')) return;
      try {
        await leaveTeam(state.team.id);
        if (state.teamMode) await deactivateTeamMode();
        state.team = null;
        renderTeamSection();
        updateTeamContextBars();
      } catch (err) { setTeamActionStatus(err.message || 'Erreur.', true); }
    });
  }

  function updateTeamContextBars() {
    const hasTeam = !!state.team;
    const teamName = state.team?.name || 'Équipe';
    [els.teamContextBarStats, els.teamContextBarHistory].forEach(bar => {
      if (!bar) return;
      bar.hidden = !hasTeam;
      // Update the team button label with current team name
      const teamBtn = bar.querySelector('[data-team-ctx="team"]');
      if (teamBtn) teamBtn.textContent = `Équipe · ${teamName}`;
      // Sync active state
      const isSolo = !state.teamMode;
      bar.querySelectorAll('.team-ctx-btn').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.teamCtx === 'solo') === isSolo);
      });
    });
  }

  function setTeamActionStatus(msg, isError = false) {
    const el = document.getElementById('teamActionStatus');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('team-status-error', isError);
    el.classList.toggle('team-status-ok', !isError && !!msg);
  }

  async function joinTeamFlow(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) { setTeamActionStatus('Entre le code d\'invitation.', true); return; }
    try {
      setTeamActionStatus('Rejoindre l\'équipe…');
      const team = await joinTeamByCode(clean);
      sessionStorage.removeItem('inksight:pendingJoinCode');
      state.team = await loadMyTeam();
      renderTeamSection();
      updateTeamContextBars();
      setTeamActionStatus(`Tu as rejoint "${team.name}" !`);
    } catch (err) { setTeamActionStatus(err.message || 'Erreur lors de la jonction.', true); }
  }

  function bindTeamFormEvents() {
    document.getElementById('teamJoinBtn')?.addEventListener('click', () => {
      joinTeamFlow(document.getElementById('teamCodeInput')?.value);
    });
  }

  // Lien d'invitation (?join=CODE) : on résout l'équipe via la fonction sécurisée
  // et on affiche un récap + bouton « Rejoindre » (au lieu d'un simple champ code).
  async function showJoinInviteConfirm(code) {
    const host = document.getElementById('teamJoinConfirm');
    if (!host) return;
    host.innerHTML = `<div class="team-join-confirm is-loading">Vérification de l'invitation…</div>`;
    const team = await peekTeamByCode(code);
    if (!team) {
      host.innerHTML = `<div class="team-join-confirm is-error"><strong>Invitation introuvable</strong><span>Le code « ${esc(code)} » ne correspond à aucune équipe. Vérifie le code ou demande un nouveau lien.</span></div>`;
      return;
    }
    host.innerHTML = `
      <div class="team-join-confirm">
        <strong>Rejoindre « ${esc(team.name)} » ?</strong>
        <span>${n(team.memberCount)} membre(s). En rejoignant, les matchs et decks que tu marques « visibles équipe » seront partagés avec l'équipe.</span>
        <div class="team-join-confirm-actions">
          <button type="button" class="primary-button compact" id="teamJoinAcceptBtn">Rejoindre ${esc(team.name)}</button>
          <button type="button" class="ghost-button compact" id="teamJoinDeclineBtn">Plus tard</button>
        </div>
      </div>`;
    document.getElementById('teamJoinAcceptBtn')?.addEventListener('click', () => joinTeamFlow(code));
    document.getElementById('teamJoinDeclineBtn')?.addEventListener('click', () => {
      sessionStorage.removeItem('inksight:pendingJoinCode');
      host.innerHTML = '';
    });
  }

  function bindTeamEvents() {
    // Context switcher buttons (delegated)
    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-team-ctx]');
      if (!btn) return;
      const ctx = btn.dataset.teamCtx;
      if (ctx === 'solo' && state.teamMode) {
        btn.disabled = true;
        try { await deactivateTeamMode(); } finally { btn.disabled = false; }
        updateTeamContextBars();
        renderPerformanceData();
      } else if (ctx === 'team' && !state.teamMode && state.team) {
        btn.disabled = true;
        btn.textContent = 'Chargement…';
        try { await activateTeamMode(); } finally { btn.disabled = false; }
        updateTeamContextBars();
      }
    });

    // Kick member buttons (delegated)
    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-kick]');
      if (!btn || !btn.closest('.team-section')) return;
      const memberId = btn.dataset.kick;
      if (!memberId) return;
      if (!confirm('Exclure ce membre de l\'équipe ?')) return;
      try {
        await kickTeamMember(memberId);
        state.team = await loadMyTeam();
        renderTeamSection();
      } catch (err) {
        setTeamActionStatus(err.message || 'Erreur lors de l\'exclusion.', true);
      }
    });
  }

  async function refreshDeckProfiles(options={}){
    if(!state.currentUser){
      state.deckProfiles = [];
      state.deckProfilesLoaded = false;
      renderDeckOptions();
      return [];
    }
    if(state.deckProfilesLoading) return state.deckProfiles;
    if(state.deckProfilesLoaded && !options.force){
      renderDeckOptions();
      return state.deckProfiles;
    }

    try{
      state.deckProfilesLoading = true;
      const rows = await listDeckProfiles();
      state.deckProfiles = Array.isArray(rows) ? rows : [];
      state.deckProfilesLoaded = true;
    }catch(err){
      console.error(err);
      state.deckProfiles = [];
      state.deckProfilesLoaded = false;
      if(els.saveDeckHint) els.saveDeckHint.textContent = `Deck profiles indisponibles : ${err.message}`;
    }finally{
      state.deckProfilesLoading = false;
      renderDeckOptions();
      renderAccountPage();
    }
    return state.deckProfiles;
  }


  function renderAccountPage(){
    if(state.currentUser && !state.duelinkConnectionLoaded) refreshDuelinkConnectionStatus({ silent:true });
    if(!state.currentUser){ state.duelinkConnection = null; state.duelinkConnectionLoaded = true; updateDuelinkStoredTokenUi(); }
    else updateDuelinkStoredTokenUi();
    renderDeckManager();
    renderDataQualityPanel();
    renderDuplicateAudit();
    renderTeamSection();
  }

  function deckProfileUsageCounts(){
    const counts = new Map();
    (state.savedMatches || []).forEach(row => {
      const id = row.deck_profile_id;
      if(!id) return;
      counts.set(id, n(counts.get(id)) + 1);
    });
    return counts;
  }

  function renderDeckManager(){
    if(!els.deckManagerList || !els.deckManagerStatus) return;
    if(!state.currentUser){
      els.deckManagerStatus.textContent = 'Connectez-vous pour créer et organiser vos versions de decks.';
      els.deckManagerList.innerHTML = '';
      return;
    }
    const profiles = namedDeckProfiles({ includeArchived:true });
    const activeProfiles = profiles.filter(profile => !isArchivedDeckProfile(profile));
    const archivedProfiles = profiles.filter(isArchivedDeckProfile);
    const counts = deckProfileUsageCounts();
    els.deckManagerStatus.textContent = `${activeProfiles.length} deck${activeProfiles.length > 1 ? 's' : ''} actif${activeProfiles.length > 1 ? 's' : ''}${archivedProfiles.length ? ` · ${archivedProfiles.length} archivé${archivedProfiles.length > 1 ? 's' : ''}` : ''}.`;
    if(!profiles.length){
      els.deckManagerList.innerHTML = '<div class="history-empty-state"><strong>Aucune version de deck.</strong><span>Sauvegardez une analyse avec un nom de deck pour commencer.</span></div>';
      return;
    }
    els.deckManagerList.innerHTML = profiles.map(profile => {
      const colors = profileColors(profile);
      const count = n(counts.get(profile.id));
      const mergeOptions = activeProfiles
        .filter(other => other.id !== profile.id && colorFilterKey(profileColors(other)) === colorFilterKey(colors))
        .map(other => `<option value="${escAttr(other.id)}">${esc(other.name)}</option>`)
        .join('');
      const archived = isArchivedDeckProfile(profile);
      return `<article class="deck-manager-card ${archived ? 'is-archived' : ''}" data-deck-manager-card="${escAttr(profile.id)}">
        <div class="deck-manager-main">
          <div class="deck-manager-title-row">
            <strong>${inkDotsHtml(colors)}<span>${esc(profile.name)}</span></strong>
            ${archived ? '<em>Archivé</em>' : ''}
          </div>
          <small>${colors.map(inkLabel).join(' / ') || 'Bicolorité non détectée'} · ${count} analyse${count > 1 ? 's' : ''} liée${count > 1 ? 's' : ''}</small>
        </div>
        <div class="deck-manager-actions">
          <label class="deck-manager-field"><span>Renommer</span><input type="text" value="${escAttr(profile.name)}" data-deck-rename-input="${escAttr(profile.id)}"></label>
          <button type="button" class="ghost-button compact" data-deck-rename="${escAttr(profile.id)}">Renommer</button>
          <label class="deck-manager-field"><span>Format</span><select data-deck-pool-select="${escAttr(profile.id)}"><option value="">—</option><option value="core" ${profile.format_pool==='core'?'selected':''}>Core</option><option value="infinity" ${profile.format_pool==='infinity'?'selected':''}>Infinity</option></select></label>
          <label class="deck-manager-field"><span>Set</span><select data-deck-set-select="${escAttr(profile.id)}"><option value="">—</option>${[['set_1','Set 1'],['set_2','Set 2'],['set_3','Set 3'],['set_4','Set 4'],['set_5','Set 5'],['set_6','Set 6'],['set_7','Set 7'],['set_8','Set 8'],['set_9','Set 9'],['set_10','Set 10'],['set_11','Set 11'],['set_12','Set 12']].map(([v,l])=>`<option value="${escAttr(v)}" ${profile.set_tag===v?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
          <button type="button" class="ghost-button compact" data-deck-pooltag="${escAttr(profile.id)}">Enregistrer</button>
          <label class="deck-manager-field deck-merge-field"><span>Fusionner vers</span><select data-deck-merge-select="${escAttr(profile.id)}"><option value="">Choisir une version compatible</option>${mergeOptions}</select></label>
          <button type="button" class="ghost-button compact" data-deck-merge="${escAttr(profile.id)}" ${mergeOptions ? '' : 'disabled'}>Fusionner</button>
          <button type="button" class="ghost-button compact danger" data-deck-archive="${escAttr(profile.id)}">${archived ? 'Désarchiver' : 'Archiver'}</button>
        </div>
      </article>`;
    }).join('');
  }


  function auditCurrentAnalysisQuality(m, details={}, deckProfile={}){
    const sessions = Array.isArray(m?.sessions) && m.sessions.length ? m.sessions : (m?.first ? [m.first] : []);
    const expectedGames = Math.max(1, sessions.length || (m?.isBO3 ? n(m?.wins) + n(m?.losses) : 1));
    const detailGames = Array.isArray(details.games) ? details.games.length : 0;
    const cardRows = Array.isArray(details.cardStats) ? details.cardStats.length : 0;
    const turnRows = Array.isArray(details.turnStats) ? details.turnStats.length : 0;
    const missingImages = countMissingCardImagesInMatch(m);
    const issues = {
      expected_games: expectedGames,
      saved_games: detailGames,
      card_rows: cardRows,
      turn_rows: turnRows,
      missing_images: missingImages.count,
      missing_image_cards: missingImages.names.slice(0, 24),
      played_at_missing: !detectPlayedAt(m),
      deck_missing: !deckProfile?.id && !deckProfile?.name,
      bo3_game_mismatch: !!m?.isBO3 && detailGames !== expectedGames,
      detailed_rows_missing: detailGames < expectedGames || cardRows === 0 || turnRows === 0
    };
    let status = 'complete';
    if(issues.detailed_rows_missing || issues.bo3_game_mismatch) status = 'partial';
    else if(issues.missing_images || issues.played_at_missing || issues.deck_missing) status = 'warning';
    return { status, issues };
  }

  function countMissingCardImagesInMatch(m){
    const names = new Set();
    const cards = [
      ...(m ? cardsForScope(m, 'mine') : []),
      ...(m ? cardsForScope(m, 'opponent') : []),
      ...arrayify(m?.mulligan?.initial),
      ...arrayify(m?.mulligan?.resolved),
      ...arrayify(m?.mulligan?.replaced),
      ...arrayify(m?.first?.mulligan?.initial),
      ...arrayify(m?.first?.mulligan?.resolved),
      ...arrayify(m?.first?.mulligan?.replaced)
    ];
    cards.forEach(card => {
      const hydrated = hydrateCard(card);
      const name = fullName(hydrated) || card?.name || card?.fullName || '';
      const image = hydrated.imageSmall || hydrated.image || getCardImage(hydrated);
      if(name && !image) names.add(name);
    });
    return { count:names.size, names:[...names].sort((a,b)=>a.localeCompare(b)) };
  }

  function rowQualityInfo(row, detailedIds=null){
    const issues = row?.quality_issues || row?.analysis_json?.data_quality?.issues || {};
    const hasDetail = detailedIds ? detailedIds.has(row.id) : hasDetailedAnalyticsForRow(row);
    const missingImages = n(issues.missing_images) || countMissingCardImages([row]);
    const deckMissing = !isNamedDeckName(row?.deck_name || row?.analysis_json?.deck?.name || '');
    const duplicate = duplicateGroups(state.savedMatches || []).some(group => group.some(item => item.id === row.id));
    let status = row?.data_quality || row?.analysis_json?.data_quality?.status || '';
    if(!status || status === 'unknown') status = hasDetail ? 'complete' : 'partial';
    if(status === 'complete' && (missingImages || deckMissing || duplicate)) status = 'warning';
    const labels = [];
    if(status === 'complete') labels.push({ type:'complete', label:'Complète' });
    if(status === 'partial') labels.push({ type:'partial', label:'Partielle' });
    if(status === 'warning') labels.push({ type:'warning', label:'À vérifier' });
    if(missingImages) labels.push({ type:'warning', label:`${missingImages} image${missingImages>1?'s':''}` });
    if(duplicate) labels.push({ type:'danger', label:'Doublon possible' });
    return { status, labels, issues:{...issues, missing_images:missingImages, deck_missing:deckMissing, duplicate} };
  }

  function hasDetailedAnalyticsForRow(row){
    const id = row?.id;
    if(!id) return false;
    return (state.savedAnalytics?.games || []).some(item => item.match_id === id)
      && (state.savedAnalytics?.cardStats || []).some(item => item.match_id === id)
      && (state.savedAnalytics?.turnStats || []).some(item => item.match_id === id);
  }

  function qualityBadgesHtml(row){
    const info = rowQualityInfo(row);
    return `<span class="history-quality-badges">${info.labels.slice(0,3).map(item => `<em class="quality-badge ${escAttr(item.type)}">${esc(item.label)}</em>`).join('')}</span>`;
  }

  function isNamedDeckName(name){
    return !!String(name || '').trim() && !/^deck\s+(non\s+)?(nomm[ée]|renseign[ée]|à\s+nommer)/i.test(String(name || '').trim());
  }

  function renderDataQualityPanel(){
    // V136.0B: le diagnostic qualité reste disponible dans les données,
    // mais il est masqué de la page Compte pour ne pas noyer les joueurs.
    if(els.dataQualityTitle) els.dataQualityTitle.textContent = '';
    if(els.dataQualityText) els.dataQualityText.textContent = '';
    if(els.dataQualitySummary) els.dataQualitySummary.innerHTML = '';
  }

  function qualityBadge(label, value, help){
    return `<div class="data-quality-item"><strong>${esc(value)}</strong><span>${esc(label)}</span><small>${esc(help)}</small></div>`;
  }

  function countMissingCardImages(rows){
    const names = new Set();
    (rows || []).forEach(row => {
      const buckets = [row.analysis_json?.cards?.mine, row.analysis_json?.cards?.opponent, row.analysis_json?.cardStats, row.analysis_json?.mulligan?.initial, row.analysis_json?.mulligan?.kept, row.analysis_json?.mulligan?.replaced];
      buckets.flat().filter(Boolean).forEach(card => {
        const name = card.name || card.card_name || card.fullName || '';
        const image = card.image || card.imageUrl || card.image_url || card.card?.image || '';
        if(name && !image && !getCardImage(card)) names.add(name);
      });
    });
    return names.size;
  }

  function duplicateGroups(rows){
    const map = new Map();
    (rows || []).forEach(row => {
      const sig = savedMatchSignatureFromRow(row);
      if(!sig) return;
      const list = map.get(sig) || [];
      list.push(row);
      map.set(sig, list);
    });
    return [...map.values()].filter(group => group.length > 1);
  }

  function renderDuplicateAudit(){
    // V136.0B: les cartes de maintenance (decks à nommer, images manquantes, analyses partielles)
    // ne sont plus affichées dans l’interface principale.
    if(els.duplicateAuditList) els.duplicateAuditList.innerHTML = '';
  }

  function maintenanceCardHtml(title, intro, rows=[], note=''){
    return `<article class="maintenance-card"><div><strong>${esc(title)}</strong><span>${esc(intro)}</span>${note ? `<small>${esc(note)}</small>` : ''}</div><div class="maintenance-mini-list">${rows.map(row => `<button type="button" data-maintenance-select="${escAttr(row.id)}"><b>${esc(row.format || 'BO1')} · ${esc(row.score_label || '')}</b><span>${esc(row.deck_name || row.matchup_label || 'Analyse sauvegardée')}</span></button>`).join('')}</div></article>`;
  }

  function duplicateGroupHtml(group=[]){
    const sorted = [...group].sort((a,b) => {
      const apiDelta = (b.source_type === 'duelink_api' ? 1 : 0) - (a.source_type === 'duelink_api' ? 1 : 0);
      if(apiDelta) return apiDelta;
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });
    const first = sorted[0] || {};
    const rows = sorted.map((row, index) => {
      const keep = index === 0;
      return `<div class="maintenance-duplicate-row ${keep ? 'keep' : 'duplicate'}">
        <button type="button" class="maintenance-duplicate-main" data-maintenance-select="${escAttr(row.id)}">
          <b>${esc(formatSavedDate(getSavedMatchPlayedAt(row)))}</b>
          <span>${keep ? 'À garder en priorité' : 'Doublon probable'}</span>
        </button>
        ${keep ? '<em>Conserver</em>' : `<button type="button" class="danger-button compact" data-maintenance-delete="${escAttr(row.id)}">Supprimer</button>`}
      </div>`;
    }).join('');
    return `<article class="maintenance-card duplicate-group"><div><strong>Doublon potentiel</strong><span>${esc(first.format || 'BO1')} · ${esc(first.score_label || '')} · ${esc(first.matchup_label || 'Matchup inconnu')}</span><small>${sorted.length} sauvegardes très similaires détectées. Supprimez uniquement les copies en trop.</small></div><div class="maintenance-mini-list duplicate-manager">${rows}</div></article>`;
  }

  async function deleteMaintenanceSavedMatch(id, button){
    const row = state.savedMatches.find(item => item.id === id);
    if(!row) return;
    const label = `${row.format || 'BO1'} · ${row.score_label || ''} · ${row.matchup_label || row.opponent_name || 'analyse'}`.trim();
    if(!confirm(`Supprimer ce doublon ?\n${label}`)) return;
    try{
      if(button) button.disabled = true;
      await deleteSavedMatch(id);
      state.savedMatches = state.savedMatches.filter(item => item.id !== id);
      if(state.selectedSavedMatchId === id) state.selectedSavedMatchId = state.savedMatches[0]?.id || null;
      await refreshSavedMatches({ force:true, silent:true });
      renderAccountPage();
      renderPerformanceData();
    }catch(err){
      console.error(err);
      if(els.duplicateAuditList) els.duplicateAuditList.insertAdjacentHTML('afterbegin', `<div class="cleanup-error">Erreur suppression : ${esc(err.message || err)}</div>`);
    }
  }

  function handleDataMaintenanceClick(event){
    const del = event.target.closest('[data-maintenance-delete]');
    if(del){
      event.preventDefault();
      deleteMaintenanceSavedMatch(del.dataset.maintenanceDelete, del);
      return;
    }
    const select = event.target.closest('[data-maintenance-select]');
    if(!select) return;
    event.preventDefault();
    const id = select.dataset.maintenanceSelect;
    const row = state.savedMatches.find(item => item.id === id);
    if(!row) return;
    state.selectedSavedMatchId = id;
    document.querySelector('.app-nav-button[data-app-view="performances"]')?.click();
    if(els.historyDetail) renderSavedMatchDetail(row);
    setTimeout(() => document.getElementById('historyList')?.scrollIntoView({ behavior:'smooth', block:'start' }), 0);
  }

  async function handleAccountDeckManagerClick(event){
    const renameBtn = event.target.closest('[data-deck-rename]');
    const mergeBtn = event.target.closest('[data-deck-merge]');
    const archiveBtn = event.target.closest('[data-deck-archive]');
    const poolTagBtn = event.target.closest('[data-deck-pooltag]');
    if(!renameBtn && !mergeBtn && !archiveBtn && !poolTagBtn) return;
    event.preventDefault();
    if(!state.currentUser) return;
    try{
      if(renameBtn){
        const id = renameBtn.dataset.deckRename;
        const input = document.querySelector(`[data-deck-rename-input="${CSS.escape(id)}"]`);
        const name = String(input?.value || '').trim();
        if(!name) throw new Error('Nom de deck manquant.');
        await renameDeckProfile(id, name);
      }
      if(mergeBtn){
        const id = mergeBtn.dataset.deckMerge;
        const select = document.querySelector(`[data-deck-merge-select="${CSS.escape(id)}"]`);
        const targetId = String(select?.value || '').trim();
        if(!targetId) throw new Error('Choisissez une version cible.');
        await mergeDeckProfiles(id, targetId);
      }
      if(archiveBtn){
        const id = archiveBtn.dataset.deckArchive;
        const profile = state.deckProfiles.find(item => item.id === id);
        await archiveDeckProfile(id, !isArchivedDeckProfile(profile));
      }
      if(poolTagBtn){
        const id = poolTagBtn.dataset.deckPooltag;
        const poolSelect = document.querySelector(`[data-deck-pool-select="${CSS.escape(id)}"]`);
        const setSelect = document.querySelector(`[data-deck-set-select="${CSS.escape(id)}"]`);
        await updateDeckProfilePoolTag(id, {
          format_pool: poolSelect?.value || null,
          set_tag: setSelect?.value || null,
        });
      }
      await refreshDeckProfiles({ force:true, silent:true });
      await refreshSavedMatches({ force:true, silent:true });
      renderAccountPage();
      renderDeckOptions();
      renderPerformanceData();
    }catch(err){
      console.error(err);
      if(els.deckManagerStatus) els.deckManagerStatus.textContent = `Erreur : ${err.message}`;
    }
  }


  function handleInfoDotClick(event){
    const button = event.target.closest('.info-dot[data-info]');
    const existing = document.querySelector('.info-popover-backdrop');
    if(existing) existing.remove();
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    const pop = document.createElement('div');
    pop.className = 'info-popover-backdrop';
    const title = button.dataset.infoTitle || button.closest('h1,h2,h3,.section-head,.performance-trend-card')?.querySelector('h1,h2,h3,span')?.textContent?.replace(/[?i]\s*$/,'').trim() || 'Information';
    pop.innerHTML = `<div class="info-popover-modal" role="dialog" aria-modal="true" aria-label="Information"><button type="button" class="info-popover-close" aria-label="Fermer">×</button><h3>${esc(title)}</h3><p>${esc(button.dataset.info || '')}</p></div>`;
    document.body.appendChild(pop);
    pop.querySelector('.info-popover-close')?.focus();
    pop.addEventListener('click', e => {
      if(e.target === pop || e.target.closest('.info-popover-close')) pop.remove();
    });
  }

  function renderDeckOptions(){
    const profiles = namedDeckProfiles();
    const saveOptions = saveDeckOptionsForCurrentMatch(profiles);
    const fallbackSave = '';
    if(els.saveDeckSelect){
      syncSelectOptions(els.saveDeckSelect, saveOptions, fallbackSave);
    }
    if(els.saveDeckPills){
      renderPillGroup(els.saveDeckPills, 'saveDeckSelect', saveOptions, els.saveDeckSelect?.value || fallbackSave);
      els.saveDeckPills.hidden = saveOptions.length <= 1;
    }
    renderPerformanceFilterPills();
  }

  function saveDeckOptionsForCurrentMatch(profiles=namedDeckProfiles()){
    const m = state.merged || getWorkingData?.();
    const colors = detectedMineColorsFromMatch(m);
    const wantedKey = colorFilterKey(colors);
    const candidates = wantedKey
      ? profiles.filter(profile => profileMatchesColorKey(profile, wantedKey))
      : [];
    const sorted = candidates.sort((a,b)=>String(a.name || '').localeCompare(String(b.name || '')));
    return [
      { value:'', label:sorted.length ? 'Aucune version choisie' : 'Créer une nouvelle version', colors },
      ...sorted.map(profile => ({ value:profile.id, label:profile.name, colors:profileColors(profile) }))
    ];
  }

  function detectedMineColorsFromMatch(m){
    const direct = arrayify(m?.inkProfiles?.mine?.inks || m?.profiles?.mine?.inks).map(inkKey).filter(color => color && color !== 'inkless').slice(0,2);
    if(direct.length) return direct;
    const cards = typeof cardsForScope === 'function' && m ? cardsForScope(m, 'mine') : [];
    const counts = new Map();
    (cards || []).forEach(card => {
      arrayify(card?.colors).map(inkKey).filter(Boolean).forEach(color => {
        if(color && color !== 'inkless') counts.set(color, n(counts.get(color)) + Math.max(1, n(card.seen) + n(card.played) + n(card.inked)));
      });
    });
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([color])=>color).slice(0,2);
  }

  function profileMatchesColorKey(profile, key){
    if(!key) return false;
    return deckProfileColorKey(profile) === key;
  }

  function namedDeckProfiles(options={}){
    const includeArchived = !!options.includeArchived;
    return [...(state.deckProfiles || [])]
      .filter(profile => isNamedDeckProfile(profile) && (includeArchived || !isArchivedDeckProfile(profile)))
      .sort((a,b)=>String(a.name || '').localeCompare(String(b.name || '')));
  }

  function isArchivedDeckProfile(profile){
    return !!profile?.archived_at;
  }

  function isNamedDeckProfile(profile){
    const name = String(profile?.name || '').trim();
    return !!name && !/^deck\s+(non\s+)?(nomm[ée]|renseign[ée])/i.test(name);
  }


  function profileColors(profile){
    const fromName = extractInkKeys(profile?.name || '');
    if(fromName.length >= 2) return fromName.slice(0,2);
    const merged = [...fromName];
    const add = colors => arrayify(colors).forEach(value => extractInkKeys(value).forEach(color => {
      if(color && color !== 'inkless' && !merged.includes(color)) merged.push(color);
    }));
    add(profile?.colors);
    return merged.slice(0,2);
  }

  function extractInkKeys(value){
    const raw = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const out = [];
    const checks = [
      ['amber', ['ambre','amber']],
      ['amethyst', ['amethyste','amethyst','amet']],
      ['emerald', ['emeraude','emerald']],
      ['ruby', ['rubis','ruby']],
      ['sapphire', ['saphir','sapphire']],
      ['steel', ['acier','steel']]
    ];
    checks.forEach(([key, words]) => {
      if(words.some(word => raw.includes(word)) && !out.includes(key)) out.push(key);
    });
    const direct = inkKey(value);
    if(direct && direct !== 'inkless' && !out.includes(direct)) out.push(direct);
    return out;
  }

  function deckProfileColorKey(profile){
    return colorFilterKey(profileColors(profile));
  }

  function inferColorsFromDeckName(name){
    const found = [];
    const raw = String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const checks = [
      ['amber', ['ambre','amber']],
      ['amethyst', ['amethyste','amethyst','amet']],
      ['emerald', ['emeraude','emerald']],
      ['ruby', ['rubis','ruby']],
      ['sapphire', ['saphir','sapphire']],
      ['steel', ['acier','steel']]
    ];
    checks.forEach(([key, words]) => {
      if(words.some(word => raw.includes(word))) found.push(key);
    });
    return found.slice(0,2);
  }

  function handleResponsiveFilterToggle(event){
    const btn = event.target.closest('[data-filter-toggle]');
    if(!btn) return;
    const target = btn.dataset.filterToggle;
    const panel = target === 'history' ? btn.closest('.history-toolbar-viz') : btn.closest('.performance-filter-bar-viz');
    if(!panel) return;
    const open = !panel.classList.contains('filters-open');
    panel.classList.toggle('filters-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Masquer les filtres' : (target === 'history' ? 'Filtres avancés' : 'Filtrer');
  }

  function multiFilterIds(){
    return new Set([
      'performanceColorFilter','performanceOpponentColorFilter','performanceDeckFilter','performanceArchetypeFilter','performanceFormatFilter','performanceTempoFilter','performanceResultFilter','performancePoolFilter','performanceSetFilter',
      'historyColorFilter','historyOpponentColorFilter','historyDeckFilter','historyArchetypeFilter','historyFormatFilter','historyTempoFilter','historyResultFilter','historyPoolFilter','historySetFilter'
    ]);
  }

  function isMultiFilterId(id){
    return multiFilterIds().has(String(id || ''));
  }

  function selectedFilterValues(id){
    const values = state.filterSelections?.[id];
    return Array.isArray(values) ? values.map(String).filter(value => value && value !== 'all') : [];
  }

  function setSelectedFilterValues(id, values){
    if(!isMultiFilterId(id)) return;
    const clean = [...new Set(arrayify(values).map(value => String(value || '')).filter(value => value && value !== 'all'))];
    state.filterSelections = { ...(state.filterSelections || {}), [id]:clean };
    if(els[id]) els[id].value = 'all';
  }

  function clearSelectedFilterValues(id){
    if(!isMultiFilterId(id)) return;
    setSelectedFilterValues(id, []);
  }

  function optionValuesForFilter(id){
    return [...document.querySelectorAll('[data-perf-filter][data-value]')].filter(btn => btn.dataset.perfFilter === String(id))
      .map(btn => String(btn.dataset.value || ''))
      .filter(value => value && value !== 'all');
  }

  function toggleMultiFilterValue(id, value){
    const cleanValue = String(value || '');
    if(!cleanValue || cleanValue === 'all'){
      clearSelectedFilterValues(id);
      return;
    }
    const current = new Set(selectedFilterValues(id));
    if(current.has(cleanValue)) current.delete(cleanValue);
    else current.add(cleanValue);

    const available = optionValuesForFilter(id);
    const next = [...current].filter(value => !available.length || available.includes(value));
    if(available.length > 1 && next.length >= available.length){
      clearSelectedFilterValues(id);
    }else{
      setSelectedFilterValues(id, next);
    }
  }

  function handlePerformanceFilterClick(event){
    const deckInfoBtn = event.target.closest('[data-deck-info]');
    if(deckInfoBtn){ event.preventDefault(); openDecklistModal(deckInfoBtn.dataset.deckInfo); return; }
    const btn = event.target.closest('[data-perf-filter][data-value]');
    if(!btn) return;
    const targetId = btn.dataset.perfFilter;

    // Les filtres multi-valeurs (couleur, deck, archétype, pool, set…) stockent leur
    // état dans state.filterSelections, pas dans un <select>. Certains (pool, set)
    // n'ont d'ailleurs PAS d'élément <select> de support : on les traite donc AVANT
    // toute vérification d'élément, sinon le clic était ignoré.
    if(isMultiFilterId(targetId)){
      toggleMultiFilterValue(targetId, btn.dataset.value);
      if(targetId === 'performanceColorFilter'){ clearSelectedFilterValues('performanceDeckFilter'); clearSelectedFilterValues('performanceArchetypeFilter'); }
      if(targetId === 'historyColorFilter'){ clearSelectedFilterValues('historyDeckFilter'); clearSelectedFilterValues('historyArchetypeFilter'); }
      if(targetId === 'performanceArchetypeFilter') clearSelectedFilterValues('performanceDeckFilter');
      if(targetId === 'historyArchetypeFilter') clearSelectedFilterValues('historyDeckFilter');
      renderPerformanceData();
      return;
    }

    const target = els[targetId];
    if(!target) return;

    if(targetId === 'saveDeckSelect'){
      if(els.saveDeckSelect) els.saveDeckSelect.value = btn.dataset.value || '';
      renderPillGroup(els.saveDeckPills, 'saveDeckSelect', saveDeckOptionsForCurrentMatch(), els.saveDeckSelect?.value || '');
      syncSaveButton();
      target.dispatchEvent(new Event('input', { bubbles:true }));
      return;
    }

    target.value = btn.dataset.value ?? 'all';
    target.dispatchEvent(new Event('input', { bubbles:true }));
  }


  function handleDateFilterClick(e) {
    const btn = e.target.closest('[data-date-scope][data-date-preset]');
    if (!btn) return;
    const scope = btn.dataset.dateScope;
    const preset = btn.dataset.datePreset;
    state.dateFilter[scope].preset = preset;
    document.querySelectorAll(`[data-date-scope="${scope}"][data-date-preset]`).forEach(b => {
      b.classList.toggle('active', b.dataset.datePreset === preset);
    });
    const customEl = scope === 'stats' ? els.performanceDateCustom : els.historyDateCustom;
    if (customEl) customEl.hidden = preset !== 'custom';
    renderPerformanceData();
  }

  function resetDateFilter(scope) {
    state.dateFilter[scope] = { preset: 'all', from: null, to: null };
    document.querySelectorAll(`[data-date-scope="${scope}"][data-date-preset]`).forEach(b => {
      b.classList.toggle('active', b.dataset.datePreset === 'all');
    });
    const customEl = scope === 'stats' ? els.performanceDateCustom : els.historyDateCustom;
    const fromEl = scope === 'stats' ? els.performanceDateFrom : els.historyDateFrom;
    const toEl = scope === 'stats' ? els.performanceDateTo : els.historyDateTo;
    if (customEl) customEl.hidden = true;
    if (fromEl) fromEl.value = '';
    if (toEl) toEl.value = '';
  }

  function resetPerformanceFilters(){
    ['performanceColorFilter','performanceOpponentColorFilter','performanceDeckFilter','performanceArchetypeFilter','performanceFormatFilter','performanceTempoFilter','performanceResultFilter','performancePoolFilter','performanceSetFilter'].forEach(id => {
      if(els[id]) els[id].value = 'all';
      clearSelectedFilterValues(id);
    });
    state.performanceMulliganMatchupFilter = 'all';
    state.performanceMulliganPlayFilter = 'all';
    state.performanceMulliganRecommendationFilter = 'all';
    state.performanceExpandedLists = { cards:false, mulligan:false };
    resetDateFilter('stats');
    renderPerformanceData();
  }

  function resetHistoryFilters(){
    ['historyColorFilter','historyOpponentColorFilter','historyDeckFilter','historyArchetypeFilter','historyFormatFilter','historyTempoFilter','historyResultFilter','historyPoolFilter','historySetFilter'].forEach(id => {
      if(els[id]) els[id].value = 'all';
      clearSelectedFilterValues(id);
    });
    if(els.historySearchInput) els.historySearchInput.value = '';
    resetDateFilter('history');
    renderPerformanceData();
  }

  function handlePerformanceDetailClick(event){
    const btn = event.target.closest('[data-performance-detail]');
    if(!btn) return;
    event.preventDefault();
    const allowed = ['overview','cards','draw','mulligan','matchups','curves','data'];
    state.performanceDetailTab = allowed.includes(btn.dataset.performanceDetail) ? btn.dataset.performanceDetail : 'overview';
    renderPerformanceDetailPanels();
  }

  function renderPerformanceDetailPanels(){
    const activeTab = state.performanceDetailTab || 'overview';
    const deckScoped = isPerformanceDataScoped();
    document.querySelectorAll('.performance-detail-tab').forEach(button => {
      const active = button.dataset.performanceDetail === activeTab;
      const requiresDeck = ['cards','mulligan','matchups','curves'].includes(button.dataset.performanceDetail);
      button.classList.toggle('active', active);
      button.classList.toggle('requires-deck', requiresDeck && !deckScoped);
      button.title = requiresDeck && !deckScoped ? 'Sélectionnez une bicolorité pour lire cette section correctement.' : '';
      if(active) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-performance-detail-panel]').forEach(panel => {
      const active = panel.dataset.performanceDetailPanel === activeTab;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    if(activeTab === 'curves'){
      setTimeout(() => renderPerformanceCharts(state.lastPerformanceAnalytics || { turnCurve:[] }), 0);
    }
  }

  function handlePerformanceSortChange(event){
    const sel = event.target.closest('select[data-performance-sort-select]');
    if(!sel) return;
    const type = sel.dataset.performanceSortSelect;
    const value = sel.value;
    if(type === 'cards') state.performanceCardSort = value || 'lore';
    if(type === 'mulligan') state.performanceMulliganSort = value || 'smart';
    renderPerformanceData();
  }

  function handlePerformanceListModalClick(event){
    const btn = event.target.closest('button[data-performance-full-list]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const type = btn.dataset.performanceFullList;
    if(type === 'cards' || type === 'mulligan'){
      state.performanceExpandedLists = { ...(state.performanceExpandedLists || {}), [type]: !state.performanceExpandedLists?.[type] };
      renderPerformanceData();
    }
  }

  function bindPerformanceFullListButtons(){
    document.querySelectorAll('button[data-performance-full-list]').forEach(button => {
      button.onclick = event => handlePerformanceListModalClick(event);
    });
  }

  function openPerformanceListModal(title, html){
    if(!els.cardModal || !els.modalBody) return;
    state.lastFocused = document.activeElement;
    els.modalBody.innerHTML = `<div class="performance-list-modal"><div class="modal-section-title"><span>Statistiques deck</span><h2>${esc(title)}</h2></div>${html}</div>`;
    els.cardModal.classList.add('active');
    els.cardModal.setAttribute('aria-hidden','false');
    els.closeModal?.focus();
    bindPerformanceCardTiles();
  }

  function renderPerformanceFilterPills(){
    const colorOptions = performanceColorOptionsForPills();
    syncSelectOptions(els.performanceColorFilter, colorOptions, 'all');
    renderPillGroup(els.performanceColorPills, 'performanceColorFilter', colorOptions, els.performanceColorFilter?.value || 'all');

    const perfArchetypeOptions = archetypeFilterOptions('performance');
    const showPerfArchetype = shouldShowArchetypeFilter('performance');
    if(els.performanceArchetypeBlock) els.performanceArchetypeBlock.hidden = !showPerfArchetype;
    if(els.performanceArchetypeFilter) syncSelectOptions(els.performanceArchetypeFilter, [{value:'all',label:'Tous'},...perfArchetypeOptions], 'all');
    renderPillGroup(els.performanceArchetypePills, 'performanceArchetypeFilter', perfArchetypeOptions);

    const deckOptions = deckFilterOptionsForPills('performance');
    syncSelectOptions(els.performanceDeckFilter, deckOptions, 'all');
    const showDeckVersions = shouldShowDeckVersionFilter(deckOptions, null, 'performance');
    if(els.performanceVersionBlock) els.performanceVersionBlock.hidden = !showDeckVersions;
    renderDeckPillGroup(els.performanceDeckPills, 'performanceDeckFilter', deckOptions);
    // Auto-classification : pré-calcule en arrière-plan les archétypes des decks
    // affichés qui n'en ont pas encore (decks importés sans decklist en ligne légère).
    const visibleDeckIds = deckOptions.flatMap(option => String(option.value || '').split('|')).filter(id => id && id !== 'all');
    if(visibleDeckIds.length) precomputeArchetypesForProfiles(visibleDeckIds);

    const performanceOpponentOptions = opponentColorOptionsForPills('stats');
    syncSelectOptions(els.performanceOpponentColorFilter, performanceOpponentOptions, 'all');
    renderPillGroup(els.performanceOpponentColorPills, 'performanceOpponentColorFilter', performanceOpponentOptions, els.performanceOpponentColorFilter?.value || 'all');

    renderPillGroup(els.performanceFormatPills, 'performanceFormatFilter', [
      { value:'all', label:'Tous' }, { value:'BO1', label:'BO1' }, { value:'BO3', label:'BO3' }
    ], els.performanceFormatFilter?.value || 'all');
    renderPillGroup(els.performanceTempoPills, 'performanceTempoFilter', [
      { value:'all', label:'OTP + OTD' }, { value:'otp', label:'OTP' }, { value:'otd', label:'OTD' }
    ], els.performanceTempoFilter?.value || 'all');
    renderPillGroup(els.performanceResultPills, 'performanceResultFilter', [
      { value:'all', label:'Tous' }, { value:'win', label:'Victoires' }, { value:'loss', label:'Défaites' }
    ], els.performanceResultFilter?.value || 'all');

    const poolOptions = lorcanaPoolOptions();
    const setOptions = lorcanaSetOptions();
    const showPool = poolOptions.length > 1;
    const showSet = setOptions.length > 1;
    if(els.performancePoolBlock) els.performancePoolBlock.hidden = !showPool;
    if(els.performanceSetBlock) els.performanceSetBlock.hidden = !showSet;
    renderPillGroup(els.performancePoolPills, 'performancePoolFilter', poolOptions);
    renderPillGroup(els.performanceSetPills, 'performanceSetFilter', setOptions);

    syncSelectOptions(els.historyColorFilter, colorOptions, 'all');
    renderPillGroup(els.historyColorPills, 'historyColorFilter', colorOptions, els.historyColorFilter?.value || 'all');
    const opponentColorOptions = opponentColorOptionsForPills('history');
    syncSelectOptions(els.historyOpponentColorFilter, opponentColorOptions, 'all');
    renderPillGroup(els.historyOpponentColorPills, 'historyOpponentColorFilter', opponentColorOptions, els.historyOpponentColorFilter?.value || 'all');
    const histArchetypeOptions = archetypeFilterOptions('history');
    const showHistArchetype = shouldShowArchetypeFilter('history');
    if(els.historyArchetypeBlock) els.historyArchetypeBlock.hidden = !showHistArchetype;
    if(els.historyArchetypeFilter) syncSelectOptions(els.historyArchetypeFilter, [{value:'all',label:'Tous'},...histArchetypeOptions], 'all');
    renderPillGroup(els.historyArchetypePills, 'historyArchetypeFilter', histArchetypeOptions);

    const historyDeckOptions = deckFilterOptionsForPills('history');
    syncSelectOptions(els.historyDeckFilter, historyDeckOptions, 'all');
    const showHistoryVersions = shouldShowDeckVersionFilter(historyDeckOptions, null, 'history');
    if(els.historyVersionBlock) els.historyVersionBlock.hidden = !showHistoryVersions;
    renderDeckPillGroup(els.historyDeckPills, 'historyDeckFilter', historyDeckOptions);
    renderPillGroup(els.historyFormatPills, 'historyFormatFilter', [
      { value:'all', label:'Tous' }, { value:'BO1', label:'BO1' }, { value:'BO3', label:'BO3' }
    ], els.historyFormatFilter?.value || 'all');
    renderPillGroup(els.historyResultPills, 'historyResultFilter', [
      { value:'all', label:'Tous' }, { value:'win', label:'Victoires' }, { value:'loss', label:'Défaites' }
    ], els.historyResultFilter?.value || 'all');
    renderPillGroup(els.historyTempoPills, 'historyTempoFilter', [
      { value:'all', label:'OTP + OTD' }, { value:'otp', label:'OTP' }, { value:'otd', label:'OTD' }
    ], els.historyTempoFilter?.value || 'all');

    if(els.historyPoolBlock) els.historyPoolBlock.hidden = !showPool;
    if(els.historySetBlock) els.historySetBlock.hidden = !showSet;
    renderPillGroup(els.historyPoolPills, 'historyPoolFilter', poolOptions);
    renderPillGroup(els.historySetPills, 'historySetFilter', setOptions);
  }

  function syncSelectOptions(select, options, fallback='all'){
    if(!select) return;
    const previous = select.value || fallback;
    select.innerHTML = options.map(option => `<option value="${escAttr(option.value)}">${esc(option.label)}</option>`).join('');
    if(isMultiFilterId(select.id)){
      const valid = new Set((options || []).map(option => String(option.value)));
      setSelectedFilterValues(select.id, selectedFilterValues(select.id).filter(value => valid.has(value)));
      select.value = fallback;
    }else{
      select.value = options.some(option => String(option.value) === String(previous)) ? previous : fallback;
    }
  }

  function performanceColorOptionsForPills(){
    // Cross-filtre comme les pills adverses : les comptes par bicolorité
    // reflètent les autres filtres sélectionnés (BO1/BO3, OTP/OTD, etc.).
    const sourceRows = filteredSavedMatchesWithout(['performanceColorFilter','performanceDeckFilter','performanceArchetypeFilter']);
    const map = new Map();
    (sourceRows || []).forEach(row => {
      const colors = rowMineColors(row);
      const key = colorFilterKey(colors);
      if(!key) return;
      const item = map.get(key) || { value:key, label:colors.map(inkLabel).filter(Boolean).join(' / '), colors, count:0 };
      item.count += 1;
      map.set(key, item);
    });
    return [
      { value:'all', label:'Toutes les bicolorités' },
      ...[...map.values()].sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label)).map(item => ({
        ...item,
        label:`${item.count}`,
        shortLabel:`${item.count}`,
        ariaLabel:`${item.label} · ${item.count} match${item.count > 1 ? 's' : ''}`,
        compact:true
      }))
    ];
  }

  function opponentColorOptionsForPills(mode='history'){
    const sourceRows = mode === 'stats' ? filteredSavedMatchesWithout(['performanceOpponentColorFilter']) : state.savedMatches || [];
    const map = new Map();
    (sourceRows || []).forEach(row => {
      const colors = rowOpponentColors(row);
      const key = colorFilterKey(colors);
      if(!key) return;
      const item = map.get(key) || { value:key, label:colors.map(inkLabel).filter(Boolean).join(' / '), colors, count:0 };
      item.count += 1;
      map.set(key, item);
    });
    return [
      { value:'all', label: mode === 'stats' ? 'Tous matchups' : 'Tous les adversaires' },
      ...[...map.values()].sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label)).map(item => ({
        ...item,
        label:`${item.count}`,
        shortLabel:`${item.count}`,
        ariaLabel:`vs ${item.label} · ${item.count} match${item.count > 1 ? 's' : ''}`,
        compact:true
      }))
    ];
  }

  function getDeckCardList(profileId){
    const key = String(profileId);
    if(deckCardListCache.has(key)) return deckCardListCache.get(key);
    const match = (state.savedMatches || []).find(r =>
      String(r.deck_profile_id) === key && apiDecklistStatus(r, 'mine').cards.length >= 5
    );
    if(!match) return null;
    const cards = apiDecklistStatus(match, 'mine').cards;
    const map = new Map(cards.map(c => [String(c.id || c.cardId || ''), Number(c.count) || 1]).filter(([id]) => id));
    if(map.size >= 5){ deckCardListCache.set(key, map); return map; }
    return null;
  }

  function deckListsIdentical(mapA, mapB){
    if(!mapA || !mapB || mapA.size !== mapB.size) return false;
    for(const [id, count] of mapA){ if(mapB.get(id) !== count) return false; }
    return true;
  }

  function groupIdenticalProfiles(profileIds){
    const cardLists = new Map();
    profileIds.forEach(id => { const m = getDeckCardList(id); if(m) cardLists.set(id, m); });
    const groups = [];
    const assigned = new Set();
    for(const id of profileIds){
      if(assigned.has(id)) continue;
      const group = [id];
      assigned.add(id);
      const listA = cardLists.get(id);
      if(listA){
        for(const other of profileIds){
          if(assigned.has(other)) continue;
          const listB = cardLists.get(other);
          if(listB && deckListsIdentical(listA, listB)){
            group.push(other);
            assigned.add(other);
          }
        }
      }
      groups.push(group);
    }
    return groups;
  }

  function deckFilterOptionsForPills(mode='performance'){
    const prefix = mode === 'history' ? 'history' : 'performance';
    const colorFilterId = `${prefix}ColorFilter`;
    const archetypeFilterId = `${prefix}ArchetypeFilter`;
    const selectedColors = selectedFilterValues(colorFilterId);
    const selectedArchetypes = selectedFilterValues(archetypeFilterId);
    // La liste des versions doit suivre les AUTRES filtres actifs (pool, set, format)
    // pour que « Infinity » ne laisse que les decks Infinity, etc.
    const selectedPools = selectedFilterValues(`${prefix}PoolFilter`);
    const selectedSets = selectedFilterValues(`${prefix}SetFilter`);
    const selectedFormats = selectedFilterValues(`${prefix}FormatFilter`);
    const rows = (state.savedMatches || []).filter(row => {
      if(selectedColors.length && !selectedColors.includes(colorFilterKey(rowMineColors(row)))) return false;
      if(selectedArchetypes.length && row.deck_profile_id){
        const a = getProfileArchetype(row.deck_profile_id);
        if(!a || !selectedArchetypes.includes(a.speed)) return false;
      }
      if(selectedPools.length && !selectedPools.includes(rowFormatPool(row))) return false;
      if(selectedSets.length && !selectedSets.includes(rowSetNum(row))) return false;
      if(selectedFormats.length && !selectedFormats.includes(String(row.format || '').toUpperCase())) return false;
      return true;
    });
    const stats = new Map(); // String(id) -> { games, wins, lastPlayedAt }
    rows.forEach(row => {
      const id = row.deck_profile_id;
      if(!id) return;
      const key = String(id);
      const profile = state.deckProfiles.find(item => String(item.id) === key);
      // On n'exige plus que le deck soit « nommé » : un deck à version unique (ou
      // pas encore renommé) doit rester visible et cliquable (pour voir sa decklist
      // et le renommer). Le pill affiche le nom du profil (renommable).
      if(!profile) return;
      // Plus de re-vérification de couleur sur le PROFIL : les lignes sont déjà
      // filtrées par la couleur du MATCH ci-dessus. L'ancien test excluait à tort les
      // decks dont le profil manquait de métadonnées de couleur (ex. version unique
      // steel/sapphire jamais renommée).
      const entry = stats.get(key) || { games:0, wins:0, lastPlayedAt:null };
      entry.games += 1;
      if(row.result === 'win') entry.wins += 1;
      const played = row.played_at || row.created_at || null;
      if(played && (!entry.lastPlayedAt || played > entry.lastPlayedAt)) entry.lastPlayedAt = played;
      stats.set(key, entry);
    });
    // Tri par activité récente (decks vieux en bas) puis games décroissant.
    const profiles = [...stats.keys()]
      .map(key => state.deckProfiles.find(profile => String(profile.id) === key))
      .filter(Boolean)
      .sort((a,b)=>{
        const sa = stats.get(String(a.id)), sb = stats.get(String(b.id));
        const da = sa?.lastPlayedAt || '', db = sb?.lastPlayedAt || '';
        if(da !== db) return da < db ? 1 : -1;
        return (sb?.games || 0) - (sa?.games || 0);
      });
    // Regrouper les versions similaires (Jaccard ≥ 75% sur les IDs de cartes)
    const groups = groupIdenticalProfiles(profiles.map(p => String(p.id)));
    const pills = groups.map(group => {
      const primaryProfile = state.deckProfiles.find(p => String(p.id) === group[0]);
      if(!primaryProfile) return null;
      let totalGames = 0, totalWins = 0, latestDate = null;
      group.forEach(id => {
        const s = stats.get(id) || { games:0, wins:0, lastPlayedAt:null };
        totalGames += s.games || 0;
        totalWins += s.wins || 0;
        if(s.lastPlayedAt && (!latestDate || s.lastPlayedAt > latestDate)) latestDate = s.lastPlayedAt;
      });
      const wr = totalGames ? Math.round(100 * totalWins / totalGames) : 0;
      const versionMatch = String(primaryProfile.name || '').match(/(\d+)\s*$/);
      const shortName = versionMatch ? `V${versionMatch[1]}` : (primaryProfile.name || '?');
      const mergedSuffix = group.length > 1 ? ` +${group.length - 1}` : '';
      const value = group.join('|');
      return { value, label:`${shortName}${mergedSuffix} · ${totalGames}g · ${wr}%`, ariaLabel:`${primaryProfile.name}${group.length > 1 ? ` (${group.length} versions fusionnées)` : ''} · ${totalGames} games · ${wr}% winrate`, colors:profileColors(primaryProfile) };
    }).filter(Boolean);
    // Fourre-tout : matchs sans profil de deck (decklist absente à l'import),
    // regroupés par bicolorité, pour qu'aucune couleur ne soit absente de la liste.
    // Ces entrées servent à filtrer ; pas de decklist à ouvrir ni à renommer.
    const noProfileByColor = new Map();
    rows.forEach(row => {
      const id = row.deck_profile_id;
      const profile = id ? state.deckProfiles.find(p => String(p.id) === String(id)) : null;
      if(id && profile) return; // déjà couvert par un vrai profil
      const colors = rowMineColors(row);
      const key = colorFilterKey(colors) || 'unknown';
      const entry = noProfileByColor.get(key) || { colors, games:0, wins:0 };
      entry.games += 1;
      if(row.result === 'win') entry.wins += 1;
      noProfileByColor.set(key, entry);
    });
    const noProfilePills = [...noProfileByColor.entries()]
      .sort((a,b) => (b[1].games || 0) - (a[1].games || 0))
      .map(([key, e]) => {
        const wr = e.games ? Math.round(100 * e.wins / e.games) : 0;
        const colorsLabel = e.colors.length ? e.colors.map(inkLabel).join('/') : 'Couleurs inconnues';
        const label = `Sans version · ${colorsLabel} · ${e.games}g · ${wr}%`;
        return { value:`noprofile:${key}`, label, ariaLabel:label, colors:e.colors, noDecklist:true };
      });
    return [
      { value:'all', label:'Tous les decks' },
      ...pills,
      ...noProfilePills
    ];
  }

  function shouldShowDeckVersionFilter(options, selectedColorValue, mode='performance'){
    // Les versions restent visibles dès qu'il en existe au moins une. L'archétype
    // (et la bicolorité) ne font que FILTRER la liste — via deckFilterOptionsForPills —
    // ils ne la masquent plus. Sans archétype sélectionné, toutes les versions
    // s'affichent ; en sélectionnant un archétype, seules les versions de cet
    // archétype subsistent. (Auparavant on exigeait couleur + archétype, ce qui
    // pouvait tout masquer quand aucun archétype n'était défini sur les decks.)
    return (options || []).filter(option => option.value !== 'all').length >= 1;
  }

  function rowFormatPool(row){
    const q = rowQueueString(row);
    if(!q) return '';
    if(isLimitedFormatRow(row)) return 'limited';
    if(q.includes('infinity')) return 'infinity';
    if(q.includes('core')) return 'core';
    return '';
  }

  // Formats « limités » (Sealed, Pack Rush, Draft) : le deck est tiré de boosters,
  // toutes les encres sont mélangées. Ces matchs ne reflètent pas une bicolorité
  // construite et polluent les stats (ex. cartes Rubis dans un deck Ambre/Saphir).
  // On les détecte par tag de file pour les écarter des statistiques.
  // NB : liste de jetons à compléter avec les vraies valeurs de queue_id Duels.ink.
  function isLimitedFormatRow(row){
    const q = rowQueueString(row);
    if(!q) return false;
    return /\b(sealed|pack[\s_-]*rush|packrush|draft|booster)\b/.test(q) || q.includes('scell');
  }

  function rowQueueString(row){
    return [
      row?.queue_id,
      row?.duelink_queue,
      row?.analysis_json?.api_metadata?.queue,
      row?.api_metadata?.duelink_queue,
      row?.api_metadata?.queue
    ].map(value => String(value || '')).filter(Boolean).join(' ').toLowerCase();
  }

  function rowSetNum(row){
    const q = rowQueueString(row);
    // Duels.ink se trompe parfois de tag : « Core Set 12 BO3 · Core BO3 - Set 11 ».
    // Le set réel est celui mentionné EN DERNIER (le « Set 11 » de fin), même si
    // le début indique un autre set. On scanne donc tout le tag (séparateurs
    // espace/tiret/underscore tolérés) et on retient la dernière occurrence.
    const matches = [...q.matchAll(/set[\s_-]*0*(\d+)/g)];
    return matches.length ? matches[matches.length - 1][1] : '';
  }

  function lorcanaPoolOptions(){
    const pools = new Set((state.savedMatches || []).map(rowFormatPool).filter(Boolean));
    if(!pools.size) return [];
    const labels = { core:'Core', infinity:'Infinity', limited:'Limité' };
    return [...pools].sort().map(pool => ({ value:pool, label:labels[pool] || pool }));
  }

  function lorcanaSetOptions(){
    const used = new Set((state.savedMatches || []).map(rowSetNum).filter(Boolean));
    if(!used.size) return [];
    return [...used].sort((a,b) => Number(a)-Number(b)).map(n => ({ value:n, label:`Set ${n}` }));
  }

  function rowMineColors(row){
    return arrayify(row.mine_colors || row.analysis_json?.profiles?.mine?.inks || row.analysis_json?.inkProfiles?.mine?.inks || row.analysis_json?.cards?.mine?.[0]?.colors).map(inkKey).filter(color => color && color !== 'inkless').slice(0,2);
  }

  function rowOpponentColors(row){
    return arrayify(row.opponent_colors || row.analysis_json?.profiles?.opponent?.inks || row.analysis_json?.inkProfiles?.opponent?.inks || row.analysis_json?.cards?.opponent?.[0]?.colors).map(inkKey).filter(color => color && color !== 'inkless').slice(0,2);
  }

  function colorFilterKey(colors){
    const values = arrayify(colors).map(inkKey).filter(Boolean).sort();
    return values.length ? values.join('|') : '';
  }


  function renderPillGroup(target, selectId, options, activeValue){
    if(!target) return;
    const isMulti = isMultiFilterId(selectId);
    const activeValues = isMulti ? selectedFilterValues(selectId) : [String(activeValue || '')];
    const visibleOptions = isMulti ? (options || []).filter(option => String(option.value) !== 'all') : (options || []);
    target.innerHTML = visibleOptions.map(option => {
      const active = activeValues.includes(String(option.value));
      const dots = inkDotsHtml(option.colors || []);
      const label = option.shortLabel || option.label;
      const aria = option.ariaLabel || option.label || label;
      const compact = option.compact ? ' compact-matchup-pill' : '';
      const colorOnly = option.colors?.length ? ' color-badge-pill' : '';
      return `<button type="button" class="filter-pill${compact}${colorOnly} ${active ? 'active' : ''}" data-perf-filter="${escAttr(selectId)}" data-value="${escAttr(option.value)}" aria-label="${escAttr(aria)}" title="${escAttr(aria)}" aria-pressed="${active ? 'true' : 'false'}">${dots}<span>${esc(label)}</span></button>`;
    }).join('');
  }

  function renderDeckPillGroup(target, selectId, options){
    if(!target) return;
    const activeValues = selectedFilterValues(selectId);
    const visible = (options || []).filter(o => o.value !== 'all');
    target.innerHTML = visible.map(option => {
      const active = activeValues.includes(String(option.value));
      const dots = inkDotsHtml(option.colors || []);
      const label = option.shortLabel || option.label;
      const aria = option.ariaLabel || option.label || label;
      // Pas de bouton « decklist » pour le fourre-tout (aucune decklist à ouvrir).
      const eyeBtn = option.noDecklist ? '' : `<button type="button" class="deck-info-btn" data-deck-info="${escAttr(option.value)}" title="Voir la decklist" aria-label="Décklist · ${escAttr(aria)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`;
      return `<span class="deck-pill-wrap"><button type="button" class="filter-pill color-badge-pill ${active ? 'active' : ''}" data-perf-filter="${escAttr(selectId)}" data-value="${escAttr(option.value)}" aria-label="${escAttr(aria)}" aria-pressed="${active?'true':'false'}">${dots}<span>${esc(label)}</span></button>${eyeBtn}</span>`;
    }).join('');
  }

  // Per-session cache of cardId → raw card object, populated as profiles are inspected.
  const decklistCardCache = new Map();
  const lorcastInflight = new Map();
  const LORCAST_CACHE_PREFIX = 'lorcast:v1:';
  // Per-session archetype cache: profileId → { speed, sub, label } | null
  const deckArchetypeCache = new Map();
  // Per-session card-list cache: profileId → Map<cardId, count> (populated from sheet opens)
  const deckCardListCache = new Map();
  const ARCHETYPE_STORAGE_PREFIX = 'inksight:archetype:v1:';

  function loadStoredArchetype(key){
    try{ const v = localStorage.getItem(ARCHETYPE_STORAGE_PREFIX + key); return v ? JSON.parse(v) : null; }
    catch{ return null; }
  }
  function saveStoredArchetype(key, archetype){
    try{
      if(archetype) localStorage.setItem(ARCHETYPE_STORAGE_PREFIX + key, JSON.stringify(archetype));
      else localStorage.removeItem(ARCHETYPE_STORAGE_PREFIX + key);
    }catch{}
  }

  // ─── Archétype : classification par courbe de coût + ratio Lore/Coût ────
  function computeDeckArchetype(normalizedCards){
    if(!Array.isArray(normalizedCards) || !normalizedCards.length) return null;

    let totalCost = 0, totalLore = 0, totalCards = 0, loreCards = 0;
    let cost1_2 = 0, cost5plus = 0;

    normalizedCards.forEach(e => {
      const h = hydrateCard({ ...e, id: e.cardId || e.id || '' });
      const cost = h?.cost ?? null;
      if(cost == null || cost >= 99) return;
      const cnt = Number(e.count) || 1;
      totalCost  += cost * cnt;
      totalCards += cnt;
      if(cost <= 2) cost1_2   += cnt;
      if(cost >= 5) cost5plus += cnt;
      const lore = h.lore ?? null;
      if(lore != null && lore > 0){ totalLore += lore * cnt; loreCards += cnt; }
    });

    if(totalCards < 8) return null;

    const avgCost     = totalCost / totalCards;
    const pctEarly    = cost1_2   / totalCards; // % cartes ≤2
    const pctLate     = cost5plus / totalCards; // % cartes ≥5
    const avgLore     = loreCards > 0 ? totalLore / loreCards : null;
    const lorePerCost = avgLore != null && avgCost > 0 ? avgLore / avgCost : null;

    // ── Courbe de coût (signal principal) ──
    let A = 0, M = 0, C = 0;

    if(avgCost < 2.3)       A += 20;
    else if(avgCost < 2.7)  { A += 12; M += 4; }
    else if(avgCost < 3.1)  { A += 4;  M += 12; }
    else if(avgCost < 3.6)  M += 20;
    else if(avgCost < 4.2)  { M += 6;  C += 14; }
    else                    C += 20;

    if(pctEarly > 0.50) A += 10; else if(pctEarly > 0.38) A += 5;
    if(pctLate  > 0.28) C += 10; else if(pctLate  > 0.18) C += 5;

    // ── Ratio Lore/Coût (signal secondaire, ignoré si données manquantes) ──
    if(lorePerCost != null){
      if(lorePerCost > 1.05)      A += 8;
      else if(lorePerCost > 0.80) M += 4;
      else if(lorePerCost < 0.50) C += 6;
    }

    const maxScore = Math.max(A, M, C);
    const speed = maxScore === C ? 'control' : maxScore === A ? 'aggro' : 'midrange';
    const LABELS = { aggro:'Aggro', midrange:'Midrange', control:'Control' };
    return { speed, label: LABELS[speed], _avg: avgCost, _lpc: lorePerCost };
  }

  let _archetypeReflowScheduled = false;
  function ensureArchetypeReflowAfterCards(){
    // Le référentiel cartes (coûts) n'est pas encore chargé : on le charge puis on
    // recalcule et re-rend une seule fois, pour que les archétypes auto apparaissent
    // sans action manuelle.
    if(_archetypeReflowScheduled) return;
    _archetypeReflowScheduled = true;
    ensureLocalCardsLoaded().then(() => {
      _archetypeReflowScheduled = false;
      deckArchetypeCache.clear();
      try{ renderPerformanceFilterPills(); }catch(_e){}
      try{ globalThis.INKSIGHT_renderPerformanceData?.(); }catch(_e){}
    }).catch(() => { _archetypeReflowScheduled = false; });
  }

  // Pré-calcul d'archétypes en arrière-plan : les lignes « légères » de l'historique
  // ne contiennent pas toujours la decklist complète (api_metadata tronqué), donc
  // getProfileArchetype ne peut pas classer certains decks importés sans ouvrir leur
  // decklist. On va chercher le match complet (getSavedMatch) une seule fois par deck
  // visible, on calcule l'archétype, on le mémorise puis on re-rend. Borné et dédupliqué.
  const _archPrecomputed = new Set();
  let _archPrecomputeBusy = false;
  async function precomputeArchetypesForProfiles(profileIds=[]){
    if(!state.currentUser || _archPrecomputeBusy) return;
    const todo = [...new Set(profileIds.map(String))]
      .filter(pid => pid && !_archPrecomputed.has(pid) && !loadStoredArchetype(pid) && !deckArchetypeCache.get(pid))
      .slice(0, 40);
    if(!todo.length) return;
    _archPrecomputeBusy = true;
    let changed = false;
    try{
      await ensureLocalCardsLoaded();
      for(const pid of todo){
        _archPrecomputed.add(pid);
        const matchRow = (state.savedMatches || []).find(r => String(r.deck_profile_id) === pid);
        if(!matchRow) continue;
        let cards = apiDecklistStatus(matchRow, 'mine').cards;
        if(cards.length < 5){
          try{ const full = await getSavedMatch(matchRow.id); cards = apiDecklistStatus(full, 'mine').cards; }
          catch(_e){ continue; }
        }
        if(cards.length >= 5){
          const arch = computeDeckArchetype(cards);
          if(arch){ saveStoredArchetype(pid, arch); deckArchetypeCache.set(pid, arch); changed = true; }
        }
      }
    }finally{
      _archPrecomputeBusy = false;
    }
    if(changed){
      try{ renderPerformanceFilterPills(); }catch(_e){}
      try{ globalThis.INKSIGHT_renderPerformanceData?.(); }catch(_e){}
    }
  }

  function getProfileArchetype(profileId){
    if(!profileId) return null;
    const key = String(profileId);
    if(deckArchetypeCache.has(key)) return deckArchetypeCache.get(key);
    // Check localStorage for manually set or previously auto-computed archetype
    const stored = loadStoredArchetype(key);
    if(stored){ deckArchetypeCache.set(key, stored); return stored; }
    // computeDeckArchetype a besoin des coûts de cartes. Sans le référentiel chargé,
    // on diffère SANS cacher null (sinon le deck restait non classé jusqu'à une action
    // manuelle). On programme un recalcul auto dès que les cartes sont disponibles.
    if(!state.cards?.length){ ensureArchetypeReflowAfterCards(); return null; }
    // Try from apiDecklistStatus (DuelInk import — card data in the match row)
    const match = (state.savedMatches || []).find(r =>
      String(r.deck_profile_id) === key && apiDecklistStatus(r, 'mine').cards.length >= 5
    );
    const archetype = match ? computeDeckArchetype(apiDecklistStatus(match, 'mine').cards) : null;
    if(archetype) saveStoredArchetype(key, archetype);
    // On cache le résultat (y compris null) seulement maintenant que les cartes sont
    // chargées : la classification est alors déterministe.
    deckArchetypeCache.set(key, archetype);
    return archetype;
  }

  function archetypeFilterOptions(mode){
    const prefix = mode === 'history' ? 'history' : 'performance';
    const selectedColors = selectedFilterValues(`${prefix}ColorFilter`);
    if(!selectedColors.length) return [];
    const rows = (state.savedMatches || []).filter(r =>
      r.deck_profile_id && selectedColors.includes(colorFilterKey(rowMineColors(r)))
    );
    const profileCount = new Set(rows.map(r => String(r.deck_profile_id)).filter(Boolean)).size;
    if(profileCount < 2) return [];
    return [
      { value:'aggro', label:'Aggro' },
      { value:'midrange', label:'Midrange' },
      { value:'control', label:'Control' }
    ];
  }

  function shouldShowArchetypeFilter(mode){
    return archetypeFilterOptions(mode).length > 0;
  }

  function normalizeLorcastCard(j, cardId){
    if(!j || typeof j !== 'object') return null;
    const name = String(j.name || '').trim();
    const version = String(j.version || '').trim();
    const typeArr = Array.isArray(j.type) ? j.type : (j.type ? [String(j.type)] : []);
    const type = typeArr.includes('Song') ? 'Song'
               : typeArr.includes('Item') ? 'Item'
               : typeArr.includes('Location') ? 'Location'
               : typeArr.includes('Character') ? 'Character'
               : typeArr[0] || '';
    const ink = j.ink || (Array.isArray(j.inks) && j.inks[0]) || '';
    const inks = Array.isArray(j.inks) && j.inks.length ? j.inks : (ink ? [ink] : []);
    return {
      source:'lorcast',
      id:cardId,
      cardId,
      name,
      version,
      fullName: [name, version].filter(Boolean).join(' - '),
      type,
      cardType:type,
      colors:inks,
      cost: typeof j.cost === 'number' ? j.cost : null,
      inkable: j.inkwell === true ? true : (j.inkwell === false ? false : null),
      rarity: j.rarity || '',
      classifications: Array.isArray(j.classifications) ? j.classifications : [],
      strength: j.strength ?? null,
      willpower: j.willpower ?? null,
      lore: j.lore ?? null,
      text: j.text || '',
      image: j.image_uris?.digital?.normal || '',
      imageSmall: j.image_uris?.digital?.small || j.image_uris?.digital?.normal || ''
    };
  }

  async function fetchLorcastCard(cardId){
    if(!cardId) return null;
    const [setNum, num] = String(cardId).split('-');
    if(!/^\d+$/.test(setNum) || !num) return null;
    const key = LORCAST_CACHE_PREFIX + cardId;
    try{
      const cached = localStorage.getItem(key);
      if(cached !== null){
        if(cached === 'MISS') return null;
        return JSON.parse(cached);
      }
    }catch{}
    if(lorcastInflight.has(cardId)) return lorcastInflight.get(cardId);
    const promise = (async () => {
      try{
        const res = await fetch(`https://api.lorcast.com/v0/cards/${setNum}/${parseInt(num,10)}`);
        if(!res.ok){
          try{ localStorage.setItem(key, 'MISS'); }catch{}
          return null;
        }
        const json = await res.json();
        const card = normalizeLorcastCard(json, cardId);
        if(card){ try{ localStorage.setItem(key, JSON.stringify(card)); }catch{} }
        return card;
      }catch{
        return null;
      }finally{
        lorcastInflight.delete(cardId);
      }
    })();
    lorcastInflight.set(cardId, promise);
    return promise;
  }

  async function openDecklistModal(profileIdOrGroup){
    // profileIdOrGroup may be "|"-joined when coming from a merged deck pill
    const profileId = String(profileIdOrGroup || '').split('|')[0];
    const profile = state.deckProfiles.find(p => String(p.id) === profileId);
    if(!profile) return;
    closeDecklistSheet();
    const sheet = ensureDecklistSheet();
    sheet.querySelector('.decklist-sheet-title').textContent = profile.name;
    sheet.querySelector('.decklist-sheet-body').innerHTML = '<p class="decklist-sheet-empty">Chargement…</p>';
    sheet.classList.add('active');
    document.body.classList.add('decklist-sheet-open');

    const allForProfile = (state.savedMatches || []).filter(r => String(r.deck_profile_id) === profileId);
    const matchRow = allForProfile[0];
    if(!matchRow){ sheet.querySelector('.decklist-sheet-body').innerHTML = '<p class="decklist-sheet-empty">Aucun match sauvegardé pour ce deck.</p>'; return; }

    const profileWins = allForProfile.filter(r => r.result === 'win').length;
    const profileStats = { wins:profileWins, total:allForProfile.length, winRate: Math.round(profileWins / allForProfile.length * 100) };

    try{
      const primary = await getSavedMatch(matchRow.id);
      const decklist = primary?.api_metadata?.api_row?.raw?.your_decklist || [];
      if(!decklist.length){ sheet.querySelector('.decklist-sheet-body').innerHTML = '<p class="decklist-sheet-empty">Décklist non disponible (import manuel).</p>'; return; }

      mergeCardObjectsFromMatch(primary);

      // Seed cardIdToRaw from Lorcast cache (sync, no network) before first render.
      decklist.forEach(e => {
        if(decklistCardCache.has(e.cardId)) return;
        try{
          const cached = localStorage.getItem(LORCAST_CACHE_PREFIX + e.cardId);
          if(cached && cached !== 'MISS'){
            const card = JSON.parse(cached);
            if(card) decklistCardCache.set(e.cardId, card);
          }
        }catch{}
      });

      const render = () => {
        if(!sheet.classList.contains('active')) return;
        sheet.querySelector('.decklist-sheet-body').innerHTML = buildDecklistHtml(profile, decklist, { cardIdToRaw:decklistCardCache, profileStats });
        bindDecklistActions(sheet, profile, decklist, decklistCardCache);
      };
      render();

      const missingIds = () => decklist.filter(e => !isCardResolved(e.cardId)).map(e => e.cardId);

      // In parallel: load sibling matches (cards played in other games for this deck)
      // and fetch missing cards from Lorcast (authoritative card database). Re-render
      // when either source resolves new cards.
      const tasks = [];
      const initialMissing = missingIds();
      if(initialMissing.length){
        const siblings = allForProfile.slice(1, 10).filter(r => r.id !== matchRow.id);
        if(siblings.length){
          tasks.push(Promise.allSettled(siblings.map(r => getSavedMatch(r.id))).then(results => {
            let changed = false;
            results.forEach(r => { if(r.status === 'fulfilled' && r.value && mergeCardObjectsFromMatch(r.value)) changed = true; });
            return changed;
          }));
        }
        tasks.push(Promise.allSettled(initialMissing.map(fetchLorcastCard)).then(results => {
          let changed = false;
          results.forEach((r, i) => {
            if(r.status === 'fulfilled' && r.value && !decklistCardCache.has(initialMissing[i])){
              decklistCardCache.set(initialMissing[i], r.value);
              changed = true;
            }
          });
          return changed;
        }));
      }
      if(tasks.length){
        Promise.all(tasks).then(results => { if(results.some(Boolean)) render(); });
      }
    }catch(err){
      sheet.querySelector('.decklist-sheet-body').innerHTML = `<p class="decklist-sheet-empty">Erreur : ${esc(err.message)}</p>`;
    }
  }

  function isCardResolved(cardId){
    const local = hydrateCard({ id:cardId });
    if(local && fullName(local) !== 'Carte inconnue' && local.cost != null) return true;
    const cached = decklistCardCache.get(cardId);
    if(cached){
      const h = hydrateCard({ ...cached, id:cardId });
      if(h && fullName(h) !== 'Carte inconnue' && h.cost != null) return true;
    }
    return false;
  }

  function mergeCardObjectsFromMatch(match){
    if(!match) return false;
    let added = false;
    const raw = match?.api_metadata?.api_row?.raw || {};
    extractCards(raw).forEach(c => {
      const id = String(c.cardId || c.id || '').trim();
      if(!id || decklistCardCache.has(id)) return;
      decklistCardCache.set(id, c);
      added = true;
    });
    return added;
  }

  // Same CDN as the match analyzer uses for card art.
  function cardImageUrlFromId(cardId){
    if(!cardId) return '';
    const [setNum, num] = String(cardId).split('-');
    if(!/^\d+$/.test(setNum) || !num) return '';
    return `https://cards.duels.ink/lorcana/en/thumbnail/${setNum}-${strip0(num)}.webp`;
  }

  function bindDecklistActions(sheet, profile, decklist, cardIdToRaw=new Map()){
    const copyBtn = sheet.querySelector('[data-decklist-copy]');
    if(copyBtn){
      const labelEl = copyBtn.querySelector('span');
      const originalLabel = labelEl?.textContent || 'Copier la decklist';
      copyBtn.addEventListener('click', async () => {
        const lines = decklist.map(e => {
          let h = hydrateCard({ id:e.cardId });
          if(!h || fullName(h) === 'Carte inconnue'){
            const raw = cardIdToRaw.get(e.cardId);
            if(raw) h = hydrateCard({ ...raw, id:e.cardId });
          }
          const name = (h && fullName(h) !== 'Carte inconnue') ? fullName(h) : e.cardId;
          return `${e.count} ${name}`;
        });
        try{
          await navigator.clipboard.writeText(lines.join('\n'));
          copyBtn.classList.add('is-success');
          if(labelEl) labelEl.textContent = 'Copié !';
          setTimeout(() => { copyBtn.classList.remove('is-success'); if(labelEl) labelEl.textContent = originalLabel; }, 1600);
        }catch{}
      });
    }

    // Archétype : clic sur le badge ouvre un picker inline
    const archetypeBtn = sheet.querySelector('[data-archetype-edit]');
    if(archetypeBtn){
      archetypeBtn.addEventListener('click', e => {
        e.stopPropagation();
        const existing = sheet.querySelector('.dl-archetype-picker');
        if(existing){ existing.remove(); return; }
        const ARCHETYPE_COLORS = { aggro:'#f87171', midrange:'#34d399', control:'#60a5fa' };
        const LABELS = { aggro:'Aggro', midrange:'Midrange', control:'Control' };
        const pid = archetypeBtn.dataset.archetypeEdit;
        const current = pid ? getProfileArchetype(pid) : null;
        const picker = document.createElement('div');
        picker.className = 'dl-archetype-picker';
        picker.innerHTML = ['aggro','midrange','control'].map(speed =>
          `<button type="button" class="dl-arch-opt${current?.speed===speed?' active':''}" data-arch-speed="${speed}" style="color:${ARCHETYPE_COLORS[speed]}">${LABELS[speed]}</button>`
        ).join('') + `<button type="button" class="dl-arch-opt dl-arch-reset" data-arch-speed="">Auto</button>`;
        archetypeBtn.insertAdjacentElement('afterend', picker);

        picker.addEventListener('click', ev => {
          const btn = ev.target.closest('[data-arch-speed]');
          if(!btn) return;
          const speed = btn.dataset.archSpeed;
          const newArchetype = speed ? { speed, label:LABELS[speed] } : null;
          picker.remove();

          if(!pid) return;
          // Save manual override (or clear it for "Auto")
          if(speed){
            saveStoredArchetype(pid, newArchetype);
            deckArchetypeCache.set(pid, newArchetype);
          } else {
            localStorage.removeItem(ARCHETYPE_STORAGE_PREFIX + pid);
            deckArchetypeCache.delete(pid);
          }

          // Propagate to all identical decks in the cache
          const thisCardList = deckCardListCache.get(pid);
          if(thisCardList){
            for(const [otherId, otherList] of deckCardListCache.entries()){
              if(otherId === pid) continue;
              if(deckListsIdentical(thisCardList, otherList)){
                if(speed){ saveStoredArchetype(otherId, newArchetype); deckArchetypeCache.set(otherId, newArchetype); }
                else{ localStorage.removeItem(ARCHETYPE_STORAGE_PREFIX + otherId); deckArchetypeCache.delete(otherId); }
              }
            }
          }

          // Update badge in sheet
          const color = speed ? (ARCHETYPE_COLORS[speed] || 'var(--theme-color-1)') : 'var(--muted)';
          archetypeBtn.style.color = color;
          archetypeBtn.textContent = (speed ? LABELS[speed] : '— Archétype') + ' ▾';

          // Refresh filter pills
          try{ renderPerformanceFilterPills(); }catch(e){}
        });

        // Close picker on outside click
        const closeOnOutside = ev => {
          if(!picker.contains(ev.target) && ev.target !== archetypeBtn){ picker.remove(); document.removeEventListener('click', closeOnOutside); }
        };
        setTimeout(() => document.addEventListener('click', closeOnOutside), 10);
      });
    }

    // Renommer la version : champ inline à côté du badge (le panneau Compte ayant
    // été retiré, le renommage se fait désormais depuis la decklist).
    const renameBtn = sheet.querySelector('[data-deck-rename-inline]');
    if(renameBtn){
      renameBtn.addEventListener('click', e => {
        e.stopPropagation();
        if(sheet.querySelector('.dl-rename-input')){ sheet.querySelector('.dl-rename-input').focus(); return; }
        const pid = renameBtn.dataset.deckRenameInline;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'dl-rename-input';
        input.value = profile?.name || '';
        input.setAttribute('aria-label', 'Nouveau nom de la version');
        renameBtn.insertAdjacentElement('afterend', input);
        input.focus();
        input.select();
        let done = false;
        const commit = async () => {
          if(done) return; done = true;
          const name = String(input.value || '').trim();
          input.remove();
          if(!name || name === profile?.name || !state.currentUser) return;
          try{
            await renameDeckProfile(pid, name);
            if(profile) profile.name = name;
            const p = state.deckProfiles.find(x => String(x.id) === String(pid));
            if(p) p.name = name;
            const title = sheet.querySelector('.decklist-sheet-title');
            if(title) title.textContent = name;
            try{ renderPerformanceFilterPills(); }catch(_e){}
            try{ globalThis.INKSIGHT_renderPerformanceData?.(); }catch(_e){}
          }catch(err){ console.warn('Renommage de version échoué', err); }
        };
        input.addEventListener('keydown', ev => {
          if(ev.key === 'Enter'){ ev.preventDefault(); commit(); }
          else if(ev.key === 'Escape'){ done = true; input.remove(); }
        });
        input.addEventListener('blur', commit);
      });
    }
  }

  function ensureDecklistSheet(){
    let sheet = document.getElementById('decklistSheet');
    if(sheet) return sheet;
    sheet = document.createElement('div');
    sheet.id = 'decklistSheet';
    sheet.className = 'decklist-sheet';
    sheet.innerHTML = `<div class="decklist-sheet-backdrop" data-decklist-close></div><div class="decklist-sheet-panel"><header class="decklist-sheet-head"><div class="decklist-sheet-titles"><span class="decklist-sheet-kicker">Decklist</span><h2 class="decklist-sheet-title"></h2></div><button type="button" class="decklist-sheet-close" data-decklist-close aria-label="Fermer">✕</button></header><div class="decklist-sheet-body"></div></div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if(e.target.closest('[data-decklist-close]')) closeDecklistSheet(); });
    return sheet;
  }

  function closeDecklistSheet(){
    const sheet = document.getElementById('decklistSheet');
    if(!sheet) return;
    sheet.classList.remove('active');
    document.body.classList.remove('decklist-sheet-open');
    try{ renderPerformanceFilterPills(); }catch(e){ console.error('[closeDecklistSheet]', e); }
  }

  function buildDecklistHtml(profile, decklist, opts={}){
    const { cardIdToRaw = new Map(), profileStats = null } = opts;
    const cards = decklist.map(entry => {
      let h = hydrateCard({ id:entry.cardId });
      let fromDb = !!h && fullName(h) !== 'Carte inconnue' && h.cost != null;
      if(!fromDb){
        const raw = cardIdToRaw.get(entry.cardId);
        if(raw) h = hydrateCard({ ...raw, id:entry.cardId });
      }
      const resolved = !!h && fullName(h) !== 'Carte inconnue' && h.cost != null;
      const name = resolved ? fullName(h) : '';
      const rawType = resolved ? (h.type || h.cardType || 'Other') : 'Unknown';
      const type = (() => {
        if (!resolved) return 'Unknown';
        if (rawType.toLowerCase().includes('song')) return 'Song';
        if (rawType.includes('·')) return rawType.split('·')[0].trim();
        return rawType || 'Other';
      })();
      const cost = resolved && h.cost != null ? h.cost : 99;
      const image = cardImageUrlFromId(entry.cardId) || h?.imageSmall || h?.image || '';
      const inkableKnown = resolved && typeof h.inkable === 'boolean';
      const setNum = String(entry.cardId).split('-')[0];
      const setCode = SET_NUM_TO_CODE[setNum] || (resolved && (h.setCode || h.set) || '');
      const rarity = resolved ? (h.rarity || '') : '';
      const number = String(entry.cardId).split('-')[1] || '';
      return { count:entry.count, name, type, cost, image, id:entry.cardId, resolved, inkableKnown, uninkable: inkableKnown && h.inkable === false, setCode, rarity, number };
    }).sort((a,b) => a.cost - b.cost || a.name.localeCompare(b.name));

    const total = decklist.reduce((s,e) => s + e.count, 0);
    const uninkable = cards.filter(c => c.uninkable).reduce((s,c) => s + c.count, 0);
    const allKnown = cards.every(c => c.inkableKnown);

    const groups = {};
    cards.forEach(c => { (groups[c.type] = groups[c.type] || []).push(c); });
    const typeOrder = ['Character','Action','Song','Item','Location','Unknown'];
    const allTypes = [...typeOrder.filter(t => groups[t]), ...Object.keys(groups).filter(t => !typeOrder.includes(t) && groups[t])];
    const typeLabels = { Character:'Personnages', Action:'Actions', Song:'Chansons', Item:'Objets', Location:'Lieux', Unknown:'À identifier' };
    const typeCount = type => (groups[type] || []).reduce((s,c) => s + c.count, 0);

    const inkDotsBig = `<span class="dl-summary-inks">${arrayify(profileColors(profile)).map(inkKey).filter(Boolean).slice(0,2).map(c => `<i class="lorcana-hex ink-${escAttr(c)}" aria-label="${esc(INK_FR[c] || c)}"></i>`).join('')}</span>`;

    const sections = allTypes.map(type => {
      const gTotal = typeCount(type);
      const items = groups[type].map(c => {
        const thumb = c.image
          ? `<img class="dl-thumb" loading="lazy" src="${escAttr(c.image)}" alt="" onerror="this.classList.add('dl-thumb-error')">`
          : '<span class="dl-thumb dl-thumb-missing"></span>';
        const metaParts = [];
        if(c.rarity) metaParts.push(esc(RARITY_FR[c.rarity] || c.rarity));
        if(c.setCode) metaParts.push(esc(c.setCode));
        if(c.number) metaParts.push(`#${esc(c.number)}`);
        const meta = metaParts.length
          ? metaParts.map((p,i) => i ? `<span class="dl-meta-sep">·</span>${p}` : p).join(' ')
          : `<em class="dl-card-id">#${esc(c.id)}</em>`;
        const chips = [];
        if(c.cost < 99) chips.push(`<span class="dl-chip dl-chip-cost">Coût ${c.cost}</span>`);
        if(c.uninkable) chips.push('<span class="dl-chip dl-chip-uninkable"><i class="lorcana-non-inkwell" aria-hidden="true"></i>Non encrable</span>');
        const nameOut = c.name || `<em class="dl-card-id">#${esc(c.id)}</em>`;
        return `<li class="dl-card">${thumb}<div class="dl-card-body"><span class="dl-name">${nameOut}</span><span class="dl-meta">${meta}</span>${chips.length ? `<span class="dl-chips">${chips.join('')}</span>` : ''}</div><span class="dl-count">${c.count}</span></li>`;
      }).join('');
      return `<section class="dl-section"><h3 class="dl-section-title"><span>${esc(typeLabels[type] || type)}</span><span class="dl-section-count">${gTotal}</span></h3><ul class="dl-card-list">${items}</ul></section>`;
    }).join('');

    const wr = profileStats?.total >= 1 ? profileStats.winRate : null;
    const wrTone = wr == null ? '' : (wr >= 55 ? 'dl-stat-positive' : (wr < 45 ? 'dl-stat-warn' : ''));
    const stats = [
      `<span class="dl-summary-stat"><strong>${total}</strong>Cartes</span>`,
      allKnown ? `<span class="dl-summary-stat"><strong>${uninkable}</strong>Non-encrables</span>` : '',
      groups.Character ? `<span class="dl-summary-stat"><strong>${typeCount('Character')}</strong>Personnages</span>` : '',
      groups.Song ? `<span class="dl-summary-stat"><strong>${typeCount('Song')}</strong>Chansons</span>` : '',
      groups.Action ? `<span class="dl-summary-stat"><strong>${typeCount('Action')}</strong>Actions</span>` : '',
      groups.Item ? `<span class="dl-summary-stat"><strong>${typeCount('Item')}</strong>Objets</span>` : '',
      groups.Location ? `<span class="dl-summary-stat"><strong>${typeCount('Location')}</strong>Lieux</span>` : '',
      wr != null ? `<span class="dl-summary-stat ${wrTone}"><strong>${wr}%</strong>WR · ${profileStats.total} parties</span>` : ''
    ].filter(Boolean).join('');
    const computedArchetype = computeDeckArchetype(decklist.map(e => ({ cardId:e.cardId, id:e.cardId, count:e.count })));
    const pid = profile?.id ? String(profile.id) : null;
    // Cache card list for identical-deck merging
    if(pid){
      const cardList = new Map(decklist.map(e => [String(e.cardId || ''), Number(e.count) || 1]).filter(([id]) => id));
      if(cardList.size >= 5) deckCardListCache.set(pid, cardList);
    }
    // Merge with manually set archetype from localStorage (manual overrides auto-computed)
    const storedArchetype = pid ? loadStoredArchetype(pid) : null;
    const archetype = storedArchetype || computedArchetype || null;
    if(pid && computedArchetype && !storedArchetype) saveStoredArchetype(pid, computedArchetype);
    if(pid && archetype) deckArchetypeCache.set(pid, archetype);
    const ARCHETYPE_COLORS = { aggro:'#f87171', midrange:'#34d399', control:'#60a5fa' };
    const archetypeColor = archetype ? (ARCHETYPE_COLORS[archetype.speed] || 'var(--theme-color-1)') : 'var(--muted)';
    const archetypeBadge = `<button type="button" class="dl-archetype-badge dl-archetype-edit" data-archetype-edit="${escAttr(pid||'')}" style="color:${archetypeColor}" title="Modifier l'archétype">${esc(archetype?.label || '— Archétype')} ▾</button>`;
    const renameBadge = pid ? `<button type="button" class="dl-archetype-badge dl-rename-edit" data-deck-rename-inline="${escAttr(pid)}" title="Renommer la version" aria-label="Renommer la version"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><span>Renommer</span></button>` : '';
    const statsBar = `<div class="dl-summary">${buildMiniCostCurveHtml(cards)}<div class="dl-summary-stats">${stats}${archetypeBadge}${renameBadge}</div>${inkDotsBig}</div>`;

    const actionsBar = `<div class="dl-actions"><button type="button" class="ghost-button compact dl-copy-btn" data-decklist-copy><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copier la decklist</span></button></div>`;
    return `${statsBar}${actionsBar}${sections}`;
  }

  function buildMiniCostCurveHtml(cards){
    const buckets = new Array(8).fill(0);
    cards.forEach(c => {
      if(c.cost >= 99) return;
      const i = Math.min(7, Math.max(0, c.cost - 1));
      buckets[i] += c.count;
    });
    const max = Math.max(...buckets, 1);
    const bars = buckets.map((v,i) => {
      const height = v ? Math.max(6, (v/max) * 30) : 3;
      const empty = v ? '' : ' data-empty';
      return `<i${empty} style="height:${height}px" aria-hidden="true"></i><span>${i+1}${i===7?'+':''}</span>`.replace('</i>', '</i>');
    });
    const iEls = buckets.map((v,i) => {
      const h = v ? Math.max(6, (v/max) * 30) : 3;
      return `<i${v ? '' : ' data-empty'} style="height:${h}px"></i>`;
    }).join('');
    const sEls = buckets.map((_,i) => `<span>${i+1}${i===7?'+':''}</span>`).join('');
    return `<div class="dl-curve-mini" aria-label="Courbe de coût">${iEls}${sEls}</div>`;
  }

  function inkDotsHtml(colors){
    const values = arrayify(colors).map(inkKey).filter(Boolean).slice(0,2);
    if(!values.length) return '';
    return `<span class="filter-ink-dots" aria-hidden="true">${values.map(color => `<i class="ink-dot ink-${escAttr(color)}"></i>`).join('')}</span>`;
  }

  function colorMatchupDotsHtml(mine=[], opponent=[], label=''){
    const mineDots = inkDotsHtml(mine);
    const oppDots = inkDotsHtml(opponent);
    if(!mineDots && !oppDots) return `<span class="color-matchup-text">${esc(label || 'Encres non détectées')}</span>`;
    return `<span class="color-matchup-dots" aria-label="${escAttr(label || 'Bicolorité du match')}">${mineDots || '<span class="ink-dot-placeholder"></span>'}<span class="history-vs">vs</span>${oppDots || '<span class="ink-dot-placeholder"></span>'}</span>`;
  }

  function readSaveDeckSelection(){
    const typed = String(els.saveDeckNameInput?.value || '').trim();
    const selectedId = String(els.saveDeckSelect?.value || '').trim();
    const selected = selectedId ? state.deckProfiles.find(profile => profile.id === selectedId) : null;
    if(typed) return { mode:'typed', id:null, name:typed };
    if(selected) return { mode:'existing', id:selected.id, name:selected.name };
    return { mode:'none', id:null, name:null };
  }

  // Deck déduit automatiquement depuis l'identifiant de deck Duels.ink
  // (your_deck_id) : pas de saisie. Versions/couleurs gérées comme le backfill.
  function autoDeckFromMatch(m){
    const apiMeta = apiMetadataForSavedData(m);
    const raw = apiMeta?.api_row?.raw || null;
    const externalId = raw?.your_deck_id || null;
    const rawColors = String(raw?.your_deck_colors || '').trim();
    const colors = rawColors
      ? rawColors.split('/').map(part => part.trim().toLowerCase()).filter(Boolean)
      : ((m?.inkProfiles || buildInkProfiles(m)).mine?.inks || []).map(inkKey).filter(color => color && color !== 'inkless');
    const colorsLabel = rawColors || colors.map(inkLabel).join('/') || 'Deck';
    return { externalId, colors, colorsLabel };
  }

  async function resolveAutoDeckProfile(m){
    const auto = autoDeckFromMatch(m);
    if(!auto.externalId) return { id:null, name:null };
    const existing = (state.deckProfiles || []).find(profile => profile.external_deck_id === auto.externalId);
    if(existing) return { id:existing.id, name:existing.name };
    const key = colorFilterKey(auto.colors);
    const sameColor = (state.deckProfiles || []).filter(profile => colorFilterKey(profileColors(profile)) === key);
    const name = `${auto.colorsLabel} ${sameColor.length + 1}`;
    const profile = await ensureDeckProfileByExternalId(auto.externalId, name, auto.colors);
    await refreshDeckProfiles({ force:true, silent:true });
    return { id:profile?.id || null, name:profile?.name || name };
  }

  async function resolveDeckProfileForSave(m){
    const deck = readSaveDeckSelection();
    if(!deck.name) return resolveAutoDeckProfile(m);
    const profiles = m?.inkProfiles || buildInkProfiles(m);
    const mineColors = (profiles.mine?.inks || []).map(inkLabel);
    if(deck.id) return { id:deck.id, name:deck.name };
    const profile = await upsertDeckProfile({ name:deck.name, colors:mineColors });
    await refreshDeckProfiles({ force:true, silent:true });
    if(els.saveDeckSelect && profile?.id) els.saveDeckSelect.value = profile.id;
    if(els.saveDeckNameInput) els.saveDeckNameInput.value = '';
    return { id:profile?.id || null, name:profile?.name || deck.name };
  }

  async function refreshSavedMatches(options={}){
    if(!state.currentUser){
      state.savedMatches = [];
      state.savedMatchesLoaded = false;
      state.selectedSavedMatchId = null;
      state.expandedSavedMatchId = null;
      state.savedAnalytics = { games:[], cardStats:[], turnStats:[], key:'', loading:false, error:'' };
      renderPerformanceData();
      return [];
    }
    if(state.savedMatchesLoading) return state.savedMatches;
    if(state.savedMatchesLoaded && !options.force){
      renderPerformanceData();
      return state.savedMatches;
    }

    const cacheShown = !options.force && hydrateSavedMatchesFromCache();

    try{
      state.savedMatchesLoading = true;
      if(!cacheShown && !options.silent && els.historyStatus) els.historyStatus.textContent = 'Chargement de vos analyses sauvegardées…';
      if(!cacheShown) renderPerformanceData();
      const listStartedAt = perfNow();
      const rows = await listSavedMatchHistoryLight(SAVED_MATCH_HISTORY_LIMIT);
      perfMark('saved matches light query', listStartedAt, { rows:Array.isArray(rows) ? rows.length : 0, limit:SAVED_MATCH_HISTORY_LIMIT });
      state.savedMatches = Array.isArray(rows) ? rows : [];
      deckArchetypeCache.clear();
      deckCardListCache.clear();
      // Pre-compute archetypes from available match data (my_decklist / your_decklist / localStorage)
      const profileIds = [...new Set(state.savedMatches.map(r => r.deck_profile_id).filter(Boolean).map(String))];
      profileIds.forEach(id => getProfileArchetype(id));
      writeSessionCache('saved-match-summaries', state.savedMatches);
      state.savedMatchesLoaded = true;
      if(!state.selectedSavedMatchId && state.savedMatches.length) state.selectedSavedMatchId = state.savedMatches[0].id;
      const shouldLoadDetails = options.details === true || options.loadDetails === true;
      if(shouldLoadDetails){
        await refreshSavedAnalytics(state.savedMatches, { force:!!options.force });
      }
    }catch(err){
      console.error(err);
      state.savedMatches = [];
      state.savedMatchesLoaded = true;
      state.savedAnalytics = { games:[], cardStats:[], turnStats:[], key:'', loading:false, error:err.message || 'Historique indisponible.' };
      if(els.historyStatus) els.historyStatus.textContent = `Erreur historique : ${err.message || err}`;
      if(els.historyList) els.historyList.innerHTML = `<div class="history-empty-state"><strong>Impossible de charger l’historique.</strong><span>${esc(err.message || err)}. Vérifiez la connexion puis réessayez.</span><button type="button" class="ghost-button compact" id="historyRetryInline">Réessayer</button></div>`;
      document.getElementById('historyRetryInline')?.addEventListener('click', () => refreshSavedMatches({ force:true }));
    }finally{
      state.savedMatchesLoading = false;
      renderPerformanceData();
    }
    return state.savedMatches;
  }


  globalThis.INKSIGHT_refreshSavedMatches = refreshSavedMatches;

  function uniqueSavedMatchIds(rows=[]){
    return [...new Set((rows || []).map(row => row?.id).filter(Boolean))].sort();
  }


  const SAVED_CACHE_TTL = 1000 * 60 * 12;
  const SAVED_CACHE_VERSION = 'v136-0al';
  // Les détails analytiques (20k+ lignes) sont trop volumineux pour sessionStorage.
  // On les garde dans IndexedDB (grande capacité, persistant entre sessions).
  const ANALYTICS_CACHE_TTL = 1000 * 60 * 60 * 24;
  const IDB_NAME = 'inksight-cache';
  const IDB_STORE = 'kv';
  let idbPromise = null;

  function idbOpen(){
    if(idbPromise) return idbPromise;
    idbPromise = new Promise(resolve => {
      try{
        if(typeof indexedDB === 'undefined'){ resolve(null); return; }
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => { const db = req.result; if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      }catch(_err){ resolve(null); }
    });
    return idbPromise;
  }

  async function idbGet(key){
    const db = await idbOpen();
    if(!db) return null;
    return new Promise(resolve => {
      try{
        const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      }catch(_err){ resolve(null); }
    });
  }

  function idbSet(key, value){
    idbOpen().then(db => {
      if(!db) return;
      try{ db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(value, key); }catch(_err){ /* no-op */ }
    });
  }

  function idbDel(key){
    idbOpen().then(db => {
      if(!db) return;
      try{ db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).delete(key); }catch(_err){ /* no-op */ }
    });
  }

  function currentUserCacheKey(kind){
    const userId = state.currentUser?.id || 'anonymous';
    return `inksight:${SAVED_CACHE_VERSION}:${userId}:${kind}`;
  }

  function readSessionCache(kind){
    try{
      const raw = sessionStorage.getItem(currentUserCacheKey(kind));
      if(!raw) return null;
      const payload = JSON.parse(raw);
      if(!payload || Date.now() - n(payload.savedAt) > SAVED_CACHE_TTL) return null;
      return payload.value || null;
    }catch(_err){ return null; }
  }

  function writeSessionCache(kind, value){
    try{
      const payload = JSON.stringify({ savedAt:Date.now(), value });
      // Les détails peuvent être volumineux : on cache seulement si le navigateur accepte.
      if(payload.length > 4500000) return;
      sessionStorage.setItem(currentUserCacheKey(kind), payload);
    }catch(_err){ /* Cache opportuniste uniquement. */ }
  }

  function clearSessionCacheForCurrentUser(){
    try{
      ['saved-match-summaries','saved-analytics-details'].forEach(kind => sessionStorage.removeItem(currentUserCacheKey(kind)));
    }catch(_err){ /* no-op */ }
    idbDel(currentUserCacheKey('saved-analytics-details'));
  }

  function hydrateSavedMatchesFromCache(){
    if(!state.currentUser || state.savedMatchesLoaded || state.savedMatchesLoading) return false;
    const cachedRows = readSessionCache('saved-match-summaries');
    if(!Array.isArray(cachedRows) || !cachedRows.length) return false;
    // Filet : un cache antérieur a pu contenir des matchs de coéquipiers (avant le
    // filtrage par utilisateur). On ne garde que les matchs de l'utilisateur courant.
    state.savedMatches = cachedRows.filter(r => !state.currentUser?.id || !r.user_id || r.user_id === state.currentUser.id);
    state.savedMatchesLoaded = true;
    if(!state.selectedSavedMatchId && state.savedMatches.length) state.selectedSavedMatchId = state.savedMatches[0].id;
    renderPerformanceData();
    return true;
  }

  async function readCachedAnalyticsForIds(ids=[]){
    const payload = await idbGet(currentUserCacheKey('saved-analytics-details'));
    if(!payload || Date.now() - n(payload.savedAt) > ANALYTICS_CACHE_TTL) return null;
    const cached = payload.value;
    if(!cached || !Array.isArray(cached.loadedIds)) return null;
    const wanted = new Set(ids);
    const loaded = new Set(cached.loadedIds.filter(Boolean));
    if(!areAllIdsInSet(ids, loaded)) return null;
    const keep = row => wanted.has(row?.match_id);
    return {
      key:ids.join('|'),
      loadedIds:[...loaded].filter(id => wanted.has(id)).sort(),
      games:(cached.games || []).filter(keep),
      cardStats:(cached.cardStats || []).filter(keep),
      turnStats:(cached.turnStats || []).filter(keep)
    };
  }

  function writeCachedAnalytics(details){
    const ids = uniqueSavedMatchIds([
      ...(details?.games || []).map(row => ({ id:row.match_id })),
      ...(details?.cardStats || []).map(row => ({ id:row.match_id })),
      ...(details?.turnStats || []).map(row => ({ id:row.match_id }))
    ]);
    idbSet(currentUserCacheKey('saved-analytics-details'), {
      savedAt:Date.now(),
      value:{
        loadedIds:ids,
        games:Array.isArray(details?.games) ? details.games : [],
        cardStats:Array.isArray(details?.cardStats) ? details.cardStats : [],
        turnStats:Array.isArray(details?.turnStats) ? details.turnStats : []
      }
    });
  }

  function savedAnalyticsLoadedIdSet(){
    const explicit = Array.isArray(state.savedAnalytics?.loadedIds) ? state.savedAnalytics.loadedIds : [];
    if(explicit.length) return new Set(explicit.filter(Boolean));
    const inferred = [
      ...(state.savedAnalytics?.games || []),
      ...(state.savedAnalytics?.cardStats || []),
      ...(state.savedAnalytics?.turnStats || [])
    ].map(row => row?.match_id).filter(Boolean);
    return new Set(inferred);
  }

  function savedAnalyticsLoadingIdSet(){
    const ids = Array.isArray(state.savedAnalytics?.loadingIds) ? state.savedAnalytics.loadingIds : [];
    return new Set(ids.filter(Boolean));
  }

  function areAllIdsInSet(ids=[], set=new Set()){
    return (ids || []).every(id => set.has(id));
  }

  function mergeAnalyticsRowsByRequestedIds(oldRows=[], newRows=[], requestedIds=[]){
    const requested = new Set(requestedIds);
    return [
      ...(Array.isArray(oldRows) ? oldRows.filter(row => !requested.has(row?.match_id)) : []),
      ...(Array.isArray(newRows) ? newRows : [])
    ];
  }

  async function refreshSavedAnalytics(rows=[], options={}){
    const ids = uniqueSavedMatchIds(rows);
    const key = ids.join('|');
    if(!ids.length){
      state.savedAnalytics = { games:[], cardStats:[], turnStats:[], key:'', loading:false, loadingIds:[], loadedIds:[], error:'' };
      return state.savedAnalytics;
    }

    const loadedIds = savedAnalyticsLoadedIdSet();
    const alreadyLoaded = !options.force && areAllIdsInSet(ids, loadedIds) && !state.savedAnalytics?.error;
    if(alreadyLoaded){
      state.savedAnalytics = {
        ...(state.savedAnalytics || {}),
        key,
        loading:false,
        loadingIds:[],
        loadedIds:[...loadedIds].sort(),
        error:''
      };
      return state.savedAnalytics;
    }

    if(!options.force){
      const cached = await readCachedAnalyticsForIds(ids);
      if(cached){
        state.savedAnalytics = {
          ...cached,
          loading:false,
          loadingIds:[],
          error:''
        };
        return state.savedAnalytics;
      }
    }

    if(state.savedAnalytics?.loading){
      const loadingIds = savedAnalyticsLoadingIdSet();
      if(areAllIdsInSet(ids, loadingIds)){
        return state.savedAnalytics;
      }
      // Évite plusieurs appels Supabase concurrents sur mobile. Le rendu gardera un état
      // de chargement propre jusqu'à la fin du batch déjà lancé.
      return state.savedAnalytics;
    }

    const fetchIds = options.force ? ids : ids.filter(id => !loadedIds.has(id));
    if(!fetchIds.length){
      state.savedAnalytics = {
        ...(state.savedAnalytics || {}),
        key,
        loading:false,
        loadingIds:[],
        loadedIds:[...loadedIds].sort(),
        error:''
      };
      return state.savedAnalytics;
    }

    try{
      state.savedAnalytics = {
        ...(state.savedAnalytics || {}),
        key,
        loading:true,
        loadingIds:fetchIds,
        error:''
      };
      const detailsStartedAt = perfNow();
      const details = await listSavedAnalyticsDetails(fetchIds);
      perfMark('saved analytics details query', detailsStartedAt, { requestedIds:fetchIds.length, games:details?.games?.length || 0, cardStats:details?.cardStats?.length || 0, turnStats:details?.turnStats?.length || 0 });
      const nextLoadedIds = new Set(options.force ? [] : [...loadedIds]);
      fetchIds.forEach(id => nextLoadedIds.add(id));
      state.savedAnalytics = {
        key,
        loading:false,
        loadingIds:[],
        loadedIds:[...nextLoadedIds].sort(),
        error:'',
        games:options.force ? (Array.isArray(details?.games) ? details.games : []) : mergeAnalyticsRowsByRequestedIds(state.savedAnalytics?.games, details?.games, fetchIds),
        cardStats:options.force ? (Array.isArray(details?.cardStats) ? details.cardStats : []) : mergeAnalyticsRowsByRequestedIds(state.savedAnalytics?.cardStats, details?.cardStats, fetchIds),
        turnStats:options.force ? (Array.isArray(details?.turnStats) ? details.turnStats : []) : mergeAnalyticsRowsByRequestedIds(state.savedAnalytics?.turnStats, details?.turnStats, fetchIds)
      };
      writeCachedAnalytics(state.savedAnalytics);
    }catch(err){
      console.error(err);
      state.savedAnalytics = {
        ...(state.savedAnalytics || {}),
        key,
        loading:false,
        loadingIds:[],
        error:err.message || 'Données analytiques indisponibles.'
      };
    }
    return state.savedAnalytics;
  }

  function findDuplicateSavedMatch(m){
    return findDuplicateSavedMatchForData(m);
  }

  function findDuplicateSavedMatchForData(m){
    const apiMeta = apiMetadataForSavedData(m);
    const replaySha = replaySha256ForSavedData(m);
    const rows = state.savedMatches || [];
    if(apiMeta?.duelink_game_id){
      const byGame = rows.find(row => String(row.duelink_match_id || row.analysis_json?.duelink_game_id || row.api_metadata?.duelink_game_id || '') === String(apiMeta.duelink_game_id));
      if(byGame) return byGame;
    }
    if(apiMeta?.duelink_replay_id){
      const byReplay = rows.find(row => String(row.analysis_json?.duelink_replay_id || row.api_metadata?.duelink_replay_id || '') === String(apiMeta.duelink_replay_id));
      if(byReplay) return byReplay;
    }
    if(replaySha){
      const byHash = rows.find(row => String(row.replay_sha256 || row.analysis_json?.replay_sha256 || '') === String(replaySha));
      if(byHash) return byHash;
    }
    const signature = savedMatchSignatureFromM(m);
    if(!signature) return null;
    return rows.find(row => savedMatchSignatureFromRow(row) === signature) || null;
  }

  function savedMatchSignatureFromM(m){
    if(!m) return '';
    const global = !!(m.isBO3 || isGlobalView());
    const format = global ? 'BO3' : 'BO1';
    const played = detectPlayedAt(m) || '';
    const profiles = m.inkProfiles || buildInkProfiles(m);
    const matchup = m.matchupLabel || formatMatchupLabel(profiles) || '';
    const opponent = m.opponentName || m.first?.opponentName || '';
    const games = (m.sessions?.length ? m.sessions : (m.first ? [m.first] : [])).map((game, idx) => [idx + 1, n(game.finalMineLore), n(game.finalOppLore), n(game.turnCount), game.isWin ? 'W' : 'L'].join('-')).join('|');
    const score = global ? `${n(m.wins)}-${n(m.losses)}` : `${n(m.finalMineLore)}-${n(m.finalOppLore)}`;
    return slug([format, played ? played.slice(0,16) : '', opponent, matchup, score, games].join('::'));
  }

  function savedMatchSignatureFromRow(row){
    if(!row) return '';
    if(row.replay_fingerprint) return row.replay_fingerprint;
    const stored = row.analysis_json?.duplicate_signature;
    if(stored) return stored;
    const format = String(row.format || row.analysis_json?.format || 'BO1').toUpperCase();
    const played = getSavedMatchPlayedAt(row) || '';
    const opponent = row.opponent_name || row.analysis_json?.players?.opponent || '';
    const matchup = row.matchup_label || row.analysis_json?.matchup?.label || '';
    const score = row.score_label || '';
    const games = (row.analysis_json?.games || []).map((game, idx) => [idx + 1, n(game.finalMineLore), n(game.finalOppLore), n(game.turnCount), game.isWin ? 'W' : 'L'].join('-')).join('|');
    return slug([format, played ? String(played).slice(0,16) : '', opponent, matchup, score, games].join('::'));
  }

  function currentAppView(){
    return document.body?.dataset?.appView || 'analysis';
  }

  function currentPerformanceView(){
    return document.body?.dataset?.performanceView || 'stats';
  }

  function isStatsPerformanceViewActive(){
    return currentAppView() === 'performances' && currentPerformanceView() === 'stats';
  }

  function isHistoryPerformanceViewActive(){
    return currentAppView() === 'performances' && currentPerformanceView() === 'history';
  }

  function isAccountViewActive(){
    return currentAppView() === 'account';
  }

  function renderPerformanceData(){
    const safe = (label, fn) => {
      const startedAt = perfNow();
      try{ fn(); perfMark(`render ${label}`, startedAt); }
      catch(err){
        console.error(`[performances] ${label}`, err);
        if(els.historyStatus) els.historyStatus.textContent = `Erreur ${label} : ${err.message || err}`;
        if(label === 'historique' && els.historyList){
          els.historyList.innerHTML = `<div class="history-empty-state"><strong>Historique temporairement indisponible.</strong><span>${esc(err.message || err)}. Les autres sections restent utilisables.</span><button type="button" class="ghost-button compact" data-performance-view="stats">Retour aux statistiques</button></div>`;
        }
      }
    };

    const appView = currentAppView();
    if(appView === 'performances'){
      safe('filtres', renderPerformanceFilterPills);
      safe('team-ctx', updateTeamContextBars);
      if(isStatsPerformanceViewActive()) safe('statistiques', renderSavedStats);
      if(isHistoryPerformanceViewActive()) safe('historique', renderSavedHistory);
      return;
    }

    if(appView === 'account'){
      safe('compte', renderAccountPage);
    }
  }

  globalThis.INKSIGHT_renderPerformanceData = renderPerformanceData;

  function selectedValuesForMode(mode, key){
    const prefix = mode === 'stats' ? 'performance' : 'history';
    const map = {
      color:`${prefix}ColorFilter`,
      opponentColor:`${prefix}OpponentColorFilter`,
      deck:`${prefix}DeckFilter`,
      archetype:`${prefix}ArchetypeFilter`,
      result:`${prefix}ResultFilter`,
      format:`${prefix}FormatFilter`,
      tempo:`${prefix}TempoFilter`,
      pool:`${prefix}PoolFilter`,
      set:`${prefix}SetFilter`
    };
    return selectedFilterValues(map[key]);
  }

  function filteredSavedMatchesWithout(excludedIds=[]){
    const backup = {};
    excludedIds.forEach(id => {
      backup[id] = selectedFilterValues(id);
      clearSelectedFilterValues(id);
    });
    const rows = filteredSavedMatches('stats');
    Object.entries(backup).forEach(([id, values]) => setSelectedFilterValues(id, values));
    return rows;
  }

  function filteredSavedMatches(mode='history'){
    let rows = [...(state.savedMatches || [])].sort((a,b) => savedMatchPlayedTime(b) - savedMatchPlayedTime(a));
    // Stats : on écarte les formats limités (Sealed/Pack Rush/Draft), toutes encres
    // mélangées, qui n'ont pas de bicolorité construite et polluent les statistiques.
    // L'historique les conserve (mode 'history') pour rester exhaustif.
    if(mode === 'stats') rows = rows.filter(row => !isLimitedFormatRow(row));
    // Team history: only show matches explicitly shared with the team
    if(mode === 'history' && state.teamMode) rows = rows.filter(row => row.team_visible === true);
    const decks = selectedValuesForMode(mode, 'deck');
    const colors = selectedValuesForMode(mode, 'color');
    const opponentColors = selectedValuesForMode(mode, 'opponentColor');
    const archetypes = selectedValuesForMode(mode, 'archetype');
    const tempos = selectedValuesForMode(mode, 'tempo');
    const results = selectedValuesForMode(mode, 'result');
    const formats = selectedValuesForMode(mode, 'format');
    const pools = selectedValuesForMode(mode, 'pool');
    const sets = selectedValuesForMode(mode, 'set');
    const query = mode === 'history' ? String(els.historySearchInput?.value || '').trim().toLowerCase() : '';
    if(colors.length) rows = rows.filter(row => colors.includes(colorFilterKey(rowMineColors(row))));
    if(opponentColors.length) rows = rows.filter(row => opponentColors.includes(colorFilterKey(rowOpponentColors(row))));
    if(archetypes.length) rows = rows.filter(row => { const a = row.deck_profile_id ? getProfileArchetype(row.deck_profile_id) : null; return a && archetypes.includes(a.speed); });
    if(decks.length) rows = rows.filter(row => {
      const rid = String(row.deck_profile_id || '');
      const hasProfile = rid && state.deckProfiles.some(p => String(p.id) === rid);
      // deck values may be "|"-joined groups of profile IDs (merged similar versions),
      // ou un fourre-tout « noprofile:<couleurKey> » pour les matchs sans profil.
      return decks.some(d => {
        if(d.startsWith('noprofile:')){
          return !hasProfile && `noprofile:${colorFilterKey(rowMineColors(row)) || 'unknown'}` === d;
        }
        return d.split('|').includes(rid);
      }) || decks.includes(String(row.deck_name || ''));
    });
    if(results.length) rows = rows.filter(row => results.includes(row.result));
    if(formats.length) rows = rows.filter(row => formats.includes(String(row.format || '').toUpperCase()));
    if(tempos.length) rows = rows.filter(row => rowMatchesTempo(row, tempos));
    if(pools.length) rows = rows.filter(row => pools.includes(rowFormatPool(row)));
    if(sets.length) rows = rows.filter(row => sets.includes(rowSetNum(row)));
    const df = state.dateFilter?.[mode];
    if (df && df.preset !== 'all') {
      const now = Date.now();
      let fromMs = null;
      let toMs = null;
      if (df.preset === '1d') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fromMs = today.getTime();
      } else if (df.preset === '7d') {
        fromMs = now - 7 * 24 * 60 * 60 * 1000;
      } else if (df.preset === '30d') {
        fromMs = now - 30 * 24 * 60 * 60 * 1000;
      } else if (df.preset === '90d') {
        fromMs = now - 90 * 24 * 60 * 60 * 1000;
      } else if (df.preset === 'custom') {
        if (df.from) fromMs = new Date(df.from).getTime();
        if (df.to) {
          const d = new Date(df.to);
          d.setHours(23, 59, 59, 999);
          toMs = d.getTime();
        }
      }
      if (fromMs !== null || toMs !== null) {
        rows = rows.filter(row => {
          const t = savedMatchPlayedTime(row);
          if (!t) return false;
          if (fromMs !== null && t < fromMs) return false;
          if (toMs !== null && t > toMs) return false;
          return true;
        });
      }
    }
    if(query){
      rows = rows.filter(row => [row.title, row.matchup_label, row.opponent_name, row.deck_name, row.score_label]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query));
    }
    return rows;
  }

  function rowTempoValues(row){
    // Source la plus fiable : la colonne went_first remplie depuis l'API
    // Duels.ink (1 ligne = 1 game, OTP/OTD direct).
    if(row?.went_first === true) return ['otp'];
    if(row?.went_first === false) return ['otd'];
    // Repli pour les saves manuelles multi-games (BO3 zip) : on lit dans
    // analysis_json.games comme avant.
    const analysis = parseStoredJson(row?.analysis_json);
    const games = Array.isArray(analysis?.games) ? analysis.games : [];
    const values = [];
    games.forEach(game => {
      if(game?.otp === true) values.push('otp');
      else if(game?.otp === false) values.push('otd');
    });
    return [...new Set(values)];
  }

  function rowMatchesTempo(row, tempo){
    const values = arrayify(tempo).map(String).filter(value => value && value !== 'all');
    if(!values.length) return true;
    const rowValues = rowTempoValues(row);
    return values.some(value => rowValues.includes(value));
  }

  function selectedPerformanceTempo(){
    return selectedFilterValues('performanceTempoFilter').filter(value => ['otp','otd'].includes(value));
  }

  function gameMatchesSelectedTempo(game, tempo=selectedPerformanceTempo()){
    const values = arrayify(tempo).map(String).filter(value => ['otp','otd'].includes(value));
    if(!values.length) return true;
    if(values.includes('otp') && game?.otp === true) return true;
    if(values.includes('otd') && game?.otp === false) return true;
    return false;
  }

  function labelFromColorKey(key){
    return String(key || '').split('|').map(inkKey).filter(Boolean).map(inkLabel).join(' / ');
  }

  function reliabilityInfo(count){
    const total = n(count);
    if(total >= 10) return { tone:'solid', label:'Données solides' };
    if(total >= 4) return { tone:'medium', label:'À confirmer' };
    if(total >= 1) return { tone:'weak', label:'Trop peu de données' };
    return { tone:'empty', label:'Aucune donnée' };
  }

  function savedAnalyticsKeyForRows(rows=[]){
    return uniqueSavedMatchIds(rows).join('|');
  }

  function areSavedAnalyticsDetailsReadyForRows(rows=[]){
    const ids = uniqueSavedMatchIds(rows);
    if(!ids.length) return true;
    if(state.savedAnalytics?.error) return true;
    const loadedIds = savedAnalyticsLoadedIdSet();
    return areAllIdsInSet(ids, loadedIds);
  }

  function isSavedAnalyticsLoadingForRows(rows=[]){
    const ids = uniqueSavedMatchIds(rows);
    if(!ids.length || !state.savedAnalytics?.loading) return false;
    const loadingIds = savedAnalyticsLoadingIdSet();
    return areAllIdsInSet(ids, loadingIds) || !areSavedAnalyticsDetailsReadyForRows(rows);
  }

  function areLocalCardsReady(){
    return !!(state.cards?.length && state.index?.size);
  }

  function ensureLocalCardsForPerformance(){
    if(areLocalCardsReady()) return;
    ensureLocalCardsLoaded().then(() => renderPerformanceData()).catch(err => console.warn('Base cartes locale indisponible', err));
  }

  function performanceAnalyticsLoadingHtml(){
    return '<div class="deck-required"><strong>Chargement des statistiques détaillées…</strong><span>L’historique est affiché, mais les signaux cartes / mulligan / courbes sont encore en cours de récupération. Ils apparaîtront dès que les données complètes seront chargées.</span></div>';
  }

  function renderPerformanceInitialLoadingState(){
    const loadingTitle = 'Chargement…';
    const loadingHelp = 'InkSight récupère vos analyses sauvegardées. Les statistiques apparaîtront dès que l’historique est prêt.';
    if(els.performanceSavedCount) els.performanceSavedCount.textContent = '…';
    if(els.performanceWinrate) els.performanceWinrate.textContent = '…';
    if(els.performanceBo3Count) els.performanceBo3Count.textContent = '…';
    if(els.performanceFavoriteMatchup) els.performanceFavoriteMatchup.textContent = '…';
    if(els.performanceSampleLabel) els.performanceSampleLabel.textContent = 'Chargement';
    if(els.performanceSampleHelp) els.performanceSampleHelp.textContent = 'Historique InkSight en cours de récupération.';
    if(els.performanceCoachTitle) els.performanceCoachTitle.textContent = loadingTitle;
    if(els.performanceCoachText) els.performanceCoachText.textContent = loadingHelp;
    if(els.performanceBestSignal) els.performanceBestSignal.textContent = loadingTitle;
    if(els.performanceBestSignalText) els.performanceBestSignalText.textContent = loadingHelp;
    if(els.performanceWarningSignal) els.performanceWarningSignal.textContent = loadingTitle;
    if(els.performanceWarningSignalText) els.performanceWarningSignalText.textContent = loadingHelp;
    if(els.performanceActionPlan) els.performanceActionPlan.innerHTML = '<div class="deck-required"><strong>Chargement de l’historique…</strong><span>Les données enregistrées arrivent depuis Supabase. Aucune statistique partielle n’est affichée pendant cette étape.</span></div>';
    if(els.performanceTopLore) els.performanceTopLore.textContent = loadingTitle;
    if(els.performanceTopLoreHelp) els.performanceTopLoreHelp.textContent = loadingHelp;
    if(els.performanceMostInked) els.performanceMostInked.textContent = loadingTitle;
    if(els.performanceMostInkedHelp) els.performanceMostInkedHelp.textContent = loadingHelp;
    if(els.performanceOtpSplit) els.performanceOtpSplit.innerHTML = loadingTitle;
    if(els.performanceOtpSplitHelp) els.performanceOtpSplitHelp.textContent = loadingHelp;
    if(els.performanceFormatSplit) els.performanceFormatSplit.innerHTML = loadingTitle;
    if(els.performanceFormatSplitHelp) els.performanceFormatSplitHelp.textContent = loadingHelp;
    if(els.performanceAvgTurns) els.performanceAvgTurns.textContent = loadingTitle;
    if(els.performanceAvgTurnsHelp) els.performanceAvgTurnsHelp.textContent = loadingHelp;
    if(els.performanceTopDeckAvg) els.performanceTopDeckAvg.textContent = loadingTitle;
    if(els.performanceTopDeckAvgHelp) els.performanceTopDeckAvgHelp.textContent = loadingHelp;
    if(els.performanceAvgLore) els.performanceAvgLore.textContent = loadingTitle;
    if(els.performanceAvgLoreHelp) els.performanceAvgLoreHelp.textContent = loadingHelp;
    if(els.performanceDataQuality) els.performanceDataQuality.textContent = '…';
    if(els.performanceDataQualityHelp) els.performanceDataQualityHelp.textContent = loadingHelp;
    const html = '<div class="deck-required"><strong>Chargement de l’historique…</strong><span>InkSight prépare les statistiques enregistrées. Cette attente évite d’afficher des zéros ou des cartes incorrectes.</span></div>';
    renderPerformanceTable(els.performanceMatchupBreakdown, html);
    renderPerformanceTable(els.performanceCardImpactTable, html);
    renderPerformanceTable(els.performanceMulliganTable, html);
    renderPerformanceTable(els.performanceTurnCurveTable, html);
  }

  function renderSavedStats(){
    const loggedIn = !!state.currentUser;
    if(els.performanceLoginHint){
      els.performanceLoginHint.hidden = loggedIn && !state.cloudOffline;
      const strong = els.performanceLoginHint.querySelector('strong');
      const span = els.performanceLoginHint.querySelector('span');
      if(state.cloudOffline){
        if(strong) strong.textContent = 'Performances cloud indisponibles sur ce réseau.';
        if(span) span.textContent = 'L’analyse locale fonctionne toujours. Les statistiques sauvegardées reviendront dès que Supabase sera accessible.';
      }else{
        if(strong) strong.textContent = 'Connectez-vous pour voir vos performances.';
        if(span) span.textContent = 'Vos matchs sauvegardés sont liés à votre compte Discord.';
      }
    }
    if(loggedIn && !state.savedMatchesLoaded){
      applyPerformanceTheme();
      renderPerformanceInitialLoadingState();
      return;
    }
    const rows = filteredSavedMatches('stats');
    const total = rows.length;
    const wins = rows.filter(row => row.result === 'win').length;
    const bo3 = rows.filter(row => String(row.format || '').toUpperCase() === 'BO3').length;
    const bo1 = rows.filter(row => String(row.format || '').toUpperCase() !== 'BO3').length;
    const deckScoped = isPerformanceDataScoped();
    applyPerformanceTheme();
    const shouldLoadDeepAnalytics = loggedIn && deckScoped && rows.length > 0;
    const detailsReady = !shouldLoadDeepAnalytics || areSavedAnalyticsDetailsReadyForRows(rows);
    if(shouldLoadDeepAnalytics && !detailsReady && !state.savedAnalytics?.loading){
      refreshSavedAnalytics(rows, { background:true }).then(() => renderPerformanceData()).catch(err => console.warn('Détails stats indisponibles', err));
    }
    const cardBaseLoading = shouldLoadDeepAnalytics && detailsReady && !areLocalCardsReady();
    if(cardBaseLoading) ensureLocalCardsForPerformance();
    const analyticsLoading = shouldLoadDeepAnalytics && (!detailsReady || isSavedAnalyticsLoadingForRows(rows) || cardBaseLoading);
    document.querySelectorAll('.card-signal-card').forEach(card => { card.hidden = !deckScoped; });

    if(analyticsLoading){
      const reliability = reliabilityInfo(total);
      if(els.performanceSavedCount) els.performanceSavedCount.textContent = String(total);
      if(els.performanceWinrate) els.performanceWinrate.textContent = total ? `${Math.round((wins / total) * 100)}%` : '—';
      if(els.performanceBo3Count) els.performanceBo3Count.textContent = String(bo3);
      if(els.performanceSampleLabel) els.performanceSampleLabel.textContent = reliability.label;
      if(els.performanceSampleHelp) els.performanceSampleHelp.textContent = `${bo1} BO1${bo3 ? ` · ${bo3} BO3` : ''}`;
      renderPerformanceStreak([]);

      document.querySelectorAll('.card-signal-card').forEach(card => card.classList.toggle('is-muted', true));
      const loadingText = 'Chargement…';
      const loadingHelp = 'Les données détaillées Supabase sont encore en cours de récupération. Les signaux seront affichés uniquement quand l’échantillon complet sera disponible.';
      if(els.performanceTopLore) els.performanceTopLore.textContent = deckScoped ? loadingText : 'Choisissez un deck';
      if(els.performanceTopLoreHelp) els.performanceTopLoreHelp.textContent = deckScoped ? loadingHelp : 'Ce signal devient pertinent quand les matchs appartiennent au même deck.';
      if(els.performanceMostInked) els.performanceMostInked.textContent = deckScoped ? loadingText : 'Choisissez un deck';
      if(els.performanceMostInkedHelp) els.performanceMostInkedHelp.textContent = deckScoped ? loadingHelp : 'Évite de mélanger des cartes issues de stratégies différentes.';
      if(els.performanceOtpSplit) els.performanceOtpSplit.innerHTML = loadingText;
      if(els.performanceOtpSplitHelp) els.performanceOtpSplitHelp.textContent = loadingHelp;
      if(els.performanceFormatSplit) els.performanceFormatSplit.innerHTML = formatSplitBarsHtml(bo1, bo3);
      if(els.performanceFormatSplitHelp) els.performanceFormatSplitHelp.textContent = 'Répartition de vos analyses sauvegardées.';
      if(els.performanceAvgTurns) els.performanceAvgTurns.textContent = loadingText;
      if(els.performanceAvgTurnsHelp) els.performanceAvgTurnsHelp.textContent = loadingHelp;
      if(els.performanceTopDeckAvg) els.performanceTopDeckAvg.textContent = loadingText;
      if(els.performanceTopDeckAvgHelp) els.performanceTopDeckAvgHelp.textContent = loadingHelp;
      if(els.performanceAvgLore) els.performanceAvgLore.textContent = loadingText;
      if(els.performanceAvgLoreHelp) els.performanceAvgLoreHelp.textContent = loadingHelp;
      const scopedQuality = rows.map(row => rowQualityInfo(row));
      const scopedComplete = scopedQuality.filter(info => info.status === 'complete').length;
      const scopedPartial = scopedQuality.filter(info => info.status === 'partial').length;
      if(els.performanceDataQuality) els.performanceDataQuality.textContent = `${scopedComplete}/${rows.length || 0}`;
      if(els.performanceDataQualityHelp) els.performanceDataQualityHelp.textContent = rows.length ? `${scopedPartial} analyse(s) partielle(s) dans l’échantillon filtré.` : 'Aucune sauvegarde dans l’échantillon.';

      const loadingHtml = performanceAnalyticsLoadingHtml();
      renderPerformanceTable(els.performanceCardImpactTable, loadingHtml);
      renderPerformanceTable(els.performanceMulliganTable, loadingHtml);
      renderPerformanceTable(els.performanceTurnCurveTable, loadingHtml);
      const emptyAnalytics = { rows, games:[], cardRows:[], turnRows:[], cards:[], cardSignals:{ topLore:null, topInked:null }, playDraw:{ total:0 }, turnCurve:[], loreMilestones:[], mulliganLab:{}, deadWeight:[] };
      state.lastPerformanceAnalytics = emptyAnalytics;
      renderPerformanceCharts(emptyAnalytics);
      renderPerformanceDetailPanels();
      bindPerformanceFullListButtons();
      return;
    }

    const analytics = buildPerformanceAnalytics(rows);
    renderDeckDepthGlobal(analytics.games);
    const cardSignals = analytics.cardSignals;
    const playDraw = analytics.playDraw;

    const sampleGames = analytics.games.length;
    const sampleWins = analytics.games.filter(game => game.isWin).length;
    const reliability = reliabilityInfo(sampleGames || total);
    if(els.performanceSavedCount) els.performanceSavedCount.textContent = loggedIn ? String(sampleGames || total) : '—';
    if(els.performanceWinrate) els.performanceWinrate.textContent = loggedIn && sampleGames ? `${Math.round((sampleWins / sampleGames) * 100)}%` : (loggedIn && total ? `${Math.round((wins / total) * 100)}%` : '—');
    if(els.performanceBo3Count) els.performanceBo3Count.textContent = loggedIn ? String(bo3) : '—';
    renderPerformanceStreak(loggedIn ? analytics.games : []);
    if(els.performanceSampleLabel) els.performanceSampleLabel.textContent = loggedIn ? reliability.label : '—';
    if(els.performanceSampleHelp) els.performanceSampleHelp.textContent = loggedIn ? `${bo1} BO1${bo3 ? ` · ${bo3} BO3` : ''}` : 'Connectez-vous pour activer l’historique.';

    document.querySelectorAll('.card-signal-card').forEach(card => card.classList.toggle('is-muted', loggedIn && !deckScoped));
    if(!deckScoped){
      if(els.performanceTopLore) els.performanceTopLore.textContent = loggedIn ? 'Choisissez un deck' : '—';
      if(els.performanceTopLoreHelp) els.performanceTopLoreHelp.textContent = 'Ce signal devient pertinent quand les matchs appartiennent au même deck.';
      if(els.performanceMostInked) els.performanceMostInked.textContent = loggedIn ? 'Choisissez un deck' : '—';
      if(els.performanceMostInkedHelp) els.performanceMostInkedHelp.textContent = 'Évite de mélanger des cartes issues de stratégies différentes.';
    }else{
      if(els.performanceTopLore) els.performanceTopLore.innerHTML = loggedIn && cardSignals.topLore ? performanceMiniCardSignalHtml(cardSignals.topLore, `${cardSignals.topLore.lore} lore`) : '—';
      if(els.performanceTopLoreHelp) els.performanceTopLoreHelp.textContent = cardSignals.topLore ? `${cardSignals.topLore.played || 0} fois jouée · cliquez la carte pour le détail.` : 'Disponible après plusieurs analyses sauvegardées avec ce deck.';
      if(els.performanceMostInked) els.performanceMostInked.innerHTML = loggedIn && cardSignals.topInked ? performanceMiniCardSignalHtml(cardSignals.topInked, `${cardSignals.topInked.inked} encrage(s)`) : '—';
      if(els.performanceMostInkedHelp) els.performanceMostInkedHelp.textContent = cardSignals.topInked ? `${cardSignals.topInked.seen || 0} vues · à vérifier selon le plan de jeu.` : 'Disponible après plusieurs analyses sauvegardées avec ce deck.';
    }

    if(els.performanceOtpSplit) els.performanceOtpSplit.innerHTML = loggedIn && playDraw.total ? otpOtdBarsHtml(playDraw) : '—';
    if(els.performanceOtpSplitHelp) els.performanceOtpSplitHelp.textContent = playDraw.total ? `Premier : ${playDraw.otpWins} victoire(s) sur ${playDraw.otpTotal} · Second : ${playDraw.otdWins} victoire(s) sur ${playDraw.otdTotal}` : 'Aucune donnée premier / second disponible.';
    if(els.performanceFormatSplit) els.performanceFormatSplit.innerHTML = loggedIn ? formatSplitBarsHtml(bo1, bo3) : '—';
    if(els.performanceFormatSplitHelp) els.performanceFormatSplitHelp.textContent = loggedIn ? 'Répartition de vos analyses sauvegardées.' : 'Connectez-vous pour voir vos formats.';

    if(els.performanceAvgTurns) els.performanceAvgTurns.textContent = loggedIn && analytics.avgTurns ? `${analytics.avgTurns}` : '—';
    if(els.performanceAvgTurnsHelp) els.performanceAvgTurnsHelp.textContent = analytics.avgTurns ? `Durée moyenne des ${analytics.games.length} game(s) filtrée(s).` : 'Disponible avec les nouvelles sauvegardes V62+.';
    if(els.performanceTopDeckAvg) els.performanceTopDeckAvg.textContent = loggedIn && analytics.avgTopDeck !== null ? `${analytics.avgTopDeck}` : '—';
    if(els.performanceTopDeckAvgHelp) els.performanceTopDeckAvgHelp.textContent = analytics.avgTopDeck !== null ? 'Tours moyens terminés à 0 ou 1 carte en main.' : 'Donnée absente sur cet échantillon.';
    if(els.performanceAvgLore) els.performanceAvgLore.textContent = loggedIn && analytics.avgFinalLore !== null ? `${analytics.avgFinalLore}` : '—';
    if(els.performanceAvgLoreHelp) els.performanceAvgLoreHelp.textContent = analytics.avgFinalLore !== null ? 'Lore final moyen côté joueur.' : 'Donnée absente sur cet échantillon.';
    const scopedQuality = rows.map(row => rowQualityInfo(row));
    const scopedComplete = scopedQuality.filter(info => info.status === 'complete').length;
    const scopedPartial = scopedQuality.filter(info => info.status === 'partial').length;
    if(els.performanceDataQuality) els.performanceDataQuality.textContent = loggedIn ? `${scopedComplete}/${rows.length || 0}` : '—';
    if(els.performanceDataQualityHelp) els.performanceDataQualityHelp.textContent = rows.length ? `${scopedPartial} analyse(s) partielle(s) dans l’échantillon filtré.` : 'Aucune sauvegarde dans l’échantillon.';

    renderPerformanceCoach(analytics, { total, wins, bo1, bo3, deckScoped });
    renderPerformanceMatchups(rows, analytics, { deckScoped });

    renderPerformanceTable(els.performanceCardImpactTable, performanceCardImpactHtml(analytics));
    renderOpeningConsistency(analytics);
    renderPerformanceTable(els.performanceMulliganTable, performanceMulliganHtml(analytics));
    renderPerformanceTable(els.performanceTurnCurveTable, performanceTurnCurveHtml(analytics));
    state.lastPerformanceAnalytics = deckScoped ? analytics : { ...analytics, turnCurve:[] };
    renderPerformanceCharts(state.lastPerformanceAnalytics);
    renderPerformanceDetailPanels();
    bindPerformanceCardTiles();
    bindPerformanceFullListButtons();
  }

  function isPerformanceDeckScoped(){
    return isPerformanceDataScoped();
  }

  function isPerformanceDataScoped(){
    // Choix produit : on affiche toutes les stats par défaut. Dès que l'utilisateur
    // est connecté et possède des matchs sauvegardés, les sections détaillées
    // (cartes, mulligan, matchups, courbes, signaux) sont déverrouillées et agrègent
    // l'ensemble de l'échantillon. Les filtres viennent ensuite restreindre la vue.
    // Plus de verrouillage « Choisissez un deck » à l'arrivée sur les statistiques.
    if(state.currentUser && (state.savedMatches?.length || 0) > 0) return true;
    return selectedFilterValues('performanceColorFilter').length > 0 || selectedFilterValues('performanceDeckFilter').length > 0;
  }

  function selectedPerformanceColors(){
    const deckIds = selectedFilterValues('performanceDeckFilter');
    if(deckIds.length === 1){
      const primaryId = deckIds[0].split('|')[0];
      const profile = state.deckProfiles.find(item => String(item.id) === primaryId);
      if(profile) return arrayify(profile.colors).map(inkKey).filter(Boolean);
    }
    const colorKeys = selectedFilterValues('performanceColorFilter');
    if(colorKeys.length === 1) return colorKeys[0].split('|').map(inkKey).filter(Boolean);
    return [];
  }

  function applyPerformanceTheme(){
    const colors = selectedPerformanceColors();
    const theme = colors.length ? colors.map(c => INK_COLORS[c]).filter(Boolean) : [];
    const first = theme[0] || INK_COLORS.sapphire;
    const second = theme[1] || theme[0] || INK_COLORS.amber;
    document.documentElement.style.setProperty('--theme-color-1', first);
    document.documentElement.style.setProperty('--theme-color-2', second);
  }

  function otpOtdBarsHtml(playDraw){
    const otp = Math.max(0, Math.min(100, n(playDraw.otpRate)));
    const otd = Math.max(0, Math.min(100, n(playDraw.otdRate)));
    return `<div class="mini-bars mini-bars-otp">
      <div class="mini-bar-row"><span>Vous commencez</span><strong>${otp}%</strong><i><b style="width:${otp}%"></b></i><small>${n(playDraw.otpWins)} victoire(s) sur ${n(playDraw.otpTotal)} partie(s)</small></div>
      <div class="mini-bar-row"><span>Vous jouez second</span><strong>${otd}%</strong><i><b style="width:${otd}%"></b></i><small>${n(playDraw.otdWins)} victoire(s) sur ${n(playDraw.otdTotal)} partie(s)</small></div>
    </div>`;
  }

  function formatSplitBarsHtml(bo1, bo3){
    const total = Math.max(1, n(bo1) + n(bo3));
    const bo1Pct = Math.round((n(bo1) / total) * 100);
    const bo3Pct = Math.round((n(bo3) / total) * 100);
    return `<div class="format-split-viz"><div class="format-split-bar"><span style="width:${bo1Pct}%"></span><b style="width:${bo3Pct}%"></b></div><small>BO1 ${n(bo1)} · BO3 ${n(bo3)}</small></div>`;
  }


  function performanceAnalyticsMemoKey(rows){
    const ids = (rows || []).map(row => row?.id).filter(Boolean).sort().join(',');
    const a = state.savedAnalytics || {};
    const sig = `${(a.loadedIds || []).slice().sort().join('|')}#g${(a.games || []).length}c${(a.cardStats || []).length}t${(a.turnStats || []).length}L${a.loading ? 1 : 0}`;
    let tempo = '';
    try{ tempo = JSON.stringify(selectedPerformanceTempo()); }catch(_err){ tempo = ''; }
    return `${ids}||${sig}||${tempo}`;
  }

  function buildPerformanceAnalytics(rows){
    const memoKey = performanceAnalyticsMemoKey(rows);
    if(state._perfAnalyticsMemo && state._perfAnalyticsMemo.key === memoKey){
      return state._perfAnalyticsMemo.value;
    }
    const value = computePerformanceAnalytics(rows);
    state._perfAnalyticsMemo = { key:memoKey, value };
    return value;
  }

  function computePerformanceAnalytics(rows){
    const rowIds = new Set((rows || []).map(row => row.id).filter(Boolean));
    const rowsById = new Map((rows || []).map(row => [row.id, row]));
    const detailedGames = (state.savedAnalytics?.games || []).filter(row => rowIds.has(row.match_id));
    const detailedCards = (state.savedAnalytics?.cardStats || []).filter(row => rowIds.has(row.match_id));
    const detailedTurns = (state.savedAnalytics?.turnStats || []).filter(row => rowIds.has(row.match_id));
    const hasDetailedRows = detailedGames.length || detailedCards.length || detailedTurns.length;
    let games = detailedGames.length ? detailedGames.map(game => {
      const matchRow = rowsById.get(game.match_id) || {};
      const opponentColors = rowOpponentColors(matchRow);
      const json = gameJsonFromDetailRow(game);
      const stored = normalizeStoredGameAnalytics(json, 'mine');
      return {
        matchId:game.match_id,
        gameNumber:n(game.game_number),
        playedAt:game.played_at || matchRow.played_at || matchRow.created_at,
        isWin:!!game.is_win,
        otp:game.otp === true ? true : (game.otp === false ? false : null),
        turnCount:n(game.turn_count || stored.turnCount),
        cardsSeen:n(game.cards_seen ?? stored.cardsSeen ?? 0),
        finalMineLore:n(game.final_mine_lore ?? stored.finalMineLore),
        finalOppLore:n(game.final_opp_lore ?? stored.finalOppLore),
        loreSeries:stored.loreSeries,
        actionSeries:stored.actionSeries,
        proMetrics:stored.proMetrics,
        opponentColors,
        opponentKey:colorFilterKey(opponentColors) || 'unknown',
        opponentLabel:opponentColors.length ? opponentColors.map(inkLabel).join(' / ') : 'Adversaire inconnu',
        opponentName:matchRow.opponent_name || '',
        matchupLabel:matchRow.matchup_label || ''
      };
    }) : fallbackGamesFromSavedRows(rows);
    const tempo = selectedPerformanceTempo();
    games = games.filter(game => gameMatchesSelectedTempo(game, tempo));
    const gameKey = game => `${game.matchId || game.match_id || ''}::${n(game.gameNumber || game.game_number || 1)}`;
    const gameByKey = new Map(games.map(game => [gameKey(game), game]));
    const allowedGameKeys = new Set(gameByKey.keys());
    const rowAllowed = row => allowedGameKeys.has(`${row.match_id || row.matchId || ''}::${n(row.game_number || row.gameNumber || 1)}`);
    const performanceDeadWeight = aggregatePerformanceHandRetention(rows, detailedGames, games, gameByKey);
    const fallbackCardRows = fallbackCardRowsFromSavedRows(rows);
    const cardRows = chooseBestCardRows(detailedCards, fallbackCardRows, rows).filter(rowAllowed);
    const fallbackTurnRows = fallbackTurnRowsFromSavedRows(rows);
    const turnRows = chooseBestTurnRows(detailedTurns, fallbackTurnRows, rows).filter(rowAllowed);

    const mineCards = aggregateDetailedCards(cardRows.filter(row => row.owner === 'mine'), games, gameByKey);
    const mulliganCards = aggregateEmpiricalMulliganCards(rows, detailedGames, games, gameByKey);
    let cardValues = mergeEmpiricalMulliganIntoCards([...mineCards.values()], mulliganCards);
    // Étanchéité par bicolorité : si une seule bicolorité est sélectionnée, on
    // retire les cartes dont l'encre n'appartient pas à cette identité (ex. une
    // carte Rubis dans un deck Ambre/Saphir, héritée d'un match mal classé). Les
    // cartes sans couleur connue sont conservées pour éviter tout faux négatif.
    const identityInks = selectedPerformanceColors();
    if(identityInks.length){
      const allowedInks = new Set([...identityInks, 'inkless']);
      cardValues = cardValues.filter(card => {
        const inks = arrayify(card.colors).map(inkKey).filter(Boolean);
        return inks.length ? inks.every(ink => allowedInks.has(ink)) : true;
      });
    }
    const topLore = cardValues.filter(card => card.lore > 0).sort((a,b)=>b.lore-a.lore || b.played-a.played || a.name.localeCompare(b.name))[0] || null;
    const topInked = cardValues.filter(card => card.inked > 0).sort((a,b)=>b.inked-a.inked || b.seen-a.seen || a.name.localeCompare(b.name))[0] || null;
    const avgTurns = avg(games.map(game => game.turnCount).filter(Boolean));
    const avgFinalLore = avg(games.map(game => game.finalMineLore).filter(value => value !== null && value !== undefined));
    const avgTopDeck = avgTopDeckFromTurns(turnRows.filter(row => row.owner === 'mine'));
    const playDraw = aggregateGamesPlayDraw(games);

    return {
      rows,
      games,
      cardRows,
      turnRows,
      hasDetailedRows:!!hasDetailedRows,
      cardSignals:{ topLore, topInked },
      cards:cardValues,
      deadWeight:performanceDeadWeight,
      playDraw,
      avgTurns:avgTurns === null ? null : round1(avgTurns),
      avgFinalLore:avgFinalLore === null ? null : round1(avgFinalLore),
      avgTopDeck:avgTopDeck === null ? null : round1(avgTopDeck),
      turnCurve:aggregateTurnCurve(turnRows.filter(row => row.owner === 'mine'), games),
      loreMilestones:aggregateLoreMilestones(turnRows.filter(row => row.owner === 'mine'), games),
      mulliganLab:buildMulliganLabMeta(cardValues, games)
    };
  }


  function aggregatePerformanceHandRetention(savedRows=[], detailedGameRows=[], games=[], gameByKey=new Map()){
    const out = [];
    const seenGames = new Set();
    const pushGameRows = (matchId, gameNumber, gameJson) => {
      const key = `${matchId || ''}::${n(gameNumber || 1)}`;
      if(!matchId || seenGames.has(key)) return false;
      if(gameByKey?.size && !gameByKey.has(key)) return false;
      const list = extractMineHandRetentionRows(gameJson);
      if(!list.length) return false;
      seenGames.add(key);
      list.forEach(row => out.push({ ...row, matchId, match_id:matchId, gameNumber:n(gameNumber || 1) }));
      return true;
    };

    arrayify(detailedGameRows).forEach(row => {
      const json = gameJsonFromDetailRow(row);
      pushGameRows(row.match_id || row.matchId, row.game_number || row.gameNumber || json?.gameNumber || 1, json);
    });

    arrayify(savedRows).forEach(row => {
      const analysis = parseStoredJson(row.analysis_json);
      const gamesJson = Array.isArray(analysis?.games) ? analysis.games : [];
      if(gamesJson.length){
        gamesJson.forEach((game, index) => pushGameRows(row.id, game.gameNumber || game.game_number || index + 1, game));
      }else{
        pushGameRows(row.id, 1, analysis);
      }
    });

    return mergeHandRetention(out)
      .map(row => ({
        ...row,
        gamesWithSignal:new Set(arrayify(row.samples).map(sample => `${sample.matchId || sample.match_id || ''}::${n(sample.gameNumber || sample.game_number || 1)}`)).size || 0
      }))
      .sort((a,b) => n(b.stuckEpisodes) - n(a.stuckEpisodes) || n(b.maxHeldTurns) - n(a.maxHeldTurns) || n(b.averageHeldTurns) - n(a.averageHeldTurns));
  }

  function normalizeStoredMetrics(metrics={}){
    const source = metrics || {};
    const hand = arrayify(source.handByTurn || source.hand_by_turn).map(row => ({
      turn:n(row.turn),
      handCount:n(row.handCount ?? row.hand_count ?? row.handEnd ?? row.hand_end)
    })).filter(row => row.turn);
    const ink = arrayify(source.inkByTurn || source.ink_by_turn).map(row => ({
      turn:n(row.turn),
      capacity:n(row.capacity ?? row.ink_capacity),
      spent:n(row.spent ?? row.ink_spent),
      float:round1(row.float ?? row.ink_float),
      inked:n(row.inked),
      handStart:n(row.handStart ?? row.hand_start),
      handEnd:n(row.handEnd ?? row.hand_end)
    })).filter(row => row.turn);
    const board = arrayify(source.boardByTurn || source.board_by_turn).map(row => ({
      turn:n(row.turn),
      characters:n(row.characters ?? row.boardCharacters ?? row.board_characters),
      locations:n(row.locations ?? row.boardLocations ?? row.board_locations),
      lorePotential:n(row.lorePotential ?? row.boardLorePotential ?? row.board_lore_potential)
    })).filter(row => row.turn);
    return {
      ...source,
      handKnown:source.handKnown ?? source.hand_known ?? hand.length > 0,
      totalInkFloat:round1(source.totalInkFloat ?? source.total_ink_float),
      totalInkSpent:round1(source.totalInkSpent ?? source.total_ink_spent),
      questCount:n(source.questCount ?? source.quest_count),
      challengeCount:n(source.challengeCount ?? source.challenge_count),
      topDeckTurns:n(source.topDeckTurns ?? source.top_deck_turns),
      handByTurn:hand,
      inkByTurn:ink,
      boardByTurn:board
    };
  }

  function normalizeStoredGameAnalytics(json={}, owner='mine'){
    const raw = parseStoredJson(json);
    const metricsRoot = raw.metrics || raw.proMetrics || raw.pro_metrics || {};
    const ownerMetrics = metricsRoot?.[owner] || metricsRoot;
    return {
      turnCount:n(raw.turnCount ?? raw.turn_count),
      finalMineLore:n(raw.finalMineLore ?? raw.final_mine_lore),
      finalOppLore:n(raw.finalOppLore ?? raw.final_opp_lore),
      loreSeries:compactLoreSeries(raw.loreSeries || raw.lore_series || raw.charts?.lore_series || []),
      actionSeries:compactActionSeries(raw.actionSeries || raw.action_series || raw.charts?.action_series || []),
      proMetrics:normalizeStoredMetrics(raw.proMetrics || raw.pro_metrics || ownerMetrics || {})
    };
  }

  function gameAnalyticsTurnRows(game={}, owner='mine'){
    const rows = [];
    const loreSeries = compactLoreSeries(game.loreSeries || game.lore_series || game.charts?.lore_series || []);
    const actionSeries = compactActionSeries(game.actionSeries || game.action_series || game.charts?.action_series || []);
    const metrics = normalizeStoredMetrics(game.proMetrics || game.pro_metrics || game.metrics?.[owner] || game.metrics || {});
    const loreMap = new Map(loreSeries.map(row => [n(row.turn), owner === 'opponent' ? n(row.opponent) : n(row.mine)]));
    const actionMap = new Map(actionSeries.map(row => [n(row.turn), row]));
    const handMap = new Map((metrics.handByTurn || []).map(row => [n(row.turn), n(row.handCount)]));
    const inkMap = new Map((metrics.inkByTurn || []).map(row => [n(row.turn), row]));
    const maxTurn = Math.min(30, Math.max(
      n(game.turnCount || game.turn_count),
      ...loreSeries.map(row => n(row.turn)),
      ...actionSeries.map(row => n(row.turn)),
      ...(metrics.handByTurn || []).map(row => n(row.turn)),
      ...(metrics.inkByTurn || []).map(row => n(row.turn)),
      0
    ));
    let previousLore = 0;
    let previousHand = null;
    let previousInk = null;
    for(let turn = 1; turn <= maxTurn; turn += 1){
      if(loreMap.has(turn)) previousLore = n(loreMap.get(turn));
      if(handMap.has(turn)) previousHand = n(handMap.get(turn));
      if(inkMap.has(turn)) previousInk = inkMap.get(turn);
      const action = actionMap.get(turn) || {};
      rows.push({
        match_id:game.matchId || game.match_id,
        game_number:n(game.gameNumber || game.game_number || 1),
        turn,
        owner,
        lore:previousLore,
        hand_count:previousHand === null ? 0 : n(previousHand),
        ink_capacity:n(previousInk?.capacity),
        ink_spent:n(previousInk?.spent),
        ink_float:round1(previousInk?.float),
        inked:n(previousInk?.inked ?? action.ink),
        cards_played:n(action.play),
        quests:n(action.quest),
        challenges:n(action.challenge)
      });
    }
    return rows;
  }

  function mergeTurnRow(existing={}, fallback={}){
    const merged = { ...fallback, ...existing };
    ['lore','hand_count','ink_capacity','ink_spent','ink_float','inked','cards_played','quests','challenges'].forEach(key => {
      const primary = Number(existing?.[key]);
      const secondary = Number(fallback?.[key]);
      if((!Number.isFinite(primary) || (primary === 0 && Number.isFinite(secondary) && secondary > 0)) && Number.isFinite(secondary)){
        merged[key] = fallback[key];
      }
    });
    return merged;
  }

  function chooseBestTurnRows(detailedRows=[], fallbackRows=[], matchRows=[]){
    const map = new Map();
    const keyFor = row => `${row.match_id || row.matchId || ''}::${n(row.game_number || row.gameNumber || 1)}::${row.owner || 'mine'}::${n(row.turn)}`;
    (fallbackRows || []).forEach(row => {
      if(!row?.match_id && !row?.matchId) return;
      const key = keyFor(row);
      map.set(key, { ...row });
    });
    (detailedRows || []).forEach(row => {
      if(!row?.match_id && !row?.matchId) return;
      const key = keyFor(row);
      map.set(key, mergeTurnRow(row, map.get(key) || {}));
    });
    return [...map.values()].filter(row => n(row.turn));
  }

  function fallbackGamesFromSavedRows(rows){
    const games = [];
    (rows || []).forEach(row => {
      const analysis = parseStoredJson(row.analysis_json);
      const saved = Array.isArray(analysis?.games) ? analysis.games : [];
      if(saved.length){
        saved.forEach((game, index) => {
          const stored = normalizeStoredGameAnalytics(game, 'mine');
          const opponentColors = rowOpponentColors(row);
          games.push({
            matchId:row.id,
            gameNumber:n(game.gameNumber || game.game_number || index + 1),
            playedAt:game.playedAt || game.played_at || analysis?.played_at || row.created_at,
            isWin:!!(game.isWin ?? game.is_win),
            otp:game.otp === true ? true : (game.otp === false ? false : null),
            turnCount:n(game.turnCount ?? game.turn_count ?? stored.turnCount ?? row.total_turns ?? row.avg_turns),
            finalMineLore:n(game.finalMineLore ?? game.final_mine_lore ?? stored.finalMineLore ?? row.final_mine_lore),
            finalOppLore:n(game.finalOppLore ?? game.final_opp_lore ?? stored.finalOppLore ?? row.final_opp_lore),
            loreSeries:stored.loreSeries,
            actionSeries:stored.actionSeries,
            proMetrics:stored.proMetrics,
            opponentColors,
            opponentKey:colorFilterKey(opponentColors) || 'unknown',
            opponentLabel:opponentColors.length ? opponentColors.map(inkLabel).join(' / ') : 'Adversaire inconnu',
            opponentName:row.opponent_name || '',
            matchupLabel:row.matchup_label || ''
          });
        });
      }else{
        const stored = normalizeStoredGameAnalytics(analysis, 'mine');
        const opponentColors = rowOpponentColors(row);
        games.push({
          matchId:row.id,
          gameNumber:1,
          playedAt:analysis?.played_at || row.created_at,
          isWin:row.result === 'win',
          otp:null,
          turnCount:n(row.total_turns || row.avg_turns || stored.turnCount),
          finalMineLore:n(row.final_mine_lore ?? stored.finalMineLore),
          finalOppLore:n(row.final_opp_lore ?? stored.finalOppLore),
          loreSeries:stored.loreSeries,
          actionSeries:stored.actionSeries,
          proMetrics:stored.proMetrics,
          opponentColors,
          opponentKey:colorFilterKey(opponentColors) || 'unknown',
          opponentLabel:opponentColors.length ? opponentColors.map(inkLabel).join(' / ') : 'Adversaire inconnu',
          opponentName:row.opponent_name || '',
          matchupLabel:row.matchup_label || ''
        });
      }
    });
    return games;
  }

  function fallbackCardRowsFromSavedRows(rows){
    const out = [];
    (rows || []).forEach(row => {
      const cards = row.analysis_json?.cards?.mine || [];
      cards.forEach(card => out.push({
        match_id:row.id,
        game_number:1,
        owner:'mine',
        card_key:card.key || card.name,
        card_name:card.name,
        card_type:card.type,
        colors:card.colors || [],
        seen:n(card.seen),
        in_opening_hand:0,
        kept_mulligan:0,
        replaced_mulligan:0,
        played:n(card.played),
        inked:n(card.inked),
        inkedFromHand:n(card.inkedFromHand),
        inkedFromDiscard:n(card.inkedFromDiscard),
        inkedFromBoard:n(card.inkedFromBoard),
        inkedFromDeck:n(card.inkedFromDeck),
        inkedFromUnknown:n(card.inkedFromUnknown),
        quest_count:n(card.quest),
        lore_generated:n(card.lore),
        lore_actions:n(card.loreActions),
        challenge_count:n(card.challenge),
        avg_turn:card.avgTurn
      }));
    });
    return out;
  }

  function chooseBestCardRows(detailedRows=[], fallbackRows=[], matchRows=[]){
    const byMatch = (rows, field='match_id') => {
      const map = new Map();
      (rows || []).forEach(row => {
        const id = row?.[field];
        if(!id) return;
        const list = map.get(id) || [];
        list.push(row);
        map.set(id, list);
      });
      return map;
    };
    const detailedByMatch = byMatch(detailedRows, 'match_id');
    const fallbackByMatch = byMatch(fallbackRows, 'match_id');
    const ids = new Set([
      ...(matchRows || []).map(row => row.id).filter(Boolean),
      ...detailedByMatch.keys(),
      ...fallbackByMatch.keys()
    ]);
    const out = [];
    ids.forEach(id => {
      const detailed = detailedByMatch.get(id) || [];
      const fallback = fallbackByMatch.get(id) || [];
      if(!fallback.length){ out.push(...detailed); return; }
      if(!detailed.length){ out.push(...fallback); return; }
      const detailedScore = cardRowsCompletenessScore(detailed);
      const fallbackScore = cardRowsCompletenessScore(fallback);
      // V89: old saved_card_stats rows can be partial/stale after bulk imports or schema migrations.
      // Prefer the source that carries the richer per-match totals, otherwise keep detailed rows for better game-level samples.
      if(fallbackScore > detailedScore * 1.08 || fallback.length > detailed.length * 1.35){
        out.push(...fallback);
      }else{
        out.push(...detailed);
      }
    });
    return out;
  }

  function cardRowsCompletenessScore(rows=[]){
    return (rows || []).reduce((total, row) => total
      + 1
      + n(row.seen)
      + n(row.played)
      + n(row.inked)
      + n(row.quest_count)
      + n(row.lore_generated)
      + n(row.challenge_count)
      + n(row.in_opening_hand)
      + n(row.kept_mulligan)
      + n(row.replaced_mulligan), 0);
  }

  function fallbackTurnRowsFromSavedRows(rows){
    const out = [];
    (rows || []).forEach(row => {
      const analysis = parseStoredJson(row.analysis_json);
      const savedGames = Array.isArray(analysis?.games) ? analysis.games : [];
      if(savedGames.length){
        savedGames.forEach((game, index) => {
          const stored = normalizeStoredGameAnalytics(game, 'mine');
          out.push(...gameAnalyticsTurnRows({
            ...stored,
            matchId:row.id,
            gameNumber:n(game.gameNumber || game.game_number || index + 1),
            turnCount:n(game.turnCount ?? game.turn_count ?? row.total_turns ?? row.avg_turns ?? stored.turnCount),
            finalMineLore:n(game.finalMineLore ?? game.final_mine_lore ?? row.final_mine_lore ?? stored.finalMineLore),
            finalOppLore:n(game.finalOppLore ?? game.final_opp_lore ?? row.final_opp_lore ?? stored.finalOppLore)
          }, 'mine'));
        });
      }else{
        const stored = normalizeStoredGameAnalytics(analysis, 'mine');
        out.push(...gameAnalyticsTurnRows({
          ...stored,
          matchId:row.id,
          gameNumber:1,
          turnCount:n(row.total_turns || row.avg_turns || stored.turnCount),
          finalMineLore:n(row.final_mine_lore ?? stored.finalMineLore),
          finalOppLore:n(row.final_opp_lore ?? stored.finalOppLore)
        }, 'mine'));
      }
    });
    return out;
  }


  function parseStoredJson(value){
    if(!value) return {};
    if(typeof value === 'object') return value;
    if(typeof value === 'string'){
      try{ return JSON.parse(value); }catch(_err){ return {}; }
    }
    return {};
  }

  function gameJsonFromDetailRow(row){
    const json = parseStoredJson(row?.game_json);
    if(json && Object.keys(json).length) return json;
    return parseStoredJson(row?.analysis_json);
  }


  function extractMineHandRetentionRows(gameJson={}){
    const direct = gameJson?.handRetention || gameJson?.deadWeight || gameJson?.dead_weight;
    if(Array.isArray(direct)) return direct;
    const nested = gameJson?.hand_retention || gameJson?.handRetention;
    if(Array.isArray(nested)) return nested;
    if(nested && typeof nested === 'object'){
      if(Array.isArray(nested.mine)) return nested.mine;
      if(Array.isArray(nested.player)) return nested.player;
      if(Array.isArray(nested.me)) return nested.me;
    }
    return [];
  }

  function savedGameRowsForMulligan(savedRows=[], detailedGameRows=[]){
    const out = [];
    if(Array.isArray(detailedGameRows) && detailedGameRows.length){
      detailedGameRows.forEach(row => {
        const json = gameJsonFromDetailRow(row);
        if(json?.mulligan){
          out.push({
            match_id:row.match_id,
            game_number:n(row.game_number || json.gameNumber || 1),
            game_json:json
          });
        }
      });
    }
    (savedRows || []).forEach(row => {
      const analysis = parseStoredJson(row.analysis_json);
      const games = Array.isArray(analysis?.games) ? analysis.games : [];
      if(games.length){
        games.forEach((game, index) => {
          if(!game?.mulligan) return;
          out.push({
            match_id:row.id,
            game_number:n(game.gameNumber || game.game_number || index + 1),
            game_json:game
          });
        });
      }else if(analysis?.mulligan){
        out.push({
          match_id:row.id,
          game_number:1,
          game_json:analysis
        });
      }
    });
    const byGame = new Map();
    out.forEach(row => {
      const key = `${row.match_id || ''}::${n(row.game_number || 1)}`;
      const json = gameJsonFromDetailRow(row);
      if(!row.match_id || !json?.mulligan) return;
      const current = byGame.get(key);
      const retentionCount = extractMineHandRetentionRows(json).length;
      const currentRetentionCount = current ? extractMineHandRetentionRows(gameJsonFromDetailRow(current)).length : -1;
      // Prefer the row that also carries Dead Weight / hand-retention data.
      // Detailed Supabase game rows from older saves may contain mulligan but no hand_retention,
      // while analysis_json.games contains both.
      if(!current || retentionCount > currentRetentionCount) byGame.set(key, row);
    });
    return [...byGame.values()];
  }

  function createMulliganCardSeed(card){
    const hydrated = hydrateCard(card || {});
    const name = fullName(hydrated) || card?.name || card?.fullName || mulliganStableCardKey(card);
    const key = cardKey(hydrated) || slug(name) || card?.key || '';
    return {
      key,
      name,
      type:typeLabel(hydrated.type || card?.type || ''),
      colors:arrayify(hydrated.colors?.length ? hydrated.colors : card?.colors).map(inkLabel).filter(Boolean),
      cost:nullable(hydrated.cost ?? card?.cost),
      inkable:hydrated.inkable ?? card?.inkable,
      image:hydrated.imageSmall || hydrated.image || card?.image || card?.imageSmall || ''
    };
  }

  function mergeMulliganCardSeed(existing, seed){
    if(!seed) return existing;
    if(!existing) return seed;
    return {
      ...existing,
      key:existing.key || seed.key,
      name:existing.name || seed.name,
      type:existing.type || seed.type,
      colors:arrayify(existing.colors).length ? existing.colors : seed.colors,
      cost:existing.cost ?? seed.cost,
      inkable:existing.inkable ?? seed.inkable,
      image:existing.image || seed.image
    };
  }

  function handRetentionIdentityTokens(row={}){
    const card = hydrateCard(row.card || { fullName:row.cardName, id:row.cardKey, cost:row.cost, inkable:row.inkable });
    return [row.cardKey, row.cardName, cardKey(card), statCardKey(card), fullName(card), card.name]
      .filter(Boolean)
      .map(value => slug(String(value)))
      .filter(Boolean);
  }

  function mulliganSeedIdentityTokens(seed={}){
    return [seed.key, seed.name, fullName(seed), cardKey(seed), statCardKey(seed)]
      .filter(Boolean)
      .map(value => slug(String(value)))
      .filter(Boolean);
  }

  function findHandRetentionForMulliganSeed(seed={}, retentionRows=[]){
    const wanted = new Set(mulliganSeedIdentityTokens(seed));
    if(!wanted.size) return null;
    return arrayify(retentionRows).find(row => handRetentionIdentityTokens(row).some(token => wanted.has(token))) || null;
  }

  function compactMulliganKeepRetention(row){
    if(!row) return null;
    const episodes = Math.max(1, n(row.episodes));
    const totalHeld = row.totalHeldTurns !== undefined ? n(row.totalHeldTurns) : round1(n(row.averageHeldTurns) * episodes);
    const exits = row.exits || {};
    return {
      episodes,
      totalHeldTurns:totalHeld,
      averageHeldTurns:round1(totalHeld / episodes),
      maxHeldTurns:n(row.maxHeldTurns),
      stuckEpisodes:n(row.stuckEpisodes),
      stuckRate:round1((n(row.stuckEpisodes) / episodes) * 100),
      stillInHand:n(exits.stillInHand),
      played:n(exits.played),
      inked:n(exits.inked),
      representative:row.representative || null
    };
  }

  function addMulliganKeepRetention(item, row){
    const compact = compactMulliganKeepRetention(row);
    if(!compact) return item;
    item.keepRetentionEpisodes = n(item.keepRetentionEpisodes) + n(compact.episodes);
    item.keepRetentionTotalHeld = n(item.keepRetentionTotalHeld) + n(compact.totalHeldTurns);
    item.keepRetentionStuck = n(item.keepRetentionStuck) + n(compact.stuckEpisodes);
    item.keepRetentionStillInHand = n(item.keepRetentionStillInHand) + n(compact.stillInHand);
    item.keepRetentionPlayed = n(item.keepRetentionPlayed) + n(compact.played);
    item.keepRetentionInked = n(item.keepRetentionInked) + n(compact.inked);
    item.keepRetentionMax = Math.max(n(item.keepRetentionMax), n(compact.maxHeldTurns));
    const rep = compact.representative;
    if(rep && (!item.keepRetentionRepresentative || n(rep.heldTurns) > n(item.keepRetentionRepresentative.heldTurns))){
      item.keepRetentionRepresentative = rep;
    }
    return item;
  }

  function summarizeMulliganRetentionFromSamples(samples=[]){
    const out = { keepRetentionEpisodes:0, keepRetentionTotalHeld:0, keepRetentionStuck:0, keepRetentionStillInHand:0, keepRetentionPlayed:0, keepRetentionInked:0, keepRetentionMax:0, keepRetentionRepresentative:null };
    arrayify(samples).forEach(sample => {
      if(n(sample.kept) <= 0) return;
      const dw = sample.deadWeight;
      if(!dw) return;
      out.keepRetentionEpisodes += n(dw.episodes);
      out.keepRetentionTotalHeld += n(dw.totalHeldTurns);
      out.keepRetentionStuck += n(dw.stuckEpisodes);
      out.keepRetentionStillInHand += n(dw.stillInHand);
      out.keepRetentionPlayed += n(dw.played);
      out.keepRetentionInked += n(dw.inked);
      out.keepRetentionMax = Math.max(out.keepRetentionMax, n(dw.maxHeldTurns));
      const rep = dw.representative;
      if(rep && (!out.keepRetentionRepresentative || n(rep.heldTurns) > n(out.keepRetentionRepresentative.heldTurns))) out.keepRetentionRepresentative = rep;
    });
    return applyMulliganRetentionSummary(out, out);
  }

  function applyMulliganRetentionSummary(target, source){
    const episodes = n(source.keepRetentionEpisodes);
    target.keepRetentionEpisodes = episodes;
    target.keepRetentionAvg = episodes ? round1(n(source.keepRetentionTotalHeld) / episodes) : null;
    target.keepRetentionStuckRate = episodes ? round1((n(source.keepRetentionStuck) / episodes) * 100) : null;
    target.keepRetentionMax = n(source.keepRetentionMax);
    target.keepRetentionStuck = n(source.keepRetentionStuck);
    target.keepRetentionStillInHand = n(source.keepRetentionStillInHand);
    target.keepRetentionPlayed = n(source.keepRetentionPlayed);
    target.keepRetentionInked = n(source.keepRetentionInked);
    target.keepRetentionRepresentative = source.keepRetentionRepresentative || target.keepRetentionRepresentative || null;
    return target;
  }

  function mulliganDeadWeightView(card={}){
    const episodes = n(card.keepRetentionEpisodes);
    if(!episodes) return { hasSignal:false, label:'', detail:'', tone:'neutral' };
    const avgHeld = round1(card.keepRetentionAvg);
    const stuckRate = round1(card.keepRetentionStuckRate);
    const still = n(card.keepRetentionStillInHand);
    const maxHeld = n(card.keepRetentionMax);
    const uninkable = card.inkable === false || performanceCardView(card).inkable === false;
    let label = 'Sort vite après keep';
    let tone = 'good';
    if(still > 0 || stuckRate >= 50 || avgHeld >= 4){ label = 'Keep risqué'; tone = 'danger'; }
    else if(stuckRate >= 25 || avgHeld >= 3 || (uninkable && avgHeld >= 2.5)){ label = 'Keep à surveiller'; tone = 'context'; }
    const detail = `Après keep : ${avgHeld}T`; // Version mobile courte : l’explication complète reste dans le détail / info.
    return { hasSignal:true, label, detail, tone, avgHeld, stuckRate, maxHeld, stillInHand:still };
  }

  function aggregateEmpiricalMulliganCards(savedRows=[], detailedGameRows=[], games=[], gameByKey=new Map()){
    const rows = savedGameRowsForMulligan(savedRows, detailedGameRows);
    const map = new Map();

    rows.forEach(row => {
      const gameNumber = n(row.game_number || 1);
      const keyForGame = `${row.match_id}::${gameNumber}`;
      if(gameByKey?.size && !gameByKey.has(keyForGame)) return;
      const g = gameByKey.get(keyForGame) || (games || []).find(game => game.matchId === row.match_id && n(game.gameNumber) === gameNumber) || {};
      const gameJson = gameJsonFromDetailRow(row) || {};
      const mulligan = gameJson?.mulligan || {};
      const retentionRows = extractMineHandRetentionRows(gameJson);
      const split = splitMulliganInitialCards(mulligan);
      const initialByKey = new Map();

      split.initialCards.forEach(card => {
        const key = mulliganStableCardKey(card);
        if(!key) return;
        const item = initialByKey.get(key) || { seed:null, opening:0, kept:0, replaced:0 };
        item.seed = mergeMulliganCardSeed(item.seed, createMulliganCardSeed(card));
        item.opening += 1;
        initialByKey.set(key, item);
      });

      split.keptCards.forEach(card => {
        const key = mulliganStableCardKey(card);
        if(!key) return;
        const item = initialByKey.get(key) || { seed:null, opening:0, kept:0, replaced:0 };
        item.seed = mergeMulliganCardSeed(item.seed, createMulliganCardSeed(card));
        item.kept += 1;
        initialByKey.set(key, item);
      });

      split.thrownCards.forEach(card => {
        const key = mulliganStableCardKey(card);
        if(!key) return;
        const item = initialByKey.get(key) || { seed:null, opening:0, kept:0, replaced:0 };
        item.seed = mergeMulliganCardSeed(item.seed, createMulliganCardSeed(card));
        item.replaced += 1;
        initialByKey.set(key, item);
      });

      initialByKey.forEach((sample, key) => {
        const seed = sample.seed || createMulliganCardSeed({ name:key });
        const item = map.get(key) || {
          key:seed.key || slug(key),
          name:seed.name || key,
          type:seed.type || '',
          colors:seed.colors || [],
          cost:seed.cost,
          inkable:seed.inkable,
          image:seed.image || '',
          seen:0, played:0, inked:0, quest:0, lore:0, challenge:0,
          opening:0, kept:0, replaced:0,
          gamesSeen:0, winsSeen:0, gamesNotSeen:0, winsNotSeen:0, gamesPlayed:0, winsPlayed:0, keptGames:0, keptWins:0,
          keepRetentionEpisodes:0, keepRetentionTotalHeld:0, keepRetentionStuck:0, keepRetentionStillInHand:0, keepRetentionPlayed:0, keepRetentionInked:0, keepRetentionMax:0, keepRetentionRepresentative:null,
          firstTurns:[], samples:[]
        };

        item.key = item.key || seed.key || slug(key);
        item.name = item.name || seed.name || key;
        item.type = item.type || seed.type || '';
        item.colors = arrayify(item.colors).length ? item.colors : (seed.colors || []);
        item.cost = item.cost ?? seed.cost;
        item.inkable = item.inkable ?? seed.inkable;
        item.image = item.image || seed.image || '';

        item.opening += n(sample.opening);
        item.kept += n(sample.kept);
        item.replaced += n(sample.replaced);
        const keptInThisGame = n(sample.kept) > 0;
        const keepRetention = keptInThisGame ? findHandRetentionForMulliganSeed(seed, retentionRows) : null;
        if(keptInThisGame){
          item.keptGames += 1;
          if(g.isWin) item.keptWins += 1;
          addMulliganKeepRetention(item, keepRetention);
        }
        item.samples.push({
          matchId:row.match_id,
          gameNumber,
          isWin:!!g.isWin,
          otp:g.otp === true ? true : (g.otp === false ? false : null),
          opponentKey:g.opponentKey || 'unknown',
          opponentLabel:g.opponentLabel || 'Adversaire inconnu',
          opponentColors:g.opponentColors || [],
          opening:n(sample.opening),
          kept:n(sample.kept),
          replaced:n(sample.replaced),
          deadWeight:compactMulliganKeepRetention(keepRetention),
          seen:0,
          played:0
        });
        map.set(key, item);
      });
    });

    map.forEach(item => {
      item.keepRate = pct(item.kept, item.kept + item.replaced);
      item.keptWr = pct(item.keptWins, item.keptGames);
      applyMulliganRetentionSummary(item, item);
    });

    return map;
  }

  function mergeEmpiricalMulliganIntoCards(cards=[], mulliganMap=new Map()){
    const map = new Map();
    (cards || []).forEach(card => {
      const key = card.name || card.key || '';
      if(!key) return;
      map.set(key, { ...card });
    });

    mulliganMap.forEach((mulligan, key) => {
      const existingKey = [...map.keys()].find(itemKey => slug(itemKey) === slug(key) || slug(map.get(itemKey)?.name || '') === slug(mulligan.name || key));
      const targetKey = existingKey || key;
      const base = existingKey ? map.get(existingKey) : {
        key:mulligan.key || slug(key),
        name:mulligan.name || key,
        type:mulligan.type || '',
        colors:mulligan.colors || [],
        seen:0, played:0, inked:0, quest:0, lore:0, challenge:0,
        gamesSeen:0, winsSeen:0, gamesNotSeen:0, winsNotSeen:0, gamesPlayed:0, winsPlayed:0,
        firstTurns:[]
      };
      map.set(targetKey, {
        ...base,
        key:base.key || mulligan.key,
        name:base.name || mulligan.name || key,
        type:base.type || mulligan.type || '',
        colors:arrayify(base.colors).length ? base.colors : (mulligan.colors || []),
        cost:base.cost ?? mulligan.cost,
        inkable:base.inkable ?? mulligan.inkable,
        image:base.image || mulligan.image || '',
        opening:n(mulligan.opening),
        kept:n(mulligan.kept),
        replaced:n(mulligan.replaced),
        keptGames:n(mulligan.keptGames),
        keptWins:n(mulligan.keptWins),
        keepRate:pct(mulligan.kept, n(mulligan.kept) + n(mulligan.replaced)),
        keptWr:pct(mulligan.keptWins, mulligan.keptGames),
        keepRetentionEpisodes:n(mulligan.keepRetentionEpisodes),
        keepRetentionAvg:mulligan.keepRetentionAvg,
        keepRetentionStuckRate:mulligan.keepRetentionStuckRate,
        keepRetentionMax:n(mulligan.keepRetentionMax),
        keepRetentionStuck:n(mulligan.keepRetentionStuck),
        keepRetentionStillInHand:n(mulligan.keepRetentionStillInHand),
        keepRetentionPlayed:n(mulligan.keepRetentionPlayed),
        keepRetentionInked:n(mulligan.keepRetentionInked),
        keepRetentionRepresentative:mulligan.keepRetentionRepresentative || null,
        samples:arrayify(mulligan.samples)
      });
    });

    return [...map.values()];
  }

  function aggregateDetailedCards(rows, games, gameByKey){
    const allGameKeys = games.map(game => `${game.matchId}::${n(game.gameNumber || 1)}`);
    const map = new Map();
    rows.forEach(row => {
      const displayName = row.card_name || row.card_key || '';
      const key = statCardKey({ fullName:displayName, name:displayName, type:row.card_type, colors:row.colors }) || slug(row.card_key || displayName);
      if(!key || !displayName) return;
      const item = map.get(key) || {
        key,
        name:displayName,
        type:row.card_type || '',
        colors:row.colors || [],
        seen:0, played:0, inked:0, quest:0, lore:0, challenge:0,
        opening:0, kept:0, replaced:0,
        gamesSeen:0, winsSeen:0, gamesNotSeen:0, winsNotSeen:0, gamesPlayed:0, winsPlayed:0, keptGames:0, keptWins:0,
        firstTurns:[], samples:[], seenGameKeys:new Set()
      };
      item.seen += n(row.seen);
      item.played += n(row.played);
      item.inked += n(row.inked);
      item.quest += n(row.quest_count);
      item.lore += n(row.lore_generated);
      item.challenge += n(row.challenge_count);
      item.opening += n(row.in_opening_hand);
      item.kept += n(row.kept_mulligan);
      item.replaced += n(row.replaced_mulligan);
      if(Array.isArray(row.first_turns)) item.firstTurns.push(...row.first_turns.map(n).filter(Boolean));
      const gameKeyStr = `${row.match_id}::${n(row.game_number || 1)}`;
      if(n(row.seen) > 0) item.seenGameKeys.add(gameKeyStr);
      const g = gameByKey.get(gameKeyStr);
      if(g){
        item.samples.push({
          matchId:row.match_id,
          gameNumber:n(row.game_number || 1),
          isWin:!!g.isWin,
          otp:g.otp === true ? true : (g.otp === false ? false : null),
          opponentKey:g.opponentKey || 'unknown',
          opponentLabel:g.opponentLabel || 'Adversaire inconnu',
          opponentColors:g.opponentColors || [],
          opening:n(row.in_opening_hand),
          kept:n(row.kept_mulligan),
          replaced:n(row.replaced_mulligan),
          seen:n(row.seen),
          played:n(row.played)
        });
      }
      if(g && n(row.seen) > 0){ item.gamesSeen += 1; if(g.isWin) item.winsSeen += 1; }
      if(g && n(row.played) > 0){ item.gamesPlayed += 1; if(g.isWin) item.winsPlayed += 1; }
      if(g && n(row.kept_mulligan) > 0){ item.keptGames += 1; if(g.isWin) item.keptWins += 1; }
      map.set(key, item);
    });
    map.forEach(item => {
      item.opening = Math.max(n(item.opening), n(item.kept) + n(item.replaced));
      const hydrated = hydrateCard({ id:item.key, cardId:item.key, fullName:item.name, name:item.name, type:item.type, colors:item.colors });
      const intrinsicLore = n(cardIntrinsicLore(hydrated));
      if(intrinsicLore > 0 && n(item.quest) > 0 && n(item.lore) === 0){
        item.lore = n(item.quest) * intrinsicLore;
      }
      const seenGameKeys = item.seenGameKeys;
      allGameKeys.forEach(key => {
        if(seenGameKeys.has(key)) return;
        const g = gameByKey.get(key);
        if(!g) return;
        item.gamesNotSeen += 1;
        if(g.isWin) item.winsNotSeen += 1;
      });
      item.gihWr = pct(item.winsSeen, item.gamesSeen);
      item.playedWr = pct(item.winsPlayed, item.gamesPlayed);
      item.gnsWr = pct(item.winsNotSeen, item.gamesNotSeen);
      item.iih = item.gamesSeen >= 2 && item.gamesNotSeen >= 2 ? item.gihWr - item.gnsWr : null;
      item.keepRate = pct(item.kept, item.kept + item.replaced);
      item.keptWr = pct(item.keptWins, item.keptGames);
      item.avgFirstTurn = item.firstTurns.length ? round1(avg(item.firstTurns)) : null;
    });
    return map;
  }

  function aggregateGamesPlayDraw(games){
    let otpTotal = 0, otpWins = 0, otdTotal = 0, otdWins = 0;
    games.forEach(game => {
      if(game.otp === true){ otpTotal += 1; if(game.isWin) otpWins += 1; }
      else if(game.otp === false){ otdTotal += 1; if(game.isWin) otdWins += 1; }
    });
    return { otpTotal, otpWins, otdTotal, otdWins, total:otpTotal + otdTotal, otpRate:pct(otpWins, otpTotal), otdRate:pct(otdWins, otdTotal) };
  }

  function avgTopDeckFromTurns(rows){
    if(!rows.length) return null;
    const byGame = new Map();
    rows.forEach(row => {
      const key = `${row.match_id}::${n(row.game_number || 1)}`;
      if(n(row.hand_count) <= 1) byGame.set(key, n(byGame.get(key)) + 1);
      else if(!byGame.has(key)) byGame.set(key, 0);
    });
    return byGame.size ? avg([...byGame.values()]) : null;
  }

  function aggregateTurnCurve(rows, games=[]){
    const rowKey = row => `${row.match_id || row.matchId || ''}::${n(row.game_number || row.gameNumber || 1)}`;
    const gameKey = game => `${game.matchId || game.match_id || ''}::${n(game.gameNumber || game.game_number || 1)}`;
    const rowsByGame = new Map();
    (rows || []).forEach(row => {
      const turn = n(row.turn);
      if(!turn || turn > 30) return;
      const key = rowKey(row);
      const list = rowsByGame.get(key) || [];
      list.push(row);
      rowsByGame.set(key, list);
    });

    const gameKeys = new Set([...rowsByGame.keys()]);
    (games || []).forEach(game => gameKeys.add(gameKey(game)));
    const gameMap = new Map((games || []).map(game => [gameKey(game), game]));
    const byTurn = new Map();

    function add(turn, values){
      if(!turn || turn > 30) return;
      const bucket = byTurn.get(turn) || {
        turn,
        loreSum:0, loreCount:0,
        handSum:0, handCount:0,
        inkFloatSum:0, inkFloatCount:0,
        inkedSum:0, inkedCount:0,
        playedSum:0, playedCount:0,
        questsSum:0, questsCount:0,
        challengesSum:0, challengesCount:0
      };
      const addValue = (key, value) => {
        const num = Number(value);
        if(!Number.isFinite(num)) return;
        bucket[`${key}Sum`] += num;
        bucket[`${key}Count`] += 1;
      };
      addValue('lore', values.lore);
      addValue('hand', values.hand);
      addValue('inkFloat', values.inkFloat);
      addValue('inked', values.inked);
      addValue('played', values.played);
      addValue('quests', values.quests);
      addValue('challenges', values.challenges);
      byTurn.set(turn, bucket);
    }

    gameKeys.forEach(key => {
      const game = gameMap.get(key) || {};
      const list = (rowsByGame.get(key) || []).slice().sort((a,b)=>n(a.turn)-n(b.turn));
      const lastTurnFromRows = list.reduce((max,row)=>Math.max(max,n(row.turn)),0);
      const gameTurnCount = n(game.turnCount || game.turn_count || 0);
      const finalLore = n(game.finalMineLore ?? game.final_mine_lore ?? 0);
      const maxTurn = Math.min(30, Math.max(lastTurnFromRows, gameTurnCount));
      if(!maxTurn && !list.length) return;
      if(!list.length && gameTurnCount && finalLore){
        for(let turn = 1; turn <= Math.min(30, gameTurnCount); turn += 1){
          add(turn, {
            lore:round1(finalLore * (turn / Math.max(1, gameTurnCount))),
            hand:0,
            inkFloat:0,
            inked:0,
            played:0,
            quests:0,
            challenges:0
          });
        }
        return;
      }
      const rowByTurn = new Map(list.map(row => [n(row.turn), row]));
      let previous = null;
      for(let turn = 1; turn <= maxTurn; turn += 1){
        const row = rowByTurn.get(turn);
        if(row){
          previous = {
            lore:n(row.lore),
            hand:n(row.hand_count),
            inkFloat:n(row.ink_float),
            inked:n(row.inked),
            played:n(row.cards_played),
            quests:n(row.quests),
            challenges:n(row.challenges)
          };
          add(turn, previous);
          continue;
        }
        if(!previous) continue;
        const values = { ...previous, inked:0, played:0, quests:0, challenges:0 };
        if(finalLore && gameTurnCount && turn === gameTurnCount){
          values.lore = finalLore;
        }else if(finalLore && gameTurnCount && lastTurnFromRows && turn > lastTurnFromRows && gameTurnCount > lastTurnFromRows){
          const startLore = previous.lore;
          const progress = (turn - lastTurnFromRows) / Math.max(1, gameTurnCount - lastTurnFromRows);
          values.lore = round1(startLore + (finalLore - startLore) * Math.max(0, Math.min(1, progress)));
        }
        add(turn, values);
      }
    });

    const maxRelevantTurn = Math.min(30, Math.max(
      ...[...byTurn.keys()],
      ...(games || []).map(game => n(game.turnCount || game.turn_count || 0)),
      0
    ));

    return [...byTurn.values()]
      .sort((a,b)=>a.turn-b.turn)
      .filter(row => row.turn <= maxRelevantTurn)
      .map(row => {
        const avgMetric = key => row[`${key}Count`] ? round1(row[`${key}Sum`] / row[`${key}Count`]) : 0;
        return {
          turn:row.turn,
          lore:avgMetric('lore'),
          hand:avgMetric('hand'),
          inkFloat:avgMetric('inkFloat'),
          inked:avgMetric('inked'),
          played:avgMetric('played'),
          quests:avgMetric('quests'),
          challenges:avgMetric('challenges')
        };
      });
  }

  function aggregateLoreMilestones(turnRows=[], games=[]){
    const byGame = new Map();
    const rowKey = row => `${row.match_id || row.matchId || ''}::${n(row.game_number || row.gameNumber || 1)}`;
    (turnRows || []).forEach(row => {
      const key = rowKey(row);
      if(!key || key === '::1') return;
      const list = byGame.get(key) || [];
      list.push(row);
      byGame.set(key, list);
    });
    (games || []).forEach(game => {
      const key = `${game.matchId || game.match_id || ''}::${n(game.gameNumber || game.game_number || 1)}`;
      if(!key || key === '::1') return;
      const synthetic = gameAnalyticsTurnRows(game, 'mine');
      if(!synthetic.length) return;
      const existing = byGame.get(key) || [];
      const byTurn = new Map(existing.map(row => [n(row.turn), row]));
      synthetic.forEach(row => {
        const turn = n(row.turn);
        if(!byTurn.has(turn)) byTurn.set(turn, row);
        else byTurn.set(turn, mergeTurnRow(byTurn.get(turn), row));
      });
      byGame.set(key, [...byTurn.values()]);
    });

    const buckets = Array.from({ length:21 }, (_, lore) => ({ lore, sum:0, count:0 }));
    byGame.forEach((list, key) => {
      const game = (games || []).find(g => `${g.matchId || g.match_id || ''}::${n(g.gameNumber || g.game_number || 1)}` === key) || {};
      const sorted = [...list]
        .map(row => ({ turn:n(row.turn), lore:n(row.lore), hand:n(row.hand_count) }))
        .filter(row => row.turn)
        .sort((a,b)=>a.turn-b.turn);
      const finalLore = n(game.finalMineLore ?? game.final_mine_lore);
      const finalTurn = n(game.turnCount ?? game.turn_count);
      if(finalTurn && finalLore && (!sorted.length || sorted[sorted.length - 1].turn < finalTurn || sorted[sorted.length - 1].lore < finalLore)){
        sorted.push({ turn:finalTurn, lore:finalLore, hand:sorted[sorted.length - 1]?.hand ?? 0 });
      }
      if(!sorted.length) return;
      for(let target = 0; target <= 20; target += 1){
        if(target === 0){ buckets[target].sum += sorted[0].turn || 1; buckets[target].count += 1; continue; }
        let previous = { turn:1, lore:0 };
        let found = null;
        for(const row of sorted){
          if(row.lore >= target){
            if(row.lore > previous.lore && row.turn !== previous.turn){
              const ratio = (target - previous.lore) / Math.max(1, row.lore - previous.lore);
              found = previous.turn + (row.turn - previous.turn) * Math.max(0, Math.min(1, ratio));
            }else{
              found = row.turn;
            }
            break;
          }
          previous = row;
        }
        if(Number.isFinite(found)){
          buckets[target].sum += found;
          buckets[target].count += 1;
        }
      }
    });
    return buckets.map(bucket => ({
      lore:bucket.lore,
      avgTurn:bucket.count ? round1(bucket.sum / bucket.count) : null,
      count:bucket.count
    }));
  }

  function filterPerformanceCardsBySort(cards, sort){
    return [...(cards || [])].filter(card => {
      if(sort === 'played') return n(card.played) > 0;
      if(sort === 'inked') return n(card.inked) > 0;
      if(sort === 'played_winrate') return n(card.gamesPlayed) > 0;
      return n(card.lore) > 0;
    });
  }

  function filterMulliganCardsBySort(cards, sort){
    return [...(cards || [])].filter(card => {
      if(sort === 'kept') return n(card.kept) > 0;
      if(sort === 'thrown') return n(card.replaced) > 0;
      if(sort === 'kept_wr') return n(card.keptGames) > 0;
      return n(card.opening) > 0;
    });
  }



  function statusToneFromWinrate(wr, total=0){
    if(!total) return 'neutral';
    if(wr >= 60) return 'success';
    if(wr >= 50) return 'good';
    if(wr >= 45) return 'warning';
    return 'danger';
  }

  function performanceToneLabel(tone){
    if(tone === 'success') return 'Solide';
    if(tone === 'good') return 'Positif';
    if(tone === 'warning') return 'Instable';
    if(tone === 'danger') return 'À travailler';
    return 'À construire';
  }

  function miniGaugeHtml(label, value, max, help='', tone='neutral'){
    const numeric = Number(value);
    const hasValue = Number.isFinite(numeric);
    const pctValue = hasValue ? Math.max(4, Math.min(100, Math.round((numeric / Math.max(1, max)) * 100))) : 0;
    const shown = hasValue ? numeric : '—';
    return `<div class="health-gauge ${escAttr(tone)}">
      <div class="health-gauge-top"><span>${esc(label)}</span><strong>${esc(String(shown))}</strong></div>
      <div class="health-gauge-track"><i style="width:${pctValue}%"></i></div>
      ${help ? `<small>${esc(help)}</small>` : ''}
    </div>`;
  }

  function deckHealthTags(analytics, wr, total){
    const tags = [];
    const topDeck = analytics.avgTopDeck;
    const playDraw = analytics.playDraw || {};
    if(total < 8) tags.push({ label:'Volume faible', tone:'neutral' });
    else tags.push({ label: wr >= 55 ? 'Deck positif' : wr < 45 ? 'Plan fragile' : 'À stabiliser', tone:statusToneFromWinrate(wr,total) });
    if(topDeck !== null){
      if(topDeck <= 1.5) tags.push({ label:'Bonne main', tone:'success' });
      else if(topDeck >= 3) tags.push({ label:'Ressources faibles', tone:'warning' });
    }
    if(playDraw.total && Math.abs(n(playDraw.otpRate)-n(playDraw.otdRate)) >= 20) tags.push({ label:'OTP / OTD à comparer', tone:'warning' });
    else if(playDraw.total) tags.push({ label:'Départ stable', tone:'good' });
    if(analytics.cardSignals?.topLore) tags.push({ label:'Moteur identifié', tone:'good' });
    return tags.slice(0,4);
  }

  function deckHealthDashboardHtml(analytics, meta={}){
    const total = n(meta.total);
    const wins = n(meta.wins);
    const wr = pct(wins, total);
    const tone = statusToneFromWinrate(wr,total);
    const avgTurns = analytics.avgTurns;
    const avgLore = analytics.avgFinalLore;
    const topDeck = analytics.avgTopDeck;
    const tags = deckHealthTags(analytics, wr, total);
    return `<section class="deck-health-dashboard ${escAttr(tone)}" aria-label="Santé du deck">
      <article class="glass deck-health-main ${escAttr(tone)}">
        <span>Santé du deck</span>
        <strong class="deck-health-verdict">${total ? esc(performanceToneLabel(tone)) : '—'}</strong>
        <small>${total ? `${wins} victoire(s) sur ${total} match(s)` : 'Aucun match dans l’échantillon'}</small>
      </article>
      <article class="glass deck-health-details">
        <div class="deck-health-tags">
          ${tags.map(tag => `<span class="deck-health-tag ${escAttr(tag.tone)}">${esc(tag.label)}</span>`).join('')}
        </div>
        <div class="deck-health-gauges">
          ${miniGaugeHtml('Durée moyenne', avgTurns, 18, avgTurns ? 'Plus la barre est longue, plus vos games s’étirent.' : 'À confirmer', 'neutral')}
          ${miniGaugeHtml('Main critique', topDeck, 6, topDeck !== null ? 'Tours moyens à 0 ou 1 carte.' : 'Donnée absente', topDeck >= 3 ? 'warning' : 'good')}
          ${miniGaugeHtml('Lore final moyen', avgLore, 20, avgLore !== null ? 'Pression moyenne en fin de game.' : 'Donnée absente', avgLore >= 14 ? 'good' : 'neutral')}
        </div>
      </article>
    </section>`;
  }



  function renderPerformanceCoach(analytics, meta={}){
    const deckScoped = !!meta.deckScoped;
    const root = document.getElementById('performanceDeckCoach');
    if(root){
      if(!deckScoped){
        root.innerHTML = `<section class="deck-health-dashboard neutral" aria-label="Santé du deck">
          <article class="glass deck-health-main neutral">
            <span>Santé du deck</span>
            <strong>—</strong>
            <small>Choisissez une bicolorité</small>
            <div class="deck-health-status">À filtrer</div>
          </article>
          <article class="glass deck-health-details">
            <div class="deck-health-tags"><span class="deck-health-tag neutral">Stats verrouillées</span><span class="deck-health-tag neutral">Éviter les faux signaux</span></div>
            <div class="deck-health-empty">Les lectures cartes, mulligan et matchups deviennent utiles quand les matchs appartiennent au même plan de jeu.</div>
          </article>
        </section>`;
      }else{
        root.innerHTML = deckHealthDashboardHtml(analytics, meta);
      }
    }

    if(!deckScoped){
      if(els.performanceCoachTitle) els.performanceCoachTitle.textContent = 'Choisissez un deck';
      if(els.performanceCoachText) els.performanceCoachText.textContent = 'Le diagnostic devient utile quand les matchs appartiennent à une même bicolorité.';
      if(els.performanceBestSignal) els.performanceBestSignal.textContent = '—';
      if(els.performanceBestSignalText) els.performanceBestSignalText.textContent = 'Sélectionnez une bicolorité.';
      if(els.performanceWarningSignal) els.performanceWarningSignal.textContent = '—';
      if(els.performanceWarningSignalText) els.performanceWarningSignalText.textContent = 'Aucun signal exploitable pour l’instant.';
      return;
    }

    const cards = analytics.cards || [];
    const bestPlayed = cards
      .filter(card => n(card.gamesPlayed) >= 2)
      .sort((a,b) => n(b.playedWr)-n(a.playedWr) || n(b.gamesPlayed)-n(a.gamesPlayed) || n(b.lore)-n(a.lore))[0];
    const topLore = analytics.cardSignals?.topLore;
    const topInked = analytics.cardSignals?.topInked;
    const negativeImpact = cards
      .filter(card => card.iih !== null && Number.isFinite(Number(card.iih)) && n(card.gamesSeen) >= 2 && n(card.gamesNotSeen) >= 2)
      .sort((a,b) => n(a.iih)-n(b.iih) || n(b.seen)-n(a.seen))[0];
    const highInkRate = cards
      .filter(card => n(card.inked) >= 3 && n(card.seen) > 0)
      .map(card => ({ ...card, inkRate:Math.round((n(card.inked) / Math.max(1,n(card.seen))) * 100) }))
      .filter(card => card.inkRate >= 45)
      .sort((a,b) => b.inkRate-a.inkRate || n(b.inked)-n(a.inked))[0];

    if(els.performanceCoachTitle) els.performanceCoachTitle.textContent = performanceToneLabel(statusToneFromWinrate(pct(n(meta.wins), n(meta.total)), n(meta.total)));
    if(els.performanceCoachText) els.performanceCoachText.textContent = `${pct(n(meta.wins), n(meta.total))}% de winrate · ${n(meta.total)} analyse${n(meta.total) > 1 ? 's' : ''}.`;

    if(bestPlayed){
      if(els.performanceBestSignal) els.performanceBestSignal.textContent = bestPlayed.name;
      if(els.performanceBestSignalText) els.performanceBestSignalText.textContent = `Top performer · ${bestPlayed.playedWr}% WR quand jouée.`;
    }else if(topLore){
      if(els.performanceBestSignal) els.performanceBestSignal.textContent = topLore.name;
      if(els.performanceBestSignalText) els.performanceBestSignalText.textContent = `Moteur de lore · ${topLore.lore} lore.`;
    }else{
      if(els.performanceBestSignal) els.performanceBestSignal.textContent = 'Volume à construire';
      if(els.performanceBestSignalText) els.performanceBestSignalText.textContent = 'Ajoutez quelques games pour faire ressortir les cartes clés.';
    }

    if(highInkRate){
      if(els.performanceWarningSignal) els.performanceWarningSignal.textContent = highInkRate.name;
      if(els.performanceWarningSignalText) els.performanceWarningSignalText.textContent = `Encrage fréquent · ${highInkRate.inkRate}%.`;
    }else if(negativeImpact && n(negativeImpact.iih) <= -10){
      if(els.performanceWarningSignal) els.performanceWarningSignal.textContent = negativeImpact.name;
      if(els.performanceWarningSignalText) els.performanceWarningSignalText.textContent = `Signal à surveiller · plus de volume nécessaire.`;
    }else{
      if(els.performanceWarningSignal) els.performanceWarningSignal.textContent = topInked?.name || 'Aucun gros signal négatif';
      if(els.performanceWarningSignalText) els.performanceWarningSignalText.textContent = topInked ? `${topInked.inked} encrage(s) observé(s).` : 'Rien d’anormal sur l’échantillon actuel.';
    }
  }

  function renderPerformanceActionPlan(analytics, meta={}){
    if(!els.performanceActionPlan) return;
    const loggedIn = !!state.currentUser;
    const deckScoped = !!meta.deckScoped;
    const rows = meta.rows || [];
    if(!loggedIn){
      els.performanceActionPlan.innerHTML = `<article class="glass action-plan-card primary">
        <span>Plan d’action</span>
        <strong>Connectez-vous pour activer le suivi</strong>
        <p>Les priorités de progression se basent sur vos analyses sauvegardées.</p>
      </article>`;
      return;
    }
    if(!deckScoped){
      const missingDeck = typeof deckMissingRows === 'function' ? deckMissingRows().length : 0;
      const total = n(meta.total);
      const profiles = namedDeckProfiles().filter(profile => !isArchivedDeckProfile(profile)).length;
      const actions = [
        {
          tone:'primary',
          label:'Priorité',
          title: missingDeck ? `${missingDeck} analyse${missingDeck > 1 ? 's' : ''} à ranger` : 'Choisissez une bicolorité',
          text: missingDeck ? 'Attribuez les decks manquants depuis l’historique pour éviter de mélanger plusieurs plans de jeu.' : 'Les signaux cartes, mulligan et matchups deviennent fiables dès que l’échantillon est cohérent.',
          meta: missingDeck ? 'Nettoyage post-import' : `${total} analyse${total > 1 ? 's' : ''} disponibles`
        },
        {
          label:'Base',
          title:`${profiles} deck${profiles > 1 ? 's' : ''} actif${profiles > 1 ? 's' : ''}`,
          text:'Utilisez les versions de decks pour séparer contrôle, midrange, aggro ou variantes de tournoi.',
          meta:'Organisation'
        },
        {
          label:'Lecture',
          title:'Éviter les faux signaux',
          text:'Les statistiques cartes et mulligan sont volontairement verrouillées quand toutes les bicolorités sont mélangées.',
          meta:'Fiabilité'
        }
      ];
      els.performanceActionPlan.innerHTML = actions.slice(0, 1).map(actionPlanCardHtml).join('');
      return;
    }

    const total = n(meta.total);
    const wins = n(meta.wins);
    const wr = pct(wins, total);
    const cards = analytics.cards || [];
    const topDeck = analytics.avgTopDeck;
    const playDraw = analytics.playDraw || {};
    const topInked = cards
      .filter(card => n(card.inked) >= 2 && n(card.seen) > 0)
      .map(card => ({ ...card, inkRate:Math.round((n(card.inked)/Math.max(1,n(card.seen))) * 100) }))
      .sort((a,b)=>b.inkRate-a.inkRate || n(b.inked)-n(a.inked))[0];
    const weakCard = cards
      .filter(card => card.iih !== null && Number.isFinite(Number(card.iih)) && n(card.gamesSeen) >= 3 && n(card.gamesNotSeen) >= 3)
      .sort((a,b)=>n(a.iih)-n(b.iih))[0];
    const mulliganCards = cards.filter(card => n(card.opening) >= 2);
    const oftenThrown = [...mulliganCards].sort((a,b)=>n(b.replaced)-n(a.replaced) || n(b.opening)-n(a.opening))[0];

    const actions = [];
    if(total < 8){
      actions.push({
        tone:'primary',
        label:'Priorité',
        title:'Renforcer l’échantillon',
        text:`${total} analyse${total > 1 ? 's' : ''} seulement : les tendances sont utiles, mais pas encore assez solides pour conclure.`,
        meta:'Objectif : 10 à 15 games'
      });
    }else if(wr < 45){
      actions.push({
        tone:'danger',
        label:'Priorité',
        title:'Identifier la cause des défaites',
        text:`${wr}% de winrate sur l’échantillon filtré. Commencez par les matchups faibles et les tours où la main s’épuise.`,
        meta:`${wins}/${total} victoires`
      });
    }else if(wr >= 60){
      actions.push({
        tone:'success',
        label:'Priorité',
        title:'Conserver le plan actuel',
        text:`${wr}% de winrate : le deck performe. Cherchez plutôt les ajustements matchup par matchup que les gros changements.`,
        meta:`${wins}/${total} victoires`
      });
    }else{
      actions.push({
        tone:'primary',
        label:'Priorité',
        title:'Stabiliser les matchups',
        text:`${wr}% de winrate : le deck est jouable, mais les écarts par matchup et OTP/OTD doivent guider les prochains tests.`,
        meta:`${wins}/${total} victoires`
      });
    }

    if(topDeck !== null && topDeck >= 2.5){
      actions.push({
        label:'Ressource',
        title:'Main qui s’essouffle',
        text:`Vous terminez en moyenne ${topDeck} tour(s) avec 0 ou 1 carte. Surveillez pioche, curve et cartes mortes.`,
        meta:'Main critique'
      });
    }else if(playDraw.total && Math.abs(n(playDraw.otpRate)-n(playDraw.otdRate)) >= 20){
      const weaker = n(playDraw.otpRate) < n(playDraw.otdRate) ? 'quand vous commencez' : 'quand vous jouez second';
      actions.push({
        label:'Départ',
        title:'Écart OTP / OTD',
        text:`Le deck semble moins stable ${weaker}. Testez des lignes de mulligan différentes selon le départ.`,
        meta:`OTP ${n(playDraw.otpRate)}% · OTD ${n(playDraw.otdRate)}%`
      });
    }else{
      actions.push({
        label:'Départ',
        title:'Comparer OTP / OTD',
        text:'Gardez cette lecture active : un écart de départ révèle souvent une curve trop fragile ou trop réactive.',
        meta:'Tempo'
      });
    }

    if(topInked && topInked.inkRate >= 45){
      actions.push({
        label:'Deckbuilding',
        title:`${topInked.name} souvent encrée`,
        text:`Elle finit en encre dans ${topInked.inkRate}% des apparitions vues. Signal utile pour repérer un slot flexible, pas une preuve définitive.`,
        meta:`${n(topInked.inked)} encrage(s)`,
        card:topInked
      });
    }else if(weakCard && n(weakCard.iih) <= -10){
      actions.push({
        label:'Carte',
        title:`${weakCard.name} à surveiller`,
        text:`Les parties où elle apparaît semblent moins favorables. À confirmer avec plus de volume avant de conclure.`,
        meta:'Impact carte',
        card:weakCard
      });
    }else if(oftenThrown){
      actions.push({
        label:'Mulligan',
        title:`${oftenThrown.name} souvent renvoyée`,
        text:`Elle revient souvent dans les mains de départ puis repart au mulligan. Vérifiez si elle arrive trop tôt pour le plan de jeu.`,
        meta:'Main de départ',
        card:oftenThrown
      });
    }else{
      actions.push({
        label:'Mulligan',
        title:'Créer du volume',
        text:'Le Mulligan Lab devient vraiment utile quand les mêmes cartes apparaissent plusieurs fois dans les mains de départ.',
        meta:'À confirmer'
      });
    }

    els.performanceActionPlan.innerHTML = actions.slice(0,1).map(actionPlanCardHtml).join('');
  }

  function actionPlanCardHtml(item={}){
    const hasCard = !!item.card;
    let visual = '';
    if(hasCard){
      const view = performanceCardView(item.card);
      visual = `<div class="action-plan-visual">${cardThumbHtml(view, 'action-plan-thumb')}</div>`;
    }
    return `<article class="glass action-plan-card action-plan-card-v2 ${hasCard ? 'with-card' : ''} ${escAttr(item.tone || '')}">
      ${visual}
      <div class="action-plan-copy">
        <span>${esc(item.label || 'Action')}</span>
        <strong>${esc(item.title || 'À analyser')}</strong>
        <div class="action-plan-badges">
          ${item.meta ? `<em>${esc(item.meta)}</em>` : ''}
          <em>${hasCard ? 'Carte suivie' : 'Axe de test'}</em>
        </div>
        ${item.text ? `<p>${esc(item.text)}</p>` : ''}
      </div>
    </article>`;
  }


  function renderPerformanceMatchups(rows, analytics, meta={}){
    if(!els.performanceMatchupBreakdown) return;
    if(!meta.deckScoped){
      els.performanceMatchupBreakdown.innerHTML = '<div class="deck-required compact"><strong>Sélectionnez une bicolorité</strong><span>Les matchups deviennent lisibles quand l’échantillon représente une stratégie cohérente.</span></div>';
      return;
    }
    const gamesByMatch = new Map();
    (analytics.games || []).forEach(game => {
      const key = game.matchId || game.match_id || '';
      if(!key) return;
      const item = gamesByMatch.get(key) || { total:0, wins:0 };
      item.total += 1;
      if(game.isWin) item.wins += 1;
      gamesByMatch.set(key,item);
    });
    const buckets = new Map();
    (rows || []).forEach(row => {
      const colors = rowOpponentColors(row);
      const key = colorFilterKey(colors) || 'unknown';
      const label = colors.length ? colors.map(inkLabel).join(' / ') : 'Adversaire inconnu';
      const bucket = buckets.get(key) || { key, label, colors, matches:0, wins:0, games:0, gameWins:0 };
      bucket.matches += 1;
      if(row.result === 'win') bucket.wins += 1;
      const g = gamesByMatch.get(row.id);
      bucket.games += g?.total || (String(row.format || '').toUpperCase() === 'BO3' ? n(row.wins)+n(row.losses) : 1);
      bucket.gameWins += g?.wins || n(row.wins || (row.result === 'win' ? 1 : 0));
      buckets.set(key,bucket);
    });
    const items = [...buckets.values()]
      .filter(item => item.matches > 0)
      .sort((a,b) => b.matches-a.matches || pct(b.wins,b.matches)-pct(a.wins,a.matches) || a.label.localeCompare(b.label))
      .slice(0,6);
    if(!items.length){
      els.performanceMatchupBreakdown.innerHTML = '<div class="empty-line">Aucun matchup exploitable sur cet échantillon.</div>';
      return;
    }
    els.performanceMatchupBreakdown.innerHTML = items.map(item => {
      const wr = pct(item.wins,item.matches);
      const gameWr = pct(item.gameWins,item.games);
      return `<article class="matchup-breakdown-card">
        <div class="matchup-breakdown-title">${inkDotsHtml(item.colors)}<strong>${esc(item.label)}</strong></div>
        <div class="matchup-breakdown-meter"><span style="width:${Math.max(0, Math.min(100, wr))}%"></span></div>
        <div class="matchup-breakdown-meta"><span>${wr}% WR match</span><span>${item.wins}V / ${item.matches}</span><span>${gameWr}% WR game</span></div>
      </article>`;
    }).join('');
  }

  function performanceMiniCardSignalHtml(card, meta=''){
    const view = performanceCardView(card);
    return `<button type="button" class="mini-card-signal-btn" data-performance-card-key="${escAttr(card.key || '')}" data-performance-card-name="${escAttr(card.name || '')}">
      <span class="mini-card-signal-art">${cardThumbHtml(view, 'mini-card-signal-thumb')}</span>
      <span class="mini-card-signal-copy"><strong>${esc(card.name || 'Carte')}</strong><small>${esc(meta)}</small></span>
    </button>`;
  }

  function performanceCardImpactHtml(analytics, options={}){
    if(!isPerformanceDeckScoped()){
      return '<div class="deck-required"><strong>Sélectionnez une bicolorité</strong><span>Les cartes clés ne sont pas affichées sur “Toutes les bicolorités”, pour éviter de mélanger des listes trop différentes.</span></div>';
    }
    const sort = state.performanceCardSort || 'lore';
    const expanded = !!state.performanceExpandedLists?.cards || !!options.full;
    const isDeadWeightSort = sort === 'blocked';
    const sorted = isDeadWeightSort
      ? performanceDeadWeightRows(analytics, expanded ? 80 : 4)
      : filterPerformanceCardsBySort(analytics.cards, sort).sort((a,b)=>comparePerformanceCards(a,b,sort));
    const limit = expanded ? 80 : 4;
    const rows = sorted.slice(0, limit);
    const toolbarHtml = `<div class="performance-block-toolbar">
      ${performanceSortSelect('cards', [['lore','Lore'],['played','Jouées'],['inked','Encrées'],['blocked','Bloquées'],['played_winrate','Winrate si jouée']], sort)}
      ${sorted.length > (expanded ? 4 : limit) ? `<button type="button" class="perf-list-link" data-performance-full-list="cards">${expanded ? 'Réduire la liste' : `Voir les ${sorted.length} cartes`}</button>` : ''}
    </div>`;
    if(isDeadWeightSort){
      const emptyHtml = performanceDeadWeightEmptyHtml(analytics);
      const listHtml = rows.length
        ? `<div class="performance-card-gallery key-card-gallery dead-weight-gallery ${expanded ? 'expanded' : ''}">${rows.map(row => performanceDeadWeightCardHtml(row)).join('')}</div>`
        : emptyHtml;
      return `${toolbarHtml}${listHtml}`;
    }
    if(!rows.length) return `${toolbarHtml}<div class="empty-line">Aucune statistique carte disponible pour ce deck. Réimportez et sauvegardez des matchs avec la V62+ pour alimenter ces signaux.</div>`;
    return `${toolbarHtml}
    <div class="performance-card-gallery key-card-gallery ${expanded ? 'expanded' : ''}">${rows.map(card => performanceKeyCardHtml(card)).join('')}</div>`;
  }


  function performanceDeadWeightRows(analytics, maxRows=80){
    return arrayify(analytics?.deadWeight)
      .filter(row => n(row.maxHeldTurns) >= 3 || n(row.stuckEpisodes) > 0 || n(row.exits?.stillInHand) > 0)
      .sort((a,b)=>n(b.stuckEpisodes)-n(a.stuckEpisodes) || n(b.maxHeldTurns)-n(a.maxHeldTurns) || n(b.averageHeldTurns)-n(a.averageHeldTurns))
      .slice(0, maxRows);
  }

  function performanceDeadWeightEmptyHtml(analytics){
    const hasAny = arrayify(analytics?.deadWeight).length > 0;
    return `<section class="performance-dead-weight-block is-empty inline-empty">
      <p class="performance-dead-weight-empty">${hasAny ? 'Aucune carte ne reste souvent bloquée dans l’échantillon filtré.' : 'Aucune donnée Dead Weight disponible pour cet échantillon. Importez puis sauvegardez des replays récents pour alimenter ce signal.'}</p>
    </section>`;
  }

  function performanceDeadWeightHtml(analytics){
    const rows = performanceDeadWeightRows(analytics, 6);
    if(!rows.length) return performanceDeadWeightEmptyHtml(analytics);
    const reliability = reliabilityInfo(analytics?.games?.length || 0);
    return `<section class="performance-dead-weight-block">
      <div class="performance-block-heading">
        <span>Cartes souvent bloquées</span>
        <small>${esc(reliability.label)} · cartes restées longtemps en main sur vos parties filtrées.</small>
      </div>
      <div class="performance-card-gallery key-card-gallery dead-weight-gallery">${rows.map(row => performanceDeadWeightCardHtml(row)).join('')}</div>
    </section>`;
  }

  function performanceDeadWeightCardHtml(row){
    const card = hydrateCard(row.card || { fullName:row.cardName, id:row.cardKey, cost:row.cost, inkable:row.inkable });
    const rep = row.representative || {};
    const inkable = row.inkable ?? cardIsInkable(card);
    const stuck = n(row.stuckEpisodes);
    const episodes = Math.max(1, n(row.episodes));
    const exit = dominantHandExit(row.exits || {});
    const exitLabel = handExitLabel(exit).replace(' ensuite','');
    const range = rep.entryTurn ? `Exemple : T${n(rep.entryTurn)} → ${rep.stillInHand ? 'fin' : `T${n(rep.exitTurn)}`}` : `${n(row.maxHeldTurns)} tours max`;
    const badgeTone = inkable === false ? 'danger' : stuck ? 'neutral' : 'blue';
    const badges = [
      inkable === false ? 'Non-encrable' : 'Encrable',
      `${stuck}/${episodes} passage${episodes > 1 ? 's' : ''} long${episodes > 1 ? 's' : ''}`,
      exit && exit !== 'unknown' ? `Fin fréquente : ${exitLabel.toLowerCase()}` : ''
    ].filter(Boolean);
    return `<article class="performance-card-tile performance-card-tile-v2 dead-weight-tile is-clickable" role="button" tabindex="0" data-performance-card-key="${escAttr(cardKey(card) || row.cardKey || '')}" data-performance-card-name="${escAttr(row.cardName || fullName(card))}">
      <div class="performance-card-art">${cardThumbHtml(card, 'performance-card-thumb')}</div>
      <div class="performance-card-body">
        <h3>${esc(performanceDisplayName({ name:row.cardName || fullName(card) }))}</h3>
        <div class="card-status-row">${badges.slice(0,3).map((label,idx) => `<span class="card-status-badge ${idx === 0 ? badgeTone : 'neutral'}">${esc(label)}</span>`).join('')}</div>
        <div class="performance-stat-strip stat-token-strip">
          ${statTokenHtml('max en main', `${n(row.maxHeldTurns)}T`, 'neutral')}
          ${statTokenHtml('moyenne', `${round1(row.averageHeldTurns)}T`, 'neutral')}
          ${statTokenHtml('blocage', `${Math.round(n(row.stuckRate))}%`, stuck ? 'inked' : 'neutral')}
        </div>
        <small class="dead-weight-example">${esc(range)}</small>
      </div>
    </article>`;
  }

  function comparePerformanceCards(a,b,sort){
    const name = () => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity:'base' });
    if(sort === 'played') return (n(b.played)-n(a.played)) || (n(b.gamesPlayed)-n(a.gamesPlayed)) || (n(b.lore)-n(a.lore)) || name();
    if(sort === 'inked') return (n(b.inked)-n(a.inked)) || (n(b.seen)-n(a.seen)) || (n(b.played)-n(a.played)) || name();
    if(sort === 'played_winrate') return (n(b.playedWr)-n(a.playedWr)) || (n(b.gamesPlayed)-n(a.gamesPlayed)) || (n(b.played)-n(a.played)) || name();
    return (n(b.lore)-n(a.lore)) || (n(b.loreActions)-n(a.loreActions)) || (n(b.quest)-n(a.quest)) || (n(b.played)-n(a.played)) || name();
  }

  function performanceSortSelect(type, options, active){
    const opts = options.map(([value,label]) => `<option value="${escAttr(value)}" ${active === value ? 'selected' : ''}>${esc(label)}</option>`).join('');
    return `<label class="perf-sort-control"><span>Trier</span><select class="sort-select" data-performance-sort-select="${escAttr(type)}" aria-label="Trier">${opts}</select></label>`;
  }

  function performanceCardStatusBadges(card){
    const badges = [];
    const playedWr = n(card.playedWr);
    const gamesPlayed = n(card.gamesPlayed);
    const seen = Math.max(1,n(card.seen));
    const inkRate = Math.round((n(card.inked) / seen) * 100);
    if(gamesPlayed >= 5 && playedWr >= 60) badges.push({ label:'Top performer', tone:'success' });
    if(n(card.lore) >= 8) badges.push({ label:'Moteur de lore', tone:'gold' });
    if(n(card.inked) >= 3 && inkRate >= 45) badges.push({ label:`Encrage fréquent ${inkRate}%`, tone:'blue' });
    if(n(card.played) <= 2 && n(card.inked) >= 3) badges.push({ label:'Slot flexible ?', tone:'neutral' });
    if(gamesPlayed > 0 && gamesPlayed < 5) badges.push({ label:'À confirmer', tone:'neutral' });
    if(!badges.length) badges.push({ label:'Carte suivie', tone:'neutral' });
    return badges.slice(0,3);
  }

  function statTokenHtml(label, value, tone='neutral'){
    return `<span class="stat-token ${escAttr(tone)}"><b>${esc(String(value))}</b><small>${esc(label)}</small></span>`;
  }

  function mulliganShortTag(recommendation, keep, throwPct, copyPattern){
    const key = recommendation?.key || 'context';
    if(key === 'copy_limit') return 'Garder 1 copie max';
    if(key === 'throw') return 'Mulligan fréquent';
    if(key === 'keep') return 'À garder souvent';
    if(key === 'playdraw') return 'Dépend OTP / OTD';
    if(key === 'matchup') return 'Dépend matchup';
    if(key === 'low_sample') return 'Pas assez de données';
    if(copyPattern?.keptAndCut?.length) return 'Doublon à limiter';
    if(keep >= 60) return 'Plutôt garder';
    if(throwPct >= 60) return 'Plutôt renvoyer';
    return 'Selon la main';
  }


  function performanceKeyCardHtml(card){
    const view = performanceCardView(card);
    const sampleWeak = n(card.gamesPlayed) < 5;
    const winLabel = card.gamesPlayed ? (sampleWeak ? 'À confirmer' : `${card.playedWr}%`) : 'Peu jouée';
    const inkPercent = Math.min(100, Math.round((n(card.inked) / Math.max(1, n(card.seen))) * 100));
    const badges = performanceCardStatusBadges(card);
    return `<article class="performance-card-tile performance-card-tile-v2 is-clickable" role="button" tabindex="0" data-performance-card-key="${escAttr(card.key || '')}" data-performance-card-name="${escAttr(card.name || '')}">
      <div class="performance-card-art">${cardThumbHtml(view, 'performance-card-thumb')}</div>
      <div class="performance-card-body">
        <h3>${esc(performanceDisplayName(card))}</h3>
        <div class="card-status-row">${badges.map(b => `<span class="card-status-badge ${escAttr(b.tone)}">${esc(b.label)}</span>`).join('')}</div>
        <div class="performance-stat-strip stat-token-strip">
          ${statTokenHtml('lore', n(card.lore), 'lore')}
          ${statTokenHtml('jouée', n(card.played), 'played')}
          ${statTokenHtml('encrée', n(card.inked), 'inked')}
          ${statTokenHtml('WR', winLabel, sampleWeak ? 'neutral' : 'success')}
        </div>
        <div class="tiny-meter card-ink-meter" title="Part des apparitions qui finissent en encre"><i style="width:${inkPercent}%"></i></div>
      </div>
    </article>`;
  }

  function handleMulliganLabFilterClick(event){
    const btn = event.target.closest('[data-mulligan-filter][data-value]');
    if(!btn) return;
    event.preventDefault();
    const filter = btn.dataset.mulliganFilter;
    const value = btn.dataset.value || 'all';
    if(filter === 'matchup') state.performanceMulliganMatchupFilter = value;
    if(filter === 'play') state.performanceMulliganPlayFilter = value;
    if(filter === 'recommendation') state.performanceMulliganRecommendationFilter = value;
    state.performanceExpandedLists = { ...(state.performanceExpandedLists || {}), mulligan:false };
    renderPerformanceData();
  }

  function buildMulliganLabMeta(cards=[], games=[]){
    const matchupMap = new Map();
    games.forEach(game => {
      const key = game.opponentKey || 'unknown';
      const item = matchupMap.get(key) || { key, label:game.opponentLabel || 'Adversaire inconnu', colors:game.opponentColors || [], games:0 };
      item.games += 1;
      matchupMap.set(key, item);
    });
    return { matchups:[...matchupMap.values()].sort((a,b)=>b.games-a.games || a.label.localeCompare(b.label)) };
  }

  function mulliganLabButton(group, value, label, active, extra=''){
    return `<button type="button" class="mulligan-lab-pill ${String(active) === String(value) ? 'active' : ''}" data-mulligan-filter="${escAttr(group)}" data-value="${escAttr(value)}" aria-pressed="${String(active) === String(value) ? 'true' : 'false'}">${extra}<span>${esc(label)}</span></button>`;
  }

  function mulliganFilteredCard(card, filters){
    const allSamples = arrayify(card.samples);
    const samples = allSamples.filter(sample => {
      if(!n(sample.opening) && !n(sample.kept) && !n(sample.replaced)) return false;
      if(filters.matchup !== 'all' && String(sample.opponentKey || 'unknown') !== String(filters.matchup)) return false;
      if(filters.play === 'otp' && sample.otp !== true) return false;
      if(filters.play === 'otd' && sample.otp !== false) return false;
      return true;
    });
    if(!allSamples.length){
      const base = { ...card, _raw:card };
      base.recommendation = mulliganRecommendation(base, []);
      base.mulliganScore = mulliganPriorityScore(base);
      return base;
    }
    const out = {
      ...card,
      _raw:card,
      opening:samples.reduce((sum,row)=>sum+n(row.opening),0),
      kept:samples.reduce((sum,row)=>sum+n(row.kept),0),
      replaced:samples.reduce((sum,row)=>sum+n(row.replaced),0),
      keptGames:samples.filter(row => n(row.kept) > 0).length,
      keptWins:samples.filter(row => n(row.kept) > 0 && row.isWin).length,
      samples
    };
    out.keepRate = pct(out.kept, out.kept + out.replaced);
    out.keptWr = pct(out.keptWins, out.keptGames);
    Object.assign(out, summarizeMulliganRetentionFromSamples(samples));
    // Important: the recommendation must be computed on the filtered context, not on the full history.
    out.recommendation = mulliganRecommendation(out, samples);
    out.mulliganScore = mulliganPriorityScore(out);
    return out;
  }

  function mulliganCardTraits(card){
    const view = performanceCardView(card);
    const type = typeLabel(card.type || view.type || '').toLowerCase();
    const rawText = String(view.text || view.rulesText || view.ability || '').toLowerCase();
    const cost = nullable(card.cost ?? view.cost);
    const inkable = view.inkable === true || card.inkable === true;
    const uninkable = view.inkable === false || card.inkable === false;
    const name = fullName(view) || card.name || '';
    const isCharacter = type.includes('personnage') || type.includes('character');
    const isAction = type.includes('action');
    const isSong = type.includes('song') || type.includes('chanson');
    const isItem = type.includes('objet') || type.includes('item');
    const isLocation = type.includes('lieu') || type.includes('location');
    const isRamp = /ink an additional|additional card|your inkwell|chosen card.*inkwell|put.*into your inkwell|add.*inkwell|encrer une carte suppl|puits d['’]encre|réserve d['’]encre/i.test(rawText);
    const isDraw = /draw a card|draw \d|draw cards|piochez|piocher|draw and|choisissez.*pioche/i.test(rawText);
    const isRemoval = /deal \d damage|banish|chosen character|chosen damaged|return chosen|défaussez|bannissez|infligez|remontez|chosen opposing|opposing character/i.test(rawText);
    const isQuester = n(view.lore) >= 2 && isCharacter;
    const isEarlyPlay = cost !== null && cost <= 2;
    const isMidPlay = cost !== null && cost >= 3 && cost <= 4;
    const isHighCost = cost !== null && cost >= 5;
    const isVeryHighCost = cost !== null && cost >= 6;
    return { view, name, type, cost, inkable, uninkable, isCharacter, isAction, isSong, isItem, isLocation, isRamp, isDraw, isRemoval, isQuester, isEarlyPlay, isMidPlay, isHighCost, isVeryHighCost };
  }

  function mulliganCopyPattern(samples=[]){
    const rows = arrayify(samples).filter(row => n(row.opening) || n(row.kept) || n(row.replaced));
    const duplicateRows = rows.filter(row => n(row.opening) >= 2);
    const keptAndCut = duplicateRows.filter(row => n(row.kept) > 0 && n(row.replaced) > 0);
    const keptAllDupes = duplicateRows.filter(row => n(row.kept) >= n(row.opening) && n(row.replaced) === 0);
    const cutAllDupes = duplicateRows.filter(row => n(row.replaced) >= n(row.opening) && n(row.kept) === 0);
    const duplicateRate = rows.length ? Math.round((duplicateRows.length / rows.length) * 100) : 0;
    return { rows, duplicateRows, keptAndCut, keptAllDupes, cutAllDupes, duplicateRate };
  }

  function mulliganRecommendation(card, contextSamples=[]){
    const opening = n(card.opening);
    const kept = n(card.kept);
    const replaced = n(card.replaced);
    const decisions = kept + replaced;
    const keepRate = pct(kept, decisions);
    const samples = arrayify(contextSamples);
    const copyPattern = mulliganCopyPattern(samples);
    const lowSample = opening < 4 || decisions < 4;

    if(opening <= 0){
      return { key:'low_sample', label:'Pas assez de données', tone:'neutral', text:'Aucune vraie main de départ dans ce contexte.', score:0 };
    }

    if(copyPattern.keptAndCut.length >= 2){
      return {
        key:'copy_limit', label:'Garder 1 copie', tone:'context',
        text:'Observation : au moins une copie est gardée, mais les doublons sont souvent renvoyés.',
        score:72
      };
    }

    if(!lowSample && hasPlayDrawMulliganSplit(samples)){
      return { key:'playdraw', label:'Dépend OTP / OTD', tone:'context', text:'Vos décisions changent nettement selon le joueur qui commence.', score:64 };
    }

    if(!lowSample && hasMatchupMulliganSplit(samples)){
      return { key:'matchup', label:'Dépend du matchup', tone:'context', text:'Vos décisions changent nettement selon les encres adverses.', score:62 };
    }

    if(keepRate >= 75 && kept >= 2){
      return { key:'keep', label:'Souvent gardée', tone:'good', text:'Signal empirique fort : vous la gardez très souvent quand elle est en main de départ.', score:86 };
    }

    if(keepRate <= 25 && replaced >= 2){
      return { key:'throw', label:'Souvent renvoyée', tone:'danger', text:'Signal empirique fort : vous la renvoyez très souvent depuis la main de départ.', score:28 };
    }

    if(lowSample){
      return { key:'low_sample', label:'À confirmer', tone:'neutral', text:'Échantillon faible : lecture informative, pas une recommandation stratégique.', score:46 };
    }

    if(keepRate >= 60){
      return { key:'context', label:'Plutôt gardée', tone:'neutral', text:'Tendance positive, mais pas assez nette pour en faire une règle automatique.', score:60 };
    }

    if(keepRate <= 40){
      return { key:'context', label:'Plutôt renvoyée', tone:'neutral', text:'Tendance négative, à interpréter selon le reste de la main.', score:42 };
    }

    return { key:'context', label:'Décision partagée', tone:'neutral', text:'Les décisions sont partagées : cette carte dépend surtout du reste de la main.', score:50 };
  }

  function mulliganPriorityScore(card){
    const rec = card.recommendation || mulliganRecommendation(card, arrayify(card.samples));
    const opening = n(card.opening);
    const kept = n(card.kept);
    const replaced = n(card.replaced);
    const keepRate = pct(kept, kept + replaced);
    let score = 0;
    score += kept * 7;
    score += opening * 2;
    score += Math.round(keepRate * .9);
    score -= Math.round(replaced * 1.2);
    if(rec.key === 'keep') score += 18;
    if(rec.key === 'copy_limit') score += 14;
    if(rec.key === 'playdraw' || rec.key === 'matchup') score += 8;
    if(rec.key === 'throw') score -= 34;
    return score;
  }

  function hasPlayDrawMulliganSplit(samples=[]){
    const rows = arrayify(samples).filter(row => n(row.opening) || n(row.kept) || n(row.replaced));
    const otp = rows.filter(row => row.otp === true);
    const otd = rows.filter(row => row.otp === false);
    const total = group => group.reduce((sum,row)=>sum+n(row.kept)+n(row.replaced),0);
    if(total(otp) < 4 || total(otd) < 4) return false;
    const rate = group => pct(group.reduce((sum,row)=>sum+n(row.kept),0), total(group));
    return Math.abs(rate(otp) - rate(otd)) >= 35;
  }

  function hasMatchupMulliganSplit(samples=[]){
    const groups = new Map();
    arrayify(samples).forEach(row => {
      if(!n(row.opening) && !n(row.kept) && !n(row.replaced)) return;
      const key = row.opponentKey || 'unknown';
      const item = groups.get(key) || { kept:0, total:0 };
      item.kept += n(row.kept);
      item.total += n(row.kept) + n(row.replaced);
      groups.set(key,item);
    });
    const rates = [...groups.values()].filter(item => item.total >= 4).map(item => pct(item.kept,item.total));
    if(rates.length < 2) return false;
    return Math.max(...rates) - Math.min(...rates) >= 35;
  }

  function applyMulliganLabFilters(cards=[], filters={}){
    const rows = cards.map(card => mulliganFilteredCard(card, filters)).filter(card => n(card.opening) > 0 || n(card.kept) > 0 || n(card.replaced) > 0);
    if(filters.recommendation && filters.recommendation !== 'all') return rows.filter(card => {
      if(filters.recommendation === 'context') return ['context','copy_limit','matchup','playdraw'].includes(card.recommendation?.key);
      return card.recommendation?.key === filters.recommendation;
    });
    return rows;
  }

  function mulliganLabSummary(cards=[]){
    const summary = { keep:0, throw:0, matchup:0, playdraw:0, low_sample:0, context:0, copy_limit:0 };
    cards.forEach(card => { const key = card.recommendation?.key || 'context'; summary[key] = n(summary[key]) + 1; });
    return summary;
  }

  function performanceMulliganHtml(analytics, options={}){
    if(!isPerformanceDeckScoped()){
      return '<div class="deck-required"><strong>Sélectionnez une bicolorité</strong><span>Le Mulligan Lab doit être lu par contexte cohérent. Sur plusieurs bicolorités, les tendances deviennent trompeuses.</span></div>';
    }
    const filters = {
      // Matchup and OTP/OTD now come from the global performance filters above.
      matchup:'all',
      play:'all',
      recommendation:'all'
    };
    const sort = state.performanceMulliganSort || 'smart';
    const expanded = !!state.performanceExpandedLists?.mulligan || !!options.full;
    let rows = applyMulliganLabFilters(analytics.cards || [], filters);
    // Seuil minimum d'occurrences : on masque les cartes vues une ou deux fois en
    // main d'ouverture (bruit statistique, ex. une carte jouée une seule fois).
    // Repli de sécurité : si aucune carte n'atteint le seuil (très petit
    // échantillon), on garde la liste complète pour ne pas tout vider.
    const MIN_MULLIGAN_OPENINGS = 3;
    const significant = rows.filter(card => n(card.opening) >= MIN_MULLIGAN_OPENINGS);
    if(significant.length) rows = significant;
    rows = filterMulliganCardsBySort(rows, sort).sort((a,b)=>compareMulliganCards(a,b,sort));
    const limit = expanded ? 80 : 10;
    const visible = rows.slice(0, limit);
    const toolbarHtml = `<div class="performance-block-toolbar mulligan-lab-toolbar">
      ${performanceSortSelect('mulligan', [['smart','Priorité'],['kept','Plus gardées'],['thrown','Plus renvoyées'],['seen','Plus vues'],['kept_wr','WR gardée']], sort)}
      ${rows.length > (expanded ? 10 : limit) ? `<button type="button" class="perf-list-link" data-performance-full-list="mulligan">${expanded ? 'Réduire' : `Voir ${rows.length} cartes`}</button>` : ''}
    </div>`;
    const listHtml = visible.length ? `<div class="mulligan-visual-list mulligan-lab-list ${expanded ? 'expanded' : ''}">${visible.map(card => performanceMulliganCardHtml(card)).join('')}</div>` : '<div class="empty-line">Aucune carte ne correspond à ces filtres. Essayez “Toutes” ou un autre matchup.</div>';
    return `<section class="mulligan-lab mulligan-lab-action-first">${toolbarHtml}${listHtml}</section>`;
  }

  function compareMulliganCards(a,b,sort){
    const name = () => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity:'base' });
    const aThrown = n(a.replaced);
    const bThrown = n(b.replaced);
    if(sort === 'smart') return n(b.mulliganScore)-n(a.mulliganScore) || (n(b.opening)-n(a.opening)) || name();
    if(sort === 'kept') return (n(b.kept)-n(a.kept)) || (n(b.keepRate)-n(a.keepRate)) || (n(b.opening)-n(a.opening)) || name();
    if(sort === 'thrown') return (bThrown-aThrown) || ((100-n(b.keepRate))-(100-n(a.keepRate))) || (n(b.opening)-n(a.opening)) || name();
    if(sort === 'kept_wr') return (n(b.keptWr)-n(a.keptWr)) || (n(b.keptGames)-n(a.keptGames)) || (n(b.kept)-n(a.kept)) || name();
    return (n(b.opening)-n(a.opening)) || ((n(b.kept)+n(b.replaced))-(n(a.kept)+n(a.replaced))) || name();
  }

  function performanceMulliganCardHtml(card){
    const view = performanceCardView(card);
    const displayName = fullName(view) || card.name || 'Carte';
    const kept = n(card.kept);
    const replaced = n(card.replaced);
    const total = Math.max(1, kept + replaced);
    const keep = Math.round((kept / total) * 100);
    const throwPct = 100 - keep;
    const recommendation = card.recommendation || mulliganRecommendation(card, arrayify(card._raw?.samples));
    const traits = mulliganCardTraits(card);
    const copyPattern = mulliganCopyPattern(card.samples);
    const curveLabel = traits.cost !== null ? `Coût ${traits.cost}` : 'Coût —';
    const inkLabelText = traits.inkable ? 'Encrable' : traits.uninkable ? 'Non-encrable' : 'Encrable —';
    const deadWeight = mulliganDeadWeightView(card);
    const decisionTag = deadWeight.hasSignal && deadWeight.tone === 'danger' && keep >= 45 ? deadWeight.label : mulliganShortTag(recommendation, keep, throwPct, copyPattern);
    const wrBadge = card.keptGames >= 8 ? `${card.keptWr}% WR gardée` : `${n(card.opening)} mains`;
    const deadWeightTag = deadWeight.hasSignal ? `<span class="mulligan-dead-weight-tag ${escAttr(deadWeight.tone)}">${esc(deadWeight.detail)}</span>` : '';
    return `<article class="mulligan-visual-card mulligan-lab-card mulligan-lab-card-v2 is-clickable ${escAttr(deadWeight.hasSignal && deadWeight.tone === 'danger' ? 'danger' : (recommendation.tone || 'neutral'))}" role="button" tabindex="0" data-performance-card-key="${escAttr(card.key || '')}" data-performance-card-name="${escAttr(displayName)}">
      <div class="mulligan-visual-art">${cardThumbHtml(view, 'mulligan-visual-thumb')}</div>
      <div class="mulligan-visual-body">
        <div class="mulligan-card-head"><h3>${esc(displayName)}</h3><span class="mulligan-rec ${escAttr(recommendation.tone || 'neutral')}">${esc(decisionTag)}</span></div>
        <div class="mulligan-card-stats compact">
          <span>${n(card.opening)} mains</span><span>${kept} gardées</span><span>${replaced} renvoyées</span><span>${esc(curveLabel)}</span><span>${esc(inkLabelText)}</span>
        </div>
        <div class="mulligan-bar"><i style="width:${keep}%"></i><b style="width:${throwPct}%"></b></div>
        <div class="mulligan-bar-labels"><span>Garder ${keep}%</span><span>Renvoyer ${throwPct}%</span></div>
        <div class="mulligan-bottom-tags"><span>${esc(wrBadge)}</span>${deadWeightTag}</div>
      </div>
    </article>`;
  }

  function performanceTurnCurveHtml(analytics){
    const rows = analytics.turnCurve || [];
    if(!rows.length) return '<div class="empty-line">Aucune courbe moyenne disponible sur cet échantillon.</div>';
    const milestone20 = (analytics.loreMilestones || []).find(item => n(item.lore) === 20 && item.avgTurn !== null);
    const milestone15 = (analytics.loreMilestones || []).find(item => n(item.lore) === 15 && item.avgTurn !== null);
    const speedHtml = milestone20 ? `<span>Vitesse réelle</span><strong>20 lore ≈ T${esc(String(milestone20.avgTurn))}</strong><small>${n(milestone20.count)} partie(s) · ${milestone15 ? `15 lore ≈ T${esc(String(milestone15.avgTurn))}` : 'palier 15 à confirmer'}</small>` : '<span>Vitesse réelle</span><strong>À confirmer</strong><small>Ajoutez des parties terminées pour calculer les paliers.</small>';
    const actionTotals = rows.reduce((acc, row) => { acc.ink += n(row.inked); acc.play += n(row.played); acc.quest += n(row.quests); acc.challenge += n(row.challenges); return acc; }, { ink:0, play:0, quest:0, challenge:0 });
    const actionAxis = [['Tempo', actionTotals.play], ['Lore', actionTotals.quest], ['Board', actionTotals.challenge], ['Encrage', actionTotals.ink]].sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Plan';
    const actionHtml = `<span>Plan moyen</span><strong>${esc(actionAxis)} dominant</strong><small>${esc(`${round1(actionTotals.play)} jouées · ${round1(actionTotals.quest)} quêtes · ${round1(actionTotals.challenge)} défis`)}</small>`;
    return `<div class="performance-charts-grid">
      <article class="performance-chart-card"><div class="section-head compact"><div><h3>Lore & main moyenne <button class="info-dot" type="button" data-info="La courbe est calculée tour par tour uniquement avec les parties qui atteignent réellement le tour affiché. Le repère de vitesse indique à quel tour moyen le deck atteint les paliers de lore." aria-label="Infos sur Lore & main moyenne">i</button></h3></div></div><div class="chart-fixed-readout" data-chart-readout-for="performanceLoreAvgChart">${speedHtml}</div><div class="chart-wrap performance-chart-wrap"><canvas id="performanceLoreAvgChart" aria-label="Courbe moyenne de lore et de main"></canvas></div></article>
      <article class="performance-chart-card"><div class="section-head compact"><div><h3>Plan de jeu par tour <button class="info-dot" type="button" data-info="Chaque barre montre ce que le deck fait en moyenne à ce tour : encrer, jouer des cartes, quêter ou défier. Les tours tardifs utilisent uniquement les parties qui les atteignent réellement." aria-label="Infos sur Plan de jeu par tour">i</button></h3></div></div><div class="chart-fixed-readout" data-chart-readout-for="performanceActionAvgChart">${actionHtml}</div><div class="chart-wrap performance-chart-wrap"><canvas id="performanceActionAvgChart" aria-label="Actions moyennes par tour"></canvas></div></article>
    </div>`;
  }


  function looksLikeTechnicalCardName(value=''){
    const raw = String(value || '').trim();
    if(!raw) return false;
    if(/^[a-z0-9_:-]{10,}$/i.test(raw) && !/\s/.test(raw)) return true;
    if(/^card[_-]/i.test(raw)) return true;
    if(/^[0-9a-f]{8,}/i.test(raw)) return true;
    return false;
  }

  function performanceCardView(card){
    const local = findLocalCardByPerformanceCard(card);
    const saved = findSavedCardByPerformanceCard(card);
    const seed = saved || local || { id:card.key, fullName:card.name, name:card.name, type:card.type, colors:card.colors || [] };
    const hydrated = hydrateCard(seed);
    const image = saved?.image || saved?.imageSmall || hydrated.image || hydrated.imageSmall || duelinkImageUrl(hydrated) || '';
    const imageSmall = saved?.imageSmall || saved?.image || hydrated.imageSmall || hydrated.image || duelinkImageUrl(hydrated) || '';
    const resolvedName = saved ? (saved.fullName || saved.name || fullName(saved)) : (local ? fullName(local) : fullName(hydrated));
    const displayName = cleanCardName(resolvedName && resolvedName !== 'Carte inconnue' ? resolvedName : (card.name || card.key || 'Carte inconnue'));
    return {
      ...hydrated,
      image,
      imageSmall,
      fullName:displayName,
      name:displayName,
      type:card.type || saved?.type || hydrated.type || '',
      colors:card.colors?.length ? card.colors : (saved?.colors?.length ? saved.colors : hydrated.colors)
    };
  }

  function performanceDisplayName(card){
    const view = performanceCardView(card || {});
    return cleanCardName(fullName(view) || card?.name || card?.key || 'Carte inconnue');
  }

  function findSavedCardByPerformanceCard(card){
    const wantedKey = slug(card?.key || '');
    const wantedName = slug(card?.name || '');
    if(!wantedKey && !wantedName) return null;
    for(const row of state.savedMatches || []){
      const pools = [row.analysis_json?.cards?.mine, row.analysis_json?.cards?.opponent];
      (row.analysis_json?.games || []).forEach(game => {
        const mull = game?.mulligan || {};
        pools.push(mull.initial, mull.resolved, mull.replaced);
      });
      if(row.analysis_json?.mulligan){
        const mull = row.analysis_json.mulligan;
        pools.push(mull.initial, mull.resolved, mull.replaced);
      }
      for(const cards of pools){
        for(const saved of (cards || [])){
          const key = slug(saved?.key || '');
          const name = slug(saved?.name || '');
          if((wantedKey && key === wantedKey) || (wantedName && name === wantedName)){
            if(saved?.image || saved?.imageSmall) return saved;
          }
        }
      }
    }
    return null;
  }

  function findLocalCardByPerformanceCard(card){
    const candidates = [card?.key, card?.name, slug(card?.name || '')].filter(Boolean);
    for(const key of candidates){
      const direct = state.index.get(key) || state.index.get(slug(key));
      if(direct) return direct;
    }
    const wanted = slug(card?.name || '');
    if(!wanted) return null;
    const wantedCore = wanted.replace(/-+/g,'-');
    const seen = new Set();
    for(const local of state.index.values()){
      if(!local || seen.has(local)) continue;
      seen.add(local);
      const localFull = slug(fullName(local));
      const localName = slug(local.name || '');
      const localVersion = slug(local.version || '');
      if(localFull === wantedCore || localName === wantedCore || localVersion === wantedCore) return local;
      if(localFull.includes(wantedCore) || wantedCore.includes(localFull)) return local;
      const wantedBase = wantedCore.split('-').slice(0,2).join('-');
      const localBase = localFull.split('-').slice(0,2).join('-');
      if(wantedBase && (localFull.startsWith(wantedBase) || localBase === wantedBase)) return local;
    }
    return null;
  }

  function bindPerformanceCardTiles(){
    document.querySelectorAll('[data-performance-card-key], [data-performance-card-name]').forEach(tile => {
      tile.onclick = () => openCardModal(performanceCardView({ key:tile.dataset.performanceCardKey, name:tile.dataset.performanceCardName }), tile);
      tile.onkeydown = event => { if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); tile.click(); } };
    });
  }


  function renderPerformanceCharts(analytics){
    const rows = analytics.turnCurve || [];
    const labels = rows.map(row => `T${row.turn}`);
    if(!rows.length || !document.getElementById('performanceLoreAvgChart')){
      if(charts.performanceLore){ charts.performanceLore.destroy(); charts.performanceLore = null; }
      if(charts.performanceAction){ charts.performanceAction.destroy(); charts.performanceAction = null; }
      return;
    }
    const [mine, opp] = scopeChartPair('mine');
    const perfActionColors = actionCategoryColors('mine');
    const isMobile = window.matchMedia?.('(max-width:820px)')?.matches === true;
    const maxLore = Math.max(21, ...rows.map(row => n(row.lore) + 2));
    const barMax = rows.length <= 12 ? (isMobile ? 22 : 46) : (rows.length <= 18 ? (isMobile ? 18 : 38) : (isMobile ? 15 : 34));
    const barCategory = rows.length <= 12 ? .96 : (rows.length <= 18 ? .94 : .90);
    const barRatio = rows.length <= 12 ? .90 : .86;
    charts.performanceLore = chart(charts.performanceLore, 'performanceLoreAvgChart', 'line', {
      labels,
      datasets:[{
        label:'Lore moyen',
        data:rows.map(row => n(row.lore)),
        borderColor:mine,
        backgroundColor:hexToRgba(mine,.10),
        pointBackgroundColor:mine,
        pointBorderColor:'rgba(255,255,255,.88)',
        borderWidth:2.5,
        tension:.50,
        fill:true
      },{
        label:'Main moyenne',
        data:rows.map(row => n(row.hand)),
        borderColor:opp,
        backgroundColor:'transparent',
        pointBackgroundColor:opp,
        pointBorderColor:'rgba(255,255,255,.88)',
        borderWidth:2.2,
        tension:.50,
        fill:false
      },{
        label:'Objectif · 20 lore',
        data:rows.map(() => 20),
        borderColor:'rgba(255,255,255,.22)',
        borderDash:[6,8],
        borderWidth:1,
        pointRadius:0,
        pointHoverRadius:0,
        tension:0,
        fill:false,
        noGlow:true,
        tooltipSkip:true
      }]
    }, { scales:{ y:{ beginAtZero:true, suggestedMax:maxLore, ticks:{ precision:0 }, grid:{ display:true, color:'rgba(255,255,255,.07)' } } } });

    charts.performanceAction = chart(charts.performanceAction, 'performanceActionAvgChart', 'bar', {
      labels,
      datasets:[
        { label:'Encrées', data:rows.map(row => n(row.inked)), backgroundColor:hexToRgba(perfActionColors.ink,.92), borderColor:perfActionColors.ink, maxBarThickness:barMax, categoryPercentage:barCategory, barPercentage:barRatio },
        { label:'Jouées', data:rows.map(row => n(row.played)), backgroundColor:hexToRgba(perfActionColors.play,.92), borderColor:perfActionColors.play, maxBarThickness:barMax, categoryPercentage:barCategory, barPercentage:barRatio },
        { label:'Quêtes', data:rows.map(row => n(row.quests)), backgroundColor:hexToRgba(perfActionColors.quest,.86), borderColor:perfActionColors.quest, maxBarThickness:barMax, categoryPercentage:barCategory, barPercentage:barRatio },
        { label:'Défis', data:rows.map(row => n(row.challenges)), backgroundColor:hexToRgba(perfActionColors.challenge,.86), borderColor:perfActionColors.challenge, maxBarThickness:barMax, categoryPercentage:barCategory, barPercentage:barRatio }
      ]
    }, { scales:{ x:{ stacked:false }, y:{ stacked:false, beginAtZero:true, ticks:{ precision:0 }, grid:{ display:true, color:'rgba(255,255,255,.07)' } } }, datasets:{ bar:{ maxBarThickness:barMax, categoryPercentage:barCategory, barPercentage:barRatio } } });
  }


  function renderPerformanceTable(target, html){
    if(!target) return;
    target.innerHTML = html;
  }

  function pct(wins,total){
    return total ? Math.round((wins / total) * 100) : 0;
  }

  function avg(values){
    const nums = (values || []).map(Number).filter(Number.isFinite);
    if(!nums.length) return null;
    return nums.reduce((sum,value)=>sum+value,0) / nums.length;
  }


  function deckMissingRows(){
    return (state.savedMatches || []).filter(row => {
      const name = row.deck_name || row.analysis_json?.deck?.name || '';
      return !row.deck_profile_id && !isNamedDeckName(name);
    });
  }

  function cleanupGroupsByColor(rows){
    const groups = new Map();
    (rows || []).forEach(row => {
      const key = colorFilterKey(rowMineColors(row)) || 'unknown';
      const group = groups.get(key) || { key, rows:[] };
      group.rows.push(row);
      groups.set(key, group);
    });
    return [...groups.values()].sort((a,b) => b.rows.length - a.rows.length || cleanupGroupLabel(a.key).localeCompare(cleanupGroupLabel(b.key)));
  }

  function cleanupGroupLabel(key){
    if(!key || key === 'unknown') return 'Bicolorité non détectée';
    return key.split('|').map(inkLabel).join(' / ');
  }

  function cleanupGroupColors(key){
    if(!key || key === 'unknown') return [];
    return key.split('|').map(inkKey).filter(Boolean).slice(0,2);
  }

  function renderPostImportCleanup(){
    // V136.0B: le nommage manuel des decks et les cartes de maintenance sont masqués.
    // Les versions de deck seront déduites plus tard via decklist API + deck hash.
    if(els.postImportCleanupList) els.postImportCleanupList.innerHTML = '';
  }

  async function handlePostImportCleanupClick(event){
    const existing = event.target.closest('[data-cleanup-assign-existing]');
    const create = event.target.closest('[data-cleanup-assign-new]');
    const focus = event.target.closest('[data-cleanup-focus-group]');
    if(!existing && !create && !focus) return;

    if(focus){
      const key = focus.dataset.cleanupFocusGroup || 'all';
      if(els.historyColorFilter) els.historyColorFilter.value = key === 'unknown' ? 'all' : key;
      if(els.historyDeckFilter) els.historyDeckFilter.value = 'all';
      renderPerformanceData();
      document.getElementById('historyList')?.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    event.preventDefault();
    if(!state.currentUser) return;
    const key = (existing || create).dataset.cleanupAssignExisting || (existing || create).dataset.cleanupAssignNew;
    try{
      let deck = null;
      if(existing){
        const profile = (state.deckProfiles || []).find(item => String(item.id) === String(existing.dataset.profileId));
        if(!profile) throw new Error('Deck introuvable.');
        deck = { deck_profile_id:profile.id, deck_name:profile.name };
      }
      if(create){
        const input = document.querySelector(`[data-cleanup-new-deck-name="${cssEscape(key)}"]`);
        const name = String(input?.value || '').trim();
        if(!name) throw new Error('Entrez un nom de deck avant d’appliquer le groupe.');
        const profile = await upsertDeckProfile({ name, colors:cleanupGroupColors(key) });
        deck = { deck_profile_id:profile?.id || null, deck_name:profile?.name || name };
      }
      const rows = deckMissingRows().filter(row => (colorFilterKey(rowMineColors(row)) || 'unknown') === key);
      if(!rows.length) throw new Error('Aucune analyse à modifier dans ce groupe.');
      els.postImportCleanupList.innerHTML = `<div class="empty-line">Mise à jour de ${rows.length} analyse(s)…</div>`;
      for(const row of rows){
        await updateSavedMatchDeck(row.id, deck);
      }
      await refreshDeckProfiles({ force:true, silent:true });
      await refreshSavedMatches({ force:true, silent:true });
      renderDeckOptions();
      renderPerformanceData();
    }catch(err){
      console.error(err);
      if(els.postImportCleanupList){
        els.postImportCleanupList.insertAdjacentHTML('afterbegin', `<div class="cleanup-error">Erreur : ${esc(err.message || err)}</div>`);
      }
    }
  }


  function historyFilterStateKey(){
    return [
      selectedFilterValues('historyColorFilter').join('|'),
      selectedFilterValues('historyDeckFilter').join('|'),
      selectedFilterValues('historyOpponentColorFilter').join('|'),
      selectedFilterValues('historyResultFilter').join('|'),
      selectedFilterValues('historyFormatFilter').join('|'),
      selectedFilterValues('historyTempoFilter').join('|'),
      String(els.historySearchInput?.value || '').trim().toLowerCase()
    ].join('::');
  }

  function historyActiveFilterBadges(){
    const badges = [];
    const add = (label, values) => {
      if(values.length) badges.push(`<span class="history-filter-badge">${esc(label)} · ${values.length}</span>`);
    };
    add('Bicolorité', selectedFilterValues('historyColorFilter'));
    add('Deck', selectedFilterValues('historyDeckFilter'));
    add('Adversaire', selectedFilterValues('historyOpponentColorFilter'));
    add('Résultat', selectedFilterValues('historyResultFilter'));
    add('Format', selectedFilterValues('historyFormatFilter'));
    add('Départ', selectedFilterValues('historyTempoFilter'));
    if(String(els.historySearchInput?.value || '').trim()) badges.push('<span class="history-filter-badge">Recherche</span>');
    return badges.length ? badges.join('') : '<span class="history-filter-badge muted">Aucun filtre actif</span>';
  }

  function historySummaryHtml(rows, total){
    const visibleRows = rows || [];
    const wins = visibleRows.filter(row => row.result === 'win').length;
    const losses = visibleRows.filter(row => row.result === 'loss').length;
    const winrate = visibleRows.length ? Math.round((wins / visibleRows.length) * 100) : 0;
    const latest = visibleRows[0];
    const latestColors = latest ? rowMineColors(latest) : [];
    const latestDeck = latestColors.length ? inkDotsHtml(latestColors) : esc(latest?.deck_name || latest?.analysis_json?.deck?.name || '—');
    return `<div class="history-summary-strip" aria-label="Résumé de l’historique filtré">
      <div><span>Total</span><strong>${esc(total)}</strong><small>analyses sauvegardées</small></div>
      <div><span>Vue actuelle</span><strong>${esc(visibleRows.length)}</strong><small>matchs filtrés</small></div>
      <div><span>Winrate</span><strong>${visibleRows.length ? `${winrate}%` : '—'}</strong><small>${wins} V · ${losses} D</small></div>
      <div><span>Dernière bicolorité</span><strong class="history-summary-colors">${latestDeck}</strong><small>${esc(latest ? formatSavedDate(getSavedMatchPlayedAt(latest)) : '—')}</small></div>
    </div>`;
  }


  function savedMatchDayKey(row){
    const value = getSavedMatchPlayedAt(row) || row?.created_at || '';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return 'unknown';
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function savedMatchDayLabel(row){
    const value = getSavedMatchPlayedAt(row) || row?.created_at || '';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return 'Date inconnue';
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate()-1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    const key = savedMatchDayKey(row);
    if(key === todayKey) return "Aujourd’hui";
    if(key === yesterdayKey) return 'Hier';
    return date.toLocaleDateString('fr-CH', { day:'2-digit', month:'short', year:'numeric' }).replace('.', '');
  }

  function savedMatchGroupedRowsHtml(rows=[]){
    const groups = [];
    rows.forEach(row => {
      const key = savedMatchDayKey(row);
      let group = groups.find(item => item.key === key);
      if(!group){ group = { key, label:savedMatchDayLabel(row), rows:[] }; groups.push(group); }
      group.rows.push(row);
    });
    return groups.map(group => `<section class="history-day-group"><div class="history-day-separator"><strong>${esc(group.label)}</strong><span>${group.rows.length} partie${group.rows.length > 1 ? 's' : ''}</span></div>${group.rows.map(row => savedMatchRowHtml(row)).join('')}</section>`).join('');
  }

  // Vue Historique : on regroupe les games d'une même série BO3 (mêmes
  // series_match_id) en une seule ligne synthétique pour ne pas afficher 2-3
  // doublons par série. Le détail reste accessible (id = dernière game).
  function collapseSeriesForHistory(rows){
    const groups = new Map();
    const order = [];
    for(const row of rows){
      const seriesId = row.series_match_id || row.id;
      if(!groups.has(seriesId)){ order.push(seriesId); groups.set(seriesId, []); }
      groups.get(seriesId).push(row);
    }
    return order.map(seriesId => {
      const games = groups.get(seriesId);
      if(games.length <= 1) return games[0];
      const sortedByGame = [...games].sort((a,b)=>String(a.played_at||'').localeCompare(String(b.played_at||'')));
      const base = sortedByGame[sortedByGame.length-1];
      const gameWins = games.filter(g => g.result === 'win').length;
      const gameLosses = games.filter(g => g.result === 'loss').length;
      return {
        ...base,
        result: gameWins > gameLosses ? 'win' : 'loss',
        wins: gameWins,
        losses: gameLosses,
        score_label: `${gameWins}-${gameLosses}`,
        total_turns: games.reduce((sum,g)=>sum + n(g.total_turns), 0),
        __seriesGames: games.length
      };
    });
  }

  function renderSavedHistory(){
    if(!els.historyList) return;
    if(!state.currentUser){
      renderPostImportCleanup();
      els.historyList.innerHTML = '<div class="empty-line">Connectez-vous avec Discord pour afficher vos matchs sauvegardés.</div>';
      if(els.historyStatus) els.historyStatus.textContent = 'Historique disponible après connexion.';
      if(els.historyDetail){ els.historyDetail.hidden = true; els.historyDetail.innerHTML = ''; }
      return;
    }

    if(!state.savedMatchesLoaded || state.savedMatchesLoading){
      renderPostImportCleanup();
      els.historyList.innerHTML = '<div class="empty-line">Chargement de l’historique…</div>';
      if(els.historyStatus) els.historyStatus.textContent = 'Chargement de vos analyses sauvegardées…';
      return;
    }

    const rows = collapseSeriesForHistory(filteredSavedMatches());
    const total = state.savedMatches.length;
    const filterKey = historyFilterStateKey();
    if(state.historyLastFilterKey !== filterKey){
      state.historyVisibleCount = 5;
      state.historyLastFilterKey = filterKey;
      state.activeHistoryActionsId = null;
    }
    const visibleCount = Math.max(5, n(state.historyVisibleCount) || 5);
    const visibleRows = rows.slice(0, visibleCount);
    const remaining = Math.max(0, rows.length - visibleRows.length);
    if(els.historyStatus){
      els.historyStatus.textContent = total
        ? `${rows.length} résultat(s) sur ${total} analyse(s). ${visibleRows.length} affiché(s).`
        : 'Aucune analyse sauvegardée pour le moment.';
    }

    if(!total){
      renderPostImportCleanup();
      els.historyList.innerHTML = '<div class="history-empty-state"><strong>Aucune analyse sauvegardée.</strong><span>Importez un replay, connectez-vous, puis utilisez “Sauvegarder l’analyse”.</span><button type="button" class="primary-button compact-primary" data-app-view="analysis">Importer un replay</button></div>';
      if(els.historyDetail){ els.historyDetail.hidden = true; els.historyDetail.innerHTML = ''; }
      return;
    }

    if(!rows.length){
      renderPostImportCleanup();
      els.historyList.innerHTML = `<div class="history-list-head">${historySummaryHtml(rows, total)}<div class="history-active-filters">${historyActiveFilterBadges()}</div></div><div class="empty-line">Aucun match ne correspond aux filtres actuels.</div>`;
      if(els.historyDetail){ els.historyDetail.hidden = true; }
      return;
    }

    if(!rows.some(row => row.id === state.selectedSavedMatchId)) state.selectedSavedMatchId = rows[0].id;

    const listHead = `<div class="history-list-head">
      ${historySummaryHtml(rows, total)}
      <div class="history-active-filters">${historyActiveFilterBadges()}</div>
    </div>`;
    const loadMore = remaining
      ? `<button type="button" class="history-load-more" data-history-load-more>Afficher 5 matchs de plus <span>${remaining} restant(s)</span></button>`
      : `<div class="history-end-note">Tous les matchs filtrés sont affichés.</div>`;
    els.historyList.innerHTML = `${listHead}<div class="history-compact-list history-compact-list-grouped">${savedMatchGroupedRowsHtml(visibleRows)}</div>${loadMore}`;
    bindSavedMatchButtons();
    renderSavedMatchDetail(rows.find(row => row.id === state.selectedSavedMatchId) || rows[0]);
    renderPostImportCleanup();
  }

  function historySourceBadgesHtml(row){
    const sourceType = String(row?.source_type || row?.analysis_json?.source_type || 'manual').toLowerCase();
    const sourceLabel = sourceType.includes('duelink') ? 'Duels.ink API' : 'Manuel';
    const sourceClass = sourceType.includes('duelink') ? 'api' : 'manual';
    const mode = String(row?.duelink_source || row?.analysis_json?.api_metadata?.source || '').trim();
    const queue = String(row?.duelink_queue || row?.analysis_json?.api_metadata?.queue || '').trim();
    const modeLabel = mode ? mode.replace(/_/g, ' ') : '';
    const queueLabel = queue ? queue.replace(/_/g, ' ') : '';
    return `<span class="history-source-badges"><em class="history-source-badge ${escAttr(sourceClass)}">${esc(sourceLabel)}</em>${modeLabel ? `<em class="history-source-badge mode">${esc(modeLabel)}</em>` : ''}${queueLabel ? `<em class="history-source-badge queue">${esc(queueLabel)}</em>` : ''}</span>`;
  }

  function savedMatchRowHtml(row){
    const isActive = row.id === state.selectedSavedMatchId;
    const result = row.result === 'win' ? 'Victoire' : 'Défaite';
    const resultClass = row.result === 'win' ? 'win' : 'loss';
    const format = String(row.format || 'BO1').toUpperCase();
    const date = formatSavedDate(getSavedMatchPlayedAt(row));
    const matchup = row.matchup_label || 'Matchup non renseigné';
    const colors = rowMineColors(row);
    const opponentColors = rowOpponentColors(row);
    const opponent = row.opponent_name ? `vs ${row.opponent_name}` : 'Adversaire non renseigné';
    const deck = row.deck_name || row.analysis_json?.deck?.name || '';
    const score = row.score_label || `${n(row.final_mine_lore)}-${n(row.final_opp_lore)}`;
    const games = Array.isArray(row.analysis_json?.games) ? row.analysis_json.games : [];
    const hasGames = format === 'BO3' && games.length > 1;
    const expanded = state.expandedSavedMatchId === row.id;
    const gamesHtml = expanded && hasGames ? savedGamesHtml(games) : '';
    const actionsOpen = state.activeHistoryActionsId === row.id;
    const turnsLabel = hasGames ? `${games.length} manches` : `${n(row.total_turns) || "—"} tours`;
    const isOwnMatch = !row.user_id || row.user_id === state.currentUser?.id;
    const teamShareLabel = row.team_visible ? "✓ Partagé avec l’équipe" : "Partager avec l’équipe";
    const teamShareClass = row.team_visible ? "team-visible-active" : "";
    let teamShareBtn = "";
    if (state.team && isOwnMatch) {
      teamShareBtn = `<button type="button" class="ghost-button history-mini-button ${teamShareClass}" data-team-visible="${escAttr(row.id)}">${esc(teamShareLabel)}</button>`;
    }
    const compactActions = `<button type="button" class="ghost-button history-mini-button primary" data-load-saved="${escAttr(row.id)}">Voir l’analyse</button>
        <button type="button" class="ghost-button history-mini-button" data-select-saved="${escAttr(row.id)}">Détails</button>
        ${teamShareBtn}
        <button type="button" class="ghost-button history-mini-button danger" data-delete-saved="${escAttr(row.id)}">Supprimer</button>`;
    const isMemberMatch = state.teamMode && row.user_id && state.teamDisplayNames[row.user_id];
    const memberTagHtml = isMemberMatch
      ? `<span class="team-member-tag${row.user_id === state.currentUser?.id ? ' team-member-tag-self' : ''}">${esc(state.teamDisplayNames[row.user_id])}</span>`
      : '';
    return `<article class="history-row ${escAttr(resultClass)} ${isActive ? 'active' : ''} ${hasGames ? 'has-games' : ''} ${actionsOpen ? 'actions-open' : ''}" data-saved-id="${escAttr(row.id)}">
      <span class="history-result-rail ${escAttr(resultClass)}" aria-hidden="true"></span>
      <button type="button" class="history-row-main" data-select-saved="${escAttr(row.id)}" aria-expanded="${expanded && hasGames ? 'true' : 'false'}">
        <span class="history-row-copy">
          <span class="history-line-top"><em>${esc(format)}</em>${colorMatchupDotsHtml(colors, opponentColors, matchup)}<b>${esc(result)} ${esc(score)}</b>${memberTagHtml}</span>
          <span class="history-opponent-line">${esc(opponent)}</span>
          <span class="history-row-submeta"><i>${esc(turnsLabel)}</i><i>${esc(date)}</i>${deck ? `<i>${esc(deck)}</i>` : ''}</span>
          <span class="history-row-badges">${historySourceBadgesHtml(row)}${apiDecklistBadgesHtml(row)}${qualityBadgesHtml(row)}</span>
        </span>
      </button>
      <button type="button" class="history-kebab-button" data-toggle-history-actions="${escAttr(row.id)}" aria-expanded="${actionsOpen ? 'true' : 'false'}" aria-label="Options du match">⋯</button>
      <div class="history-row-actions history-actions-desktop">${compactActions}</div>
      <div class="history-actions-mobile-panel" ${actionsOpen ? '' : 'hidden'}>${compactActions}</div>
      ${gamesHtml}
    </article>`;
  }

  function savedMatchDeckEditHtml(row){
    const rowColors = rowMineColors(row);
    const rowKey = colorFilterKey(rowColors);
    const profiles = namedDeckProfiles().filter(profile => profileMatchesColorKey(profile, rowKey));
    const currentId = row.deck_profile_id || '';
    const selectedId = Object.prototype.hasOwnProperty.call(state.pendingDeckSelection || {}, row.id) ? state.pendingDeckSelection[row.id] : currentId;
    const pills = profiles.length
      ? profiles.map(profile => {
        const active = profile.id === selectedId;
        return `<button type="button" class="deck-edit-pill ${active ? 'active' : ''}" data-select-deck-profile="${escAttr(row.id)}" data-profile-id="${escAttr(profile.id)}" aria-pressed="${active ? 'true' : 'false'}">${inkDotsHtml(profileColors(profile))}<span>${esc(profile.name)}</span></button>`;
      }).join('')
      : '<span class="deck-edit-empty">Aucune version de deck existante pour cette bicolorité.</span>';
    return `<div class="deck-edit-panel" data-deck-edit-panel="${escAttr(row.id)}">
      <div>
        <strong>Modifier le deck associé</strong>
        <small>Sélectionnez une version de cette bicolorité, ou créez-en une nouvelle.</small>
      </div>
      <div class="deck-edit-pills">${pills}</div>
      <div class="deck-edit-new">
        <input type="text" data-new-deck-name="${escAttr(row.id)}" placeholder="Créer un nouveau nom de deck" maxlength="80">
        <button type="button" class="ghost-button history-mini-button primary" data-apply-deck-selection="${escAttr(row.id)}">Enregistrer</button>
        <button type="button" class="ghost-button history-mini-button" data-cancel-deck-edit="${escAttr(row.id)}">Annuler</button>
      </div>
    </div>`;
  }

  function savedGamesHtml(games){
    return `<div class="history-games" aria-label="Manches du BO3">
      ${games.map(game => {
        const win = Boolean(game.isWin);
        const result = win ? 'Victoire' : 'Défaite';
        const score = `${n(game.finalMineLore)}-${n(game.finalOppLore)}`;
        const otp = game.otp ? 'OTP' : 'OTD';
        return `<div class="history-game-row ${win ? 'win' : 'loss'}">
          <span class="history-game-index">G${n(game.gameNumber) || '—'}</span>
          <strong>${esc(result)}</strong>
          <span>${esc(score)}</span>
          <span>${esc(n(game.turnCount) || '—')} tours</span>
          <em>${esc(otp)}</em>
        </div>`;
      }).join('')}
    </div>`;
  }

  function bindSavedMatchButtons(){
    document.querySelectorAll('[data-history-load-more]').forEach(button => {
      button.onclick = () => {
        state.historyVisibleCount = Math.min(collapseSeriesForHistory(filteredSavedMatches()).length, (n(state.historyVisibleCount) || 5) + 5);
        renderPerformanceData();
      };
    });
    document.querySelectorAll('[data-select-saved]').forEach(button => {
      button.onclick = async () => {
        const id = button.dataset.selectSaved;
        const row = state.savedMatches.find(item => item.id === id);
        const games = Array.isArray(row?.analysis_json?.games) ? row.analysis_json.games : [];
        const isExpandable = String(row?.format || '').toUpperCase() === 'BO3' && games.length > 1;
        state.selectedSavedMatchId = id;
        state.expandedSavedMatchId = isExpandable ? (state.expandedSavedMatchId === id ? null : id) : null;
        renderPerformanceData();
        // Lazy-load full analysis_json so Moteur de lore / Carte encrée / Menace adverse can render.
        if(row && !row.analysis_json){
          try{
            const full = await getSavedMatch(id);
            if(full){
              const idx = state.savedMatches.findIndex(item => item.id === id);
              if(idx >= 0) state.savedMatches[idx] = { ...state.savedMatches[idx], ...full };
              if(state.selectedSavedMatchId === id) renderPerformanceData();
            }
          }catch(err){ console.warn('Détail match non chargé', err); }
        }
      };
    });
    document.querySelectorAll('[data-load-saved]').forEach(button => {
      button.onclick = () => {
        const row = state.savedMatches.find(item => item.id === button.dataset.loadSaved);
        loadSavedAnalysis(row);
      };
    });

    document.querySelectorAll('[data-toggle-history-actions]').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        const id = button.dataset.toggleHistoryActions;
        state.activeHistoryActionsId = state.activeHistoryActionsId === id ? null : id;
        renderPerformanceData();
      };
    });

    document.querySelectorAll('[data-cancel-deck-edit]').forEach(button => {
      button.onclick = () => {
        state.editingSavedMatchId = null;
        renderPerformanceData();
      };
    });
    document.querySelectorAll('[data-select-deck-profile]').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        const id = button.dataset.selectDeckProfile;
        state.pendingDeckSelection = { ...(state.pendingDeckSelection || {}), [id]: button.dataset.profileId || '' };
        renderPerformanceData();
      };
    });
    document.querySelectorAll('[data-apply-deck-selection]').forEach(button => {
      button.onclick = () => applyDeckSelectionToSavedMatch(button.dataset.applyDeckSelection);
    });
    document.querySelectorAll('[data-apply-deck-profile]').forEach(button => {
      button.onclick = () => applyDeckProfileToSavedMatch(button.dataset.applyDeckProfile, button.dataset.profileId);
    });
    document.querySelectorAll('[data-create-deck-for-match]').forEach(button => {
      button.onclick = () => createAndApplyDeckToSavedMatch(button.dataset.createDeckForMatch);
    });
    document.querySelectorAll('[data-team-visible]').forEach(button => {
      button.onclick = async () => {
        const id = button.dataset.teamVisible;
        const row = state.savedMatches.find(item => item.id === id);
        if(!row) return;
        const newVisible = !row.team_visible;
        try {
          button.disabled = true;
          await patchSavedMatchTeamVisible(id, newVisible);
          row.team_visible = newVisible;
          renderPerformanceData();
        } catch(err) {
          console.error(err);
          if(els.historyStatus) els.historyStatus.textContent = `Erreur : ${err.message}`;
        } finally {
          button.disabled = false;
        }
      };
    });

    document.querySelectorAll('[data-delete-saved]').forEach(button => {
      button.onclick = async () => {
        const id = button.dataset.deleteSaved;
        const row = state.savedMatches.find(item => item.id === id);
        const label = row?.title || 'cette analyse';
        if(!confirm(`Supprimer ${label} ?`)) return;
        try{
          button.disabled = true;
          await deleteSavedMatch(id);
          state.savedMatches = state.savedMatches.filter(item => item.id !== id);
          if(state.selectedSavedMatchId === id) state.selectedSavedMatchId = state.savedMatches[0]?.id || null;
          if(state.expandedSavedMatchId === id) state.expandedSavedMatchId = null;
          renderPerformanceData();
        }catch(err){
          console.error(err);
          if(els.historyStatus) els.historyStatus.textContent = `Erreur suppression : ${err.message}`;
        }
      };
    });
  }

  async function applyDeckSelectionToSavedMatch(matchId){
    const row = state.savedMatches.find(item => item.id === matchId);
    if(!row) return;
    const input = document.querySelector(`[data-new-deck-name="${CSS.escape(matchId)}"]`);
    const name = String(input?.value || '').trim();
    if(name){
      await createAndApplyDeckToSavedMatch(matchId);
      return;
    }
    const profileId = state.pendingDeckSelection?.[matchId] || row.deck_profile_id || '';
    if(!profileId){
      if(input) input.focus();
      if(els.historyStatus) els.historyStatus.textContent = 'Choisissez une version existante ou créez un nouveau nom de deck.';
      return;
    }
    await applyDeckProfileToSavedMatch(matchId, profileId);
  }

  async function applyDeckProfileToSavedMatch(matchId, profileId){
    const row = state.savedMatches.find(item => item.id === matchId);
    const profile = state.deckProfiles.find(item => item.id === profileId);
    if(!row || !profile) return;
    try{
      const updated = await updateSavedMatchDeck(matchId, { deck_profile_id:profile.id, deck_name:profile.name });
      state.savedMatches = state.savedMatches.map(item => item.id === matchId ? { ...item, ...updated } : item);
      if(state.pendingDeckSelection) delete state.pendingDeckSelection[matchId];
      state.editingSavedMatchId = null;
      state.savedAnalytics = { games:[], cardStats:[], turnStats:[], key:'', loading:false, loadingIds:[], loadedIds:[], error:'' };
      clearSessionCacheForCurrentUser();
      renderPerformanceData();
    }catch(err){
      console.error(err);
      if(els.historyStatus) els.historyStatus.textContent = `Erreur modification deck : ${err.message}`;
    }
  }

  async function createAndApplyDeckToSavedMatch(matchId){
    const row = state.savedMatches.find(item => item.id === matchId);
    const input = document.querySelector(`[data-new-deck-name="${CSS.escape(matchId)}"]`);
    const name = String(input?.value || '').trim();
    if(!row || !name){
      if(input) input.focus();
      return;
    }
    try{
      const colors = rowMineColors(row).map(inkLabel);
      const profile = await upsertDeckProfile({ name, colors });
      await refreshDeckProfiles({ force:true, silent:true });
      await applyDeckProfileToSavedMatch(matchId, profile.id);
    }catch(err){
      console.error(err);
      if(els.historyStatus) els.historyStatus.textContent = `Erreur création deck : ${err.message}`;
    }
  }

  function renderSavedMatchDetail(row){
    if(!els.historyDetail) return;
    if(!row){
      els.historyDetail.hidden = true;
      els.historyDetail.innerHTML = '';
      return;
    }
    const analysis = row.analysis_json || {};
    const narrative = analysis.narrative || {};
    const mineCards = analysis.cards?.mine || [];
    const oppCards = analysis.cards?.opponent || [];
    const topMineLore = [...mineCards].sort((a,b)=>n(b.lore)-n(a.lore) || n(b.quest)-n(a.quest))[0];
    const topInked = [...mineCards].sort((a,b)=>n(b.inked)-n(a.inked))[0];
    const topOppLore = [...oppCards].sort((a,b)=>n(b.lore)-n(a.lore) || n(b.quest)-n(a.quest))[0];
    const result = row.result === 'win' ? 'Victoire' : 'Défaite';
    const resultClass = row.result === 'win' ? 'win' : 'loss';
    const format = String(row.format || 'BO1').toUpperCase();
    const score = row.score_label || `${n(row.final_mine_lore)}-${n(row.final_opp_lore)}`;
    const games = Array.isArray(analysis.games) ? analysis.games : [];
    const deckName = row.deck_name || analysis.deck?.name || '';
    const opponentName = row.opponent_name || 'Adversaire non renseigné';
    const date = formatSavedDate(getSavedMatchPlayedAt(row));
    const turns = n(row.total_turns) || '—';
    const resultTone = row.result === 'win' ? 'positive' : 'negative';
    const detailGames = format === 'BO3' && games.length > 1 ? `<div class="history-detail-games"><span>Manches du BO3</span>${savedGamesHtml(games)}</div>` : '';
    const duelink = row.duelink_url ? `<a href="${escAttr(row.duelink_url)}" target="_blank" rel="noopener">Ouvrir Duels.ink</a>` : '<span>Non renseigné</span>';
    const apiMineDeck = apiDecklistStatus(row, 'mine');
    const apiMeta = sanitizeDuelinkApiObject(row.api_metadata || analysis.api_metadata || {});
    const apiDecklistsHtml = [
      decklistPreviewHtml('Votre deck Duels.ink', apiMineDeck)
    ].filter(Boolean).join('');
    const apiInfoHtml = String(row.source_type || analysis.source_type || '').toLowerCase().includes('duelink') ? `<div class="history-api-info compact">
      <div class="history-api-info-head"><span>Duels.ink</span><strong>${esc(duelinkSourceLabel(row.duelink_source || apiMeta.duelink_source || apiMeta.source || ''))}</strong></div>
      <div class="history-api-info-grid">
        <span><b>${esc(row.duelink_queue || apiMeta.duelink_queue || apiMeta.queue || '—')}</b><small>File</small></span>
        <span><b>${esc(formatShortDateTime(row.duelink_updated_at || apiMeta.duelink_updated_at || apiMeta.updatedAt || row.played_at))}</b><small>Date Duels.ink</small></span>
      </div>
      ${apiDecklistsHtml ? `<div class="api-decklist-section"><h4>Decklists Duels.ink</h4><div class="api-decklist-grid">${apiDecklistsHtml}</div></div>` : ''}
    </div>` : '';

    const metricTile = (label, value, sub='', cls='') => `<div class="history-detail-metric ${cls}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    const cardTile = (label, card, value, sub='', cls='') => {
      const hasCard = !!card;
      const name = hasCard ? fullName(card) : '—';
      const thumb = hasCard ? cardThumbHtml(card, 'history-detail-card-img') : `<span class="history-detail-card-img thumb-placeholder">—</span>`;
      return `<div class="history-detail-card-tile ${cls}">
        <div class="history-detail-card-art">${thumb}</div>
        <div class="history-detail-card-copy">
          <span>${esc(label)}</span>
          <strong>${esc(name)}</strong>
          <div class="history-detail-card-stats">${value ? `<em>${esc(value)}</em>` : ''}${sub ? `<small>${esc(sub)}</small>` : ''}</div>
        </div>
      </div>`;
    };

    els.historyDetail.hidden = false;
    els.historyDetail.innerHTML = `<div class="history-detail-head history-detail-head-v112">
      <div>
        <span class="history-detail-kicker">Analyse sauvegardée</span>
        <h2>${esc(format)} · ${esc(result)} ${esc(score)}</h2>
        <p>${colorMatchupDotsHtml(rowMineColors(row), rowOpponentColors(row), row.matchup_label || '')}</p>
      </div>
      <div class="history-detail-actions">
        <small>${esc(date)}</small>
        <button type="button" class="ghost-button history-mini-button primary" data-load-saved="${escAttr(row.id)}">Ouvrir dans l’analyse</button>
      </div>
    </div>
    <div class="history-detail-kpi-grid">
      ${metricTile('Résultat', result, score, resultTone)}
      ${metricTile('Tours', String(turns), format, '')}
      ${deckName ? metricTile('Deck', deckName, '', 'wide') : ''}
      ${metricTile('Adversaire', opponentName, '', 'wide')}
    </div>
    ${narrative.title ? `<div class="history-narrative history-narrative-v112"><strong>${esc(narrative.title)}</strong><p>${esc(narrative.text || '')}</p></div>` : ''}
    ${apiInfoHtml}
    ${detailGames}
    <div class="history-detail-visual-grid">
      ${cardTile('Moteur de lore', topMineLore, topMineLore ? `${n(topMineLore.lore)} lore` : '', topMineLore ? `${n(topMineLore.played)} jouée(s)` : '', 'lore')}
      ${cardTile('Carte encrée', topInked, topInked ? `${n(topInked.inked)}x encrée` : '', topInked ? `${n(topInked.played)} jouée(s)` : '', 'ink')}
      ${cardTile('Menace adverse', topOppLore, topOppLore ? `${n(topOppLore.lore)} lore` : '', topOppLore ? `${n(topOppLore.played)} jouée(s)` : '', 'threat')}
      <div class="history-detail-card-tile info-only">
        <div class="history-detail-card-copy">
          <span>Replay</span>
          <strong>${duelink}</strong>
          <small>Source du match</small>
        </div>
      </div>
    </div>`;
    els.historyDetail.querySelectorAll('[data-load-saved]').forEach(button => {
      button.onclick = () => loadSavedAnalysis(row);
    });
  }

  function getSavedMatchPlayedAt(row){
    return row?.played_at || row?.analysis_json?.played_at || row?.analysis_json?.games?.[0]?.playedAt || row?.analysis_json?.saved_at || row?.created_at || null;
  }

  function savedMatchPlayedTime(row){
    const date = new Date(getSavedMatchPlayedAt(row) || row?.created_at || 0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function formatSavedDate(value){
    if(!value) return '—';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('fr-CH', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function dateFromFileName(name=''){
    const raw = String(name || '');
    const iso = raw.match(/(20\d{2})[-_ .]?(\d{2})[-_ .]?(\d{2})(?:[-_ T.]?(\d{2})[-_ .]?(\d{2})(?:[-_ .]?(\d{2}))?)?/);
    if(!iso) return null;
    const [, y, mo, d, h='00', mi='00', se='00'] = iso;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function detectReplayPlayedAt(data={}, file={}){
    const direct = firstValidDate([
      data.playedAt, data.played_at, data.startedAt, data.started_at, data.createdAt, data.created_at,
      data.completedAt, data.completed_at, data.timestamp, data.date,
      data.match?.playedAt, data.match?.startedAt, data.match?.createdAt,
      data.metadata?.playedAt, data.metadata?.startedAt, data.metadata?.createdAt,
      data.baseSnapshot?.createdAt, data.baseSnapshot?.startedAt,
      file?.playedAt || null, dateFromFileName(file?.name || file?.parentName || '')
    ]);
    if(direct) return direct;
    return firstDateFromObject(data);
  }

  function detectPlayedAt(m){
    return firstValidDate([
      m?.playedAt,
      m?.first?.playedAt,
      m?.sessions?.[0]?.playedAt,
      m?.matchMeta?.playedAt,
      m?.matchMeta?.startedAt,
      m?.matchMeta?.createdAt,
      m?.matchMeta?.created_at,
      m?.matchMeta?.started_at
    ]);
  }

  function firstValidDate(values=[]){
    for(const value of values){
      if(!value) continue;
      const date = new Date(value);
      if(!Number.isNaN(date.getTime())) return date.toISOString();
    }
    return null;
  }

  function firstDateFromObject(obj, depth=0){
    if(!obj || typeof obj !== 'object' || depth > 3) return null;
    for(const [key,value] of Object.entries(obj)){
      if(/(played|started|created|date|time|timestamp)/i.test(key)){
        const found = firstValidDate([value]);
        if(found) return found;
      }
      if(value && typeof value === 'object'){
        const nested = firstDateFromObject(value, depth + 1);
        if(nested) return nested;
      }
    }
    return null;
  }

  function syncViewModeVisibility(){
    const global = isGlobalView();
    document.body.classList.toggle('bo3-global', global);
    document.body.classList.toggle('bo3-game', state.isBO3 && !global);
  }

  function renderBo3Selector(){
    if(!els.bo3Selector) return;
    if(!state.isBO3){
      els.bo3Selector.hidden = true;
      els.bo3Selector.innerHTML = '';
      return;
    }
    els.bo3Selector.hidden = false;
    const globalActive = state.viewMode === 'global';
    const gameButtons = state.sessions.map((session, index) => {
      const active = Number(state.viewMode) === index;
      const resultClass = session.isWin ? 'win' : 'loss';
      const resultLabel = session.isWin ? 'Victoire' : 'Défaite';
      return `<button type="button" class="bo3-pill ${active ? 'active' : ''}" data-bo3-view="${index}" aria-pressed="${active ? 'true' : 'false'}"><span class="result-dot ${resultClass}" aria-label="${resultLabel}"></span>Game ${n(session.gameNumber || index + 1)}</button>`;
    }).join('');
    els.bo3Selector.innerHTML = `<button type="button" class="bo3-pill global ${globalActive ? 'active' : ''}" data-bo3-view="global" aria-pressed="${globalActive ? 'true' : 'false'}"> Résumé BO3</button>${gameButtons}`;
    els.bo3Selector.querySelectorAll('[data-bo3-view]').forEach(btn => {
      btn.onclick = () => {
        const view = btn.dataset.bo3View;
        state.viewMode = view === 'global' ? 'global' : Number(view);
        state.mulliganResolved = false;
        if(isGlobalView() && state.activeTab === 'timeline') setTab('overview');
        renderAll();
      };
    });
  }

  function renderBulkQueue(){
    if(!els.bulkImportPanel || !els.bulkImportList) return;
    if(state.duelinkAutoSaving){
      els.bulkImportPanel.hidden = true;
      if(els.bulkDeckTools) els.bulkDeckTools.innerHTML = '';
      return;
    }
    const queue = state.bulkQueue || [];
    els.bulkImportPanel.hidden = !queue.length;
    if(!queue.length){
      if(els.bulkDeckTools) els.bulkDeckTools.innerHTML = '';
      els.bulkImportList.innerHTML = '<div class="empty-line">Aucun lot en attente.</div>';
      if(els.bulkImportStatus) els.bulkImportStatus.textContent = 'Déposez plusieurs replays pour préparer une sauvegarde par lot.';
      if(els.bulkSaveAllButton) els.bulkSaveAllButton.disabled = true;
      return;
    }
    const valid = queue.filter(item => item.merged && ['ready','warning'].includes(item.status)).length;
    const saved = queue.filter(item => item.status === 'saved').length;
    const duplicates = queue.filter(item => item.status === 'duplicate').length;
    const errors = queue.filter(item => item.status === 'error').length;
    if(els.bulkImportStatus){
      if(state.bulkSaving){
        const total = Math.max(1, n(state.bulkSaveTotal));
        const done = Math.min(total, n(state.bulkSaveDone));
        const pct = Math.round((done / total) * 100);
        els.bulkImportStatus.innerHTML = `<span>Sauvegarde en cours · ${done}/${total}</span><span class="bulk-save-progress" aria-hidden="true"><i style="width:${pct}%"></i></span>`;
      }else{
        els.bulkImportStatus.textContent = `${queue.length} fichier(s) dans la file · ${valid} prêt(s) · ${saved} sauvegardé(s) · ${duplicates} doublon(s) · ${errors} erreur(s)`;
      }
    }
    if(els.bulkSaveAllButton){
      els.bulkSaveAllButton.disabled = state.bulkSaving || !valid || !state.currentUser;
      els.bulkSaveAllButton.textContent = state.bulkSaving ? 'Sauvegarde en cours…' : (state.currentUser ? `Sauvegarder ${valid} analyse(s) valide(s)` : 'Connexion requise pour sauvegarder');
    }
    renderBulkDeckTools();
    els.bulkImportList.innerHTML = queue.map((item, index) => bulkQueueRowHtml(item, index)).join('');
    els.bulkImportList.querySelectorAll('[data-bulk-open]').forEach(button => {
      button.onclick = () => activateBulkItem(Number(button.dataset.bulkOpen));
    });
  }

  function bulkQueueRowHtml(item, index){
    const m = item.merged;
    const active = state.activeBulkIndex === index;
    const statusLabel = bulkStatusLabel(item.status);
    const statusClass = `bulk-status-${escAttr(item.status || 'idle')}`;
    if(!m){
      return `<article class="bulk-import-row ${statusClass} ${active ? 'active' : ''}">
        <div class="bulk-status-dot"></div>
        <div class="bulk-row-main"><strong>${esc(compactReplayFileName(item.fileName || `Replay ${index+1}`))}</strong><small>${esc(item.message || 'Lecture en attente.')}</small></div>
        <span class="bulk-row-badge">${esc(statusLabel)}</span>
      </article>`;
    }
    const global = !!m.isBO3;
    const format = global ? 'BO3' : 'BO1';
    const result = n(m.wins) > n(m.losses) ? 'Victoire' : 'Défaite';
    const score = global ? `${n(m.wins)}-${n(m.losses)}` : `${n(m.finalMineLore)}-${n(m.finalOppLore)}`;
    const opponent = m.opponentName || 'Adversaire';
    const matchup = m.matchupLabel || formatMatchupLabel(m.inkProfiles || buildInkProfiles(m));
    const played = detectPlayedAt(m) ? formatSavedDate(detectPlayedAt(m)) : 'Date non détectée';
    const deckLabel = bulkItemDeckLabel(item);
    return `<article class="bulk-import-row ${statusClass} ${active ? 'active' : ''}">
      <div class="bulk-status-dot"></div>
      <button type="button" class="bulk-row-main" data-bulk-open="${index}">
        <strong>${esc(format)} · ${esc(result)} ${esc(score)} <em>vs ${esc(opponent)}</em></strong>
        <small>${esc(matchup)} · ${esc(played)}</small>
        <span>${esc(item.message || statusLabel)}</span>
        <span class="bulk-row-deck ${item.assignedDeck ? 'assigned' : ''}">${esc(deckLabel)}</span>
      </button>
      <div class="bulk-row-side">
        <span class="bulk-row-badge">${esc(statusLabel)}</span>
        ${item.status === 'saved' ? '' : `<button type="button" class="bulk-row-remove" data-bulk-remove="${index}" aria-label="Retirer ce replay de la file">Retirer</button>`}
      </div>
    </article>`;
  }

  function bulkStatusLabel(status){
    return ({ reading:'Lecture', ready:'Prêt', warning:'À vérifier', duplicate:'Doublon', saving:'Sauvegarde', saved:'Sauvegardé', error:'Erreur' })[status] || 'En attente';
  }

  function cssEscape(value){
    if(window.CSS?.escape) return CSS.escape(String(value || ''));
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function bulkItemDeckLabel(item){
    if(item?.assignedDeck?.name) return `Deck : ${item.assignedDeck.name}`;
    return 'Deck automatique à venir';
  }

  function bulkGroupKeyForItem(item){
    const colors = detectedMineColorsFromMatch(item?.merged).filter(Boolean).slice(0,2);
    return colorFilterKey(colors) || 'unknown';
  }

  function bulkGroupLabel(key){
    if(!key || key === 'unknown') return 'Bicolorité non détectée';
    return key.split(/[|\-]/).map(inkLabel).join(' / ');
  }

  function bulkGroupColors(key){
    if(!key || key === 'unknown') return [];
    return key.split(/[|\-]/).map(inkKey).filter(Boolean).slice(0,2);
  }

  function bulkAssignableItems(){
    return (state.bulkQueue || []).filter(item => item?.merged && ['ready','warning','saving','saved'].includes(item.status));
  }

  function renderBulkDeckTools(){
    if(!els.bulkDeckTools) return;
    els.bulkDeckTools.innerHTML = '';
    return;
    const items = bulkAssignableItems().filter(item => item.status !== 'saving');
    if(!items.length){
      els.bulkDeckTools.innerHTML = '';
      return;
    }

    const groups = new Map();
    items.forEach(item => {
      const key = bulkGroupKeyForItem(item);
      const group = groups.get(key) || { key, items:[] };
      group.items.push(item);
      groups.set(key, group);
    });

    const profiles = namedDeckProfiles();
    els.bulkDeckTools.innerHTML = [...groups.values()].map(group => {
      const colors = bulkGroupColors(group.key);
      const matchingProfiles = profiles.filter(profile => profileMatchesColorKey(profile, group.key));
      const assignedNames = [...new Set(group.items.map(item => item.assignedDeck?.name).filter(Boolean))];
      const assignedLabel = assignedNames.length ? assignedNames.join(' · ') : 'Aucun deck choisi';
      const optionsHtml = matchingProfiles.length
        ? matchingProfiles.map(profile => `<button type="button" class="bulk-deck-pill" data-bulk-assign-existing="${escAttr(group.key)}" data-deck-id="${escAttr(profile.id)}">${inkDotsHtml(profileColors(profile))}<span>${esc(profile.name)}</span></button>`).join('')
        : '<span class="bulk-deck-empty">Aucune version existante pour cette bicolorité.</span>';
      return `<article class="bulk-deck-group" data-bulk-group="${escAttr(group.key)}">
        <div class="bulk-deck-group-head">
          <div>
            <strong>${esc(bulkGroupLabel(group.key))}</strong>
            <small>${group.items.length} analyse(s) · ${esc(assignedLabel)}</small>
          </div>
          <button type="button" class="bulk-deck-clear" data-bulk-clear-deck="${escAttr(group.key)}">Nommer plus tard</button>
        </div>
        <div class="bulk-deck-pills">${optionsHtml}</div>
        <div class="bulk-deck-new">
          <input type="text" data-bulk-new-deck-name="${escAttr(group.key)}" placeholder="Créer une version, ex. ${escAttr(bulkGroupLabel(group.key))} Control" maxlength="80">
          <button type="button" class="bulk-deck-create" data-bulk-assign-new="${escAttr(group.key)}">Appliquer au lot</button>
        </div>
      </article>`;
    }).join('');
  }

  function handleBulkQueueClick(event){
    const remove = event.target.closest('[data-bulk-remove]');
    if(remove){
      const index = Number(remove.dataset.bulkRemove);
      if(Number.isInteger(index)){
        state.bulkQueue.splice(index, 1);
        if(state.activeBulkIndex === index) state.activeBulkIndex = null;
        else if(Number.isInteger(state.activeBulkIndex) && state.activeBulkIndex > index) state.activeBulkIndex -= 1;
        renderBulkQueue();
      }
      return;
    }

    const existing = event.target.closest('[data-bulk-assign-existing]');
    if(existing){
      const groupKey = existing.dataset.bulkAssignExisting;
      const profile = (state.deckProfiles || []).find(item => String(item.id) === String(existing.dataset.deckId));
      if(profile){
        assignDeckToBulkGroup(groupKey, { id:profile.id, name:profile.name, colors:profileColors(profile), isNew:false });
      }
      return;
    }

    const clear = event.target.closest('[data-bulk-clear-deck]');
    if(clear){
      assignDeckToBulkGroup(clear.dataset.bulkClearDeck, null);
      return;
    }

    const create = event.target.closest('[data-bulk-assign-new]');
    if(create){
      const groupKey = create.dataset.bulkAssignNew;
      const input = document.querySelector(`[data-bulk-new-deck-name="${cssEscape(groupKey)}"]`);
      const name = String(input?.value || '').trim();
      if(!name){
        if(els.bulkImportStatus) els.bulkImportStatus.textContent = 'Entrez un nom de deck avant de l’appliquer au lot.';
        return;
      }
      assignDeckToBulkGroup(groupKey, { id:null, name, colors:bulkGroupColors(groupKey), isNew:true });
      return;
    }
  }

  function assignDeckToBulkGroup(groupKey, deck){
    (state.bulkQueue || []).forEach(item => {
      if(!item?.merged) return;
      if(!['ready','warning','saved'].includes(item.status)) return;
      if(bulkGroupKeyForItem(item) !== groupKey) return;
      item.assignedDeck = deck ? { ...deck } : null;
      if(item.status === 'ready' || item.status === 'warning'){
        item.message = deck?.name ? `Prêt à sauvegarder avec le deck “${deck.name}”.` : 'Prêt à sauvegarder.';
      }
    });
    renderBulkQueue();
  }

  async function resolveBulkDeckForItem(item){
    const assigned = item?.assignedDeck;
    if(!assigned?.name) return resolveAutoDeckProfile(item.merged);
    if(assigned.id) return { id:assigned.id, name:assigned.name };
    const profile = await upsertDeckProfile({ name:assigned.name, colors:assigned.colors || detectedMineColorsFromMatch(item.merged) });
    item.assignedDeck = { id:profile?.id || null, name:profile?.name || assigned.name, colors:profileColors(profile || assigned), isNew:false };
    await refreshDeckProfiles({ force:true, silent:true });
    return { id:profile?.id || null, name:profile?.name || assigned.name };
  }

  function renderFiles(){
    if(!state.replays.length){
      els.statusText.textContent='Aucun replay chargé pour le moment.';
      els.fileList.innerHTML='<div class="empty-line">La liste des replays apparaîtra ici.</div>';
      return;
    }
    els.statusText.textContent = state.isBO3 ? `${state.sessions.length} game(s) BO3 prêtes à analyser.` : `Replay chargé. Analyse prête.`;
    els.fileList.innerHTML = state.replays.map((r,i)=>{
      const parent = r.file.parentName ? `<small class="file-row-parent">Archive : ${esc(r.file.parentName)}</small>` : '';
      const result = r.session.isWin ? 'Victoire' : 'Défaite';
      const shortName = compactReplayFileName(r.file.name || `Replay ${i+1}`);
      return `<div class="file-row compact-file-row"><span class="${r.session.isWin ? 'file-win' : 'file-loss'}"></span><div class="file-row-copy"><strong title="${escAttr(r.file.name || '')}">${esc(shortName)}</strong><small>${formatBytes(r.file.size)} · ${n(r.session.actions?.length)} actions · ${result}</small>${parent}</div><small class="file-index">#${i+1}</small></div>`;
    }).join('');
  }

  function compactReplayFileName(name){
    const raw = String(name || '').trim();
    if(!raw) return 'Replay importé';
    const cleaned = raw.replace(/\.match-replay\.zip$/i,'.zip').replace(/\.replay\.gz$/i,'.replay').replace(/^[0-9a-f]{8,}[-_]/i,'');
    if(cleaned.length <= 34) return cleaned;
    const ext = (cleaned.match(/(\.zip|\.replay|\.json|\.gz)$/i) || [''])[0];
    const base = ext ? cleaned.slice(0, -ext.length) : cleaned;
    return `${base.slice(0, 18)}…${base.slice(-8)}${ext}`;
  }

  function renderDetected(){
    const m = state.merged;
    els.detectedPlayer.textContent = m?.myName || '—';
    els.detectedOpponent.textContent = m?.opponentName || '—';
    els.detectedTurns.textContent = m ? (state.isBO3 ? `${state.sessions.length} games · ${round1(m.avgTurns)} moy.` : round1(m.avgTurns)) : '—';
    els.detectedActions.textContent = m ? m.actions.length : '—';
  }

  function renderOverview(){
    const m = getWorkingData();
    if(!m){
      els.sessionRecord.textContent='—'; els.sessionOpponent.textContent='Importez un replay.'; els.sessionTurns.textContent='—'; els.sessionPlayDraw.textContent='—'; els.sessionLore.textContent='—'; if(els.sessionMatchup) els.sessionMatchup.textContent='—';
      if(els.coachTitle) els.coachTitle.textContent='Importez un replay pour lancer l’analyse.';
      if(els.coachText) els.coachText.textContent='Le résumé du match apparaîtra ici une fois le replay chargé.';
      if(els.coachConfidence) els.coachConfidence.textContent='En attente';
      if(els.matchPills) els.matchPills.innerHTML=''; if(els.resultHero) els.resultHero.innerHTML=''; renderKeyMoments(null); if(els.nextAction) els.nextAction.innerHTML=''; renderMulligan(null);
      renderLoreChart([]); updateChartSummary('loreChartSummary','Résumé du graphique lore disponible après import.'); return;
    }
    const total = m.wins + m.losses;
    const global = isGlobalView();
    els.sessionRecord.textContent = `${m.wins}V / ${m.losses}D`;
    els.sessionOpponent.textContent = global ? `${total} manches contre ${m.opponentName}` : `${m.first.isWin ? 'Victoire' : 'Défaite'} vs ${m.opponentName}`;
    els.sessionTurns.textContent = global ? `${total} games · ${round1(m.avgTurns)} tours moy.` : `${round1(m.avgTurns)} tours`;
    if(global){
      const opening = bo3OpeningStatus(m);
      els.sessionPlayDraw.textContent = opening.code;
    }else{
      els.sessionPlayDraw.textContent = m.first.firstTurnPlayer === m.first.myPlayerNumber ? 'OTP' : 'OTD';
    }
    els.sessionLore.textContent = global ? `${m.wins} / ${m.losses}` : `${m.finalMineLore} / ${m.finalOppLore}`;
    if(els.sessionMatchup) els.sessionMatchup.textContent = m.matchupLabel || formatMatchupLabel(m.inkProfiles);

    const fallbackNarrative = buildMatchNarrative(m);
    requestCoachCommentary(m, fallbackNarrative);
    if(els.matchPills) els.matchPills.innerHTML = global ? buildBo3Pills(m) : '';
    renderResultHero(m);
    renderKeyMoments(m);
    if(els.nextAction) els.nextAction.innerHTML = '';
    renderMulligan(global ? null : m.first?.mulligan);
    if(global){
      renderLoreChart([]);
      updateChartSummary('loreChartSummary','Le graphique de course au lore est masqué dans le résumé BO3.');
    }else{
      renderLoreChart(m.loreSeries);
      syncChartsWithTheme(state.scope);
      updateChartSummary('loreChartSummary', summarizeLore(m.loreSeries));
    }
  }

  function buildBo3Pills(m){
    // V44: the BO3 macro data is now carried by the large result cards.
    // Keep this hook empty to avoid repeating score, format, or play/draw status.
    return '';
  }

  function bo3OpeningStatus(m){
    const firstGame = Array.isArray(m?.sessions) && m.sessions.length ? m.sessions[0] : m?.first;
    const myStarted = firstGame && firstGame.firstTurnPlayer === firstGame.myPlayerNumber;
    const opponentStarted = firstGame && firstGame.firstTurnPlayer === firstGame.opponentNumber;
    if(myStarted){
      return { code:'OTP', helper:'Vous avez commencé la Game 1.', detail:'On The Play' };
    }
    if(opponentStarted){
      return { code:'OTD', helper:'Votre adversaire a commencé la Game 1.', detail:'On The Draw' };
    }
    return { code:'—', helper:'Joueur qui commence non détecté.', detail:'Départ inconnu' };
  }

  function gameOpeningStatus(m){
    const game = m?.first || m?.sessions?.[0] || m;
    const myStarted = game && game.firstTurnPlayer === game.myPlayerNumber;
    const opponentStarted = game && game.firstTurnPlayer === game.opponentNumber;
    if(myStarted) return { code:'OTP', label:'Vous commencez', helper:'Vous avez commencé cette partie.' };
    if(opponentStarted) return { code:'OTD', label:'Vous jouez second', helper:'Votre adversaire a commencé cette partie.' };
    return { code:'—', label:'Départ inconnu', helper:'Joueur qui commence non détecté.' };
  }

  function stablePick(items, seed=''){
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if(!list.length) return '';
    let hash = 0;
    String(seed || '').split('').forEach(ch => { hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0; });
    return list[Math.abs(hash) % list.length];
  }

  function isLocationCard(card){
    const type = `${typeLabel(card?.type || card?.cardType || '')} ${card?.type || ''} ${card?.cardType || ''}`.toLowerCase();
    return type.includes('lieu') || type.includes('location');
  }

  function countMulliganChangesForSession(session){
    const mulligan = session?.mulligan || {};
    try{
      const split = splitMulliganInitialCards(mulligan);
      if(split?.thrownCards?.length) return n(split.thrownCards.length);
    }catch(e){ /* fallback below */ }
    return n(arrayify(mulligan.replaced).length || arrayify(mulligan.thrown).length || arrayify(mulligan.mulliganed).length);
  }

  function extractMatchReadMetrics(m){
    const first = m?.first || m?.sessions?.[0] || {};
    const rows = Array.isArray(m?.loreSeries) ? m.loreSeries : [];
    const cards = cardsForScope(m, 'mine');
    const mineScore = n(m?.finalMineLore ?? first?.finalMineLore ?? rows.at(-1)?.mine);
    const opponentScore = n(m?.finalOppLore ?? first?.finalOppLore ?? rows.at(-1)?.opponent);
    const isWin = !!(m?.wins > m?.losses || first?.isWin || mineScore >= 20 && mineScore > opponentScore);
    const turnCount = Math.max(1, Math.round(n(m?.turnCount || first?.turnCount || m?.avgTurns || rows.at(-1)?.turn || 0)));
    const metrics = m?.proMetrics || first?.proMetrics || {};
    const inkFloat = round1(n(metrics.totalInkFloat));
    const topDeckTurns = n(metrics.topDeckTurns);
    const mulliganChanges = countMulliganChangesForSession(first);
    const topLoreCard = loreEngineCards(cards).sort(compareLoreEngines)[0] || null;
    const topQuester = topLoreCard ? fullName(topLoreCard) : 'votre meilleur moteur de lore';
    const loreFromLocations = cards.filter(isLocationCard).reduce((acc, card)=>acc+n(card.lore), 0);
    const otp = first?.firstTurnPlayer && first?.myPlayerNumber ? first.firstTurnPlayer === first.myPlayerNumber : null;
    const archetypeSpeed = turnCount <= 6 ? 'Aggro' : turnCount <= 11 ? 'Midrange' : 'Control';
    return {
      mineScore, opponentScore, isWin, turnCount, inkFloat, topDeckTurns, mulliganChanges,
      topLoreCard, topQuester, loreFromLocations, otp, archetypeSpeed, scoreGap:Math.abs(mineScore - opponentScore)
    };
  }

  function fillMatchReadTemplate(template, vars){
    return String(template || '').replace(/\{(monScore|scoreJoueur|mine|scoreAdverse|opp|nbTours|turn|toursTopDeck|inkFloat|nbMulligan|topQuester|loreFromLocations|OTP|archetype)\}/g, (_, key) => ({
      monScore:vars.mineScore, scoreJoueur:vars.mineScore, mine:vars.mineScore,
      scoreAdverse:vars.opponentScore, opp:vars.opponentScore,
      nbTours:vars.turnCount, turn:vars.turnCount,
      toursTopDeck:vars.topDeckTurns, inkFloat:vars.inkFloat, nbMulligan:vars.mulliganChanges,
      topQuester:vars.topQuester, loreFromLocations:vars.loreFromLocations,
      OTP:vars.otp ? 'On The Play' : 'On The Draw', archetype:vars.archetypeSpeed
    }[key] ?? ''));
  }


  function getMatchReadTitleEl(){
    return document.getElementById('matchReadTitle') || els.coachTitle || null;
  }

  function getMatchReadCopyEl(){
    return document.getElementById('matchReadCopy') || els.coachText || null;
  }

  function getMatchReadSourceEl(){
    const copyEl = getMatchReadCopyEl();
    if(!copyEl) return null;
    let sourceEl = document.getElementById('matchReadSource');
    if(!sourceEl){
      sourceEl = document.createElement('small');
      sourceEl.id = 'matchReadSource';
      sourceEl.className = 'match-read-source';
      copyEl.insertAdjacentElement('afterend', sourceEl);
    }
    return sourceEl;
  }

  function setMatchReadDom({ title, description, text, badge, sourceLine }){
    const titleEl = getMatchReadTitleEl();
    const copyEl = getMatchReadCopyEl();
    const sourceEl = getMatchReadSourceEl();
    if(titleEl) titleEl.textContent = title || 'Lecture du match';
    if(copyEl) copyEl.textContent = description || text || 'Analyse indisponible pour ce match.';
    if(sourceEl){
      const ref = String(sourceLine || '').trim();
      sourceEl.textContent = ref;
      sourceEl.hidden = !ref;
    }
    if(els.coachConfidence) els.coachConfidence.textContent = badge || 'Coach';
  }

  function bestCardBy(cards, getter){
    return [...(cards || [])]
      .filter(card => card && fullName(card))
      .sort((a,b) => n(getter(b)) - n(getter(a)) || fullName(a).localeCompare(fullName(b), 'fr'))[0] || null;
  }

  function matchReadRequestKey(m){
    const first = m?.first || m?.sessions?.[0] || {};
    return [
      m?.replay_fingerprint || m?.fingerprint || first?.fileName || m?.title || 'live',
      n(m?.finalMineLore ?? first?.finalMineLore),
      n(m?.finalOppLore ?? first?.finalOppLore),
      n(m?.turnCount || first?.turnCount || m?.avgTurns),
      m?.opponentName || first?.opponentName || '',
      m?.deck_name || m?.deckName || ''
    ].join('|');
  }

  function buildCoachCommentaryPayload(m){
    const metrics = extractMatchReadMetrics(m);
    const first = m?.first || m?.sessions?.[0] || {};
    const cards = cardsForScope(m, 'mine');
    const topInked = bestCardBy(cards, card => card.inked);
    const topPlayed = bestCardBy(cards, card => card.played);
    const topLore = metrics.topLoreCard || bestCardBy(loreEngineCards(cards), card => card.lore);
    const actionRows = Array.isArray(m?.actionSeries) ? m.actionSeries : (Array.isArray(first?.actionSeries) ? first.actionSeries : []);
    const actionTotals = actionRows.reduce((acc, row) => {
      acc.inked += n(row.ink);
      acc.played += n(row.play);
      acc.quests += n(row.quest);
      acc.challenges += n(row.challenge || row.mineChallenge);
      return acc;
    }, { inked:0, played:0, quests:0, challenges:0 });
    const opponentName = m?.opponentName || first?.opponentName || 'adversaire anonyme';
    const otp = metrics.otp === null ? 'inconnu' : (metrics.otp ? 'OTP' : 'OTD');

    return {
      monScore:metrics.mineScore,
      scoreAdverse:metrics.opponentScore,
      inkFloat:metrics.inkFloat,
      nbTours:metrics.turnCount,
      topQuester:metrics.topQuester,
      topLoreSource:topLore ? fullName(topLore) : metrics.topQuester,
      opponentName,
      toursTopDeck:metrics.topDeckTurns,
      loreFromLocations:metrics.loreFromLocations,
      isWin:metrics.isWin,
      scoreGap:metrics.scoreGap,
      nbMulligan:metrics.mulliganChanges,
      mulliganChanges:metrics.mulliganChanges,
      archetypeSpeed:metrics.archetypeSpeed,
      otp,
      matchupLabel:m?.matchupLabel || first?.matchupLabel || '',
      format:(m?.isBO3 || (Array.isArray(m?.sessions) && m.sessions.length > 1)) ? 'BO3' : 'BO1',
      deckName:m?.deck_name || m?.deckName || '',
      topInkedCard:topInked ? fullName(topInked) : '',
      topInkedCount:topInked ? n(topInked.inked) : 0,
      topPlayedCard:topPlayed ? fullName(topPlayed) : '',
      topPlayedCount:topPlayed ? n(topPlayed.played) : 0,
      actionTotals
    };
  }

  async function requestCoachCommentary(m, fallbackNarrative){
    const key = matchReadRequestKey(m);
    if(state.coachCommentaryCache?.has(key)){
      setMatchReadDom(state.coachCommentaryCache.get(key));
      return;
    }
    if(state.coachCommentaryPendingKey === key) return;

    const seq = (state.coachCommentarySeq || 0) + 1;
    state.coachCommentarySeq = seq;
    state.coachCommentaryPendingKey = key;

    setMatchReadDom({
      title:'Le Coach analyse votre niveau...',
      description:'Veuillez patienter, l’IA calcule votre Card Advantage...',
      badge:'IA en cours'
    });

    try{
      const response = await fetch('/api/getCoachCommentary', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(buildCoachCommentaryPayload(m))
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if(state.coachCommentarySeq !== seq || state.coachCommentaryPendingKey !== key) return;
      const sourceLabel = String(data?.source || '').trim();
      const commentary = {
        title:String(data?.title || '').trim() || fallbackNarrative?.title || 'Lecture du match',
        description:String(data?.description || data?.text || '').trim() || fallbackNarrative?.description || fallbackNarrative?.text || 'Analyse indisponible pour ce match.',
        sourceLine:String(data?.sourceLine || '').trim(),
        badge:String(data?.badge || '').trim() || (sourceLabel ? (sourceLabel.includes('Coach DB') ? 'Coach DB' : sourceLabel) : 'Coach')
      };
      state.coachCommentaryCache?.set(key, commentary);
      setMatchReadDom(commentary);
    }catch(error){
      console.warn('Coach commentary unavailable:', error);
      if(state.coachCommentarySeq !== seq || state.coachCommentaryPendingKey !== key) return;
      const fallback = {
        title:fallbackNarrative?.title || 'Diagnostic local.',
        description:fallbackNarrative?.description || fallbackNarrative?.text || 'Le coach est indisponible, mais le diagnostic local reste actif pour ce match.',
        sourceLine:fallbackNarrative?.sourceLine || '',
        badge:fallbackNarrative?.badge || 'Coach local'
      };
      state.coachCommentaryCache?.set(key, fallback);
      setMatchReadDom(fallback);
    }finally{
      if(state.coachCommentarySeq === seq && state.coachCommentaryPendingKey === key) state.coachCommentaryPendingKey = '';
    }
  }

  function generateMatchRead(sessionData){
    const v = extractMatchReadMetrics(sessionData);
    const seed = `${v.mineScore}-${v.opponentScore}-${v.turnCount}-${v.topDeckTurns}-${v.inkFloat}-${v.topQuester}`;
    const scenarios = {
      perfectWin:{ badge:'Perfect', titles:['Un vrai {monScore}-0 des familles.', 'Intouchable.', 'L’adversaire a désinstallé le jeu.'], descriptions:[
        'Une sortie chirurgicale : {topQuester} a converti le plan pendant que l’adversaire restait bloqué à zéro. Card, Ink et Lore Advantage verrouillés.',
        'Score parfait et tempo sans bavure. Vous avez confisqué le board, la main et la clock avant que la partie ne commence vraiment.'
      ] },
      stompWin:{ badge:'No match', titles:['Un {monScore}-{scoreAdverse} des familles.', 'Ink et Lore Advantage.', 'No match.'], descriptions:[
        'Une sortie millimétrée après un mulligan de {nbMulligan} carte(s). Vous avez confisqué le board direct et {topQuester} a sécurisé le lethal tour {nbTours}.',
        'L’adversaire a subi sur les 3 axes : Card, Ink et Lore Advantage. Victoire {monScore}–{scoreAdverse}, zéro respect.'
      ] },
      perfectLoss:{ badge:'0 pointé', titles:['0 pointé.', 'Rien n’est passé.', 'Oublie vite cette game.'], descriptions:[
        'Aucune traction au score : l’adversaire prend le Lore Advantage instantanément et vous n’avez jamais pu revenir.',
        'Game à archiver mentalement. Le plan ne s’est jamais installé et la clock adverse a tourné sans opposition réelle.'
      ] },
      brick:{ badge:'Brick', titles:['T’as brick ?', 'Sortie de route.', 'Le fameux mulligan à {nbMulligan}...'], descriptions:[
        'Matchup cauchemar ou main injouable ? L’adversaire a pris le Lore Advantage instantanément et vous n’avez jamais pu revenir.',
        'Avec {inkFloat} encre(s) flottée(s), votre curve a déraillé dès l’ouverture. Il vous a ramp dessus sans pitié jusqu’à {scoreAdverse}.'
      ] },
      passiveLore:{ badge:'Lore passif', titles:['L’immobilier paie toujours.', 'Lore passif destructeur.'], descriptions:[
        'Une masterclass de gestion. Pendant que l’adversaire s’épuisait sur vos personnages, vos Lieux ont généré {loreFromLocations} lore passif irrattrapable.',
        'L’adversaire a oublié d’attaquer vos Lieux. {loreFromLocations} points gratuits au start-of-turn ont rendu le lethal mathématiquement inévitable.'
      ] },
      closeWin:{ badge:'Photo-finish', titles:['La course au Lore.', 'Photo-finish.', 'Le top deck de la victoire.'], descriptions:[
        'Une game ultra tendue terminée au tour {nbTours}. Ça s’est joué à la course au Lore : {monScore} à {scoreAdverse}. Un trade mal calculé pouvait tout faire basculer.',
        'Victoire au millimètre. Vous avez trouvé la dernière fenêtre de lethal avant que l’adversaire ne ferme la porte.'
      ] },
      closeLoss:{ badge:'Défaite courte', titles:['Si proche du but...', 'À un poil de Lore près.', 'La prochaine c’est la bonne.'], descriptions:[
        'Défaite sur le fil : {monScore} à {scoreAdverse} au tour {nbTours}. La VOD doit surtout identifier le tour où la course au Lore bascule.',
        'Vous étiez dans la game jusqu’au bout, mais l’adversaire a trouvé le dernier point de pression avant vous.'
      ] },
      topDeck:{ badge:'Card Advantage perdu', titles:['Syndrome de la page blanche.', 'Asphyxie totale.', 'Top deck mode.'], descriptions:[
        'Vous avez brûlé toutes vos cartouches. Avec {toursTopDeck} tours passés à jouer le top deck et une perte flagrante de Card Advantage, le tempo était intenable.',
        'Le moteur de pioche a calé. {inkFloat} encre(s) flottée(s) parce que la main était vide face à un board adverse bien trop large.'
      ] },
      control:{ badge:'Attrition', titles:['Bataille de tranchées.', 'La guerre d’usure.', 'Festival de Board Wipes.'], descriptions:[
        '{nbTours} tours de gestion pure. La partie s’est jouée sur le contrôle des ressources et l’attrition. Le pic de Lore décisif arrive en fin de partie.',
        'Un vrai match Control. Vous étiez {OTP}, mais la gestion du Card Advantage sur la longueur a dicté le vainqueur.'
      ] },
      inkLeak:{ badge:'Tempo perdu', titles:['Fuite d’encre.', 'Où est le Tempo ?'], descriptions:[
        'Vous avez accumulé {inkFloat} encre(s) inutilisée(s). À Lorcana, ne pas curver proprement donne souvent le board et la clock à l’adversaire.',
        'La réserve d’encre était là, mais pas la conversion. Le problème n’est pas la ressource : c’est le tempo.'
      ] },
      defaultWin:{ badge:'Victoire', titles:['Victoire solide.', 'Plan exécuté.', 'Travail propre.'], descriptions:[
        'Victoire {monScore}–{scoreAdverse} en {nbTours} tours. Le plan {archetype} a suffisamment tenu pour convertir les ressources en lethal.',
        '{topQuester} ressort comme la meilleure condition de victoire, avec une progression régulière vers les 20 lore.'
      ] },
      defaultLoss:{ badge:'Défaite', titles:['Défaite à décortiquer.', 'La course s’arrête là.', 'Il faudra revoir la VOD.'], descriptions:[
        'Défaite {monScore}–{scoreAdverse}. Le journal devrait aider à retrouver le tour où le tempo décroche.',
        'L’adversaire prend progressivement l’ascendant et vous force à courir après le score. Priorité : identifier le premier tour de retard.'
      ] }
    };

    let scenario;
    if(v.isWin && v.mineScore >= 20 && v.opponentScore === 0) scenario = scenarios.perfectWin;
    else if(!v.isWin && v.mineScore === 0 && v.opponentScore >= 20) scenario = scenarios.perfectLoss;
    else if(v.isWin && v.mineScore >= 20 && v.opponentScore <= 5) scenario = scenarios.stompWin;
    else if(!v.isWin && v.mineScore <= 6 && v.opponentScore >= 20) scenario = scenarios.brick;
    else if(v.isWin && v.loreFromLocations >= 4) scenario = scenarios.passiveLore;
    else if(v.scoreGap <= 3 && v.mineScore >= 18 && v.opponentScore >= 18) scenario = v.isWin ? scenarios.closeWin : scenarios.closeLoss;
    else if(v.topDeckTurns >= 4) scenario = scenarios.topDeck;
    else if(v.turnCount >= 13) scenario = scenarios.control;
    else if(v.inkFloat > 15) scenario = scenarios.inkLeak;
    else scenario = v.isWin ? scenarios.defaultWin : scenarios.defaultLoss;

    const title = fillMatchReadTemplate(stablePick(scenario.titles, seed), v);
    const description = fillMatchReadTemplate(stablePick(scenario.descriptions, `${seed}-desc`), v);
    return { title, description, text:description, summary:description, badge:scenario.badge, metrics:v };
  }

  function buildMatchNarrative(m){
    return generateMatchNarrative(m);
  }

  function generateBo3Narrative(m){
    const wins = n(m.wins);
    const losses = n(m.losses);
    const games = Math.max(1, wins + losses || (m.sessions?.length || 0));
    const win = wins > losses;
    const score = `${wins}-${losses}`;
    const avgTurns = round1(m.avgTurns || 0);
    const totalTurns = n(m.totalTurns || sum(m.sessions || [], 'turnCount'));
    const metrics = m.proMetrics || {};
    const oppMetrics = m.opponentProMetrics || {};
    const quests = n(metrics.questCount);
    const challenges = n(metrics.challengeCount);
    const topDeck = n(metrics.topDeckTurns);
    const oppTopDeck = n(oppMetrics.topDeckTurns);
    const questRatio = pct(quests, quests + challenges);
    const myCards = cardsForScope(m, 'mine');
    const topQuester = loreEngineCards(myCards).sort(compareLoreEngines)[0];
    const mostInked = [...myCards].sort((a,b)=>(b.inked||0)-(a.inked||0) || fullName(a).localeCompare(fullName(b)))[0];

    const dictionary = {
      cleanWin: {
        badge:'BO3 clean',
        titles:['Sortez les balais', 'Deux games, merci bonsoir', 'Net et sans bavure', 'Le plan de match était clair', 'BO3 sous contrôle'],
        phrases:[
          'Victoire {score} sans passer par la case Game 3. Vous avez gardé le cap sur {games} manches et l’adversaire n’a jamais vraiment trouvé le bouton pause.',
          'Un BO3 propre : {score}, {totalTurns} tours cumulés, et une série fermée avant que le doute ne s’installe.',
          'Pas besoin de drama inutile : deux manches, un plan stable, et une victoire {score} qui sent le travail bien fait.'
        ]
      },
      clutchWin: {
        badge:'BO3 clutch',
        titles:['Arraché avec les dents', 'Le BO3 de la sueur', 'Mental de finisher', 'Au bout du suspense', 'Cardio à 200'],
        phrases:[
          'Victoire {score} après {games} manches. Il a fallu s’adapter, respirer un grand coup, puis fermer la série au moment où ça comptait.',
          'Un vrai BO3 de tournoi : {score}, {totalTurns} tours cumulés, et assez de tension pour justifier une pause café après la dernière manche.',
          'La série va au bout, mais vous gardez le dernier mot. C’est le genre de victoire qui se gagne autant au mulligan qu’au mental.'
        ]
      },
      cleanLoss: {
        badge:'BO3 difficile',
        titles:['La douche froide', 'Retour au lobby', 'Leçon d’humilité.', 'La marche était haute', 'Matchup compliqué'],
        phrases:[
          'Défaite {score}. L’adversaire a imposé son plan sur les deux manches et vous n’avez pas trouvé l’ajustement de rythme pour casser sa trajectoire.',
          'BO3 compliqué : {score}, peu de fenêtres exploitables, et un adversaire qui a déroulé son plan trop proprement.',
          'Série sèche : deux manches pour comprendre que le matchup demandait probablement un mulligan ou un tempo beaucoup plus tranché.'
        ]
      },
      closeLoss: {
        badge:'BO3 serré',
        titles:['Le seum du Game 3', 'Ça passe pas loin', 'Cruelle troisième manche', 'À un détail près', 'Presque le hold-up'],
        phrases:[
          'Défaite {score} après {games} manches. Vous avez trouvé des réponses, mais pas assez pour retourner complètement le matchup.',
          'Le match va au bout, mais l’adversaire ferme la série {score}. C’est typiquement le BO3 où une décision de mulligan peut peser très lourd.',
          'Vous n’étiez pas loin du braquage, mais la série échappe sur la dernière ligne droite.'
        ]
      },
      speedWin: {
        badge:'Tempo rapide',
        titles:['Mode TGV activé', 'Pas le temps d’niaiser', 'Départ canon', 'Curve parfaite'],
        phrases:[
          'Victoire {score} à haute vitesse : {avgTurns} tours de moyenne, une pression installée tôt, et très peu de temps laissé au late-game adverse.',
          'Le BO3 s’est joué en accéléré. Votre deck a mis la clock assez vite pour forcer l’adversaire à courir derrière le score.'
        ]
      },
      boardWin: {
        badge:'Board control',
        titles:['Bataille de tranchées', 'Nettoyage de board', 'Contrôle total', 'Ça s’est joué sur le plateau'],
        phrases:[
          'La victoire s’est construite dans l’arène avec {challenges} défis cumulés. Vous avez transformé les trades en fenêtres de lore.',
          'BO3 très orienté plateau : beaucoup de décisions de trade, et assez de contrôle pour finir par convertir la série.'
        ]
      },
      boardLoss: {
        badge:'Board contesté',
        titles:['Guerre d’usure perdue', 'Board sous tension', 'Ça tape fort, mais ça ne lore pas', 'Trades non-stop'],
        phrases:[
          'Vous avez beaucoup combattu avec {challenges} défis, mais ces trades n’ont pas suffi à freiner la clock adverse sur l’ensemble de la série.',
          'La série a demandé du contrôle de board, mais l’adversaire a mieux converti ses ressources en points de lore.'
        ]
      },
      resourceLoss: {
        badge:'Ressources faibles',
        titles:['La panne sèche', 'Le moteur a calé', 'Top deck simulator', 'À court de gaz'],
        phrases:[
          'Vos ressources se sont trop souvent vidées : {topDeck} tours en main quasi vide sur la série, difficile de tenir un plan flexible dans ces conditions.',
          'Le BO3 a fini par ressembler à une prière à la pioche. Avec {topDeck} tours à 0 ou 1 carte, le tempo devenait très dur à maintenir.'
        ]
      },
      loreRaceWin: {
        badge:'Race lore',
        titles:['Course au lore validée', 'Tout droit vers les 20', 'Plan lore assumé', 'La ligne droite'],
        phrases:[
          'Vous avez assumé la course au lore avec {quests} quête(s) pour {challenges} défi(s), et le plan a tenu sur l’ensemble du BO3.',
          'Peu de détours, beaucoup de lore : votre plan a forcé l’adversaire à courir derrière le score.'
        ]
      },
      loreRaceLoss: {
        badge:'Race lore perdue',
        titles:['Course perdue au sprint', 'Le sprint n’a pas suffi', 'La clock adverse', 'Trop droit devant ?'],
        phrases:[
          'Votre plan était très orienté lore avec {quests} quête(s), mais l’adversaire a gagné la course sur la série.',
          'Vous avez couru vers les 20, mais l’adversaire avait une meilleure clock au moment de fermer les manches.'
        ]
      }
    };

    const pick = list => list[Math.floor(Math.random() * list.length)] || '';
    const fill = template => String(template || '').replace(/\{(score|games|avgTurns|totalTurns|quests|challenges|topDeck|oppTopDeck|mostInked|topQuester)\}/g, (_, key) => ({
      score, games, avgTurns, totalTurns, quests, challenges, topDeck, oppTopDeck,
      mostInked:mostInked ? fullName(mostInked) : '—',
      topQuester:topQuester ? fullName(topQuester) : '—'
    }[key]));

    let scenario;
    // Priorité : résultat de série, vitesse, ressources uniquement si elles expliquent une défaite, puis style de jeu.
    if(win && losses === 0 && avgTurns <= 7) scenario = dictionary.speedWin;
    else if(win && losses === 0) scenario = dictionary.cleanWin;
    else if(win) scenario = dictionary.clutchWin;
    else if(!win && topDeck >= 5) scenario = dictionary.resourceLoss;
    else if(!win && wins === 0) scenario = dictionary.cleanLoss;
    else scenario = dictionary.closeLoss;

    if(win && challenges > quests && challenges >= 8) scenario = dictionary.boardWin;
    else if(!win && challenges > quests && challenges >= 8) scenario = dictionary.boardLoss;
    else if(questRatio >= 85 && quests >= 8) scenario = win ? dictionary.loreRaceWin : dictionary.loreRaceLoss;

    let text = fill(pick(scenario.phrases));
    if(topQuester?.lore >= 4) text += ` Votre meilleur moteur de lore sur la série : ${fullName(topQuester)}.`;
    if(mostInked?.inked >= 3) text += ` À surveiller côté deckbuilding : ${fullName(mostInked)} finit souvent en encre (${mostInked.inked}x) dans ce matchup.`;

    return { title:fill(pick(scenario.titles)), text, summary:text, badge:scenario.badge };
  }

  function generateBo3ScopedNarrative(m, scope='mine'){
    const mineScope = scope !== 'opponent';
    const metrics = mineScope ? (m.proMetrics || {}) : (m.opponentProMetrics || {});
    const cards = cardsForScope(m, mineScope ? 'mine' : 'opponent');
    const wins = mineScope ? n(m.wins) : n(m.losses);
    const losses = mineScope ? n(m.losses) : n(m.wins);
    const win = wins > losses;
    const score = `${wins}-${losses}`;
    const quests = n(metrics.questCount);
    const challenges = n(metrics.challengeCount);
    const topDeck = n(metrics.topDeckTurns);
    const questRatio = pct(quests, quests + challenges);
    const topQuester = loreEngineCards(cards).sort(compareLoreEngines)[0];
    const mostInked = [...cards].sort((a,b)=>(b.inked||0)-(a.inked||0) || fullName(a).localeCompare(fullName(b)))[0];

    let title = mineScope ? (win ? 'Votre plan tient la route' : 'Votre série à décortiquer') : (win ? 'Plan adverse gagnant' : 'Adversaire sous pression');
    let summary = mineScope
      ? (win ? `Votre série se termine sur un ${score}. Le plan global a suffisamment tenu pour fermer le match.` : `Votre série se termine sur un ${score}. Les ajustements de mulligan et de rythme seront les premiers points à revoir.`)
      : (win ? `Côté adverse, le plan a converti la série ${score} de son point de vue.` : `Côté adverse, la série se termine sur un ${score} de son point de vue : votre pression a fini par l’emporter.`);

    if(topDeck >= 5){
      title = mineScope ? 'Votre main a souvent tiré la langue' : 'La panne sècheadverse';
      summary = mineScope
        ? `${topDeck} tours en main quasi vide sur la série : c’est le signal principal à surveiller côté ressources.`
        : `${topDeck} tours adverses à 0 ou 1 carte : l’adversaire a souvent vécu au top deck.`;
    }else if(challenges > quests && challenges >= 8){
      title = mineScope ? 'Votre série se joue sur le board' : 'Board control adverse';
      summary = mineScope
        ? `${challenges} défis cumulés : vous avez beaucoup investi dans le contrôle du plateau.`
        : `${challenges} défis adverses cumulés : son plan passait beaucoup par les trades.`;
    }else if(questRatio >= 85 && quests >= 8){
      title = mineScope ? 'Plan lore très assumé' : 'Course au lore adverse';
      summary = mineScope
        ? `${quests} quêtes pour ${challenges} défis : vous avez clairement choisi la race au lore.`
        : `${quests} quêtes adverses pour ${challenges} défis : l’adversaire a surtout essayé de gagner à la clock.`;
    }else if(topQuester?.lore >= 4){
      title = mineScope ? 'Win condition identifiée' : 'Menace adverse identifiée';
      summary = mineScope
        ? `${fullName(topQuester)} est votre principal moteur de lore sur la série avec ${n(topQuester.lore)} lore.`
        : `${fullName(topQuester)} est le moteur de lore adverse le plus important avec ${n(topQuester.lore)} lore.`;
    }

    if(mostInked?.inked >= 3){
      summary += mineScope
        ? ` ${fullName(mostInked)} est aussi une carte souvent transformée en encre (${n(mostInked.inked)}x).`
        : ` ${fullName(mostInked)} est la carte adverse la plus souvent encrée (${n(mostInked.inked)}x).`;
    }

    return { title, summary, badge:mineScope ? 'Mes stats' : 'Stats adverses' };
  }

  function generateMatchNarrative(m){
    if(m?.isBO3 || (Array.isArray(m?.sessions) && m.sessions.length > 1)){
      return generateBo3Narrative(m);
    }
    return generateMatchRead(m);
  }

  function countLeadChanges(rows){
    let prev = 0;
    let changes = 0;
    rows.forEach(r => {
      const sign = r.lead > 0 ? 1 : r.lead < 0 ? -1 : 0;
      if(sign && prev && sign !== prev) changes += 1;
      if(sign) prev = sign;
    });
    return changes;
  }

  function lateLoreGain(rows, owner){
    if(!rows.length) return 0;
    const key = owner === 'opponent' ? 'opponent' : 'mine';
    const end = rows[rows.length - 1];
    const start = rows[Math.max(0, rows.length - 4)] || rows[0];
    return Math.max(0, n(end[key]) - n(start[key]));
  }


  function renderResultHero(m){
    if(!els.resultHero) return;
    if(els.shareMatchButton){ els.shareMatchButton.hidden = !m; els.shareMatchButton.onclick = openShareModal; }
    if(!m){ els.resultHero.innerHTML=''; return; }
    const global = m.isBO3 || isGlobalView();
    const win = m.wins > m.losses;
    const cls = win ? 'win' : 'loss';
    const profiles = m.inkProfiles || buildInkProfiles(m);
    const narrative = generateMatchNarrative(m);
    const opponentName = cleanCardName(m.opponentName || m.first?.opponentName || 'Adversaire');

    if(global){
      const resultLabel = win ? 'Victoire' : 'Défaite';
      const score = `${m.wins} – ${m.losses}`;
      const games = m.sessions?.length || (m.wins + m.losses);
      const opening = bo3OpeningStatus(m);
      els.resultHero.innerHTML = `
        <div class="result-stamp ${cls}" title="${escAttr(narrative.badge || resultLabel)}"><span>Résultat</span><strong>${esc(resultLabel)}</strong></div>
        <div class="result-score result-format"><span>Format</span><strong>BO3</strong><small>${esc(games)} manche(s) analysée(s)</small></div>
        <div class="result-score"><span>Score du match</span><strong>${esc(score)}</strong><small>${esc(resultLabel)} ${esc(score.replace(' – ', '-'))}</small></div>
        <div class="result-score result-playdraw"><span>Départ G1</span><strong>${esc(opening.code)}</strong><small>${esc(opening.helper)}</small></div>
        <div class="result-score result-opponent"><span>Adversaire</span><strong>${esc(opponentName)}</strong><small>Joueur opposé détecté</small></div>
        <div class="result-matchup"><span>Match-up</span><div class="matchup-line">${inkPairHtml(profiles.mine)}<em>vs</em>${inkPairHtml(profiles.opponent)}</div></div>`;
      return;
    }

    const label = win ? 'Victoire' : 'Défaite';
    const score = `${m.finalMineLore} – ${m.finalOppLore}`;
    const winner = win ? (m.myName || 'Vous') : opponentName;
    const opening = gameOpeningStatus(m);
    els.resultHero.innerHTML = `
      <div class="result-stamp ${cls}" title="${escAttr(narrative.badge || label)}"><span>Résultat</span><strong>${esc(label)}</strong></div>
      <div class="result-score"><span>Score final</span><strong>${esc(score)}</strong><small>${esc(winner)} gagne la partie</small></div>
      <div class="result-score result-playdraw"><span>Départ</span><strong>${esc(opening.code)}</strong><small>${esc(opening.helper)}</small></div>
      <div class="result-score result-opponent"><span>Adversaire</span><strong>${esc(opponentName)}</strong><small>${esc(opening.label)}</small></div>
      <div class="result-matchup"><span>Match-up</span><div class="matchup-line">${inkPairHtml(profiles.mine)}<em>vs</em>${inkPairHtml(profiles.opponent)}</div></div>`;
  }

  function renderMulligan(mulligan){
    if(!els.mulliganPanel || !els.mulliganCards) return;
    if(!mulligan || !mulligan.visible){
      els.mulliganPanel.hidden = true;
      els.mulliganCards.innerHTML = '';
      return;
    }
    els.mulliganPanel.hidden = false;
    const showResolved = !!state.mulliganResolved;
    const cards = showResolved ? (mulligan.resolved || []) : (mulligan.initial || []);
    if(els.mulliganSubtitle) els.mulliganSubtitle.textContent = showResolved ? `${n(mulligan.replaced?.length)} carte(s) remplacée(s) après mulligan.` : 'Les 7 cartes initiales avant résolution du mulligan.';
    if(els.mulliganButton) els.mulliganButton.textContent = showResolved ? 'Voir la main initiale' : 'Résoudre le Mulligan';
    els.mulliganCards.classList.remove('mulligan-animate');
    void els.mulliganCards.offsetWidth;
    els.mulliganCards.classList.add('mulligan-animate');
    els.mulliganCards.innerHTML = cards.map(card => {
      const isNew = showResolved && !new Set((mulligan.initial || []).map(cardIdentity)).has(cardIdentity(card));
      return `<button type="button" class="mulligan-card ${isNew ? 'is-new' : ''}" data-card-key="${esc(cardKey(card))}">${cardThumbHtml(card, 'mulligan-thumb')}<span>${esc(fullName(card))}</span>${isNew ? '<em>Mulligan</em>' : ''}</button>`;
    }).join('');
    bindCardButtons();
  }

  function toggleMulliganResolution(){
    state.mulliganResolved = !state.mulliganResolved;
    renderMulligan(getWorkingData()?.first?.mulligan);
  }

  function actionSeriesForScope(data, scope='mine'){
    const owner = scope === 'opponent' ? 'opponent' : 'mine';
    const source = Array.isArray(data?.timeline) ? data.timeline : [];
    const byTurn = new Map();
    source.forEach(entry => {
      if(entry?.owner !== owner) return;
      const type = String(entry?.type || '');
      if(!['ink','play','quest','challenge'].includes(type)) return;
      const turn = n(entry.turn || 1);
      const row = byTurn.get(turn) || { turn, ink:0, play:0, quest:0, challenge:0 };
      if(type === 'ink') row.ink += 1;
      if(type === 'play') row.play += 1;
      if(type === 'quest') row.quest += 1;
      if(type === 'challenge') row.challenge += 1;
      byTurn.set(turn, row);
    });
    return [...byTurn.values()].sort((a,b)=>a.turn-b.turn);
  }

  function setPanelInfo(titleEl, label, info){
    if(!titleEl) return;
    titleEl.innerHTML = `${esc(label)} <button type="button" class="info-dot" data-info="${escAttr(info)}" aria-label="Plus d’informations sur ${escAttr(label)}">i</button>`;
  }

  function renderStats(){
    const m = getWorkingData();
    if(!m){ renderEmptyStats(); return; }
    const global = isGlobalView();
    const metrics = state.scope === 'mine' ? m.proMetrics : m.opponentProMetrics;
    els.statsScopeSubtitle.textContent = global ? 'Résumé macro du BO3 : moteurs de lore, cartes mortes et tendances cumulées.' : (state.scope === 'mine' ? 'Lecture de votre tempo, de votre main et de vos décisions.' : 'Lecture du rythme adverse, de sa pression et de ses fenêtres de tempo.');
    els.inkChartSubtitle.textContent = global ? 'Masqué dans le résumé BO3 : ouvrez une Game pour lire l’économie tour par tour.' : (state.scope === 'mine' ? 'Encre dépensée vs inutilisée pour vous.' : 'Encre dépensée vs inutilisée côté adversaire.');
    if(els.actionChartTitle) els.actionChartTitle.textContent = state.scope === 'mine' ? 'Actions par tour' : 'Actions adverses par tour';
    if(els.actionChartSubtitle) els.actionChartSubtitle.textContent = global ? 'Masqué dans le résumé BO3 : ouvrez une Game pour lire le rythme tour par tour.' : (state.scope === 'mine' ? 'Vos cartes encrées, jouées, quêtes et défis par tour.' : 'Actions adverses détectées pendant ses tours.');
    els.inkFloatTotal.textContent = round1(metrics.totalInkFloat);
    els.inkFloatAverage.textContent = `${round1(metrics.totalInkFloat)} encre non convertie en pression.`;
    const totalActions = metrics.questCount + metrics.challengeCount;
    const questPct = pct(metrics.questCount, totalActions);
    els.actionRatioKpi.textContent = totalActions ? `${questPct}%` : '—';
    els.actionRatioLabel.textContent = `${metrics.questCount} quête(s) · ${metrics.challengeCount} défi(s)`;
    els.topDeckTurns.textContent = metrics.handKnown ? metrics.topDeckTurns : '—';
    els.topDeckBadge.textContent = metrics.handKnown ? (metrics.topDeckTurns >= 3 ? 'Main critique : 0 ou 1 carte en fin de tour.' : 'Mesuré après actions et effets du tour.') : 'Main non visible.';
    document.querySelector('#topDeckTurns')?.closest('.pro-card')?.classList.toggle('risk', metrics.topDeckTurns >= 3);
    if(els.topQuestersTitle) setPanelInfo(els.topQuestersTitle, global ? 'Moteurs de Victoire du BO3' : 'Moteurs de Victoire', global ? 'Cartes qui ont fait avancer le score sur l’ensemble de la série.' : 'Classe les cartes qui ont généré ou accéléré votre lore. Le but est d’identifier ce qui vous rapproche réellement des 20 lore.');
    if(els.topQuestersHelp) els.topQuestersHelp.textContent = global ? 'Top cartes sur la série.' : 'Cartes qui font avancer le score.';
    if(els.mostInkedTitle) setPanelInfo(els.mostInkedTitle, global ? 'Cartes souvent encrées' : 'Cartes les plus encrées', global ? 'Repère les cartes souvent transformées en encre sur ce matchup. Une carte souvent encrée peut être utile, situationnelle ou trop lourde selon le contexte.' : 'Depuis main = carte encrée depuis votre main. Défausse/board = ajout à l’encrier par effet. Les cartes encrées depuis la main sont prioritaires, car elles n’ont pas été jouées.');
    if(els.mostInkedHelp) els.mostInkedHelp.textContent = global ? 'Cartes souvent transformées en encre.' : 'Main / effet distingués.';
    if(els.playTimingTitle) setPanelInfo(els.playTimingTitle, global ? 'Séquence de jeu du BO3' : 'Séquence de jeu', global ? 'Affiche les cartes jouées dans l’ordre, game par game, pour relire le plan de jeu de la série.' : 'Affiche les cartes jouées dans l’ordre. Utile pour voir le rythme de sortie et les tours où le plan s’est installé.');
    if(els.playTimingHelp) els.playTimingHelp.textContent = global ? 'Ordre des cartes jouées.' : 'Cartes jouées dans l’ordre.';
    renderQuickInsights(m, metrics);
    renderMomentFort(m);
    const comparisonMetrics = state.scope === 'mine' ? m.opponentProMetrics : m.proMetrics;
    const scopedActionSeries = global ? [] : actionSeriesForScope(m, state.scope);
    renderInkChart(metrics.inkByTurn); renderActionChart(scopedActionSeries); renderQuestChart(metrics.questCount, metrics.challengeCount); renderHandChart(metrics.handByTurn, comparisonMetrics?.handByTurn || []); renderBoardChart(metrics.boardByTurn || [], comparisonMetrics?.boardByTurn || []);
    syncChartsWithTheme(state.scope);
    updateChartSummary('inkChartSummary', summarizeInk(metrics.inkByTurn));
    updateChartSummary('actionChartSummary', global ? 'Les actions par tour sont disponibles au niveau d’une Game.' : summarizeActions(scopedActionSeries));
    updateChartSummary('questChartSummary', summarizeQuest(metrics.questCount, metrics.challengeCount));
    updateChartSummary('handChartSummary', summarizeHand(metrics.handByTurn, comparisonMetrics?.handByTurn || []));
    updateChartSummary('boardChartSummary', summarizeBoard(metrics.boardByTurn || [], comparisonMetrics?.boardByTurn || []));
    renderStatTables(m);
    renderDeadWeight(m);
    renderDeckDepthMatch(m);
    bindStatListToggles();
    bindCardButtons();
  }

  function renderEmptyStats(){
    ['inkFloatTotal','actionRatioKpi','topDeckTurns','questChallengeCenter'].forEach(id => { if(els[id]) els[id].textContent='—'; });
    ['topQuestersTable','mostInkedTable','playTimingTable','challengeTable','deadWeightTable'].forEach(id => { if(els[id]) els[id].innerHTML='<div class="empty-line">Importez un replay.</div>'; });
    if(els.quickInsights) els.quickInsights.innerHTML='';
    renderInkChart([]); renderActionChart([]); renderQuestChart(0,0); renderHandChart([], []); renderBoardChart([], []);
    updateChartSummary('inkChartSummary','Résumé du graphique économie d’encre disponible après import.');
    updateChartSummary('actionChartSummary','Résumé du graphique actions disponible après import.');
    updateChartSummary('questChartSummary','Résumé du graphique quête défi disponible après import.');
    updateChartSummary('handChartSummary','Résumé du graphique de main disponible après import.');
    updateChartSummary('boardChartSummary','Résumé du graphique de présence sur board disponible après import.');
  }

  // Moment fort : le tour qui a le plus fait basculer la course au lore
  // (plus grosse variation de l'écart Toi − Adversaire), avec les cartes
  // qu'on a fait quêter ce tour-là. Élément narratif/ludique d'un match.
  // Tour qui a le plus fait basculer l'écart de lore (Toi − Adversaire).
  function computeMomentFort(m){
    const series = arrayify(m?.loreSeries)
      .filter(r => r && n(r.turn) > 0)
      .sort((a, b) => n(a.turn) - n(b.turn));
    if(series.length < 2) return null;
    let prevDiff = 0, best = null;
    series.forEach(row => {
      const diff = n(row.mine) - n(row.opponent);
      const swing = diff - prevDiff;
      if(best === null || Math.abs(swing) > Math.abs(best.swing)){
        best = { turn: n(row.turn), swing, mine: n(row.mine), opp: n(row.opponent) };
      }
      prevDiff = diff;
    });
    return best && best.swing !== 0 ? best : null;
  }

  function renderMomentFort(m){
    const panel = els.momentFortPanel;
    if(!panel) return;
    const best = isGlobalView() ? null : computeMomentFort(m);
    if(!best){ panel.hidden = true; panel.innerHTML = ''; return; }
    const favor = best.swing > 0;
    const seen = new Set();
    const thumbs = arrayify(m?.timeline)
      .filter(t => t.owner === 'mine' && t.type === 'quest' && n(t.turn) === best.turn && t.card)
      .filter(t => { const k = cardKey(t.card); if(seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 5)
      .map(t => `<button type="button" class="mf-card" data-card-key="${escAttr(cardKey(t.card))}" title="${escAttr(fullName(t.card) || t.cardName || 'Carte')}">${cardThumbHtml(t.card, 'mf-card-thumb')}</button>`)
      .join('');
    const lead = Math.max(best.mine, best.opp, 1);
    panel.hidden = false;
    panel.innerHTML = `
      <div class="mf-head"><span class="mf-kicker">Moment fort du match</span><span class="mf-turn">Tour ${best.turn}</span></div>
      <div class="mf-statement ${favor ? 'mf-up' : 'mf-down'}">
        <strong>${favor ? '+' : '−'}${Math.abs(best.swing)} lore d’écart</strong>
        <span>${favor ? 'tu fais basculer la course au lore en ta faveur' : 'l’adversaire reprend l’avantage au lore'}</span>
      </div>
      <div class="mf-race">
        <div class="mf-race-row"><span>Toi</span><div class="mf-bar"><i class="mf-bar-mine" style="width:${Math.round(best.mine / lead * 100)}%"></i></div><b>${best.mine}</b></div>
        <div class="mf-race-row"><span>Adv.</span><div class="mf-bar"><i class="mf-bar-opp" style="width:${Math.round(best.opp / lead * 100)}%"></i></div><b>${best.opp}</b></div>
      </div>
      ${thumbs ? `<div class="mf-cards"><span class="mf-cards-label">Tes quêtes ce tour</span><div class="mf-cards-row">${thumbs}</div></div>` : ''}`;
    bindCardButtons();
  }

  // Retire les emojis/pictogrammes décoratifs (ex. pseudos « LEO 🍄🐳 ») pour un
  // rendu de partage net et pro.
  function stripDecoEmoji(s){
    return String(s || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function shareInkDots(profile){
    const inks = profile?.inks?.length ? profile.inks : ['inkless'];
    return inks.map(key => `<i class="ink-dot ink-${escAttr(key)}"></i>`).join('');
  }

  // Accroche courte calée sur le résultat et l'écart — ton « brag/partage ».
  function shareHeadline(m, win, global){
    if(global) return win ? 'Série remportée' : 'Série perdue';
    const mine = n(m.finalMineLore), opp = n(m.finalOppLore), margin = mine - opp;
    if(win){
      if(opp === 0) return 'Victoire parfaite';
      if(margin >= 12) return 'Victoire dominante';
      if(margin <= 3) return 'Victoire au finish';
      return 'Victoire maîtrisée';
    }
    if(mine === 0) return 'Jour sans';
    if(margin >= -3) return 'Défaite au finish';
    if(margin <= -12) return 'Soirée compliquée';
    return 'Défaite serrée';
  }

  // Mini-graphe « course au lore » (toi vs adversaire par tour), en SVG inline
  // pour un export fiable (sans dépendance ni souci CORS).
  // Couleurs en attributs SVG inline (et non via CSS var/color-mix, que
  // html-to-image ne sait pas résoudre → rendait un aplat noir à l'export).
  function loreRaceSvg(m, H, c1, c2){
    const series = arrayify(m?.loreSeries).filter(r => r && n(r.turn) > 0).sort((a, b) => n(a.turn) - n(b.turn));
    if(series.length < 2) return '';
    const W = 320, pl = 4, pr = 4, pt = 8, pb = 8;
    const maxT = series[series.length - 1].turn;
    const maxL = Math.max(20, ...series.map(r => Math.max(n(r.mine), n(r.opponent))));
    const X = t => pl + (maxT > 1 ? (t - 1) / (maxT - 1) : 0) * (W - pl - pr);
    const Y = l => H - pb - (l / maxL) * (H - pt - pb);
    const line = key => series.map((r, i) => `${i ? 'L' : 'M'}${X(r.turn).toFixed(1)},${Y(n(r[key])).toFixed(1)}`).join(' ');
    const last = series[series.length - 1];
    return `<svg class="lr-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <line x1="${pl}" y1="${Y(20).toFixed(1)}" x2="${W - pr}" y2="${Y(20).toFixed(1)}" stroke="rgba(255,255,255,.22)" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>
        <path d="${line('opponent')}" fill="none" stroke="${c2}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        <path d="${line('mine')}" fill="none" stroke="${c1}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="lr-legend"><span><i style="background:${c1}"></i>Toi ${n(last.mine)}</span><span><i style="background:${c2}"></i>Adv. ${n(last.opponent)}</span><span class="lr-k-goal">objectif&nbsp;20</span></div>`;
  }

  // Visuel de partage d'un match, en 3 variantes (cartes / course au lore / résumé).
  // Teinté aux couleurs du deck, pensé pour l'export PNG ou la capture.
  // Rangée de diamants de Lore (style Lorcana) — bien plus parlant qu'un « x lore ».
  function loreDiamonds(lore){
    const v = Math.max(0, Math.round(n(lore)));
    if(!v) return '';
    const max = 7;
    const count = Math.min(v, max);
    const dia = `<svg class="lore-dia" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L15 8 L8 15 L1 8 Z"/></svg>`;
    return `<span class="lore-dias" title="${v} lore">${dia.repeat(count)}${v > max ? '<span class="lore-more">+</span>' : ''}</span>`;
  }

  // Le CDN des cartes n'envoie pas de CORS → html-to-image ne peut pas lire
  // l'image (canvas « tainté ») et l'export échoue. On relaie via notre proxy
  // même origine + crossorigin pour un canvas propre.
  function shareProxyUrl(url){
    return /^https:\/\/cards\.duels\.ink\//.test(String(url || '')) ? `/api/img-proxy?url=${encodeURIComponent(url)}` : url;
  }
  function shareThumbHtml(card, cls){
    const raw = card.imageSmall || card.image || duelinkImageUrl(card);
    const label = fullName(card) || card.name || 'Carte';
    if(!raw) return `<span class="${esc(cls)} thumb-placeholder">${esc(initials(label))}</span>`;
    return `<img class="${esc(cls)}" src="${esc(shareProxyUrl(raw))}" alt="${escAttr(label)}" crossorigin="anonymous">`;
  }
  // Grande illustration MVP : rendue en BACKGROUND (et non <img object-fit>) car
  // html-to-image sur iOS Safari ne peint pas un <img object-fit/transform> →
  // l'image disparaissait sur mobile. Le fond data-URL est fiable partout.
  function shareMvpArt(card){
    // Image pleine résolution (et non la vignette) car on zoome fort pour ne
    // garder QUE l'illustration : la vignette deviendrait floue à l'agrandissement.
    const base = String(card.image || card.imageSmall || duelinkImageUrl(card) || '');
    const full = base.replace('/thumbnail/', '/full/');
    const label = fullName(card) || card.name || 'Carte';
    if(!base) return `<div class="sqb-mvp-img thumb-placeholder">${esc(initials(label))}</div>`;
    return `<img class="sqb-mvp-img" data-share-bg="${escAttr(shareProxyUrl(full))}" data-share-bg-alt="${escAttr(shareProxyUrl(base))}" alt="${escAttr(label)}">`;
  }

  const SHARE_ICONS = {
    clock: '<svg viewBox="0 0 24 24" class="bento-ic"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    flag: '<svg viewBox="0 0 24 24" class="bento-ic"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    target: '<svg viewBox="0 0 24 24" class="bento-ic"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" class="bento-ic"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>'
  };

  // Encres avec repli : si non détectées (matchs de l'historique reconstruits),
  // on les déduit du libellé de matchup → les couleurs du deck s'appliquent partout.
  function shareInkProfile(profile, labelPart){
    let inks = (profile?.inks || []).filter(k => k && k !== 'inkless');
    if(!inks.length && labelPart){
      inks = [...String(labelPart).matchAll(/amber|ambre|amethyst|amet|emerald|emeraude|ruby|rubis|sapphire|saphir|steel|acier/gi)]
        .map(x => inkKey(x[0])).filter(k => k && k !== 'inkless');
      inks = [...new Set(inks)].slice(0, 2);
    }
    const colors = inks.map(k => INK_COLORS[k]).filter(Boolean);
    const label = profile?.label && !/non détect/i.test(profile.label) ? profile.label : (inks.map(inkLabel).join(' / ') || '');
    return { inks: inks.length ? inks : ['inkless'], colors, label };
  }
  function shareDots(p){ return p.inks.map(k => `<i class="ink-dot ink-${escAttr(k)}"></i>`).join(''); }

  // Visuel de partage unique : grande image paysage, MVP (illustration), score
  // géant, matchup, bento de stats et course au lore — aéré, teinté au deck.
  function buildShareCardHtml(m){
    const global = m.isBO3 || isGlobalView();
    const win = n(m.wins) > n(m.losses);
    const base = m.inkProfiles || buildInkProfiles(m);
    const matchupLabel = String(m.matchupLabel || m.matchup_label || '');
    const labParts = matchupLabel.split(/\s+vs\s+/i);
    const mineP = shareInkProfile(base.mine, labParts[0] || base.mine?.label);
    const oppP = shareInkProfile(base.opponent, labParts[1] || base.opponent?.label);
    const c1 = mineP.colors[0] || '#3b4a6b';
    const c2 = mineP.colors[1] || mineP.colors[0] || '#27304a';
    const tagline = shareHeadline(m, win, global);
    const score = global ? `${n(m.wins)} – ${n(m.losses)}` : `${n(m.finalMineLore)} – ${n(m.finalOppLore)}`;
    const scoreUnit = global ? 'manches' : 'lore';
    const resultLabel = win ? 'VICTOIRE' : 'DÉFAITE';
    const playerName = stripDecoEmoji(cleanCardName(m.myName || m.first?.myName || 'Joueur')) || 'Joueur';
    const oppName = stripDecoEmoji(cleanCardName(m.opponentName || m.first?.opponentName || 'Adversaire')) || 'Adversaire';
    const mvp = loreEngineCards(cardsForScope(m, 'mine')).sort(compareLoreEngines)[0];
    const mf = global ? null : computeMomentFort(m);
    const opening = global ? bo3OpeningStatus(m) : gameOpeningStatus(m);
    const metrics = m.proMetrics || {};
    const g = (!global && arrayify(m.sessions)[0]) ? m.sessions[0] : m;
    const turns = global ? Math.round(n(m.avgTurns)) : n(g.turnCount || g.totalTurns || m.turnCount);
    const seen = global ? 0 : Math.min(60, n(g.cardsSeen || m.cardsSeen));
    const seenPct = seen ? Math.round(seen / 60 * 100) : 0;
    const stats = [
      { k: 'Tours', v: turns || '—', ic: 'clock', p: 0 },
      { k: 'Départ', v: opening?.code || '—', ic: 'flag', p: 0 },
      { k: 'Quêtes / Défis', v: `${n(metrics.questCount)}/${n(metrics.challengeCount)}`, ic: 'target', p: 0 },
      { k: 'Deck vu', v: seenPct ? `${seenPct}%` : '—', ic: 'eye', p: seenPct }
    ];
    const bento = stats.map(s => `<div class="dash-stat">${SHARE_ICONS[s.ic] || ''}<strong>${esc(String(s.v))}</strong><span>${esc(s.k)}</span><i class="dash-stat-bar"${s.p ? ` style="--p:${s.p}%"` : ''}></i></div>`).join('');
    const mfText = mf ? `Tour ${mf.turn} · ${mf.swing > 0 ? '+' : '−'}${Math.abs(mf.swing)} lore d’écart` : '';
    const heroNum = global ? n(m.wins) : Math.max(n(m.finalMineLore), n(m.finalOppLore));
    const lore = global ? '' : loreRaceSvg(m, 150, c1, c2);

    return `<div class="share-card sqb-card share-${win ? 'win' : 'loss'}" style="--sc1:${c1};--sc2:${c2}">
      <span class="share-glow share-glow-a"></span><span class="share-glow share-glow-b"></span>
      <div class="sq-head"><span class="share-logo"><svg class="share-logo-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L21.5 12 L12 22 L2.5 12 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7.2 L16.8 12 L12 16.8 L7.2 12 Z" fill="currentColor"/></svg>InkSight</span><span class="share-result-badge"><i class="rb-dot"></i>${resultLabel}</span></div>
      <div class="sqb-main">
        <div class="sqb-mvp">
          ${mvp ? `<div class="sqb-mvp-art">${shareMvpArt(mvp)}<span class="sqb-mvp-fade"></span><span class="sqb-mvp-cap"><span class="hero-mvp-seal">MVP du match</span><strong>${esc(fullName(mvp) || mvp.name || 'Carte')}</strong>${loreDiamonds(n(mvp.lore))}</span></div>` : ''}
        </div>
        <div class="sqb-right">
          <div class="sq-hero">
            <div class="sq-score"><strong>${esc(score)}</strong><span class="sq-unit">${esc(scoreUnit)}</span></div>
            <div class="sq-tag">${esc(tagline)}</div>
          </div>
          <div class="sq-matchup">
            <div class="sq-team"><span class="share-dots">${shareDots(mineP)}</span><b>${esc(playerName)}</b><small>${esc(mineP.label)}</small></div>
            <span class="sq-vs">VS</span>
            <div class="sq-team sq-team-opp"><span class="share-dots">${shareDots(oppP)}</span><b>${esc(oppName)}</b><small>${esc(oppP.label)}</small></div>
          </div>
          <div class="sq-stats">${bento}</div>
          ${lore ? `<div class="sq-graph">${lore}</div>` : ''}
          ${mfText ? `<div class="sq-moment"><span>Moment fort</span><b>${esc(mfText)}</b></div>` : ''}
        </div>
      </div>
      <div class="sq-foot"><div class="sq-cta"><span class="sq-cta-main">Analyse tes parties sur InkSight</span><span class="sq-cta-sub">Replays, statistiques &amp; matchups Lorcana</span><span class="sq-cta-url">inksight-omega.vercel.app</span></div>${_shareQrSvg ? `<div class="sq-qr"><span class="share-qr">${_shareQrSvg}</span><span class="sq-qr-label">Scanne pour essayer</span></div>` : ''}</div>
    </div>`;
  }

  let _shareQrSvg = '';
  async function ensureShareQr(){
    if(_shareQrSvg) return _shareQrSvg;
    try{
      const QR = (await import('qrcode')).default;
      _shareQrSvg = await QR.toString('https://inksight-omega.vercel.app', {
        type: 'svg', margin: 0, errorCorrectionLevel: 'M',
        color: { dark: '#ffffff', light: '#00000000' }
      });
    }catch(_e){ _shareQrSvg = ''; }
    return _shareQrSvg;
  }

  let _shareBlob = null;

  // Génère le visuel À TAILLE FIXE (1080×1080) hors écran, puis affiche une
  // IMAGE — identique sur tous les écrans (le HTML ne s'adapte plus au device).
  async function renderShareImage(){
    const m = getWorkingData();
    const modal = document.getElementById('shareModal');
    if(!m || !modal) return;
    const stage = modal.querySelector('#shareCardStage');
    stage.innerHTML = '<div class="share-loading">Génération du visuel…</div>';
    _shareBlob = null;
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:1080px;pointer-events:none;opacity:0;';
    holder.innerHTML = buildShareCardHtml(m);
    document.body.appendChild(holder);
    const card = holder.querySelector('.share-card');
    const toDataUrl = async src => {
      const resp = await fetch(src, { cache: 'force-cache' });
      if(!resp.ok) throw new Error('img');
      const bl = await resp.blob();
      return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(bl); });
    };
    try{
      // Pré-inline les images en data URL (via le proxy même origine) → l'export
      // ne dépend plus d'un fetch et le canvas n'est jamais « tainté ».
      await Promise.all([...holder.querySelectorAll('img:not([data-share-bg])')].map(async img => {
        try{ img.src = await toDataUrl(img.src); }catch(_e){}
        if(!(img.complete && img.naturalWidth)) await new Promise(res => { img.onload = img.onerror = res; setTimeout(res, 3000); });
      }));
      // Illustration MVP : <img> dont on injecte le data URL dans src (le plus
      // fiable sur iOS Safari — object-fit et background-image n'y sont pas
      // peints par html-to-image). Repli sur la vignette si la pleine réso manque.
      await Promise.all([...holder.querySelectorAll('[data-share-bg]')].map(async el => {
        const isImg = el.tagName === 'IMG';
        let data = null;
        try{ data = await toDataUrl(el.getAttribute('data-share-bg')); }
        catch(_e){ const alt = el.getAttribute('data-share-bg-alt'); if(alt){ try{ data = await toDataUrl(alt); }catch(_e2){} } }
        if(!data) return;
        if(isImg){ el.src = data; if(!(el.complete && el.naturalWidth)) await new Promise(res => { el.onload = el.onerror = res; setTimeout(res, 3000); }); }
        else el.style.backgroundImage = `url("${data}")`;
      }));
      // Sans cela, le PNG est capturé avant le chargement des polices (Inter /
      // JetBrains Mono) → métriques de repli, textes qui se chevauchent sur mobile.
      try{ await Promise.race([document.fonts.ready, new Promise(res => setTimeout(res, 2500))]); }catch(_e){}
      const { toBlob } = await import('html-to-image');
      const opts = { pixelRatio: 2, cacheBust: true, width: 1080, height: card.offsetHeight };
      // iOS Safari saute souvent les images au 1er passage : un rendu de chauffe
      // amorce le cache des ressources, le 2e capture l'image complète.
      try{ await toBlob(card, opts); }catch(_e){}
      const blob = await toBlob(card, opts);
      if(!blob) throw new Error('blob');
      _shareBlob = blob;
      const url = URL.createObjectURL(blob);
      stage.innerHTML = `<img class="share-result-img" src="${url}" alt="Visuel du match">`;
    }catch(_e){
      stage.innerHTML = '<div class="share-loading">Échec de génération — réessaie.</div>';
    }finally{
      holder.remove();
    }
  }

  async function openShareModal(){
    const m = getWorkingData();
    if(!m) return;
    await ensureShareQr();
    let modal = document.getElementById('shareModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'shareModal';
      modal.className = 'share-modal';
      modal.innerHTML = `<div class="share-modal-backdrop" data-share-close></div>
        <button type="button" class="share-modal-close" data-share-close aria-label="Fermer">×</button>
        <div class="share-popup" role="dialog" aria-modal="true" aria-label="Visuel de partage du match">
          <div class="share-card-stage" id="shareCardStage"></div>
          <div class="share-popup-actions">
            <button type="button" class="primary-button" id="shareDownloadBtn">Télécharger l’image</button>
          </div>
          <p class="share-modal-hint">Sur mobile : appuie longuement sur l’image pour l’enregistrer.</p>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if(e.target.closest('[data-share-close]')) closeShareModal(); });
      modal.querySelector('#shareDownloadBtn').addEventListener('click', downloadShareImage);
      document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) closeShareModal(); });
    }
    modal.hidden = false;
    document.body.classList.add('share-open');
    renderShareImage();
  }

  function closeShareModal(){
    const modal = document.getElementById('shareModal');
    if(modal) modal.hidden = true;
    document.body.classList.remove('share-open');
  }

  async function downloadShareImage(){
    const btn = document.getElementById('shareDownloadBtn');
    if(!btn) return;
    if(!_shareBlob){ await renderShareImage(); }
    if(!_shareBlob){ btn.textContent = 'Réessaie'; setTimeout(() => { btn.textContent = 'Télécharger l’image'; }, 2000); return; }
    const url = URL.createObjectURL(_shareBlob);
    const a = document.createElement('a');
    a.download = `inksight-match-${Date.now()}.png`;
    a.href = url;
    document.body.appendChild(a); a.click(); a.remove();
    const hint = document.querySelector('.share-modal-hint');
    if(hint) hint.textContent = 'Téléchargée. Sur mobile, appuie longuement sur l’image pour l’enregistrer.';
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  }

  function renderQuickInsights(m, metrics){
    if(!els.quickInsights) return;
    const cards = cardsForScope(m, state.scope);
    const isOpponent = state.scope === 'opponent';

    if(isGlobalView()){
      const scopedCards = cardsForScope(m, state.scope);
      const topQuester = loreEngineCards(scopedCards).sort(compareLoreEngines)[0];
      const mostInked = [...scopedCards].sort((a,b)=>(b.inked||0)-(a.inked||0) || fullName(a).localeCompare(fullName(b)))[0];
      const scopedNarrative = generateBo3ScopedNarrative(m, state.scope);
      const items = [
        {
          label:isOpponent ? 'Résumé adverse' : 'Votre résumé de série',
          value:scopedNarrative.title,
          helper:scopedNarrative.summary,
          card:''
        },
        {
          label:isOpponent ? 'Moteur de lore adverse' : 'Votre moteur de lore',
          value:topQuester ? fullName(topQuester) : 'Non détecté',
          helper:topQuester ? `${n(topQuester.lore)} lore cumulé sur la série.` : 'Aucune carte lore identifiée dans ce scope.',
          card:topQuester ? cardKey(topQuester) : ''
        },
        {
          label:isOpponent ? 'Carte adverse la plus encrée' : 'Dead weight possible',
          value:mostInked ? `${fullName(mostInked)} · ${n(mostInked.inked)}x` : 'Non détecté',
          helper:isOpponent ? 'Carte adverse le plus souvent transformée en encre.' : 'Carte de votre deck souvent transformée en encre dans ce matchup.',
          card:mostInked ? cardKey(mostInked) : ''
        }
      ];
      els.quickInsights.innerHTML = items.map(item => {
        const attrs = item.card ? `data-card-key="${esc(item.card)}"` : '';
        return `<button type="button" class="quick-insight bo3-scope-summary" ${attrs}><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><small>${esc(item.helper)}</small></button>`;
      }).join('');
      bindCardButtons();
      return;
    }

    const maxFloat = [...(metrics.inkByTurn || [])].sort((a,b)=>b.float-a.float)[0];
    const topQuester = loreEngineCards(cards).sort(compareLoreEngines)[0];
    const mostInked = [...cards].sort((a,b)=>(b.inked||0)-(a.inked||0))[0];
    const topDeckTurn = [...(metrics.handByTurn || [])].filter(r => r.handCount <= 1)[0];
    const items = [
      {
        label:isOpponent ? 'Fenêtre de tempo adverse' : 'Top erreur de tempo',
        value:maxFloat?.turn ? `T${maxFloat.turn} · ${round1(maxFloat.float)} encre non convertie` : 'Non détecté',
        helper:isOpponent ? 'Moment où l’adversaire a le moins converti son encre.' : 'Le tour où votre encre a été le moins bien convertie.',
        target:'#inkFloatChart'
      },
      {
        label:isOpponent ? 'Win condition adverse' : 'Win condition principale',
        value:topQuester ? fullName(topQuester) : 'Non détectée',
        helper:isOpponent ? 'La carte qui a le plus accéléré son score.' : 'La carte qui a le plus fait avancer votre lore.',
        card:topQuester ? cardKey(topQuester) : ''
      },
      {
        label:isOpponent ? 'Carte adverse la plus encrée' : 'Carte la plus encrée',
        value:mostInked ? `${fullName(mostInked)} · ${n(mostInked.inked)}x` : 'Non détectée',
        helper:'Carte le plus souvent transformée en encre.',
        card:mostInked ? cardKey(mostInked) : ''
      },
      {
        label:isOpponent ? 'Main adverse critique' : 'Main critique',
        value:topDeckTurn ? `T${topDeckTurn.turn} · ${topDeckTurn.handCount} carte` : 'Non détectée',
        helper:isOpponent ? 'Tour adverse terminé avec 0 ou 1 carte en main.' : 'Tour terminé avec 0 ou 1 carte en main.',
        target:'#handCurveChart'
      }
    ];
    els.quickInsights.innerHTML = items.map(item => {
      const attrs = item.card ? `data-card-key="${esc(item.card)}"` : item.target ? `data-focus-target="${esc(item.target)}"` : '';
      return `<button type="button" class="quick-insight" ${attrs}><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><small>${esc(item.helper)}</small></button>`;
    }).join('');
    bindQuickInsights();
    bindCardButtons();
  }

  function bindQuickInsights(){
    document.querySelectorAll('[data-focus-target]').forEach(btn => btn.onclick = () => {
      const target = document.querySelector(btn.dataset.focusTarget);
      if(!target) return;
      const panel = target.closest('.chart-panel, .stat-panel, .match-read') || target;
      panel.scrollIntoView({ behavior:'smooth', block:'center' });
      panel.classList.remove('focus-pulse');
      void panel.offsetWidth;
      panel.classList.add('focus-pulse');
    });
  }



  function handRetentionForScope(m){
    // La main adverse est majoritairement privée dans Duels.ink : on ne l'analyse pas comme une donnée fiable.
    return state.scope === 'opponent' ? [] : arrayify(m?.handRetention);
  }

  // ===== Profondeur de deck + probabilités de pioche (loi hypergéométrique) =====
  // P(voir ≥ 1 carte parmi `copies` exemplaires, en `seen` cartes vues, deck de 60).
  function hyperSeeAtLeastOne(copies, seen, deck = 60){
    copies = n(copies); seen = n(seen);
    if(copies <= 0 || seen <= 0) return 0;
    if(seen >= deck) return 1;
    let pNone = 1;
    for(let i = 0; i < seen; i++){
      const num = deck - copies - i;
      if(num <= 0){ pNone = 0; break; }
      pNone *= num / (deck - i);
    }
    return Math.max(0, Math.min(1, 1 - pNone));
  }
  // Cartes vues ≈ main de départ (7) + pioches naturelles (1/tour, sauf T1 si on
  // commence). Les pioches d'effet ne sont pas encore comptées (estimation basse).
  function deckDepthCardsSeen(turns, wentFirst){
    const myTurns = Math.max(0, n(turns));
    const naturalDraws = Math.max(0, myTurns - (wentFirst ? 1 : 0));
    return Math.min(60, 7 + naturalDraws);
  }
  function deckDepthTableHtml(cardsSeen, deckSize = 60){
    const seen = Math.round(cardsSeen);
    const deck = deckSize > 0 ? deckSize : 60;
    const pctDeck = Math.min(100, Math.round((seen / deck) * 100));
    const loops = seen / deck;
    // « % du deck parcouru » : on ne connaît pas l'identité des cartes regardées puis
    // remises au fond, mais on sait combien de cartes ont défilé → quand on a fait le
    // tour du deck, on a (re)vu l'intégralité de sa liste.
    const cycle = seen >= deck
      ? `<span class="deck-depth-cycle">🔄 Deck parcouru ×${loops.toFixed(1)}</span>`
      : '';
    const rows = [1, 2, 3, 4].map(c => {
      const pct = Math.round(hyperSeeAtLeastOne(c, seen, deck) * 100);
      return `<div class="deck-depth-row"><span>${c}× exemplaire${c > 1 ? 's' : ''}</span><i><b style="width:${pct}%"></b></i><strong>${pct}%</strong></div>`;
    }).join('');
    return `<div class="deck-depth-seen"><strong>${seen}</strong><span>cartes vues (≈) · ${pctDeck}% du deck</span>${cycle}</div><div class="deck-depth-table">${rows}</div>`;
  }
  // Profil de pioche : vitesse (cartes/tour), tour de deck estimé, et grille de
  // probabilité « avoir vu ≥1 exemplaire » par palier de tour, calée sur le rythme
  // réel de pioche (cardsSeen/turns). Répond à « verrai-je ma carte clé à temps ? ».
  function deckProfileHtml(cardsSeen, turns, deck = 60){
    const seen = Math.min(deck, Math.round(n(cardsSeen)));
    const t = Math.max(1, Math.round(n(turns)));
    const pctDeck = Math.min(100, Math.round((seen / deck) * 100));
    const cardsPerTurn = seen / t;
    const drawsPerTurn = Math.max(0, seen - 7) / t;
    const fullDeckTurn = drawsPerTurn > 0 ? Math.ceil((deck - 7) / drawsPerTurn) : null;
    const byTurn = nn => Math.min(deck, Math.round(7 + drawsPerTurn * nn));
    const cols = [
      { label: 'Main', seen: 7 },
      { label: 'T3', seen: byTurn(3) },
      { label: 'T5', seen: byTurn(5) },
      { label: 'T8', seen: byTurn(8) }
    ];
    const head = `<div class="ddh-cell ddh-corner"></div>` + cols.map(c => `<div class="ddh-cell ddh-col">${c.label}</div>`).join('');
    const body = [1, 2, 3, 4].map(c => {
      const rowHead = `<div class="ddh-cell ddh-rowhead">${c}×</div>`;
      const cells = cols.map(col => {
        const pct = Math.round(hyperSeeAtLeastOne(c, col.seen, deck) * 100);
        return `<div class="ddh-cell ddh-val" style="--p:${pct}">${pct}<span>%</span></div>`;
      }).join('');
      return rowHead + cells;
    }).join('');
    const cycleChip = fullDeckTurn
      ? `<span class="ddh-chip"><b>T${fullDeckTurn}</b> tour de deck</span>`
      : `<span class="ddh-chip ddh-chip-soft">tour de deck lent</span>`;
    return `<div class="ddh">
      <div class="ddh-hero">
        <div class="ddh-hero-num">${pctDeck}<span>%</span></div>
        <div class="ddh-hero-lab">du deck vu<br><b>${seen}/${deck}</b> cartes</div>
        <div class="ddh-chips">
          <span class="ddh-chip"><b>${cardsPerTurn.toFixed(1)}</b> cartes/tour</span>
          ${cycleChip}
        </div>
      </div>
      <div class="ddh-grid">${head}${body}</div>
      <p class="deck-depth-note">Chaque case = probabilité d’avoir <b>déjà vu ≥1 exemplaire</b> d’une carte, selon ses copies (lignes) et le palier de tour (colonnes). Plus c’est vert, plus c’est probable. Calé sur ton rythme réel (${cardsPerTurn.toFixed(1)} cartes/tour).</p>
    </div>`;
  }

  function sessionWentFirst(s){
    if(s?.firstTurnPlayer != null && s?.myPlayerNumber != null) return s.firstTurnPlayer === s.myPlayerNumber;
    return s?.otp === true || s?.went_first === true || s?.wentFirst === true;
  }
  function renderDeckDepthMatch(m){
    const host = els.deckDepthMatch, panel = els.deckDepthMatchPanel;
    if(!host) return;
    const sessions = arrayify(m?.sessions).length ? m.sessions : (m ? [m] : []);
    // Exact si dispo (compté depuis les logs : pioches d'effet incluses), sinon
    // repli sur l'estimation main de départ + pioches naturelles.
    const games = sessions.map((s, i) => ({
      n: i + 1,
      cardsSeen: n(s.cardsSeen) > 0 ? n(s.cardsSeen) : deckDepthCardsSeen(s.turnCount || s.totalTurns, sessionWentFirst(s)),
      turns: Math.max(1, n(s.turnCount || s.totalTurns)),
      exact: n(s.cardsSeen) > 0
    })).filter(g => g.cardsSeen > 0);
    if(!games.length){ if(panel) panel.hidden = true; host.innerHTML = ''; return; }
    if(panel) panel.hidden = false;
    const exact = games.every(g => g.exact);
    const note = `<p class="deck-depth-note">${exact ? 'Mesuré sur le déroulé réel de la partie — toutes tes pioches et effets compris.' : 'Estimation : main de départ + pioches de tour uniquement (les pioches venant d’effets ne sont pas comptées). Réimporte cette partie pour le calcul exact.'}</p>`;
    if(games.length > 1){
      const avgSeen = games.reduce((sum, g) => sum + g.cardsSeen, 0) / games.length;
      const avgTurns = games.reduce((sum, g) => sum + g.turns, 0) / games.length;
      const perGame = games.map(g => `<div class="deck-depth-game"><h4>Game ${g.n}</h4>${deckProfileHtml(g.cardsSeen, g.turns)}</div>`).join('');
      host.innerHTML = `<div class="deck-depth-game"><h4>Moyenne BO</h4>${deckProfileHtml(avgSeen, avgTurns)}</div>${perGame}${note}`;
    }else{
      host.innerHTML = `${deckProfileHtml(games[0].cardsSeen, games[0].turns)}${note}`;
    }
  }
  // Copies par carte (clé = slug de nom) pour le deck sélectionné, si dispo.
  function selectedDeckCopiesByKey(){
    const sel = selectedFilterValues('performanceDeckFilter');
    if(sel.length !== 1) return null;
    const ids = String(sel[0]).split('|').filter(Boolean);
    let cardList = null;
    for(const id of ids){ const m = getDeckCardList(id); if(m && m.size){ cardList = m; break; } }
    if(!cardList) return null;
    const byKey = new Map();
    for(const [cardId, count] of cardList.entries()){
      const h = hydrateCard({ id:cardId, cardId });
      const key = statCardKey(h && fullName(h) !== 'Carte inconnue' ? h : { name:cardId });
      if(key) byKey.set(key, (byKey.get(key) || 0) + n(count));
    }
    return byKey.size ? byKey : null;
  }
  const _deckDecklistFetching = new Set();
  async function ensureDeckDecklistCached(profileId){
    const key = String(profileId || '');
    if(!key || deckCardListCache.has(key) || _deckDecklistFetching.has(key)) return;
    const match = (state.savedMatches || []).find(r => String(r.deck_profile_id) === key);
    if(!match) return;
    _deckDecklistFetching.add(key);
    try{
      const full = await getSavedMatch(match.id);
      const cards = apiDecklistStatus(full, 'mine').cards;
      const map = new Map(arrayify(cards).map(c => [String(c.id || c.cardId || ''), n(c.count) || 1]).filter(([id]) => id));
      if(map.size >= 5){ deckCardListCache.set(key, map); globalThis.INKSIGHT_renderPerformanceData?.(); }
    }catch(_e){}
    finally{ _deckDecklistFetching.delete(key); }
  }

  // Tuile « main de départ » : même langage visuel que la galerie Cartes
  // (image + badge + chiffre héros), centrée sur une info simple : à quelle
  // fréquence on commence la partie avec cette carte en main.
  function openingCardTileHtml(r, rank, totalGames){
    const view = performanceCardView(r.card);
    const band = r.openingPct >= 50 ? { label: 'Souvent en main', tone: 'success' }
      : r.openingPct >= 30 ? { label: 'Régulièrement', tone: 'blue' }
      : r.openingPct >= 15 ? { label: 'De temps en temps', tone: 'neutral' }
      : { label: 'Rarement', tone: 'neutral' };
    return `<article class="performance-card-tile performance-card-tile-v2 opening-card-tile is-clickable" role="button" tabindex="0" data-performance-card-key="${escAttr(r.key || '')}" data-performance-card-name="${escAttr(r.name)}">
      <div class="performance-card-art"><span class="opening-rank">#${rank}</span>${cardThumbHtml(view, 'performance-card-thumb')}</div>
      <div class="performance-card-body">
        <h3>${esc(r.name)}</h3>
        <div class="card-status-row"><span class="card-status-badge ${band.tone}">${band.label}</span><span class="card-status-badge neutral">${r.copies}× au deck</span></div>
        <div class="opening-hero"><b>${r.openingPct}<span>%</span></b><small>de tes ${totalGames} parties commencent avec cette carte en main (${r.gamesWithOpening}/${totalGames})</small></div>
        <div class="tiny-meter card-ink-meter" title="${r.openingPct}% de tes mains de départ"><i style="width:${r.openingPct}%"></i></div>
      </div>
    </article>`;
  }

  function renderOpeningConsistency(analytics){
    const host = els.performanceOpeningConsistency;
    if(!host) return;
    const panel = host.closest('.stat-panel');
    const totalGames = arrayify(analytics?.games).length;
    const sel = selectedFilterValues('performanceDeckFilter');
    // Réservé à UNE version de deck précise : on connaît alors exactement la liste et
    // le nombre de copies. Sinon (bicolorité multi-versions / pas de deck) → masqué.
    if(sel.length !== 1 || totalGames < 3){
      if(panel) panel.hidden = true;
      host.innerHTML = '';
      return;
    }
    if(panel) panel.hidden = false;
    const copiesMap = selectedDeckCopiesByKey();
    if(!copiesMap){
      host.innerHTML = '<div class="empty-line">Chargement de la decklist…</div>';
      ensureDeckDecklistCached(String(sel[0]).split('|')[0]);
      return;
    }
    const rows = arrayify(analytics.cards).map(card => {
      const samples = arrayify(card.samples);
      const gamesWithOpening = samples.filter(s => n(s.opening) > 0).length;
      const openingPct = Math.round((gamesWithOpening / totalGames) * 100);
      const copies = n(copiesMap.get(card.key));
      return { card, key: card.key, name: fullName(performanceCardView(card)) || card.name || 'Carte', openingPct, copies, gamesWithOpening };
    }).filter(r => r.copies > 0)
      .sort((a, b) => b.openingPct - a.openingPct || b.copies - a.copies)
      .slice(0, 12);
    if(!rows.length){ host.innerHTML = '<div class="empty-line">Pas encore assez de données pour ce deck.</div>'; return; }
    const tiles = rows.map((r, i) => openingCardTileHtml(r, i + 1, totalGames)).join('');
    host.innerHTML = `<p class="deck-depth-note oc-intro">À retenir : tes cartes que tu as <b>le plus souvent en main au début de la partie</b> (mulligans compris). Plus tu joues d’exemplaires d’une carte, plus tu la vois tôt — pratique pour vérifier que tes ouvreurs (encrage, petites créatures, cartes clés) arrivent quand il faut.</p>
      <div class="performance-card-gallery key-card-gallery opening-card-gallery">${tiles}</div>`;
  }

  // Série en cours : enchaînement de victoires (ou défaites) le plus récent,
  // sur l'échantillon filtré, dans l'ordre chronologique. Élément ludique.
  function renderPerformanceStreak(games){
    const card = els.performanceStreakCard, val = els.performanceStreak, help = els.performanceStreakHelp;
    if(!val) return;
    const ordered = arrayify(games)
      .filter(g => g && typeof g.isWin === 'boolean')
      .sort((a, b) => new Date(a.playedAt || 0) - new Date(b.playedAt || 0));
    if(card) card.classList.remove('streak-hot', 'streak-cold', 'streak-win', 'streak-loss');
    if(!ordered.length){
      val.textContent = '—';
      if(help) help.textContent = 'Enchaînez les victoires pour lancer une série.';
      return;
    }
    let bestWin = 0, run = 0;
    ordered.forEach(g => { if(g.isWin){ run += 1; bestWin = Math.max(bestWin, run); } else run = 0; });
    let current = 0; const lastWin = ordered[ordered.length - 1].isWin;
    for(let i = ordered.length - 1; i >= 0; i--){ if(ordered[i].isWin === lastWin) current += 1; else break; }
    if(lastWin){
      val.innerHTML = `${current} <small class="streak-unit">${current > 1 ? 'victoires' : 'victoire'} d’affilée</small>`;
      if(card){ card.classList.add('streak-win'); if(current >= 3) card.classList.add('streak-hot'); }
    }else{
      val.innerHTML = `${current} <small class="streak-unit">${current > 1 ? 'défaites' : 'défaite'} d’affilée</small>`;
      if(card){ card.classList.add('streak-loss'); if(current >= 3) card.classList.add('streak-cold'); }
    }
    if(help) help.textContent = bestWin ? `Record : ${bestWin} victoire${bestWin > 1 ? 's' : ''} d’affilée.` : 'Enchaînez les victoires pour lancer une série.';
  }

  function renderDeckDepthGlobal(games){
    const host = els.performanceDeckDepth;
    if(!host) return;
    // Exact (logs) si dispo, sinon repli sur l'estimation (main + pioches naturelles).
    let exactCount = 0;
    const pairs = arrayify(games).map(g => {
      const exact = n(g.cardsSeen) > 0;
      if(exact) exactCount += 1;
      const seen = exact ? n(g.cardsSeen) : deckDepthCardsSeen(g.turnCount ?? g.turn_count, g.otp === true);
      return { seen, turns: Math.max(1, n(g.turnCount ?? g.turn_count)) };
    }).filter(p => p.seen > 0);
    if(!pairs.length){ host.innerHTML = '<div class="empty-line">Pas encore de données sur l’échantillon filtré.</div>'; return; }
    const avgSeen = pairs.reduce((s, p) => s + p.seen, 0) / pairs.length;
    const avgTurns = pairs.reduce((s, p) => s + p.turns, 0) / pairs.length;
    const note = exactCount === pairs.length
      ? `Moyenne mesurée sur ${pairs.length} partie(s) — toutes tes pioches et effets compris.`
      : `Moyenne sur ${pairs.length} partie(s) : ${exactCount} mesurée(s) précisément, le reste estimé. Réimporter ces parties affine le calcul.`;
    host.innerHTML = `${deckProfileHtml(avgSeen, avgTurns)}<p class="deck-depth-note">${esc(note)}</p>`;
  }

  function renderDeadWeight(m){
    if(!els.deadWeightTable) return;
    const panel = els.deadWeightTable.closest?.('.stat-panel');
    // La main adverse est une zone privée : afficher un bloc “non exploitable” ajoutait du bruit
    // sans donnée actionnable. On masque donc complètement ce module côté stats adverses.
    if(state.scope === 'opponent'){
      if(panel) panel.hidden = true;
      els.deadWeightTable.innerHTML = '';
      return;
    }
    const rows = handRetentionForScope(m)
      .filter(row => n(row.maxHeldTurns) > 0 || n(row.averageHeldTurns) > 0)
      .sort((a,b) => n(b.maxHeldTurns) - n(a.maxHeldTurns) || n(b.averageHeldTurns) - n(a.averageHeldTurns));
    // Si le replay API ne permet pas encore de reconstruire une main fiable, on masque le module.
    // Mieux vaut ne rien afficher qu’annoncer à tort qu’aucune carte n’est restée longtemps en main.
    if(!rows.length){
      if(panel) panel.hidden = true;
      els.deadWeightTable.innerHTML = '';
      return;
    }
    if(panel) panel.hidden = false;
    if(els.deadWeightTitle) setPanelInfo(els.deadWeightTitle, 'Cartes restées en main', 'Repère les cartes qui ont occupé votre main longtemps avant d’être jouées, encrées ou conservées jusqu’à la fin. Le signal est calculé depuis la main visible du joueur analysé.');
    if(els.deadWeightHelp) els.deadWeightHelp.textContent = 'Cartes gardées longtemps.';
    const items = rows.map(row => deadWeightListItem(row));
    renderStatCardList('deadWeight', els.deadWeightTable, items, {
      hideWhenEmpty:true,
      empty:'',
      collapsedLabel:'Voir toutes les cartes',
      expandedLabel:'Réduire la liste'
    });
    bindStatListToggles();
    bindCardButtons();
  }

  function deadWeightListItem(row){
    const card = hydrateCard(row.card || { fullName:row.cardName, id:row.cardKey, cost:row.cost, inkable:row.inkable });
    const rep = row.representative || {};
    const turns = n(row.maxHeldTurns);
    const exit = dominantHandExit(row.exits || {});
    const metaBits = [];
    const inkable = row.inkable ?? cardIsInkable(card);
    if(inkable === false) metaBits.push('Non-encrable');
    else if(inkable === true) metaBits.push('Encrable');
    if(row.cost !== null && row.cost !== undefined) metaBits.push(`coût ${row.cost}`);
    if(n(row.episodes) > 1) metaBits.push(`${n(row.episodes)} fois vue en main`);
    const range = rep.entryTurn ? `Gardée T${n(rep.entryTurn)} → ${rep.stillInHand ? 'fin' : `T${n(rep.exitTurn)}`}` : 'Passage en main suivi';
    const duration = turns ? `${turns} tour${turns > 1 ? 's' : ''} en main` : '';
    const exitChip = exit === 'unknown' ? '' : handExitLabel(exit);
    return {
      card,
      title:row.cardName || fullName(card),
      meta:metaBits.filter(Boolean).join(' · ') || 'Carte suivie en main',
      chips:[range, duration, exitChip].filter(Boolean)
    };
  }

  function dominantHandExit(exits={}){
    const entries = Object.entries(exits || {}).map(([key,value]) => ({ key, value:n(value) })).filter(row => row.value > 0);
    if(!entries.length) return 'unknown';
    return entries.sort((a,b)=>b.value-a.value)[0].key;
  }

  function handExitLabel(reason){
    const labels = {
      played:'Jouée ensuite',
      inked:'Encrée ensuite',
      discarded:'Défaussée ensuite',
      deck:'Remise dans le deck',
      effect:'Sortie par effet',
      stillInHand:'Gardée jusqu’à la fin',
      unknown:'Sortie inconnue'
    };
    return labels[reason] || labels.unknown;
  }

  function inkwellSourceChips(card){
    const chips = [];
    if(n(card.inkedFromHand)) chips.push({ label:`Depuis main ×${n(card.inkedFromHand)}`, className:'ink-source-chip ink-source-hand' });
    if(n(card.inkedFromDiscard)) chips.push({ label:`Défausse → encre ×${n(card.inkedFromDiscard)}`, className:'ink-source-chip ink-source-discard' });
    if(n(card.inkedFromBoard)) chips.push({ label:`Board → encre ×${n(card.inkedFromBoard)}`, className:'ink-source-chip ink-source-board' });
    if(n(card.inkedFromDeck)) chips.push({ label:`Deck → encre ×${n(card.inkedFromDeck)}`, className:'ink-source-chip ink-source-deck' });
    if(n(card.inkedFromUnknown)) chips.push({ label:`Carte cachée ×${n(card.inkedFromUnknown)}`, className:'ink-source-chip ink-source-unknown' });
    if(!chips.length) chips.push(`${n(card.inked)} encrée${n(card.inked) > 1 ? 's' : ''}`);
    return chips.slice(0, 3);
  }

  function renderStatTables(m){
    const metrics = state.scope === 'mine' ? (m?.proMetrics || {}) : (m?.opponentProMetrics || {});
    if(els.mostInkedHelp) els.mostInkedHelp.textContent = 'Main / effet distingués.';
    const cards = cardsForScope(m, state.scope);
    const topQuesters = loreEngineCards(cards).sort(compareLoreEngines)
      .map(c => ({
        card:c,
        meta:[typeLabel(c.type), c.cost !== null && c.cost !== undefined ? `Coût ${c.cost}` : '', inkLabel(c.colors?.[0])].filter(Boolean).join(' · '),
        chips:[`${n(c.lore)} lore`, loreActivityChip(c), `${n(c.played)} jouée${n(c.played) > 1 ? 's' : ''}`]
      }));

    const knownInkedTotal = cards.filter(c => n(c.inked) > 0).reduce((acc,c) => acc + n(c.inked), 0);
    const totalInkwellAdds = metrics?.inkByTurn?.reduce((acc,row) => acc + n(row.inked), 0) || knownInkedTotal;
    const unidentifiedInked = Math.max(0, totalInkwellAdds - knownInkedTotal);
    const mostInked = sortCards(cards.filter(c=>c.inked), els.mostInkedSort?.value || 'count_desc', 'inked')
      .map(c => ({
        card:c,
        meta:[typeLabel(c.type), c.cost !== null && c.cost !== undefined ? `Coût ${c.cost}` : '', inkLabel(c.colors?.[0])].filter(Boolean).join(' · '),
        chips:inkwellSourceChips(c)
      }));
    if(unidentifiedInked > 0){
      mostInked.push({
        title:'Ajouts à l’encrier non identifiés',
        meta:'Cartes cachées ou effets sans identité exploitable dans le replay',
        chips:[`${unidentifiedInked} ajout${unidentifiedInked > 1 ? 's' : ''} non identifié${unidentifiedInked > 1 ? 's' : ''}`]
      });
    }

    const challenges = sortCards(cards.filter(c=>c.challenge), els.challengeSort?.value || 'wins_desc', 'challenge')
      .map(c => ({
        card:c,
        meta:[typeLabel(c.type), c.cost !== null && c.cost !== undefined ? `Coût ${c.cost}` : '', inkLabel(c.colors?.[0])].filter(Boolean).join(' · '),
        chips:[`${n(c.challenge)} défi${n(c.challenge) > 1 ? 's' : ''}`, `${n(c.lore)} lore`, 'Bilan à vérifier']
      }));

    renderStatCardList('topQuesters', els.topQuestersTable, topQuesters, {
      empty:'Aucun moteur de lore détecté.',
      collapsedLabel:'Voir toutes les cartes',
      expandedLabel:'Réduire la liste'
    });
    renderStatCardList('mostInked', els.mostInkedTable, mostInked, {
      empty:'Aucune carte encrée détectée.',
      collapsedLabel:'Voir toutes les cartes',
      expandedLabel:'Réduire la liste'
    });
    renderPlayedSequenceTable(m);
    renderStatCardList('challenges', els.challengeTable, challenges, {
      empty:'Aucun défi détecté.',
      collapsedLabel:'Voir tous les défis',
      expandedLabel:'Réduire la liste'
    });
    bindStatListToggles();
    bindCardButtons();
  }

  function renderPlayedSequenceTable(m){
    if(!els.playTimingTable) return;
    const owner = state.scope === 'opponent' ? 'opponent' : 'mine';
    const global = isGlobalView();
    const rows = (m.timeline || [])
      .filter(r => r.owner === owner && r.type === 'play')
      .map((r, index) => {
        const cardCandidate = r.card || (r.cardName || r.title ? { fullName:r.cardName || r.title, cardName:r.cardName || r.title } : null);
        const card = cardCandidate ? hydrateCard(cardCandidate) : null;
        const hasUsableCard = card && cleanCardName(fullName(card)) !== 'Carte inconnue';
        const cardMeta = hasUsableCard ? [typeLabel(card.type), card.cost !== null && card.cost !== undefined ? `Coût ${card.cost}` : '', inkLabel(card.colors?.[0])].filter(Boolean).join(' · ') : 'Carte détectée dans le journal';
        return {
          card:hasUsableCard ? card : null,
          title:hasUsableCard ? fullName(card) : cleanCardName(r.cardName || r.title),
          meta:global ? `Game ${r.gameNumber || (n(r.gameIndex)+1) || '?'} · Tour ${r.turn} · ${cardMeta}` : `Tour ${r.turn} · ${cardMeta}`,
          chips:[`#${index + 1}`, global ? `Game ${r.gameNumber || (n(r.gameIndex)+1) || '?'}` : `Tour ${r.turn}`, hasUsableCard ? typeLabel(card.type) : actionTypeLabel(r.type)]
        };
      });
    renderStatCardList('playedSequence', els.playTimingTable, rows, {
      empty:'Aucune carte jouée détectée dans ce scope.',
      collapsedLabel:'Voir toute la chronologie',
      expandedLabel:'Réduire la chronologie',
      ordered:true
    });
  }

  function statListKey(id){
    return `${String(state.viewMode)}:${state.scope}:${id}`;
  }

  function renderStatCardList(id, container, items, options={}){
    if(!container) return;
    const rows = Array.isArray(items) ? items : [];
    const panel = container.closest?.('.stat-panel');
    if(!rows.length){
      if(options.hideWhenEmpty !== false && panel) panel.hidden = true;
      container.innerHTML = `<div class="empty-line">${esc(options.empty || 'Aucune donnée détectée.')}</div>`;
      return;
    }
    if(panel) panel.hidden = false;
    const key = statListKey(id);
    const expanded = !!state.statExpandedLists?.[key];
    const limit = Number.isFinite(options.limit) ? options.limit : 3;
    const visible = expanded ? rows : rows.slice(0, limit);
    const total = rows.length;
    const listHtml = `<div class="match-card-list-v81 ${options.ordered ? 'is-sequence' : ''}">${visible.map((item, index) => statCardTileHtml(item, index, options)).join('')}</div>`;
    const collapsedLabel = statListToggleLabel(options.collapsedLabel || 'Voir toute la liste', total);
    const toggleHtml = total > limit ? `<button type="button" class="stat-list-toggle v81-toggle" data-stat-list-toggle="${escAttr(key)}" aria-expanded="${expanded ? 'true' : 'false'}"><span>${expanded ? esc(options.expandedLabel || 'Réduire la liste') : esc(collapsedLabel)}</span></button>` : '';
    container.innerHTML = `${listHtml}${toggleHtml}`;
  }



  function statListToggleLabel(label, total){
    const raw = String(label || '').trim();
    const lower = raw.toLowerCase();
    if(lower.includes('carte')) return `Voir les ${n(total)} cartes`;
    if(lower.includes('défi') || lower.includes('defi')) return `Voir les ${n(total)} défis`;
    if(lower.includes('chronologie')) return `Voir toute la chronologie`;
    if(lower.includes('liste')) return `Voir les ${n(total)} éléments`;
    return raw;
  }

  function statCardTileHtml(item, index, options={}){
    const card = item.card || null;
    const key = card ? cardKey(card) : '';
    const title = item.title || (card ? fullName(card) : 'Carte inconnue');
    const meta = item.meta || (card ? [typeLabel(card.type), card.cost !== null && card.cost !== undefined ? `Coût ${card.cost}` : '', inkLabel(card.colors?.[0])].filter(Boolean).join(' · ') : '—');
    const chips = arrayify(item.chips).filter(Boolean).slice(0, 3);
    const thumb = card ? cardThumbHtml(card, 'match-card-thumb-v81') : `<span class="match-card-thumb-v81 thumb-placeholder">${esc(title.slice(0,2).toUpperCase())}</span>`;
    const rankLabel = options.ordered ? `#${index + 1}` : String(index + 1).padStart(2,'0');
    const chipHtml = chips.map(chip => {
      if(chip && typeof chip === 'object') return `<span class="${escAttr(chip.className || '')}">${esc(chip.label || '')}</span>`;
      return `<span>${esc(chip)}</span>`;
    }).join('');
    const body = `<span class="match-card-rank-v81">${esc(rankLabel)}</span><div class="match-card-art-v81">${thumb}</div><div class="match-card-body-v81"><h3>${esc(title)}</h3><p>${esc(meta || '—')}</p><div class="match-card-chips-v81">${chipHtml}</div></div>`;
    if(key) return `<button type="button" class="match-card-row-v81" data-card-key="${esc(key)}">${body}</button>`;
    return `<article class="match-card-row-v81 is-static">${body}</article>`;
  }

  function bindStatListToggles(){
    document.querySelectorAll('[data-stat-list-toggle]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.statListToggle;
        state.statExpandedLists[key] = !state.statExpandedLists[key];
        renderStats();
      };
    });
  }

  function numericCardMetric(card, mode, fallback=''){
    const key = String(mode || fallback || '').replace(/_desc$/,'');
    if(key === 'lore') return n(card.lore);
    if(key === 'inked' || fallback === 'inked') return n(card.inked);
    if(key === 'quest' || fallback === 'quest') return n(card.quest);
    if(key === 'played' || fallback === 'played') return n(card.played);
    if(key === 'challenge' || fallback === 'challenge') return n(card.challenge);
    if(key === 'wins' && fallback === 'challenge') return n(card.challenge);
    if(key === 'count'){
      if(fallback === 'inked') return n(card.inked);
      if(fallback === 'quest') return n(card.quest);
      if(fallback === 'challenge') return n(card.challenge);
      if(fallback && card[fallback] !== undefined) return n(card[fallback]);
      return n(card.seen) + n(card.played) + n(card.inked) + n(card.quest) + n(card.challenge);
    }
    if(fallback && card[fallback] !== undefined) return n(card[fallback]);
    return 0;
  }

  function compareCardNames(a,b){ return fullName(a).localeCompare(fullName(b), undefined, { sensitivity:'base' }); }

  function sortCards(cards, mode, fallback){
    return [...cards].sort((a,b)=>{
      if(mode === 'name_asc') return compareCardNames(a,b);
      if(mode === 'type_asc') return typeLabel(a.type).localeCompare(typeLabel(b.type), undefined, { sensitivity:'base' }) || compareCardNames(a,b);
      if(mode === 'turn_asc') return (n(a.avgTurn) || 99) - (n(b.avgTurn) || 99) || compareCardNames(a,b);
      if(mode === 'turn_desc') return (n(b.avgTurn) || 0) - (n(a.avgTurn) || 0) || compareCardNames(a,b);
      const primary = numericCardMetric(b, mode, fallback) - numericCardMetric(a, mode, fallback);
      if(primary) return primary;
      // Stable, readable tie-breakers: the chosen metric first, then useful volume signals.
      const volume = (n(b.seen)-n(a.seen)) || (n(b.played)-n(a.played)) || (n(b.quest)-n(a.quest)) || (n(b.inked)-n(a.inked));
      return volume || compareCardNames(a,b);
    });
  }

  function renderTable(container, rows, headers, map){
    if(!rows.length){ container.innerHTML='<div class="empty-line">Aucune donnée détectée.</div>'; return; }
    const desktop = `<table class="data-table desktop-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${map(r).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const mobile = `<div class="mobile-row">${rows.map(r=>{
      const values = map(r);
      const first = values[0] || '—';
      const rest = values.slice(1).map((v,i)=>`<div><dt>${esc(headers[i+1] || '')}</dt><dd>${v}</dd></div>`).join('');
      return `<div class="mobile-stat-card"><div class="mobile-stat-main">${first}</div><dl>${rest}</dl></div>`;
    }).join('')}</div>`;
    container.innerHTML = desktop + mobile;
  }

  function cardButton(c){ return `<button type="button" class="card-link" data-card-key="${esc(cardKey(c))}">${cardThumbHtml(c, 'thumb')}<span>${esc(fullName(c))}</span></button>`; }

  function renderCards(){
    const m = getWorkingData();
    if(!m){
      els.cardsSubtitle.textContent='Importez un replay pour afficher les cartes détectées.';
      els.cardsGrid.innerHTML='<div class="empty-line">Aucune carte détectée pour le moment.</div>';
      return;
    }
    const global = isGlobalView();
    const isOpponent = state.cardFilter === 'opponent';
    const estimate = m.opponentDeckEstimate || finalizeOpponentDeckEstimate(new Map());
    const estimateByKey = new Map((estimate.cards || []).map(row => [row.cardKey || row.key, row]));
    let cards = state.cardFilter === 'all' ? m.cards : cardsForScope(m, state.cardFilter);
    cards = cards.sort((a,b)=>{
      if(isOpponent){
        const ea = estimateByKey.get(statCardKey(a) || cardKey(a));
        const eb = estimateByKey.get(statCardKey(b) || cardKey(b));
        return (n(eb?.estimatedCopies) - n(ea?.estimatedCopies)) || (n(b.seen) - n(a.seen)) || fullName(a).localeCompare(fullName(b));
      }
      return (b.seen||0)-(a.seen||0) || fullName(a).localeCompare(fullName(b));
    }).slice(0,160);
    const scopeLabel = isOpponent ? 'adverse(s)' : state.cardFilter === 'mine' ? 'de votre deck' : 'détectée(s)';
    if(isOpponent && estimate.cards?.length){
      els.cardsSubtitle.textContent = `${cards.length} carte(s) adverse(s) vue(s) · ${n(estimate.totalConfirmedCards)} copie(s) confirmée(s) minimum.`;
    }else{
      els.cardsSubtitle.textContent = global ? `${cards.length} carte(s) ${scopeLabel} sur l’ensemble du BO3.` : `${cards.length} carte(s) détectée(s).`;
    }
    const exportPanel = isOpponent && estimate.cards?.length ? `
      <div class="opponent-deck-export">
        <div>
          <strong>Decklist adverse partielle</strong>
          <span>${esc(n(estimate.totalConfirmedCards))} carte(s) confirmée(s) minimum · basée sur les exemplaires visibles.</span>
        </div>
        <button type="button" class="ghost-button opponent-export-button" data-export-opponent-deck>Copier la decklist partielle</button>
      </div>` : '';
    const cardHtml = cards.map(c => {
      const key = statCardKey(c) || cardKey(c);
      const estimateRow = isOpponent ? estimateByKey.get(key) : null;
      const mainMeta = [rarityLabel(c.rarity), shortSetLabel(c), `#${c.number || '—'}`].filter(Boolean).join(' · ');
      const estimatedChip = estimateRow ? `<span class="meta-chip meta-chip-estimate">Estimé ${esc(estimateRow.estimatedCopies)}${estimateRow.fallbackOnly ? '+' : ''}</span>` : '';
      const zoneChip = estimateRow?.seenZones?.length ? `<span class="meta-chip">Vu ${esc(formatSeenZones(estimateRow.seenZones).slice(0, 24))}</span>` : '';
      return `<button type="button" class="card-mini card-mini-v81" data-card-key="${esc(cardKey(c))}">${cardThumbHtml(c, 'card-mini-thumb')}<div class="card-mini-copy"><h3>${esc(fullName(c))}</h3><p>${esc(mainMeta)}</p><div class="mini-meta">${estimatedChip}<span class="meta-chip">Vue ${n(c.seen)}</span><span class="meta-chip">Jouée ${n(c.played)}</span><span class="meta-chip">Encrée ${n(c.inked)}</span>${zoneChip}</div></div></button>`;
    }).join('');
    els.cardsGrid.innerHTML = exportPanel + cardHtml;
    bindCardButtons();
    renderInkwellTimeline(m);
  }

  // Encrier tour par tour : toutes les cartes que LE JOUEUR a mises en encre,
  // groupées par tour, à la manière de l'écran « Votre encrier » de Duels.ink.
  function renderInkwellTimeline(m){
    const host = els.inkwellTimeline, panel = els.inkwellPanel;
    if(!host) return;
    // En BO3 global on parcourt chaque game ; sinon la partie courante.
    const sessions = isGlobalView() && arrayify(m?.sessions).length ? m.sessions : [m];
    const blocks = [];
    let grandTotal = 0;
    sessions.forEach((s, gi) => {
      const inkEvents = arrayify(s?.timeline).filter(t => t.type === 'ink' && t.owner === 'mine');
      if(!inkEvents.length) return;
      const byTurn = new Map();
      inkEvents.forEach(ev => {
        const turn = Math.max(1, n(ev.turn));
        if(!byTurn.has(turn)) byTurn.set(turn, []);
        byTurn.get(turn).push(ev);
      });
      grandTotal += inkEvents.length;
      const turns = [...byTurn.keys()].sort((a, b) => a - b);
      const cols = turns.map(turn => {
        const cards = byTurn.get(turn).map(ev => {
          const c = ev.card || { name: ev.cardName };
          return `<div class="inkwell-card" title="${escAttr(fullName(c) || ev.cardName || 'Carte')}">${cardThumbHtml(c, 'inkwell-card-thumb')}</div>`;
        }).join('');
        return `<div class="inkwell-turn"><div class="inkwell-turn-head"><span>Tour ${turn}</span><b>${byTurn.get(turn).length}</b></div><div class="inkwell-turn-cards">${cards}</div></div>`;
      }).join('');
      const gameTitle = sessions.length > 1 ? `<h4 class="inkwell-game-title">Game ${n(s.gameNumber || gi + 1)} · ${inkEvents.length} encrée(s)</h4>` : '';
      blocks.push(`${gameTitle}<div class="inkwell-track">${cols}</div>`);
    });
    if(!grandTotal){
      if(panel) panel.hidden = true;
      host.innerHTML = '';
      return;
    }
    if(panel) panel.hidden = false;
    if(els.inkwellSubtitle) els.inkwellSubtitle.textContent = `${grandTotal} carte(s) encrée(s) au total · faites défiler pour voir chaque tour.`;
    host.innerHTML = blocks.join('');
  }

  function formatSeenZones(zones){
    const labels = {
      field:'board', characters:'board', locations:'lieu', items:'objet', discard:'défausse', revealedCards:'révélée', play:'jouée', banished:'bannie', banish:'bannie', exile:'exilée', inkwell:'encre', ink:'encre', initial:'vue', visible:'vue', play:'jouée', quest:'quête', challenge:'défi', ability:'capacité', move:'déplacement'
    };
    return [...new Set((zones || []).map(z => labels[z] || z).filter(Boolean))].join(', ');
  }

  function normalizeTimelineRows(m){
    if(!m) return [];

    const normalizeOne = (a, index=0, fallbackGameIndex=null, fallbackGameNumber=null) => ({
      owner:a.owner || a.actor || 'mine',
      type:a.type || a.actionType || a.entryType || 'ability',
      turn:a.turn || a.turnNumber || a.globalTurn || 1,
      icon:a.icon || '•',
      title:a.title || cleanCardName(a.cardName || a.name || `Action ${index + 1}`),
      detail:a.detail || a.description || '',
      rawType:a.rawType || a.actionType || a.type || '',
      cardName:a.cardName || a.name || '',
      cardKey:a.cardKey || (a.card ? cardKey(a.card) : ''),
      card:a.card || null,
      handCount:a.handCount,
      gameIndex:a.gameIndex ?? fallbackGameIndex ?? '',
      gameNumber:a.gameNumber ?? fallbackGameNumber ?? ''
    });

    if(Array.isArray(m.timeline) && m.timeline.length) return m.timeline.map((a,i) => normalizeOne(a,i,a.gameIndex,a.gameNumber));

    if(Array.isArray(m.sessions) && m.sessions.length){
      const fromSessions = m.sessions.flatMap((session, sessionIndex) => {
        const gameNumber = n(session?.gameNumber || sessionIndex + 1);
        return arrayify(session?.timeline).map((row, rowIndex) => normalizeOne(row, rowIndex, sessionIndex, gameNumber));
      });
      if(fromSessions.length) return fromSessions;
    }

    const source = Array.isArray(m.actions) ? m.actions : [];
    return source.map((a, index) => normalizeOne(a, index, a.gameIndex, a.gameNumber));
  }

  function timelineRowsForCurrentView(){
    const m = getWorkingData();
    if(!m) return [];
    return normalizeTimelineRows(m);
  }

  function renderTimeline(){
    if(!els.timelineList) return;
    const section = document.getElementById('tab-timeline');
    const m = getWorkingData();
    if(!m){
      els.timelineList.innerHTML='<div class="empty-line">Le journal apparaîtra après import.</div>';
      return;
    }

    let filter = els.timelineFilter?.value || 'all';
    let rows = timelineRowsForCurrentView();
    let filtered = rows;
    if(filter === 'mine' || filter === 'opponent') filtered = rows.filter(r => r.owner === filter);
    else if(filter !== 'all') filtered = rows.filter(r => r.type === filter || (filter === 'challenge' && r.type === 'challenge'));

    // Sécurité UX : si un ancien filtre ne renvoie rien, on revient automatiquement au journal complet.
    if(!filtered.length && rows.length && filter !== 'all'){
      if(els.timelineFilter) els.timelineFilter.value = 'all';
      filter = 'all';
      filtered = rows;
    }

    const visibleRows = filtered.slice(0,260);
    const header = rows.length
      ? `<div class="timeline-count">${esc(visibleRows.length)} action(s) affichée(s)${rows.length > visibleRows.length ? ` sur ${esc(rows.length)}` : ''}</div>`
      : '';
    els.timelineList.innerHTML = visibleRows.length
      ? header + visibleRows.map((r,i) => timelineRowHtml(r,i)).join('')
      : '<div class="empty-line">Aucune action détectée dans ce journal. Si la séquence de jeu existe, ouvrez une Game spécifique puis revenez sur Journal.</div>';

    // Force l'affichage si le navigateur garde un état hidden/transition incohérent.
    if(section?.classList.contains('active')){
      section.hidden = false;
      section.style.display = 'block';
    }
    bindCardButtons();
  }

  function timelineRowHtml(r, index){
    const c = r.card ? hydrateCard(r.card) : null;
    const hasCard = c && cardKey(c) && (c.image || c.imageSmall || fullName(c) !== 'Carte inconnue');
    const thumb = hasCard ? cardThumbHtml(c, 'timeline-thumb') : `<span class="timeline-thumb thumb-placeholder">${esc(r.icon || '•')}</span>`;
    const cardKeyAttr = hasCard ? `data-card-key="${esc(cardKey(c))}"` : '';
    const ownerLabel = r.owner === 'mine' ? 'Moi' : 'Adversaire';
    const gameLabel = r.gameNumber || (Number.isFinite(n(r.gameIndex)) && n(r.gameIndex) >= 0 ? n(r.gameIndex) + 1 : '');
    const gameMeta = gameLabel ? `<span>Game ${esc(gameLabel)}</span>` : '';
    return `<article class="timeline-row story-row" data-turn="${esc(r.turn)}" data-owner="${esc(r.owner)}" style="--delay:${Math.min(index,18)}"><button type="button" class="timeline-art" ${cardKeyAttr} aria-label="${hasCard ? `Ouvrir la carte ${esc(fullName(c))}` : 'Action sans carte identifiée'}">${thumb}</button><div class="timeline-copy"><div class="timeline-line"><span class="timeline-turn">Tour ${esc(r.turn)}</span><h3>${esc(r.title)}</h3></div><p>${esc(r.detail)}</p><div class="timeline-meta">${gameMeta}<span>${ownerLabel}</span><span>${esc(actionTypeLabel(r.type))}</span></div></div><div class="timeline-impact"><span>${esc(r.icon)}</span></div></article>`;
  }




  function cleanCardName(value){
    return String(value || '').replace(/\s+/g, ' ').trim() || 'Carte inconnue';
  }
  function actionTypeLabel(type){
    return ({ ink:'Encre', play:'Carte jouée', quest:'Quête', challenge:'Défi', move:'Déplacement', ability:'Capacité', end:'Fin de tour' })[type] || type;
  }

  function bindCardButtons(){
    document.querySelectorAll('[data-card-key]').forEach(btn => btn.onclick = () => {
      const working = getWorkingData();
      const card = working?.cards.find(c => cardKey(c) === btn.dataset.cardKey) || state.merged?.cards.find(c => cardKey(c) === btn.dataset.cardKey);
      if(card) openCardModal(card, btn);
    });
  }

  function openCardModal(card, trigger){
    state.lastFocused = trigger || document.activeElement;
    const c = hydrateCard(card);
    els.modalBody.innerHTML = cardDetailHtml(c);
    els.cardModal.classList.add('active'); els.cardModal.setAttribute('aria-hidden','false');
    setTimeout(() => { els.cardModal.querySelector('.modal-card')?.focus(); }, 0);
  }
  function closeCardModal(){
    els.cardModal.classList.remove('active'); els.cardModal.setAttribute('aria-hidden','true'); els.modalBody.innerHTML='';
    if(state.lastFocused?.focus) state.lastFocused.focus();
  }

  function cardDetailHtml(c){
    const color = inkKey(c.colors?.[0] || c.color);
    const text = formatCardText(c.text || abilityText(c));
    const detailImage = c.image || c.imageSmall || duelinkImageUrl(c);
    const imageHtml = detailImage ? `<img src="${esc(detailImage)}" alt="${esc(fullName(c))}" loading="lazy">` : `<div class="card-art-placeholder"><strong>${esc(initials(fullName(c)))}</strong><span>${esc(fullName(c))}</span><small>Image indisponible</small></div>`;
    const universe = cardUniverse(c);
    const artists = cardArtists(c);
    return `<div class="card-detail"><div class="card-image">${imageHtml}</div><div class="card-detail-main"><section class="detail-panel"><div class="kicker">Carte</div><h2 class="detail-title"><span class="ink-dot ink-${color}"></span>${esc(fullName(c))}</h2><div class="chip-row"><span class="chip">${esc(setLabel(c) || 'Chapitre inconnu')}</span><span class="chip">${esc(rarityLabel(c.rarity) || 'Rareté —')}</span><span class="chip">#${esc(c.number || '—')}</span><span class="chip">${esc(inkLabel(c.colors?.[0]) || 'Encre —')}</span></div><div class="detail-grid" style="margin-top:1rem">${field('Type', typeLabel(c.type))}${field('Coût', c.cost ?? '—')}${field('Encrable', c.inkable === true ? 'Oui' : c.inkable === false ? 'Non' : '—')}${field('Rareté', rarityLabel(c.rarity) || '—')}${field('Force', c.strength ?? '—')}${field('Volonté', c.willpower ?? '—')}${field('Lore', c.lore ?? '—')}</div></section><section class="detail-panel detail-panel-info"><div class="kicker">Informations</div><div class="detail-grid">${field('Chapitre', setLabel(c) || '—')}${field('Univers', universe)}${field('Artiste(s)', artists)}</div></section>${text ? `<section class="detail-panel"><div class="kicker">Texte de carte</div><div class="card-text">${text}</div></section>` : ''}<section class="detail-panel"><div class="kicker">Classifications</div><div class="chip-row">${(c.classifications || []).length ? c.classifications.map(x=>`<span class="chip">${esc(x)}</span>`).join('') : '<span class="chip">—</span>'}</div></section></div></div>`;
  }
  function metadataFallbackCard(c){
    const keys = new Set(cardReferenceKeys(c));
    if(c?.id?.includes('-')){
      const [setNum, number] = String(c.id).split('-');
      const code = SET_NUM_TO_CODE[setNum] || setNum;
      keys.add(`${setNum}-${strip0(number)}`);
      keys.add(slug(`${code}-${strip0(number)}`));
      keys.add(slug(`${code} ${strip0(number)}`));
    }
    for(const key of keys){
      const local = state.index.get(key);
      if(local) return local;
    }
    return null;
  }
  function cardUniverse(c){
    const fallback = metadataFallbackCard(c);
    return c?.franchise || c?.story || c?.universe || c?.raw?.franchise || c?.raw?.story || c?.raw?.universe || fallback?.franchise || fallback?.story || fallback?.universe || fallback?.raw?.franchise || fallback?.raw?.story || fallback?.raw?.universe || '—';
  }
  function cardArtists(c){
    const fallback = metadataFallbackCard(c);
    const values = [c?.artists, c?.illustrators, c?.illustrator, c?.artist, c?.raw?.illustrators, c?.raw?.artists, c?.raw?.artist, fallback?.artists, fallback?.illustrators, fallback?.illustrator, fallback?.artist, fallback?.raw?.illustrators, fallback?.raw?.artists, fallback?.raw?.artist]
      .flatMap(v => arrayify(v));
    return values.length ? [...new Set(values)].join(' / ') : '—';
  }
  function field(label, value){ return `<div class="detail-field"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`; }
  function initials(name){ return String(name || '?').split(/\s+|-+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'; }
  function duelinkImageUrl(c){
    if(!c) return '';
    const code = c.setCode || c.setCodes?.[0] || '';
    const setNum = SET_CODE_TO_NUM[code] || SET_CODE_TO_NUM[normalizeSetCode(code)] || '';
    const number = strip0(c.number || c.numbers?.[0] || '');
    if(!/^\d+$/.test(String(setNum)) || !number) return '';
    return `https://cards.duels.ink/lorcana/en/thumbnail/${setNum}-${number}.webp`;
  }
  function cardThumbHtml(c, cls='thumb'){ const img = c.imageSmall || c.image || duelinkImageUrl(c); const label = fullName(c) || 'Carte Lorcana'; return img ? `<img class="${esc(cls)}" src="${esc(img)}" alt="${escAttr(label)}" loading="lazy">` : `<span class="${esc(cls)} thumb-placeholder" aria-label="Image indisponible pour ${escAttr(label)}">${esc(initials(label))}</span>`; }

  function cssThemeColors(){
    const styles = getComputedStyle(document.documentElement);
    const first = styles.getPropertyValue('--theme-color-1').trim() || getThemeColors(state.scope)[0];
    const second = styles.getPropertyValue('--theme-color-2').trim() || getThemeColors(state.scope)[1];
    return [first, second];
  }

  function chartColorsForScope(scope){
    return document.documentElement.dataset.themeScope === scope ? cssThemeColors() : getThemeColors(scope);
  }


  function chartHighlightPalette(kind='moment'){
    const styles = getComputedStyle(document.documentElement);
    const warn = styles.getPropertyValue('--warn').trim() || '#f6c54d';
    const bad = styles.getPropertyValue('--bad').trim() || '#fb7185';
    const good = styles.getPropertyValue('--good').trim() || '#34d399';
    const accent = styles.getPropertyValue('--theme-color-2').trim() || warn;
    if(kind === 'refill') return good;
    if(kind === 'overtake') return accent;
    if(kind === 'board') return bad;
    return warn;
  }

  function makeHighlightMessages(length, highlights){
    const messages = Array.from({ length }, () => '');
    (highlights || []).forEach(h => {
      if(Number.isInteger(h.index) && h.index >= 0 && h.index < length){
        const message = h.message || h.summary || '';
        messages[h.index] = messages[h.index] ? `${messages[h.index]} · ${message}` : message;
      }
    });
    return messages;
  }

  function makeHighlightKinds(length, highlights){
    const kinds = Array.from({ length }, () => '');
    (highlights || []).forEach(h => {
      if(Number.isInteger(h.index) && h.index >= 0 && h.index < length){
        kinds[h.index] = h.kind || kinds[h.index] || 'moment';
      }
    });
    return kinds;
  }

  function stylePointHighlights(dataset, normalBg, normalBorder, kind='moment'){
    const messages = Array.isArray(dataset.highlightMessages) ? dataset.highlightMessages : [];
    const kinds = Array.isArray(dataset.highlightKinds) ? dataset.highlightKinds : [];
    const len = dataset.data?.length || messages.length || 0;
    // Sleep Cycle style: the line stays pure. Points appear only on interaction.
    dataset.pointRadius = Array.from({ length:len }, () => 0);
    dataset.pointHoverRadius = Array.from({ length:len }, () => 0);
    dataset.pointHitRadius = Array.from({ length:len }, () => 18);
    dataset.pointBackgroundColor = Array.from({ length:len }, (_, i) => messages[i] ? chartHighlightPalette(kinds[i] || kind) : normalBg);
    dataset.pointBorderColor = Array.from({ length:len }, () => normalBorder);
    dataset.pointBorderWidth = Array.from({ length:len }, () => 0);
    dataset._highlightKind = kind;
    dataset._normalPointBg = normalBg;
    dataset._normalPointBorder = normalBorder;
    return dataset;
  }

  function styleBarHighlights(dataset, normalBg, normalBorder, kind='float'){
    const messages = Array.isArray(dataset.highlightMessages) ? dataset.highlightMessages : [];
    const alert = chartHighlightPalette(kind);
    const len = dataset.data?.length || messages.length || 0;
    dataset.backgroundColor = Array.from({ length:len }, (_, i) => messages[i] ? hexToRgba(alert, .86) : normalBg);
    dataset.borderColor = 'transparent';
    dataset.borderWidth = 0;
    dataset.borderRadius = 0;
    dataset.maxBarThickness = 24;
    dataset._highlightKind = kind;
    dataset._normalBarBg = normalBg;
    dataset._normalBarBorder = normalBorder;
    return dataset;
  }

  function restyleDatasetHighlights(dataset){
    if(!dataset || !Array.isArray(dataset.highlightMessages) || !dataset.highlightMessages.some(Boolean)) return false;
    if(dataset._normalBarBg !== undefined){
      styleBarHighlights(dataset, dataset._normalBarBg, dataset._normalBarBorder || dataset._normalBarBg, dataset._highlightKind || 'float');
      return true;
    }
    stylePointHighlights(dataset, dataset._normalPointBg || dataset.borderColor || '#fff', dataset._normalPointBorder || dataset.borderColor || '#fff', dataset._highlightKind || 'moment');
    return true;
  }

  function detectLoreHighlights(rows){
    const out = { mine:[], opponent:[] };
    (rows || []).forEach((row, index) => {
      if(index <= 0) return;
      const prev = rows[index - 1] || {};
      ['mine','opponent'].forEach(owner => {
        const other = owner === 'mine' ? 'opponent' : 'mine';
        const previousMine = n(prev?.[owner]);
        const previousOther = n(prev?.[other]);
        const currentMine = n(row?.[owner]);
        const currentOther = n(row?.[other]);
        const delta = currentMine - previousMine;

        if(delta >= 5){
          const label = owner === 'mine' ? 'vous gagnez' : 'l’adversaire gagne';
          out[owner].push({
            kind:'sprint', owner, index, turn:n(row.turn), delta,
            message:` Accélération : ${label} +${delta} lore !`,
            summary:`Tour ${n(row.turn)} : accélération de lore ${owner === 'mine' ? 'pour vous' : 'adverse'} (+${delta} lore)`
          });
        }

        if(previousMine < previousOther && currentMine > currentOther){
          out[owner].push({
            kind:'overtake', owner, index, turn:n(row.turn), delta:currentMine - currentOther,
            message:' Overtake : reprise de l’avantage au score !',
            summary:`Tour ${n(row.turn)} : ${owner === 'mine' ? 'vous passez devant au score' : 'l’adversaire reprend l’avantage au score'}`
          });
        }
      });
    });
    return out;
  }

  function detectHandHighlights(rows, owner='mine'){
    return (rows || []).map((row, index) => {
      if(index <= 0) return null;
      const prev = rows[index - 1] || {};
      const delta = n(row?.handCount) - n(prev?.handCount);
      if(delta < 3) return null;
      return {
        kind:'refill', owner, index, turn:n(row.turn), delta,
        message:` Second Souffle : main rechargée de +${delta} cartes !`,
        summary:`Tour ${n(row.turn)} : second souffle ${owner === 'mine' ? 'pour vous' : 'côté adversaire'} (+${delta} cartes)`
      };
    }).filter(Boolean);
  }

  function detectBoardControlHighlights(rows){
    return (rows || []).map((row, index) => {
      const mineChallenges = n(row?.mineChallenge);
      const opponentChallenges = n(row?.opponentChallenge);
      const totalChallenges = n(row?.challenge);
      const bestOwner = mineChallenges >= opponentChallenges ? 'mine' : 'opponent';
      const bestValue = Math.max(mineChallenges, opponentChallenges, totalChallenges);
      if(bestValue < 3) return null;
      const owner = Math.max(mineChallenges, opponentChallenges) >= 3 ? bestOwner : 'both';
      const ownerLabel = owner === 'mine' ? 'vous' : owner === 'opponent' ? 'l’adversaire' : 'la table';
      return {
        kind:'board', owner, index, turn:n(row.turn), delta:bestValue,
        message:` Nettoyage de board : ${bestValue} défis ce tour !`,
        summary:`Tour ${n(row.turn)} : nettoyage de board par ${ownerLabel} (${bestValue} défis)`
      };
    }).filter(Boolean);
  }

  function actionContextForMoment(m, owner, turn, kind){
    const source = Array.isArray(m?.timeline) ? m.timeline : (Array.isArray(m?.actions) ? m.actions : []);
    const rows = source.filter(a => (owner === 'both' || a?.owner === owner) && n(a.turn) === n(turn));
    let candidates = [];
    if(kind === 'sprint' || kind === 'overtake') candidates = rows.filter(a => a.type === 'quest');
    else if(kind === 'refill') candidates = rows.filter(a => a.type === 'play' || a.type === 'ability');
    else if(kind === 'board') candidates = rows.filter(a => a.type === 'challenge');
    else candidates = rows.filter(a => a.type === 'play' || a.type === 'ability');
    const names = [...new Set(candidates.map(a => cleanCardName(a.cardName || a.title || '')).filter(name => name && name !== 'Carte inconnue' && !/^Résout un effet$/i.test(name)))];
    if(!names.length) return '';
    return ` · ${esc(names.slice(0, 2).join(' / '))}`;
  }

  function collectKeyMoments(m){
    if(!m || isGlobalView()) return [];

    // UX curation: the charts keep every highlight (sprint, refill, overtake, board),
    // but the hero recap only keeps rare, narrative moments.
    // No card names here: this block should be readable at a glance.
    const lore = detectLoreHighlights(m.loreSeries || []);
    const overtakes = [...(lore.mine || []), ...(lore.opponent || [])].filter(item => item.kind === 'overtake');
    const refills = [
      ...detectHandHighlights(m.proMetrics?.handByTurn || [], 'mine'),
      ...detectHandHighlights(m.opponentProMetrics?.handByTurn || [], 'opponent')
    ];

    return [...overtakes, ...refills]
      .sort((a,b) => n(a.turn) - n(b.turn) || ({ overtake:0, refill:1 }[a.kind] ?? 9) - ({ overtake:0, refill:1 }[b.kind] ?? 9))
      .slice(0, 5);
  }

  function keyMomentText(moment){
    const turn = `T${n(moment?.turn)}`;
    const owner = moment?.owner;
    if(moment?.kind === 'overtake'){
      return owner === 'mine'
        ? `${turn} · Vous reprenez l’avantage au score`
        : `${turn} · L’adversaire reprend l’avantage`;
    }
    if(moment?.kind === 'refill'){
      const delta = n(moment?.delta);
      return owner === 'mine'
        ? `${turn} · Main rechargée (+${delta} cartes)`
        : `${turn} · Main adverse rechargée (+${delta} cartes)`;
    }
    return `${turn} · Moment clé détecté`;
  }

  function renderKeyMoments(m){
    if(!els.keyMoments) return;
    const moments = collectKeyMoments(m);
    if(!moments.length){
      els.keyMoments.hidden = true;
      els.keyMoments.innerHTML = '';
      return;
    }
    els.keyMoments.hidden = false;
    els.keyMoments.innerHTML = `<div class="key-moments-title">Moments clés</div><div class="key-moment-list">${moments.map(moment => `<span class="key-moment key-moment-${escAttr(moment.kind)}">${esc(keyMomentText(moment))}</span>`).join('')}</div>`;
  }


  function normalizeChartDatasets(type, data){
    if(!data || !Array.isArray(data.datasets)) return data;
    data.datasets.forEach(dataset => {
      if(type === 'line'){
        const len = Array.isArray(dataset.data) ? dataset.data.length : 0;
        dataset.pointRadius = len ? Array.from({ length:len }, () => 0) : 0;
        dataset.radius = 0;
        dataset.pointHoverRadius = len ? Array.from({ length:len }, () => 0) : 0;
        dataset.hoverRadius = 0;
        dataset.pointHitRadius = len ? Array.from({ length:len }, () => 18) : 18;
        dataset.pointBorderWidth = len ? Array.from({ length:len }, () => 0) : 0;
        dataset.pointStyle = 'circle';
        dataset.spanGaps = dataset.spanGaps ?? true;
      }
      if(type === 'bar'){
        dataset.borderRadius = 0;
        dataset.borderSkipped = false;
        dataset.borderWidth = 0;
        dataset.maxBarThickness = dataset.maxBarThickness || 24;
        dataset.categoryPercentage = dataset.categoryPercentage || .68;
        dataset.barPercentage = dataset.barPercentage || .72;
      }
    });
    return data;
  }

  function chartColorAt(value, index){
    return Array.isArray(value) ? (value[index] || value.find(Boolean) || '#fff') : (value || '#fff');
  }

  function setChartReadoutDefault(canvasId, html){
    const canvas = $(canvasId);
    const card = canvas?.closest?.('.performance-chart-card, .chart-panel');
    const slot = card?.querySelector?.(`[data-chart-readout-for="${canvasId}"]`);
    if(!slot) return;
    slot.innerHTML = html || '';
    slot.dataset.defaultHtml = html || '';
    slot.classList.remove('visible');
  }

  function summarizeDefaultLoreReadout(rows){
    if(!Array.isArray(rows) || !rows.length){
      return '<span>Lecture rapide</span><strong>Replay en attente</strong><small>La course au lore apparaîtra après import.</small>';
    }
    const end = rows[rows.length - 1] || {};
    const mine = n(end.mine);
    const opp = n(end.opponent);
    const turn = n(end.turn);
    const myLate = lateLoreGain(rows, 'mine');
    const oppLate = lateLoreGain(rows, 'opponent');
    const lead = mine - opp;
    const stateLabel = mine >= 20 ? 'Lethal atteint' : opp >= 20 ? 'Lethal adverse' : lead >= 0 ? 'Avantage score' : 'Course à refaire';
    let detail = `${mine}–${opp} au T${turn}`;
    if(myLate > oppLate + 2) detail += ` · accélération finale +${myLate}`;
    else if(oppLate > myLate + 2) detail += ` · sprint adverse +${oppLate}`;
    else if(Math.abs(lead) <= 3) detail += ' · finish serré';
    return `<span>Lecture rapide</span><strong>${esc(stateLabel)}</strong><small>${esc(detail)}</small>`;
  }

  function summarizeDefaultActionReadout(rows){
    if(!Array.isArray(rows) || !rows.length){
      return '<span>Plan de jeu</span><strong>Aucune action détectée</strong><small>Les actions principales apparaîtront après import.</small>';
    }
    const totals = rows.reduce((acc, r) => {
      acc.ink += n(r.ink); acc.play += n(r.play); acc.quest += n(r.quest); acc.challenge += n(r.challenge);
      const total = n(r.ink) + n(r.play) + n(r.quest) + n(r.challenge);
      if(total > acc.peakTotal) acc.peak = { turn:n(r.turn), total };
      acc.peakTotal = Math.max(acc.peakTotal, total);
      return acc;
    }, { ink:0, play:0, quest:0, challenge:0, peak:null, peakTotal:0 });
    const mainAxis = [
      ['Tempo', totals.play],
      ['Lore', totals.quest],
      ['Board', totals.challenge],
      ['Encrage', totals.ink]
    ].sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Plan';
    const peak = totals.peak ? `pic T${totals.peak.turn} · ${totals.peak.total} action(s)` : 'rythme régulier';
    return `<span>Plan de jeu</span><strong>${esc(mainAxis)} dominant</strong><small>${esc(`${peak} · ${totals.play} jouées · ${totals.quest} quêtes · ${totals.challenge} défis`)}</small>`;
  }

  function summarizeDefaultInkReadout(rows){
    if(!Array.isArray(rows) || !rows.length){
      return '<span>Économie d’encre</span><strong>Replay en attente</strong><small>La conversion de l’encre apparaîtra après import.</small>';
    }
    const spent = rows.reduce((acc, r)=>acc+n(r.spent),0);
    const floating = rows.reduce((acc, r)=>acc+n(r.float),0);
    const avgFloat = rows.length ? round1(floating / rows.length) : 0;
    const label = avgFloat <= 1 ? 'Curve propre' : avgFloat <= 2.5 ? 'Tempo correct' : 'Fuite d’encre';
    return `<span>Économie d’encre</span><strong>${esc(label)}</strong><small>${esc(`${round1(spent)} dépensées · ${round1(floating)} flottées · ${avgFloat}/tour`)}</small>`;
  }

  function summarizeDefaultHandReadout(rows, comparisonRows=[]){
    if(!Array.isArray(rows) || !rows.length){
      return '<span>Cartes en main</span><strong>Replay en attente</strong><small>Donnée disponible après import.</small>';
    }
    const values = rows.map(r=>n(r.handCount));
    const minHand = Math.min(...values);
    const avgHand = round1(values.reduce((a,b)=>a+b,0) / Math.max(1, values.length));
    const emptyTurns = values.filter(v=>v <= 1).length;
    const label = emptyTurns >= 3 ? 'Mode top deck' : minHand <= 1 ? 'Main fragile' : 'Main stable';
    const advantage = handAdvantageSummary(rows, comparisonRows);
    const compact = advantage ? `${advantage} · moy. ${avgHand} · min. ${minHand}` : `moy. ${avgHand} · min. ${minHand} · ${emptyTurns} critique(s)`;
    return `<span>Réserve de main</span><strong>${esc(label)}</strong><small>${esc(compact)}</small>`;
  }

  function handAdvantageSummary(rows=[], comparisonRows=[]){
    if(!Array.isArray(rows) || !rows.length || !Array.isArray(comparisonRows) || !comparisonRows.length) return '';
    const mineMap = new Map(rows.map(r => [n(r.turn), n(r.handCount)]));
    const oppMap = new Map(comparisonRows.map(r => [n(r.turn), n(r.handCount)]));
    const sharedTurns = [...mineMap.keys()].filter(turn => oppMap.has(turn)).sort((a,b)=>a-b);
    if(!sharedTurns.length) return '';
    const best = sharedTurns.map(turn => ({ turn, diff:n(mineMap.get(turn))-n(oppMap.get(turn)) })).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))[0];
    if(!best || best.diff === 0) return 'Équilibre de main';
    const viewedOwner = state.scope === 'opponent' ? 'Adversaire' : 'Vous';
    const otherOwner = state.scope === 'opponent' ? 'vous' : 'adversaire';
    return best.diff > 0 ? `${viewedOwner} +${best.diff} carte(s) au T${best.turn}` : `${otherOwner} +${Math.abs(best.diff)} carte(s) au T${best.turn}`;
  }


  function isCharacterCardForBoard(card){
    const type = `${typeLabel(card?.type || card?.cardType || '')} ${card?.type || ''} ${card?.cardType || ''}`.toLowerCase();
    return type.includes('personnage') || type.includes('character');
  }

  function boardCardsForZone(z={}){
    return [
      ...arrayify(z.field),
      ...arrayify(z.characters),
      ...arrayify(z.locations)
    ].map(card => hydrateCard(card)).filter(Boolean);
  }

  function summarizeDefaultBoardReadout(rows=[], comparisonRows=[]){
    if(!Array.isArray(rows) || !rows.length){
      return '<span>Présence sur board</span><strong>Replay en attente</strong><small>Donnée disponible après import.</small>';
    }
    const comparisonMap = new Map((comparisonRows || []).map(row => [n(row.turn), row]));
    const last = rows[rows.length - 1] || {};
    const oppLast = comparisonMap.get(n(last.turn));
    const swing = oppLast ? n(last.characters) - n(oppLast.characters) : null;
    const swingText = swing === null ? `moy. ${round1(rows.reduce((acc,row)=>acc+n(row.characters),0) / Math.max(1, rows.length))} persos` : swing > 0 ? `+${swing} persos au T${n(last.turn)}` : swing < 0 ? `-${Math.abs(swing)} persos au T${n(last.turn)}` : `égalité au T${n(last.turn)}`;
    const peakPressure = [...rows].sort((a,b)=>n(b.lorePotential)-n(a.lorePotential) || n(b.characters)-n(a.characters))[0] || {};
    const pressureText = n(peakPressure.lorePotential) ? `Pression lore max : ${n(peakPressure.lorePotential)} au T${n(peakPressure.turn)}` : '';
    return `<span>Board en fin de tour</span><strong>${esc(swingText)}</strong><small>${esc(pressureText || 'Compare les personnages en jeu.')}</small>`;
  }

  function summarizeBoard(rows=[], comparisonRows=[]){
    if(!Array.isArray(rows) || !rows.length) return 'Aucune donnée de board disponible.';
    const maxPotential = Math.max(...rows.map(row => n(row.lorePotential)));
    const maxChars = Math.max(...rows.map(row => n(row.characters)));
    return `Présence sur board : pic à ${maxChars} personnage(s). Pression lore maximale du joueur affiché : ${maxPotential}.`;
  }

  function scopeChartPair(scope=state.scope){
    const base = getThemeColors(scope);
    return distinctChartPalette(base, 2);
  }

  function actionCategoryColors(scope=state.scope){
    const base = getThemeColors(scope);
    const used = [];
    const pick = (preferred, fallbackIndex=0) => {
      const value = ensureChartContrast(preferred, used, fallbackIndex);
      used.push(value);
      return value;
    };
    return {
      ink:pick(base[1] || INK_COLORS.amber, 1),
      play:pick(base[0] || INK_COLORS.sapphire, 0),
      quest:pick(INK_COLORS.emerald, 2),
      challenge:pick(INK_COLORS.ruby, 3)
    };
  }

  function applyDatasetColor(dataset, color, alpha=.9){
    if(!dataset || !color) return;
    dataset.backgroundColor = hexToRgba(color, alpha);
    dataset.borderColor = color;
    dataset._normalBarBg = hexToRgba(color, alpha);
    dataset._normalBarBorder = color;
  }

  function renderBoardChart(rows=[], comparisonRows=[]){
    setChartReadoutDefault('boardPresenceChart', summarizeDefaultBoardReadout(rows, comparisonRows));
    const rowMap = new Map((rows || []).map(r => [n(r.turn), r]));
    const comparisonMap = new Map((comparisonRows || []).map(r => [n(r.turn), r]));
    const turnValues = [...new Set([...rowMap.keys(), ...comparisonMap.keys()])].filter(Boolean).sort((a,b)=>a-b);
    const labels = turnValues.map(turn=>`T${turn}`);
    const activePair = scopeChartPair(state.scope);
    const viewedIsOpponent = state.scope === 'opponent';
    const viewedLabel = viewedIsOpponent ? 'Persos adverses' : 'Vos persos';
    const comparisonLabel = viewedIsOpponent ? 'Vos persos' : 'Persos adverses';
    const viewedColor = activePair[0] || cssThemeColors()[0];
    const comparisonColor = activePair[1] || cssThemeColors()[1];
    const datasets = [
      {
        label:viewedLabel,
        data:turnValues.map(turn => rowMap.has(turn) ? n(rowMap.get(turn).characters) : null),
        tension:.36,
        borderWidth:3,
        pointRadius:0,
        pointHoverRadius:5,
        borderColor:viewedColor,
        backgroundColor:hexToRgba(viewedColor, .12),
        pointBackgroundColor:viewedColor,
        pointBorderColor:viewedColor,
        fill:false
      }
    ];
    if(comparisonRows?.length){
      datasets.push({
        label:comparisonLabel,
        data:turnValues.map(turn => comparisonMap.has(turn) ? n(comparisonMap.get(turn).characters) : null),
        tension:.36,
        borderWidth:2.6,
        pointRadius:0,
        pointHoverRadius:5,
        borderColor:comparisonColor,
        backgroundColor:hexToRgba(comparisonColor, .10),
        pointBackgroundColor:comparisonColor,
        pointBorderColor:comparisonColor,
        fill:false
      });
    }
    charts.board = chart(charts.board, 'boardPresenceChart', 'line', { labels, datasets }, { scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } });
    updateChartDataTable('boardPresenceChart', labels, datasets, 'Données du graphique de présence sur board');
  }

  function renderLoreChart(rows){
    setChartReadoutDefault('loreChart', summarizeDefaultLoreReadout(rows));
    const labels = rows.map(r=>`T${r.turn}`);
    const pair = scopeChartPair(state.scope);
    const mineColor = pair[0] || cssThemeColors()[0];
    const opponentColor = pair[1] || cssThemeColors()[1];
    const highlights = detectLoreHighlights(rows);
    const mineDataset = { label:'Vous', data:rows.map(r=>r.mine), tension:.48, borderWidth:2.75, pointRadius:0, pointHoverRadius:5, borderColor:mineColor, backgroundColor:hexToRgba(mineColor, .13), pointBackgroundColor:mineColor, pointBorderColor:mineColor, highlightMessages:makeHighlightMessages(rows.length, highlights.mine), highlightKinds:makeHighlightKinds(rows.length, highlights.mine), fill:false };
    const opponentDataset = { label:'Adversaire', data:rows.map(r=>r.opponent), tension:.48, borderWidth:2.75, pointRadius:0, pointHoverRadius:5, borderColor:opponentColor, backgroundColor:hexToRgba(opponentColor, .11), pointBackgroundColor:opponentColor, pointBorderColor:opponentColor, highlightMessages:makeHighlightMessages(rows.length, highlights.opponent), highlightKinds:makeHighlightKinds(rows.length, highlights.opponent), fill:false };
    stylePointHighlights(mineDataset, mineColor, mineColor, 'sprint');
    stylePointHighlights(opponentDataset, opponentColor, opponentColor, 'sprint');
    const datasets = [
      mineDataset,
      opponentDataset,
      { label:'Ligne de victoire · 20 lore', data:rows.map(()=>20), borderColor:'rgba(255,255,255,.24)', borderDash:[5,6], borderWidth:1, pointRadius:0, pointHoverRadius:0, fill:false, tension:0, noGlow:true, tooltipSkip:true }
    ];
    charts.lore = chart(charts.lore, 'loreChart', 'line', { labels, datasets }, { scales:{ y:{ beginAtZero:true, suggestedMax:21 } } });
    updateChartDataTable('loreChart', labels, datasets, 'Données du graphique de course aux 20 lore');
  }
  function renderActionChart(rows){
    setChartReadoutDefault('actionChart', summarizeDefaultActionReadout(rows));
    const labels = rows.map(r=>`T${r.turn}`);
    const actionColors = actionCategoryColors(state.scope);
    const boardHighlights = detectBoardControlHighlights(rows);
    const challengeDataset = {
      label:'Défis',
      data:rows.map(r=>r.challenge),
      backgroundColor:hexToRgba(actionColors.challenge, .86),
      borderColor:actionColors.challenge,
      borderWidth:0,
      highlightMessages:makeHighlightMessages(rows.length, boardHighlights),
      maxBarThickness:16,
      borderRadius:0,
      categoryPercentage:.76,
      barPercentage:.74
    };
    styleBarHighlights(challengeDataset, hexToRgba(actionColors.challenge, .86), actionColors.challenge, 'board');
    const datasets = [
      { label:'Encrées', data:rows.map(r=>r.ink), backgroundColor:hexToRgba(actionColors.ink, .92), borderColor:actionColors.ink, maxBarThickness:16, borderWidth:0, borderRadius:0, categoryPercentage:.76, barPercentage:.74 },
      { label:'Jouées', data:rows.map(r=>r.play), backgroundColor:hexToRgba(actionColors.play, .92), borderColor:actionColors.play, maxBarThickness:16, borderWidth:0, borderRadius:0, categoryPercentage:.76, barPercentage:.74 },
      { label:'Quêtes', data:rows.map(r=>r.quest), backgroundColor:hexToRgba(actionColors.quest, .86), borderColor:actionColors.quest, maxBarThickness:16, borderWidth:0, borderRadius:0, categoryPercentage:.76, barPercentage:.74 },
      challengeDataset
    ];
    charts.action = chart(charts.action, 'actionChart', 'bar', { labels, datasets }, { scales:{ x:{ stacked:false }, y:{ stacked:false, beginAtZero:true, ticks:{ precision:0 } } } });
    updateChartDataTable('actionChart', labels, datasets, 'Données du graphique des actions par tour');
  }

  function renderInkChart(rows){
    setChartReadoutDefault('inkFloatChart', summarizeDefaultInkReadout(rows));
    const labels = rows.map(r=>`T${r.turn}`);
    const theme = getThemeColors(state.scope);
    const datasets = [
      { label:'Encre dépensée', data:rows.map(r=>r.spent), backgroundColor:theme[0], borderColor:theme[0], borderWidth:1, maxBarThickness:24, borderWidth:0, borderRadius:0 },
      { label:'Encre inutilisée', data:rows.map(r=>r.float), backgroundColor:theme[1], borderColor:theme[1], borderWidth:1, maxBarThickness:24, borderWidth:0, borderRadius:0 }
    ];
    charts.ink = chart(charts.ink, 'inkFloatChart', 'bar', { labels, datasets }, { scales:{ x:{ stacked:true }, y:{ stacked:true, beginAtZero:true, ticks:{ precision:0 } } } });
    updateChartDataTable('inkFloatChart', labels, datasets, 'Données du graphique d’économie d’encre');
  }
  function renderQuestChart(quest, challenge){
    const total = n(quest) + n(challenge);
    if(els.questChallengeCenter) els.questChallengeCenter.textContent = total ? `${pct(quest,total)}%` : '—';
    const theme = cssThemeColors();
    const labels = ['Quête','Défi'];
    const datasets = [{ data:[n(quest), n(challenge)], backgroundColor:[theme[0], theme[1]], borderColor:['rgba(255,255,255,.18)','rgba(255,255,255,.18)'], borderWidth:1, hoverOffset:8 }];
    charts.matrix = chart(charts.matrix, 'questChallengeChart', 'doughnut', { labels, datasets }, { cutout:'72%' });
    updateChartDataTable('questChallengeChart', labels, datasets, 'Données du graphique quête contre défi');
  }
  function renderHandChart(rows, comparisonRows=[]){
    setChartReadoutDefault('handCurveChart', summarizeDefaultHandReadout(rows, comparisonRows));
    const rowMap = new Map((rows || []).map(r => [n(r.turn), n(r.handCount)]));
    const comparisonMap = new Map((comparisonRows || []).map(r => [n(r.turn), n(r.handCount)]));
    const turnValues = [...new Set([...rowMap.keys(), ...comparisonMap.keys()])].filter(Boolean).sort((a,b)=>a-b);
    const labels = turnValues.map(turn=>`T${turn}`);
    const theme = cssThemeColors();
    const activePair = scopeChartPair(state.scope);
    const viewedIsOpponent = state.scope === 'opponent';
    const viewedColors = [activePair[0] || theme[0]];
    const comparisonColors = [activePair[1] || theme[1]];
    const viewedLabel = viewedIsOpponent ? 'Adversaire' : 'Vous';
    const comparisonLabel = viewedIsOpponent ? 'Vous' : 'Adversaire';
    const highlights = detectHandHighlights(rows, state.scope);
    const handDataset = {
      label:viewedLabel,
      data:turnValues.map(turn => rowMap.has(turn) ? rowMap.get(turn) : null),
      tension:.48,
      borderWidth:2.75,
      pointRadius:0,
      pointHoverRadius:5,
      borderColor:viewedColors[0] || theme[0],
      backgroundColor:viewedColors[0] || theme[0],
      pointBackgroundColor:viewedColors[0] || theme[0],
      pointBorderColor:viewedColors[0] || theme[0],
      highlightMessages:makeHighlightMessages(turnValues.length, remapHighlightsToTurns(highlights, turnValues)),
      fill:false
    };
    stylePointHighlights(handDataset, viewedColors[0] || theme[0], viewedColors[0] || theme[0], 'refill');
    const comparisonHighlights = detectHandHighlights(comparisonRows, viewedIsOpponent ? 'mine' : 'opponent');
    const comparisonDataset = {
      label:comparisonLabel,
      data:turnValues.map(turn => comparisonMap.has(turn) ? comparisonMap.get(turn) : null),
      tension:.48,
      borderWidth:2.25,
      pointRadius:0,
      pointHoverRadius:5,
      borderColor:comparisonColors[0] || theme[1],
      backgroundColor:comparisonColors[0] || theme[1],
      pointBackgroundColor:comparisonColors[0] || theme[1],
      pointBorderColor:comparisonColors[0] || theme[1],
      highlightMessages:makeHighlightMessages(turnValues.length, remapHighlightsToTurns(comparisonHighlights, turnValues)),
      fill:false
    };
    stylePointHighlights(comparisonDataset, comparisonColors[0] || theme[1], comparisonColors[0] || theme[1], 'refill');
    const datasets = [handDataset];
    if(comparisonRows?.length) datasets.push(comparisonDataset);
    charts.hand = chart(charts.hand, 'handCurveChart', 'line', { labels, datasets }, { scales:{ y:{ beginAtZero:true, suggestedMax:8, ticks:{ precision:0 } } } });
    updateChartDataTable('handCurveChart', labels, datasets, 'Données du graphique de cartes en main en fin de tour');
  }

  function remapHighlightsToTurns(highlights=[], turns=[]){
    const byTurn = new Map((highlights || []).map(item => [n(item.turn), item]));
    return (turns || []).map((turn, index) => {
      const item = byTurn.get(n(turn));
      return item ? { ...item, index } : null;
    }).filter(Boolean);
  }

  function chart(existing, id, type, data, options={}){
    if(existing) existing.destroy();
    const canvas = $(id); if(!canvas) return null;
    const mobileChart = window.matchMedia?.('(max-width:820px)')?.matches === true;
    const defaults = {
      responsive:true,
      maintainAspectRatio:false,
      layout:{ padding: mobileChart ? { top:12, right:8, bottom:8, left:4 } : { top:22, right:28, bottom:18, left:18 } },
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ position: mobileChart ? 'bottom' : 'top', labels:{ color:'#ececf0', usePointStyle:true, padding:mobileChart ? 10 : 18, font:{ size:mobileChart ? 11 : 12, weight:'700' } } },
        tooltip:{ enabled:false, external:externalTooltipHandler }
      },
      scales:{
        x:{ ticks:{ color: mobileChart ? 'rgba(255,255,255,.62)' : '#c9cad3', padding:8, font:{ size:mobileChart ? 11 : 12, weight:'700' } }, grid:{ display:false, color:'rgba(255,255,255,.065)' }, border:{ display:false } },
        y:{ ticks:{ color: mobileChart ? 'rgba(255,255,255,.62)' : '#c9cad3', padding:8, font:{ size:mobileChart ? 11 : 12, weight:'700' } }, grid:{ display:false, color:'rgba(255,255,255,.065)' }, border:{ display:false }, grace:'8%' }
      },
      elements:{
        line:{ borderCapStyle:'round', borderJoinStyle:'round' },
        point:{ radius:0, hoverRadius:mobileChart ? 5 : 6, hitRadius:16 },
        bar:{ borderRadius:0, borderSkipped:false }
      },
      datasets:{
        bar:{ maxBarThickness:mobileChart ? 26 : 38, categoryPercentage:.90, barPercentage:.86, borderWidth:0, borderRadius:0 }
      }
    };
    if(type === 'doughnut'){ delete defaults.scales; defaults.layout = { padding:{ top:10, right:10, bottom:10, left:10 } }; defaults.interaction = { mode:'nearest', intersect:true }; }
    normalizeChartDatasets(type, data);
    const neonLinePlugin = {
      id:'inkSightNeonLine',
      beforeDatasetDraw(chart, args){
        if(chart.config.type !== 'line') return;
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(args.index);
        const dataset = chart.data.datasets?.[args.index] || {};
        if(!meta?.dataset || dataset.noGlow || String(dataset.borderColor || '').includes('255,255,255')) return;
        const color = chartColorAt(dataset.borderColor, 0) || '#fff';
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      },
      afterDatasetDraw(chart){
        if(chart.config.type !== 'line') return;
        chart.ctx.restore();
      }
    };
    const activeAxisPlugin = {
      id:'inkSightActiveAxis',
      afterDraw(chart){
        if(chart.config.type !== 'line') return;
        const active = chart.tooltip?.getActiveElements?.() || [];
        if(!active.length) return;
        const index = active[0].index;
        const area = chart.chartArea;
        const xScale = chart.scales.x;
        if(!area || !xScale) return;
        const x = xScale.getPixelForValue(index);
        const ctx = chart.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,.16)';
        ctx.setLineDash([4,6]);
        ctx.stroke();
        ctx.setLineDash([]);
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          if(dataset.noGlow) return;
          const meta = chart.getDatasetMeta(datasetIndex);
          if(meta.hidden) return;
          const point = meta.data?.[index];
          if(!point) return;
          const y = point.y;
          const color = chartColorAt(dataset.borderColor || dataset.backgroundColor, index) || '#fff';
          ctx.beginPath();
          ctx.arc(x, y, mobileChart ? 3.2 : 3.8, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.lineWidth = 1.25;
          ctx.strokeStyle = 'rgba(255,255,255,.72)';
          ctx.stroke();
        });
        ctx.restore();
      }
    };
    return new Chart(canvas, { type, data, options:deepMerge(defaults, options), plugins:[neonLinePlugin, activeAxisPlugin] });
  }

  function externalTooltipHandler(context){
    const { chart, tooltip } = context;
    const canvasId = chart.canvas?.id || '';
    const card = chart.canvas.closest?.('.performance-chart-card, .chart-panel');
    const slot = card?.querySelector?.(`[data-chart-readout-for="${canvasId}"]`);
    const parent = chart.canvas.parentNode;
    let el = slot || parent.querySelector('.chart-tooltip');
    if(!el){
      el = document.createElement('div');
      el.className = 'chart-tooltip chart-readout';
      parent.insertBefore(el, chart.canvas);
    }
    if(slot && !slot.dataset.defaultHtml) slot.dataset.defaultHtml = slot.innerHTML;
    if(tooltip.opacity === 0){
      el.classList.remove('visible');
      if(slot) el.innerHTML = slot.dataset.defaultHtml || '';
      else el.innerHTML = '';
      return;
    }
    const title = tooltip.title?.[0] || '';
    const points = (tooltip.dataPoints || []).filter(item => {
      const dataset = item?.dataset || {};
      const label = String(dataset.label || '').toLowerCase();
      return !dataset.tooltipSkip && !dataset.noTooltip && !label.includes('objectif') && !label.includes('ligne de victoire');
    });
    const rows = points.map(item => {
      const bg = item?.dataset?.backgroundColor;
      const color = chartColorAt(item?.dataset?.borderColor, item?.dataIndex) || chartColorAt(bg, item?.dataIndex) || '#fff';
      const label = item?.dataset?.label || 'Valeur';
      const value = typeof item?.formattedValue === 'string' ? item.formattedValue : item?.raw;
      return `<div class="chart-tooltip-row"><span style="background:${escAttr(color)}"></span>${esc(label)}: ${esc(value ?? '—')}</div>`;
    }).join('') || '';
    const highlightRows = points.map(item => item?.dataset?.highlightMessages?.[item.dataIndex]).filter(Boolean).map(message => `<div class="chart-tooltip-row chart-tooltip-highlight"><span></span>${esc(message)}</div>`).join('');
    if(slot){
      const cleanTitle = title || 'Tour';
      el.innerHTML = `<span>${esc(cleanTitle)}</span><div class="chart-tooltip-grid">${rows}</div>${highlightRows ? `<small>${highlightRows.replace(/<[^>]*span[^>]*><\/span>/g,'')}</small>` : ''}`;
    }else{
      el.innerHTML = `<div class="chart-tooltip-title">${esc(title)}</div><div class="chart-tooltip-grid">${rows}</div>${highlightRows ? `<div class="chart-tooltip-notes">${highlightRows}</div>` : ''}`;
    }
    el.classList.add('visible');
  }

  function updateChartDataTable(canvasId, labels, datasets, caption){
    const canvas = $(canvasId); if(!canvas) return;
    const old = canvas.parentNode.querySelector(`table[data-chart-table="${canvasId}"]`);
    if(old) old.remove();
    const table = document.createElement('table');
    table.className = 'sr-only';
    table.setAttribute('data-chart-table', canvasId);
    table.setAttribute('aria-label', caption);
    table.innerHTML = `<caption>${esc(caption)}</caption><thead><tr><th>Tour</th>${datasets.map(d=>`<th>${esc(d.label || 'Série')}</th>`).join('')}</tr></thead><tbody>${labels.map((label, i)=>`<tr><th>${esc(label)}</th>${datasets.map(d=>`<td>${esc(d.data?.[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    canvas.insertAdjacentElement('afterend', table);
  }

  function destroyCharts(){ Object.keys(charts).forEach(k => { if(charts[k]) charts[k].destroy(); charts[k]=null; }); }

  function setTab(tab){
    state.activeTab = tab;

    // Important : on évite startViewTransition ici. Sur certains navigateurs,
    // le contenu du journal était injecté pendant que le panneau restait hidden,
    // ce qui donnait une page scrollable mais visuellement vide.
    document.querySelectorAll('#analysisTabs [role="tab"]').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('#tab-overview, #tab-stats, #tab-cards, #tab-timeline').forEach(sec => {
      const active = sec.id === `tab-${tab}`;
      sec.classList.toggle('active', active);
      sec.hidden = !active;
      sec.style.display = active ? 'block' : '';
    });

    if(tab === 'timeline'){
      renderTimeline();
      requestAnimationFrame(() => renderTimeline());
    }
  }

  function handleTabsKeydown(e){
    const tabs = [...document.querySelectorAll('#analysisTabs [role="tab"]')].filter(tab => tab.offsetParent !== null && !tab.hidden);
    const index = tabs.indexOf(document.activeElement);
    if(index < 0) return;
    let next = index;
    if(e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if(e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if(e.key === 'Home') next = 0;
    else if(e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next].focus();
    setTab(tabs[next].dataset.tab);
  }
  function setScope(scope){
    state.scope = scope;
    document.querySelectorAll('[data-scope]').forEach(b=>b.classList.toggle('active', b.dataset.scope === scope));
    updateDynamicTheme(getWorkingData() || state.merged, scope);
    renderStats();
    syncChartsWithTheme(scope);
  }
  function setCardFilter(filter){ state.cardFilter = filter; document.querySelectorAll('[data-card-filter]').forEach(b=>b.classList.toggle('active', b.dataset.cardFilter === filter)); renderCards(); }

  function handleModalKeydown(e){
    if(!els.cardModal?.classList.contains('active')) return;
    if(e.key === 'Escape'){ e.preventDefault(); closeCardModal(); return; }
    if(e.key !== 'Tab') return;
    const focusable = [...els.cardModal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.offsetParent !== null);
    if(!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  function buildInkProfiles(m){
    return { mine:detectInkProfile(m, 'mine'), opponent:detectInkProfile(m, 'opponent') };
  }

  function detectInkProfile(m, scope){
    const counts = {};
    const cards = cardsForScope(m, scope);
    cards.forEach(c => {
      const colors = arrayify(c.colors?.length ? c.colors : c.color || c.ink || c.inkColor);
      const stats = normalizeOwnerStats(c.ownerStats)[scope];
      const weight = Math.max(1, n(stats.seen || c.seen) + n(stats.played || c.played) + n(stats.inked || c.inked) + n(stats.quest || c.quest));
      (colors.length ? colors : ['inkless']).forEach(raw => {
        const key = inkKey(raw);
        if(key && key !== 'inkless') counts[key] = (counts[key] || 0) + weight;
      });
    });
    const inks = Object.entries(counts)
      .sort((a,b) => b[1] - a[1] || inkLabel(a[0]).localeCompare(inkLabel(b[0]), 'fr'))
      .slice(0, 2)
      .map(([key]) => key);
    return { inks, label:inkPairLabel(inks), colors:inks.map(key => INK_COLORS[key] || INK_COLORS.inkless), counts };
  }

  function inkPairLabel(inks){
    return inks?.length ? inks.map(inkLabel).join(' / ') : 'Encres non détectées';
  }

  function formatMatchupLabel(profiles){
    return `${profiles?.mine?.label || 'Encres non détectées'} vs ${profiles?.opponent?.label || 'Encres non détectées'}`;
  }

  function inkPairHtml(profile){
    const inks = profile?.inks?.length ? profile.inks : ['inkless'];
    const dots = inks.map(key => `<i class="ink-dot ink-${escAttr(key)}"></i>`).join('');
    return `<b class="ink-pair">${dots}<span>${esc(profile?.label || 'Encres non détectées')}</span></b>`;
  }

  function updateDynamicTheme(m, scope='mine'){
    if(m){
      state.themes.mine = detectInkTheme(m, 'mine');
      state.themes.opponent = detectInkTheme(m, 'opponent');
    }
    // Interface neutre : la bicolorité ne teinte plus le fond ni les accents UI.
    // On épingle les variables CSS sur les couleurs de marque fixes (les graphes
    // gardent leurs couleurs sémantiques via getThemeColors / state.themes).
    const colors = [INK_COLORS.sapphire, INK_COLORS.amber];
    const root = document.documentElement;
    root.style.setProperty('--theme-color-1', colors[0]);
    root.style.setProperty('--theme-color-2', colors[1]);
    // Aura neutre : on ne re-teinte plus les halos d'angle du fond en bleu/jaune
    // au chargement d'un match (la bicolorité ne doit pas colorer le fond).
    root.style.setProperty('--aura-one', '#0d0e11');
    root.style.setProperty('--aura-two', '#0d0e11');
    root.style.setProperty('--blue', colors[0]);
    root.style.setProperty('--warn', colors[1]);
    root.dataset.themeScope = scope;
  }

  function detectInkTheme(m, scope){
    const profile = detectInkProfile(m, scope);
    const dominant = profile.inks || [];
    const first = INK_COLORS[dominant[0]] || (scope === 'opponent' ? INK_COLORS.ruby : INK_COLORS.sapphire);
    const second = dominant[1] ? INK_COLORS[dominant[1]] : (dominant[0] ? INK_COLORS.inkless : (scope === 'opponent' ? INK_COLORS.amethyst : INK_COLORS.amber));
    return [first, second];
  }

  function getThemeColors(scope=state.scope){
    const pair = state.themes?.[scope] || state.themes?.mine || [INK_COLORS.sapphire, INK_COLORS.amber];
    return [pair[0] || INK_COLORS.sapphire, pair[1] || pair[0] || INK_COLORS.amber];
  }

  function syncChartsWithTheme(scope=state.scope){
    const theme = cssThemeColors();
    if(charts.lore){
      const pair = scopeChartPair(scope);
      const ds = charts.lore.data.datasets || [];
      if(ds[0]){ ds[0].borderColor = pair[0]; ds[0].backgroundColor = hexToRgba(pair[0], .13); ds[0].pointBackgroundColor = pair[0]; ds[0].pointBorderColor = pair[0]; }
      if(ds[1]){ ds[1].borderColor = pair[1]; ds[1].backgroundColor = hexToRgba(pair[1], .11); ds[1].pointBackgroundColor = pair[1]; ds[1].pointBorderColor = pair[1]; }
      charts.lore.update('active');
    }
    if(charts.action){
      const ds = charts.action.data.datasets || [];
      const actionColors = actionCategoryColors(scope);
      applyDatasetColor(ds[0], actionColors.ink, .92);
      applyDatasetColor(ds[1], actionColors.play, .92);
      applyDatasetColor(ds[2], actionColors.quest, .86);
      applyDatasetColor(ds[3], actionColors.challenge, .86);
      charts.action.update('active');
    }
    if(charts.ink){
      const inkTheme = getThemeColors(scope);
      const ds = charts.ink.data.datasets || [];
      if(ds[0]){ ds[0].backgroundColor = inkTheme[0]; ds[0].borderColor = inkTheme[0]; }
      if(ds[1]){
        ds[1]._normalBarBg = inkTheme[1];
        ds[1]._normalBarBorder = inkTheme[1];
        if(!restyleDatasetHighlights(ds[1])){ ds[1].backgroundColor = inkTheme[1]; ds[1].borderColor = inkTheme[1]; }
      }
      charts.ink.update('active');
    }
    if(charts.matrix){
      const ds = charts.matrix.data.datasets?.[0];
      if(ds) ds.backgroundColor = [theme[0], theme[1]];
      charts.matrix.update('active');
    }
    if(charts.hand){
      const pair = scopeChartPair(scope);
      const viewedColors = [pair[0] || theme[0]];
      const comparisonColors = [pair[1] || theme[1]];
      const ds = charts.hand.data.datasets || [];
      if(ds[0]){
        ds[0].borderColor = viewedColors[0];
        ds[0].backgroundColor = viewedColors[0];
        ds[0]._normalPointBg = viewedColors[0];
        ds[0]._normalPointBorder = viewedColors[0];
        if(!restyleDatasetHighlights(ds[0])){
          ds[0].pointBackgroundColor = viewedColors[0];
          ds[0].pointBorderColor = viewedColors[0];
        }
      }
      if(ds[1]){
        ds[1].borderColor = comparisonColors[0];
        ds[1].backgroundColor = comparisonColors[0];
        ds[1]._normalPointBg = comparisonColors[0];
        ds[1]._normalPointBorder = comparisonColors[0];
        if(!restyleDatasetHighlights(ds[1])){
          ds[1].pointBackgroundColor = comparisonColors[0];
          ds[1].pointBorderColor = comparisonColors[0];
        }
      }
      charts.hand.update('active');
    }
  }

  function updateChartSummary(id, text){ const el = $(id); if(el) el.textContent = text; }
  function summarizeLore(rows){
    if(!rows?.length) return 'Aucune donnée de lore à afficher.';
    const last = rows[rows.length-1];
    const highlights = detectLoreHighlights(rows);
    const all = [...highlights.mine, ...highlights.opponent];
    const overtake = all.find(h => h.kind === 'overtake' && h.owner === 'mine') || all.find(h => h.kind === 'overtake');
    const sprint = all.filter(h => h.kind === 'sprint').sort((a,b)=>b.delta-a.delta)[0];
    const suffix = overtake ? ` Overtake détecté au tour ${overtake.turn}.` : sprint ? ` Accélération détectée au tour ${sprint.turn} : +${sprint.delta} lore ${sprint.owner === 'mine' ? 'pour vous' : 'adverse'}.` : '';
    return `Résumé du graphique : score final affiché, vous terminez à ${n(last.mine)} lore contre ${n(last.opponent)} pour l’adversaire au tour ${last.turn}.${suffix}`;
  }
  function summarizeActions(rows){
    if(!rows?.length) return 'Aucune action à afficher.';
    const board = detectBoardControlHighlights(rows).sort((a,b)=>b.delta-a.delta)[0];
    const suffix = board ? ` Nettoyage de board détecté au tour ${board.turn} (${board.delta} défis).` : '';
    return `Résumé du graphique : ${sum(rows,'ink')} carte(s) encrée(s), ${sum(rows,'play')} carte(s) jouée(s), ${sum(rows,'quest')} quête(s) et ${sum(rows,'challenge')} défi(s).${suffix}`;
  }
  function summarizeInk(rows){
    if(!rows?.length) return 'Aucune donnée d’économie d’encre à afficher.';
    const peak = [...rows].sort((a,b)=>b.float-a.float)[0];
    return peak ? `Résumé du graphique : ${round1(sum(rows,'float'))} encre inutilisée au total, pic au tour ${peak.turn} avec ${round1(peak.float)}.` : 'Aucune encre inutilisée détectée.';
  }
  function summarizeQuest(quest, challenge){ const total = n(quest)+n(challenge); return total ? `Résumé du graphique : ${pct(quest,total)}% quête, avec ${quest} quête(s) et ${challenge} défi(s).` : 'Aucune quête ou défi détecté.'; }
  function summarizeHand(rows, comparisonRows=[]){
    if(!rows?.length) return 'Aucune donnée de main à afficher.';
    const critical = rows.filter(r=>n(r.handCount)<=1).length;
    const refill = detectHandHighlights(rows, state.scope).sort((a,b)=>b.delta-a.delta)[0];
    const advantage = handAdvantageSummary(rows, comparisonRows);
    const suffix = refill ? ` Second souffle détecté au tour ${refill.turn} : +${refill.delta} cartes en main.` : '';
    const compare = advantage ? ` ${advantage}.` : '';
    return `Résumé du graphique : ${critical} tour(s) critique(s) terminés avec 0 ou 1 carte en main.${compare}${suffix}`;
  }

  function applyPatch(obj, patch){
    const parts = pointerParts(patch.path); if(!parts.length) return;
    let parent = obj;
    for(let i=0;i<parts.length-1;i++){ const k=parts[i]; if(parent[k] === undefined) parent[k] = /^\d+$/.test(parts[i+1]) ? [] : {}; parent = parent[k]; if(parent == null) return; }
    const key = parts[parts.length-1];
    if(Array.isArray(parent)){
      const idx = key === '-' ? parent.length : Number(key);
      if(patch.op === 'add') parent.splice(idx, 0, patch.value);
      else if(patch.op === 'remove') parent.splice(idx, 1);
      else if(patch.op === 'replace') parent[idx] = patch.value;
    }else{
      if(patch.op === 'remove') delete parent[key];
      else parent[key] = patch.value;
    }
  }
  function pointerParts(path){ return String(path||'').split('/').slice(1).map(p => p.replace(/~1/g,'/').replace(/~0/g,'~')); }
  function zoneStats(snapshot, zoneKey){
    const z = snapshot?.[zoneKey] || {};
    const hand = Array.isArray(z.hand) ? z.hand.length : n(z.handCount);
    const inkArr = Array.isArray(z.inkwell) ? z.inkwell : [];
    const ink = inkArr.length || n(z.inkwellCount);
    const exerted = inkArr.reduce((count, card) => count + ((card?.exerted || card?.card?.exerted) ? 1 : 0), 0);
    const boardCards = boardCardsForZone(z);
    const boardCharacters = boardCards.filter(isCharacterCardForBoard).length;
    const boardLocations = boardCards.filter(isLocationCard).length;
    const boardLorePotential = boardCards.filter(card => isCharacterCardForBoard(card) || isLocationCard(card)).reduce((acc, card)=>acc + n(cardIntrinsicLore(card)), 0);
    return { hand, ink, exerted, lore:n(z.lore), boardCharacters, boardLocations, boardLorePotential };
  }
  function buildActionSeries(map){ return [...map.values()].sort((a,b)=>a.turn-b.turn); }

  function isUsableImageUrl(value){
    return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
  }

  function firstImageUrl(values){
    for(const value of values.flat(Infinity)){
      if(isUsableImageUrl(value)) return value.trim();
    }
    return '';
  }

  function getCardImage(rawInput, preferred='normal'){
    const raw = rawInput?.card && typeof rawInput.card === 'object' ? { ...rawInput.card, ...rawInput } : (rawInput || {});
    const fr = raw.translations?.fr || {};
    const en = raw.translations?.en || {};
    const direct = preferred === 'small'
      ? [raw.imageSmallUrl, raw.image_small, raw.imageSmall, raw.smallImageUrl, raw.thumbnailUrl, raw.thumbnail, raw.imageUrl, raw.image, fr.imageSmallUrl, fr.imageUrl, en.imageSmallUrl, en.imageUrl]
      : [raw.imageLargeUrl, raw.imageNormalUrl, raw.imageUrl, raw.image, raw.imageFullUrl, raw.fullImageUrl, fr.imageUrl, en.imageUrl, raw.imageSmallUrl, raw.imageSmall];
    const uris = raw.image_uris || raw.imageUris || raw.images || raw.imageUrls || {};
    const digital = uris.digital || uris.digital_image || uris.digitalImages || raw.digital || {};
    const faces = Array.isArray(raw.card_faces) ? raw.card_faces : [];
    const preferredUris = preferred === 'small'
      ? [digital.small, uris.small, digital.normal, uris.normal, digital.large, uris.large, digital.full, uris.full]
      : [digital.normal, uris.normal, digital.large, uris.large, digital.full, uris.full, digital.small, uris.small];
    return firstImageUrl([direct, preferredUris, faces.map(face => getCardImage(face, preferred))]);
  }

  function formatCardText(text){
    const source = cleanSymbols(text || '');
    return source.split(/\n+/).map(line => {
      let html = esc(line.trim());
      html = html.replace(/^([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ0-9'’\- ]{3,})(?=\s+(?:[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ][a-zà-ÿ]|[a-zà-ÿ]))/u, '<span class="ability-name">$1</span>');
      html = html.replace(/\b(Shift|Evasive|Challenger|Resist|Rush|Ward|Support|Bodyguard|Singer|Vanish|Reckless|Sing Together)\b/gi, '<span class="keyword-badge">$1</span>');
      return `<p>${html}</p>`;
    }).join('');
  }
  function cleanSymbols(t){ return String(t).replace(/\[INKCOST\]|\{I\}/g,'⬡').replace(/\[EXERT\]|\{E\}/g,'↷').replace(/\[STRENGTH\]/g,'¤').replace(/\s{2,}/g,' '); }
  function abilityText(c){ return (c.specialAbilities || []).map(a => `${a.name || ''} ${a.effect || ''}`).join('\n'); }
  function fullName(c){ return c.fullName || [c.name, c.version].filter(Boolean).join(' - ') || c.cardName || 'Carte inconnue'; }
  function cardKey(c){ return slug(c.id || fullName(c)); }
  function slug(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function escAttr(v){ return String(v ?? '').replace(/["'<>]/g, ''); }
  function n(v){ const x=Number(v); return Number.isFinite(x) ? x : 0; }
  function nullable(v){ const x=Number(v); return Number.isFinite(x) ? x : null; }
  function boolValue(v){ if(v === true || v === false) return v; if(String(v).toLowerCase() === 'true') return true; if(String(v).toLowerCase() === 'false') return false; return null; }
  function arrayify(v){ if(Array.isArray(v)) return v.filter(x=>x!==null&&x!==undefined&&String(x).trim()!==''); if(v===undefined||v===null||v==='') return []; return String(v).split(/\s*[,/·]\s*/).filter(Boolean); }
  function strip0(v){ return String(v ?? '').trim().replace(/^0+/, '') || String(v ?? '').trim(); }
  function normalizeSetCode(v){ const raw=String(v||'').trim().toUpperCase(); return raw ? ({ FC:'TFC', SHS:'SSK', WITW:'WHW', WIS:'WIN', WUN:'WIL' }[raw] || raw) : ''; }
  function setLabel(c){ const code = c.setCode || c.setCodes?.[0] || ''; return code ? `${code} — ${SET_LABELS[code] || code}` : ''; }
  function shortSetLabel(c){ return c?.setCode || c?.setCodes?.[0] || ''; }
  function inkLabel(v){ return INK_FR[v] || v || ''; }
  function rarityLabel(v){ const raw=String(v||''); return RARITY_FR[raw] || RARITY_FR[raw.toLowerCase()] || raw; }
  function typeLabel(v){ if(Array.isArray(v)) return v.map(typeLabel).join(' · '); return TYPE_FR[v] || TYPE_FR[String(v||'').toLowerCase()] || v || '—'; }
  function inkKey(v){
    const raw=String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(raw.includes('amber') || raw.includes('ambre')) return 'amber';
    if(raw.includes('amethyst') || raw.includes('amet')) return 'amethyst';
    if(raw.includes('emerald') || raw.includes('emeraude')) return 'emerald';
    if(raw.includes('ruby') || raw.includes('rubis')) return 'ruby';
    if(raw.includes('sapphire') || raw.includes('saphir')) return 'sapphire';
    if(raw.includes('steel') || raw.includes('acier')) return 'steel';
    return 'inkless';
  }
  function sum(arr, key){ return arr.reduce((s,x)=>s+n(x[key]),0); }
  function mean(arr){ const a=arr.map(n).filter(Number.isFinite); return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; }
  function pct(a,b){ return b ? Math.round(n(a)/n(b)*100) : 0; }
  function round1(v){ const x=n(v); return Math.round(x*10)/10; }
  function hexToRgbParts(color){
    const raw = String(color || '').trim();
    if(raw.startsWith('rgb')){
      const nums = raw.match(/[\d.]+/g)?.slice(0,3).map(Number) || [];
      if(nums.length >= 3) return nums.map(v => Math.max(0, Math.min(255, v)));
    }
    const clean = raw.replace('#','');
    const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
    if(!/^([0-9a-f]{6})$/i.test(full)) return [47,139,217];
    return [parseInt(full.slice(0,2),16), parseInt(full.slice(2,4),16), parseInt(full.slice(4,6),16)];
  }
  function chartColorDistance(a,b){
    const aa = hexToRgbParts(a), bb = hexToRgbParts(b);
    return Math.sqrt((aa[0]-bb[0])**2 + (aa[1]-bb[1])**2 + (aa[2]-bb[2])**2);
  }
  function ensureChartContrast(color, used=[], fallbackIndex=0){
    const styles = getComputedStyle(document.documentElement);
    const candidates = [
      color,
      styles.getPropertyValue('--warn').trim() || '#f6c54d',
      styles.getPropertyValue('--good').trim() || '#34d399',
      styles.getPropertyValue('--bad').trim() || '#fb7185',
      '#38bdf8', '#a78bfa', '#f97316', '#e5e7eb'
    ].filter(Boolean);
    for(const candidate of candidates){
      if((used || []).every(existing => chartColorDistance(candidate, existing) >= 86)) return candidate;
    }
    return candidates[fallbackIndex % candidates.length] || color || '#e5e7eb';
  }
  function distinctChartPalette(seed=[], count=4){
    const styles = getComputedStyle(document.documentElement);
    const candidates = [
      ...(seed || []),
      styles.getPropertyValue('--warn').trim() || '#f6c54d',
      styles.getPropertyValue('--good').trim() || '#34d399',
      styles.getPropertyValue('--bad').trim() || '#fb7185',
      '#38bdf8', '#a78bfa', '#f97316', '#e5e7eb'
    ].filter(Boolean);
    const out = [];
    for(const candidate of candidates){
      if(out.length >= count) break;
      if(out.every(existing => chartColorDistance(candidate, existing) >= 76)) out.push(candidate);
    }
    for(const candidate of candidates){
      if(out.length >= count) break;
      if(!out.includes(candidate)) out.push(candidate);
    }
    return out.slice(0, count);
  }

  function hexToRgba(hex, alpha=.16){
    const clean = String(hex || '').trim().replace('#','');
    const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
    const value = /^([0-9a-f]{6})$/i.test(full) ? full : '2f8bd9';
    const r = parseInt(value.slice(0,2), 16);
    const g = parseInt(value.slice(2,4), 16);
    const b = parseInt(value.slice(4,6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function formatBytes(bytes){ const units=['B','KB','MB']; let v=n(bytes), i=0; while(v>=1024&&i<units.length-1){v/=1024;i++;} return `${v.toFixed(v>=10||i===0?0:1)} ${units[i]}`; }
  function deepClone(obj){ return JSON.parse(JSON.stringify(obj || {})); }
  globalThis.INKSIGHT_markDuelinkConnectionDirty = () => { state.duelinkConnectionLoaded = false; };
  function deepMerge(a,b){ const out={...a}; for(const [k,v] of Object.entries(b||{})){ out[k] = v && typeof v==='object' && !Array.isArray(v) ? deepMerge(out[k]||{}, v) : v; } return out; }
})();
// =========================================================
// Auth UI · Supabase
// Version intégrée, sans fermeture accidentelle au clic extérieur
// =========================================================

function initAuthUI() {
  const authToggle = document.getElementById('authToggle');
  const authClose = document.getElementById('authClose');
  const authPanel = document.getElementById('authPanel');

  const authLoggedOut = document.getElementById('authLoggedOut');
  const authLoggedIn = document.getElementById('authLoggedIn');

  const authPillLabel = document.getElementById('authPillLabel');
  const authPillState = document.getElementById('authPillState');

  const legacyEmailControls = [
    document.getElementById('authEmail'),
    document.getElementById('authPassword'),
    document.getElementById('btnLogin'),
    document.getElementById('btnSignup'),
  ].filter(Boolean);
  legacyEmailControls.forEach((element) => {
    const wrapper = element.closest('.auth-field, .auth-row, .auth-email-row, label') || element;
    wrapper.hidden = true;
    wrapper.setAttribute?.('aria-hidden', 'true');
  });

  const btnDiscordLogin = document.getElementById('btnDiscordLogin');
  const btnLogout = document.getElementById('btnLogout');

  const userDisplay = document.getElementById('userDisplay');
  const authMessage = document.getElementById('authMessage');

  if (!authPanel) return;

  function openPanel() {
    authPanel.classList.remove('auth-hidden');
    authPanel.setAttribute('aria-hidden', 'false');
    authToggle?.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    if(authPanel.classList.contains('account-auth-card')) return;
    authPanel.classList.add('auth-hidden');
    authPanel.setAttribute('aria-hidden', 'true');
    authToggle?.setAttribute('aria-expanded', 'false');
  }

  function togglePanel() {
    if(authPanel.classList.contains('account-auth-card')) return;
    if (authPanel.classList.contains('auth-hidden')) openPanel();
    else closePanel();
  }

  function setMessage(text = '', type = '') {
    if (!authMessage) return;

    authMessage.textContent = text;
    authMessage.classList.remove('is-error', 'is-success');

    if (type === 'error') authMessage.classList.add('is-error');
    if (type === 'success') authMessage.classList.add('is-success');
  }

  function setLoading(isLoading) {
    [btnDiscordLogin, btnLogout].forEach((button) => {
      if (!button) return;
      button.disabled = isLoading;
      button.style.opacity = isLoading ? '0.65' : '';
      button.style.cursor = isLoading ? 'wait' : '';
    });
  }

  function getUserLabel(user) {
    const meta = user?.user_metadata || {};
    return (
      meta.full_name ||
      meta.global_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      meta.custom_claims?.global_name ||
      user?.email ||
      'Compte connecté'
    );
  }

  function getLoginProviderLabel(user) {
    const provider = user?.app_metadata?.provider;
    if (provider === 'discord') return 'Connecté avec Discord';
    if (provider === 'email') return 'Connecté par email';
    return 'Compte connecté';
  }

  function updateAuthUI(user) {
    const isLoggedIn = Boolean(user);
    document.body?.classList.toggle('is-authenticated', isLoggedIn);
    globalThis.INKSIGHT_markDuelinkConnectionDirty?.();
    const accountProfileTitle = document.getElementById('accountProfileTitle');
    const accountProfileText = document.getElementById('accountProfileText');

    authLoggedOut?.classList.toggle('auth-hidden', isLoggedIn);
    authLoggedIn?.classList.toggle('auth-hidden', !isLoggedIn);

    authToggle?.classList.toggle('is-online', isLoggedIn);

    if (authPillLabel) {
      authPillLabel.textContent = isLoggedIn ? 'Compte' : 'Connexion';
    }

    if (authPillState) {
      authPillState.textContent = isLoggedIn ? 'Connecté' : 'Compte';
    }

    if (userDisplay) {
      userDisplay.textContent = getUserLabel(user);
    }

    if (accountProfileTitle) {
      accountProfileTitle.textContent = isLoggedIn ? 'Compte connecté' : 'Non connecté';
    }

    if (accountProfileText) {
      accountProfileText.textContent = isLoggedIn
        ? `${getLoginProviderLabel(user)} · ${getUserLabel(user)}.`
        : 'Connectez-vous pour associer vos analyses à un compte.';
    }
    document.querySelectorAll('[data-auth-required], #duelinkTokenInput, #duelinkTestButton, #duelinkPreviewButton, #duelinkImportButton, #duelinkSaveTokenButton, #duelinkForgetTokenButton').forEach((element) => {
      if ('disabled' in element) element.disabled = !isLoggedIn;
    });

    const duelinkStatus = document.getElementById('duelinkTokenStatus');
    const duelinkHint = document.getElementById('duelinkSavedTokenHint');
    if (!isLoggedIn) {
      if (duelinkStatus) {
        duelinkStatus.textContent = 'Connexion requise';
        duelinkStatus.className = 'duelink-status-chip';
      }
      if (duelinkHint) duelinkHint.textContent = 'Connectez-vous avec Discord avant de connecter Duels.ink.';
    }

    if(authPanel.classList.contains('account-auth-card')) openPanel();

  }

  async function handleDiscordLogin() {
    try {
      setLoading(true);
      setMessage('Redirection vers Discord…');
      await signInWithDiscord();
    } catch (err) {
      setMessage(`Connexion indisponible : ${err.message || 'Supabase semble bloqué sur ce réseau.'}`, 'error');
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLoading(true);
      await signOutUser();

      updateAuthUI(null);
      setMessage('');
      closePanel();
    } catch (err) {
      setMessage(`Erreur : ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  authToggle?.addEventListener('click', togglePanel);
  authClose?.addEventListener('click', closePanel);

  btnDiscordLogin?.addEventListener('click', handleDiscordLogin);
  btnLogout?.addEventListener('click', handleLogout);

  getCurrentUser()
    .then(updateAuthUI)
    .catch(() => updateAuthUI(null));

  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session?.user ?? null);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
  initAuthUI();
}


// =========================================================
// App Shell · Navigation Analyse / Performances / Compte
// =========================================================

function initAppShell() {
  const viewButtons = [...document.querySelectorAll('[data-app-view]')];
  const appPanels = [...document.querySelectorAll('[data-app-panel]')];
  const perfButtons = [...document.querySelectorAll('[data-performance-view]')];
  const perfPanels = [...document.querySelectorAll('[data-performance-panel]')];
  const authPanel = document.getElementById('authPanel');
  const authToggle = document.getElementById('authToggle');

  function closeAuthPanel() {
    if (!authPanel || authPanel.classList.contains('account-auth-card')) return;
    authPanel.classList.add('auth-hidden');
    authPanel.setAttribute('aria-hidden', 'true');
    authToggle?.setAttribute('aria-expanded', 'false');
  }

  function updateMobileBottomNav(appView = document.body.dataset.appView || 'analysis', perfView = null) {
    const activePerf = perfView || document.body.dataset.performanceView || 'stats';
    document.querySelectorAll('.mobile-bottom-tab').forEach((button) => {
      const targetApp = button.dataset.appView || 'analysis';
      const targetPerf = button.dataset.perfView || button.dataset.performanceView || '';
      const active = targetApp === appView && (targetApp !== 'performances' || !targetPerf || targetPerf === activePerf);
      button.classList.toggle('active', active);
      if(active) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }

  function setPerformanceView(view = 'stats') {
    const next = view === 'history' ? 'history' : 'stats';
    document.body.dataset.performanceView = next;

    perfButtons.forEach((button) => {
      const active = button.dataset.performanceView === next;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    perfPanels.forEach((panel) => {
      const active = panel.dataset.performancePanel === next;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    updateMobileBottomNav(document.body.dataset.appView || 'analysis', next);
  }

  function isAuthenticatedForShell() {
    return document.body.classList.contains('is-authenticated');
  }

  function showAccountLoginHint() {
    const msg = document.getElementById('authMessage');
    if (msg) {
      msg.textContent = 'Connectez-vous avec Discord pour accéder aux statistiques, à l’historique et à Duels.ink.';
      msg.classList.remove('is-success');
      msg.classList.add('is-error');
    }
  }

  function setAppView(view = 'analysis', options = {}) {
    let next = ['analysis', 'performances', 'account'].includes(view) ? view : 'analysis';
    const wantedProtectedView = next === 'performances';
    if (wantedProtectedView && !isAuthenticatedForShell()) {
      next = 'account';
      showAccountLoginHint();
    }

    appPanels.forEach((panel) => {
      const active = panel.dataset.appPanel === next;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });

    document.querySelectorAll('.app-nav-button[data-app-view]').forEach((button) => {
      const active = button.dataset.appView === next;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    document.body.dataset.appView = next;
    document.body.classList.toggle('is-account-view', next === 'account');
    document.body.classList.toggle('is-analysis-view', next === 'analysis');
    document.body.classList.toggle('is-performances-view', next === 'performances');
    document.body.classList.remove('mobile-nav-hidden');

    if (next === 'performances') {
      setPerformanceView(options.perfView || 'stats');
    }else{
      updateMobileBottomNav(next, document.body.dataset.performanceView || 'stats');
    }

    globalThis.INKSIGHT_renderPerformanceData?.();

    if (!options.silent) {
      closeAuthPanel();
      if(window.matchMedia?.('(max-width:820px)')?.matches){
        document.body.scrollTo?.({ top:0, behavior:'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }else{
        window.scrollTo({ top:0, behavior:'smooth' });
      }
    }
  }

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setAppView(button.dataset.appView, {
        perfView: button.dataset.perfView || button.dataset.performanceView || 'stats',
      });
    });
  });

  perfButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setPerformanceView(button.dataset.performanceView);
      if(button.dataset.performanceView === 'history'){
        globalThis.INKSIGHT_refreshSavedMatches?.({ silent:true });
      }
    });
  });

  setAppView('analysis', { silent: true });
  handleJoinInviteParam();
}

function handleJoinInviteParam() {
  const code = new URLSearchParams(window.location.search).get('join');
  if (!code) return;
  sessionStorage.setItem('inksight:pendingJoinCode', code);
  window.history.replaceState({}, '', window.location.pathname);
  document.querySelector('.app-nav-button[data-app-view="account"]')?.click();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppShell);
} else {
  initAppShell();
}

// =========================================================
// V75 · Micro-interactions UI polish
// =========================================================
function initUiPolishV75(){
  document.body.classList.add('ui-ready-v75');
  const revealSelectors = [
    '.metric-card', '.pro-card', '.chart-panel', '.stat-panel', '.cards-panel', '.timeline-panel',
    '.performance-coach-card', '.performance-card-tile', '.mulligan-visual-card', '.matchup-breakdown-card',
    '.deck-manager-card', '.data-quality-item', '.history-card', '.quick-insight'
  ].join(',');
  // V116.1 stable: no global MutationObserver and no click ripple DOM injection.
  document.querySelectorAll(revealSelectors).forEach(el => {
    el.dataset.uiRevealBound = '1';
    el.classList.add('ui-reveal','is-visible');
    el.style.transitionDelay = '';
  });
}


if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initUiPolishV75, { once:true });
}else{
  initUiPolishV75();
}
