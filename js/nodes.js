import { nodes, currentTool, ctrlPressed } from './state.js';
import { map } from './map.js';
import { generateUUID } from './main.js';
import { updateConnectedEdges } from './edges.js';
import { selectNode } from 'ui.js';

export function createNode(latlng) {
    const node = {
        id: generateUUID(),
        type: "node",
        lat: latlng.lat,
        lng: latlng.lng,
    };
    nodes.push(node)
    console.log(nodes);
    addNodeToMap(node);
}

function addNodeToMap(node) {
    const marker = L.marker([node.lat, node.lng], {
        draggable: false
    }).addTo(map);
    node.marker = marker;
    
    setTimeout(() => {
    const el = marker.getElement();
    if (el && currentTool === "node") {
        el.classList.add('transparent');
        el.classList.add('no-click');
    }
    }, 0);

    marker.on('click', function(e) { // Click on Marker
        L.DomEvent.stopPropagation(e); // Click on marker != click on map

        if (currentTool === "select") { // Node selection
            selectNode(node);

        } else if (currentTool === "node") {    // Ignore marker click in tool "node"
            return;

        } else if (currentTool === "edge") {  // Edge creation
            handleEdgeCreation(node);
        }
    });

    // Node Drag&Drop
    marker.on('dragend', function(e) {  // "dragend" instead "drag" -> single event computing (performance)
        if (!ctrlPressed || currentTool !== "select") return;   // Only with ctrl down and in select tool

        const latlng = e.target.getLatLng();
        node.lat = latlng.lat;
        node.lng = latlng.lng;
        updateConnectedEdges(node);
    });
}
