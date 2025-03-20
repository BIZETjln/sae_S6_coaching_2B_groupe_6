<?php

namespace App\Controller\Api;

use App\Entity\Sportif;
use App\Entity\Participation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class SportifSuppressionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function __invoke(Sportif $sportif): JsonResponse
    {
        // Vérification des droits
        $user = $this->getUser();
        if (!$user || ($user->getId() !== $sportif->getId() && !$this->isGranted('ROLE_ADMIN'))) {
            return $this->json(['message' => 'Vous n\'êtes pas autorisé à supprimer ce profil.'], Response::HTTP_FORBIDDEN);
        }

        try {
            // 1. Récupération des participations liées à ce sportif
            $participationRepository = $this->entityManager->getRepository(Participation::class);
            $participations = $participationRepository->findBy(['sportif' => $sportif]);

            // 2. Suppression des participations
            foreach ($participations as $participation) {
                $this->entityManager->remove($participation);
            }
            
            // 3. Suppression du sportif
            $this->entityManager->remove($sportif);
            $this->entityManager->flush();

            return $this->json(['message' => 'Compte supprimé avec succès'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Erreur lors de la suppression: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
} 