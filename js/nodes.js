import { state, getActiveGraph } from './state.js';
import { getActiveMap } from './maps.js';
import { generateUUID } from './utils.js';
import { handleEdgeCreation, updateConnectedEdges } from './edges.js';
import { selectNode, showInfoPanel } from './ui.js';
import { isLatLngInsideActiveFloorplan } from './floorplans.js';

const customIcon = L.divIcon({
    className: 'custom-node-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

// Check if Node has Non-Empty Tags
export function nodeHasNonEmptyTags(node) {
    return Array.isArray(node.tags) && node.tags.some(tag => typeof tag === 'string' && tag.trim().length > 0);
}

// Update Color of Node with Non-Empty Tag 
export function updateNodeMarkerColor(node) {
    const markerElement = node.marker?.getElement();
    if (!markerElement) return;

    if (nodeHasNonEmptyTags(node)) {
        markerElement.classList.add('node-has-tags');
    } else {
        markerElement.classList.remove('node-has-tags');
    }
}

// Create Node
export function createNode(
    position,
    id = null,
    tags = [],
    graph = getActiveGraph(),
    render = true
) {
    const node = {
        id: id ?? generateUUID(),   // Generate new UUID if none was passed
        type: "node",
        tags: tags ?? []    // Empty Tags if none were passed
    };

    if (position.x !== undefined && position.y !== undefined) {
        node.x = position.x;
        node.y = position.y;
        
    } else if (state.mode === "indoor" && position.lat !== undefined && position.lng !== undefined) {
        node.x = position.lng;
        node.y = position.lat;

    } else if (position.lat !== undefined && position.lng !== undefined) {
        node.lat = position.lat;
        node.lng = position.lng;

    } else {
        throw new Error("Invalid node position. Expected lat/lng or x/y.")
    }

    graph.nodes.push(node);

    if (render) {
        addNodeToMap(node);
    }

    return node;
}

// Add Node to Map
export function addNodeToMap(node) {
    const map = getActiveMap();
    const markerPosition = getMarkerPosition(node);

    const marker = L.marker(markerPosition, {   // Place Marker on Map
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

        updateNodeMarkerColor(node);
    }, 0);

    // Click on Marker
    marker.on('click', function(e) {
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

        if (state.mode === "indoor") {
            if (!isLatLngInsideActiveFloorplan(latlng)) {
                marker.setLatLng(getMarkerPosition(node));
                console.log("Target out of bounds. Node not moved.");
                return;
            }
        }

        if (isOutdoorNode(node)) {  // Outdoor
            node.lat = latlng.lat;  // -> use Lat/Lng
            node.lng = latlng.lng;
        } else {                    // Indoor
            node.x = latlng.lng;    // -> use X/Y
            node.y = latlng.lat;
        }
        updateConnectedEdges(node);

        if (state.selectedObject === node) {
            showInfoPanel(node);
        }
    });
}

// Remove Node From Map
export function removeNodeFromMap(node) {
    const map = getActiveMap();

    if (node.marker) {
        map.removeLayer(node.marker);
        node.marker = null;
    }
}

// Get Marker Position
export function getMarkerPosition(node) {
    if (isOutdoorNode(node)) {
        return [node.lat, node.lng];
    }

    return [node.y, node.x];
}

export function isOutdoorNode(node) {
    return node.lat !== undefined && node.lng !== undefined;
}
