// js/utils.js (v21.2 - CORREÇÃO DE BUG "hemisferio")

// Importa os setters de estado necessários para o toast
import { toastTimer, setToastTimer } from './state.js';

// === 1. UTILITÁRIO DE PERFORMANCE (DEBOUNCE) ===

/**
 * Cria uma versão "debounced" de uma função que atrasa sua execução.
 * @param {function} func A função a ser executada.
 * @param {number} delay O tempo em milissegundos que o usuário deve parar de interagir.
 */
export function debounce(func, delay = 300) {
    let timer; // Armazena o ID do setTimeout

    // Retorna a nova função "envelopada"
    return function(...args) {
        // 'this' e 'args' são capturados para manter o contexto correto
        const context = this; 
        
        // Limpa qualquer timer anterior
        clearTimeout(timer); 
        
        // Define um novo timer
        timer = setTimeout(() => {
            func.apply(context, args); // Executa a função original
        }, delay);
    };
}


// === 2. UTILITÁRIO DE UI (TOAST NOTIFICATION) ===

/**
 * Exibe uma notificação toast (popup) na tela.
 * @param {string} message A mensagem a ser exibida.
 * @param {string} [type='success'] O tipo ('success' ou 'error') para estilização.
 */
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    // Limpa qualquer timer de toast anterior
    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toast.textContent = message;
    toast.className = 'show'; // Ativa a animação de entrada
    toast.classList.add(type); // Adiciona a cor (success/error)

    // Cria um novo timer para esconder o toast e atualiza o estado
    const newTimer = setTimeout(() => {
        toast.className = toast.className.replace('show', '');
        // (v20.0) Limpa a classe de tipo para o próximo toast
        toast.classList.remove(type); 
        setToastTimer(null);
    }, 3000);
    
    setToastTimer(newTimer);
}


// === 3. UTILITÁRIO GIS (CONVERSÃO DE COORDENADAS) ===

/**
 * [ERRO CRÍTICO 3 - OTIMIZADO]
 * As +100 linhas de matemática manual foram removidas.
 * Esta função agora usa Proj4js, unificando a lógica do app.
 * * Converte Latitude/Longitude (WGS84) para Coordenadas UTM.
 * @param {number} lat - Latitude (ex: -22.89)
 * @param {number} lon - Longitude (ex: -43.12)
 * @returns {object} { easting, northing, zoneNum, zoneLetter }
 */
export function convertLatLonToUtm(lat, lon) {
    
    // 1. Validação básica de entrada
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
        console.error("convertLatLonToUtm: Entradas inválidas.", { lat, lon });
        return null;
    }

    // 2. Encontra a Zona UTM
    const zoneNum = Math.floor((lon + 180) / 6) + 1;
    
    // 3. Determina o hemisfério
    const hemisphere = lat >= 0 ? 'north' : 'south'; // <-- Definido como 'hemisphere'
    
    // 4. Define as projeções
    const wgs84 = "EPSG:4326"; // Projeção padrão (Lat/Lon)
    
    // [CORREÇÃO v21.2]: A variável usada abaixo agora é 'hemisphere' (inglês)
    const utmProj = `+proj=utm +zone=${zoneNum} +${hemisphere} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;

    // 5. Converte
    try {
        if (typeof proj4 === 'undefined') {
            showToast("Erro: Biblioteca Proj4js não carregada.", "error");
            console.error("Falha na conversão: Proj4js não está definido.");
            return null;
        }
        
        const [easting, northing] = proj4(wgs84, utmProj, [lon, lat]);
        
        // Encontra a letra da zona (necessário para consistência com features.js)
        const zoneLetters = "CDEFGHJKLMNPQRSTUVWXX";
        let zoneLetter = "Z"; // Padrão para fora do alcance
        if (lat >= -80 && lat <= 84) {
            zoneLetter = zoneLetters.charAt(Math.floor((lat + 80) / 8));
        }

        return { 
            easting: parseFloat(easting.toFixed(0)), 
            northing: parseFloat(northing.toFixed(0)), 
            zoneNum: zoneNum, 
            zoneLetter: zoneLetter 
        };

    } catch (e) {
        console.error("Falha na conversão Proj4js (LatLon -> UTM):", e);
        showToast("Erro ao converter coordenadas GPS.", "error");
        return null;
    }
}
