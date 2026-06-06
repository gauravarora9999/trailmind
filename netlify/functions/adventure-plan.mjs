const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const PLAN_PROMPT = `You are Adventure Architect AI. Generate a comprehensive adventure plan AND a persona reveal for the given profile.

Respond with ONLY valid JSON matching this exact schema. No markdown, no code fences.

{
  "persona_reveal": {
    "persona": "Explorer|Warrior|Mountaineer|Nomad|Survivor",
    "emoji": "🗺|⚔️|🏔|🌍|💪",
    "tagline": "One punchy sentence describing this persona type.",
    "dimensions": [
      {"name": "Endurance", "score": 8},
      {"name": "Technical Skill", "score": 6},
      {"name": "Risk Appetite", "score": 7},
      {"name": "Self-Sufficiency", "score": 7},
      {"name": "Adventure Spirit", "score": 9}
    ]
  },
  "plan": {
    "persona": "same as above",
    "readiness_index": 75,
    "risk_tier": "Low|Moderate|High|Extreme",
    "adventure_tier": "Beginner|Intermediate|Advanced|Elite",
    "seasonal_note": "Seasonal context for their travel month and location. Be specific.",
    "companion_note": "How plan was adjusted for their travel companions. Empty string if solo.",
    "recommended_adventure": {
      "name": "Specific real adventure name",
      "why_it_fits": "2 sentences why this fits perfectly.",
      "location": "Specific location",
      "duration_days": 7,
      "story_value_score": 8,
      "physical_challenge": 7,
      "mental_challenge": 6,
      "technical_difficulty": 5,
      "risk_score": 4
    },
    "alternative_adventure": {
      "name": "Stretch goal — harder version or next level adventure",
      "location": "Location",
      "why": "Why this is the perfect 6-month goal from where they are now.",
      "difficulty_jump": "What specifically makes it harder",
      "budget_change": 0
    },
    "budget": {
      "currency": "INR",
      "total": 80000,
      "transportation": 20000,
      "accommodation": 15000,
      "food": 8000,
      "gear": 15000,
      "permits": 2000,
      "guides": 12000,
      "insurance": 3000,
      "emergency_buffer": 5000
    },
    "travel_plan": "Detailed step-by-step travel from home city to adventure location.",
    "gear": {
      "mandatory": ["Real item 1", "Real item 2"],
      "recommended": ["Item 1"],
      "optional": ["Item 1"],
      "estimated_buy_cost": 10000,
      "estimated_rental_cost": 3000
    },
    "documentation": ["Valid ID", "Permit name"],
    "insurance": {
      "type_required": "Adventure Sports + Emergency Evacuation",
      "estimated_premium": 3000,
      "min_coverage_usd": 50000,
      "rescue_coverage": true,
      "evacuation_coverage": true,
      "repatriation_coverage": true,
      "gear_protection": false,
      "trip_cancellation": true,
      "exclusions_to_watch": ["Pre-existing conditions"]
    },
    "training_plan": "Specific 4-6 week training plan with exercises and weekly milestones.",
    "risk_analysis": {
      "physical": "Specific physical risk assessment.",
      "technical": "Technical risk assessment.",
      "environmental": "Environmental and weather risks.",
      "financial": "Financial risk assessment.",
      "rescue_complexity": "Low|Moderate|High|Extreme"
    },
    "one_year_plan": "Specific 12-month progression with milestones.",
    "five_year_roadmap": "5-year adventure progression roadmap.",
    "lifetime_bucket_list": ["Epic adventure 1", "Epic adventure 2", "Epic adventure 3", "Epic adventure 4", "Epic adventure 5"]
  }
}

RULES:
- Use REAL place names, real gear, realistic costs in their preferred currency
- seasonal_note must reference their actual travel month and location
- companion_note must reference their actual companions
- Alternative adventure must be genuinely harder/more ambitious than recommended
- All dimension scores 1-10, story_value_score 1-10
- Never recommend adventures beyond user's current capability`;

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

  try {
    const { profile } = await req.json();

    const profileText = `
Name: ${profile.name}
Age: ${profile.age}
Home City: ${profile.home_city}
Adventure Sport: ${profile.adventure_sport}
Planned Location: ${profile.planned_location}
Fitness Level: ${profile.fitness_level}
Certifications: ${profile.certifications || 'None'}
Preferred Currency: ${profile.preferred_currency}
Budget: ${profile.preferred_currency} ${profile.budget}
Available Days: ${profile.available_days}
Risk Tolerance: ${profile.risk_tolerance}
Travel Month: ${profile.travel_month || 'Not specified'}
Travel Companions: ${profile.travel_companions || 'Solo'}
`.trim();

    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: PLAN_PROMPT,
        messages: [{ role: 'user', content: `Generate adventure plan for:\n\n${profileText}` }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return Response.json({ error: 'Claude API error', detail: err }, { status: resp.status });
    }

    const data = await resp.json();
    const text = data.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { parsed = null; } }
    }

    if (!parsed) return Response.json({ error: 'Failed to parse plan' }, { status: 500 });

    return Response.json({ persona_reveal: parsed.persona_reveal, plan: parsed.plan });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/adventure-plan' };
