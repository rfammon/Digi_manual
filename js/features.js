// js/features.js (v19.4 - "Lógica" - O que os botões fazem)

// === 1. IMPORTAÇÕES ===

// Importa o Estado (as variáveis que precisamos ler ou modificar)
import * as state from './state.js';

// Importa a Caixa de Ferramentas (funções de helper)
import * as utils from './utils.js';

// Importa o Banco de Dados (para salvar/deletar/buscar fotos)
import * as db from './database.js';

// Importa a UI (para atualizar a UI após uma ação)
import { 
    renderSummaryTable, 
    showMobileQuestion, 
    setupMobileChecklist, 
    showSubTab 
} from './ui.js';


// === 2. LÓGICA DE GEOLOCALIZAÇÃO (GPS) ===

/**
 * (v17.5) Função principal que captura o GPS (com spinner e salvando a Zona)
 */
export async function handleGetGPS() {
    const gpsStatus = document.getElementById('gps-status');
    const coordXField = document.getElementById('risk-coord-x');
    const coordYField = document.getElementById('risk-coord-y');
    const getGpsBtn = document.getElementById('get-gps-btn');

    if (!navigator.geolocation) {
        gpsStatus.textContent = "Geolocalização não é suportada.";
        gpsStatus.className = 'error';
        return;
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        gpsStatus.textContent = "Erro: Acesso ao GPS requer HTTPS.";
        gpsStatus.className = 'error';
        return;
    }
    
    getGpsBtn.disabled = true;
    getGpsBtn.innerHTML = '🛰️ Capturando... <span class="spinner"></span>';
    gpsStatus.textContent = "Capturando... (1/5)";
    gpsStatus.className = '';    

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    const getSinglePosition = (opts) => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));

    let readings = [];
    try {
        for (let i = 0; i < 5; i++) {
            gpsStatus.textContent = `Capturando... (${i + 1}/5)`;
            const position = await getSinglePosition(options);
            // Usa o helper do utils.js para converter
            readings.push(utils.convertLatLonToUtm(position.coords.latitude, position.coords.longitude));
        }

        if (readings.length === 5) {
            const avgEasting = readings.reduce((sum, r) => sum + r.easting, 0) / 5;
            const avgNorthing = readings.reduce((sum, r) => sum + r.northing, 0) / 5;
            coordXField.value = avgEasting.toFixed(0);    
            coordYField.value = avgNorthing.toFixed(0);    
            
            const zoneStr = `${readings[4].zoneNum}${readings[4].zoneLetter}`;
            gpsStatus.textContent = `Média de 5 leituras (Zona: ${zoneStr})`;
            gpsStatus.className = '';

            // Atualiza o estado global
            state.setLastUtmZone(readings[4].zoneNum, readings[4].zoneLetter);
            
            // Atualiza o campo de zona padrão no mapa
            const defaultZoneInput = document.getElementById('default-utm-zone');
            if (defaultZoneInput) {
                defaultZoneInput.value = zoneStr;
            }
        }
    } catch (error) {
        gpsStatus.className = 'error';
        switch (error.code) {
            case error.PERMISSION_DENIED: gpsStatus.textContent = "Permissão ao GPS negada."; break;
            case error.POSITION_UNAVAILABLE: gpsStatus.textContent = "Posição indisponível."; break;
            case error.TIMEOUT: gpsStatus.textContent = "Tempo esgotado."; break;
            default: gpsStatus.textContent = "Erro ao buscar GPS."; break;
        }
    } finally {
        getGpsBtn.disabled = false;
        getGpsBtn.innerHTML = '🛰️ Capturar GPS';
    }
}


// === 3. LÓGICA DO FORMULÁRIO DE RISCO (CRUD) ===

/**
 * Limpa o preview da foto e reseta a variável de estado.
 */
export function clearPhotoPreview() {
    const previewContainer = document.getElementById('photo-preview-container');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    const oldPreview = document.getElementById('photo-preview');

    if (oldPreview) {
        URL.revokeObjectURL(oldPreview.src); // Libera memória
        previewContainer.removeChild(oldPreview);
    }
    if (removePhotoBtn) {
        removePhotoBtn.style.display = 'none';
    }
    state.setCurrentTreePhoto(null); // Limpa a foto temporária do estado
    
    // Limpa o input de arquivo
    const photoInput = document.getElementById('tree-photo-input');
    if (photoInput) {
        photoInput.value = null;
    }
}

