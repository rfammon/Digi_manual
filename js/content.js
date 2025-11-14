// js/content.js (v22.3 - Adiciona riskQuestions)

// Helper local, usado apenas neste arquivo
const imgTag = (src, alt) => `<img src="img/${src}" alt="${alt}" class="manual-img">`;

// === 1. DADOS DO GLOSSÁRIO ===
export const glossaryTerms = {
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

// === 2. DADOS DE EQUIPAMENTOS ===
export const equipmentData = {
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

// === 3. DADOS DE PROPÓSITO DA PODA ===
export const podaPurposeData = {
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

// === 4. CONTEÚDO HTML DO MANUAL ===
export const manualContent = {
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
    
    // [NOVA VERSÃO v22.3 - Layout de Duas Colunas]
    'sobre-autor': {
        titulo: '👨‍💻 Sobre o Autor',
        html: `
            <div class="autor-layout">
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
                </div>
                <div class="autor-perfil">
                    <img src="img/autor.jpg" alt="Foto de Rafael de Andrade Ammon" class="manual-img">
                    <p class="autor-links">
                        <a href="mailto:rafael.ammon@gmail.com">rafael.ammon@gmail.com</a> |    
                        <a href="https://www.linkedin.com/in/rafael-andrade-ammon-2527a72a/" target="_blank">LinkedIn</a>
                    </p>
                </div>
            </div>
        `
    }
};

// --- [NOVO v22.3] ---
// === 5. DADOS DE PERGUNTAS DE RISCO (PARA O MAPA) ===
// Texto resumido das 16 perguntas do checklist

export const riskQuestions = [
    "Galhos mortos (> 5cm)",
    "Rachaduras/Fendas",
    "Apodrecimento/Cavidades",
    "Casca Inclusa (União em V)",
    "Galhos Cruzados/Fricção",
    "Copa Assimétrica (>30%)",
    "Inclinação Anormal/Recente",
    "Próxima a Vias/Circulação",
    "Risco de Queda (Alvos)",
    "Interferência em Redes",
    "Espécie de Alto Risco",
    "Poda Drástica/Brotos Epicórmicos",
    "Dano Estrutural (Calçada/Raiz)",
    "Perda de Raízes (>40%)",
    "Compactação/Asfixia Radicular",
    "Apodrecimento de Raízes (>3cm)"
];
