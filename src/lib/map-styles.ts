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
  water: '#e6e4dc',
  land: '#eeebe4',
  boundary: '#d0d0d0',
  text: '#666666',
  textHalo: '#f0f0f0',
  textDim: '#8c8070'
};

const DARK = {
  background: '#1a1a1a',
  water: '#3a3835',
  land: '#343230',
  boundary: '#353535',
  text: '#808080',
  textHalo: '#1a1a1a',
  textDim: '#8c8070'
};

function buildStyle(colors: typeof LIGHT, sprite: string): StyleSpecification {
  return {
    version: 8,
    name: 'Open Communities',
    sources: { carto: source },
    glyphs: GLYPHS_URL,
    sprite,
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': colors.background } },

      // Water
      {
        id: 'water',
        type: 'fill',
        source: 'carto',
        'source-layer': 'water',
        filter: ['all', ['==', '$type', 'Polygon']],
        paint: { 'fill-color': colors.water }
      },

      // Parks and landuse
      {
        id: 'landcover',
        type: 'fill',
        source: 'carto',
        'source-layer': 'landcover',
        filter: ['any', ['==', 'class', 'wood'], ['==', 'class', 'grass'], ['==', 'subclass', 'recreation_ground']],
        paint: { 'fill-color': colors.land, 'fill-opacity': 0.5 }
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'carto',
        'source-layer': 'landuse',
        filter: ['any', ['==', 'class', 'cemetery'], ['==', 'class', 'stadium']],
        paint: { 'fill-color': colors.land, 'fill-opacity': 0.5 }
      },

      // State boundaries
      {
        id: 'boundary-state',
        type: 'line',
        source: 'carto',
        'source-layer': 'boundary',
        minzoom: 4,
        filter: ['all', ['==', 'admin_level', 4], ['==', 'maritime', 0]],
        paint: { 'line-color': colors.boundary, 'line-width': 1, 'line-dasharray': [2, 2], 'line-opacity': 0.5 }
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
        minzoom: 4,
        paint: {
          'text-color': colors.textDim,
          'text-halo-color': colors.textHalo,
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
          'text-color': colors.textDim,
          'text-halo-color': colors.textHalo,
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
          'text-color': colors.text,
          'text-halo-color': colors.textHalo,
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
          'text-color': colors.text,
          'text-halo-color': colors.textHalo,
          'text-halo-width': 1
        }
      }
    ]
  };
}

export const lightStyle: StyleSpecification = buildStyle(LIGHT, SPRITE_LIGHT);
export const darkStyle: StyleSpecification = buildStyle(DARK, SPRITE_DARK);
