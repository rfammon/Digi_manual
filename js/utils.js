// js/utils.js (v19.4 - "Caixa de Ferramentas" com Helpers)

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
        setToastTimer(null);
    }, 3000);
    
    setToastTimer(newTimer);
}


// === 3. UTILITÁRIO GIS (CONVERSÃO DE COORDENADAS) ===

/**
 * Converte Latitude/Longitude (WGS84) para Coordenadas UTM.
 * Esta é uma função matemática pura.
 * @param {number} lat - Latitude (ex: -22.89)
 * @param {number} lon - Longitude (ex: -43.12)
 * @returns {object} { easting, northing, zoneNum, zoneLetter }
 */
export function convertLatLonToUtm(lat, lon) {
    // Constantes elipsoidais (WGS84)
    const f = 1 / 298.257223563; // Achamento
    const a = 6378137.0;       // Raio equatorial
    const k0 = 0.9996;           // Fator de escala

    // Parâmetros derivados
    const e = Math.sqrt(f * (2 - f));
    const e2 = e * e;
    const e4 = e2 * e2;
    const e6 = e4 * e2;
    const e_2 = e2 / (1.0 - e2);

    // Converter para radianos
    const latRad = lat * (Math.PI / 180.0);
    const lonRad = lon * (Math.PI / 180.0);

    // --- 1. Calcular a Zona UTM ---
    let zoneNum = Math.floor((lon + 180.0) / 6.0) + 1;

    // Casos especiais (Noruega e Svalbard)
    if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) zoneNum = 32;
    if (lat >= 72.0 && lat < 84.0) {
        if (lon >= 0.0 && lon < 9.0) zoneNum = 31;
        else if (lon >= 9.0 && lon < 21.0) zoneNum = 33;
        else if (lon >= 21.0 && lon < 33.0) zoneNum = 35;
        else if (lon >= 33.0 && lon < 42.0) zoneNum = 37;
    }

    // Meridiano central da zona
    const lonOrigin = (zoneNum - 1.0) * 6.0 - 180.0 + 3.0; // +3 graus
    const lonOriginRad = lonOrigin * (Math.PI / 180.0);

    // Letra da banda (Hemisfério)
    const zoneLetters = "CDEFGHJKLMNPQRSTUVWXX";
    let zoneLetter = "Z";
    if (lat >= -80 && lat <= 84) {
        zoneLetter = zoneLetters.charAt(Math.floor((lat + 80) / 8));
    }

    // --- 2. Cálculos da Projeção ---
    const nu = a / Math.sqrt(1.0 - e2 * Math.sin(latRad) * Math.sin(latRad));
    const T = Math.tan(latRad) * Math.tan(latRad);
    const C = e_2 * Math.cos(latRad) * Math.cos(latRad);
    const A = (lonRad - lonOriginRad) * Math.cos(latRad);

    // Distância meridional (M)
    const M = a * ((1.0 - e2 / 4.0 - 3.0 * e4 / 64.0 - 5.0 * e6 / 256.0) * latRad -
               (3.0 * e2 / 8.0 + 3.0 * e4 / 32.0 + 45.0 * e6 / 1024.0) * Math.sin(2.0 * latRad) +
               (15.0 * e4 / 256.0 + 45.0 * e6 / 1024.0) * Math.sin(4.0 * latRad) -
               (35.0 * e6 / 3072.0) * Math.sin(6.0 * latRad));
    
    // --- 3. Coordenadas Finais ---
    
    // Easting (X)
    const K2 = k0 * nu * (A + (1.0 - T + C) * (A * A * A / 6.0) +
               (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * e_2) * (A * A * A * A * A / 120.0));
    const easting = K2 + 500000.0; // Adiciona falso Easting

    // Northing (Y)
    const M1 = M + nu * Math.tan(latRad) * ((A * A / 2.0) +
               (5.0 - T + 9.0 * C + 4.0 * C * C) * (A * A * A * A / 24.0) +
               (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * e_2) * (A * A * A * A * A * A / 720.0));
    let northing = k0 * (M1);
    
    // Adiciona falso Northing para o Hemisfério Sul
    if (lat < 0.0) {
        northing += 10000000.0; 
    }

    return { 
        easting: easting, 
        northing: northing, 
        zoneNum: zoneNum, 
        zoneLetter: zoneLetter 
    };
}
