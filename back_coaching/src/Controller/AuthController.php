<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class AuthController extends AbstractController{
    public function __construct(
        private Security $security
    ) { }

    #[Route('/api/user/me', name: 'api_user_me', methods: ['GET'])]
    public function me()
    {
        /** @var Utilisateur|null $user */
        $user = $this->security->getUser();
        if (!empty($user)) {
            return $this->json(
                $user,
                Response::HTTP_OK,
                [],
                ['groups' => 'sportif:read']
            );
        } else {
            return new JsonResponse(null);
        }
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): Response
    {
        // L'utilisateur est authentifié à ce stade
        // lexik/jwt-authentication-bundle s'occupe de retourner le JWT
        return new Response('Logged !');
    }
}
