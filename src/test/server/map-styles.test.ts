import { describe, expect, it } from 'vitest';

describe('map-styles', () => {
  it('exports lightStyle with required properties', async () => {
    const { lightStyle } = await import('../../lib/map-styles');
    expect(lightStyle).toBeDefined();
    expect(lightStyle.version).toBe(8);
    expect(lightStyle.sources).toBeDefined();
    expect(lightStyle.layers).toBeDefined();
    expect(lightStyle.layers.length).toBeGreaterThan(0);
  });

  it('exports darkStyle with required properties', async () => {
    const { darkStyle } = await import('../../lib/map-styles');
    expect(darkStyle).toBeDefined();
    expect(darkStyle.version).toBe(8);
    expect(darkStyle.sources).toBeDefined();
    expect(darkStyle.layers).toBeDefined();
    expect(darkStyle.layers.length).toBeGreaterThan(0);
  });

  it('both styles use same source URL', async () => {
    const { lightStyle, darkStyle } = await import('../../lib/map-styles');
    const lightSource = lightStyle.sources?.openmaptiles;
    const darkSource = darkStyle.sources?.openmaptiles;
    expect(lightSource).toEqual(darkSource);
  });

  it('light style has light background color', async () => {
    const { lightStyle } = await import('../../lib/map-styles');
    const bgLayer = lightStyle.layers.find((l) => l.id === 'background');
    expect(bgLayer).toBeDefined();
    expect(bgLayer?.paint).toBeDefined();
  });
});
