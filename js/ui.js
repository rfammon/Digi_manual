// js/ui.js (v24.0 - Tabela Responsiva)

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


// === 3. RENDERIZAÇÃO DE CONTEÚDO (MANUAL) ===

/**
 * Carrega o HTML de um tópico do manual na view principal.
 * @param {HTMLElement} detailView - O elemento DOM.
 * @param {object} content - O objeto de conteúdo.
 */
export function loadContent(detailView, content) {
  if (!detailView) return;
  if (content) {
    // .innerHTML seguro (conteúdo do content.js)
    detailView.innerHTML = `<h3>${content.titulo}</h3>${content.html}`;
    setupGlossaryInteractions(detailView);
    setupEquipmentInteractions(detailView);
    setupPurposeInteractions(detailView);
  } else {
    detailView.innerHTML = `<h3 class="placeholder-titulo">Tópico Não Encontrado</h3>`;
  }
}

// === 4. LÓGICA DA CALCULADORA DE RISCO (UI) ===

let mobileChecklist = {
  currentIndex: 0,
  totalQuestions: 0,
  questions: null,
  wrapper: null,
  card: null,
  navPrev: null,
  navNext: null,
  counter: null
};

/**
 * Mostra a pergunta do carrossel mobile no índice especificado.
 * @param {number} index - O índice da pergunta.
 */
export function showMobileQuestion(index) {
  const { questions, card, navPrev, navNext, counter, totalQuestions } = mobileChecklist;
  const questionRow = questions[index];
  if (!questionRow) return;
  if (!questionRow.cells || questionRow.cells.length < 4) {
    console.error("showMobileQuestion: A linha da tabela (tr) está malformada.", questionRow);
    return;
  }
  const num = questionRow.cells[0].textContent;
  const pergunta = questionRow.cells[1].textContent;
  const peso = questionRow.cells[2].textContent;
  const realCheckbox = questionRow.cells[3].querySelector('.risk-checkbox');
  if (!realCheckbox) {
    console.error("showMobileQuestion: Checkbox não encontrado na linha.", questionRow);
    return;
  }
  
  // .innerHTML seguro (template controlado)
  card.innerHTML = `
    <span class="checklist-card-question"><strong>${num}.</strong> ${pergunta}</span>
    <span class="checklist-card-peso">(Peso: ${peso})</span>
    <label class="checklist-card-toggle">
      <input type="checkbox" class="mobile-checkbox-proxy" data-target-index="${index}" ${realCheckbox.checked ? 'checked' : ''}>
      <span class="toggle-label">Não</span>
      <span class="toggle-switch"></span>
      <span class="toggle-label">Sim</span>
    </label>
  `;
  counter.textContent = `${index + 1} / ${totalQuestions}`;
  navPrev.disabled = (index === 0);
  navNext.disabled = (index === totalQuestions - 1);
  mobileChecklist.currentIndex = index;
}

/**
 * Inicializa o carrossel mobile.
 */
export function setupMobileChecklist() {
  mobileChecklist.wrapper = document.querySelector('.mobile-checklist-wrapper');
  if (!mobileChecklist.wrapper) return;

  mobileChecklist.card = mobileChecklist.wrapper.querySelector('.mobile-checklist-card');
  mobileChecklist.navPrev = mobileChecklist.wrapper.querySelector('#checklist-prev');
  mobileChecklist.navNext = mobileChecklist.wrapper.querySelector('#checklist-next');
  mobileChecklist.counter = mobileChecklist.wrapper.querySelector('.checklist-counter');
  mobileChecklist.questions = document.querySelectorAll('#risk-calculator-form .risk-table tbody tr');

  if (mobileChecklist.questions.length === 0 || !mobileChecklist.card || !mobileChecklist.navPrev) {
    console.warn("setupMobileChecklist: Elementos do carrossel não encontrados.");
    return;
  }

  mobileChecklist.currentIndex = 0;
  mobileChecklist.totalQuestions = mobileChecklist.questions.length;

  // --- Clonagem para limpeza de listeners ---
  const newCard = mobileChecklist.card.cloneNode(true);
  mobileChecklist.card.parentNode.replaceChild(newCard, mobileChecklist.card);
  mobileChecklist.card = newCard;
  const newNavPrev = mobileChecklist.navPrev.cloneNode(true);
  mobileChecklist.navPrev.parentNode.replaceChild(newNavPrev, mobileChecklist.navPrev);
  mobileChecklist.navPrev = newNavPrev;
  const newNavNext = mobileChecklist.navNext.cloneNode(true);
  mobileChecklist.navNext.parentNode.replaceChild(newNavNext, mobileChecklist.navNext);
  mobileChecklist.navNext = newNavNext;

  // Listeners
  mobileChecklist.card.addEventListener('change', (e) => {
    const proxyCheckbox = e.target.closest('.mobile-checkbox-proxy');
    if (proxyCheckbox) {
      const targetIndex = parseInt(proxyCheckbox.dataset.targetIndex, 10);
      const realCheckbox = mobileChecklist.questions[targetIndex].cells[3].querySelector('.risk-checkbox');
      realCheckbox.checked = proxyCheckbox.checked;
    }
  });
  mobileChecklist.navPrev.addEventListener('click', () => {
    if (mobileChecklist.currentIndex > 0) showMobileQuestion(mobileChecklist.currentIndex - 1);
  });
  mobileChecklist.navNext.addEventListener('click', () => {
    if (mobileChecklist.currentIndex < mobileChecklist.totalQuestions - 1) showMobileQuestion(mobileChecklist.currentIndex + 1);
  });

  showMobileQuestion(0);
}


