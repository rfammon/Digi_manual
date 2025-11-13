// js/ui.js (v22.0 - Correção de Lógica de Filtro, Zoom e Escopo)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import { glossaryTerms, equipmentData, podaPurposeData } from './content.js';
import { showToast, debounce } from './utils.js'; 
import { getImageFromDB } from './database.js';
import * as features from './features.js'; 

// [CORREÇÃO CRÍTICA v20.7]: Definição da função auxiliar imgTag.
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

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
    
    if (!questionRow.cells || questionRow.cells.length < 4) {
        console.error("showMobileQuestion: A linha da tabela (tr) está malformada.", questionRow);
        return;
    }
    
    const num = questionRow.cells[0].textContent;
    const pergunta = questionRow.cells[1].textContent;
    const peso = questionRow.cells[2].textContent;
    const realCheckbox = questionRow.cells[3].querySelector('.risk-checkbox');
    
    if (!realCheckbox) {
         console.error("showMobileQuestion: Checkbox não encontrado na linha.", questionRow);
         return;
    }
    
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
 * (v20.2) Inicializa o carrossel mobile (mantém a lógica de clonagem para re-setup de edição).
 */
export function setupMobileChecklist() {
    mobileChecklist.wrapper = document.querySelector('.mobile-checklist-wrapper');
    if (!mobileChecklist.wrapper) return;
    
    mobileChecklist.card = mobileChecklist.wrapper.querySelector('.mobile-checklist-card');
    mobileChecklist.navPrev = mobileChecklist.wrapper.querySelector('#checklist-prev');
    mobileChecklist.navNext = mobileChecklist.wrapper.querySelector('#checklist-next');
    mobileChecklist.counter = mobileChecklist.wrapper.querySelector('.checklist-counter');
    mobileChecklist.questions = document.querySelectorAll('#risk-calculator-form .risk-table tbody tr');
    
    if (mobileChecklist.questions.length === 0 || !mobileChecklist.card || !mobileChecklist.navPrev) {
         console.warn("setupMobileChecklist: Elementos do carrossel não encontrados. O carrossel não será iniciado.");
         return;
    }
    
    mobileChecklist.currentIndex = 0;
    mobileChecklist.totalQuestions = mobileChecklist.questions.length;

    // --- Clonagem para limpeza de listeners em re-setup (modo edição) ---
    const newCard = mobileChecklist.card.cloneNode(true);
    mobileChecklist.card.parentNode.replaceChild(newCard, mobileChecklist.card);
    mobileChecklist.card = newCard;
    
    const newNavPrev = mobileChecklist.navPrev.cloneNode(true);
    mobileChecklist.navPrev.parentNode.replaceChild(newNavPrev, mobileChecklist.navPrev);
    mobileChecklist.navPrev = newNavPrev;
    
    const newNavNext = mobileChecklist.navNext.cloneNode(true);
    mobileChecklist.navNext.parentNode.replaceChild(newNavNext, mobileChecklist.navNext);
    mobileChecklist.navNext = newNavNext;
    
    // Adiciona o listener para o "toggle" (Sim/Não)
    mobileChecklist.card.addEventListener('change', (e) => {
        const proxyCheckbox = e.target.closest('.mobile-checkbox-proxy');
        if (proxyCheckbox) {
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

    showMobileQuestion(0);
}

/**
 * (v18.1) Renderiza a tabela de resumo de árvores.
 * (v21.1) Atualiza os ícones para versões monocromáticas.
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
    
    // (v19.6) CORREÇÃO: Importa 'getSortValue' do features.js
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
        
        // [CORREÇÃO 6]: Ícones atualizados
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
                <td class="col-zoom"><button type="button" class="zoom-tree-btn" data-id="${tree.id}">🔍</button></td>
                <td class="col-edit"><button type="button" class="edit-tree-btn" data-id="${tree.id}">✎</button></td>
                <td class="col-delete"><button type="button" class="delete-tree-btn" data-id="${tree.id}">✖</button></td>
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
        // Delay para garantir que o container está visível
        setTimeout(() => { initMap(); }, 50); 
    }
    
    // (v18.0) Lógica de Destaque da Linha
    if (targetId === 'tab-content-summary' && state.highlightTargetId) {
        highlightTableRow(state.highlightTargetId);
        state.setHighlightTargetId(null); // Limpa o alvo
    }
}

/**
 * (v19.8) Destaque da linha
 */
function highlightTableRow(id) {
    // (v19.8) Atraso para garantir que a aba trocou
    setTimeout(() => {
        const row = document.querySelector(`.summary-table tr[data-tree-id="${id}"]`);
        if (row) {
            // Remove destaques antigos
            const oldHighlights = document.querySelectorAll('.summary-table tr.highlight');
            oldHighlights.forEach(r => r.classList.remove('highlight'));
            
            // Adiciona novo destaque e scroll
            row.classList.add('highlight');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                row.classList.remove('highlight');
            }, 2500);
        } else {
            console.warn(`Linha da tabela [data-tree-id="${id}"] não encontrada.`);
        }
    }, 100);
}

/**
 * (v21.7) Inicializa o mapa Leaflet com Legenda/Filtro Externos.
 */
function initMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return; 
    
    // (v19.7) Verificação de bibliotecas (agora globais)
    if (typeof L === 'undefined' || typeof proj4 === 'undefined') {
        mapContainer.innerHTML = '<p style="color:red; font-weight:bold;">ERRO DE MAPA: As bibliotecas Leaflet e Proj4js não foram carregadas. Verifique a pasta /libs/.</p>';
        return;
    }

    if (state.mapInstance) {
        state.mapInstance.remove();
        state.setMapInstance(null);
    }
    
    let boundsArray = [];
    let treesToRender = state.registeredTrees.map(tree => {
        const coords = features.convertToLatLon(tree); 
        if (coords) {
            tree.coordsLatLon = coords; 
            boundsArray.push(coords);
            return tree;
        }
        return null;
    }).filter(tree => tree !== null); 
    
    let mapCenter = [-15.7801, -47.9292]; // Centro do Brasil
    let initialZoom = 4; 

    if (boundsArray.length > 0) {
        mapCenter = boundsArray[0]; 
        initialZoom = 16;
    }
    
    const newMap = L.map('map-container').setView(mapCenter, initialZoom);
    state.setMapInstance(newMap);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(newMap);

    // --- NOVA LÓGICA (v21.7): Grupo de Marcadores e InfoBox ---

    // 1. Cria o grupo que conterá os marcadores (círculos)
    const markerGroup = L.featureGroup().addTo(newMap);
    state.setMapMarkerGroup(markerGroup); // Salva no estado global

    // 2. [REMOVIDO] A legenda agora está no HTML estático.
    
    // 3. Adiciona listener para fechar o InfoBox ao clicar no mapa
    newMap.on('click', hideMapInfoBox);
    
    // --- Fim da Nova Lógica ---

    renderTreesOnMap(treesToRender);
    
    if (state.zoomTargetCoords) {
        newMap.setView(state.zoomTargetCoords, 18); 
        state.setZoomTargetCoords(null); 
    } else if (boundsArray.length > 0) {
        features.handleZoomToExtent(); 
    }
}

