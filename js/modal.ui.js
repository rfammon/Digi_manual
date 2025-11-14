// js/modal.ui.js (v23.11 - Lógica do Photo Viewer movida para cá)

// === 1. IMPORTAÇÕES ===
import { registeredTrees } from './state.js';
import * as features from './features.js';
import { showToast } from './utils.js';
import { getImageFromDB } from './database.js'; // [v23.10]

// === 2. ESTADO DO MÓDULO ===
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// [v23.10] Estado do Visualizador de Fotos
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

// === 3. FUNÇÕES DO MODAL DE AÇÃO (Genérico) ===

/**
 * [PRIVADO] Exibe o container do modal de ação customizado.
 * Esta é a função base para todos os modais.
 */
function showActionModal({ title, description, buttons }) {
  const modal = document.getElementById('action-modal');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const actionsEl = modal.querySelector('.modal-actions');

  if (!modal || !titleEl || !descEl || !actionsEl) {
    console.error("Elementos do modal não encontrados.");
    return;
  }

  // Preenche o conteúdo
  titleEl.textContent = title;
  descEl.textContent = description;
  actionsEl.innerHTML = ''; // Limpa botões antigos

  // Cria novos botões
  buttons.forEach(btnConfig => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `modal-btn ${btnConfig.class || ''}`;
    button.textContent = btnConfig.text;
    
    button.addEventListener('click', () => {
      if (btnConfig.action) {
        btnConfig.action(); // Executa a ação
      }
      hideActionModal(); // Fecha o modal
    });
    actionsEl.appendChild(button);
  });

  // Listener para fechar ao clicar fora (no overlay)
  const self = modal;
  const closeOverlay = (e) => {
    if (e.target === self) {
      hideActionModal();
      self.removeEventListener('click', closeOverlay);
    }
  };
  modal.addEventListener('click', closeOverlay);

  // Exibe o modal
  modal.classList.add('show');
}

/**
 * (PÚBLICO) Esconde o modal de ação.
 */
