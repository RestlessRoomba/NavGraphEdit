import { state } from './state.js';
import { map } from './map.js';
import { hideInfoPanel, setMarkerEditMode } from './ui.js';

// Tool switching
export function setTool(tool) {
    state.currentTool = tool;

    map.dragging.enable();  // Enable map dragging upon tool switch
    state.nodes.forEach(n => {    // Disable dragging upon tool switch
        if (n.marker) n.marker.dragging.disable();
    });

    state.edgeStartNode = null;
    state.selectedObject = null;
    hideInfoPanel();

    if (tool === "select") {
        map.getContainer().style.cursor = '';   // Cursor UI -> default
        setMarkerEditMode(false);   // leave Marker-Edit-Mode

    } else if (tool === "node") {
        map.getContainer().style.cursor = 'crosshair';  // Cursor UI -> crosshair
        setMarkerEditMode(true);    // enter Marker-Edit-Mode

    } else if (tool === "edge") {
        map.getContainer().style.cursor = '';   // Cursor UI -> default
        setMarkerEditMode(false);   // leave Marker-Edit-Mode

    }

    document.querySelectorAll('#toolbar button').forEach(btn => btn.classList.remove('active'));    // UI -> Deactivate every button
    document.getElementById(`tool-${tool}`).classList.add('active');    // UI -> Activate current tool
    console.log("Tool switched to: ", tool);
}

    // Upon click: call setTool(tool)
document.getElementById("tool-select").onclick = () => setTool("select");
document.getElementById("tool-node").onclick = () => setTool("node");
document.getElementById("tool-edge").onclick = () => setTool("edge");