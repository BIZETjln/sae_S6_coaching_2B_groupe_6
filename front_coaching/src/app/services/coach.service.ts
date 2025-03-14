import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiCoach {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  specialites: string[];
  tarifHoraire: number;
  seances: string[];
}

export interface CoachResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ApiCoach[];
}

export interface Coach {
  id: string;
  nom: string;
  specialite: string;
  disponibilite: string;
  citation?: string;
  image: string;
  tarifHoraire: number;
}

@Injectable({
  providedIn: 'root',
})
export class CoachService {
  private apiUrl = 'https://127.0.0.1:8000/api/coaches?page=1';

  // Options HTTP correspondant exactement à la requête curl
  private httpOptions = {
    headers: new HttpHeaders({
      Accept: 'application/ld+json',
    }),
  };

  constructor(private http: HttpClient) {}

  getCoaches(): Observable<Coach[]> {
    return this.http.get<CoachResponse>(this.apiUrl, this.httpOptions).pipe(
      map((response) => {
        return response.member.map((coach) => {
          // Génération d'un numéro d'image aléatoire entre 1 et 3
          const imageNumber = Math.floor(Math.random() * 3) + 1;
          const imageExtension = imageNumber === 3 ? 'png' : 'jpg';

          return {
            id: coach.id,
            nom: `${coach.prenom} ${coach.nom}`,
            specialite: coach.specialites.join(', '),
            disponibilite: 'Disponible sur rendez-vous',
            citation: `Spécialiste en ${coach.specialites[0] || 'coaching'}`,
            image: `assets/images/coach${imageNumber}.${imageExtension}`,
            tarifHoraire: coach.tarifHoraire,
          };
        });
      })
    );
  }
}
