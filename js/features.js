// js/features.js (v19.4 - CORRIGIDO - Sem dependência circular)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import * as utils from './utils.js';
import * as db from './database.js';

// === 2. LÓGICA DE GEOLOCALIZAÇÃO (GPS) ===
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
            state.setLastUtmZone(readings[4].zoneNum, readings[4].zoneLetter);
            
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

export function clearPhotoPreview() {
    const previewContainer = document.getElementById('photo-preview-container');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    const oldPreview = document.getElementById('photo-preview');

    if (oldPreview) {
        URL.revokeObjectURL(oldPreview.src); 
        previewContainer.removeChild(oldPreview);
    }
    if (removePhotoBtn) {
        removePhotoBtn.style.display = 'none';
    }
    state.setCurrentTreePhoto(null); 
    
    const photoInput = document.getElementById('tree-photo-input');
    if (photoInput) {
        photoInput.value = null;
    }
}

export function handleDeleteTree(id) {
    if (!confirm(`Tem certeza que deseja excluir a Árvore ID ${id}?`)) return;
    
    const treeToDelete = state.registeredTrees.find(tree => tree.id === id);
    
    if (treeToDelete && treeToDelete.hasPhoto) {
        db.deleteImageFromDB(id);
    }
    
    const newTrees = state.registeredTrees.filter(tree => tree.id !== id);
    state.setRegisteredTrees(newTrees);
    state.saveDataToStorage(); 
    // A função renderSummaryTable() será chamada pelo ui.js
    utils.showToast(`🗑️ Árvore ID ${id} excluída.`, 'error'); 
}

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
    
    state.setLastUtmZone(treeToEdit.utmZoneNum || 0, treeToEdit.utmZoneLetter || 'Z');
    if(document.getElementById('gps-status')) {
        document.getElementById('gps-status').textContent = `Zona (da árvore): ${state.lastUtmZone.num}${state.lastUtmZone.letter}`;
    }

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
                state.setCurrentTreePhoto(imageBlob); 
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

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
        // A função setupMobileChecklist() será chamada pelo ui.js
        return true; // Indica ao UI.js para recarregar o carrossel
    }

    // Remove o item do array
    const newTrees = state.registeredTrees.filter(tree => tree.id !== id);
    state.setRegisteredTrees(newTrees);
    state.saveDataToStorage();
    // A função renderSummaryTable() será chamada pelo ui.js

    document.getElementById('risk-calculator-form').scrollIntoView({ behavior: 'smooth' });
    return false; // Não precisa recarregar o carrossel
}

export function handleClearAll() {
    if (confirm("Tem certeza que deseja apagar TODAS as árvores cadastradas? Esta ação não pode ser desfeita.")) {
        state.registeredTrees.forEach(tree => {
            if (tree.hasPhoto) {
                db.deleteImageFromDB(tree.id);
            }
        });
        
        state.setRegisteredTrees([]); 
        state.saveDataToStorage(); 
        // A função renderSummaryTable() será chamada pelo ui.js
        utils.showToast('🗑️ Tabela limpa.', 'error'); 
    }
}

