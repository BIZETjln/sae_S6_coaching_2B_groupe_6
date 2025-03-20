import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Exercice {
  id: string;
  nom: string;
  description?: string;
  instructions?: string;
  categorie?: string;
  niveau_difficulte?: string;
  zones_travaillees?: string[];
  materiel_requis?: string[];
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExerciceService {
  private apiUrl = environment.apiUrl || 'https://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Récupère les détails d'un exercice par son ID
   * @param id L'identifiant de l'exercice
   * @returns Un Observable contenant les détails de l'exercice
   */
  getExercice(id: string): Observable<Exercice> {
    // Récupérer le token d'authentification depuis l'utilisateur courant
    const currentUser = this.authService.currentUserValue;
    const token = currentUser?.token || localStorage.getItem('jwt_token');

    // Configurer les headers avec le token d'authentification
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<Exercice>(`${this.apiUrl}/exercices/${id}`, { headers })
      .pipe(
        catchError((error) => {
          console.error(
            `Erreur lors de la récupération de l'exercice ${id}:`,
            error
          );
          return of({
            id: id,
            nom: 'Exercice inconnu',
          });
        })
      );
  }

  /**
   * Alias pour getExercice pour compatibilité avec le code existant
   * @param id L'identifiant de l'exercice
   * @returns Un Observable contenant les détails de l'exercice
   */
  getExerciceById(id: string): Observable<Exercice> {
    return this.getExercice(id);
  }

  /**
   * Récupère la liste de tous les exercices
   * @returns Un Observable contenant la liste des exercices
   */
  getAllExercices(): Observable<Exercice[]> {
    // Récupérer le token d'authentification depuis l'utilisateur courant
    const currentUser = this.authService.currentUserValue;
    const token = currentUser?.token || localStorage.getItem('jwt_token');

    // Configurer les headers avec le token d'authentification
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any>(`${this.apiUrl}/exercices`, { headers }).pipe(
      map((response) => {
        // Si la réponse est une collection avec un champ 'hydra:member'
        if (response['hydra:member']) {
          return response['hydra:member'];
        }
        // Sinon si c'est un tableau directement
        if (Array.isArray(response)) {
          return response;
        }
        // En dernier recours
        return [];
      }),
      catchError((error) => {
        console.error('Erreur lors de la récupération des exercices:', error);
        return of([]);
      })
    );
  }
}
