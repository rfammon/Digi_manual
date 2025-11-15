// js/database.js (v24.3 - Exportação de initDB CORRIGIDA)

// === 1. IMPORTAÇÕES ===
import { registeredTrees, setRegisteredTrees, db, setDb, saveDataToStorage, currentTreePhoto, setCurrentTreePhoto } from './state.js';
import { showToast } from './utils.js';
import { renderSummaryTable } from './table.ui.js';

// Constantes
const DB_NAME = 'TreePhotosDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

// === 2. FUNÇÕES DE INICIALIZAÇÃO ===

/**
 * Inicializa o IndexedDB para armazenamento de fotos.
 * @returns {Promise<void>}
 */
export function initDB() { // <<-- CORRIGIDO: Adicionado 'export'
  if (db) {
    console.log("IndexedDB já está aberto.");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Tenta abrir ou criar o banco de dados
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      const error = `Falha ao abrir o IndexedDB: ${e.target.errorCode}`;
      console.error(error);
      showToast(error, 'error');
      reject(new Error(error));
    };

    request.onsuccess = (e) => {
      setDb(e.target.result);
      console.log("Banco de dados de imagens carregado com sucesso.");
      resolve();
    };

    // Este evento só dispara na primeira vez ou se a versão for alterada
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        // Cria o object store principal para fotos
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`Object Store '${STORE_NAME}' criado.`);
      }
    };
  });
}

// === 3. FUNÇÕES DE ACESSO A DADOS (Árvores) ===

/**
 * Salva a lista de árvores (state.registeredTrees) e o estado.
 */
export function saveTreesAndState() {
  saveDataToStorage();
}

// === 4. FUNÇÕES DE ACESSO A DADOS (Fotos - IndexedDB) ===

/**
 * Abre o banco de dados e retorna a transação.
 * @param {'readonly' | 'readwrite'} mode
 * @returns {IDBObjectStore | null}
 */
function _getPhotoStore(mode = 'readonly') {
  if (!db) {
    showToast("Erro: Banco de dados de fotos não inicializado.", "error");
    return null;
  }
  try {
    const transaction = db.transaction([STORE_NAME], mode);
    return transaction.objectStore(STORE_NAME);
  } catch (e) {
    console.error("Erro ao iniciar transação no IndexedDB:", e);
    showToast("Erro de acesso ao banco de dados.", "error");
    return null;
  }
}

/**
 * Adiciona uma foto (Blob) ao IndexedDB.
 * @param {number} treeId O ID da árvore.
 * @param {Blob} photoBlob O Blob da foto.
 * @returns {Promise<void>}
 */
export function addImageToDB(treeId, photoBlob) {
  return new Promise((resolve, reject) => {
    const store = _getPhotoStore('readwrite');
    if (!store) return reject(new Error("Loja de fotos indisponível."));

    const request = store.put({ id: treeId, photo: photoBlob });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (e) => {
      console.error(`Falha ao adicionar foto ID ${treeId}:`, e.target.error);
      reject(e.target.error);
    };
  });
}

/**
 * Busca uma foto (Blob) do IndexedDB.
 * @param {number} treeId O ID da árvore.
 * @param {function(Blob|null): void} callback O callback para receber o Blob.
 */
export function getImageFromDB(treeId, callback) {
  const store = _getPhotoStore('readonly');
  if (!store) return callback(null);

  const request = store.get(treeId);

  request.onsuccess = (e) => {
    const result = e.target.result;
    if (result && result.photo) {
      callback(result.photo);
    } else {
      callback(null);
    }
  };

  request.onerror = (e) => {
    console.error(`Falha ao buscar foto ID ${treeId}:`, e.target.error);
    callback(null);
  };
}

/**
 * Remove uma foto do IndexedDB.
 * @param {number} treeId O ID da árvore.
 * @returns {Promise<void>}
 */
export function deleteImageFromDB(treeId) {
  return new Promise((resolve, reject) => {
    const store = _getPhotoStore('readwrite');
    if (!store) return reject(new Error("Loja de fotos indisponível."));

    const request = store.delete(treeId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (e) => {
      console.error(`Falha ao remover foto ID ${treeId}:`, e.target.error);
      reject(e.target.error);
    };
  });
}

/**
 * Limpa o armazenamento de fotos.
 * @returns {Promise<void>}
 */
export function clearAllImages() {
  return new Promise((resolve, reject) => {
    const store = _getPhotoStore('readwrite');
    if (!store) return reject(new Error("Loja de fotos indisponível."));

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (e) => {
      console.error("Falha ao limpar armazenamento de fotos:", e.target.error);
      reject(e.target.error);
    };
  });
}