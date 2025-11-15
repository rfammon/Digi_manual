// js/ui.js (V24.2 - Módulo Maestro Centralizado CORRIGIDO)
// Este módulo agora atua como o "maestro" da UI principal,
// definindo e delegando callbacks para quebrar a dependência circular.

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import * as features from './features.js';
import * as mapUI from './map.ui.js';
import * as modalUI from './modal.ui.js';
import { manualContent } from './content.js'; 
import { debounce } from './utils.js';
// Importa os módulos de UI especializados
import * as tooltipUI from './tooltip.ui.js';
import * as tableUI from './table.ui.js';
import * as formUI from './calculator.form.ui.js';

// === 2. ESTADO DO MÓDULO ===
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// === 3. RENDERIZAÇÃO DE CONTEÚDO (MANUAL) ===

/**
 * Carrega o HTML de um tópico do manual na view principal.
 * @param {HTMLElement} detailView - O elemento DOM.
 * @param {object} content - O objeto de conteúdo (do manualContent).
 */
export function loadContent(detailView, content) {
  if (!detailView) return;

  if (content) {
    // NOTA DE SEGURANÇA: .innerHTML seguro (conteúdo do content.js)
    detailView.innerHTML = `<h3>${content.titulo}</h3>${content.html}`;

    tooltipUI.setupGlossaryInteractions(detailView);
    tooltipUI.setupEquipmentInteractions(detailView);
    tooltipUI.setupPurposeInteractions(detailView);
  } else {
    detailView.innerHTML = `<h3 class="placeholder-titulo">Tópico Não Encontrado</h3>`;
  }
}

// === 4. NAVEGAÇÃO ===

/**
 * Mostra a sub-aba correta e chama o módulo de mapa.
 * @param {string} targetId O ID do painel de conteúdo da sub-aba.
 */
export function showSubTab(targetId) {
  const subTabPanes = document.querySelectorAll('.sub-tab-content');
  subTabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === targetId));

  const subNavButtons = document.querySelectorAll('.sub-nav-btn');
  subNavButtons.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-target') === targetId));

  if (targetId === 'tab-content-mapa') {
    setTimeout(() => { mapUI.initializeMap(); }, 50);
  }

  if (targetId === 'tab-content-summary' && state.highlightTargetId) {
    tableUI.highlightTableRow(state.highlightTargetId);
    state.setHighlightTargetId(null);
  }
}

// === 5. FUNÇÕES DE SETUP PRIVADAS ===

/**
 * Anexa listeners de navegação das sub-abas.
 */
function _setupSubNavigation() {
  const subNav = document.querySelector('.sub-nav');
  if (!subNav) return;

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

/**
 * Anexa listeners aos inputs de arquivo.
 */
function _setupFileImporters() {
  let zipImporter = document.getElementById('zip-importer');
  let csvImporter = document.getElementById('csv-importer');

  // Limpa listeners antigos clonando os nós
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

  // Anexa novos listeners
  if (zipImporter) {
    zipImporter.addEventListener('change', (e) => {
      e.replaceData = zipImporter.dataset.replaceData === 'true';
      features.handleImportZip(e).then(() => {
        tableUI.renderSummaryTable();
      });
    });
  }
  if (csvImporter) {
    csvImporter.addEventListener('change', (e) => {
      e.replaceData = csvImporter.dataset.replaceData === 'true';
      features.handleFileImport(e).then(() => {
        tableUI.renderSummaryTable();
      });
    });
  }
  // Não precisa retornar, pois os eventos são anexados aqui.
}

// === 6. MAESTRO DA CALCULADORA ===

/**
 * (V24.2 - CORRIGIDO) Função "maestro" que inicializa a Calculadora de Risco.
 * Centraliza a definição de callbacks para quebrar o ciclo de dependência.
 */
export function setupRiskCalculator() {
  // 1. Setup de Componentes Base
  _setupSubNavigation();
  _setupFileImporters();

  // 2. Setup de Módulos Externos (Mapa)
  mapUI.setupMapListeners();

  // 3. Setup de Módulos de UI Especializados
  
  // Inicializa o formulário (listeners de submit, reset, gps, foto)
  formUI.initCalculatorForm(isTouchDevice);

  // 4. Criação dos Callbacks da Tabela (Inversão de Controle)
  const tableUiCallbacks = {
    // Callbacks para os controles (Filtro, Import/Export, Clear)
    controls: {
      onImport: modalUI.showImportModal,
      onExport: modalUI.showExportModal,
      onFilter: debounce(features.handleTableFilter, 300),
      onEmail: features.sendEmailReport,
      onClear: () => {
        if (features.handleClearAll()) tableUI.renderSummaryTable();
      },
    },
    // Callbacks para as ações na linha (Delete, Edit, Zoom, Photo)
    actions: {
      onDelete: (treeId) => {
        modalUI.showGenericModal({
          title: 'Excluir Registro',
          description: `Tem certeza que deseja excluir a Árvore ID ${treeId}?`,
          buttons: [
            { text: 'Sim, Excluir', class: 'primary', action: () => {
              if (features.handleDeleteTree(treeId)) tableUI.removeTreeRow(treeId);
            }},
            { text: 'Cancelar', class: 'cancel' },
          ],
        });
      },
      onEdit: (treeId) => {
        const treeData = features.handleEditTree(treeId);
        if (treeData) {
          formUI.populateFormForEdit(treeData);
          formUI.setFormMode('edit');
          showSubTab('tab-content-register'); // showSubTab está local neste arquivo (ui.js)
          if (isTouchDevice) formUI.setupMobileChecklist();
          document.getElementById('risk-calculator-form').scrollIntoView({ behavior: 'smooth' });
        }
      },
      onZoom: features.handleZoomToPoint,
      onSort: (sortKey) => {
        features.handleSort(sortKey);
        tableUI.renderSummaryTable();
      },
      onPhoto: modalUI.showPhotoViewer,
    },
  };

  // 5. Inicializa a tabela, INJETANDO os callbacks
  tableUI.initSummaryTable(isTouchDevice, tableUiCallbacks);

  // 6. Setup Mobile
  if (isTouchDevice) {
    formUI.setupMobileChecklist();
  }
}