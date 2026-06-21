import { state, getActiveGraph } from './state.js';
import { getActiveMap } from './maps.js';
import { exportGraph, importGraph } from './io.js';
import { createEdge } from './edges.js';
import { createNode, updateNodeMarkerColor } from './nodes.js';
import { setMode } from './mode.js';
import { loadFloorplanForActiveFloor } from './floorplans.js';
import { renderActiveGraph, clearActiveGraphLayers } from './render.js';
import { 
    handlePortalEdgeNodeClick,
    cancelPortalEdgeCreation,
    removePortalEdgesForNode,
    deletePortalEdge,
    getPortalEdgeDisplayLabel
} from './portals.js';

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

// Portal Edge Error Helper
function getPortalEdgeFailureMessage(reason) {
    switch (reason) {
        case "same-graph":
            return "Both nodes are in the same graph. Use a normal Edge.";
        case "duplicate":
            return "This connection already exists.";
        case "node-not-found":
            return "Node not found.";
        default:
            return "Connection not possible.";
    }
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
            <div id="portal-edge-section" style="margin-top: 10px;">
                <button id="portal-edge-action-btn" style="width: 100%; padding: 4px 6px;"></button>
                <div id="portal-edge-feedback" style="margin-top: 6px; font-size: 13px;"></div>
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
                    updateNodeMarkerColor(obj);
                });

                // Creates Tag-Removal-Button
                const delBtn = document.createElement("button");
                delBtn.textContent = "-";
                delBtn.style.marginLeft = "5px";
                delBtn.style.padding = "2px 6px";
                // Removes a Tag from Array
                delBtn.addEventListener("click", () => {
                    obj.tags.splice(index, 1);
                    renderTags();
                    updateNodeMarkerColor(obj);
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
                renderTags();
                updateNodeMarkerColor(obj);
            });
        }

        // Portal Edge Section
        const feedback = document.getElementById("portal-edge-feedback");
        feedback.textContent = ""; // Reset

        const renderPortalEdgeButton = () => {
            const btn = document.getElementById("portal-edge-action-btn");
            if (!btn) return;

            if (state.portalEdgeStartNode === null) {
                btn.textContent = "Start Portal Edge Here";
                btn.disabled = false;

                btn.onclick = () => {
                    handlePortalEdgeNodeClick(obj);
                    updatePortalEdgeBanner();
                    renderPortalEdgeButton();
                };

            } else if (state.portalEdgeStartNode.id === obj.id) {
                btn.textContent = "Select another node...";
                btn.disabled = true;
                btn.onclick = null;

            } else {
                btn.textContent = "Connect Portal Edge Here";
                btn.disabled = false;

                btn.onclick = () => {
                    const result = handlePortalEdgeNodeClick(obj);

                    if (result?.success) {
                        feedback.textContent = "Portal Edge created.";
                        feedback.style.color = "green";
                        
                        // Render Portal Edge Menu if visible
                        const container = document.getElementById("portal-edges-container");
                        if (container && !container.classList.contains("hidden")) {
                            renderPortalEdgesList();
                        }

                    } else if (result && !result.success) {
                        feedback.textContent = getPortalEdgeFailureMessage(result.reason);
                        feedback.style.color = "#a33";
                    }

                    updatePortalEdgeBanner();
                    renderPortalEdgeButton();
                    renderPortalEdgesList();
                };
            }
        };

        renderPortalEdgeButton();
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

        // Delete connected Portal Edges
        removePortalEdgesForNode(node.id);
        renderPortalEdgesList();

        // Node is Portal Edge Start Node
        if (state.portalEdgeStartNode?.id === node.id) {
            state.portalEdgeStartNode = null;
            updatePortalEdgeBanner();
        }

        // Delete Nodes from List
        graph.nodes = graph.nodes.filter(n => n.id !== node.id);
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

// Get Active Building
function getActiveBuilding() {
    return state.indoor.buildings[state.indoor.activeBuildingId];
}

function getSortedFloorIds(building) {
    return Object.keys(building.floors).sort((a, b) => {
        const numA = Number(a);
        const numB = Number(b);

        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA - numB;
        }

        return a.localeCompare(b);
    });
}

function updateFloorLabel() {
    const label = document.getElementById("active-floor-label");

    if (label) {
        label.textContent = state.indoor.activeFloorId;
    }
}

// Building Switching -> Update Floorplan and load Content
async function reloadActiveIndoorView() {
    hideInfoPanel();

    state.selectedObject = null;
    state.edgeStartNode = null;

    updateBuildingSelect();
    updateFloorLabel();

    try {
        await loadFloorplanForActiveFloor();
    } catch (err) {
        console.error("Floorplan could not be loaded: ", err);
    }

    renderActiveGraph();
}

// Process Building Select
const buildingSelect = document.getElementById("building-select");

