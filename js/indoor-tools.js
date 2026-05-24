import { indoorState } from './indoor-state.js';
import { map } from './indoor-map.js';
import { hideInfoPanel, setMarkerEditMode } from './indoor-ui.js';

export function setTool(tool) {
    indoorState.currentTool = tool;

    map.dragging.enable();
    indoorState.nodes.forEach(n => {
        if (n.marker) n.marker.dragging.disable();
    });

    indoorState.edgeStartNode = null;
    indoorState.selectedObject = null;
    hideInfoPanel();

    if (tool === "select") {
        map.getContainer().style.cursor = '';
        setMarkerEditMode(false);

    } else if (tool === "node") {
        map.getContainer().style.cursor = 'crosshair';
        setMarkerEditMode(true);

    } else if (tool === "edge") {
        map.getContainer().style.cursor = '';
        setMarkerEditMode(false);
    }

    document.querySelectorAll('#toolbar button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${tool}`).classList.add('active');
}

document.getElementById("tool-select").onclick = () => setTool("select");
document.getElementById("tool-node").onclick = () => setTool("node");
document.getElementById("tool-edge").onclick = () => setTool("edge");