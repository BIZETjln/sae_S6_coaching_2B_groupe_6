<?php

namespace App\Repository;

use App\Entity\Coach;
use App\Entity\Seance;
use App\Entity\Sportif;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV4;

/**
 * @extends ServiceEntityRepository<Seance>
 */
class SeanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Seance::class);
    }

    /**
     * Vérifie si un coach est disponible à une date et heure spécifiques
     * 
     * @param Coach $coach Le coach concerné
     * @param \DateTime $dateTime La date et l'heure à vérifier
     * @param Uuid|null $currentSeanceId L'ID de la séance en cours d'édition (à exclure de la vérification)
     * @return bool true si le coach a un conflit, false sinon
     */
    public function hasConflictingSession(Coach $coach, \DateTime $dateTime, ?Uuid $currentSeanceId = null): bool
    {
        // Définir les limites de temps pour cette séance
        $seanceDebut = clone $dateTime;
        $seanceFin = clone $dateTime;
        $seanceFin->modify('+90 minutes');
        
        // Convertir l'UUID du coach au format sans tirets pour la requête SQL
        $coachIdHex = str_replace('-', '', $coach->getId()->__toString());
        
        // Convertir l'ID de la séance actuelle
        $currentIdHex = $currentSeanceId ? str_replace('-', '', $currentSeanceId->__toString()) : null;
        
        // Utiliser une requête SQL native pour éviter les problèmes avec les UUID
        $conn = $this->getEntityManager()->getConnection();
        $sql = "
            SELECT COUNT(*) as conflict_count
            FROM seance
            WHERE HEX(coach_id) = :coachIdHex
            " . ($currentIdHex ? "AND HEX(id) != :currentIdHex" : "") . "
            AND (
                -- Vérifier si une séance existante chevauche la nouvelle séance
                -- La condition garantit que les séances qui se suivent exactement sont autorisées
                (
                    -- Soit la séance existante commence avant la fin de la nouvelle
                    date_heure < :seanceFin
                    AND
                    -- ET la séance existante finit après le début de la nouvelle
                    DATE_ADD(date_heure, INTERVAL 90 MINUTE) > :seanceDebut
                    AND
                    -- MAIS on exclut le cas où la séance existante commence exactement à la fin de la nouvelle
                    date_heure != :seanceFin
                    AND
                    -- ET on exclut le cas où la séance existante finit exactement au début de la nouvelle
                    DATE_ADD(date_heure, INTERVAL 90 MINUTE) != :seanceDebut
                )
            )
        ";
        
        $params = [
            'coachIdHex' => $coachIdHex,
            'seanceDebut' => $seanceDebut->format('Y-m-d H:i:s'),
            'seanceFin' => $seanceFin->format('Y-m-d H:i:s')
        ];
        
        if ($currentIdHex) {
            $params['currentIdHex'] = $currentIdHex;
        }
        
        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery($params);
        
        $result = $resultSet->fetchAssociative();
        
        return $result['conflict_count'] > 0;
    }

    public function hasSportifSessionConflict(Sportif $sportif, \DateTime $dateTime, ?Uuid $currentSeanceId = null): bool
    {
        // Définir les limites de temps pour cette séance
        $seanceDebut = clone $dateTime;
        $seanceFin = clone $dateTime;
        $seanceFin->modify('+90 minutes');
        
        // Convertir l'UUID du sportif au format sans tirets pour la requête SQL
        $sportifIdHex = str_replace('-', '', $sportif->getId()->__toString());
        
        // Convertir l'ID de la séance actuelle
        $currentIdHex = $currentSeanceId ? str_replace('-', '', $currentSeanceId->__toString()) : null;
        
        // Utiliser une requête SQL native pour vérifier les conflits
        $conn = $this->getEntityManager()->getConnection();
        $sql = "
            SELECT COUNT(*) as conflict_count
            FROM participation p
            JOIN seance s ON p.seance_id = s.id
            WHERE HEX(p.sportif_id) = :sportifIdHex
            " . ($currentIdHex ? "AND HEX(s.id) != :currentIdHex" : "") . "
            AND (
                -- Vérifier si une séance existante chevauche la nouvelle séance
                (
                    -- Soit la séance existante commence avant la fin de la nouvelle
                    s.date_heure < :seanceFin
                    AND
                    -- ET la séance existante finit après le début de la nouvelle
                    DATE_ADD(s.date_heure, INTERVAL 90 MINUTE) > :seanceDebut
                    AND
                    -- MAIS on exclut le cas où la séance existante commence exactement à la fin de la nouvelle
                    s.date_heure != :seanceFin
                    AND
                    -- ET on exclut le cas où la séance existante finit exactement au début de la nouvelle
                    DATE_ADD(s.date_heure, INTERVAL 90 MINUTE) != :seanceDebut
                )
            )
        ";
        
        $params = [
            'sportifIdHex' => $sportifIdHex,
            'seanceDebut' => $seanceDebut->format('Y-m-d H:i:s'),
            'seanceFin' => $seanceFin->format('Y-m-d H:i:s'),
        ];
        
        if ($currentIdHex) {
            $params['currentIdHex'] = $currentIdHex;
        }
        
        $stmt = $conn->executeQuery($sql, $params);
        $result = $stmt->fetchAssociative();
        
        return $result['conflict_count'] > 0;
    }

    //    /**
    //     * @return Seance[] Returns an array of Seance objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('s.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Seance
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
