// Suburb-specific townhouse pricing — static lookup table
// Estimated new-build townhouse sale prices for Perth metro suburbs (2025-2026)
// Prices based on suburb tier, proximity to CBD, and local market data
// Update periodically to reflect market changes

// ── Pricing tiers for new-build townhouses ────────────────────────────
// Each tier: [2-bed, 3-bed, 4-bed] average sale prices
const TIER = {
  PREMIUM:      { price_2bed: 700000, price_3bed: 920000, price_4bed: 1150000, label: 'Premium inner' },
  INNER:        { price_2bed: 600000, price_3bed: 790000, price_4bed: 980000,  label: 'Inner/established' },
  INNER_MID:    { price_2bed: 530000, price_3bed: 700000, price_4bed: 870000,  label: 'Inner-middle ring' },
  MIDDLE:       { price_2bed: 470000, price_3bed: 630000, price_4bed: 790000,  label: 'Middle ring' },
  OUTER_MID:    { price_2bed: 420000, price_3bed: 565000, price_4bed: 710000,  label: 'Outer-middle ring' },
  OUTER:        { price_2bed: 385000, price_3bed: 520000, price_4bed: 660000,  label: 'Outer suburbs' },
  FAR_OUTER:    { price_2bed: 355000, price_3bed: 480000, price_4bed: 615000,  label: 'Far outer growth' },
};

