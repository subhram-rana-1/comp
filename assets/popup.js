// Toggle switch functionality
const toggleSwitch = document.getElementById('extensionToggle');
const catIcon = document.querySelector('.cat-icon');
const title = document.querySelector('.title');
const instructions = document.querySelector('.instructions');
const fingerPoint = document.querySelector('.finger-point');

// Function to update UI based on toggle state
function updateUI(isEnabled) {
  if (isEnabled) {
    // ON state
    catIcon.classList.add('active');
    document.body.classList.add('extension-on');
    instructions.style.display = 'block';
    fingerPoint.style.display = 'none';
    console.log('Extension Enabled');
  } else {
    // OFF state
    catIcon.classList.remove('active');
    document.body.classList.remove('extension-on');
    instructions.style.display = 'none';
    fingerPoint.style.display = 'block';
    console.log('Extension Disabled');
  }
}

// Initialize with OFF state
updateUI(false);

// Listen for toggle changes
toggleSwitch.addEventListener('change', function() {
  updateUI(this.checked);
});

