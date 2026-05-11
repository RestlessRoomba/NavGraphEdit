// Calculate Distance
export function calculateDistance(nodeA, nodeB) {
    const R = 6371000; // Earth radius in meters

    const lat1 = nodeA.lat * Math.PI / 180;
    const lat2 = nodeB.lat * Math.PI / 180;

    const deltaLat = (nodeB.lat - nodeA.lat) * Math.PI / 180;
    const deltaLng = (nodeB.lng - nodeA.lng) * Math.PI / 180;

    const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat) + 
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * 
    Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;   // Returns distance in meters
}