/**
 * (v21.7) Desenha as árvores no mapa (agora no markerGroup) e troca Popup por InfoBox.
 */
function renderTreesOnMap(treesData) {
    if (!state.mapMarkerGroup) {
        console.error("mapMarkerGroup não está inicializado.");
        return;
    }
    
    // Limpa marcadores antigos do GRUPO
    state.mapMarkerGroup.clearLayers();
    
    // Esconde o InfoBox (caso esteja aberto de um ponto antigo)
    hideMapInfoBox();

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
            isTreeMarker: true,
            riskLevel: tree.risco // <-- IMPORTANTE: Seta o risco no layer para o filtro
        });
        
        // ADICIONA AO GRUPO, NÃO AO MAPA
        circle.addTo(state.mapMarkerGroup);

        // [MUDANÇA v21.7]: Troca o Popup pelo InfoBox.
        circle.on('click', (e) => {
            // Impede que o clique no círculo feche o InfoBox (propagando para o mapa)
            L.DomEvent.stopPropagation(e); 
            showMapInfoBox(tree);
        });
    });
    
    // [CORREÇÃO v21.9] Aplica o filtro atual DEPOIS que os marcadores são renderizados
    const currentFilter = document.querySelector('#map-legend-filter input[name="risk-filter"]:checked');
    if (currentFilter) {
        handleMapFilterChange({ target: currentFilter }); // Simula o evento de change
    }
}

