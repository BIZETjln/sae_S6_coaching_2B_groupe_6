<?php

namespace App\Repository;

use App\Entity\Coach;
use App\Entity\Seance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

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
     * @return bool true si le coach est disponible, false sinon
     */
    public function hasConflictingSession(Coach $coach, \DateTime $dateTime): bool
    {
        $startCheck = clone $dateTime;
        $startCheck->modify('-90 minutes');

        $endCheck = clone $dateTime;
        $endCheck->modify('+90 minutes');

        $qb = $this->createQueryBuilder('s');
        $qb->select('COUNT(s.id)')
            ->where('s.coach = :coach')
            ->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->between('s.date_heure', ':start_check', ':date_time'),
                    $qb->expr()->between(':date_time', 's.date_heure', 'DATE_ADD(s.date_heure, INTERVAL 90 MINUTE)')
                )
            )
            ->setParameter('coach', $coach)
            ->setParameter('date_time', $dateTime)
            ->setParameter('start_check', $startCheck);

        return $qb->getQuery()->getSingleScalarResult() > 0;
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
