import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import { Book, InsertBook } from '@shared/schema';

// Funzione per caricare i libri dal file CSV
export async function loadBooksFromCsv(): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    const books: Book[] = [];
    const csvFilePath = path.resolve(__dirname, '../data/books.csv');
    
    fs.createReadStream(csvFilePath)
      .pipe(csvParser({
        mapValues: ({ header, value }) => {
          if (header === 'id' || header === 'publication_year' || header === 'pages') {
            return parseInt(value);
          }
          return value;
        }
      }))
      .on('data', (data) => {
        // Mappatura tra i nomi delle colonne CSV e le proprietà del modello Book
        const book: Book = {
          id: data.id,
          title: data.title,
          author: data.author,
          publicationYear: data.publication_year,
          genre: data.genre,
          authorsCountry: data.authors_country,
          pages: data.pages,
          originalLanguage: data.original_language,
          historicalPeriod: data.historical_period,
          imageUrl: `/book-covers/${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`
        };
        books.push(book);
      })
      .on('end', () => {
        console.log(`Caricati ${books.length} libri dal CSV`);
        resolve(books);
      })
      .on('error', (error) => {
        console.error('Errore durante il caricamento del CSV:', error);
        reject(error);
      });
  });
}