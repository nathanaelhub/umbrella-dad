/* ============ UMBRELLA DAD · palette.js ============ */
/* Color system + live tweak application. UD.PAL holds the active world
   colors; the tweak engine swaps presets & fonts at runtime.            */
(function (UD) {
  'use strict';

  // constant world colors shared across every mood preset
  const BASE = {
    skin:   '#f1b07a', skinBurn:'#ef6a4d', hair:'#5a3a22',
    shortsA:'#3a7d52', shortsB:'#2c5e3e',
    sandal: '#7a4a2a',
    umbrellaPole:'#d8d2c4',
    cooler: '#e23b4e', coolerLid:'#f4f0e6',
    kidA:'#ff5e8a', kidB:'#5ad1ff', kidC:'#ffe14d',
    crab:'#ff5630', crabDark:'#d63824',
    gull:'#f4f0e6', gullWing:'#cfc8ba', beak:'#ffae34',
    foot:'#2b6cff', footB:'#ffffff',
    iceA:'#ffd6ef', iceB:'#fff6c2', iceC:'#c6f0ff',
    towel:['#ff4d6d','#ffc93c','#36c5f0','#7d5fff','#2ec4a6','#ff8e3c'],
  };

  // mood presets — each tints sky/sand/sea + the neon UI accents
  const PRESETS = {
    sunset: {
      label:'Sunset Synth',
      sea:'#1f6dc4', seaDeep:'#0e3f86', foam:'#bfe9ff',
      sand:'#f2c879', sandDark:'#e0a martyr', sandDark2:'#d99a3f', sandLight:'#ffe7a8',
      hotSand:'#ff7a33', hotSandHot:'#ff3b4e',
      ambient:'rgba(255,140,60,0.10)',
      neonA:'#ff2d95', neonB:'#00e5ff', neonC:'#ffd23f', neonD:'#b6ff3b',
      ink:'#160b2e', ink2:'#241046', panel:'#2a1450',
    },
    noon: {
      label:'Noon Blaze',
      sea:'#1fb6d6', seaDeep:'#1184ad', foam:'#e8ffff',
      sand:'#f6d98c', sandDark:'#e8be63', sandDark2:'#deb154', sandLight:'#fff0c4',
      hotSand:'#ff8a2b', hotSandHot:'#ff4d2e',
      ambient:'rgba(255,255,200,0.10)',
      neonA:'#ff5d3b', neonB:'#1fa8ff', neonC:'#ffd23f', neonD:'#37d67a',
      ink:'#13243f', ink2:'#1d3357', panel:'#244068',
    },
    night: {
      label:'Neon Night',
      sea:'#0c2f6b', seaDeep:'#06184a', foam:'#7ad6ff',
      sand:'#c8a25e', sandDark:'#a9863f', sandDark2:'#977433', sandLight:'#e0c07a',
      hotSand:'#ff4da6', hotSandHot:'#ff2d6e',
      ambient:'rgba(80,30,140,0.22)',
      neonA:'#ff2d95', neonB:'#00ffd5', neonC:'#ffe14d', neonD:'#b6ff3b',
      ink:'#0a0618', ink2:'#160b2e', panel:'#1d1140',
    },
  };
  // typo-guard the accidental token above
  PRESETS.sunset.sandDark = '#e0a94e';

  const FONTS = {
    bungee:  { label:'Bungee Arcade',  css:'"Bungee", sans-serif' },
    lilita:  { label:'Lilita Chunky',  css:'"Lilita One", sans-serif' },
    titan:   { label:'Titan Block',    css:'"Titan One", sans-serif' },
    pixel:   { label:'Pixel Press',    css:'"Press Start 2P", monospace' },
  };

  UD.PRESETS = PRESETS;
  UD.FONTS = FONTS;
  UD.PAL = Object.assign({}, BASE, PRESETS.sunset);

  // apply a tweak config — { palette, font, dadBuild, logo }
  UD.applyTweaks = function (t) {
    const preset = PRESETS[t.palette] || PRESETS.sunset;
    UD.PAL = Object.assign({}, BASE, preset);
    UD.dadBuild = t.dadBuild || 'classic';

    // push neon + ink to CSS custom props so HUD/menus reskin too
    const root = document.documentElement.style;
    root.setProperty('--neon-a', preset.neonA);
    root.setProperty('--neon-b', preset.neonB);
    root.setProperty('--neon-c', preset.neonC);
    root.setProperty('--neon-d', preset.neonD);
    root.setProperty('--ink', preset.ink);
    root.setProperty('--ink-2', preset.ink2);
    root.setProperty('--panel', preset.panel);

    const font = FONTS[t.font] || FONTS.bungee;
    root.setProperty('--font-display', font.css);

    document.body.dataset.crt = t.crt === false ? '0' : '1';

    // logo treatment class
    const logo = document.getElementById('logo');
    if (logo) logo.className = 'logo' + (t.logo && t.logo !== 'classic' ? ' v-' + t.logo : '');

    if (UD.onTweaksApplied) UD.onTweaksApplied(t);
  };
})(window.UD);
