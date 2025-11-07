// script.js (v10.0 - Adiciona Finalidade da Poda interativa)

// === 1. DEFINIÇÃO DE DADOS (GLOSSÁRIO, CONTEÚDO) ===

// Função utilitária para gerar a tag de imagem
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

// Dados do Glossário
const glossaryTerms = {
    'colar do galho': 'Zona especializada na base do galho, responsável pela compartimentalização de ferimentos.',
    'crista da casca': 'Elevação cortical paralela ao ângulo de inserção do galho, indicadora da zona de união.',
    'lenho de cicatrização': 'Tecido formado para selar ferimentos (callus).',
    'casca inclusa': 'Tecido cortical aprisionado em uniões de ângulo agudo (ponto de fraqueza).',
    'lenho de reação': 'Madeira com propriedades alteradas por resposta a tensões.',
    'gemas epicórmicas': 'Brotos dormentes no tronco ou galhos principais.',
    'asv': 'Autorização de Supressão de Vegetação.',
    'app': 'Área de Preservação Permanente.',
    'art': 'Anotação de Responsabilidade Técnica.',
    'mtr': 'Manifesto de Transporte de Resíduos.',
    'dap': 'Diâmetro à Altura do Peito (1,30 m do solo).',
    'rcr': 'Raio Crítico Radicular (RCR = 1,5 × DAP).',
    'poda drástica': 'Corte indiscriminado (topping). Prática NÃO recomendada.',
    'topping': 'Sinônimo de Poda Drástica.',
    'spi q': 'Sistema de Proteção Individual contra Quedas.',
    'pnrs': 'Política Nacional de Resíduos Sólidos.'
};

// Dados dos Equipamentos
const equipmentData = {
    'serrote-manual': {
        desc: 'Utilizado para galhos com diâmetro entre 3 e 12 cm. Permite cortes precisos em locais de difícil acesso.',
        img: 'serrote-manual.jpg'
    },
    'motosserra': {
        desc: 'Recomendada para galhos com diâmetro superior a 12 cm e para supressão de árvores. Exige treinamento e EPIs específicos devido ao alto risco.',
        img: 'motosserra.jpg'
    },
    'motopoda': {
        desc: 'Ferramenta com haste extensível que alcança até 6 metros, ideal para podar galhos altos sem a necessidade de escadas ou plataformas.',
        img: 'motopoda.jpg'
    },
    'podador-haste': {
        desc: 'Semelhante à motopoda em funcionalidade de longo alcance, mas operado manualmente, oferecendo precisão em galhos finos e médios em altura.',
        img: 'podao.jpg'
    },
    'tesoura-poda': {
        desc: 'Utilizada para galhos com diâmetro de 3 a 7 cm. Ideal para cortes limpos e rápidos em ramos mais finos.',
        img: 'tesourao-poda.jpg'
    },
    'podador-bypass': {
        desc: 'Específico para galhos com até 3 a 7 cm de diâmetro. Seu mecanismo de "tesoura" garante um corte limpo que minimiza danos ao tecido vegetal.',
        img: 'tesoura-by-pass.jpg'
    },
    'podador-comum': {
        desc: 'Para galhos com até 3 a 7 cm de diâmetro. Versátil para a maioria das podas leves e médias.',
        img: 'podador.jpg'
    }
};

// NOVO (v10.0): Dados das Finalidades de Poda
const podaPurposeData = {
    'conducao': {
        desc: 'Direcionar eixo de crescimento, remover ramos baixos/indesejáveis.',
        img: 'poda-conducao.jpg'
    },
    'limpeza': {
        desc: 'Remover ramos mortos, secos, doentes, parasitas, tocos - Risco sanitário e queda.',
        img: 'poda-limpeza.jpg'
    },
    'correcao': {
        desc: 'Remover ramos com defeito estrutural (cruzados, codominantes, V) - Com objetivo de aumentar a estabilidade do indivíduo.',
        img: 'poda-correcao.jpg'
    },
    'adequacao': {
        desc: 'Resolver conflitos com estruturas urbanas/edificações. Priorizar realocação de equipamentos quando possível.',
        img: 'poda-adequacao.jpg'
    },
    'levantamento': {
        desc: 'Remover ramos baixos para desobstrução. Podar apenas o mínimo necessário. Diâmetro máximo: 1/3 do ramo origem. Evitar excesso e desbalanceamento da copa.',
        img: 'poda-levantamento.jpg'
    },
    'emergencia': {
        desc: 'Risco iminente (quedas de pós-evento climático). Minimizar danos futuros quando possível.',
        img: 'poda-emergencia.jpg'
    },
    'raizes': {
        desc: 'Este tipo de poda deve ser evitado por causar perda estrutural na árvore e aumentar o risco de queda. Sempre que possível, alternativas devem ser estudadas. Para realizar a poda de raízes sempre consulte um profissional habilitado.',
        img: 'poda-raizes-evitar.jpg'
    }
};

