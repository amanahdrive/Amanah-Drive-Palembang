const menu=document.querySelector('.menu');const nav=document.querySelector('.nav nav');
menu?.addEventListener('click',()=>{nav.style.display=nav.style.display==='flex'?'none':'flex';nav.style.position='absolute';nav.style.top='72px';nav.style.left='0';nav.style.right='0';nav.style.padding='20px';nav.style.background='#fff';nav.style.flexDirection='column';nav.style.boxShadow='0 15px 30px rgba(0,0,0,.08)'});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{if(innerWidth<901)nav.style.display='none'}));
