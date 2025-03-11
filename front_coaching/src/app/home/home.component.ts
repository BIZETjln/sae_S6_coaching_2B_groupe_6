import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // Référence à Math pour l'utiliser dans le template
  Math = Math;

  // Données pour les témoignages
  testimonials = [
    {
      name: 'Sophie M.',
      role: 'Membre depuis 6 mois',
      text: "Grâce à SportCoach, j'ai pu suivre mes progrès et atteindre mes objectifs. Les coachs sont professionnels et à l'écoute.",
      rating: 5,
    },
    {
      name: 'Thomas L.',
      role: 'Membre depuis 1 an',
      text: "Les séances en duo sont parfaites pour se motiver. L'application est intuitive et permet de bien suivre sa progression.",
      rating: 4.5,
    },
    {
      name: 'Julien D.',
      role: 'Membre depuis 8 mois',
      text: "J'apprécie particulièrement le suivi personnalisé et les statistiques qui me permettent de visualiser mes progrès au fil du temps.",
      rating: 5,
    },
  ];

  // Données pour les thèmes d'entraînement
  trainingThemes = [
    {
      title: 'Cardio',
      description: 'Améliorez votre endurance et votre santé cardiovasculaire',
      icon: 'bi-heart-pulse',
      color: 'text-danger',
    },
    {
      title: 'CrossFit',
      description: 'Entraînement fonctionnel à haute intensité',
      icon: 'bi-lightning-charge',
      color: 'text-warning',
    },
    {
      title: 'Fitness',
      description: 'Améliorez votre condition physique générale',
      icon: 'bi-bicycle',
      color: 'text-success',
    },
    {
      title: 'Musculation',
      description: 'Développez votre force et votre masse musculaire',
      icon: 'bi-trophy',
      color: 'text-primary',
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Animation au défilement
    this.initScrollAnimation();
  }

  // Méthode pour initialiser les animations au défilement
  private initScrollAnimation(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Sélectionner tous les éléments à animer
    document
      .querySelectorAll(
        '.feature-card, .pricing-card, .testimonial, .card, .cta'
      )
      .forEach((element) => {
        observer.observe(element);
      });
  }
}
