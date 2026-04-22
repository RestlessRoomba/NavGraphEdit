let nodes = [];
const map = L.map('map').setView([50.98720771879944, 12.973063896924302], 16)

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19
}).addTo(map);

function generateUUID(){
    return crypto.randomUUID();
}