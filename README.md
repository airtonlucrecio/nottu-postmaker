🧠 Nottu PostMaker

Gerador de criativos com IA — nível agência, com GPT-5 + IA visual + layout dinâmico + identidade Nottu.

🚀 Sobre o Projeto

O Nottu PostMaker é uma aplicação local (ou self-hosted) que gera posts prontos para redes sociais.
Combina GPT-5 (texto + roteiro) + IA de imagem + renderização local para criar criativos únicos, com tipografia e cores da marca Nottu Tech.

🧩 Arquitetura
nottu-postmaker/
├── apps/
│   ├── api/                # NestJS (Fastify)
│   └── web/                # React + Vite + Tailwind
├── packages/
│   ├── render/             # Puppeteer / Satori + Resvg
│   ├── brand-kit/          # Configurações visuais
│   ├── core/               # DTOs, types, utils
│   └── queue/              # BullMQ Workers
├── storage/                # Posts gerados localmente
└── docker-compose.yml      # Redis + API + UI

⚙️ Stack Técnica
Camada	Tecnologia	Função
Linguagem	TypeScript	Tipagem e unificação
Back-end	NestJS 10 (Fastify)	API principal e integração IA
Front-end	React + Vite + TailwindCSS	UI chat-like estilo ChatGPT
Render	Puppeteer / Satori + Resvg + Sharp	Montagem do layout final
IA Texto	GPT-5 (OpenAI API)	Roteiro, legenda, hashtags
IA Imagem	DALL·E 3 / Flux.1 / Leonardo	Fundo artístico criativo
Fila	BullMQ + Redis	Processamento assíncrono
Armazenamento	File System local	Salva imagens e legendas
DB (opcional)	SQLite / Postgres	Histórico e settings
Tipografia	Orbitron + JetBrains Mono + IBM Plex	Identidade Nottu
🧠 Fluxo de Geração

1️⃣ Usuário digita o tema.
2️⃣ API chama GPT-5 → título, slides, legenda, hashtags, prompt visual.
3️⃣ IA visual (DALL·E / Flux / Leonardo) gera fundo.
4️⃣ Render engine (Puppeteer ou Satori) aplica texto + logo + layout.
5️⃣ Resultado é salvo em:

C:\NottuPosts\YYYY-MM-DD\
├── post_01.png
├── caption.txt
├── hashtags.txt
└── metadata.json


6️⃣ UI exibe pré-visualização + legenda pronta.

🧰 Pré-Requisitos

Node 18 ou superior

npm / pnpm / yarn

Redis (para BullMQ)

Conta OpenAI com chave API GPT-5

(opcional) Conta Flux ou Leonardo para IA visual

⚙️ Instalação (Local / Dev)
# clonar o repo
git clone https://github.com/airtonlucrecio/nottu-postmaker.git
cd nottu-postmaker

# instalar dependências
npm install

# iniciar monorepo Nx
npx nx run-many --target=serve

Ambiente (.env)
OPENAI_API_KEY=sk-xxxx
IA_IMAGE_PROVIDER=flux   # ou dalle / leonardo
REDIS_URL=redis://localhost:6379
OUTPUT_PATH=C:/NottuPosts

💬 Scripts Principais
Comando	Descrição
npm run start:api	Inicia NestJS API
npm run start:web	Inicia UI React
npm run dev	Executa API + UI
npm run build	Compila para produção
npm run format	Formata código
npm run lint	Verifica padrões de código
🧩 Endpoints
POST /api/generate

Gera um novo post.

{
  "topic": "Criar um criativo sobre por que escolher a Nottu"
}


Resposta

{
  "imageUrl": "C:/NottuPosts/20251026/post_01.png",
  "caption": "Por que escolher a Nottu? Inovação e automação real.",
  "hashtags": ["#NottuTech", "#Inovacao"],
  "folder": "C:/NottuPosts/20251026"
}

🧱 Design System (UI)

Tema: escuro (#0A0A0F) + roxo neon (#4E3FE2)

Tipografia: Orbitron / JetBrains Mono

Layout: estilo ChatGPT, input inferior, mensagens em bolhas alternadas

Animações: Framer Motion (sutileza de fade e glow)

Responsividade: desktop > tablet > mobile

🔗 Integrações Futuras

Publicação direta no Instagram (Instagram Graph API)

Conexão com Notion / Trello para gerenciar ideias de conteúdo

Geração de reels (versão Remotion MP4)

Dashboard de análises de engajamento

📦 Output

Cada geração cria um pacote completo:

📁  C:/NottuPosts/2025-10-26/
├── final.png
├── caption.txt
├── hashtags.txt
└── metadata.json

🔒 Segurança

.env local criptografado (sem upload)

Rate-limit de requisições

Sanitização de inputs

Execução isolada em jobs BullMQ

Logs Pino JSON

🧭 Roadmap
Etapa	Descrição	Status
v0.1	GPT-5 + render local	✅
v0.2	UI ChatGPT theme	✅
v0.3	Fila BullMQ + histórico	🟨
v0.4	IA visual (Flux ou Leonardo)	🟨
v0.5	Publicação Instagram	⏳
v1.0	Dashboard Nottu Creator Suite	🚀 planejado

Fluxo de Geração

flowchart LR
A[Usuário digita tema] --> B[Front envia para NestJS /api/generate]
B --> C[GPT-5 gera texto + prompt visual]
C --> D[IA Visual (DALL·E / Flux) gera imagem base]
D --> E[Puppeteer/Satori compõe layout com logo + texto]
E --> F[Render final (Sharp / Resvg) salva PNG]
F --> G[FS: C:\\NottuPosts\\YYYY-MM-DD]
G --> H[Front recebe preview + legenda + hashtags]
H --> I[Usuário visualiza e copia / publica]


🧾 Licença

Uso interno — © 2025 Nottu Tech.
Proibida redistribuição sem autorização.