/**
 * [BUG 2 CORRIGIDO v21.9] Lida com a mudança do filtro da legenda.
 * A lógica agora usa opacidade (setStyle) em vez de remover/adicionar layers.
 */
function handleMapFilterChange(e) {
    const selectedRisk = e.target.value;
    
    if (!state.mapMarkerGroup) return;

    state.mapMarkerGroup.eachLayer(layer => {
        if (selectedRisk === 'Todos' || layer.options.riskLevel === selectedRisk) {
            // Mostra o marcador
            layer.setStyle({ opacity: 1, fillOpacity: 0.6 });
        } else {
            // Esconde o marcador
            layer.setStyle({ opacity: 0, fillOpacity: 0 });
        }
    });
    
    hideMapInfoBox(); // Esconde o infobox ao filtrar
}

/**
 * [NOVO v21.7] Mostra o painel de informações do mapa (substitui o popup).
 * [ATUALIZADO v21.9] Adiciona botões de zoom.
 */
function showMapInfoBox(tree) {
    const infoBox = document.getElementById('map-info-box');
    if (!infoBox) return;

    // [CORREÇÃO v21.9] Reseta o zoom e o tamanho ao abrir
    currentInfoBoxZoom = 0; // Reseta o nível de zoom
    infoBox.style.width = ''; // Reseta para o tamanho padrão do CSS

    let color, riskText;
    if (tree.risco === 'Alto Risco') {
        color = '#C62828'; riskText = '🔴 Alto Risco';
    } else if (tree.risco === 'Médio Risco') {
        color = '#E65100'; riskText = '🟠 Médio Risco';
    } else {
        color = '#2E7D32'; riskText = '🟢 Baixo Risco';
    }

    let infoHTML = `
        <button id="close-info-box">&times;</button>
        <strong>ID: ${tree.id}</strong>
        <p><strong>Espécie:</strong> ${tree.especie}</p>
        <p><strong>Risco:</strong> <span style="color:${color}; font-weight:bold;">${riskText}</span></p>
        <p><strong>Local:</strong> ${tree.local}</p>
        <p><strong>Coord. UTM:</strong> ${tree.coordX}, ${tree.coordY} (${tree.utmZoneNum || '?'}${tree.utmZoneLetter || '?'})</p>
    `;
    
    // Se tiver foto, adiciona o container para ela
    if (tree.hasPhoto) {
        infoHTML += `<div id="map-info-photo" class="loading-photo">Carregando foto...</div>`;
        
        // [CORREÇÃO v21.9] Botões de zoom só são adicionados se NÃO for touch
        if (!isTouchDevice) {
            infoHTML += `
                <div class="map-photo-zoom">
                    <button id="zoom-out-btn" title="Diminuir Zoom">-</button>
                    <button id="zoom-in-btn" title="Aumentar Zoom">+</button>
                </div>
            `;
        }
    }
    
    infoBox.innerHTML = infoHTML;
    infoBox.classList.remove('hidden');

    // Listener para o botão de fechar
    document.getElementById('close-info-box').addEventListener('click', hideMapInfoBox);
    
    // Carrega a foto (se houver)
    if (tree.hasPhoto) {
        getImageFromDB(tree.id, (imageBlob) => {
            const photoDiv = document.getElementById('map-info-photo');
            if (photoDiv && imageBlob) {
                const imgUrl = URL.createObjectURL(imageBlob);
                photoDiv.innerHTML = `<img src="${imgUrl}" alt="Foto ID ${tree.id}" class="manual-img" id="infobox-img">`;
                photoDiv.classList.remove('loading-photo');
                
                // [CORREÇÃO BUG 4 v21.9]: Anexa listeners DEPOIS que a imagem existe
                document.getElementById('zoom-out-btn')?.addEventListener('click', () => zoomMapImage(-1));
                document.getElementById('zoom-in-btn')?.addEventListener('click', () => zoomMapImage(1));

            } else if (photoDiv) {
                photoDiv.innerHTML = `<p style="color:red; font-size: 0.9em;">Foto não encontrada.</p>`;
                photoDiv.classList.remove('loading-photo');
            }
        });
    }
}

