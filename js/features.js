// js/features.js (v21.4 - OTIMIZAÇÃO DE IMAGEM)

// === 1. IMPORTAÇÕES ===
import * as state from './state.js';
import { showToast, convertLatLonToUtm } from './utils.js';
import { 
    addTreeToDB, getTreesFromDB, updateTreeInDB, deleteTreeFromDB, 
    clearAllTreesFromDB, addImageToDB, getImageFromDB, deleteImageFromDB,
    clearAllImagesFromDB 
} from './database.js';
import { renderSummaryTable, setupMobileChecklist, showSubTab } from './ui.js';

// === 2. FUNÇÕES DE UTILIDADE/LÓGICA ===

/**
 * Retorna o valor de ordenação adequado para uma coluna.
 */
export function getSortValue(tree, key) {
    switch (key) {
        case 'id':
        case 'pontuacao':
        case 'dap':
        case 'coordX':
        case 'coordY':
        case 'utmZoneNum': // Adicionado para ordenação de número de zona
            return parseFloat(tree[key]);
        case 'data':
            return new Date(tree[key]).getTime();
        default:
            return tree[key] ? tree[key].toLowerCase() : '';
    }
}

/**
 * Converte coordenadas UTM de volta para Lat/Lon.
 * @param {object} tree - Objeto da árvore com dados UTM.
 * @returns {[number, number]|null} [latitude, longitude] ou null se falhar.
 */
