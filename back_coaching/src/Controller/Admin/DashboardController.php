<?php

namespace App\Controller\Admin;

use App\Entity\Coach;
use App\Entity\Sportif;
use App\Entity\Seance;
use App\Entity\Exercice;
use App\Entity\FicheDePaie;
use App\Entity\Utilisateur;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/admin', routeName: 'admin')]
class DashboardController extends AbstractDashboardController
{
    public function index(): Response
    {
        return $this->render('admin/dashboard.html.twig');
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('Coaching');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Dashboard', 'fa fa-home');

        if ($this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('Statistiques');
            yield MenuItem::linkToRoute('Tableau de bord', 'fa fa-chart-bar', 'admin_stats')->setPermission('ROLE_ADMIN');
        }
        // Menu pour les coachs
        if ($this->isGranted('ROLE_COACH') && !$this->isGranted('ROLE_ADMIN')) {
            yield MenuItem::section('Mon espace coach');
            yield MenuItem::linktoRoute('Calendrier', 'fas fa-calendar-check', 'route_coach_calendar');
            yield MenuItem::linkToCrud('Mes Séances', 'fas fa-calendar-check', Seance::class)
                ->setController(CoachSeanceCrudController::class);
            yield MenuItem::linkToCrud('Exercices', 'fas fa-dumbbell', Exercice::class);
        }

        if ($this->isGranted('ROLE_ADMIN')) {
            // Section Gestion des comptes
            yield MenuItem::section('Gestion des comptes');
            yield MenuItem::linkToCrud('Coachs', 'fas fa-user-tie', Coach::class);
            yield MenuItem::linkToCrud('Sportifs', 'fas fa-running', Sportif::class);

            // Section Gestion des séances et exercices
            yield MenuItem::section('Gestion des séances');
            yield MenuItem::linkToCrud('Séances', 'fas fa-calendar-alt', Seance::class);
            yield MenuItem::linkToCrud('Exercices', 'fas fa-dumbbell', Exercice::class);

            // Section Gestion des fiches de paie (pour les responsables)
            yield MenuItem::section('Administration');
            yield MenuItem::linkToCrud('Responsables', 'fas fa-user-tie', Utilisateur::class);
            yield MenuItem::linkToCrud('Fiches de paie', 'fas fa-file-invoice-dollar', FicheDePaie::class);
        }
    }
}