// [NOVO v21.9] Variáveis e Lógica de Zoom do InfoBox
let currentInfoBoxZoom = 0; 
const ZOOM_LEVELS = [280, 400, 550]; // Define os Níveis de Zoom (Pequeno, Médio, Grande)

function zoomMapImage(direction) {
    const infoBox = document.getElementById('map-info-box');
    if (!infoBox) return;

    // Atualiza o nível de zoom
    currentInfoBoxZoom += direction;

    // Limita o zoom (0 = min, 2 = max)
    if (currentInfoBoxZoom < 0) currentInfoBoxZoom = 0;
    if (currentInfoBoxZoom >= ZOOM_LEVELS.length) currentInfoBoxZoom = ZOOM_LEVELS.length - 1;

    const newWidth = ZOOM_LEVELS[currentInfoBoxZoom];
    infoBox.style.width = `${newWidth}px`;
}


/**
 * [NOVO v21.7] Esconde o painel de informações do mapa.
 * [ATUALIZADO v21.9] Reseta o zoom.
 */
function hideMapInfoBox() {
    const infoBox = document.getElementById('map-info-box');
    if (infoBox) {
        // Limpa a foto (se houver) para revogar o ObjectURL
        const img = infoBox.querySelector('img');
        if (img && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
        
        infoBox.classList.add('hidden');
        infoBox.innerHTML = ''; // Limpa o conteúdo
        
        // Reseta o zoom e o tamanho
        currentInfoBoxZoom = 0; 
        infoBox.style.width = ''; // Remove o estilo inline
    }
}


// === Lógica de Inicialização de Inputs de Arquivo (CRÍTICO PARA IMPORTAÇÃO) ===

/**
 * (v20.0 - NOVO) Funções para garantir que os inputs de arquivo sejam limpos de listeners antigos.
 */
function setupFileImporters() {
    let zipImporter = document.getElementById('zip-importer');
    let csvImporter = document.getElementById('csv-importer');

    // Clonagem necessária para o browser aceitar o .click() e remover listeners de 'change'
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
    
    // RE-ANEXA OS LISTENERS AOS NOVOS ELEMENTOS
    if (zipImporter) {
        zipImporter.addEventListener('change', (e) => {
            e.replaceData = zipImporter.dataset.replaceData === 'true';
            features.handleImportZip(e).then(() => {
                renderSummaryTable(); 
            });
        });
    }
    
    if (csvImporter) {
        csvImporter.addEventListener('change', (e) => {
            e.replaceData = csvImporter.dataset.replaceData === 'true';
            features.handleFileImport(e).then(() => {
                renderSummaryTable();
            });
        });
    }
    
    return { zipImporter, csvImporter };
}

/**
 * [CRÍTICO PARA PERFORMANCE v21.5]
 * OTIMIZAÇÃO DE IMAGEM: Redimensiona e comprime uma imagem (Blob).
 */
async function optimizeImage(imageFile, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile); // Lê o arquivo como URL de dados

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result; // Define a fonte da imagem para o URL de dados

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                // Calcula novas dimensões se a largura exceder maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Desenha a imagem redimensionada no canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Converte o canvas para um Blob JPEG com a qualidade especificada
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };

            img.onerror = (error) => {
                console.error("Erro ao carregar imagem no canvas", error);
                reject(error); // Lida com erros de carregamento da imagem
            };
        };

        reader.onerror = (error) => {
            console.error("Erro ao ler arquivo de imagem", error);
            reject(error); // Lida com erros de leitura do arquivo
        };
    });
}