/**
 * (v18.0) Exclui uma árvore da tabela e do DB.
 */
export function handleDeleteTree(id) {
    if (!confirm(`Tem certeza que deseja excluir a Árvore ID ${id}?`)) return;
    
    const treeToDelete = state.registeredTrees.find(tree => tree.id === id);
    
    // Deleta a imagem do IndexedDB se ela existir
    if (treeToDelete && treeToDelete.hasPhoto) {
        db.deleteImageFromDB(id);
    }
    
    // Filtra o array no estado
    const newTrees = state.registeredTrees.filter(tree => tree.id !== id);
    state.setRegisteredTrees(newTrees);
    
    state.saveDataToStorage(); // Salva o novo array no localStorage
    renderSummaryTable(); // Atualiza a UI
    utils.showToast(`🗑️ Árvore ID ${id} excluída.`, 'error'); 
}

/**
 * (v18.0) Carrega dados de uma árvore no formulário para edição.
 */
export function handleEditTree(id) {
    const treeIndex = state.registeredTrees.findIndex(tree => tree.id === id);
    if (treeIndex === -1) return;
    
    const treeToEdit = state.registeredTrees[treeIndex];

    // 1. Preenche campos
    document.getElementById('risk-data').value = treeToEdit.data;
    document.getElementById('risk-especie').value = treeToEdit.especie;
    document.getElementById('risk-local').value = treeToEdit.local;
    document.getElementById('risk-coord-x').value = treeToEdit.coordX;
    document.getElementById('risk-coord-y').value = treeToEdit.coordY;
    document.getElementById('risk-dap').value = treeToEdit.dap;
    document.getElementById('risk-avaliador').value = treeToEdit.avaliador;
    document.getElementById('risk-obs').value = treeToEdit.observacoes;
    
    // Carrega a zona UTM do item para a memória
    state.setLastUtmZone(treeToEdit.utmZoneNum || 0, treeToEdit.utmZoneLetter || 'Z');
    if(document.getElementById('gps-status')) {
        document.getElementById('gps-status').textContent = `Zona (da árvore): ${state.lastUtmZone.num}${state.lastUtmZone.letter}`;
    }

    // Carrega a imagem do IndexedDB para o preview
    const previewContainer = document.getElementById('photo-preview-container');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    clearPhotoPreview(); 
    
    if (treeToEdit.hasPhoto) {
        db.getImageFromDB(id, (imageBlob) => {
            if (imageBlob) {
                const preview = document.createElement('img');
                preview.id = 'photo-preview';
                preview.src = URL.createObjectURL(imageBlob);
                previewContainer.prepend(preview); 
                removePhotoBtn.style.display = 'block'; 
                state.setCurrentTreePhoto(imageBlob); // Armazena o blob
            } else {
                console.warn(`Árvore ID ${id} marcada com foto, mas não encontrada no IndexedDB.`);
            }
        });
    }

    // Preenche checkboxes
    const allCheckboxes = document.querySelectorAll('#risk-calculator-form .risk-checkbox');
    allCheckboxes.forEach((cb, index) => {
        cb.checked = (treeToEdit.riskFactors && treeToEdit.riskFactors[index] === 1) || false;
    });

    // Sincroniza o carrossel mobile (se existir)
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
        setupMobileChecklist(); // Re-inicia o carrossel para ler os novos valores
    }

    // Remove o item do array (será re-adicionado ao salvar)
    const newTrees = state.registeredTrees.filter(tree => tree.id !== id);
    state.setRegisteredTrees(newTrees);
    
    state.saveDataToStorage();
    renderSummaryTable();

    // Rola para o formulário
    document.getElementById('risk-calculator-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Limpa a tabela inteira e o DB de imagens.
 */
export function handleClearAll() {
    if (confirm("Tem certeza que deseja apagar TODAS as árvores cadastradas? Esta ação não pode ser desfeita.")) {
        // Deleta todas as imagens do IndexedDB
        state.registeredTrees.forEach(tree => {
            if (tree.hasPhoto) {
                db.deleteImageFromDB(tree.id);
            }
        });
        
        state.setRegisteredTrees([]); // Limpa o estado
        state.saveDataToStorage(); // Salva o estado vazio
        renderSummaryTable(); // Atualiza a UI
        utils.showToast('🗑️ Tabela limpa.', 'error'); 
    }
}

/**
 * (v18.0) Filtra a tabela de resumo com base no input.
 */
export function handleTableFilter() {
    const filterInput = document.getElementById('table-filter-input');
    if (!filterInput) return;
    const filterText = filterInput.value.toLowerCase();
    const rows = document.querySelectorAll("#summary-table-container tbody tr");
    
    rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(filterText)) {
            row.style.display = ""; // Mostra a linha
        } else {
            row.style.display = "none"; // Esconde a linha
        }
    });
}

