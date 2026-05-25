// Decide which Formula to use
export function calculateDistance(nodeA, nodeB) {
    const isOutdoor =
        nodeA.lat !== undefined &&
        nodeA.lng !== undefined &&
        nodeB.lat !== undefined &&
        nodeB.lng !== undefined;

    const isIndoor =
        nodeA.x !== undefined &&
        nodeA.y !== undefined &&
        nodeB.x !== undefined &&
        nodeB.y !== undefined;

    if (isOutdoor) {
        return calculateOutdoorDistance(nodeA, nodeB);
    }

    if (isIndoor) {
        return calculateIndoorDistance(nodeA, nodeB);
    }

    throw new Error("Cannot calculate distance: incompatible node coordinates.");
}

// Calculate Outdoor Distance (Haversine Formula)
function calculateOutdoorDistance(nodeA, nodeB) {
    const R = 6371000; // Earth radius in meters

    const lat1 = nodeA.lat * Math.PI / 180;
    const lat2 = nodeB.lat * Math.PI / 180;

    const deltaLat = (nodeB.lat - nodeA.lat) * Math.PI / 180;
    const deltaLng = (nodeB.lng - nodeA.lng) * Math.PI / 180;

    const a = 
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + 
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * 
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;   // Returns distance in meters
}

// Calculate Indoor Distance
function calculateIndoorDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;

    return Math.sqrt(dx * dx + dy * dy); // Returns distance in PIXELS (FIX!)
}
