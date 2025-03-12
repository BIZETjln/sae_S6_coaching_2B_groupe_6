import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.component.html',
  styleUrl: './connexion.component.css',
})
export class ConnexionComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;

  constructor(private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.initForm();
  }

  // Initialisation du formulaire avec validation
  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  // Getter pour accéder facilement aux champs du formulaire
  get f() {
    return this.loginForm.controls;
  }

  // Afficher/masquer le mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Soumission du formulaire
  onSubmit(): void {
    this.submitted = true;

    // Arrêter si le formulaire est invalide
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Simulation d'une connexion (à remplacer par un vrai appel API)
    setTimeout(() => {
      // Exemple de vérification simple (à remplacer par une vraie authentification)
      const email = this.f['email'].value;
      const password = this.f['password'].value;

      if (email === 'user@example.com' && password === 'password') {
        // Connexion réussie
        console.log('Connexion réussie');
        // Redirection vers la page d'accueil
        this.router.navigate(['/']);
      } else {
        // Échec de connexion
        this.error = 'Email ou mot de passe incorrect';
        this.loading = false;
      }
    }, 1500); // Délai simulé pour montrer le chargement
  }
}