/**
 * (v18.0) Atualiza o estado de ordenação e re-renderiza a tabela.
 */
export function handleSort(sortKey) {
    if (state.sortState.key === sortKey) {
        // Inverte a direção se for a mesma coluna
        const newDir = (state.sortState.direction === 'asc') ? 'desc' : 'asc';
        state.setSortState(sortKey, newDir);
    } else {
        // Define a nova coluna e reseta a direção
        state.setSortState(sortKey, 'asc');
    }
    renderSummaryTable(); // A UI vai ler o 'sortState' e se re-desenhar
}


// === 4. LÓGICA DE INTERAÇÃO (MAPA E TABELA) ===

/**
 * (v17.4) Manipulador do botão "Lupa" (Zoom no Ponto).
 */
export function handleZoomToPoint(id) {
    const tree = state.registeredTrees.find(t => t.id === id);
    if (!tree) {
        utils.showToast("Árvore não encontrada.", "error");
        return;
    }

    // Converte as coordenadas usando a lógica do Proj4 (via 'features.js')
    const coords = convertToLatLon(tree); 
    
    if (coords) {
        state.setZoomTargetCoords(coords); // Define o alvo de zoom no estado
        state.setHighlightTargetId(id); // Define o alvo do highlight
        
        // Clica na aba do Mapa
        const mapTabButton = document.querySelector('.sub-nav-btn[data-target="tab-content-mapa"]');
        if (mapTabButton) {
            mapTabButton.click();
        }
    } else {
        utils.showToast(`Coordenadas inválidas para a Árvore ID ${id}. Verifique a Zona UTM Padrão.`, "error");
    }
}

/**
 * (v17.5) Converte Coordenadas (UTM ou Lat/Lon) para Lat/Lon [Latitude, Longitude]
 */
