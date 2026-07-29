# GlicoLog — Controle com Clareza
> Projeto de Diário Glicêmico para Monitoramento de Pacientes Diabéticos tipo 1.

---

## MARCO 4: Implantação & Padrões Web (Qualidade)

Este marco apresenta a validação de qualidade estrutural das interfaces do sistema através dos padrões internacionais da W3C, garantindo conformidade técnica, acessibilidade e eliminação de erros de renderização.

---

### 1. Relatório de Validação W3C

Submetemos todos os documentos de interface desenvolvidos ao W3C Markup Validation Service (validador oficial de HTML5 e CSS). Abaixo estão documentados todos os mapeamentos, avisos (Warnings) e erros (Errors) sanados para garantir um código limpo, profissional e semanticamente perfeito:

- [x] **dashboard.html**
  - **Avisos Corrigidos:** Removidas as barras autoconclusivas (/) das tags de elementos vazios (<meta> e <link>), adequando a sintaxe estritamente ao padrão nativo do HTML5.
  - **Erros Corrigidos:** Sanado erro crítico de acessibilidade na área de status. Foi adicionado o atributo role="status" ao contêiner <div>, permitindo o uso semântico e válido da propriedade aria-label="Status glicêmico" para leitores de ecrã.

- [x] **registro.html**
  - **Avisos Corrigidos:** Identificados avisos de que elementos <section> não possuíam cabeçalhos declarados ("Section lacks heading"). Os blocos que envolviam o formulário e a introdução da página foram substituídos por tags <div> genéricas de estilização, pois não exigiam títulos redundantes.

- [x] **cadastro.html**
  - **Avisos Corrigidos:** Limpeza completa da estrutura do documento. Atualização de tags vazias e remoção de fechamentos obsoletos (/>) em caminhos vetoriais do elemento <svg>.

- [x] **login.html**
  - **Erros Corrigidos:** Corrigido erro estrutural no carregamento do arquivo de estilo externo (<link>). O validador acusou a ausência da propriedade relacional obrigatória; o atributo foi corrigido de class="stylesheet" para rel="stylesheet".
  - **Avisos Corrigidos:** Padronização das tags de quebra de linha e metadados para omitir barras de encerramento vazias.

- [x] **historico.html**
  - **Erros Corrigidos:** Correção da árvore de nós da lista dinâmica. O validador acusou uma <div> estrutural solta diretamente sob a tag <ul>. A marcação de lista vazia injetada dinamicamente foi corrigida para habitar exclusivamente dentro de um elemento <li> válido.

- [x] **perfil.html**
  - **Avisos Corrigidos:** Substituição de múltiplos blocos estruturais de <section> (responsáveis pelos cartões de métricas e agrupamento de botões) por contêineres <div>, zerando os alertas relacionados à ausência de elementos de cabeçalho (h2-h6).

---

### 2. Restrições Técnicas & Maiores Dificuldades

Durante o fechamento desta competência de qualidade, as maiores dificuldades técnicas encontradas foram:

* **Semântica Rígida de Acessibilidade (ARIA):** Alinhar os elementos visuais de feedback instantâneo (como a cor do status glicêmico) com os validadores W3C. Foi necessário compreender como as roles de aplicação mudam a leitura do documento antes de simplesmente aplicar rótulos de acessibilidade.
* **Aninhamento Restrito de Elementos Dinâmicos:** Adaptar os seletores que recebem renderização via JavaScript (como o histórico de medições vazias) para que a estrutura estática do HTML, antes mesmo do script rodar, cumpra estritamente as regras de hierarquia (ex: garantir que filhos diretos de <ul> sejam apenas <li>).