export function hideActionModal() {
  const modal = document.getElementById('action-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * (PÚBLICO) Wrapper genérico para 'showActionModal'.
 */
export function showGenericModal(config) {
  showActionModal(config);
}


// === 4. FUNÇÕES DE MODAIS ESPECÍFICOS (Importar, Exportar) ===

/**
 * (PÚBLICO) Configura e exibe o modal de EXPORTAÇÃO.
 */
export function showExportModal() {
  let buttons = [
    {
      text: 'Exportar Apenas .CSV (s/ fotos)',
      class: 'secondary',
      action: features.exportActionCSV
    },
    {
      text: 'Cancelar',
      class: 'cancel'
    }
  ];

  if (typeof JSZip !== 'undefined') {
    buttons.unshift({ // Adiciona no início
      text: 'Exportar Pacote .ZIP (Completo)',
      class: 'primary',
      action: features.exportActionZip
    });
  } else {
    console.warn("JSZip não carregado. Opção de exportar .ZIP desabilitada.");
  }

  showActionModal({
    title: '📥 Exportar Dados',
    description: 'Escolha o formato de exportação. O Pacote .ZIP inclui todos os dados e fotos (recomendado para backup).',
    buttons: buttons
  });
}

/**
 * (PÚBLICO) Configura e exibe o PRIMEIRO modal de IMPORTAÇÃO (Modo).
 */
export function showImportModal() {
  let buttons = [
    {
      text: 'Adicionar à Lista Atual',
      class: 'secondary',
      action: () => {
        // Atraso para garantir que o primeiro modal feche antes de abrir o segundo.
        setTimeout(() => showImportTypeModal(false), 0);
      }
    }
  ];
  
  // Só mostra "Substituir" se a lista NÃO estiver vazia.
  if (registeredTrees.length > 0) {
    buttons.push({
      text: 'Substituir Lista Atual',
      class: 'primary',
      action: () => {
        setTimeout(() => showImportTypeModal(true), 0);
      }
    });
  }
  buttons.push({ text: 'Cancelar', class: 'cancel' });

  showActionModal({
    title: '📤 Importar Dados',
    description: 'Você deseja adicionar os dados à lista atual ou substituir a lista inteira? (Substituir apagará todos os dados atuais)',
    buttons: buttons
  });
}

/**
 * [PRIVADO] Mostra o SEGUNDO modal de importação (Tipo de Arquivo).
 * @param {boolean} replaceData - Se a importação deve substituir os dados existentes.
 */
function showImportTypeModal(replaceData) {
  const csvInput = document.getElementById('csv-importer');
  const zipInput = document.getElementById('zip-importer');

  if (!csvInput || !zipInput) {
    console.error("Inputs de importação não encontrados.");
    showToast("Erro de configuração. Recarregue a página.", "error");
    return;
  }
  
  // Define o modo (append ou replace) no dataset dos inputs
  csvInput.dataset.replaceData = replaceData;
  zipInput.dataset.replaceData = replaceData;
  
  let buttons = [
    {
      text: 'Importar .CSV (s/ fotos)',
      class: 'secondary',
      action: () => csvInput.click()
    },
    {
      text: 'Cancelar',
      class: 'cancel'
    }
  ];

  if (typeof JSZip !== 'undefined') {
    buttons.unshift({
      text: 'Importar .ZIP (Completo)',
      class: 'primary',
      action: () => zipInput.click()
    });
  } else {
    console.warn("JSZip não carregado. Opção de importar .ZIP desabilitada.");
  }

  showActionModal({
    title: '📤 Selecione o Tipo de Arquivo',
    description: `Você escolheu ${replaceData ? 'SUBSTITUIR' : 'ADICIONAR'}. Selecione o arquivo para carregar.`,
    buttons: buttons
  });
}


// #####################################################################
// ### LÓGICA DO VISUALIZADOR DE FOTOS (v23.10) ###
// #####################################################################

/**
 * [PRIVADO v23.10] Torna o diálogo de foto arrastável (desktop).
 */
function _makeDraggable() {
  const { dialog, title } = photoViewer;
  if (isTouchDevice || !dialog || !title) return;

  title.style.cursor = 'move';

  const onMouseDown = (e) => {
    photoViewer.isDragging = true;
    const rect = dialog.getBoundingClientRect();
    
    dialog.style.position = 'fixed';
    dialog.style.top = `${rect.top}px`;
    dialog.style.left = `${rect.left}px`;
    dialog.style.transform = ''; 
    
    photoViewer.offset.x = e.clientX - rect.left;
    photoViewer.offset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!photoViewer.isDragging) return;
    e.preventDefault();
    
    let newX = e.clientX - photoViewer.offset.x;
    let newY = e.clientY - photoViewer.offset.y;

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
 * [PRIVADO v23.10] Esconde o modal visualizador de fotos.
 */
function _hidePhotoViewer() {
  const { modal, dialog, content } = photoViewer;
  if (!modal) return;

  modal.classList.remove('show');
  
  // Limpa o conteúdo e revoga o blob
  const img = content.querySelector('img');
  if (img && img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
  }
  content.innerHTML = '';
  
  // Reseta o CSS de arrasto/zoom para a centralização padrão
  dialog.style.width = '';
  dialog.style.top = '';
  dialog.style.left = '';
  dialog.style.transform = '';
  dialog.style.position = '';
}

/**
 * [PRIVADO v23.10] Aplica o zoom na imagem do visualizador.
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
 * (PÚBLICO) Busca dados e exibe o modal visualizador de fotos.
 * @param {number} treeId 
 */
export function showPhotoViewer(treeId) {
  const { modal, dialog, title, content, zoomLevels } = photoViewer;
  if (!modal) return;

  const tree = registeredTrees.find(t => t.id === treeId);
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
    
    // Mostra o modal
    modal.classList.add('show');
  });
}

/**
 * (PÚBLICO) [NOVO v23.10] Inicializa os listeners do modal de foto.
 * Chamado uma vez pelo main.js.
 */
export function initPhotoViewer() {
  photoViewer.modal = document.getElementById('photo-viewer-modal');
  photoViewer.dialog = document.getElementById('photo-viewer-dialog');
  photoViewer.title = document.getElementById('photo-viewer-title');
  photoViewer.content = document.getElementById('photo-viewer-content');
  photoViewer.closeBtn = document.getElementById('photo-viewer-close');

  if (!photoViewer.modal) {
    console.error("O HTML do #photo-viewer-modal não foi encontrado no index.html");
    return;
  }

  photoViewer.closeBtn.addEventListener('click', _hidePhotoViewer);
  
  photoViewer.modal.addEventListener('click', (e) => {
    if (e.target === photoViewer.modal) { // Fecha ao clicar no overlay (fundo)
      _hidePhotoViewer();
    }
  });

  _makeDraggable(); // Ativa o "arrastar" (só desktop)
}
