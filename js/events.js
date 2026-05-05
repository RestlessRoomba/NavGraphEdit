import { map } from './map.js';
import { currentTool } from './state.js';
import { createNode } from './nodes.js';

map.on('click', function(e) {   // Click on Map
    if (currentTool === "node") {   // Node tool?
        createNode(e.latlng);
    }
});

// Key-listeners

// Shift Key Listener (Shortcut)
document.addEventListener('keydown', function(e) {  // Shift is down?
    if (e.key === 'Shift' && !shiftPressed) {
        shiftPressed = true;    // flip
        lastTool = currentTool; // save current tool
        setTool("node");
    }
});

document.addEventListener('keyup', function(e) {    // Shift is up?
    if (e.key === 'Shift') {
        shiftPressed = false;   // flip and
        setTool(lastTool); // switch back to last used tool
    }
});

// Ctrl Key Listener (Drag&Drop)
document.addEventListener('keydown', function(e) {  // Control is down?
    if (e.key === 'Control') {
        ctrlPressed = true; // flip

        if (currentTool === "select") {
            map.getContainer().style.cursor = 'move';   // Cursor UI move
            nodes.forEach(n => n.marker.dragging.enable()); // Enable dragging for each marker
            map.dragging.disable(); // Only drag markers, not the map
        }
    }
});

document.addEventListener('keyup', function(e) {    // Control is up?
    if (e.key === 'Control') {
        ctrlPressed = false;    // flip
        map.getContainer().style.cursor = '';   // Cursor UI default
        nodes.forEach(n => n.marker.dragging.disable()); // Disable dragging for each marker
        map.dragging.enable();  // Map draggable again
    }
});
