import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {
  // Référence à Math pour l'utiliser dans le template
  Math = Math;

  // Données pour les témoignages
  testimonials = [
    {
      name: 'Sophie Martin',
      role: 'Membre depuis 2 ans',
      text: "SportCoach a complètement transformé ma routine d'entraînement. Les coachs sont incroyables et les séances toujours motivantes !",
      rating: 5,
    },
    {
      name: 'Thomas Dubois',
      role: 'Membre depuis 6 mois',
      text: "J'ai perdu 15kg en suivant les conseils de mon coach. La plateforme est intuitive et les séances sont adaptées à mon niveau.",
      rating: 4.5,
    },
    {
      name: 'Emma Petit',
      role: 'Membre depuis 1 an',
      text: "Les séances en duo sont parfaites pour rester motivé. J'apprécie particulièrement la diversité des exercices proposés.",
      rating: 5,
    },
  ];

  // Données pour les thèmes d'entraînement
  trainingThemes = [
    {
      title: 'Fitness',
      description:
        'Améliorez votre condition physique générale avec des exercices variés.',
      icon: 'bi-heart-pulse',
      color: 'text-danger',
    },
    {
      title: 'Musculation',
      description:
        'Développez votre force et votre masse musculaire avec des programmes ciblés.',
      icon: 'bi-trophy',
      color: 'text-primary',
    },
    {
      title: 'Cardio',
      description:
        'Renforcez votre endurance et améliorez votre santé cardiovasculaire.',
      icon: 'bi-lightning-charge',
      color: 'text-warning',
    },
    {
      title: 'Yoga',
      description:
        'Gagnez en souplesse et en équilibre tout en réduisant votre stress.',
      icon: 'bi-flower1',
      color: 'text-success',
    },
    {
      title: 'CrossFit',
      description:
        'Relevez des défis variés combinant force, endurance et agilité.',
      icon: 'bi-stopwatch',
      color: 'text-danger',
    },
    {
      title: 'Nutrition',
      description:
        'Optimisez vos résultats avec des conseils nutritionnels adaptés.',
      icon: 'bi-egg-fried',
      color: 'text-success',
    },
    {
      title: 'Récupération',
      description:
        'Apprenez les techniques essentielles pour une récupération optimale.',
      icon: 'bi-battery-charging',
      color: 'text-info',
    },
    {
      title: 'Perte de poids',
      description:
        'Atteignez vos objectifs de perte de poids avec un suivi personnalisé.',
      icon: 'bi-graph-down-arrow',
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
    const animatedElements = document.querySelectorAll(
      '.feature-card, .pricing-card, .theme-card, .testimonial, .cta'
    );
    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  }
}
