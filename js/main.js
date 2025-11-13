// js/main.js (v20.0 - NOVO ARQUIVO "MAESTRO")
// Ponto de entrada principal da aplicação.

// === 1. IMPORTAÇÕES DOS MÓDULOS ===
import * as state from './state.js';
import * as ui from './ui.js';
import * as features from './features.js';
import * as db from './database.js';
// Importa 'manualContent' do content.js (que agora só tem o manual)
import { manualContent } from './content.js'; 
import { showToast } from './utils.js';

// === 2. SELETORES GLOBAIS ===

const manualView = document.getElementById('manual-view');
const calculatorView = document.getElementById('calculadora-view');
const detailView = document.getElementById('detalhe-view');
const topNavContainer = document.querySelector('.topicos-container');

// === 3. LÓGICA DE NAVEGAÇÃO PRINCIPAL ===

/**
 * Controla a navegação principal (tópicos vs. calculadora).
 * Esta é a nova lógica de arquitetura que separa as "views".
 */
function handleMainNavigation(event) {
    const targetButton = event.target.closest('.topico-btn');
    if (!targetButton) return;

    // Remove 'active' de todos os botões
    topNavContainer.querySelectorAll('.topico-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // Adiciona 'active' ao botão clicado
    targetButton.classList.add('active');

    const targetId = targetButton.dataset.target;
    
    // Salva a aba ativa no localStorage
    state.saveActiveTab(targetId);

    if (targetId === 'calculadora-risco') {
        // MOSTRA A VIEW DA CALCULADORA
        manualView.style.display = 'none';
        calculatorView.style.display = 'block';
        
        // Se a aba do mapa estava ativa, ela precisa ser 
        // re-renderizada para garantir que o Leaflet funcione.
        const activeSubTab = document.querySelector('.sub-nav-btn.active')?.dataset.target;
        if (activeSubTab === 'tab-content-mapa') {
             // A função showSubTab (dentro do ui.js) já contém a lógica de reinicializar o mapa.
             ui.showSubTab('tab-content-mapa');
        }

    } else {
        // MOSTRA A VIEW DO MANUAL
        manualView.style.display = 'block';
        calculatorView.style.display = 'none';
        
        // Carrega o conteúdo do manual (ex: 'conceitos-basicos')
        const content = manualContent[targetId];
        ui.loadContent(detailView, content);
    }
    
    // Rola a tela para o topo da seção
    const topElement = document.getElementById('page-top');
    if (topElement) {
        topElement.scrollIntoView({ behavior: 'smooth' });
    }
}

// === 4. LÓGICA DE INICIALIZAÇÃO AUXILIAR ===

/**
 * Configura o botão "Voltar ao Topo".
 */
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (!backToTopBtn) return;

    // Otimização de performance (passive: true)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }, { passive: true }); 
}

/**
 * Configura os listeners dos formulários de Chat e Contato.
 */
function setupForms() {
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    const contactForm = document.getElementById('contact-form');

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', features.handleChatSend);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Impede a submissão do formulário (caso exista)
                features.handleChatSend();
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', features.handleContactForm);
    }
}

/**
 * (CORREÇÃO DE BUG) Define os valores padrão do formulário 
 * que não são cobertos pelo 'form.reset()'.
 */
function initFormDefaults() {
     try {
        // Define a data atual
        const dateInput = document.getElementById('risk-data');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Define o último avaliador (se existir)
        const avaliadorInput = document.getElementById('risk-avaliador');
        if (avaliadorInput && state.lastEvaluatorName) {
            avaliadorInput.value = state.lastEvaluatorName;
        }
    } catch(e) { 
        console.warn("Erro ao definir padrões do formulário.", e);
    }
}

/**
 * Função principal de inicialização da aplicação.
 */
function initApp() {
    // O DOM já está carregado (type="module")
    try {
        // 1. Carrega dados salvos (LocalStorage)
        state.loadDataFromStorage();

        // 2. Inicializa o banco de dados de imagens (IndexedDB)
        db.initImageDB();

        // 3. Configura a navegação principal (Tópicos vs. Calculadora)
        topNavContainer.addEventListener('click', handleMainNavigation);

        // 4. Inicializa a Calculadora UMA VEZ.
        // (Ela anexa listeners ao HTML estático do index.html)
        ui.setupRiskCalculator();
        
        // 5. Define os padrões do formulário (Data, Avaliador)
        initFormDefaults();

        // 6. Configura listeners dos formulários (Chat, Contato)
        setupForms();

        // 7. Configura o botão "Voltar ao Topo"
        setupBackToTop();

        // 8. Carrega o conteúdo inicial ou a última aba vista
        const lastTab = state.getActiveTab() || 'conceitos-basicos';
        const initialButton = topNavContainer.querySelector(`[data-target="${lastTab}"]`) || topNavContainer.querySelector('.topico-btn');
        
        if (initialButton) {
            initialButton.click(); // Simula o clique para carregar a view correta
        } else {
            // Fallback de segurança
            ui.loadContent(detailView, manualContent['conceitos-basicos']);
        }
        
    } catch (error) {
        console.error("Falha crítica ao inicializar a aplicação:", error);
        showToast("Erro grave ao carregar. Tente recarregar a página.", "error");
    }
}

// === 5. EXECUÇÃO ===
initApp();