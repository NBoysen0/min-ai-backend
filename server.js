const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialiser Google AI med din hemmelige nøgle fra .env-filen
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Definer det JSON-format, vi forventer fra AI'en
const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: {
        type: "OBJECT",
        properties: {
            "navneforslag": {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "navn": { "type": "STRING" },
                        "mellemnavn": { "type": "STRING" },
                        "efternavn": { "type": "STRING" },
                        "oprindelse_betydning": { "type": "STRING" },
                        "personlig_begrundelse": { "type": "STRING" }
                    },
                    required: ["navn", "oprindelse_betydning", "personlig_begrundelse"]
                }
            }
        },
        required: ["navneforslag"]
    }
};

app.post('/api/generate', async (req, res) => {
  try {
    // Hent prompten, som frontend'en har bygget
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt mangler' });
    }

    // Vælg AI-modellen
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // Sørg for at modellen matcher den i din frontend
        generationConfig: generationConfig // Anvend vores JSON-format-krav
    });

    // Send prompten til Gemini og få et resultat
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    // Send det rene JSON-svar tilbage til frontend
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonText);

  } catch (error) {
    console.error('Fejl ved kald til Google AI:', error);
    res.status(500).json({ error: 'Der opstod en fejl på serveren ved kald til AI.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});