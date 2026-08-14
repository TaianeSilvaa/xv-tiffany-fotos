# Álbum dos 15 Anos da Tiffany

Site React/Vite com backend Cloudflare Worker, banco D1 e armazenamento R2. As fotos são compactadas no celular antes do envio.

## 1. Abrir a demonstração no computador

Não abra o `index.html` diretamente.

1. Instale o Node.js 20 ou superior.
2. Dê dois cliques em `iniciar-site.bat`.
3. Aguarde a primeira instalação e acesse `http://localhost:5173`.

Sem configurar a API, o site abre com fotos de demonstração, mas não salva conteúdo.

## 2. Criar o backend gratuito no Cloudflare

Abra esta pasta no terminal e execute:

```bash
npm install
npx wrangler login
npx wrangler r2 bucket create tiffany-fotos
npx wrangler d1 create tiffany-festa
```

O último comando exibirá um `database_id`.

1. Faça uma cópia de `wrangler.toml.example` chamada `wrangler.toml`.
2. Cole o `database_id` no local indicado.
3. Mantenha `ALLOWED_ORIGIN = "http://localhost:5173"` durante o teste local.
4. Crie as tabelas:

```bash
npm run backend:db:remote
```

Cadastre a senha da Tiffany:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_TOKEN_SECRET
```

No primeiro comando, digite a senha que a Tiffany usará. No segundo, digite uma sequência longa e aleatória, diferente da senha.

Publique o backend:

```bash
npm run backend:deploy
```

O terminal exibirá uma URL terminada em `.workers.dev`.

## 3. Ligar o site ao backend

1. Faça uma cópia de `.env.example` chamada `.env`.
2. Em `VITE_API_URL`, coloque a URL `.workers.dev`, sem barra no final.
3. Reinicie `npm run dev`.
4. Envie uma foto de teste e abra **Área da Tiffany**.

## 4. Publicar o site na Vercel

1. Envie o projeto ao GitHub e importe-o na Vercel.
2. Na Vercel, adicione `VITE_API_URL` em **Settings > Environment Variables**.
3. Em `wrangler.toml`, troque `ALLOWED_ORIGIN` pelo domínio final da Vercel, por exemplo `https://seu-site.vercel.app`.
4. Execute novamente `npm run backend:deploy`.

## Área da Tiffany

- Acesso protegido por senha.
- Entrada no feed identificada como Tiffany e publicação de novas fotos.
- Seleção livre de imagens para download em ZIP.
- Download completo em pacotes de até 100 fotos.
- Seleção e exclusão definitiva de várias fotos.
- A sessão administrativa expira em 12 horas.

## Atualização: carrosséis, reações e comentários

Esta versão permite publicar até 10 imagens no mesmo post, navegar pelo carrossel, reagir com emojis e comentar. Para atualizar um banco que já estava funcionando, execute uma única vez:

```bash
npm run backend:migrate:social
```

Confirme com `Y`. Depois publique a nova versão do Worker:

```bash
npm run backend:deploy
```

Não execute a migração `backend:migrate:social` uma segunda vez, pois as colunas já terão sido criadas. As fotos antigas são preservadas e convertidas automaticamente em posts individuais.

Depois envie o código ao GitHub para a Vercel publicar o novo front-end:

```bash
git add .
git commit -m "Adiciona carrosseis reacoes comentarios e nova area da Tiffany"
git push
```

O arquivo `.env` deve continuar fora do GitHub.

## Capacidade e desempenho

- Imagem original: até 20 MB.
- Imagem enviada: WebP, no máximo 1600 px e até 6 MB por imagem.
- Até 10 imagens por publicação.
- Feed atualizado a cada 15 segundos.
- Fotos carregadas gradualmente conforme aparecem na tela.
- O R2 oferece uma franquia gratuita maior e não cobra tráfego de saída dentro das condições do plano.

## Antes da festa

- Teste upload e feed em pelo menos dois celulares.
- Teste o ZIP em um computador; é a melhor opção para baixar muitas fotos.
- Guarde a senha administrativa fora do código.
- Depois da festa, baixe todos os lotes e mantenha uma segunda cópia das fotos.