export function convertToLatLon(tree) {
    // Verifica se a biblioteca Proj4js está disponível (deve estar no global scope)
    if (typeof proj4 === 'undefined') {
        console.error("Proj4js não carregado. Não é possível converter UTM.");
        return null; 
    }

    const lon = parseFloat(tree.coordX); // Easting
    const lat = parseFloat(tree.coordY); // Northing

    // Determina qual Zona UTM usar
    let zNum, zLetter;

    // Cenário 1: O dado (v17.2+) tem a zona salva (GPS ou importação)
    if (tree.utmZoneNum > 0 && tree.utmZoneLetter !== 'Z') {
        zNum = tree.utmZoneNum;
        zLetter = tree.utmZoneLetter;
    } 
    // Cenário 2: O dado é antigo (v16.0) ou importado. Usa a zona padrão do input ou do último GPS.
    else {
        const zoneInput = document.getElementById('default-utm-zone');
        if (zoneInput && zoneInput.value) {
            const match = zoneInput.value.trim().match(/^(\d+)([A-Z])$/i); // Ex: "23K"
            if (match) {
                zNum = parseInt(match[1], 10);
                zLetter = match[2].toUpperCase();
            }
        }
        // Fallback para a última zona do GPS se o input estiver vazio
        if (!zNum && state.lastUtmZone.num > 0) {
            zNum = state.lastUtmZone.num;
            zLetter = state.lastUtmZone.letter;
        }
    }

    // Tenta a conversão UTM Precisa (Assume que Coords > 1000 são UTM)
    if (!isNaN(lon) && !isNaN(lat) && !isNaN(zNum) && zNum > 0 && zLetter && zLetter !== 'Z' && lon > 1000 && lat > 1000) {
        const isSouthern = (zLetter.toUpperCase() >= 'C' && zLetter.toUpperCase() <= 'M');
        const hemisphere = isSouthern ? 'south' : 'north';
        const projString = `+proj=utm +zone=${zNum} +${hemisphere} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
        try {
            const [longitude, latitude] = proj4(projString, "EPSG:4326", [lon, lat]);
            return [latitude, longitude]; // Leaflet format [Lat, Lon]
        } catch (e) {
            console.warn("Falha na conversão Proj4js.", e);
        }
    }

    // Fallback (se a conversão UTM falhar OU os dados parecerem ser Lat/Lon)
    if (!isNaN(lon) && !isNaN(lat) && (lat >= -90 && lat <= 90) && (lon >= -180 && lon <= 180)) {
        console.warn(`Dados (ID ${tree.id}) parecem ser Lat/Lon. Usando fallback.`);
        return [lat, lon]; // [Lat, Lon]
    }

    console.warn(`Ponto (ID ${tree.id}) ignorado: Coordenadas inválidas.`, tree);
    return null;
}

/**
 * (v17.5) Manipulador do botão "Aproximar dos Pontos" (Zoom to Extent).
 */
export function handleZoomToExtent() {
    if (!state.mapInstance) {
        utils.showToast("O mapa não está inicializado.", "error");
        return;
    }

    let boundsArray = [];
    state.registeredTrees.forEach(tree => {
        const coords = convertToLatLon(tree); // Usa a mesma função de conversão
        if (coords) {
            boundsArray.push(coords);
        }
    });

    if (boundsArray.length > 0) {
        state.mapInstance.fitBounds(boundsArray, { padding: [50, 50], maxZoom: 18 });
    } else {
        utils.showToast("Não há coordenadas válidas. Verifique a Zona UTM Padrão.", "error");
    }
}

/**
 * (v18.0) Ação de clique duplo no marcador do mapa.
 */
export function handleMapMarkerClick(id) {
    state.setHighlightTargetId(id); // Armazena o ID para destacar
    const summaryTabButton = document.querySelector('.sub-nav-btn[data-target="tab-content-summary"]');
    if (summaryTabButton) {
        summaryTabButton.click(); // Muda para a aba de resumo
    }
}


// === 5. LÓGICA DE IMPORTAÇÃO/EXPORTAÇÃO (v19.2) ===

/**
 * (v19.2) Botão Unificado: EXPORTAR DADOS
 * Pergunta ao usuário qual formato ele deseja.
 */
export function handleExportData() {
    const hasPhotos = state.registeredTrees.some(t => t.hasPhoto);
    
    let choice = 'csv'; // Padrão
    
    // (v19.3) Verificação robusta se o JSZip foi carregado
    if (hasPhotos && typeof JSZip !== 'undefined') {
         choice = confirm(
            "Escolha o formato de exportação:\n\n" +
            "Clique 'OK' para 'Pacote .ZIP'\n" +
            "(Backup completo com CSV + Fotos)\n\n" +
            "Clique 'Cancelar' para 'Apenas .CSV'\n" +
            "(Apenas metadados, sem fotos)"
        ) ? 'zip' : 'csv';
    } else if (hasPhotos && typeof JSZip === 'undefined') {
        utils.showToast("Biblioteca JSZip não carregada. Exportando apenas .CSV.", 'error');
        console.error("Tentativa de exportar ZIP falhou: JSZip não está definido.");
    }

    if (choice === 'zip') {
        handleExportZip();
    } else {
        exportCSV();
    }
}

/**
 * (v19.2) Botão Unificado: IMPORTAR DADOS
 * Pergunta ao usuário qual formato ele vai enviar.
 */
export function handleImportData() {
    const choice = confirm(
        "Escolha o formato de importação:\n\n" +
        "Clique 'OK' para 'Pacote .ZIP'\n" +
        "(Backup completo com CSV + Fotos)\n\n" +
        "Clique 'Cancelar' para 'Apenas .CSV'\n" +
        "(Apenas metadados, sem fotos)"
    );
    
    if (choice) {
        // (v19.3) Verifica se o JSZip está disponível ANTES de abrir o seletor
        if (typeof JSZip === 'undefined') {
             utils.showToast("Erro: Biblioteca JSZip não carregada. Não é possível importar .ZIP.", 'error');
             console.error("Tentativa de importar ZIP falhou: JSZip não está definido.");
             return;
        }
        document.getElementById('zip-importer').click();
    } else {
        document.getElementById('csv-importer').click();
    }
}

/**
 * (v18.0) Gera a string de dados CSV (inclui status da foto)
 */
function getCSVData() {
    if (state.registeredTrees.length === 0) return null;
    const headers = ["ID", "Data Coleta", "Especie", "Coord X (UTM)", "Coord Y (UTM)", "Zona UTM Num", "Zona UTM Letter", "DAP (cm)", "Local", "Avaliador", "Pontuacao", "Classificacao de Risco", "Observacoes", "RiskFactors", "HasPhoto"];
    let csvContent = "\uFEFF" + headers.join(";") + "\n"; // BOM para Excel
    
    state.registeredTrees.forEach(tree => {
        // Limpa quebras de linha e ponto-e-vírgula dos campos de texto
        const cleanEspecie = (tree.especie || '').replace(/[\n;]/g, ','), 
              cleanLocal = (tree.local || '').replace(/[\n;]/g, ','), 
              cleanAvaliador = (tree.avaliador || '').replace(/[\n;]/g, ','), 
              cleanObservacoes = (tree.observacoes || '').replace(/[\n;]/g, ',');
        
        const riskFactorsString = (tree.riskFactors || []).join(',');
        
        const row = [
            tree.id, 
            tree.data, 
            cleanEspecie, 
            tree.coordX, 
            tree.coordY, 
            tree.utmZoneNum || '', 
            tree.utmZoneLetter || '', 
            tree.dap, 
            cleanLocal, 
            cleanAvaliador, 
            tree.pontuacao, 
            tree.risco, 
            cleanObservacoes, 
            riskFactorsString,
            tree.hasPhoto ? 'Sim' : 'Nao' 
        ];
        csvContent += row.join(";") + "\n";
    });
    return csvContent;
}

/**
 * (v19.0) Inicia o download APENAS do arquivo CSV.
 */
function exportCSV() {
    const csvContent = getCSVData();
    if (!csvContent) { 
        utils.showToast("Nenhuma árvore cadastrada para exportar.", 'error'); 
        return; 
    }
    const d = String(new Date().getDate()).padStart(2, '0'), m = String(new Date().getMonth() + 1).padStart(2, '0'), y = new Date().getFullYear();
    const filename = `risco_arboreo_${d}${m}${y}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Libera memória
}

/**
 * (v19.0) Manipulador de EXPORTAÇÃO de Pacote .ZIP
 */
async function handleExportZip() {
    if (state.registeredTrees.length === 0) {
        utils.showToast("Nenhum dado para exportar.", 'error');
        return;
    }

    const zipStatus = document.getElementById('zip-status');
    const zipStatusText = document.getElementById('zip-status-text');
    if (zipStatus) {
        zipStatusText.textContent = 'Gerando pacote .zip...';
        zipStatus.style.display = 'flex';
    }

    try {
        const zip = new JSZip();

        // 1. Adiciona o manifesto CSV
        const csvContent = getCSVData();
        if (csvContent) {
            zip.file("manifesto_dados.csv", csvContent.replace(/^\uFEFF/, ''), {
                encoding: "UTF-8"
            });
        }

        // 2. Adiciona a pasta de imagens (do IndexedDB)
        zipStatusText.textContent = 'Coletando imagens do banco de dados...';
        const images = await db.getAllImagesFromDB();
        
        if (images.length > 0) {
            const imgFolder = zip.folder("images");
            
            images.forEach(imgData => {
                // Garante que a imagem exista no array de árvores atual
                const treeExists = state.registeredTrees.some(t => t.id === imgData.id && t.hasPhoto);
                if (treeExists && imgData.imageBlob) {
                    const extension = (imgData.imageBlob.type.split('/')[1] || 'jpg').split('+')[0];
                    const filename = `tree_id_${imgData.id}.${extension}`;
                    imgFolder.file(filename, imgData.imageBlob, { binary: true });
                }
            });
        }

        // 3. Gera o arquivo .zip e inicia o download
        zipStatusText.textContent = 'Compactando arquivos... (pode levar um momento)';
        const zipBlob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 }
        });

        const d = String(new Date().getDate()).padStart(2, '0'), m = String(new Date().getMonth() + 1).padStart(2, '0'), y = new Date().getFullYear();
        const filename = `backup_completo_risco_${d}${m}${y}.zip`;

        const link = document.createElement("a");
        const url = URL.createObjectURL(zipBlob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        utils.showToast('📦 Pacote .zip exportado com sucesso!', 'success');

    } catch (error) {
        console.error("Erro ao gerar o .zip:", error);
        utils.showToast("Erro ao gerar o pacote .zip.", 'error');
    } finally {
        if (zipStatus) zipStatus.style.display = 'none';
    }
}

