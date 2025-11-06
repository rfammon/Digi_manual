// script.js

// Função utilitária para gerar a tag de imagem de forma limpa e responsiva
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

// === 1. ESTRUTURA DE DADOS DO GLOSSÁRIO ===
const glossaryTerms = {
    'colar do galho': 'Zona especializada na base do galho, responsável pela compartimentalização de ferimentos.',
    'crista da casca': 'Elevação cortical paralela ao ângulo de inserção do galho, indicadora da zona de união.',
    'lenho de cicatrização': 'Tecido formado para selar ferimentos, também conhecido como callus.',
    'casca inclusa': 'Tecido cortical aprisionado em uniões de ângulo agudo (ponto de fraqueza).',
    'lenho de reação': 'Madeira com propriedades alteradas por resposta a tensões, comum em árvores inclinadas.',
    'gemas epicórmicas': 'Brotos dormentes no tronco ou galhos principais, que podem ser estimulados por poda drástica.',
    'asv': 'Autorização de Supressão de Vegetação. Documento emitido pelo órgão ambiental que autoriza o corte ou supressão.',
    'app': 'Área de Preservação Permanente. Espaço protegido por lei onde intervenções são permitidas apenas em casos de utilidade pública ou interesse social.',
    'art': 'Anotação de Responsabilidade Técnica. Documento que formaliza a responsabilidade técnica de um profissional habilitado.',
    'mtr': 'Manifesto de Transporte de Resíduos. Documento que garante a rastreabilidade dos resíduos desde a origem até a destinação final (PNRS).',
    'dap': 'Diâmetro à Altura do Peito. Medida padrão do tronco a 1,30 m do solo.',
    'rcr': 'Raio Crítico Radicular. Área de influência e sustentação mecânica das raízes (RCR = 1,5 × DAP).',
    'poda drástica': 'Corte indiscriminado (topping) entre nós. Prática NÃO recomendada que enfraquece a árvore e gera brotação epicórmica.',
    'topping': 'Sinônimo de Poda Drástica. Corte severo e indiscriminado que deve ser evitado.',
    'spi q': 'Sistema de Proteção Individual contra Quedas (ex: cinto, talabarte, trava-queda).',
    'pnrs': 'Política Nacional de Resíduos Sólidos. Lei nº 12.305/2010 sobre manejo adequado de resíduos.'
};

