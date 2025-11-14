// js/modal.ui.js (v23.16 - Correção do Bug de Arrastar e Selecionar)

// === 1. IMPORTAÇÕES ===
import { registeredTrees } from './state.js';
import * as features from './features.js';
import { showToast } from './utils.js';
import { getImageFromDB } from './database.js';

// === 2. ESTADO DO MÓDULO ===
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

const photoViewer = {
  container: null, 
  title: null,
  content: null,
  closeBtn: null,
  isDragging: false,
  offset: { x: 0, y: 0 },
  zoomLevel: 0,
  zoomLevels: [300, 450, 600]
};

// === 3. FUNÇÕES DO MODAL DE AÇÃO (Genérico) ===
// (Sem alterações)
function showActionModal({ title, description, buttons }) {
  const modal = document.getElementById('action-modal');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const actionsEl = modal.querySelector('.modal-actions');
  if (!modal || !titleEl || !descEl || !actionsEl) {
    console.error("Elementos do modal de ação não encontrados.");
    return;
  }
  titleEl.textContent = title;
  descEl.textContent = description;
  actionsEl.innerHTML = '';
  buttons.forEach(btnConfig => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `modal-btn ${btnConfig.class || ''}`;
    button.textContent = btnConfig.text;
    button.addEventListener('click', () => {
      if (btnConfig.action) btnConfig.action();
      hideActionModal();
    });
    actionsEl.appendChild(button);
  });
  const self = modal;
  const closeOverlay = (e) => {
    if (e.target === self) {
      hideActionModal();
      self.removeEventListener('click', closeOverlay);
    }
  };
  modal.addEventListener('click', closeOverlay);
  modal.classList.add('show');
}
export function hideActionModal() {
  const modal = document.getElementById('action-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}
export function showGenericModal(config) {
  showActionModal(config);
}


// === 4. FUNÇÕES DE MODAIS ESPECÍFICOS (Importar, Exportar) ===
// (Sem alterações)
export function showExportModal() {
  let buttons = [
    { text: 'Exportar Apenas .CSV (s/ fotos)', class: 'secondary', action: features.exportActionCSV },
    { text: 'Cancelar', class: 'cancel' }
  ];
  if (typeof JSZip !== 'undefined') {
    buttons.unshift({
      text: 'Exportar Pacote .ZIP (Completo)',
      class: 'primary',
      action: features.exportActionZip
    });
  }
  showActionModal({
    title: '📥 Exportar Dados',
    description: 'Escolha o formato de exportação. O Pacote .ZIP inclui todos os dados e fotos (recomendado para backup).',
    buttons: buttons
  });
}
export function showImportModal() {
  let buttons = [
    { text: 'Adicionar à Lista Atual', class: 'secondary', action: () => {
      setTimeout(() => showImportTypeModal(false), 0);
    }}
  ];
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
function showImportTypeModal(replaceData) {
  const csvInput = document.getElementById('csv-importer');
  const zipInput = document.getElementById('zip-importer');
  if (!csvInput || !zipInput) {
    console.error("Inputs de importação não encontrados.");
    showToast("Erro de configuração. Recarregue a página.", "error");
    return;
  }
  csvInput.dataset.replaceData = replaceData;
  zipInput.dataset.replaceData = replaceData;
  let buttons = [
    { text: 'Importar .CSV (s/ fotos)', class: 'secondary', action: () => csvInput.click() },
    { text: 'Cancelar', class: 'cancel' }
  ];
  if (typeof JSZip !== 'undefined') {
    buttons.unshift({
      text: 'Importar .ZIP (Completo)',
      class: 'primary',
      action: () => zipInput.click()
    });
  }
  showActionModal({
    title: '📤 Selecione o Tipo de Arquivo',
    description: `Você escolheu ${replaceData ? 'SUBSTITUIR' : 'ADICIONAR'}. Selecione o arquivo para carregar.`,
    buttons: buttons
  });
}


// #####################################################################
// ### LÓGICA DO VISUALIZADOR DE FOTOS (v23.16 - Correção de Arrastar) ###
// #####################################################################

/**
 * [PRIVADO v23.16] Torna o diálogo de foto arrastável (desktop).
 */
function _makeDraggable() {
  const { container, title } = photoViewer;
  if (isTouchDevice || !container || !title) return;

  title.style.cursor = 'move';

  const onMouseDown = (e) => {
    // [NOVO v23.16] Impede a seleção de texto durante o arraste
    document.body.classList.add('user-select-none');
    
    photoViewer.isDragging = true;
    const rect = container.getBoundingClientRect();
    
    container.style.position = 'fixed';
    container.style.top = `${rect.top}px`;
    container.style.left = `${rect.left}px`;
    container.style.transform = ''; 
    
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

    newX = Math.max(0, Math.min(newX, window.innerWidth - container.offsetWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - container.offsetHeight));

    container.style.left = `${newX}px`;
    container.style.top = `${newY}px`;
  };

  const onMouseUp = () => {
    // [NOVO v23.16] Reabilita a seleção de texto
    document.body.classList.remove('user-select-none');
    
    photoViewer.isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  title.addEventListener('mousedown', onMouseDown);
}

/**
 * [PRIVADO v23.12] Esconde o modal visualizador de fotos.
 */
function _hidePhotoViewer() {
  const { container, content } = photoViewer;
  if (!container) return;

  container.classList.remove('show');
  setTimeout(() => {
    container.style.display = 'none';
    const img = content.querySelector('img');
    if (img && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
    }
    content.innerHTML = '';
    container.style.width = '';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%) scale(0.95)';
    container.style.position = 'fixed';
  }, 200);
}

/**
 * [PRIVADO v23.12] Aplica o zoom na imagem do visualizador.
 */
function _zoomPhotoViewer(direction) {
  const { container, zoomLevels } = photoViewer;
  if (!container || isTouchDevice) return;

  photoViewer.zoomLevel += direction;
  if (photoViewer.zoomLevel < 0) photoViewer.zoomLevel = 0;
  if (photoViewer.zoomLevel >= zoomLevels.length) photoViewer.zoomLevel = zoomLevels.length - 1;

  const newWidth = zoomLevels[photoViewer.zoomLevel];
  container.style.width = `${newWidth}px`;
}

/**
 * (PÚBLICO) Busca dados e exibe o modal visualizador de fotos.
 * @param {number} treeId 
 */
export function showPhotoViewer(treeId) {
  const { container, title, content, zoomLevels } = photoViewer;
  if (!container) return;

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
    
    photoViewer.zoomLevel = 0;
    container.style.width = `${zoomLevels[0]}px`;
    
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%) scale(0.95)';
    container.style.position = 'fixed';

    title.textContent = `Foto: ID ${tree.id} (${tree.especie})`;

    let photoHTML = `<img src="${imgUrl}" alt="Foto ID ${tree.id}" class="photo-viewer-img">`;
    if (!isTouchDevice) {
      photoHTML += `
        <div class="photo-viewer-zoom-controls">
          <button id="pv-zoom-out-btn" title="Diminuir Zoom">-</button>
          <button id="pv-zoom-in-btn" title="Aumentar Zoom">+</button>
        </div>
      `;
    }
    content.innerHTML = photoHTML;

    document.getElementById('pv-zoom-out-btn')?.addEventListener('click', () => _zoomPhotoViewer(-1));
    document.getElementById('pv-zoom-in-btn')?.addEventListener('click', () => _zoomPhotoViewer(1));
    
    container.style.display = 'block';
    void container.offsetWidth; 
    container.classList.add('show');
  });
}

/**
 * (PÚBLICO) (v23.12) Inicializa os listeners do modal de foto.
 */
export function initPhotoViewer() {
  photoViewer.container = document.getElementById('photo-viewer-dialog');
  photoViewer.title = document.getElementById('photo-viewer-title');
  photoViewer.content = document.getElementById('photo-viewer-content');
  photoViewer.closeBtn = document.getElementById('photo-viewer-close');

  if (!photoViewer.container || !photoViewer.title || !photoViewer.content || !photoViewer.closeBtn) {
    console.warn("Componente Photo Viewer não inicializado. O HTML (index.html) parece estar desatualizado.");
    return;
  }

  photoViewer.closeBtn.addEventListener('click', _hidePhotoViewer);
  
  // [REMOVIDO v23.12] Listener de clique no overlay (CAUSADOR DO BUG)

  _makeDraggable(); // Ativa o "arrastar" (só desktop)
}
