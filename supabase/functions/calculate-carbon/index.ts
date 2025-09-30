import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (type === 'ai_estimate') {
      // Use Lovable AI to estimate carbon emissions
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: `You are a carbon footprint calculation expert. Given an activity description, calculate the estimated CO2 equivalent emissions in kilograms. 

              Common emission factors:
              - Gasoline car: 0.411 kg CO₂e per mile
              - Electric car: 0.2 kg CO₂e per mile
              - Domestic flight: 0.255 kg CO₂e per mile
              - Electricity (US avg): 0.92 kg CO₂e per kWh
              - Natural gas: 5.3 kg CO₂e per therm
              - Beef: 27 kg CO₂e per kg
              - Dairy: 3.2 kg CO₂e per kg
              - Recycling (negative): -0.85 kg CO₂e per kg

              Return ONLY a JSON object with a single "carbon_amount" field containing the numeric value in kg CO₂e. No explanations, just the JSON.
              Example: {"carbon_amount": 10.25}` 
            },
            { role: "user", content: description }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      try {
        const carbonData = JSON.parse(aiResponse);
        return new Response(JSON.stringify(carbonData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error parsing AI response:', aiResponse);
        throw new Error('Invalid AI response format');
      }
    }

    throw new Error('Invalid calculation type');

  } catch (error) {
    console.error('Error in calculate-carbon function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});