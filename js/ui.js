// js/ui.js (v23.9 - Refatoração do Visualizador de Fotos)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import { glossaryTerms, equipmentData, podaPurposeData } from './content.js';
import { showToast, debounce } from './utils.js';
import { getImageFromDB } from './database.js';
import * as features from './features.js';
import * as mapUI from './map.ui.js';
import * as modalUI from './modal.ui.js';

// === 2. ESTADO DO MÓDULO UI ===

const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const termClickEvent = isTouchDevice ? 'touchend' : 'click';
const popupCloseEvent = isTouchDevice ? 'touchend' : 'click';

// [v23.7] Timer de tooltip centralizado
let tooltipHideTimer = null;

// [NOVO v23.9] Estado do Visualizador de Fotos
const photoViewer = {
  modal: null,
  dialog: null,
  title: null,
  content: null,
  closeBtn: null,
  isDragging: false,
  offset: { x: 0, y: 0 },
  zoomLevel: 0,
  zoomLevels: [300, 450, 600] // Padrão (P), Médio (M), Grande (G)
};

// === 3. RENDERIZAÇÃO DE CONTEÚDO (MANUAL) ===
// (Sem alterações)
export function loadContent(detailView, content) { /* ... */ }

// === 4. LÓGICA DA CALCULADORA DE RISCO (UI) ===
// (Sem alterações nas funções: showMobileQuestion, setupMobileChecklist)
let mobileChecklist = { /* ... */ };
export function showMobileQuestion(index) { /* ... */ }
export function setupMobileChecklist() { /* ... */ }

// --- Seção de Renderização da Tabela (v23.5) ---
// (Sem alterações nas funções: createSafeCell, createActionCell, _createTreeRow,
// appendTreeRow, removeTreeRow, renderSummaryTable, showSubTab, highlightTableRow)
function createSafeCell(text, className) { /* ... */ }
function createActionCell({ className, icon, treeId, cellClassName }) { /* ... */ }
function _createTreeRow(tree) { /* ... */ }
function appendTreeRow(tree) { /* ... */ }
function removeTreeRow(id) { /* ... */ }
export function renderSummaryTable() { /* ... */ }
export function showSubTab(targetId) { /* ... */ }
function highlightTableRow(id) { /* ... */ }

// --- Seção de Otimização e Setup (v23.5) ---
// (Sem alterações nas funções: optimizeImage, _setFormMode, _populateFormForEdit,
// _setupSubNavigation, _setupFileImporters, _setupFormListeners, _setupPhotoListeners,
// _setupCalculatorControls)
async function optimizeImage(imageFile, maxWidth = 800, quality = 0.7) { /* ... */ }
function _setFormMode(mode) { /* ... */ }
function _populateFormForEdit(tree) { /* ... */ }
function _setupSubNavigation() { /* ... */ }
function _setupFileImporters() { /* ... */ }
function _setupFormListeners(form, isTouchDevice) { /* ... */ }
function _setupPhotoListeners() { /* ... */ }
function _setupCalculatorControls() { /* ... */ }


// #####################################################################
// ### INÍCIO DA SEÇÃO REFATORADA (v23.9) ###
// #####################################################################

/**
 * [NOVO v23.9] Torna o diálogo de foto arrastável (desktop).
 */
