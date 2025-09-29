document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const participantTypeSelect = document.getElementById('participantType');
    const gameSelectionGroup = document.getElementById('gameSelectionGroup');
    const gameOptionSelect = document.getElementById('gameOption');
    const participantFieldsContainer = document.getElementById('participantFieldsContainer');
    const gameCostInput = document.getElementById('gameCost');

    // ** IMPORTANT: Replace with your actual Google Apps Script Web App URL **
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzFSC1iRq_27d5qjKTUnqKGUl0kE5k8Zb_KwK3sKGm7XKacbin-PBRXM-VvBei3bxdZtw/exec';

    const gameCosts = {
        'solo-chess': 10, 'solo-sprint': 15, 'solo-longjump': 12,
        'dual-badminton': 20, 'dual-tabletennis': 18, 'dual-tennis': 25,
        'team-football': 50, 'team-basketball': 45, 'team-volleyball': 40
    };

    // --- Dynamic Game Options ---
    participantTypeSelect.addEventListener('change', () => {
        const type = participantTypeSelect.value;
        gameOptionSelect.innerHTML = '<option value="">-- Select Game --</option>'; // Clear previous options
        gameSelectionGroup.style.display = 'none';
        participantFieldsContainer.innerHTML = ''; // Clear participant fields

        if (type) {
            gameSelectionGroup.style.display = 'block';
            let options = [];
            let numParticipants = 0;

            if (type === 'solo') {
                options = [
                    { value: 'solo-chess', text: 'Chess' },
                    { value: 'solo-sprint', text: '100m Sprint' },
                    { value: 'solo-longjump', text: 'Long Jump' }
                ];
                numParticipants = 1;
            } else if (type === 'dual') {
                options = [
                    { value: 'dual-badminton', text: 'Badminton Doubles' },
                    { value: 'dual-tabletennis', text: 'Table Tennis Doubles' },
                    { value: 'dual-tennis', text: 'Tennis Doubles' }
                ];
                numParticipants = 2;
            } else if (type === 'team') {
                options = [
                    { value: 'team-football', text: 'Football (5-a-side)' },
                    { value: 'team-basketball', text: 'Basketball (3x3)' },
                    { value: 'team-volleyball', text: 'Volleyball (3-a-side)' }
                ];
                // For teams, you might have a fixed number or let them specify.
                // For simplicity, let's assume specific team sizes for now.
                // Adjust numParticipants or how you collect team members as needed.
                // For this example, let's say a 'team' entry just needs one lead participant's info for now.
                // If you need all team members, you'd need more complex UI/JS.
                numParticipants = 1; // Or adjust based on your team size requirements
            }

            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                gameOptionSelect.appendChild(opt);
            });

            // Generate participant fields based on numParticipants
            generateParticipantFields(numParticipants);
        }
        updateGameCost(); // Update cost when type changes
    });

    // --- Generate Participant Fields ---
    function generateParticipantFields(count) {
        participantFieldsContainer.innerHTML = ''; // Clear existing fields
        for (let i = 1; i <= count; i++) {
            const participantDiv = document.createElement('div');
            participantDiv.classList.add('participant-group');
            participantDiv.innerHTML = `
                <h3>Participant ${i} Details</h3>
                <div class="form-group">
                    <label for="firstName${i}">First Name:</label>
                    <input type="text" id="firstName${i}" name="firstName${i}" required>
                </div>
                <div class="form-group">
                    <label for="lastName${i}">Last Name:</label>
                    <input type="text" id="lastName${i}" name="lastName${i}" required>
                </div>
                <div class="form-group">
                    <label for="cnic${i}">CNIC/ID:</label>
                    <input type="text" id="cnic${i}" name="cnic${i}" required>
                </div>
                <div class="form-group">
                    <label for="dob${i}">Date of Birth:</label>
                    <input type="date" id="dob${i}" name="dob${i}" required>
                </div>
            `;
            participantFieldsContainer.appendChild(participantDiv);
        }
    }

    // --- Update Game Cost ---
    gameOptionSelect.addEventListener('change', updateGameCost);

    function updateGameCost() {
        const selectedGame = gameOptionSelect.value;
        gameCostInput.value = gameCosts[selectedGame] || 0;
    }

    // --- Form Submission Handler (Connect to Google Apps Script) ---
    registrationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Display a loading message or disable the button
        const submitButton = registrationForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;

        const formData = new FormData(registrationForm);
        const data = {};

        // Convert FormData to a plain object
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Special handling for participants to group them (optional but good practice)
        // This structure makes it easier for the Apps Script to parse.
        const participants = [];
        const participantCount = participantFieldsContainer.children.length; // Number of participant groups
        for (let i = 1; i <= participantCount; i++) {
            participants.push({
                firstName: data[`firstName${i}`] || '',
                lastName: data[`lastName${i}`] || '',
                cnic: data[`cnic${i}`] || '',
                dob: data[`dob${i}`] || ''
            });
            // Remove individual participant fields from the main data object
            delete data[`firstName${i}`];
            delete data[`lastName${i}`];
            delete data[`cnic${i}`];
            delete data[`dob${i}`];
        }
        data.participants = participants; // Add the structured participants array

        console.log('Sending data:', data); // For debugging

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'cors', // Crucial for cross-origin requests
                headers: {
                    'Content-Type': 'application/json' // Tell the server we're sending JSON
                },
                body: JSON.stringify(data) // Send your data as a JSON string
            });

            const result = await response.json(); // Parse the JSON response from Apps Script

            if (result.result === 'success') {
                alert('Registration successful! Thank you.');
                registrationForm.reset(); // Clear the form
                // Reset dynamic fields
                participantTypeSelect.dispatchEvent(new Event('change'));
            } else {
                alert('Registration failed: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred during submission. Please try again.');
        } finally {
            submitButton.textContent = 'Submit Registration';
            submitButton.disabled = false;
        }
    });

    // Initial trigger to set up default state if needed
    participantTypeSelect.dispatchEvent(new Event('change'));
});