// Dados do Manual (Conteúdo das seções)
const manualContent = {
    'conceitos-basicos': {
        titulo: '1.0. Definições, Termos e Técnicas',
        html: `
            <h3>1.1. Termos Estruturais e Anatômicos</h3>
            <p>A correta identificação das partes da árvore é vital. Use o <span class="glossary-term" data-term-key="colar do galho">colar do galho</span> e a <span class="glossary-term" data-term-key="crista da casca">crista da casca</span> como guias.</p>
            ${imgTag('anatomia-corte.jpg', 'Anatomia correta do corte de galho')}
            <p>Termos como <span class="glossary-term" data-term-key="lenho de cicatrização">lenho de cicatrização</span>, <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span> e <span class="glossary-term" data-term-key="lenho de reação">lenho de reação</span> são importantes para a inspeção.</p>
            
            <h3>Compartimentalização de Árvores</h3>
            <p>As árvores possuem defesas naturais que protegem cortes e ferimentos, como os causados pela poda. Na casca, os ferimentos formam uma camada protetora chamada periderme necrofilática, que impede a entrada de microrganismos. Na madeira, ocorre um processo chamado compartimentalização, que isola a área danificada para evitar que o problema se espalhe pelo restante da árvore.</p>
            ${imgTag('compartimentalização.jpg', 'Diagrama do processo de compartimentalização')}

            <h3>1.2. Instrumentos e Equipamentos</h3>
            <ul class="equipment-list">
                <li><span class="equipment-term" data-term-key="serrote-manual">Serrote Manual</span></li>
                <li><span class="equipment-term" data-term-key="motosserra">Motosserra</span></li>
                <li><span class="equipment-term" data-term-key="motopoda">Motopoda</span></li>
                <li><span class="equipment-term" data-term-key="podador-haste">Podador de Haste Manual (Podão)</span></li>
                <li><span class="equipment-term" data-term-key="tesoura-poda">Tesoura de Poda (Tesourão)</span></li>
                <li><span class="equipment-term" data-term-key="podador-bypass">Podador Manual Bypass</span></li>
                <li><span class="equipment-term" data-term-key="podador-comum">Podador Manual Comum</span></li>
            </ul>

            <!-- ATUALIZADO (v10.0): Substitui 1.3 antigo -->
            <h3>1.3. Finalidade da Poda</h3>
            <ul class="purpose-list">
                <li><span class="purpose-term" data-term-key="conducao">Condução</span></li>
                <li><span class="purpose-term" data-term-key="limpeza">Limpeza</span></li>
                <li><span class="purpose-term" data-term-key="correcao">Correção</span></li>
                <li><span class="purpose-term" data-term-key="adequacao">Adequação</span></li>
                <li><span class="purpose-term" data-term-key="levantamento">Levantamento</span></li>
                <li><span class="purpose-term" data-term-key="emergencia">Emergência</span></li>
                <li><span class="purpose-term" data-term-key="raizes">⚠️ Poda de Raízes (Evitar)</span></li>
            </ul>
        `
    },
    'planejamento-inspecao': {
        titulo: '2.1. Procedimentos: Planejamento e Inspeção',
        html: `
            <h3>2.1. Planejamento</h3>
            <p>Etapa fundamental para garantir a execução **segura e eficiente**.</p>
            <h4>2.1.2. Finalidade da Poda</h4>
            <ul><li><strong>Limpeza:</strong> Remover ramos mortos/secos.</li><li><strong>Correção:</strong> Remover ramos com defeito estrutural (ex: <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span>). ${imgTag('uniao-v-casca-inclusa.jpg', 'União em V com casca inclusa')}</li><li><strong>Adequação:</strong> Resolver conflitos com estruturas.</li><li><strong>⚠️ Poda de Raízes:</strong> Deve ser **evitada**.</li></ul>
            <h4>2.1.3. Inspeção Visual Expedita</h4>
            <p>Foco nos riscos críticos:</p>
            <ul><li>Fendas horizontais.</li><li>Presença de <strong>carpóforos (cogumelos)</strong>. ${imgTag('sinal-podridao.jpg', 'Cogumelos indicando apodrecimento')}</li><li>Galhos mortos > 5 cm.</li><li>Uniões em “V” com <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span>.</li></ul>
            <h4>2.1.6. Classificação de Risco</h4>
            <ul><li><strong>🔴 ALTO RISCO:</strong> Intervenção em até **48h**.</li><li><strong>🟠 MÉDIO RISCO:</strong> Intervenção em até **15 dias**.</li><li><strong>🟢 BAIXO RISCO:</strong> Monitoramento anual.</li></ul>
            <h4>2.1.7. Raio Crítico Radicular (RCR)</h4>
            <p><strong><span class="glossary-term" data-term-key="rcr">RCR</span> = 1,5 × <span class="glossary-term" data-term-key="dap">DAP</span></strong>.</p>
        `
    },
    'autorizacao-legal': {
        titulo: '1.5. Termos Legais e Autorização (ASV)',
        html: `
            <h3>1.5. Termos Legais e Normativos</h3>
            <ul>
                <li><strong><span class="glossary-term" data-term-key="asv">ASV</span> (Autorização de Supressão de Vegetação)</strong></li>
                <li><strong><span class="glossary-term" data-term-key="app">APP</span> (Área de Preservação Permanente)</strong></li>
                <li><strong><span class="glossary-term" data-term-key="art">ART</span> (Anotação de Responsabilidade Técnica)</strong></li>
                <li><strong><span class="glossary-term" data-term-key="mtr">MTR</span> (Manifesto de Transporte de Resíduos)</strong> - (Vide <span class="glossary-term" data-term-key="pnrs">PNRS</span>).</li>
            </ul>
            <h3>2.1.9. Licenciamento da Atividade (ASV)</h3>
            <p>Toda intervenção deve ter anuência do setor de meio ambiente.</p>
            <h4>Dispensa de Autorização:</h4>
            <ul><li>Indivíduos com <span class="glossary-term" data-term-key="dap">DAP</span> < 0,05 m **fora** de <span class="glossary-term" data-term-key="app">APP</span>.</li><li>Risco iminente (Defesa Civil) - processo *a posteriori*.</li></ul>
        `
    },
    'preparacao-e-isolamento': {
        titulo: '2.2. Preparação do Local e Isolamento',
        html: `
            <h3>2.2.2. Isolamento e Sinalização</h3>
            <p>O isolamento é **obrigatório**.</p>
            <h4>Delimitação do Perímetro de Exclusão (Raio de Perigo)</h4>
            ${imgTag('isolamento-perimetro.jpg', 'Diagrama de perímetro de segurança')}
            <ul><li><strong>Galhos isolados:</strong> Comprimento do galho **+ 50%**.</li><li><strong>Árvore inteira:</strong> Altura total **+ 50%**.</li></ul>
            <p><strong>⛔ Proibição:</strong> Uso de fita zebrada (salvo emergências).</p>
            <h3>2.2.3. Desligamento de Linhas de Energia</h3>
            <p><strong>É proibido</strong> realizar podas em contato com redes ativas.</p>
            <h3>2.2.4. Liberação de Permissão de Trabalho (PT)</h3>
            <p>A PT é **obrigatória**. Qualquer alteração no escopo exige **revalidação da PT**.</p>
        `
    },
    'operacoes-e-tecnicas': {
        titulo: '2.3. Operações de Poda e Corte',
        html: `
            <h3>2.3.2. Técnicas de Poda</h3>
            <ul><li><strong>Desbaste da copa:</strong> Limite de **até 25% da copa viva** por intervenção.</li><li><strong>Elevação da copa:</strong> Manter pelo menos **2/3 da altura total** com copa viva.</li><li><strong>Redução da copa:</strong> Preservar ramos laterais com diâmetro **≥ 1/3** do ramo removido.</li></ul>
            
            <h4>Técnica de Corte: Poda em Três Cortes</h4>
            ${imgTag('corte-tres-passos.jpg', 'Sequência dos 3 passos para a poda segura')}
            <p>Aplicar o método para preservar <span class="glossary-term" data-term-key="crista da casca">crista da casca</span> e <span class="glossary-term" data-term-key="colar do galho">colar do galho</span>:</p>
            <ol><li><strong>Corte inferior (alívio):</strong> Fora do colar.</li><li><strong>Corte superior:</strong> Destaca o galho.</li><li><strong>Corte de acabamento:</strong> Rente à crista, preservando o colar.</li></ol>
            
            <p><strong>⛔ Práticas Proibidas:</strong></p>
            <ul>
                <li><span class="glossary-term" data-term-key="poda drástica">Poda drástica</span> (<span class="glossary-term" data-term-key="topping">topping</span>). ${imgTag('topping-errado.jpg', 'Exemplo de Poda Drástica')}</li>
                <li>Cortes rentes. ${imgTag('corte-rente-lesao.jpg', 'Lesão por corte rente')}</li>
            </ul>
            ${imgTag('poda-drastica-vs-correta.jpg', 'Comparação visual: Poda Drástica vs Correta')}
            
            <h3>2.3.2.5. Supressão (Corte de Árvore)</h3>
            <p>Corte direcional deixando a **"dobradiça" de 10%** do diâmetro.</p>
            <h4>Segurança Crítica: Rota de Fuga</h4>
            ${imgTag('rota-fuga-45graus.jpg', 'Diagrama das rotas de fuga')}
            <p>Planejar **duas rotas de fuga** livres (ângulo de **45°**).</p>
            <h4>⚠️ Atenção a Troncos Tensionados</h4>
            ${imgTag('corte-tronco-tensionado.jpg', 'Técnica de corte em tronco tensionado')}
            <h4>⚠️ Efeito Rebote (Motosserra)</h4>
            ${imgTag('perigo-rebote.jpg', 'Diagrama do Efeito Rebote')}
            <p>Ocorre ao usar a ponta superior do sabre. **NUNCA use a ponta superior da lâmina para cortar.**</p>
        `
    },
    'riscos-e-epis': {
        titulo: '2.4. Análise de Risco e EPIs',
        html: `
            <h3>2.4. Análise de Risco (Perigos Recorrentes)</h3>
            <p>Queda de altura, Queda de ferramentas, Choque elétrico, Corte, Efeito Rebote.</p>
            <h3>2.5. Equipamento de Proteção Individual (EPIs)</h3>
            ${imgTag('epis-motosserra.jpg', 'Operador com EPIs completos')}
            <h4>EPIs Anticorte e Impacto</h4>
            <ul><li>Capacete com jugular</li><li>Calça/Blusão/Luva de motosserista</li><li>Viseira/protetor facial</li><li>Perneira</li></ul>
            <h4>EPIs para Trabalho em Altura (SPIQ)</h4>
            <p>Uso de <span class="glossary-term" data-term-key="spi q">SPIQ</span> (Cinto, Talabarte, Trava-queda).</p>
            <p><strong>⚠️ Proibição:</strong> **escalada livre** ou ancoragem nos galhos a serem cortados.</p>
        `
    },
    'gestao-e-desmobilizacao': {
        titulo: '2.5. Gestão de Resíduos e Desmobilização',
        html: `
            <h3>2.3.4. Gestão de Resíduos Arbóreos (PNRS)</h3>
            ${imgTag('segregacao-residuos.jpg', 'Segregação de resíduos')}
            <ul><li><strong>Princípios:</strong> Não geração, redução, reutilização e reciclagem.</li><li><strong>Rastreabilidade:</strong> Emissão de <span class="glossary-term" data-term-key="mtr">Manifesto de Transporte de Resíduos (MTR)</span>.</li></ul>
            
            <h4>Abastecimento Seguro</h4>
            ${imgTag('abastecimento-seguro.jpg', 'Abastecimento seguro com bacia de contenção')}
            <ul><li>Realizar em área ventilada, com <strong>bacia de contenção</strong> e <strong>Kit de Mitigação Ambiental</strong>.</li></ul>
            
            <h3>2.3.6. Desmobilização</h3>
            <p>Remover todos os resíduos. Retirar isolamento **somente após liberação formal** do responsável técnico.</p>
        `
    }
};