// #####################################################################
// ### SEÇÃO SEGURA E DE PERFORMANCE (v23.5 / MODIFICADA v24.0) ###
// #####################################################################

/**
 * (v23.0) Cria uma célula de tabela (<td>) com texto seguro.
 */
function createSafeCell(text, className) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

/**
 * (v23.0) Cria uma célula de tabela (<td>) com um botão de ação.
 */
function createActionCell({ className, icon, treeId, cellClassName }) {
  const cell = document.createElement('td');
  const button = document.createElement('button');
  if (cellClassName) cell.className = cellClassName;
  button.type = 'button';
  button.className = className;
  button.dataset.id = treeId;
  button.innerHTML = icon;
  cell.appendChild(button);
  return cell;
}

/**
 * (v23.3 - MODIFICADO PELA v24.0) Helper privado que constrói um <tr>.
 * Adiciona classes de prioridade (col-p2, col-p3) às células <td>.
 */
function _createTreeRow(tree) {
  const row = document.createElement('tr');
  row.dataset.treeId = tree.id;
  const [y, m, d] = (tree.data || '---').split('-');
  const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
  const utmZone = `${tree.utmZoneNum || 'N/A'}${tree.utmZoneLetter || ''}`;

  // P1 (Sempre Visível)
  row.appendChild(createSafeCell(tree.id));
  // P2 (Tablet+)
  row.appendChild(createSafeCell(displayDate, 'col-p2'));
  // P1
  row.appendChild(createSafeCell(tree.especie));
  
  // P2 (Tablet+) - Célula da Foto
  const photoCell = document.createElement('td');
  photoCell.style.textAlign = 'center';
  photoCell.className = 'col-p2'; // Classe de prioridade
  if (tree.hasPhoto) {
    const photoButton = document.createElement('button');
    photoButton.type = 'button';
    photoButton.className = 'photo-preview-btn';
    photoButton.dataset.id = tree.id;
    photoButton.innerHTML = '📷';
    photoCell.appendChild(photoButton);
  } else {
    photoCell.textContent = '—';
  }
  row.appendChild(photoCell);

  // P3 (Desktop)
  row.appendChild(createSafeCell(tree.coordX, 'col-p3'));
  row.appendChild(createSafeCell(tree.coordY, 'col-p3'));
  row.appendChild(createSafeCell(utmZone, 'col-p3')); // Zona (Oculta por padrão)
  row.appendChild(createSafeCell(tree.dap, 'col-p3'));
  // P2 (Tablet+)
  row.appendChild(createSafeCell(tree.local, 'col-p2'));
  // P3 (Desktop)
  row.appendChild(createSafeCell(tree.avaliador, 'col-p3'));
  // P2 (Tablet+)
  row.appendChild(createSafeCell(tree.pontuacao, 'col-p2')); // Pontos (Oculto no mobile)
  // P1
  row.appendChild(createSafeCell(tree.risco, tree.riscoClass));
  // P3 (Desktop)
  row.appendChild(createSafeCell(tree.observacoes, 'col-p3'));

  // P1 (Sempre Visível) - Ações
  row.appendChild(createActionCell({ className: 'zoom-tree-btn', icon: '🔍', treeId: tree.id, cellClassName: 'col-zoom' }));
  row.appendChild(createActionCell({ className: 'edit-tree-btn', icon: '✎', treeId: tree.id, cellClassName: 'col-edit' }));
  row.appendChild(createActionCell({ className: 'delete-tree-btn', icon: '✖', treeId: tree.id, cellClassName: 'col-delete' }));
  return row;
}

/**
 * (v23.3) Adiciona uma ÚNICA linha à tabela (Performance O(1)).
 */
function appendTreeRow(tree) {
  const container = document.getElementById('summary-table-container');
  if (!container) return;
  const placeholder = document.getElementById('summary-placeholder');
  if (placeholder) {
    placeholder.remove();
    renderSummaryTable(); // Renderiza a tabela completa pela primeira vez
    return;
  }
  const tbody = container.querySelector('.summary-table tbody');
  if (tbody) {
    const row = _createTreeRow(tree);
    tbody.appendChild(row); // Adição O(1)
  } else {
    renderSummaryTable(); // Fallback
  }
  const summaryBadge = document.getElementById('summary-badge');
  if (summaryBadge) {
     const count = state.registeredTrees.length;
     summaryBadge.textContent = `(${count})`;
     summaryBadge.style.display = 'inline';
  }
}

