import { Router } from 'express';
import osmService from '../services/openstreetmap.service.js';
import elevationService from '../services/elevation.service.js';
import suburbPricingService from '../services/suburbPricing.service.js';

const router = Router();

// Simple suburb → likely R-Code lookup for Perth metro
const SUBURB_RCODE_ESTIMATES = {
  // Higher density inner suburbs
  'perth': 'R80', 'northbridge': 'R80', 'east perth': 'R80', 'west perth': 'R80',
  'subiaco': 'R60', 'leederville': 'R60', 'mount lawley': 'R60', 'highgate': 'R60',
  'victoria park': 'R60', 'south perth': 'R60', 'como': 'R60', 'rivervale': 'R60',
  // Medium-high density
  'maylands': 'R40', 'bayswater': 'R40', 'inglewood': 'R40', 'morley': 'R40',
  'osborne park': 'R40', 'tuart hill': 'R40', 'joondanna': 'R40', 'coolbinia': 'R40',
  'claremont': 'R40', 'cottesloe': 'R40', 'nedlands': 'R40', 'dalkeith': 'R40',
  'scarborough': 'R40', 'innaloo': 'R40', 'doubleview': 'R40', 'karrinyup': 'R40',
  'dianella': 'R40', 'nollamara': 'R40', 'mirrabooka': 'R40', 'balga': 'R40',
  'bassendean': 'R40', 'ashfield': 'R40', 'belmont': 'R40', 'redcliffe': 'R40',
  'edgewater': 'R40', 'joondalup': 'R40', 'currambine': 'R40',
  'cannington': 'R40', 'bentley': 'R40', 'manning': 'R40', 'wilson': 'R40',
  'canning vale': 'R40', 'cockburn central': 'R40',
  // Medium density
  'wanneroo': 'R30', 'mindarie': 'R30', 'butler': 'R30', 'clarkson': 'R30',
  'ellenbrook': 'R30', 'the vines': 'R30', 'aveley': 'R30',
  'rockingham': 'R30', 'baldivis': 'R30', 'waikiki': 'R30',
  'armadale': 'R30', 'gosnells': 'R30', 'thornlie': 'R30',
  'midland': 'R30', 'helena valley': 'R30', 'kalamunda': 'R30',
  // Lower density outer suburbs
  'mundijong': 'R20', 'byford': 'R20', 'serpentine': 'R20',
  'bullsbrook': 'R20', 'chidlow': 'R20', 'sawyers valley': 'R20',
};

function estimateRCode(suburb, lotArea) {
  const suburbLower = (suburb || '').toLowerCase().trim();
  const suburbEstimate = SUBURB_RCODE_ESTIMATES[suburbLower];
  if (suburbEstimate) return suburbEstimate;

  // Fallback: estimate from lot area
  if (lotArea && lotArea > 0) {
    if (lotArea <= 150) return 'R80';
    if (lotArea <= 220) return 'R60';
    if (lotArea <= 300) return 'R40';
    if (lotArea <= 450) return 'R30';
    return 'R20';
  }

  return 'R30'; // Safe default for Perth metro
}

// POST /api/property/lookup
router.post('/lookup', async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address || address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid street address.' },
      });
    }

    // 1. Geocode the address
    const geocoded = await osmService.geocodeAddress(address);
    if (!geocoded) {
      return res.status(404).json({
        success: false,
        error: { message: 'Address could not be found. Please check and try again.' },
      });
    }

    // 2. Try to get property boundaries from OSM
    let boundaries = null;
    let lotArea = null;
    let frontage = null;
    let depth = null;
    let dataQuality = 'ESTIMATED';

    boundaries = await osmService.getPropertyBoundaries(geocoded.lat, geocoded.lng);

    if (boundaries && boundaries.area) {
      lotArea = boundaries.area;
      frontage = boundaries.frontage;
      depth = boundaries.depth;
      dataQuality = 'GOOD';
    } else {
      // Fallback: estimate typical Perth lot
      const estimated = osmService.generateEstimatedBoundary(728); // Perth median lot
      frontage = estimated.frontage;
      depth = estimated.depth;
      lotArea = 728;
    }

    // 3. Terrain analysis
    let terrainAnalysis;
    const boundaryPoints = boundaries?.boundaries || [
      { lat: geocoded.lat + 0.0001, lng: geocoded.lng + 0.0001 },
      { lat: geocoded.lat + 0.0001, lng: geocoded.lng - 0.0001 },
      { lat: geocoded.lat - 0.0001, lng: geocoded.lng - 0.0001 },
      { lat: geocoded.lat - 0.0001, lng: geocoded.lng + 0.0001 },
    ];

    terrainAnalysis = await elevationService.analyzeTerrainWithCosts(boundaryPoints, lotArea);

    // 4. Estimate R-Code
    const rCode = estimateRCode(geocoded.suburb, lotArea);

    res.json({
      success: true,
      property: {
        address: geocoded.displayName,
        suburb: geocoded.suburb,
        postcode: geocoded.postcode,
        lat: geocoded.lat,
        lng: geocoded.lng,
        lotArea,
        frontage,
        depth,
        rCode,
        dataQuality,
      },
      terrainAnalysis,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/property/autocomplete?q=...
router.get('/autocomplete', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.trim().length < 3) {
      return res.json({ success: true, suggestions: [] });
    }
    const suggestions = await osmService.autocompleteAddress(q);
    res.json({ success: true, suggestions });
  } catch (err) {
    console.error('Autocomplete error:', err.message);
    res.json({ success: true, suggestions: [] });
  }
});

// POST /api/property/suburb-prices
router.post('/suburb-prices', async (req, res) => {
  try {
    const { suburb, postcode } = req.body;
    const prices = await suburbPricingService.getSuburbPrices(suburb, postcode);
    res.json({ success: true, prices });
  } catch (err) {
    console.error('Suburb pricing route error:', err.message);
    res.json({ success: true, prices: null });
  }
});

export default router;
