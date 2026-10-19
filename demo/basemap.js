// Palette and sewer flag, taken unchanged from index.html. The demo draws the network on its own
// canvas, so the MapLibre sewer layers stay hidden.
const PALETTE = {
  ocean:       { hex: "#a2c2ac" },
  inlandWater: { hex: "#97bda2" },
  landCream:   { hex: "#f7ead9" },
  urbanBlock:  { hex: "#f2e7d4" },
  parkSage:    { hex: "#d8d4b5" },
  hillsSage:   { hex: "#e5e0c2" },
  civicAmber:  { hex: "#ecddb2" },
  highwayCore: { hex: "#94866e" },
  primaryRoad: { hex: "#b5a68d" },
  minorStreet: { hex: "#d8ccb6" }
};
let sewerVisible = false;

// Vintage basemap style, taken unchanged from index.html (buildMapStyle). The demo draws the sewer itself.
function buildMapStyle() {
  const bundle = window.ADELAIDE_GEOJSON_BUNDLE || {};
  const localOrigin = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
  const isFile = window.location.protocol === 'file:';

  const sources = {
    "local-water":     { type: "geojson", data: bundle.adelaide_water || "data/adelaide_water.geojson" },
    "local-waterways": { type: "geojson", data: bundle.adelaide_waterways || "data/adelaide_waterways.geojson" },
    "local-parks":     { type: "geojson", data: bundle.adelaide_parks || "data/adelaide_parks.geojson" },
    "local-landuse":   { type: "geojson", data: bundle.adelaide_landuse || "data/adelaide_landuse.geojson" },
    "local-roads":     { type: "geojson", data: bundle.adelaide_roads_major || "data/adelaide_roads_major.geojson" },
    "sewer-mains":     { type: "geojson", data: bundle.walkerville_mains || "data/walkerville_mains.geojson" },
    "sewer-rising":    { type: "geojson", data: bundle.walkerville_rising_main || "data/walkerville_rising_main.geojson" },
    "sewer-manholes":  { type: "geojson", data: bundle.walkerville_manholes || "data/walkerville_manholes.geojson" }
  };

  if (!isFile) {
    // data/tiles holds local copies of CARTO's tiles and is not published, so a hosted copy reads CARTO's CDN
    const onThisMachine = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
    sources["adelaide-v-tiles"] = {
      type: "vector",
      tiles: onThisMachine ? [`${localOrigin}/data/tiles/{z}/{x}/{y}.mvt`]
        : ["a", "b", "c", "d"].map((s) => `https://tiles-${s}.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt`),
      minzoom: 8,
      maxzoom: 14
    };
  }

  const layers = [
    {
      id: "bg-land",
      type: "background",
      paint: { "background-color": PALETTE.landCream.hex }
    }
  ];

  if (!isFile) {
    layers.push(
      {
        id: "vt-landuse-residential",
        type: "fill",
        source: "adelaide-v-tiles",
        "source-layer": "landuse",
        filter: ["in", "class", "residential", "suburb", "neighbourhood"],
        paint: { "fill-color": PALETTE.urbanBlock.hex, "fill-opacity": 0.85 }
      },
      {
        id: "vt-landuse-civic-amber",
        type: "fill",
        source: "adelaide-v-tiles",
        "source-layer": "landuse",
        filter: ["in", "class", "commercial", "industrial", "retail", "school", "university", "hospital", "military"],
        paint: { "fill-color": PALETTE.civicAmber.hex, "fill-opacity": 0.65 }
      },
      {
        id: "vt-landcover-hills-sage",
        type: "fill",
        source: "adelaide-v-tiles",
        "source-layer": "landcover",
        filter: ["in", "class", "wood", "grass", "wetland"],
        paint: { "fill-color": PALETTE.hillsSage.hex, "fill-opacity": 0.72 }
      },
      {
        id: "vt-park-sage",
        type: "fill",
        source: "adelaide-v-tiles",
        "source-layer": "park",
        paint: { "fill-color": PALETTE.parkSage.hex, "fill-opacity": 0.78 }
      },
      {
        id: "vt-water-ocean",
        type: "fill",
        source: "adelaide-v-tiles",
        "source-layer": "water",
        paint: { "fill-color": PALETTE.ocean.hex, "fill-antialias": true }
      },
      {
        id: "vt-waterway",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "waterway",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.inlandWater.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 12, 1.5, 15, 2.8]
        }
      },
      {
        id: "vt-buildings",
        type: "fill",
        source: "adelaide-v-tiles",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-color": "#e9dcc4",
          "fill-outline-color": "#d8cab0",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.2, 15, 0.65]
        }
      }
    );
  }

  layers.push(
    {
      id: "gj-parks-fill",
      type: "fill",
      source: "local-parks",
      paint: {
        "fill-color": [
          "match",
          ["coalesce", ["get", "leisure"], ["get", "class"], ""],
          "park", PALETTE.parkSage.hex,
          "golf_course", PALETTE.parkSage.hex,
          "recreation_ground", PALETTE.parkSage.hex,
          PALETTE.hillsSage.hex
        ],
        "fill-opacity": 0.72
      }
    },
    {
      id: "gj-landuse-amber",
      type: "fill",
      source: "local-landuse",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": PALETTE.civicAmber.hex, "fill-opacity": 0.58 }
    },
    {
      id: "gj-water-polygons",
      type: "fill",
      source: "local-water",
      paint: {
        "fill-color": [
          "match",
          ["coalesce", ["get", "landuse"], ["get", "water"], ["get", "class"], ""],
          "salt_pond", "#a6bfa8",
          "reservoir", PALETTE.inlandWater.hex,
          "lake", PALETTE.inlandWater.hex,
          PALETTE.ocean.hex
        ],
        "fill-antialias": false
      }
    },
    {
      id: "gj-waterways-lines",
      type: "line",
      source: "local-waterways",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": [
          "match",
          ["coalesce", ["get", "waterway"], ["get", "class"], ""],
          "river", "#8cb398",
          "#b8ad96"
        ],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9,  ["match", ["coalesce", ["get", "waterway"], ["get", "class"], ""], "river", 1.1, 0.45],
          12, ["match", ["coalesce", ["get", "waterway"], ["get", "class"], ""], "river", 2.0, 0.85],
          15, ["match", ["coalesce", ["get", "waterway"], ["get", "class"], ""], "river", 3.8, 1.8]
        ],
        "line-opacity": 0.85
      }
    },
    {
      id: "gj-aeroway-casing",
      type: "line",
      source: "local-landuse",
      filter: ["in", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], ["literal", ["runway", "taxiway"]]],
      layout: { "line-cap": "square", "line-join": "round" },
      paint: {
        "line-color": PALETTE.highwayCore.hex,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9,  ["match", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], "runway", 2.5, 1.0],
          12, ["match", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], "runway", 7.0, 2.5],
          15, ["match", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], "runway", 18.0, 6.0]
        ]
      }
    },
    {
      id: "gj-aeroway-fill",
      type: "line",
      source: "local-landuse",
      filter: ["in", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], ["literal", ["runway", "taxiway"]]],
      layout: { "line-cap": "square", "line-join": "round" },
      paint: {
        "line-color": PALETTE.landCream.hex,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9,  ["match", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], "runway", 1.2, 0.4],
          12, ["match", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], "runway", 4.8, 1.2],
          15, ["match", ["coalesce", ["get", "aeroway"], ["get", "class"], ""], "runway", 14.0, 3.8]
        ]
      }
    },
    {
      id: "gj-road-minor-grid",
      type: "line",
      source: "local-roads",
      maxzoom: 12.2,
      filter: ["in", ["get", "class"], ["literal", ["minor", "service"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": PALETTE.minorStreet.hex,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.25, 10.7, 0.45, 12, 0.75],
        "line-opacity": 0.88
      }
    }
  );

  if (!isFile) {
    layers.push(
      {
        id: "vt-road-service",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "transportation",
        filter: ["in", "class", "service", "path", "track"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.minorStreet.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.25, 13, 0.55, 16, 1.8],
          "line-opacity": 0.7
        }
      },
      {
        id: "vt-road-minor",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "transportation",
        filter: ["==", "class", "minor"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.minorStreet.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.25, 10.7, 0.5, 12, 0.85, 14, 2.0, 16, 4.8],
          "line-opacity": 0.92
        }
      },
      {
        id: "vt-road-secondary",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "transportation",
        filter: ["in", "class", "secondary", "tertiary"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.primaryRoad.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.45, 10.7, 0.95, 12, 1.45, 14, 2.9, 16, 6.5]
        }
      },
      {
        id: "vt-road-primary",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "transportation",
        filter: ["==", "class", "primary"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.highwayCore.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.65, 10.7, 1.25, 12, 1.9, 14, 3.8, 16, 8.0],
          "line-opacity": 0.88
        }
      },
      {
        id: "vt-road-motorway-case",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "transportation",
        filter: ["in", "class", "motorway", "trunk"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.highwayCore.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.9, 10.7, 1.75, 12, 2.8, 14, 5.2, 16, 10.5]
        }
      },
      {
        id: "vt-rail",
        type: "line",
        source: "adelaide-v-tiles",
        "source-layer": "transportation",
        filter: ["==", "class", "rail"],
        paint: {
          "line-color": "#a89a82",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 12, 1.0, 15, 1.8],
          "line-dasharray": [3, 2]
        }
      }
    );
  } else {
    layers.push(
      {
        id: "gj-road-minor",
        type: "line",
        source: "local-roads",
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "path", "track"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.minorStreet.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 10.7, 0.6, 12, 1.0, 14, 2.2]
        }
      },
      {
        id: "gj-road-secondary",
        type: "line",
        source: "local-roads",
        filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.primaryRoad.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 10.7, 1.1, 12, 1.7, 14, 3.2]
        }
      },
      {
        id: "gj-road-major",
        type: "line",
        source: "local-roads",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PALETTE.highwayCore.hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.9, 10.7, 1.85, 12, 2.8, 14, 5.2]
        }
      }
    );
  }

  // Walkerville Sewer Overlay (hidden on initial Adelaide welcome view, shown when Walkerville dataset is clicked)
  const sewerVis = sewerVisible ? "visible" : "none";
  layers.push(
    {
      id: "sewer-mains-halo",
      type: "line",
      source: "sewer-mains",
      layout: { visibility: sewerVis, "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#f7ead9",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.2, 13, 3.8, 16, 6.5],
        "line-opacity": 0.75
      }
    },
    {
      id: "sewer-mains-line",
      type: "line",
      source: "sewer-mains",
      layout: { visibility: sewerVis, "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#2d6a6e",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.1, 13, 2.1, 16, 4.0],
        "line-opacity": 0.92
      }
    },
    {
      id: "sewer-rising-line",
      type: "line",
      source: "sewer-rising",
      layout: { visibility: sewerVis, "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#b8523b",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.6, 13, 2.8, 16, 5.0],
        "line-dasharray": [2, 1.5]
      }
    },
    {
      id: "sewer-manholes-circle",
      type: "circle",
      source: "sewer-manholes",
      minzoom: 12,
      layout: { visibility: sewerVis },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 1.8, 14, 3.2, 16, 5.5],
        "circle-color": "#f7ead9",
        "circle-stroke-color": "#1f4e52",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 12, 1.0, 15, 1.8]
      }
    }
  );

  return {
    version: 8,
    name: "Adelaide Vintage Welcome Map",
    sources,
    layers
  };
}
