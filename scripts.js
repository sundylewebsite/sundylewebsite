// Get the modal and image elements
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-image');
const closeBtn = document.getElementsByClassName('close')[0];

// Get all images and add click event listeners
const images = document.querySelectorAll('.gallery-item img');
images.forEach(img => {
  img.addEventListener('click', function() {
    modal.style.display = 'block';
    modalImg.src = this.getAttribute('data-large');
  });
});

// Close the modal on close button click
closeBtn.addEventListener('click', function() {
  modal.style.display = 'none';
});

// Close the modal when clicking outside the image
window.addEventListener('click', function(event) {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});
