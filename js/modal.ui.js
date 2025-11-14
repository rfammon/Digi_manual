// js/modal.ui.js (v23.2 - NOVO ARQUIVO REFATORADO)

// === 1. IMPORTAÇÕES ===
// Importa o 'state' para verificar se a lista está vazia
import { registeredTrees } from './state.js';
// Importa 'features' para anexar as ações aos botões (ex: exportar, importar)
import * as features from './features.js';
// Importa 'utils' para mostrar erros caso os inputs de arquivo falhem
import { showToast } from './utils.js';

// === 2. FUNÇÕES DO MODAL DE AÇÃO (Genérico) ===

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

// === 3. FUNÇÕES DE MODAIS ESPECÍFICOS (Exportar, Importar) ===

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

/**
 * (PÚBLICO) Wrapper genérico para 'showActionModal', caso o ui.js precise
 * chamar um modal genérico (como o 'Limpar Tabela').
 */
export function showGenericModal(config) {
  showActionModal(config);
}
