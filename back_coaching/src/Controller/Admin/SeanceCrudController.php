<?php

namespace App\Controller\Admin;

use App\Entity\Seance;
use App\Entity\Sportif;
use App\Entity\Participation;
use App\Enum\Niveau;
use App\Enum\StatutSeance;
use App\Enum\ThemeSeance;
use App\Enum\TypeSeance;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use EasyCorp\Bundle\EasyAdminBundle\Dto\EntityDto;
use EasyCorp\Bundle\EasyAdminBundle\Config\KeyValueStore;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CollectionField;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Form\ParticipationType;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

class SeanceCrudController extends AbstractCrudController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public static function getEntityFqcn(): string
    {
        return Seance::class;
    }

    public function configureFields(string $pageName): iterable
    {
        $fields = [
            FormField::addPanel('Informations générales')
                ->setIcon('fa fa-calendar-alt')
                ->setHelp('Informations de base de la séance'),


            DateTimeField::new('date_heure', 'Date et heure')
                ->setFormTypeOptions([
                    'html5' => true,
                    'widget' => 'single_text',
                    'attr' => [
                        'min' => (new \DateTime('now'))->format('Y-m-d\TH:i')
                    ]
                ])
                ->setColumns(12),

            FormField::addPanel('Caractéristiques de la séance')
                ->setIcon('fa fa-list')
                ->setHelp('Type, thème et niveau de la séance'),

            ChoiceField::new('type_seance', 'Type de séance')
                ->setChoices(TypeSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'type-seance-container'])
                ->setColumns(4),

            ChoiceField::new('theme_seance', 'Thème de la séance')
                ->setChoices(ThemeSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'theme-seance-container'])
                ->setColumns(4),

            ChoiceField::new('niveau_seance', 'Niveau de la séance')
                ->setChoices(Niveau::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'niveau-seance-container'])
                ->setColumns(4),

            FormField::addPanel('Participants et contenu')
                ->setIcon('fa fa-users')
                ->setHelp('Coach, sportifs et exercices de la séance'),

            AssociationField::new('coach', 'Coach')
                ->setRequired(true)
                ->setColumns(12),

            // Utilisation d'un champ CollectionField pour les sportifs via participations
            CollectionField::new('participations')
                ->setEntryType(ParticipationType::class)
                ->setFormTypeOptions([
                    'by_reference' => false,
                    'allow_add' => true,
                    'allow_delete' => true,
                    'entry_options' => [
                        'label' => false
                    ]
                ])
                // Supprimer ou commenter cette ligne:
                // ->setTemplatePath('admin/field/participation_collection.html.twig')
                ->setLabel('Sportifs participants')
                ->setHelp('Le nombre maximum de sportifs dépend du type de séance : Solo (1), Duo (2), Trio (3)')
                ->setColumns(12),

            AssociationField::new('exercices', 'Exercices')
                ->setFormTypeOptions([
                    'by_reference' => false,
                    'constraints' => [
                        new \Symfony\Component\Validator\Constraints\Count([
                            'min' => 1,
                            'minMessage' => 'Vous devez sélectionner au moins un exercice',
                        ]),
                    ],
                ])
                ->setColumns(12),

            ImageField::new('photo', 'Photo')
                ->setBasePath('images/seances')
                ->setUploadDir('public/images/seances')
                ->setUploadedFileNamePattern('[randomhash].[extension]')
                ->setRequired(false)
                ->setColumns(12),
        ];

        // Ajouter le champ statut uniquement en mode édition
        if (Crud::PAGE_NEW !== $pageName) {
            $fields[] = ChoiceField::new('statut', 'Statut de la séance')
                ->setChoices(StatutSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'statut-seance-container'])
                ->setColumns(12);
        } else {
            // En mode création, on ajoute un champ caché avec la valeur par défaut
            $fields[] = ChoiceField::new('statut')
                ->setFormTypeOption('data', StatutSeance::PREVUE)
                ->hideOnForm();
        }

        return $fields;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Séance')
            ->setEntityLabelInPlural('Séances')
            ->setPageTitle('index', 'Liste des séances')
            ->setPageTitle('new', 'Créer une séance')
            ->setPageTitle('edit', 'Modifier la séance')
            ->setPageTitle('detail', 'Détails de la séance');
    }

    public function createEntity(string $entityFqcn)
    {
        $seance = new Seance();
        $seance->setStatut(StatutSeance::PREVUE);

        return $seance;
    }

    public function createNewFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createNewFormBuilder($entityDto, $formOptions, $context);
        return $formBuilder
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleImageUpload())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleSportifs());
    }

    public function createEditFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createEditFormBuilder($entityDto, $formOptions, $context);
        return $formBuilder
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleImageUpload())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleSportifs());
    }

    private function handleImageUpload()
    {
        return function ($event) {
            $form = $event->getForm();
            if (!$form->isValid()) {
                return;
            }

            $seance = $form->getData();
            if (!$seance instanceof Seance) {
                return;
            }

            $uploadedFile = $seance->getPhoto();

            // Si on a une nouvelle image
            if ($uploadedFile instanceof UploadedFile) {
                // Supprimer l'ancienne photo si elle existe
                $oldPhotoPath = $seance->getPhoto();
                if ($oldPhotoPath && file_exists('public/' . $oldPhotoPath)) {
                    unlink('public/' . $oldPhotoPath);
                }

                // Upload la nouvelle photo
                $newFilename = uniqid() . '.' . $uploadedFile->guessExtension();
                $uploadedFile->move(
                    'public/images/seances',
                    $newFilename
                );
                $seance->setPhoto('images/seances/' . $newFilename);
            }
            // Si la photo a été supprimée (champ vidé)
            elseif ($uploadedFile === null) {
                $oldPhotoPath = $seance->getPhoto();
                if ($oldPhotoPath && file_exists('public/' . $oldPhotoPath)) {
                    unlink('public/' . $oldPhotoPath);
                    $seance->setPhoto(null);
                }
            }
        };
    }

    private function handleSportifs()
    {
        return function (FormEvent $event) {
            $form = $event->getForm();
            if (!$form->isValid()) {
                return;
            }

            $seance = $form->getData();
            if (!$seance instanceof Seance) {
                return;
            }

            // Vérification du nombre de sportifs selon le type de séance
            $typeSeance = $seance->getTypeSeance();
            $maxSportifs = match ($typeSeance) {
                TypeSeance::SOLO => 1,
                TypeSeance::DUO => 2,
                TypeSeance::TRIO => 3,
                default => 3
            };

            $sportifs = $seance->getSportifs();
            if (count($sportifs) > $maxSportifs) {
                $form->addError(new \Symfony\Component\Form\FormError(
                    sprintf(
                        'Une séance %s ne peut avoir que %d sportif(s) maximum',
                        $typeSeance->value,
                        $maxSportifs
                    )
                ));
            }
        };
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        try {
            parent::persistEntity($entityManager, $entityInstance);

            // Mise à jour des informations sur les participations après sauvegarde
            if (method_exists($entityInstance, 'getParticipations')) {
                foreach ($entityInstance->getParticipations() as $participation) {
                    $entityManager->persist($participation);
                }
                $entityManager->flush();
            }
        } catch (\LogicException $e) {
            // Ajouter un flash message pour afficher l'erreur
            $this->addFlash('danger', $e->getMessage());

            // Ne pas propager l'exception pour permettre à l'utilisateur de corriger l'erreur
            // La transaction sera automatiquement annulée par Doctrine
        }
    }

    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        try {
            // Récupérer les participations existantes avant modification
            $originalParticipations = new ArrayCollection();
            foreach ($entityManager->getRepository(Participation::class)->findBy(['seance' => $entityInstance]) as $participation) {
                $originalParticipations->add($participation);
            }

            // Mettre à jour l'entité de base
            parent::updateEntity($entityManager, $entityInstance);

            // Gérer les participations
            if (method_exists($entityInstance, 'getParticipations')) {
                // 1. Supprimer les participations qui ne sont plus présentes
                foreach ($originalParticipations as $originalParticipation) {
                    $found = false;
                    foreach ($entityInstance->getParticipations() as $currentParticipation) {
                        if ($currentParticipation->getId() === $originalParticipation->getId()) {
                            $found = true;
                            break;
                        }
                    }

                    if (!$found) {
                        $entityManager->remove($originalParticipation);
                    }
                }

                // 2. Ajouter/mettre à jour les participations courantes
                foreach ($entityInstance->getParticipations() as $participation) {
                    // S'assurer que la séance est correctement définie
                    if ($participation->getSeance() === null) {
                        $participation->setSeance($entityInstance);
                    }

                    // Persister la participation
                    $entityManager->persist($participation);
                }

                // Appliquer les changements
                $entityManager->flush();
            }
        } catch (\LogicException $e) {
            // Ajouter un flash message pour afficher l'erreur
            $this->addFlash('danger', $e->getMessage());

            // Ne pas propager l'exception pour permettre à l'utilisateur de corriger l'erreur
            // La transaction sera automatiquement annulée par Doctrine
        }
    }
}
