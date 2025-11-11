// script.js (v14.3 - Média de 5 Leituras de GPS)

// === 0. ARMAZENAMENTO DE ESTADO ===
let registeredTrees = [];

// (v13.9) Chave para o localStorage da tabela
const STORAGE_KEY = 'manualPodaData';
// (v14.0) Chave para a última aba ativa
const ACTIVE_TAB_KEY = 'manualPodaActiveTab'; 

// === 1. DEFINIÇÃO DE DADOS (GLOSSÁRIO, CONTEÚDO) ===

// Função utilitária para gerar a tag de imagem
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

// Dados do Glossário (COMPLETO)
const glossaryTerms = {
    // 1.1 Termos Estruturais e Anatômicos
    'colar do galho': 'Zona especializada na base do galho, responsável pela compartimentalização de ferimentos.',
    'crista da casca': 'Elevação cortical paralela ao ângulo de inserção do galho, indicadora da zona de união.',
    'lenho de cicatrização': 'Tecido formado para selar ferimentos, também conhecido como callus.',
    'casca inclusa': 'Tecido cortical aprisionado em uniões de ângulo agudo.',
    'lenho de reação': 'Madeira com propriedades alteradas por resposta a tensões.',
    'gemas epicórmicas': 'Brotos dormentes no tronco ou galhos principais.',
    'entreno': 'Espaço entre dois nós consecutivos no ramo.',
    'no': 'Ponto de inserção de folhas, gemas ou ramos.',
    'lenho': 'Tecido vegetal com função de sustentação e condução de seiva.',
    
    // 1.2 Instrumentos e Equipamentos (para o glossário)
    'podao': 'Tesoura de poda de haste longa para alcance elevado.',
    'tesourao-poda': 'Ferramenta para galhos de até 7 cm de diâmetro.',
    'serra-poda': 'Serra com dentes especiais para madeira verde.',
    'motosserra-glossario': 'Equipamento motorizado para corte de galhos e troncos.',
    'motopoda-glossario': 'Ferramenta motorizada com haste para galhos altos.',
    'podador-bypass-glossario': 'Lâmina deslizante que realiza cortes limpos.',
    'podador-bigorna': 'Lâmina que pressiona o galho contra superfície plana.',
    'hipsometro': 'Instrumento para medir altura de árvores.',

    // 1.3 Técnicas de Poda
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

// Dados dos Equipamentos (COMPLETO)
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

// Dados das Finalidades de Poda (COMPLETO)
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


// === 2. DADOS DO MANUAL (CONTEÚDO COMPLETO v13.7) ===
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

    // ==========================================================
    // NOVA SEÇÃO (v13.6/v13.7)
    // ==========================================================
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
                            <a href="https://www.linkedin.com/in/rafael-ammon-68601633/" target="_blank">LinkedIn</a>
                        </p>
                    </div>
                </div>
            </div>
        `
    },
    // ==========================================================
    // FIM DA NOVA SEÇÃO
    // ==========================================================

    // (v12.8) CONTEÚDO DA CALCULADORA DE RISCO (COM GPS)
    'calculadora-risco': {
        titulo: '📊 Calculadora de Risco Arbóreo',
        html: `
            <p>Preencha os dados da árvore e marque "Sim" para todos os fatores de risco observados. Clique em "Adicionar Árvore" para salvá-la na tabela de resumo e limpar o formulário para a próxima avaliação.</p>
            
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
                            <label for="risk-coord-x">Coord. X (UTM):</label>
                            <input type="text" id="risk-coord-x" name="risk-coord-x">
                        </div>
                        <div>
                            <label for="risk-coord-y">Coord. Y (UTM):</label>
                            <input type="text" id="risk-coord-y" name="risk-coord-y">
                        </div>
                         <div class="gps-button-container">
                            <button type="button" id="get-gps-btn">🛰️ Capturar GPS</button>
                            <span id="gps-status"></span>
                        </div>
                        <div>
                            <label for="risk-dap">DAP (cm):</label>
                            <input type="number" id="risk-dap" name="risk-dap" min="0">
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
                </fieldset>
                
                <fieldset class="risk-fieldset">
                    <legend>2. Lista de Verificação de Risco</legend>
                    <table class="risk-table">
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Pergunta</th>
                                <th>Peso</th>
                                <th>Sim</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Há galhos mortos com diâmetro superior a 5 cm?</td>
                                <td>3</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="3"></td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Existem rachaduras ou fendas no tronco ou galhos principais?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Há sinais de apodrecimento (madeira esponjosa, fungos, cavidades)?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>A árvore possui uniões em “V” com casca inclusa?</td>
                                <td>4</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="4"></td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Há galhos cruzados ou friccionando entre si?</td>
                                <td>2</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="2"></td>
                            </tr>
                            <tr>
                                <td>6</td>
                                <td>A árvore apresenta copa assimétrica (>30% de desequilíbrio)?</td>
                                <td>2</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="2"></td>
                            </tr>
                            <tr>
                                <td>7</td>
                                <td>Há sinais de inclinação anormal ou recente?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                            <tr>
                                <td>8</td>
                                <td>A árvore está próxima a vias públicas ou áreas de circulação?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                            <tr>
                                <td>9</td>
                                <td>Há risco de queda sobre edificações, veículos ou pessoas?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                            <tr>
                                <td>10</td>
                                <td>A árvore interfere em redes elétricas ou estruturas urbanas?</td>
                                <td>4</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="4"></td>
                            </tr>
                            <tr>
                                <td>11</td>
                                <td>A espécie é conhecida por apresentar alta taxa de falhas?</td>
                                <td>3</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="3"></td>
                            </tr>
                            <tr>
                                <td>12</td>
                                <td>A árvore já sofreu podas drásticas ou brotação epicórmica intensa?</td>
                                <td>3</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="3"></td>
                            </tr>
                            <tr>
                                <td>13</td>
                                <td>Há calçadas rachadas ou tubulações expostas próximas à base?</td>
                                <td>3</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="3"></td>
                            </tr>
                            <tr>
                                <td>14</td>
                                <td>Há perda visível de raízes de sustentação (>40%)?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                            <tr>
                                <td>15</td>
                                <td>Há sinais de compactação ou asfixia radicular?</td>
                                <td>3</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="3"></td>
                            </tr>
                            <tr>
                                <td>16</td>
                                <td>Há apodrecimento em raízes primárias (>3 cm)?</td>
                                <td>5</td>
                                <td><input type="checkbox" class="risk-checkbox" data-weight="5"></td>
                            </tr>
                        </tbody>
                    </table>
                </fieldset>
                
                <div class="risk-buttons-area">
                    <button type="submit" id="add-tree-btn">➕ Adicionar Árvore</button>
                    <button type="button" id="reset-risk-form-btn">Limpar Campos</button>
                </div>
            </form>
            
            <fieldset class="risk-fieldset">
                <legend>3. Árvores Cadastradas</legend>
                <div id="summary-table-container">
                    <p id="summary-placeholder">Nenhuma árvore cadastrada ainda.</p>
                    </div>
                
                <div id="export-btn-group" class="risk-buttons-area" style="display: none;">
                    <button type="button" id="export-csv-btn" class="export-btn">📥 Exportar CSV</button>
                    <button type="button" id="send-email-btn" class="export-btn">📧 Enviar por Email</button>
                </div>
            </fieldset>
        `
    }
};


// === 3. LÓGICA DE INICIALIZAÇÃO ===

document.addEventListener('DOMContentLoaded', () => {

    // --- (NOVO v13.9) FUNÇÕES DE ARMAZENAMENTO ---
    function saveDataToStorage() {
        try {
            // Converte a lista de árvores em texto JSON e salva
            localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredTrees));
        } catch (e) {
            console.error("Erro ao salvar no localStorage:", e);
            // Opcional: alertar o usuário que o armazenamento falhou
        }
    }

    function loadDataFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            // Se houver dados, converte-os de volta para um array
            if (data) {
                registeredTrees = JSON.parse(data);
            }
        } catch (e) {
            console.error("Erro ao ler do localStorage:", e);
        }
    }

    // --- (NOVO v13.9) CARREGA OS DADOS IMEDIATAMENTE ---
    loadDataFromStorage();
    
    // --- O resto do seu script começa aqui ---
    // Detecção de dispositivo de toque
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const termClickEvent = isTouchDevice ? 'touchend' : 'click';
    const popupCloseEvent = isTouchDevice ? 'touchend' : 'click';


    // --- MÓDULO DE NAVEGAÇÃO ---
    const detailView = document.getElementById('detalhe-view');
    const activeTopicButtons = document.querySelectorAll('.topico-btn');
    
    function loadContent(targetKey) {
        if (!detailView) return; 
        
        const content = manualContent[targetKey];
        if (content) {
            detailView.innerHTML = `<h3>${content.titulo}</h3>${content.html}`;
            // Re-vincular os eventos
            setupGlossaryInteractions(); 
            setupEquipmentInteractions();
            setupPurposeInteractions();

            // (v12.0) Ativa a calculadora
            if (targetKey === 'calculadora-risco') {
                setupRiskCalculator(); 
            }

        } else {
            detailView.innerHTML = `<h3 class="placeholder-titulo">Tópico Não Encontrado</h3>`;
        }
    }

    // (MODIFICADO v14.0) Salva a aba ativa no clique
    function handleTopicClick(button) {
        hideTooltip(); 
        const target = button.getAttribute('data-target');
        
        // --- (NOVO v14.0) SALVA A ÚLTIMA ABA ATIVA ---
        try {
            localStorage.setItem(ACTIVE_TAB_KEY, target);
        } catch (e) {
            console.error("Erro ao salvar a aba ativa:", e);
        }
        // --- FIM DA ADIÇÃO ---

        activeTopicButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadContent(target);
    }

    // (MODIFICADO v14.0) --- Inicialização da Navegação ---
    if (activeTopicButtons.length > 0) {
        // 1. Adiciona os listeners de clique
        activeTopicButtons.forEach(button => {
            button.addEventListener('click', () => handleTopicClick(button));
        });

        // 2. Tenta carregar a última aba salva
        let lastActiveTab = null;
        try {
            lastActiveTab = localStorage.getItem(ACTIVE_TAB_KEY);
        } catch (e) {
            console.error("Erro ao ler a aba ativa:", e);
        }

        let loadedFromStorage = false;
        if (lastActiveTab && manualContent[lastActiveTab]) {
            // Se encontrou uma aba válida, carrega ela
            loadContent(lastActiveTab);
            // Remove a classe 'active' do botão padrão (definido no HTML)
            activeTopicButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe 'active' ao botão correto
            const activeButton = document.querySelector(`.topico-btn[data-target="${lastActiveTab}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
            loadedFromStorage = true;
        }

        // 3. Se não carregou do storage, usa a lógica padrão
        if (!loadedFromStorage) {
            const firstActiveButton = document.querySelector('.topico-btn.active');
            if (firstActiveButton) {
                // Carrega o que estiver marcado como 'active' no HTML (default)
                loadContent(firstActiveButton.getAttribute('data-target'));
            } else {
                // Se nada estiver marcado, carrega o primeiro da lista
                loadContent(activeTopicButtons[0].getAttribute('data-target'));
                activeTopicButtons[0].classList.add('active');
            }
        }
        
    } else {
        console.error('Site Builder Error: Nenhum botão .topico-btn foi encontrado no HTML.');
    }

    // --- (v14.2) LÓGICA DO BOTÃO VOLTAR AO TOPO (IntersectionObserver) ---
    
    const backToTopButton = document.getElementById('back-to-top-btn');
    // O nosso "alvo" para observar é o header (que tem o ID 'page-top')
    const headerElement = document.getElementById('page-top'); 

    if (backToTopButton && headerElement) {
        
        // 1. A função que é chamada quando o header entra ou sai do ecrã
        const observerCallback = (entries) => {
            const [entry] = entries; // Pegamos a primeira (e única) entrada
            
            // 'isIntersecting' é true se o header estiver visível
            if (!entry.isIntersecting) {
                // Se o header NÃO está visível (o utilizador rolou para baixo)
                backToTopButton.classList.add('show');
            } else {
                // Se o header ESTÁ visível (o utilizador está no topo)
                backToTopButton.classList.remove('show');
            }
        };

        // 2. As opções para o observador
        const observerOptions = {
            root: null, // Observa em relação ao viewport principal
            threshold: 0 // Dispara assim que o elemento sai (0% visível)
        };

        // 3. Cria e inicia o observador
        const headerObserver = new IntersectionObserver(observerCallback, observerOptions);
        headerObserver.observe(headerElement);

        // O clique continua a ser tratado pelo <a href="#page-top"> e pelo CSS 'scroll-behavior: smooth'.
    }
    // --- FIM DA ADIÇÃO v14.2 ---


    // --- MÓDULO DE TOOLTIP ---
    let currentTooltip = null; 

    function createTooltip() {
        let tooltip = document.getElementById('glossary-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'glossary-tooltip';
            document.body.appendChild(tooltip); 
        }

        if (!tooltip.dataset.clickToCloseAdded) {
            tooltip.addEventListener(popupCloseEvent, (e) => {
                e.stopPropagation(); 
                hideTooltip();
            });
            tooltip.dataset.clickToCloseAdded = 'true';
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
        event.preventDefault(); 
        event.stopPropagation();
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showGlossaryTooltip(event);
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
            termElement.addEventListener(termClickEvent, toggleEquipmentTooltip);
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
        event.stopPropagation();
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showEquipmentTooltip(event);
        }
    }

    // -- Lógica de FINALIDADE DA PODA --
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
        event.stopPropagation();
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible' && tooltip.dataset.currentElement === event.currentTarget.textContent) {
            hideTooltip();
        } else {
            showPurposeTooltip(event);
        }
    }


    // Função genérica para posicionar o tooltip
    function positionTooltip(termElement) {
        const rect = termElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        requestAnimationFrame(() => {
            if (!currentTooltip) return;
            const tooltipWidth = currentTooltip.offsetWidth;
            const tooltipHeight = currentTooltip.offsetHeight;
            let topPos;
            if (rect.top > tooltipHeight + 10) { 
                topos = rect.top + scrollY - tooltipHeight - 10;
            } else { 
                topPos = rect.bottom + scrollY + 10;
            }
            let leftPos = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
            if (leftPos < scrollX + 10) leftPos = scrollX + 10; 
            if (leftPos + tooltipWidth > window.innerWidth + scrollX - 10) { 
                leftPos = window.innerWidth + scrollX - tooltipWidth - 10;
            }
            currentTooltip.style.top = `${topPos}px`;
            currentTooltip.style.left = `${leftPos}px`;
        });
    }

    // ==========================================================
    // INÍCIO DA MODIFICAÇÃO (v14.3) - GPS COM MÉDIA
    // ==========================================================

    // (v13.9) --- MÓDULO DA CALCULADORA DE RISCO ---
    function setupRiskCalculator() {
        const form = document.getElementById('risk-calculator-form');
        const summaryContainer = document.getElementById('summary-table-container');
        const exportBtnGroup = document.getElementById('export-btn-group');
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const sendEmailBtn = document.getElementById('send-email-btn');
        const getGpsBtn = document.getElementById('get-gps-btn'); 

        if (!form) return; 

        // Oculta o botão de GPS em desktops
        if (getGpsBtn && !isTouchDevice) {
            const gpsContainer = getGpsBtn.closest('.gps-button-container');
            if(gpsContainer) gpsContainer.style.display = 'none';
        }
        
        // Adiciona listener ao botão GPS
        if (getGpsBtn) {
            getGpsBtn.addEventListener('click', handleGetGPS);
        }

        // 1. Lógica de Adicionar Árvore
        form.addEventListener('submit', (event) => {
            event.preventDefault(); 
            let totalScore = 0;
            const checkboxes = form.querySelectorAll('.risk-checkbox:checked');
            
            checkboxes.forEach(cb => {
                totalScore += parseInt(cb.dataset.weight, 10);
            });

            // Define a classificação
            let classificationText = 'Baixo Risco';
            let classificationClass = 'risk-col-low';
            if (totalScore >= 20) {
                classificationText = 'Alto Risco';
                classificationClass = 'risk-col-high';
            } else if (totalScore >= 10) {
                classificationText = 'Médio Risco';
                classificationClass = 'risk-col-medium';
            }

            const newTree = {
                id: registeredTrees.length + 1,
                data: document.getElementById('risk-data').value || new Date().toISOString().split('T')[0],
                especie: document.getElementById('risk-especie').value || 'N/A',
                local: document.getElementById('risk-local').value || 'N/A',
                coordX: document.getElementById('risk-coord-x').value || 'N/A',
                coordY: document.getElementById('risk-coord-y').value || 'N/A',
                dap: document.getElementById('risk-dap').value || 'N/A',
                avaliador: document.getElementById('risk-avaliador').value || 'N/A',
                observacoes: document.getElementById('risk-obs').value || 'N/A', 
                pontuacao: totalScore,
                risco: classificationText,
                riscoClass: classificationClass
            };

            registeredTrees.push(newTree);
            
            // --- (NOVO v13.9) SALVA OS DADOS ---
            saveDataToStorage();
            
            renderSummaryTable();
            form.reset();
            try {
                document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
            } catch(e) { /* ignora erro */ }
            document.getElementById('risk-especie').focus();
            
            // Limpa o status do GPS
            const gpsStatus = document.getElementById('gps-status');
            if (gpsStatus) {
                gpsStatus.textContent = '';
                gpsStatus.className = '';
            }
        });
        
        // 2. Lógica do Botão Limpar (v12.6 CORRIGIDO)
        const resetBtn = document.getElementById('reset-risk-form-btn');
        if (resetBtn) { // Adicionada verificação de segurança
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                form.reset(); 
                 try {
                    document.getElementById('risk-data').value = new Date().toISOString().split('T')[0];
                } catch(e) { /* ignora erro */ }
                // Limpa o status do GPS
                const gpsStatus = document.getElementById('gps-status');
                if (gpsStatus) {
                    gpsStatus.textContent = '';
                    gpsStatus.className = '';
                }
            });
        }

        // 3. Lógica dos Botões de Exportação
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
        if (sendEmailBtn) sendEmailBtn.addEventListener('click', sendEmailReport);
        
        // 4. Renderiza a tabela ao carregar (importante para o localStorage)
        renderSummaryTable();
        
        // 5. (v12.6) Event Listener para Excluir
        if (summaryContainer) {
            summaryContainer.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.delete-tree-btn');
                if (deleteButton) {
                    const treeId = parseInt(deleteButton.dataset.id, 10);
                    handleDeleteTree(treeId);
                }
            });
        }
    }
    
    /**
     * (v13.7) Converte Lat/Lon (WGS84) para coordenadas UTM.
     * Esta função substitui a biblioteca externa utm-latlon.min.js
     * @param {number} lat Latitude
     * @param {number} lon Longitude
     * @returns {object} {easting, northing, zoneNum, zoneLetter}
     */
    function convertLatLonToUtm(lat, lon) {
        const f = 1 / 298.257223563; // WGS 84
        const a = 6378137.0; // WGS 84
        const k0 = 0.9996;
        const e = Math.sqrt(f * (2 - f));
        const e2 = e * e;
        const e4 = e2 * e2;
        const e6 = e4 * e2;
        const e_2 = e2 / (1.0 - e2);

        const latRad = lat * (Math.PI / 180.0);
        const lonRad = lon * (Math.PI / 180.0);

        // --- Calcula Zona UTM ---
        let zoneNum = Math.floor((lon + 180.0) / 6.0) + 1;
        // Exceções para Noruega e Svalbard (mantidas da lógica da biblioteca)
        if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) zoneNum = 32;
        if (lat >= 72.0 && lat < 84.0) {
            if (lon >= 0.0 && lon < 9.0) zoneNum = 31;
            else if (lon >= 9.0 && lon < 21.0) zoneNum = 33;
            else if (lon >= 21.0 && lon < 33.0) zoneNum = 35;
            else if (lon >= 33.0 && lon < 42.0) zoneNum = 37;
        }
        
        const lonOrigin = (zoneNum - 1.0) * 6.0 - 180.0 + 3.0; // +3 para meridiano central
        const lonOriginRad = lonOrigin * (Math.PI / 180.0);

        // --- Calcula Letra da Zona ---
        const zoneLetters = "CDEFGHJKLMNPQRSTUVWXX";
        let zoneLetter = "Z";
        if (lat >= -80 && lat <= 84) {
            zoneLetter = zoneLetters.charAt(Math.floor((lat + 80) / 8));
        }

        // --- Cálculos de Projeção ---
        const n = (a - (a * Math.sqrt(1 - e2))) / (a + (a * Math.sqrt(1 - e2)));
        const nu = a / Math.sqrt(1.0 - e2 * Math.sin(latRad) * Math.sin(latRad));
        const T = Math.tan(latRad) * Math.tan(latRad);
        const C = e_2 * Math.cos(latRad) * Math.cos(latRad);
        const A = (lonRad - lonOriginRad) * Math.cos(latRad);

        const M = a * (
            (1.0 - e2 / 4.0 - 3.0 * e4 / 64.0 - 5.0 * e6 / 256.0) * latRad -
            (3.0 * e2 / 8.0 + 3.0 * e4 / 32.0 + 45.0 * e6 / 1024.0) * Math.sin(2.0 * latRad) +
            (15.0 * e4 / 256.0 + 45.0 * e6 / 1024.0) * Math.sin(4.0 * latRad) -
            (35.0 * e6 / 3072.0) * Math.sin(6.0 * latRad)
        );

        const M1 = M + nu * Math.tan(latRad) * (
            (A * A / 2.0) +
            (5.0 - T + 9.0 * C + 4.0 * C * C) * (A * A * A * A / 24.0) +
            (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * e_2) * (A * A * A * A * A * A / 720.0)
        );

        const K1 = k0 * (M1);
        
        const K2 = k0 * nu * (
            A +
            (1.0 - T + C) * (A * A * A / 6.0) +
            (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * e_2) * (A * A * A * A * A / 120.0)
        );
        
        let northing = K1;
        if (lat < 0.0) {
            northing += 10000000.0; // Hemisfério Sul
        }
        
        return {
            easting: K2 + 500000.0, // Adiciona falso-leste
            northing: northing,
            zoneNum: zoneNum,
            zoneLetter: zoneLetter
        };
    }

    /**
     * (v14.3) Função principal que captura o GPS 5x e calcula a média.
     * Esta função é agora 'async' para usar 'await'.
     */
    async function handleGetGPS() {
        const gpsStatus = document.getElementById('gps-status');
        const coordXField = document.getElementById('risk-coord-x');
        const coordYField = document.getElementById('risk-coord-y');

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
        
        gpsStatus.textContent = "Capturando... (1/5)";
        gpsStatus.className = ''; // Reseta cor

        const options = {
            enableHighAccuracy: true, 
            timeout: 10000,           
            maximumAge: 0 // Força uma nova leitura
        };

        // Função auxiliar que "promete" uma posição
        const getSinglePosition = (opts) => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, opts);
            });
        };

        let readings = [];
        try {
            // Loop para capturar 5 leituras
            for (let i = 0; i < 5; i++) {
                gpsStatus.textContent = `Capturando... (${i + 1}/5)`;
                const position = await getSinglePosition(options);
                const utmCoords = convertLatLonToUtm(position.coords.latitude, position.coords.longitude);
                readings.push(utmCoords);
            }

            // Se chegou aqui, temos 5 leituras. Vamos calcular a média.
            if (readings.length === 5) {
                const totalEasting = readings.reduce((sum, r) => sum + r.easting, 0);
                const totalNorthing = readings.reduce((sum, r) => sum + r.northing, 0);
                
                const avgEasting = totalEasting / 5;
                const avgNorthing = totalNorthing / 5;

                // Usamos a zona da última leitura (é improvável mudar)
                const lastZoneNum = readings[4].zoneNum;
                const lastZoneLetter = readings[4].zoneLetter;

                // Preenche os campos com a média
                coordXField.value = avgEasting.toFixed(0); 
                coordYField.value = avgNorthing.toFixed(0); 
                
                gpsStatus.textContent = `Média de 5 leituras (Zona: ${lastZoneNum}${lastZoneLetter})`;
                gpsStatus.className = '';
            }

        } catch (error) {
            // Se qualquer uma das 5 leituras falhar, cai aqui
            gpsStatus.className = 'error';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    gpsStatus.textContent = "Permissão ao GPS negada.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    gpsStatus.textContent = "Posição indisponível.";
                    break;
                case error.TIMEOUT:
                    gpsStatus.textContent = "Tempo esgotado.";
                    break;
                default:
                    gpsStatus.textContent = "Erro ao buscar GPS.";
                    break;
            }
        }
    }
    
    // ==========================================================
    // FIM DA MODIFICAÇÃO (v14.3)
    // ==========================================================
    
    // (v12.6) Função para Excluir e Re-indexar
    function handleDeleteTree(id) {
        if (!confirm(`Tem certeza que deseja excluir a Árvore ID ${id}?`)) {
            return;
        }
        
        registeredTrees = registeredTrees.filter(tree => tree.id !== id);
        
        // Re-indexa os IDs
        registeredTrees.forEach((tree, index) => {
            tree.id = index + 1;
        });

        // --- (NOVO v13.9) SALVA OS DADOS ---
        saveDataToStorage();
        
        renderSummaryTable();
    }

    function renderSummaryTable() {
        const container = document.getElementById('summary-table-container');
        const exportBtnGroup = document.getElementById('export-btn-group');

        if (!container) return; 

        if (registeredTrees.length === 0) {
            container.innerHTML = '<p id="summary-placeholder">Nenhuma árvore cadastrada ainda.</p>';
            if (exportBtnGroup) exportBtnGroup.style.display = 'none';
            return;
        }
        
        let tableHTML = '<table class="summary-table"><thead><tr>';
        // v12.7: Adiciona header Data
        tableHTML += '<th>ID</th><th>Data</th><th>Espécie</th><th>Coord. X</th><th>Coord. Y</th><th>DAP (cm)</th><th>Local</th><th>Avaliador</th><th>Pontos</th><th>Risco</th><th>Observações</th><th class="col-delete">Excluir</th>';
        tableHTML += '</tr></thead><tbody>';

        registeredTrees.forEach(tree => {
            // v12.7: Formata a data PT-BR para exibição
            const [y, m, d] = (tree.data || '---').split('-');
            const displayDate = (y === '---' || !y) ? 'N/A' : `${d}/${m}/${y}`;
            
            tableHTML += `
                <tr>
                    <td>${tree.id}</td>
                    <td>${displayDate}</td> 
                    <td>${tree.especie}</td>
                    <td>${tree.coordX}</td>
                    <td>${tree.coordY}</td>
                    <td>${tree.dap}</td>
                    <td>${tree.local}</td>
                    <td>${tree.avaliador}</td>
                    <td>${tree.pontuacao}</td>
                    <td class="${tree.riscoClass}">${tree.risco}</td>
                    <td>${tree.observacoes}</td>
                    <td class="col-delete"><button type="button" class="delete-tree-btn" data-id="${tree.id}">🗑️</button></td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
        if (exportBtnGroup) exportBtnGroup.style.display = 'flex';
    }
    
    function getCSVData() {
        if (registeredTrees.length === 0) return null;

        // v12.7: Adiciona header Data
        const headers = ["ID", "Data Coleta", "Especie", "Coord X (UTM)", "Coord Y (UTM)", "DAP (cm)", "Local", "Avaliador", "Pontuacao", "Classificacao de Risco", "Observacoes"];
        // v12.1: Adiciona o BOM (\uFEFF)
        let csvContent = "\uFEFF" + headers.join(";") + "\n"; 

        registeredTrees.forEach(tree => {
            const cleanEspecie = (tree.especie || '').replace(/[\n;]/g, ',');
            const cleanLocal = (tree.local || '').replace(/[\n;]/g, ',');
            const cleanAvaliador = (tree.avaliador || '').replace(/[\n;]/g, ',');
            const cleanObservacoes = (tree.observacoes || '').replace(/[\n;]/g, ','); 
            
            const row = [
                tree.id,
                tree.data, // v12.7: Adiciona dado
                cleanEspecie,
                tree.coordX,
                tree.coordY,
                tree.dap,
                cleanLocal,
                cleanAvaliador,
                tree.pontuacao,
                tree.risco,
                cleanObservacoes
            ];
            csvContent += row.join(";") + "\n";
        });
        return csvContent;
    }

    function exportCSV() {
        const csvContent = getCSVData();
        if (!csvContent) {
            alert("Nenhuma árvore cadastrada para exportar.");
            return;
        }

        // v12.4: Cria nome de arquivo com data
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0'); 
        const y = today.getFullYear();
        const dateSuffix = `${d}${m}${y}`;
        const filename = `risco_arboreo_${dateSuffix}.csv`;

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

    // v12.7: Gera um corpo de e-mail em TEXTO PLANO com Data, Espécie e Observações
    function generateEmailSummaryText() {
        if (registeredTrees.length === 0) return "Nenhuma árvore foi cadastrada na tabela de resumo.";

        let textBody = "Segue o relatório resumido das árvores avaliadas:\n\n";
        
        // Cabeçalho
        textBody += "ID\t|\tData\t\t|\tEspécie (Nome/Tag)\t|\tLocal\t\t|\tClassificação de Risco\t|\tObservações\n";
        textBody += "----------------------------------------------------------------------------------------------------------------------------------------------------------\n";

        // Linhas
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
        textBody += "Para o relatório completo (com coordenadas, DAP, etc.), clique em 'Exportar CSV' no aplicativo e anexe o arquivo baixado a este e-mail antes de enviar.\n";
        
        return textBody;
    }

    // v12.2: Função de e-mail atualizada
    function sendEmailReport() {
        const targetEmail = ""; 
        const subject = "Relatório de Avaliação de Risco Arbóreo";
        
        const emailBody = generateEmailSummaryText();
        
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(emailBody);
        const mailtoLink = `mailto:${targetEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        
        if (mailtoLink.length > 2000) {
            alert("Muitos dados para enviar por e-mail. Por favor, use o botão 'Exportar CSV' e anexe o arquivo manualmente.");
            return;
        }

        window.location.href = mailtoLink;
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