buildingSelect.onchange = async function(e) {
    if (state.mode !== "indoor") return;

    clearActiveGraphLayers();

    state.indoor.activeBuildingId = e.target.value;

    const building = getActiveBuilding();
    const floorIds = getSortedFloorIds(building);

    state.indoor.activeFloorId = floorIds.includes("+00") ? "+00" : floorIds[0];    // Always load +00 as default (or next known floor)

    await reloadActiveIndoorView();
};

// Floor Switching Buttons
async function switchFloor(direction) {
    if (state.mode !== "indoor") return;

    const building = getActiveBuilding();
    const floorIds = getSortedFloorIds(building);

    const currentIndex = floorIds.indexOf(state.indoor.activeFloorId);

    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= floorIds.length) {
        return;
    }

    clearActiveGraphLayers();

    state.indoor.activeFloorId = floorIds[nextIndex];

    await reloadActiveIndoorView();
}

document.getElementById("floor-prev-btn").onclick = function() {
    switchFloor(-1);
};

document.getElementById("floor-next-btn").onclick = function() {
    switchFloor(1);
};

// Portal Edge Section
export function updatePortalEdgeBanner() {
    const banner = document.getElementById("portal-edge-banner");
    if (!banner) return;

    banner.classList.toggle("hidden", state.portalEdgeStartNode === null);
}

document.getElementById("portal-edge-cancel-btn").onclick = function() {
    cancelPortalEdgeCreation();
    updatePortalEdgeBanner();

    if (state.selectedObject?.type === "node") {
        showInfoPanel(state.selectedObject);
    }
};

// Existing Portal Edges Menu
export function renderPortalEdgesList() {
    const listContainer = document.getElementById("portal-edges-list");
    if (!listContainer) return;

    listContainer.innerHTML = ""; // Empty

    if (!state.portalEdges || state.portalEdges.length === 0) {
        listContainer.innerHTML = `<div style="color: #888; text-align: center; padding: 10px;">No Portal Edges to display.</div>`;
        return;
    }

    state.portalEdges.forEach(edge => {
        const itemElement = document.createElement("div");
        itemElement.style.borderBottom = "1px solid #eee";
        itemElement.style.padding = "8px 4px";

        // Header
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.cursor = "pointer";

        const labelSpan = document.createElement("span");
        labelSpan.style.fontWeight = "500";
        labelSpan.textContent = getPortalEdgeDisplayLabel(edge);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.style.padding = "2px 6px";
        deleteBtn.style.backgroundColor = "#d9534f";
        deleteBtn.style.color = "white";
        deleteBtn.style.border = "none";
        deleteBtn.style.borderRadius = "3px";
        deleteBtn.style.cursor = "pointer";

        // Delete-Button Event Handler
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deletePortalEdge(edge.id);
            renderPortalEdgesList();
            renderActiveGraph();
        });

        header.appendChild(labelSpan);
        header.appendChild(deleteBtn);
        itemElement.appendChild(header);

        // Details (foldable)
        const details = document.createElement("div");
        details.classList.add("hidden");
        details.style.marginTop = "8px";
        details.style.padding = "8px";
        details.style.backgroundColor = "#f9f9f9";
        details.style.borderRadius = "4px";

        details.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 12px; color: #555; margin-bottom: 2px;">Name:</label>
                <input type="text" class="portal-name-input" value="${edge.name || ''}" style="width: 100%; box-sizing: border-box; padding: 4px;">
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 12px; color: #555; margin-bottom: 2px;">Weight (m):</label>
                <input type="number" step="0.1" class="portal-weight-input" value="${edge.weight || 0}" style="width: 100%; box-sizing: border-box; padding: 4px;">
            </div>
            <div>
                <label style="display: flex; align-items: center; font-size: 13px;">
                    <input type="checkbox" class="portal-wheelchair-checkbox" ${edge.wheelchairAccessible ? "checked" : ""} style="margin-right: 6px;">
                    Wheelchair accessible
                </label>
            </div>
        `;

        const nameInput = details.querySelector(".portal-name-input");
        const weightInput = details.querySelector(".portal-weight-input");
        const wheelchairCheckbox = details.querySelector(".portal-wheelchair-checkbox");

        nameInput.addEventListener("input", (e) => {
            edge.name = e.target.value;
            labelSpan.textContent = getPortalEdgeDisplayLabel(edge);
        });

        weightInput.addEventListener("input", (e) => {
            edge.weight = parseFloat(e.target.value) || 0;
        });

        wheelchairCheckbox.addEventListener("change", (e) => {
            edge.wheelchairAccessible = e.target.checked;
        });

        // Fold-Out-Toggle
        header.addEventListener("click", () => {
            details.classList.toggle("hidden");
        });

        itemElement.appendChild(details);
        listContainer.appendChild(itemElement);
    });
}

document.getElementById("toggle-portals-menu-btn").onclick = function() {
    const container = document.getElementById("portal-edges-container");
    if (!container) return;

    const isHidden = container.classList.toggle("hidden");

    this.classList.toggle("active", !isHidden);

    if (!isHidden) {
        renderPortalEdgesList();
    }
};
