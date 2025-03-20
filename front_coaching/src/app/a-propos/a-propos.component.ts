import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-a-propos',
  templateUrl: './a-propos.component.html',
  styleUrls: ['./a-propos.component.css'],
  standalone: false,
})
export class AProposComponent implements OnInit {
  // Histoire de l'entreprise
  historyEvents = [
    {
      year: '2018',
      title: 'Création de SportCoach',
      description: 'Fondation de la société par une équipe passionnée de sport et de bien-être, avec la vision de démocratiser l\'accès au coaching sportif personnalisé.'
    },
    {
      year: '2019',
      title: 'Lancement de la plateforme',
      description: 'Lancement de notre première version de la plateforme avec 10 coachs certifiés, proposant des séances individuelles et collectives dans 5 villes françaises.'
    },
    {
      year: '2020',
      title: 'Adaptation digitale',
      description: 'Face à la crise sanitaire, développement de fonctionnalités de coaching à distance et de séances en visioconférence pour maintenir le lien avec nos clients.'
    },
    {
      year: '2021',
      title: 'Expansion nationale',
      description: 'Croissance de notre réseau à plus de 50 coachs professionnels dans toute la France, couvrant désormais plus de 20 disciplines sportives différentes.'
    },
    {
      year: '2022',
      title: 'Lancement de l\'application mobile',
      description: 'Création de notre application mobile permettant de réserver des séances, suivre ses progrès et communiquer avec son coach directement depuis son smartphone.'
    },
    {
      year: '2023',
      title: 'Nouvelle plateforme',
      description: 'Lancement de notre plateforme repensée avec un système de suivi personnalisé, tableau de bord interactif et fonctionnalités de planification avancées.'
    }
  ];

  // Valeurs de l'entreprise
  coreValues = [
    {
      title: 'Excellence',
      description: 'Nous visons l\'excellence dans tous nos services et programmes d\'entraînement, en sélectionnant les meilleurs coachs et en développant des méthodes d\'entraînement basées sur les dernières recherches scientifiques.',
      icon: 'bi-trophy'
    },
    {
      title: 'Personnalisation',
      description: 'Chaque programme est adapté aux besoins spécifiques, aux objectifs et à l\'historique sportif de nos clients, en tenant compte de leurs contraintes et préférences personnelles.',
      icon: 'bi-person-check'
    },
    {
      title: 'Professionnalisme',
      description: 'Nos coachs sont tous certifiés et suivent une formation continue pour rester à la pointe des connaissances en sciences du sport, nutrition et préparation physique.',
      icon: 'bi-briefcase'
    },
    {
      title: 'Communauté',
      description: 'Nous créons une communauté solidaire où chacun peut trouver motivation et soutien, grâce à nos événements, défis collectifs et forums d\'échange entre membres.',
      icon: 'bi-people'
    },
    {
      title: 'Innovation',
      description: 'Notre plateforme évolue constamment pour intégrer les dernières technologies et méthodes d\'entraînement, afin d\'offrir une expérience toujours plus efficace et engageante.',
      icon: 'bi-lightbulb'
    },
    {
      title: 'Accessibilité',
      description: 'Nous nous engageons à rendre le coaching sportif accessible au plus grand nombre, à travers différentes formules adaptées à tous les budgets et niveaux de pratique.',
      icon: 'bi-universal-access'
    }
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
      '.history-item, .value-card, .mission-card, .cta'
    );
    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  }
} 