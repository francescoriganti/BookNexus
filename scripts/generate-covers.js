#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';

// Configurazione per ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CSV_PATH = path.join(__dirname, '../data/books.csv');
const OUTPUT_DIR = path.join(__dirname, '../public/book-covers');

// Assicurati che la directory di output esista
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Colori per i vari generi
const genreColors = {
  'Fantasy': {
    primary: '#8a2be2',
    secondary: '#4b0082',
    accent: '#9370db',
    text: '#ffffff'
  },
  'Mystery': {
    primary: '#2f4f4f',
    secondary: '#000000',
    accent: '#b22222',
    text: '#ffffff'
  },
  'Thriller': {
    primary: '#800000',
    secondary: '#000000',
    accent: '#b22222',
    text: '#ffffff'
  },
  'Science Fiction': {
    primary: '#4682b4',
    secondary: '#191970',
    accent: '#00bfff',
    text: '#ffffff'
  },
  'Religious': {
    primary: '#daa520',
    secondary: '#8b4513',
    accent: '#ffd700',
    text: '#000000'
  },
  'Historical Fiction': {
    primary: '#8b4513',
    secondary: '#a0522d',
    accent: '#deb887',
    text: '#ffffff'
  },
  'Adventure': {
    primary: '#006400',
    secondary: '#228b22',
    accent: '#32cd32',
    text: '#ffffff'
  },
  'Romance': {
    primary: '#ff69b4',
    secondary: '#c71585',
    accent: '#ffb6c1',
    text: '#000000'
  },
  'Political Philosophy': {
    primary: '#800000',
    secondary: '#8b0000',
    accent: '#cd5c5c',
    text: '#ffffff'
  },
  'Autobiography': {
    primary: '#4682b4',
    secondary: '#5f9ea0',
    accent: '#b0c4de',
    text: '#000000'
  },
  'Classic': {
    primary: '#2f4f4f',
    secondary: '#2e8b57',
    accent: '#8fbc8f',
    text: '#ffffff'
  },
  'Children': {
    primary: '#ff8c00',
    secondary: '#ffa500',
    accent: '#ffff00',
    text: '#000000'
  },
  'Dystopian': {
    primary: '#696969',
    secondary: '#2f4f4f',
    accent: '#a9a9a9',
    text: '#ffffff'
  },
  'Horror': {
    primary: '#000000',
    secondary: '#8b0000',
    accent: '#696969',
    text: '#ffffff'
  }
};

// Colori di fallback per generi non definiti
const defaultColors = {
  primary: '#4682b4',
  secondary: '#000080',
  accent: '#87ceeb',
  text: '#ffffff'
};