// === 3. LÓGICA DE INICIALIZAÇÃO (CONSOLIDADA v10.0) ===

document.addEventListener('DOMContentLoaded', () => {
    
    // Detecção de dispositivo de toque
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // --- MÓDULO DE NAVEGAÇÃO ---
    const detailView = document.getElementById('detalhe-view');
    const activeTopicButtons = document.querySelectorAll('.topico-btn');
    
    function loadContent(targetKey) {
        if (!detailView) return; 
        
        const content = manualContent[targetKey];
        if (content) {
            detailView.innerHTML = `<h3>${content.titulo}</h3>${content.html}`;
            // Re-vincular os eventos para o novo conteúdo carregado
            setupGlossaryInteractions(); 
            setupEquipmentInteractions();
            setupPurposeInteractions(); // NOVO (v10.0)
        } else {
            detailView.innerHTML = `<h3 class="placeholder-titulo">Tópico Não Encontrado</h3>`;
        }
    }

    function handleTopicClick(button) {
        const target = button.getAttribute('data-target');
        activeTopicButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadContent(target);
    }

    // Inicialização da Navegação
    if (activeTopicButtons.length > 0) {
        activeTopicButtons.forEach(button => {
            button.addEventListener('click', () => handleTopicClick(button));
        });
        
        const firstActiveButton = document.querySelector('.topico-btn.active');
        if (firstActiveButton) {
            loadContent(firstActiveButton.getAttribute('data-target'));
        } else {
            // Fallback se nenhum botão tiver a classe .active no HTML
            loadContent(activeTopicButtons[0].getAttribute('data-target'));
            activeTopicButtons[0].classList.add('active');
        }
        
    } else {
        console.error('Site Builder Error: Nenhum botão .topico-btn foi encontrado no HTML.');
    }

    // --- MÓDULO DE TOOLTIP (GLOSSÁRIO, EQUIPAMENTOS E FINALIDADES) ---
    let currentTooltip = null; 

    function createTooltip() {
        let tooltip = document.getElementById('glossary-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'glossary-tooltip';
            document.body.appendChild(tooltip); 
        }
        return tooltip;
    }

    function hideTooltip() {
        if (currentTooltip) {
            currentTooltip.style.opacity = '0';
            currentTooltip.style.visibility = 'hidden';
            delete currentTooltip.dataset.currentElement;
        }
    }

    // -- Lógica do GLOSSÁRIO --
    function setupGlossaryInteractions() {
        const glossaryTermsElements = detailView.querySelectorAll('.glossary-term'); 
        glossaryTermsElements.forEach(termElement => {
            
            if (!isTouchDevice) {
                termElement.addEventListener('mouseenter', showGlossaryTooltip);
                termElement.addEventListener('mouseleave', hideTooltip);
            }
            termElement.addEventListener('click', toggleGlossaryTooltip); 
        });
    }

    function showGlossaryTooltip(event) {
        const termElement = event.currentTarget;
        const termKey = termElement.getAttribute('data-term-key');
        const definition = glossaryTerms[termKey];
        if (!definition) return;
        
        currentTooltip = createTooltip(); 
        currentTooltip.innerHTML = `<strong>${termElement.textContent}</strong>: ${definition}`;
        
        positionTooltip(termElement);
        currentTooltip.style.opacity = '1';
        currentTooltip.style.visibility = 'visible';
        currentTooltip.dataset.currentElement = termElement.textContent;
    }

    function toggleGlossaryTooltip(event) {
        event.preventDefault(); 
        event.stopPropagation(); // Impede o clique de borbulhar
        
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showGlossaryTooltip(event);
            
            // Correção v9.8: Adiciona o listener de fechamento *depois* do evento atual
            setTimeout(() => {
                document.addEventListener('click', function globalHide(e) {
                    if (e.target !== event.currentTarget && (currentTooltip && !currentTooltip.contains(e.target))) {
                        hideTooltip();
                        document.removeEventListener('click', globalHide);
                    }
                }, { once: true });
            }, 0); 
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
        const termElement = event.currentTarget;
        const termKey = termElement.getAttribute('data-term-key');
        const data = equipmentData[termKey];
        if (!data) return;

        currentTooltip = createTooltip();
        currentTooltip.innerHTML = `
            <strong>${termElement.textContent}</strong>
            <p>${data.desc}</p>
            ${imgTag(data.img, termElement.textContent)}
        `;
        
        positionTooltip(termElement);
        currentTooltip.style.opacity = '1';
        currentTooltip.style.visibility = 'visible';
        currentTooltip.dataset.currentElement = termElement.textContent;
    }

    function toggleEquipmentTooltip(event) {
        event.preventDefault();
        event.stopPropagation(); // Impede o clique de borbulhar

        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showEquipmentTooltip(event);
            
            // Correção v9.8: Adiciona o listener de fechamento *depois* do evento atual
            setTimeout(() => {
                document.addEventListener('click', function globalHide(e) {
                    if (e.target !== event.currentTarget && (currentTooltip && !currentTooltip.contains(e.target))) {
                        hideTooltip();
                        document.removeEventListener('click', globalHide);
                    }
                }, { once: true });
            }, 0);
        }
    }

    // NOVO (v10.0): -- Lógica de FINALIDADE DA PODA --
    function setupPurposeInteractions() {
        const purposeTermsElements = detailView.querySelectorAll('.purpose-term');
        purposeTermsElements.forEach(termElement => {
            
            if (!isTouchDevice) {
                termElement.addEventListener('mouseenter', showPurposeTooltip);
                termElement.addEventListener('mouseleave', hideTooltip);
            }
            termElement.addEventListener('click', togglePurposeTooltip);
        });
    }

    function showPurposeTooltip(event) {
        const termElement = event.currentTarget;
        const termKey = termElement.getAttribute('data-term-key');
        const data = podaPurposeData[termKey]; // Usa o novo objeto de dados
        if (!data) return;

        currentTooltip = createTooltip();
        currentTooltip.innerHTML = `
            <strong>${termElement.textContent}</strong>
            <p>${data.desc}</p>
            ${imgTag(data.img, termElement.textContent)}
        `;
        
        positionTooltip(termElement);
        currentTooltip.style.opacity = '1';
        currentTooltip.style.visibility = 'visible';
        currentTooltip.dataset.currentElement = termElement.textContent;
    }

    function togglePurposeTooltip(event) {
        event.preventDefault();
        event.stopPropagation(); // Impede o clique de borbulhar

        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showPurposeTooltip(event);
            
            // Correção v9.8: Adiciona o listener de fechamento *depois* do evento atual
            setTimeout(() => {
                document.addEventListener('click', function globalHide(e) {
                    if (e.target !== event.currentTarget && (currentTooltip && !currentTooltip.contains(e.target))) {
                        hideTooltip();
                        document.removeEventListener('click', globalHide);
                    }
                }, { once: true });
            }, 0);
        }
    }


    // Função genérica para posicionar o tooltip
    function positionTooltip(termElement) {
        const rect = termElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Espera o tooltip renderizar para pegar as dimensões
        requestAnimationFrame(() => {
            if (!currentTooltip) return;

            const tooltipWidth = currentTooltip.offsetWidth;
            const tooltipHeight = currentTooltip.offsetHeight;
            
            let topPos;
            // Tenta posicionar em cima, se houver espaço
            if (rect.top > tooltipHeight + 10) { 
                topPos = rect.top + scrollY - tooltipHeight - 10;
            } else { 
                // Posiciona embaixo
                topPos = rect.bottom + scrollY + 10;
            }
            
            let leftPos = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
            
            // Previne estourar na esquerda
            if (leftPos < scrollX + 10) leftPos = scrollX + 10; 
            // Previne estourar na direita
            if (leftPos + tooltipWidth > window.innerWidth + scrollX - 10) { 
                leftPos = window.innerWidth + scrollX - tooltipWidth - 10;
            }
            
            currentTooltip.style.top = `${topPos}px`;
            currentTooltip.style.left = `${leftPos}px`;
        });
    }

    
    // --- MÓDULO DO FORMULÁRIO (MAILTO:) ---
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
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
        });
    }

    // --- MÓDULO DE CHAT GEMINI (ESQUELETO) ---
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatResponseBox = document.getElementById('chat-response-box');

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', handleChatSend);
        chatInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                handleChatSend();
            }
        });
    }

    async function handleChatSend() {
        const userQuery = chatInput.value.trim();
        if (userQuery === "") return; 

        chatResponseBox.innerHTML = `<p class="chat-response-text loading">Buscando no manual...</p>`;
        chatInput.value = ""; 

        try {
            // (A Fase 2 começa aqui)
            const PONTESEGURA_URL = "URL_DA_SUA_FUNCAO_GOOGLE_CLOUD_AQUI"; 
            
            if (PONTESEGURA_URL === "URL_DA_SUA_FUNCAO_GOOGLE_CLOUD_AQUI") {
                 throw new Error("A função de back-end (Google Cloud Function) ainda não foi configurada. Esta é a Fase 2.");
            }
            
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

}); // Fim do DOMContentLoaded