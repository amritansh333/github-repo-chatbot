# GitHub Repository Chatbot

An AI-powered GitHub repository assistant that helps developers explore, understand, and interact with their repositories through a clean, modern interface. The application connects securely to GitHub using a Personal Access Token (PAT), provides repository insights, and lays the foundation for AI-powered code understanding and repository conversations.

> **Status:** Active Development

---

## Features

### GitHub Authentication

- Secure Personal Access Token (PAT) authentication
- Token validation before access
- Persistent session using local storage
- Quick sign-out support

### Repository Management

- Fetch repositories directly from GitHub
- Search repositories instantly
- Sort by name and last updated
- Repository overview with metadata
- Repository detail page
- Public and private repository support

### Dashboard

- Repository statistics
- Recently updated repositories
- Language distribution overview
- Repository activity summary
- Clean and responsive analytics cards

### User Experience

- Modern responsive interface
- Light and Dark mode
- Mobile-friendly navigation
- Smooth page transitions
- Loading skeletons
- Empty states
- Error handling
- Accessible components

### Developer Experience

- TypeScript
- Modular architecture
- Reusable UI components
- Clean folder structure
- Strict typing
- Scalable codebase

---

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Radix UI
- Lucide React
- Zustand
- next-themes
- date-fns

### APIs

- GitHub REST API

---

## Project Structure

```text
src
├── app
│   ├── dashboard
│   └── ...
├── components
│   ├── auth
│   ├── github
│   ├── layout
│   ├── providers
│   └── ui
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
```

```bash
cd github-repo-chatbot
```

### Install dependencies

```bash
npm install
```

### Configure environment

Create a `.env.local` file.

```env
# Add environment variables here as the project evolves.
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

## GitHub Personal Access Token

This project requires a GitHub Personal Access Token.

### Create a token

1. Open GitHub Settings.
2. Navigate to **Developer Settings → Personal Access Tokens**.
3. Generate a fine-grained or classic token.
4. Grant read access to repositories.
5. Paste the token into the application.

The token is stored locally in your browser and is never committed to the repository.

---

## Available Scripts

```bash
npm run dev
```

Start the development server.

```bash
npm run build
```

Build the application for production.

```bash
npm run start
```

Run the production build.

```bash
npm run lint
```

Run ESLint.

---

## Roadmap

- AI-powered repository chat
- Semantic code search
- Repository indexing
- Chat history
- Markdown rendering
- Streaming AI responses
- Code explanation
- Repository insights
- Multi-repository support
- Deployment-ready production build

---

## Contributing

Contributions, suggestions, and issue reports are always welcome. If you'd like to improve the project, feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License.

---

## Author

**Amritansh Jaiswal**

- GitHub: https://github.com/amritansh333
- LinkedIn: https://www.linkedin.com/in/amritanshjaiswal/