function _makeDraggable() {
  const { dialog, title } = photoViewer;
  if (isTouchDevice || !dialog || !title) return;

  title.style.cursor = 'move';

  const onMouseDown = (e) => {
    // 1. Inicia o arrasto
    photoViewer.isDragging = true;
    
    // 2. Pega a posição atual do CSS (que é 50% / 50%)
    const rect = dialog.getBoundingClientRect();
    
    // 3. Trava a posição atual em pixels, removendo o 'transform'
    dialog.style.position = 'fixed'; // Garante que está relativo ao viewport
    dialog.style.top = `${rect.top}px`;
    dialog.style.left = `${rect.left}px`;
    dialog.style.transform = ''; // Remove o translate(-50%, -50%)
    
    // 4. Calcula o offset do clique *dentro* do diálogo
    photoViewer.offset.x = e.clientX - rect.left;
    photoViewer.offset.y = e.clientY - rect.top;

    // 5. Anexa listeners globais
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!photoViewer.isDragging) return;
    e.preventDefault();
    
    // Calcula nova posição baseada no offset
    let newX = e.clientX - photoViewer.offset.x;
    let newY = e.clientY - photoViewer.offset.y;

    // Limita ao viewport
    newX = Math.max(0, Math.min(newX, window.innerWidth - dialog.offsetWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - dialog.offsetHeight));

    dialog.style.left = `${newX}px`;
    dialog.style.top = `${newY}px`;
  };

  const onMouseUp = () => {
    photoViewer.isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  title.addEventListener('mousedown', onMouseDown);
}

/**
 * [NOVO v23.9] Esconde o modal visualizador de fotos.
 */
function _hidePhotoViewer() {
  const { modal, dialog, content } = photoViewer;
  if (!modal) return;

  modal.classList.remove('show');
  
  // Reseta o conteúdo
  content.innerHTML = '';
  
  // Reseta o CSS de arrasto/zoom para a centralização padrão
  dialog.style.width = '';
  dialog.style.top = '';
  dialog.style.left = '';
  dialog.style.transform = '';
  dialog.style.position = '';
}

/**
 * [NOVO v23.9] Aplica o zoom na imagem do visualizador.
 */
function _zoomPhotoViewer(direction) {
  const { dialog, zoomLevels } = photoViewer;
  if (!dialog || isTouchDevice) return;

  photoViewer.zoomLevel += direction;
  // Limita
  if (photoViewer.zoomLevel < 0) photoViewer.zoomLevel = 0;
  if (photoViewer.zoomLevel >= zoomLevels.length) photoViewer.zoomLevel = zoomLevels.length - 1;

  const newWidth = zoomLevels[photoViewer.zoomLevel];
  dialog.style.width = `${newWidth}px`;
}

/**
 * [NOVO v23.9] Busca dados e exibe o modal visualizador de fotos.
 * @param {number} treeId 
 */
function _showPhotoViewer(treeId) {
  const { modal, dialog, title, content, zoomLevels } = photoViewer;
  if (!modal) return;

  const tree = state.registeredTrees.find(t => t.id === treeId);
  if (!tree || !tree.hasPhoto) {
    showToast("Foto não encontrada.", "error");
    return;
  }

  getImageFromDB(treeId, (imageBlob) => {
    if (!imageBlob) {
      showToast("Foto não encontrada no banco de dados.", "error");
      return;
    }

    const imgUrl = URL.createObjectURL(imageBlob);
    
    // Reseta o zoom e define o tamanho padrão
    photoViewer.zoomLevel = 0;
    dialog.style.width = `${zoomLevels[0]}px`;

    // Define o título
    title.textContent = `Foto: ID ${tree.id} (${tree.especie})`;

    // Define o conteúdo (imagem e botões)
    let photoHTML = `
      <img src="${imgUrl}" alt="Foto ID ${tree.id}" class="photo-viewer-img">
    `;
    if (!isTouchDevice) {
      photoHTML += `
        <div class="photo-viewer-zoom-controls">
          <button id="pv-zoom-out-btn" title="Diminuir Zoom">-</button>
          <button id="pv-zoom-in-btn" title="Aumentar Zoom">+</button>
        </div>
      `;
    }
    content.innerHTML = photoHTML;

    // Anexa listeners aos novos botões de zoom
    document.getElementById('pv-zoom-out-btn')?.addEventListener('click', () => _zoomPhotoViewer(-1));
    document.getElementById('pv-zoom-in-btn')?.addEventListener('click', () => _zoomPhotoViewer(1));
    
    // Revoga o ObjectURL quando a imagem é limpa (no hide)
    // (A lógica de 'hide' já limpa o innerHTML, o que destrói a tag img e revoga o blob)
    // Adicionamos um listener de segurança para o 'hide'
    const img = content.querySelector('img');
    if (img) {
      modal.addEventListener('transitionend', () => {
        // Garante que o blob seja revogado após a animação de 'fade-out'
        if (!modal.classList.contains('show')) {
          URL.revokeObjectURL(imgUrl);
        }
      }, { once: true });
    }
    
    // Mostra o modal
    modal.classList.add('show');
  });
}

