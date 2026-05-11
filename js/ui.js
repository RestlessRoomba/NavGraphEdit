import { state } from './state.js';
import { map } from './map.js';
import { exportGraph, importGraph } from './io.js';
import { createEdge } from './edges.js';
import { createNode } from './nodes.js';

// Node selection
export function selectNode(node) {
    state.selectedObject = node;
    console.log("Selected node: ", node.id);
    showInfoPanel(node);
}

// Edge selection
export function selectEdge(edge) {
    state.selectedObject = edge;
    console.log("Selected Edge: ", edge.id);
    showInfoPanel(edge);
}

export function setMarkerEditMode(active) {    // activated by Shift-Key-Listener -> UI
    state.nodes.forEach(node => {
        const el = node.marker.getElement();

        if (!el) return;    // in case of no markers

        if (active) {
            el.classList.add('transparent');
            el.classList.add('no-click');
        } else {
            el.classList.remove('transparent');
            el.classList.remove('no-click');
        }
    });
}

// Info Panel

// Show Info Panel
export function showInfoPanel(obj) {

    // Define objects via html reference
    const panel = document.getElementById("info-panel");
    const title = document.getElementById("info-title");
    const content = document.getElementById("info-content");

    panel.classList.remove("hidden");   // show

    if (obj.type === "node") {  // For Nodes
        title.textContent = "Node";

        // Write Names/Tags into the Panel
        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>Lat: ${obj.lat}</div>
            <div>Lng: ${obj.lng}</div>
            <div id="node-tags-container" style="margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <b>Tags / Names</b>
                    <button id="add-node-tag-btn" style="padding: 2px 6px;">+</button>
                </div>
                <div id="node-tags-list"></div>
            </div>
        `;

        // Render Names/Tags into the Panel
        const renderTags = () => {
            const list = document.getElementById("node-tags-list");
            if (!list) return;
            list.innerHTML = "";
            (obj.tags || []).forEach((tag, index) => {
                const row = document.createElement("div");
                row.style.marginTop = "5px";
                row.style.display = "flex";

                // creats field for input of tags 
                const input = document.createElement("input");
                input.type = "text";
                input.value = tag;
                input.placeholder = "z.B. Haus 1 Eingang";
                input.style.flex = "1";
                // updating the data
                input.addEventListener("input", (e) => {
                    obj.tags[index] = e.target.value;
                });

                // creates Button for delete of tags
                const delBtn = document.createElement("button");
                delBtn.textContent = "-";
                delBtn.style.marginLeft = "5px";
                delBtn.style.padding = "2px 6px";
                // removes a tag from array
                delBtn.addEventListener("click", () => {
                    obj.tags.splice(index, 1);
                    renderTags();
                });

                row.appendChild(input);
                row.appendChild(delBtn);
                list.appendChild(row);
            });
        };

        renderTags();

        // creats add-Button  
        const addBtn = document.getElementById("add-node-tag-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                if (!obj.tags) obj.tags = []; // if no Array -> create 
                obj.tags.push("");
                renderTags();
            });
        }
    }

    if (obj.type === "edge") {  // For Edges
        title.textContent = "Edge";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>From: ${obj.from}</div>
            <div>To: ${obj.to}</div>
            <div>Weight: ${obj.weight.toFixed(2)} m</div>

            <div>
                <label>
                    <input
                        type="checkbox"
                        id="wheelchair-checkbox"
                        ${obj.wheelchairAccessible !== false ? "checked" : ""}
                    >
                    Wheelchair accessible
                </label>
            </div>

            <div>
                <button id="split-edge-btn">Split Edge</button>
            </div>
        `;

        const checkbox = document.getElementById("wheelchair-checkbox");
        checkbox.addEventListener("change", function() {
            obj.wheelchairAccessible = this.checked;
            console.log("Wheelchair accessible: ", obj.wheelchairAccessible);
            if (obj.line) {
                obj.line.setStyle({ color: obj.wheelchairAccessible ? 'blue' : 'red' });
            }
        });

        const splitButton = document.getElementById("split-edge-btn");
        splitButton.addEventListener("click", function() {
            splitEdge(obj);
        });
    }
}

// Hide Info Panel
export function hideInfoPanel() {
    document.getElementById('info-panel').classList.add("hidden"); // hide
}

// Delete Button
document.getElementById('delete-btn').onclick = function () {
    if (!state.selectedObject) return;    // Safety, only for selected objects

    if (state.selectedObject.type === "node") { // If Node Selected
        deleteNode(state.selectedObject);

    } else if (state.selectedObject.type === "edge") {  // If Edge selected
        deleteEdge(state.selectedObject);
    }

    state.selectedObject = null;   // Reset selectedObject
    state.edgeStartNode = null;   // Reset StartNode
    hideInfoPanel();
};

// Delete Node
export function deleteNode(node) {
    if (node.marker) {
            map.removeLayer(node.marker); // Delete marker from map
        }

        // All connected Edges to the selected Node
        const edgesToRemove = state.edges.filter(e => e.from === node.id || e.to === node.id);

        // Delete connected Edges from map
        edgesToRemove.forEach(edge => {
            deleteEdge(edge);
        });

        // Delete Nodes from List
        state.nodes = state.nodes.filter(n => n.id !== node.id);
}

// Delete Edge
export function deleteEdge(edge) {
    if (edge.line) {
            map.removeLayer(edge.line);  // Delete Edge from map
        }

        // Delete Edge from List
        state.edges = state.edges.filter(e => e.id !== edge.id);
}

// Split Edge
export function splitEdge(edge) {
    // Find connected nodes of old edge
    const nodeA = state.nodes.find(n => n.id === edge.from);
    const nodeB = state.nodes.find(n => n.id === edge.to);
    if (!nodeA || !nodeB) return;   // Safety

    // Calculate middle
    const middleLat = (nodeA.lat + nodeB.lat) / 2;
    const middleLng = (nodeA.lng + nodeB.lng) / 2;

    // Create new node
    const newNode = createNode({
        lat: middleLat,
        lng: middleLng
    });

    // Delete the old edge
    deleteEdge(edge);   

    // Create two new edges
    createEdge(
        nodeA,
        newNode,
        undefined,
        edge.wheelchairAccessible
    );

    createEdge(
        newNode,
        nodeB,
        undefined,
        edge.wheelchairAccessible
    );

    state.selectedObject = null;
    hideInfoPanel();
}

// Export-Button
document.getElementById('export-btn').onclick = exportGraph;

// Load-Button
document.getElementById('load-btn').onclick = function () {
    document.getElementById('import-input').click();
};

// Import-Input
document.getElementById('import-input').onchange = function(event) {
    importGraph(event.target.files[0]); // Process browser-event and give file to IO
    event.target.value = "";    // Reset input value
};