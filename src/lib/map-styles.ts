import type { StyleSpecification } from 'maplibre-gl';

const SOURCE_URL = 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json';
const GLYPHS_URL = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf';
const SPRITE_LIGHT = 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/sprite';
const SPRITE_DARK = 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite';

const source = {
  type: 'vector' as const,
  url: SOURCE_URL
};

export const lightStyle: StyleSpecification = {
  version: 8,
  name: 'Open Communities Light',
  sources: { carto: source },
  glyphs: GLYPHS_URL,
  sprite: SPRITE_LIGHT,
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#fafaf8' } },

    // Water
    {
      id: 'water',
      type: 'fill',
      source: 'carto',
      'source-layer': 'water',
      filter: ['all', ['==', '$type', 'Polygon']],
      paint: { 'fill-color': '#e8e4dc' }
    },

    // Parks and landuse
    {
      id: 'landcover',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landcover',
      filter: ['any', ['==', 'class', 'wood'], ['==', 'class', 'grass'], ['==', 'subclass', 'recreation_ground']],
      paint: { 'fill-color': '#f0ede6', 'fill-opacity': 0.5 }
    },
    {
      id: 'landuse',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      filter: ['any', ['==', 'class', 'cemetery'], ['==', 'class', 'stadium']],
      paint: { 'fill-color': '#f0ede6', 'fill-opacity': 0.5 }
    },

    // State boundaries
    {
      id: 'boundary-state',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundary',
      minzoom: 4,
      filter: ['all', ['==', 'admin_level', 4], ['==', 'maritime', 0]],
      paint: { 'line-color': '#d4c8bc', 'line-width': 1, 'line-dasharray': [2, 2], 'line-opacity': 0.5 }
    },

    // Place labels
    {
      id: 'place-country',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'country'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
        'text-max-width': 10,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.05
      },
      minzoom: 1,
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#fafaf8',
        'text-halo-width': 1.5
      }
    },
    {
      id: 'place-state',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'state'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-max-width': 8
      },
      minzoom: 1,
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#fafaf8',
        'text-halo-width': 1
      }
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'city'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-max-width': 10
      },
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#fafaf8',
        'text-halo-width': 1
      }
    },
    {
      id: 'place-town',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'town'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 9,
        'text-max-width': 8
      },
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#fafaf8',
        'text-halo-width': 1
      }
    }
  ]
};

export const darkStyle: StyleSpecification = {
  version: 8,
  name: 'Open Communities Dark',
  sources: { carto: source },
  glyphs: GLYPHS_URL,
  sprite: SPRITE_DARK,
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#2a2826' } },

    // Water
    {
      id: 'water',
      type: 'fill',
      source: 'carto',
      'source-layer': 'water',
      filter: ['all', ['==', '$type', 'Polygon']],
      paint: { 'fill-color': '#383532' }
    },

    // Parks and landuse
    {
      id: 'landcover',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landcover',
      filter: ['any', ['==', 'class', 'wood'], ['==', 'class', 'grass'], ['==', 'subclass', 'recreation_ground']],
      paint: { 'fill-color': '#322f2c', 'fill-opacity': 0.5 }
    },
    {
      id: 'landuse',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      filter: ['any', ['==', 'class', 'cemetery'], ['==', 'class', 'stadium']],
      paint: { 'fill-color': '#322f2c', 'fill-opacity': 0.5 }
    },

    // State boundaries
    {
      id: 'boundary-state',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundary',
      minzoom: 4,
      filter: ['all', ['==', 'admin_level', 4], ['==', 'maritime', 0]],
      paint: { 'line-color': '#555', 'line-width': 1, 'line-dasharray': [2, 2], 'line-opacity': 0.4 }
    },

    // Place labels
    {
      id: 'place-country',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'country'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
        'text-max-width': 10,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.05
      },
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#2a2826',
        'text-halo-width': 1.5
      }
    },
    {
      id: 'place-state',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'state'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-max-width': 8
      },
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#2a2826',
        'text-halo-width': 1
      }
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'city'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-max-width': 10
      },
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#2a2826',
        'text-halo-width': 1
      }
    },
    {
      id: 'place-town',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      filter: ['==', 'class', 'town'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 9,
        'text-max-width': 8
      },
      paint: {
        'text-color': '#8c8070',
        'text-halo-color': '#2a2826',
        'text-halo-width': 1
      }
    }
  ]
};
