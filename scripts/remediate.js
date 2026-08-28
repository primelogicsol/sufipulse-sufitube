const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\Fayaz\\Sufipulseupdate2026\\Sufipulseupdate';

function processFile(filePath, replacer) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = replacer(content);
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

processFile(path.join(projectRoot, 'app/components/releases/GlobalReachStrip.tsx'), content => {
    return content.replace(
        /const url = isManualRefresh\s*\n\s*\? `\/api\/public\/youtube\/global-reach\?refresh=1&t=\$\{Date\.now\(\)\}`\s*\n\s*: `\/api\/public\/youtube\/global-reach\?t=\$\{Date\.now\(\)\}`;/g,
        'const url = isManualRefresh \n        ? `/api/public/youtube/global-reach?refresh=1&t=${Date.now()}` \n        : `/api/public/youtube/global-reach`;'
    );
});

processFile(path.join(projectRoot, 'app/(public)/releases/page.tsx'), content => {
    return content.replace(
        /const url = `\/api\/releases\?status=published&t=\$\{Date\.now\(\)\}\$\{refresh \? '&refresh=1' : ''\}`;/g,
        'const url = `/api/releases?status=published${refresh ? \'&forceHydrate=1\' : \'\'}`;'
    );
});

const publicLayoutPath = path.join(projectRoot, 'app/(public)/layout.tsx');
if (!fs.existsSync(publicLayoutPath)) {
    fs.writeFileSync(publicLayoutPath, `import { Layout } from '@/app/components/layout/Layout';\n\nexport default function PublicLayout({ children }: { children: React.ReactNode }) {\n  return <Layout>{children}</Layout>;\n}\n`);
    console.log(`Created ${publicLayoutPath}`);
}

function removeLayoutWrapper(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeLayoutWrapper(fullPath);
        } else if (file.endsWith('.tsx') && file !== 'layout.tsx') {
            processFile(fullPath, content => {
                let newContent = content;
                newContent = newContent.replace(/import\s*{\s*Layout\s*}\s*from\s*['"].*?\/components\/layout\/Layout['"];?\n/g, '');
                newContent = newContent.replace(/<Layout>/g, '<>');
                newContent = newContent.replace(/<\/Layout>/g, '</>');
                return newContent;
            });
        }
    }
}
removeLayoutWrapper(path.join(projectRoot, 'app/(public)'));

const studioComponentsPath = path.join(projectRoot, 'app/components/studio/StudioLayoutComponents.tsx');
const workflowRoadmapPath = path.join(projectRoot, 'app/components/studio/StudioWorkflowRoadmap.tsx');
if (fs.existsSync(studioComponentsPath) && !fs.existsSync(workflowRoadmapPath)) {
    let content = fs.readFileSync(studioComponentsPath, 'utf-8');
    
    const workflowMatch = content.match(/interface StudioWorkflowRoadmapProps \{[\s\S]*?export function StudioWorkflowRoadmap.*?\{[\s\S]*?\}\n\}/);
    
    if (workflowMatch) {
        const workflowContent = `"use client";\n\nimport React from 'react';\nimport { LucideIcon, ArrowRight } from 'lucide-react';\nimport { Badge } from '../primitives/Badge';\nimport { Section } from '../layout/Section';\nimport { PageContainer } from '../layout/PageContainer';\n\n${workflowMatch[0]}`;
        fs.writeFileSync(workflowRoadmapPath, workflowContent);
        console.log(`Created ${workflowRoadmapPath}`);
        
        content = content.replace(workflowMatch[0], '');
        content = content.replace(/"use client";\n\n/, '');
        content += `\nexport { StudioWorkflowRoadmap } from './StudioWorkflowRoadmap';\n`;
        fs.writeFileSync(studioComponentsPath, content);
        console.log(`Updated ${studioComponentsPath}`);
    }
}
