const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config(); // Indlæser miljøvariabler fra .env-filen

// Opret en Express-app
const app = express();

// Brug CORS middleware til at tillade anmodninger fra andre domæner (din frontend)
app.use(cors());

// Brug middleware til at parse JSON i request body
app.use(express.json());

// Initialiser Google Generative AI med din API-nøgle fra miljøvariablerne
// Sørg for at have en .env fil med linjen: GEMINI_API_KEY=DIN_API_NØGLE
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Definer API-endepunktet
app.post('/api/generate', async (req, res) => {
  // Hent 'prompt' fra request body
  const { prompt } = req.body;

  // Tjek om prompt mangler
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt mangler' });
  }

  try {
    // Vælg AI-modellen
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Send prompten til AI'en og vent på svar
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Prøv at parse teksten som JSON
    try {
      const jsonData = JSON.parse(text);
      // Send det parsede JSON-svar tilbage til klienten
      res.json(jsonData);
    } catch (e) {
      // Hvis det ikke er JSON, så send det som almindelig tekst
      // Dette kan ske, hvis AI'en svarer med en fejlbesked eller almindelig tekst
      console.error("Svar fra AI var ikke gyldigt JSON:", text);
      res.status(500).json({ error: 'Svar fra AI var ikke i det forventede format.' });
    }

  } catch (error) {
    // Håndter fejl, hvis kaldet til AI'en mislykkes
    console.error('Fejl ved kald til Google AI:', error);
    res.status(500).json({ error: 'Der opstod en fejl på serveren ved kald til AI.' });
  }
});

// Definer porten, som serveren skal lytte på
// Render.com sætter automatisk en PORT-miljøvariabel
const PORT = process.env.PORT || 3001;

// Start serveren
app.listen(PORT, () => {
  console.log(`Server kører på port ${PORT}`);
});
