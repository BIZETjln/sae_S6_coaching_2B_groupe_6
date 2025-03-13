<?php

namespace App\Controller\Admin;

use App\Entity\Coach;
use App\Enum\ThemeSeance;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\MoneyField;
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

class CoachCrudController extends AbstractCrudController
{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public static function getEntityFqcn(): string
    {
        return Coach::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Coach')
            ->setEntityLabelInPlural('Coachs')
            ->setPageTitle('index', 'Liste des coachs')
            ->setPageTitle('new', 'Ajouter un coach')
            ->setPageTitle('edit', 'Modifier un coach')
            ->setPageTitle('detail', 'Détails du coach');
    }

    public function configureFields(string $pageName): iterable
    {
        // Récupération des valeurs de l'enum ThemeSeance pour les spécialités
        $specialites = array_combine(
            array_map(fn($case) => $case->value, ThemeSeance::cases()),
            array_map(fn($case) => $case->value, ThemeSeance::cases())
        );

        return [
            FormField::addPanel('Informations personnelles')
                ->setIcon('fa fa-user')
                ->setHelp('Informations de base du coach'),

            TextField::new('nom', 'Nom')
                ->setFormTypeOption('attr', ['placeholder' => 'Nom du coach'])
                ->setColumns(6),

            TextField::new('prenom', 'Prénom')
                ->setFormTypeOption('attr', ['placeholder' => 'Prénom du coach'])
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

            FormField::addPanel('Compétences et tarification')
                ->setIcon('fa fa-dumbbell')
                ->setHelp('Spécialités et tarifs du coach'),

            ChoiceField::new('specialites', 'Spécialités')
                ->setChoices($specialites)
                ->allowMultipleChoices()
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'specialites-container'])
                ->setColumns(12),

            MoneyField::new('tarifHoraire', 'Tarif horaire')
                ->setCurrency('EUR')
                ->setStoredAsCents(false)
                ->setFormTypeOption('attr', ['placeholder' => '0.00'])
                ->setColumns(6),

            AssociationField::new('seances', 'Séances')
                ->onlyOnDetail(),

            AssociationField::new('ficheDePaies', 'Fiches de paie')
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
        $coach = new Coach();
        $coach->setRoles(['ROLE_USER', 'ROLE_COACH']);
        return $coach;
    }
}
