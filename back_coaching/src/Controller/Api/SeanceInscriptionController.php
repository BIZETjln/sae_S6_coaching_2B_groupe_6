<?php

namespace App\Controller\Api;

use App\Entity\Seance;
use App\Entity\Sportif;
use App\Enum\TypeSeance;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class SeanceInscriptionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {}

    public function toggleInscription(Seance $seance): JsonResponse
    {
        // Vérifier que l'utilisateur est un sportif
        $user = $this->getUser();
        if (!$user instanceof Sportif) {
            return $this->json(['message' => 'Seuls les sportifs peuvent s\'inscrire à une séance'], Response::HTTP_FORBIDDEN);
        }

        // On ignore les données de la requête et on utilise uniquement l'utilisateur courant
        // Cela garantit que seul l'utilisateur courant peut s'inscrire/désinscrire

        // Rechercher une participation existante
        $participationRepository = $this->entityManager->getRepository(\App\Entity\Participation::class);
        $participation = $participationRepository->findOneBy([
            'sportif' => $user,
            'seance' => $seance
        ]);

        // Si le sportif est déjà inscrit, on le désinscrit
        if ($participation) {
            $this->entityManager->remove($participation);
            $this->entityManager->flush();
            return $this->json(['message' => 'Désinscription réussie'], Response::HTTP_OK);
        } 
        // Sinon, on l'inscrit
        else {
            // Vérifier la capacité de la séance selon son type
            $nombreSportifs = count($seance->getParticipations());
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
                // Créer une nouvelle participation
                $newParticipation = new \App\Entity\Participation();
                $newParticipation->setSportif($user);
                $newParticipation->setSeance($seance);
                
                $this->entityManager->persist($newParticipation);
                $this->entityManager->flush();
                
                return $this->json(['message' => 'Inscription réussie'], Response::HTTP_OK);
            } catch (\Exception $e) {
                return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        }
    }
} 