export function convertToLatLon(tree) {
    if (!tree.coordX || !tree.coordY || !tree.utmZoneNum || !tree.utmZoneLetter) {
        return null;
    }

    try {
        if (typeof proj4 === 'undefined') {
            console.error("Proj4js não carregado. Não é possível converter UTM para LatLon.");
            return null;
        }

        const utmProj = `+proj=utm +zone=${tree.utmZoneNum} +${tree.utmZoneLetter.toLowerCase() === 'n' ? 'north' : 'south'} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
        const wgs84 = "EPSG:4326";

        const [lon, lat] = proj4(utmProj, wgs84, [tree.coordX, tree.coordY]);
        return [lat, lon];

    } catch (e) {
        console.error("Erro ao converter UTM para LatLon:", e);
        showToast("Erro ao exibir árvore no mapa (conversão UTM->LatLon).", "error");
        return null;
    }
}

// === 3. FUNÇÕES DE MANIPULAÇÃO DE DADOS ===

/**
 * Adiciona ou atualiza uma árvore no estado e no DB.
 * @param {object} treeData - Dados da árvore.
 * @param {File|Blob|null} photoBlob - Blob da foto ou null.
 */
async function saveTreeAndPhoto(treeData, photoBlob) {
    try {
        let treeId = treeData.id;
        
        // Se for uma nova árvore, adiciona ao DB primeiro para obter um ID.
        if (state.isEditing === false) {
            treeId = await addTreeToDB(treeData);
            // Atualiza o ID no objeto treeData, caso o DB tenha gerado um novo
            treeData.id = treeId; 
        } else {
            await updateTreeInDB(treeData);
        }

        if (photoBlob) {
            await addImageToDB(treeId, photoBlob);
            // Garante que o registro da árvore indique que tem uma foto
            treeData.hasPhoto = true; 
            await updateTreeInDB(treeData); // Atualiza novamente a árvore para refletir 'hasPhoto'
        } else if (treeData.hasPhoto && !state.currentTreePhoto) {
            // Se tinha foto e foi removida durante a edição
            await deleteImageFromDB(treeId);
            treeData.hasPhoto = false;
            await updateTreeInDB(treeData);
        }
        
        // Atualiza o estado global com os dados mais recentes
        const index = state.registeredTrees.findIndex(t => t.id === treeId);
        if (index > -1) {
            state.registeredTrees[index] = treeData;
        } else {
            state.registeredTrees.push(treeData);
        }
        state.setRegisteredTrees([...state.registeredTrees]); // Força a reatividade

        return treeId;

    } catch (error) {
        console.error("Erro ao salvar árvore e foto:", error);
        showToast("Erro ao salvar dados da árvore. Tente novamente.", "error");
        return null;
    }
}

// === 4. FUNÇÕES DE INTERAÇÃO COM O USUÁRIO (EVENT HANDLERS) ===

/**
 * Lida com o evento de envio do formulário de registro de árvore.
 */
export async function handleAddTreeSubmit(event) {
    event.preventDefault();
    
    // Coleta dados do formulário
    const form = event.target;
    const formData = new FormData(form);
    
    const dapCm = parseFloat(formData.get('dap'));
    const alturaM = parseFloat(formData.get('altura'));
    const risco = formData.get('risco');
    const pontuacao = parseInt(formData.get('pontuacao'), 10);
    const coordX = parseFloat(formData.get('coordX'));
    const coordY = parseFloat(formData.get('coordY'));
    const utmZoneNum = parseInt(formData.get('utmZoneNum'), 10);
    const utmZoneLetter = formData.get('utmZoneLetter');

    // Validação básica
    if (!form.checkValidity()) {
        showToast("Preencha todos os campos obrigatórios.", "error");
        form.reportValidity(); // Mostra as mensagens de validação do HTML5
        return false;
    }

    // Cria o objeto da árvore
    let treeData = {
        id: state.isEditing ? state.editingTreeId : Date.now(), // Usa ID existente se editando
        data: formData.get('data'),
        especie: formData.get('especie'),
        dap: isNaN(dapCm) ? null : dapCm,
        altura: isNaN(alturaM) ? null : alturaM,
        coordX: isNaN(coordX) ? null : coordX,
        coordY: isNaN(coordY) ? null : coordY,
        utmZoneNum: isNaN(utmZoneNum) ? null : utmZoneNum,
        utmZoneLetter: utmZoneLetter || '',
        local: formData.get('local'),
        avaliador: formData.get('avaliador'),
        risco: risco,
        pontuacao: isNaN(pontuacao) ? null : pontuacao,
        observacoes: formData.get('observacoes'),
        hasPhoto: !!state.currentTreePhoto // Indica se há uma foto associada
    };
    
    // Salva a árvore e a foto
    const savedTreeId = await saveTreeAndPhoto(treeData, state.currentTreePhoto);

    if (savedTreeId) {
        showToast(state.isEditing ? `Árvore ID ${savedTreeId} atualizada!` : `Árvore ID ${savedTreeId} cadastrada com sucesso!`);
        form.reset(); // Limpa o formulário após o sucesso
        state.setCurrentTreePhoto(null); // Limpa a foto do estado
        clearPhotoPreview(); // Limpa a pré-visualização
        // (v18.0) Volta o avaliador e data para o padrão
        document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
        document.getElementById('risk-avaliador').value = state.lastEvaluatorName;
        state.setIsEditing(false); // Reseta o modo de edição
        state.setEditingTreeId(null);
        return true;
    }
    return false;
}

/**
 * Lida com a exclusão de uma árvore.
 */
export async function handleDeleteTree(id) {
    try {
        await deleteTreeFromDB(id);
        await deleteImageFromDB(id); // Exclui também a foto
        state.setRegisteredTrees(state.registeredTrees.filter(tree => tree.id !== id));
        showToast(`Árvore ID ${id} e sua foto foram removidas.`);
        return true;
    } catch (error) {
        console.error("Erro ao excluir árvore:", error);
        showToast("Erro ao excluir a árvore. Tente novamente.", "error");
        return false;
    }
}

/**
 * Lida com o carregamento de uma árvore para edição.
 */
export async function handleEditTree(id) {
    const treeToEdit = state.registeredTrees.find(tree => tree.id === id);
    if (!treeToEdit) {
        showToast("Árvore não encontrada para edição.", "error");
        return false;
    }

    // Preenche o formulário
    document.getElementById('risk-data').value = treeToEdit.data;
    document.getElementById('risk-especie').value = treeToEdit.especie;
    document.getElementById('risk-dap').value = treeToEdit.dap;
    document.getElementById('risk-altura').value = treeToEdit.altura;
    document.getElementById('risk-coordX').value = treeToEdit.coordX;
    document.getElementById('risk-coordY').value = treeToEdit.coordY;
    document.getElementById('risk-utm-zone-num').value = treeToEdit.utmZoneNum;
    document.getElementById('risk-utm-zone-letter').value = treeToEdit.utmZoneLetter;
    document.getElementById('risk-local').value = treeToEdit.local;
    document.getElementById('risk-avaliador').value = treeToEdit.avaliador;
    document.getElementById('risk-pontuacao').value = treeToEdit.pontuacao;
    document.getElementById('risk-risco').value = treeToEdit.risco;
    document.getElementById('risk-observacoes').value = treeToEdit.observacoes;

    // Lida com a foto
    clearPhotoPreview();
    if (treeToEdit.hasPhoto) {
        getImageFromDB(treeToEdit.id, (imageBlob) => {
            if (imageBlob) {
                const preview = document.createElement('img');
                preview.id = 'photo-preview';
                preview.src = URL.createObjectURL(imageBlob);
                document.getElementById('photo-preview-container').prepend(preview);
                document.getElementById('remove-photo-btn').style.display = 'block';
                state.setCurrentTreePhoto(imageBlob); // Define a foto atual como o blob do DB
            }
        });
    } else {
        state.setCurrentTreePhoto(null);
    }
    
    // Define o modo de edição
    state.setIsEditing(true);
    state.setEditingTreeId(id);
    showToast(`Editando árvore ID ${id}.`, 'success');
    
    // (v20.2) Retorna true para UI.js saber que precisa atualizar o carrossel (se mobile)
    return true; 
}

/**
 * Lida com o clique no botão "Limpar Tudo".
 */
export async function handleClearAll() {
    try {
        await clearAllTreesFromDB();
        await clearAllImagesFromDB();
        state.setRegisteredTrees([]);
        showToast("Todos os registros e fotos foram removidos.");
        return true;
    } catch (error) {
        console.error("Erro ao limpar todos os registros:", error);
        showToast("Erro ao limpar registros. Tente novamente.", "error");
        return false;
    }
}

/**
 * Limpa a pré-visualização da foto.
 */
export function clearPhotoPreview() {
    const preview = document.getElementById('photo-preview');
    if (preview) {
        URL.revokeObjectURL(preview.src); // Libera a memória do Blob URL
        preview.remove();
    }
    document.getElementById('remove-photo-btn').style.display = 'none';
    state.setCurrentTreePhoto(null); // Limpa a foto do estado
    
    // (v21.4) Limpa o input file também para permitir re-seleção do mesmo arquivo
    const photoInput = document.getElementById('tree-photo-input');
    if (photoInput) {
        photoInput.value = '';
    }
}

/**
 * Lida com a captura das coordenadas GPS.
 */
export function handleGetGPS() {
    const statusDiv = document.getElementById('gps-status');
    if (statusDiv) {
        statusDiv.textContent = 'Buscando GPS...';
        statusDiv.className = 'gps-loading';
    }

    if (!navigator.geolocation) {
        showToast("Seu navegador não suporta geolocalização.", "error");
        if (statusDiv) { statusDiv.textContent = 'GPS Não Suportado'; statusDiv.className = 'gps-error'; }
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Tenta converter para UTM
            const utmCoords = convertLatLonToUtm(lat, lon);

            if (utmCoords) {
                document.getElementById('risk-coordX').value = utmCoords.easting;
                document.getElementById('risk-coordY').value = utmCoords.northing;
                document.getElementById('risk-utm-zone-num').value = utmCoords.zoneNum;
                document.getElementById('risk-utm-zone-letter').value = utmCoords.zoneLetter;
                showToast("Coordenadas GPS obtidas e convertidas para UTM!");
                if (statusDiv) { statusDiv.textContent = 'GPS OK!'; statusDiv.className = 'gps-success'; }
            } else {
                // Em caso de falha na conversão, mostra Lat/Lon originais
                document.getElementById('risk-coordX').value = lat.toFixed(6); // Usa Lat como X
                document.getElementById('risk-coordY').value = lon.toFixed(6); // Usa Lon como Y
                document.getElementById('risk-utm-zone-num').value = '';
                document.getElementById('risk-utm-zone-letter').value = '';
                showToast("Coordenadas GPS obtidas, mas falha na conversão para UTM. Exibindo Lat/Lon.", "error");
                if (statusDiv) { statusDiv.textContent = 'GPS OK (Falha UTM)'; statusDiv.className = 'gps-warning'; }
            }
        },
        (error) => {
            let errorMessage = "Erro ao obter GPS: ";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "Permissão negada. Ative o GPS nas configurações do navegador/celular.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "Localização indisponível. Tente novamente.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "Tempo esgotado ao buscar localização.";
                    break;
                default:
                    errorMessage += "Erro desconhecido.";
                    break;
            }
            showToast(errorMessage, "error");
            if (statusDiv) { statusDiv.textContent = 'Erro GPS'; statusDiv.className = 'gps-error'; }
        },
        {
            enableHighAccuracy: true, // Tenta obter a melhor precisão possível
            timeout: 10000,           // Tempo máximo (10 segundos)
            maximumAge: 0             // Não usa posições cacheadas
        }
    );
}

/**
 * Lida com a ordenação da tabela.
 */
export function handleSort(key) {
    if (state.sortState.key === key) {
        // Inverte a direção se for a mesma coluna
        state.setSortState({
            key: key,
            direction: state.sortState.direction === 'asc' ? 'desc' : 'asc'
        });
    } else {
        // Define a nova coluna e direção padrão ascendente
        state.setSortState({ key: key, direction: 'asc' });
    }
    renderSummaryTable();
}

/**
 * Lida com o filtro da tabela.
 */
export function handleTableFilter(event) {
    const filterText = event.target.value.toLowerCase();
    
    // (v19.6) Carrega todos os registros do DB e então filtra (garante que todos os dados estão lá)
    getTreesFromDB().then(trees => {
        state.setRegisteredTrees(trees); // Atualiza o estado com a versão completa
        
        const filteredTrees = trees.filter(tree => {
            // Converte todos os campos para string e verifica a ocorrência do texto
            return Object.values(tree).some(value => 
                String(value).toLowerCase().includes(filterText)
            );
        });
        // Atualiza o estado com os itens filtrados para que renderSummaryTable os exiba
        state.setRegisteredTrees(filteredTrees);
        renderSummaryTable(); // Re-renderiza com os dados filtrados
    }).catch(error => {
        console.error("Erro ao carregar árvores para filtro:", error);
        showToast("Erro ao filtrar registros.", "error");
    });
}

/**
 * [CRÍTICO PARA PERFORMANCE]
 * OTIMIZAÇÃO DE IMAGEM: Redimensiona e comprime uma imagem (Blob).
 * Retorna um novo Blob com a imagem otimizada.
 * @param {File|Blob} imageFile - O arquivo de imagem original.
 * @param {number} maxWidth - Largura máxima desejada para a imagem.
 * @param {number} quality - Qualidade JPEG (0 a 1).
 * @returns {Promise<Blob>} Um Promise que resolve para o Blob da imagem otimizada.
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

            img.onerror = (error) => reject(error); // Lida com erros de carregamento da imagem
        };

        reader.onerror = (error) => reject(error); // Lida com erros de leitura do arquivo
    });
}

/**
 * Lida com a seleção de uma foto (v21.4: AGORA OTIMIZA A IMAGEM)
 */
export async function handlePhotoInput(event) {
    const file = event.target.files[0];
    if (file) {
        clearPhotoPreview(); 
        
        // --- NOVA LÓGICA DE OTIMIZAÇÃO ---
        try {
            const optimizedBlob = await optimizeImage(file, 800, 0.7); // 800px largura, 70% qualidade JPEG
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
            clearPhotoPreview();
        }
    }
}


/**
 * Lida com o zoom no mapa para uma árvore específica.
 */
export function handleZoomToPoint(id) {
    const tree = state.registeredTrees.find(t => t.id === id);
    if (tree) {
        const coords = convertToLatLon(tree);
        if (coords) {
            state.setZoomTargetCoords(coords);
            showSubTab('tab-content-mapa'); // Vai para a aba do mapa
        } else {
            showToast("Não foi possível localizar esta árvore no mapa.", "error");
        }
    }
}

/**
 * Lida com o zoom no mapa para exibir todas as árvores.
 */
export function handleZoomToExtent() {
    if (!state.mapInstance || state.registeredTrees.length === 0) {
        showToast("Nenhuma árvore para exibir no mapa.", "error");
        return;
    }

    let bounds = L.latLngBounds([]);
    let validCoordsFound = false;

    state.registeredTrees.forEach(tree => {
        const coords = convertToLatLon(tree);
        if (coords) {
            bounds.extend(coords);
            validCoordsFound = true;
        }
    });

    if (validCoordsFound) {
        state.mapInstance.fitBounds(bounds, { padding: [50, 50] });
    } else {
        showToast("Nenhuma coordenada válida encontrada para ajustar o mapa.", "error");
    }
}

// === 5. EXPORTAÇÃO E IMPORTAÇÃO DE DADOS ===

/**
 * Exporta os dados para CSV.
 */
export async function exportActionCSV() {
    try {
        const allTrees = await getTreesFromDB(); // Garante que todos os dados estão incluídos

        if (allTrees.length === 0) {
            showToast("Nenhum dado para exportar.", "error");
            return;
        }

        const headers = [
            "ID", "Data", "Especie", "DAP (cm)", "Altura (m)", "Coord X", "Coord Y",
            "Zona UTM", "Letra Zona UTM", "Local", "Avaliador", "Pontuacao Risco",
            "Risco", "Observacoes", "Tem Foto" // Adicionado "Tem Foto"
        ];
        
        const rows = allTrees.map(tree => [
            tree.id,
            tree.data,
            tree.especie,
            tree.dap,
            tree.altura,
            tree.coordX,
            tree.coordY,
            tree.utmZoneNum,
            tree.utmZoneLetter,
            tree.local,
            tree.avaliador,
            tree.pontuacao,
            tree.risco,
            tree.observacoes ? `"${tree.observacoes.replace(/"/g, '""')}"` : "", // Escapa aspas
            tree.hasPhoto ? "Sim" : "Não" // Valor para "Tem Foto"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + rows.map(e => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventario_arvores_csv_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Dados CSV exportados com sucesso!");
    } catch (error) {
        console.error("Erro ao exportar CSV:", error);
        showToast("Erro ao exportar dados CSV.", "error");
    }
}

