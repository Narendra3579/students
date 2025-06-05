document.addEventListener('DOMContentLoaded', () => {
    const myButton = document.getElementById('myButton');
    const messageDisplay = document.getElementById('messageDisplay');
    let clickCount = 0;

    myButton.addEventListener('click', () => {
        clickCount++;
        if (clickCount === 1) {
            messageDisplay.textContent = 'You clicked the button for the first time!';
        } else {
            messageDisplay.textContent = `You've clicked the button ${clickCount} times!`;
        }
        messageDisplay.style.color = '#28a745'; // Green color for feedback
    });
});
