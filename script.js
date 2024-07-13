document.addEventListener('DOMContentLoaded', function() {
    const wrapper = document.querySelector('.wrapper');
    const popupText = document.querySelector('.popup');
    const links = document.querySelector('.links');
    let currentPage = 1;
    let isAnimating = false;

    function updateActivePage(page) {
        if (isAnimating) return;
        isAnimating = true;
        wrapper.className = `wrapper active-page${page}`;
        if (page === 2) {
            setTimeout(() => {
                popupText.style.animation = 'bounceInLeft 1s forwards';
                links.style.animation = 'bounceInRight 1s forwards';
                popupText.style.opacity = '1';
                links.style.opacity = '1';
            }, 1000); // 2 seconds delay before starting the animation
        } else {
            popupText.style.opacity = '0';
            links.style.opacity = '0';
        }
        setTimeout(() => {
            isAnimating = false;
        }, 1000); // duration of transition
    }

    const typewriterText = document.getElementById('typewriter-text');
    const texts = ['data science', 'genius, philanthropist', 'sochi - GMT+3', 'telegram bot developer'];
    let textIndex = 0;
    let charIndex = 0;
    const typingSpeed = 150;
    const deletingSpeed = 50;
    const delayBetweenTexts = 2000;

    function type() {
        if (charIndex < texts[textIndex].length) {
            typewriterText.textContent += texts[textIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingSpeed);
        } else {
            setTimeout(erase, delayBetweenTexts);
        }
    }

    function erase() {
        if (charIndex > 0) {
            typewriterText.textContent = texts[textIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, deletingSpeed);
        } else {
            textIndex = (textIndex + 1) % texts.length;
            setTimeout(type, typingSpeed);
        }
    }

    type();

    // Add touch event for mobile devices
    document.addEventListener('touchstart', function() {
        if (currentPage < 2) {
            currentPage++;
            updateActivePage(currentPage);
        } else if (currentPage > 1) {
            currentPage--;
            updateActivePage(currentPage);
        }
    });

    // Add mouse wheel event for desktop
    document.addEventListener('wheel', function(e) {
        if (e.deltaY > 0 && currentPage < 2) {
            currentPage++;
            updateActivePage(currentPage);
        } else if (e.deltaY < 0 && currentPage > 1) {
            currentPage--;
            updateActivePage(currentPage);
        }
    });
});

console.clear();

const circleElement = document.querySelector('.circle');

const mouse = { x: 0, y: 0 };
const previousMouse = { x: 0, y: 0 }
const circle = { x: 0, y: 0 }; 
let currentScale = 0;
let currentAngle = 0;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

const speed = 0.17;

// Start animation
const tick = () => {
    circle.x += (mouse.x - circle.x) * speed;
    circle.y += (mouse.y - circle.y) * speed;
    const translateTransform = `translate(${circle.x}px, ${circle.y}px)`;
    const deltaMouseX = mouse.x - previousMouse.x;
    const deltaMouseY = mouse.y - previousMouse.y;
    previousMouse.x = mouse.x;
    previousMouse.y = mouse.y;
    const mouseVelocity = Math.min(Math.sqrt(deltaMouseX**2 + deltaMouseY**2) * 4, 200); 
    const scaleValue = (mouseVelocity / 150) * 0.5;
    currentScale += (scaleValue - currentScale) * speed;
    const scaleTransform = `scale(${1 + currentScale}, ${1 - currentScale})`;
    const angle = Math.atan2(deltaMouseY, deltaMouseX) * 180 / Math.PI;
    if (mouseVelocity > 20) {
        currentAngle = angle;
    }
    const rotateTransform = `rotate(${currentAngle}deg)`;
    circleElement.style.transform = `${translateTransform} ${rotateTransform} ${scaleTransform}`;
    window.requestAnimationFrame(tick);
}

tick();
