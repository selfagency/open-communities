import type { StyleSpecification } from 'maplibre-gl';

const SOURCE_URL = 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json';
const GLYPHS_URL = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf';
const SPRITE_LIGHT = 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/sprite';
const SPRITE_DARK = 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite';

const source = {
  type: 'vector' as const,
  url: SOURCE_URL
};

// Theme colors derived from current app.css OKLCH values
// Theme colors from app.css OKLCH values via oklchtohex
// Light:  background=oklch(0.9551 0 0) → #f0f0f0  border=oklch(0.8576 0 0) → #d0d0d0
//         muted-foreground=oklch(0.5103 0 0) → #666666
// Dark:   background=oklch(0.2178 0 0) → #1a1a1a  border=oklch(0.329 0 0) → #353535
//         muted-foreground=oklch(0.5999 0 0) → #808080

const LIGHT = {
  background: '#f0f0f0',
  boundary: '#d0d0d0',
  land: '#eeebe4',
  text: '#666666',
  textDim: '#8c8070',
  textHalo: '#f0f0f0',
  water: '#d9d9d9'
};

const DARK = {
  background: '#1a1a1a',
  boundary: '#353535',
  land: '#343230',
  text: '#808080',
  textDim: '#8c8070',
  textHalo: '#1a1a1a',
  water: '#2a2a2a'
};

function buildStyle(colors: typeof LIGHT, sprite: string): StyleSpecification {
  return {
    glyphs: GLYPHS_URL,
    layers: [
      { id: 'background', paint: { 'background-color': colors.background }, type: 'background' },

      // Water
      {
        filter: ['all', ['==', '$type', 'Polygon']],
        id: 'water',
        paint: { 'fill-color': colors.water },
        source: 'carto',
        'source-layer': 'water',
        type: 'fill'
      },

      // Parks and landuse
      {
        filter: ['any', ['==', 'class', 'wood'], ['==', 'class', 'grass'], ['==', 'subclass', 'recreation_ground']],
        id: 'landcover',
        paint: { 'fill-color': colors.land, 'fill-opacity': 0.5 },
        source: 'carto',
        'source-layer': 'landcover',
        type: 'fill'
      },
      {
        filter: ['any', ['==', 'class', 'cemetery'], ['==', 'class', 'stadium']],
        id: 'landuse',
        paint: { 'fill-color': colors.land, 'fill-opacity': 0.5 },
        source: 'carto',
        'source-layer': 'landuse',
        type: 'fill'
      },

      // State boundaries
      {
        filter: ['all', ['==', 'admin_level', 4], ['==', 'maritime', 0]],
        id: 'boundary-state',
        minzoom: 4,
        paint: { 'line-color': colors.boundary, 'line-dasharray': [2, 2], 'line-opacity': 0.5, 'line-width': 1 },
        source: 'carto',
        'source-layer': 'boundary',
        type: 'line'
      },

      // Place labels
      {
        filter: ['==', 'class', 'country'],
        id: 'place-country',
        layout: {
          'text-field': '{name}',
          'text-font': ['Noto Sans Regular'],
          'text-letter-spacing': 0.05,
          'text-max-width': 10,
          'text-size': 12,
          'text-transform': 'uppercase'
        },
        minzoom: 4,
        paint: {
          'text-color': colors.textDim,
          'text-halo-color': colors.textHalo,
          'text-halo-width': 1.5
        },
        source: 'carto',
        'source-layer': 'place',
        type: 'symbol'
      },
      {
        filter: ['==', 'class', 'state'],
        id: 'place-state',
        layout: {
          'text-field': '{name}',
          'text-font': ['Noto Sans Regular'],
          'text-max-width': 8,
          'text-size': 10
        },
        paint: {
          'text-color': colors.textDim,
          'text-halo-color': colors.textHalo,
          'text-halo-width': 1
        },
        source: 'carto',
        'source-layer': 'place',
        type: 'symbol'
      },
      {
        filter: ['==', 'class', 'city'],
        id: 'place-city',
        layout: {
          'text-field': '{name}',
          'text-font': ['Noto Sans Regular'],
          'text-max-width': 10,
          'text-size': 11
        },
        paint: {
          'text-color': colors.text,
          'text-halo-color': colors.textHalo,
          'text-halo-width': 1
        },
        source: 'carto',
        'source-layer': 'place',
        type: 'symbol'
      },
      {
        filter: ['==', 'class', 'town'],
        id: 'place-town',
        layout: {
          'text-field': '{name}',
          'text-font': ['Noto Sans Regular'],
          'text-max-width': 8,
          'text-size': 9
        },
        paint: {
          'text-color': colors.text,
          'text-halo-color': colors.textHalo,
          'text-halo-width': 1
        },
        source: 'carto',
        'source-layer': 'place',
        type: 'symbol'
      }
    ],
    name: 'Open Communities',
    sources: { carto: source },
    sprite,
    version: 8
  };
}

export const lightStyle: StyleSpecification = buildStyle(LIGHT, SPRITE_LIGHT);
export const darkStyle: StyleSpecification = buildStyle(DARK, SPRITE_DARK);
