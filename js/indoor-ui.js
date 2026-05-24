import { indoorState } from './indoor-state.js';
import { map } from './indoor-map.js';
import { exportGraph, importGraph } from './indoor-io.js';
import { createEdge } from './indoor-edges.js';
import { createNode } from './indoor-nodes.js';

export function selectNode(node) {
    indoorState.selectedObject = node;
    showInfoPanel(node);
}

export function selectEdge(edge) {
    indoorState.selectedObject = edge;
    showInfoPanel(edge);
}

export function setMarkerEditMode(active) {
    indoorState.nodes.forEach(node => {
        const el = node.marker.getElement();
        if (!el) return;

        if (active) {
            el.classList.add('transparent');
            el.classList.add('no-click');
        } else {
            el.classList.remove('transparent');
            el.classList.remove('no-click');
        }
    });
}

export function showInfoPanel(obj) {
    const panel = document.getElementById("info-panel");
    const title = document.getElementById("info-title");
    const content = document.getElementById("info-content");

    panel.classList.remove("hidden");

    if (obj.type === "node") {
        title.textContent = "Indoor Node";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>X: ${obj.x.toFixed(2)}</div>
            <div>Y: ${obj.y.toFixed(2)}</div>
            <div>Building: <input id="node-building" type="text" value="${obj.building || ''}" style="width:100px"/></div>
            <div>Floor: <input id="node-floor" type="text" value="${obj.floor || ''}" style="width:60px"/></div>
            <div id="node-tags-container" style="margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <b>Tags / Names</b>
                    <button id="add-node-tag-btn" style="padding: 2px 6px;">+</button>
                </div>
                <div id="node-tags-list"></div>
            </div>
        `;

        document.getElementById("node-building").addEventListener("input", e => {
            obj.building = e.target.value;
        });

        document.getElementById("node-floor").addEventListener("input", e => {
            obj.floor = e.target.value;
        });

        const renderTags = () => {
            const list = document.getElementById("node-tags-list");
            if (!list) return;
            list.innerHTML = "";
            (obj.tags || []).forEach((tag, index) => {
                const row = document.createElement("div");
                row.style.marginTop = "5px";
                row.style.display = "flex";

                const input = document.createElement("input");
                input.type = "text";
                input.value = tag;
                input.placeholder = "z.B. Hörsaal 1";
                input.style.flex = "1";
                input.addEventListener("input", (e) => {
                    obj.tags[index] = e.target.value;
                });

                const delBtn = document.createElement("button");
                delBtn.textContent = "-";
                delBtn.style.marginLeft = "5px";
                delBtn.style.padding = "2px 6px";
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

        const addBtn = document.getElementById("add-node-tag-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                if (!obj.tags) obj.tags = [];
                obj.tags.push("");
                renderTags();
            });
        }
    }

    if (obj.type === "edge") {
        title.textContent = "Indoor Edge";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>From: ${obj.from}</div>
            <div>To: ${obj.to}</div>
            <div>Weight: ${obj.weight.toFixed(2)} units</div>
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

export function hideInfoPanel() {
    document.getElementById('info-panel').classList.add("hidden");
}

document.getElementById('delete-btn').onclick = function () {
    if (!indoorState.selectedObject) return;

    if (indoorState.selectedObject.type === "node") {
        deleteNode(indoorState.selectedObject);
    } else if (indoorState.selectedObject.type === "edge") {
        deleteEdge(indoorState.selectedObject);
    }

    indoorState.selectedObject = null;
    indoorState.edgeStartNode = null;
    hideInfoPanel();
};

export function deleteNode(node) {
    if (node.marker) map.removeLayer(node.marker);

    const edgesToRemove = indoorState.edges.filter(e => e.from === node.id || e.to === node.id);
    edgesToRemove.forEach(edge => deleteEdge(edge));

    indoorState.nodes = indoorState.nodes.filter(n => n.id !== node.id);
}

export function deleteEdge(edge) {
    if (edge.line) map.removeLayer(edge.line);
    indoorState.edges = indoorState.edges.filter(e => e.id !== edge.id);
}

export function splitEdge(edge) {
    const nodeA = indoorState.nodes.find(n => n.id === edge.from);
    const nodeB = indoorState.nodes.find(n => n.id === edge.to);
    if (!nodeA || !nodeB) return;

    const midX = (nodeA.x + nodeB.x) / 2;
    const midY = (nodeA.y + nodeB.y) / 2;

    const newNode = createNode({ lat: midY, lng: midX });

    deleteEdge(edge);

    createEdge(nodeA, newNode, undefined, edge.wheelchairAccessible);
    createEdge(newNode, nodeB, undefined, edge.wheelchairAccessible);

    indoorState.selectedObject = null;
    hideInfoPanel();
}

// Export button
document.getElementById('export-btn').onclick = exportGraph;

// Load JSON button
document.getElementById('load-btn').onclick = function () {
    document.getElementById('import-input').click();
};

document.getElementById('import-input').onchange = function(event) {
    importGraph(event.target.files[0]);
    event.target.value = "";
};

