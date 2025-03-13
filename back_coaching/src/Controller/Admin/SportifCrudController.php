<?php

namespace App\Controller\Admin;

use App\Entity\Sportif;
use App\Enum\Niveau;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class SportifCrudController extends AbstractCrudController
{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public static function getEntityFqcn(): string
    {
        return Sportif::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Sportif')
            ->setEntityLabelInPlural('Sportifs')
            ->setPageTitle('index', 'Liste des sportifs')
            ->setPageTitle('new', 'Ajouter un sportif')
            ->setPageTitle('edit', 'Modifier un sportif')
            ->setPageTitle('detail', 'Détails du sportif');
    }

    public function configureFields(string $pageName): iterable
    {
        // Récupération des valeurs de l'enum Niveau pour les niveaux sportifs
        $niveaux = [
            'Débutant' => Niveau::DEBUTANT,
            'Intermédiaire' => Niveau::INTERMEDIAIRE,
            'Avancé' => Niveau::AVANCE,
        ];

        return [
            FormField::addPanel('Informations personnelles')
                ->setIcon('fa fa-user')
                ->setHelp('Informations de base du sportif'),
            
            TextField::new('nom', 'Nom')
                ->setFormTypeOption('attr', ['placeholder' => 'Nom du sportif'])
                ->setColumns(6),
            
            TextField::new('prenom', 'Prénom')
                ->setFormTypeOption('attr', ['placeholder' => 'Prénom du sportif'])
                ->setColumns(6),
            
            EmailField::new('email', 'Email')
                ->setFormTypeOption('attr', ['placeholder' => 'email@exemple.com'])
                ->setColumns(12),
            
            TextField::new('password')
                ->setFormType(RepeatedType::class)
                ->setFormTypeOptions([
                    'type' => PasswordType::class,
                    'first_options' => [
                        'label' => 'Mot de passe',
                        'attr' => ['placeholder' => 'Mot de passe'],
                        'row_attr' => ['class' => 'col-md-6'],
                    ],
                    'second_options' => [
                        'label' => 'Confirmation',
                        'attr' => ['placeholder' => 'Confirmer le mot de passe'],
                        'row_attr' => ['class' => 'col-md-6'],
                    ],
                    'mapped' => true,
                    'row_attr' => ['class' => 'row'],
                ])
                ->setRequired($pageName === Crud::PAGE_NEW)
                ->onlyOnForms()
                ->setColumns(12),

            FormField::addPanel('Informations sportives')
                ->setIcon('fa fa-running')
                ->setHelp('Niveau et date d\'inscription du sportif'),
            
            DateTimeField::new('dateInscription', 'Date d\'inscription')
                ->setFormTypeOption('attr', ['placeholder' => 'Date d\'inscription'])
                ->setColumns(6)
                ->setRequired(false),
            
            ChoiceField::new('niveauSportif', 'Niveau sportif')
                ->setChoices($niveaux)
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'niveau-container'])
                ->setColumns(6)
                ->setRequired(true),
            
            AssociationField::new('seances', 'Séances')
                ->onlyOnDetail(),
        ];
    }

    // Surcharge de la méthode persistEntity pour les nouveaux sportifs
    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        $this->hashPassword($entityInstance);
        
        // Définir une valeur par défaut pour le niveau sportif si non défini
        if ($entityInstance instanceof Sportif && $entityInstance->getNiveauSportif() === null) {
            $entityInstance->setNiveauSportif(Niveau::DEBUTANT);
        }
        
        // Définir la date d'inscription à maintenant si non définie
        if ($entityInstance instanceof Sportif && $entityInstance->getDateInscription() === null) {
            $entityInstance->setDateInscription(new \DateTime());
        }
        
        parent::persistEntity($entityManager, $entityInstance);
    }

    // Surcharge de la méthode updateEntity pour les sportifs existants
    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        $this->hashPassword($entityInstance);
        parent::updateEntity($entityManager, $entityInstance);
    }

    // Méthode privée pour hacher le mot de passe
    private function hashPassword($sportif): void
    {
        if (!$sportif instanceof Sportif) {
            return;
        }

        // Ne hache le mot de passe que s'il est défini et non vide
        if ($sportif->getPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword(
                $sportif,
                $sportif->getPassword()
            );
            $sportif->setPassword($hashedPassword);
        }
    }

    // Définir des valeurs par défaut lors de la création d'une nouvelle entité
    public function createEntity(string $entityFqcn)
    {
        $sportif = new Sportif();
        $sportif->setDateInscription(new \DateTime());
        return $sportif;
    }
}
