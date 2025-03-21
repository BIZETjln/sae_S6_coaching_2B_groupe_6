<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
final class AuthController extends AbstractController
{
    public function __construct(
        private Security $security
    ) {}

    #[Route('/user/me', name: 'api_user_me', methods: ['GET'])]
    public function me(): JsonResponse
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
        }
        return new JsonResponse(null);
    }

    #[Route('/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // Cette méthode ne sera jamais exécutée car le système de sécurité
        // interceptera la requête avant
        throw new \LogicException('Cette méthode ne devrait pas être appelée.');
    }
}