import './events.js';
import './tools.js';
import './ui.js';
import './nodes.js';
import './edges.js';

import { setTool } from './tools.js';

// UUID Generator
function generateUUID() {
    return crypto.randomUUID();
}

export {generateUUID};

setTool("select");
