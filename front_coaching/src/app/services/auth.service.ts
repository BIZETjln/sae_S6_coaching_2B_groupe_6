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
  photo?: string; // Nom du fichier image
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
  private apiBaseUrl = 'https://127.0.0.1:8000';

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
   * Génère l'URL complète pour l'avatar de l'utilisateur
   * @returns L'URL de l'avatar ou l'URL de l'image par défaut
   */
  public getUserAvatarUrl(): string {
    const user = this.currentUserValue;
    if (!user) {
      return 'assets/images/default-avatar.png';
    }

    // Si l'utilisateur a un champ photo, on utilise le chemin vers /images/sportifs/
    if (user.photo) {
      return `${this.apiBaseUrl}/images/sportifs/${user.photo}`;
    }

    // Si l'utilisateur a un avatar déjà défini (URL complète ou relative)
    if (user.avatar) {
      // Vérifier si c'est une URL relative commençant par "assets/"
      if (user.avatar.startsWith('assets/')) {
        return user.avatar;
      }
      // Sinon, c'est peut-être une URL complète ou une autre forme
      return user.avatar;
    }

    // Par défaut, retourner l'avatar par défaut
    return 'assets/images/default-avatar.png';
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

    // Si l'utilisateur a des participations, extraire les séances de ces participations
    if ((user as any).participations && (user as any).participations.length > 0) {
      const seances = (user as any).participations.map((participation: any) => participation.seance);
      return of(seances);
    }

    if (user.role === UserRole.CLIENT) {
      // Extrait l'ID du sportif de l'URL '@id'
      const sportifId = user.id.includes('/')
        ? user.id.split('/').pop()
        : user.id;

      return this.http
        .get<any>(`${this.apiUrl}/sportifs/${sportifId}`)
        .pipe(
          map((sportifDetails) => {
            // Extraire les séances des participations
            const seances = sportifDetails.participations 
              ? sportifDetails.participations.map((participation: any) => participation.seance) 
              : [];
            
            // Mettre à jour l'utilisateur avec les participations
            (user as any).participations = sportifDetails.participations;
            
            // Stocker aussi les séances pour compatibilité avec le code existant
            user.seances = seances;
            
            this.updateCurrentUser(user);
            return seances;
          }),
          catchError(error => {
            console.error('Erreur lors de la récupération des séances de l\'utilisateur', error);
            return of([]);
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

          // Créer les headers avec le token
          const headers = new HttpHeaders().set(
            'Authorization',
            `Bearer ${token}`
          );

          // Tentative de récupération des informations de l'utilisateur
          return this.http
            .get<ApiResponse>(`${this.apiUrl}/sportifs`, {
              headers,
              params: { email: decodedToken.username }, // Filtrer par email pour limiter les résultats
            })
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

                // Récupérer l'ID du sportif depuis son @id
                const sportifId =
                  sportif.id ||
                  (sportif['@id'] ? sportif['@id'].split('/').pop() : '');

                // Maintenant, on récupère les détails complets avec l'ID
                return this.http
                  .get<any>(`${this.apiUrl}/sportifs/${sportifId}`, { headers })
                  .pipe(
                    map((sportifDetails) => {
                      // Déterminer le rôle de l'utilisateur
                      let role = UserRole.CLIENT; // Par défaut pour un sportif

                      // Construire l'objet utilisateur
                      const user: User = {
                        '@context': sportifDetails['@context'],
                        '@id': sportifDetails['@id'],
                        '@type': sportifDetails['@type'],
                        id: sportifDetails.id || sportifId,
                        nom: sportifDetails.nom,
                        prenom: sportifDetails.prenom,
                        email: sportifDetails.email,
                        date_inscription: sportifDetails.date_inscription,
                        niveau_sportif: sportifDetails.niveau_sportif,
                        role: role,
                        token: token,
                        photo: sportifDetails.photo,
                        seances: sportifDetails.seances,
                      };

                      // Ajouter les participations à l'objet utilisateur
                      if (sportifDetails.participations) {
                        (user as any).participations =
                          sportifDetails.participations;
                        console.log(
                          'Participations récupérées:',
                          sportifDetails.participations.length
                        );
                      }

                      console.log(
                        'Utilisateur connecté avec photo:',
                        user.photo
                      );

                      // Stockez l'utilisateur dans le localStorage
                      this.updateCurrentUser(user);
                      return user;
                    }),
                    catchError((err) => {
                      console.warn(
                        "Erreur lors de la récupération des détails du sportif. Création d'un utilisateur basique.",
                        err
                      );

                      // Créer un utilisateur basique à partir des données limitées
                      const basicUser: User = {
                        id: sportifId || 'unknown-id',
                        nom: sportif.nom || '',
                        prenom: sportif.prenom || '',
                        email: decodedToken.username,
                        role: UserRole.CLIENT,
                        token: token,
                        photo: sportif.photo || null,
                      };

                      // Ajouter les participations si elles sont présentes dans le sportif d'origine
                      if (sportif.participations) {
                        (basicUser as any).participations =
                          sportif.participations;
                        console.log(
                          'Participations récupérées (fallback):',
                          sportif.participations.length
                        );
                      }

                      // Stockez l'utilisateur dans le localStorage
                      this.updateCurrentUser(basicUser);
                      return of(basicUser);
                    })
                  );
              }),
              catchError((err) => {
                console.warn(
                  "Erreur lors de la récupération de la liste des sportifs. Création d'un utilisateur basique.",
                  err
                );

                // Si nous ne pouvons pas récupérer la liste des sportifs, créez un utilisateur basique
                const fallbackUser: User = {
                  id: 'unknown-id',
                  email: decodedToken.username,
                  role: UserRole.CLIENT,
                  token: token,
                };

                // Stockez l'utilisateur dans le localStorage
                this.updateCurrentUser(fallbackUser);
                return of(fallbackUser);
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
