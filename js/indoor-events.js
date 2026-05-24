import { map } from './indoor-map.js';
import { createNode } from './indoor-nodes.js';
import { setTool } from './indoor-tools.js';
import { indoorState } from './indoor-state.js';

map.on('click', function(e) {
    if (indoorState.currentTool === "node") {
        createNode(e.latlng);
    }
});

// Shift — быстро переключиться на node tool
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Shift' && !indoorState.shiftPressed) {
        indoorState.shiftPressed = true;
        indoorState.lastTool = indoorState.currentTool;
        setTool("node");
    }
});

document.addEventListener('keyup', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Shift') {
        indoorState.shiftPressed = false;
        setTool(indoorState.lastTool);
    }
});

// Ctrl — drag & drop nodes
document.addEventListener('keydown', function(e) {
    if (e.key === 'Control') {
        indoorState.ctrlPressed = true;

        if (indoorState.currentTool === "select") {
            map.getContainer().style.cursor = 'move';
            indoorState.nodes.forEach(n => n.marker.dragging.enable());
            map.dragging.disable();
        }
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'Control') {
        indoorState.ctrlPressed = false;
        map.getContainer().style.cursor = '';
        indoorState.nodes.forEach(n => n.marker.dragging.disable());
        map.dragging.enable();
    }
});