// js/database.js (v19.4 - Módulo do IndexedDB)

// Importa a "caixa de ferramentas" para mostrar erros
import { showToast } from './utils.js';

// Importa o estado (a variável 'db') e a função para modificá-la ('setDb')
import { db, setDb } from './state.js';

/**
 * Inicializa a conexão com o banco de dados IndexedDB.
 * Em caso de sucesso, armazena a instância do DB no módulo 'state'.
 */
export function initImageDB() {
    const request = indexedDB.open("treeImageDB", 1); // Versão 1

    request.onerror = (event) => {
        console.error("Erro ao abrir IndexedDB:", event);
        showToast("Erro: Não foi possível carregar o banco de dados de imagens.", "error");
    };

    request.onupgradeneeded = (event) => {
        // Esta função só roda na primeira vez ou se a versão do DB mudar
        const database = event.target.result;
        // Cria o "object store" (tabela) para as imagens, usando 'id' como chave
        database.createObjectStore("treeImages", { keyPath: "id" });
    };

    request.onsuccess = (event) => {
        // Conexão bem-sucedida!
        const database = event.target.result;
        // Armazena a conexão no estado global para que outras funções possam usá-la
        setDb(database); 
        console.log("Banco de dados de imagens carregado com sucesso.");
    };
}

/**
 * Salva (ou atualiza) um blob de imagem no IndexedDB.
 * @param {number} id - O ID da árvore (usado como chave).
 * @param {Blob} blob - O arquivo (File ou Blob) da imagem.
 */
export function saveImageToDB(id, blob) {
    if (!db) {
        showToast("Erro: Banco de dados de imagem não está pronto.", "error");
        return;
    }
    try {
        const transaction = db.transaction(["treeImages"], "readwrite");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.put({ id: id, imageBlob: blob });
        
        request.onsuccess = () => {
            console.log(`Imagem da Árvore ID ${id} salva no IndexedDB.`);
        };
        request.onerror = (event) => {
            console.error("Erro ao salvar imagem no IndexedDB:", event);
            showToast("Erro ao salvar a foto.", "error");
        };
    } catch (e) {
        console.error("Erro na transação de salvar imagem:", e);
        showToast("Falha ao salvar foto no DB.", "error");
    }
}

/**
 * Busca um blob de imagem do IndexedDB por ID.
 * @param {number} id - O ID da árvore.
 * @param {function} callback - Função a ser chamada com o resultado (ex: callback(imageBlob)).
 */
export function getImageFromDB(id, callback) {
    if (!db) {
        callback(null);
        return;
    }
    try {
        const transaction = db.transaction(["treeImages"], "readonly");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.get(id);

        request.onsuccess = (event) => {
            if (event.target.result) {
                callback(event.target.result.imageBlob); // Sucesso: retorna o blob
            } else {
                callback(null); // Nada encontrado
            }
        };
        request.onerror = (event) => {
            console.error("Erro ao buscar imagem:", event);
            callback(null);
        };
    } catch (e) {
         console.error("Erro na transação de buscar imagem:", e);
         callback(null);
    }
}

/**
 * Deleta uma imagem do IndexedDB por ID.
 * @param {number} id - O ID da árvore.
 */
export function deleteImageFromDB(id) {
    if (!db) return;
    try {
        const transaction = db.transaction(["treeImages"], "readwrite");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            console.log(`Imagem da Árvore ID ${id} deletada do IndexedDB.`);
        };
        request.onerror = (event) => {
            console.error("Erro ao deletar imagem:", event);
        };
    } catch (e) {
        console.error("Erro na transação de deletar imagem:", e);
    }
}

/**
 * (v19.0) Busca TODOS os registros de imagem do IndexedDB.
 * Usado para a exportação .ZIP.
 * @returns {Promise<Array>} Uma promessa que resolve com um array de {id, imageBlob}.
 */
export function getAllImagesFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("IndexedDB não está pronto.");
            return reject(new Error("IndexedDB não está pronto."));
        }
        
        const transaction = db.transaction(["treeImages"], "readonly");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.getAll(); // Pega todos os registros

        request.onsuccess = (event) => {
            resolve(event.target.result); // Retorna o array de {id, imageBlob}
        };
        request.onerror = (event) => {
            console.error("Erro ao buscar todas as imagens:", event);
            reject(event.target.error);
        };
    });
}
