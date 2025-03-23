# Tinkhack Project

## Overview
Tinkhack is a project designed to analyze and visualize code structures using generative AI. It provides endpoints for code analysis and components for visualizing the results in various formats.

## Project Structure
```
tinkhack
├── src
│   ├── app
│   │   └── api
│   │       └── geminiAnalyze
│   │           └── route.ts
│   ├── components
│   │   ├── LowLevelDiagram.tsx
│   │   └── ClassDiagram.tsx
├── package.json
├── tsconfig.json
└── README.md
```

## Features
- **API Endpoint**: The `geminiAnalyze` endpoint processes incoming code and generates an analysis using Google Generative AI.
- **Low-Level Diagram**: The `LowLevelDiagram` component visualizes low-level structures of the analyzed code using the React Flow library.
- **Class Diagram**: The `ClassDiagram` component (to be implemented) will visualize class structures, methods, and relationships based on the analysis.

## Installation
To install the project dependencies, run:
```
npm install
```

## Usage
To start the development server, use:
```
npm start
```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.