/**
 * (v20.3 - CORREÇÃO DE CRASH) Função principal que inicializa todos os listeners da Calculadora.
 * (v21.7 - ADICIONA LISTENER DA LEGENDA)
 */
export function setupRiskCalculator() {
        
    // [CORREÇÃO BUG 1/4 v21.9]: Mover isTouchDevice para o TOPO do setup
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // --- Conexão de Abas (Registrar, Resumo, Mapa) ---
    const subNav = document.querySelector('.sub-nav');
    if (subNav) {
        // [CORREÇÃO DE CRASH]: Define o handler e anexa ao nó existente.
        const subNavHandler = (e) => {
            const button = e.target.closest('.sub-nav-btn');
            if (button) {
                e.preventDefault();
                showSubTab(button.getAttribute('data-target'));
            }
        };
        
        // Adicionamos o listener ao nó existente
        subNav.addEventListener('click', subNavHandler);
        // Ativa a primeira aba (Registrar)
        showSubTab('tab-content-register');
    }
    
    // --- (CRÍTICO) Re-cria e re-anexa os inputs de arquivo ---
    const { zipImporter, csvImporter } = setupFileImporters(); 


    // --- Conexão de Botões e Inputs (Features) ---
    const form = document.getElementById('risk-calculator-form');
    let summaryContainer = document.getElementById('summary-table-container'); 
    
    // Elementos que precisamos
    const importDataBtn = document.getElementById('import-data-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const sendEmailBtn = document.getElementById('send-email-btn');
    const getGpsBtn = document.getElementById('get-gps-btn');    
    const clearAllBtn = document.getElementById('clear-all-btn');    
    const zoomBtn = document.getElementById('zoom-to-extent-btn');
    const filterInput = document.getElementById('table-filter-input');
    const photoInput = document.getElementById('tree-photo-input');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    const resetBtn = document.getElementById('reset-risk-form-btn');
    
    // [NOVO v21.7] Pega a legenda externa
    const mapLegend = document.getElementById('map-legend-filter');

    // (v19.8) Lógica dos Botões Unificados (AGORA CHAMAM O MODAL)
    if (importDataBtn) importDataBtn.addEventListener('click', showImportModal);
    if (exportDataBtn) exportDataBtn.addEventListener('click', showExportModal);
    
    // Listeners restantes
    if (zoomBtn) zoomBtn.addEventListener('click', features.handleZoomToExtent);
    if (filterInput) filterInput.addEventListener('keyup', debounce(features.handleTableFilter, 300));
    if (sendEmailBtn) sendEmailBtn.addEventListener('click', features.sendEmailReport);
    
    // [NOVO v21.7] Anexa o listener ao filtro do mapa
    if (mapLegend) mapLegend.addEventListener('change', handleMapFilterChange);
    
    // (v19.8) Confirmação de "Limpar Tudo" agora usa o modal
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
        showActionModal({
            title: '🗑️ Limpar Tabela',
            description: 'Tem certeza que deseja apagar TODOS os registros? Esta ação não pode ser desfeita e removerá todas as fotos.',
            buttons: [
                { text: 'Sim, Apagar Tudo', class: 'primary', action: () => {
                    if (features.handleClearAll()) { // features.handleClearAll agora não tem confirm()
                        renderSummaryTable(); 
                    }
                }},
                { text: 'Cancelar', class: 'cancel' }
            ]
        });
    });
    
    if (getGpsBtn) getGpsBtn.addEventListener('click', features.handleGetGPS);
    
    // Listeners de Foto (v21.5 - OTIMIZAÇÃO DE IMAGEM)
    if (photoInput) {
        photoInput.addEventListener('change', async (event) => { // <-- Tornou-se async
            const file = event.target.files[0];
            if (file) {
                features.clearPhotoPreview(); 
                
                // --- NOVA LÓGICA DE OTIMIZAÇÃO ---
                try {
                    showToast("Otimizando foto...", "success");
                    const optimizedBlob = await optimizeImage(file, 800, 0.7); // 800px, 70%
                    state.setCurrentTreePhoto(optimizedBlob); // Armazena o Blob OTIMIZADO
                    
                    // Cria a pré-visualização a partir do Blob otimizado
                    const preview = document.createElement('img');
                    preview.id = 'photo-preview';
                    preview.src = URL.createObjectURL(optimizedBlob);
                    document.getElementById('photo-preview-container').prepend(preview);
                    document.getElementById('remove-photo-btn').style.display = 'block';

                } catch (error) {
                    console.error("Erro ao otimizar imagem:", error);
                    showToast("Erro ao processar a foto. Tente outra imagem.", "error");
                    state.setCurrentTreePhoto(null);
                    features.clearPhotoPreview();
                }
            }
        });
    }
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', features.clearPhotoPreview);
    }

    // Lógica do Formulário (Adicionar e Limpar)
    if (form) {
        // Oculta o botão GPS em desktops
        if (getGpsBtn && !isTouchDevice) {
            const gpsContainer = getGpsBtn.closest('.gps-button-container');
            if(gpsContainer) gpsContainer.style.display = 'none';
        }
        
        // (v19.7) Adicionar Árvore
        form.addEventListener('submit', (event) => {
            const submissionSuccessful = features.handleAddTreeSubmit(event);
            
            if (submissionSuccessful) {
                renderSummaryTable(); // ATUALIZA A UI
                if (isTouchDevice) {
                    setupMobileChecklist(); 
                }
                const gpsStatus = document.getElementById('gps-status');
                if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
            }
        });
        
        // Limpar Campos
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();   
                // Salva o nome do avaliador antes de limpar
                state.setLastEvaluatorName(document.getElementById('risk-avaliador').value || '');
                form.reset();   
                features.clearPhotoPreview(); 
                
                // Re-aplica os padrões após o reset
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
    
    // (v20.2 - CORREÇÃO CRÍTICA): Clonagem para limpeza de listeners
    if (summaryContainer) {
        const newSummaryContainer = summaryContainer.cloneNode(true);
        summaryContainer.parentNode.replaceChild(newSummaryContainer, summaryContainer);
        summaryContainer = newSummaryContainer; // Reatribui a referência local
        
        summaryContainer.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.delete-tree-btn');
            const editButton = e.target.closest('.edit-tree-btn');    
            const zoomButton = e.target.closest('.zoom-tree-btn'); 
            const sortButton = e.target.closest('th.sortable'); 
            const photoButton = e.target.closest('.photo-preview-btn'); 
    
            if (deleteButton) {
                showActionModal({
                    title: 'Excluir Registro',
                    description: `Tem certeza que deseja excluir a Árvore ID ${deleteButton.dataset.id}?`,
                    buttons: [
                        { text: 'Sim, Excluir', class: 'primary', action: () => {
                            if (features.handleDeleteTree(parseInt(deleteButton.dataset.id, 10))) {
                                renderSummaryTable(); 
                            }
                        }},
                        { text: 'Cancelar', class: 'cancel' }
                    ]
                });
            }
            
            if (editButton) {    
                const needsCarouselUpdate = features.handleEditTree(parseInt(editButton.dataset.id, 10));
                showSubTab('tab-content-register'); 
                
                if (needsCarouselUpdate && isTouchDevice) {
                    setupMobileChecklist(); 
                }
                renderSummaryTable(); 
            }

            if (zoomButton) { 
                features.handleZoomToPoint(parseInt(zoomButton.dataset.id, 10));
            }
            
            if (sortButton) { 
                features.handleSort(sortButton.dataset.sortKey);
                renderSummaryTable(); 
            }

            if (photoButton) { 
                e.preventDefault();
                handlePhotoPreviewClick(parseInt(photoButton.dataset.id, 10), photoButton);
            }
        });
    }


    if (isTouchDevice) {
        setupMobileChecklist();
    }
}