/**
 * (v19.0) Manipulador de IMPORTAÇÃO de CSV.
 */
export function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) { 
            utils.showToast("Erro: O ficheiro CSV está vazio ou é inválido.", 'error'); 
            return; 
        }
        
        const append = confirm("Deseja ADICIONAR os dados à lista atual? \n\nClique em 'Cancelar' para SUBSTITUIR a lista atual pelos dados do ficheiro.");
        
        let newTrees = append ? [...state.registeredTrees] : [];
        let maxId = newTrees.length > 0 ? Math.max(...newTrees.map(t => t.id)) : 0;
        
        // Se for substituir, limpa as fotos antigas do DB
        if (!append) {
            const transaction = state.db.transaction(["treeImages"], "readwrite");
            transaction.objectStore("treeImages").clear();
        }
        
        try {
            for (let i = 1; i < lines.length; i++) { // Pula cabeçalho
                const row = lines[i].split(';');
                
                // Validação de formato (v18+)
                const isV18Format = row.length >= 15; 
                const isV17Format = row.length >= 14 && row.length < 15; 
                const isV16Format = row.length >= 12 && row.length < 14; 

                if (!isV16Format && !isV17Format && !isV18Format) { 
                    console.warn("Linha CSV mal formatada, ignorada:", lines[i]); 
                    continue; 
                }

                let pontuacaoIdx, riscoIdx, obsIdx, factorsIdx, dapIdx, localIdx, avaliadorIdx;
                let utmNum = 0, utmLetter = 'Z', hasPhoto = false;

                if (isV18Format) {
                    utmNum = parseInt(row[5], 10) || 0;
                    utmLetter = row[6] || 'Z';
                    dapIdx = 7; localIdx = 8; avaliadorIdx = 9; pontuacaoIdx = 10;
                    riscoIdx = 11; obsIdx = 12; factorsIdx = 13;
                    hasPhoto = (row[14] && row[14].trim().toLowerCase() === 'sim');
                } else if (isV17Format) {
                    utmNum = parseInt(row[5], 10) || 0;
                    utmLetter = row[6] || 'Z';
                    dapIdx = 7; localIdx = 8; avaliadorIdx = 9; pontuacaoIdx = 10;
                    riscoIdx = 11; obsIdx = 12; factorsIdx = 13;
                } else { // isV16Format
                    dapIdx = 5; localIdx = 6; avaliadorIdx = 7; pontuacaoIdx = 8;
                    riscoIdx = 9; obsIdx = 10; factorsIdx = 11;
                }

                const pontuacao = parseInt(row[pontuacaoIdx], 10) || 0;
                let riscoClass = 'risk-col-low';
                if (pontuacao >= 20) riscoClass = 'risk-col-high';
                else if (pontuacao >= 10) riscoClass = 'risk-col-medium';

                const treeData = {
                    id: ++maxId, // Garante ID único
                    data: row[1] || 'N/A',
                    especie: row[2] || 'N/A',
                    coordX: row[3] || 'N/A',
                    coordY: row[4] || 'N/A',
                    utmZoneNum: utmNum,
                    utmZoneLetter: utmLetter,
                    dap: row[dapIdx] || 'N/A',
                    local: row[localIdx] || 'N/A',
                    avaliador: row[avaliadorIdx] || 'N/A',
                    pontuacao: pontuacao,
                    risco: row[riscoIdx] || 'N/A',
                    observacoes: row[obsIdx] || 'N/A',
                    riskFactors: (row[factorsIdx] || '').split(',').map(item => parseInt(item, 10)),
                    riscoClass: riscoClass,
                    hasPhoto: hasPhoto // A foto não é importada, mas o status sim
                };
                newTrees.push(treeData);
            }
            state.setRegisteredTrees(newTrees);
            state.saveDataToStorage();
            renderSummaryTable();
            utils.showToast(`📤 Importação de CSV concluída! ${newTrees.length} registos carregados.`, 'success'); 
        } catch (error) {
            console.error("Erro ao processar o ficheiro CSV:", error);
            utils.showToast("Erro ao processar o ficheiro.", 'error'); 
        } finally { event.target.value = null; }
    };
    reader.onerror = () => { utils.showToast("Erro ao ler o ficheiro.", 'error'); event.target.value = null; };
    reader.readAsText(file);
}

