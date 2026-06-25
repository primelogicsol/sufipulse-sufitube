import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dataPath = path.join(process.cwd(), '.data', 'knowledge-registry.json');
        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({ nodes: [], relationships: [] });
        }
        const fileContents = fs.readFileSync(dataPath, 'utf8');
        let entities = JSON.parse(fileContents);
        if (Array.isArray(entities)) {
            entities = entities.map(e => ({ ...e, class: e.class || e.type }));
        }
        // Map array of entities to nodes so the client gets { nodes: [...] }
        return NextResponse.json({ nodes: Array.isArray(entities) ? entities : [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
