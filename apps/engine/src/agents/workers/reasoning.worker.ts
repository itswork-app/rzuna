import { parentPort, workerData } from 'worker_threads';
import OpenAI from 'openai';

/**
 * 🏛️ Reasoning Worker: V22.1 Thread-Safe AI Sensor
 * Standard: ELIZA OS BRAIN
 */
async function run() {
  const { event, score, apiKey } = workerData;

  if (!apiKey) {
    parentPort?.postMessage({
      narrative: '[TEMPLATE] Token show high momentum with score ' + score,
      catalysts: ['Momentum', 'Sensor Trigger'],
      riskFactors: ['High Volatility'],
      confidence: 'LOW',
      generatedByAI: false,
    });
    return;
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an institutional RZUNA trading intelligence unit.' },
        { role: 'user', content: `Analyze token ${event.mint} with initial score ${score}. Symbol: ${event.symbol}` }
      ],
      response_format: { type: 'json_object' }
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');
    parentPort?.postMessage({
      narrative: content.narrative || 'Bullish momentum detected.',
      catalysts: content.catalysts || [],
      riskFactors: content.riskFactors || [],
      confidence: content.confidence || 'MEDIUM',
      generatedByAI: true,
    });
  } catch (error: any) {
    parentPort?.postMessage({ error: error.message });
  }
}

void run();
