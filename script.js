// script.js (v9.8 - Correção de race condition no mobile)

// === 1. DEFINIÇÃO DE DADOS (GLOSSÁRIO, CONTEÚDO) ===

// ... (código existente inalterado) ...
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;
const glossaryTerms = {
// ... (código existente inalterado) ...
};
const equipmentData = {
// ... (código existente inalterado) ...
};
const manualContent = {
// ... (código existente inalterado) ...
};


// === 3. LÓGICA DE INICIALIZAÇÃO (CONSOLIDADA v9.8) ===

document.addEventListener('DOMContentLoaded', () => {
    
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // --- MÓDULO DE NAVEGAÇÃO ---
    const detailView = document.getElementById('detalhe-view');
// ... (código existente inalterado) ...
    function loadContent(targetKey) {
// ... (código existente inalterado) ...
    }
    function handleTopicClick(button) {
// ... (código existente inalterado) ...
    }
    if (activeTopicButtons.length > 0) {
// ... (código existente inalterado) ...
    } else {
        console.error('Site Builder Error: Nenhum botão .topico-btn foi encontrado no HTML.');
    }

    // --- MÓDULO DE TOOLTIP (GLOSSÁRIO E EQUIPAMENTOS) ---
    let currentTooltip = null; 
    function createTooltip() {
// ... (código existente inalterado) ...
    }
    function hideTooltip() {
// ... (código existente inalterado) ...
    }

    // -- Lógica do GLOSSÁRIO --
    function setupGlossaryInteractions() {
// ... (código existente inalterado) ...
    }

    function showGlossaryTooltip(event) {
// ... (código existente inalterado) ...
    }

    function toggleGlossaryTooltip(event) {
        event.preventDefault(); 
        event.stopPropagation(); // Impede o clique de borbulhar desnecessariamente
        
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showGlossaryTooltip(event);
            
            // ATUALIZADO (Site Builder v9.8)
            // Adiciona o listener de fechamento global *depois* que o evento de clique atual terminar.
            setTimeout(() => {
                document.addEventListener('click', function globalHide(e) {
                    // O 'tooltip' aqui é uma referência ao elemento buscado no início do toggleGlossaryTooltip
                    // Precisamos re-buscar ou garantir que a referência 'currentTooltip' global esteja correta
                    if (e.target !== event.currentTarget && (currentTooltip && !currentTooltip.contains(e.target))) {
                        hideTooltip();
                        document.removeEventListener('click', globalHide);
                    }
                }, { once: true });
            }, 0); // O '0' é a chave.
        }
    }

    // -- Lógica de EQUIPAMENTOS --
    function setupEquipmentInteractions() {
        const equipmentTermsElements = detailView.querySelectorAll('.equipment-term');
        equipmentTermsElements.forEach(termElement => {
            
            if (!isTouchDevice) {
                termElement.addEventListener('mouseenter', showEquipmentTooltip);
                termElement.addEventListener('mouseleave', hideTooltip);
            }
            termElement.addEventListener('click', toggleEquipmentTooltip);
        });
    }

    function showEquipmentTooltip(event) {
// ... (código existente inalterado) ...
    }

    function toggleEquipmentTooltip(event) {
        event.preventDefault();
        event.stopPropagation(); // Impede o clique de borbulhar desnecessariamente

        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showEquipmentTooltip(event);
            
            // ATUALIZADO (Site Builder v9.8)
            // Adiciona o listener de fechamento global *depois* que o evento de clique atual terminar.
            setTimeout(() => {
                document.addEventListener('click', function globalHide(e) {
                    if (e.target !== event.currentTarget && (currentTooltip && !currentTooltip.contains(e.target))) {
                        hideTooltip();
                        document.removeEventListener('click', globalHide);
                    }
                }, { once: true });
            }, 0); // O '0' é a chave.
        }
    }

    // Função genérica para posicionar o tooltip
    function positionTooltip(termElement) {
// ... (código existente inalterado) ...
    }

    
    // --- MÓDULO DO FORMULÁRIO (MAILTO:) ---
// ... (código existente inalterado) ...

    // --- MÓDULO DE CHAT GEMINI (ESQUELETO) ---
// ... (código existente inalterado) ...

}); // Fim do DOMContentLoaded