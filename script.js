// script.js (COMPLETO v19.2 - Unificação de Botões Import/Export)

// === 0. ARMAZENAMENTO de ESTADO (Variáveis Globais) ===
let registeredTrees = [];
const STORAGE_KEY = 'manualPodaData';
const ACTIVE_TAB_KEY = 'manualPodaActiveTab';
let lastEvaluatorName = '';
let toastTimer;
let mapInstance = null;
let lastUtmZone = { num: 0, letter: 'Z' }; // Default para Zona UTM
let zoomTargetCoords = null; // (v17.4) Armazena o alvo do zoom da lupa
let highlightTargetId = null; // (v18.0) Armazena o ID da linha para destacar

// (NOVO v18.0) Variáveis de Imagem
let currentTreePhoto = null; // Armazena o File/Blob da foto atual
let db; // Instância do IndexedDB

// (NOVO v18.0) Estado de Ordenação da Tabela
let sortState = {
    key: 'id',
    direction: 'asc' // 'asc' ou 'desc'
};

// === 1. DEFINIÇÃO DE DADOS (GLOSSÁRIO, CONTEÚDO) ===
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

const glossaryTerms = {
    'colar do galho': 'Zona especializada na base do galho, responsável pela compartimentalização de ferimentos.',
    'crista da casca': 'Elevação cortical paralela ao ângulo de inserção do galho, indicadora da zona de união.',
    'lenho de cicatrização': 'Tecido formado para selar ferimentos, também conhecido como callus.',
    'casca inclusa': 'Tecido cortical aprisionado em uniões de ângulo agudo.',
    'lenho de reação': 'Madeira com propriedades alteradas por resposta a tensões.',
    'gemas epicórmicas': 'Brotos dormentes no tronco ou galhos principais.',
    'entreno': 'Espaço entre dois nós consecutivos no ramo.',
    'no': 'Ponto de inserção de folhas, gemas ou ramos.',
    'lenho': 'Tecido vegetal com função de sustentação e condução de seiva.',
    'podao': 'Tesoura de poda de haste longa para alcance elevado.',
    'tesourao-poda': 'Ferramenta para galhos de até 7 cm de diâmetro.',
    'serra-poda': 'Serra com dentes especiais para madeira verde.',
    'motosserra-glossario': 'Equipamento motorizado para corte de galhos e troncos.',
    'motopoda-glossario': 'Ferramenta motorizada com haste para galhos altos.',
    'podador-bypass-glossario': 'Lâmina deslizante que realiza cortes limpos.',
    'podador-bigorna': 'Lâmina que pressiona o galho contra superfície plana.',
    'hipsometro': 'Instrumento para medir altura de árvores.',
    'poda-conducao': 'Direciona crescimento da árvore.',
    'poda-formacao': 'Define estrutura arquitetônica futura.',
    'poda-limpeza': 'Remove galhos mortos, doentes ou mal orientados.',
    'poda-adequacao': 'Adapta a árvore ao espaço urbano ou industrial.',
    'poda-reducao': 'Diminui volume da copa.',
    'poda-emergencia': 'Elimina riscos iminentes.',
    'poda-raizes': 'Deve ser evitada; requer profissional habilitado.',
    'poda-cabecote': 'Poda severa para estimular brotação.',
    'poda drástica': 'Corte indiscriminado com remoção total ou parcial da copa (não recomendada).',
    'poda-reducao-garfo': 'Preserva estrutura natural.',
    'corte-rente': 'Remove o colar do galho (inadequado).',
    'corte-toco': 'Retarda cicatrização.',
    'poda-tres-cortes': 'Técnica que preserva tecidos vitais.',
    'desbaste-copa': 'Remoção seletiva para luz e ventilação.',
    'elevacao-copa': 'Remoção de galhos inferiores.',
    'reducao-copa': 'Corte seletivo para adequação ao espaço.',
    'topping': 'Sinônimo de Poda Drástica.',
    'dap': 'Diâmetro à Altura do Peito (DAP): Medida padrão a 1,30 m do solo.',
    'projecao-copa': 'Área de sombreamento da copa.',
    'indice-vitalidade': 'Avaliação do estado fitossanitário.',
    'rcr': 'Raio Crítico Radicular (RCR): Área de influência e sustentação mecânica das raízes.',
    'nivel-1-avaliacao': 'Nível 1: Análise visual.',
    'nivel-2-avaliacao': 'Nível 2: Inspeção 360º.',
    'nivel-3-avaliacao': 'Nível 3: Métodos avançados para avaliar defeitos.',
    'asv': 'Autorização de Supressão de Vegetação (ASV): Documento emitido pelo órgão ambiental competente que autoriza o corte ou supressão de vegetação nativa ou árvores isoladas, mediante justificativa técnica e compensação ambiental.',
    'app': 'Área de Preservação Permanente (APP): Espaço protegido por lei, com função ambiental de preservar recursos hídricos, biodiversidade e estabilidade geológica. Intervenções são permitidas apenas em casos de utilidade pública, interesse social ou baixo impacto ambiental.',
    'ctf': 'Cadastro Técnico Federal (CTF): Registro obrigatório no IBAMA para pessoas físicas ou jurídicas que realizam atividades potencialmente poluidoras ou utilizadoras de recursos naturais.',
    'art': 'Anotação de Responsabilidade Técnica (ART): Documento que formaliza a responsabilidade técnica de um profissional habilitado sobre determinado serviço ou estudo ambiental.',
    'tcra': 'Termo de Compromisso de Recuperação Ambiental (TCRA): Instrumento legal que formaliza a obrigação de compensação ambiental por meio de ações de recuperação ou preservação.',
    'compensacao-ambiental': 'Medida obrigatória para mitigar os impactos causados pela supressão de vegetação, podendo incluir restauração ecológica, preservação de áreas remanescentes ou compensação em propriedades de terceiros.',
    'pnrs': 'Política Nacional de Resíduos Sólidos (PNRS): Lei nº 12.305/2010 que estabelece diretrizes para o manejo adequado dos resíduos sólidos, incluindo os gerados por poda e corte de árvores.',
    'mtr': 'Manifesto de Transporte de Resíduos (MTR): Documento que garante a rastreabilidade dos resíduos desde a origem até a destinação final, exigido em operações de transporte de resíduos sólidos.',
    'spi q': 'Sistema de Proteção Individual contra Quedas.'
};
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
        desc: 'Semelhante à motopoda em funcionalidade de longo alcance, mas operado manually, oferecendo precisão em galhos finos e médios em altura.',
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

