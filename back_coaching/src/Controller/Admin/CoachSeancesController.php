<?php

namespace App\Controller\Admin;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\Seance;
use App\Entity\Coach;
use App\Enum\StatutSeance;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class CoachSeancesController extends AbstractController
{

    #[Route('/admin/coach_seances', name: 'route_coach_seances')]
    public function index(EntityManagerInterface $entityManager, LoggerInterface $logger): Response
    {
        $coach = $this->getUser();
        $logger->info('Coach connecté: ' . get_class($coach));

        // Récupérer l'ID du coach et le convertir au format sans tirets
        $coachId = $coach->getId();
        $coachIdHex = str_replace('-', '', $coachId->__toString());

        // Requête SQL native pour récupérer les séances du coach
        $conn = $entityManager->getConnection();
        $sql = "
            SELECT s.* 
            FROM seance s
            WHERE HEX(s.coach_id) = :coachIdHex
            AND s.date_heure >= :now
            AND s.statut != :statut_annule
            ORDER BY s.date_heure ASC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'coachIdHex' => $coachIdHex,
            'now' => (new \DateTime())->format('Y-m-d H:i:s'),
            'statut_annule' => StatutSeance::ANNULEE->value
        ]);

        $seancesData = $resultSet->fetchAllAssociative();
        $logger->info('Nombre de séances trouvées: ' . count($seancesData));

        // Convertir les résultats SQL en objets Seance
        $seances = [];
        foreach ($seancesData as $data) {
            $seance = $entityManager->getRepository(Seance::class)->find($data['id']);
            if ($seance) {
                $seances[] = $seance;
            }
        }

        return $this->render('admin/coach/mes_seances.html.twig', [
            'seances' => $seances
        ]);
    }
}