// ── Suburb → tier mapping ─────────────────────────────────────────────
// Keys are lowercase suburb names
const SUBURB_TIERS = {
  // PREMIUM — prestige inner/western suburbs
  'dalkeith': TIER.PREMIUM,
  'nedlands': TIER.PREMIUM,
  'cottesloe': TIER.PREMIUM,
  'peppermint grove': TIER.PREMIUM,
  'mosman park': TIER.PREMIUM,
  'claremont': TIER.PREMIUM,
  'swanbourne': TIER.PREMIUM,
  'city beach': TIER.PREMIUM,
  'floreat': TIER.PREMIUM,
  'mount claremont': TIER.PREMIUM,

  // INNER — established inner suburbs, strong demand
  'subiaco': TIER.INNER,
  'leederville': TIER.INNER,
  'mount lawley': TIER.INNER,
  'highgate': TIER.INNER,
  'north perth': TIER.INNER,
  'west leederville': TIER.INNER,
  'south perth': TIER.INNER,
  'como': TIER.INNER,
  'crawley': TIER.INNER,
  'shenton park': TIER.INNER,
  'wembley': TIER.INNER,
  'jolimont': TIER.INNER,
  'mount hawthorn': TIER.INNER,
  'perth': TIER.INNER,
  'northbridge': TIER.INNER,
  'east perth': TIER.INNER,
  'west perth': TIER.INNER,

  // INNER_MID — inner-middle ring, good amenities
  'victoria park': TIER.INNER_MID,
  'rivervale': TIER.INNER_MID,
  'maylands': TIER.INNER_MID,
  'inglewood': TIER.INNER_MID,
  'bayswater': TIER.INNER_MID,
  'bassendean': TIER.INNER_MID,
  'ashfield': TIER.INNER_MID,
  'scarborough': TIER.INNER_MID,
  'doubleview': TIER.INNER_MID,
  'karrinyup': TIER.INNER_MID,
  'innaloo': TIER.INNER_MID,
  'osborne park': TIER.INNER_MID,
  'tuart hill': TIER.INNER_MID,
  'joondanna': TIER.INNER_MID,
  'coolbinia': TIER.INNER_MID,
  'menora': TIER.INNER_MID,
  'yokine': TIER.INNER_MID,
  'dianella': TIER.INNER_MID,
  'manning': TIER.INNER_MID,
  'salter point': TIER.INNER_MID,
  'karawara': TIER.INNER_MID,
  'south perth': TIER.INNER,
  'applecross': TIER.INNER_MID,
  'ardross': TIER.INNER_MID,
  'booragoon': TIER.INNER_MID,
  'myaree': TIER.INNER_MID,
  'mt pleasant': TIER.INNER_MID,
  'alfred cove': TIER.INNER_MID,
  'attadale': TIER.INNER_MID,
  'bicton': TIER.INNER_MID,
  'palmyra': TIER.INNER_MID,
  'east fremantle': TIER.INNER_MID,
  'fremantle': TIER.INNER_MID,

  // MIDDLE — middle ring suburbs
  'morley': TIER.MIDDLE,
  'nollamara': TIER.MIDDLE,
  'mirrabooka': TIER.MIDDLE,
  'balga': TIER.MIDDLE,
  'belmont': TIER.MIDDLE,
  'redcliffe': TIER.MIDDLE,
  'cannington': TIER.MIDDLE,
  'bentley': TIER.MIDDLE,
  'wilson': TIER.MIDDLE,
  'riverton': TIER.MIDDLE,
  'shelley': TIER.MIDDLE,
  'rossmoyne': TIER.MIDDLE,
  'bull creek': TIER.MIDDLE,
  'leeming': TIER.MIDDLE,
  'willetton': TIER.MIDDLE,
  'canning vale': TIER.MIDDLE,
  'joondalup': TIER.MIDDLE,
  'currambine': TIER.MIDDLE,
  'edgewater': TIER.MIDDLE,
  'padbury': TIER.MIDDLE,
  'hillarys': TIER.MIDDLE,
  'sorrento': TIER.MIDDLE,
  'duncraig': TIER.MIDDLE,
  'greenwood': TIER.MIDDLE,
  'warwick': TIER.MIDDLE,
  'kingsley': TIER.MIDDLE,
  'woodvale': TIER.MIDDLE,
  'cockburn central': TIER.MIDDLE,
  'success': TIER.MIDDLE,
  'hamilton hill': TIER.MIDDLE,
  'spearwood': TIER.MIDDLE,
  'beeliar': TIER.MIDDLE,
  'bibra lake': TIER.MIDDLE,
  'munster': TIER.MIDDLE,
  'midland': TIER.MIDDLE,

  // OUTER_MID — established outer suburbs
  'wanneroo': TIER.OUTER_MID,
  'alexander heights': TIER.OUTER_MID,
  'landsdale': TIER.OUTER_MID,
  'madeley': TIER.OUTER_MID,
  'clarkson': TIER.OUTER_MID,
  'mindarie': TIER.OUTER_MID,
  'butler': TIER.OUTER_MID,
  'kinross': TIER.OUTER_MID,
  'burns beach': TIER.OUTER_MID,
  'thornlie': TIER.OUTER_MID,
  'gosnells': TIER.OUTER_MID,
  'maddington': TIER.OUTER_MID,
  'kenwick': TIER.OUTER_MID,
  'langford': TIER.OUTER_MID,
  'rockingham': TIER.OUTER_MID,
  'waikiki': TIER.OUTER_MID,
  'safety bay': TIER.OUTER_MID,
  'warnbro': TIER.OUTER_MID,
  'kalamunda': TIER.OUTER_MID,
  'high wycombe': TIER.OUTER_MID,
  'forrestfield': TIER.OUTER_MID,
  'helena valley': TIER.OUTER_MID,
  'ellenbrook': TIER.OUTER_MID,
  'the vines': TIER.OUTER_MID,
  'aveley': TIER.OUTER_MID,

  // OUTER — growth corridor suburbs
  'baldivis': TIER.OUTER,
  'wellard': TIER.OUTER,
  'bertram': TIER.OUTER,
  'piara waters': TIER.OUTER,
  'harrisdale': TIER.OUTER,
  'southern river': TIER.OUTER,
  'armadale': TIER.OUTER,
  'seville grove': TIER.OUTER,
  'champion lakes': TIER.OUTER,
  'haynes': TIER.OUTER,
  'hilbert': TIER.OUTER,
  'treeby': TIER.OUTER,
  'alkimos': TIER.OUTER,
  'yanchep': TIER.OUTER,
  'two rocks': TIER.OUTER,
  'banksia grove': TIER.OUTER,
  'brabham': TIER.OUTER,
  'dayton': TIER.OUTER,
  'caversham': TIER.OUTER,

  // FAR_OUTER — fringe / rural-residential
  'byford': TIER.FAR_OUTER,
  'mundijong': TIER.FAR_OUTER,
  'serpentine': TIER.FAR_OUTER,
  'bullsbrook': TIER.FAR_OUTER,
  'chidlow': TIER.FAR_OUTER,
  'sawyers valley': TIER.FAR_OUTER,
  'darlington': TIER.FAR_OUTER,
  'glen forrest': TIER.FAR_OUTER,
  'mundaring': TIER.FAR_OUTER,
  'roleystone': TIER.FAR_OUTER,
  'bedfordale': TIER.FAR_OUTER,
  'oakford': TIER.FAR_OUTER,
  'oldbury': TIER.FAR_OUTER,
  'cardup': TIER.FAR_OUTER,
};

class SuburbPricingService {
  /**
   * Get estimated new townhouse sale prices for a Perth suburb.
   * Returns immediately from the static lookup table — no API calls.
   * @param {string} suburb - Suburb name (e.g. "Gosnells")
   * @param {string} _postcode - Postcode (unused, kept for API compatibility)
   * @returns {Promise<Object|null>} { price_2bed, price_3bed, price_4bed, suburb, tier } or null
   */
  async getSuburbPrices(suburb, _postcode) {
    if (!suburb || typeof suburb !== 'string' || suburb.trim().length < 2) {
      return null;
    }

    const suburbNormalized = suburb.trim();
    const key = suburbNormalized.toLowerCase();
    const tier = SUBURB_TIERS[key];

    if (!tier) {
      return null;
    }

    return {
      price_2bed: tier.price_2bed,
      price_3bed: tier.price_3bed,
      price_4bed: tier.price_4bed,
      suburb: suburbNormalized,
      tier: tier.label,
    };
  }
}

export default new SuburbPricingService();
