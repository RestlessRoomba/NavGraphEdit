import { indoorState } from './indoor-state.js';
import { map } from './indoor-map.js';
import { generateUUID } from './utils.js';
import { handleEdgeCreation, updateConnectedEdges } from './indoor-edges.js';
import { selectNode, showInfoPanel } from './indoor-ui.js';

const customIcon = L.divIcon({
    className: 'custom-node-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

export function createNode(latlng, id = null) {
    const node = {
        id: id ?? generateUUID(),
        type: "node",
        x: latlng.lng,
        y: latlng.lat,
        tags: latlng.tags || [],
        building: indoorState.building,
        floor: indoorState.floor
    };

    indoorState.nodes.push(node);
    addNodeToMap(node);
    return node;
}

function addNodeToMap(node) {
    const marker = L.marker([node.y, node.x], {
        draggable: false,
        icon: customIcon
    }).addTo(map);

    node.marker = marker;

    setTimeout(() => {
        const el = marker.getElement();
        if (el && indoorState.currentTool === "node") {
            el.classList.add('transparent');
            el.classList.add('no-click');
        }
    }, 0);

    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);

        if (indoorState.currentTool === "select") {
            selectNode(node);
        } else if (indoorState.currentTool === "node") {
            return;
        } else if (indoorState.currentTool === "edge") {
            handleEdgeCreation(node);
        }
    });

    marker.on('dragend', function(e) {
        if (!indoorState.ctrlPressed || indoorState.currentTool !== "select") return;

        const latlng = e.target.getLatLng();
        node.x = latlng.lng;
        node.y = latlng.lat;
        updateConnectedEdges(node);
        showInfoPanel(node);
    });
}