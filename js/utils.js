// js/utils.js (MODIFICADO v24.0)
// ... (código existente de 'debounce' e 'showToast' permanece o mesmo) ...
import { toastTimer, setToastTimer } from './state.js';

// === 1. UTILITÁRIO DE PERFORMANCE (DEBOUNCE) ===
export function debounce(func, delay = 300) {
    // ... (código existente) ...
}

// === 2. UTILITÁRIO DE UI (TOAST NOTIFICATION) ===
export function showToast(message, type = 'success') {
    // ... (código existente) ...
}

// === 3. UTILITÁRIO GIS (CONVERSÃO DE COORDENADAS) ===
export function convertLatLonToUtm(lat, lon) {
    // ... (código existente) ...
}

// === 4. [NOVO] UTILITÁRIO DE IMAGEM ===

/**
 * (v21.5) OTIMIZAÇÃO DE IMAGEM: Redimensiona e comprime uma imagem (Blob).
 * Movido de 'ui.js' pois é um utilitário genérico.
 * @param {File | Blob} imageFile O arquivo de imagem original.
 * @param {number} [maxWidth=800] Largura máxima.
 * @param {number} [quality=0.7] Qualidade do JPEG (0 a 1).
 * @returns {Promise<Blob>} Um Blob da imagem otimizada.
 */
export async function optimizeImage(imageFile, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let { width, height } = img;

        // Calcula o novo tamanho mantendo a proporção
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para Blob (performance assíncrona)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Falha ao criar o blob da imagem.'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}