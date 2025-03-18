<?php

namespace App\Controller\Api;

use App\Entity\Seance;
use App\Entity\Sportif;
use App\Enum\TypeSeance;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class SeanceInscriptionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function toggleInscription(Seance $seance): JsonResponse
    {
        // Vérifier que l'utilisateur est un sportif
        $user = $this->getUser();
        if (!$user instanceof Sportif) {
            return $this->json(['message' => 'Seuls les sportifs peuvent s\'inscrire à une séance'], Response::HTTP_FORBIDDEN);
        }

        // Si le sportif est déjà inscrit, on le désinscrit
        if ($seance->getSportifs()->contains($user)) {
            $seance->removeSportif($user);
            $this->entityManager->flush();
            return $this->json(['message' => 'Désinscription réussie'], Response::HTTP_OK);
        } 
        // Sinon, on l'inscrit
        else {
            // Vérifier la capacité de la séance selon son type
            $nombreSportifs = $seance->getSportifs()->count();
            $limitesSportifs = [
                TypeSeance::SOLO->value => 1,
                TypeSeance::DUO->value => 2,
                TypeSeance::TRIO->value => 3,
            ];
            
            $limite = $limitesSportifs[$seance->getTypeSeance()->value] ?? 0;
            if ($nombreSportifs >= $limite) {
                return $this->json([
                    'message' => sprintf('Cette séance %s est déjà complète (maximum %d sportifs)', 
                        $seance->getTypeSeance()->value, $limite)
                ], Response::HTTP_BAD_REQUEST);
            }

            try {
                $seance->addSportif($user);
                $this->entityManager->flush();
                return $this->json(['message' => 'Inscription réussie'], Response::HTTP_OK);
            } catch (\InvalidArgumentException $e) {
                return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        }
    }
} 