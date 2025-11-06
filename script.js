// script.js

// === 1. DEFINIÇÃO DE DADOS (GLOSSÁRIO, CONTEÚDO, NAVEGAÇÃO) ===

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

// Dados de navegação (Índice)
const topicButtonsData = [
    { target: 'conceitos-basicos', text: '1. Definições, Termos e Técnicas' },
    { target: 'planejamento-inspecao', text: '2.1. Planejamento e Inspeção (Risco)' },
    { target: 'autorizacao-legal', text: '1.5. e 2.1.9. Termos Legais e ASV' },
    { target: 'preparacao-e-isolamento', text: '2.2. Preparação e Isolamento (PT)' },
    { target: 'operacoes-e-tecnicas', text: '2.3. Operações, Poda e Supressão' },
    { target: 'riscos-e-epis', text: '2.4. e 2.5. Análise de Risco e EPIs' },
    { target: 'gestao-e-desmobilizacao', text: '2.3.4. Gestão de Resíduos e Desmobilização' }
];

// Dados do Manual (Conteúdo das seções)
const manualContent = {
    'conceitos-basicos': {
        titulo: '1. Definições, Termos e Técnicas',
        html: `
            <h3>1.1. Termos Estruturais e Anatômicos</h3>
            <p>A correta identificação das partes da árvore é vital. Use o <span class="glossary-term" data-term-key="colar do galho">colar do galho</span> e a <span class="glossary-term" data-term-key="crista da casca">crista da casca</span> como guias.</p>
            ${imgTag('anatomia-corte.jpg', 'Anatomia correta do corte de galho')}
            <p>Termos como <span class="glossary-term" data-term-key="lenho de cicatrização">lenho de cicatrização</span>, <span class="glossary-term" data-term-key="casca inclusa">casca inclusa</span> e <span class="glossary-term" data-term-key="lenho de reação">lenho de reação</span> são importantes para a inspeção.</p>
            <h3>1.2. Instrumentos e Equipamentos</h3>
            <ul><li>Podão</li><li>Tesourão de poda</li><li>Motosserra</li><li>Podador manual tipo bypass</li><li>Hipsômetro</li></ul>
            <h3>1.3. Técnicas de Poda Essenciais</h3>
            <ul><li>Poda de limpeza</li><li>Poda de adequação</li><li>Poda de redução</li><li>Poda em três cortes</li><li>⚠️ Prática NÃO RecomendADA: <span class="glossary-term" data-term-key="poda drástica">Poda drástica</span> (<span class="glossary-term" data-term-key="topping">topping</span>).</li></ul>
        `
    },
    'planejamento-inspecao': {
        titulo: '2. Procedimentos: Planejamento e Inspeção',
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
        titulo: '1.5. e 2.1.9. Termos Legais e Autorização (ASV)',
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