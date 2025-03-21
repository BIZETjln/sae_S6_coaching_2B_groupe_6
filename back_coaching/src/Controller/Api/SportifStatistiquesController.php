<?php

namespace App\Controller\Api;

use App\Entity\Sportif;
use App\Repository\SeanceRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Serializer\SerializerInterface;
use Doctrine\ORM\EntityManagerInterface;
use DateTimeInterface;
use DateTime;

#[AsController]
class SportifStatistiquesController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer
    ) {}

    #[Route('/api/sportifs/{id}/statistiques', name: 'api_sportif_statistiques', methods: ['GET'])]
    public function getStatistiques(
        Request $request, 
        Sportif $sportif, 
        SeanceRepository $seanceRepository
    ): Response
    {
        // Vérifier que l'utilisateur a le droit d'accéder aux données
        $user = $this->getUser();
        if (!$user instanceof Sportif || $user->getId() !== $sportif->getId()) {
            return $this->json(['message' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        // Récupération des paramètres de période
        $period = $request->query->get('period');
        $dateMin = $request->query->get('date_min');
        $dateMax = $request->query->get('date_max');

        // Mode 1: Si period est spécifié, calculer les dates en fonction
        if ($period && $dateMin) {
            try {
                $dateMinObj = new DateTime($dateMin);
                
                switch ($period) {
                    case 'weekly':
                        $dateMaxObj = clone $dateMinObj;
                        $dateMaxObj->modify('+6 days');
                        break;
                    case 'monthly':
                        // On commence par le 1er jour du mois de la date donnée
                        $dateMinObj->modify('first day of this month');
                        $dateMaxObj = clone $dateMinObj;
                        $dateMaxObj->modify('last day of this month');
                        break;
                    case 'quarterly':
                        $dateMaxObj = clone $dateMinObj;
                        $dateMaxObj->modify('+3 months -1 day');
                        break;
                    case 'yearly':
                        $dateMaxObj = clone $dateMinObj;
                        $dateMaxObj->modify('+1 year -1 day');
                        break;
                    default:
                        return $this->json(['message' => 'Période non valide'], Response::HTTP_BAD_REQUEST);
                }
            } catch (\Exception $e) {
                return $this->json(['message' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }
        } 
        // Mode 2: Si date_min et date_max sont spécifiés (période personnalisée), utiliser ces dates directement
        elseif ($dateMin && $dateMax) {
            try {
                $dateMinObj = new DateTime($dateMin);
                $dateMaxObj = new DateTime($dateMax);
                
                // Vérifier que date_max est après date_min
                if ($dateMaxObj < $dateMinObj) {
                    return $this->json(['message' => 'La date de fin doit être postérieure à la date de début'], Response::HTTP_BAD_REQUEST);
                }
            } catch (\Exception $e) {
                return $this->json(['message' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }
        } else {
            return $this->json(['message' => 'Paramètres de date invalides. Veuillez spécifier soit (period + date_min) soit (date_min + date_max)'], Response::HTTP_BAD_REQUEST);
        }

        // Ajuster la fin de journée pour date_max
        $dateMaxObj->setTime(23, 59, 59);
        
        // Récupération des statistiques
        $stats = $this->collecterStatistiques($sportif, $dateMinObj, $dateMaxObj, $seanceRepository);
        
        // Utiliser une réponse simple pour éviter le problème d'encodage
        return new JsonResponse($stats);
    }

    private function collecterStatistiques(
        Sportif $sportif, 
        DateTimeInterface $dateMin, 
        DateTimeInterface $dateMax,
        SeanceRepository $seanceRepository
    ): array
    {
        // Récupérer les participations du sportif dans la période donnée
        $conn = $this->entityManager->getConnection();
        
        // Utiliser bin2hex pour la conversion de l'UUID comme dans d'autres parties de l'application
        $sportifIdHex = bin2hex($sportif->getId()->toBinary());
        
        // 1. Nombre total de séances réalisées
        $sqlTotalSeances = "
            SELECT COUNT(*) as total
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            WHERE HEX(p.sportif_id) = :sportifIdHex
            AND s.date_heure BETWEEN :dateMin AND :dateMax
            AND s.statut = 'VALIDEE'
            AND p.presence = TRUE
        ";
        
        $stmt = $conn->executeQuery($sqlTotalSeances, [
            'sportifIdHex' => $sportifIdHex,
            'dateMin' => $dateMin->format('Y-m-d H:i:s'),
            'dateMax' => $dateMax->format('Y-m-d H:i:s')
        ]);
        $totalSeances = (int) $stmt->fetchOne();
        
        // 2. Répartition par type de séance
        $sqlRepartition = "
            SELECT s.type_seance as type, COUNT(*) as count
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            WHERE HEX(p.sportif_id) = :sportifIdHex
            AND s.date_heure BETWEEN :dateMin AND :dateMax
            AND s.statut = 'VALIDEE'
            AND p.presence = TRUE
            GROUP BY s.type_seance
        ";
        
        $stmt = $conn->executeQuery($sqlRepartition, [
            'sportifIdHex' => $sportifIdHex,
            'dateMin' => $dateMin->format('Y-m-d H:i:s'),
            'dateMax' => $dateMax->format('Y-m-d H:i:s')
        ]);
        $repartition = $stmt->fetchAllAssociative();
        
        // 3. Top 3 des exercices les plus pratiqués
        $sqlTopExercices = "
            SELECT e.id, e.nom, COUNT(*) as count
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            JOIN seance_exercice se ON s.id = se.seance_id
            JOIN exercice e ON se.exercice_id = e.id
            WHERE HEX(p.sportif_id) = :sportifIdHex
            AND s.date_heure BETWEEN :dateMin AND :dateMax
            AND s.statut = 'VALIDEE'
            AND p.presence = TRUE
            GROUP BY e.id, e.nom
            ORDER BY count DESC
            LIMIT 3
        ";
        
        $stmt = $conn->executeQuery($sqlTopExercices, [
            'sportifIdHex' => $sportifIdHex,
            'dateMin' => $dateMin->format('Y-m-d H:i:s'),
            'dateMax' => $dateMax->format('Y-m-d H:i:s')
        ]);
        $rawExercices = $stmt->fetchAllAssociative();
        
        // Aller chercher les vrais objets Exercice pour obtenir les bons identifiants
        $topExercices = [];
        foreach ($rawExercices as $rawEx) {
            $exercice = $this->entityManager->getRepository(\App\Entity\Exercice::class)->find($rawEx['id']);
            if ($exercice) {
                $topExercices[] = [
                    'id' => $exercice->getId(), // Ceci sera automatiquement converti par la sérialisation
                    'nom' => $rawEx['nom'],
                    'count' => (int) $rawEx['count']
                ];
            } else {
                // Fallback si l'exercice n'est pas trouvé
                $topExercices[] = [
                    'id' => null,
                    'nom' => $rawEx['nom'],
                    'count' => (int) $rawEx['count']
                ];
            }
        }
        
        // 4. Durée totale d'entraînement basée sur les exercices
        $sqlDureeTotale = "
            SELECT SUM(e.duree_estimee) as duree_totale
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            JOIN seance_exercice se ON s.id = se.seance_id
            JOIN exercice e ON se.exercice_id = e.id
            WHERE HEX(p.sportif_id) = :sportifIdHex
            AND s.date_heure BETWEEN :dateMin AND :dateMax
            AND s.statut = 'VALIDEE'
            AND p.presence = TRUE
        ";
        
        $stmt = $conn->executeQuery($sqlDureeTotale, [
            'sportifIdHex' => $sportifIdHex,
            'dateMin' => $dateMin->format('Y-m-d H:i:s'),
            'dateMax' => $dateMax->format('Y-m-d H:i:s')
        ]);
        $dureeTotale = (int) $stmt->fetchOne();
        
        // Formater la durée en heures et minutes
        $heures = floor($dureeTotale / 60);
        $minutes = $dureeTotale % 60;
        $dureeFormatee = sprintf('%dh%02d', $heures, $minutes);
        
        return [
            'periode' => [
                'debut' => $dateMin->format('Y-m-d'),
                'fin' => $dateMax->format('Y-m-d')
            ],
            'total_seances' => $totalSeances,
            'repartition_types' => $repartition,
            'top_exercices' => $topExercices,
            'duree_totale' => [
                'minutes' => $dureeTotale,
                'formatee' => $dureeFormatee
            ]
        ];
    }
} 