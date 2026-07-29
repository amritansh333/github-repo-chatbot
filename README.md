# RepoChat

An AI-powered GitHub repository assistant that helps developers explore, understand, and chat with their repositories using Retrieval-Augmented Generation (RAG). RepoChat combines GitHub integration, Google Gemini AI, semantic search, and persistent conversations to provide contextual answers about your codebase.

> Built with Next.js, TypeScript, Auth.js, PostgreSQL, Drizzle ORM, and Google Gemini.

---

## Features

### AI-Powered Repository Chat

- Chat with GitHub repositories using Google Gemini
- Retrieval-Augmented Generation (RAG)
- Semantic code search
- Repository context retrieval
- Streaming AI responses
- Markdown and code block rendering

### GitHub Integration

- Sign in with GitHub
- Browse public and private repositories
- Repository details and insights
- Repository language analysis
- Recent commits and branches

### Conversation Management

- Multiple chat conversations
- Rename and delete chats
- Persistent chat history
- Conversation search
- Pin and favorite conversations
- Export conversations as Markdown or JSON

### User Experience

- Responsive design
- Light and Dark mode
- Loading skeletons
- Toast notifications
- Auto-scroll
- Copy code blocks
- Retry AI responses
- Keyboard accessibility

### Performance & Security

- PostgreSQL with Drizzle ORM
- Authentication with Auth.js
- Environment validation
- API validation
- Rate limiting
- Security headers
- SEO optimization

---

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Zustand

### Backend

- Next.js API Routes
- Auth.js
- Drizzle ORM
- PostgreSQL

### AI & Search

- Google Gemini
- Retrieval-Augmented Generation (RAG)
- Embeddings
- Semantic Search
- Vector Storage

---

## Project Structure

```text
src
├── app
├── components
│   ├── auth
│   ├── chat
│   ├── github
│   ├── layout
│   ├── providers
│   └── ui
├── db
├── hooks
├── lib
├── store
└── types
```

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/github-repo-chatbot.git
cd github-repo-chatbot
```

### Install dependencies

```bash
npm install
```

### Configure environment

Create a `.env` file and add the required environment variables.

```env
DATABASE_URL=

AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

GEMINI_API_KEY=
```

### Push the database schema

```bash
npm run db:push
```

### Run the development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Available Scripts

```bash
npm run dev
```

Start the development server.

```bash
npm run build
```

Build the application.

```bash
npm run start
```

Run the production build.

```bash
npm run lint
```

Run ESLint.

```bash
npm run db:push
```

Push the database schema.

---

## Future Improvements

- Multi-repository chat
- Repository indexing optimization
- Organization support
- AI conversation sharing
- Team collaboration

---

## Contributing

Contributions, suggestions, and pull requests are welcome.

---

## License

This project is licensed under the MIT License.

---

## Author

**Amritansh Jaiswal**

- GitHub: https://github.com/amritansh333
- LinkedIn: https://www.linkedin.com/in/amritanshjaiswal/