/**
 * (v19.0) Manipulador de IMPORTAÇÃO de Pacote .ZIP
 */
export async function handleImportZip(event) {
    const file = event.target.files[0];
    if (!file) return;

    const zipStatus = document.getElementById('zip-status');
    const zipStatusText = document.getElementById('zip-status-text');
    if (zipStatus) {
        zipStatusText.textContent = 'Lendo o pacote .zip...';
        zipStatus.style.display = 'flex';
    }

    try {
        const zip = await JSZip.loadAsync(file);
        
        // 1. Procura o manifesto CSV
        const csvFile = zip.file("manifesto_dados.csv");
        if (!csvFile) {
            throw new Error("O arquivo 'manifesto_dados.csv' não foi encontrado no .zip.");
        }
        
        const csvContent = await csvFile.async("string");
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length <= 1) {
            throw new Error("O manifesto CSV está vazio.");
        }

        const append = confirm("Deseja ADICIONAR os dados do .zip à lista atual? \n\nClique em 'Cancelar' para SUBSTITUIR a lista atual.");
        
        zipStatusText.textContent = 'Processando manifesto de dados...';
        
        let newTrees = append ? [...state.registeredTrees] : [];
        let maxId = newTrees.length > 0 ? Math.max(...newTrees.map(t => t.id)) : 0;
        let imageSavePromises = []; 

        // Limpa o DB de imagens se for substituir
        if (!append) {
            const transaction = state.db.transaction(["treeImages"], "readwrite");
            transaction.objectStore("treeImages").clear();
        }

        // 2. Processa as linhas do CSV (começa do 1 para pular o cabeçalho)
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(';');
            if (row.length < 15) { 
                console.warn("Linha CSV mal formatada, ignorada:", lines[i]);
                continue;
            }

            const oldId = row[0]; // O ID original (usado para o nome do arquivo da foto)
            const newId = ++maxId; // O NOVO ID no banco de dados
            
            const pontuacao = parseInt(row[10], 10) || 0;
            let riscoClass = 'risk-col-low';
            if (pontuacao >= 20) riscoClass = 'risk-col-high';
            else if (pontuacao >= 10) riscoClass = 'risk-col-medium';

            const treeData = {
                id: newId, 
                data: row[1] || 'N/A',
                especie: row[2] || 'N/A',
                coordX: row[3] || 'N/A',
                coordY: row[4] || 'N/A',
                utmZoneNum: parseInt(row[5], 10) || 0,
                utmZoneLetter: row[6] || 'Z',
                dap: row[7] || 'N/A',
                local: row[8] || 'N/A',
                avaliador: row[9] || 'N/A',
                pontuacao: pontuacao,
                risco: row[11] || 'N/A',
                observacoes: row[12] || 'N/A',
                riskFactors: (row[13] || '').split(',').map(item => parseInt(item, 10)),
                riscoClass: riscoClass,
                hasPhoto: (row[14] && row[14].trim().toLowerCase() === 'sim')
            };

            // 3. Se a árvore tem foto, procura no zip e prepara para salvar
            if (treeData.hasPhoto) {
                const imgFile = zip.file(new RegExp(`^images/tree_id_${oldId}\\.(jpg|jpeg|png|webp)$`, "i"))[0];
                
                if (imgFile) {
                    imageSavePromises.push(
                        imgFile.async("blob").then(blob => {
                            db.saveImageToDB(newId, blob); // Salva com o NOVO ID
                        })
                    );
                } else {
                    console.warn(`Foto para o ID ${oldId} não encontrada no .zip.`);
                    treeData.hasPhoto = false; 
                }
            }
            newTrees.push(treeData);
        } // Fim do loop do CSV

        // 4. Espera todas as imagens serem salvas no IndexedDB
        zipStatusText.textContent = `Salvando ${imageSavePromises.length} imagens no banco de dados...`;
        await Promise.all(imageSavePromises);

        // 5. Salva os metadados e atualiza a interface
        state.setRegisteredTrees(newTrees);
        state.saveDataToStorage();
        renderSummaryTable();
        
        utils.showToast(`📤 Importação do .zip concluída! ${newTrees.length} registros carregados.`, 'success');

    } catch (error) {
        console.error("Erro ao importar o .zip:", error);
        utils.showToast(`Erro: ${error.message}`, 'error');
    } finally {
        if (zipStatus) zipStatus.style.display = 'none';
        event.target.value = null; // Limpa o input de arquivo
    }
}

