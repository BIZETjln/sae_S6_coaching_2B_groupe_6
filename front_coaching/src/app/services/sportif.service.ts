import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sportif, SportifResponse } from '../models/sportif.model';

@Injectable({
  providedIn: 'root',
})
export class SportifService {
  private apiUrl = 'https://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Inscrit un nouveau sportif
   * @param sportif Les données du sportif à inscrire
   * @returns Un Observable contenant la réponse de l'API
   */
  inscrire(sportif: Sportif): Observable<SportifResponse> {
    return this.http.post<SportifResponse>(`${this.apiUrl}/sportifs`, sportif);
  }
}
