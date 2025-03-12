<?php

namespace App\Controller\Admin;

use App\Entity\Coach;
use App\Entity\Sportif;
use App\Entity\Seance;
use App\Entity\Exercice;
use App\Entity\FicheDePaie;
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
        yield MenuItem::linkToCrud('Fiches de paie', 'fas fa-file-invoice-dollar', FicheDePaie::class);
    }
}
