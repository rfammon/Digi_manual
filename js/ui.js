// js/ui.js (v23.14 - Correção de Erros de Sintaxe 'J', 'i f', 't ooltip')

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
// ### SEÇÃO SEGURA E DE PERFORMANCE (v23.5) ###
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
 * (v23.3) Helper privado que constrói um <tr> para uma árvore.
 */
function _createTreeRow(tree) {
  const row = document.createElement('tr');
  row.dataset.treeId = tree.id;
  const [y, m, d] = (tree.data || '---').split('-');
  const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
  const utmZone = `${tree.utmZoneNum || 'N/A'}${tree.utmZoneLetter || ''}`;
  row.appendChild(createSafeCell(tree.id));
  row.appendChild(createSafeCell(displayDate));
  row.appendChild(createSafeCell(tree.especie));
  const photoCell = document.createElement('td');
  photoCell.style.textAlign = 'center';
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
  row.appendChild(createSafeCell(tree.coordX));
  row.appendChild(createSafeCell(tree.coordY));
  row.appendChild(createSafeCell(utmZone));
  row.appendChild(createSafeCell(tree.dap));
  row.appendChild(createSafeCell(tree.local));
  row.appendChild(createSafeCell(tree.avaliador));
  row.appendChild(createSafeCell(tree.pontuacao));
  row.appendChild(createSafeCell(tree.risco, tree.riscoClass));
  row.appendChild(createSafeCell(tree.observacoes));
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
 * (v23.3) Renderiza a tabela de resumo de árvores (O(N)).
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
  const getThClass = (key) => {
    let classes = 'sortable';
    if (state.sortState.key === key) classes += state.sortState.direction === 'asc' ? ' sort-asc' : ' sort-desc';
    return classes;
  };
  const headers = [
    { key: 'id', text: 'ID' }, { key: 'data', text: 'Data' }, { key: 'especie', text: 'Espécie' },
    { key: null, text: 'Foto' }, { key: 'coordX', text: 'Coord. X' }, { key: 'coordY', text: 'Coord. Y' },
    { key: 'utmZoneNum', text: 'Zona UTM' }, { key: 'dap', text: 'DAP (cm)' }, { key: 'local', text: 'Local' },
    { key: 'avaliador', text: 'Avaliador' }, { key: 'pontuacao', text: 'Pontos' }, { key: 'risco', text: 'Risco' },
    { key: null, text: 'Observações' }, { key: null, text: 'Zoom', className: 'col-zoom' },
    { key: null, text: 'Editar', className: 'col-edit' }, { key: null, text: 'Excluir', className: 'col-delete' },
  ];
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header.text;
    if (header.key) {
      th.className = getThClass(header.key);
      th.dataset.sortKey = header.key;
    }
    if (header.className) th.classList.add(header.className);
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
      }
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
section: <\ctrl46>B.2.16 Constantes, Propriedades e Métodos Estáticos de String<\ctrl46>, page: <\ctrl46>1046<\ctrl46>
section: <\ctrl46>B.2.17 Propriedades da Instância de String<\ctrl46>, page: <\ctrl46>1046<\ctrl46>
section: <\ctrl46>B.2.18 Métodos da Instância de String<\ctrl46>, page: <\ctrl46>1046<\ctrl46>
section: <\ctrl46>B.2.19 Objeto Symbol<\ctrl46>, page: <\ctrl46>1047<\ctrl46>
section: <\ctrl46>B.2.20 O objeto Error<\ctrl46>, page: <\ctrl46>1047<\ctrl46>
section: <\ctrl46>B.2.21 O objeto JSON<\ctrl46>, page: <\ctrl46>1047<\ctrl46>
section: <\ctrl46>B.2.22 O objeto Math<\ctrl46>, page: <\ctrl46>1048<\ctrl46>
section: <\ctrl46>B.2.23 O objeto Date<\ctrl46>, page: <\ctrl46>1048<\ctrl46>
section: <\ctrl46>B.2.24 O objeto RegExp<\ctrl46>, page: <\ctrl46>1049<\ctrl46>
section: <\ctrl46>B.2.25 Arrays Tipados<\ctrl46>, page: <\ctrl46>1050<\ctrl46>
section: <\ctrl46>B.2.26 O objeto Intl<\ctrl46>, page: <\ctrl46>1050<\ctrl46>
section: <\ctrl46>B.2.27 O objeto Console<\ctrl46>, page: <\ctrl46>1050<\ctrl46>
section: <\ctrl46>B.2.28 URL APIs<\ctrl46>, page: <\ctrl46>1050<\ctrl46>
section: <\ctrl46>B.2.29 Timers<\ctrl46>, page: <\ctrl46>1051<\ctrl46>
section: <\ctrl46>Índice<\ctrl46>, page: <\ctrl46>1053<\ctrl46>
section: <\ctrl46>Colofão<\ctrl46>, page: <\ctrl46>1062<\ctrl46>
