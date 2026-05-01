'use strict';

const express    = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const rateLimit  = require('express-rate-limit');

const router = express.Router();
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra un minuto.' },
});

router.post('/linkedin-post', limiter, async (req, res) => {
  const { title, subtitle, excerpt, tags } = req.body ?? {};

  if (!title || String(title).trim().length < 3) {
    return res.status(400).json({ error: 'Titolo mancante.' });
  }

  const cleanTitle    = String(title).trim().slice(0, 200);
  const cleanSubtitle = String(subtitle ?? '').trim().slice(0, 300);
  const cleanExcerpt  = String(excerpt  ?? '').trim().slice(0, 600);
  const cleanTags     = Array.isArray(tags)
    ? tags.slice(0, 5).map(t => String(t).trim()).filter(Boolean)
    : [];

  const userPrompt = [
    `Scrivi un post LinkedIn personale in italiano per condividere questo articolo di Pipeline.news.`,
    ``,
    `Titolo: ${cleanTitle}`,
    cleanSubtitle ? `Sottotitolo: ${cleanSubtitle}` : '',
    cleanExcerpt  ? `Estratto: ${cleanExcerpt}`     : '',
    cleanTags.length ? `Tag: ${cleanTags.join(', ')}` : '',
    ``,
    `Il post deve:`,
    `- Aprirsi con un aggancio personale autentico legato al tema specifico (es. "Quante volte ho sbagliato…", "Ho trovato finalmente uno strumento per…", "Questa cosa mi ha cambiato il modo di…", "Non ci avevo mai pensato prima, ma…")`,
    `- Fare riferimento concreto al contenuto dell'articolo, non solo al titolo`,
    `- Suonare scritto da una persona reale del mondo sales, non da un ufficio PR`,
    `- Essere tra 80 e 150 parole`,
    `- NON includere URL né hashtag`,
    `- NON usare markdown, asterischi o simboli di formattazione`,
  ].filter(Boolean).join('\n');

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: 'Sei un professionista italiano delle vendite che condivide contenuti utili su LinkedIn. Scrivi sempre in prima persona, in italiano, con tono diretto e autentico. Rispondi SOLO con il testo del post.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content[0]?.text?.trim() ?? '';
    if (!text) return res.status(500).json({ error: 'Testo non generato.' });

    return res.json({ text });
  } catch (err) {
    console.error('LinkedIn post generation error:', err.message);
    return res.status(500).json({ error: 'Errore nella generazione del testo.' });
  }
});

module.exports = router;
