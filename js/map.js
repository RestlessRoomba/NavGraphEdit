const MAX_NATIVE_ZOOM = 19;
const MAX_EDITOR_ZOOM = 23;

const osmLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxNativeZoom: MAX_NATIVE_ZOOM,
        maxZoom: MAX_EDITOR_ZOOM
    }
);

const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        maxNativeZoom: MAX_NATIVE_ZOOM,
        maxZoom: MAX_EDITOR_ZOOM
    }
);

export const map = L.map('map', {
    center: [50.98720771879944, 12.973063896924302],
    zoom: 19,
    maxZoom: MAX_EDITOR_ZOOM,
    layers: [osmLayer]
});

// Layer Names in Switch Menu
const baseMaps = {
    "Map": osmLayer,
    "Satellite": satelliteLayer
};

// Add Switch Button
L.control.layers(baseMaps).addTo(map);
