// js/ui.js (v23.3 - Otimização de Performance O(1))

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import { glossaryTerms, equipmentData, podaPurposeData } from './content.js';
import { showToast, debounce } from './utils.js';
import { getImageFromDB } from './database.js';
import * as features from './features.js';
import * as mapUI from './map.ui.js';
import * as modalUI from './modal.ui.js';

// Helper local para o conteúdo do manual
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

// Variáveis de escopo do módulo para detecção de toque
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const termClickEvent = isTouchDevice ? 'touchend' : 'click';
const popupCloseEvent = isTouchDevice ? 'touchend' : 'click';


// === 2. RENDERIZAÇÃO DE CONTEÚDO (MANUAL) ===

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

// === 3. LÓGICA DA CALCULADORA DE RISCO (UI) ===

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
// ### INÍCIO DA SEÇÃO SEGURA E DE PERFORMANCE (v23.3) ###
// #####################################################################

/**
 * (v23.0) Cria uma célula de tabela (<td>) com texto seguro.
 * @param {string | number} text - O conteúdo de texto para a célula.
 * @param {string} [className] - Uma classe CSS opcional para a célula.
 * @returns {HTMLTableCellElement}
 */
function createSafeCell(text, className) {
  const cell = document.createElement('td');
  // textContent automaticamente sanitiza a entrada, prevenindo XSS.
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
}

/**
 * (v23.0) Cria uma célula de tabela (<td>) com um botão de ação.
 * @param {object} config - Configuração do botão.
 * @returns {HTMLTableCellElement}
 */
function createActionCell({ className, icon, treeId, cellClassName }) {
  const cell = document.createElement('td');
  const button = document.createElement('button');
  if (cellClassName) cell.className = cellClassName;
  button.type = 'button';
  button.className = className;
  button.dataset.id = treeId;
  button.innerHTML = icon; // Ícones são HTML seguro (controlado por nós)
  cell.appendChild(button);
  return cell;
}

/**
 * [NOVO v23.3] Helper privado que constrói um <tr> para uma árvore.
 * (Usado por renderSummaryTable e appendTreeRow para evitar repetição de código - DRY)
 * @param {object} tree - O objeto da árvore.
 * @returns {HTMLTableRowElement} O elemento <tr>.
 */
function _createTreeRow(tree) {
  const row = document.createElement('tr');
  row.dataset.treeId = tree.id;

  // Formata dados
  const [y, m, d] = (tree.data || '---').split('-');
  const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
  const utmZone = `${tree.utmZoneNum || 'N/A'}${tree.utmZoneLetter || ''}`;

  // --- Células de Dados (Seguras) ---
  row.appendChild(createSafeCell(tree.id));
  row.appendChild(createSafeCell(displayDate));
  row.appendChild(createSafeCell(tree.especie)); // <-- XSS PREVENIDO
  
  // Célula de Foto (Botão)
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
  row.appendChild(createSafeCell(tree.local)); // <-- XSS PREVENIDO
  row.appendChild(createSafeCell(tree.avaliador)); // <-- XSS PREVENIDO
  row.appendChild(createSafeCell(tree.pontuacao));
  row.appendChild(createSafeCell(tree.risco, tree.riscoClass));
  row.appendChild(createSafeCell(tree.observacoes)); // <-- XSS PREVENIDO

  // --- Células de Ação (Seguras) ---
  row.appendChild(createActionCell({ className: 'zoom-tree-btn', icon: '🔍', treeId: tree.id, cellClassName: 'col-zoom' }));
  row.appendChild(createActionCell({ className: 'edit-tree-btn', icon: '✎', treeId: tree.id, cellClassName: 'col-edit' }));
  row.appendChild(createActionCell({ className: 'delete-tree-btn', icon: '✖', treeId: tree.id, cellClassName: 'col-delete' }));

  return row;
}

/**
 * [NOVO v23.3] Adiciona uma ÚNICA linha à tabela (Performance O(1)).
 * Usado ao adicionar uma nova árvore via formulário.
 * @param {object} tree - O objeto da árvore a ser adicionado.
 */