// === 6. LÓGICA DE FEATURES COMPLEMENTARES (CHAT, CONTATO, EMAIL) ===

/**
 * Gera o texto resumido para o corpo do e-mail.
 */
function generateEmailSummaryText() {
    if (state.registeredTrees.length === 0) return "Nenhuma árvore foi cadastrada na tabela de resumo.";
    let textBody = "Segue o relatório resumido das árvores avaliadas:\n\n";
    textBody += "ID\t|\tData\t\t|\tEspécie (Nome/Tag)\t|\tLocal\t\t|\tClassificação de Risco\t|\tObservações\n";
    textBody += "----------------------------------------------------------------------------------------------------------------------------------------------------------\n";
    
    state.registeredTrees.forEach(tree => {
        const [y, m, d] = (tree.data || '---').split('-');
        const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
        const cleanEspecie = (tree.especie || 'N/A').padEnd(20, ' ').substring(0, 20);
        const cleanLocal = (tree.local || 'N/A').padEnd(15, ' ').substring(0, 15);
        const cleanObs = (tree.observacoes || 'N/A').replace(/[\n\t]/g, ' ').substring(0, 30);
        textBody += `${tree.id}\t|\t${displayDate}\t|\t${cleanEspecie}\t|\t${cleanLocal}\t|\t${tree.risco}\t|\t${cleanObs}\n`;
    });
    
    textBody += "\n\n";
    textBody += "Instrução Importante:\n";
    textBody += "Para o relatório completo (com coordenadas, DAP, etc.), clique em 'Exportar Dados' no aplicativo e anexe o arquivo baixado a este e-mail antes de enviar.\n";
    return textBody;
}

