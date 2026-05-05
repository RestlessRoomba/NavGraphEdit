export const map = L.map('map').setView([50.98720771879944, 12.973063896924302], 16)   // Init map

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{  // Tile layer
    maxZoom: 19 // 19 is max supported by OpenStreetMap
}).addTo(map);
