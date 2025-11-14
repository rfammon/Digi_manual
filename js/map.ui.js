// js/map.ui.js (v23.16 - Completo - Adiciona GPS Marker e Botão Toggle)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import * as features from './features.js';
import { getImageFromDB } from './database.js';

// === 2. ESTADO INTERNO DO MÓDULO ===

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let currentInfoBoxZoom = 0;
const ZOOM_LEVELS = [280, 400, 550];

// [NOVO v23.16] Armazena a referência ao marcador de localização
let locationMarker = null;

// === 3. FUNÇÕES PRIVADAS (LÓGICA DO MAPA) ===

/**
 * [NOVO v23.16] Cria um ícone CSS customizado para a localização do usuário.
 */
function _createLocationIcon() {
  return L.divIcon({
    className: 'leaflet-user-location-marker',
    html: '<span class="pulse"></span><span class="dot"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

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
 * [PRIVADO] (v23.6) Desenha os marcadores e anexa listeners de dblclick.
 */
function renderMapMarkers() {
  if (!state.mapMarkerGroup) {
    console.error("renderMapMarkers: mapMarkerGroup não está inicializado.");
    return;
  }
  
  const treesToRender = state.registeredTrees.map(tree => {
    const coords = features.convertToLatLon(tree);
    if (coords) {
      tree.coordsLatLon = coords;
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

    circle.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      showMapInfoBox(tree);
    });

    circle.on('dblclick', (e) => {
      L.DomEvent.stopPropagation(e);
      features.handleMapMarkerClick(tree.id);
    });
  });

  const currentFilter = document.querySelector('#map-legend-filter input[name="risk-filter"]:checked');
  if (currentFilter) {
    handleMapFilterChange({ target: currentFilter });
  }
  
  return state.mapMarkerGroup.getBounds();
}

// === 4. FUNÇÕES PÚBLICAS (EXPORTADAS) ===

/**
 * [NOVO v23.16] Adiciona ou move o marcador de localização do usuário.
 * @param {Array<number>} latlng - [latitude, longitude]
 */
export function updateLocationMarker(latlng) {
  if (!state.mapInstance) return; // Mapa não está pronto

  if (!locationMarker) {
    // Cria o marcador na primeira vez
    locationMarker = L.marker(latlng, {
      icon: _createLocationIcon(),
      interactive: false, // Não pode ser clicado
      keyboard: false, // Não pode ser focado
      zIndexOffset: 1000 // Fica acima dos marcadores de árvore
    }).addTo(state.mapInstance);
    
    // Zoom para o local na primeira vez
    if (state.mapInstance.getZoom() < 16) {
      state.mapInstance.setView(latlng, 16);
    } else {
      state.mapInstance.panTo(latlng);
    }
  } else {
    // Apenas atualiza a posição
    locationMarker.setLatLng(latlng);
    state.mapInstance.panTo(latlng); // Continua seguindo
  }
}

/**
 * [NOVO v23.16] Remove o marcador de localização do usuário do mapa.
 */
export function removeLocationMarker() {
  if (locationMarker && state.mapInstance) {
    locationMarker.remove();
    locationMarker = null;
  }
}

/**
 * [NOVO v23.16] Atualiza o estilo do botão de toggle de localização.
 * @param {boolean} isActive - Se o botão deve parecer "ativo".
 */
export function setToggleLocationButtonActive(isActive) {
  const btn = document.getElementById('toggle-location-btn');
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

/**
 * (PÚBLICO) [MODIFICADO v23.16] Anexa os listeners aos controles do mapa.
 */
export function setupMapListeners() {
  const mapLegend = document.getElementById('map-legend-filter');
  const zoomBtn = document.getElementById('zoom-to-extent-btn');
  // [NOVO v23.16] Botão de Localização
  const locationBtn = document.getElementById('toggle-location-btn');

  if (mapLegend) {
    mapLegend.removeEventListener('change', handleMapFilterChange);
    mapLegend.addEventListener('change', handleMapFilterChange);
  }
  if (zoomBtn) {
    zoomBtn.removeEventListener('click', features.handleZoomToExtent);
    zoomBtn.addEventListener('click', features.handleZoomToExtent);
  }
  // [NOVO v23.16] Anexa o listener do botão de localização
  if (locationBtn) {
    locationBtn.removeEventListener('click', features.handleToggleLocation);
    locationBtn.addEventListener('click', features.handleToggleLocation);
  }
}

/**
 * (PÚBLICO) [MODIFICADO v23.6] Inicializa o mapa e abre o InfoBox se necessário.
 */
export function initializeMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  if (typeof L === 'undefined' || typeof proj4 === 'undefined') {
    mapContainer.innerHTML = '<p style="color:red; font-weight:bold;">ERRO DE MAPA: As bibliotecas Leaflet e Proj4js não foram carregadas.</p>';
    return;
  }

  if (state.mapInstance) {
    state.mapInstance.invalidateSize();
  } else {
    const newMap = L.map('map-container').setView([-15.7801, -47.9292], 4);
    state.setMapInstance(newMap);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }).addTo(newMap);
    const markerGroup = L.featureGroup().addTo(newMap);
    state.setMapMarkerGroup(markerGroup);
    newMap.on('click', hideMapInfoBox);
  }
  
  const bounds = renderMapMarkers();

  // Lógica de Zoom e Abertura de InfoBox
  if (state.zoomTargetCoords) {
    state.mapInstance.setView(state.zoomTargetCoords, 18);
    state.setZoomTargetCoords(null);
    
    if (state.openInfoBoxId !== null) {
      const treeIdToOpen = state.openInfoBoxId;
      const tree = state.registeredTrees.find(t => t.id === treeIdToOpen);
      
      if (tree) {
        setTimeout(() => {
          if (document.getElementById('tab-content-mapa')?.classList.contains('active')) {
             showMapInfoBox(tree);
          }
        }, 300);
      }
      state.setOpenInfoBoxId(null);
    }
    
  } else if (bounds && bounds.isValid()) {
    features.handleZoomToExtent();
  }
}