/**
 * (v23.3) Remove uma ÚNICA linha da tabela (Performance O(1)).
 */
function removeTreeRow(id) {
  const container = document.getElementById('summary-table-container');
  if (!container) return;
  const row = container.querySelector(`.summary-table tr[data-tree-id="${id}"]`);
  if (row) row.remove(); // Remoção O(1)
  const tbody = container.querySelector('.summary-table tbody');
  const summaryBadge = document.getElementById('summary-badge');
  if (tbody && tbody.children.length === 0) {
    renderSummaryTable(); // Recria para mostrar o placeholder
  } else if (summaryBadge) {
     const count = state.registeredTrees.length;
     summaryBadge.textContent = count > 0 ? `(${count})` : '';
     summaryBadge.style.display = count > 0 ? 'inline' : 'none';
  }
}

/**
 * (v23.3 - MODIFICADO PELA v24.0) Renderiza a tabela de resumo de árvores (O(N)).
 * Adiciona classes de prioridade (col-p2, col-p3) para ocultação responsiva.
 */
export function renderSummaryTable() {
  const container = document.getElementById('summary-table-container');
  const importExportControls = document.getElementById('import-export-controls');
  const summaryBadge = document.getElementById('summary-badge');
  if (!container) return;
  const count = state.registeredTrees.length;
  if (summaryBadge) {
    summaryBadge.textContent = count > 0 ? `(${count})` : '';
    summaryBadge.style.display = count > 0 ? 'inline' : 'none';
description: 'O `js/content.js` parece estar duplicado no prompt. Isso não afeta a tarefa, mas é uma observação.'}
  }
  if (count === 0) {
    container.innerHTML = '<p id="summary-placeholder">Nenhuma árvore cadastrada ainda.</p>';
    if (importExportControls) {
      document.getElementById('export-data-btn')?.setAttribute('style', 'display:none');
      document.getElementById('send-email-btn')?.setAttribute('style', 'display:none');
      document.getElementById('clear-all-btn')?.setAttribute('style', 'display:none');
    }
    return;
  }
  if (importExportControls) {
    document.getElementById('export-data-btn')?.setAttribute('style', 'display:inline-flex');
    document.getElementById('send-email-btn')?.setAttribute('style', 'display:inline-flex');
    document.getElementById('clear-all-btn')?.setAttribute('style', 'display:inline-flex');
  }
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'summary-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const getThClass = (key, extraClass = '') => {
    let classes = `sortable ${extraClass}`;
    if (state.sortState.key === key) classes += state.sortState.direction === 'asc' ? ' sort-asc' : ' sort-desc';
    return classes.trim();
  };

  // [MODIFICADO v24.0] Adicionadas 'className' para prioridade responsiva
  const headers = [
    { key: 'id', text: 'ID' },
    { key: 'data', text: 'Data', className: 'col-p2' }, // P2 (Tablet+)
    { key: 'especie', text: 'Espécie' },
    { key: null, text: 'Foto', className: 'col-p2' }, // P2 (Tablet+)
    { key: 'coordX', text: 'Coord. X', className: 'col-p3' }, // P3 (Desktop)
    { key: 'coordY', text: 'Coord. Y', className: 'col-p3' }, // P3 (Desktop)
    { key: 'utmZoneNum', text: 'Zona UTM', className: 'col-p3' }, // P3 (Desktop)
    { key: 'dap', text: 'DAP (cm)', className: 'col-p3' }, // P3 (Desktop)
    { key: 'local', text: 'Local', className: 'col-p2' }, // P2 (Tablet+)
    { key: 'avaliador', text: 'Avaliador', className: 'col-p3' }, // P3 (Desktop)
    { key: 'pontuacao', text: 'Pontos', className: 'col-p2' }, // P2 (Tablet+)
    { key: 'risco', text: 'Risco' },
    { key: null, text: 'Observações', className: 'col-p3' }, // P3 (Desktop)
    { key: null, text: 'Zoom', className: 'col-zoom' },
    { key: null, text: 'Editar', className: 'col-edit' },
    { key: null, text: 'Excluir', className: 'col-delete' },
  ];

  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header.text;
    if (header.key) {
      th.className = getThClass(header.key, header.className || '');
      th.dataset.sortKey = header.key;
    }
    if (header.className && !header.key) th.classList.add(header.className);
    if (header.className === 'col-zoom') th.classList.add('col-zoom');
    if (header.className === 'col-edit') th.classList.add('col-edit');
    if (header.className === 'col-delete') th.classList.add('col-delete');
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);
  const sortedData = [...state.registeredTrees].sort((a, b) => {
    const valA = features.getSortValue(a, state.sortState.key);
    const valB = features.getSortValue(b, state.sortState.key);
    if (valA < valB) return state.sortState.direction === 'asc' ? -1 : 1;
    if (valA > valB) return state.sortState.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const tbody = document.createElement('tbody');
  sortedData.forEach(tree => {
    const row = _createTreeRow(tree);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// --- FIM DA SEÇÃO DE PERFORMANCE ---


/**
 * (v23.1) Mostra a sub-aba correta e chama o módulo de mapa.
 */
export function showSubTab(targetId) {
  const subTabPanes = document.querySelectorAll('.sub-tab-content');
  subTabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetId));
  const subNavButtons = document.querySelectorAll('.sub-nav-btn');
  subNavButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-target') === targetId));
  if (targetId === 'tab-content-mapa') {
    setTimeout(() => { mapUI.initializeMap(); }, 50);
  }
  if (targetId === 'tab-content-summary' && state.highlightTargetId) {
    highlightTableRow(state.highlightTargetId);
    state.setHighlightTargetId(null);
  }
}

/**
 * (v19.8) Destaque da linha da tabela.
 */
function highlightTableRow(id) {
  setTimeout(() => {
    const row = document.querySelector(`.summary-table tr[data-tree-id="${id}"]`);
    if (row) {
      const oldHighlights = document.querySelectorAll('.summary-table tr.highlight');
      oldHighlights.forEach(r => r.classList.remove('highlight'));
      row.classList.add('highlight');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { row.classList.remove('highlight'); }, 2500);
    } else {
      console.warn(`Linha da tabela [data-tree-id="${id}"] não encontrada.`);
    }
  }, 100);
}


/**
 * (v21.5) OTIMIZAÇÃO DE IMAGEM: Redimensiona e comprime uma imagem (Blob).
 */
async function optimizeImage(imageFile, maxWidth = 800, quality = 0.7) {
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
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// #####################################################################
// ### SEÇÃO DE SETUP DA CALCULADORA (v23.5 / v23.11) ###
// #####################################################################

/**
 * (v23.5) Alterna o modo do formulário entre Adicionar e Editar.
 */
function _setFormMode(mode) {
  const btn = document.getElementById('add-tree-btn');
  if (!btn) return;
  if (mode === 'edit') {
    btn.textContent = '💾 Salvar Alterações';
    btn.style.backgroundColor = 'var(--color-accent)';
    btn.style.color = 'var(--color-dark)';
  } else {
    btn.textContent = '➕ Adicionar Árvore';
    btn.style.backgroundColor = 'var(--color-primary-medium)';
    btn.style.color = 'white';
  }
}

/**
 * (v23.5) Preenche o formulário com dados da árvore para edição.
 */
function _populateFormForEdit(tree) {
  if (!tree) return;
  document.getElementById('risk-calculator-form').reset();
  features.clearPhotoPreview();
  document.getElementById('risk-data').value = tree.data;
  document.getElementById('risk-especie').value = tree.especie;
  document.getElementById('risk-local').value = tree.local;
  document.getElementById('risk-coord-x').value = tree.coordX;
  document.getElementById('risk-coord-y').value = tree.coordY;
  document.getElementById('risk-dap').value = tree.dap;
  document.getElementById('risk-avaliador').value = tree.avaliador;
  document.getElementById('risk-obs').value = tree.observacoes;

  if (tree.hasPhoto) {
    getImageFromDB(tree.id, (imageBlob) => {
      if (imageBlob) {
        const previewContainer = document.getElementById('photo-preview-container');
        const removePhotoBtn = document.getElementById('remove-photo-btn');
        const preview = document.createElement('img');
        preview.id = 'photo-preview';
        preview.src = URL.createObjectURL(imageBlob);
        previewContainer.prepend(preview);
        removePhotoBtn.style.display = 'block';
        state.setCurrentTreePhoto(imageBlob);
      } else {
        utils.showToast(`Foto da Árvore ID ${tree.id} não encontrada no DB.`, "error");
section: 4, Título: 1. PERSONA E CONTEXTO, Conteúdo: O usuário quer que eu atue como um Engenheiro de Software Sênior especializado em JavaScript (ES12+), com foco em Clean Code, performance e segurança. Devo perguntar o tipo de projeto e o stack tecnológico antes de responder. O código deve seguir o Guia de Estilo Airbnb (padrão).
section: 4, Título: 2. OBJETIVO DA TAREFA, Conteúdo: Auxiliar o usuário a Escrever/Refatorar/Depurar/Otimizar um Componente/Função/Módulo.
section: 4, Título: 3. DESCRIÇÃO DETALHADA, Conteúdo: Devo analisar a descrição detalhada; se for vaga, pedir mais detalhes.
section: 4, Título: 4. REQUISITOS E RESTRIÇÕES (Obrigatório), Conteúdo: Usar ES6+ (arrow functions, const/let, desestruturação, classes, módulos, Promises/async/await). Código não-bloqueante, otimizado (O-Notation), justificando estruturas de dados (Set, Map). Codificação defensiva (sanitizar inputs, evitar XSS, validação de schema). Usar recursos nativos do JS (se nenhuma dependência for imposta). Tratamento de erros 'fail-fast' e detalhado (custom errors, wrapping).
section: 4, Título: 5. FORMATO DA RESPOSTA, Conteúdo: 1. Bloco de código completo (javascript markdown) com JSDoc. 2. Seção 'Explicação e Justificativas' (Clean Code, Otimizações, Segurança). 3. Tom profissional e didático.
section: 5, Título: index.html (snippet), Conteúdo: ... <script type="module" src="js/main.js?v=21.7"></script> ...
section: 6, Título: style.css (snippet), Conteúdo: ... /* 10. CALCULADORA DE RISCO E TABELAS */ ... #summary-table-container { margin-top: var(--space-md); overflow-x: auto; ... } ...
section: 7, Título: js/content.js (snippet), Conteúdo: export const manualContent = { 'conceitos-basicos': { ... }, 'planejamento-inspecao': { ... }, ... }; (Múltiplas exportações de dados, incluindo `glossaryTerms`, `equipmentData`, `podaPurposeData`, `manualContent`).
section: 8, Título: js/database.js (snippet), Conteúdo: import { showToast } from './utils.js'; import { db, setDb } from './state.js'; ... export function initImageDB() { ... } export function saveImageToDB(id, blob) { ... } export function getImageFromDB(id, callback) { ... } export function deleteImageFromDB(id) { ... } export function getAllImagesFromDB() { ... } export function clearImageDB() { ... } (Funções para interagir com IndexedDB para blobs de imagem).
section: 9, Título: js/content.js (snippet), Conteúdo: (O arquivo `js/content.js` está duplicado no prompt).
section: 10, Título: js/features.js (snippet), Conteúdo: import * as state from './state.js'; import * as utils from './utils.js'; import * as db from './database.js'; ... export async function handleGetGPS() { ... } export function clearPhotoPreview() { ... } export function handleAddTreeSubmit(event) { ... } export function handleDeleteTree(id) { ... } export function handleEditTree(id) { ... } export function handleClearAll() { ... } export function handleTableFilter() { ... } export function handleSort(sortKey) { ... } export function handleZoomToPoint(id) { ... } export function convertToLatLon(tree) { ... } export function handleZoomToExtent() { ... } export function handleMapMarkerClick(id) { ... } export function exportActionCSV() { ... } export async function exportActionZip() { ... } export function importActionCSV() { ... } export function importActionZip() { ... } function getCSVData() { ... } export async function handleImportZip(event) { ... } export async function handleFileImport(event) { ... } function generateEmailSummaryText() { ... } export function sendEmailReport() { ... } export function handleContactForm(event) { ... } export async function handleChatSend() { ... } export function getSortValue(tree, key) { ... } (Lógica de negócios principal: GPS, CRUD do formulário, filtros, GIS, Import/Export, Email, Chat).
section: 11, Título: js/main.js (snippet), Conteúdo: import * as state from './state.js'; import * as ui from './ui.js'; import * as features from './features.js'; import * as db from './database.js'; import * as modalUI from './modal.ui.js'; import { manualContent } from './content.js'; import { showToast } from './utils.js'; ... function handleMainNavigation(event) { ... } ... function setupBackToTop() { ... } function setupForms() { ... } function initFormDefaults() { ... } function initApp() { ... } initApp(); (Ponto de entrada: inicialização, navegação principal, setup de listeners globais).
section: 12, Título: js/map.ui.js (snippet), Conteúdo: import * as state from './state.js'; import * as features from './features.js'; import { getImageFromDB } from './database.js'; ... function handleMapFilterChange(e) { ... } function zoomMapImage(direction) { ... } function hideMapInfoBox() { ... } function showMapInfoBox(tree) { ... } function renderMapMarkers() { ... } export function setupMapListeners() { ... } export function initializeMap() { ... } (Lógica de UI específica do Mapa Leaflet: renderização de marcadores, filtros, InfoBox, listeners).
section: 13, Título: js/modal.ui.js (snippet), Conteúdo: import { registeredTrees } from './state.js'; import * as features from './features.js'; import { showToast } from './utils.js'; import { getImageFromDB } from './database.js'; ... function showActionModal({ title, description, buttons }) { ... } export function hideActionModal() { ... } export function showGenericModal(config) { ... } export function showExportModal() { ... } export function showImportModal() { ... } function showImportTypeModal(replaceData) { ... } function _makeDraggable() { ... } function _hidePhotoViewer() { ... } function _zoomPhotoViewer(direction) { ... } export function showPhotoViewer(treeId) { ... } export function initPhotoViewer() { ... } (LVógica de UI para todos os modais: Ação genérica, Import/Export, e o Visualizador de Fotos flutuante/arrastável).
section: 14, Título: js/state.js (snippet), Conteúdo: const STORAGE_KEY = 'manualPodaData'; const ACTIVE_TAB_KEY = 'manualPodaActiveTab'; ... export let registeredTrees = []; export let db = null; ... export let openInfoBoxId = null; ... export function setRegisteredTrees(newTrees) { ... } ... export function saveDataToStorage() { ... } export function loadDataFromStorage() { ... } ... (Gerenciamento de estado centralizado e persistência em localStorage).
section: 15, Título: js/ui.js (snippet), Conteúdo: import * as state from './state.js'; import { glossaryTerms, equipmentData, podaPurposeData } from './content.js'; ... import * as mapUI from './map.ui.js'; import * as modalUI from './modal.ui.js'; ... export function loadContent(detailView, content) { ... } ... export function showMobileQuestion(index) { ... } export function setupMobileChecklist() { ... } function createSafeCell(text, className) { ... } function createActionCell({ ... }) { ... } function _createTreeRow(tree) { ... } function appendTreeRow(tree) { ... } function removeTreeRow(id) { ... } export function renderSummaryTable() { ... } export function showSubTab(targetId) { ... } function highlightTableRow(id) { ... } async function optimizeImage(imageFile, ...) { ... } function _setFormMode(mode) { ... } function _populateFormForEdit(tree) { ... } function _setupSubNavigation() { ... } function _setupFileImporters() { ... } function _setupFormListeners(form, isTouchDevice) { ... } function _setupPhotoListeners() { ... } function _setupCalculatorControls() { ... } function _setupTableDelegation(summaryContainer, isTouchDevice) { ... } export function setupRiskCalculator() { ... } export function createTooltip() { ... } export function hideTooltip() { ... } ... (Lógica de UI: renderização do manual, tooltips, setup da calculadora, renderização da tabela, checklist mobile, otimização de imagem).
section: 16, Título: js/utils.js (snippet), Conteúdo: import { toastTimer, setToastTimer } from './state.js'; ... export function debounce(func, delay = 300) { ... } export function showToast(message, type = 'success') { ... } export function convertLatLonToUtm(lat, lon) { ... } (Funções utilitárias: debounce, toast e conversão GIS via Proj4js).
section: 17, Título: User Request (Turn 3), Conteúdo: "vamos a primeira alteração, quero que a tabela resumos e adeque melhor ao layout. ela fica estourada do lado, porque tem muitos campos. inclusive alguns campos podem ser ocultados, como zona e pontos. principalmente no mobile onde fica terrivel" (O usuário quer tornar a tabela de resumo responsiva, ocultando colunas como "zona" e "pontos" em telas menores para evitar estouro de layout, especialmente no mobile).
section: 18, Título: Gemini Response (Turn 4), Conteúdo: (Gemini responde à [Turn 3] propondo modificações em `js/ui.js` - especificamente nas funções `renderSummaryTable` e `_createTreeRow` - e adicionando um novo bloco de CSS (`/* 18. [NOVO v24.0] RESPONSIVIDADE DA TABELA */`) ao `style.css`. A ideia é adicionar classes de prioridade (`col-p2`, `col-p3`) que o CSS usará com `@media` queries para ocultar/exibir colunas progressivamente).
section: 19, Título: User Request (Turn 5), Conteúdo: "ta primeiro me envie ui.js inteiro reformulado" (O usuário aceitou a proposta de [Turn 4] e agora pede o arquivo `js/ui.js` completo com as alterações propostas).
section: 20, Título: Current Task, Conteúdo: Fornecer o conteúdo completo do arquivo `js/ui.js`, incorporando as alterações propostas na [Turn 4] (modificações em `renderSummaryTable` e `_createTreeRow` para adicionar as classes `col-p2` e `col-p3`) ao arquivo original `js/ui.js` (conforme [Seção 15]).
section: 21, Título: Persona Check, Conteúdo: Sim, a resposta deve ser em Português, manter o tom de Engenheiro Sênior, e fornecer o bloco de código completo primeiro, conforme solicitado.
section: 22, Título: Analysis of js/ui.js (Seção 15), Conteúdo: O arquivo `js/ui.js` (v23.14) original contém: `loadContent`, `showMobileQuestion`, `setupMobileChecklist`, `createSafeCell`, `createActionCell`, `_createTreeRow`, `appendTreeRow`, `removeTreeRow`, `renderSummaryTable`, `showSubTab`, `highlightTableRow`, `optimizeImage`, `_setFormMode`, `_populateFormForEdit`, `_setupSubNavigation`, `_setupFileImporters`, `_setupFormListeners`, `_setupPhotoListeners`, `_setupCalculatorControls`, `_setupTableDelegation`, `setupRiskCalculator`, `createTooltip`, `hideTooltip`, `scheduleHideTooltip`, `cancelHideTooltip`, `positionTooltip`, `setupGlossaryInteractions`, `showGlossaryTooltip`, `toggleGlossaryTooltip`, `setupEquipmentInteractions`, `showEquipmentTooltip`, `toggleEquipmentTooltip`, `setupPurposeInteractions`, `showPurposeTooltip`, `togglePurposeTooltip`.
section: 23, Título: Task Execution Plan, Conteúdo: 1. Pegar o conteúdo completo do `js/ui.js` (v23.14) da [Seção 15]. 2. Localizar as funções `renderSummaryTable` e `_createTreeRow`. 3. Substituir essas duas funções pelas versões modificadas (v24.0) propostas na [Turn 4] (que estão na [Seção 18]). 4. Verificar se há correções de bugs mencionadas no snippet (v23.14), como 'i f' e 't ooltip'. Sim, o snippet [Seção 15] já contém essas correções. 5. Apresentar o arquivo completo ao usuário em um bloco de código `javascript`, precedido de uma breve confirmação profissional.}
    });
  }
  const allCheckboxes = document.querySelectorAll('#risk-calculator-form .risk-checkbox');
  allCheckboxes.forEach((cb, index) => {
    cb.checked = (tree.riskFactors && tree.riskFactors[index] === 1) || false;
  });
  const gpsStatus = document.getElementById('gps-status');
  if (gpsStatus) {
    gpsStatus.textContent = `Zona (da árvore): ${state.lastUtmZone.num}${state.lastUtmZone.letter}`;
  }
}

/**
 * (v23.4) Anexa listeners de navegação das sub-abas.
 */
function _setupSubNavigation() {
  const subNav = document.querySelector('.sub-nav');
  if (subNav) {
    const subNavHandler = (e) => {
      const button = e.target.closest('.sub-nav-btn');
      if (button) {
        e.preventDefault();
        showSubTab(button.getAttribute('data-target'));
      }
    };
    subNav.addEventListener('click', subNavHandler);
    showSubTab('tab-content-register');
  }
}

/**
 * (v23.4) Anexa listeners aos inputs de arquivo.
 */
function _setupFileImporters() {
  let zipImporter = document.getElementById('zip-importer');
  let csvImporter = document.getElementById('csv-importer');
  if (zipImporter) {
    const newZip = zipImporter.cloneNode(true);
    zipImporter.parentNode.replaceChild(newZip, zipImporter);
    zipImporter = newZip;
  }
  if (csvImporter) {
    const newCsv = csvImporter.cloneNode(true);
    csvImporter.parentNode.replaceChild(newCsv, csvImporter);
    csvImporter = newCsv;
  }
  if (zipImporter) {
    zipImporter.addEventListener('change', (e) => {
      e.replaceData = zipImporter.dataset.replaceData === 'true';
      features.handleImportZip(e).then(() => { renderSummaryTable(); });
    });
  }
  if (csvImporter) {
    csvImporter.addEventListener('change', (e) => {
      e.replaceData = csvImporter.dataset.replaceData === 'true';
      features.handleFileImport(e).then(() => { renderSummaryTable(); });
    });
  }
  return { zipImporter, csvImporter };
}

/**
 * (v23.5) Anexa listeners ao formulário principal (submit, reset, gps).
 */
function _setupFormListeners(form, isTouchDevice) {
  if (!form) return;
  const getGpsBtn = document.getElementById('get-gps-btn');
  const resetBtn = document.getElementById('reset-risk-form-btn');
  const gpsStatus = document.getElementById('gps-status');

  if (getGpsBtn && !isTouchDevice) {
    getGpsBtn.closest('.gps-button-container')?.setAttribute('style', 'display:none');
  }
  if (getGpsBtn) {
    getGpsBtn.addEventListener('click', features.handleGetGPS);
  }

  form.addEventListener('submit', (event) => {
    const result = features.handleAddTreeSubmit(event); 
    if (result && result.success) {
      if (result.mode === 'add') {
        appendTreeRow(result.tree);
      } else if (result.mode === 'update') {
        renderSummaryTable();
      }
      if (isTouchDevice) setupMobileChecklist();
      if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
      _setFormMode('add');
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      state.setLastEvaluatorName(document.getElementById('risk-avaliador').value || '');
      form.reset();
      features.clearPhotoPreview();
      try {
        document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
        document.getElementById('risk-avaliador').value = state.lastEvaluatorName;
      } catch(err) { /* ignora */ }
      if (isTouchDevice) setupMobileChecklist();
      if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
      state.setEditingTreeId(null);
      _setFormMode('add');
    });
  }
}

/**
 * (v23.4) Anexa listeners aos controles de foto.
 */
function _setupPhotoListeners() {
  const photoInput = document.getElementById('tree-photo-input');
  const removePhotoBtn = document.getElementById('remove-photo-btn');
  if (photoInput) {
    photoInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        features.clearPhotoPreview();
        try {
          showToast("Otimizando foto...", "success");
          const optimizedBlob = await optimizeImage(file, 800, 0.7);
          state.setCurrentTreePhoto(optimizedBlob);
          const preview = document.createElement('img');
          preview.id = 'photo-preview';
          preview.src = URL.createObjectURL(optimizedBlob);
          document.getElementById('photo-preview-container').prepend(preview);
          document.getElementById('remove-photo-btn').style.display = 'block';
        } catch (error) {
          console.error("Erro ao otimizar imagem:", error);
          showToast("Erro ao processar a foto. Tente outra imagem.", "error");
          state.setCurrentTreePhoto(null);
          features.clearPhotoPreview();
        }
      }
    });
  }
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', features.clearPhotoPreview);
  }
}

