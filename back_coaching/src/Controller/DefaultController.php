<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DefaultController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function home(): Response
    {
        return $this->redirectToRoute('app_angular');
    }

    #[Route('/app/{route}', name: 'app_angular', requirements: ['route' => '^.*$'], defaults: ['route' => null])]
    public function index(): Response
    {
        return $this->render('app/index.html.twig');
    }
}