/**
 * Exporta todos os dados e fotos para um arquivo .zip.
 */
export async function exportActionZip() {
    if (typeof JSZip === 'undefined') {
        showToast("A biblioteca JSZip não está carregada. Não é possível exportar .ZIP.", "error");
        return;
    }

    try {
        const zip = new JSZip();
        const allTrees = await getTreesFromDB();
        
        if (allTrees.length === 0) {
            showToast("Nenhum dado para exportar.", "error");
            return;
        }

        // Adiciona um arquivo CSV com os metadados
        const headers = [
            "ID", "Data", "Especie", "DAP (cm)", "Altura (m)", "Coord X", "Coord Y",
            "Zona UTM", "Letra Zona UTM", "Local", "Avaliador", "Pontuacao Risco",
            "Risco", "Observacoes", "Nome Foto" // Novo header para o nome do arquivo da foto
        ];
        const csvRows = allTrees.map(tree => {
            const photoFileName = tree.hasPhoto ? `foto_${tree.id}.jpeg` : '';
            return [
                tree.id,
                tree.data,
                tree.especie,
                tree.dap,
                tree.altura,
                tree.coordX,
                tree.coordY,
                tree.utmZoneNum,
                tree.utmZoneLetter,
                tree.local,
                tree.avaliador,
                tree.pontuacao,
                tree.risco,
                tree.observacoes ? `"${tree.observacoes.replace(/"/g, '""')}"` : "",
                photoFileName
            ];
        });
        const csvContent = headers.join(";") + "\n" + csvRows.map(e => e.join(";")).join("\n");
        zip.file("inventario_arvores_metadata.csv", csvContent);

        // Adiciona as fotos
        const photoPromises = allTrees.filter(tree => tree.hasPhoto).map(async tree => {
            return new Promise(async (resolve, reject) => {
                try {
                    const blob = await getImageFromDB(tree.id);
                    if (blob) {
                        zip.file(`fotos/foto_${tree.id}.jpeg`, blob);
                        resolve();
                    } else {
                        console.warn(`Foto para ID ${tree.id} não encontrada no DB.`);
                        resolve(); // Resolve mesmo que a foto não seja encontrada
                    }
                } catch (imgErr) {
                    console.error(`Erro ao adicionar foto ${tree.id} ao zip:`, imgErr);
                    resolve(); // Resolve para não parar o processo se uma foto falhar
                }
            });
        });
        await Promise.all(photoPromises);

        const content = await zip.generateAsync({ type: "blob" });
        const fileName = `inventario_arvores_completo_${new Date().toISOString().slice(0, 10)}.zip`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast("Pacote .ZIP exportado com sucesso!");

    } catch (error) {
        console.error("Erro ao exportar .ZIP:", error);
        showToast("Erro ao exportar pacote .ZIP.", "error");
    }
}


