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
use EasyCorp\Bundle\EasyAdminBundle\Config\KeyValueStore;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Dto\EntityDto;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use EasyCorp\Bundle\EasyAdminBundle\Event\BeforeEntityPersistedEvent;

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

    public static function getSubscribedEvents()
    {
        return [
            BeforeEntityPersistedEvent::class => ['hashPassword'],
        ];
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
                    'mapped' => false,
                    'required' => false,
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
    public function createNewFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createNewFormBuilder($entityDto, $formOptions, $context);
        return $this->addPasswordEventListener($formBuilder);
    }

    public function createEditFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createEditFormBuilder($entityDto, $formOptions, $context);
        return $this->addPasswordEventListener($formBuilder);
    }

    private function addPasswordEventListener(FormBuilderInterface $formBuilder): FormBuilderInterface
    {
        return $formBuilder->addEventListener(FormEvents::POST_SUBMIT, $this->hashPassword());
    }

    private function hashPassword()
    {
        return function ($event) {
            $form = $event->getForm();
            if (!$form->isValid()) {
                return;
            }

            $password = $form->get('password')->getData();
            if ($password === null) {
                return;
            }

            $hash = $this->passwordHasher->hashPassword($event->getData(), $password);
            $form->getData()->setPassword($hash);
        };
    }

    public function createEntity(string $entityFqcn)
    {
        $sportif = new Sportif();
        $sportif->setDateInscription(new \DateTime());
        $sportif->setRoles(['ROLE_USER']);
        return $sportif;
    }
}
