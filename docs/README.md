# GlicLog

Sistema web desenvolvido para auxiliar pessoas com Diabetes Mellitus Tipo 1 no registro, acompanhamento e organização de suas medições glicêmicas, oferecendo uma forma simples, segura e acessível de monitorar a saúde diariamente.

---

## Objetivo

O GlicLog foi criado com o objetivo de facilitar o acompanhamento diário da glicemia, permitindo que o usuário registre suas medições, consulte o histórico, organize as informações por período e gere relatórios em PDF para acompanhamento médico.

---

## Funcionalidades

- Cadastro de usuários
- Login com autenticação JWT
- Registro de medições glicêmicas
- Histórico completo das medições
- Edição de registros
- Exclusão de registros
- Filtros por semana
- Filtros por mês
- Períodos personalizados
- Geração de relatório em PDF
- Interface responsiva

---

## Tecnologias Utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript (ES6+)

### Back-end

- Node.js
- Express.js

### Banco de Dados

- MySQL

### Segurança

- JWT (JSON Web Token)
- BCrypt

### Geração de Relatórios

- PDFKit

### Ferramentas

- Git
- GitHub
- Visual Studio Code

---

## Estrutura do Projeto

```text
GlicLog/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   ├── images/
│   │   └── js/
│   │
│   ├── pages/
│   └── index.html
│
└── README.md
```

---

## Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/YanRicardo-Afk/GlicLog.git
```

---

### 2. Entre na pasta

```bash
cd GlicLog
```

---

### 3. Instale as dependências

```bash
cd backend

npm install
```

---

### 4. Configure o arquivo `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=gliclog
JWT_SECRET=sua_chave
PORT=3000
```

---

### 5. Inicie o servidor

```bash
npm run dev
```

---

### 6. Abra o Front-end

Abra o arquivo

```
frontend/index.html
```

ou utilize uma extensão como **Live Server**.

---

## Banco de Dados

O sistema utiliza MySQL para armazenamento dos dados.

Principais tabelas:

- users
- glucose_records

---

## API

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| POST | /auth/register | Cadastro de usuário |
| POST | /auth/login | Login |
| GET | /glucose | Lista medições |
| POST | /glucose | Nova medição |
| PUT | /glucose/:id | Atualiza medição |
| DELETE | /glucose/:id | Remove medição |
| GET | /glucose/report/pdf | Gera relatório PDF |

---

## Capturas de Tela

### Login

> Inserir imagem

---

### Dashboard

> Inserir imagem

---

### Histórico

> Inserir imagem

---

### Relatório PDF

> Inserir imagem

---

## Melhorias Futuras

- Gráficos estatísticos
- Lembretes para medições
- Recuperação de senha
- Integração com sensores de glicemia
- Dashboard com indicadores

---

## Autor

Desenvolvido por **Yan Ricardo Silva Pereira** como projeto da disciplina **Desenvolver e organizar elementos estruturais de sites**.