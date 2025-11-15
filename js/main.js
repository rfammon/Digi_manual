// js/main.js (V24.4 - LoadContent Corrigido)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import * as database from './database.js';
import * as features from './features.js';
import * as modalUI from './modal.ui.js';
import * as utils from './utils.js'; 
import { manualContent } from './content.js';
import { setupRiskCalculator, loadContent } from './ui.js'; // <<-- CORREÇÃO AQUI: Importa loadContent de ui.js

// === 2. DADOS E ESTADO INTERNO ===
const MANUAL_KEYS = Object.keys(manualContent);
const CALCULATOR_KEY = 'calculadora-risco';
const DEFAULT_TAB = MANUAL_KEYS[0];

// === 3. LÓGICA DE NAVEGAÇÃO ===

/**
 * Lida com o clique na aba principal.
 * @param {Event} e 
 */
function handleTabClick(e) {
    const button = e.target.closest('.main-nav-btn');
    if (!button) return;
    
    e.preventDefault();
    const targetKey = button.dataset.target;

    // Remove 'active' de todos os botões e painéis
    document.querySelectorAll('.main-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('manual-view').style.display = 'none';
    document.getElementById('calculator-view').style.display = 'none';

    // Adiciona 'active' ao botão clicado
    button.classList.add('active');
    
    // Salva o estado da aba
    state.saveActiveTab(targetKey);

    // Exibe a view correta
    if (targetKey === CALCULATOR_KEY) {
        document.getElementById('calculator-view').style.display = 'block';
    } else {
        document.getElementById('manual-view').style.display = 'block';
        const content = manualContent[targetKey];
        const detailView = document.getElementById('manual-view');
        // Usa a função importada
        loadContent(detailView, content);
    }
}


/**
 * Inicializa a navegação da barra superior (chamado apenas uma vez).
 */
function initializeTabs() {
    const mainNav = document.getElementById('main-nav-bar');
    if (!mainNav) return;

    // 1. Cria os botões do manual
    MANUAL_KEYS.forEach((key) => {
        const btn = document.createElement('button');
        btn.textContent = manualContent[key].titulo;
        btn.className = 'main-nav-btn';
        btn.dataset.target = key;
        mainNav.appendChild(btn);
    });

    // 2. Cria o botão da calculadora
    const calculatorBtn = document.createElement('button');
    calculatorBtn.textContent = '📐 Calculadora de Risco';
    calculatorBtn.className = 'main-nav-btn';
    calculatorBtn.dataset.target = CALCULATOR_KEY;
    mainNav.appendChild(calculatorBtn);
}


// === 4. INICIALIZAÇÃO E EVENTOS ===

/**
 * Inicializa a aplicação: carrega dados, constrói a navegação e anexa listeners.
 */
function initApp() {
    // 1. Inicializa o DB
    database.initDB();
    
    // 2. Carrega estado
    state.loadDataFromStorage();

    // 3. Monta navegação principal e botões
    initializeTabs();
    
    const mainNav = document.getElementById('main-nav-bar');
    if (!mainNav) {
        throw new Error("Elemento '#main-nav-bar' não encontrado.");
    }
    
    // 4. Anexa Listener principal à navegação principal (DELEGAÇÃO)
    mainNav.addEventListener('click', handleTabClick);

    // 5. Determina a aba inicial
    const manualDetailView = document.getElementById('manual-view');
    const calculatorView = document.getElementById('calculator-view');
    const activeTab = state.getActiveTab() || DEFAULT_TAB;

    // 6. Configura a view ativa
    if (activeTab === CALCULATOR_KEY) {
        if (calculatorView) calculatorView.style.display = 'block';
    } else {
        const content = manualContent[activeTab];
        if (manualDetailView && content) {
            manualDetailView.style.display = 'block';
            loadContent(manualDetailView, content); // <<-- CORREÇÃO AQUI
        }
    }
    
    // Garante que o botão ativo seja marcado
    const activeBtn = document.querySelector(`.main-nav-btn[data-target="${activeTab}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    
    // --- PONTO DE INTERAÇÃO CRÍTICA ---
    
    // 7. Setup da Calculadora (maestro) - [DEFENSIVO]
    if (typeof setupRiskCalculator === 'function') {
        setupRiskCalculator(); 
    } else {
        console.error("Falha na inicialização da Calculadora: setupRiskCalculator não foi carregado. Verifique os módulos de UI.");
    }

    // 8. Setup do Visualizador de Fotos - [DEFENSIVO]
    if (modalUI && typeof modalUI.initPhotoViewer === 'function') {
        modalUI.initPhotoViewer();
    } else {
        console.error("Falha na inicialização do Modal de Fotos: modalUI não foi carregado. Verifique o módulo modal.ui.js.");
    }

    // 9. Oculta Placeholder
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    if (loadingPlaceholder) loadingPlaceholder.style.display = 'none';
}


// === 5. EXECUÇÃO ===
try {
    // Adia a inicialização para garantir que o DOM esteja completamente carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
} catch (e) {
    console.error("Falha crítica ao inicializar a aplicação:", e); 
}