// === 2. DADOS DO MANUAL (CONTEÚDO COMPLETO v19.2) ===
const manualContent = {
    'conceitos-basicos': {
        titulo: '💡 Definições, Termos e Técnicas',
        html: `
            <h3>Termos Estruturais e Anatômicos</h3>
            <p>A correta identificação das partes da árvore é vital. Use o <span class="glossary-term" data-term-key="colar do galho">colar do galho</span> e a <span class="glossary-term" data-term-key="crista da casca">crista da casca</span> como guias.</p>
            ${imgTag('anatomia-corte.jpg', 'Anatomia correta do corte de galho')}
            <p>Termos como <span class="glossary-term" data-term-key="lenho de cicatrização">lenho de cicatrização</span>, <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span> e <span class="glossary-term" data-term-key="lenho de reação">lenho de reação</span> são importantes para a inspeção.</p>
            
            <h3>Compartimentalização de Árvores</h3>
            <p>As árvores possuem defesas naturais que protegem cortes e ferimentos, como os causados pela poda. Na casca, os ferimentos formam uma camada protetora chamada periderme necrofilática, que impede a entrada de microrganismos. Na madeira, ocorre um processo chamado compartimentalização, que isola a área danificada para evitar que o problema se espalhe pelo restante da árvore.</p>
            ${imgTag('compartimentalização.jpg', 'Diagrama do processo de compartimentalização')}

            <h3>Instrumentos e Equipamentos</h3>
            <ul class="equipment-list">
                <li><span class="equipment-term" data-term-key="serrote-manual">Serrote Manual</span></li>
                <li><span class="equipment-term" data-term-key="motosserra">Motosserra</span></li>
                <li><span class="equipment-term" data-term-key="motopoda">Motopoda</span></li>
                <li><span class="equipment-term" data-term-key="podador-haste">Podador de Haste Manual (Podão)</span></li>
                <li><span class="equipment-term" data-term-key="tesoura-poda">Tesoura de Poda (Tesourão)</span></li>
                <li><span class="equipment-term" data-term-key="podador-bypass">Podador Manual Bypass</span></li>
                <li><span class="equipment-term" data-term-key="podador-comum">Podador Manual Comum</span></li>
            </ul>

            <h3>Finalidade da Poda</h3>
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
        titulo: '📋 Planejamento e Inspeção',
        html: `
            <h3>Planejamento</h3>
            <p>Etapa fundamental para garantir a execução <strong>segura e eficiente</strong>.</p>
            
            <h4>Definição do Local, Escopo e Objetivo da Poda e Corte</h4>
            <ul>
                <li>Identificar o local exato da intervenção, considerando áreas industriais, administrativas ou públicas.</li>
                <li>Definir o escopo da atividade: poda, corte total, levantamento de copa, adequação urbana, entre outros.</li>
                <li>Estabelecer o objetivo técnico da intervenção, como condução, limpeza, correção estrutural, adequação ou emergência.</li>
                <li>Selecionar previamente os galhos e troncos a serem removidos, respeitando critérios técnicos e fitossanitários.</li>
            </ul>
            <h4>Finalidade da Poda</h4>
            <ul><li><strong>Limpeza:</strong> Remover ramos mortos/secos.</li><li><strong>Correção:</strong> Remover ramos com defeito estrutural (ex: <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span>). ${imgTag('uniao-v-casca-inclusa.jpg', 'União em V com casca inclusa')}</li><li><strong>Adequação:</strong> Resolver conflitos com estruturas.</li><li><strong>⚠️ Poda de Raízes:</strong> Deve ser <strong>evitada</strong>.</li></ul>
            <h4>Inspeção Visual Expedita</h4>
            <p>Foco nos riscos críticos:</p>
            <ul><li>Fendas horizontais.</li><li>Presença de <strong>carpóforos (cogumelos)</strong>. ${imgTag('sinal-podridao.jpg', 'Cogumelos indicando apodrecimento')}</li><li>Galhos mortos > 5 cm.</li><li>Uniões em “V” com <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span>.</li></ul>
            <h4>Classificação de Risco</h4>
            <ul><li><strong>🔴 ALTO RISCO:</strong> Intervenção em até <strong>48h</strong>.</li><li><strong>🟠 MÉDIO RISCO:</strong> Intervenção em até <strong>15 dias</strong>.</li><li><strong>🟢 BAIXO RISCO:</strong> Monitoramento anual.</li></ul>
            <h4>Raio Crítico Radicular (RCR)</h4>
            <p><strong><span class="glossary-term" data-term-key="rcr">RCR</span> = 1,5 × <span class="glossary-term" data-term-key="dap">DAP</span></strong>.</p>
        `
    },
    'autorizacao-legal': {
        titulo: '📜 Termos Legais e Autorização (ASV)',
        html: `
            <h3>Termos Legais e Normativos</h3>
            <ul>
                <li><strong><span class="glossary-term" data-term-key="asv">ASV</span> (Autorização de Supressão de Vegetação)</strong></li>
                <li><strong><span class="glossary-term" data-term-key="app">APP</span> (Área de Preservação Permanente)</strong></li>
                <li><strong><span class="glossary-term" data-term-key="art">ART</span> (Anotação de Responsabilidade Técnica)</strong></li>
                <li><strong><span class="glossary-term" data-term-key="mtr">MTR</span> (Manifesto de Transporte de Resíduos)</strong> - (Vide <span class="glossary-term" data-term-key="pnrs">PNRS</span>).</li>
            </ul>
            <h3>Licenciamento da Atividade (ASV)</h3>
            <p>Toda intervenção deve ter anuência do setor de meio ambiente.</p>
            <h4>Dispensa de Autorização:</h4>
            <ul><li>Indivíduos com <span class="glossary-term" data-term-key="dap">DAP</span> < 0,05 m <strong>fora</strong> de <span class="glossary-term" data-term-key="app">APP</span>.</li><li>Risco iminente (Defesa Civil) - processo *a posteriori*.</li></ul>
        `
    },
    'preparacao-e-isolamento': {
        titulo: '🚧 Preparação do Local e Isolamento',
        html: `
            <h3>Isolamento e Sinalização</h3>
            <p>O isolamento é <strong>obrigatório</strong>.</p>
            <h4>Delimitação do Perímetro de Exclusão (Raio de Perigo)</h4>
            ${imgTag('isolamento-perimetro.jpg', 'Diagrama de perímetro de segurança')}
            <ul><li><strong>Galhos isolados:</strong> Comprimento do galho <strong>+ 50%</strong>.</li><li><strong>Árvore inteira:</strong> Altura total <strong>+ 50%</strong>.</li></ul>
            <p><strong>⛔ Proibição:</strong> Uso de fita zebrada (salvo emergências).</p>
            <h3>Desligamento de Linhas de Energia</h3>
            <p><strong>É proibido</strong> realizar podas em contato com redes ativas.</p>
            <h3>Liberação de Permissão de Trabalho (PT)</h3>
            <p>A PT é <strong>obrigatória</strong>. Qualquer alteração no escopo exige <strong>revalidação da PT</strong>.</p>
        `
    },
    'operacoes-e-tecnicas': {
        titulo: '✂️ Operações de Poda e Corte',
        html: `
            <h3>Técnicas de Poda</h3>
            <ul><li><strong>Desbaste da copa:</strong> Limite de <strong>até 25% da copa viva</strong> por intervenção.</li><li><strong>Elevação da copa:</strong> Manter pelo menos <strong>2/3 da altura total</strong> com copa viva.</li><li><strong>Redução da copa:</strong> Preservar ramos laterais com diâmetro <strong>≥ 1/3</strong> do ramo removido.</li></ul>
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
            <h3>Supressão (Corte de Árvore)</h3>
            <p>Corte direcional deixando a <strong>"dobradiça" de 10%</strong> do diâmetro.</p>
            <h4>Segurança Crítica: Rota de Fuga</h4>
            ${imgTag('rota-fuga-45graus.jpg', 'Diagrama das rotas de fuga')}
            <p>Planejar <strong>duas rotas de fuga</strong> livres (ângulo de <strong>45°</strong>).</p>
            <h4>Atenção a Troncos Tensionados</h4>
            ${imgTag('corte-tronco-tensionado.jpg', 'Técnica de corte em tronco tensionado')}
            <h4>Efeito Rebote (Motosserra)</h4>
            ${imgTag('perigo-rebote.jpg', 'Diagrama do Efeito Rebote')}
            <p>Ocorre ao usar a ponta superior do sabre. <strong>NUNCA use a ponta superior da lâmina para cortar.</strong></p>
        `
    },
    'riscos-e-epis': {
        titulo: '🛡️ Análise de Risco e EPIs',
        html: `
            <h3>Análise de Risco (Perigos Recorrentes)</h3>
            <p>Queda de altura, Queda de ferramentas, Choque elétrico, Corte, Efeito Rebote.</p>
            <h3>Equipamento de Proteção Individual (EPIs)</h3>
            ${imgTag('epis-motosserra.jpg', 'Operador com EPIs completos')}
            <h4>EPIs Anticorte e Impacto</h4>
            <ul><li>Capacete com jugular</li><li>Calça/Blusão/Luva de motosserista</li><li>Viseira/protetor facial</li><li>Perneira</li></ul>
            <h4>EPIs para Trabalho em Altura (SPIQ)</h4>
            <p>Uso de <span class="glossary-term" data-term-key="spi q">SPIQ</span> (Cinto, Talabarte, Trava-queda).</p>
            <p><strong>⚠️ Proibição:</strong> <strong>escalada livre</strong> ou ancoragem nos galhos a serem cortados.</p>
        `
    },
    'gestao-e-desmobilizacao': {
        titulo: '♻️ Gestão de Resíduos e Desmobilização',
        html: `
            <h3>Gestão de Resíduos Arbóreos (PNRS)</h3>
            ${imgTag('segregacao-residuos.jpg', 'Segregação de resíduos')}
            <ul><li><strong>Princípios:</strong> Não geração, redução, reutilização e reciclagem.</li><li><strong>Rastreabilidade:</strong> Emissão de <span class="glossary-term" data-term-key="mtr">Manifesto de Transporte de Resíduos (MTR)</span>.</li></ul>
            
// === 3. LÓGICA DE INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {

    // (BUG 1 CORRIGIDO v17.6) Todas as funções agora estão DENTRO do DOMContentLoaded

    // (NOVO v16.0) Lógica do Carrossel Mobile
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
    
    /** (v16.0) Mostra a pergunta do carrossel no índice especificado */
    function showMobileQuestion(index) {
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

    /** (v16.0) Inicializa o carrossel mobile */
    function setupMobileChecklist() {
        mobileChecklist.wrapper = document.querySelector('.mobile-checklist-wrapper');
        if (!mobileChecklist.wrapper) return;
        mobileChecklist.card = mobileChecklist.wrapper.querySelector('.mobile-checklist-card');
        mobileChecklist.navPrev = mobileChecklist.wrapper.querySelector('#checklist-prev');
        mobileChecklist.navNext = mobileChecklist.wrapper.querySelector('#checklist-next');
        mobileChecklist.counter = mobileChecklist.wrapper.querySelector('.checklist-counter');
        mobileChecklist.questions = document.querySelectorAll('.risk-table tbody tr');
        if (mobileChecklist.questions.length === 0) return;
        mobileChecklist.currentIndex = 0;
        mobileChecklist.totalQuestions = mobileChecklist.questions.length;
        mobileChecklist.card.replaceWith(mobileChecklist.card.cloneNode(true));
        mobileChecklist.navPrev.replaceWith(mobileChecklist.navPrev.cloneNode(true));
        mobileChecklist.navNext.replaceWith(mobileChecklist.navNext.cloneNode(true));
        mobileChecklist.card = mobileChecklist.wrapper.querySelector('.mobile-checklist-card');
        mobileChecklist.navPrev = mobileChecklist.wrapper.querySelector('#checklist-prev');
        mobileChecklist.navNext = mobileChecklist.wrapper.querySelector('#checklist-next');
        mobileChecklist.card.addEventListener('change', (e) => {
            const proxyCheckbox = e.target.closest('.mobile-checkbox-proxy');
            if (proxyCheckbox) {
                const targetIndex = parseInt(proxyCheckbox.dataset.targetIndex, 10);
                const realCheckbox = mobileChecklist.questions[targetIndex].cells[3].querySelector('.risk-checkbox');
                realCheckbox.checked = proxyCheckbox.checked;
            }
        });
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


    // ==========================================================
    // (v15.1) FUNÇÃO DE FEEDBACK (TOAST)
    // ==========================================================
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        if (toastTimer) {
            clearTimeout(toastTimer);
        }
        toast.textContent = message;
        toast.className = 'show';
        toast.classList.add(type);
        toastTimer = setTimeout(() => {
            toast.className = toast.className.replace('show', '');
            toastTimer = null;
        }, 3000);
    }
    
    // ==========================================================
    // (NOVO v18.0) LÓGICA DO BANCO DE DADOS (IndexedDB)
    // ==========================================================
    
    /** Inicializa o IndexedDB */
    function initImageDB() {
        const request = indexedDB.open("treeImageDB", 1);

        request.onerror = (event) => {
            console.error("Erro ao abrir IndexedDB:", event);
            showToast("Erro: Não foi possível carregar o banco de dados de imagens.", "error");
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            db.createObjectStore("treeImages", { keyPath: "id" });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("Banco de dados de imagens carregado com sucesso.");
        };
    }

    /** Salva (ou atualiza) uma imagem no IndexedDB */
    function saveImageToDB(id, blob) {
        if (!db) {
            showToast("Erro: Banco de dados de imagem não está pronto.", "error");
            return;
        }
        const transaction = db.transaction(["treeImages"], "readwrite");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.put({ id: id, imageBlob: blob });
        
        request.onsuccess = () => {
            console.log(`Imagem da Árvore ID ${id} salva no IndexedDB.`);
        };
        request.onerror = (event) => {
            console.error("Erro ao salvar imagem no IndexedDB:", event);
            showToast("Erro ao salvar a foto.", "error");
        };
    }

    /** Busca uma imagem no IndexedDB */
    function getImageFromDB(id, callback) {
        if (!db) return;
        const transaction = db.transaction(["treeImages"], "readonly");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.get(id);

        request.onsuccess = (event) => {
            if (event.target.result) {
                callback(event.target.result.imageBlob);
            } else {
                callback(null); // Nenhuma imagem encontrada
            }
        };
        request.onerror = (event) => {
            console.error("Erro ao buscar imagem:", event);
            callback(null);
        };
    }

    /** Deleta uma imagem do IndexedDB */
    function deleteImageFromDB(id) {
        if (!db) return;
        const transaction = db.transaction(["treeImages"], "readwrite");
        const objectStore = transaction.objectStore("treeImages");
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            console.log(`Imagem da Árvore ID ${id} deletada do IndexedDB.`);
        };
        request.onerror = (event) => {
            console.error("Erro ao deletar imagem:", event);
        };
    }

    // ==========================================================
    // FUNÇÕES PRIMÁRIAS (LocalStorage, GPS, CRUD)
    // ==========================================================

    function saveDataToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredTrees));
        } catch (e) { console.error("Erro ao salvar no localStorage:", e); }
    }

    function loadDataFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) { registeredTrees = JSON.parse(data); }
        } catch (e) { console.error("Erro ao ler do localStorage:", e); }
    }

    function convertLatLonToUtm(lat, lon) {
        const f = 1 / 298.257223563, a = 6378137.0, k0 = 0.9996;
        const e = Math.sqrt(f * (2 - f)), e2 = e * e, e4 = e2 * e2, e6 = e4 * e2, e_2 = e2 / (1.0 - e2);
        const latRad = lat * (Math.PI / 180.0), lonRad = lon * (Math.PI / 180.0);
        let zoneNum = Math.floor((lon + 180.0) / 6.0) + 1;
        if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) zoneNum = 32;
        if (lat >= 72.0 && lat < 84.0) {
            if (lon >= 0.0 && lon < 9.0) zoneNum = 31;
            else if (lon >= 9.0 && lon < 21.0) zoneNum = 33;
            else if (lon >= 21.0 && lon < 33.0) zoneNum = 35;
            else if (lon >= 33.0 && lon < 42.0) zoneNum = 37;
        }
        const lonOrigin = (zoneNum - 1.0) * 6.0 - 180.0 + 3.0, lonOriginRad = lonOrigin * (Math.PI / 180.0);
        const zoneLetters = "CDEFGHJKLMNPQRSTUVWXX";
        let zoneLetter = "Z";
        if (lat >= -80 && lat <= 84) zoneLetter = zoneLetters.charAt(Math.floor((lat + 80) / 8));
        const nu = a / Math.sqrt(1.0 - e2 * Math.sin(latRad) * Math.sin(latRad));
        const T = Math.tan(latRad) * Math.tan(latRad), C = e_2 * Math.cos(latRad) * Math.cos(latRad), A = (lonRad - lonOriginRad) * Math.cos(latRad);
        const M = a * ((1.0 - e2 / 4.0 - 3.0 * e4 / 64.0 - 5.0 * e6 / 256.0) * latRad - (3.0 * e2 / 8.0 + 3.0 * e4 / 32.0 + 45.0 * e6 / 1024.0) * Math.sin(2.0 * latRad) + (15.0 * e4 / 256.0 + 45.0 * e6 / 1024.0) * Math.sin(4.0 * latRad) - (35.0 * e6 / 3072.0) * Math.sin(6.0 * latRad));
        const M1 = M + nu * Math.tan(latRad) * ((A * A / 2.0) + (5.0 - T + 9.0 * C + 4.0 * C * C) * (A * A * A * A / 24.0) + (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * e_2) * (A * A * A * A * A * A / 720.0));
        const K1 = k0 * (M1), K2 = k0 * nu * (A + (1.0 - T + C) * (A * A * A / 6.0) + (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * e_2) * (A * A * A * A * A / 120.0));
        let northing = K1;
        if (lat < 0.0) northing += 10000000.0;
        return { easting: K2 + 500000.0, northing: northing, zoneNum: zoneNum, zoneLetter: zoneLetter };
    }

    /**
     * (v17.5) Função principal que captura o GPS (com spinner e salvando a Zona)
     */
    async function handleGetGPS() {
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
                readings.push(convertLatLonToUtm(position.coords.latitude, position.coords.longitude));
            }

            if (readings.length === 5) {
                const avgEasting = readings.reduce((sum, r) => sum + r.easting, 0) / 5;
                const avgNorthing = readings.reduce((sum, r) => sum + r.northing, 0) / 5;
                coordXField.value = avgEasting.toFixed(0);    
                coordYField.value = avgNorthing.toFixed(0);    
                
                const zoneStr = `${readings[4].zoneNum}${readings[4].zoneLetter}`;
                gpsStatus.textContent = `Média de 5 leituras (Zona: ${zoneStr})`;
                gpsStatus.className = '';

                // (NOVO v17.1) SALVA A ÚLTIMA ZONA UTM CAPTURADA (CRÍTICO PARA O MAPA)
                lastUtmZone.num = readings[4].zoneNum;
                lastUtmZone.letter = readings[4].zoneLetter;
                
                // (NOVO v17.5) Atualiza o campo de zona padrão no mapa
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

    /**
     * (v18.0) Função para Excluir e Re-indexar (com exclusão de imagem)
     */
    function handleDeleteTree(id) {
        if (!confirm(`Tem certeza que deseja excluir a Árvore ID ${id}?`)) return;
        
        const treeToDelete = registeredTrees.find(tree => tree.id === id);
        
        // (NOVO v18.0) Deleta a imagem do IndexedDB se ela existir
        if (treeToDelete && treeToDelete.hasPhoto) {
            deleteImageFromDB(id);
        }
        
        registeredTrees = registeredTrees.filter(tree => tree.id !== id);
        saveDataToStorage();
        renderSummaryTable();
        showToast(`🗑️ Árvore ID ${id} excluída.`, 'error'); 
    }

    /**
     * (v18.0) Função para pré-preencher o formulário para edição (com Zona UTM e Foto)
     */
    function handleEditTree(id) {
        const treeIndex = registeredTrees.findIndex(tree => tree.id === id);
        if (treeIndex === -1) return;
        const treeToEdit = registeredTrees[treeIndex];

        // 1. Preenche campos
        document.getElementById('risk-data').value = treeToEdit.data;
        document.getElementById('risk-especie').value = treeToEdit.especie;
        document.getElementById('risk-local').value = treeToEdit.local;
        document.getElementById('risk-coord-x').value = treeToEdit.coordX;
        document.getElementById('risk-coord-y').value = treeToEdit.coordY;
        document.getElementById('risk-dap').value = treeToEdit.dap;
        document.getElementById('risk-avaliador').value = treeToEdit.avaliador;
        document.getElementById('risk-obs').value = treeToEdit.observacoes;
        
        // (v17.2) Carrega a zona UTM do item para a memória
        lastUtmZone.num = treeToEdit.utmZoneNum || 0;
        lastUtmZone.letter = treeToEdit.utmZoneLetter || 'Z';
        if(document.getElementById('gps-status')) {
            document.getElementById('gps-status').textContent = `Zona (da árvore): ${lastUtmZone.num}${lastUtmZone.letter}`;
        }

        // (NOVO v18.0) Carrega a imagem do IndexedDB para o preview
        const previewContainer = document.getElementById('photo-preview-container');
        const removePhotoBtn = document.getElementById('remove-photo-btn');
        clearPhotoPreview(); // Limpa qualquer preview anterior
        
        if (treeToEdit.hasPhoto) {
            getImageFromDB(id, (imageBlob) => {
                if (imageBlob) {
                    const preview = document.createElement('img');
                    preview.id = 'photo-preview';
                    preview.src = URL.createObjectURL(imageBlob);
                    previewContainer.prepend(preview); // Adiciona a imagem
                    removePhotoBtn.style.display = 'block'; // Mostra o 'X'
                    currentTreePhoto = imageBlob; // Armazena o blob para o caso de salvar sem alterar
                } else {
                    console.warn(`Árvore ID ${id} marcada com foto, mas não encontrada no IndexedDB.`);
                }
            });
        }

        // 2. Preenche checkboxes (na tabela oculta)
        const allCheckboxes = document.querySelectorAll('#risk-calculator-form .risk-checkbox');
        allCheckboxes.forEach((cb, index) => {
            cb.checked = (treeToEdit.riskFactors && treeToEdit.riskFactors[index] === 1) || false;
        });

        // (v16.0) Sincroniza o carrossel mobile (se existir)
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouchDevice) {
            setupMobileChecklist(); // Re-inicia o carrossel para ler os novos valores
        }

        // 3. Remove (mas não re-indexa IDs)
        registeredTrees.splice(treeIndex, 1);
        saveDataToStorage();
        renderSummaryTable();

        // 7. Rola para o formulário
        document.getElementById('risk-calculator-form').scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Função para limpar a tabela inteira
     */
    function handleClearAll() {
        if (confirm("Tem certeza que deseja apagar TODAS as árvores cadastradas? Esta ação não pode ser desfeita.")) {
            // (NOVO v18.0) Deleta todas as imagens do IndexedDB
            registeredTrees.forEach(tree => {
                if (tree.hasPhoto) {
                    deleteImageFromDB(tree.id);
                }
            });
            
            registeredTrees = [];
            saveDataToStorage();
            renderSummaryTable();
            showToast('🗑️ Tabela limpa.', 'error'); 
        }
    }

    /**
     * (v18.1) Renderiza a tabela e atualiza o badge (com coluna UTM, Lupa e Foto)
     */
    function renderSummaryTable() {
        const container = document.getElementById('summary-table-container');
        const importExportControls = document.getElementById('import-export-controls');
        const summaryBadge = document.getElementById('summary-badge');
        
        if (!container) return;    
        
        // Atualiza o badge
        if (summaryBadge) {
            if (registeredTrees.length > 0) {
                summaryBadge.textContent = `(${registeredTrees.length})`;
                summaryBadge.style.display = 'inline';
            } else {
                summaryBadge.textContent = '';
                summaryBadge.style.display = 'none';
            }
        }
        
        // Oculta os botões de exportação se a tabela estiver vazia
        if (registeredTrees.length === 0) {
            container.innerHTML = '<p id="summary-placeholder">Nenhuma árvore cadastrada ainda.</p>';
            if (importExportControls) {
                document.getElementById('export-data-btn')?.setAttribute('style', 'display:none'); // (v19.2)
                document.getElementById('send-email-btn')?.setAttribute('style', 'display:none');
                document.getElementById('clear-all-btn')?.setAttribute('style', 'display:none');
            }
            return;
        }
        
        // Mostra os botões de exportação
        if (importExportControls) {
            document.getElementById('export-data-btn')?.setAttribute('style', 'display:inline-flex'); // (v19.2)
            document.getElementById('send-email-btn')?.setAttribute('style', 'display:inline-flex');
            document