// === 2. ESTRUTURA DE DADOS DO MANUAL (Conteúdo Final) ===
// (Mantido idêntico à versão anterior para preservar o seu conteúdo e a marcação do glossário)
const manualContent = {
    'conceitos-basicos': {
        titulo: '1. Definições, Termos e Técnicas',
        html: `
            <h3>1.1. Termos Estruturais e Anatômicos</h3>
            <p>A correta identificação das partes da árvore é vital para realizar um corte que não comprometa a compartimentalização e a cicatrização da árvore. Use o <span class="glossary-term" data-term-key="colar do galho">colar do galho</span> e a <span class="glossary-term" data-term-key="crista da casca">crista da casca</span> como guias.</p>
            ${imgTag('anatomia-corte.jpg', 'Ilustração da anatomia correta do corte de galho: colar do galho e crista da casca.')}
            <p>Termos como <span class="glossary-term" data-term-key="lenho de cicatrização">lenho de cicatrização</span>, <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span> e <span class="glossary-term" data-term-key="lenho de reação">lenho de reação</span> são importantes para a inspeção.</p>

            <h3>1.2. Instrumentos e Equipamentos</h3>
            <ul>
                <li><strong>Podão:</strong> Tesoura de poda de haste longa para alcance elevado.</li>
                <li><strong>Tesourão de poda:</strong> Ferramenta para galhos de até 7 cm de diâmetro.</li>
                <li><strong>Motosserra:</strong> Equipamento motorizado para galhos e troncos (> 12 cm).</li>
                <li><strong>Podador manual tipo bypass:</strong> Lâmina deslizante que realiza cortes limpos.</li>
                <li><strong>Hipsômetro:</strong> Instrumento para medir altura de árvores.</li>
            </ul>

            <h3>1.3. Técnicas de Poda Essenciais</h3>
            <ul>
                <li><strong>Poda de limpeza:</strong> Remove galhos mortos, doentes ou mal orientados.</li>
                <li><strong>Poda de adequação:</strong> Adapta a árvore ao espaço urbano/industrial.</li>
                <li><strong>Poda de redução:</strong> Diminui volume da copa.</li>
                <li><strong>Poda em três cortes:</strong> Técnica que preserva tecidos vitais, evitando rasgos na casca.</li>
                <li><strong>⚠️ Prática NÃO RecomendADA:</strong> <span class="glossary-term" data-term-key="poda drástica">Poda drástica</span> (<span class="glossary-term" data-term-key="topping">topping</span>).</li>
            </ul>
        `
    },
    'planejamento-inspecao': {
        titulo: '2. Procedimentos: Planejamento e Inspeção',
        html: `
            <h3>2.1. Planejamento (Fase Fundamental)</h3>
            <p>O planejamento deve garantir a execução **segura e eficiente**, contemplando escopo, análise prévia e autorizações legais.</p>

            <h4>2.1.2. Finalidade da Poda (Guia Rápido)</h4>
            <ul>
                <li><strong>Limpeza:</strong> Remover ramos mortos, secos, doentes (Risco sanitário e queda).</li>
                <li><strong>Correção:</strong> Remover ramos com defeito estrutural (cruzados, V) para aumentar estabilidade. ${imgTag('uniao-v-casca-inclusa.jpg', 'Ilustração de união em V com casca inclusa, indicando ponto de fraqueza.')}</li>
                <li><strong>Adequação:</strong> Resolver conflitos com estruturas urbanas/edificações.</li>
                <li><strong>⚠️ Poda de Raízes:</strong> Deve ser **evitada** por causar perda estrutural. Consulte profissional habilitado.</li>
            </ul>
            
            <h4>2.1.3. Inspeção Visual Expedita (5 a 10 min/árvore)</h4>
            <p>Foco nos seguintes aspectos críticos de risco:</p>
            <ul>
                <li><strong>Fendas horizontais</strong> no tronco.</li>
                <li>Presença de <strong>carpóforos (cogumelos)</strong> ou tecidos esponjosos na base. ${imgTag('sinal-podridao.jpg', 'Foto de um tronco com cogumelos (carpóforos) indicando apodrecimento.')}</li>
                <li>Galhos mortos com diâmetro <strong>superior a 5 cm</strong>.</li>
                <li>Uniões em “V” com <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span>.</li>
            </ul>

            <h4>2.1.6. Classificação de Risco</h4>
            <ul>
                <li><strong>🔴 ALTO RISCO:</strong> Defeitos críticos próximos a alvos estratégicos. Intervenção em até **48h**.</li>
                <li><strong>🟠 MÉDIO RISCO:</strong> Defeitos moderados ou críticos distantes. Intervenção em até **15 dias**.</li>
                <li><strong>🟢 BAIXO RISCO:</strong> Sem defeitos significativos. Monitoramento anual.</li>
            </ul>
            
            <h4>2.1.7. Raio Crítico Radicular (RCR)</h4>
            <p><strong><span class="glossary-term" data-term-key="rcr">RCR</span> = 1,5 × <span class="glossary-term" data-term-key="dap">DAP</span></strong> (Diâmetro à Altura do Peito). Verificar dentro do RCR: interferências, perda de >40% de raízes de sustentação ou apodrecimento em raízes primárias (>3 cm).</p>
        `
    },
    'autorizacao-legal': {
        titulo: '1.5. e 2.1.9. Termos Legais e Autorização (ASV)',
        html: `
            <h3>1.5. Termos Legais e Normativos</h3>
            <ul>
                <li><strong><span class="glossary-term" data-term-key="asv">ASV</span> (Autorização de Supressão de Vegetação):</strong> Documento que autoriza o corte ou supressão, emitido pelo órgão ambiental.</li>
                <li><strong><span class="glossary-term" data-term-key="app">APP</span> (Área de Preservação Permanente):</strong> Espaço protegido por lei. Intervenção só em casos de utilidade pública ou interesse social.</li>
                <li><strong><span class="glossary-term" data-term-key="art">ART</span> (Anotação de Responsabilidade Técnica):</strong> Formaliza a responsabilidade técnica de um profissional habilitado.</li>
                <li><strong><span class="glossary-term" data-term-key="mtr">MTR</span> (Manifesto de Transporte de Resíduos):</strong> Garante a rastreabilidade dos resíduos (<span class="glossary-term" data-term-key="pnrs">PNRS</span>).</li>
                <li><strong>Compensação Ambiental:</strong> Obrigatória para mitigar impactos da supressão.</li>
            </ul>

            <h3>2.1.9. Licenciamento da Atividade (ASV)</h3>
            <p>Toda intervenção deve ser realizada com a anuência do setor de meio ambiente da unidade.</p>
            
            <h4>Dispensa de Autorização:</h4>
            <ul>
                <li>Indivíduos com <span class="glossary-term" data-term-key="dap">DAP</span> inferior a 0,05 m **fora** de <span class="glossary-term" data-term-key="app">APP</span>.</li>
                <li>Árvores com **risco iminente** de queda (comprovado por defesa civil), com processo administrativo *a posteriori*.</li>
            </ul>

            <h4>Diferença entre Área Comum e APP</h4>
            <table class="data-table">
                <thead>
                    <tr><th>Aspecto</th><th>Área Comum</th><th>APP (Preservação Permanente)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Autorização</td><td>Requer <span class="glossary-term" data-term-key="asv">ASV</span></td><td>Requer <span class="glossary-term" data-term-key="asv">ASV</span> com **justificativa rigorosa**</td></tr>
                    <tr><td>Finalidade</td><td>Uso alternativo do solo</td><td>Somente Utilidade Pública, Interesse Social ou Baixo Impacto</td></tr>
                    <tr><td>Compensação</td><td>Proporcional à área suprimida</td><td>Obrigatória, com critérios mais exigentes (até 6x a área suprimida)</td></tr>
                </tbody>
            </table>
        `
    },
    'preparacao-e-isolamento': {
        titulo: '2.2. Preparação do Local e Isolamento',
        html: `
            <h3>2.2.2. Isolamento e Sinalização</h3>
            <p>O isolamento é **obrigatório** para garantir a segurança de pessoas e a integridade das operações.</p>
            
            <h4>Delimitação do Perímetro de Exclusão (Raio de Perigo)</h4>
            ${imgTag('isolamento-perimetro.jpg', 'Diagrama de sinalização de perímetro de segurança e raio de perigo.')}
            <ul>
                <li><strong>Galhos isolados:</strong> Comprimento do galho **+ 50%**.</li>
                <li><strong>Árvore inteira:</strong> Altura total **+ 50%**.</li>
            </ul>
            <p><strong>Materiais:</strong> Pedestais metálicos/plásticos com correntes preto e amarelo. Placas de sinalização a cada 10 m.</p>
            <p><strong>⛔ Proibição:</strong> Uso de fita zebrada (salvo emergências).</p>
            
            <h3>2.2.3. Desligamento de Linhas de Energia</h3>
            <ul>
                <li>Avaliar interferência durante o planejamento.</li>
                <li>**Solicitar formalmente** o desligamento antes da execução.</li>
                <li><strong>É proibido</strong> realizar podas ou cortes em árvores em contato com redes ativas.</li>
            </ul>
            
            <h3>2.2.4. Liberação de Permissão de Trabalho (PT)</h3>
            <ul>
                <li>A PT é **obrigatória** e deve estar de acordo com o escopo e medidas preventivas.</li>
                <li>Validar a PT com a equipe de segurança **antes** do início.</li>
                <li>Qualquer alteração no escopo ou nas condições exige **revalidação da PT**.</li>
            </ul>
        `
    },
    'operacoes-e-tecnicas': {
        titulo: '2.3. Operações de Poda e Corte',
        html: `
            <h3>2.3.2. Técnicas de Poda</h3>
            <ul>
                <li><strong>Desbaste da copa:</strong> Remoção seletiva para luz e ar. Limite de **até 25% da copa viva** por intervenção. Evitar a formação de 'cauda de leão'.</li>
                <li><strong>Elevação da copa:</strong> Manter pelo menos **2/3 da altura total** com copa viva.</li>
                <li><strong>Redução da copa:</strong> Por corte em garfo. Preservar ramos laterais com diâmetro **≥ 1/3** do ramo removido.</li>
            </ul>
            
            <h4>Técnica de Corte: Poda em Três Cortes</h4>
            ${imgTag('corte-tres-passos.jpg', 'Sequência dos 3 passos para a poda segura, preservando o colar do galho.')}
            <p>Aplicar o método para preservar <span class="glossary-term" data-term-key="crista da casca">crista da casca</span> e <span class="glossary-term" data-term-key="colar do galho">colar do galho</span>, evitando rasgos:</p>
            <ol>
                <li><strong>Corte inferior (alívio):</strong> Na face inferior, fora do colar.</li>
                <li><strong>Corte superior:</strong> Destaca o galho.</li>
                <li><strong>Corte de acabamento:</strong> Rente à <span class="glossary-term" data-term-key="crista da casca">crista da casca</span>, preservando o <span class="glossary-term" data-term-key="colar do galho">colar do galho</span>.</li>
            </ol>
            <p><strong>⛔ Práticas Proibidas:</strong></p>
            <ul>
                <li><span class="glossary-term" data-term-key="poda drástica">Poda drástica</span> (<span class="glossary-term" data-term-key="topping">topping</span>). ${imgTag('topping-errado.jpg', 'Exemplo de Poda Drástica (Topping) mostrando os múltiplos brotos indesejados.')}</li>
                <li>Corte cego (tipping).</li>
                <li>Cortes rentes. ${imgTag('corte-rente-lesao.jpg', 'Imagem de um tronco com um corte rente, mostrando a lesão e dificuldade de cicatrização.')}</li>
                <li>Cortes com toco.</li>
            </ul>
            ${imgTag('poda-drastica-vs-correta.jpg', 'Comparação visual entre Poda Drástica (Topping) e Poda de Redução correta.')}
            
            <h3>2.3.2.5. Supressão (Corte de Árvore)</h3>
            <ul>
                <li><strong>Condições:</strong> Árvores mortas, risco iminente, danos estruturais irreversíveis ou determinação legal.</li>
                <li><strong>Corte Direcional:</strong> Abrir cunha no lado da queda. Corte de abate no oposto, deixando a "dobradiça" de 10% do diâmetro.</li>
            </ul>

            <h4>Segurança Crítica: Rota de Fuga</h4>
            ${imgTag('rota-fuga-45graus.jpg', 'Diagrama de corte direcional mostrando as duas rotas de fuga em ângulo de 45°.')}
            <p>Planejar **duas rotas de fuga** livres de obstáculos, formando um ângulo de aproximadamente **45°** em relação à direção de queda.</p>

            <h4>⚠️ Atenção a Troncos Tensionados</h4>
            ${imgTag('corte-tronco-tensionado.jpg', 'Ilustração de tronco tensionado e a ordem de corte de segurança (Tensão descendente vs Ascendente).')}
            
            <h4>⚠️ Efeito Rebote (Motosserra)</h4>
            ${imgTag('perigo-rebote.jpg', 'Diagrama de segurança da motosserra, ilustrando a Zona de Perigo (Efeito Rebote) na ponta do sabre.')}
            <p>Ocorre quando a ponta superior da lâmina (sabre) toca um objeto. A motosserra é projetada violentamente para cima. **A principal medida de segurança é NUNCA usar a ponta superior da lâmina para cortar.**</p>
        `
    },
    'riscos-e-epis': {
        titulo: '2.4. e 2.5. Análise de Risco e EPIs',
        html: `
            <h3>2.4. Análise de Risco (Perigos Recorrentes)</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Perigo</th><th>Causas Comuns</th></tr>
                </thead>
                <tbody>
                    <tr><td>Queda de altura</td><td>Ausência de ponto de ancoragem seguro, movimentação em galhos instáveis.</td></tr>
                    <tr><td>Queda de ferramentas/galhos</td><td>Falta de amarração de ferramentas, corte sem controle.</td></tr>
                    <tr><td>Choque elétrico</td><td>Proximidade de redes elétricas ativas, falta de desligamento.</td></tr>
                    <tr><td>Corte ou perfuração</td><td>Uso de motosserra sem proteção, falta de EPI adequado.</td></tr>
                    <tr><td>Efeito Rebote</td><td>Uso da ponta superior da lâmina do sabre.</td></tr>
                </tbody>
            </table>
            
            <h3>2.5. Equipamento de Proteção Individual (EPIs)</h3>
            ${imgTag('epis-motoserra.jpg', 'Foto de um operador usando o kit completo de EPIs para motosserra.')}
            <p>EPIs obrigatórios para a atividade:</p>
            
            <h4>EPIs Anticorte e Impacto</h4>
            <ul>
                <li><strong>Capacete com jugular</strong> (queda de objetos).</li>
                <li><strong>Calça/Blusão/Luva de motoserrista</strong> (corte e perfuração).</li>
                <li><strong>Viseira/protetor facial</strong> (projeção de partículas).</li>
                <li><strong>Perneira</strong> (animais peçonhentos).</li>
            </ul>
            
            <h4>EPIs para Trabalho em Altura (SPIQ)</h4>
            <p>Requisito da NR-35 - Uso de <span class="glossary-term" data-term-key="spi q">SPIQ</span>:</p>
            <ul>
                <li><strong>Cinto de segurança</strong> tipo paraquedista.</li>
                <li><strong>Talabarte duplo</strong> com absorvedor de energia.</li>
                <li><strong>Trava-queda.</strong></li>
            </ul>
            <p><strong>⚠️ Proibição:</strong> Utilização da **escalada livre** ou ancoragem nos galhos a serem cortados.</p>
        `
    },
    'gestao-e-desmobilizacao': {
        titulo: '2.3.4. Gestão de Resíduos e Desmobilização',
        html: `
            <h3>2.3.4. Gestão de Resíduos Arbóreos (PNRS)</h3>
            ${imgTag('segregacao-residuos.jpg', 'Ilustração da segregação de resíduos arbóreos por tipo (lenhoso, foliar).')}
            <ul>
                <li><strong>Princípios:</strong> Não geração, redução, reutilização e reciclagem (biomassa, compostagem).</li>
                <li><strong>Segregação:</strong> Separar por tipo na origem (lenhoso, foliar).</li>
                <li><strong>Rastreabilidade:</strong> Emissão de <span class="glossary-term" data-term-key="mtr">Manifesto de Transporte de Resíduos (MTR)</span>, garantindo destinação final licenciada (conforme <span class="glossary-term" data-term-key="pnrs">PNRS</span>).</li>
            </ul>
            
            <h4>Abastecimento Seguro de Máquinas Motorizadas</h4>
            ${imgTag('abastecimento-seguro.jpg', 'Diagrama de abastecimento seguro, incluindo bacia de contenção e Kit de Mitigação Ambiental.')}
            <ul>
                <li>Realizar em área ventilada, com <strong>bacia de contenção</strong> e <strong>Kit de Mitigação Ambiental</strong> (Manta absorvente, Pó de serragem, Luvas nitrílicas).</li>
            </ul>
            
            <h3>2.3.6. Desmobilização (Encerramento)</h3>
            <p>Retirada segura de equipamentos, ferramentas, sinalização e resíduos.</p>
            <ol>
                <li>Remover **todos** os resíduos arbóreos e garantir a limpeza da área.</li>
                <li>Retirada de isolamento e sinalização **somente após a liberação formal** do responsável técnico.</li>
                <li>Realizar conferência (Checklist) e registro fotográfico.</li>
                <li>A liberação da área deve ser formalizada pelo responsável técnico.</li>
            </ol>
        `
    }
};