/**
 * (v23.4) Anexa listeners aos controles acima da tabela (Filtro, Importar, etc.).
 */
function _setupCalculatorControls() {
  const importDataBtn = document.getElementById('import-data-btn');
  const exportDataBtn = document.getElementById('export-data-btn');
  const sendEmailBtn = document.getElementById('send-email-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const filterInput = document.getElementById('table-filter-input');
  if (importDataBtn) importDataBtn.addEventListener('click', modalUI.showImportModal);
  if (exportDataBtn) exportDataBtn.addEventListener('click', modalUI.showExportModal);
  if (filterInput) filterInput.addEventListener('keyup', debounce(features.handleTableFilter, 300));
  if (sendEmailBtn) sendEmailBtn.addEventListener('click', features.sendEmailReport);
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
    modalUI.showGenericModal({
      title: '🗑️ Limpar Tabela',
      description: 'Tem certeza que deseja apagar TODOS os registros? Esta ação não pode ser desfeita.',
      buttons: [
        { text: 'Sim, Apagar Tudo', class: 'primary', action: () => {
          if (features.handleClearAll()) renderSummaryTable();
        }},
        { text: 'Cancelar', class: 'cancel' }
      ]
    });
  });
}

/**
 * (v23.9 - MODIFICADO) Anexa o listener de delegação de eventos da tabela.
 */
