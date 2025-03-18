import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, delay, tap, switchMap, catchError } from 'rxjs/operators';
import { Seance } from '../models/seance.model';
import { jwtDecode } from 'jwt-decode';

export enum UserRole {
  RESPONSABLE = 'RESPONSABLE',
  COACH = 'COACH',
  AGENT = 'AGENT',
  CLIENT = 'CLIENT',
}

export interface User {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: string;
  name?: string;
  nom?: string;
  prenom?: string;
  email: string;
  role: UserRole;
  token?: string;
  avatar?: string;
  date_inscription?: string;
  niveau_sportif?: string;
  seances?: Seance[];
}

interface ApiResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: any[];
}

interface DecodedToken {
  username: string;
  roles: string[];
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'https://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  public hasRole(role: UserRole): boolean {
    return this.currentUserValue?.role === role;
  }

  public hasAnyRole(roles: UserRole[]): boolean {
    return this.currentUserValue
      ? roles.includes(this.currentUserValue.role)
      : false;
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Erreur lors du décodage du token JWT', error);
      return null;
    }
  }

  /**
   * Récupère les séances de l'utilisateur actuellement connecté
   * @returns Un Observable contenant la liste des séances ou un tableau vide si l'utilisateur n'est pas connecté
   */
  public getUserSeances(): Observable<Seance[]> {
    const user = this.currentUserValue;

    if (!user) {
      return of([]);
    }

    if (user.seances && user.seances.length > 0) {
      return of(user.seances);
    }

    if (user.role === UserRole.CLIENT) {
      // Extrait l'ID du sportif de l'URL '@id'
      const sportifId = user.id.includes('/')
        ? user.id.split('/').pop()
        : user.id;

      return this.http
        .get<Seance[]>(`${this.apiUrl}/sportifs/${sportifId}/seances`)
        .pipe(
          map((seances) => {
            user.seances = seances;
            this.updateCurrentUser(user);
            return seances;
          })
        );
    }

    return of([]);
  }

  // Méthode pour mettre à jour l'utilisateur courant dans le localStorage et dans le BehaviorSubject
  private updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, {
        email,
        password,
      })
      .pipe(
        switchMap((response) => {
          const token = response.token;
          localStorage.setItem('jwt_token', token);

          // Décodez le token pour obtenir l'email de l'utilisateur
          const decodedToken = this.decodeToken(token);
          if (!decodedToken) {
            return throwError(
              () => new Error('Impossible de décoder le token')
            );
          }

          // Utilisez l'email pour récupérer les informations du sportif
          const headers = new HttpHeaders().set(
            'Authorization',
            `Bearer ${token}`
          );

          return this.http
            .get<ApiResponse>(`${this.apiUrl}/sportifs`, { headers })
            .pipe(
              switchMap((response) => {
                // Recherchez le sportif correspondant à l'email
                const sportifs = response.member || [];
                const sportif = sportifs.find(
                  (s) => s.email === decodedToken.username
                );

                if (!sportif) {
                  return throwError(() => new Error('Utilisateur non trouvé'));
                }

                // Déterminer le rôle de l'utilisateur
                let role = UserRole.CLIENT; // Par défaut pour un sportif

                // Construire l'objet utilisateur
                const user: User = {
                  '@context': sportif['@context'],
                  '@id': sportif['@id'],
                  '@type': sportif['@type'],
                  id: sportif.id || sportif['@id'],
                  nom: sportif.nom,
                  prenom: sportif.prenom,
                  email: sportif.email,
                  date_inscription: sportif.date_inscription,
                  niveau_sportif: sportif.niveau_sportif,
                  role: role,
                  token: token,
                  seances: sportif.seances,
                };

                // Stockez l'utilisateur dans le localStorage
                this.updateCurrentUser(user);
                return of(user);
              }),
              catchError((err) => {
                console.error(
                  'Erreur lors de la récupération des informations utilisateur',
                  err
                );
                return throwError(
                  () =>
                    new Error(
                      'Erreur lors de la récupération des informations utilisateur'
                    )
                );
              })
            );
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwt_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }
}
