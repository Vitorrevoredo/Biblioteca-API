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

## 🐳 Docker

### Badges

<!-- Substitua SEU_USUARIO pelo seu usuário real do Docker Hub -->
[![Docker Pulls](https://img.shields.io/docker/pulls/devsilvafelipe/biblioteca-api?style=flat-square&logo=docker)](https://hub.docker.com/r/devsilvafelipe/biblioteca-api)
[![Docker Image Version](https://img.shields.io/docker/v/devsilvafelipe/biblioteca-api?sort=date&style=flat-square&logo=docker&label=latest)](https://hub.docker.com/r/devsilvafelipe/biblioteca-api)

> **Nota:** Substitua `SEU_USUARIO` pelo seu nome de usuário real do Docker Hub nos badges e comandos abaixo.

### Como a Imagem é Construída e Publicada

O workflow **Docker CI/CD** (`.github/workflows/docker-ci.yml`) possui **3 jobs**:

| Job | Descrição | Quando executa |
|-----|-----------|----------------|
| **Build** | Constrói a imagem Docker para validar o Dockerfile | Push em qualquer branch + Pull Requests |
| **Testes** | Executa ESLint + Jest com cobertura mínima de 90% | Push em qualquer branch + Pull Requests |
| **Publicação** | Publica a imagem no Docker Hub com tags `latest` e SHA do commit | **Somente** push na branch `baseline` |

A publicação **depende obrigatoriamente** do sucesso dos jobs de Build e Testes.

### 🔗 Link do Docker Hub

```
https://hub.docker.com/r/devsilvafelipe/biblioteca-api
```

### ⚙️ Configuração dos Secrets no GitHub

Para que a publicação no Docker Hub funcione, configure os seguintes valores em **Settings > Secrets and variables > Actions** no repositório GitHub:

| Tipo | Nome | Descrição |
|------|------|-----------|
| **Variable** | `DOCKERHUB_USERNAME` | Seu nome de usuário do Docker Hub |
| **Secret** | `DOCKERHUB_TOKEN` | Token de acesso do Docker Hub (gere em [hub.docker.com/settings/security](https://hub.docker.com/settings/security)) |

### 🏗️ Construir a Imagem Localmente

```bash
docker build -t biblioteca-api .
```

### ▶️ Executar a Imagem Localmente

```bash
docker run -d -p 8080:8080 --name biblioteca biblioteca-api
```

Acesse a aplicação em: [http://localhost:8080](http://localhost:8080)

- **Interface Web**: `http://localhost:8080/`
- **API REST**: `http://localhost:8080/api/livros`

Para parar o container:
```bash
docker stop biblioteca && docker rm biblioteca
```

### 📌 Observação Importante

A publicação automática da imagem no Docker Hub ocorre **exclusivamente** na branch `baseline`. Pushes em outras branches (como `main`, `develop`, etc.) executam apenas o build e os testes, sem publicar a imagem.

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


---

## 🖥️ Virtualização com Vagrant e VirtualBox

### Objetivo

Esta infraestrutura oferece uma **alternativa ao Docker** para executar a Biblioteca API em máquinas virtuais Linux completas, utilizando **Vagrant** como ferramenta de provisionamento e **VirtualBox** como provedor de virtualização.

A configuração cria **duas máquinas virtuais** que se comunicam por uma rede privada:

| Máquina | Função | IP Privado | RAM | CPU |
|---------|--------|------------|-----|-----|
| **VM1** (`vm1`) | Cliente — realiza requisições HTTP à API | `192.168.56.10` | 1024 MB | 1 |
| **VM2** (`vm2`) | Servidor — executa a Biblioteca API na porta 8080 | `192.168.56.11` | 1024 MB | 1 |

- **VM1** possui o `curl` instalado para testar os endpoints da API.
- **VM2** possui o Node.js 20.x instalado e executa a aplicação como um serviço `systemd` (`biblioteca-api.service`), garantindo inicialização automática e reinício em caso de falha.

### Pré-requisitos no Computador Host (Windows)

Antes de iniciar, instale os seguintes softwares no seu computador:

1. **VirtualBox** (versão 6.1 ou superior): [https://www.virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)
2. **Vagrant** (versão 2.3 ou superior): [https://developer.hashicorp.com/vagrant/downloads](https://developer.hashicorp.com/vagrant/downloads)

> Após a instalação, reinicie o terminal para garantir que os comandos `vagrant` e `VBoxManage` estejam disponíveis no PATH.

### Validar o Vagrantfile

```bash
vagrant validate
```

### Iniciar as Duas Máquinas

```bash
vagrant up --provider=virtualbox
```

> O primeiro `vagrant up` pode demorar alguns minutos, pois baixa a box `ubuntu/jammy64` e executa o provisionamento completo (atualização de pacotes, instalação do Node.js, etc.).

### Verificar o Estado das Máquinas

```bash
vagrant status
```

Saída esperada:

```text
Current machine states:

vm1                       running (virtualbox)
vm2                       running (virtualbox)
```

### Acessar a VM1 (Cliente)

```bash
vagrant ssh vm1
```

### Testar a API a partir da VM1

Dentro da VM1, execute:

**Com curl:**

```bash
curl -i http://192.168.56.11:8080/api/livros
```

**Com wget (alternativa):**

```bash
wget -qO- http://192.168.56.11:8080/api/livros
```

**Resultado esperado:** resposta HTTP `200 OK` com o corpo contendo um array JSON dos livros cadastrados:

```json
[
  {
    "id": "1",
    "titulo": "Dom Casmurro",
    "autor": "Machado de Assis",
    "genero": "Romance",
    "anoPublicacao": 1899,
    "paginas": 256,
    "sinopse": "Uma narrativa em primeira pessoa por Bento Santiago...",
    "palavrasChave": ["Literatura Brasileira", "Realismo", "Clássico"]
  }
]
```

### Acessar a VM2 (Servidor)

```bash
vagrant ssh vm2
```

### Verificar o Serviço na VM2

Dentro da VM2, consulte o status do serviço:

```bash
sudo systemctl status biblioteca-api
```

### Consultar os Logs da Aplicação

```bash
sudo journalctl -u biblioteca-api -f
```

> Use `Ctrl+C` para sair da visualização em tempo real dos logs.

### Parar as Máquinas

```bash
vagrant halt
```

### Destruir as Máquinas Virtuais

Para remover completamente as VMs e liberar espaço em disco:

```bash
vagrant destroy -f
```

### Como Funciona a Comunicação

1. A **VM2** inicia a Biblioteca API automaticamente via serviço `systemd` (`biblioteca-api.service`).
2. A aplicação escuta na porta **8080** em todas as interfaces de rede (`0.0.0.0`).
3. A **VM1** utiliza `curl` para enviar requisições HTTP ao endereço privado da VM2 (`192.168.56.11:8080`).
4. A VM1 recebe a resposta JSON da API.

### Estrutura dos Arquivos de Infraestrutura

```text
Biblioteca-API/
├── vagrant/
│   ├── provision-vm1.sh    # Script de provisionamento da VM1 (cliente)
│   └── provision-vm2.sh    # Script de provisionamento da VM2 (servidor)
├── Vagrantfile             # Definição das máquinas virtuais
└── .gitignore              # Inclui .vagrant/ para ignorar arquivos temporários
```

> **Nota:** A infraestrutura Vagrant é uma alternativa à execução com Docker. Ambas as formas de execução continuam disponíveis no projeto.
