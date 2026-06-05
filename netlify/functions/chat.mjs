const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are Trailmind, an expert adventure travel planner. Have a natural, concise conversation to understand what the traveler wants, then generate a detailed, costed itinerary.

## Conversation approach
- If the user describes their trip, extract what you can and ask only for what's missing.
- You need at minimum: destination region/city AND either duration or budget to generate a plan.
- Group size defaults to 2 if not mentioned. Budget tier defaults to Mid-range if not specified.
- Ask at most 1-2 follow-up questions before generating. Don't interrogate.
- Keep responses to 1-3 sentences. Be warm but efficient.

## Response format
ALWAYS respond with valid JSON and nothing else. No markdown, no code fences.

When still gathering info:
{"message":"Your response text here","plan":null}

When ready to present the plan:
{"message":"A brief intro to the plan","plan":{...}}

## Plan schema
When you generate a plan, the "plan" field must be:
{
  "city": "Primary city name",
  "country": "Country",
  "duration": 5,
  "nights": 4,
  "tier": "Budget" | "Mid-range" | "Luxury",
  "travellers": 2,
  "score": 87,
  "itinerary": [
    {
      "day": 1,
      "theme": "Day theme like Arrival & Culture",
      "activities": [
        {"time":"09:00","name":"Specific real place name","type":"Culture","duration":"2 hours","cost":0,"description":"One sentence about it"},
        {"time":"12:00","name":"Lunch at Real Restaurant","type":"Food","duration":"1.5 hours","cost":25,"description":"One sentence"},
        {"time":"15:00","name":"Afternoon Activity","type":"Adventure","duration":"3 hours","cost":45,"description":"One sentence"}
      ]
    }
  ],
  "breakdown": {
    "activities": 340,
    "accommodation": 600,
    "food": 250,
    "transport": 100,
    "buffer": 129,
    "total": 1419
  },
  "accommodation": [
    {"name":"Hotel Name","type":"Hotel type","pricePerNight":150,"description":"One sentence"},
    {"name":"Alt Hotel","type":"Alt type","pricePerNight":85,"description":"One sentence"}
  ]
}

## Rules
- All costs are per person in USD.
- Use REAL place names, restaurants, activities. No generic placeholders.
- Mix popular highlights with hidden gems.
- 3 activities per day. Each day needs a theme.
- Score (60-96) reflects how well the plan matches stated preferences.
- accommodation array should have 2-3 options at different price points.
- breakdown.total should be the sum of all other breakdown fields.
- Duration in days, nights = duration - 1.`;

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { messages, currency } = await req.json();

    const currencyNote = currency && currency !== 'USD'
      ? `\n\nThe user prefers prices in ${currency}. Still calculate in USD internally but mention the equivalent in ${currency} in your message text when discussing costs.`
      : '';

    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT + currencyNote,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return Response.json({ error: 'Claude API error', detail: err }, { status: resp.status });
    }

    const data = await resp.json();
    const text = data.content[0].text;

    // Parse Claude's JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // If Claude didn't return valid JSON, wrap it
      parsed = { message: text, plan: null };
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/api/chat',
};
