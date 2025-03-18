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
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use Symfony\Component\HttpFoundation\File\UploadedFile;

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
        // Récupération dynamique des valeurs de l'enum Niveau
        $niveaux = [];
        foreach (Niveau::cases() as $niveau) {
            // Transformation de 'DEBUTANT' en 'Débutant' pour l'affichage
            $label = ucfirst(strtolower($niveau->name));
            $niveaux[$label] = $niveau;
        }

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
                ->setRequired(true),

            ChoiceField::new('niveauSportif', 'Niveau sportif')
                ->setChoices($niveaux)
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'niveau-container'])
                ->setColumns(6)
                ->setRequired(true),

            AssociationField::new('seances', 'Séances')
                ->onlyOnDetail(),

            ImageField::new('photo', 'Photo')
                ->setBasePath('images/sportifs')
                ->setUploadDir('public/images/sportifs')
                ->setUploadedFileNamePattern('[randomhash].[extension]')
                ->setRequired(false)
                ->setColumns(12),
        ];
    }

    // Surcharge de la méthode persistEntity pour les nouveaux sportifs
    public function createNewFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createNewFormBuilder($entityDto, $formOptions, $context);
        return $formBuilder
            ->addEventListener(FormEvents::POST_SUBMIT, $this->hashPassword())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleImageUpload());
    }

    public function createEditFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createEditFormBuilder($entityDto, $formOptions, $context);
        return $formBuilder
            ->addEventListener(FormEvents::POST_SUBMIT, $this->hashPassword())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleImageUpload());
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

    private function handleImageUpload()
    {
        return function ($event) {
            $form = $event->getForm();
            if (!$form->isValid()) {
                return;
            }

            $sportif = $form->getData();
            if (!$sportif instanceof Sportif) {
                return;
            }

            $uploadedFile = $sportif->getPhoto();

            // Si on a une nouvelle image
            if ($uploadedFile instanceof UploadedFile) {
                // Supprimer l'ancienne photo si elle existe
                $oldPhotoPath = $sportif->getPhoto();
                if ($oldPhotoPath && file_exists('public/' . $oldPhotoPath)) {
                    unlink('public/' . $oldPhotoPath);
                }

                // Upload la nouvelle photo
                $newFilename = uniqid() . '.' . $uploadedFile->guessExtension();
                $uploadedFile->move(
                    'public/images/sportifs',
                    $newFilename
                );
                $sportif->setPhoto('images/sportifs/' . $newFilename);
            }
            // Si la photo a été supprimée (champ vidé)
            elseif ($uploadedFile === null) {
                $oldPhotoPath = $sportif->getPhoto();
                if ($oldPhotoPath && file_exists('public/' . $oldPhotoPath)) {
                    unlink('public/' . $oldPhotoPath);
                    $sportif->setPhoto(null);
                }
            }
        };
    }
}