/**
 * Lida com a importação de um arquivo CSV.
 */
export async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const replaceData = event.replaceData; // Captura o flag 'replaceData' do evento
    
    if (file.type !== 'text/csv') {
        showToast("Por favor, selecione um arquivo CSV.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== ''); // Remove linhas vazias
            
            if (lines.length < 2) {
                showToast("CSV vazio ou inválido (cabeçalho + pelo menos uma linha de dados).", "error");
                return;
            }

            const headers = lines[0].split(';');
            const importedTrees = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(';');
                if (values.length !== headers.length) {
                    console.warn(`Linha ${i + 1} ignorada devido a número incorreto de colunas.`);
                    continue;
                }
                
                let tree = {};
                headers.forEach((header, index) => {
                    const key = header.trim().replace(/ /g, '').replace(/\(.*\)/g, ''); // Normaliza chaves
                    let value = values[index].trim();
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1).replace(/""/g, '"'); // Remove aspas e des-escapa
                    }
                    
                    // Converte para tipos corretos
                    switch(key.toLowerCase()) {
                        case 'id':
                        case 'dapcm':
                        case 'alturam':
                        case 'coordx':
                        case 'coordy':
                        case 'zonautm':
                        case 'pontuacaorisco':
                            tree[key.toLowerCase()] = parseFloat(value) || null;
                            break;
                        case 'temfoto': // Novo campo para importação
                            tree.hasPhoto = (value.toLowerCase() === 'sim');
                            break;
                        default:
                            tree[key.toLowerCase()] = value;
                            break;
                    }
                });
                
                // Mapeamento para nomes de chaves internos esperados (se necessário)
                // Exemplo: 'dapcm' -> 'dap'
                if (tree.dapcm !== undefined) { tree.dap = tree.dapcm; delete tree.dapcm; }
                if (tree.alturam !== undefined) { tree.altura = tree.alturam; delete tree.alturam; }
                if (tree.zonautm !== undefined) { tree.utmZoneNum = tree.zonautm; delete tree.zonautm; }
                if (tree.letrazonautm !== undefined) { tree.utmZoneLetter = tree.letrazonautm; delete tree.letrazonautm; }
                if (tree.pontuacaorisco !== undefined) { tree.pontuacao = tree.pontuacaorisco; delete tree.pontuacaorisco; }
                
                importedTrees.push(tree);
            }

            if (replaceData) {
                await clearAllTreesFromDB();
                await clearAllImagesFromDB(); // Limpa as fotos também
            }
            
            let addedCount = 0;
            for (const tree of importedTrees) {
                 // Verifica se o ID já existe e tenta atualizar, caso contrário, adiciona.
                const existingTree = await state.getTreeByIdFromDB(tree.id);
                if (existingTree) {
                    await updateTreeInDB(tree);
                } else {
                    await addTreeToDB(tree);
                }
                addedCount++;
            }
            
            // Recarrega todos os dados após a importação
            const updatedTrees = await getTreesFromDB();
            state.setRegisteredTrees(updatedTrees);
            
            showToast(`${addedCount} árvores importadas com sucesso!`);
            renderSummaryTable();
        } catch (error) {
            console.error("Erro ao importar CSV:", error);
            showToast("Erro ao processar arquivo CSV.", "error");
        }
    };
    reader.readAsText(file);
}


/**
 * Lida com a importação de um arquivo ZIP.
 */
export async function handleImportZip(event) {
    if (typeof JSZip === 'undefined') {
        showToast("A biblioteca JSZip não está carregada. Não é possível importar .ZIP.", "error");
        return;
    }
    const file = event.target.files[0];
    if (!file) {
        return;
    }
