const socket = io('/treasury-stream');

// Listen for fee collection events in real-time
socket.on('FEE_COLLECTED', (data) => {
    const balanceElement = document.getElementById('treasury-balance');
    const currentBalance = parseFloat(balanceElement.innerText);
    
    // Update the UI without refreshing
    balanceElement.innerText = (currentBalance + data.fee).toFixed(2);
    
    // Optional: Add a flash animation
    triggerFlash(balanceElement);
});
