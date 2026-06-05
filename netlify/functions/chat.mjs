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
      "theme": "Day theme",
      "activities": [
        {"time":"09:00","name":"Place name","type":"Culture","duration":"2 hours","cost":0},
        {"time":"12:00","name":"Restaurant","type":"Food","duration":"1.5 hours","cost":25},
        {"time":"15:00","name":"Activity","type":"Adventure","duration":"3 hours","cost":45}
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
    {"name":"Hotel Name","type":"Hotel type","pricePerNight":150},
    {"name":"Alt Hotel","type":"Alt type","pricePerNight":85}
  ]
}

## Rules
- All costs per person in USD. Keep activity descriptions SHORT (skip the "description" field to save tokens).
- Use REAL place names. Mix popular + hidden gems. 3 activities per day.
- Score 60-96 reflects preference match. 2-3 accommodation options.
- breakdown.total = sum of all breakdown fields. nights = duration - 1.
- Keep the plan to 5 days max to stay concise. If they want longer, summarize extra days.`;

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ message: 'API key not configured. Set ANTHROPIC_API_KEY in Netlify environment variables.', plan: null }, { status: 200 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: 'Invalid request.', plan: null }, { status: 200 });
  }

  const { messages, currency } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ message: 'No messages provided.', plan: null }, { status: 200 });
  }

  const currencyNote = currency && currency !== 'USD'
    ? `\nThe user prefers ${currency}. Still use USD internally but mention ${currency} equivalents in your message.`
    : '';

  try {
    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: SYSTEM_PROMPT + currencyNote,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Claude API error:', resp.status, errText);
      return Response.json({
        message: 'AI service error (' + resp.status + '). Please try again.',
        plan: null
      }, { status: 200 });
    }

    const data = await resp.json();
    const text = data.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text, plan: null };
    }

    return Response.json(parsed);
  } catch (err) {
    console.error('Function error:', err);
    return Response.json({
      message: 'Connection error: ' + err.message + '. Please try again.',
      plan: null
    }, { status: 200 });
  }
};

export const config = {
  path: '/api/chat',
};