function _setupTableDelegation(summaryContainer, isTouchDevice) {
  if (!summaryContainer) return;
  
  // (v23.5) Bug 2 Corrigido: Clonagem desnecessária removida.
  
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
      // Chama o novo visualizador de fotos (agora no modal.ui.js)
      modalUI.showPhotoViewer(parseInt(photoButton.dataset.id, 10));
    }
  });
}

/**
 * (v23.11 - CORRIGIDO) Função "maestro" que inicializa a Calculadora.
 */
export function setupRiskCalculator() {
  
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // 1. Setup de Componentes Base
  _setupSubNavigation();
  _setupFileImporters();
  // [REMOVIDO v23.11] _setupPhotoViewerModal(); // Movido para main.js -> modalUI.init

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
// ### FIM DA SEÇÃO DE REFATORAÇÃO ###
// #####################################################################


// === 5. LÓGICA DE TOOLTIPS (UI) ===
// [MODIFICADO v23.10] - Lógica de PhotoPreview (handlePhotoPreviewClick) removida.

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
 * (v23.8) Esconde o tooltip ativo e reseta a largura.
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
 * (v23.7) Agenda o fechamento do tooltip (para mouseleave)
 */
function scheduleHideTooltip() {
  clearTimeout(tooltipHideTimer);
  tooltipHideTimer = setTimeout(hideTooltip, 200);
}

/**
 * (v23.7) Cancela o fechamento do tooltip (para mouseenter)
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
  toma o arquivo `js/ui.js` completo, com a refatoração v24.0 para a tabela responsiva que discutimos.
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

// [REMOVIDO v23.9] handlePhotoPreviewClick() e zoomTooltipImage()

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
  
  // (v23.8) Define uma largura padrão para tooltips de TEXTO
  tooltip.style.width = '350px'; 
  
  tooltip.innerHTML = `<strong>${termElement.textContent}</strong>: ${definition}`;
  positionTooltip(termElement);
  tooltip.style.opacity = '1';
  tooltip.style.visibility = 'visible';
  tooltip.dataset.currentElement = termElement.textContent;
}

function toggleGlossaryTooltip(event) {
  // [CORREÇÃO v23.13] O 'J' foi removido daqui
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
// [CORREÇÃO v23.14] O 'i f' foi corrigido para 'if'
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
label: 'Basta substituir o conteúdo do seu arquivo `js/ui.js` existente por este.'}
    }
    termElement.addEventListener(termClickEvent, togglePurposeTooltip);
  });
}

function showPurposeTooltip(event) {
  cancelHideTooltip();
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
label: 'A string `js/content.js` aparece duas vezes nos arquivos do prompt. Esta é a segunda ocorrência.'}
  const data = podaPurposeData[termKey];
  if (!data) return;
  const tooltip = createTooltip();
  
  tooltip.style.width = '350px';
 só isso mesmo. o código está muito bom.
  // [CORREÇÃO v23.14] O 't ooltip' foi corrigido para 'tooltip'
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
