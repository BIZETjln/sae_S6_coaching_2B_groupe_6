<?php

namespace App\Controller\Admin;

use App\Entity\Exercice;
use App\Enum\Difficulte;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

class ExerciceCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Exercice::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            FormField::addPanel('Informations générales')
                ->setIcon('fa fa-dumbbell')
                ->setHelp('Informations de base de l\'exercice'),
                
            TextField::new('nom', 'Nom de l\'exercice')
                ->setFormTypeOption('attr', ['placeholder' => 'Nom de l\'exercice'])
                ->setRequired(true)
                ->setColumns(12),
                
            TextEditorField::new('description', 'Description')
                ->setFormTypeOption('attr', ['placeholder' => 'Description détaillée de l\'exercice'])
                ->setRequired(true)
                ->setColumns(12),
                
            FormField::addPanel('Caractéristiques')
                ->setIcon('fa fa-cogs')
                ->setHelp('Caractéristiques techniques de l\'exercice'),
                
            IntegerField::new('duree_estimee', 'Durée (en minutes)')
                ->setFormTypeOption('attr', ['placeholder' => 'Durée en minutes'])
                ->setRequired(true)
                ->setColumns(6),
                
            ChoiceField::new('difficulte', 'Niveau de difficulté')
                ->setChoices(Difficulte::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'difficulte-container'])
                ->setRequired(true)
                ->setColumns(6),
        ];
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Exercice')
            ->setEntityLabelInPlural('Exercices')
            ->setPageTitle('index', 'Liste des exercices')
            ->setPageTitle('new', 'Créer un exercice')
            ->setPageTitle('edit', 'Modifier l\'exercice')
            ->setPageTitle('detail', 'Détails de l\'exercice');
    }
}
