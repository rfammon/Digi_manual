// js/main.js (v19.4 - O "Motor" da Aplicação)

// === 1. IMPORTAÇÃO DOS MÓDULOS (As "Peças") ===

// Importa o conteúdo (o "Manual")
import { manualContent } from './content.js';

// Importa as funções de UI (o "Painel")
import {
    loadContent,
    setupRiskCalculator,
    hideTooltip
} from './ui.js';

// Importa o gerenciamento de estado (a "Memória")
import { loadDataFromStorage, saveActiveTab, getActiveTab } from './state.js';

// Importa o banco de dados (o "Armazenamento")
import { initImageDB } from './database.js';

// Importa as lógicas de "features" (GPS, Chat, Contato, etc.)
import { 
    handleContactForm, 
    handleChatSend 
} from './features.js';


// === 2. LÓGICA DE INICIALIZAÇÃO (A "Partida") ===

document.addEventListener('DOMContentLoaded', () => {

    const detailView = document.getElementById('detalhe-view');
    const activeTopicButtons = document.querySelectorAll('.topico-btn');

    /**
     * Manipulador de clique para os botões de tópico (O "Orquestrador")
     */
    function handleTopicClick(button) {
        hideTooltip(); // Esconde tooltips abertos ao trocar de aba
        
        const target = button.getAttribute('data-target');
        saveActiveTab(target); // Salva a aba ativa no state (localStorage)
        
        // Atualiza a classe 'active' nos botões
        activeTopicButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Carrega o conteúdo principal na UI
        const content = manualContent[target];
        loadContent(detailView, content);
        
        // Se a aba for a calculadora, inicializa seus módulos específicos
        if (target === 'calculadora-risco') {
            setupRiskCalculator();
        }
    }

    // --- 1. Inicialização da Navegação (Carregamento da Página) ---
    initImageDB(); // Prepara o banco de dados de fotos
    loadDataFromStorage(); // Carrega 'registeredTrees' do localStorage

    if (activeTopicButtons.length > 0) {
        // Conecta cada botão de tópico ao orquestrador
        activeTopicButtons.forEach(button => {
            button.addEventListener('click', () => handleTopicClick(button));
        });

        // Tenta carregar a última aba salva
        const lastActiveTab = getActiveTab();
        let loadedFromStorage = false;

        if (lastActiveTab && manualContent[lastActiveTab]) {
            const activeButton = document.querySelector(`.topico-btn[data-target="${lastActiveTab}"]`);
            if (activeButton) {
                handleTopicClick(activeButton); // Aciona o clique na aba salva
                loadedFromStorage = true;
            }
        }

        // Se não houver aba salva, carrega a primeira
        if (!loadedFromStorage) {
            handleTopicClick(activeTopicButtons[0]);
        }
    } else {
        console.error('Site Builder Error: Nenhum botão .topico-btn foi encontrado no HTML.');
    }

    // --- 2. Inicialização do Botão "Voltar ao Topo" ---
    const backToTopButton = document.getElementById('back-to-top-btn');
    const headerElement = document.getElementById('page-top');    
    if (backToTopButton && headerElement) {
        const observerCallback = (entries) => {
            const [entry] = entries;    
            if (!entry.isIntersecting) { backToTopButton.classList.add('show'); }
            else { backToTopButton.classList.remove('show'); }
        };
        const headerObserver = new IntersectionObserver(observerCallback, { root: null, threshold: 0 });
        headerObserver.observe(headerElement);
    }

    // --- 3. Inicialização do Formulário de Contato ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // --- 4. Inicialização do Chat (Esqueleto) ---
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', handleChatSend);
        chatInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') { handleChatSend(); }
        });
    }

}); // Fim do DOMContentLoaded