/**
 * [NOVO v23.9] Inicializa os listeners do novo modal de foto.
 */
function _setupPhotoViewerModal() {
  photoViewer.modal = document.getElementById('photo-viewer-modal');
  photoViewer.dialog = document.getElementById('photo-viewer-dialog');
  photoViewer.title = document.getElementById('photo-viewer-title');
  photoViewer.content = document.getElementById('photo-viewer-content');
  photoViewer.closeBtn = document.getElementById('photo-viewer-close');

  if (!photoViewer.modal) return; // Se o HTML não foi adicionado

  photoViewer.closeBtn.addEventListener('click', _hidePhotoViewer);
  
  // Fecha ao clicar no overlay (fundo)
  photoViewer.modal.addEventListener('click', (e) => {
    if (e.target === photoViewer.modal) {
      _hidePhotoViewer();
    }
  });

  // Inicializa a lógica de arrastar (só desktop)
  _makeDraggable();
}


/**
 * (v23.9 - MODIFICADO) Anexa o listener de delegação de eventos da tabela.
 */
function _setupTableDelegation(summaryContainer, isTouchDevice) {
  if (!summaryContainer) return;
  
  renderSummaryTable(); // Renderiza a tabela inicial (O(N))

  // Anexa o listener de DELEGAÇÃO DE EVENTOS
  summaryContainer.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('.delete-tree-btn');
    const editButton = e.target.closest('.edit-tree-btn');
    const zoomButton = e.target.closest('.zoom-tree-btn');
    const sortButton = e.target.closest('th.sortable');
    const photoButton = e.target.closest('.photo-preview-btn');

    if (deleteButton) {
      const treeId = parseInt(deleteButton.dataset.id, 10);
      modalUI.showGenericModal({
        title: 'Excluir Registro',
        description: `Tem certeza que deseja excluir a Árvore ID ${treeId}?`,
        buttons: [
          { text: 'Sim, Excluir', class: 'primary', action: () => {
            if (features.handleDeleteTree(treeId)) removeTreeRow(treeId);
          }},
          { text: 'Cancelar', class: 'cancel' }
        ]
      });
    }
    
    if (editButton) {
      const treeData = features.handleEditTree(parseInt(editButton.dataset.id, 10));
      if (treeData) {
        _populateFormForEdit(treeData);
        _setFormMode('edit');
        showSubTab('tab-content-register');
        if (isTouchDevice) setupMobileChecklist();
        document.getElementById('risk-calculator-form').scrollIntoView({ behavior: 'smooth' });
      }
    }

    if (zoomButton) {
      features.handleZoomToPoint(parseInt(zoomButton.dataset.id, 10));
    }
    
    if (sortButton) {
      features.handleSort(sortButton.dataset.sortKey);
      renderSummaryTable();
    }

    // [MODIFICADO v23.9] Ação de Foto
    if (photoButton) {
      e.preventDefault();
      // Chama o novo visualizador de fotos
      _showPhotoViewer(parseInt(photoButton.dataset.id, 10));
    }
  });
}

/**
 * (v23.9 - MODIFICADO) Função "maestro" que inicializa a Calculadora.
 */
export function setupRiskCalculator() {
  
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // 1. Setup de Componentes Base
  _setupSubNavigation();
  _setupFileImporters();
  _setupPhotoViewerModal(); // [NOVO v23.9]

  // 2. Setup de Listeners
  _setupFormListeners(
    document.getElementById('risk-calculator-form'),
    isTouchDevice
  );
  _setupPhotoListeners();
  _setupCalculatorControls();

  // 3. Setup de Módulos Externos
  mapUI.setupMapListeners();

  // 4. Setup da Tabela
  _setupTableDelegation(
    document.getElementById('summary-table-container'),
    isTouchDevice
  );

  // 5. Setup Mobile
  if (isTouchDevice) {
    setupMobileChecklist();
  }
}

