// script.js (COMPLETO v19.3 - Correção de Bug de Referência e Botões Unificados)

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

// === 2. DADOS DO MANUAL (CONTEÚDO COMPLETO v19.3 - CORREÇÃO DE BUG) ===
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
            <h4>Abastecimento Seguro</h4>
            ${imgTag('abastecimento-seguro.jpg', 'Abastecimento seguro com bacia de contenção')}
            <ul><li>Realizar em área ventilada, com <strong>bacia de contenção</strong> e <strong>Kit de Mitigação Ambiental</strong>.</li></ul>
            <h3>Desmobilização</h3>
            <p>Remover todos os resíduos. Retirar isolamento <strong>somente após liberação formal</strong> do responsável técnico.</p>
        `
    },
    'glossario-geral': {
        titulo: '📘 Glossário Geral de Termos',
        html: `
            <p>Navegue por todos os termos técnicos, legais e de equipamentos usados neste manual, organizados por categoria.</p>
            <table class="glossary-table">
                <thead>
                    <tr>
                        <th>Termo</th>
                        <th>Definição</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="2" class="glossary-category-header">Termos Estruturais e Anatômicos</td></tr>
                    <tr><td>Colar do galho</td><td>Zona especializada na base do galho, responsável pela compartimentalização de ferimentos.</td></tr>
                    <tr><td>Crista da casca</td><td>Elevação cortical paralela ao ângulo de inserção do galho, indicadora da zona de união.</td></tr>
                    <tr><td>Lenho de cicatrização</td><td>Tecido formado para selar ferimentos, também conhecido como callus.</td></tr>
                    <tr><td>Casca inclusa</td><td>Tecido cortical aprisionado em uniões de ângulo agudo.</td></tr>
                    <tr><td>Lenho de reação</td><td>Madeira com propriedades alteradas por resposta a tensões.</td></tr>
                    <tr><td>Gemas epicórmicas</td><td>Brotos dormentes no tronco ou galhos principais.</td></tr>
                    <tr><td>Entrenó</td><td>Espaço entre dois nós consecutivos no ramo.</td></tr>
                    <tr><td>Nó</td><td>Ponto de inserção de folhas, gemas ou ramos.</td></tr>
                    <tr><td>Lenho</td><td>Tecido vegetal com função de sustentação e condução de seiva.</td></tr>
                    
                    <tr><td colspan="2" class="glossary-category-header">Instrumentos e Equipamentos</td></tr>
                    <tr><td>Podão</td><td>Tesoura de poda de haste longa para alcance elevado.</td></tr>
                    <tr><td>Tesourão de poda</td><td>Ferramenta para galhos de até 7 cm de diâmetro.</td></tr>
                    <tr><td>Serra de poda</td><td>Serra com dentes especiais para madeira verde.</td></tr>
                    <tr><td>Motosserra</td><td>Equipamento motorizado para corte de galhos e troncos.</td></tr>
                    <tr><td>Motopoda</td><td>Ferramenta motorizada com haste para galhos altos.</td></tr>
                    <tr><td>Podador manual tipo bypass</td><td>Lâmina deslizante que realiza cortes limpos.</td></tr>
                    <tr><td>Podador tipo bigorna</td><td>Lâmina que pressiona o galho contra superfície plana.</td></tr>
                    <tr><td>Hipsômetro</td><td>Instrumento para medir altura de árvores.</td></tr>
                    
                    <tr><td colspan="2" class="glossary-category-header">Técnicas de Poda</td></tr>
                    <tr><td>Poda de condução</td><td>Direciona crescimento da árvore.</td></tr>
                    <tr><td>Poda de formação</td><td>Define estrutura arquitetônica futura.</td></tr>
                    <tr><td>Poda de limpeza</td><td>Remove galhos mortos, doentes ou mal orientados.</td></tr>
                    <tr><td>Poda de adequação</td><td>Adapta a árvore ao espaço urbano ou industrial.</td></tr>
                    <tr><td>Poda de redução</td><td>Diminui volume da copa.</td></tr>
                    <tr><td>Poda de emergência</td><td>Elimina riscos iminentes.</td></tr>
                    <tr><td>Poda de raízes</td><td>Deve ser evitada; requer profissional habilitado.</td></tr>
                    <tr><td>Poda em cabeçote</td><td>Poda severa para estimular brotação.</td></tr>
                    <tr><td>Poda drástica</td><td>Corte indiscriminado com remoção total ou parcial da copa (não recomendada).</td></tr>
                    <tr><td>Poda de redução por corte no garfo</td><td>Preserva estrutura natural.</td></tr>
                    <tr><td>Corte rente</td><td>Remove o colar do galho (inadequado).</td></tr>
                    <tr><td>Corte com toco</td><td>Retarda cicatrização.</td></tr>
                    <tr><td>Poda em três cortes</td><td>Técnica que preserva tecidos vitais.</td></tr>
                    <tr><td>Desbaste da copa</td><td>Remoção seletiva para luz e ventilação.</td></tr>
                    <tr><td>Elevação da copa</td><td>Remoção de galhos inferiores.</td></tr>
                    <tr><td>Redução da copa</td><td>Corte seletivo para adequação ao espaço.</td></tr>

                    <tr><td colspan="2" class="glossary-category-header">Parâmetros de Avaliação</td></tr>
                    <tr><td>Diâmetro à Altura do Peito (DAP)</td><td>Medida padrão a 1,30 m do solo.</td></tr>
                    <tr><td>Projeção da copa</td><td>Área de sombreamento da copa.</td></tr>
                    <tr><td>Índice de vitalidade</td><td>Avaliação do estado fitossanitário.</td></tr>
                    <tr><td>Raio Crítico Radicular (RCR)</td><td>Área de influência e sustentação mecânica das raízes.</td></tr>
                    <tr><td>Nível 1 (Avaliação de Árvores)</td><td>Análise visual.</td></tr>
                    <tr><td>Nível 2 (Avaliação de Árvores)</td><td>Inspeção 360º.</td></tr>
                    <tr><td>Nível 3 (Avaliação de Árvores)</td><td>Métodos avançados para avaliar defeitos.</td></tr>

                    <tr><td colspan="2" class="glossary-category-header">Termos Legais e Normativos</td></tr>
                    <tr><td>ASV (Autorização de Supressão de Vegetação)</td><td>Documento emitido pelo órgão ambiental competente que autoriza o corte ou supressão de vegetação nativa ou árvores isoladas, mediante justificativa técnica e compensação ambiental.</td></tr>
                    <tr><td>APP (Área de Preservação Permanente)</td><td>Espaço protegido por lei, com função ambiental de preservar recursos hídricos, biodiversidade e estabilidade geológica. Intervenções são permitidas apenas em casos de utilidade pública, interesse social ou baixo impacto ambiental.</td></tr>
                    <tr><td>CTF (Cadastro Técnico Federal)</td><td>Registro obrigatório no IBAMA para pessoas físicas ou jurídicas que realizam atividades potencialmente poluidoras ou utilizadoras de recursos naturais.</td></tr>
                    <tr><td>ART (Anotação de Responsabilidade Técnica)</td><td>Documento que formaliza a responsabilidade técnica de um profissional habilitado sobre determinado serviço ou estudo ambiental.</td></tr>
                    <tr><td>TCRA (Termo de Compromisso de Recuperação Ambiental)</td><td>Instrumento legal que formaliza a obrigação de compensação ambiental por meio de ações de recuperação ou preservação.</td></tr>
                    <tr><td>Compensação Ambiental</td><td>Medida obrigatória para mitigar os impactos causados pela supressão de vegetação, podendo incluir restauração ecológica, preservação de áreas remanescentes ou compensação em propriedades de terceiros.</td></tr>
                    <tr><td>PNRS (Política Nacional de Resíduos Sólidos)</td><td>Lei nº 12.305/2010 que estabelece diretrizes para o manejo adequado dos resíduos sólidos, incluindo os gerados por poda e corte de árvores.</td></tr>
                    <tr><td>MTR (Manifesto de Transporte de Resíduos)</td><td>Documento que garante a rastreabilidade dos resíduos desde a origem até a destinação final, exigido em operações de transporte de resíduos sólidos.</td></tr>
                </tbody>
            </table>
        `
    },
    'sobre-autor': {
        titulo: '👨‍💻 Sobre o Autor',
        html: `
            <div id="sobre-o-autor">    
                <div class="autor-container">
                    <div class="autor-texto">
                        <p>
                            <strong>Rafael de Andrade Ammon</strong> é Engenheiro Florestal (UFRRJ),
                            com MBA em Gestão de Projetos (USP/ESALQ) em curso. A sua carreira
                            foca-se na conservação ambiental, restauração florestal e
                            sustentabilidade corporativa.
                        </p>
                        <p>
                            Atualmente, atua como Fiscal Operacional em áreas verdes industriais
                            na RPBC (pela Vinil Engenharia). Possui experiência em projetos
                            de grande escala, como o Inventário Florestal Nacional (RJ) e a
                            restauração do COMPERJ, tendo trabalhado em empresas como EGIS
                            e CTA Meio Ambiente.
                        </p>
                        <p>
                            É certificado em Google Project Management e pela ABRAPLAN,
                            com competências em Geoprocessamento (QGIS) e Power BI.
                            Fluente em inglês.
                        </p>
                        <p class="autor-links">
                            <a href="mailto:rafael.ammon@gmail.com">rafael.ammon@gmail.com</a> |    
                            <a href="https://www.linkedin.com/in/rafael-andrade-ammon-2527a72a/" target="_blank">LinkedIn</a>
                        </p>
                    </div>
                </div>
            </div>
        `
    },

    // (CORRIGIDO v19.3) HTML da Calculadora: HTML estático completo (sem auto-referência)
    'calculadora-risco': {
        titulo: '📊 Calculadora de Risco Arbóreo',
        html: `
            <p>Use o mapa para visualização geoespacial do risco, a aba "Registrar" para coleta e "Resumo" para gerenciar os dados.</p>
            
            <nav class="sub-nav">
                <button type="button" class="sub-nav-btn" data-target="tab-content-register">
                    Registrar Árvore
                </button>
                <button type="button" class="sub-nav-btn" data-target="tab-content-summary">
                    Resumo da Vistoria <span id="summary-badge" class="badge"></span>
                </button>
                <button type="button" class="sub-nav-btn" data-target="tab-content-mapa">
                    Mapa GIS 🗺️
                </button>
            </nav>

            <div id="tab-content-register" class="sub-tab-content">
                <form id="risk-calculator-form">
                    <fieldset class="risk-fieldset">
                        <legend>1. Identificação da Árvore</legend>
                        <div class="form-grid">
                            <div>
                                <label for="risk-data">Data da Coleta:</label>
                                <input type="date" id="risk-data" name="risk-data" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div>
                                <label for="risk-especie">Espécie (Nome/Tag):</label>
                                <input type="text" id="risk-especie" name="risk-especie" required>
                            </div>
                            <div>
                                <label for="risk-local">Local (Endereço/Setor):</label>
                                <input type="text" id="risk-local" name="risk-local">
                            </div>
                            <div>
                                <label for="risk-coord-x">Coord. X (UTM ou Lon):</label>
                                <input type="text" id="risk-coord-x" name="risk-coord-x">
                            </div>
                            <div>
                                <label for="risk-coord-y">Coord. Y (UTM ou Lat):</label>
                                <input type="text" id="risk-coord-y" name="risk-coord-y">
                            </div>
                            <div class="gps-button-container">
                                <button type="button" id="get-gps-btn">🛰️ Capturar GPS</button>
                                <span id="gps-status"></span>
                            </div>
                            <div>
                                <label for="risk-dap">DAP (cm):</label>
                                <input type="number" id="risk-dap" name="risk-dap" min="0" step="any">
                            </div>
                            <div>
                                <label for="risk-avaliador">Avaliador:</label>
                                <input type="text" id="risk-avaliador" name="risk-avaliador">
                            </div>
                        </div>
                        <div>
                            <label for="risk-obs">Observações (Opcional):</label>
                            <textarea id="risk-obs" name="risk-obs" rows="3" placeholder="Ex: Cavidade no tronco, presença de pragas, galho sobre telhado..."></textarea>
                        </div>

                        <div class="photo-upload-container">
                            <label for="tree-photo-input" class="photo-btn">📷 Adicionar Foto</label>
                            <input type="file" id="tree-photo-input" accept="image/*" capture="environment" style="display: none;">
                            
                            <div id="photo-preview-container">
                                <button type="button" id="remove-photo-btn" style="display:none;">&times;</button>
                            </div>
                        </div>
                        
                    </fieldset>
                    
                    <fieldset class="risk-fieldset">
                        <legend>2. Lista de Verificação de Risco</legend>
                        <table class="risk-table">
                            <thead>
                                <tr><th>Nº</th><th>Pergunta</th><th>Peso</th><th>Sim</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>1</td><td>Há galhos mortos com diâmetro superior a 5 cm?</td><td>3</td><td><input type="checkbox" class="risk-checkbox" data-weight="3"></td></tr>
                                <tr><td>2</td><td>Existem rachaduras ou fendas no tronco ou galhos principais?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                                <tr><td>3</td><td>Há sinais de apodrecimento (madeira esponjosa, fungos, cavidades)?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                                <tr><td>4</td><td>A árvore possui uniões em “V” com casca inclusa?</td><td>4</td><td><input type="checkbox" class="risk-checkbox" data-weight="4"></td></tr>
                                <tr><td>5</td><td>Há galhos cruzados ou friccionando entre si?</td><td>2</td><td><input type="checkbox" class="risk-checkbox" data-weight="2"></td></tr>
                                <tr><td>6</td><td>A árvore apresenta copa assimétrica (>30% de desequilíbrio)?</td><td>2</td><td><input type="checkbox" class="risk-checkbox" data-weight="2"></td></tr>
                                <tr><td>7</td><td>Há sinais de inclinação anormal ou recente?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                                <tr><td>8</td><td>A árvore está próxima a vias públicas ou áreas de circulação?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                                <tr><td>9</td><td>Há risco de queda sobre edificações, veículos ou pessoas?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                                <tr><td>10</td><td>A árvore interfere em redes elétricas ou estruturas urbanas?</td><td>4</td><td><input type="checkbox" class="risk-checkbox" data-weight="4"></td></tr>
                                <tr><td>11</td><td>A espécie é conhecida por apresentar alta taxa de falhas?</td><td>3</td><td><input type="checkbox" class="risk-checkbox" data-weight="3"></td></tr>
                                <tr><td>12</td><td>A árvore já sofreu podas drásticas ou brotação epicórmica intensa?</td><td>3</td><td><input type="checkbox" class="risk-checkbox" data-weight="3"></td></tr>
                                <tr><td>13</td><td>Há calçadas rachadas ou tubulações expostas próximas à base?</td><td>3</td><td><input type="checkbox" class="risk-checkbox" data-weight="3"></td></tr>
                                <tr><td>14</td><td>Há perda visível de raízes de sustentação (>40%)?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                                <tr><td>15</td><td>Há sinais de compactação ou asfixia radicular?</td><td>3</td><td><input type="checkbox" class="risk-checkbox" data-weight="3"></td></tr>
                                <tr><td>16</td><td>Há apodrecimento em raízes primárias (>3 cm)?</td><td>5</td><td><input type="checkbox" class="risk-checkbox" data-weight="5"></td></tr>
                            </tbody>
                        </table>
                        <div class="mobile-checklist-wrapper">
                            <div class="mobile-checklist-card"></div>
                            <div class="mobile-checklist-nav">
                                <button type="button" id="checklist-prev">❮ Anterior</button>
                                <span class="checklist-counter">1 / 16</span>
                                <button type="button" id="checklist-next">Próxima ❯</button>
                            </div>
                        </div>
                    </fieldset>
                    
                    <div class="risk-buttons-area">
                        <button type="submit" id="add-tree-btn">➕ Adicionar Árvore</button>
                        <button type="button" id="reset-risk-form-btn">Limpar Campos</button>
                    </div>
                </form>
            </div>
            
            <div id="tab-content-summary" class="sub-tab-content">
                <fieldset class="risk-fieldset">
                    <legend>3. Árvores Cadastradas</legend>
                    
                    <div class="table-filter-container">
                        <input type="text" id="table-filter-input" placeholder="🔎 Filtrar por ID, espécie, local, risco...">
                    </div>
                    
                    <div id="summary-table-container">
                        <p id="summary-placeholder">Nenhuma árvore cadastrada ainda.</p>
                    </div>
                    
                    <div id="import-export-controls" class="risk-buttons-area">
                        
                        <input type="file" id="zip-importer" accept=".zip,application/zip,application/x-zip-compressed" style="display: none;">
                        <input type="file" id="csv-importer" accept="text/csv,application/csv,application/vnd.ms-excel,.csv,text/plain" style="display: none;">
                        
                        <button type="button" id="import-data-btn" class="export-btn zip-import-label">📤 Importar Dados</button>
                        <button type="button" id="export-data-btn" class="export-btn">📥 Exportar Dados</button>
                        
                        <button type="button" id="send-email-btn" class="export-btn">📧 Enviar por Email</button>
                        <button type="button" id="clear-all-btn" class="export-btn">🗑️ Limpar Tabela</button>
                    </div>
                    
                    <div id="zip-status" style="display: none;">
                        <span class="spinner" style="display: inline-block;"></span>
                        <span id="zip-status-text" style="margin-left: 10px; font-weight: bold; color: #004d40;">Processando pacote...</span>
                    </div>

                </fieldset>
            </div>
            
            <div id="tab-content-mapa" class="sub-tab-content mapa-tab">
                <fieldset class="risk-fieldset">
                    <legend>Mapa de Localização e Risco</legend>
                    <div id="map-container"></div>
                    
                    <div class="form-grid" style="margin-top: 15px; gap: 10px;">
                        <div>
                            <label for="default-utm-zone">Zona UTM Padrão (Ex: 23K):</label>
                            <input type="text" id="default-utm-zone" placeholder="Ex: 23K" style="height: 38px;">
                            <small style="color: #555; font-size: 0.8em;">(Necessário para dados antigos ou importados)</small>
                        </div>
                        <button type="button" id="zoom-to-extent-btn" class="export-btn">📍 Aproximar dos Pontos</button>
                    </div>

                    <p style="margin-top: 15px; font-size: 0.9em; color: #555;">
                        Simbologia: <span style="color: #C62828; font-weight: bold;">🔴 Alto Risco</span> | 
                        <span style="color: #E65100; font-weight: bold;">🟠 Médio Risco</span> | 
                        <span style="color: #2E7D32; font-weight: bold;">🟢 Baixo Risco</span>
                    </p>
                </fieldset>
            </div>
        `
    }
};

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
            document.getElementById('clear-all-btn')?.setAttribute('style', 'display:inline-flex');
        }

        // (NOVO v18.0) Helper para adicionar classes de ordenação
        const getThClass = (key) => {
            let classes = 'sortable';
            if (sortState.key === key) {
                classes += sortState.direction === 'asc' ? ' sort-asc' : ' sort-desc';
            }
            return classes;
        };

        // (NOVO v18.0) Adiciona cabeçalhos ordenáveis
        let tableHTML = '<table class="summary-table"><thead><tr>';
        tableHTML += `<th class="${getThClass('id')}" data-sort-key="id">ID</th>`;
        tableHTML += `<th class="${getThClass('data')}" data-sort-key="data">Data</th>`;
        tableHTML += `<th class="${getThClass('especie')}" data-sort-key="especie">Espécie</th>`;
        tableHTML += `<th>Foto</th>`; // Não ordenável
        tableHTML += `<th class="${getThClass('coordX')}" data-sort-key="coordX">Coord. X</th>`;
        tableHTML += `<th class="${getThClass('coordY')}" data-sort-key="coordY">Coord. Y</th>`;
        tableHTML += `<th class="${getThClass('utmZoneNum')}" data-sort-key="utmZoneNum">Zona UTM</th>`;
        tableHTML += `<th class="${getThClass('dap')}" data-sort-key="dap">DAP (cm)</th>`;
        tableHTML += `<th class="${getThClass('local')}" data-sort-key="local">Local</th>`;
        tableHTML += `<th class="${getThClass('avaliador')}" data-sort-key="avaliador">Avaliador</th>`;
        tableHTML += `<th class="${getThClass('pontuacao')}" data-sort-key="pontuacao">Pontos</th>`;
        tableHTML += `<th class="${getThClass('risco')}" data-sort-key="risco">Risco</th>`;
        tableHTML += `<th>Observações</th>`; // Não ordenável
        tableHTML += `<th class="col-zoom">Zoom</th>`;
        tableHTML += `<th class="col-edit">Editar</th>`;
        tableHTML += `<th class="col-delete">Excluir</th>`;
        tableHTML += '</tr></thead><tbody>';
        
        // (NOVO v18.0) Ordena os dados ANTES de renderizar
        const sortedData = [...registeredTrees].sort((a, b) => {
            const valA = getSortValue(a, sortState.key);
            const valB = getSortValue(b, sortState.key);

            if (valA < valB) {
                return sortState.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortState.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        sortedData.forEach(tree => {
            const [y, m, d] = (tree.data || '---').split('-');
            const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
            
            // (NOVO v18.1) Cria o botão de foto se 'hasPhoto' for true
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

    // ==========================================================
    // (NOVO v17.5) LÓGICA DO MAPA GIS (CONVERSÃO PRECISA E FALLBACK)
    // ==========================================================
    
    /** (NOVO v17.5) Lê a zona UTM padrão do input manual */
    function getManualDefaultZone() {
        const zoneInput = document.getElementById('default-utm-zone');
        if (zoneInput && zoneInput.value) {
            const match = zoneInput.value.trim().match(/^(\d+)([A-Z])$/i); // Ex: "23K"
            if (match) {
                return { num: parseInt(match[1], 10), letter: match[2].toUpperCase() };
            }
        }
        // Se falhar, tenta usar a última zona capturada pelo GPS
        if (lastUtmZone.num > 0) {
            return lastUtmZone;
        }
        return { num: 0, letter: 'Z' }; // Falha
    }
    
    /**
     * (v17.5) Converte Coordenadas para Lat/Lon [Latitude, Longitude]
     */
    function convertToLatLon(tree) {
        // Verifica se a biblioteca Proj4js está disponível
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
        // Cenário 2: O dado é antigo (v16.0) ou importado sem zona. Usa o input manual.
        else {
            const defaultZone = getManualDefaultZone(); // Pega do input
            zNum = defaultZone.num;
            zLetter = defaultZone.letter;
        }

        // Tenta a conversão UTM Precisa (Assume que Coords > 1000 são UTM)
        if (!isNaN(lon) && !isNaN(lat) && !isNaN(zNum) && zNum > 0 && zLetter !== 'Z' && zLetter !== '' && lon > 1000 && lat > 1000) {
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
     * (v17.4) Inicializa o mapa Leaflet e renderiza os pontos.
     */
    function initMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return; 
        
        if (typeof L === 'undefined' || typeof proj4 === 'undefined') {
            mapContainer.innerHTML = '<p style="color:red; font-weight:bold;">ERRO DE MAPA: As bibliotecas Leaflet e Proj4js não foram carregadas. Adicione-as ao index.html.</p>';
            return;
        }

        if (mapInstance !== null) {
            mapInstance.remove();
            mapInstance = null;
        }
        
        // 1. Filtra e Converte árvores
        let boundsArray = [];
        let treesToRender = registeredTrees.map(tree => {
            const coords = convertToLatLon(tree); // Passa o objeto 'tree' inteiro
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
        
        // 2. Inicializa o mapa
        mapInstance = L.map('map-container').setView(mapCenter, initialZoom);

        // 3. Camada Base - Imagem de Satélite (ESRI)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }).addTo(mapInstance);

        // 4. Renderiza os marcadores
        renderTreesOnMap(treesToRender);
        
        // 5. (v17.4) Aplica o Zoom (Lupa ou Extent)
        if (zoomTargetCoords) {
            mapInstance.setView(zoomTargetCoords, 18); // Zoom 18 para ponto único
            zoomTargetCoords = null; // Limpa o alvo
        } else if (boundsArray.length > 0) {
            handleZoomToExtent(); // Chama a função de zoom automático
        }
    }

    /**
     * (v18.1) Desenha círculos (marcadores) no mapa com interação de clique duplo e foto.
     */
    function renderTreesOnMap(treesData) {
        if (!mapInstance) return;

        mapInstance.eachLayer(function (layer) {
            if (layer.options && layer.options.isTreeMarker) {
                mapInstance.removeLayer(layer);
            }
        });

        treesData.forEach(tree => {
            const coords = tree.coordsLatLon; 
            let color, radius, riskText;

            if (tree.risco === 'Alto Risco') {
                color = '#C62828'; // Vermelho
                radius = 12; 
                riskText = '🔴 Alto Risco';
            } else if (tree.risco === 'Médio Risco') {
                color = '#E65100'; // Laranja
                radius = 8; 
                riskText = '🟠 Médio Risco';
            } else {
                color = '#2E7D32'; // Verde
                radius = 5; 
                riskText = '🟢 Baixo Risco';
            }

            const circle = L.circle(coords, {
                color: color,
                fillColor: color,
                fillOpacity: 0.6,
                radius: radius, 
                weight: 1,
                isTreeMarker: true
            }).addTo(mapInstance);

            // (ATUALIZADO v18.1) Define o conteúdo base do popup
            const popupContent = `
                <strong>ID: ${tree.id}</strong><br>
                Espécie: ${tree.especie}<br>
                Risco: <span style="color:${color}; font-weight:bold;">${riskText}</span><br>
                Local: ${tree.local}<br>
                Coord. UTM: ${tree.coordX}, ${tree.coordY} (${tree.utmZoneNum || '?'}${tree.utmZoneLetter || '?'})
            `;
            
            circle.bindPopup(popupContent + (tree.hasPhoto ? "<p>Carregando foto...</p>" : ""));

            // (NOVO v18.1) Evento para carregar a foto (apenas se existir)
            if (tree.hasPhoto) {
                circle.on('popupopen', (e) => {
                    getImageFromDB(tree.id, (imageBlob) => {
                        if (imageBlob) {
                            const imgUrl = URL.createObjectURL(imageBlob);
                            const finalContent = popupContent + `<img src="${imgUrl}" alt="Foto ID ${tree.id}" class="manual-img">`;
                            e.popup.setContent(finalContent);
                            // Revoga o URL da memória quando o popup fechar
                            mapInstance.once('popupclose', () => URL.revokeObjectURL(imgUrl));
                        } else {
                            e.popup.setContent(popupContent + '<p style="color:red;">Foto não encontrada.</p>');
                        }
                    });
                });
            }
            
            // (NOVO v18.0) Evento de clique duplo no mapa
            circle.on('dblclick', () => {
                handleMapMarkerClick(tree.id);
            });
        });
    }
    
    /**
     * (NOVO v18.0) Destaque da linha da tabela (chamado pelo Mapa ou Lupa)
     */
    function highlightTableRow(id) {
        // Garante que a tabela de resumo esteja visível
        const summaryTab = document.querySelector('.sub-nav-btn[data-target="tab-content-summary"]');
        if (summaryTab && !summaryTab.classList.contains('active')) {
            summaryTab.click();
        }

        // Aguarda a aba mudar (se necessário) antes de procurar a linha
        setTimeout(() => {
            // Remove destaques antigos
            const oldHighlights = document.querySelectorAll('.summary-table tr.highlight');
            oldHighlights.forEach(row => row.classList.remove('highlight'));

            const row = document.querySelector(`.summary-table tr[data-tree-id="${id}"]`);
            if (row) {
                row.classList.add('highlight');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Remove o destaque após 2.5 segundos
                setTimeout(() => {
                    row.classList.remove('highlight');
                }, 2500);
            } else {
                console.warn(`Linha da tabela [data-tree-id="${id}"] não encontrada.`);
            }
        }, 100); // 100ms de delay para a troca de aba
    }
    
    /**
     * (NOVO v18.0) Ação de clique duplo no mapa
     */
    function handleMapMarkerClick(id) {
        highlightTargetId = id; // Armazena o ID para destacar
        const summaryTabButton = document.querySelector('.sub-nav-btn[data-target="tab-content-summary"]');
        if (summaryTabButton) {
            summaryTabButton.click(); // Muda para a aba de resumo
        }
    }


    /**
     * (NOVO v17.3 - Corrigido v17.5) Função para o botão "Aproximar dos Pontos"
     */
    function handleZoomToExtent() {
        if (!mapInstance) {
            showToast("O mapa não está inicializado.", "error");
            return;
        }

        let boundsArray = [];
        registeredTrees.forEach(tree => {
            const coords = convertToLatLon(tree); // Passa o objeto 'tree'
            if (coords) {
                boundsArray.push(coords);
            }
        });

        if (boundsArray.length > 0) {
            mapInstance.fitBounds(boundsArray, { padding: [50, 50], maxZoom: 18 });
        } else {
            showToast("Não há coordenadas válidas. Verifique a Zona UTM Padrão.", "error");
        }
    }

    /** (NOVO v17.4 - Atualizado v18.0) Função para o botão "Lupa" 🔎 */
    function handleZoomToPoint(id) {
        const tree = registeredTrees.find(t => t.id === id);
        if (!tree) {
            showToast("Árvore não encontrada.", "error");
            return;
        }

        const coords = convertToLatLon(tree); // Passa o objeto 'tree'
        
        if (coords) {
            zoomTargetCoords = coords; // Define o alvo de zoom
            highlightTargetId = id; // (v18.0) Define o alvo do highlight
            
            const mapTabButton = document.querySelector('.sub-nav-btn[data-target="tab-content-mapa"]');
            if (mapTabButton) {
                mapTabButton.click();
            }
        } else {
            showToast(`Coordenadas inválidas para a Árvore ID ${id}. Verifique a Zona UTM Padrão.`, "error");
        }
    }
    
    /** (NOVO v18.0) Função para filtrar a tabela de resumo */
    function handleTableFilter() {
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

    /** (NOVO v18.0) Limpa o preview da foto */
    function clearPhotoPreview() {
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
        currentTreePhoto = null; // Limpa a foto temporária
        
        // Limpa o input de arquivo
        const photoInput = document.getElementById('tree-photo-input');
        if (photoInput) {
            photoInput.value = null;
        }
    }
    
    // (NOVO v18.0) Funções de Ordenação da Tabela
    
    /** Retorna o valor correto para ordenação (número ou string) */
    function getSortValue(tree, key) {
        // Converte valores N/A ou vazios para 0 em colunas numéricas
        const numericKeys = ['id', 'dap', 'pontuacao', 'coordX', 'coordY', 'utmZoneNum'];
        if (numericKeys.includes(key)) {
            const value = tree[key];
            return parseFloat(value) || 0;
        }
        
        // Trata strings
        const value = tree[key];
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
        return value || ''; // Default
    }

    /** Atualiza o estado de ordenação e re-renderiza a tabela */
    function handleSort(sortKey) {
        if (sortState.key === sortKey) {
            // Inverte a direção se for a mesma coluna
            sortState.direction = (sortState.direction === 'asc') ? 'desc' : 'asc';
        } else {
            // Define a nova coluna e reseta a direção
            sortState.key = sortKey;
            sortState.direction = 'asc';
        }
        renderSummaryTable();
    }
    
    /** (NOVO v18.1) Mostra a foto (da tabela) no pop-up do glossário */
    function handlePhotoPreviewClick(id, targetElement) {
        getImageFromDB(id, (imageBlob) => {
            if (!imageBlob) {
                showToast("Foto não encontrada no banco de dados.", "error");
                return;
            }
            
            const imgUrl = URL.createObjectURL(imageBlob);
            currentTooltip = createTooltip();
            
            // Adiciona um estilo inline para limitar o tamanho no viewport
            currentTooltip.innerHTML = `<img src="${imgUrl}" alt="Foto ID ${id}" class="manual-img" style="max-width: 80vw; max-height: 70vh;">`;
            
            // Posição e exibição
            positionTooltip(targetElement); // Usa o ícone 📷 como âncora
            currentTooltip.style.opacity = '1';
            currentTooltip.style.visibility = 'visible';
            currentTooltip.dataset.currentElement = `photo-${id}`; // ID único para toggle
        });
    }

    // ==========================================================
    // (ATUALIZADO v19.2) LÓGICA DE IMPORTAÇÃO/EXPORTAÇÃO
    // ==========================================================

    /**
     * (v19.2) Botão Unificado: EXPORTAR DADOS
     * Pergunta ao usuário qual formato ele deseja.
     */
    function handleExportData() {
        const hasPhotos = registeredTrees.some(t => t.hasPhoto);
        
        let choice = 'csv'; // Padrão
        
        if (hasPhotos && typeof JSZip !== 'undefined') {
             // Se temos fotos E o JSZip carregou, oferece a opção
             choice = confirm(
                "Escolha o formato de exportação:\n\n" +
                "Clique 'OK' para 'Pacote .ZIP'\n" +
                "(Backup completo com CSV + Fotos)\n\n" +
                "Clique 'Cancelar' para 'Apenas .CSV'\n" +
                "(Apenas metadados, sem fotos)"
            ) ? 'zip' : 'csv';
        } else if (hasPhotos && typeof JSZip === 'undefined') {
            // Se temos fotos MAS o JSZip falhou, avisa o usuário
            showToast("Biblioteca JSZip não carregada. Exportando apenas .CSV.", 'error');
            console.error("Tentativa de exportar ZIP falhou: JSZip não está definido.");
        }

        // Aciona a função correta
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
    function handleImportData() {
        const choice = confirm(
            "Escolha o formato de importação:\n\n" +
            "Clique 'OK' para 'Pacote .ZIP'\n" +
            "(Backup completo com CSV + Fotos)\n\n" +
            "Clique 'Cancelar' para 'Apenas .CSV'\n" +
            "(Apenas metadados, sem fotos)"
        );
        
        // Aciona o input de arquivo oculto correto
        if (choice) {
            // (v19.2) Verifica se o JSZip está disponível ANTES de abrir o seletor de arquivo
            if (typeof JSZip === 'undefined') {
                 showToast("Erro: Biblioteca JSZip não carregada. Não é possível importar .ZIP.", 'error');
                 console.error("Tentativa de importar ZIP falhou: JSZip não está definido.");
                 return;
            }
            document.getElementById('zip-importer').click();
        } else {
            document.getElementById('csv-importer').click();
        }
    }

    /**
     * (v19.2) Módulo da Calculadora de Risco (Listeners atualizados)
     */
    function setupRiskCalculator() {
        
        // Lógica de Abas (v17.6)
        const subNav = document.querySelector('.sub-nav');
        const subTabPanes = document.querySelectorAll('.sub-tab-content');
        
        function showSubTab(targetId) {
            subTabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetId));
            
            const subNavButtons = document.querySelectorAll('.sub-nav-btn');
            subNavButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-target') === targetId));

            if (targetId === 'tab-content-mapa') {
                setTimeout(() => { initMap(); }, 50); 
            }
            
            if (targetId === 'tab-content-summary' && highlightTargetId) {
                highlightTableRow(highlightTargetId);
                highlightTargetId = null; 
            }
        }
        
        if (subNav) {
            const newNav = subNav.cloneNode(true);
            subNav.parentNode.replaceChild(newNav, subNav);
            
            newNav.addEventListener('click', (e) => {
                const button = e.target.closest('.sub-nav-btn');
                if (button) {
                    e.preventDefault();
                    showSubTab(button.getAttribute('data-target'));
                }
            });
        }
        showSubTab('tab-content-register');

        // --- Restante do setup (v19.2) ---
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

        // (v19.2) Lógica dos Botões Unificados de Import/Export
        if (importDataBtn) importDataBtn.addEventListener('click', handleImportData);
        if (exportDataBtn) exportDataBtn.addEventListener('click', handleExportData);
        if (zipImporter) zipImporter.addEventListener('change', handleImportZip); // (v19.0)
        if (csvImporter) csvImporter.addEventListener('change', handleFileImport); // (v18.0)

        // Listeners restantes
        if (zoomBtn) zoomBtn.addEventListener('click', handleZoomToExtent);
        if (filterInput) filterInput.addEventListener('keyup', handleTableFilter);
        if (sendEmailBtn) sendEmailBtn.addEventListener('click', sendEmailReport);
        if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAll);
        if (getGpsBtn) getGpsBtn.addEventListener('click', handleGetGPS);
        
        // Listeners de Foto
        if (photoInput) {
            photoInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    clearPhotoPreview(); 
                    const preview = document.createElement('img');
                    preview.id = 'photo-preview';
                    preview.src = URL.createObjectURL(file);
                    document.getElementById('photo-preview-container').prepend(preview);
                    document.getElementById('remove-photo-btn').style.display = 'block';
                    currentTreePhoto = file; 
                }
            });
        }
        if (removePhotoBtn) {
            removePhotoBtn.addEventListener('click', clearPhotoPreview);
        }

        if (!form) return;    
        
        if (lastEvaluatorName) {
            document.getElementById('risk-avaliador').value = lastEvaluatorName;
        }
        
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (getGpsBtn && !isTouchDevice) {
            const gpsContainer = getGpsBtn.closest('.gps-button-container');
            if(gpsContainer) gpsContainer.style.display = 'none';
        }
        
        // 1. Lógica de Adicionar Árvore (v18.0)
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
            
            const newTreeId = registeredTrees.length > 0 ? Math.max(...registeredTrees.map(t => t.id)) + 1 : 1;
            
            const newTree = {
                id: newTreeId,
                data: document.getElementById('risk-data').value || new Date().toISOString().split('T')[0],
                especie: document.getElementById('risk-especie').value || 'N/A',
                local: document.getElementById('risk-local').value || 'N/A',
                coordX: document.getElementById('risk-coord-x').value || 'N/A',
                coordY: document.getElementById('risk-coord-y').value || 'N/A',
                utmZoneNum: lastUtmZone.num || 0,
                utmZoneLetter: lastUtmZone.letter || 'Z',
                dap: document.getElementById('risk-dap').value || 'N/A',    
                avaliador: document.getElementById('risk-avaliador').value || 'N/A',
                observacoes: document.getElementById('risk-obs').value || 'N/A',    
                pontuacao: totalScore,
                risco: classificationText,
                riscoClass: classificationClass,
                riskFactors: checkedRiskFactors,
                hasPhoto: (currentTreePhoto !== null) 
            };
            
            if (newTree.hasPhoto) {
                saveImageToDB(newTree.id, currentTreePhoto);
            }

            registeredTrees.push(newTree);
            saveDataToStorage();
            renderSummaryTable(); 
            
            showToast(`✔️ Árvore "${newTree.especie || 'N/A'}" (ID ${newTree.id}) adicionada!`, 'success');

            lastEvaluatorName = document.getElementById('risk-avaliador').value || '';
            form.reset();
            clearPhotoPreview(); 
            
            try {
                document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
                document.getElementById('risk-avaliador').value = lastEvaluatorName;
            } catch(e) { /* ignora erro */ }

            document.getElementById('risk-especie').focus();
            
            if (isTouchDevice) {
                setupMobileChecklist(); 
            }

            const gpsStatus = document.getElementById('gps-status');
            if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
        });
        
        // 2. Lógica do Botão Limpar Campos
        const resetBtn = document.getElementById('reset-risk-form-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();    
                lastEvaluatorName = document.getElementById('risk-avaliador').value || '';
                form.reset();    
                clearPhotoPreview(); 
                    try {
                        document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
                        document.getElementById('risk-avaliador').value = lastEvaluatorName;
                    } catch(e) { /* ignora erro */ }
                
                if (isTouchDevice) {
                    setupMobileChecklist(); 
                }

                const gpsStatus = document.getElementById('gps-status');
                if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.className = ''; }
            });
        }
        
        // 4. Renderiza a tabela ao carregar
        renderSummaryTable(); 
        
        // 5. (v18.1) Event Delegation para Lupa/Editar/Excluir/Ordenar/Foto
        if (summaryContainer) {
            const newSummaryContainer = summaryContainer.cloneNode(true);
            summaryContainer.parentNode.replaceChild(newSummaryContainer, summaryContainer);
            
            newSummaryContainer.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.delete-tree-btn');
                const editButton = e.target.closest('.edit-tree-btn');    
                const zoomButton = e.target.closest('.zoom-tree-btn'); 
                const sortButton = e.target.closest('th.sortable'); 
                const photoButton = e.target.closest('.photo-preview-btn'); 
        
                if (deleteButton) {
                    handleDeleteTree(parseInt(deleteButton.dataset.id, 10));
                }
                
                if (editButton) {    
                    handleEditTree(parseInt(editButton.dataset.id, 10));
                    showSubTab('tab-content-register'); 
                }

                if (zoomButton) { 
                    handleZoomToPoint(parseInt(zoomButton.dataset.id, 10));
                }
                
                if (sortButton) { 
                    handleSort(sortButton.dataset.sortKey);
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

    } // Fim de setupRiskCalculator()

    // --- Funções de Tooltip (v18.1) ---
    
    let currentTooltip = null;    
    const termClickEvent = isTouchDevice ? 'touchend' : 'click';
    const popupCloseEvent = isTouchDevice ? 'touchend' : 'click';
    
    function createTooltip() {
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
        return tooltip;
    }

    function hideTooltip() {
        if (currentTooltip) {
            const img = currentTooltip.querySelector('img');
            if (img && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
            currentTooltip.style.opacity = '0';
            currentTooltip.style.visibility = 'hidden';
            delete currentTooltip.dataset.currentElement;
        }
    }

    function setupGlossaryInteractions() {
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
        currentTooltip = createTooltip();    
        currentTooltip.innerHTML = `<strong>${termElement.textContent}</strong>: ${definition}`;
        positionTooltip(termElement);
        currentTooltip.style.opacity = '1';
        currentTooltip.style.visibility = 'visible';
        currentTooltip.dataset.currentElement = termElement.textContent;
    }

    function toggleGlossaryTooltip(event) {
        event.preventDefault(); event.stopPropagation();
        const tooltip = document.getElementById('glossary-tooltip');
        const isPhoto = tooltip.dataset.currentElement && tooltip.dataset.currentElement.startsWith('photo-');
        
        if (tooltip && tooltip.style.visibility === 'visible' && !isPhoto && 
            tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else { 
            showGlossaryTooltip(event); 
        }
    }

    function setupEquipmentInteractions() {
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
        currentTooltip = createTooltip();
        currentTooltip.innerHTML = `<strong>${termElement.textContent}</strong><p>${data.desc}</p>${imgTag(data.img, termElement.textContent)}`;
        positionTooltip(termElement);
        currentTooltip.style.opacity = '1';
        currentTooltip.style.visibility = 'visible';
        currentTooltip.dataset.currentElement = termElement.textContent;
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

    function setupPurposeInteractions() {
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
        currentTooltip = createTooltip();
        currentTooltip.innerHTML = `<strong>${termElement.textContent}</strong><p>${data.desc}</p>${imgTag(data.img, termElement.textContent)}`;
        positionTooltip(termElement);
        currentTooltip.style.opacity = '1';
        currentTooltip.style.visibility = 'visible';
        currentTooltip.dataset.currentElement = termElement.textContent;
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

    function positionTooltip(termElement) {
        const rect = termElement.getBoundingClientRect();
        const scrollY = window.scrollY, scrollX = window.scrollX;
        requestAnimationFrame(() => {
            if (!currentTooltip) return;
            const tooltipWidth = currentTooltip.offsetWidth, tooltipHeight = currentTooltip.offsetHeight;
            let topPos;
            if (rect.top > tooltipHeight + 10) { topPos = rect.top + scrollY - tooltipHeight - 10; }
            else { topPos = rect.bottom + scrollY + 10; }
            let leftPos = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
            if (leftPos < scrollX + 10) leftPos = scrollX + 10;
            if (leftPos + tooltipWidth > window.innerWidth + scrollX - 10) { leftPos = window.innerWidth + scrollX - tooltipWidth - 10; }
            currentTooltip.style.top = `${topPos}px`;
            currentTooltip.style.left = `${leftPos}px`;
        });
    }
    
    // (v18.0) Gera dados CSV
    function getCSVData() {
        if (registeredTrees.length === 0) return null;
        const headers = ["ID", "Data Coleta", "Especie", "Coord X (UTM)", "Coord Y (UTM)", "Zona UTM Num", "Zona UTM Letter", "DAP (cm)", "Local", "Avaliador", "Pontuacao", "Classificacao de Risco", "Observacoes", "RiskFactors", "HasPhoto"];
        let csvContent = "\uFEFF" + headers.join(";") + "\n";
        registeredTrees.forEach(tree => {
            const cleanEspecie = (tree.especie || '').replace(/[\n;]/g, ','), cleanLocal = (tree.local || '').replace(/[\n;]/g, ','), cleanAvaliador = (tree.avaliador || '').replace(/[\n;]/g, ','), cleanObservacoes = (tree.observacoes || '').replace(/[\n;]/g, ',');
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

    // (v19.0) Exporta APENAS o CSV
    function exportCSV() {
        const csvContent = getCSVData();
        if (!csvContent) { showToast("Nenhuma árvore cadastrada para exportar.", 'error'); return; }
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
    }

    function generateEmailSummaryText() {
        if (registeredTrees.length === 0) return "Nenhuma árvore foi cadastrada na tabela de resumo.";
        let textBody = "Segue o relatório resumido das árvores avaliadas:\n\n";
        textBody += "ID\t|\tData\t\t|\tEspécie (Nome/Tag)\t|\tLocal\t\t|\tClassificação de Risco\t|\tObservações\n";
        textBody += "----------------------------------------------------------------------------------------------------------------------------------------------------------\n";
        registeredTrees.forEach(tree => {
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

    function sendEmailReport() {
        const targetEmail = "";
        const subject = "Relatório de Avaliação de Risco Arbóreo";
        const emailBody = generateEmailSummaryText();
        const encodedSubject = encodeURIComponent(subject), encodedBody = encodeURIComponent(emailBody);
        const mailtoLink = `mailto:${targetEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        if (mailtoLink.length > 2000) { showToast("Muitos dados para e-mail. Use 'Exportar Dados'.", 'error'); return; }
        window.location.href = mailtoLink;
    }
    
    // (v19.0) Importa APENAS o CSV
    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            if (lines.length <= 1) { showToast("Erro: O ficheiro CSV está vazio ou é inválido.", 'error'); return; }
            
            // (v19.2) A lógica de 'append' agora é tratada pelo 'handleImportData'
            // Assumimos que o usuário já foi perguntado.
            const append = confirm("Deseja ADICIONAR os dados à lista atual? \n\nClique em 'Cancelar' para SUBSTITUIR a lista atual pelos dados do ficheiro.");
            let newTrees = append ? [...registeredTrees] : [];
            let maxId = newTrees.length > 0 ? Math.max(...newTrees.map(t => t.id)) : 0;
            
            try {
                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(';');
                    
                    let treeData;
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

                    treeData = {
                        id: ++maxId, 
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
                        hasPhoto: hasPhoto // No CSV, 'hasPhoto' é importado, mas o arquivo da foto não.
                    };
                    newTrees.push(treeData);
                }
                registeredTrees = newTrees;
                saveDataToStorage();
                renderSummaryTable();
                showToast(`📤 Importação de CSV concluída! ${newTrees.length} registos carregados.`, 'success'); 
            } catch (error) {
                console.error("Erro ao processar o ficheiro CSV:", error);
                showToast("Erro ao processar o ficheiro.", 'error'); 
            } finally { event.target.value = null; }
        };
        reader.onerror = () => { showToast("Erro ao ler o ficheiro.", 'error'); event.target.value = null; };
        reader.readAsText(file);
    }

    // === (NOVO v19.0) FUNÇÕES DE BACKUP .ZIP ===

    /**
     * (v19.0) Helper: Busca TODOS os pares de {id, imageBlob} do IndexedDB.
     */
    function getAllImagesFromDB() {
        return new Promise((resolve, reject) => {
            if (!db) {
                console.error("IndexedDB não está pronto.");
                return reject(new Error("IndexedDB não está pronto."));
            }
            
            const transaction = db.transaction(["treeImages"], "readonly");
            const objectStore = transaction.objectStore("treeImages");
            const request = objectStore.getAll(); 

            request.onsuccess = (event) => {
                resolve(event.target.result); 
            };
            request.onerror = (event) => {
                console.error("Erro ao buscar todas as imagens:", event);
                reject(event.target.error);
            };
        });
    }

    /**
     * (v19.0) Manipulador de EXPORTAÇÃO de Pacote .ZIP
     */
    async function handleExportZip() {
        // (v19.3) Verificação robusta do JSZip
        if (typeof JSZip === 'undefined') {
            showToast("Erro: Biblioteca JSZip não carregada. Verifique o console (F12).", 'error');
            console.error("Falha na exportação: JSZip não está definido. Verifique se o arquivo 'libs/jszip.min.js' foi carregado corretamente no index.html.");
            return;
        }
        if (registeredTrees.length === 0) {
            showToast("Nenhum dado para exportar.", 'error');
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

            // 1. Adiciona o manifesto CSV (os metadados)
            const csvContent = getCSVData();
            if (csvContent) {
                zip.file("manifesto_dados.csv", csvContent.replace(/^\uFEFF/, ''), {
                    encoding: "UTF-8"
                });
            }

            // 2. Adiciona a pasta de imagens
            zipStatusText.textContent = 'Coletando imagens do banco de dados...';
            const images = await getAllImagesFromDB();
            
            if (images.length > 0) {
                const imgFolder = zip.folder("images");
                
                images.forEach(imgData => {
                    const extension = (imgData.imageBlob.type.split('/')[1] || 'jpg').split('+')[0];
                    const filename = `tree_id_${imgData.id}.${extension}`;
                    imgFolder.file(filename, imgData.imageBlob, { binary: true });
                });
            }

            // 3. Gera o arquivo .zip e inicia o download
            zipStatusText.textContent = 'Compactando arquivos... (pode levar um momento)';
            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 6 
                }
            });

            const d = String(new Date().getDate()).padStart(2, '0');
            const m = String(new Date().getMonth() + 1).padStart(2, '0');
            const y = new Date().getFullYear();
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
            
            showToast('📦 Pacote .zip exportado com sucesso!', 'success');

        } catch (error) {
            console.error("Erro ao gerar o .zip:", error);
            showToast("Erro ao gerar o pacote .zip.", 'error');
        } finally {
            if (zipStatus) zipStatus.style.display = 'none';
        }
    }

    /**
     * (v19.0) Manipulador de IMPORTAÇÃO de Pacote .ZIP
     */
    async function handleImportZip(event) {
        if (typeof JSZip === 'undefined') {
            showToast("Erro: Biblioteca JSZip não carregada. Verifique o console (F12).", 'error');
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

            // (v19.2) A lógica de 'append' agora é tratada pelo 'handleImportData'
            const append = confirm("Deseja ADICIONAR os dados do .zip à lista atual? \n\nClique em 'Cancelar' para SUBSTITUIR a lista atual.");
            
            zipStatusText.textContent = 'Processando manifesto de dados...';
            
            let newTrees = append ? [...registeredTrees] : [];
            let maxId = newTrees.length > 0 ? Math.max(...newTrees.map(t => t.id)) : 0;
            let imageSavePromises = []; 

            // Limpa o DB de imagens se for substituir
            if (!append) {
                const transaction = db.transaction(["treeImages"], "readwrite");
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
                                saveImageToDB(newId, blob);
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
            registeredTrees = newTrees;
            saveDataToStorage();
            renderSummaryTable();
            
            showToast(`📤 Importação do .zip concluída! ${newTrees.length} registros carregados.`, 'success');

        } catch (error) {
            console.error("Erro ao importar o .zip:", error);
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            if (zipStatus) zipStatus.style.display = 'none';
            event.target.value = null; // Limpa o input de arquivo
        }
    }

    /**
     * Manipulador do Chat (Esqueleto)
     */
    async function handleChatSend() {
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
            const response = await fetch(PONTESEGURA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: userQuery }) });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            const data = await response.json();
            chatResponseBox.innerHTML = `<p class="chat-response-text">${data.response}</p>`;
        } catch (error) {
            console.error('Erro na API Gemini:', error);
            chatResponseBox.innerHTML = `<p class="chat-response-text" style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
        }
    }


    // ==========================================================
    // PONTO DE ENTRADA / EXECUÇÃO DO SCRIPT
    // ==========================================================

    const detailView = document.getElementById('detalhe-view');
    const activeTopicButtons = document.querySelectorAll('.topico-btn');

    /**
     * Carrega o conteúdo principal na <section>
     */
    function loadContent(targetKey) {
        if (!detailView) return;    
        
        const content = manualContent[targetKey];

        if (content) {
            detailView.innerHTML = `<h3>${content.titulo}</h3>${content.html}`;
            
            setupGlossaryInteractions();    
            setupEquipmentInteractions();
            setupPurposeInteractions();
            
            if (targetKey === 'calculadora-risco') {
                setupRiskCalculator();    
            }
        } else {
            detailView.innerHTML = `<h3 class="placeholder-titulo">Tópico Não Encontrado</h3>`;
        }
    }

    /**
     * Manipulador de clique para os botões de tópico
     */
    function handleTopicClick(button) {
        hideTooltip();    
        const target = button.getAttribute('data-target');
        try { localStorage.setItem(ACTIVE_TAB_KEY, target); }
        catch (e) { console.error("Erro ao salvar a aba ativa:", e); }
        activeTopicButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadContent(target);
    }

    // --- 1. Inicialização da Navegação (Carregamento da Página) ---
    initImageDB(); // (NOVO v18.0) Inicializa o banco de dados de imagens
    loadDataFromStorage();

    if (activeTopicButtons.length > 0) {
        activeTopicButtons.forEach(button => {
            button.addEventListener('click', () => handleTopicClick(button));
        });

        let lastActiveTab = null;
        try { lastActiveTab = localStorage.getItem(ACTIVE_TAB_KEY); }
        catch (e) { console.error("Erro ao ler a aba ativa:", e); }

        let loadedFromStorage = false;
        if (lastActiveTab && manualContent[lastActiveTab]) {
            loadContent(lastActiveTab);
            activeTopicButtons.forEach(btn => btn.classList.remove('active'));
            const activeButton = document.querySelector(`.topico-btn[data-target="${lastActiveTab}"]`);
            if (activeButton) activeButton.classList.add('active');
            loadedFromStorage = true;
        }

        if (!loadedFromStorage) {
            const firstActiveButton = document.querySelector('.topico-btn.active');
            if (firstActiveButton) { loadContent(firstActiveButton.getAttribute('data-target')); }
            else { loadContent(activeTopicButtons[0].getAttribute('data-target')); activeTopicButtons[0].classList.add('active'); }
        }
    } else {
        console.error('Site Builder Error: Nenhum botão .topico-btn foi encontrado no HTML.');
    }

    // --- 2. Inicialização do Botão "Voltar ao Topo" ---
    const backToTopButton = document.getElementById('back-to-top-btn');
    const headerElement = document.getElementById('page-top');    
    if (backToTopButton && headerElement) {
        const observerCallback = (entries) => {
            const [entry] = entries;    
            if (!entry.isIntersecting) { backToTopButton.classList.add('show'); }
            else { backToTopButton.classList.remove('show'); }
        };
        const headerObserver = new IntersectionObserver(observerCallback, { root: null, threshold: 0 });
        headerObserver.observe(headerElement);
    }

    // --- 3. Inicialização do Formulário de Contato ---
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

    // --- 4. Inicialização do Chat (Esqueleto) ---
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', handleChatSend);
        chatInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') { handleChatSend(); }
        });
    }

}); // Fim do DOMContentLoaded
