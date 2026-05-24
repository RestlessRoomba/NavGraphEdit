import { setTool } from './indoor-tools.js';
import { setFloorplan } from './indoor-map.js';
import './indoor-events.js';
import './indoor-ui.js';

setTool("select");

// Floorplan loader
document.getElementById('floorplan-input').onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        setFloorplan(e.target.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
};