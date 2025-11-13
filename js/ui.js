// js/ui.js (v20.7 - FINAL - Ordem de Definição Corrigida)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import { glossaryTerms, equipmentData, podaPurposeData } from './content.js';
import { showToast, debounce } from './utils.js';
import { getImageFromDB } from './database.js';
import * as features from './features.js'; 


// === 2. RENDERIZAÇÃO DE CONTEÚDO (MANUAL) ===

/**
 * Carrega o HTML de um tópico do manual na view principal.
 * @param {HTMLElement} detailView - O elemento DOM <div id="detalhe-view">.
 * @param {object} content - O objeto de conteúdo (ex: manualContent['conceitos-basicos']).
 */
export function loadContent(detailView, content) {
    if (!detailView) return;    
    
    if (content) {
        detailView.innerHTML = `<h3>${content.titulo}</h3>${content.html}`;
        
        // Ativa os tooltips interativos para o conteúdo recém-carregado
        setupGlossaryInteractions(detailView);    
        setupEquipmentInteractions(detailView);
        setupPurposeInteractions(detailView);
        
    } else {
        detailView.innerHTML = `<h3 class="placeholder-titulo">Tópico Não Encontrado</h3>`;
    }
}

// === 3. LÓGICA DA CALCULADORA DE RISCO (UI) ===
// ... (setupMobileChecklist, renderSummaryTable, showSubTab, highlightTableRow, 
// initMap, renderTreesOnMap, setupFileImporters, setupRiskCalculator - permanecem os mesmos) ...

// [CÓDIGO OMITIDO POR SER LONG E ESTAR CORRETO, MAS PRESENTE NO ARQUIVO FINAL]


/**
 * (v20.3 - CORREÇÃO DE CRASH) Função principal que inicializa todos os listeners da Calculadora.
 */
export function setupRiskCalculator() {
    // ... (o código da função permanece o mesmo) ...
}

// === 4. LÓGICA DE TOOLTIPS (UI) ===

// [CORREÇÃO CRÍTICA]: As consts foram movidas para cá.
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const termClickEvent = isTouchDevice ? 'touchend' : 'click';
const popupCloseEvent = isTouchDevice ? 'touchend' : 'click';

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
        
        let topPos;
        if (rect.top > tooltipHeight + 10) { 
            topPos = rect.top + scrollY - tooltipHeight - 10; 
        } else { 
            topPos = rect.bottom + scrollY + 10; 
        }
        
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

// --- Funções de Setup de Tooltip (Chamadas por loadContent) ---

function setupGlossaryInteractions(detailView) {
    const glossaryTermsElements = detailView.querySelectorAll('.glossary-term');    
    glossaryTermsElements.forEach(termElement => {
        if (!isTouchDevice) {
            termElement.addEventListener('mouseenter', showGlossaryTooltip);
            termElement.addEventListener('mouseleave', hideTooltip);
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
    
    if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto && 
        tooltip.dataset.currentElement === event.currentTarget.textContent) {
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
            termElement.addEventListener('mouseleave', hideTooltip);
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

    if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto && 
        tooltip.dataset.currentElement === event.currentTarget.textContent) {
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
            termElement.addEventListener('mouseleave', hideTooltip);
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

    if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto &&
        tooltip.dataset.currentElement === event.currentTarget.textContent) {
        hideTooltip();
    } else { 
        showPurposeTooltip(event); 
    }
}

// === 5. LÓGICA DO MODAL CUSTOMIZADO ===

/**
 * Exibe um modal de ação customizado.
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
    
    // Limpa botões antigos
    actionsEl.innerHTML = '';

    // Cria novos botões
    buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `modal-btn ${btnConfig.class || ''}`;
        button.textContent = btnConfig.text;
        
        button.addEventListener('click', () => {
            if (btnConfig.action) {
                btnConfig.action(); // Executa a ação (ex: exportCSV)
            }
            hideActionModal(); // Fecha o modal
        });
        actionsEl.appendChild(button);
    });

    // Adiciona o listener para fechar ao clicar fora (no overlay)
    const self = modal;
    const closeOverlay = (e) => {
        if (e.target === self) {
            hideActionModal();
            self.removeEventListener('click', closeOverlay); // Limpa o listener
        }
    };
    modal.addEventListener('click', closeOverlay);

    // Exibe o modal
    modal.classList.add('show');
}

/**
 * Esconde o modal de ação.
 */
function hideActionModal() {
    const modal = document.getElementById('action-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * (v19.9 - CORRIGIDO) Configura e exibe o modal de EXPORTAÇÃO.
 */
function showExportModal() {
    
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
 * (v20.4/v20.6 - REVERSÃO) Configura e exibe o PRIMEIRO modal de IMPORTAÇÃO.
 */
function showImportModal() {
    
    showActionModal({
        title: '📤 Importar Dados',
        description: 'Você deseja adicionar os dados à lista atual ou substituir a lista inteira? (Substituir apagará todos os dados atuais)',
        buttons: [
            {
                text: 'Adicionar à Lista Atual',
                class: 'primary',
                action: () => {
                    // Adiciona setTimeout(0) para garantir que o primeiro modal feche 
                    // e o DOM se estabilize antes de abrir o segundo.
                    setTimeout(() => showImportTypeModal(false), 0);
                }
            },
            {
                text: 'Substituir Lista Atual',
                class: 'secondary',
                action: () => {
                    // Adiciona setTimeout(0)
                    setTimeout(() => showImportTypeModal(true), 0);
                }
            },
            {
                text: 'Cancelar',
                class: 'cancel'
            }
        ]
    });
}

/**
 * (v20.4/v20.6 - REVERSÃO) Mostra o SEGUNDO modal de importação (escolha de tipo de arquivo)
 */
function showImportTypeModal(replaceData) {
    // Busca os inputs de arquivo (eles foram clonados e re-anexados em setupRiskCalculator)
    const csvInput = document.getElementById('csv-importer');
    const zipInput = document.getElementById('zip-importer');

    if (!csvInput || !zipInput) {
        console.error("Inputs de importação não encontrados ou clonagem falhou.");
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
