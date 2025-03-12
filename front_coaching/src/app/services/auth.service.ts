import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, delay, tap } from 'rxjs/operators';

export enum UserRole {
  RESPONSABLE = 'RESPONSABLE',
  COACH = 'COACH',
  AGENT = 'AGENT',
  CLIENT = 'CLIENT'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Utilisateurs fictifs pour les tests
  private mockUsers: User[] = [
    {
      id: 1,
      name: 'Jean Dupont',
      email: 'client@example.com',
      role: UserRole.CLIENT,
      avatar: 'assets/avatars/client.jpg'
    },
    {
      id: 2,
      name: 'Marie Coach',
      email: 'coach@example.com',
      role: UserRole.COACH,
      avatar: 'assets/avatars/coach.jpg'
    },
    {
      id: 3,
      name: 'Pierre Agent',
      email: 'agent@example.com',
      role: UserRole.AGENT,
      avatar: 'assets/avatars/agent.jpg'
    },
    {
      id: 4,
      name: 'Sophie Responsable',
      email: 'responsable@example.com',
      role: UserRole.RESPONSABLE,
      avatar: 'assets/avatars/responsable.jpg'
    }
  ];

  constructor(private http: HttpClient, private router: Router) {
    // Récupérer l'utilisateur du localStorage au démarrage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
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
    return this.currentUserValue ? roles.includes(this.currentUserValue.role) : false;
  }

  // Méthode de connexion simulée pour les tests
  login(email: string, password: string): Observable<User> {
    // Pour les tests, on accepte n'importe quel mot de passe
    const user = this.mockUsers.find(u => u.email === email);
    
    if (!user) {
      return throwError(() => new Error('Email ou mot de passe incorrect'));
    }

    // Simuler un délai réseau
    return of({
      ...user,
      token: 'fake-jwt-token.' + Math.random().toString(36).substring(2, 15)
    }).pipe(
      delay(800),
      tap(userData => {
        // Stocker les détails de l'utilisateur et le token JWT dans le localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

  // Méthode pour se connecter directement avec un rôle spécifique (pour les tests)
  loginAs(role: UserRole): Observable<User> {
    const user = this.mockUsers.find(u => u.role === role);
    
    if (!user) {
      return throwError(() => new Error(`Aucun utilisateur avec le rôle ${role} trouvé`));
    }

    // Simuler un délai réseau
    return of({
      ...user,
      token: 'fake-jwt-token.' + Math.random().toString(36).substring(2, 15)
    }).pipe(
      delay(500),
      tap(userData => {
        // Stocker les détails de l'utilisateur
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

  // Méthode de connexion réelle (à implémenter avec l'API)
  loginReal(email: string, password: string): Observable<User> {
    // À remplacer par un appel HTTP réel à l'API
    // return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password })
    //   .pipe(
    //     map(response => {
    //       // Stocker les détails de l'utilisateur et le token JWT dans le localStorage
    //       localStorage.setItem('currentUser', JSON.stringify(response));
    //       this.currentUserSubject.next(response);
    //       return response;
    //     })
    //   );
    
    // Pour l'instant, on utilise la méthode simulée
    return this.login(email, password);
  }

  logout(): void {
    // Supprimer l'utilisateur du localStorage
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }
} 