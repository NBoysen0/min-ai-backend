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

// Vores API-endepunkt, der modtager anmodninger fra hjemmesiden
app.post('/api/generate', async (req, res) => {
    
    // ▼▼▼ HELE DENNE 'TRY...CATCH'-BLOK ER DEN OPDATEREDE DEL ▼▼▼
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt mangler' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: generationConfig 
        });

        // OPDATERET: Her kalder vi AI'en med de nye, mildere sikkerhedsindstillinger
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE",
                },
            ],
        });
        
        const response = await result.response;
        const text = response.text();

        // OPDATERET: Valider og send svaret
        try {
            const jsonData = JSON.parse(text);
            res.json(jsonData);
        } catch (e) {
            console.error("Svar fra AI var ikke gyldigt JSON:", text);
            res.status(500).json({ error: 'Svar fra AI var ikke i det forventede format.', originalResponse: text });
        }

    } catch (error) {
        console.error('Fejl i API-endepunkt:', error);
        res.status(500).json({ error: 'Der opstod en generel fejl på serveren.' });
    }
    // ▲▲▲ DEN OPDATEREDE DEL SLUTTER HER ▲▲▲
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});
