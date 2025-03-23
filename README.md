
# 💡 Tinkhack

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://www.example.com/version)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://www.example.com/build)

A Next.js project for analyzing GitHub codebases with AI-powered insights.

## Features

*   🔧 **Codebase Analysis:** Analyze the structure and content of GitHub repositories.
*   🤖 **AI Chatbot:** Interact with an AI chatbot for codebase explanations.
*   📝 **Code Summarization:** Generate summaries of codebases based on user roles.
*   📊 **Diagram Generation:** Create Mermaid.js diagrams to visualize code relationships.
*   🌳 **File Structure Visualization:** Display the file structure of a repository in a collapsible tree.
*   🚀 **Easy Setup:** Simple installation and configuration process.
*   🔒 **Role-Based Insights:** Tailored analysis and summaries based on user roles.

## Tech Stack

| Category   | Technologies                                   |
|------------|------------------------------------------------|
| Frontend   | [React][react-url], [Next.js][nextjs-url], [Tailwind CSS][tailwindcss-url]  |
| AI         | [Google Generative AI][generative-ai-url]       |
| Diagram    | [Mermaid.js][mermaid-url] |
| Other      | [html2canvas][html2canvas-url], [React Icons][react-icons-url] |
| Linting | [ESLint][eslint-url] |
| Typescript | [Typescript][typescript-url] |

## Quick Start

### Prerequisites

*   [Node.js][nodejs-url] (>=18.x)
*   [npm][npm-url] or [Yarn][yarn-url]
*   [Google Cloud Account][google-cloud-url]

### Installation

bash
git clone [repo-url]
cd tinkhack
npm install  # or yarn install


### Environment Variables

Create a `.env.local` file in the root directory and add the following environment variable:

env
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY


> [!NOTE]
> Obtain a Google API key from the [Google Cloud Console][google-cloud-console-url].

## Development

### Commands

bash
npm run dev    # Start the development server
yarn dev    # alternative

npm run build  # Create a production build
yarn build  # alternative

npm run lint   # Run ESLint for code linting
yarn lint   # alternative

npm run start  # Start the production server
yarn start  # alternative


### Testing

The project does not currently have dedicated unit, integration, or E2E tests.  Testing is performed through manual review and debugging during development.

## API Reference

| Method | Endpoint             | Body                    | Response                                       |
|--------|----------------------|-------------------------|------------------------------------------------|
| POST   | `/api/analyzeCode`    | `{ repoUrl: string }`   | `{ success: boolean, message: string }`        |
| POST   | `/api/chatbot`       | `{ message: string, role: string }`| `{ reply: string }`                            |
| POST   | `/api/diagram`       | `{}`         | `{ analysis: string }`                             |
| POST   | `/api/summarizer`      | `{ role: string }`| `{ summary: string, role: string }`                             |
| GET    | `/api/folderStructure` | N/A                     | `[ { type: string, name: string, children?: any[] } ]` |

> [!NOTE]
>  The `/api/diagram` endpoint is a POST, but doesn't require a body.  It processes the stored `README.md`.

## Deployment

### Dockerfile

dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]


### Platform Guides

*   **Vercel:** Refer to the [Next.js deployment documentation][nextjs-deploy-vercel-url] for deploying on Vercel.
*   **Netlify:** Follow the instructions in the [Netlify documentation][netlify-docs-url] to deploy the project.
*   **AWS:** Consult the [AWS documentation][aws-docs-url] for deploying on AWS.

## Contributing

### Branch Naming Convention

*   `feat/feature-name`: For new features.
*   `bugfix/issue-description`: For bug fixes.
*   `chore/task-description`: For general tasks (e.g., documentation updates).

### Commit Message Standards

Use the following format:


feat(component): Add new feature

Detailed description of the feature.


### PR Template Requirements

*   Include a clear title and description of the changes.
*   Reference any related issues.
*   Ensure all tests pass.
*   Provide screenshots or screen recordings if applicable.

[react-url]: https://react.dev/
[nextjs-url]: https://nextjs.org/
[nodejs-url]: https://nodejs.org/
[npm-url]: https://www.npmjs.com/
[yarn-url]: https://yarnpkg.com/
[tailwindcss-url]: https://tailwindcss.com/
[express-url]: https://expressjs.com/
[generative-ai-url]: https://ai.google.dev/
[mongodb-url]: https://www.mongodb.com/
[docker-url]: https://www.docker.com/
[google-cloud-console-url]: https://console.cloud.google.com/
[netlify-docs-url]: https://docs.netlify.com/
[aws-docs-url]: https://aws.amazon.com/documentation/
[nextjs-deploy-vercel-url]: https://nextjs.org/docs/deployment
[mermaid-url]: https://mermaid.js.org/
[html2canvas-url]: https://html2canvas.hertzen.com/
[react-icons-url]: https://react-icons.github.io/react-icons/
[eslint-url]: https://eslint.org/
[typescript-url]: https://www.typescriptlang.org/