function appendTreeRow(tree) {
  const container = document.getElementById('summary-table-container');
  if (!container) return;

  // 1. Remove o placeholder se ele existir
  const placeholder = document.getElementById('summary-placeholder');
  if (placeholder) {
    placeholder.remove();
    // Se era o placeholder, a tabela não existe, então renderiza a tabela completa.
    // Esta é uma "saída de emergência" para o primeiro item.
    renderSummaryTable();
    return;
  }

  // 2. Se a tabela já existe, apenas anexa a nova linha
  const tbody = container.querySelector('.summary-table tbody');
  if (tbody) {
    const row = _createTreeRow(tree);
    tbody.appendChild(row); // Operação O(1)
  } else {
    // Fallback: se o tbody não for encontrado, renderiza tudo
    renderSummaryTable();
  }
  
  // 3. Atualiza o badge
  const summaryBadge = document.getElementById('summary-badge');
  if (summaryBadge) {
     const count = state.registeredTrees.length;
     summaryBadge.textContent = `(${count})`;
     summaryBadge.style.display = 'inline';
  }
}

/**
 * [NOVO v23.3] Remove uma ÚNICA linha da tabela (Performance O(1)).
 * Usado ao deletar uma árvore.
 * @param {number} id - O ID da árvore a ser removida.
 */
function removeTreeRow(id) {
  const container = document.getElementById('summary-table-container');
  if (!container) return;

  const row = container.querySelector(`.summary-table tr[data-tree-id="${id}"]`);
  if (row) {
    row.remove(); // Operação O(1)
  }

  // 3. Verifica se a tabela está vazia para adicionar o placeholder
  const tbody = container.querySelector('.summary-table tbody');
  const summaryBadge = document.getElementById('summary-badge');
  
  if (tbody && tbody.children.length === 0) {
    // Se ficou vazia, renderiza do zero (para mostrar o placeholder)
    renderSummaryTable();
  } else if (summaryBadge) {
     // Apenas atualiza o badge
     const count = state.registeredTrees.length;
     summaryBadge.textContent = count > 0 ? `(${count})` : '';
     summaryBadge.style.display = count > 0 ? 'inline' : 'none';
  }
}

/**
 * (v23.3 - Otimizado) Renderiza a tabela de resumo de árvores.
 * Esta função agora é O(N) e só deve ser usada para carga inicial, ordenação,
 * edição, importação ou limpeza completa.
 */
