import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-confidentialite',
  templateUrl: './confidentialite.component.html',
  styleUrls: ['./confidentialite.component.css'],
  standalone: false,
})
export class ConfidentialiteComponent implements OnInit {
  // Sections de confidentialité
  privacySections = [
    {
      title: 'Collecte de données',
      description: 'Nous collectons uniquement les informations nécessaires à la fourniture de nos services de coaching. Cela inclut vos coordonnées, vos objectifs sportifs et vos préférences d\'entraînement.',
      icon: 'bi-folder-check'
    },
    {
      title: 'Utilisation des données',
      description: 'Vos données sont utilisées pour personnaliser votre expérience, vous connecter avec les coachs appropriés et améliorer constamment nos services.',
      icon: 'bi-clipboard-data'
    },
    {
      title: 'Protection des données',
      description: 'Nous utilisons des protocoles de sécurité avancés pour protéger vos informations personnelles contre tout accès non autorisé ou toute violation.',
      icon: 'bi-shield-lock'
    },
    {
      title: 'Partage limité',
      description: 'Vos données sont partagées uniquement avec les coachs qui vous accompagnent et ne sont jamais vendues à des tiers à des fins commerciales.',
      icon: 'bi-share'
    }
  ];

  // Questions fréquentes sur la confidentialité
  privacyFAQs = [
    {
      question: 'Comment puis-je accéder à mes données personnelles ?',
      answer: 'Vous pouvez consulter et modifier vos données personnelles à tout moment depuis votre espace client en vous connectant à votre compte.'
    },
    {
      question: 'Combien de temps conservez-vous mes données ?',
      answer: 'Nous conservons vos données pendant la durée de votre abonnement actif et jusqu\'à 2 ans après votre dernière activité sur notre plateforme.'
    },
    {
      question: 'Comment demander la suppression de mes données ?',
      answer: 'Vous pouvez demander la suppression de vos données en contactant notre service client ou en utilisant l\'option "Supprimer mon compte" dans vos paramètres.'
    },
    {
      question: 'Utilisez-vous des cookies sur votre site ?',
      answer: 'Oui, nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour améliorer nos services. Vous pouvez les gérer dans vos préférences.'
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
      '.privacy-section, .faq-item, .privacy-card, .cta'
    );
    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  }
} 