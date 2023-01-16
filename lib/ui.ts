import * as L from "leaflet";
import GeocoderControl from "leaflet-control-geocoder";

const leafletMap = L.map("map", {
  zoomSnap: 0,
  zoomControl: false,
}).setView({ lat: 37.500258, lng: -77.49663 }, 15);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(leafletMap);

new GeocoderControl({
  defaultMarkGeocode: false,
})
  .on("markgeocode", function (e: any) {
    var bbox = e.geocode.bbox;
    leafletMap.fitBounds(bbox);
  })
  .addTo(leafletMap)
  .setPosition("topleft");

leafletMap.on("moveend", () => {
  const bbox = leafletMap.getBounds().toBBoxString();
  const center = leafletMap.getCenter();
  const zoom = leafletMap.getZoom();
  parent.postMessage(
    {
      pluginMessage: {
        type: "save-viewport",
        bbox,
      },
    },
    "*"
  );
  document.body.dispatchEvent(
    new CustomEvent("saveviewport", {
      detail: {
        bbox,
        openstreetmap_url: `https://www.openstreetmap.org/#map=${zoom}/${center.lat}/${center.lng}`,
        google_url: `https://www.google.com/maps?ll=${center.lat},${center.lng}&hl=en&t=m&z=${zoom}`,
      },
    })
  );
});

addEventListener("message", (evt) => {
  switch (evt.data?.pluginMessage?.type) {
    case "ratio": {
      const { width, height } = evt.data?.pluginMessage || {};
      setRatio(width, height);
      break;
    }
    case "recover-viewport": {
      const { bbox } = evt.data?.pluginMessage || {};
      const [w, s, e, n] = bbox
        .split(",")
        .map((str: string) => parseFloat(str));
      leafletMap.fitBounds([
        [s, w],
        [n, e],
      ]);
      break;
    }
  }
});

document.getElementById("capture")!.onclick = () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "render-map",
        bbox: leafletMap.getBounds().toBBoxString(),
      },
    },
    "*"
  );
};

function setRatio(width: number, height: number) {
  const map = document.getElementById("map")!;
  map.style.height = `${(
    map.getBoundingClientRect().width * (height / width) +
    30
  ).toFixed(3)}px`;
  leafletMap.invalidateSize();
}