// === 4. LÓGICA DE TOOLTIPS (UI) ===

// [BUG 1 e 4 CORRIGIDO v21.9]: As consts foram movidas para o topo desta seção.
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
    // [CORREÇÃO v20.9] Define o handler de fechar com debounce para evitar flicker em desktop
    const debouncedHide = debounce(hideTooltip, 200);

    glossaryTermsElements.forEach(termElement => {
        if (!isTouchDevice) {
            termElement.addEventListener('mouseenter', showGlossaryTooltip);
            termElement.addEventListener('mouseleave', debouncedHide); // <--- APLICAÇÃO DO DEBOUNCE
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
    // [CORREÇÃO v20.9] Define o debounce para o mouseleave
    const debouncedHide = debounce(hideTooltip, 200);
    
    equipmentTermsElements.forEach(termElement => {
        if (!isTouchDevice) {
            termElement.addEventListener('mouseenter', showEquipmentTooltip);
            termElement.addEventListener('mouseleave', debouncedHide); // <--- APLICAÇÃO DO DEBOUNCE
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
    // [CORREÇÃO v20.7]: imgTag agora está definida no topo
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
    // [CORREÇÃO v20.9] Define o debounce para o mouseleave
    const debouncedHide = debounce(hideTooltip, 200);

    purposeTermsElements.forEach(termElement => {
        if (!isTouchDevice) {
            termElement.addEventListener('mouseenter', showPurposeTooltip);
            termElement.addEventListener('mouseleave', debouncedHide); // <--- APLICAÇÃO DO DEBOUNCE
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
    // [CORREÇÃO v20.7]: imgTag agora está definida no topo
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
            class: 'secondary', // Amarelo
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
            class: 'primary', // Verde
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
 * (v21.3 - CORREÇÃO DE BUG "SUBSTITUIR VAZIO") 
 * Configura e exibe o PRIMEIRO modal de IMPORTAÇÃO.
 */
function showImportModal() {
    
    // Define os botões
    let buttons = [
        {
            text: 'Adicionar à Lista Atual',
            class: 'secondary', // Amarelo (Destaque)
            action: () => {
                // Adiciona setTimeout(0) para garantir que o primeiro modal feche 
                // e o DOM se estabilize antes de abrir o segundo.
                setTimeout(() => showImportTypeModal(false), 0);
            }
        }
    ];
    
    // [CORREÇÃO BUG #2]: Só mostra "Substituir" se a lista NÃO estiver vazia.
    if (state.registeredTrees.length > 0) {
        buttons.push({
            text: 'Substituir Lista Atual',
            class: 'primary', // Verde (Padrão)
            action: () => {
                // Adiciona setTimeout(0)
                setTimeout(() => showImportTypeModal(true), 0);
            }
        });
    }
    
    buttons.push({ text: 'Cancelar', class: 'cancel' });

    showActionModal({
        title: '📤 Importar Dados',
        description: 'Você deseja adicionar os dados à lista atual ou substituir a lista inteira? (Substituir apagará todos os dados atuais)',
        buttons: buttons // Usa a lista dinâmica
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