/**
 * Abre o cliente de e-mail padrão com os dados resumidos.
 */
export function sendEmailReport() {
    const targetEmail = "";
    const subject = "Relatório de Avaliação de Risco Arbóreo";
    const emailBody = generateEmailSummaryText();
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:${targetEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    
    if (mailtoLink.length > 2000) { 
        utils.showToast("Muitos dados para e-mail. Use 'Exportar Dados'.", 'error'); 
        return; 
    }
    window.location.href = mailtoLink;
}

/**
 * Manipulador do formulário de contato (abre cliente de e-mail).
 * (Chamado pelo main.js)
 */
export function handleContactForm(event) {
    event.preventDefault();    
    const targetEmail = "rafael.ammon.prestserv@petrobras.com.br";
    const nome = document.getElementById('nome').value;
    const emailRetorno = document.getElementById('email').value;
    const assunto = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value;
    const emailBody = `
Prezado(a),

Esta é uma dúvida enviada através do Manual Digital de Poda e Corte.
---------------------------------------------------
Enviado por: ${nome}
Email de Retorno: ${emailRetorno}
---------------------------------------------------

Mensagem:
${mensagem}
    `;
    const encodedSubject = encodeURIComponent(assunto);
    const encodedBody = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:${targetEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    window.location.href = mailtoLink;
}

/**
 * Manipulador do Chat (Esqueleto).
 * (Chamado pelo main.js)
 */
export async function handleChatSend() {
    const chatInput = document.getElementById('chat-input');
    const chatResponseBox = document.getElementById('chat-response-box');
    const userQuery = chatInput.value.trim();
    if (userQuery === "") return;
    
    chatResponseBox.innerHTML = `<p class="chat-response-text loading">Buscando no manual...</p>`;
    chatInput.value = "";
    
    try {
        const PONTESEGURA_URL = "URL_DA_SUA_FUNCAO_GOOGLE_CLOUD_AQUI";
        if (PONTESEGURA_URL === "URL_DA_SUA_FUNCAO_GOOGLE_CLOUD_AQUI") {
             chatResponseBox.innerHTML = `<p class="chat-response-text" style="color: gray;"><strong>Status:</strong> O assistente digital ainda precisa ser configurado com uma URL de API válida (Google Cloud Function).</p>`;
             return;
        }
        // Lógica de fetch (substitua pela sua implementação de API)
        const response = await fetch(PONTESEGURA_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ query: userQuery }) 
        });
        if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
        const data = await response.json();
        chatResponseBox.innerHTML = `<p class="chat-response-text">${data.response}</p>`;
        
    } catch (error) {
        console.error('Erro na API Gemini:', error);
        chatResponseBox.innerHTML = `<p class="chat-response-text" style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
    }
}
