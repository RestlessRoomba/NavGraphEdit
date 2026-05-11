import { state } from './state.js';
import { map } from './map.js';
import { generateUUID } from './utils.js';
import { handleEdgeCreation, updateConnectedEdges } from './edges.js';
import { selectNode, showInfoPanel } from './ui.js';

const customIcon = L.divIcon({
    className: 'custom-node-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

export function createNode(latlng, id = null) {
    const node = {
        id: id ?? generateUUID(),   // Only if no UUID was passed
        type: "node",
        lat: latlng.lat,
        lng: latlng.lng,
        tags: latlng.tags || [],
    };
    state.nodes.push(node)
    console.log(state.nodes);
    addNodeToMap(node);
    return node;
}

function addNodeToMap(node) {
    const marker = L.marker([node.lat, node.lng], {
        draggable: false,
        icon: customIcon
    }).addTo(map);
    node.marker = marker;
    
    setTimeout(() => {
    const el = marker.getElement();
    if (el && state.currentTool === "node") {
        el.classList.add('transparent');
        el.classList.add('no-click');
    }
    }, 0);

    marker.on('click', function(e) { // Click on Marker
        L.DomEvent.stopPropagation(e); // Click on marker != click on map

        if (state.currentTool === "select") { // Node selection
            selectNode(node);

        } else if (state.currentTool === "node") {    // Ignore marker click in tool "node"
            return;

        } else if (state.currentTool === "edge") {  // Edge creation
            handleEdgeCreation(node);
        }
    });

    // Node Drag&Drop
    marker.on('dragend', function(e) {  // "dragend" instead "drag" -> single event computing (performance)
        if (!state.ctrlPressed || state.currentTool !== "select") return;   // Only with ctrl down and in select tool

        const latlng = e.target.getLatLng();
        node.lat = latlng.lat;
        node.lng = latlng.lng;
        updateConnectedEdges(node);
        showInfoPanel(node);
    });
}
