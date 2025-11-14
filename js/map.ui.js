// js/map.ui.js (v23.6 - Correção de Listeners de Interação)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import * as features from './features.js';
import { getImageFromDB } from './database.js';

// === 2. ESTADO INTERNO DO MÓDULO ===

// Variáveis de escopo do módulo para detecção de toque
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Níveis de Zoom da Imagem do InfoBox
let currentInfoBoxZoom = 0;
const ZOOM_LEVELS = [280, 400, 550]; // (Pequeno, Médio, Grande)

// === 3. FUNÇÕES PRIVADAS (LÓGICA DO MAPA) ===

/**
 * [PRIVADO] Lida com a mudança do filtro da legenda (Alto, Médio, Baixo, Todos).
 */
function handleMapFilterChange(e) {
  const selectedRisk = e.target.value;
  if (!state.mapMarkerGroup) return;

  state.mapMarkerGroup.eachLayer(layer => {
    if (selectedRisk === 'Todos' || layer.options.riskLevel === selectedRisk) {
      layer.setStyle({ opacity: 1, fillOpacity: 0.6 }); // Mostra
    } else {
      layer.setStyle({ opacity: 0, fillOpacity: 0 }); // Esconde
    }
  });
  hideMapInfoBox(); // Esconde o infobox ao filtrar
}

/**
 * [PRIVADO] Controla o zoom da imagem no InfoBox (desktop).
 */
function zoomMapImage(direction) {
  const infoBox = document.getElementById('map-info-box');
  if (!infoBox) return;

  currentInfoBoxZoom += direction;
  // Limita o zoom
  if (currentInfoBoxZoom < 0) currentInfoBoxZoom = 0;
  if (currentInfoBoxZoom >= ZOOM_LEVELS.length) currentInfoBoxZoom = ZOOM_LEVELS.length - 1;

  const newWidth = ZOOM_LEVELS[currentInfoBoxZoom];
  infoBox.style.width = `${newWidth}px`;
}

/**
 * [PRIVADO] Esconde o painel de informações do mapa.
 */
function hideMapInfoBox() {
  const infoBox = document.getElementById('map-info-box');
  if (infoBox) {
    const img = infoBox.querySelector('img');
    if (img && img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
    infoBox.classList.add('hidden');
    infoBox.innerHTML = '';
    currentInfoBoxZoom = 0;
    infoBox.style.width = '';
  }
}

/**
 * [PRIVADO] Mostra o painel de informações do mapa para uma árvore específica.
 */
function showMapInfoBox(tree) {
  const infoBox = document.getElementById('map-info-box');
  if (!infoBox) return;

  currentInfoBoxZoom = 0;
  infoBox.style.width = '';

  let color, riskText;
  if (tree.risco === 'Alto Risco') {
    color = '#C62828'; riskText = '🔴 Alto Risco';
  } else if (tree.risco === 'Médio Risco') {
    color = '#E65100'; riskText = '🟠 Médio Risco';
  } else {
    color = '#2E7D32'; riskText = '🟢 Baixo Risco';
  }

  // .innerHTML seguro (template controlado, dados do 'state')
  let infoHTML = `
    <button id="close-info-box">&times;</button>
    <strong>ID: ${tree.id}</strong>
    <p><strong>Espécie:</strong> ${tree.especie}</p>
    <p><strong>Risco:</strong> <span style="color:${color}; font-weight:bold;">${riskText}</span></p>
    <p><strong>Local:</strong> ${tree.local}</p>
    <p><strong>Coord. UTM:</strong> ${tree.coordX}, ${tree.coordY} (${tree.utmZoneNum || '?'}${tree.utmZoneLetter || '?'})</p>
  `;

  if (tree.hasPhoto) {
    infoHTML += `<div id="map-info-photo" class="loading-photo">Carregando foto...</div>`;
    if (!isTouchDevice) {
      infoHTML += `
        <div class="map-photo-zoom">
          <button id="zoom-out-btn" title="Diminuir Zoom">-</button>
          <button id="zoom-in-btn" title="Aumentar Zoom">+</button>
        </div>
      `;
    }
  }

  infoBox.innerHTML = infoHTML;
  infoBox.classList.remove('hidden');

  document.getElementById('close-info-box').addEventListener('click', hideMapInfoBox);

  if (tree.hasPhoto) {
    getImageFromDB(tree.id, (imageBlob) => {
      const photoDiv = document.getElementById('map-info-photo');
      if (photoDiv && imageBlob) {
        const imgUrl = URL.createObjectURL(imageBlob);
        photoDiv.innerHTML = `<img src="${imgUrl}" alt="Foto ID ${tree.id}" class="manual-img" id="infobox-img">`;
        photoDiv.classList.remove('loading-photo');
        
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => zoomMapImage(-1));
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => zoomMapImage(1));
      } else if (photoDiv) {
        photoDiv.innerHTML = `<p style="color:red; font-size: 0.9em;">Foto não encontrada.</p>`;
        photoDiv.classList.remove('loading-photo');
      }
    });
  }
}

/**
 * [PRIVADO] [MODIFICADO v23.6] Desenha os marcadores e anexa listeners de dblclick.
 */
function renderMapMarkers() {
  if (!state.mapMarkerGroup) {
    console.error("renderMapMarkers: mapMarkerGroup não está inicializado.");
    return;
  }
  
  // Converte coordenadas apenas dos dados atuais
  const treesToRender = state.registeredTrees.map(tree => {
    const coords = features.convertToLatLon(tree);
    if (coords) {
      tree.coordsLatLon = coords; // Armazena temporariamente para renderização
      return tree;
    }
    return null;
  }).filter(tree => tree !== null);

  state.mapMarkerGroup.clearLayers();
  hideMapInfoBox();

  treesToRender.forEach(tree => {
    const coords = tree.coordsLatLon;
    let color, radius;

    if (tree.risco === 'Alto Risco') {
      color = '#C62828'; radius = 12;
    } else if (tree.risco === 'Médio Risco') {
      color = '#E65100'; radius = 8;
    } else {
      color = '#2E7D32'; radius = 5;
    }

    const circle = L.circle(coords, {
      color: color,
      fillColor: color,
      fillOpacity: 0.6,
      radius: radius,
      weight: 1,
      isTreeMarker: true,
      riskLevel: tree.risco
    });

    circle.addTo(state.mapMarkerGroup);

    // Listener de clique (para abrir InfoBox)
    circle.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      showMapInfoBox(tree);
    });

    // [NOVO v23.6] Listener de clique duplo (para ir para a tabela)
    circle.on('dblclick', (e) => {
      L.DomEvent.stopPropagation(e);
      // Chama a feature que navega para a tabela
      features.handleMapMarkerClick(tree.id);
    });
  });

  // Aplica o filtro de legenda atual
  const currentFilter = document.querySelector('#map-legend-filter input[name="risk-filter"]:checked');
  if (currentFilter) {
    handleMapFilterChange({ target: currentFilter });
  }
  
  // Retorna os bounds para o zoom
  return state.mapMarkerGroup.getBounds();
}

// === 4. FUNÇÕES PÚBLICAS (EXPORTADAS) ===

/**
 * (PÚBLICO) Anexa os listeners aos controles HTML externos (Legenda, Zoom).
 * Chamado por ui.js em setupRiskCalculator.
 */
export function setupMapListeners() {
  const mapLegend = document.getElementById('map-legend-filter');
  const zoomBtn = document.getElementById('zoom-to-extent-btn');

  if
