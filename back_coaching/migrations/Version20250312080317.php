<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250312080317 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE coach (id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', specialites LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', tarif_horaire NUMERIC(10, 2) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE exercice (id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', nom VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, duree_estimee INT NOT NULL, difficulte VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE fiche_de_paie (id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', coach_id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', periode VARCHAR(255) NOT NULL, total_heures DOUBLE PRECISION NOT NULL, montant_total DOUBLE PRECISION NOT NULL, INDEX IDX_B3236E133C105691 (coach_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE seance (id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', coach_id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', date_heure DATETIME NOT NULL, type_seance VARCHAR(255) NOT NULL, theme_seance VARCHAR(255) NOT NULL, statut VARCHAR(255) NOT NULL, niveau_seance VARCHAR(255) NOT NULL, INDEX IDX_DF7DFD0E3C105691 (coach_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE seance_sportif (seance_id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', sportif_id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', INDEX IDX_AFE1A4CE3797A94 (seance_id), INDEX IDX_AFE1A4CFFB7083B (sportif_id), PRIMARY KEY(seance_id, sportif_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE seance_exercice (seance_id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', exercice_id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', INDEX IDX_8A34735E3797A94 (seance_id), INDEX IDX_8A3473589D40298 (exercice_id), PRIMARY KEY(seance_id, exercice_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE sportif (id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', date_inscription DATETIME NOT NULL, niveau_sportif VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE utilisateur (id BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, nom VARCHAR(50) NOT NULL, prenom VARCHAR(50) NOT NULL, type VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE coach ADD CONSTRAINT FK_3F596DCCBF396750 FOREIGN KEY (id) REFERENCES utilisateur (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE fiche_de_paie ADD CONSTRAINT FK_B3236E133C105691 FOREIGN KEY (coach_id) REFERENCES coach (id)');
        $this->addSql('ALTER TABLE seance ADD CONSTRAINT FK_DF7DFD0E3C105691 FOREIGN KEY (coach_id) REFERENCES coach (id)');
        $this->addSql('ALTER TABLE seance_sportif ADD CONSTRAINT FK_AFE1A4CE3797A94 FOREIGN KEY (seance_id) REFERENCES seance (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE seance_sportif ADD CONSTRAINT FK_AFE1A4CFFB7083B FOREIGN KEY (sportif_id) REFERENCES sportif (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE seance_exercice ADD CONSTRAINT FK_8A34735E3797A94 FOREIGN KEY (seance_id) REFERENCES seance (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE seance_exercice ADD CONSTRAINT FK_8A3473589D40298 FOREIGN KEY (exercice_id) REFERENCES exercice (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sportif ADD CONSTRAINT FK_D28C448DBF396750 FOREIGN KEY (id) REFERENCES utilisateur (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE coach DROP FOREIGN KEY FK_3F596DCCBF396750');
        $this->addSql('ALTER TABLE fiche_de_paie DROP FOREIGN KEY FK_B3236E133C105691');
        $this->addSql('ALTER TABLE seance DROP FOREIGN KEY FK_DF7DFD0E3C105691');
        $this->addSql('ALTER TABLE seance_sportif DROP FOREIGN KEY FK_AFE1A4CE3797A94');
        $this->addSql('ALTER TABLE seance_sportif DROP FOREIGN KEY FK_AFE1A4CFFB7083B');
        $this->addSql('ALTER TABLE seance_exercice DROP FOREIGN KEY FK_8A34735E3797A94');
        $this->addSql('ALTER TABLE seance_exercice DROP FOREIGN KEY FK_8A3473589D40298');
        $this->addSql('ALTER TABLE sportif DROP FOREIGN KEY FK_D28C448DBF396750');
        $this->addSql('DROP TABLE coach');
        $this->addSql('DROP TABLE exercice');
        $this->addSql('DROP TABLE fiche_de_paie');
        $this->addSql('DROP TABLE seance');
        $this->addSql('DROP TABLE seance_sportif');
        $this->addSql('DROP TABLE seance_exercice');
        $this->addSql('DROP TABLE sportif');
        $this->addSql('DROP TABLE utilisateur');
    }
}
