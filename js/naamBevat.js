"use strict";

import { byId, toon, verberg } from "./util.js";

// =========================
// Kaart initialiseren
// =========================
const map = L.map("kaart").setView([50.826, 3.264], 10);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
}).addTo(map);

// Layer voor zoekresultaten
const markersLayer = L.layerGroup().addTo(map);



// Huidige locatie gebruiker
navigator.geolocation.getCurrentPosition(
    positie => {

        const lat = positie.coords.latitude;
        const lng = positie.coords.longitude;
        const accuracy = positie.coords.accuracy;

        L.circleMarker([lat, lng], {
            radius: 8,
            color: "blue",
            fillColor: "#00f",
            fillOpacity: 0.7
        })
        .addTo(map)
        .bindPopup(`U bevindt zich hier (${Math.round(accuracy)} m)`).openPopup();

        // Toont de foutmarge
        L.circle([lat, lng], {
            radius: accuracy,
            color: "blue",
            fillColor: "#00f",
            fillOpacity: 0.1
        }).addTo(map);

        map.setView([lat, lng], 16);
    },
    fout => {
        console.log("Locatie niet beschikbaar:", fout);
    },
    {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    }
);

// =========================
// Zoekknop
// =========================
byId("zoek").onclick = async () => {

    verberg(
        "waarnemingenTable",
        "woordFout",
        "storing",
        "mededeling"
    );

    const woordInput = byId("woord");

    if (woordInput.checkValidity()) {

        toon("status");

        await findByWoord(woordInput.value);

        verberg("status");

    } else {

        toon("woordFout");
        woordInput.focus();
    }
};

// =========================
// Zoeken
// =========================
async function findByWoord(woord) {

    markersLayer.clearLayers();

    try {

        const response = await fetch(
            `https://rafswaarnemingenjpa.onrender.com/observations?naamBevat=${encodeURIComponent(woord)}`
        );

        if (!response.ok) {
            toon("storing");
            return;
        }

        const waarnemingen = await response.json();

        if (waarnemingen.length === 0) {
            toon("mededeling");
            return;
        }

        toon("waarnemingenTable");

        const waarnemingenBody = byId("waarnemingenBody");
        waarnemingenBody.innerHTML = "";

        for (const waarneming of waarnemingen) {

            const tr = waarnemingenBody.insertRow();

            tr.insertCell().textContent = waarneming.date;
            tr.insertCell().textContent = waarneming.id;
            tr.insertCell().textContent = waarneming.lat.toFixed(6);
            tr.insertCell().textContent = waarneming.lng.toFixed(6);
            tr.insertCell().textContent = waarneming.specie.name;

            L.marker([waarneming.lat, waarneming.lng])
                .addTo(markersLayer)
                .bindPopup(`
                    <b>${waarneming.specie.name}</b><br>
                    ${waarneming.date}<br>
                    ${waarneming.location.name}
                `);
        }

        // Zoom naar eerste waarneming
        map.setView(
            [waarnemingen[0].lat, waarnemingen[0].lng],
            16
        );

    } catch (error) {

        console.error(error);
        toon("storing");
    }
}