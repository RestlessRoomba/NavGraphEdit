import { map } from './map.js';
import { createNode } from './nodes.js';
import { setTool } from './tools.js';
import { state } from './state.js';

map.on('click', function(e) {   // Click on Map
    if (state.currentTool === "node") {   // Node tool?
        createNode(e.latlng);
    }
});

// Key-listeners

// Shift Key Listener (Shortcut)
document.addEventListener('keydown', function(e) {  // Shift is down?
    // Disable shortcuts if typing
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Shift' && !state.shiftPressed) {
        state.shiftPressed = true;    // flip
        state.lastTool = state.currentTool; // save current tool
        setTool("node");
    }
});

document.addEventListener('keyup', function(e) {    // Shift is up?
    // Disable shortcuts if typing
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Shift') {
        state.shiftPressed = false;   // flip and
        setTool(state.lastTool); // switch back to last used tool
    }
});

// Ctrl Key Listener (Drag&Drop)
document.addEventListener('keydown', function(e) {  // Control is down?
    if (e.key === 'Control') {
        state.ctrlPressed = true; // flip

        if (state.currentTool === "select") {
            map.getContainer().style.cursor = 'move';   // Cursor UI move
            state.nodes.forEach(n => n.marker.dragging.enable()); // Enable dragging for each marker
            map.dragging.disable(); // Only drag markers, not the map
        }
    }
});

document.addEventListener('keyup', function(e) {    // Control is up?
    if (e.key === 'Control') {
        state.ctrlPressed = false;    // flip
        map.getContainer().style.cursor = '';   // Cursor UI default
        state.nodes.forEach(n => n.marker.dragging.disable()); // Disable dragging for each marker
        map.dragging.enable();  // Map draggable again
    }
});
