import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SportifService } from '../services/sportif.service';
import { Sportif } from '../models/sportif.model';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.component.html',
  styleUrl: './inscription.component.css',
  standalone: false,
})
export class InscriptionComponent implements OnInit {
  inscriptionForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  successMessage = '';
  showSuccess = false;
  showPassword = false;
  niveaux = ['debutant', 'intermediaire', 'avance']; // Niveaux adaptés au format de l'API
  dateInscription: Date = new Date();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private sportifService: SportifService
  ) {}

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
      niveau_sportif: ['debutant', Validators.required],
      photo: [null], // La photo doit être null
      date_inscription: [
        { value: this.formatDateFrench(this.dateInscription), disabled: true },
      ],
    });
  }

  // Formater la date au format ISO (YYYY-MM-DDTHH:MM:SS.sssZ) pour l'API
  private formatDateISO(date: Date): string {
    return date.toISOString();
  }

  // Formater la date au format français (JJ/MM/YYYY HH:MM) pour l'affichage
  private formatDateFrench(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
    this.showSuccess = false;

    // Récupérer les valeurs du formulaire, y compris les champs désactivés
    const formValues = {
      ...this.inscriptionForm.getRawValue(),
      date_inscription: this.formatDateISO(this.dateInscription),
      photo: null, // S'assurer que la photo est forcément null
    } as Sportif;

    this.sportifService.inscrire(formValues).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.successMessage = 'Compte créé avec succès!';
        this.showSuccess = true;

        // Redirection avec délai pour laisser le temps à l'utilisateur de voir le message de succès
        setTimeout(() => {
          this.router.navigate(['/connexion']);
        }, 2000);
      },
      error: (err) => {
        console.error("Erreur d'inscription:", err);
        this.error =
          "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
        this.loading = false;
      },
    });
  }
}
