<?php

namespace App\Controller\Admin;

use App\Entity\FicheDePaie;
use App\Entity\Seance;
use App\Enum\PeriodePaie;
use App\Enum\StatutSeance;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\MoneyField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Asset;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class FicheDePaieCrudController extends AbstractCrudController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public static function getEntityFqcn(): string
    {
        return FicheDePaie::class;
    }

    public function configureAssets(Assets $assets): Assets
    {
        return $assets
            ->addJsFile(Asset::new('js/fiche-paie-calculator.js')->onlyOnForms());
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            FormField::addPanel('Informations générales')
                ->setIcon('fa fa-file-invoice-dollar')
                ->setHelp('Informations de base de la fiche de paie'),

            AssociationField::new('coach', 'Coach')
                ->setRequired(true)
                ->setFormTypeOption('attr', [
                    'placeholder' => 'Sélectionnez un coach',
                    'class' => 'js-coach-select',
                    'data-calculator-url' => $this->generateUrl('admin_calculate_fiche_paie')
                ])
                ->setColumns(12),

            ChoiceField::new('periode', 'Période de paiement')
                ->setChoices(PeriodePaie::cases())
                ->setFormTypeOption('data', PeriodePaie::MOIS) // Par défaut: mensuel
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'periode-container js-periode-select'])
                ->setRequired(true)
                ->setColumns(12),

            FormField::addPanel('Détails du paiement')
                ->setIcon('fa fa-calculator')
                ->setHelp('Heures travaillées et montant total'),

            NumberField::new('total_heures', 'Total des heures')
                ->setFormTypeOption('attr', [
                    'placeholder' => 'Nombre d\'heures travaillées',
                    'class' => 'js-total-heures'
                ])
                ->setHelp('Nombre total d\'heures travaillées sur la période (1 séance = 1h30)')
                ->setNumDecimals(2)
                ->setRequired(true)
                ->setColumns(6),

            MoneyField::new('montant_total', 'Montant total')
                ->setCurrency('EUR')
                ->setStoredAsCents(false)
                ->setFormTypeOption('attr', [
                    'placeholder' => '0.00',
                    'class' => 'js-montant-total'
                ])
                ->setHelp('Montant total à payer au coach')
                ->setRequired(true)
                ->setColumns(6),
        ];
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Fiche de paie')
            ->setEntityLabelInPlural('Fiches de paie')
            ->setPageTitle('index', 'Liste des fiches de paie')
            ->setPageTitle('new', 'Créer une fiche de paie')
            ->setPageTitle('edit', 'Modifier la fiche de paie')
            ->setPageTitle('detail', 'Détails de la fiche de paie');
    }

    /**
     * Calcule le nombre d'heures travaillées et le montant total pour un coach sur une période donnée
     */
    #[Route('/admin/fiche-paie/calculate', name: 'admin_calculate_fiche_paie')]
    public function calculateFichePaie(Request $request): JsonResponse
    {
        $coachId = $request->query->get('coach');
        $periodeValue = $request->query->get('periode');

        if (!$coachId || !$periodeValue) {
            return new JsonResponse(['error' => 'Coach ID et période requis'], 400);
        }

        // Récupérer le coach
        $coach = $this->entityManager->getRepository('\App\Entity\Coach')->find($coachId);
        if (!$coach) {
            return new JsonResponse(['error' => 'Coach non trouvé'], 404);
        }

        // Récupérer la période (enum)
        $periode = PeriodePaie::from($periodeValue);

        // Déterminer les dates de début et de fin du mois actuel
        $currentMonth = (int)date('m');
        $year = date('Y');

        // Dates de début et fin du mois actuel
        $startDate = new \DateTime("$year-$currentMonth-01");
        $endDate = (clone $startDate)->modify('last day of this month');

        // Si c'est une période de semaine, ajuster les dates pour la semaine courante
        if ($periode === PeriodePaie::SEMAINE) {
            $startDate = new \DateTime('monday this week');
            $endDate = new \DateTime('sunday this week');
        }

        // Récupérer les séances validées du coach pour cette période
        $conn = $this->entityManager->getConnection();

        // Convertir l'UUID du coach au format hexadécimal pour la requête SQL
        $coachIdHex = str_replace('-', '', $coach->getId()->__toString());

        $sql = "
            SELECT COUNT(*) as nb_seances
            FROM seance
            WHERE HEX(coach_id) = :coachIdHex
            AND statut = :statut
            AND date_heure BETWEEN :startDate AND :endDate
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery([
            'coachIdHex' => $coachIdHex,
            'statut' => StatutSeance::VALIDEE->value,
            'startDate' => $startDate->format('Y-m-d 00:00:00'),
            'endDate' => $endDate->format('Y-m-d 23:59:59')
        ]);

        $result = $resultSet->fetchAssociative();
        $nbSeances = (int)$result['nb_seances'];

        // Calculer le nombre d'heures (1 séance = 1h30)
        $totalHeures = $nbSeances * 1.5;

        // Calculer le montant total en fonction du tarif horaire du coach
        $tarifHoraire = (float)$coach->getTarifHoraire();
        $montantTotal = $totalHeures * $tarifHoraire;

        // Si c'est une période hebdomadaire, diviser le montant par 4
        if ($periode === PeriodePaie::SEMAINE) {
            $montantTotal = $montantTotal / 4;
        }

        return new JsonResponse([
            'total_heures' => $totalHeures,
            'montant_total' => $montantTotal,
            'nb_seances' => $nbSeances,
            'debug' => [
                'coach_id' => $coachId,
                'coach_id_hex' => $coachIdHex,
                'periode' => $periodeValue,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'tarif_horaire' => $tarifHoraire
            ]
        ]);
    }
}
