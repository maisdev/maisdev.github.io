document.addEventListener('DOMContentLoaded', function() {
    const starsContainer = document.createElement('div');
    starsContainer.style.position = 'fixed';
    starsContainer.style.top = '0';
    starsContainer.style.left = '0';
    starsContainer.style.width = '100%';
    starsContainer.style.height = '100%';
    starsContainer.style.pointerEvents = 'none';
    starsContainer.style.zIndex = '-1';
    document.body.appendChild(starsContainer);

    const starCount = 50;
    const starPool = [];
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = `${1 + Math.random() * 2}px`;
        star.style.height = star.style.width;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.opacity = '0';
        starsContainer.appendChild(star);
        starPool.push(star);
    }


    const specialEffectsCount = 3;
    const specialEffectsPool = [];
    for (let i = 0; i < specialEffectsCount; i++) {
        const effect = document.createElement('div');
        effect.className = 'special-effect';
        specialEffectsPool.push(effect);
    }

    function activateStar(star) {
        const duration = 5 + Math.random() * 10;
        star.style.opacity = '0';
        star.style.animation = 'none';
        star.style.transform = 'translateY(0) translateX(0)';
        
        setTimeout(() => {
            star.style.opacity = '0.8';
            star.style.animation = `float ${duration}s linear forwards`;
            star.style.setProperty('--random-x', `${(Math.random() - 0.5) * 100}px`);
            
            setTimeout(() => {
                star.style.animation = 'none';
                star.style.opacity = '0';
                setTimeout(() => activateStar(star), Math.random() * 3000);
            }, duration * 1000);
        }, Math.random() * 2000);
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
});
