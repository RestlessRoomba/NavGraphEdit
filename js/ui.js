import { state, getActiveGraph } from './state.js';
import { getActiveMap } from './maps.js';
import { exportGraph, importGraph } from './io.js';
import { createEdge } from './edges.js';
import { createNode } from './nodes.js';
import { setMode } from './mode.js';

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
    const graph = getActiveGraph();

    graph.nodes.forEach(node => {
        const el = node.marker?.getElement();

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
        const positionHtml = obj.lat !== undefined && obj.lng !== undefined   //Decide between Indoor (X/Y) and Outdoor (Lat/Lng)
            ? `
                <div>Lat: ${obj.lat}</div>
                <div>Lng: ${obj.lng}</div>
            `
            : `
                <div>X: ${obj.x}</div>
                <div>Y: ${obj.y}</div>
            `;

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            ${positionHtml}
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
                    state.dirty = true;
                });

                // creates Button for delete of tags
                const delBtn = document.createElement("button");
                delBtn.textContent = "-";
                delBtn.style.marginLeft = "5px";
                delBtn.style.padding = "2px 6px";
                // removes a tag from array
                delBtn.addEventListener("click", () => {
                    obj.tags.splice(index, 1);
                    state.dirty = true;
                    renderTags();
                });

                row.appendChild(input);
                row.appendChild(delBtn);
                list.appendChild(row);
            });
        };

        renderTags();

        // creates add-Button  
        const addBtn = document.getElementById("add-node-tag-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                if (!obj.tags) obj.tags = []; // if no Array -> create 
                obj.tags.push("");
                state.dirty = true;
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
            state.dirty = true;
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
    const graph = getActiveGraph();
    const map = getActiveMap();

    if (node.marker) {
            map.removeLayer(node.marker); // Delete marker from map
            node.marker = null;
        }

        // All connected Edges to the selected Node
        const edgesToRemove = graph.edges.filter(e => e.from === node.id || e.to === node.id);

        // Delete connected Edges from map
        edgesToRemove.forEach(edge => {
            deleteEdge(edge);
        });

        // Delete Nodes from List
        graph.nodes = graph.nodes.filter(n => n.id !== node.id);

        state.dirty = true;
}

// Delete Edge
export function deleteEdge(edge) {
    const graph = getActiveGraph();
    const map = getActiveMap();

    if (edge.line) {
            map.removeLayer(edge.line);  // Delete Edge from map
            edge.line = null;
        }

        // Delete Edge from List
        graph.edges = graph.edges.filter(e => e.id !== edge.id);

        state.dirty = true;
}

// Split Edge
export function splitEdge(edge) {
    const graph = getActiveGraph();

    // Find connected nodes of old edge
    const nodeA = graph.nodes.find(n => n.id === edge.from);
    const nodeB = graph.nodes.find(n => n.id === edge.to);

    if (!nodeA || !nodeB) return;   // Safety

    let newNode;

    if (nodeA.lat !== undefined && nodeA.lng !== undefined) {
        // Calculate middle
        const middleLat = (nodeA.lat + nodeB.lat) / 2;
        const middleLng = (nodeA.lng + nodeB.lng) / 2;

        // Create new node
        newNode = createNode({
            lat: middleLat,
            lng: middleLng
        });

    } else {
        const middleX = (nodeA.x + nodeB.x) / 2;
        const middleY = (nodeA.y + nodeB.y) / 2;

        newNode = createNode({
            x: middleX,
            y: middleY
        });
    }

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
    state.edgeStartNode = null;
    state.dirty = true;
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

// Version Input
const versionInput = document.getElementById("graph-version-input");
const incrementVersionButton = document.getElementById("increment-version-btn");
const decrementVersionButton = document.getElementById("decrement-version-btn");

versionInput.value = state.graphVersion;

versionInput.addEventListener("input", function() {
    const value = Number(versionInput.value);

    if (!Number.isInteger(value) || value < 1) {
        versionInput.value = state.graphVersion;
        return;
    }
    
    state.graphVersion = value;
    updateVersionInput();
});

// Update Version Input
export function updateVersionInput() {
    if (versionInput) {
        versionInput.value = state.graphVersion;
    }

    if (decrementVersionButton) {
        decrementVersionButton.disabled = state.graphVersion <= 1;
    }
}

// Increment Version Button
incrementVersionButton.onclick = function() {
    state.graphVersion += 1;
    updateVersionInput();
};

// Decrement Version Button
decrementVersionButton.onclick = function() {
    if (state.graphVersion <= 1) return;

    state.graphVersion -= 1;
    updateVersionInput();
};

// Mode Switching
document.getElementById("mode-outdoor-btn").onclick = () => setMode("outdoor");
document.getElementById("mode-indoor-btn").onclick = () => setMode("indoor");

// Update Building Select -> Fill Building Drop Down Menu
export function updateBuildingSelect() {
    const select = document.getElementById("building-select");

    if (!select) return;

    select.innerHTML = "";

    Object.entries(state.indoor.buildings).forEach(([buildingId, building]) => {
        const option = document.createElement("option");

        option.value = buildingId;
        option.textContent = building.name ?? buildingId;

        if (buildingId === state.indoor.activeBuildingId) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}

// Process Building Select
const buildingSelect = document.getElementById("building-select");

buildingSelect.onchange = function(e) {
    if (state.dirty) {
        const shouldExport = confirm(
            "There are unsaved changes. Export before switching building?"
        );

        if (shouldExport) {
            exportGraph();
        }
    }

    state.indoor.activeBuildingId = e.target.value;

    const building =
        state.indoor.buildings[state.indoor.activeBuildingId];

    state.indoor.activeFloorId =
        Object.keys(building.floors)[0];

    const floorLabel =
        document.getElementById("active-floor-label");

    if (floorLabel) {
        floorLabel.textContent = state.indoor.activeFloorId;
    }

    state.selectedObject = null;
    state.edgeStartNode = null;

    hideInfoPanel();
};
