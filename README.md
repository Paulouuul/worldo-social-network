# Worldo - Social Network

## Resumo

Projeto de uma rede social com marketplace de cosméticos criados pelos usuários

## Funcionalidades já implementadas

- Cadastro utilizando email pessoal, Github ou conta Google
- Upload de Avatar e Banner para perfil pessoal (Integração com módulo [backend](https://github.com/Paulouuul/worldo-backend-module) em outro repositório)
- Marketplace com busca otimizada com ElasticSearch
- Comércio de molduras para perfil criadas pelos próprios usuários
- Carrinho com items a serem comprados pelo usuário armazenado em cache no Redis (Integração com módulo [backend](https://github.com/Paulouuul/worldo-backend-module) em outro repositório)
- Compra de Moeda virtual própria da plataforma com cartão de crédito com Stripe
- Armazenamento de mídia dos usuários no Cloudflare R2 (Integração com módulo [backend](https://github.com/Paulouuul/worldo-backend-module) em outro repositório)
- Envio de email de confirmação com ReSend

## Integração com [Backend](https://github.com/Paulouuul/worldo-backend-module)

Este repositório interage com um módulo separado que contém um backend dedicado a algumas funções específicas da aplicação.

**Repositório do Backend:** [worldo-backend-module](https://github.com/Paulouuul/worldo-backend-module)



## Requisitos

- Node v22.22.3
- Banco de dados PostgreSql com uma database criada préviamente
- Banco de dados ElasticSearch
- Cloudflare R2 com 2 buckets: privado / público
- Ambiente Stripe configurado
- Aplicação OAuth Google e Github
- Resend para envio de emails

## Como executar

### 1. Criação de containers Docker (PostgreSql e ElasticSearch)

```bash
docker compose up
```

### 2. Instalação de depedências

```bash
npm install
```

### 3. Configuração de variáveis de ambiente

- Crie o arquivo .env conforme o .env.example
- Configure os valores de acordo com o seu ambiente de desenvolvimento

### 4. Configuração de database (Prisma)

```bash
npx prisma migrate dev --name db-init
npx prisma migrate deploy
npx prisma generate
```

### 5. Popular o database com dados essenciais (Prisma Seed)

```bash
npx prisma db seed
```

### 6. Build da aplicação

```bash
npm run build
```

### 7. Inicializando a aplicação

```bash
npm start
```


## Tecnologias

- Next.js
- Typescript
- NextAuth
- OAuth Google/Github
- Resend (Envio de emails)
- Prisma
- PostgreSql
- Docker
- ElasticSearch
- Stripe
- Redis
- Cloudlfare R2
- Jwt

## Imagens

### Página de Login

![Página de Login](doc_images/login.png)

### Perfil do usuário

![Perfil de Usuário](doc_images/user_perfil.png)

### Compra de Moedas virtuais

![Compra de Moedas](doc_images/compra_de_moedas.png)

### Marketplace de Molduras

![Marketplace de Molduras](doc_images/marketplace.png)

### Inventário do usuário

![Inventário do usuário](doc_images/inventario.png)
