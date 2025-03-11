import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'https://localhost:8008/api'; // URL de notre API

  constructor(private http: HttpClient) {}

  // Lister les catégories
  //getCategories(): Observable<Categorie[]> {
  //  return this.http.get<Categorie[]>(`${this.apiUrl}/categories`);
  //}
  //
  //// Lister les articles
  //getArticles(): Observable<Article[]> {
  //  return this.http.get<Article[]>(`${this.apiUrl}/articles`);
  //}
  //
  //// Ajouter un article
  //addArticle(article: Article): Observable<Article> {
  //  return this.http.post<Article>(`${this.apiUrl}/article`, article);
  //}
}
