# 📚 Biblioteca API

Uma API REST customizada, simples e completa para gerenciamento de **Livros e Obras Literárias**. 

Desenvolvida com o objetivo de servir como um portfólio prático de gestão de configuração, esta API foi construída em **Node.js nativo**, sem o uso de frameworks de terceiros (como Express). Isso reduz a complexidade de configuração a zero, elimina pastas gigantescas como `node_modules`, otimiza o tempo de inicialização e demonstra um domínio das APIs de rede fundamentais da plataforma.

---

## 🛠️ Tecnologias e Arquitetura

- **Linguagem/Plataforma**: Node.js (JavaScript)
- **Framework**: Nenhum (Módulo HTTP nativo do Node.js)
- **Persistência**: Arquivo JSON local (`src/database.json`) simulando um banco de dados persistente.
- **Portabilidade**: Executável portátil do Node.js incluído no diretório `.bin/node.exe` para permitir a execução imediata em sistemas Windows sem necessidade de instalações globais prévias.

---

## 🚀 Como Executar o Projeto (API + Interface Web)

Como o projeto inclui um executável portátil do Node.js e tudo foi unificado, você pode iniciar o servidor e a interface de uma só vez, sem necessidade de instalar dependências extras ou utilizar npm:

1. **Abra o PowerShell** ou o terminal de sua preferência no diretório raiz do projeto (`Biblioteca-API`).
2. **Execute o servidor** com o seguinte comando:
   ```powershell
   .\.bin\node.exe src\server.js
   ```
3. O servidor será inicializado na porta `8080` e exibirá a seguinte mensagem no console:
   ```text
   Servidor rodando em http://localhost:8080
   - Interface Web servida em http://localhost:8080/
   - GET  http://localhost:8080/api/livros
   - POST http://localhost:8080/api/livros
   - DELETE http://localhost:8080/api/livros/:id
   ```
4. **Acesse a aplicação**: Abra seu navegador e navegue até `http://localhost:8080/`. O Node.js irá servir a interface completa que consome a API REST.

---

## 📡 Endpoints da API

### 1. Obter Todos os Livros Cadastrados
Retorna uma lista JSON de todos os livros cadastrados.

* **Rota**: `GET /api/livros`
* **Exemplo de Requisição (PowerShell)**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:8080/api/livros" -Method Get | ConvertTo-Json -Depth 5
  ```
* **Resposta Esperada (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "titulo": "Dom Casmurro",
      "autor": "Machado de Assis",
      "genero": "Romance",
      "anoPublicacao": 1899,
      "paginas": 256,
      "sinopse": "Uma narrativa em primeira pessoa por Bento Santiago (Bentinho) sobre sua vida, seu amor por Capitu e a dúvida atormentadora sobre a fidelidade dela.",
      "palavrasChave": [
        "Literatura Brasileira",
        "Realismo",
        "Clássico"
      ]
    }
  ]
  ```

### 2. Cadastrar um Novo Livro
Cadastra um novo livro no banco de dados JSON local. O endpoint conta com validações estritas (ex: o ano de publicação deve ser um ano inteiro válido entre 1000 e o ano atual).

* **Rota**: `POST /api/livros`
* **Formato do Corpo (JSON)**:
  ```json
  {
    "titulo": "A Hora da Estrela",
    "autor": "Clarice Lispector",
    "genero": "Romance",
    "anoPublicacao": 1977,
    "paginas": 88,
    "sinopse": "A melancólica história de Macabéa, uma datilógrafa nordestina órfã e alienada que vive no Rio de Janeiro e reflete sobre sua própria existência.",
    "palavrasChave": [
      "Literatura Brasileira",
      "Existencialismo",
      "Modernismo"
    ]
  }
  ```
* **Exemplo de Requisição (PowerShell)**:
  ```powershell
  $body = @{
      titulo = "A Hora da Estrela"
      autor = "Clarice Lispector"
      genero = "Romance"
      anoPublicacao = 1977
      paginas = 88
      sinopse = "A melancólica história de Macabéa, uma datilógrafa nordestina órfã e alienada que vive no Rio de Janeiro e reflete sobre sua própria existência."
      palavrasChave = @("Literatura Brasileira", "Existencialismo", "Modernismo")
  } | ConvertTo-Json -Depth 5

  Invoke-RestMethod -Uri "http://localhost:8080/api/livros" -Method Post -Body $body -ContentType "application/json; charset=utf-8"
  ```
* **Resposta Esperada (201 Created)**:
  ```json
  {
    "id": "5",
    "titulo": "A Hora da Estrela",
    "autor": "Clarice Lispector",
    "genero": "Romance",
    "anoPublicacao": 1977,
    "paginas": 88,
    "sinopse": "A melancólica história de Macabéa, uma datilógrafa nordestina órfã e alienada que vive no Rio de Janeiro e reflete sobre sua própria existência.",
    "palavrasChave": [
      "Literatura Brasileira",
      "Existencialismo",
      "Modernismo"
    ]
  }
  ```

---

## 📈 Workflow de Desenvolvimento Adotado

Para a gestão de configuração e controle de alterações deste repositório, adotamos o **GitHub Flow**.

### O que é o GitHub Flow?
Trata-se de um modelo de ramificação (branching) simples, leve e focado no fluxo de trabalho centrado no branch de produção (`main`). O ciclo consiste em:
1. **Criar uma Branch**: Criar uma branch a partir da `main` com um nome descritivo para a nova feature ou correção (ex: `feature/adicionar-rota-post`).
2. **Adicionar Commits**: Efetuar alterações localmente e commitar com mensagens claras.
3. **Abrir um Pull Request**: Abrir uma solicitação de pull request para discutir a implementação e iniciar revisões de código.
4. **Revisar e Testar**: Garantir que as validações e testes passam no ambiente.
5. **Realizar o Merge**: Fazer o merge da branch de feature para a `main`.

### Por que decidimos trabalhar com o GitHub Flow?
A decisão de usar o **GitHub Flow** em detrimento do **Git Flow** tradicional ou de abordagens baseadas em Trunk-based Development estritas baseia-se em:

1. **Simplicidade e Agilidade**: O projeto é focado em fornecer uma API enxuta e direta. Gerenciar branches extras (`develop`, `release/*`, `hotfix/*`) adicionaria overhead administrativo desnecessário, diminuindo a agilidade do desenvolvimento.
2. **Ideal para Entrega Contínua (CD)**: A branch `main` atua como a única fonte de verdade e está sempre em estado pronto para deploy ("production-ready"). Qualquer merge na `main` representa uma nova versão estável da API.
3. **Melhor Rastreabilidade de Funcionalidades**: O isolamento em branches de feature temporárias permite que cada requisito (como a rota POST solicitada) seja testado isoladamente antes do merge, reduzindo conflitos de integração e preservando o histórico de commits limpo e atômico.