// #####################################################################
// ### FIM DA SEÇÃO DE REFATORAÇÃO (v23.9) ###
// #####################################################################


// === 5. LÓGICA DE TOOLTIPS (UI) ===
// [MODIFICADO v23.9] - Lógica de PhotoPreview (handlePhotoPreviewClick) removida.

/**
 * Cria ou obtém o elemento de tooltip.
 */
export function createTooltip() {
  let tooltip = document.getElementById('glossary-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'glossary-tooltip';
    document.body.appendChild(tooltip);
  }
  if (!tooltip.dataset.clickToCloseAdded) {
    tooltip.addEventListener(popupCloseEvent, (e) => { e.stopPropagation(); hideTooltip(); });
    tooltip.dataset.clickToCloseAdded = 'true';
  }
  state.setCurrentTooltip(tooltip);
  return tooltip;
}

/**
 * [MODIFICADO v23.8] Esconde o tooltip ativo e reseta a largura.
 */
export function hideTooltip() {
  if (state.currentTooltip) {
    const img = state.currentTooltip.querySelector('img');
    if (img && img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
    state.currentTooltip.style.opacity = '0';
    state.currentTooltip.style.visibility = 'hidden';
    state.currentTooltip.style.width = ''; // Reseta a largura
    delete state.currentTooltip.dataset.currentElement;
    state.setCurrentTooltip(null);
  }
}

/**
 * [v23.7] Agenda o fechamento do tooltip (para mouseleave)
 */
function scheduleHideTooltip() {
  clearTimeout(tooltipHideTimer);
  tooltipHideTimer = setTimeout(hideTooltip, 200);
}

/**
 * [v23.7] Cancela o fechamento do tooltip (para mouseenter)
 */
function cancelHideTooltip() {
  clearTimeout(tooltipHideTimer);
}

/**
 * Posiciona o tooltip em relação a um elemento.
 */
function positionTooltip(termElement) {
  if (!state.currentTooltip) return;
  const rect = termElement.getBoundingClientRect();
  const scrollY = window.scrollY, scrollX = window.scrollX;
  requestAnimationFrame(() => {
    if (!state.currentTooltip) return;
    const tooltipWidth = state.currentTooltip.offsetWidth;
    const tooltipHeight = state.currentTooltip.offsetHeight;
    let topPos = (rect.top > tooltipHeight + 10) ? (rect.top + scrollY - tooltipHeight - 10) : (rect.bottom + scrollY + 10);
    let leftPos = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
    if (leftPos < scrollX + 10) leftPos = scrollX + 10;
    if (leftPos + tooltipWidth > window.innerWidth + scrollX - 10) {
      leftPos = window.innerWidth + scrollX - tooltipWidth - 10;
    }
    state.currentTooltip.style.top = `${topPos}px`;
    state.currentTooltip.style.left = `${leftPos}px`;
  });
}

// [REMOVIDO v23.9] handlePhotoPreviewClick() foi substituído por _showPhotoViewer()
// [REMOVIDO v23.9] zoomTooltipImage() foi substituído por _zoomPhotoViewer()


// --- Funções de Setup de Tooltip (MODIFICADAS v23.7) ---

function setupGlossaryInteractions(detailView) {
  const glossaryTermsElements = detailView.querySelectorAll('.glossary-term');
  glossaryTermsElements.forEach(termElement => {
    if (!isTouchDevice) {
      termElement.addEventListener('mouseenter', showGlossaryTooltip);
      termElement.addEventListener('mouseleave', scheduleHideTooltip);
    }
    termElement.addEventListener(termClickEvent, toggleGlossaryTooltip);
  });
}

function showGlossaryTooltip(event) {
  cancelHideTooltip(); 
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
  const definition = glossaryTerms[termKey];
  if (!definition) return;
  const tooltip = createTooltip();
  
  // [MODIFICADO v23.8] Define uma largura padrão para tooltips de TEXTO
  tooltip.style.width = '350px'; 
  
  tooltip.innerHTML = `<strong>${termElement.textContent}</strong>: ${definition}`;
  positionTooltip(termElement);
  tooltip.style.opacity = '1';
  tooltip.style.visibility = 'visible';
  tooltip.dataset.currentElement = termElement.textContent;
}

function toggleGlossaryTooltip(event) {
  event.preventDefault(); event.stopPropagation();
  const tooltip = document.getElementById('glossary-tooltip');
  const isPhoto = tooltip && tooltip.dataset.currentElement && tooltip.dataset.currentElement.startsWith('photo-');
  if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto && tooltip.dataset.currentElement === event.currentTarget.textContent) {
    hideTooltip();
  } else {
    showGlossaryTooltip(event);
  }
}

