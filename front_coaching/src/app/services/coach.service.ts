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
  tarif_horaire: number;
  seances: string[];
  description: string;
  photo?: string;
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
  description: string;
  image: string;
  tarifHoraire: number;
}

@Injectable({
  providedIn: 'root',
})
export class CoachService {
  private apiUrl = 'https://127.0.0.1:8000/api/coaches?page=1';
  private baseImageUrl = 'https://127.0.0.1:8000/images/coaches/';
  private defaultImage = 'assets/images/default-avatar.png';

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
          // Gestion de l'image du coach
          let imagePath = this.defaultImage; // Image par défaut

          // Si le coach a une photo, utiliser l'URL de l'image depuis le back-end
          if (coach.photo) {
            imagePath = `${this.baseImageUrl}${coach.photo}`;
          }

          return {
            id: coach.id,
            nom: `${coach.prenom} ${coach.nom}`,
            specialite: coach.specialites.join(', '),
            disponibilite: 'Disponible sur rendez-vous',
            description:
              coach.description ||
              `Spécialiste en ${coach.specialites[0] || 'coaching'}`,
            image: imagePath,
            tarifHoraire: coach.tarif_horaire,
          };
        });
      })
    );
  }

  /**
   * Récupère un coach spécifique par son ID
   * @param id Identifiant du coach à récupérer
   * @returns Observable contenant les données du coach
   */
  getCoachById(id: string): Observable<Coach> {
    const url = `https://127.0.0.1:8000/api/coaches/${id}`;

    return this.http.get<ApiCoach>(url, this.httpOptions).pipe(
      map((coach) => {
        // Gestion de l'image du coach
        let imagePath = this.defaultImage; // Image par défaut

        // Si le coach a une photo, utiliser l'URL de l'image depuis le back-end
        if (coach.photo) {
          imagePath = `${this.baseImageUrl}${coach.photo}`;
        }

        return {
          id: coach.id,
          nom: `${coach.prenom} ${coach.nom}`,
          email: coach.email,
          specialite: coach.specialites.join(', '),
          disponibilite: 'Disponible sur rendez-vous',
          description:
            coach.description ||
            `Spécialiste en ${coach.specialites[0] || 'coaching'}`,
          image: imagePath,
          tarifHoraire: coach.tarif_horaire,
        };
      })
    );
  }
}