export function renderSummaryTable() {
  const container = document.getElementById('summary-table-container');
  const importExportControls = document.getElementById('import-export-controls');
  const summaryBadge = document.getElementById('summary-badge');
  if (!container) return;

  // 1. Atualiza Badge
  const count = state.registeredTrees.length;
  if (summaryBadge) {
    summaryBadge.textContent = count > 0 ? `(${count})` : '';
    summaryBadge.style.display = count > 0 ? 'inline' : 'none';
  }

  // 2. Lógica de Placeholder/Botões
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

  // 3. Limpa o container
  container.innerHTML = '';

  // 4. Criação Segura da Tabela
  const table = document.createElement('table');
  table.className = 'summary-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const getThClass = (key) => {
    let classes = 'sortable';
    if (state.sortState.key === key) {
      classes += state.sortState.direction === 'asc' ? ' sort-asc' : ' sort-desc';
    }
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

  // 4b. Ordena os Dados
  const sortedData = [...state.registeredTrees].sort((a, b) => {
    const valA = features.getSortValue(a, state.sortState.key);
    const valB = features.getSortValue(b, state.sortState.key);
    if (valA < valB) return state.sortState.direction === 'asc' ? -1 : 1;
    if (valA > valB) return state.sortState.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // 4c. Cria o Corpo (TBODY)
  const tbody = document.createElement('tbody');
  
  // [MODIFICADO v23.3] Usa o helper _createTreeRow
  sortedData.forEach(tree => {
    const row = _createTreeRow(tree);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  
  // 5. Adiciona a tabela ao container
  container.appendChild(table);
}

// #####################################################################
// ### FIM DA SEÇÃO DE PERFORMANCE (v23.3) ###
// #####################################################################


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
 * (v20.0) Garante que os inputs de arquivo sejam limpos de listeners antigos.
 */
function setupFileImporters() {
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
      // (v23.3) Deve fazer renderização completa após importação
      features.handleImportZip(e).then(() => { renderSummaryTable(); });
    });
  }
  if (csvImporter) {
    csvImporter.addEventListener('change', (e) => {
      e.replaceData = csvImporter.dataset.replaceData === 'true';
      // (v23.3) Deve fazer renderização completa após importação
      features.handleFileImport(e).then(() => { renderSummaryTable(); });
    });
  }
  return { zipImporter, csvImporter };
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


/**
 * (v23.3 - MODIFICADO) Função principal que inicializa todos os listeners da Calculadora.
 */
export function setupRiskCalculator() {
  
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Conexão de Abas
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
  
  // Inputs de Arquivo
  setupFileImporters();

  // Conexão de Botões e Inputs
  const form = document.getElementById('risk-calculator-form');
  let summaryContainer = document.getElementById('summary-table-container');
  
  const importDataBtn = document.getElementById('import-data-btn');
  const exportDataBtn = document.getElementById('export-data-btn');
  const sendEmailBtn = document.getElementById('send-email-btn');
  const getGpsBtn = document.getElementById('get-gps-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const filterInput = document.getElementById('table-filter-input');
  const photoInput = document.getElementById('tree-photo-input');
  const removePhotoBtn = document.getElementById('remove-photo-btn');
  const resetBtn = document.getElementById('reset-risk-form-btn');

  // Listeners de Botões (Modais)
  if (importDataBtn) importDataBtn.addEventListener('click', modalUI.showImportModal);
  if (exportDataBtn) exportDataBtn.addEventListener('click', modalUI.showExportModal);
  
  // Listeners restantes
  if (filterInput) filterInput.addEventListener('keyup', debounce(features.handleTableFilter, 300));
  if (sendEmailBtn) sendEmailBtn.addEventListener('click', features.sendEmailReport);
  
  // Setup de listeners do mapa
  mapUI.setupMapListeners();
  
  // Confirmação de "Limpar Tudo" (Modal)
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
    modalUI.showGenericModal({
      title: '🗑️ Limpar Tabela',
      description: 'Tem certeza que deseja apagar TODOS os registros? Esta ação não pode ser desfeita e removerá todas as fotos.',
      buttons: [
        { text: 'Sim, Apagar Tudo', class: 'primary', action: () => {
          if (features.handleClearAll()) {
            renderSummaryTable(); // OK (O(N) é necessário aqui)
          }
        }},
        { text: 'Cancelar', class: 'cancel' }
      ]
    });
  });
  
  if (getGpsBtn) getGpsBtn.addEventListener('click', features.handleGetGPS);
  
  // Listeners de Foto
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

  // Lógica do Formulário
  if (form) {
    if (getGpsBtn && !isTouchDevice) {
      getGpsBtn.closest('.gps-button-container')?.setAttribute('style', 'display:none');
    }
    
    // [MODIFICADO v23.3] Listener de Adicionar (Submit)
    form.addEventListener('submit', (event) => {
      // Chama o features, que agora retorna o objeto newTree ou null
      const newTree = features.handleAddTreeSubmit(event);
      
      if (newTree) {
        appendTreeRow(newTree); // <-- O(1) PERFORMANCE
        if (isTouchDevice) setupMobileChecklist();
        const gpsStatus = document.getElementById('gps-status');
        if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
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
        } catch(err) { /* ignora erro */ }
        if (isTouchDevice) setupMobileChecklist();
        const gpsStatus = document.getElementById('gps-status');
        if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
      });
    }
  }
  
  // Lógica de clonagem e delegação de eventos
  if (summaryContainer) {
    const newSummaryContainer = summaryContainer.cloneNode(true);
    summaryContainer.parentNode.replaceChild(newSummaryContainer, summaryContainer);
    summaryContainer = newSummaryContainer;
    
    renderSummaryTable(); // Renderiza a tabela inicial (O(N))

    // Anexa o listener de DELEGAÇÃO DE EVENTOS
    summaryContainer.addEventListener('click', (e) => {
      const deleteButton = e.target.closest('.delete-tree-btn');
      const editButton = e.target.closest('.edit-tree-btn');
      const zoomButton = e.target.closest('.zoom-tree-btn');
      const sortButton = e.target.closest('th.sortable');
      const photoButton = e.target.closest('.photo-preview-btn');

      if (deleteButton) {
        // [MODIFICADO v23.3] Listener de Excluir (Modal)
        const treeId = parseInt(deleteButton.dataset.id, 10);
        modalUI.showGenericModal({
          title: 'Excluir Registro',
          description: `Tem certeza que deseja excluir a Árvore ID ${treeId}?`,
          buttons: [
            { text: 'Sim, Excluir', class: 'primary', action: () => {
              if (features.handleDeleteTree(treeId)) {
                removeTreeRow(treeId); // <-- O(1) PERFORMANCE
              }
            }},
            { text: 'Cancelar', class: 'cancel' }
          ]
        });
      }
      
      if (editButton) {
        // (v23.3) Edição requer renderização completa
        const needsCarouselUpdate = features.handleEditTree(parseInt(editButton.dataset.id, 10));
        showSubTab('tab-content-register');
        if (needsCarouselUpdate && isTouchDevice) setupMobileChecklist();
        renderSummaryTable(); // OK (O(N) é necessário aqui)
      }

      if (zoomButton) {
        features.handleZoomToPoint(parseInt(zoomButton.dataset.id, 10));
      }
      
      if (sortButton) {
        // (v23.3) Ordenação requer renderização completa
        features.handleSort(sortButton.dataset.sortKey);
        renderSummaryTable(); // OK (O(N) é necessário aqui)
      }

      if (photoButton) {
        e.preventDefault();
        handlePhotoPreviewClick(parseInt(photoButton.dataset.id, 10), photoButton);
      }
    });
  }

  if (isTouchDevice) {
    setupMobileChecklist();
  }
}