function setupEquipmentInteractions(detailView) {
  const equipmentTermsElements = detailView.querySelectorAll('.equipment-term');
  equipmentTermsElements.forEach(termElement => {
    if (!isTouchDevice) {
      termElement.addEventListener('mouseenter', showEquipmentTooltip);
      termElement.addEventListener('mouseleave', scheduleHideTooltip);
    }
    termElement.addEventListener(termClickEvent, toggleEquipmentTooltip);
  });
}

function showEquipmentTooltip(event) {
  cancelHideTooltip(); 
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
  const data = equipmentData[termKey];
  if (!data) return;
  const tooltip = createTooltip();
  
  // [MODIFICADO v23.8] Define uma largura padrão para tooltips de EQUIPAMENTO
  tooltip.style.width = '350px';
  
  tooltip.innerHTML = `<strong>${termElement.textContent}</strong><p>${data.desc}</p>${imgTag(data.img, termElement.textContent)}`;
  positionTooltip(termElement);
  tooltip.style.opacity = '1';
  tooltip.style.visibility = 'visible';
  tooltip.dataset.currentElement = termElement.textContent;
}

function toggleEquipmentTooltip(event) {
  event.preventDefault(); event.stopPropagation();
  const tooltip = document.getElementById('glossary-tooltip');
  const isPhoto = tooltip && tooltip.dataset.currentElement && tooltip.dataset.currentElement.startsWith('photo-');
  if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto && tooltip.dataset.currentElement === event.currentTarget.textContent) {
    hideTooltip();
  } else {
    showEquipmentTooltip(event);
  }
}

function setupPurposeInteractions(detailView) {
  const purposeTermsElements = detailView.querySelectorAll('.purpose-term');
  purposeTermsElements.forEach(termElement => {
    if (!isTouchDevice) {
      termElement.addEventListener('mouseenter', showPurposeTooltip);
      termElement.addEventListener('mouseleave', scheduleHideTooltip);
    }
    termElement.addEventListener(termClickEvent, togglePurposeTooltip);
  });
}

function showPurposeTooltip(event) {
  cancelHideTooltip();
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
  const data = podaPurposeData[termKey];
  if (!data) return;
  const tooltip = createTooltip();
  
  // [MODIFICADO v23.8] Define uma largura padrão para tooltips de PROPÓSITO
  tooltip.style.width = '350px';
  
  tooltip.innerHTML = `<strong>${termElement.textContent}</strong><p>${data.desc}</p>${imgTag(data.img, termElement.textContent)}`;
  positionTooltip(termElement);
  tooltip.style.opacity = '1';
  tooltip.style.visibility = 'visible';
  tooltip.dataset.currentElement = termElement.textContent;
}

function togglePurposeTooltip(event) {
  event.preventDefault(); event.stopPropagation();
  const tooltip = document.getElementById('glossary-tooltip');
  const isPhoto = tooltip && tooltip.dataset.currentElement && tooltip.dataset.currentElement.startsWith('photo-');
  if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto && tooltip.dataset.currentElement === event.currentTarget.textContent) {
    hideTooltip();
  } else {
    showPurposeTooltip(event);
  }
}
