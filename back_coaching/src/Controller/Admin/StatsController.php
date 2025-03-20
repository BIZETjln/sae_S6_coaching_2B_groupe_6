<?php
// src/Controller/Admin/StatsController.php

namespace App\Controller\Admin;

use App\Entity\Seance;
use App\Entity\Sportif;
use App\Entity\Participation;
use App\Entity\Coach;
use App\Enum\ThemeSeance;
use App\Enum\StatutSeance;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Psr\Log\LoggerInterface;

class StatsController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;

    public function __construct(EntityManagerInterface $entityManager, LoggerInterface $logger)
    {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }

    #[Route('/admin/stats', name: 'admin_stats')]
    public function index(): Response
    {
        // 1. Statistiques de fréquentation
        $attendanceStats = $this->getAttendanceStats();

        // 2. Taux de remplissage des séances
        $fillRateStats = $this->getFillRateStats();

        // 3. Popularité des thèmes d'entraînement
        $themeStats = $this->getThemeStats();

        // 4. Statistiques des coachs
        $coachStats = $this->getCoachStats();

        // 5. Évolution des inscriptions de sportifs
        $registrationStats = $this->getRegistrationStats();

        // 6. Taux d'occupation par créneau horaire
        $timeSlotStats = $this->getTimeSlotStats();

        return $this->render('admin/stats/index.html.twig', [
            'attendanceStats' => $attendanceStats,
            'fillRateStats' => $fillRateStats,
            'themeStats' => $themeStats,
            'coachStats' => $coachStats,
            'registrationStats' => $registrationStats,
            'timeSlotStats' => $timeSlotStats
        ]);
    }

    private function getAttendanceStats(): array
    {
        $conn = $this->entityManager->getConnection();

        // Taux de présence global
        $sql = "
            SELECT 
                COUNT(CASE WHEN p.presence = 1 THEN 1 END) as present_count,
                COUNT(*) as total_count
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            WHERE s.statut = :statut_validee
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $globalAttendance = $resultSet->fetchAssociative();
        $attendanceRate = 0;
        if ($globalAttendance['total_count'] > 0) {
            $attendanceRate = ($globalAttendance['present_count'] / $globalAttendance['total_count']) * 100;
        }

        // Présence par mois (6 derniers mois)
        $sql = "
            SELECT 
                DATE_FORMAT(s.date_heure, '%Y-%m') as month,
                COUNT(CASE WHEN p.presence = 1 THEN 1 END) as present_count,
                COUNT(*) as total_count
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            WHERE s.date_heure >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
              AND s.statut = :statut_validee
            GROUP BY month
            ORDER BY month ASC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $monthlyAttendance = $resultSet->fetchAllAssociative();

        return [
            'global_rate' => round($attendanceRate, 1),
            'monthly' => $monthlyAttendance
        ];
    }

    private function getFillRateStats(): array
    {
        $conn = $this->entityManager->getConnection();

        // Taux de remplissage global (séances non annulées)
        $sqlGlobal = "
            SELECT 
                s.type_seance,
                COUNT(p.id) as participant_count,
                COUNT(DISTINCT s.id) as session_count,
                CASE 
                    WHEN s.type_seance = 'SOLO' THEN 1
                    WHEN s.type_seance = 'DUO' THEN 2
                    WHEN s.type_seance = 'TRIO' THEN 3
                    ELSE 0
                END as max_capacity
            FROM seance s
            LEFT JOIN participation p ON s.id = p.seance_id
            WHERE s.statut != :statut_annulee
            GROUP BY s.type_seance
        ";

        $stmtGlobal = $conn->prepare($sqlGlobal);
        $resultSetGlobal = $stmtGlobal->executeQuery([
            'statut_annulee' => StatutSeance::ANNULEE->value
        ]);

        // Taux de remplissage des séances validées uniquement
        $sqlValidated = "
            SELECT 
                s.type_seance,
                COUNT(p.id) as participant_count,
                COUNT(DISTINCT s.id) as session_count,
                CASE 
                    WHEN s.type_seance = 'SOLO' THEN 1
                    WHEN s.type_seance = 'DUO' THEN 2
                    WHEN s.type_seance = 'TRIO' THEN 3
                    ELSE 0
                END as max_capacity
            FROM seance s
            LEFT JOIN participation p ON s.id = p.seance_id
            WHERE s.statut = :statut_validee
            GROUP BY s.type_seance
        ";

        $stmtValidated = $conn->prepare($sqlValidated);
        $resultSetValidated = $stmtValidated->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $fillRates = [];
        $fillRatesValidated = [];

        $globalStats = $resultSetGlobal->fetchAllAssociative();
        $validatedStats = $resultSetValidated->fetchAllAssociative();

        // Traitement des stats globales
        foreach ($globalStats as $row) {
            $maxCapacity = $row['session_count'] * $row['max_capacity'];
            $fillRate = 0;
            if ($maxCapacity > 0) {
                $fillRate = ($row['participant_count'] / $maxCapacity) * 100;
            }

            $fillRates[] = [
                'type' => $row['type_seance'],
                'fill_rate' => round($fillRate, 1),
                'participant_count' => $row['participant_count'],
                'total_capacity' => $maxCapacity
            ];
        }

        // Traitement des stats des séances validées
        foreach ($validatedStats as $row) {
            $maxCapacity = $row['session_count'] * $row['max_capacity'];
            $fillRate = 0;
            if ($maxCapacity > 0) {
                $fillRate = ($row['participant_count'] / $maxCapacity) * 100;
            }

            $fillRatesValidated[] = [
                'type' => $row['type_seance'],
                'fill_rate' => round($fillRate, 1),
                'participant_count' => $row['participant_count'],
                'total_capacity' => $maxCapacity
            ];
        }

        return [
            'by_type' => $fillRates,
            'by_type_validated' => $fillRatesValidated
        ];
    }

    private function getThemeStats(): array
    {
        $conn = $this->entityManager->getConnection();

        // Popularité globale des thèmes
        $sql = "
            SELECT 
                s.theme_seance,
                COUNT(p.id) as participant_count
            FROM seance s
            JOIN participation p ON s.id = p.seance_id
            GROUP BY s.theme_seance
            ORDER BY participant_count DESC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery();

        $themePopularity = $resultSet->fetchAllAssociative();

        // Taux de présence par thème
        $sql = "
            SELECT 
                s.theme_seance,
                COUNT(CASE WHEN p.presence = 1 THEN 1 END) as present_count,
                COUNT(p.id) as total_count
            FROM seance s
            JOIN participation p ON s.id = p.seance_id
            WHERE s.statut = :statut_validee
            GROUP BY s.theme_seance
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $themeAttendance = [];
        foreach ($resultSet->fetchAllAssociative() as $row) {
            $attendanceRate = 0;
            if ($row['total_count'] > 0) {
                $attendanceRate = ($row['present_count'] / $row['total_count']) * 100;
            }

            $themeAttendance[] = [
                'theme' => $row['theme_seance'],
                'attendance_rate' => round($attendanceRate, 1),
                'present_count' => $row['present_count'],
                'total_count' => $row['total_count']
            ];
        }

        // Tendances mensuelles des thèmes
        $sql = "
            SELECT 
                DATE_FORMAT(s.date_heure, '%Y-%m') as month,
                s.theme_seance,
                COUNT(p.id) as participant_count
            FROM seance s
            JOIN participation p ON s.id = p.seance_id
            WHERE s.date_heure >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month, s.theme_seance
            ORDER BY month ASC, participant_count DESC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery();

        $monthlyThemes = $resultSet->fetchAllAssociative();

        return [
            'popularity' => $themePopularity,
            'attendance' => $themeAttendance,
            'monthly_trends' => $monthlyThemes
        ];
    }

    private function getCoachStats(): array
    {
        $conn = $this->entityManager->getConnection();

        // Performances des coachs (taux de présence des sportifs)
        $sql = "
            SELECT 
                CONCAT(u.prenom, ' ', u.nom) as coach_name,
                COUNT(CASE WHEN p.presence = 1 THEN 1 END) as present_count,
                COUNT(p.id) as total_count
            FROM seance s
            JOIN participation p ON s.id = p.seance_id
            JOIN coach c ON s.coach_id = c.id
            JOIN utilisateur u ON c.id = u.id
            WHERE s.statut = :statut_validee
            GROUP BY coach_name
            ORDER BY present_count DESC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $coachPerformance = [];
        foreach ($resultSet->fetchAllAssociative() as $row) {
            $attendanceRate = 0;
            if ($row['total_count'] > 0) {
                $attendanceRate = ($row['present_count'] / $row['total_count']) * 100;
            }

            $coachPerformance[] = [
                'coach' => $row['coach_name'],
                'attendance_rate' => round($attendanceRate, 1),
                'present_count' => $row['present_count'],
                'total_count' => $row['total_count']
            ];
        }

        // Nombre de séances par coach
        $sql = "
            SELECT 
                CONCAT(u.prenom, ' ', u.nom) as coach_name,
                COUNT(s.id) as session_count
            FROM seance s
            JOIN coach c ON s.coach_id = c.id
            JOIN utilisateur u ON c.id = u.id
            WHERE s.statut = :statut_validee
            GROUP BY coach_name
            ORDER BY session_count DESC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $coachSessions = $resultSet->fetchAllAssociative();

        return [
            'performance' => $coachPerformance,
            'sessions' => $coachSessions
        ];
    }

    private function getRegistrationStats(): array
    {
        $conn = $this->entityManager->getConnection();

        // Évolution des inscriptions mensuelles
        $sql = "
            SELECT 
                DATE_FORMAT(s.date_inscription, '%Y-%m') as month,
                COUNT(s.id) as registration_count
            FROM sportif s
            WHERE s.date_inscription >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery();

        $monthlyRegistrations = $resultSet->fetchAllAssociative();

        // Répartition par niveau
        $sql = "
            SELECT 
                s.niveau_sportif,
                COUNT(s.id) as sportif_count
            FROM sportif s
            GROUP BY s.niveau_sportif
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery();

        $levelDistribution = $resultSet->fetchAllAssociative();

        return [
            'monthly' => $monthlyRegistrations,
            'by_level' => $levelDistribution
        ];
    }

    private function getTimeSlotStats(): array
    {
        $conn = $this->entityManager->getConnection();

        // Créer tous les créneaux possibles de 6h à 21h par pas de 30 minutes
        $timeSlots = [];
        for ($hour = 6; $hour <= 21; $hour++) {
            foreach (['00', '30'] as $minute) {
                if ($hour == 21 && $minute == '30') continue; // Pas de créneau à 21h30
                $timeSlot = sprintf('%02d:%s', $hour, $minute);
                $timeSlots[$timeSlot] = [
                    'time' => $timeSlot,
                    'total_sessions' => 0,
                    'total_capacity' => 0,
                    'total_participants' => 0,
                    'by_coach' => []
                ];
            }
        }

        // Requête pour obtenir les statistiques par créneau horaire et par coach
        $sql = "
            SELECT 
                DATE_FORMAT(s.date_heure, '%H:%i') as time_slot,
                CONCAT(u.prenom, ' ', u.nom) as coach_name,
                COUNT(DISTINCT s.id) as session_count,
                COUNT(p.id) as participant_count,
                s.type_seance,
                CASE 
                    WHEN s.type_seance = 'SOLO' THEN 1
                    WHEN s.type_seance = 'DUO' THEN 2
                    WHEN s.type_seance = 'TRIO' THEN 3
                    ELSE 0
                END * COUNT(DISTINCT s.id) as total_capacity
            FROM seance s
            JOIN coach c ON s.coach_id = c.id
            JOIN utilisateur u ON c.id = u.id
            LEFT JOIN participation p ON s.id = p.seance_id
            WHERE s.statut = :statut_validee
            GROUP BY time_slot, coach_name, s.type_seance
            ORDER BY time_slot, coach_name
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'statut_validee' => StatutSeance::VALIDEE->value
        ]);

        $results = $resultSet->fetchAllAssociative();

        // Traiter les résultats
        foreach ($results as $row) {
            $timeSlot = $row['time_slot'];
            if (!isset($timeSlots[$timeSlot])) continue;

            $timeSlots[$timeSlot]['total_sessions'] += $row['session_count'];
            $timeSlots[$timeSlot]['total_capacity'] += $row['total_capacity'];
            $timeSlots[$timeSlot]['total_participants'] += $row['participant_count'];

            if (!isset($timeSlots[$timeSlot]['by_coach'][$row['coach_name']])) {
                $timeSlots[$timeSlot]['by_coach'][$row['coach_name']] = [
                    'sessions' => 0,
                    'capacity' => 0,
                    'participants' => 0
                ];
            }

            $timeSlots[$timeSlot]['by_coach'][$row['coach_name']]['sessions'] += $row['session_count'];
            $timeSlots[$timeSlot]['by_coach'][$row['coach_name']]['capacity'] += $row['total_capacity'];
            $timeSlots[$timeSlot]['by_coach'][$row['coach_name']]['participants'] += $row['participant_count'];
        }

        // Calculer les taux d'occupation
        foreach ($timeSlots as &$slot) {
            $slot['occupation_rate'] = $slot['total_capacity'] > 0
                ? round(($slot['total_participants'] / $slot['total_capacity']) * 100, 1)
                : 0;

            foreach ($slot['by_coach'] as $coach => &$stats) {
                $stats['occupation_rate'] = $stats['capacity'] > 0
                    ? round(($stats['participants'] / $stats['capacity']) * 100, 1)
                    : 0;
            }
        }

        return array_values($timeSlots);
    }
}
