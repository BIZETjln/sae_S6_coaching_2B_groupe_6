import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.component.html',
  styleUrl: './inscription.component.css',
  standalone: false
})
export class InscriptionComponent implements OnInit {
  inscriptionForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;
  niveaux = ['Débutant', 'Intermédiaire', 'Avancé'];
  dateInscription: Date = new Date();

  constructor(private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.initForm();
  }

  // Initialisation du formulaire avec validation
  private initForm(): void {
    this.inscriptionForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      niveau: ['Débutant', Validators.required],
      role: [{ value: 'sportif', disabled: true }],
      dateInscription: [
        { value: this.formatDate(this.dateInscription), disabled: true },
      ],
    });
  }

  // Formater la date au format YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Getter pour accéder facilement aux champs du formulaire
  get f() {
    return this.inscriptionForm.controls;
  }

  // Afficher/masquer le mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Soumission du formulaire
  onSubmit(): void {
    this.submitted = true;

    // Arrêter si le formulaire est invalide
    if (this.inscriptionForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Récupérer les valeurs du formulaire, y compris les champs désactivés
    const formValues = {
      ...this.inscriptionForm.getRawValue(),
      dateInscription: this.dateInscription,
    };

    // Simulation d'une inscription (à remplacer par un vrai appel API)
    setTimeout(() => {
      try {
        // Ici, vous feriez normalement un appel API pour enregistrer l'utilisateur
        console.log("Données d'inscription:", formValues);

        // Inscription réussie
        this.router.navigate(['/connexion']);
      } catch (err) {
        // Échec de l'inscription
        this.error =
          "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
        this.loading = false;
      }
    }, 1500); // Délai simulé pour montrer le chargement
  }
}
