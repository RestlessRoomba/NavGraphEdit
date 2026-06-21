import { state, findNodeLocation } from './state.js';
import { generateUUID } from './utils.js';

// Build readable Label for Location
export function getLocationLabel(location) {
    if (location.type === "outdoor") return "Outdoor";

    const building = state.indoor.buildings[location.buildingId];
    const buildingName = building?.name ?? location.buildingId;

    return `${buildingName} ${location.floorId}`;
}

// Build readable Label for Portal Edge
export function getPortalEdgeAutoLabel(portalEdge) {
    return `${getLocationLabel(portalEdge.from.location)} <-> ${getLocationLabel(portalEdge.to.location)}`;
}

// Build Custom Label (Default: Auto-Label)
export function getPortalEdgeDisplayLabel(portalEdge) {
    if (portalEdge.name && portalEdge.name.trim().length > 0) {
        return portalEdge.name;
    }

    return getPortalEdgeAutoLabel(portalEdge);
}

// Does a Portal Edge already exist?
function portalEdgeExists(nodeIdA, nodeIdB) {
    return state.portalEdges.some(edge =>
        (edge.from.nodeId === nodeIdA && edge.to.nodeId === nodeIdB) ||
        (edge.from.nodeId === nodeIdB && edge.to.nodeId === nodeIdA)
    );
}

// Create Portal Edge
export function createPortalEdge(nodeIdA, nodeIdB) {
    if (nodeIdA === nodeIdB) {
        console.log("Abort. Same node.");
        return { success: false, reason: "same-node" };
    }

    const resolvedA = findNodeLocation(nodeIdA);
    const resolvedB = findNodeLocation(nodeIdB);

    if (!resolvedA || !resolvedB) {
        console.log("Abort. Node not found.")
        return { success: false, reason: "node-not-found" };
    }

    // Nodes in same Graph?
    const sameGraph = 
    resolvedA.location.type === resolvedB.location.type && 
    (resolvedA.location.type === "outdoor" || 
        (resolvedA.location.buildingId === resolvedB.location.buildingId && 
            resolvedA.location.floorId === resolvedB.location.floorId));

    if (sameGraph) {
        console.log("Abort. Nodes in same Graph.");
        return {success: false, reason: "same-graph" };
    }

    if (portalEdgeExists(nodeIdA, nodeIdB)) {
        console.log("Abort. Portal Edge already exists.")
        return { success: false, reason: "duplicate" };
    }

    const portalEdge = {
        id: generateUUID(),
        type: "portalEdge",

        name: "",
        weight: 0,
        wheelchairAccessible: true,

        from: { nodeId: nodeIdA, location: resolvedA.location },
        to: { nodeId: nodeIdB, location: resolvedB.location }
    };

    state.portalEdges.push(portalEdge);
    console.log("Success. Portal Edge created.")
    return { success: true, portalEdge };
}

// Delete Portal Edge
export function deletePortalEdge(id) {
    state.portalEdges = state.portalEdges.filter(edge => edge.id !== id);
}

// Delete Portal Edge that is connected to a certain Node
export function removePortalEdgesForNode(nodeId) {
    state.portalEdges = state.portalEdges.filter(edge => 
        edge.from.nodeId !== nodeId && edge.to.nodeId !== nodeId);
}

// Portal Edge Connection Handler
export function handlePortalEdgeNodeClick(node) {
    // First Node
    if (state.portalEdgeStartNode === null) {
        state.portalEdgeStartNode = node;
        return null;
    }

    // Same Node
    if (state.portalEdgeStartNode.id === node.id) {
        return null;
    }

    // Second Node
    const result = createPortalEdge(state.portalEdgeStartNode.id, node.id);

    if (result.success) {
        state.portalEdgeStartNode = null;
    }

    return result;
}

// Cancel Portal Edge Creation
export function cancelPortalEdgeCreation() {
    state.portalEdgeStartNode = null;
}
