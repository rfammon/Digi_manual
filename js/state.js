// js/state.js (v23.6 - Adiciona 'openInfoBoxId')

// === 1. Chaves de Armazenamento ===
const STORAGE_KEY = 'manualPodaData';
const ACTIVE_TAB_KEY = 'manualPodaActiveTab';

// === 2. Estado Global da Aplicação ===

export let registeredTrees = [];
export let db = null;
export let mapInstance = null;
export let mapMarkerGroup = null;
export let currentTooltip = null;

export let sortState = {
  key: 'id',
  direction: 'asc'
};

// Variáveis de estado temporárias
export let lastEvaluatorName = '';
export let toastTimer = null;
export let lastUtmZone = { num: 0, letter: 'Z' };
export let zoomTargetCoords = null;
export let highlightTargetId = null;
export let currentTreePhoto = null;
export let editingTreeId = null;

// [NOVO v23.6] ID da árvore para abrir o InfoBox após o zoom
export let openInfoBoxId = null;


// === 3. Funções "Setters" ===

export function setRegisteredTrees(newTrees) { /* ... */ }
export function setDb(databaseInstance) { /* ... */ }
export function setMapInstance(map) { /* ... */ }
export function setMapMarkerGroup(group) { /* ... */ }
export function setCurrentTooltip(tooltip) { /* ... */ }
export function setSortState(key, direction) { /* ... */ }
export function setLastEvaluatorName(name) { /* ... */ }
export function setToastTimer(timer) { /* ... */ }
export function setLastUtmZone(num, letter) { /* ... */ }
export function setZoomTargetCoords(coords) { /* ... */ }
export function setHighlightTargetId(id) { /* ... */ }
export function setCurrentTreePhoto(photoBlob) { /* ... */ }
export function setEditingTreeId(id) { /* ... */ }

/**
 * [NOVO v23.6] Define o ID do InfoBox que deve ser aberto no mapa.
 * @param {number | null} id O ID da árvore ou null.
 */
export function setOpenInfoBoxId(id) {
  openInfoBoxId = id;
}

// === 4. Funções de Persistência (LocalStorage) ===
// (Sem alterações)
export function saveDataToStorage() { /* ... */ }
export function loadDataFromStorage() { /* ... */ }
export function saveActiveTab(tabKey) { /* ... */ }
export function getActiveTab() { /* ... */ }
