const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const PLAN_PROMPT = `You are Adventure Architect AI — an elite adventure consultant who designs transformative, safe, and achievable experiences.

Given a user's adventure profile, generate a comprehensive adventure plan. Respond with ONLY valid JSON matching the exact schema below. No markdown, no code fences, no extra text.

IMPORTANT RULES:
- Never recommend adventures significantly beyond the user's current capability
- All costs must be in the user's preferred currency
- Use real place names, real gear brands, realistic costs
- Be specific — no generic placeholders
- Keep text fields concise (1-3 sentences max)

REQUIRED JSON SCHEMA:
{
  "persona": "Explorer | Warrior | Mountaineer | Nomad | Survivor",
  "readiness_index": 75,
  "risk_tier": "Low | Moderate | High | Extreme",
  "adventure_tier": "Beginner | Intermediate | Advanced | Elite",
  "recommended_adventure": {
    "name": "Specific adventure name",
    "why_it_fits": "Why this fits the profile in 2 sentences.",
    "location": "Specific location",
    "duration_days": 7,
    "story_value_score": 8,
    "physical_challenge": 7,
    "mental_challenge": 6,
    "technical_difficulty": 5,
    "risk_score": 4
  },
  "budget": {
    "currency": "INR",
    "total": 5000,
    "transportation": 1500,
    "accommodation": 1000,
    "food": 500,
    "gear": 600,
    "permits": 200,
    "guides": 700,
    "insurance": 250,
    "emergency_buffer": 250
  },
  "travel_plan": "Step-by-step travel from home city to adventure location.",
  "gear": {
    "mandatory": ["Item 1", "Item 2", "Item 3"],
    "recommended": ["Item 1", "Item 2"],
    "optional": ["Item 1"],
    "estimated_buy_cost": 2000,
    "estimated_rental_cost": 500
  },
  "documentation": ["Passport", "Permit name"],
  "insurance": {
    "type_required": "Adventure Sports + Emergency Evacuation",
    "estimated_premium": 300,
    "min_coverage_usd": 50000,
    "rescue_coverage": true,
    "evacuation_coverage": true,
    "repatriation_coverage": true,
    "gear_protection": false,
    "trip_cancellation": true,
    "exclusions_to_watch": ["Pre-existing conditions"]
  },
  "training_plan": "Specific 4-week training plan.",
  "risk_analysis": {
    "physical": "Physical risk assessment.",
    "technical": "Technical risk assessment.",
    "environmental": "Environmental risk assessment.",
    "financial": "Financial risk assessment.",
    "rescue_complexity": "Low | Moderate | High | Extreme"
  },
  "alternative_adventure": {
    "name": "Alternative name",
    "location": "Location",
    "why": "Why this is a good fallback.",
    "budget_saving": 1000
  },
  "one_year_plan": "Specific 12-month preparation and milestone plan.",
  "five_year_roadmap": "Progressive adventure roadmap over 5 years.",
  "lifetime_bucket_list": ["Adventure 1", "Adventure 2", "Adventure 3", "Adventure 4", "Adventure 5"]
}`;

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { profile } = await req.json();

    const profileText = `
Name: ${profile.name}
Age: ${profile.age}
Home City: ${profile.home_city}
Adventure Sport: ${profile.adventure_sport}
Planned Location: ${profile.planned_location}
Fitness Level: ${profile.fitness_level}
Certifications: ${profile.certifications}
Driving License: ${profile.driving_license} (issued in ${profile.license_issued_in})
Preferred Currency: ${profile.preferred_currency}
Budget: ${profile.preferred_currency} ${profile.budget}
Available Days: ${profile.available_days}
Risk Tolerance: ${profile.risk_tolerance}
`.trim();

    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: PLAN_PROMPT,
        messages: [{ role: 'user', content: `Generate an adventure plan for this profile:\n\n${profileText}` }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return Response.json({ error: 'Claude API error', detail: err }, { status: resp.status });
    }

    const data = await resp.json();
    const text = data.content[0].text;

    let plan;
    try {
      plan = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { plan = JSON.parse(match[0]); } catch { plan = null; }
      }
    }

    if (!plan) {
      return Response.json({ error: 'Failed to parse plan' }, { status: 500 });
    }

    return Response.json({ plan });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/adventure-plan' };
