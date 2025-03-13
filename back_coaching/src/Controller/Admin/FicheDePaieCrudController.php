<?php

namespace App\Controller\Admin;

use App\Entity\FicheDePaie;
use App\Enum\PeriodePaie;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\MoneyField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

class FicheDePaieCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return FicheDePaie::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            FormField::addPanel('Informations générales')
                ->setIcon('fa fa-file-invoice-dollar')
                ->setHelp('Informations de base de la fiche de paie'),
                
            AssociationField::new('coach', 'Coach')
                ->setRequired(true)
                ->setFormTypeOption('attr', ['placeholder' => 'Sélectionnez un coach'])
                ->setColumns(12),
                
            ChoiceField::new('periode', 'Période de paiement')
                ->setChoices(PeriodePaie::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'periode-container'])
                ->setRequired(true)
                ->setColumns(12),
                
            FormField::addPanel('Détails du paiement')
                ->setIcon('fa fa-calculator')
                ->setHelp('Heures travaillées et montant total'),
                
            NumberField::new('total_heures', 'Total des heures')
                ->setFormTypeOption('attr', ['placeholder' => 'Nombre d\'heures travaillées'])
                ->setHelp('Nombre total d\'heures travaillées sur la période')
                ->setNumDecimals(2)
                ->setRequired(true)
                ->setColumns(6),
                
            MoneyField::new('montant_total', 'Montant total')
                ->setCurrency('EUR')
                ->setStoredAsCents(false)
                ->setFormTypeOption('attr', ['placeholder' => '0.00'])
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
}