// === 3. FUNÇÕES PRINCIPAIS DE NAVEGAÇÃO ===

const detailView = document.getElementById('detalhe-view');
let activeTopicButtons; // Declarada fora para ser acessível globalmente

// Define os dados dos botões
const topicButtonsData = [
    { target: 'conceitos-basicos', text: '1. Definições, Termos e Técnicas' },
    { target: 'planejamento-inspecao', text: '2.1. Planejamento e Inspeção (Risco)' },
    { target: 'autorizacao-legal', text: '1.5. e 2.1.9. Termos Legais e ASV' },
    { target: 'preparacao-e-isolamento', text: '2.2. Preparação e Isolamento (PT)' },
    { target: 'operacoes-e-tecnicas', text: '2.3. Operações, Poda e Supressão' },
    { target: 'riscos-e-epis', text: '2.4. e 2.5. Análise de Risco e EPIs' },
    { target: 'gestao-e-desmobilizacao', text: '2.3.4. Gestão de Resíduos e Desmobilização' }
];

function initializeNavigation() {
    const navContainer = document.querySelector('.topicos-container');
    navContainer.innerHTML = ''; 
    
    // Cria os botões dinamicamente
    topicButtonsData.forEach(item => {
        const button = document.createElement('button');
        button.classList.add('topico-btn');
        button.setAttribute('data-target', item.target);
        button.textContent = item.text;
        navContainer.appendChild(button);
    });

    // CRÍTICO: Seleciona os botões APÓS a criação e vincula o clique
    activeTopicButtons = document.querySelectorAll('.topico-btn');

    activeTopicButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            
            // Remove a classe 'active' de todos os botões
            activeTopicButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona a classe 'active' ao botão clicado
            button.classList.add('active');
            
            // Carrega o novo conteúdo
            loadContent(target);
        });
    });

    // Carrega o conteúdo inicial
    if (activeTopicButtons.length > 0) {
        const defaultTarget = activeTopicButtons[0].getAttribute('data-target');
        activeTopicButtons[0].classList.add('active');
        loadContent(defaultTarget);
    }
}

function loadContent(targetKey) {
    const content = manualContent[targetKey];
    
    if (content) {
        detailView.innerHTML = `
            <h3>${content.titulo}</h3>
            ${content.html}
        `;
        // Vincula a interação do glossário APÓS carregar