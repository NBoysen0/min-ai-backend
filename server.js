// Filnavn: index.js
// Beskrivelse: Denne server-kode er designet til at modtage anmodninger fra din frontend,
// videresende dem sikkert til Google AI med det korrekte format, og returnere svaret.

// 1. Importer de nødvendige pakker
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config(); // Gør det muligt at bruge .env-fil til hemmelige nøgler

// 2. Initialiser Express og opsæt middleware
const app = express();
app.use(cors()); // Tillader anmodninger fra din frontend
app.use(express.json({ limit: '50mb' })); // Gør det muligt at læse JSON-data sendt fra frontend

// 3. Initialiser Google AI
// Din hemmelige API-nøgle hentes sikkert fra miljøvariablerne
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 4. Definer det ENESTE API-endepunkt, som alle funktioner skal bruge
app.post('/api/generate', async (req, res) => {
  
  // Hent 'prompt' og 'schema' fra den anmodning, som din frontend sender
  const { prompt, schema } = req.body;

  // Fejlhåndtering: Sørg for, at der altid er en prompt og et schema
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt mangler i anmodningen.' });
  }
  if (!schema) {
    return res.status(400).json({ error: 'Schema mangler i anmodningen.' });
  }

  try {
    // Vælg AI-modellen og konfigurer den til at forvente et JSON-svar baseret på det medsendte schema
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema, // Her bruges det schema, som frontend har sendt
        },
    });

    // Send prompten til AI'en og vent på svar
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // AI'en bør returnere ren JSON-tekst. Vi parser det for at sikre, det er gyldigt.
    try {
      const jsonData = JSON.parse(text);
      // Send det færdige JSON-svar tilbage til frontend
      res.json(jsonData);
    } catch (e) {
      console.error("Svar fra AI var ikke gyldigt JSON:", text);
      res.status(500).json({ error: 'Svar fra AI var ikke i det forventede format.' });
    }

  } catch (error) {
    // Håndter eventuelle fejl under kaldet til Google AI
    console.error('Fejl ved kald til Google AI:', error);
    res.status(500).json({ error: 'Der opstod en fejl på serveren ved kald til AI.' });
  }
});

// 5. Start serveren
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server kører på port ${PORT}`);
});