// Funzione per generare un SVG per un libro
function generateBookCover(book) {
  // Sanitizza il titolo per l'uso come nome di file
  const filename = book.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '.svg';
  
  // Ottieni i colori in base al genere
  const colors = genreColors[book.genre] || defaultColors;
  
  // Calcola un valore hash basato sul titolo per variare il design
  const hash = Array.from(book.title).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const designVariant = hash % 4; // 4 varianti di design
  
  // Genera un motivo di sfondo diverso in base al periodo storico e al paese dell'autore
  let pattern = '';
  const patternOpacity = 0.15;
  
  // Scegli un pattern appropriato in base al periodo storico
  switch(true) {
    case /ancient/i.test(book.historical_period):
      pattern = `<rect x="0" y="0" width="100%" height="100%" fill="url(#ancient-pattern)" opacity="${patternOpacity}" />`;
      break;
    case /revolution/i.test(book.historical_period):
      pattern = `<rect x="0" y="0" width="100%" height="100%" fill="url(#revolution-pattern)" opacity="${patternOpacity}" />`;
      break;
    case /war/i.test(book.historical_period):
      pattern = `<rect x="0" y="0" width="100%" height="100%" fill="url(#war-pattern)" opacity="${patternOpacity}" />`;
      break;
    case /contemporary/i.test(book.historical_period):
      pattern = `<rect x="0" y="0" width="100%" height="100%" fill="url(#modern-pattern)" opacity="${patternOpacity}" />`;
      break;
    default:
      pattern = `<rect x="0" y="0" width="100%" height="100%" fill="url(#default-pattern)" opacity="${patternOpacity}" />`;
  }
  
  // Definizioni dei pattern
  const patterns = `
    <defs>
      <pattern id="ancient-pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
        <rect width="2" height="20" fill="${colors.accent}" />
      </pattern>
      <pattern id="revolution-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
        <circle cx="10" cy="10" r="5" fill="${colors.accent}" />
      </pattern>
      <pattern id="war-pattern" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(0)">
        <path d="M0 0 L20 20 L40 0 L20 20 L0 40 L20 20 L40 40 L20 20 Z" stroke="${colors.accent}" stroke-width="1" fill="none" />
      </pattern>
      <pattern id="modern-pattern" patternUnits="userSpaceOnUse" width="50" height="50" patternTransform="rotate(0)">
        <rect width="25" height="25" fill="${colors.accent}" opacity="0.3" />
      </pattern>
      <pattern id="default-pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(30)">
        <line x1="0" y1="0" x2="0" y2="20" stroke="${colors.accent}" stroke-width="1" />
      </pattern>
      <linearGradient id="cover-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.primary}" />
        <stop offset="100%" stop-color="${colors.secondary}" />
      </linearGradient>
    </defs>
  `;
  
  // Calcola la lunghezza del titolo per adattare la dimensione del testo
  const titleLength = book.title.length;
  let titleFontSize = '24px';
  if (titleLength > 20) {
    titleFontSize = '18px';
  }
  if (titleLength > 30) {
    titleFontSize = '14px';
  }
  
  // Calcola la lunghezza dell'autore per adattare la dimensione del testo
  const authorLength = book.author.length;
  let authorFontSize = '16px';
  if (authorLength > 25) {
    authorFontSize = '14px';
  }
  
  // Struttura SVG di base
  let svg = '';
  
  // Scegli una variante di design
  switch(designVariant) {
    case 0: // Design classico
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
        ${patterns}
        <rect width="300" height="450" fill="url(#cover-gradient)" />
        ${pattern}
        <rect x="15" y="15" width="270" height="420" stroke="${colors.accent}" stroke-width="2" fill="none" />
        <text x="150" y="100" font-family="Georgia, serif" font-size="${titleFontSize}" text-anchor="middle" fill="${colors.text}" font-weight="bold">${book.title}</text>
        <text x="150" y="350" font-family="Arial, sans-serif" font-size="${authorFontSize}" text-anchor="middle" fill="${colors.text}">by ${book.author}</text>
        <text x="150" y="380" font-family="Arial, sans-serif" font-size="14px" text-anchor="middle" fill="${colors.text}">${book.publication_year}</text>
        <text x="150" y="405" font-family="Arial, sans-serif" font-size="12px" text-anchor="middle" fill="${colors.text}">${book.genre}</text>
      </svg>`;
      break;
      
    case 1: // Design moderno
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
        ${patterns}
        <rect width="300" height="450" fill="url(#cover-gradient)" />
        ${pattern}
        <rect x="25" y="25" width="250" height="400" fill="${colors.secondary}" opacity="0.6" />
        <text x="150" y="150" font-family="Arial, sans-serif" font-size="${titleFontSize}" text-anchor="middle" fill="${colors.text}" font-weight="bold">${book.title}</text>
        <rect x="75" y="180" width="150" height="2" fill="${colors.accent}" />
        <text x="150" y="320" font-family="Arial, sans-serif" font-size="${authorFontSize}" text-anchor="middle" fill="${colors.text}">by ${book.author}</text>
        <circle cx="150" cy="225" r="30" fill="${colors.accent}" opacity="0.6" />
      </svg>`;
      break;
      
    case 2: // Design minimalista
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
        ${patterns}
        <rect width="300" height="450" fill="${colors.primary}" />
        ${pattern}
        <text x="30" y="200" font-family="Georgia, serif" font-size="${titleFontSize}" fill="${colors.text}" font-weight="bold">${book.title}</text>
        <rect x="30" y="220" width="100" height="3" fill="${colors.accent}" />
        <text x="30" y="250" font-family="Arial, sans-serif" font-size="${authorFontSize}" fill="${colors.text}">${book.author}</text>
        <text x="30" y="280" font-family="Arial, sans-serif" font-size="14px" fill="${colors.text}">${book.publication_year}</text>
      </svg>`;
      break;
      
    case 3: // Design artistico
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
        ${patterns}
        <rect width="300" height="450" fill="${colors.secondary}" />
        ${pattern}
        <path d="M0,0 L300,0 L300,450 L0,450 Z" fill="${colors.primary}" opacity="0.7" />
        <path d="M150,50 C250,50 250,400 150,400 C50,400 50,50 150,50" fill="${colors.secondary}" opacity="0.6" />
        <text x="150" y="200" font-family="Georgia, serif" font-size="${titleFontSize}" text-anchor="middle" fill="${colors.text}" font-weight="bold">${book.title}</text>
        <text x="150" y="240" font-family="Arial, sans-serif" font-size="${authorFontSize}" text-anchor="middle" fill="${colors.text}">${book.author}</text>
        <text x="150" y="350" font-family="Arial, sans-serif" font-size="14px" text-anchor="middle" fill="${colors.text}">${book.genre} (${book.publication_year})</text>
      </svg>`;
      break;
  }
  
  // Salva il file SVG
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, svg);
  console.log(`Generated cover for "${book.title}" at ${outputPath}`);
}

// Leggi il file CSV e genera le copertine
console.log('Starting cover generation process...');
fs.createReadStream(CSV_PATH)
  .pipe(csvParser())
  .on('data', (book) => {
    try {
      generateBookCover(book);
    } catch (error) {
      console.error(`Error generating cover for "${book.title}":`, error.message);
    }
  })
  .on('end', () => {
    console.log('Cover generation process completed.');
  });