export function handleTableFilter() {
    const filterInput = document.getElementById('table-filter-input');
    if (!filterInput) return;
    const filterText = filterInput.value.toLowerCase();
    const rows = document.querySelectorAll("#summary-table-container tbody tr");
    
    rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(filterText)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

export function handleSort(sortKey) {
    if (state.sortState.key === sortKey) {
        const newDir = (state.sortState.direction === 'asc') ? 'desc' : 'asc';
        state.setSortState(sortKey, newDir);
    } else {
        state.setSortState(sortKey, 'asc');
    }
    // A função renderSummaryTable() será chamada pelo ui.js
}

// === 4. LÓGICA DE INTERAÇÃO (MAPA E TABELA) ===

export function handleZoomToPoint(id) {
    const tree = state.registeredTrees.find(t => t.id === id);
    if (!tree) {
        utils.showToast("Árvore não encontrada.", "error");
        return;
    }

    const coords = convertToLatLon(tree); 
    
    if (coords) {
        state.setZoomTargetCoords(coords); 
        state.setHighlightTargetId(id); 
        
        const mapTabButton = document.querySelector('.sub-nav-btn[data-target="tab-content-mapa"]');
        if (mapTabButton) {
            mapTabButton.click();
        }
    } else {
        utils.showToast(`Coordenadas inválidas para a Árvore ID ${id}. Verifique a Zona UTM Padrão.`, "error");
    }
}

export function convertToLatLon(tree) {
    if (typeof proj4 === 'undefined') {
        console.error("Proj4js não carregado. Não é possível converter UTM.");
        return null; 
    }

    const lon = parseFloat(tree.coordX); 
    const lat = parseFloat(tree.coordY); 

    let zNum, zLetter;

    if (tree.utmZoneNum > 0 && tree.utmZoneLetter !== 'Z') {
        zNum = tree.utmZoneNum;
        zLetter = tree.utmZoneLetter;
    } 
    else {
        const zoneInput = document.getElementById('default-utm-zone');
        if (zoneInput && zoneInput.value) {
            const match = zoneInput.value.trim().match(/^(\d+)([A-Z])$/i); 
            if (match) {
                zNum = parseInt(match[1], 10);
                zLetter = match[2].toUpperCase();
            }
        }
        if (!zNum && state.lastUtmZone.num > 0) {
            zNum = state.lastUtmZone.num;
            zLetter = state.lastUtmZone.letter;
        }
    }

    if (!isNaN(lon) && !isNaN(lat) && !isNaN(zNum) && zNum > 0 && zLetter && zLetter !== 'Z' && lon > 1000 && lat > 1000) {
        const isSouthern = (zLetter.toUpperCase() >= 'C' && zLetter.toUpperCase() <= 'M');
        const hemisphere = isSouthern ? 'south' : 'north';
        const projString = `+proj=utm +zone=${zNum} +${hemisphere} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
        try {
            const [longitude, latitude] = proj4(projString, "EPSG:4326", [lon, lat]);
            return [latitude, longitude]; 
        } catch (e) {
            console.warn("Falha na conversão Proj4js.", e);
        }
    }

    if (!isNaN(lon) && !isNaN(lat) && (lat >= -90 && lat <= 90) && (lon >= -180 && lon <= 180)) {
        console.warn(`Dados (ID ${tree.id}) parecem ser Lat/Lon. Usando fallback.`);
        return [lat, lon];
    }

    console.warn(`Ponto (ID ${tree.id}) ignorado: Coordenadas inválidas.`, tree);
    return null;
}

export function handleZoomToExtent() {
    if (!state.mapInstance) {
        utils.showToast("O mapa não está inicializado.", "error");
        return;
    }

    let boundsArray = [];
    state.registeredTrees.forEach(tree => {
        const coords = convertToLatLon(tree); 
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

export function handleMapMarkerClick(id) {
    state.setHighlightTargetId(id); 
    const summaryTabButton = document.querySelector('.sub-nav-btn[data-target="tab-content-summary"]');
    if (summaryTabButton) {
        summaryTabButton.click(); 
    }
}

// === 5. LÓGICA DE IMPORTAÇÃO/EXPORTAÇÃO (v19.2) ===

export function handleExportData() {
    const hasPhotos = state.registeredTrees.some(t => t.hasPhoto);
    let choice = 'csv';
    
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

export function handleImportData() {
    const choice = confirm(
        "Escolha o formato de importação:\n\n" +
        "Clique 'OK' para 'Pacote .ZIP'\n" +
        "(Backup completo com CSV + Fotos)\n\n" +
        "Clique 'Cancelar' para 'Apenas .CSV'\n" +
        "(Apenas metadados, sem fotos)"
    );
    
    if (choice) {
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

function getCSVData() {
    if (state.registeredTrees.length === 0) return null;
    const headers = ["ID", "Data Coleta", "Especie", "Coord X (UTM)", "Coord Y (UTM)", "Zona UTM Num", "Zona UTM Letter", "DAP (cm)", "Local", "Avaliador", "Pontuacao", "Classificacao de Risco", "Observacoes", "RiskFactors", "HasPhoto"];
    let csvContent = "\uFEFF" + headers.join(";") + "\n";
    
    state.registeredTrees.forEach(tree => {
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
    URL.revokeObjectURL(url);
}

async function handleExportZip() {
    if (typeof JSZip === 'undefined') {
        utils.showToast("Erro: Biblioteca JSZip não carregada. Verifique o console (F12).", 'error');
        console.error("Falha na exportação: JSZip não está definido. Verifique se o arquivo 'libs/jszip.min.js' foi carregado corretamente no index.html.");
        return;
    }
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
        const csvContent = getCSVData();
        if (csvContent) {
            zip.file("manifesto_dados.csv", csvContent.replace(/^\uFEFF/, ''), {
                encoding: "UTF-8"
            });
        }

        zipStatusText.textContent = 'Coletando imagens do banco de dados...';
        const images = await db.getAllImagesFromDB();
        
        if (images.length > 0) {
            const imgFolder = zip.folder("images");
            images.forEach(imgData => {
                const treeExists = state.registeredTrees.some(t => t.id === imgData.id && t.hasPhoto);
                if (treeExists && imgData.imageBlob) {
                    const extension = (imgData.imageBlob.type.split('/')[1] || 'jpg').split('+')[0];
                    const filename = `tree_id_${imgData.id}.${extension}`;
                    imgFolder.file(filename, imgData.imageBlob, { binary: true });
                }
            });
        }

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

export async function handleImportZip(event) {
    if (typeof JSZip === 'undefined') {
        utils.showToast("Erro: Biblioteca JSZip não carregada. Verifique o console (F12).", 'error');
        console.error("Falha na importação: JSZip não está definido.");
        return;
    }
    
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

        if (!append) {
            const transaction = state.db.transaction(["treeImages"], "readwrite");
            transaction.objectStore("treeImages").clear();
        }

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(';');
            if (row.length < 15) { 
                console.warn("Linha CSV mal formatada, ignorada:", lines[i]);
                continue;
            }

            const oldId = row[0]; 
            const newId = ++maxId;
            
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
        }

        zipStatusText.textContent = `Salvando ${imageSavePromises.length} imagens no banco de dados...`;
        await Promise.all(imageSavePromises);

        state.setRegisteredTrees(newTrees);
        state.saveDataToStorage();
        // A função renderSummaryTable() será chamada pelo ui.js
        utils.showToast(`📤 Importação do .zip concluída! ${newTrees.length} registos carregados.`, 'success');

    } catch (error) {
        console.error("Erro ao importar o .zip:", error);
        utils.showToast(`Erro: ${error.message}`, 'error');
    } finally {
        if (zipStatus) zipStatus.style.display = 'none';
        event.target.value = null; 
    }
}

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
        
        if (!append) {
            const transaction = state.db.transaction(["treeImages"], "readwrite");
            transaction.objectStore("treeImages").clear();
        }
        
        try {
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(';');
                
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
                } else {
                    dapIdx = 5; localIdx = 6; avaliadorIdx = 7; pontuacaoIdx = 8;
                    riscoIdx = 9; obsIdx = 10; factorsIdx = 11;
                }

                const pontuacao = parseInt(row[pontuacaoIdx], 10) || 0;
                let riscoClass = 'risk-col-low';
                if (pontuacao >= 20) riscoClass = 'risk-col-high';
                else if (pontuacao >= 10) riscoClass = 'risk-col-medium';

                const treeData = {
                    id: ++maxId, 
                    data: row[1] || 'N/A',
                    especie: row[2] || 'N/A',
