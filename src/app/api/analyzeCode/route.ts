import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Exclude lists
const excludeList = [
    "node_modules", ".npm", ".yarn", ".pnp", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "dist", "build", "out", ".next", ".vercel", ".turbo", "coverage", ".expo", ".expo-shared",
    "cypress/screenshots", "cypress/videos",
    "vite.config.js", "vite.config.ts", "next.config.js", "next.config.mjs", "webpack.config.js",
    "babel.config.js", ".babelrc", "tsconfig.json", "jsconfig.json", ".eslintrc.js", ".eslintignore",
    ".prettierrc", ".prettierignore", ".editorconfig", ".stylelintrc", ".lintstagedrc",
    ".env", ".env.local", ".env.development", ".env.production", ".env.test",
    "npm-debug.log", "yarn-error.log", "pnpm-debug.log", ".DS_Store", "Thumbs.db", "debug.log",
    "public", "assets", "static", "favicon.ico", "logo192.png", "logo512.png",
    ".github", ".gitlab", ".circleci", ".husky", "jest.config.js", "jest.setup.js",
    ".vscode", ".idea", ".project", ".settings", ".classpath", ".factorypath",
    ".git", ".gitignore", ".gradle", "gradle", "gradlew", "gradlew.bat", "settings.gradle", "settings.gradle.kts", "build.gradle", "build.gradle.kts", "local.properties",
    "proguard-rules.pro"
];

const excludeExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
    ".ttf", ".woff", ".woff2", ".otf", ".eot",
    ".mp4", ".mp3", ".wav", ".mov", ".avi",
    ".zip", ".rar", ".tar.gz", ".dll", ".exe",
];

// Function to recursively delete excluded files and directories
const deleteExcludedFiles = (dir: string) => {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        // Check if the file or directory matches the exclude list or extensions
        if (
            excludeList.some((excluded) => fullPath.includes(excluded)) ||
            excludeExtensions.includes(path.extname(file))
        ) {
            fs.rmSync(fullPath, { recursive: true, force: true }); // Delete the file or directory
            return;
        }

        // If it's a directory, recursively process it
        if (fs.statSync(fullPath).isDirectory()) {
            deleteExcludedFiles(fullPath);
        }
    });
};

const getFiles = (dir: string, baseDir: string, files: { name: string; content: string }[] = []): { name: string; content: string }[] => {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        // Skip excluded files and directories
        if (
            excludeList.some((excluded) => fullPath.includes(excluded)) ||
            excludeExtensions.includes(path.extname(file))
        ) {
            return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, baseDir, files); // Recursively process subdirectories
        } else {
            try {
                const relativePath = path.relative(baseDir, fullPath); // Get relative path from 'project/'
                const content = fs.readFileSync(fullPath, "utf8"); // Read file contents
                files.push({ name: relativePath, content });
            } catch (err) {
                console.error(`Error reading file ${fullPath}: ${err}`);
            }
        }
    });
    return files;
};

export async function POST(req: Request) {
    try {
        const { repoUrl } = await req.json();

        // Hardcoded repo name and directories
        const repoName = "project";
        const finalReadme = "finalReadme";
        const projectDir = path.join(process.cwd(), repoName);
        const finalReadmeDir = path.join(process.cwd(), finalReadme);

        // Forcefully remove existing directories
        try {
            fs.rmSync(projectDir, { recursive: true, force: true });
            fs.rmSync(finalReadmeDir, { recursive: true, force: true });
        } catch (err) {
            console.error("Error removing directories:", err);
        }

        // Forcefully clone the repository
        try {
            execSync(`git clone "${repoUrl}" "${projectDir}"`);
        } catch (err) {
            console.error("Error cloning repository:", err);
            return NextResponse.json({ error: "Failed to clone repository" }, { status: 500 });
        }

        // Delete excluded files and directories
        deleteExcludedFiles(projectDir);

        // Process files
        const filesList = getFiles(projectDir, projectDir);

        let readmeContent = `# ${repoName}\n\n## File List\n\n`;
        filesList.forEach(({ name }) => {
            readmeContent += `- ${name}\n`;
        });

        readmeContent += `\n## File Contents\n\n`;
        filesList.forEach(({ name, content }) => {
            readmeContent += `### ${name}\n\`\`\`\n${content}\n\`\`\`\n\n`;
        });

        // Create finalReadme directory and write README
        fs.mkdirSync(finalReadmeDir, { recursive: true });
        fs.writeFileSync(path.join(finalReadmeDir, "README.md"), readmeContent, "utf8");

        return NextResponse.json({ success: true, message: "README generated!", repo: repoName });
    } catch (error: any) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}