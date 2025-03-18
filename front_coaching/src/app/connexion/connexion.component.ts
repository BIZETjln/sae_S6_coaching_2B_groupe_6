import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserRole, User } from '../services/auth.service';

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.component.html',
  styleUrls: ['./connexion.component.scss'],
  standalone: false
})
export class ConnexionComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl: string;
  UserRole = UserRole; // Pour pouvoir l'utiliser dans le template
  showPassword = false; // Propriété pour afficher/masquer le mot de passe

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Rediriger vers la page d'accueil si déjà connecté
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/']);
    }
    
    // Initialiser le formulaire
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
    
    // Récupérer l'URL de retour des paramètres de requête ou utiliser la page d'accueil
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngOnInit(): void {
    // Rien à faire ici pour l'instant
  }

  // Méthode pour afficher/masquer le mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Getter pratique pour accéder facilement aux champs du formulaire
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Arrêter ici si le formulaire est invalide
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: (error: Error) => {
          this.error = error.message || 'Une erreur est survenue';
          this.loading = false;
        }
      });
  }

  // Méthodes pour se connecter rapidement avec différents rôles (pour les tests)
  loginAsClient() {
    this.loginAs(UserRole.CLIENT);
  }

  loginAsCoach() {
    this.loginAs(UserRole.COACH);
  }

  loginAsAgent() {
    this.loginAs(UserRole.AGENT);
  }

  loginAsResponsable() {
    this.loginAs(UserRole.RESPONSABLE);
  }

  private loginAs(role: UserRole) {
    this.loading = true;
    this.error = '';
    
    this.authService.loginAs(role).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error: Error) => {
        this.error = error.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }

  // Méthode pour la connexion rapide en tant que sportif1@example.com (pour les développeurs)
  devLogin() {
    this.loading = true;
    this.error = '';
    
    // Remplir automatiquement le formulaire
    this.loginForm.patchValue({
      email: 'sportif1@example.com',
      password: 'password123'
    });
    
    // Soumettre le formulaire
    this.onSubmit();
  }
}