// === 4. LÓGICA DE TOOLTIPS (UI) ===
// (Sem alterações)

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

export function hideTooltip() {
  if (state.currentTooltip) {
    const img = state.currentTooltip.querySelector('img');
    if (img && img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
    state.currentTooltip.style.opacity = '0';
    state.currentTooltip.style.visibility = 'hidden';
    delete state.currentTooltip.dataset.currentElement;
    state.setCurrentTooltip(null);
  }
}

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

function handlePhotoPreviewClick(id, targetElement) {
  getImageFromDB(id, (imageBlob) => {
    if (!imageBlob) {
      showToast("Foto não encontrada no banco de dados.", "error");
      return;
    }
    const imgUrl = URL.createObjectURL(imageBlob);
    const tooltip = createTooltip();
    tooltip.innerHTML = `<img src="${imgUrl}" alt="Foto ID ${id}" class="manual-img" style="max-width: 80vw; max-height: 70vh;">`;
    positionTooltip(targetElement);
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
    tooltip.dataset.currentElement = `photo-${id}`;
  });
}

function setupGlossaryInteractions(detailView) {
  const glossaryTermsElements = detailView.querySelectorAll('.glossary-term');
  const debouncedHide = debounce(hideTooltip, 200);
  glossaryTermsElements.forEach(termElement => {
    if (!isTouchDevice) {
      termElement.addEventListener('mouseenter', showGlossaryTooltip);
      termElement.addEventListener('mouseleave', debouncedHide);
    }
    termElement.addEventListener(termClickEvent, toggleGlossaryTooltip);
  });
}

function showGlossaryTooltip(event) {
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
  const definition = glossaryTerms[termKey];
  if (!definition) return;
  const tooltip = createTooltip();
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
  const debouncedHide = debounce(hideTooltip, 200);
  equipmentTermsElements.forEach(termElement => {
    if (!isTouchDevice) {
      termElement.addEventListener('mouseenter', showEquipmentTooltip);
      termElement.addEventListener('mouseleave', debouncedHide);
    }
    termElement.addEventListener(termClickEvent, toggleEquipmentTooltip);
  });
}

function showEquipmentTooltip(event) {
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
  const data = equipmentData[termKey];
  if (!data) return;
  const tooltip = createTooltip();
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
  const debouncedHide = debounce(hideTooltip, 200);
  purposeTermsElements.forEach(termElement => {
    if (!isTouchDevice) {
      termElement.addEventListener('mouseenter', showPurposeTooltip);
      termElement.addEventListener('mouseleave', debouncedHide);
    }
    termElement.addEventListener(termClickEvent, togglePurposeTooltip);
  });
}

function showPurposeTooltip(event) {
  const termElement = event.currentTarget;
  const termKey = termElement.getAttribute('data-term-key');
  const data = podaPurposeData[termKey];
  if (!data) return;
  const tooltip = createTooltip();
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

// === 5. LÓGICA DO MODAL CUSTOMIZADO ===
// (Removido no v23.2 - Movido para modal.ui.js)
