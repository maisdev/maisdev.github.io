document.addEventListener('DOMContentLoaded', function() {
    const circle = document.querySelector('.circle');
    const links = document.querySelectorAll('a');
    let mouseX = -100;
    let mouseY = -100;
    let circleX = -100;
    let circleY = -100;
    let size = 20;
    let isSquare = false;
    const speed = 1;

    circle.style.opacity = '1';
    updateCursor();
    
    function animate() {
        let distX = mouseX - circleX;
        let distY = mouseY - circleY;
        circleX += distX * speed;
        circleY += distY * speed;
        
        updateCursor();
        
        requestAnimationFrame(animate);
    }

    function updateCursor() {
        circle.style.left = circleX + 'px';
        circle.style.top = circleY + 'px';
        circle.style.width = size + 'px';
        circle.style.height = size + 'px';
        const targetBorderRadius = isSquare ? '0%' : '50%';
        circle.style.borderRadius = targetBorderRadius;
        circle.style.transition = 'all 0.1s ease-out'; 
    }
    
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            size = 30;
            isSquare = true;
        });
        
        link.addEventListener('mouseleave', () => {
            size = 20;
            isSquare = false;
        });
    });
    
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const starsContainer = document.getElementById('stars');
    const starCount = 200;
    
    const starPool = [];
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        starPool.push(star);
    }
    
    const specialEffectsPool = [];
    for (let i = 0; i < 5; i++) {
        const effect = document.createElement('div');
        effect.className = 'special-effect';
        specialEffectsPool.push(effect);
    }
    
    function activateStar(star) {
        const size = 0.5 + Math.random() * 2.5;
        const posX = Math.random() * window.innerWidth;
        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 5;
        const randomX = (Math.random() - 0.5) * 50;
        
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${posX}px`;
        star.style.top = `${window.innerHeight}px`;
        star.style.animation = `float ${duration}s linear ${delay}s forwards`;
        star.style.setProperty('--random-x', `${randomX}px`);
        
        starsContainer.appendChild(star);
        
        setTimeout(() => {
            star.style.animation = 'none';
            if (starsContainer.contains(star)) {
                starsContainer.removeChild(star);
            }
            setTimeout(() => activateStar(star), 100);
        }, (duration + delay) * 1000);
    }
    
    function activateSpecialEffect() {
        const effect = specialEffectsPool.find(e => !starsContainer.contains(e));
        if (!effect) return;
        
        const isComet = Math.random() > 0.5;
        const size = isComet ? 15 + Math.random() * 10 : 5 + Math.random() * 5;
        const duration = 2 + Math.random() * 3;
        const angle = Math.random() * 30 + 15;
        const startX = Math.random() > 0.5 ? 
            -100 : window.innerWidth + 100;
        const startY = -100;
        const endX = startX > 0 ? 
            startX - window.innerWidth * Math.tan(angle * Math.PI/180) : 
            startX + window.innerWidth * Math.tan(angle * Math.PI/180);
        const endY = window.innerHeight + 100;
        
        effect.style.width = `${size}px`;
        effect.style.height = `${size}px`;
        effect.style.left = `${startX}px`;
        effect.style.top = `${startY}px`;
        effect.style.background = isComet ? 
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(200,230,255,0.8) 70%)' : 
            'linear-gradient(90deg, rgba(255,150,50,0.8) 0%, rgba(255,200,100,0.8) 100%)';
        effect.style.borderRadius = isComet ? '0 50% 50% 0' : '50%';
        effect.style.boxShadow = isComet ? 
            '0 0 10px 2px rgba(150, 200, 255, 0.8)' : 
            '0 0 8px 2px rgba(255, 150, 50, 0.8)';
        
        effect.style.transform = `rotate(${angle}deg)`;
        effect.style.animation = `specialFly ${duration}s linear forwards`;
        effect.style.setProperty('--end-x', `${endX}px`);
        effect.style.setProperty('--end-y', `${endY}px`);
        
        starsContainer.appendChild(effect);
        
        setTimeout(() => {
            effect.style.animation = 'none';
            if (starsContainer.contains(effect)) {
                starsContainer.removeChild(effect);
            }
            setTimeout(activateSpecialEffect, Math.random() * 15000 + 5000);
        }, duration * 1000);
    }
    
    starPool.forEach(star => {
        setTimeout(() => activateStar(star), Math.random() * 3000);
    });
    
    setTimeout(() => {
        activateSpecialEffect();
    }, 3000);
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            starPool.forEach(star => {
                if (starsContainer.contains(star)) {
                    starsContainer.removeChild(star);
                    activateStar(star);
                }
            });
            specialEffectsPool.forEach(effect => {
                if (starsContainer.contains(effect)) {
                    starsContainer.removeChild(effect);
                }
            });
        }, 200);
    });
    
    animate();
});
