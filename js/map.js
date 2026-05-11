const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{  // Tile layer
    maxZoom: 19 // 19 is max supported by OpenStreetMap
})

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
});

export const map = L.map('map', {
    center: [50.98720771879944, 12.973063896924302],
    zoom: 19,
    layers: [osmLayer]
})  // Init map

// names of layers in swith-button
const baseMaps = {
    "Map": osmLayer,
    "Satellite": satelliteLayer
};

// add switch-button
L.control.layers(baseMaps).addTo(map);