document.addEventListener('DOMContentLoaded', function() {
    // Sélecteur de coach
    const coachSelect = document.querySelector('.js-coach-select');
    if (!coachSelect) return;

    // URL pour le calcul
    const calculatorUrl = coachSelect.dataset.calculatorUrl;
    if (!calculatorUrl) return;

    // Champs à mettre à jour
    const totalHeuresField = document.querySelector('.js-total-heures');
    const montantTotalField = document.querySelector('.js-montant-total');
    if (!totalHeuresField || !montantTotalField) return;

    // Sélecteur de période
    const periodeContainer = document.querySelector('.js-periode-select');
    let selectedPeriodeValue = null;
    
    // Fonction pour récupérer la période sélectionnée
    function getSelectedPeriode() {
        if (!periodeContainer) return null;
        const checkedRadio = periodeContainer.querySelector('input[type="radio"]:checked');
        return checkedRadio ? checkedRadio.value : null;
    }

    // Fonction pour récupérer les données du coach
    function fetchCoachData() {
        const coachId = coachSelect.value;
        if (!coachId) {
            clearFields();
            return;
        }

        // Récupérer la période sélectionnée
        const periodeValue = getSelectedPeriode();
        if (!periodeValue) return;

        // Construire l'URL avec les paramètres
        const url = `${calculatorUrl}?coach=${coachId}&periode=${periodeValue}`;
        
        // Effacer les champs pendant le chargement
        totalHeuresField.value = '';
        montantTotalField.value = '';
        
        // Afficher un indicateur de chargement
        totalHeuresField.style.opacity = '0.5';
        montantTotalField.style.opacity = '0.5';
        
        // Effectuer la requête
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau');
                }
                return response.json();
            })
            .then(data => {
                // Mettre à jour les champs
                totalHeuresField.value = data.total_heures;
                montantTotalField.value = data.montant_total;
                
                // Réinitialiser l'affichage
                totalHeuresField.style.opacity = '1';
                montantTotalField.style.opacity = '1';
                
                // Ajouter une animation pour montrer que les valeurs ont été mises à jour
                [totalHeuresField, montantTotalField].forEach(field => {
                    field.style.backgroundColor = '#f0fff0';
                    setTimeout(() => {
                        field.style.backgroundColor = '';
                    }, 1000);
                });
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des données:', error);
                clearFields();
            });
    }
    
    // Fonction pour effacer les champs
    function clearFields() {
        totalHeuresField.value = '';
        montantTotalField.value = '';
        totalHeuresField.style.opacity = '1';
        montantTotalField.style.opacity = '1';
    }
    
    // Événements
    coachSelect.addEventListener('change', fetchCoachData);
    
    // Écouter les changements de période
    if (periodeContainer) {
        const radioButtons = periodeContainer.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', fetchCoachData);
        });
    }
    
    // Initialiser si un coach est déjà sélectionné
    if (coachSelect.value) {
        // Délai court pour permettre aux autres éléments de s'initialiser
        setTimeout(fetchCoachData, 100);
    }
}); 