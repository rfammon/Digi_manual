// js/state.js (v23.5 - Adiciona 'editingTreeId')

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
export let currentTreePhoto = null; // Armazena o File/Blob da foto atual

// [NOVO v23.5] Armazena o ID da árvore sendo editada (null = modo de adição)
export let editingTreeId = null;


// === 3. Funções "Setters" (para modificar o estado) ===

export function setRegisteredTrees(newTrees) {
  registeredTrees = newTrees;
}
export function setDb(databaseInstance) {
  db = databaseInstance;
}
export function setMapInstance(map) {
  mapInstance = map;
}
export function setMapMarkerGroup(group) {
  mapMarkerGroup = group;
}
export function setCurrentTooltip(tooltip) {
  currentTooltip = tooltip;
}
export function setSortState(key, direction) {
  sortState.key = key;
  sortState.direction = direction;
}
export function setLastEvaluatorName(name) {
  lastEvaluatorName = name;
}
export function setToastTimer(timer) {
  toastTimer = timer;
}
export function setLastUtmZone(num, letter) {
  lastUtmZone.num = num;
  lastUtmZone.letter = letter;
}
export function setZoomTargetCoords(coords) {
  zoomTargetCoords = coords;
}
export function setHighlightTargetId(id) {
  highlightTargetId = id;
}
export function setCurrentTreePhoto(photoBlob) {
  currentTreePhoto = photoBlob;
}

/**
 * [NOVO v23.5] Define o ID da árvore que está sendo editada.
 * @param {number | null} id O ID da árvore ou null.
 */
export function setEditingTreeId(id) {
  editingTreeId = id;
}


// === 4. Funções de Persistência (LocalStorage) ===
// (Sem alterações)

export function saveDataToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredTrees));
  } catch (e) {
    console.error("Erro ao salvar dados no localStorage:", e);
  }
}
export function loadDataFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      registeredTrees = JSON.parse(data);
    }
  } catch (e) {
    console.error("Erro ao ler dados do localStorage:", e);
    registeredTrees = [];
  }
}
export function saveActiveTab(tabKey) {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tabKey);
  } catch (e) {
    console.error("Erro ao salvar a aba ativa:", e);
  }
}
export function getActiveTab() {
  try {
    return localStorage.getItem(ACTIVE_TAB_KEY);
  } catch (e) {
    console.error("Erro ao ler a aba ativa:", e);
    return null;
  }
}
