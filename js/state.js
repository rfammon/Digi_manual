// js/state.js (v19.4 - "Memória/ECU" da Aplicação)

// === 1. Chaves de Armazenamento ===
const STORAGE_KEY = 'manualPodaData';
const ACTIVE_TAB_KEY = 'manualPodaActiveTab';

// === 2. Estado Global da Aplicação ===

// O array principal de dados, exportado para ser lido por outros módulos
export let registeredTrees = [];

// O estado do banco de dados (será definido pelo database.js)
export let db = null; 

// O estado do mapa (será definido pelo ui.js)
export let mapInstance = null;

// O estado do tooltip (será definido pelo ui.js)
export let currentTooltip = null;

// O estado de ordenação da tabela
export let sortState = {
    key: 'id',
    direction: 'asc' // 'asc' ou 'desc'
};

// Variáveis de estado temporárias
export let lastEvaluatorName = '';
export let toastTimer = null;
export let lastUtmZone = { num: 0, letter: 'Z' };
export let zoomTargetCoords = null;
export let highlightTargetId = null;
export let currentTreePhoto = null; // Armazena o File/Blob da foto atual

// === 3. Funções "Setters" (para modificar o estado) ===
// Funções que permitem que outros módulos alterem o estado centralizado aqui.

export function setRegisteredTrees(newTrees) {
    registeredTrees = newTrees;
}

export function setDb(databaseInstance) {
    db = databaseInstance;
}

export function setMapInstance(map) {
    mapInstance = map;
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

// === 4. Funções de Persistência (LocalStorage) ===

/**
 * Salva o array 'registeredTrees' no LocalStorage.
 */
export function saveDataToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredTrees));
    } catch (e) { 
        console.error("Erro ao salvar dados no localStorage:", e); 
    }
}

/**
 * Carrega os dados do LocalStorage para o estado 'registeredTrees'.
 */
export function loadDataFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            registeredTrees = JSON.parse(data);
        }
    } catch (e) { 
        console.error("Erro ao ler dados do localStorage:", e);
        registeredTrees = []; // Garante que o estado seja limpo em caso de erro
    }
}

/**
 * Salva a última aba ativa no LocalStorage.
 * @param {string} tabKey O 'data-target' da aba (ex: 'conceitos-basicos')
 */
export function saveActiveTab(tabKey) {
    try {
        localStorage.setItem(ACTIVE_TAB_KEY, tabKey);
    } catch (e) {
        console.error("Erro ao salvar a aba ativa:", e);
    }
}

/**
 * Busca a última aba ativa salva no LocalStorage.
 * @returns {string | null} A chave da última aba salva.
 */
export function getActiveTab() {
    try {
        return localStorage.getItem(ACTIVE_TAB_KEY);
    } catch (e) {
        console.error("Erro ao ler a aba ativa:", e);
        return null;
    }
}
