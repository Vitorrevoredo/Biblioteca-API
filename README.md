# ☕ Café Gourmet API

Uma API REST customizada, simples e completa para gerenciamento de **Cafés Especiais e Raros**. 

Desenvolvida com o objetivo de servir como um portfólio prático de gestão de configuração, esta API foi construída em **Node.js nativo**, sem o uso de frameworks de terceiros (como Express). Isso reduz a complexidade de configuração a zero, elimina pastas gigantescas como `node_modules`, otimiza o tempo de inicialização e demonstra um domínio das APIs de rede fundamentais da plataforma.

---

## 🛠️ Tecnologias e Arquitetura

- **Linguagem/Plataforma**: Node.js (JavaScript)
- **Framework**: Nenhum (Módulo HTTP nativo do Node.js)
- **Persistência**: Arquivo JSON local (`src/database.json`) simulando um banco de dados persistente.
- **Portabilidade**: Executável portátil do Node.js incluído no diretório `.bin/node.exe` para permitir a execução imediata em sistemas Windows sem necessidade de instalações globais prévias.

---

## 🚀 Como Executar a API

Como o projeto inclui um executável portátil do Node.js, você pode iniciar o servidor imediatamente no Windows.

1. **Abra o PowerShell** ou o terminal de sua preferência no diretório raiz do projeto.
2. **Execute o servidor** com o seguinte comando:
   ```powershell
   .\.bin\node.exe src\server.js
   ```
3. O servidor será inicializado na porta `8080` e exibirá a seguinte mensagem no console:
   ```text
   Servidor rodando em http://localhost:8080
   - GET  http://localhost:8080/api/cafes
   - POST http://localhost:8080/api/cafes
   ```

---

## 📡 Endpoints da API

### 1. Obter Todos os Cafés Cadastrados
Retorna uma lista JSON de todos os cafés especiais cadastrados.

* **Rota**: `GET /api/cafes`
* **Exemplo de Requisição (PowerShell)**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:8080/api/cafes" -Method Get | ConvertTo-Json -Depth 5
  ```
* **Resposta Esperada (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "nome": "Bourbon Amarelo",
      "fazenda": "Fazenda Rainha",
      "regiao": "Vale da Grama, SP",
      "notaSCA": 88.5,
      "processo": "Natural",
      "notasSensoriais": ["frutas amarelas", "chocolate", "caramelo"]
    }
  ]
  ```

### 2. Cadastrar um Novo Café Especial
Cadastra um novo café no banco de dados JSON local. O endpoint conta com validações estritas (ex: a nota SCA precisa ser um número entre 80 e 100).

* **Rota**: `POST /api/cafes`
* **Formato do Corpo (JSON)**:
  ```json
  {
    "nome": "Geisha Esmeralda",
    "fazenda": "Fazenda Vista Alegre",
    "regiao": "Cerrado Mineiro",
    "notaSCA": 91.2,
    "processo": "Cereja Despolpado",
    "notasSensoriais": ["jasmin", "limão", "mel"]
  }
  ```
* **Exemplo de Requisição (PowerShell)**:
  ```powershell
  $body = @{
      nome = "Geisha Esmeralda"
      fazenda = "Fazenda Vista Alegre"
      regiao = "Cerrado Mineiro"
      notaSCA = 91.2
      processo = "Cereja Despolpado"
      notasSensoriais = @("jasmin", "limão", "mel")
  } | ConvertTo-Json -Depth 5

  Invoke-RestMethod -Uri "http://localhost:8080/api/cafes" -Method Post -Body $body -ContentType "application/json; charset=utf-8"
  ```
* **Resposta Esperada (201 Created)**:
  ```json
  {
    "id": "4",
    "nome": "Geisha Esmeralda",
    "fazenda": "Fazenda Vista Alegre",
    "regiao": "Cerrado Mineiro",
    "notaSCA": 91.2,
    "processo": "Cereja Despolpado",
    "notasSensoriais": ["jasmin", "limão", "mel"]
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
