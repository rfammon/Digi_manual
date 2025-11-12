// js/ui.js (v19.4 - O "Painel" - Renderização e Interação da UI)

// === 1. IMPORTAÇÕES ===

// Importa o Estado (para ler dados e modificar o estado da UI)
import * as state from './state.js';

// Importa os Dados (para os tooltips)
import { glossaryTerms, equipmentData, podaPurposeData } from './content.js';

// Importa as Ferramentas (para helpers de UI e performance)
import { showToast, debounce } from './utils.js';

// Importa o Banco de Dados (para buscar fotos para tooltips e popups)
import { getImageFromDB } from './database.js';

// Importa as Features (para conectar botões às suas ações)
import * as features from './features.js';


// === 2. RENDERIZAÇÃO DE CONTEÚDO PRINCIPAL ===

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
 * (v16.0) Mostra a pergunta do carrossel mobile no índice especificado.
 */
export function showMobileQuestion(index) {
    const { questions, card, navPrev, navNext, counter, totalQuestions } = mobileChecklist;
    const questionRow = questions[index];
    if (!questionRow) return;
    const num = questionRow.cells[0].textContent;
    const pergunta = questionRow.cells[1].textContent;
    const peso = questionRow.cells[2].textContent;
    const realCheckbox = questionRow.cells[3].querySelector('.risk-checkbox');
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
 * (v16.0) Inicializa o carrossel mobile (lendo a tabela desktop).
 */
export function setupMobileChecklist() {
    mobileChecklist.wrapper = document.querySelector('.mobile-checklist-wrapper');
    if (!mobileChecklist.wrapper) return;
    
    // Encontra os elementos (pode ser a primeira vez ou um recarregamento)
    mobileChecklist.card = mobileChecklist.wrapper.querySelector('.mobile-checklist-card');
    mobileChecklist.navPrev = mobileChecklist.wrapper.querySelector('#checklist-prev');
    mobileChecklist.navNext = mobileChecklist.wrapper.querySelector('#checklist-next');
    mobileChecklist.counter = mobileChecklist.wrapper.querySelector('.checklist-counter');
    mobileChecklist.questions = document.querySelectorAll('.risk-table tbody tr');
    
    if (mobileChecklist.questions.length === 0 || !mobileChecklist.card) return;
    
    mobileChecklist.currentIndex = 0;
    mobileChecklist.totalQuestions = mobileChecklist.questions.length;

    // (Correção v16.1) Clona nós para limpar listeners antigos ao recarregar (ex: modo de edição)
    mobileChecklist.card.replaceWith(mobileChecklist.card.cloneNode(true));
    mobileChecklist.navPrev.replaceWith(mobileChecklist.navPrev.cloneNode(true));
    mobileChecklist.navNext.replaceWith(mobileChecklist.navNext.cloneNode(true));
    
    // Re-seleciona os nós clonados
    mobileChecklist.card = mobileChecklist.wrapper.querySelector('.mobile-checklist-card');
    mobileChecklist.navPrev = mobileChecklist.wrapper.querySelector('#checklist-prev');
    mobileChecklist.navNext = mobileChecklist.wrapper.querySelector('#checklist-next');
    
    // Adiciona o listener para o "toggle" (Sim/Não)
    mobileChecklist.card.addEventListener('change', (e) => {
        const proxyCheckbox = e.target.closest('.mobile-checkbox-proxy');
        if (proxyCheckbox) {
            // Sincroniza o toggle mobile com o checkbox real (oculto) da tabela
            const targetIndex = parseInt(proxyCheckbox.dataset.targetIndex, 10);
            const realCheckbox = mobileChecklist.questions[targetIndex].cells[3].querySelector('.risk-checkbox');
            realCheckbox.checked = proxyCheckbox.checked;
        }
    });

    // Adiciona listeners para os botões de navegação do carrossel
    mobileChecklist.navPrev.addEventListener('click', () => {
        if (mobileChecklist.currentIndex > 0) {
            showMobileQuestion(mobileChecklist.currentIndex - 1);
        }
    });
    mobileChecklist.navNext.addEventListener('click', () => {
        if (mobileChecklist.currentIndex < mobileChecklist.totalQuestions - 1) {
            showMobileQuestion(mobileChecklist.currentIndex + 1);
        }
    });

    // Mostra a primeira pergunta
    showMobileQuestion(0);
}

/**
 * (v18.1) Renderiza a tabela de resumo de árvores.
 * Lê o estado global 'registeredTrees' e 'sortState'.
 */
export function renderSummaryTable() {
    const container = document.getElementById('summary-table-container');
    const importExportControls = document.getElementById('import-export-controls');
    const summaryBadge = document.getElementById('summary-badge');
    
    if (!container) return;    
    
    // Atualiza o badge
    if (summaryBadge) {
        if (state.registeredTrees.length > 0) {
            summaryBadge.textContent = `(${state.registeredTrees.length})`;
            summaryBadge.style.display = 'inline';
        } else {
            summaryBadge.textContent = '';
            summaryBadge.style.display = 'none';
        }
    }
    
    // Oculta os botões de exportação se a tabela estiver vazia
    if (state.registeredTrees.length === 0) {
        container.innerHTML = '<p id="summary-placeholder">Nenhuma árvore cadastrada ainda.</p>';
        if (importExportControls) {
            document.getElementById('export-data-btn')?.setAttribute('style', 'display:none');
            document.getElementById('send-email-btn')?.setAttribute('style', 'display:none');
            document.getElementById('clear-all-btn')?.setAttribute('style', 'display:none');
        }
        return;
    }
    
    // Mostra os botões de exportação
    if (importExportControls) {
        document.getElementById('export-data-btn')?.setAttribute('style', 'display:inline-flex');
        document.getElementById('send-email-btn')?.setAttribute('style', 'display:inline-flex');
        document.getElementById('clear-all-btn')?.setAttribute('style', 'display:inline-flex');
    }

    // Helper para classes de ordenação
    const getThClass = (key) => {
        let classes = 'sortable';
        if (state.sortState.key === key) {
            classes += state.sortState.direction === 'asc' ? ' sort-asc' : ' sort-desc';
        }
        return classes;
    };

    // Constrói o HTML da tabela
    let tableHTML = '<table class="summary-table"><thead><tr>';
    tableHTML += `<th class="${getThClass('id')}" data-sort-key="id">ID</th>`;
    tableHTML += `<th class="${getThClass('data')}" data-sort-key="data">Data</th>`;
    tableHTML += `<th class="${getThClass('especie')}" data-sort-key="especie">Espécie</th>`;
    tableHTML += `<th>Foto</th>`;
    tableHTML += `<th class="${getThClass('coordX')}" data-sort-key="coordX">Coord. X</th>`;
    tableHTML += `<th class="${getThClass('coordY')}" data-sort-key="coordY">Coord. Y</th>`;
    tableHTML += `<th class="${getThClass('utmZoneNum')}" data-sort-key="utmZoneNum">Zona UTM</th>`;
    tableHTML += `<th class="${getThClass('dap')}" data-sort-key="dap">DAP (cm)</th>`;
    tableHTML += `<th class="${getThClass('local')}" data-sort-key="local">Local</th>`;
    tableHTML += `<th class="${getThClass('avaliador')}" data-sort-key="avaliador">Avaliador</th>`;
    tableHTML += `<th class="${getThClass('pontuacao')}" data-sort-key="pontuacao">Pontos</th>`;
    tableHTML += `<th class="${getThClass('risco')}" data-sort-key="risco">Risco</th>`;
    tableHTML += `<th>Observações</th>`;
    tableHTML += `<th class="col-zoom">Zoom</th>`;
    tableHTML += `<th class="col-edit">Editar</th>`;
    tableHTML += `<th class="col-delete">Excluir</th>`;
    tableHTML += '</tr></thead><tbody>';
    
    // Ordena os dados ANTES de renderizar, lendo o 'sortState'
    const sortedData = [...state.registeredTrees].sort((a, b) => {
        const valA = features.getSortValue(a, state.sortState.key);
        const valB = features.getSortValue(b, state.sortState.key);

        if (valA < valB) return state.sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Cria as linhas da tabela
    sortedData.forEach(tree => {
        const [y, m, d] = (tree.data || '---').split('-');
        const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
        const photoIcon = tree.hasPhoto 
            ? `<button type="button" class="photo-preview-btn" data-id="${tree.id}">📷</button>` 
            : '—'; 
        
        tableHTML += `
            <tr data-tree-id="${tree.id}">
                <td>${tree.id}</td>
                <td>${displayDate}</td>    
                <td>${tree.especie}</td>
                <td style="text-align: center;">${photoIcon}</td> <td>${tree.coordX}</td>
                <td>${tree.coordY}</td>
                <td>${tree.utmZoneNum || 'N/A'}${tree.utmZoneLetter || ''}</td>
                <td>${tree.dap}</td>
                <td>${tree.local}</td>
                <td>${tree.avaliador}</td>
                <td>${tree.pontuacao}</td>
                <td class="${tree.riscoClass}">${tree.risco}</td>
                <td>${tree.observacoes}</td>
                <td class="col-zoom"><button type="button" class="zoom-tree-btn" data-id="${tree.id}">🔎</button></td>
                <td class="col-edit"><button type="button" class="edit-tree-btn" data-id="${tree.id}">✏️</button></td>
                <td class="col-delete"><button type="button" class="delete-tree-btn" data-id="${tree.id}">🗑️</button></td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

/**
 * (v17.6) Mostra a sub-aba correta (Registrar, Resumo, Mapa).
 */
export function showSubTab(targetId) {
    const subTabPanes = document.querySelectorAll('.sub-tab-content');
    subTabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetId));
    
    const subNavButtons = document.querySelectorAll('.sub-nav-btn');
    subNavButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-target') === targetId));

    // LÓGICA DE MAPA: Inicializa/re-renderiza o mapa ao ativar a aba
    if (targetId === 'tab-content-mapa') {
        setTimeout(() => { initMap(); }, 50); // Delay para garantir que o container está visível
    }
    
    // (v18.0) Lógica de Destaque da Linha
    if (targetId === 'tab-content-summary' && state.highlightTargetId) {
        features.highlightTableRow(state.highlightTargetId);
        state.setHighlightTargetId(null); // Limpa o alvo
    }
}

/**
 * (v17.4) Inicializa o mapa Leaflet e renderiza os pontos.
 */
function initMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return; 
    
    if (typeof L === 'undefined' || typeof proj4 === 'undefined') {
        mapContainer.innerHTML = '<p style="color:red; font-weight:bold;">ERRO DE MAPA: As bibliotecas Leaflet e Proj4js não foram carregadas. Adicione-as ao index.html.</p>';
        return;
    }

    // Limpa instância antiga do mapa, se houver
    if (state.mapInstance) {
        state.mapInstance.remove();
        state.setMapInstance(null);
    }
    
    // 1. Filtra e Converte árvores
    let boundsArray = [];
    let treesToRender = state.registeredTrees.map(tree => {
        const coords = features.convertToLatLon(tree); // Usa a feature de conversão
        if (coords) {
            tree.coordsLatLon = coords; // Armazena Lat/Lon para uso
            boundsArray.push(coords);
            return tree;
        }
        return null;
    }).filter(tree => tree !== null); 
    
    let mapCenter = [-15.7801, -47.9292]; // Padrão Brasil Central (Brasília)
    let initialZoom = 4; 

    if (boundsArray.length > 0) {
        mapCenter = boundsArray[0]; 
        initialZoom = 16;
    }
    
    // 2. Inicializa o mapa e salva no estado
    const newMap = L.map('map-container').setView(mapCenter, initialZoom);
    state.setMapInstance(newMap);

    // 3. Camada Base - Imagem de Satélite (ESRI)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(newMap);

    // 4. Renderiza os marcadores
    renderTreesOnMap(treesToRender);
    
    // 5. Aplica o Zoom (Lupa ou Extent)
    if (state.zoomTargetCoords) {
        newMap.setView(state.zoomTargetCoords, 18); // Zoom 18 para ponto único
        state.setZoomTargetCoords(null); // Limpa o alvo
    } else if (boundsArray.length > 0) {
        features.handleZoomToExtent(); // Chama a função de zoom automático
    }
}

/**
 * (v18.1) Desenha círculos (marcadores) no mapa.
 */
function renderTreesOnMap(treesData) {
    if (!state.mapInstance) return;

    // Limpa marcadores antigos
    state.mapInstance.eachLayer(function (layer) {
        if (layer.options && layer.options.isTreeMarker) {
            state.mapInstance.removeLayer(layer);
        }
    });

    treesData.forEach(tree => {
        const coords = tree.coordsLatLon; 
        let color, radius, riskText;

        if (tree.risco === 'Alto Risco') {
            color = '#C62828'; radius = 12; riskText = '🔴 Alto Risco';
        } else if (tree.risco === 'Médio Risco') {
            color = '#E65100'; radius = 8; riskText = '🟠 Médio Risco';
        } else {
            color = '#2E7D32'; radius = 5; riskText = '🟢 Baixo Risco';
        }

        const circle = L.circle(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: radius, 
            weight: 1,
            isTreeMarker: true
        }).addTo(state.mapInstance);

        const popupContent = `
            <strong>ID: ${tree.id}</strong><br>
            Espécie: ${tree.especie}<br>
            Risco: <span style="color:${color}; font-weight:bold;">${riskText}</span><br>
            Local: ${tree.local}<br>
            Coord. UTM: ${tree.coordX}, ${tree.coordY} (${tree.utmZoneNum || '?'}${tree.utmZoneLetter || '?'})
        `;
        
        circle.bindPopup(popupContent + (tree.hasPhoto ? "<p>Carregando foto...</p>" : ""));

        // Evento para carregar a foto (apenas se existir)
        if (tree.hasPhoto) {
            circle.on('popupopen', (e) => {
                getImageFromDB(tree.id, (imageBlob) => {
                    if (imageBlob) {
                        const imgUrl = URL.createObjectURL(imageBlob);
                        const finalContent = popupContent + `<img src="${imgUrl}" alt="Foto ID ${tree.id}" class="manual-img">`;
                        e.popup.setContent(finalContent);
                        // Revoga o URL da memória quando o popup fechar
                        state.mapInstance.once('popupclose', () => URL.revokeObjectURL(imgUrl));
                    } else {
                        e.popup.setContent(popupContent + '<p style="color:red;">Foto não encontrada.</p>');
                    }
                });
            });
        }
        
        // Evento de clique duplo no mapa
        circle.on('dblclick', () => {
            features.handleMapMarkerClick(tree.id);
        });
    });
}


/**
 * (v19.4) Função principal que inicializa todos os listeners da Calculadora.
 * (Chamada pelo main.js quando a aba da calculadora é carregada).
 */
export function setupRiskCalculator() {
        
    // --- Conexão de Abas (Registrar, Resumo, Mapa) ---
    const subNav = document.querySelector('.sub-nav');
    if (subNav) {
        // (Correção v19.4) Usa Event Delegation, mas limpa listeners antigos clonando
        const newNav = subNav.cloneNode(true);
        subNav.parentNode.replaceChild(newNav, subNav);
        
        newNav.addEventListener('click', (e) => {
            const button = e.target.closest('.sub-nav-btn');
            if (button) {
                e.preventDefault();
                showSubTab(button.getAttribute('data-target'));
            }
        });
        // Define a aba padrão
        showSubTab('tab-content-register');
    }

    // --- Conexão de Botões e Inputs (Features) ---
    const form = document.getElementById('risk-calculator-form');
    const summaryContainer = document.getElementById('summary-table-container');
    
    // (v19.2) Botões Unificados
    const importDataBtn = document.getElementById('import-data-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const zipImporter = document.getElementById('zip-importer');
    const csvImporter = document.getElementById('csv-importer');

    // Botões Antigos
    const sendEmailBtn = document.getElementById('send-email-btn');
    const getGpsBtn = document.getElementById('get-gps-btn');    
    const clearAllBtn = document.getElementById('clear-all-btn');    
    const zoomBtn = document.getElementById('zoom-to-extent-btn');
    const filterInput = document.getElementById('table-filter-input');
    const photoInput = document.getElementById('tree-photo-input');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    const resetBtn = document.getElementById('reset-risk-form-btn');

    // (v19.2) Lógica dos Botões Unificados de Import/Export
    if (importDataBtn) importDataBtn.addEventListener('click', features.handleImportData);
    if (exportDataBtn) exportDataBtn.addEventListener('click', features.handleExportData);
    if (zipImporter) zipImporter.addEventListener('change', (e) => {
        features.handleImportZip(e).then(() => {
            renderSummaryTable(); // Atualiza a UI após a importação
        });
    });
    if (csvImporter) csvImporter.addEventListener('change', (e) => {
        features.handleFileImport(e);
        renderSummaryTable(); // Atualiza a UI após a importação
    }); 

    // Listeners restantes
    if (zoomBtn) zoomBtn.addEventListener('click', features.handleZoomToExtent);
    
    // (ATUALIZAÇÃO v19.4) Aplicando o Debounce ao filtro
    if (filterInput) {
        filterInput.addEventListener('keyup', debounce(features.handleTableFilter, 300));
    }
    
    if (sendEmailBtn) sendEmailBtn.addEventListener('click', features.sendEmailReport);
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
        features.handleClearAll();
        renderSummaryTable(); // Atualiza a UI
    });
    if (getGpsBtn) getGpsBtn.addEventListener('click', features.handleGetGPS);
    
    // Listeners de Foto
    if (photoInput) {
        photoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                features.clearPhotoPreview(); 
                const preview = document.createElement('img');
                preview.id = 'photo-preview';
                preview.src = URL.createObjectURL(file);
                document.getElementById('photo-preview-container').prepend(preview);
                document.getElementById('remove-photo-btn').style.display = 'block';
                state.setCurrentTreePhoto(file); // Salva o blob no estado
            }
        });
    }
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', features.clearPhotoPreview);
    }

    // Lógica do Formulário (Adicionar e Limpar)
    if (form) {
        if (state.lastEvaluatorName) {
            document.getElementById('risk-avaliador').value = state.lastEvaluatorName;
        }

        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (getGpsBtn && !isTouchDevice) {
            const gpsContainer = getGpsBtn.closest('.gps-button-container');
            if(gpsContainer) gpsContainer.style.display = 'none';
        }
        
        // Adicionar Árvore
        form.addEventListener('submit', (event) => {
            event.preventDefault();    
            let totalScore = 0;
            
            const checkboxes = form.querySelectorAll('.risk-checkbox:checked');
            checkboxes.forEach(cb => { totalScore += parseInt(cb.dataset.weight, 10); });
            
            const allCheckboxes = form.querySelectorAll('.risk-checkbox');
            const checkedRiskFactors = Array.from(allCheckboxes).map(cb => cb.checked ? 1 : 0);
            
            let classificationText = 'Baixo Risco', classificationClass = 'risk-col-low';
            if (totalScore >= 20) { classificationText = 'Alto Risco'; classificationClass = 'risk-col-high'; }
            else if (totalScore >= 10) { classificationText = 'Médio Risco'; classificationClass = 'risk-col-medium'; }
            
            const newTreeId = state.registeredTrees.length > 0 ? Math.max(...state.registeredTrees.map(t => t.id)) + 1 : 1;
            
            const newTree = {
                id: newTreeId,
                data: document.getElementById('risk-data').value || new Date().toISOString().split('T')[0],
                especie: document.getElementById('risk-especie').value || 'N/A',
                local: document.getElementById('risk-local').value || 'N/A',
                coordX: document.getElementById('risk-coord-x').value || 'N/A',
                coordY: document.getElementById('risk-coord-y').value || 'N/A',
                utmZoneNum: state.lastUtmZone.num || 0,
                utmZoneLetter: state.lastUtmZone.letter || 'Z',
                dap: document.getElementById('risk-dap').value || 'N/A',    
                avaliador: document.getElementById('risk-avaliador').value || 'N/A',
                observacoes: document.getElementById('risk-obs').value || 'N/A',    
                pontuacao: totalScore,
                risco: classificationText,
                riscoClass: classificationClass,
                riskFactors: checkedRiskFactors,
                hasPhoto: (state.currentTreePhoto !== null) 
            };
            
            if (newTree.hasPhoto) {
                db.saveImageToDB(newTree.id, state.currentTreePhoto);
            }

            // Atualiza o estado
            state.registeredTrees.push(newTree);
            state.saveDataToStorage();
            renderSummaryTable(); // Atualiza a UI
            
            utils.showToast(`✔️ Árvore "${newTree.especie || 'N/A'}" (ID ${newTree.id}) adicionada!`, 'success');

            state.setLastEvaluatorName(document.getElementById('risk-avaliador').value || '');
            form.reset();
            features.clearPhotoPreview(); 
            
            try {
                document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
                document.getElementById('risk-avaliador').value = state.lastEvaluatorName;
            } catch(e) { /* ignora erro */ }

            document.getElementById('risk-especie').focus();
            
            if (isTouchDevice) {
                setupMobileChecklist(); // Recarrega o carrossel
            }

            const gpsStatus = document.getElementById('gps-status');
            if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
        });
        
        // Limpar Campos
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();    
                state.setLastEvaluatorName(document.getElementById('risk-avaliador').value || '');
                form.reset();    
                features.clearPhotoPreview(); 
                    try {
                        document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
                        document.getElementById('risk-avaliador').value = state.lastEvaluatorName;
                    } catch(e) { /* ignora erro */ }
                
                if (isTouchDevice) {
                    setupMobileChecklist(); 
                }

                const gpsStatus = document.getElementById('gps-status');
                if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
            });
        }
    }
    
    // Renderiza a tabela inicial
    renderSummaryTable(); 
    
    // (v19.4) Event Delegation com atualização de UI
    if (summaryContainer) {
        // Clona para limpar listeners antigos
        const newSummaryContainer = summaryContainer.cloneNode(true);
        summaryContainer.parentNode.replaceChild(newSummaryContainer, summaryContainer);
        
        newSummaryContainer.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.delete-tree-btn');
            const editButton = e.target.closest('.edit-tree-btn');    
            const zoomButton = e.target.closest('.zoom-tree-btn'); 
            const sortButton = e.target.closest('th.sortable'); 
            const photoButton = e.target.closest('.photo-preview-btn'); 
    
            if (deleteButton) {
                features.handleDeleteTree(parseInt(deleteButton.dataset.id, 10));
                renderSummaryTable(); // Atualiza a UI
            }
            
            if (editButton) {    
                const needsCarouselUpdate = features.handleEditTree(parseInt(editButton.dataset.id, 10));
                showSubTab('tab-content-register'); 
                if (needsCarouselUpdate && isTouchDevice) {
                    setupMobileChecklist(); // Recarrega o carrossel
                }
                renderSummaryTable(); // Atualiza a UI
            }

            if (zoomButton) { 
                features.handleZoomToPoint(parseInt(zoomButton.dataset.id, 10));
                // A UI (aba) será atualizada pela própria feature
            }
            
            if (sortButton) { 
                features.handleSort(sortButton.dataset.sortKey);
                renderSummaryTable(); // Atualiza a UI
            }

            if (photoButton) { 
                e.preventDefault();
                handlePhotoPreviewClick(parseInt(photoButton.dataset.id, 10), photoButton);
            }
        });
    }

    // Inicializa o carrossel mobile (se aplicável)
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
        setupMobileChecklist();
    }
}


// === 4. LÓGICA DE TOOLTIPS (UI) ===

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const termClickEvent = isTouchDevice ? 'touchend' : 'click';
const popupCloseEvent = isTouchDevice ? 'touchend' : 'click';

/**
 * Cria (ou reutiliza) o elemento DOM do tooltip.
 */
export function createTooltip() {
    let tooltip = document.getElementById('glossary-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'glossary-tooltip';
        document.body.appendChild(tooltip);    
    }
    // Garante que o evento de fechar só seja adicionado uma vez
    if (!tooltip.dataset.clickToCloseAdded) {
        tooltip.addEventListener(popupCloseEvent, (e) => { e.stopPropagation(); hideTooltip(); });
        tooltip.dataset.clickToCloseAdded = 'true';
    }
    state.setCurrentTooltip(tooltip);
    return tooltip;
}

/**
 * Esconde o tooltip ativo e limpa ObjectURLs (fotos).
 */
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

/**
 * Posiciona o tooltip próximo ao elemento clicado.
 */
function positionTooltip(termElement) {
    if (!state.currentTooltip) return;

    const rect = termElement.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    
    // requestAnimationFrame garante que o DOM foi pintado antes de medirmos
    requestAnimationFrame(() => {
        if (!state.currentTooltip) return;
        
        const tooltipWidth = state.currentTooltip.offsetWidth;
        const tooltipHeight = state.currentTooltip.offsetHeight;
        
        let topPos;
        // Tenta posicionar acima; se não houver espaço, posiciona abaixo
        if (rect.top > tooltipHeight + 10) { 
            topPos = rect.top + scrollY - tooltipHeight - 10; 
        } else { 
            topPos = rect.bottom + scrollY + 10; 
        }
        
        // Centraliza horizontalmente
        let leftPos = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
        
        // Impede de vazar da tela
        if (leftPos < scrollX + 10) leftPos = scrollX + 10;
        if (leftPos + tooltipWidth > window.innerWidth + scrollX - 10) { 
            leftPos = window.innerWidth + scrollX - tooltipWidth - 10; 
        }
        
        state.currentTooltip.style.top = `${topPos}px`;
        state.currentTooltip.style.left = `${leftPos}px`;
    });
}

/**
 * (v18.1) Mostra o preview da foto (da tabela) no tooltip.
 */
function handlePhotoPreviewClick(id, targetElement) {
    getImageFromDB(id, (imageBlob) => {
        if (!imageBlob) {
            utils.showToast("Foto não encontrada no banco de dados.", "error");
            return;
        }
        
        const imgUrl = URL.createObjectURL(imageBlob);
        const tooltip = createTooltip();
        
        // Limita o tamanho no viewport
        tooltip.innerHTML = `<img src="${imgUrl}" alt="Foto ID ${id}" class="manual-img" style="max-width: 80vw; max-height: 70vh;">`;
        
        positionTooltip(targetElement); 
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        tooltip.dataset.currentElement = `photo-${id}`; // ID único para toggle
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
